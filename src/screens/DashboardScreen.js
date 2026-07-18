import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { COLORS, TYPE, RADIUS, SUBJECT_COLORS } from '../theme/theme';
import { Card, Pill } from '../components/UI';
import { BRAND, SUBJECTS } from '../utils/constants';

const SUBJECT_EMOJI = {
  English: '📖',
  Maths: '🔢',
  Science: '🔬',
  'General Knowledge': '🌍',
  Computers: '💻',
};

export default function DashboardScreen({ studentName, streak, bestScore, mistakeCount, onPickSubject, onOpenHallOfFame, onOpenRepairYard, onOpenSettings }) {
  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 20, paddingTop: 56 }}>
      <View style={styles.headerRow}>
        <View>
          <Text style={TYPE.h1}>Hi, {studentName || 'Engineer'}!</Text>
          <Text style={TYPE.bodyDim}>Ready for today's journey?</Text>
        </View>
        <Pressable onPress={onOpenSettings} style={styles.gear} hitSlop={12}>
          <Text style={{ fontSize: 22 }}>⚙️</Text>
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={TYPE.h2}>{streak}</Text>
          <Text style={TYPE.bodyDim}>Day Streak</Text>
        </Card>
        <Pressable style={{ flex: 1 }} onPress={onOpenHallOfFame}>
          <Card style={styles.statCard}>
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={TYPE.h2}>{bestScore ?? '—'}</Text>
            <Text style={TYPE.bodyDim}>{BRAND.hallOfFame}</Text>
          </Card>
        </Pressable>
      </View>

      <Text style={[TYPE.h2, { marginTop: 24, marginBottom: 12 }]}>{BRAND.chooseDestination}</Text>
      <View style={styles.grid}>
        {SUBJECTS.map((s) => {
          const accent = SUBJECT_COLORS[s] || SUBJECT_COLORS.Science;
          return (
            <Pressable key={s} style={styles.destination} onPress={() => onPickSubject(s)}>
              <Card style={[styles.destCard, { backgroundColor: accent.pale }]}>
                <Text style={styles.destEmoji}>{SUBJECT_EMOJI[s]}</Text>
                <Text style={[TYPE.body, { fontWeight: '700', textAlign: 'center', color: accent.text }]}>{s}</Text>
              </Card>
            </Pressable>
          );
        })}
      </View>

      <Pressable onPress={onOpenRepairYard} style={{ marginTop: 20 }}>
        <Card style={styles.repairCard}>
          <Text style={{ fontSize: 22, marginRight: 12 }}>🔧</Text>
          <View style={{ flex: 1 }}>
            <Text style={[TYPE.body, { fontWeight: '700' }]}>{BRAND.mistakeBucket}</Text>
            <Text style={TYPE.bodyDim}>{mistakeCount} concept{mistakeCount === 1 ? '' : 's'} to review</Text>
          </View>
          {mistakeCount > 0 && <Pill label={String(mistakeCount)} tone="lavender" />}
        </Card>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  gear: { padding: 8 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 20 },
  statEmoji: { fontSize: 24, marginBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-start' },
  destination: { width: '31.5%' },
  destCard: { alignItems: 'center', paddingVertical: 16, paddingHorizontal: 6 },
  destEmoji: { fontSize: 28, marginBottom: 6 },
  repairCard: { flexDirection: 'row', alignItems: 'center' },
});
