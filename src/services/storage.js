// Storage service — Brain Train
//
// Same split FableAble used: the Gemini API key goes in SecureStore
// (encrypted), everything else goes in AsyncStorage (plain, but never
// holds a credential). All persistence must survive Airplane Mode — none
// of these functions ever touch the network.
//
// Multi-profile: the Gemini API key and model are GLOBAL (one Gemini
// account per device/household, shared by whoever's playing). Everything
// else — streak, Hall of Fame, Mistake Bucket, mastered concepts, quiz
// history, difficulty — is namespaced per profile name, so two kids
// sharing one phone don't see each other's progress. There's no
// password: a profile is just a name, picked from a list.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { DEFAULT_MODEL } from './gemini';

const GLOBAL_KEYS = {
  apiKey: 'braintrain_gemini_api_key',      // SecureStore
  model: 'braintrain_gemini_model',
  profiles: 'braintrain_profiles_v1',       // string[] of profile names
  activeProfile: 'braintrain_active_profile_v1',
  inProgress: 'braintrain_in_progress_v1',  // downloaded package + live quiz state; carries its own profileName
};

// Per-profile key bases — actual AsyncStorage key is `${base}::${profileName}`.
const PROFILE_KEY_BASES = {
  difficulty: 'braintrain_difficulty',
  streak: 'braintrain_streak_v1',
  hallOfFame: 'braintrain_hall_of_fame_v1',
  mistakeBucket: 'braintrain_mistake_bucket_v1',
  masteredConcepts: 'braintrain_mastered_concepts_v1',
  quizHistory: 'braintrain_quiz_history_v1',
};

function pKey(base, profileName) {
  return `${base}::${(profileName || '').trim()}`;
}

// ---------------------------------------------------------------------------
// API key (SecureStore) + model (AsyncStorage) — global, shared by all profiles
// ---------------------------------------------------------------------------

export async function getApiKey() {
  try { return await SecureStore.getItemAsync(GLOBAL_KEYS.apiKey); } catch (e) { return null; }
}
export async function setApiKey(key) {
  await SecureStore.setItemAsync(GLOBAL_KEYS.apiKey, (key || '').trim());
}

export async function getModel() {
  const m = await AsyncStorage.getItem(GLOBAL_KEYS.model);
  return m || DEFAULT_MODEL;
}
export async function setModel(model) {
  await AsyncStorage.setItem(GLOBAL_KEYS.model, (model || DEFAULT_MODEL).trim());
}

// ---------------------------------------------------------------------------
// Profiles — no password, just a picked name. "Continue" on the profile
// screen lists these; adding a new one is just typing a new name.
// ---------------------------------------------------------------------------

export async function getProfiles() {
  const raw = await AsyncStorage.getItem(GLOBAL_KEYS.profiles);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch (e) { return []; }
}

export async function addProfile(name) {
  const clean = (name || '').trim();
  if (!clean) return getProfiles();
  const existing = await getProfiles();
  const already = existing.some((n) => n.toLowerCase() === clean.toLowerCase());
  const next = already ? existing : [...existing, clean];
  await AsyncStorage.setItem(GLOBAL_KEYS.profiles, JSON.stringify(next));
  return next;
}

// Removes the profile from the list AND wipes every namespaced key for it
// (streak, Hall of Fame, Mistake Bucket, mastered concepts, quiz history,
// difficulty). Does not touch the global API key/model.
export async function deleteProfile(name) {
  const clean = (name || '').trim();
  const existing = await getProfiles();
  const next = existing.filter((n) => n.toLowerCase() !== clean.toLowerCase());
  await AsyncStorage.setItem(GLOBAL_KEYS.profiles, JSON.stringify(next));
  await Promise.all(Object.values(PROFILE_KEY_BASES).map((base) => AsyncStorage.removeItem(pKey(base, clean))));
  const active = await getActiveProfile();
  if (active && active.toLowerCase() === clean.toLowerCase()) {
    await AsyncStorage.removeItem(GLOBAL_KEYS.activeProfile);
  }
  return next;
}

// Clears progress (streak, Hall of Fame, Mistake Bucket, mastered concepts,
// quiz history) for one profile WITHOUT removing the profile itself or its
// difficulty setting — "start fresh" rather than "delete this kid".
export async function resetProfileProgress(name) {
  const clean = (name || '').trim();
  await Promise.all([
    AsyncStorage.removeItem(pKey(PROFILE_KEY_BASES.streak, clean)),
    AsyncStorage.removeItem(pKey(PROFILE_KEY_BASES.hallOfFame, clean)),
    AsyncStorage.removeItem(pKey(PROFILE_KEY_BASES.mistakeBucket, clean)),
    AsyncStorage.removeItem(pKey(PROFILE_KEY_BASES.masteredConcepts, clean)),
    AsyncStorage.removeItem(pKey(PROFILE_KEY_BASES.quizHistory, clean)),
  ]);
}

export async function getActiveProfile() {
  return AsyncStorage.getItem(GLOBAL_KEYS.activeProfile);
}
export async function setActiveProfile(name) {
  await AsyncStorage.setItem(GLOBAL_KEYS.activeProfile, (name || '').trim());
}

// ---------------------------------------------------------------------------
// Per-profile settings (difficulty)
// ---------------------------------------------------------------------------

export async function getDifficulty(profileName) {
  const d = await AsyncStorage.getItem(pKey(PROFILE_KEY_BASES.difficulty, profileName));
  return d || 'Medium';
}
export async function setDifficulty(profileName, difficulty) {
  await AsyncStorage.setItem(pKey(PROFILE_KEY_BASES.difficulty, profileName), difficulty || 'Medium');
}

// ---------------------------------------------------------------------------
// Daily Streak (per profile)
// ---------------------------------------------------------------------------

function todayStr() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}
function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

export async function getStreak(profileName) {
  const raw = await AsyncStorage.getItem(pKey(PROFILE_KEY_BASES.streak, profileName));
  if (!raw) return { count: 0, lastPlayed: null };
  try { return JSON.parse(raw); } catch (e) { return { count: 0, lastPlayed: null }; }
}

// Call once per completed quiz. Returns the updated streak AND whether this
// is a "new streak" milestone (for achievement_messages.new_streak).
export async function recordQuizCompletionForStreak(profileName) {
  const today = todayStr();
  const current = await getStreak(profileName);
  let count = current.count || 0;
  let isNewMilestone = false;

  if (!current.lastPlayed) {
    count = 1;
  } else {
    const gap = daysBetween(current.lastPlayed, today);
    if (gap === 0) {
      // already played today, streak unchanged
    } else if (gap === 1) {
      count += 1;
      isNewMilestone = true;
    } else {
      count = 1; // streak broken, restart
    }
  }

  const next = { count, lastPlayed: today };
  await AsyncStorage.setItem(pKey(PROFILE_KEY_BASES.streak, profileName), JSON.stringify(next));
  return { ...next, isNewMilestone };
}

// ---------------------------------------------------------------------------
// Hall of Fame ("Engineer's Log") (per profile)
// ---------------------------------------------------------------------------

export async function getHallOfFame(profileName) {
  const raw = await AsyncStorage.getItem(pKey(PROFILE_KEY_BASES.hallOfFame, profileName));
  if (!raw) return [];
  try { return JSON.parse(raw); } catch (e) { return []; }
}

export async function addHallOfFameEntry(profileName, entry) {
  const list = await getHallOfFame(profileName);
  const next = [{ ...entry, name: profileName, date: todayStr() }, ...list].slice(0, 200);
  await AsyncStorage.setItem(pKey(PROFILE_KEY_BASES.hallOfFame, profileName), JSON.stringify(next));
  const best = next.reduce((m, e) => Math.max(m, e.score || 0), 0);
  return { list: next, bestScore: best, isNewHighScore: entry.score >= best };
}

export async function getBestScore(profileName) {
  const list = await getHallOfFame(profileName);
  return list.reduce((m, e) => Math.max(m, e.score || 0), 0);
}

// The Engineer's Log screen is a shared family logbook, not a per-kid
// view — it reads every profile's Hall of Fame and merges them so each row
// can show whose journey it was. Dashboard's own "best score" tile stays
// per-profile (getBestScore above); this is only for the combined list.
export async function getAllHallOfFameEntries() {
  const profiles = await getProfiles();
  const lists = await Promise.all(profiles.map((p) => getHallOfFame(p)));
  return lists.flat().sort((a, b) => new Date(b.date) - new Date(a.date));
}

// ---------------------------------------------------------------------------
// Mistake Bucket ("Repair Yard") (per profile)
// ---------------------------------------------------------------------------

export async function getMistakeBucket(profileName) {
  const raw = await AsyncStorage.getItem(pKey(PROFILE_KEY_BASES.mistakeBucket, profileName));
  if (!raw) return [];
  try { return JSON.parse(raw); } catch (e) { return []; }
}

// Adds fresh mistakes, de-duped by concept (case-insensitive). Newest
// explanation for a concept wins so the entry stays fresh.
export async function addMistakes(profileName, mistakes) {
  if (!mistakes || !mistakes.length) return getMistakeBucket(profileName);
  const existing = await getMistakeBucket(profileName);
  const byConcept = new Map(existing.map((m) => [m.concept.toLowerCase(), m]));
  for (const m of mistakes) {
    byConcept.set(m.concept.toLowerCase(), { ...m, date: todayStr() });
  }
  const next = Array.from(byConcept.values());
  await AsyncStorage.setItem(pKey(PROFILE_KEY_BASES.mistakeBucket, profileName), JSON.stringify(next));
  return next;
}

export async function removeMistakeByConcept(profileName, concept) {
  const existing = await getMistakeBucket(profileName);
  const next = existing.filter((m) => m.concept.toLowerCase() !== concept.toLowerCase());
  await AsyncStorage.setItem(pKey(PROFILE_KEY_BASES.mistakeBucket, profileName), JSON.stringify(next));
  return next;
}

// ---------------------------------------------------------------------------
// Mastery Mode dedup (per profile)
//
// Questions are freshly AI-generated each session — there's no fixed bank to
// diff against. We key on a normalized "concept::question" string so a
// reworded restatement of the same fact still counts as the same question.
// This directly addresses the PRD's "duplicates are not stored" requirement,
// which otherwise has no defined mechanism.
// ---------------------------------------------------------------------------

function masteryKey(concept, question) {
  return `${(concept || '').trim().toLowerCase()}::${(question || '').trim().toLowerCase()}`;
}

export async function getMasteredKeys(profileName) {
  const raw = await AsyncStorage.getItem(pKey(PROFILE_KEY_BASES.masteredConcepts, profileName));
  if (!raw) return [];
  try { return JSON.parse(raw); } catch (e) { return []; }
}

export async function markConceptMastered(profileName, concept, question) {
  const keys = await getMasteredKeys(profileName);
  const key = masteryKey(concept, question);
  if (!keys.includes(key)) {
    keys.push(key);
    await AsyncStorage.setItem(pKey(PROFILE_KEY_BASES.masteredConcepts, profileName), JSON.stringify(keys));
  }
  return keys;
}

export async function isConceptMastered(profileName, concept, question) {
  const keys = await getMasteredKeys(profileName);
  return keys.includes(masteryKey(concept, question));
}

// ---------------------------------------------------------------------------
// Quiz history (per profile)
// ---------------------------------------------------------------------------

export async function getQuizHistory(profileName) {
  const raw = await AsyncStorage.getItem(pKey(PROFILE_KEY_BASES.quizHistory, profileName));
  if (!raw) return [];
  try { return JSON.parse(raw); } catch (e) { return []; }
}

export async function addQuizHistoryEntry(profileName, entry) {
  const list = await getQuizHistory(profileName);
  const next = [{ ...entry, date: todayStr() }, ...list].slice(0, 200);
  await AsyncStorage.setItem(pKey(PROFILE_KEY_BASES.quizHistory, profileName), JSON.stringify(next));
  return next;
}

// ---------------------------------------------------------------------------
// In-progress quiz (the offline-guarantee state)
//
// Once a Quiz Session Package is downloaded, everything about playing it —
// current question index, answers so far, lifeline usage, timer — lives
// here, not in memory alone. If the app is killed in Airplane Mode mid-quiz,
// this is what lets it resume without another network call. Only one quiz
// can be in progress at a time device-wide, so the state itself carries a
// `profileName` field saying whose quiz it is.
// ---------------------------------------------------------------------------

export async function saveInProgress(state) {
  await AsyncStorage.setItem(GLOBAL_KEYS.inProgress, JSON.stringify(state));
}
export async function loadInProgress() {
  const raw = await AsyncStorage.getItem(GLOBAL_KEYS.inProgress);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}
export async function clearInProgress() {
  await AsyncStorage.removeItem(GLOBAL_KEYS.inProgress);
}
