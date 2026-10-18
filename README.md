# Brain Train 🚂

*All Aboard for Olympiad Success!*

A premium, offline-first Olympiad prep app for an advanced Grade 2 student.
Built with Expo (React Native), using Google Gemini as the **only** runtime
AI provider.

## What it does

- **Multiple profiles, one shared Gemini key.** No passwords — a profile is
  just a picked name. The Gemini API key and model are global; streak,
  Engineer's Log, Repair Yard, and quiz history are tracked separately per
  profile.
- **Revisitable 20-question set.** One question per screen, four large
  touch-friendly options. Selecting an option just records your answer —
  there's no right/wrong reveal in the moment. You can move forward, go
  back, skip a question (and return to it later), or jump to any question
  via the progress rail. A Review screen before submitting shows which
  questions are answered, skipped, or untouched.
- **Feedback after you submit, not per-question.** Once you submit the set,
  the Results screen shows your score, stars, and a kid-friendly explanation
  for every question.
- **Engineer's Log** (Hall of Fame, shared across all profiles) and
  **Repair Yard** (Mistake Bucket). A concept clears from the Repair Yard
  automatically the next time you answer it correctly, or you can tap it
  to mark it learned manually at any time.
- **Genuinely offline after generation.** Gemini is called once per quiz to
  build the whole Quiz Session Package (20 questions + explanations +
  coaching); if that response fails validation it's regenerated once more
  automatically. After a successful package is downloaded, answering,
  reviewing, scoring, streaks, and sharing all work in Airplane Mode — no
  further network calls.

## Setup

```
npm install
npx expo start        # scan the QR with Expo Go for a quick preview
```

On first launch the app asks for the student's name and a **Gemini API key**
(free from https://aistudio.google.com). The key is stored encrypted on the
device via expo-secure-store — never hardcoded, never sent anywhere but
Google's API. Adding a second (or third) profile afterward only asks for a
name — the key and model are already set.

The Gemini **model** is editable in Settings (default `gemini-3.8-flash`).
If Google ever retires that model, change it in Settings — no code change or
app update needed.

## Building the installable APK

This mirrors FableAble exactly — a cloud build via EAS that hands back a
direct APK download link, installable without the Play Store or Expo Go:

```
npm install -g eas-cli      # if not already installed
eas login                   # your Expo account (owner: puneet1011)
eas build -p android --profile preview
```

The `preview` profile in `eas.json` is set to `buildType: apk`. When the
build finishes, EAS gives you a URL — open it on the phone, download, install.

An APK has been built from this profile and installed on-device. Re-run the
command above to produce a fresh build after any code change.

## Project structure

```
App.js                    root component + navigation state machine
index.js                  Expo entry point
src/
  services/
    gemini.js             Gemini Call 2 (Quiz Session Package) + validation
    storage.js            SecureStore (key) + AsyncStorage (everything else,
                           namespaced per profile)
  screens/                Welcome, ProfilePicker, NewProfile, Setup,
                           Dashboard, Loading, Quiz, QuizReview, Results,
                           Engineer's Log, Repair Yard, Settings
  components/UI.js        shared pastel buttons/cards
  theme/theme.js          design tokens (soft pastel palette)
  utils/constants.js      branding strings, subjects, difficulty, scoring
assets/                   app icon, splash, adaptive icon
```

Subjects: English, Maths, Science, Computers, General Knowledge.
Difficulty: Easy, Medium, Hard.

## Notes on the Gemini contract

`src/services/gemini.js` uses Gemini's native structured-output
(`responseSchema`) to force the exact JSON contract from the PRD, then
validates it: 20 questions, 4 options each, and
`questions[i].correct_index == answer_key[i]` for every i. On a validation
failure it regenerates once; on network/auth/safety failures it surfaces a
specific, honest, kid-safe error screen rather than crashing.
