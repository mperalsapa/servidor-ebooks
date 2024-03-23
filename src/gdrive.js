import fs from 'node:fs';
import { google } from 'googleapis';
import path from 'node:path';
import admZip from 'adm-zip';
import * as EPUB from './epub.js';

// Classe encarregada de gestionar la connexió amb Google Drive
// i de proporcionar els mètodes necessaris per interactuar amb els fitxers.
export class GDriveClient {
    CREDENTIALS_PATH = 'config/secrets/token.json';

    client;
    clientDirId = "root";

    constructor(CREDENTIALS_PATH = null, CLIENT_DIR_ID = "root") {
        if (CREDENTIALS_PATH) {
            this.CREDENTIALS_PATH = CREDENTIALS_PATH;
        }

        if (CLIENT_DIR_ID) {
            this.clientDirId = CLIENT_DIR_ID;
        }

        this.client = this.createDriveClient(this.CREDENTIALS_PATH);
        this.findDirId();
    }

    async findDirId() {

        if (!this.client) {
            console.error('GDRIVE - Searching parent folder: Error client not found');
            return;
        }
        let query = { pageSize: 10, fields: 'nextPageToken, files(id, name)' };
        const res = await this.client.files.list(query);
        const files = res.data.files;
        if (files.length === 0) {
            console.error('GDRIVE - Searching parent folder: No files found.');
            this.clientDirId = "root";
            this.findDirId();
            return;
        }
        files.map((file) => {
            if (file.name === this.defaultClientDirName) {
                console.log('GDRIVE - Searching parent folder: Found directory id = ', file.id)
                this.clientDirId = file.id;
            }
        });
        if (!this.clientDirId) {
            console.error('GDRIVE - Searching parent folder: No directory found.');
            return;
        }
    }

    // Funció per crear un client de Google Drive
    createDriveClient(credentials) {
        if (!credentials) {
            console.error("Credentials file not found. You need to specify a credentials file path.");
            return false;
        }

        const scopes = ["https://www.googleapis.com/auth/drive"];
        const auth = new google.auth.GoogleAuth({ keyFile: credentials, scopes: scopes });
        return google.drive({ version: "v3", auth });
    }

    // Funció per obtenir la llista de fitxers d'un directori
    async getAllChildren(folderId = this.clientDirId) {
        if (!this.client) {
            console.error('Error client not found');
            return;
        }
        let query = { pageSize: 10, fields: 'nextPageToken, files(id, name)' };
        if (this.clientDirId) {
            query.q = `'${this.clientDirId}' in parents`;
        }
        const res = await this.client.files.list(query);

        const files = res.data.files;
        return files;
    }

    // Funció per crear un directori
    async createDir(folderName, parentId = this.clientDirId) {
        if (!this.client) {
            console.error('Error client not found');
            return;
        }
        if (!folderName) {
            console.error('Error name not specified');
            return;
        }
        await this.client.files.create({
            requestBody: {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [parentId],
            },
        });

    }

    // Funció per pujar un fitxer a Google Drive
    async uploadFile(file) {
        if (!this.client) {
            console.error('Error client not found');
            return;
        }

        const response = await this.client.files.create({
            requestBody: {
                name: file.name,
                mimeType: file.mimeType,
                parents: [this.clientDirId],
            },
            media: {
                mimeType: file.mimeType,
                body: fs.createReadStream(file.path),
            },
        });

        return response.data;
    }

    // Funció per eliminar un fitxer de Google Drive
    async deleteFile(fileId) {
        if (!this.client) {
            console.error('Error client not found');
            return;
        }
        if (!fileId) {
            console.error('Error fileId not specified');
            return;
        }
        return await this.client.files.delete({

            fileId: fileId,
        });
    }

    // Funció per descarregar un fitxer de Google Drive
    async downloadFile(fileId, downloadPath, ebooksPath, httpResponse = null, chapter = 0) {
        if (!this.client) {
            console.error('Error client not found');
            return;
        }
        if (!fileId) {
            console.error('Error fileId not specified');
            return;
        }
        if (!downloadPath) {
            console.error('Error route not specified');
            return;
        }
        if (!ebooksPath) {
            console.error('Error route not specified');
            return;
        }

        console.log(`Downloading file to: ${downloadPath}/${fileId}`);
        let epubPath = path.resolve(downloadPath, fileId);
        let ebookPath = path.resolve(ebooksPath, fileId);
        const dest = fs.createWriteStream(epubPath);
        const response = await this.client.files.get(
            { fileId: fileId, alt: "media" },
            { responseType: "stream" }
        );

        response.data
            .on("end", () => {
                console.log("Done downloading.");
            })
            .on("error", (err) => {
                console.log(err);
            })
            .pipe(dest);

        return new Promise((resolve, reject) => {
            dest.on('finish', () => {
                resolve();
            });
            dest.on('error', (err) => {
                reject(err);
            });
        });
    }

    async downloadCallback(fileId, epubPath, ebookPath, httpResponse, chapter = 0) {
        if (!fs.existsSync(epubPath)) throw new Error('File not found');
        const zip = new admZip(epubPath);
        zip.extractAllTo(ebookPath, true);

        const chapterData = await EPUB.readChapter(ebookPath, chapter);
        const chapterPath = path.join(fileId, chapterData.chapterPath);
        return httpResponse.json({ bookId: fileId, chapterPath: chapterPath, chapter: chapterData.chapterId, chapters: chapterData.chapters });
    }
}