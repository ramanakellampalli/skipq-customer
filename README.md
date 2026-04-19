# SkipQ — Student App

> Skip the queue. Order ahead at your campus.

The student-facing mobile app for SkipQ. Browse campus vendors, place orders, and track them in real time — all before you even leave your seat.

Built with **React Native** (bare workflow), targeting Android and iOS.

---

## Features

- **Browse vendors** — see which stalls are open on your campus right now
- **Order ahead** — pick items, place your order, skip the wait
- **Live tracking** — real-time order status updates from the vendor
- **Order history** — view past orders with full pricing breakdown
- **Biometric login** — Face ID / fingerprint for returning users
- **Campus-based access** — your college email ties you to your campus automatically

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.78 (bare workflow) |
| Language | TypeScript |
| State | Zustand |
| Navigation | React Navigation (bottom tabs + stack) |
| API | Axios + react-native-config (env-based URL) |
| Auth | JWT + AsyncStorage + Keychain (biometrics) |

---

## Auth Flow

```
Register
  → name + email + password
  → OTP sent to college email (one-time verification)
  → Enter 6-digit code
  → Into the app ✓

Login
  → email + password
  → Into the app ✓  (biometric available after first login)
```

Students must use their campus-affiliated email (e.g. `@srmap.edu.in`). Non-campus emails are rejected at registration.

---

## Getting Started

### Prerequisites

- Node 22+
- For iOS: Xcode + CocoaPods
- For Android: Android Studio + JDK 21 + connected device or emulator

### Install

```bash
git clone https://github.com/ramanakellampalli/skipq-customer.git
cd skipq-customer
npm install

# iOS only
bundle exec pod install --project-directory=ios
```

### Environment

Create a `.env` file in the project root (gitignored):

```env
API_URL=https://skipq-core-dev-obh3j3jqpa-el.a.run.app
```

Point to the dev backend for local testing. Never commit this file.

### Run

```bash
# Start Metro bundler
npx react-native start

# Android (in a separate terminal)
npx react-native run-android

# iOS (in a separate terminal)
npx react-native run-ios
```

---

## Dev Testing

Use the **dev backend** and these test credentials to validate the full flow without a real campus email.

### Register a new student

1. Open the app → **Create Account**
2. Use any `@test.skipq.dev` email (e.g. `alice@test.skipq.dev`)
3. Set any password (min 8 characters)
4. On the OTP screen, enter **`123456`**
5. You're in

### Login

Use the email and password you registered with. Biometric login is available after the first successful sign-in.

---

## Project Structure

```
src/
├── api/            # Axios client + typed API calls
├── navigation/     # Bottom tab + auth stack navigators
├── screens/
│   ├── auth/       # LandingScreen, LoginScreen, RegisterScreen, OtpScreen
│   ├── home/       # HomeScreen (vendor list), VendorMenuScreen
│   ├── orders/     # OrdersScreen, OrderTrackingScreen
│   └── profile/    # ProfileScreen
├── store/          # Zustand: authStore, studentStore, cartStore
├── theme/          # Colors, typography, spacing, radius
├── types/          # Shared TypeScript types (Order, Vendor, MenuItem)
└── utils/          # Biometrics helper
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `API_URL` | Backend base URL (dev or prod) |

Managed via `react-native-config`. Values in `.env` are injected at build time.
