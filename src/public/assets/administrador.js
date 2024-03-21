/*
document.addEventListener('DOMContentLoaded', () => {
    fetch('/books')
    .then(response => response.json())
    .then(files =>{
        const tbody = document.getElementById('arxius');
        files.forEach(file =>{
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.textContent = file.name;
            const botoEliminar = document.createElement('button');
            botoEliminar.textContent = 'Eliminar';
            botoEliminar.addEventListener('click',() => {
                fetch(`/eliminarArxiu/${file.id}`, {method: 'DELETE'})
                .then(response => {
                    if(response.ok) {
                        tr.remove();
                    } else {
                        console.error('Error al esborrar el arxiu');
                    }
                })
                .catch(error => console.error('Error al eliminar el arxiu:', error));
            });
            tr.appendChild(td);
            tr.appendChild(botoEliminar);
            tbody.appendChild(tr);
        });
    })
   // .catch(error => console.error('Error al eliminar el arxiu:', error));
});



document.addEventListener('DOMContentLoaded',() =>{
    const dropzone = document.getElementById('dropzone');

    dropzone.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropzone.style.backgroundColor = '#eee';
    });


    dropzone.addEventListener('dragleave', () => {
        dropzone.style.backgroundColor = '#fff';
    });

    dropzone.addEventListener('drop', (event) => {
        event.preventDefault();
        dropzone.style.backgroundColor = '#fff';
        const files = event.dataTransfer.files;
        gestionarArxius(files);
    });
});

function gestionarArxius(files) {
    ([...files]).forEach(pujarArxiu);
    
}

function pujarArxiu(file) {
    let url = './uploadBook';
    let formData = new FormData();

    formData.append('book',file);

    fetch(url, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json()) // Retorna la resposta com a JSON
    .then(data => {
        console.log('Arxiu pujat correctament:', data); // Accedeix a la resposta aquí
    })
   // .catch(error => console.error('Error al pujar l\'arxiu:', error));
    
} */


document.addEventListener('DOMContentLoaded', () => {
    mostrarArxius();
});

function mostrarArxius() {
    const tbody = document.getElementById('arxius');
    tbody.innerHTML = ''; // Limpiar el contenido existente

    fetch('/books')
    .then(response => response.json())
    .then(files =>{
        files.forEach(file =>{
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.textContent = file.name;
            const botoEliminar = document.createElement('button');
            botoEliminar.textContent = 'Eliminar';
            botoEliminar.addEventListener('click',() => {
                fetch(`/eliminarArxiu/${file.id}`, {method: 'DELETE'})
                .then(response => {
                    if(response.ok) {
                        mostrarArxius(); // Recargar la lista de archivos
                    } else {
                        console.error('Error al esborrar el arxiu');
                    }
                })
                .catch(error => console.error('Error al eliminar el arxiu:', error));
            });
            tr.appendChild(td);
            tr.appendChild(botoEliminar);
            tbody.appendChild(tr);
        });
    });
}

document.addEventListener('DOMContentLoaded',() =>{
    const dropzone = document.getElementById('dropzone');

    dropzone.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropzone.style.backgroundColor = '#eee';
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.style.backgroundColor = '#fff';
    });

    dropzone.addEventListener('drop', (event) => {
        event.preventDefault();
        dropzone.style.backgroundColor = '#fff';
        const files = event.dataTransfer.files;
        gestionarArxius(files);
    });
});

function gestionarArxius(files) {
    ([...files]).forEach(pujarArxiu);
}

function pujarArxiu(file) {
    let url = './uploadBook';
    let formData = new FormData();

    formData.append('book',file);

    fetch(url, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json()) // Retorna la resposta com a JSON
    .then(data => {
        console.log('Arxiu pujat correctament:', data); // Accedeix a la resposta aquí
        mostrarArxius(); // Recargar la lista de archivos
    })
}

