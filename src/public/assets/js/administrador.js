document.addEventListener('DOMContentLoaded', () => {
    mostrarArxius();
});
/**
 * Aquesta funció es fa responsable de fer una sol·licitud per obtenir una llista de llibres a través de la crida a /books 
 * utilitzant la funció fetch(). Un cop s'obté la resposta, els llibres es mostren en una taula en el document HTML.
 */
function mostrarArxius() {
    const tbody = document.getElementById('arxius');
    tbody.innerHTML = ''; 

    fetch('/books')
    .then(response => response.json())
    .then(files =>{
        files.forEach(file =>{
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.textContent = file.name;
            const botoEliminar = document.createElement('button');
            botoEliminar.textContent = 'Eliminar';
            botoEliminar.addEventListener('click',() => { //Eliminar fitxers
                fetch(`/eliminarArxiu/${file.id}`, {method: 'DELETE'})
                .then(response => {
                    if(response.ok) {
                        mostrarArxius(); 
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

//Gestió de fitxers en arrossegar i soltar
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

/**Aquesta funció pren una llista de fitxers i crida a 
* pujarArxiu(file) per a cadascun d'ells
 */
function gestionarArxius(files) {
    ([...files]).forEach(pujarArxiu);
}

// Aquesta funció s'encarrega de pujar un fitxer al servidor
function pujarArxiu(file) {
    let url = './uploadBook';
    let formData = new FormData();

    formData.append('book',file);

    fetch(url, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json()) 
    .then(data => {
        console.log('Arxiu pujat correctament:', data); 
        mostrarArxius(); 
    })
}

