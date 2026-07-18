import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { COLORS, TYPE, RADIUS, SHADOW, SUBJECT_COLORS } from '../theme/theme';
import { TrainButton, ScreenTitle, Subtitle } from '../components/UI';

// Shown when the engineer taps "Review & Submit" on the last question, or
// "Review" from the header at any point mid-set. Every question is
// revisitable up until the final Submit — this screen is the map back.
export default function QuizReviewScreen({ subject, questions, answers, onJumpTo, onSubmit, onBack }) {
  const accent = SUBJECT_COLORS[subject] || SUBJECT_COLORS.Science;
  const answeredCount = answers.filter((a) => a && !a.skipped).length;
  const remaining = questions.length - answeredCount;

  return (
    <View style={styles.wrap}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 24 }}>
        <ScreenTitle>Review Your Set</ScreenTitle>
        <Subtitle>
          {answeredCount} of {questions.length} answered{remaining > 0 ? ` · ${remaining} still open` : ' · all done!'}. Tap any question to jump back.
        </Subtitle>

        {questions.map((q, i) => {
          const a = answers[i];
          const status = !a ? 'Not attempted' : a.skipped ? 'Skipped' : 'Answered';
          const statusColor = !a ? COLORS.textDim : a.skipped ? accent.text : COLORS.success;

          return (
            <Pressable key={q.id || i} onPress={() => onJumpTo(i)}>
              <View style={[styles.row, SHADOW.soft]}>
                <View style={[styles.numberBadge, { backgroundColor: accent.pale }]}>
                  <Text style={[styles.numberText, { color: accent.text }]}>{i + 1}</Text>
                </View>
                <Text style={[TYPE.body, { flex: 1 }]} numberOfLines={1}>{q.question}</Text>
                <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TrainButton label="Back to Quiz" variant="ghost" onPress={onBack} style={{ marginBottom: 10 }} />
        <TrainButton label="Submit Quiz" onPress={onSubmit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  numberBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  numberText: { fontWeight: '800', fontSize: 13 },
  statusText: { fontSize: 12, fontWeight: '700', marginLeft: 8 },
  footer: { padding: 20, paddingTop: 12 },
});
