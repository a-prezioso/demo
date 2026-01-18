SmartDesk - Desk Bookings API

Endpoint
- POST /api/prenotazioni

Request body
- userId (string, required)
- deskId (string, required)
- date (YYYY-MM-DD, required)
- timeSlot (string, optional)

Business rules
- Validate closed days using HolidaysService (Sundays, Easter Monday, national fixed holidays, extra closed dates). If closed, returns 422 with code COWORKING_CLOSED.
- Prevent conflicts for same desk, same date (and same timeSlot when provided). If conflict, returns 409 with code BOOKING_CONFLICT.

Responses
- 201 { success: true, data: BookingResponseDTO }
- 422 { success: false, error: { code: 'COWORKING_CLOSED', message } }
- 409 { success: false, error: { code: 'BOOKING_CONFLICT', message } }
- 400 { success: false, error: { code: 'BAD_REQUEST', details } }

Notes
- Persistence provided via repository pattern (InMemoryBookingRepository for tests; PrismaBookingRepository for DB).
- Migrations included in core/db/migrations/004__create_bookings.sql
