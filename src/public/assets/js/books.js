export async function getBooks() {
    const response = await fetch('/books');
    const files = await response.json();
    return files;
}