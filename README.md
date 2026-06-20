# University Research Portal

A high-grade, secure authentication and resource management system designed for the **CET324 Advanced CyberSecurity Programming** module. Built natively on a robust **PERN** stack (PostgreSQL, Express, React, Node.js), this application employs enterprise-tier security mechanics tailored for institutional networks requiring zero-trust configurations.

## 🚀 Key Features

- **Multi-Factor Authentication (MFA):** Cryptographically secure TOTP 2FA (Time-based One-Time Passwords) integration via Speakeasy for maximum login layer resilience.
- **Attribute-Based Access Control (ABAC):** Granular security clearances where access strictly relies on matching an authenticated user's Clearance Tier, Role, and Department.
- **Hardened Authentication Workflow:** Fully stateless JWT (JSON Web Token) infrastructure. Access tokens are transient, whereas refresh tokens are rigorously persisted, rotated, and invalidated.
- **Defensive Cryptography:** Core user credentials strictly obfuscated utilizing `bcryptjs` with aggressive processing rounds to defeat brute force iteration vectors.
- **Modern Interface Aesthetics:** Sleek, glassmorphic UI built with standard React hooks, Framer Motion, and Tailwind CSS mimicking high-end enterprise applications.

## 🛠️ Technology Stack

**Frontend**

- React 19 + Vite (Rapid SPA processing)
- React Router v7 (Client-side routing)
- TailwindCSS (Utility-first styling)
- Zod + React Hook Form (Strict client-side payload evaluation)

**Backend**

- Node.js + Express 5 (Request distribution)
- PostgreSQL + Prisma ORM (Strict relational data mapping)
- jsonwebtoken (Stateless auth resolution)
- Nodemailer (Automated onboarding logic)

---

## ⚙️ Start-Up Process (Local Deployment)

### 1. Prerequisites

Ensure you have the following installed natively on your machine:

- **Node.js** (v20+ recommended)
- **PostgreSQL** (Running locally on default port 5432)

### 2. Backend Initialization

Open a terminal and navigate to the backend directory:

```bash
cd backend
npm install
```

Configure your environment variables manually in `backend/.env` (use the provided `.env.sample` for structural mapping). At an absolute minimum, ensure `DATABASE_URL` accurately points to your local PostgreSQL instance:

```dotenv
DATABASE_URL="postgresql://postgres:password@localhost:5432/university_db?schema=public"
```

Initialize your PostgreSQL database and generate the Prisma Client schemas:

```bash
npx prisma db push
npx prisma generate
```

**(Recommended) Seed the Database:**
If you require an immediate structural administrator, run the built-in seed logic which manually forcefully instantiates a Super Admin account (`admin@gmail.com`):

```bash
node src/utility/seedAdmin.js
```

Start the backend server:

```bash
npm run dev
# Running on http://localhost:8003
```

### 3. Frontend Initialization

Open a brand new terminal and navigate to the frontend directory:

```bash
cd frontend
npm install
npm run dev
```

The React frontend will instantly initialize and map itself to the backend natively. Open your web browser and navigate directly to:
**http://localhost:5173**

---

## 🛡️ Security Overview

This project was built to address real-world vulnerabilities identified in standard enterprise software:

1. **NoSQL / SQL Injection Check:** Prisma safely serializes inputs against schemas before execution.
2. **Payload Fuzzing Mitigation:** `Validators.js` uses `zod` to mercilessly reject incorrectly typed or unexpected incoming payload data structures at the controller level immediately.
3. **Information Disclosure Prevention:** The centralized Express global error handler strictly sanitises outgoing error responses so internal pathways or logic exceptions never leak back through HTTP responses in production settings.
4. **Session Hijacking Mitigation:** Short-lived access tokens require constant refreshing over HTTPS. Invalidating refresh tokens from the administrative portal immediately terminates rogue instances across the environment.
