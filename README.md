# MotoTrack Wiki

MotoTrack Wiki is a cross-platform motorcycle information and reference app built with Expo and React Native. It runs on Android, iOS, and the web from a single TypeScript codebase, using Expo Router for file-based navigation and a small set of themed, reusable components.

> **Status:** early development. The navigation shell, theming, and component system are in place; the screens still contain Expo starter content and will be replaced with motorcycle reference content (see [Roadmap](#roadmap)).

## Features

- **Cross-platform** — Android, iOS, and web (web output mode: `server`)
- **File-based routing** with Expo Router and typed routes enabled
- **Platform-specific tabs**
  - Native: `NativeTabs` from `expo-router/native-tabs` with Home and Explore tabs
  - Web: a custom floating tab bar built with `expo-router/ui` (`app-tabs.web.tsx`)
- **Light and dark mode** that follows the system setting (`userInterfaceStyle: automatic`)
- **Themed components** — `ThemedText` and `ThemedView` read colors from shared design tokens
- **Animations** with `react-native-reanimated` (animated splash overlay, collapsible sections)
- **React Compiler** enabled through Expo experiments
- **Path aliases** — `@/*` maps to `src/*` and `@/assets/*` maps to `assets/*`

## Tech stack

| Area | Library / version |
| --- | --- |
| Framework | Expo SDK 58 (`expo ~58.0.23`) |
| Runtime | React Native 0.88.1, React 19.3 |
| Language | TypeScript 6 (strict mode) |
| Navigation | Expo Router 58 (native tabs + `expo-router/ui`) |
| Animation | React Native Reanimated 4.7, Worklets 0.13 |
| Backend | Firebase Authentication, Cloud Firestore, Cloud Storage |
| UI / media | Expo Image, Expo Symbols, Expo Glass Effect, `@expo/ui` |
| Layout | React Native Safe Area Context, React Native Screens |
| Web | React DOM 19.3, React Native Web 0.21 |

## Prerequisites

- Node.js 18 or newer
- A package manager: the repo includes a `pnpm-lock.yaml`, so **pnpm** is recommended (npm also works)
- For device testing: an Android emulator, iOS Simulator (macOS), or the Expo Go app on a physical device

## Getting started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start the development server:

   ```bash
   pnpm start
   ```

3. Open the app on a target platform. Press `a` (Android), `i` (iOS), or `w` (web) in the terminal, or run one directly:

   ```bash
   pnpm android
   pnpm ios
   pnpm web
   ```

> To add a new package, use `npx expo install <package>` instead of `pnpm add` so you get a version compatible with SDK 58.

## Firebase setup

1. Create a Firebase project and register a Web app in Project settings.
2. Copy `.env.example` to `.env` and fill in the Firebase values from the Web app config. These client identifiers are bundled into the app; access control belongs in Firebase Authentication and your Firestore and Storage security rules.
3. In Firebase Console, enable Email/Password and Google under **Authentication > Sign-in method**. Create a Firestore database and enable Storage before using those services.
4. For Google sign-in, set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` to the OAuth Web client ID for this Firebase project. Set `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` for iOS; the app config adds the required URL scheme when this is set. Native Google sign-in requires a development build and does not work in Expo Go.

For cloud builds, configure the same `EXPO_PUBLIC_*` values as build environment variables. `.env` is ignored by Git.

## Available scripts

| Script | Command | Description |
| --- | --- | --- |
| `start` | `expo start` | Start the Expo dev server |
| `android` | `expo start --android` | Start and open on Android |
| `ios` | `expo start --ios` | Start and open on iOS |
| `web` | `expo start --web` | Start and open in the browser |
| `lint` | `expo lint` | Run ESLint through Expo |
| `reset-project` | `node ./scripts/reset-project.js` | Move the starter code to `example/` (or delete it, depending on your answer at the prompt) and create a blank `src/app` |

Typecheck with:

```bash
npx tsc --noEmit
```

## Project structure

```text
mototrack-wiki/
├── app.json                    # Expo config (name, icons, splash, plugins, experiments)
├── package.json
├── tsconfig.json               # Strict TS + @/ path aliases
├── AGENTS.md                   # Guidelines for AI coding agents
├── assets/
│   ├── expo.icon/              # iOS app icon
│   └── images/                 # App icons, splash, tab icons, misc images
├── scripts/
│   └── reset-project.js
└── src/
    ├── app/                    # Routes (Expo Router)
    │   ├── _layout.tsx         # Root layout: theme provider, splash overlay, tabs
    │   ├── index.tsx           # Home tab
    │   └── explore.tsx         # Explore tab
    ├── components/
    │   ├── app-tabs.tsx        # Native tab bar
    │   ├── app-tabs.web.tsx    # Web tab bar
    │   ├── animated-icon.tsx   # Animated logo + splash overlay (.web.tsx variant)
    │   ├── external-link.tsx   # Opens links in an in-app browser
    │   ├── hint-row.tsx
    │   ├── themed-text.tsx
    │   ├── themed-view.tsx
    │   ├── web-badge.tsx
    │   └── ui/
    │       └── collapsible.tsx
    ├── constants/
    │   └── theme.ts            # Colors, fonts, spacing, layout constants
    ├── hooks/
    │   ├── use-color-scheme.ts # (+ .web.ts variant)
    │   └── use-theme.ts
    └── global.css              # Web font variables
```

## Development notes

- Every file in `src/app/` is a route, and `_layout.tsx` defines the navigator. Keep components, hooks, and utilities outside `src/app/`.
- Files ending in `.web.tsx` / `.web.ts` override their native counterparts on the web.
- Colors (`Colors.light` / `Colors.dark`), `Spacing`, `Fonts`, `BottomTabInset`, and `MaxContentWidth` (800) live in `src/constants/theme.ts`. Use these tokens instead of hard-coded values.
- To add a tab, create the route file in `src/app/` and register it in **both** `app-tabs.tsx` and `app-tabs.web.tsx`.
- `ios/` and `android/` are generated by Continuous Native Generation and are git-ignored. Configure native behavior through `app.json` and config plugins rather than editing those folders.
- Libraries with custom native code need a development build (`npx expo run:android` / `npx expo run:ios`) because Expo Go only includes its bundled modules.

## Roadmap

- [ ] Replace the starter Home and Explore screens with MotoTrack content
- [ ] Rename the web tab bar brand from "Expo Starter" to "MotoTrack Wiki"
- [ ] Motorcycle catalog (brands, models, specs)
- [ ] Search and category filters
- [ ] Detail screens with images and specifications
- [ ] Custom app icon and splash branding

## License

Released under the MIT License. See [LICENSE](LICENSE) for details.
