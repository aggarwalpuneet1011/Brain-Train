# Olympiad Prep App – Production Development Specification

> **Purpose:** Build a production-ready Android Olympiad Prep application for a Grade 2 student using **Claude Code** as the development agent and **Google Gemini** as the runtime AI provider.

## 1. Objectives
- Produce a polished, child-friendly Android application.
- Deliver a clean Git repository.
- Stop before GitHub push and APK build, awaiting user approval.

## 2. Technology Stack
- React Native (Expo) + TypeScript
- NativeWind (Tailwind for React Native)
- Zustand for state management
- Storage abstraction:
  - Android: AsyncStorage (or MMKV)
  - Web (optional): localStorage
- Portrait-only orientation.

## 3. Runtime AI
- Use only Google Gemini via user-supplied API key.
- Never hardcode an API key.
- Settings screen stores:
  - API Key
  - Gemini model name (default `gemini-3.5-flash`)
- All API requests use the configured model string so future model upgrades require no code changes.

## 4. First Launch
Prompt for:
- Gemini API key
- Student name
- Difficulty:
  - Challenger
  - Mastermind

If branding assets are missing, pause and request:
- App icon (1024x1024 PNG)
- Splash/logo
- Package name
- App name
- Accent color

## 5. Dashboard
Display:
- Daily streak
- Hall of Fame (Top 5)
- Subject cards:
  - English
  - Science
  - General Knowledge
  - Computers
- Mastery Mode (visible only if mistakes exist)

## 6. Quiz Generation
Exactly **one** Gemini API call per quiz session.

Prompt includes:
- Name
- Subject
- Difficulty
- Current streak
- Hall of Fame summary
- Highest score
- Recent weak topics
- Mistake bucket summary

Gemini returns JSON only.

Schema:

```json
{
  "intro":"",
  "feedback":{
    "under12":"",
    "12to15":"",
    "16to18":"",
    "19":"",
    "20":""
  },
  "achievement_messages":{
    "new_streak":"",
    "new_high_score":"",
    "perfect_score":"",
    "mastery_completed":""
  },
  "coach_tips":["","",""],
  "questions":[]
}
```

Questions:
- 20 primary
- 1 backup for Flip Question
- Grade 2 Indian Olympiad
- Exactly one correct answer
- No ambiguity
- No repeated concepts
- Child-friendly explanations.

## 7. Gameplay
- One question per screen
- Large touch cards
- Offline scoring
- Lifelines:
  - 50-50 (once)
  - Flip Question (once)

## 8. Results
Display:
- Score as X out of 20
- Stars
- Personalized AI feedback
- Achievement messages
- Review with explanations
- WhatsApp sharing

## 9. Mistake Bucket
- Store incorrect questions
- No duplicates
- Remove after correct answer in Mastery Mode

## 10. Acceptance Tests
- Offline after initial API call
- Portrait only
- JSON validation with retry/repair
- Hall of Fame updates
- Streak updates
- Lifelines work once
- Flip uses backup question
- No crashes
- Settings editable
- App restart preserves data

## 11. Deliverables
- Clean repository
- Modular architecture:
  - components/
  - screens/
  - services/
  - storage/
  - hooks/
  - utils/
  - assets/
  - tests/
- Git initialized
- Build scripts prepared
- Pause before GitHub push
- Pause before APK generation awaiting approval.
