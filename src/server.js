import { GDriveClient } from "./gdrive.js";

const gdrive = new GDriveClient();
try {
    const files = await gdrive.getAllChildren();
    console.log(files); // Or do whatever you want with the files
} catch (error) {
    console.error('Error fetching files:', error);
}