# AI Chat Bot — College Information & Student Assistant System

A full-stack campus information portal and real-time Gemini AI Student Assistant built with React 19, TypeScript, Tailwind CSS v4, Express, and Firebase (Authentication & Firestore).

## Features

- **Unified Access Gateway**: Single-page Student Login, Student Registration, and Admin Login with Google Sign-In.
- **Student Dashboard**: Student Profile, Attendance Tracker with margin indicators, Fee Ledger with payment receipts (`₹`), Weekly Class Timetable, Faculty Directory, College Timings, Official Notices, Scholarships, and Placement Drives with CGPA eligibility checks.
- **Real-Time AI Student Assistant**: Streaming Gemini assistant (`/api/assistant/chat`) grounded in live campus schedules, notices, and student records, with automatic Google Search redirection for non-academic questions.
- **Admin Control Center**: Manage registered students, roles, attendance records, fee assessments, campus catalogs, and global AI/system settings.
- **Light & Dark Theme**: Instant Light/Dark mode toggle across every screen.

## Requirements

- **Node.js `>= 22.18.0`** (runs `server.ts` natively with `npm start`)
- **Gemini API Key** (`GEMINI_API_KEY`)
- **Firebase Project** (already configured in `firebase-applet-config.json` with `firestore.rules`)

## Local Development

```bash
npm install
cp .env.example .env
# Add your GEMINI_API_KEY to .env
npm run dev
```

Open `http://localhost:3000`.

## Deploying from GitHub

Because the AI Assistant uses a server-side Express API (`/api/assistant/chat`) to protect `GEMINI_API_KEY`, deploy this project to any Node.js or container host (static-only hosts like GitHub Pages cannot run the backend API).

### Option 1: Render (Blueprint Included)

1. Push this repository to GitHub.
2. In Render, click **New + → Blueprint** and select your GitHub repository (`render.yaml` is automatically detected).
3. Enter your `GEMINI_API_KEY` when prompted and deploy.

### Option 2: Railway / Google Cloud Run / Docker

- **Docker**: A production `Dockerfile` is included on port `3000`.
- **Node Buildpack**:
  - **Build command:** `npm install && npm run build`
  - **Start command:** `npm start`
  - **Environment variables:**
    - `NODE_ENV=production`
    - `GEMINI_API_KEY=<your-gemini-api-key>`

### Important: Authorize Your Live Domain in Firebase

After deploying to your live URL (for example `https://your-app.onrender.com`), open the [Firebase Console](https://console.firebase.google.com/) for your project:

1. Go to **Authentication → Settings → Authorized domains**.
2. Click **Add domain** and enter your deployed hostname.

Without this step, Google Sign-In will fail with `auth/unauthorized-domain` on the deployed site.
