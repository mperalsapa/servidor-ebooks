import { GDriveClient } from "./gdrive.js";
import express from "express";
import path from 'path';
import { fileURLToPath } from 'url';
import multer from "multer";
import JSZip from "jszip";
import * as EPUB from "./epub.js";
import fs from 'fs';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ebooksPath = path.resolve(__dirname, '../ebooks');

// create ebooks folder if it doesn't exist
if (!fs.existsSync(ebooksPath)) fs.mkdirSync(ebooksPath);
// set root to public folder
const publicRoot = __dirname + "/public";

// get previous directory to current one 
const projectPath = path.resolve(__dirname, '..');

// setup static files
app.use("/assets", express.static(path.resolve(publicRoot, "assets")));
// setup static books
app.use("/ebooks", express.static(ebooksPath));

// setup gdrive
const gdrive = new GDriveClient(path.resolve(projectPath, './credentials.json'));

// Configurar Multer para manejar la carga de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'temp/'); // Define el directorio donde se almacenarán los archivos
    },
    filename: function (req, file, cb) { // Define el nombre del archivo. Respetando el nombre original reemplazando espacios por guiones bajos
        cb(null, file.originalname.replace(/ /g, "_"));
    }
});
// Función para filtrar los archivos por tipo MIME
const fileFilter = function (req, file, cb) {
    if (file.mimetype === 'application/epub+zip' || file.mimetype === 'application/octet-stream') {
        cb(null, true); // Aceptar el archivo si es un archivo epub
    } else {
        cb(new Error('El archivo debe ser de tipo epub'), false); // Rechazar el archivo si no es un archivo epub
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

// configuracio de JSZIP

const zip = new JSZip();

// setup express routes -------------------------------------------

app.get("/", (req, res) => {
    // read index.html inside public
    res.sendFile("index.html", { root: publicRoot });
});

app.get("/llibres", (req, res) => {

    res.sendFile("client.html", { root: publicRoot });
});

app.get("/books", (req, res) => {
    const books = gdrive.getAllChildren();

    books.then((books) => {
        res.json(books);
    });
});

app.get("/administrador", (req, res) => {
    // read index.html inside public
    res.sendFile("administrador.html", { root: publicRoot });
});

app.post('/uploadBook', upload.single('book'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).send('No se ha seleccionado ningún archivo');
    }
    try {
        // await gdrive.getAllChildren();
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


app.delete('/eliminarArxiu/:fileId', async (req, res) => {
    const fileId = req.params.fileId;
    await gdrive.deleteFile(fileId);

    res.json({ ok: true });

});

app.get("/llibre/:fileId/:chapter", async (req, res) => {
    const fileId = req.params.fileId;
    const chapter = req.params.chapter;
    const ebookPath = path.resolve(ebooksPath, fileId);
    // const unzippedPath = path.join(ebookPath, 'unzipped');

    /*
    try{
      const epubData = fs.readFileSync(path.resolve('../ebooks', fileId + '.epub')); 
      await zip.loadAsync(epubData);
      const unzippedPath = ebooksPath; 
      await zip.extractAllToAsync(unzippedPath, { createFolders: true });
      console.log('Book unzipped successfully');
    } catch (error) {
        console.error('Error unzipping book:', error);
        return res.status(500).send('Error processing book');
    }

    
    const chapterData = await EPUB.readChapter(ebookPath, chapter);
    const chapterPath = path.join(fileId, chapterData.chapterPath);
    return res.json({ bookId: fileId, chapterPath: chapterPath, chapter: chapterData.chapterId, chapters: chapterData.chapters });

    */


    // comprovem si el llibre existeix en el sistema de fitxers local
    if (!fs.existsSync(ebookPath)) {
        // si no existeix, el descarreguem de Google Drive
        // const book = await gdrive.downloadFile(fileId);
        // gdrive.downloadFile(fileId, 'temp/downloads', book.name);
        // unzip en public/assets
        console.log("Llibre no existeix, instalant...")
        // return res.send("Book doesn't exist, downloading...");

        try {
            //drive epub
            const book = await gdrive.downloadFile(fileId);
            console.log(book);
            const epubPath = path.join(ebookPath, book.name);
            await gdrive.downloadFile(fileId, ebookPath, book.name);

            //descomprimir
            const epubData = fs.readFileSync(epubPath);
            const zip = new JSZip();
            await zip.loadAsync(epubData);
            await zip.extractAllToAsync(unzippedPath, { createFolders: true });
            console.log('Llibre descomprimit');
        } catch (error) {
            console.error('Error unzipping book:', error);
            return res.status(500).send('Error al descomprimir');
        }
    }



    const chapterData = await EPUB.readChapter(ebookPath, chapter);
    const chapterPath = path.join(fileId, chapterData.chapterPath);
    return res.json({ bookId: fileId, chapterPath: chapterPath, chapter: chapterData.chapterId, chapters: chapterData.chapters });



})

// await gdrive.deleteFile("1-VBhFFDesCQNiOxvrlIE9VbggZjP4LB4");
// await gdrive.deleteFile("1wBkvElVkSwzk3zrKCgQym187FHKQIlRT");
// console.log(await gdrive.getAllChildren());

app.listen(3000, () => {
    console.log("Server started on http://localhost:3000");
});