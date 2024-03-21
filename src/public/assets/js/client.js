import * as BooksAPI from './books.js';

async function readChapter(bookId, chapter = 1) {
    let response = await fetch(`/llibre/${bookId}/${chapter}`);
    let data = await response.json();
    return data;
}

function getSavedChapter(bookId) {
    // read from local storage if a stored chapter exists based on bookId
    if (localStorage.getItem(bookId)) {
        return localStorage.getItem(bookId);
    }
    return 1;
}

function saveChapter(bookId, chapter) {
    // save the chapter to local storage
    localStorage.setItem(bookId, chapter);
    return chapter;
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
        $("#book-frame").data("book-id", bookId);

        let chapterData = await readChapter(bookId, getSavedChapter(bookId));
        saveChapter(bookId, Math.max(1, Math.min(chapterData.chapter, chapterData.chapters)));


        $("#book-frame").attr("src", `/ebooks/${chapterData.chapterPath}`);

        $(".modal-title").text($(this).text());
        $("#book-viewer").modal("show");

    });

    $("#next-chapter").click(async function () {

        let bookId = $("#book-frame").data("book-id");
        let chapterData = await readChapter(bookId, parseInt(getSavedChapter(bookId)) + 1);
        saveChapter(bookId, Math.max(1, Math.min(chapterData.chapter, chapterData.chapters)));
        console.log(chapterData);
        $("#book-frame").attr("src", `/ebooks/${chapterData.chapterPath}`);
    });

    $("#previous-chapter").click(async function () {
        let bookId = $("#book-frame").data("book-id");
        let chapterData = await readChapter(bookId, parseInt(getSavedChapter(bookId)) - 1);
        saveChapter(bookId, Math.max(1, Math.min(chapterData.chapter, chapterData.chapters)));
        console.log(chapterData);
        $("#book-frame").attr("src", `/ebooks/${chapterData.chapterPath}`);
    });

    $("#closeBookViewer").click(function () {
        console.log($("#book-viewer").get(0));
        $("#book-viewer").get(0).close();
    })
});