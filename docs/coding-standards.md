# Standard di Codifica - SmartDesk Coworking MVP

**Versione:** 2.0  
**Data:** 19/01/2026  
**Autore:** DEV Agent  

---

## 1. Introduzione

Standard di codifica essenziali per il progetto SmartDesk Coworking MVP.  
Stack: Node.js + Express + React + TypeScript + PostgreSQL.

---

## 2. Formattazione

- **Indentazione:** 2 spazi
- **Max line length:** 100 caratteri
- **Encoding:** UTF-8
- **Punto e virgola:** obbligatorio
- **Virgolette:** singole `'`

### Prettier Config
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

---

## 3. Naming Conventions

### 3.1. File e Cartelle
```
kebab-case per file:     auth.controller.ts, booking.service.ts
PascalCase per React:    LoginPage.tsx, DeskGrid.tsx
```

### 3.2. Codice
```typescript
// Classi e Tipi: PascalCase
class BookingService {}
interface BookingDto {}
type DeskStatus = 'AVAILABLE' | 'BOOKED';

// Funzioni e variabili: camelCase
function createBooking() {}
const deskNumber = 1;
const isAvailable = true;

// Costanti: UPPER_SNAKE_CASE
const MAX_BOOKINGS_PER_DAY = 1;
const JWT_EXPIRY_HOURS = 8;
```

---

## 4. Struttura Backend

### 4.1. Pattern Controller → Service → Repository

```typescript
// Controller: gestisce HTTP
router.post('/bookings', async (req, res) => {
  const booking = await bookingService.create(req.body);
  res.status(201).json(booking);
});

// Service: logica business
class BookingService {
  async create(data: CreateBookingDto) {
    // Validazioni business
    if (await this.hasBookingOnDate(data.userId, data.date)) {
      throw new Error('Already booked');
    }
    return this.repository.create(data);
  }
}

// Repository: accesso dati
class BookingRepository {
  async create(data) {
    return prisma.booking.create({ data });
  }
}
```

### 4.2. Gestione Errori

```typescript
// Custom error classes
class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(404, message);
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(400, message);
  }
}
```

---

## 5. Struttura Frontend (React)

### 5.1. Componenti

```tsx
// Functional components con TypeScript
interface DeskProps {
  number: number;
  isAvailable: boolean;
  onSelect: (id: number) => void;
}

export function Desk({ number, isAvailable, onSelect }: DeskProps) {
  return (
    <button
      className={isAvailable ? 'bg-green-500' : 'bg-red-500'}
      onClick={() => isAvailable && onSelect(number)}
      disabled={!isAvailable}
    >
      Desk {number}
    </button>
  );
}
```

### 5.2. Hooks Custom

```tsx
// useAuth.ts
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  
  const login = async (email: string, password: string) => {
    const { token, user } = await authApi.login(email, password);
    localStorage.setItem('token', token);
    setUser(user);
  };
  
  return { user, login, logout };
}
```

---

## 6. API Calls

```typescript
// api/bookings.ts
const API_URL = import.meta.env.VITE_API_URL;

export async function getBookings(): Promise<Booking[]> {
  const res = await fetch(`${API_URL}/bookings`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}
```

---

## 7. Validazione

### Backend (Zod)
```typescript
import { z } from 'zod';

const createBookingSchema = z.object({
  deskId: z.number().min(1).max(6),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// Middleware
function validate(schema: z.ZodSchema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ errors: result.error.errors });
    }
    next();
  };
}
```

---

## 8. Testing

### Backend (Jest)
```typescript
describe('BookingService', () => {
  it('should create booking for available desk', async () => {
    const booking = await bookingService.create({
      userId: 'user-1',
      deskId: 1,
      date: '2026-01-20',
    });
    expect(booking.status).toBe('ACTIVE');
  });

  it('should reject weekend booking', async () => {
    await expect(
      bookingService.create({ deskId: 1, date: '2026-01-25' }) // Saturday
    ).rejects.toThrow('Weekend not allowed');
  });
});
```

### Frontend (React Testing Library)
```tsx
test('shows 6 desks', () => {
  render(<DeskGrid desks={mockDesks} />);
  expect(screen.getAllByRole('button')).toHaveLength(6);
});
```

---

## 9. Code Review Checklist

- [ ] Naming conventions rispettate
- [ ] No business logic nei controller
- [ ] Errori gestiti con classi custom
- [ ] Input validato con Zod
- [ ] TypeScript types definiti (no `any`)
- [ ] Test per nuova funzionalità
