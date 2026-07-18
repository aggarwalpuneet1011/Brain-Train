// Shared design tokens — soft pastel palette per the PRD's Design Principles,
// tuned to match the hand-illustrated app icon (mint train, coral trim, sky
// blue backdrop, warm gold sparkle/glow). Plain StyleSheet, no NativeWind
// (matching FableAble's stack, not the original PRD's assumed tech list —
// see the build notes for why).

export const COLORS = {
  bg: '#EAF6FF',
  card: '#FFFFFF',
  cardAlt: '#F5F0FF',     // lavender tint for secondary cards
  text: '#1F2A44',
  textDim: '#5B6B8C',
  mint: '#8FD9C4',
  mintDeep: '#4FB897',
  lavender: '#C9B8F0',
  sky: '#8AC6F0',
  skyDeep: '#5FA8E6',
  cream: '#FFF6E8',
  coral: '#FF9E80',
  coralDeep: '#F4794F',
  gold: '#FFC857',
  goldDeep: '#F2A93B',
  accent: '#FFC857',      // warm accent for CTAs / stars
  success: '#3FBF7F',
  danger: '#F2645F',
  track: '#D9E9F7',
  shadow: '#2A3B5C',
};

// LinearGradient color arrays — every screen background and the primary CTA
// pull from here so the palette stays consistent instead of each screen
// picking its own two-tone.
export const GRADIENTS = {
  sky: ['#BFE3FF', '#EAF6FF'],              // hero / welcome backdrop
  skyDeep: ['#8AC6F0', '#EAF6FF'],          // quiz backdrop, a touch richer
  sunrise: ['#FFE9C7', '#FFF6E8'],          // loading / results warmth
  cta: ['#FFC857', '#FF9E80'],              // primary button — gold to coral
  ctaPressed: ['#F2A93B', '#F4794F'],
  mint: ['#B7ECD9', '#8FD9C4'],
  correct: ['#CFF6E4', '#EAFBF2'],
  wrong: ['#FFE0DD', '#FDECEC'],
};

// One accent per subject — used as the top bar on quiz cards and the
// destination tiles, so "Choose Your Destination" reads as four distinct
// lines on a map rather than four identical grey buttons.
// `solid` is the pastel used for fills/badges; `text` is a deliberately
// darker shade of the same hue for anything readable on top of `pale` —
// the pastel itself doesn't have enough contrast to use as text color.
export const SUBJECT_COLORS = {
  English: { solid: '#8FD9C4', pale: '#E4F8F1', text: '#1F6B52', gradient: ['#B7ECD9', '#8FD9C4'] },
  Maths: { solid: '#F7A8C4', pale: '#FDEAF1', text: '#B23A63', gradient: ['#FBC9DC', '#F7A8C4'] },
  Science: { solid: '#8AC6F0', pale: '#E3F2FD', text: '#1B5A8C', gradient: ['#BFE3FF', '#8AC6F0'] },
  'General Knowledge': { solid: '#C9B8F0', pale: '#F1EBFD', text: '#5B3FA0', gradient: ['#DCD0FA', '#C9B8F0'] },
  Computers: { solid: '#FF9E80', pale: '#FFEEE8', text: '#B54B2A', gradient: ['#FFC4AE', '#FF9E80'] },
};

export const RADIUS = { sm: 12, md: 18, lg: 26, xl: 32, pill: 999 };
export const SPACING = (n) => n * 8;
export const TOUCH_MIN = 52; // dp, per PRD minimum touch target

export const SHADOW = {
  soft: {
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  lifted: {
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
};

// FredokaOne-Regular (assets/Fonts/FredokaOne-Regular.ttf, loaded via
// expo-font's useFonts in App.js) — one very heavy weight, so it's used only
// for short display text: titles, headings, buttons, labels. Body text
// (questions, explanations, paragraphs) stays on the system font on
// purpose — a single-weight display face gets fatiguing and less legible
// at reading length. fontWeight is omitted wherever FONT_DISPLAY is set:
// the custom font file IS the weight, and RN will synthesize a fake bold
// over it if you also ask for fontWeight, which looks wrong.
export const FONT_DISPLAY = 'FredokaOne-Regular';

export const TYPE = {
  display: { fontSize: 34, fontFamily: FONT_DISPLAY, color: COLORS.text },
  h1: { fontSize: 26, fontFamily: FONT_DISPLAY, color: COLORS.text },
  h2: { fontSize: 19, fontFamily: FONT_DISPLAY, color: COLORS.text },
  body: { fontSize: 16, fontWeight: '500', color: COLORS.text },
  bodyDim: { fontSize: 14, fontWeight: '500', color: COLORS.textDim },
  // The actual quiz question sentence — reading-length text, deliberately
  // kept off FONT_DISPLAY (see note above) but still weighted and sized to
  // read as a headline within its card.
  questionText: { fontSize: 19, fontWeight: '700', color: COLORS.text, lineHeight: 27 },
  button: { fontSize: 16, fontFamily: FONT_DISPLAY, color: COLORS.text },
  eyebrow: { fontSize: 13, fontFamily: FONT_DISPLAY, color: COLORS.textDim, letterSpacing: 1 },
};
