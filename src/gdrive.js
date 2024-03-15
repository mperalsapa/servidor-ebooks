import fs from 'node:fs';
import { google } from 'googleapis';

export class GDriveClient {
    TOKEN_PATH = 'config/secrets/token.json';

    client;

    constructor(TOKEN_PATH = null) {
        if (TOKEN_PATH) {
            this.TOKEN_PATH = TOKEN_PATH;
        }
        let token = this.getToken();
        this.client = this.createDriveClient(token);
    }

    getToken() {
        if (!fs.existsSync(this.TOKEN_PATH)) {
            console.error('Token file not found, run "node src/setup_gdrive.js" to create it. Remember to locate your cwd to the config folder.');
            return false;
        }

        const content = fs.readFileSync(this.TOKEN_PATH);
        return JSON.parse(content)
    }

    createDriveClient(token) {
        if (!token) {
            console.error('Error parsing token file: ', err);
            return false;
        }

        if (!token.client_id || !token.client_secret || !token.redirect_uris[0] || !token.refresh_token) {
            console.error('Token file is missing required fields. Run "node src/setup_gdrive.js" to create a new token file.');
            return false;
        }

        this.client = google.auth.fromJSON(token);
        // this.client = new google.auth.OAuth2(token.client_id, token.client_secret, token.redirect_uris[0]);
        // this.client.setCredentials({ refresh_token: token.refresh_token });

        return google.drive({ version: 'v3', auth: this.client });
    }

    async getAllChildren() {
        if (!this.client) {
            console.error('Error client not found');
            return;
        }
        const res = await this.client.files.list({
            pageSize: 10,
            fields: 'nextPageToken, files(id, name)',
        });

        const files = res.data.files;
        if (files.length === 0) {
            console.error('No files found.');
            return;
        }

        console.log('Files:');
        files.map((file) => {
            console.log(`${file.name} (${file.id})`);
        });

        return files;
    }




}