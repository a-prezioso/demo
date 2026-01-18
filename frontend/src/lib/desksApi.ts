// Simple API client for desks endpoint
export type DeskStatus = 'FREE' | 'OCCUPIED' | 'UNAVAILABLE';
export interface Desk { id: string; name: string; status: DeskStatus }
export interface DesksResponseDTO {
  success: boolean;
  data?: {
    total: number;
    expected: number;
    missing: number;
    items: Desk[];
    statusCount: Record<DeskStatus, number>;
  };
  error?: { message: string };
}

export async function fetchDesks(baseUrl = ''): Promise<DesksResponseDTO['data']> {
  const res = await fetch(`${baseUrl}/api/desks`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const body: DesksResponseDTO = await res.json();
  if (!body.success) {
    throw new Error(body.error?.message || 'API error');
  }
  return body.data!;
}
