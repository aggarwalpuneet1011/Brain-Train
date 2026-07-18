import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { COLORS, TYPE, RADIUS } from '../theme/theme';
import { TrainButton, ScreenTitle, Subtitle, Pill } from '../components/UI';
import { DIFFICULTIES } from '../utils/constants';
import { DEFAULT_MODEL } from '../services/gemini';

export default function SetupScreen({ initial, onSave, saving }) {
  const [name, setName] = useState(initial?.studentName || '');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(initial?.model || DEFAULT_MODEL);
  const [difficulty, setDifficulty] = useState(initial?.difficulty || 'Medium');

  function submit() {
    if (!name.trim()) return Alert.alert('Almost there!', "What's the engineer's name?");
    if (!apiKey.trim() && !initial?.hasKey) {
      return Alert.alert('Gemini API Key needed', 'Brain Train needs your Gemini API key to build quizzes. You can get one free at aistudio.google.com.');
    }
    onSave({ studentName: name.trim(), apiKey: apiKey.trim(), model: model.trim() || DEFAULT_MODEL, difficulty });
  }

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
      <ScreenTitle>Let's get you aboard</ScreenTitle>
      <Subtitle>Just a few details before your first journey.</Subtitle>

      <Text style={styles.label}>Engineer's name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. John Doe" placeholderTextColor={COLORS.textDim} />

      <Text style={styles.label}>Gemini API key</Text>
      <TextInput
        style={styles.input}
        value={apiKey}
        onChangeText={setApiKey}
        placeholder={initial?.hasKey ? 'Saved — enter a new key to replace it' : 'Paste your key here'}
        placeholderTextColor={COLORS.textDim}
        secureTextEntry
        autoCapitalize="none"
      />
      <Text style={styles.help}>Get a free key at aistudio.google.com. Stored encrypted on this device only — never sent anywhere but Google's API.</Text>

      <Text style={styles.label}>Gemini model</Text>
      <TextInput style={styles.input} value={model} onChangeText={setModel} placeholder={DEFAULT_MODEL} placeholderTextColor={COLORS.textDim} autoCapitalize="none" />
      <Text style={styles.help}>Default is fine. Change this later in Settings if a model is ever retired — no update needed.</Text>

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
  help: { ...TYPE.bodyDim, fontSize: 12, marginTop: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
});
