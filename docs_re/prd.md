# Portale Web per la Gestione dei Collaboratori Esterni

## Product Requirements Document (PRD) — POC/MVP

**Versione:** 1.0  
**Data:** 04/01/2026  
**Stato:** Bozza

---

## 1. Scopo del Documento

Il presente documento descrive i requisiti funzionali di un portale web destinato alla gestione dei collaboratori esterni di una azienda IT. Il portale ha l'obiettivo di supportare i processi di accreditamento, gestione delle competenze, assegnazione degli ordini di lavoro e caricamento delle fatture, garantendo tracciabilità e semplificazione operativa.

---

## 2. Contesto e Obiettivi

### 2.1 Contesto

L'azienda IT eroga servizi al cliente finale e integra professionisti esterni quando necessario. L'attuale gestione (email e documenti non strutturati) rende complessa la tracciabilità e aumenta le attività manuali.

### 2.2 Obiettivi

- **Centralizzare** accreditamento, profili, CV, ordini di lavoro e fatture (gestione documentale)
- **Migliorare** tracciabilità, controllo operativo e reperibilità delle informazioni
- **Ridurre** attività manuali e comunicazioni non strutturate tra azienda IT e collaboratori

---

## 3. Attori e Ruoli

### 3.1 Attori Coinvolti

| Attore | Descrizione |
|--------|-------------|
| **Professionista Esterno** | Soggetto che opera come libero professionista |
| **Azienda (Società Fornitrice)** | Soggetto che opera come azienda con uno o più collaboratori |
| **Azienda IT (Operatore)** | Soggetto che gestisce accreditamento, ordini di lavoro e verifica documenti |
| **Amministratore di Sistema** | Ruolo tecnico per la gestione del portale (utenti, ruoli, configurazioni, audit) |

### 3.2 Ruoli Applicativi (RBAC)

| Ruolo | Descrizione |
|-------|-------------|
| `EXTERNAL_OWNER` | Professionista singolo o referente azienda fornitrice (gestione profilo e documenti; visibilità su ordini e fatture) |
| `EXTERNAL_COLLABORATOR` | Collaboratore associato a un'azienda (gestione del proprio profilo/CV; visibilità sugli ordini assegnati) |
| `IT_OPERATOR` | Operatore azienda IT (valida accreditamenti; crea/assegna ordini; verifica fatture; consulta CV) |
| `SYS_ADMIN` | Amministratore di sistema (gestione utenti/ruoli; configurazioni; log; sicurezza) |

---

## 4. Ambito e Perimetro (MVP/POC)

### 4.1 Funzionalità In Scope

1. Accreditamento professionista (singolo o azienda)
2. Gestione collaboratori associati (solo per account azienda)
3. Caricamento e consultazione CV e competenze
4. Ricezione e gestione Ordini di Lavoro (OdL)
5. Caricamento e gestione documentale delle fatture

> **Nota:** Portale operativo, non amministrativo: non sostituisce sistemi contabili o di pagamento.

### 4.2 Funzionalità Out of Scope

- Pagamenti e gestione contabile
- Integrazioni con ERP / sistemi fiscali / SDI
- Firma digitale e conservazione sostitutiva
- Gestione IVA/ritenute e controlli fiscali
- Reporting avanzato (oltre a filtri e liste base)

---

## 5. Stati e Regole di Processo

### 5.1 Stato Accreditamento (Professionista/Azienda/Collaboratore)

```
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED / REJECTED
```

- Solo lo stato `SUBMITTED` è valutabile da `IT_OPERATOR`
- `REJECTED` richiede motivazione e consente un nuovo invio dopo aggiornamenti
- `APPROVED` abilita l'accesso alle funzioni operative (OdL, fatture)

### 5.2 Stato Ordine di Lavoro (OdL)

```
CREATED → SENT → ACKNOWLEDGED → IN_PROGRESS → DONE → ARCHIVED
```

> **Nota POC:** Per il POC è sufficiente implementare `CREATED`, `SENT` e `ACKNOWLEDGED`.

### 5.3 Stato Fattura (gestione documentale)

```
UPLOADED → UNDER_CHECK → ACCEPTED / REJECTED
```

- `REJECTED` richiede motivazione
- L'utente può caricare una nuova versione come nuovo documento (non sovrascrittura)

---

## 6. Requisiti Funzionali (per Modulo)

### 6.1 Modulo A — Registrazione e Accreditamento

| ID | Requisito |
|----|-----------|
| RF-A1 | Registrazione con email e password (SSO opzionale in fasi successive) |
| RF-A2 | Scelta tipo account: Professionista / Azienda |
| RF-A3 | Compilazione profilo con dati minimi (anagrafica, contatti, competenze principali) |
| RF-A4 | Caricamento documenti (minimo: CV; opzionali: documento identità, visura, NDA) |
| RF-A5 | Invio richiesta di accreditamento (`SUBMITTED`) |
| RF-A6 | Backoffice IT: lista richieste, dettaglio, approvazione/rigetto con motivazione |
| RF-A7 | Notifiche email: conferma invio richiesta, esito approvazione/rigetto |

### 6.2 Modulo B — Gestione Collaboratori (solo account Azienda)

| ID | Requisito |
|----|-----------|
| RF-B1 | Creazione collaboratore (nome, email) e invito via email |
| RF-B2 | Collaboratore completa profilo e carica CV |
| RF-B3 | L'azienda vede elenco collaboratori e relativi stati |
| RF-B4 | IT_OPERATOR può approvare azienda e/o singoli collaboratori (granularità definibile per POC) |

### 6.3 Modulo C — CV e Competenze

| ID | Requisito |
|----|-----------|
| RF-C1 | Upload CV (PDF/DOCX) con conservazione dell'ultimo CV caricato (storico opzionale) |
| RF-C2 | Consultazione e download CV da parte di IT_OPERATOR |
| RF-C3 | Gestione competenze tramite tag (e livello 1–5 opzionale) |
| RF-C4 | Ricerca/filtri lato IT (skill, stato accreditamento, disponibilità opzionale) |

### 6.4 Modulo D — Ordini di Lavoro (OdL)

| ID | Requisito |
|----|-----------|
| RF-D1 | Creazione OdL con titolo, descrizione, progetto/cliente (testo), date (opzionali), allegati |
| RF-D2 | Assegnazione OdL a professionista o collaboratore specifico |
| RF-D3 | Invio OdL (`SENT`) con notifica email |
| RF-D4 | Area esterna: lista OdL assegnati, dettaglio, download allegati |
| RF-D5 | Presa visione OdL (`ACKNOWLEDGED`) e commento opzionale |

### 6.5 Modulo E — Fatture (solo documentale)

| ID | Requisito |
|----|-----------|
| RF-E1 | Upload fattura (PDF) associata a uno o più OdL, oppure a un periodo (mese/anno) per POC semplificato |
| RF-E2 | Metadati minimi: numero fattura, data, importo (informativo), periodo di riferimento |
| RF-E3 | Verifica IT: `ACCEPTED` / `REJECTED` con motivazione |
| RF-E4 | Archivio fatture con filtri (stato, periodo, risorsa) |

---

## 7. Pagine / Schermate (MVP)

### 7.1 Area Esterna

- Login / Registrazione
- Profilo + Documenti (CV)
- Collaboratori (solo azienda)
- Ordini di Lavoro (lista + dettaglio)
- Fatture (upload + storico)

### 7.2 Backoffice Azienda IT

- Richieste accreditamento (lista + dettaglio)
- Anagrafica risorse (ricerca/filtri, CV)
- Gestione OdL (crea, lista, dettaglio)
- Gestione fatture (verifica, lista)

### 7.3 Amministrazione

- Utenti e ruoli
- Configurazioni base (policy upload, template email)
- Audit log

---

## 8. Requisiti Non Funzionali (minimi)

| Area | Requisito |
|------|-----------|
| **Sicurezza** | Autenticazione, gestione sessione, protezione endpoint |
| **Autorizzazioni** | RBAC coerente su UI ed API |
| **Audit** | Tracciamento azioni sensibili (approve/reject, download documenti) |
| **Upload** | Whitelist estensioni, size limit, storage segregato per tenant/ruolo (minimo logico) |
| **Privacy** | Informative GDPR e retention documentale minima (da definire) |
| **Usabilità** | Liste paginabili e filtri base |

---

## 9. Criteri di Done (POC)

- [ ] Flusso end-to-end completo: registrazione → submit → approve → OdL assegnato → upload fattura → accept/reject
- [ ] RBAC verificato con almeno 4 account di test (ruoli principali)
- [ ] Audit log attivo per azioni critiche
- [ ] Documentazione minima (README + descrizione flussi o elenco endpoint)
