# Calendario Festività Italiane e Giorni di Chiusura – Requisiti e Policy di Blocco Data

Versione: 1.0
Data: 18/01/2026
Autore: Product/Backend Team
Stato: Draft

---

1. Scopo

Definire l’elenco condiviso dei giorni in cui il coworking è chiuso e in cui il selettore data (frontend) e la validazione (backend) devono bloccare le prenotazioni. Comprende: domeniche, Pasquetta (data mobile), principali festività nazionali italiane e festività/locali e chiusure straordinarie configurabili.

---

2. Ambito e Applicazione

- Ambito: moduli/flow di prenotazione (postazioni, sale riunioni, servizi). Il blocco deve essere applicato in tutti i flussi di prenotazione.
- Livelli:
  - Frontend: disabilitare la selezione delle date non prenotabili nel datepicker e presentare messaggio/tooltip.
  - Backend: rifiutare richieste di prenotazione su date bloccate (autorità finale), restituendo errore di dominio (es. DATE_NOT_BOOKABLE/CLOSED_DAY).
- Timezone: Europe/Rome. Le date sono trattate come date “all‑day” (senza orario); evitare conversioni fuso che producano shift.

---

3. Elenco Festività e Regole di Blocco

3.1. Regola settimanale
- Domeniche: tutte le domeniche sono non prenotabili.

3.2. Festività mobili
- Pasquetta (Lunedì dell’Angelo): giorno successivo alla Pasqua (data calcolata annualmente). Nota: la domenica di Pasqua ricade già nella regola “domeniche”.

3.3. Festività nazionali fisse (blocco sempre attivo)
- 01/01 – Capodanno
- 06/01 – Epifania
- 25/04 – Anniversario della Liberazione
- 01/05 – Festa dei Lavoratori
- 02/06 – Festa della Repubblica
- 15/08 – Assunzione di Maria (Ferragosto)
- 01/11 – Ognissanti
- 08/12 – Immacolata Concezione
- 25/12 – Natale
- 26/12 – Santo Stefano

3.4. Festività/chiusure locali (parametrizzabili)
- Esempi: Santo Patrono locale (es. 07/12 Sant’Ambrogio a Milano; 29/06 Santi Pietro e Paolo a Roma) o chiusure aziendali straordinarie (ponti, manutenzioni).
- Devono essere configurabili senza rilasci di codice.

Note: Se una festività cade di domenica è comunque bloccata; evitare duplicati nella comunicazione verso l’utente.

---

4. Parametrizzazione e Configurazione

4.1. MVP (subito)
- Lista fissa lato backend delle festività nazionali fisse (3.3) + calcolo Pasquetta (3.2) per gli anni supportati.
- Flag di configurazione per attivare/disattivare il blocco domenicale (default: attivo).
- Possibilità di aggiungere chiusure locali/straordinarie da file di config.

4.2. File di configurazione proposto (backend/resources/config/holidays.yml)

Esempio struttura:

```yml
# Festività nazionali fisse (formato MM-dd)
fixed:
  - "01-01"
  - "06-01"
  - "04-25"
  - "05-01"
  - "06-02"
  - "08-15"
  - "11-01"
  - "12-08"
  - "12-25"
  - "12-26"

# Chiusure aggiuntive puntuali (formato yyyy-MM-dd)
closed_dates:
  - "2026-04-30" # esempio ponte
  - "2026-12-24" # vigilia (se chiuso)

# Eccezioni di apertura (riabilita date altrimenti chiuse)
open_exceptions:
  - "2026-12-26" # se si decide di aprire straordinariamente

# Festività locali (stessa semantica di closed_dates con descrizione)
local:
  - date: "2026-06-29"
    name: "SS. Pietro e Paolo (Roma)"
    scope: "rome_space" # opzionale: ambito/sede
```

4.3. Variabili ambiente proposte
- COWORKING_CLOSED_SUNDAYS=true|false (default: true)
- HOLIDAYS_CONFIG_PATH=backend/resources/config/holidays.yml

4.4. Evoluzione futura (opzionale)
- Tabella DB amministrabile (es. admin.holidays) con campi: id, date, name, scope (global/sede), type (FIXED/MOBILE/LOCAL), active, created_at, updated_at. Interfaccia admin per gestione.

---

5. Range Temporale di Interesse

- Supporto: anno corrente e anno successivo (rolling 24 mesi). Questo copre le prenotazioni tipiche e consente pre‑computazione efficiente.
- Frontend: caricare e memorizzare le date bloccate per finestre (es. mese corrente +/- 2 mesi) o scaricare via API.
- Backend: pre‑calcolo in memoria set di date bloccate per i 2 anni e refresh a fine anno.

---

6. API/Condivisione Dati (raccomandata)

- Endpoint: GET /api/config/closed-days?from=yyyy-MM-dd&to=yyyy-MM-dd
- Risposta: array di date ISO (yyyy-MM-dd) + opzionale descrizione/motivazione.
- Benefici: singola fonte di verità backend, FE semplice e coerente con la validazione server.

---

7. Regole di Blocco e UX

- Frontend datepicker:
  - Disabilitare le date bloccate (attributo disabledDays o equivalente).
  - Tooltip o nota “Chiuso”/descrizione festività.
  - Messaggio contestuale su selezione non valida.
- Backend:
  - Validazione in service di prenotazione: rifiutare se la data rientra nel set bloccato; codice errore standard (es. DATE_NOT_BOOKABLE) e messaggio localizzato.
- Edge case:
  - Doppie regole (domenica + festività): gestire come singolo blocco.
  - Timezone: usare sempre Europe/Rome; confronto su solo componente di data (no orario).
  - Finestra: impedire selezioni al di fuori dell’intervallo consentito di prenotazione (se definito da business).

---

8. Esempi – Pasquetta (anni di riferimento)

- 2025: Pasqua 2025-04-20 → Pasquetta 2025-04-21
- 2026: Pasqua 2026-04-05 → Pasquetta 2026-04-06

---

9. Criteri di Accettazione

- Il datepicker non permette di selezionare domeniche, Pasquetta e le festività elencate.
- Una prenotazione via API in una data bloccata viene rifiutata con errore coerente.
- È possibile aggiungere almeno una chiusura locale via file di config senza deploy di codice.
- Il comportamento è coerente per anno corrente e successivo.

---

10. Note Implementative (indicazioni rapide)

- Algoritmo Pasqua: implementare in backend una funzione computeEaster(year) (algoritmo di Meeus/Gregorian) e derivare Pasquetta = Pasqua + 1 giorno.
- Pre‑computo: generare Set<string> (yyyy-MM-dd) per confronto O(1).
- Formato date: sempre ISO 8601 (yyyy-MM-dd). Nessun tempo/offset.
- Localizzazione messaggi: “Giorno di chiusura: {descrizione}”.
