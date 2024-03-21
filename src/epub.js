import { DOMParser } from 'xmldom';
import fs from 'fs';
import path from 'path';

export async function readChapter(ebookPath, chapter = 0) {
    if (!chapter || chapter == 0) {
        chapter = 1;
    }



    // llegim les dades necessaries per a mostrar el llibre
    // primer llegim el fitxer de metadades del llibre
    // id/META-INF/container.xml
    let containerXml = fs.readFileSync(path.resolve(ebookPath, `META-INF/container.xml`));
    if (!containerXml) {
        console.error('Error reading container.xml');
        return;
    }

    // ara que tenim el fitxer container, llegim el fitxer com a string
    containerXml = containerXml.toString();
    const doc = new DOMParser().parseFromString(containerXml, 'text/xml');
    if (!doc) {
        console.error('Error reading container.xml');
        return;
    }
    const indexFilePath = doc.getElementsByTagName("rootfile")[0].getAttribute('full-path');

    // ara que tenim el fitxer root, el llegim per obtenir els capitols dintre del node <spine>
    let rootFile = fs.readFileSync(path.resolve(ebookPath, `${indexFilePath}`));
    if (!rootFile) {
        console.error('Error reading root file');
        return;
    }
    rootFile = rootFile.toString();
    const rootDoc = new DOMParser().parseFromString(rootFile, 'text/xml');
    const chapters = rootDoc.getElementsByTagName('itemref');

    // ara que ja savem quants capitol hi ha, ens assegurem que el capitol sigui un valor vàlid
    chapter = Math.min(chapters.length, Math.max(1, chapter));

    // agafem les dades del capitol
    const chapterId = chapters[chapter - 1].getAttribute('idref');
    const chapterPath = rootDoc.getElementById(chapterId).getAttribute('href');

    // comprovem si l'ebook conté "OEBPS" en cas contrari retornem sense aquest
    if (fs.existsSync(path.resolve(ebookPath, 'OEBPS'))) {
        return { chapterId: chapter, chapterPath: path.join('OEBPS', chapterPath), chapters: chapters.length };
    }
    return { chapterId: chapter, chapterPath: path.join(chapterPath), chapters: chapters.length };
}