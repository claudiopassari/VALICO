# Changelog

Elenco delle novità per versione (stesso testo mostrato in Valico, finestra Informazioni › Novità delle versioni).

## 0.9.3

occhio di visibilità per riga (solo vista) accanto al numero, con occhio globale in intestazione e indicatore nella barra di stato; il tipo di item (attività, milestone, attesa, indicazione) si sceglie anche dal menu del tasto destro; Ctrl+Maiusc+Invio inserisce una riga sopra; correzione: un gruppo ora include le indicazioni (intervalli) che contiene, anche se è l\'unico figlio; l\'estensione di un intervallo si vede mentre si trascina il bordo, come per le barre; il nome di un gruppo troppo corto si legge intero a destra.

## 0.9.2

impostazioni predefinite riviste (margini 1/3 settimane, pannello dettagli chiuso, zoom elenco 110%, intestazione Anno + Mese + settimana dall'inizio, gruppi con sola parentesi, barre stondate); etichetta delle indicazioni con tre modalità: Adattiva, A lato, Sopra. Le righe vuote sotto l'ultimo item non sono più colorate (interruttore «Mostra le righe vuote» in Visualizza) e le nuove barre si disegnano in tutta l'area vuota; il periodo «Progetto» è una riga dell'elenco dei periodi, con occhio di visibilità.

## 0.9.1

simboli degli item uniformati e distinguibili: l'attesa è un quadrato vuoto, il gruppo una linea verticale con estremità arrotondate (come la parentesi nella timeline); attività = pallino, milestone = rombo, indicazione = linea orizzontale.

## 0.9.0

nuovo formato «PDF vettoriale» (stampa del browser: testo selezionabile, font reali incorporati, forme scalabili senza perdita; con più pagine l'intestazione della timeline si ripete e le pagine si interrompono alle righe); senza formato carta («Adatta al grafico», predefinito) la pagina ha le dimensioni del diagramma; il PDF precedente diventa «PDF immagine»; le viste predefinite usano il PDF vettoriale. Tavolozza 4 × 10: colonne in ordine di tonalità (rosso, arancio, giallo, verde, blu, viola, rosa) e neutri in coda (bianco avorio, grigio, nero), quattro livelli per colore (nuovo livello medio-chiaro); i colori già assegnati non cambiano. Periodi riordinabili trascinando la maniglia nell'elenco: l'ordine è la priorità (riga della fascia e prevalenza del colore nella timeline; i progetti esistenti possono mostrare la sovrapposizione dei colori invertita). Testo e griglia del calendario della timeline più visibili. Gruppi: impostazioni «Fondo», «Parentesi» (bordo sinistro più spesso che segue gli angoli del riquadro) e «Riquadro» (nessuno, arrotondato, squadrato) al posto di «Riquadro», «Fondo» e «Contorno»; «Terminazione delle barre» e «Margine finale» passano nella sezione «Barre». Nuovo pulsante per attivare o disattivare la colorazione della timeline in corrispondenza dei periodi. Rimossa la guida «Che cosa voglio ottenere» e l'autore dalla barra di stato: le informazioni sul programma si aprono dalla Guida (?).

## 0.8.19

tolto dal pannello Item il promemoria «Progetto vuoto: non sai da dove partire?» (la guida degli scenari resta in Visualizza); nuove icone per i pulsanti dei marker e dei periodi: i due interruttori generali usano la bandierina e la fascia, mentre gli elenchi hanno icone con righe.

## 0.8.18

il calendario si allunga da solo durante il trascinamento di barre, periodi e marker (una settimana alla volta, a destra e a sinistra, fino a circa due anni oltre i dati; nessun vincolo con la fine lavori, che resta un avviso); periodi e marker personali contano nell'estensione; periodi sovrapposti su righe distinte (la fascia si alza) e trascinabili in verticale, dalla timeline e dalla finestra dei periodi; duplicazione di barre, periodi e marker con Ctrl+Alt+trascina (Cmd+Opzione su Mac) e con i pulsanti Duplica; «Nuova indicazione» (pulsante e menu di riga, dentro il gruppo selezionato) ed etichetta delle indicazioni adattiva (sovrapposta se la linea è lunga, altrimenti sopra la linea che scende) o a lato; interruttori generali per mostrare o nascondere tutti i marker e tutti i periodi; la guida degli scenari esce dalla finestra di benvenuto, che si allarga.

## 0.8.17

nuovo progetto di esempio neutro (allestimento di un ufficio: 16 righe, gruppi fino al terzo livello, milestone e attesa); in Visualizza la terminazione delle barre è ordinata come il riquadro dei gruppi (dalla forma più tondeggiante alla più netta: Rotonda, Stondata, Quadrata); le barre e le milestone restano sempre dentro il bordo dei riquadri dei gruppi, anche sull'ultima riga, sugli angoli arrotondati e a ogni livello di annidamento (la distanza tra riquadri annidati è ora di 3 px), e non toccano le linee dei sottogruppi. Altre novità: «Autore» al posto di «Sviluppatore»; nelle revisioni si indica anche la società o ente (sigla o denominazione completa), ricordata per le revisioni successive; colonna «Ore» (ore lavorative al giorno) subito dopo la Durata, con valore predefinito 8, scelte rapide 8, 4 e 0 (0 = non conteggiata) e valori manuali, non applicabile ad Attese, Milestone e Indicazioni; l'assegnatario inserito su un gruppo si applica a tutti gli item che gli appartengono; comando «Allinea tutte le righe al proprio gruppo» nella tavolozza dei colori; copia e incolla delle celle dell'elenco con Ctrl+C e Ctrl+V (anche su più righe e da Excel); ordine dei tipi Attività, Milestone, Attesa, Indicazione; nell'intestazione la Guida sta a sinistra dello schermo intero.

## 0.8.16

«Interrompi le barre nei giorni non lavorativi»: interruttore in Visualizza (Evidenziazioni) e pulsante nella barra della timeline che disegna le attività a blocchi, con un vuoto in sabato, domenica e festività. È solo visivo: date, durate, dipendenze e calcoli non cambiano. Segue il calendario del progetto, quindi un sabato lavorativo o una qualsiasi eccezione lavorativa mostra la barra; gruppi, milestone e indicazioni restano continui. Si sospende da solo sotto una soglia di zoom (con avviso) e vale anche per l'esportazione. Si salva nel file di progetto.

## 0.8.15

«Vai al giorno» nella barra della timeline, accanto a «Vai a oggi»: scelta di un giorno o di un intervallo di date da un calendario; la timeline porta il giorno al centro o adatta lo zoom all'intervallo e lo evidenzia per qualche secondo; «Salva con nome» chiede se il file è una copia dello stesso progetto o un nuovo progetto derivato (nuovo identificativo, nessuna revisione emessa, registro azzerato, avanzamento e baseline azzerabili); gli avvisi di perdita di modifiche indicano quante sono e qual è l'ultima

## 0.8.14

disegnando una barra su una riga senza nome si può digitare subito il nome (Esc annulla; un nuovo disegno o un clic altrove conferma); nell'interfaccia «Task» diventa «Attività» (selettore del tipo, colonne dei report, messaggi, guida)

## 0.8.13

guida «Che cosa voglio ottenere?» (tre scenari: cronoprogramma per la direzione, controllo di avanzamento, piano con dipendenze) che imposta gruppi, livelli, scala e colonne senza toccare le righe e si annulla con Annulla; promemoria nel progetto vuoto; diagnostica in Informazioni: registro degli errori tecnici e riepilogo copiabile negli appunti, privo dei contenuti del progetto

## 0.8.12

smartphone: schede Dettagli · Elenco · Timeline con scorrimento laterale (solo nelle zone sicure: intestazioni e barra inferiore); modalità consultazione di default (i dati non si modificano finché non si tocca «Modifica»); riepilogo rapido dell'item toccato; zoom a due dita sulla timeline; riga compatta degli avvisi; limite di risoluzione delle immagini esportate su dispositivi touch

## 0.8.11

«Oggi» separato in due funzioni indipendenti: il marker (linea sul bordo iniziale del giorno, colore blu, nascondibile dall'elenco dei marker) e «Evidenzia oggi» (colonna gialla a tutta altezza, con pulsante nella barra della timeline accanto a Visualizza e Calendario); giorni di durata centrati nella colonna; progetto di esempio sostituito da una versione semplificata di cantiere (15 righe)

## 0.8.10

smartphone: su schermi stretti un pannello alla volta (Elenco, Timeline, Dettagli) con barra di navigazione inferiore, intestazione su due righe con comandi scorrevoli, finestre dei comandi a tutta larghezza; il layout per PC non cambia.

## 0.8.9

marker «Oggi» come colonna evidenziata (predefinito, in ambra nei nuovi progetti), linea a inizio giornata o entrambe, a scelta in Visualizza; riquadri dei gruppi arrotondati, squadrati o solo linee verticali (predefinito: arrotondati); le barre dei figli terminano sul bordo interno delle linee del gruppo; colonna «#» più stretta; barra dei periodi più alta e con carattere più grande.

## 0.8.8

intestazione unificata: settimana ISO (W) e settimana di progetto (S) nella stessa riga, «W48 · S2»; tema predefinito Automatico (segue il sistema operativo); data di inizio e di fine progetto manuali nel Calendario, con lucchetto, e marker «Inizio/Fine lavori» trascinabili; la barra «Progetto» segue le date manuali; zoom del pannello Item con pulsanti «−»/«+» al posto del cursore; corretta la riga «Anno» tagliata con sei righe di intestazione.

## 0.8.7

ordine dell'intestazione nella scala Giorni: anno, mese, giorno, numero del giorno, settimana ISO, settimana di progetto.

## 0.8.6

i marker Inizio lavori, Fine lavori e Oggi sono funzioni del programma e compaiono sempre, anche aprendo un file che non li contiene (il file ne conserva solo colore, nome e data manuale); non si eliminano.

## 0.8.5

trascinamento di più barre selezionate (e dei gruppi con il loro contenuto) con un solo passo di annullamento, e Alt+Maiusc+←/→ per spostare la selezione di un giorno lavorativo; selettore del tipo item (task, attesa, milestone, indicazione) nel selettore colore del simbolo accanto al nome, con avviso se si perdono dati; Ctrl sulle maniglie dello zoom: movimento simmetrico; barra timeline in capsule separate (Visualizza e Calendario · Marker e Periodi · Collegamento) e capsula Gruppi più sottile; Dettagli: campi riordinati, Persone sul task, Ore-uomo calcolate, Scadenza (data limite); settimane di progetto sotto i numeri dei giorni.

## 0.8.4

linee dei gruppi rette, con scostamento per livello di annidamento e linea di fine, sopra le barre; margine finale delle barre (solo visivo, disattivabile in Visualizza); fondo dei gruppi nel colore di ciascun gruppo (intensità cumulativa nei sottogruppi), eliminati gli stili «per livello»; Fondo e Linee dei gruppi solo nel pannello Visualizza (in barra restano Compatta/Estesa e i livelli 1–5); evidenziazione delle righe di gruppo attiva di default; colonna Nome ridimensionabile da sola (maniglia nell'intestazione, doppio clic: automatica); Alt+rotella scorre in orizzontale (Maiusc resta per i punti di collegamento); Esc deseleziona come il clic sull'area vuota.

## 0.8.3

stili dei gruppi rifatti in due controlli indipendenti, Fondo (nessuno, tinta unica, per livello) e Barra laterale (nessuna, sottile, per livello), visibili nella barra della timeline insieme ai livelli dei gruppi (1-5) e a Compatta/Estesa; terminazione delle barre quadrata, stondata o rotonda; nell'elenco ogni tipo di item ha un simbolo proprio (task pallino, attesa quadrato tratteggiato, milestone rombo, indicazione segmento con chiusure, gruppo staffa nel colore del gruppo); righe dei gruppi in grassetto con tinta facoltativa (pulsante nel pannello Item); contorno attorno alle etichette fuori dalle barre; PDF a 300 dpi (fino a 450) con la carta «Come il grafico»; margini e cifre allineate nelle colonne numeriche.

## 0.8.2

nell'esportazione l'intestazione riporta solo titolo, revisione e data (niente nome del software né sviluppatore); le colonne data si accorciano in stampa; la vista predefinita è essenziale (gruppi compatti; colonne Nome, Inizio, Fine, Durata); il selettore delle colonne è diviso in Principali e Avanzate, con il comando «Solo colonne essenziali»; nell'esportazione tutte le colonne sono selezionabili anche se nascoste a schermo e la colonna Nome si adatta al nome più lungo; nuove colonne Ore/giorno e Ore-uomo (calcolata, i gruppi sommano i task); «Componenti» diventa «Persone»; nuovi comandi «Mostra fino al livello N» (menu delle righe e Alt+Maiusc+1…5) per aprire o chiudere i gruppi per livello.

## 0.8.1

il pulsante Esporta è bordato con il colore del tema, per distinguerlo da Aggiorna revisione; in Informazioni, il formato dei file è spiegato (schema = struttura dei file di progetto, usata per la compatibilità tra versioni).

## 0.8.0

nuova schermata di benvenuto con striscia «nessun account, nessuna registrazione, nessuna raccolta di dati», sette schede animate in un'unica riga scorrevole (disegno e annotazioni, gruppi, controllo del piano, calendari, progetti in file e revisioni, esportazione e copia, personalizzazione) e spiegazione del nome e dell'icona chiusa; nuova sezione «Riservatezza e diritti» in Informazioni (funzionamento locale, dati, diritto d'uso, diritti riservati, esclusione di garanzia).

## 0.7.8

esportazione: il nome è sempre presente tra le colonne e le altre si possono deselezionare tutte; l'area «Progetto attivo» non taglia più le etichette delle barre; il formato passa nel pannello «Output»; sfondo trasparente anche per il layout Standard (PNG e SVG), con anteprima a scacchiera; «Copia come immagine» avvia la copia nel gesto dell'utente e incolla davvero l'immagine.

## 0.7.7

nuova riga facoltativa dell'intestazione «Settimana dall'inizio» (Visualizza > Righe dell'intestazione): settimane trascorse dall'inizio dei lavori, da 1 in avanti, con numeri negativi prima dell'inizio; doppio clic sulla barra di scorrimento della timeline: tutta la timeline nella vista (e ritorno alla vista precedente); il doppio clic sul divisorio dell'elenco torna alla larghezza automatica originaria.

## 0.7.6

corretto il pannello Item compresso (il cursore di zoom non compare più); doppio clic sul divisorio dell'elenco: larghezza adattata a tutte le colonne visibili, e di nuovo per tornare a quella predefinita; colonna % più larga (il valore 100% non è più troncato); scrollbar uniformi; scorciatoie della rotella nei riepiloghi; il progetto di esempio contiene due baseline (di progetto ed esecutiva) con scostamenti diversi.

## 0.7.5

progetto di esempio con 27 righe (gruppi, dipendenze, baseline con scostamenti, periodi, marker, Componenti, Attesa, scadenze e percorso critico), con date relative a oggi, apribile dalla Guida; finestra di benvenuto con il significato del nome e dell'icona, le funzioni principali animate e l'opzione per non mostrarla più all'avvio.

## 0.7.4

data di inizio del progetto nel Calendario (dal primo task o manuale, con avviso per gli item che iniziano prima); nuovo campo Componenti, che moltiplica le ore dei report (maestranze comprese); nuovo tipo di item «Attesa» (barra tratteggiata, senza ore né assegnatario); nuovo attributo Scadenza con segno sulla timeline e avviso quando la fine prevista la supera; percorso critico calcolato per impostazione predefinita sulle date visibili, con la rete logica come alternativa; dialogo Esporta quasi a tutto schermo e riepilogo scorciatoie corretto nei pannelli compressi.

## 0.7.3

pannelli di impostazioni trascinabili dal titolo, con x e chiusura con Esc, e larghezza uniforme; Visualizza riordinato in sezioni comprimibili (intestazione, gruppi e righe con Compatta/Estesa e densità, evidenziazioni); barra della timeline riordinata in gruppi a capsula, con la Baseline separata e nuove icone (marker, baseline, revisione); salvataggio automatico con scelta dell'intervallo (1, 2, 5, 10 minuti) e pulsante accanto al pallino di stato; esportazione senza lo spazio vuoto sopra l'intestazione.

## 0.7.2

esportazione riprogettata: anteprima dal vivo, larghezza in pixel per le immagini e risoluzione in dpi per il PDF, scelta di intestazione (titolo, revisione, data), colonne dell'elenco e livelli della timeline (calendario, marker, periodi, collegamenti), viste predefinite e viste salvate nel progetto, nuovi layout «Una pagina per fase» e «Report di avanzamento».

## 0.7.1

livello Alt sulla timeline con cursore e suggerimento per zona (Alt+clic su una barra: taglia; Alt+trascina: selezione ad area, contenute o toccate come in AutoCAD; Alt+clic nell'intestazione: marker; Alt+trascina nella fascia dei periodi: periodo; Alt+clic su un collegamento: lo elimina); Alt+frecce per livello e spostamento, Ctrl+Canc elimina le righe, Ctrl+A, Ctrl+D; Ctrl+rotella: zoom della timeline; tasto centrale: scorrimento; scorciatoie personalizzabili (Aspetto); menu «Visualizza» unico; colore in testa al menu della barra; nelle esportazioni compare l'etichetta della barra, se presente.

## 0.7.0

prima revisione emessa = Rev. 1.0; report ore e maestranze; esportazione con sei layout (corsie, fasi, linea dei traguardi, stato avanzamento, trimestri, standard) e formato SVG; creazione rapida di marker (Alt+M) e periodi (Alt+P) con clic sulla timeline; suggerimenti dell'assegnatario con elenco completo all'apertura.

## 0.6.0

esportazione in PNG, JPEG e PDF (con scelta dell'area, dei colori e della carta) e copia come immagine.

## 0.6.0

taglio della barra in due (Alt+T o tasto destro sulla barra) e nuova barra disegnata su una riga vuota (trascinamento o Alt+B).

## 0.6.0

esportazione dell'elenco in Excel (.xlsx) e importazione da Excel come nuovo progetto.

## 0.5.3

zoom dedicato al pannello Item (80–140%), con cursore in alto e Ctrl + rotella.

## 0.5.3

i campi data dei dialoghi (calendario, marker, periodi, baseline) hanno il calendario a comparsa.

## 0.5.3

nuova icona, con la sola montagna e due barre di Gantt; descrizione del nome aggiornata.

## 0.5.3

i margini della timeline (settimane prima e dopo) sono passati nel dialogo Calendario.

## 0.5.3

«Mese e anno in ogni settimana» ora funziona anche con il livello Settimane disattivato.

## 0.5.3

percorso critico riscritto con il metodo CPM (passaggio in avanti e all'indietro, margine totale); nuova colonna opzionale «Margine».

## 0.5.2

corretto il registro delle revisioni, che aveva perso l'aspetto per un conflitto con le linee della baseline.

## 0.5.1

ogni periodo ha l'opzione «tinta di sfondo nella timeline»: disattivandola resta solo la linea nella fascia sopra i giorni.

## 0.5.0

calendario virtuale: il progetto può usare giorni numerati (G1, G2, …) senza date reali, con ancoraggio facoltativo a una data reale e conversione in entrambe le direzioni (annullabile).

## 0.4.4

indicatori delle date bloccate sulle barre (pulsante nella timeline); percorso critico evidenziabile; colonne di scostamento rispetto alla baseline attiva (Δ inizio, Δ fine, Δ durata); la rotella scorre solo in verticale (in orizzontale con Maiusc); pallino di stato del salvataggio (verde, giallo, arancione) e salvataggio automatico opzionale; tre temi rimossi e tre grigi aggiunti; marker non selezionabili.

## 0.4.3

marker e periodi creati dal tasto destro o dalla barra si modificano subito sul posto (nome); doppio clic sul periodo per rinominarlo; il ritardo dei collegamenti è un ovale al centro della freccia (verde se positivo, rosso se negativo).

## 0.4.2

periodi trascinabili e ridimensionabili nella fascia, colore scelto nella finestra stessa; marker con colonne allineate (occhio, cestino, Auto sempre presenti); il trascinamento dei marker non seleziona più il testo; la baseline attiva si può disattivare.

## 0.4.1

elenco dei marker riordinato (occhio, cestino, Auto, colonne allineate); la maschera dei 30 colori è ora ovunque: menu del tasto destro (scelta diretta), puntino colorato di ogni riga dell'elenco, pulsante nei comandi dell'elenco, pannello Dettagli e dialogo dei marker.

## Collegamenti tra task (FS, SS, FF, SF) con ritardo in giorni lavorativi

modalità Collegamento o tasto Maiusc, trascinamento tra i punti delle barre, frecce ortogonali, propagazione ai successori, conflitti evidenziati.

## Colori

30 tonalità per task, gruppi, milestone e marker, con opzione sui discendenti.

## Fascia dei periodi sotto i giorni, con evidenziazione del progetto attivo e tinta leggera nella griglia

Fascia dei periodi sotto i giorni, con evidenziazione del progetto attivo e tinta leggera nella griglia.

## Baseline

fino a dieci, linea grigia sotto le barre, rifacimento con conferma e rapporto delle modifiche copiabile.

## Nuovo tipo di item «Indicazione»; Ctrl+trascinamento verticale per riordinare dalla timeline; cursore per la dimensione dell'elenco; riepilogo delle scorciatoie (facoltativo)

Nuovo tipo di item «Indicazione»; Ctrl+trascinamento verticale per riordinare dalla timeline; cursore per la dimensione dell'elenco; riepilogo delle scorciatoie (facoltativo).

## Zone di ridimensionamento delle barre estese di alcuni pixel verso l'interno; con Ctrl premuto la barra si estende o si comprime in modo simmetrico dai due lati

Zone di ridimensionamento delle barre estese di alcuni pixel verso l'interno; con Ctrl premuto la barra si estende o si comprime in modo simmetrico dai due lati.

## Margini predefiniti della timeline

1 settimana prima e 2 dopo il lavoro.

## Il primo blocco disegnato porta la vista a circa un quarto della schermata, lasciando spazio a destra

Il primo blocco disegnato porta la vista a circa un quarto della schermata, lasciando spazio a destra.

## Assegnatario

i suggerimenti compaiono subito; digitando è selezionato il primo, con le frecce ci si sposta e con Invio o Tab si conferma.

## Accanto ad Annulla e Ripristina, frecce per l'elenco delle operazioni (si può tornare indietro o avanti di più passi) e pulsante Log con data e ora delle attività

Accanto ad Annulla e Ripristina, frecce per l'elenco delle operazioni (si può tornare indietro o avanti di più passi) e pulsante Log con data e ora delle attività.

## Dalla 0.3.2

nome Valico, quattro nuovi temi, anteprima del carattere al passaggio, festivi colorati, menu del tasto destro sui giorni, intestazione settimane con mese e anno, quattro stili dei gruppi, marker rielaborati.

