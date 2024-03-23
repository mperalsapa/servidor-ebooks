import * as BooksAPI from './books.js';
// Funció asíncrona per obtenir un capítol d'un llibre específic
async function getChapter(bookId, chapter = -1) {
    let userName = $("#userName").val();
    if (!userName) {
        userName = "anonymous";
    };

    let response;
    if (chapter < 1) {
        response = await fetch(`/llibre/${bookId}/${chapter}?un=${userName}&continue=true`);
    } else {
        response = await fetch(`/llibre/${bookId}/${chapter}?un=${userName}`);
    }

    let data = await response.json();
    return data;
}
// Funció per mostrar un capítol en el marc de llibre
function displayChapter(chapterData) {
    $("#book-frame").attr("src", `/ebooks/${chapterData.chapterPath}`);

    $("#book-frame").on("load", function () {
        let iframe = $("#book-frame").contents();
        iframe.find("body").css("font-family", "Arial, sans-serif");
        iframe.find("body").css("font-size", "1.2em");
        iframe.find("body").css("max-width", "21cm");
        iframe.find("body").css("margin-inline", "auto");
    });
}
// Funció per netejar l'iframe
function clearIframe() {
    $("#book-frame").attr("src", "");

}
// Funció per obtenir el capítol guardat d'un llibre
function getSavedChapter(bookId) {
    // read from local storage if a stored chapter exists based on bookId
    if (localStorage.getItem(bookId)) {
        return localStorage.getItem(bookId);
    }
    return 1;
}

// Funció per desar el capítol d'un llibre a l'emmagatzematge local
function saveChapter(bookId, chapter) {
    // save the chapter to local storage
    localStorage.setItem(bookId, chapter);
    return chapter;
}

// Esdeveniment DOMContentLoaded per carregar l'aplicació
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
        clearIframe();
        $("#book-frame").data("book-id", bookId);
        $(".modal-title").text($(this).text());
        $("#book-viewer").modal("show");
        // Obtindre les dades del capítol i mostrar-lo
        let chapterData = await getChapter(bookId);
        saveChapter(bookId, Math.max(1, Math.min(chapterData.chapter, chapterData.chapters)));

        displayChapter(chapterData);
    });

    // Event listener per al botó de següent capítol
    $("#next-chapter").click(async function () {

        let bookId = $("#book-frame").data("book-id");
        let chapterData = await getChapter(bookId, parseInt(getSavedChapter(bookId)) + 1);
        saveChapter(bookId, Math.max(1, Math.min(chapterData.chapter, chapterData.chapters)));

        displayChapter(chapterData);
    });

    // Event listener per al botó de capítol anterior
    $("#previous-chapter").click(async function () {
        let bookId = $("#book-frame").data("book-id");
        let chapterData = await getChapter(bookId, parseInt(getSavedChapter(bookId)) - 1);
        saveChapter(bookId, Math.max(1, Math.min(chapterData.chapter, chapterData.chapters)));

        displayChapter(chapterData);
    });

    // Event listener per al tancament del visor de llibres
    $("#closeBookViewer").click(function () {
        console.log($("#book-viewer").get(0));
        $("#book-viewer").get(0).close();
    })
});