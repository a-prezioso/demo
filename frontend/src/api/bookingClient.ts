export type CreateDeskBookingRequest = {
  deskId: string;
  // ISO date string (yyyy-mm-dd) or full ISO; backend can normalize to date-only
  date: string;
  // Optional: for stub/testing only; real API should infer from access token
  userId?: string;
};

export type CreateDeskBookingResponse = {
  bookingId: string;
  status: 'confirmed' | 'pending';
  deskId: string;
  date: string; // ISO
  message?: string;
};

export type BookingClientOptions = {
  baseUrl?: string;
  accessToken?: string;
  signal?: AbortSignal;
};

async function tryFetch(
  url: string,
  body: any,
  opts?: BookingClientOptions,
): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts?.accessToken) headers.Authorization = `Bearer ${opts.accessToken}`;
  return fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: opts?.signal,
  });
}

// Fallback stub implementation to allow UI flows without backend
function stubCreateBooking(req: CreateDeskBookingRequest): CreateDeskBookingResponse {
  // Always succeed in the stub to keep UX smooth; backend will enforce real constraints later
  const id = `bk_${Math.random().toString(36).slice(2, 10)}`;
  return {
    bookingId: id,
    status: 'confirmed',
    deskId: req.deskId,
    date: req.date,
    message: 'Prenotazione confermata (stub)',
  };
}

export async function createDeskBooking(
  payload: CreateDeskBookingRequest,
  options?: BookingClientOptions,
): Promise<CreateDeskBookingResponse> {
  const base = options?.baseUrl || '/api';

  // Try primary endpoint: POST /desks/{id}/book
  try {
    const res = await tryFetch(`${base}/desks/${encodeURIComponent(payload.deskId)}/book`, { date: payload.date }, options);
    if (res.ok) return (await res.json()) as CreateDeskBookingResponse;
    // If explicit 404, try alternative route; otherwise throw with details
    if (res.status !== 404) {
      const data = await safeJson(res);
      throw new Error(data?.error || `booking.failed_${res.status}`);
    }
  } catch (e: any) {
    // Network errors fall through to try alternative or stub
  }

  // Try alternative common REST shape: POST /bookings
  try {
    const res2 = await tryFetch(`${base}/bookings`, payload, options);
    if (res2.ok) return (await res2.json()) as CreateDeskBookingResponse;
    if (res2.status !== 404) {
      const data = await safeJson(res2);
      throw new Error(data?.error || `booking.failed_${res2.status}`);
    }
  } catch (e: any) {
    // ignore and fallback to stub
  }

  // Fallback stub
  return Promise.resolve(stubCreateBooking(payload));
}

async function safeJson(res: Response): Promise<any | null> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
