import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { COLORS, TYPE, SUBJECT_COLORS } from '../theme/theme';
import { Card, TrainButton, ScreenTitle, Subtitle } from '../components/UI';
import { BRAND } from '../utils/constants';

// Shared family logbook — every profile's journeys, merged, newest first.
// Each row deliberately spells out all five fields the entry needs
// (Name, Date, Subject, Difficulty, Score) as labeled rows rather than a
// literal 5-column table, which doesn't fit on a phone width.
export default function EngineersLogScreen({ entries, onBack }) {
  return (
    <View style={styles.wrap}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 24 }}>
        <ScreenTitle>{BRAND.hallOfFame}</ScreenTitle>
        <Subtitle>Every journey, by every engineer.</Subtitle>

        {entries.length === 0 && (
          <Card><Text style={TYPE.bodyDim}>No journeys logged yet — finish a quiz to start the log!</Text></Card>
        )}

        {entries.map((e, i) => {
          const accent = SUBJECT_COLORS[e.subject] || SUBJECT_COLORS.Science;
          return (
            <Card key={i} style={{ marginBottom: 10 }}>
              <View style={styles.topRow}>
                <Text style={[TYPE.body, { fontWeight: '800' }]}>{e.name || 'Engineer'}</Text>
                <Text style={TYPE.h2}>{e.score}/{e.total}</Text>
              </View>
              <View style={styles.bottomRow}>
                <View style={[styles.subjectPill, { backgroundColor: accent.pale }]}>
                  <Text style={[styles.subjectPillText, { color: accent.text }]}>{e.subject}</Text>
                </View>
                <Text style={TYPE.bodyDim}>{e.difficulty} · {e.date}</Text>
              </View>
            </Card>
          );
        })}
      </ScrollView>
      <View style={{ padding: 20 }}>
        <TrainButton label="Back to Dashboard" onPress={onBack} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  subjectPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  subjectPillText: { fontSize: 12, fontWeight: '800' },
});
