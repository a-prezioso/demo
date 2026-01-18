export type BookingsClientOptions = { baseUrl?: string };
export type UserBookingItemDto = {
  id: string;
  startDate: string; // ISO 8601 date (YYYY-MM-DD) or full datetime
  endDate: string | null; // null for date-only bookings
  deskId: string;
  status: string; // keep as string for UI
  notes?: string | null;
  tags?: string[] | null;
};

export type ListMyBookingsResponse = {
  items: UserBookingItemDto[];
  page: number;
  size: number;
  hasMore: boolean;
};

async function safeJson(res: Response): Promise<any | null> {
  try { return await res.json(); } catch { return null; }
}

export async function listMyBookings(
  params: { page?: number; size?: number } = {},
  opts?: BookingsClientOptions,
  accessToken?: string,
): Promise<ListMyBookingsResponse> {
  const base = opts?.baseUrl || '/api';
  const page = params.page ?? 1;
  const size = params.size ?? 20;
  const res = await fetch(`${base}/bookings/my?page=${page}&size=${size}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });
  if (!res.ok) {
    const data = await safeJson(res);
    const err = new Error(data?.error || `bookings.list_failed_${res.status}`);
    throw err;
  }
  const data = await res.json();
  if (Array.isArray(data)) {
    return { items: data as UserBookingItemDto[], page, size, hasMore: (data as any[]).length === size };
  }
  return data as ListMyBookingsResponse;
}
