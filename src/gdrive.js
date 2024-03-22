import fs from 'node:fs';
import { google } from 'googleapis';
import path from 'node:path';
import admZip from 'adm-zip';
import * as EPUB from './epub.js';

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

    createDriveClient(credentials) {
        if (!credentials) {
            console.error("Credentials file not found. You need to specify a credentials file path.");
            return false;
        }

        const scopes = ["https://www.googleapis.com/auth/drive"];
        const auth = new google.auth.GoogleAuth({ keyFile: credentials, scopes: scopes });
        return google.drive({ version: "v3", auth });
    }

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
                console.log("Done.");
                this.downloadCallback(fileId, epubPath, ebookPath, httpResponse, chapter);
            })
            .on("error", (err) => {
                console.log(err);
                // process.exit();
            })
            .pipe(dest);
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