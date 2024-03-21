import { DOMParser } from 'xmldom';
import fs from 'fs';
import path from 'path';

export async function readChapter(fileId, chapter, publicRoot) {
    if (!chapter) {
        chapter = 0;
    }
    // llegim les dades necessaries per a mostrar el llibre
    // primer llegim el fitxer de metadades del llibre
    // id/META-INF/container.xml
    let containerXml = fs.readFileSync(path.resolve(publicRoot, `assets/${fileId}/META-INF/container.xml`));
    if (!containerXml) {
        console.error('Error reading container.xml');
        return;
    }
    // ara que tenim el fitxer container, llegim el fitxer com a string
    containerXml = containerXml.toString();
    console.log(containerXml)
    const doc = new DOMParser().parseFromString(containerXml, 'text/xml');
    if (!doc) {
        console.error('Error reading container.xml');
        return;
    }
    const indexFilePath = doc.getElementsByTagName("rootfile")[0].getAttribute('full-path');
    // ara que tenim el fitxer root, el llegim per obtenir els capitols dintre del node <spine>
    let rootFile = fs.readFileSync(path.resolve(publicRoot, `assets/${fileId}/${indexFilePath}`));
    if (!rootFile) {
        console.error('Error reading root file');
        return;
    }
    rootFile = rootFile.toString();
    const rootDoc = new DOMParser().parseFromString(rootFile, 'text/xml');
    const chapters = rootDoc.getElementsByTagName('itemref');

    // ara que tenim els capitols, retornem el primer capitol
    const chapterContent = chapters[chapter].getAttribute('idref');
    return chapterContent;
}