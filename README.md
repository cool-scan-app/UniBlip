# Uniblip

Mobile app project built with Expo and React Native.

## Tech Stack

- React Native + Expo
- TypeScript
- npm workspaces
- Node.js
- Hono Web Framework

## Repository Structure

```text
UniBlip/
├── apps/
│   ├── mobile/    # Expo mobile app
│   └── api/       # Hono + Node.js backend
├── packages/
│   └── shared/    # Shared code
├── package.json
├── package-lock.json
└── README.md
```

## Getting Started

### Prerequisites
- An Expo account
- Expo Go installed on your phone
- Node.js installed on your computer

### Expo
1. Create account on [Expo](https://expo.dev/signup).
2. Install and login to Expo Go on your phone.

Install dependencies from the repository root:

```bash
npm install
```

Log in via Expo CLI

```bash
npx expo login
```

Start the backend server:

```bash
npm run api-dev
```

Start the mobile app:

```bash
npm run dev
```

If PC and Phone not on the same network, run with tunnel instead:

```bash
npm run tunnel
```

The app starts in Expo tunnel mode. 

Scan the QR code with **Expo Go** on your phone.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Expo |
| `npm run tunnel` | Start Expo with tunnel |
| `npm run android` | Start for Android |
| `npm run ios` | Start for iOS |
| `npm run web` | Start for web |
| `npm run lint` | Run linting |

## Development

- Edit files in `apps/mobile`.
- Expo Fast Refresh updates the app when you save changes.
- Use npm for package management.
