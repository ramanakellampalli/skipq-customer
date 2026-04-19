<p align="center">
  <h1 align="center">⚡ SkipQ — Student App</h1>
  <p align="center">Skip the queue. Order ahead at your campus.</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.78-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Zustand-state-764ABC?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20iOS-brightgreen?style=for-the-badge" />
</p>

---

## What is SkipQ?

SkipQ lets university students **order food ahead** from campus vendors — before they even leave the classroom. No queuing, no waiting, just pick up when it's ready.

This is the **student-facing mobile app**.

---

## Features

| | |
|---|---|
| 🏫 **Campus-aware** | Your college email ties you to your campus automatically |
| 🛒 **Order ahead** | Browse open vendors, build a cart, place your order |
| 📡 **Live tracking** | Real-time order status — accepted, preparing, ready |
| 🧾 **Order history** | Full receipt with GST and fee breakdown |
| 🔐 **Biometric login** | Face ID / fingerprint after your first sign-in |

---

## Auth Flow

```
  ┌─ REGISTER ──────────────────────────────────────────┐
  │                                                      │
  │  Name + Campus Email + Password                      │
  │              ↓                                       │
  │  OTP sent to email  →  Enter 6-digit code            │
  │              ↓                                       │
  │          Into the app ✓                              │
  └──────────────────────────────────────────────────────┘

  ┌─ LOGIN ─────────────────────────────────────────────┐
  │                                                      │
  │  Email + Password  →  Into the app ✓                 │
  │  (or biometric after first login)                    │
  └──────────────────────────────────────────────────────┘
```

> OTP is a **one-time email verification** on registration only — not required on every login.

Students must use their campus-affiliated email (e.g. `@srmap.edu.in`). Non-campus emails are rejected at registration.

---

## Getting Started

### Prerequisites

- Node 22+
- **iOS:** Xcode + CocoaPods
- **Android:** Android Studio + JDK 21 + emulator or physical device

### Install

```bash
git clone https://github.com/ramanakellampalli/skipq-customer.git
cd skipq-customer
npm install

# iOS only
bundle exec pod install --project-directory=ios
```

### Environment

Create `.env` in the project root (gitignored):

```env
API_URL=https://skipq-core-dev-obh3j3jqpa-el.a.run.app
```

### Run

```bash
# Start Metro
npx react-native start

# Android
npx react-native run-android

# iOS
npx react-native run-ios
```

---

## Dev Testing

Use the **dev backend** — no real campus email required.

### ✅ Register a new student

1. Open app → **Create Account**
2. Use any `@test.skipq.dev` email — e.g. `alice@test.skipq.dev`
3. Set any password (min 8 characters)
4. On the OTP screen → enter **`123456`**
5. You're in 🎉

### ✅ Login

Use the email and password from registration. Biometric login becomes available after your first successful sign-in.

---

## Project Structure

```
src/
├── api/            # Axios client + typed API calls
├── navigation/     # Bottom tab + auth stack navigators
├── screens/
│   ├── auth/       # Landing, Login, Register, OTP verify
│   ├── home/       # Vendor list, vendor menu
│   ├── orders/     # Order list, order tracking
│   └── profile/    # Profile + logout
├── store/          # Zustand: auth, student data, cart
├── theme/          # Colors, typography, spacing
├── types/          # Shared TypeScript types
└── utils/          # Biometrics helper
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `API_URL` | Backend base URL |

Managed via `react-native-config`. Set in `.env` — injected at build time.
