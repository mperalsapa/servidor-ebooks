import fs from 'node:fs';
import { google } from 'googleapis';



export class GDriveClient {
    CREDENTIALS_PATH = 'config/secrets/token.json';

    client;
    clientDirId = "root";
    defaultClientDirName = "ebooks";

    constructor(CREDENTIALS_PATH = null, CLIENT_DIR_ID = null) {
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
            this.createDir(this.defaultClientDirName);
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
        console.log(auth)
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

    async createDir(folderName) {
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
                parents: [this.clientDirId],
            },
        });

    }

    async uploadFile(file) {
        if (!this.client) {
            console.error('Error client not found');
            return;
        }

        await this.client.files.create({
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
        await this.client.files.delete({
            fileId: fileId,
        });
    }
}