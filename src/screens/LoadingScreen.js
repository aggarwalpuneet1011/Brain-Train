import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Easing } from 'react-native';
import { COLORS, TYPE } from '../theme/theme';
import { TrainButton } from '../components/UI';

// Maps the gemini.js error taxonomy to honest, specific, kid-safe messages.
// This is the failure path the original PRD never specified — a blank
// screen or generic crash on first launch would be the worst possible
// first impression for a 7-year-old.
const ERROR_COPY = {
  NETWORK: {
    title: "Can't reach the tracks",
    body: 'No internet connection right now. Once quizzes are downloaded once, they work offline — but the very first one needs a connection.',
  },
  BAD_KEY: {
    title: 'Ticket not valid',
    body: "That Gemini API key doesn't seem to work. Double-check it in Settings — get a free one at aistudio.google.com if needed.",
  },
  MODEL_404: {
    title: 'This train model retired',
    body: 'The Gemini model in Settings is no longer available. Pick a current one (e.g. gemini-3.5-flash) and try again.',
  },
  RATE_LIMIT: {
    title: 'Too many trains at once',
    body: "Gemini's asking us to slow down. Wait a minute and try again.",
  },
  BLOCKED: {
    title: 'Signal blocked',
    body: "Gemini couldn't generate this quiz safely. Try a different subject or difficulty.",
  },
  TRUNCATED: {
    title: 'Quiz got cut short',
    body: "The response was too long and got cut off. Let's try building it again.",
  },
  VALIDATION_SHAPE: { title: 'Mixed-up tracks', body: "The quiz that came back wasn't quite right. Let's try again." },
  VALIDATION_COUNT: { title: 'Mixed-up tracks', body: "The quiz that came back wasn't quite right. Let's try again." },
  VALIDATION_OPTIONS: { title: 'Mixed-up tracks', body: "The quiz that came back wasn't quite right. Let's try again." },
  VALIDATION_INDEX: { title: 'Mixed-up tracks', body: "The quiz that came back wasn't quite right. Let's try again." },
  VALIDATION_MISMATCH: { title: 'Mixed-up tracks', body: "The quiz that came back wasn't quite right. Let's try again." },
  VALIDATION_BACKUP: { title: 'Mixed-up tracks', body: "The quiz that came back wasn't quite right. Let's try again." },
  EMPTY: { title: 'Quiet on the line', body: 'No response came back. Let’s try again.' },
};
const DEFAULT_ERROR = { title: 'Unexpected delay', body: 'Something went wrong building your quiz. Let’s try again.' };

// Real, event-driven stages (see services/gemini.js onStage) plus two local
// ones ('checking-key' fires before the network call even starts) so the
// screen never sits on one silent message for 20+ seconds.
const STAGE_COPY = {
  'checking-key': 'Checking your API key…',
  sending: 'Sending your request to Gemini…',
  receiving: 'Gemini is writing your questions…',
  validating: 'Double-checking every answer key…',
};
// If a stage runs long, reassure rather than look stuck — this is time-based
// (owned here, not in gemini.js, which has no business knowing about UI
// timing), layered on top of whatever the real stage is.
const SLOW_HINT_MS = 9000;

export default function LoadingScreen({ error, stage, onRetry, onOpenSettings, onCancel }) {
  const spin = useRef(new Animated.Value(0)).current;
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (error) return;
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, [error]);

  useEffect(() => {
    setSlow(false);
    if (error) return;
    const t = setTimeout(() => setSlow(true), SLOW_HINT_MS);
    return () => clearTimeout(t);
  }, [stage, error]);

  if (error) {
    const copy = ERROR_COPY[error] || DEFAULT_ERROR;
    return (
      <View style={styles.wrap}>
        <Text style={{ fontSize: 48 }}>🚧</Text>
        <Text style={[TYPE.h2, { textAlign: 'center', marginTop: 12 }]}>{copy.title}</Text>
        <Text style={[TYPE.bodyDim, { textAlign: 'center', marginTop: 8, marginBottom: 24 }]}>{copy.body}</Text>
        <TrainButton label="Try Again" onPress={onRetry} style={{ marginBottom: 12 }} />
        <TrainButton label="Open Settings" variant="ghost" onPress={onOpenSettings} style={{ marginBottom: 12 }} />
        <TrainButton label="Back to Menu" variant="ghost" onPress={onCancel} />
      </View>
    );
  }

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <View style={styles.wrap}>
      <Animated.Text style={[{ fontSize: 56 }, { transform: [{ rotate }] }]}>🚂</Animated.Text>
      <Text style={[TYPE.h2, { marginTop: 16, textAlign: 'center' }]}>{STAGE_COPY[stage] || 'Getting your quiz ready…'}</Text>
      {slow && (
        <Text style={[TYPE.bodyDim, { marginTop: 4, textAlign: 'center' }]}>
          Still working — 20 factually-correct questions take a little longer than a story.
        </Text>
      )}
      <ActivityIndicator style={{ marginTop: 20 }} color={COLORS.accent} />
      <TrainButton label="Back to Menu" variant="ghost" onPress={onCancel} style={{ marginTop: 32 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', padding: 32 },
});
