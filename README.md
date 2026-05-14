# ActionLMS

A modular Learning Management System — MVP authentication layer.

## Stack
- **Frontend**: React 18 + Vite + React Router 6
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Auth**: JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`)

---

## Quick Start

### 1. Database

Create the database and run the schema:

```bash
psql -U postgres -c "CREATE DATABASE lms_db;"
psql -U postgres -d lms_db -f backend/database/init.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env        # then fill in DATABASE_URL and JWT_SECRET
npm install
npm run dev                 # http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

---

## API Reference

| Method | Endpoint              | Auth? | Description              |
|--------|-----------------------|-------|--------------------------|
| POST   | `/api/auth/register`  | No    | Create a new account     |
| POST   | `/api/auth/login`     | No    | Login, receive JWT       |
| GET    | `/api/auth/me`        | Yes   | Get current user profile |
| GET    | `/api/health`         | No    | Server health check      |

### Register payload
```json
{ "name": "Jane Doe", "email": "jane@example.com", "password": "secret123", "role": "student" }
```

### Login payload
```json
{ "email": "jane@example.com", "password": "secret123" }
```

---

## Roles

| Role         | Assigned via          |
|--------------|-----------------------|
| `student`    | Registration form     |
| `instructor` | Registration form     |
| `admin`      | Direct DB update only |

To promote a user to admin:
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

---

## Using `authorize` Middleware

```js
const authenticate = require('./middleware/authenticate');
const authorize    = require('./middleware/authorize');

// Admin only
router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);

// Instructors and admins
router.post('/courses', authenticate, authorize('admin', 'instructor'), createCourse);
```
