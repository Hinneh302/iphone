# HostelHub Backend Architecture & API Documentation

This directory contains the production-ready Node.js, Express, and MySQL backend for **HostelHub Ghana** (serving KNUST and nationwide university hostels).

---

## 1. Tech Stack
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js with TypeScript / ES Modules
- **Database**: MySQL 8.0+ via `mysql2/promise` with automatic JSON file fallback storage engine
- **Authentication**: JWT (JSON Web Tokens) with 7-day expiration & `bcryptjs` password hashing (salt rounds: 10)
- **File Uploads**: `multer` with MIME-type verification, 10MB limits, and unique filenames
- **Security & Middleware**: `cors`, parameterized SQL queries, role-based access control (`student`, `owner`, `admin`)

---

## 2. Environment Configuration (`.env`)
Create a `.env` file in the project root:

```env
# Server Port (Defaults to 3000)
PORT=3000

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hostelhub

# Authentication Secret
JWT_SECRET=your_jwt_secret_key_change_in_production
```

---

## 3. Database Schema Setup

The relational MySQL schema is stored in `database.sql`. To import it into MySQL:

```bash
mysql -u root -p < database.sql
```

### Relational Tables:
1. **`users`**: Students, hostel owners, and platform administrators.
2. **`hostels`**: Hostel profiles, coordinates, distances, prices in GH₵, amenities, and owner references.
3. **`rooms`**: Breakdown of 1, 2, 3, and 4 in a room units with pricing and availability.
4. **`bookings`**: Student booking requests, academic year periods, review stages, and payment deposit states.
5. **`inquiries`**: Direct student-to-owner messages and owner replies with timestamps.
6. **`favourites`**: Student saved hostels with composite primary key `(user_id, hostel_id)`.
7. **`reviews`**: Student ratings, verified badges, and written testimonials.
8. **`notifications`**: User notifications for booking approvals, new inquiries, and status updates.

---

## 4. API Endpoints

### Health Check
- `GET /api/health`
  - Returns backend status and database connection details.

---

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register student or hostel owner with hashed password | No |
| `POST` | `/api/auth/login` | Log in and receive signed JWT token | No |
| `GET` | `/api/auth/me` | Get current user profile details | Bearer JWT |

#### Example: Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Ama Serwaa",
  "email": "aserwaa@st.knust.edu.gh",
  "password": "SecurePassword123",
  "phone": "+233 24 999 1122",
  "role": "student",
  "university": "KNUST",
  "level": "Level 200"
}
```

---

### Hostels (`/api/hostels`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/hostels` | Filter & search hostels (`zone`, `uni`, `minPrice`, `maxPrice`, `search`, `roomType`) | No |
| `GET` | `/api/hostels/:id` | Get specific hostel with full details and reviews | No |
| `POST` | `/api/hostels` | Create a new hostel listing | Owner / Admin |
| `PUT` | `/api/hostels/:id` | Update hostel pricing, vacancies, amenities | Owner / Admin |
| `DELETE` | `/api/hostels/:id` | Remove a hostel listing | Owner / Admin |
| `POST` | `/api/hostels/upload` | Upload image (multipart/form-data) | Owner / Admin |
| `GET` | `/api/hostels/:id/reviews` | Fetch verified reviews for a hostel | No |
| `POST` | `/api/hostels/:id/reviews` | Submit a review for a hostel | Student |

---

### Bookings (`/api/bookings`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/bookings` | View user's bookings (students see theirs; owners see requests for their properties) | Bearer JWT |
| `GET` | `/api/bookings/:id` | View booking details | Bearer JWT |
| `POST` | `/api/bookings` | Submit room reservation request | Student |
| `PUT` | `/api/bookings/:id` | Approve, decline, or update payment status | Owner / Admin |
| `DELETE` | `/api/bookings/:id` | Cancel booking request | Student / Admin |

---

### Inquiries (`/api/inquiries`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/inquiries` | Fetch inquiries received (owners) or sent (students) | Bearer JWT |
| `POST` | `/api/inquiries` | Send an inquiry regarding a hostel | Bearer JWT |
| `PUT` | `/api/inquiries/:id/reply` | Submit owner reply to an inquiry | Owner / Admin |

---

### Favourites (`/api/favourites`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/favourites` | Get saved hostels for logged-in student | Student |
| `POST` | `/api/favourites` | Add hostel to favorites | Student |
| `DELETE` | `/api/favourites/:hostelId` | Remove hostel from favorites | Student |

---

### Admin Operations (`/api/admin`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/admin/stats` | High-level metrics: total hostels, active users, bookings, occupancy | Admin only |
| `GET` | `/api/admin/users` | List all platform registered users | Admin only |
| `PUT` | `/api/admin/users/:id/status` | Suspend or reactivate user | Admin only |
| `PUT` | `/api/admin/hostels/:id/verify` | Verify or reject hostel listing | Admin only |

---

## 5. Running the Backend
```bash
# Development server (runs Express + Vite on port 3000)
npm run dev

# Production build & start
npm run build
npm start
```
