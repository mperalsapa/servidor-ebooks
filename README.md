# Servidor d'EBooks

Aquest projecte te com a proposit proveir d'una plataforma per administrar i donar access a EBooks.

# Configuracio

## Generar Token
Primer de tot s'ha de afegir el fitxer `credentials.json` a la ruta `config/secrets`. Aquest fitcher l'haura de proveir la plataforma de Google Cloud per poder accedir a Google Drive. Una vegada s'ha afegit aquest fitcher en la carpeta `config/secrets`, executem (amb la consola en aquell directori) el script `src/setup_gdrive.js`, i ens generara un fitxer anomenat `token.json`.
```bash
cd config/secrets
node ../../src/setup_gdrive.js
```
Per ultim, afegim el callback en l'script del token, per lo que la seva estructura quedaria aixi:
```json
{
    "type": "authorized_user",
    "client_id": "********",
    "client_secret": "********",
    "refresh_token": "********",
    "redirect_uris": [
        "http://localhost:3000/oauth2callback"
    ]
}
```

# Admin
L'admin pot fer les seguents accions en el panell d'administracio
- Afegir llibres
- Visualitza llista de Llibres
- Esborra Llibres

# Client
El client pot fer les seguents accions
- Visualitza llista de Llibres
- Visualitza un Llibre
També, cada vegada que visiti un capitol, es guardará automaticament.


# Tasques
- [ ] Admin
    - [ ] Llistar Llibres
    - [ ] Afegir Llibres
    - [ ] Esborrar Llibres
- [ ] Client
    - [ ] Llistar Llibres
    - [ ] Llegir Llibre

