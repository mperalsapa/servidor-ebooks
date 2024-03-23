import { GDriveClient } from "./gdrive.js";
import express from "express";
import path from 'path';
import { fileURLToPath } from 'url';
import multer from "multer";
import * as EPUB from "./epub.js";
import fs from 'fs';
import admZip from 'adm-zip';
import * as CS from './client-state.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// set root to public folder
const publicRoot = __dirname + "/public";

// get previous directory to current one 
const projectPath = path.resolve(__dirname, '..');

// create ebooks folder if it doesn't exist
const ebooksPath = path.resolve(projectPath, 'ebooks');
if (!fs.existsSync(ebooksPath)) fs.mkdirSync(ebooksPath);
// set temp route
const tempPath = path.resolve(projectPath, 'temp');
if (!fs.existsSync(tempPath)) fs.mkdirSync(tempPath);

// setup static files
app.use("/assets", express.static(path.resolve(publicRoot, "assets")));
// setup static books
app.use("/ebooks", express.static(ebooksPath));

// setup gdrive
const gdrive = new GDriveClient(path.resolve(projectPath, './credentials.json'));

// Setup client state storage
const clientState = new CS.clientStateStorage();

// Configurar Multer per administrar la carrega de fitxers
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'temp/'); // defineix el directori on s'emmagatzemaran els fitxers temporals
    },
    filename: function (req, file, cb) { // defineix el nom del fitxer
        cb(null, file.originalname.replace(/ /g, "_"));
    }
});

// Funcio per filtrar els fitxers per tipus MIME
const fileFilter = function (req, file, cb) {
    if (file.mimetype === 'application/epub+zip' || file.mimetype === 'application/octet-stream') {
        cb(null, true); // Acceptar el fitxer nomes si es de tipus epub
    } else {
        cb(new Error('El archivo debe ser de tipo epub'), false); // Rebutjar si no es de tipus epub
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

// setup express routes -------------------------------------------

app.get("/", (req, res) => {

    res.sendFile("index.html", { root: publicRoot });
});

app.get("/llibres", (req, res) => {
    res.sendFile("client.html", { root: publicRoot });
});

// Metode per obtenir la llista de llibres disponibles
app.get("/books", (req, res) => {
    const books = gdrive.getAllChildren();

    books.then((books) => {
        res.json(books);
    });
});

app.get("/administrador", (req, res) => {

    res.sendFile("administrador.html", { root: publicRoot });
});

// Metode per pujar un llibre a Google Drive
// disponible per a l'administrador
app.post('/uploadBook', upload.single('book'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).send('No se ha seleccionado ningún archivo');
    }
    try {
        let fileObject = {
            name: req.file.filename,
            path: req.file.path,
            mimeType: req.file.mimetype,
            path: req.file.path,
        }
        let uploaded = await gdrive.uploadFile(fileObject);
        fs.unlink(req.file.path, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
                return;
            }
            console.log('File deleted');
        });
    } catch (error) {
        console.error('Error fetching files:', error);
    }

    res.json({ ok: true });
});

// Metode per eliminar un arxiu de Google Drive
// disponible per a l'administrador
app.delete('/eliminarArxiu/:fileId', async (req, res) => {
    const fileId = req.params.fileId;
    await gdrive.deleteFile(fileId);

    res.json({ ok: true });

});

// Metode encarregat de llegir un capitol d'un llibre.
// En cas de no tenir el llibre descarregat, el descarrega de Google Drive
// el descomprimeix i llegeix el capitol demanat per retornar-lo al client.
app.get("/llibre/:fileId/:chapter", async (req, res) => {

    let chapter = req.params.chapter;
    const userName = req.query.un;
    const continueReading = req.query.continue || false;
    console.log("Usuari: ", userName, "Continuar: ", continueReading)
    // comprovem si l'usuari vol continuar llegint
    if (continueReading) {
        chapter = clientState.getSavedChapter(userName, req.params.fileId);
        console.log("Continuant lectura a capítol: ", chapter)
    } else { // si no vol continuar llegint, guardem l'estat d'aquesta peticio
        if (!userName || userName !== 'anonymous') {
            try {
                clientState.saveClientBookState(userName, req.params.fileId, req.params.chapter);
            } catch (error) {
                console.error('Error saving client book state:', error);
            }
        }
    }

    // obtenim el path del llibre
    const fileId = req.params.fileId;
    const ebookPath = path.resolve(ebooksPath, fileId);

    // comprovem si el llibre existeix en el sistema de fitxers local
    if (!fs.existsSync(ebookPath)) {
        // si no existeix, el descarreguem de Google Drive
        // const book = await gdrive.downloadFile(fileId);
        // gdrive.downloadFile(fileId, 'temp/downloads', book.name);
        // unzip en public/assets
        console.log("Llibre no existeix, instalant...")
        try {
            // esperem la promesa de descarrega del fitxer
            try {
                await gdrive.downloadFile(fileId, tempPath, ebooksPath, res, chapter);
            } catch (error) {
                console.error('Error downloading book:', error);
                return res.status(500).send('Error downloading book');
            }

            let epubPath = path.resolve(tempPath, fileId);
            if (!fs.existsSync(epubPath)) throw new Error('File not found');
            const zip = new admZip(epubPath);
            zip.extractAllTo(ebookPath, true);
            console.log('Llibre descomprimit');
            // esborrem el fitxer zip
            fs.unlink(epubPath, (err) => {
                if (err) {
                    console.error('Error deleting file:', err);
                    return;
                }
                console.log('File deleted');
            });
        } catch (error) {
            console.error('Error unzipping book:', error);
            return res.status(500).send('Error al descomprimir');
        }
    }

    console.log("Llibre instal·lat")
    console.log("Llegint capítol: ", ebookPath, chapter)

    const chapterData = await EPUB.readChapter(ebookPath, chapter);
    const chapterPath = path.join(fileId, chapterData.chapterPath);
    return res.json({ bookId: fileId, chapterPath: chapterPath, chapter: chapterData.chapterId, chapters: chapterData.chapters });
})

app.listen(3000, () => {
    console.log("Server started on http://localhost:3000");
});