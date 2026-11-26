# Valico

Diagramma di Gantt per la pianificazione di progetti, in un **unico file HTML** che funziona **offline** nel browser: nessuna installazione, nessun server, nessun account. I dati del progetto restano sul dispositivo dell'utente (file JSON e memoria locale del browser) e non vengono trasmessi a terzi.

Autore: Claudio Passari. Versione corrente: vedi [CHANGELOG.md](CHANGELOG.md).

## Uso

1. Scarica [`src/valico.html`](src/valico.html) (pulsante *Raw* → «Salva con nome») e aprilo con un browser recente (Chrome, Edge, Firefox, Safari).
2. In alternativa apri la versione online: https://claudiopassari.github.io/VALICO/ (cartella `/docs` delle GitHub Pages). Il comportamento è identico e il programma viene comunque eseguito localmente nel browser: i dati del progetto non lasciano il dispositivo.
3. Salva il progetto in JSON dal menu *File*; riaprilo con *Apri*.

## Funzioni principali

- Attività, gruppi, milestone, attese e indicazioni; dipendenze tra attività; percorso critico.
- Marker e periodi sulla timeline, sovrapponibili e con duplicazione tramite `Ctrl+Alt` (`Cmd+Alt` su macOS).
- Calendari lavorativi, festivi e calendario virtuale (giorni numerati anziché date).
- Annullamento e ripristino illimitati nella sessione, revisioni del progetto.
- Temi chiaro e scuro, tavolozza di 40 colori in quattro livelli ordinati per tonalità, carattere e densità configurabili, scorciatoie da tastiera.
- Esportazione in **PDF vettoriale**, PDF immagine, PNG, JPEG, SVG ed Excel (`.xlsx`); layout dedicati (sintesi per fasi, report di avanzamento, una pagina per fase); importazione da Excel.

### Esportazione PDF

- **PDF vettoriale**: usa la stampa del browser. Nella finestra che si apre scegli come destinazione «Salva come PDF». Testo selezionabile, font reali incorporati, nessuna perdita di nitidezza. Senza formato carta (*Adatta al grafico*) la pagina assume le dimensioni del diagramma, anche molto stretto e lungo; con A4/A3 le pagine si interrompono alle righe e l'intestazione della timeline si ripete.
- **PDF immagine**: più rapido, ma ogni pagina è un'immagine (non scalabile).

Il PDF vettoriale è verificato con Chromium; in Safari la finestra di stampa può comportarsi in modo diverso.

## Sviluppo

Il progetto è un unico file (`src/valico.html`) in JavaScript senza dipendenze e senza fase di build. La cartella `tests/` contiene la suite di regressione basata su [Playwright](https://playwright.dev/) (Chromium).

```bash
npm install playwright
cp src/valico.html app.html     # i test aprono ./app.html
bash tests/runall.sh
```

Alcuni test di esportazione PDF usano gli strumenti `pdfinfo`, `pdftotext` e `pdffonts` (pacchetto poppler).

## Licenza

Il codice è pubblico per consentirne la lettura e la verifica, **non** è software libero né open source. L'uso gratuito del file non modificato è consentito; copia, modifica, riutilizzo del codice e ridistribuzione richiedono autorizzazione scritta. Testo completo in [LICENSE](LICENSE) (bozza non rivista da un legale).

I file di progetto e le esportazioni creati con Valico appartengono a chi li crea.

## Contatti e sostegno

Segnalazioni e richieste: apri una *Issue* in questo repository.
