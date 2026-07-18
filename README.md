# Brain Train 🚂

*All Aboard for Olympiad Success!*

A premium, offline-first Olympiad prep app for an advanced Grade 2 student.
Built with Expo (React Native), using Google Gemini as the **only** runtime
AI provider. Same stack and delivery workflow as FableAble.

## What it does

- **One question per screen**, four large touch-friendly options, instant
  feedback with a kid-friendly explanation.
- **Engineer's Log** (Hall of Fame), **Repair Yard** (Mistake Bucket that
  auto-clears a concept once you answer it right), daily streak, stars.
- **Genuinely offline after generation.** Gemini is called at most once per
  quiz to build the whole Quiz Session Package (20 questions + backup +
  explanations + coaching). After that, scoring, review, lifelines, streaks,
  and sharing all work in Airplane Mode — no further network calls.

## Setup

```bash
npm install
npx expo start        # scan the QR with Expo Go for a quick preview
```

On first launch the app asks for the student's name and a **Gemini API key**
(free from https://aistudio.google.com). The key is stored encrypted on the
device via expo-secure-store — never hardcoded, never sent anywhere but
Google's API.

The Gemini **model** is editable in Settings (default `gemini-3.5-flash`).
If Google ever retires that model, change it in Settings — no code change or
app update needed.

## Building the installable APK

This mirrors FableAble exactly — a cloud build via EAS that hands back a
direct APK download link, installable without the Play Store or Expo Go:

```bash
npm install -g eas-cli      # if not already installed
eas login                   # your Expo account (owner: puneet1011)
eas build -p android --profile preview
```

The `preview` profile in `eas.json` is set to `buildType: apk`. When the
build finishes, EAS gives you a URL — open it on the phone, download, install.

> Per the project spec, the workflow **stops before GitHub push and before
> the APK build** to wait for your go-ahead. Run the `eas build` command
> above when you're ready.

## Project structure

```
App.js                    root component + navigation state machine
index.js                  Expo entry point
src/
  services/
    gemini.js             Gemini Call 2 (Quiz Session Package) + validation
    storage.js            SecureStore (key) + AsyncStorage (everything else)
  screens/                Welcome, Setup, Dashboard, Loading, Quiz, Results,
                          Engineer's Log, Repair Yard, Settings
  components/UI.js        shared pastel buttons/cards
  theme/theme.js          design tokens (soft pastel palette)
  utils/constants.js      branding strings, subjects, scoring
assets/                   app icon, splash, adaptive icon
```

## Notes on the Gemini contract

`src/services/gemini.js` uses Gemini's native structured-output
(`responseSchema`) to force the exact JSON contract from the PRD, then
validates it: 20 questions, 4 options each, and `questions[i].correct_index
== answer_key[i]` for every i. On a validation failure it regenerates once;
on network/auth/safety failures it surfaces a specific, honest, kid-safe
error screen rather than crashing.
