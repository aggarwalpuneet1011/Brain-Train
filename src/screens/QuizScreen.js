import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Animated, AppState, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SUBJECT_COLORS, TYPE, RADIUS, SHADOW } from '../theme/theme';
import { TrainButton } from '../components/UI';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

// One tappable dot per question — doubles as a progress rail and a jump
// menu. Filled = answered, ringed = explicitly skipped, dim = not visited
// yet, accent-colored + larger = the question currently on screen. The
// little engine still glides along on top purely for flavor.
function RailProgress({ total, currentIndex, answers, onJumpTo, accent }) {
  const left = useRef(new Animated.Value(0)).current;
  const progress = total > 1 ? currentIndex / (total - 1) : 0;

  useEffect(() => {
    Animated.spring(left, { toValue: progress, friction: 8, tension: 50, useNativeDriver: false }).start();
  }, [progress]);

  const leftPct = left.interpolate({ inputRange: [0, 1], outputRange: ['0%', '96%'] });

  return (
    <View style={styles.railWrap}>
      <View style={styles.railTrack}>
        {Array.from({ length: total }).map((_, i) => {
          const a = answers[i];
          const isCurrent = i === currentIndex;
          return (
            <Pressable key={i} onPress={() => onJumpTo(i)} hitSlop={{ top: 10, bottom: 10, left: 3, right: 3 }}>
              <View
                style={[
                  styles.railTie,
                  a && !a.skipped && styles.railTieAnswered,
                  a && a.skipped && styles.railTieSkipped,
                  isCurrent && { backgroundColor: accent.solid, borderColor: accent.solid, width: 10, height: 10, borderRadius: 5 },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
      <Animated.View style={[styles.railEngine, { left: leftPct }]}>
        <Text style={{ fontSize: 20 }}>🚂</Text>
      </Animated.View>
    </View>
  );
}

function formatElapsed(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Count-up (not countdown) timer for the whole 20-question set. Pauses
// while the app is backgrounded — "how long it's taking" should mean
// active time, not however long the phone sat locked in a pocket. Commits
// the paused duration back to the parent (which persists it) whenever the
// app returns to the foreground.
function useElapsedTimer(startedAt, pausedMs, onAccumulatePause) {
  const [now, setNow] = useState(Date.now());
  const pauseStartedAtRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        pauseStartedAtRef.current = Date.now();
      } else if (nextState === 'active' && pauseStartedAtRef.current) {
        const delta = Date.now() - pauseStartedAtRef.current;
        pauseStartedAtRef.current = null;
        onAccumulatePause?.(delta);
        setNow(Date.now());
      }
    });
    return () => { clearInterval(interval); sub.remove(); };
  }, []);

  return Math.max(0, now - startedAt - pausedMs);
}

export default function QuizScreen({
  subject,
  index,             // 0-based, the question currently on screen
  total,
  question,          // { id, question, options[4], correct_index, explanation, concept }
  existingAnswer,     // this question's saved answer, or null if not visited yet — { selectedIndex, skipped, ... }
  answers,            // full per-question answers array, for the rail's status dots
  isLast,
  onSelectOption,     // (i) => void — records immediately, no separate "submit" step per question
  onSkip,             // () => void — records skipped + advances (or opens review if last)
  onNext,             // () => void
  onPrev,             // () => void
  onJumpTo,           // (i) => void — rail dot tapped
  onOpenReview,        // () => void
  startedAt,          // ms epoch — when this 20-question set began
  pausedMs,           // ms accumulated while backgrounded, persisted
  onAccumulatePause,  // (deltaMs) => void
}) {
  const accent = SUBJECT_COLORS[subject] || SUBJECT_COLORS.Science;
  const elapsed = useElapsedTimer(startedAt, pausedMs, onAccumulatePause);
  const selected = existingAnswer && !existingAnswer.skipped ? existingAnswer.selectedIndex : null;

  function skip() {
    Alert.alert(
      'Skip this question?',
      "It'll move you along — you can jump back and answer it anytime before you submit the set.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: onSkip },
      ]
    );
  }

  return (
    <LinearGradient colors={GRADIENTS.skyDeep} style={styles.wrap}>
      <View style={styles.timerRow}>
        <Text style={styles.timerText}>⏱ {formatElapsed(elapsed)}</Text>
      </View>

      <RailProgress total={total} currentIndex={index} answers={answers} onJumpTo={onJumpTo} accent={accent} />
      <View style={styles.headerRow}>
        <View style={[styles.subjectPill, { backgroundColor: accent.pale }]}>
          <Text style={[styles.subjectPillText, { color: accent.text }]}>{subject}</Text>
        </View>
        <Pressable onPress={onOpenReview} hitSlop={8}>
          <Text style={[TYPE.bodyDim, styles.reviewLink]}>Question {index + 1} of {total} · Review ▤</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={{ paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.questionCard, SHADOW.lifted]}>
          <LinearGradient colors={accent.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.questionAccentBar} />
          <View style={styles.questionBody}>
            <Text style={TYPE.questionText}>{question.question}</Text>
          </View>
        </View>

        <View style={{ marginTop: 18 }}>
          {question.options.map((opt, i) => {
            const isSelected = i === selected;
            return (
              <Pressable key={i} onPress={() => onSelectOption(i)}>
                <View style={[styles.optionBase, isSelected && { borderColor: accent.solid, backgroundColor: accent.pale }]}>
                  <View style={[styles.letterBadge, { backgroundColor: isSelected ? accent.solid : accent.pale }]}>
                    <Text style={[styles.letterText, { color: isSelected ? '#fff' : accent.text }]}>{OPTION_LETTERS[i]}</Text>
                  </View>
                  <Text style={[TYPE.body, { flex: 1 }]}>{opt}</Text>
                  {isSelected && <Text style={{ fontSize: 16, color: accent.text }}>●</Text>}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottomControls}>
        <View style={styles.bottomRow}>
          <TrainButton label="◀" variant="ghost" onPress={onPrev} disabled={index === 0} style={styles.navBtn} />
          <TrainButton label="Skip" variant="ghost" onPress={skip} style={styles.skipBtn} />
          <TrainButton
            label={isLast ? 'Review & Submit' : 'Next Stop'}
            onPress={isLast ? onOpenReview : onNext}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20 },
  scrollArea: { flex: 1, flexShrink: 1, minHeight: 0, marginTop: 10 },
  bottomControls: { flexShrink: 0, flexGrow: 0 },
  timerRow: { alignItems: 'center', marginBottom: 6 },
  timerText: { fontSize: 15, fontWeight: '800', color: COLORS.text, backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  railWrap: { height: 34, justifyContent: 'center', marginBottom: 4 },
  railTrack: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  railTie: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.45)', borderWidth: 1.5, borderColor: 'transparent' },
  railTieAnswered: { backgroundColor: '#FFFFFF' },
  railTieSkipped: { backgroundColor: 'transparent', borderColor: '#FFFFFF' },
  railEngine: { position: 'absolute', marginLeft: -12, top: -8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  subjectPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.pill },
  subjectPillText: { fontSize: 12, fontWeight: '800' },
  reviewLink: { textDecorationLine: 'underline' },
  questionCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, overflow: 'hidden' },
  questionAccentBar: { height: 8, width: '100%' },
  questionBody: { padding: 18 },
  optionBase: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 58,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    marginBottom: 10,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 8,
    ...SHADOW.soft,
  },
  letterBadge: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  letterText: { fontWeight: '800' },
  bottomRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch', marginTop: 6 },
  navBtn: { minWidth: 52, paddingHorizontal: 10 },
  skipBtn: { minWidth: 74, paddingHorizontal: 10 },
});
