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
 * GET /api/calendar/disabled-dates
 * Query params:
 *  - from: YYYY-MM-DD (inclusive)
 *  - to:   YYYY-MM-DD (inclusive)
 * Rules:
 *  - Validate formats and range (from <= to)
 *  - Enforce max range length (default 366 days) via env CALENDAR_MAX_RANGE_DAYS
 * Response 200: { disabledDates: string[] }
 * Errors:
 *  - 400: invalid parameters
 *  - 500: internal errors
 */
app.get('/api/calendar/disabled-dates', (req, res) => {
  const from = (req.query.from as string) || '';
  const to = (req.query.to as string) || '';

  const isValidFormat = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
  const daysInMonth = (y: number, m: number) => [0,31, (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0) ? 29 : 28, 31,30,31,30,31,31,30,31,30,31][m];
  const isRealDate = (s: string) => {
    if (!isValidFormat(s)) return false;
    const [yy, mm, dd] = s.split('-').map(n => parseInt(n, 10));
    if (mm < 1 || mm > 12) return false;
    const dim = daysInMonth(yy, mm);
    return dd >= 1 && dd <= dim;
  };
  const parseToUTC = (s: string) => {
    const [y, m, d] = s.split('-').map(n => parseInt(n, 10));
    return Date.UTC(y, m - 1, d);
  };

  if (!from || !to) {
    return res.status(400).json({ error: 'Missing required query parameters: from, to' });
  }
  if (!isRealDate(from) || !isRealDate(to)) {
    return res.status(400).json({ error: 'Invalid date format or value. Use YYYY-MM-DD and valid calendar dates.' });
  }

  // Ensure from <= to (lexicographical works for YYYY-MM-DD)
  if (from > to) {
    return res.status(400).json({ error: 'Parameter from must be <= to' });
  }

  // Enforce maximum range length (inclusive)
  const maxRangeDays = Number.parseInt(process.env.CALENDAR_MAX_RANGE_DAYS || '366', 10);
  try {
    const diffDays = Math.floor((parseToUTC(to) - parseToUTC(from)) / 86_400_000) + 1; // inclusive
    if (diffDays > maxRangeDays) {
      return res.status(400).json({ error: `Requested range too large. Max allowed is ${maxRangeDays} days.` });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid date values' });
  }

  try {
    const disabledDates = holidayService.getDisabledDates(from, to);
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ disabledDates });
  } catch (e) {
    return res.status(500).json({ error: 'Unable to compute disabled dates' });
  }
});

// Export app for testing; start only if run directly
export { app };

if (require.main === module) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] listening on :${port}`);
  });
}
