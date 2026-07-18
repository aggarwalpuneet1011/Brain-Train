import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { COLORS, TYPE } from '../theme/theme';
import { TrainButton, Card, Pill } from '../components/UI';
import { BRAND, starsForScore, scoreBucketKey } from '../utils/constants';

export default function ResultsScreen({
  subject, score, total, pkg, answers, streakInfo, isNewHighScore, onShare, onDone,
}) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const stars = starsForScore(score, total);
  const isPerfect = score === total;

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 40 }}>
      <Text style={{ fontSize: 40, textAlign: 'center' }}>{isPerfect ? '🚄' : '🚂'}</Text>
      <Text style={[TYPE.h1, { textAlign: 'center', marginTop: 8 }]}>
        {isPerfect ? BRAND.perfectScore : BRAND.quizComplete}
      </Text>
      <Text style={[TYPE.bodyDim, { textAlign: 'center', marginTop: 4 }]}>{subject}</Text>

      <Card style={{ alignItems: 'center', marginTop: 20 }}>
        <Text style={TYPE.h1}>{score} / {total}</Text>
        <Text style={{ fontSize: 28, letterSpacing: 4, marginTop: 4 }}>
          {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
        </Text>
      </Card>

      {(pkg?.coach_tip || pkg?.score_feedback) && (
        <Card style={{ marginTop: 14, backgroundColor: COLORS.cream }}>
          <Text style={[TYPE.body, { fontWeight: '700', marginBottom: 4 }]}>🧑‍✈️ Coach's Note</Text>
          <Text style={TYPE.bodyDim}>{scoreFeedbackFor(pkg, score, total) || pkg?.coach_tip}</Text>
        </Card>
      )}

      {(streakInfo?.isNewMilestone || isNewHighScore) && (
        <View style={styles.badgeRow}>
          {streakInfo?.isNewMilestone && <Pill label={`🔥 ${streakInfo.count}-day streak!`} tone="mint" />}
          {isNewHighScore && <Pill label="🏆 New high score!" tone="lavender" />}
        </View>
      )}

      <TrainButton label="Share on WhatsApp" variant="ghost" onPress={onShare} style={{ marginTop: 20 }} />
      <TrainButton
        label={reviewOpen ? 'Hide Full Review' : 'Full Review'}
        variant="ghost"
        onPress={() => setReviewOpen((v) => !v)}
        style={{ marginTop: 10 }}
      />

      {reviewOpen && (
        <View style={{ marginTop: 14 }}>
          {answers.map((a, i) => (
            <Card key={a.id || i} style={{ marginBottom: 10 }}>
              <Text style={[TYPE.body, { fontWeight: '700' }]}>{i + 1}. {a.question}</Text>
              <Text style={{ marginTop: 6, color: a.correct ? COLORS.success : COLORS.danger, fontWeight: '700' }}>
                {a.correct ? 'Correct' : `Your answer: ${a.selectedText}`}
              </Text>
              {!a.correct && <Text style={TYPE.bodyDim}>Correct answer: {a.correctText}</Text>}
              <Text style={[TYPE.bodyDim, { marginTop: 4 }]}>{a.explanation}</Text>
            </Card>
          ))}
        </View>
      )}

      <TrainButton label="Back to Dashboard" onPress={onDone} style={{ marginTop: 20 }} />
    </ScrollView>
  );
}

function scoreFeedbackFor(pkg, score, total) {
  const key = scoreBucketKey(score, total);
  return pkg?.score_feedback?.[key];
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, justifyContent: 'center' },
});
