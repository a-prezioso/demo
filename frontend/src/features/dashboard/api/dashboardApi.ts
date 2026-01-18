import { Seat, SeatStatus } from "../types";

export interface SeatApiItem {
  id: string;
  name: string;
  status: "FREE" | "BUSY" | "UNAVAILABLE" | string;
  description?: string;
}

function mapStatus(status: string): SeatStatus {
  switch (status) {
    case "FREE":
    case "LIBERO":
      return "FREE";
    case "BUSY":
    case "OCCUPATO":
      return "BUSY";
    case "UNAVAILABLE":
    case "ND":
    case "NON_DISPONIBILE":
      return "UNAVAILABLE";
    default:
      return "UNAVAILABLE";
  }
}

export async function fetchSeats(signal?: AbortSignal): Promise<Seat[]> {
  const res = await fetch("/api/dashboard/seats", { signal });
  if (!res.ok) {
    throw new Error("FAILED_TO_FETCH_SEATS");
  }
  const data: SeatApiItem[] = await res.json();
  return data.map((it) => ({
    id: it.id,
    name: it.name,
    status: mapStatus(it.status),
    description: it.description,
  }));
}
