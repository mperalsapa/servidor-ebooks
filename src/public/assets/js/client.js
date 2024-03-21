import * as BooksAPI from './books.js';

async function readChapter(bookId, chapter = 1) {
    let response = await fetch(`/llibre/${bookId}/${chapter}`);
    let data = await response.json();
    return data;
}


document.addEventListener('DOMContentLoaded', async () => {
    let books = await BooksAPI.getBooks();
    let html = ""
    console.log(books)
    for (let book of books) {
        let bookName = book.name.replace(/.epub/g, '');
        bookName = bookName.replace(/_/g, ' ');
        bookName = bookName.replace(/-/g, ' ');
        bookName = bookName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        html += `<button type="button" class="list-group-item list-group-item-action" data-id="${book.id}">${bookName}</button>`;
    }

    $(".book-list").html(html);

    $(".book-list button").click(async function () {
        let bookId = $(this).data("id");

        let chapter = 1;
        let chapterData = await readChapter(bookId, chapter);
        console.log(chapterData);
        $("#book-frame").attr("src", `/ebooks/${chapterData.chapterPath}`);

        $(".modal-title").text($(this).text());
        $("#book-viewer").modal("show");
    });

    $("#closeBookViewer").click(function () {
        console.log($("#book-viewer").get(0));
        $("#book-viewer").get(0).close();
    })
});