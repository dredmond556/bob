# ScreenStreak

ScreenStreak is a two-tab Expo app that helps you taper off smartphone usage by shrinking your daily screen-time limits in small, sustainable strides — no hard blocks, just self-discipline.

## Features

- **Today tab**: Branded dashboard with your streak, daily progress bar, remaining minutes, and total time saved since starting.
- **Rotating alternatives**: Curated list of 5 offline activities (plus a constant “Learn to be bored.”) that refreshes on demand.
- **Baseline insights**: Track daily averages, reduction goal, and limit in one glance with stylish stat cards.
- **Settings tab**: Manage privacy, contact support, allow Screen Time access, upload annual summaries, toggle daily notifications, and review withdrawal guidance.
- **Modals on launch**: Request Screen Time access once, then prompt for your reduction stride (15, 10, or 5 minutes).
- **Daily notifications**: Opt-in to receive an evening recap of your progress (requires granting notification permissions on device).

## Prerequisites

- Node.js 18+
- npm 9+ (comes with Node)
- Expo CLI (optional global install): `npm install -g expo-cli`

## Getting Started

```bash
cd screenstreak
npm install
npx expo start
```

Choose your preferred platform (Expo Go on iOS/Android or web) from the interactive menu.

## Development Notes

- Local state is persisted with AsyncStorage; deleting the app clears streaks and saved minutes.
- Screen Time integration is mocked with manual logging until Apple’s Screen Time APIs are publicly available via Expo.
- Daily notification scheduling relies on `expo-notifications`; enable permissions when prompted to receive recaps.
- Update `app.json` with your own bundle identifiers before releasing to App Store or Play Store.

## Testing

Type-check with:

```bash
npx tsc --noEmit
```

Use the Expo preview (`npx expo start --web`) for quick visual checks; for device builds, follow Expo’s build service guides.
