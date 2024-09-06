# XBooks

Questa repository contiene il codice del **backend** del progetto XBooks. Il backend si occupa principalmente delle API:

- [x] Del loro sviluppo
- [x] Della loro documentazione
- [x] Del loro testing

# Opzioni per avviare il Backend

Il backend è online su questo indirizzo: [https://backend-production-7b98.up.railway.app](https://backend-production-7b98.up.railway.app).
La documentazione swagger invece è live all'URL [https://backend-production-7b98.up.railway.app/api-docs](https://backend-production-7b98.up.railway.app/api-docs). Qui
si possono vedere le singole API del progetto, i parametri necessari e la possibilità di testarli.

Se il link non dovesse andare, significherebbe che il sito non è più online, di conseguenza dovrete eseguire il backend localmente in questo modo:

1. Clonare il progetto con il comando ```git clone https://github.com/G19-IS2023/Backend.git``` su una shell git
2. Eseguire ```cd Backend``` per entrare nella cartella
3. Creare un file ```.env``` all'interno del quale definire le seguenti variabili d'ambiente:
```
PORT=numeroPorta
DB_CONN_STRING=mongoDbConnectionString
DB_NAME=dbName
ACCESS_TOKEN_SECRET=stringaPersonalePerGenerareToken
```
Assicurarsi, inoltre, che nel database che decidete di utilizzare, si chiami come la variabile DB_NAME in cui ci sia una collection chiamata "users". Una volta essersi assicurati di non essere collegati a una rete Wi-fi, il cui firewall blocchi la connessione al database potete:
1. Eseguire ```npm install``` per installare le librerie del progetto
2. Eseguire ```npm start``` per avviare il programma in locale

Utilizzando software come **Postman** potrete testare le API in locale.
Per farlo usate il link che trovate nel file server.ts ```http://localhost:${PORT}```, sostituendo la porta con quella che avete inserito
nel file .env, nell'applicazione e da lì cominciare a fare chiamate alle API come ```http://localhost:${PORT}/user/getUser/668fe618d6980b9e3fc15fca```.

Dopo aver avviato il backend, puoi avviare il Frontend cliccando su questo link [frontend](https://github.com/G19-IS2023/Frontend).
