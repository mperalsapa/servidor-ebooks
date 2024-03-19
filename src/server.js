import { GDriveClient } from "./gdrive.js";
import express from "express";
import path from 'path';
import { fileURLToPath } from 'url';
import multer from "multer";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// set root to public folder
const publicRoot = __dirname + "/public";
// gdrive
const gdrive = new GDriveClient();


// Configurar Multer para manejar la carga de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'temp/'); // Define el directorio donde se almacenarán los archivos
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Define el nombre del archivo
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

app.get("/", (req, res) => {
    // read index.html inside public
    res.sendFile("index.html", { root: publicRoot });
});

app.get("/books", (req, res) => {
    // read index.html inside public
    const books = ["Cien años de soledad, de Gabriel García Márquez.  469 puntos",
        "El señor de los anillos (Trilogía), de J. R. R. Tolkien.  389 puntos",
        "1984, de George Orwell.  382  puntos",
        "Un mundo feliz, de Aldous Huxley.  374  puntos",
        "Orgullo y prejuicio, de Jane Austen.  341  puntos",
        "Crimen y castigo, de Fiódor Dostoyevski.  324  puntos",
        "Lolita, de Vladimir Nabokov.  318  puntos",
        "Ulises, de James Joyce.  311  puntos",
        "Madame Bovary, de Gustave Flaubert.  310  puntos",
        "En busca del tiempo perdido, de Marcel Proust.  304  puntos"]

    res.json(books);
});

app.get("/temp-admin", (req, res) => {
    // read index.html inside public
    res.sendFile("temp-admin.html", { root: publicRoot });
});

app.post('/uploadBook', upload.single('book'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).send('No se ha seleccionado ningún archivo');
    }
    try {
        await gdrive.getAllChildren();
        let fileObject = {
            name: req.file.filename,
            path: req.file.path,
            mimeType: req.file.mimetype,
            path: req.file.path,
        }
        await gdrive.uploadFile(fileObject);

        console.log(files); // Or do whatever you want with the files
    } catch (error) {
        console.error('Error fetching files:', error);
        // stop the server
        process.exit(1);
    }
    res.send('Archivo subido exitosamente');
});

console.log(publicRoot)
app.listen(3000, () => {
    console.log("Server started on http://localhost:3000");
});