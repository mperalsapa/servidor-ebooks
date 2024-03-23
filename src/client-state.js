import fs from 'fs';
import path from 'path';

// This class is used to store and retrieve the state of the last chapter readed by a client.
export class clientStateStorage {
    clients = [];
    // Constructor of the class, receives a file path to determine where to store the state of the clients.
    constructor(filePath) {
        if (!filePath) {
            this.filePath = 'client-state.json';
        } else {
            this.filePath = filePath + '/client-state.json';
        }
        this.clients = this.readFile();
    }

    // This function stores the state of a client, the book and the chapter that the client has read.
    saveClientBookState(clientId, book, chapter) {
        let clientIndex = this.clients.findIndex((c) => c.id === clientId);
        if (clientIndex === -1) {
            let client = {
                id: clientId,
                books: [],
            };
            clientIndex = this.clients.push(client) - 1;
            console.log(client)
            console.log(this.clients)
        }

        if (!this.clients[clientIndex].books) {
            this.clients[clientIndex].books = [];
        }

        let bookIndex = this.clients[clientIndex].books.findIndex((b) => b.name === book);
        if (bookIndex === -1) {
            let newBook = {
                name: book,
                chapter: chapter,
            };
            bookIndex = this.clients[clientIndex].books.push(newBook) - 1;
        }

        console.log(`Storing book ${book} with chapter ${chapter} for client ${clientId}`)
        this.clients[clientIndex].books[bookIndex].chapter = chapter;
        this.saveToFile(this.clients);
    }

    // This function retrieves the last chapter readed by a client.
    getSavedChapter(clientId, book) {
        const clientIndex = this.clients.findIndex((c) => c.id === clientId);
        if (clientIndex === -1) {
            console.log("GetSavedChapter: Client not found")
            return 1;
        }

        if (!this.clients[clientIndex].books) {
            console.log("GetSavedChapter: Books not found")
            return 1;
        }

        const bookId = this.clients[clientIndex].books.findIndex((b) => b.name === book);
        if (!this.clients[clientIndex].books[bookId]) {
            console.log("GetSavedChapter: Book not found")
            return 1;
        }

        return this.clients[clientIndex].books[bookId].chapter;
    }

    // This function stores the whole state of clients into a file.
    // This file is a JSON file that contains the state of all clients.
    saveToFile(clients) {
        const file = path.resolve(this.filePath);
        console.log("Saving file into: " + file)
        fs.writeFileSync(file, JSON.stringify(clients), 'utf8');
    }

    // This function reads the state of clients from a file.
    readFile() {
        if (!fs.existsSync(this.filePath)) {
            return [];
        } else {
            const data = fs.readFileSync(this.filePath, 'utf8');
            const parsedData = JSON.parse(data);
            if (!Array.isArray(parsedData)) {
                return [];
            }
            return parsedData;
        }
    }
}

