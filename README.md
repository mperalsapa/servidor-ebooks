# Servidor d'EBooks

Aquest projecte te com a proposit proveir d'una plataforma per administrar i donar access a EBooks.

# Configuracio
## Configuracio d'autenticacio amb Google Drive
Primer de tot, s'ha de crear un compte de serveis en la plataforma de Google Cloud, i descarregar el fitxer `credentials.json`. Aquest fitxer s'ha de guardar a l'arrel del projecte. Aquest fitxer es necessari per poder accedir a Google Drive.

Com a exemple d'aquest fitxer, es pot veure el fitxer [credentials.json.example](credentials.json.example).

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
