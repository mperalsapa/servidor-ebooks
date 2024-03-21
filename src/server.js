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

})

app.get("/llibre/:fileId", async (req, res) => {
    const fileId = req.params.fileId;

});


app.listen(3000, () => {
    console.log("Server started on http://localhost:3000");
});