# University Research Portal — Frontend

React + TypeScript frontend for the ABAC-secured University Research Portal.

## Quick Start

```bash
cp .env.example .env.local        # Set VITE_API_URL=http://localhost:3000/api
npm install
npm run dev
```

## Security Features
- JWT in memory (not localStorage), refresh token auto-rotation
- Password strength gauge (zxcvbn + UK Cyber Essentials checklist)
- hCaptcha widget (simulated — swap with @hcaptcha/react-hcaptcha)
- GDPR Article 7 consent checkbox (mandatory on login)
- MFA TOTP flow: QR → verify → backup codes
- Role-based + ABAC-aware route protection
- Computer Misuse Act 1990 footer notice

## UK Compliance
| Requirement | Where |
|---|---|
| UK GDPR Art. 7 consent | LoginPage.tsx - checkbox |
| UK GDPR Art. 30 records | AuditLogsPage.tsx - 730 day notice |
| Cyber Essentials MFA | MfaSetupPage.tsx - mandatory for ADMIN/STAFF |
| Cyber Essentials passwords | PasswordStrength.tsx - zxcvbn gauge |
| WCAG 2.1 AA | Focus rings, ARIA labels throughout |
