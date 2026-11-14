# MotoTrack Wiki

MotoTrack Wiki is an Android app for motorcycle owners: track your bikes, keep their documents, look up reference guides, and get troubleshooting help. It is built with Expo and React Native in TypeScript, using Expo Router for file-based navigation.

> **Scope:** Android only. iOS and web are not supported targets; leftover platform files may exist but are not tested or maintained.

> **Status:** early development. Authentication and the tab shell are in place; each tab currently shows a placeholder (see [Roadmap](#roadmap)).

## Features

- **Sign-in** with Firebase Authentication (email/password and Google); the tabs are only reachable when signed in
- **Five tabs** using `NativeTabs` from `expo-router/native-tabs` with Material Symbols icons:
  - **Home** — overview of your bikes and recent activity
  - **Garage** — the motorcycles you own
  - **Vault** — registration, insurance, and receipts
  - **Wiki** — motorcycle reference and how-to guides
  - **AI Mechanic** — troubleshooting assistant
- **File-based routing** with Expo Router and typed routes enabled
- **Light and dark mode** that follows the system setting (`userInterfaceStyle: automatic`)
- **Themed components** — `ThemedText` and `ThemedView` read colors from shared design tokens
- **Animations** with `react-native-reanimated` (animated splash overlay)
- **React Compiler** enabled through Expo experiments
- **Path aliases** — `@/*` maps to `src/*` and `@/assets/*` maps to `assets/*`

## Tech stack

| Area | Library / version |
| --- | --- |
| Framework | Expo SDK 58 (`expo ~58.0.23`) |
| Runtime | React Native 0.88.1, React 19.3 |
| Language | TypeScript 6 (strict mode) |
| Navigation | Expo Router 58 (native tabs) |
| Animation | React Native Reanimated 4.7, Worklets 0.13 |
| Backend | Firebase Authentication, Cloud Firestore, Cloud Storage |
| UI / media | Expo Image, Expo Symbols, Expo Glass Effect, `@expo/ui` |
| Layout | React Native Safe Area Context, React Native Screens |

## Prerequisites

- Node.js 18 or newer
- A package manager: the repo includes a `pnpm-lock.yaml`, so **pnpm** is recommended (npm also works)
- An Android emulator (Android Studio) or a physical Android device
- A development build for Google sign-in (`pnpm exec expo run:android` or `eas build --profile development --platform android`); Expo Go does not include it

## Getting started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start the development server:

   ```bash
   pnpm start
   ```

3. Press `a` in the terminal to open the app on Android, or run:

   ```bash
   pnpm android
   ```

> To add a new package, use `npx expo install <package>` instead of `pnpm add` so you get a version compatible with SDK 58.

## Docker sandbox

You can run the dev server and checks in a container (Node 22 and pinned pnpm, same as CI) without installing Node on your machine. The container runs as an unprivileged user with all Linux capabilities dropped. It does not build the native Android app: install a development build on your device, and it connects to Metro running in the container.

```bash
cp .env.example .env                 # fill in Firebase values (optional for lint/typecheck)

# Start Metro on port 8081. Set the hostname to this computer's LAN IP so your phone can reach it.
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.20 docker compose up --build

# Run Metro with interactive keys (r = reload, j = debugger)
docker compose run --rm --service-ports app

# Run one-off commands in the sandbox
docker compose run --rm app pnpm lint
docker compose run --rm app pnpm typecheck
docker compose run --rm app pnpm doctor
```

Source files are bind-mounted, so edits on the host reload live. `node_modules` lives in a Docker volume, so after changing `package.json` or `pnpm-lock.yaml`, run `docker compose run --rm app pnpm install`. Running `docker compose build` alone won't refresh that volume. To reset everything, run `docker compose down -v`.

## Firebase setup

1. Create a Firebase project and register a Web app in Project settings.
2. Copy `.env.example` to `.env` and fill in the Firebase values from the Web app config. These client identifiers are bundled into the app; access control belongs in Firebase Authentication and your Firestore and Storage security rules.
3. In Firebase Console, enable Email/Password and Google under **Authentication > Sign-in method**. Create a Firestore database and enable Storage before using those services.
4. For Google sign-in, set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` to the OAuth Web client ID for this Firebase project. Native Google sign-in requires a development build and does not work in Expo Go.

For cloud builds, configure the same `EXPO_PUBLIC_*` values as build environment variables. `.env` is ignored by Git.

## Available scripts

| Script | Command | Description |
| --- | --- | --- |
| `start` | `expo start` | Start the Expo dev server |
| `android` | `expo start --android` | Start and open on Android |
| `lint` | `expo lint` | Run ESLint through Expo |
| `typecheck` | `tsc --noEmit` | Typecheck the project |
| `doctor` | `expo-doctor` | Check dependencies and config |

CI runs lint, typecheck, Expo Doctor, and an Android JS bundle on every pull request to `develop` and `main`.

## Project structure

```text
mototrack-wiki/
├── app.json                    # Expo config (name, icons, splash, plugins, experiments)
├── app.config.ts               # Extends app.json (conditional plugins)
├── eas.json                    # EAS build profiles
├── package.json
├── tsconfig.json               # Strict TS + @/ path aliases
├── AGENTS.md                   # Guidelines for AI coding agents
├── assets/images/              # App icon, adaptive icon, splash
└── src/
    ├── app/                    # Routes (Expo Router)
    │   ├── _layout.tsx         # Root stack: auth guard, theme, splash overlay
    │   ├── login.tsx           # Sign-in screen (signed-out only)
    │   └── (tabs)/
    │       ├── _layout.tsx     # Tab navigator
    │       ├── index.tsx       # Home
    │       ├── garage.tsx      # Garage
    │       ├── vault.tsx       # Vault
    │       ├── wiki.tsx        # Wiki
    │       └── ai-mechanic.tsx # AI Mechanic
    ├── components/
    │   ├── app-tabs.tsx        # Tab bar definition (labels, icons)
    │   ├── screen/tab-screen.tsx # Shared tab screen layout + placeholder card
    │   ├── animated-icon.tsx   # Splash overlay
    │   ├── icons/              # SVG icons and the MotoTrack logo
    │   ├── themed-text.tsx
    │   └── themed-view.tsx
    ├── features/login/         # Login view model and UI
    ├── lib/firebase/           # Firebase config and Google sign-in
    ├── constants/theme.ts      # Colors, fonts, spacing, layout constants
    └── hooks/                  # useAuth, useTheme, useColorScheme
```

## Development notes

- Every file in `src/app/` is a route, and `_layout.tsx` defines the navigator. Keep components, hooks, and utilities outside `src/app/`.
- Colors (`Colors.light` / `Colors.dark`), `Spacing`, `Fonts`, `BottomTabInset`, and `MaxContentWidth` (800) live in `src/constants/theme.ts`. Use these tokens instead of hard-coded values.
- To add a tab, create the route file in `src/app/(tabs)/` and register it in `src/components/app-tabs.tsx`. Tab icons use Material Symbols names via the `md` prop.
- `android/` is generated by Continuous Native Generation and are git-ignored. Configure native behavior through `app.json` and config plugins rather than editing that folder.
- Libraries with custom native code need a development build (`npx expo run:android`) because Expo Go only includes its bundled modules.

## Roadmap

- [x] Sign-in with Firebase Authentication
- [x] App shell with Home, Garage, Vault, Wiki, and AI Mechanic tabs
- [ ] Garage: add and manage motorcycles
- [ ] Vault: store motorcycle documents
- [ ] Wiki: reference content and search
- [ ] AI Mechanic: troubleshooting chat
- [ ] Custom app icon and splash branding

## License

Released under the MIT License. See [LICENSE](LICENSE) for details.
