import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { COLORS, TYPE, RADIUS } from '../theme/theme';
import { TrainButton, ScreenTitle, Subtitle } from '../components/UI';
import { DIFFICULTIES } from '../utils/constants';

// Adding an engineer after the device is already set up — just a name and
// a difficulty. The Gemini API key and model are global (one device, one
// Gemini account, shared across everyone playing), so this screen never
// asks for them again.
export default function NewProfileScreen({ onSave, onBack, saving }) {
  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');

  function submit() {
    if (!name.trim()) return Alert.alert('Almost there!', "What's the new engineer's name?");
    onSave({ studentName: name.trim(), difficulty });
  }

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
      <ScreenTitle>New Engineer</ScreenTitle>
      <Subtitle>Just a name and a starting difficulty.</Subtitle>

      <Text style={styles.label}>Engineer's name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. John Doe" placeholderTextColor={COLORS.textDim} />

      <Text style={styles.label}>Difficulty</Text>
      <View style={styles.row}>
        {DIFFICULTIES.map((d) => (
          <View key={d} style={{ marginRight: 8, marginBottom: 8 }}>
            <TrainButton
              label={d}
              variant={difficulty === d ? 'primary' : 'ghost'}
              onPress={() => setDifficulty(d)}
              style={{ paddingHorizontal: 18, minHeight: 44 }}
            />
          </View>
        ))}
      </View>

      <View style={{ height: 16 }} />
      <TrainButton label={saving ? 'Saving…' : 'Depart Now'} onPress={submit} disabled={saving} />
      <TrainButton label="Back" variant="ghost" onPress={onBack} style={{ marginTop: 10 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg },
  label: { ...TYPE.body, fontWeight: '700', marginTop: 18, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
});
