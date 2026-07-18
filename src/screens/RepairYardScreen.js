import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { COLORS, TYPE } from '../theme/theme';
import { Card, TrainButton, ScreenTitle, Subtitle } from '../components/UI';
import { BRAND } from '../utils/constants';

// Assumption: "couldn't click on the Question" meant the row had no
// interaction at all (it was a static, non-Pressable Card). Made it
// tappable with a real action — mark it learned and clear it manually,
// rather than only waiting for it to resurface in a future AI-generated
// quiz. If this isn't what you meant (e.g. you wanted a "practice this
// concept" mini-quiz instead), tell me and I'll swap the behavior.
export default function RepairYardScreen({ mistakes, onBack, onMarkLearned }) {
  function confirmLearned(concept) {
    Alert.alert(
      'Mark as learned?',
      `"${concept}" will be removed from the Repair Yard.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: "I've got this", onPress: () => onMarkLearned(concept) },
      ]
    );
  }

  return (
    <View style={styles.wrap}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 24 }}>
        <ScreenTitle>{BRAND.mistakeBucket}</ScreenTitle>
        <Subtitle>Concepts worth another look. Tap one once you've got it.</Subtitle>

        {mistakes.length === 0 && (
          <Card><Text style={TYPE.bodyDim}>Nothing to repair — great work!</Text></Card>
        )}

        {mistakes.map((m, i) => (
          <Pressable key={i} onPress={() => confirmLearned(m.concept)}>
            <Card style={{ marginBottom: 10 }}>
              <View style={styles.topRow}>
                <Text style={[TYPE.body, { fontWeight: '700', flex: 1 }]}>{m.concept}</Text>
                <Text style={styles.tapHint}>tap to clear ✓</Text>
              </View>
              <Text style={[TYPE.bodyDim, { marginTop: 4 }]}>{m.question}</Text>
              <Text style={[TYPE.bodyDim, { marginTop: 4, fontStyle: 'italic' }]}>{m.explanation}</Text>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
      <View style={{ padding: 20 }}>
        <TrainButton label="Back to Dashboard" onPress={onBack} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  tapHint: { fontSize: 11, color: COLORS.textDim, fontWeight: '700' },
});
