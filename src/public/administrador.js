document.addEventListener('DOMContentLoaded', () => {
    fetch('/obtenirArxius')
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
    .catch(error => console.error('Error al eliminar el arxiu:', error));
});