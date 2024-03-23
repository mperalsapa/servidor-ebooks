// aquesta funció fa una sol·licitud HTTP a la ruta /books, obté les dades rebudes com a resposta i les retorna
export async function getBooks() {
    const response = await fetch('/books');
    const files = await response.json();
    return files;
}