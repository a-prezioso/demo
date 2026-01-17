// Minimal Express server exposing station status endpoint for the dashboard
// Swagger-like inline docs provided via JSDoc

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { StationService } from './modules/station/service/StationService';
import { toStationDTO } from './modules/station/domain/entities/Station';
import { HolidayService } from './modules/calendar/service/HolidayService';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const stationService = new StationService();
const holidayService = new HolidayService();

/**
 * GET /api/postazioni/status
 * Summary: Restituisce lo stato corrente delle 12 postazioni in un'unica risposta.
 * Response 200: [{ id: string, name: string, status: 'FREE'|'OCCUPIED'|'UNAVAILABLE', updatedAt?: string }]
 * Notes:
 * - L'endpoint è ottimizzato per una singola chiamata che restituisce tutte le postazioni.
 * - La dashboard può eseguire polling ogni X secondi; la cache è disabilitata tramite header.
 */
app.get('/api/postazioni/status', async (_req, res) => {
  try {
    const all = await stationService.getAll();
    res.setHeader('Cache-Control', 'no-store');
    return res.json(all.map(toStationDTO));
  } catch (e) {
    // avoid leaking internals
    return res.status(500).json({ error: 'Unable to fetch stations' });
  }
});

// For backward compatibility with current frontend demo path /api/stations
app.get('/api/stations', async (_req, res) => {
  try {
    const all = await stationService.getAll();
    res.setHeader('Cache-Control', 'no-store');
    return res.json(all.map(toStationDTO));
  } catch (e) {
    return res.status(500).json({ error: 'Unable to fetch stations' });
  }
});

/**
 * GET /api/calendar/disabled-dates?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns: { disabledDates: string[] }
 */
app.get('/api/calendar/disabled-dates', (req, res) => {
  try {
    const { from, to } = req.query as { from?: string; to?: string };
    if (!from || !to) return res.status(400).json({ error: 'from/to required' });
    const start = new Date(from + 'T00:00:00Z');
    const end = new Date(to + 'T00:00:00Z');
    const list = holidayService.getDisabledDates(start, end);
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ disabledDates: list });
  } catch (e) {
    return res.status(500).json({ error: 'Unable to compute disabled dates' });
  }
});

export default app;
