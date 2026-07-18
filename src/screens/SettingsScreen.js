import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { COLORS, TYPE, RADIUS } from '../theme/theme';
import { TrainButton, ScreenTitle, Subtitle } from '../components/UI';
import { DIFFICULTIES } from '../utils/constants';
import { DEFAULT_MODEL } from '../services/gemini';

export default function SettingsScreen({ current, onSave, onBack, saving, onSwitchProfile, onReset }) {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(current.model || DEFAULT_MODEL);
  const [difficulty, setDifficulty] = useState(current.difficulty || 'Medium');

  function confirmReset() {
    Alert.alert(
      `Reset ${current.studentName}'s progress?`,
      'This clears the streak, Hall of Fame history, and Repair Yard for this engineer. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: onReset },
      ]
    );
  }

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 40 }}>
      <ScreenTitle>Settings</ScreenTitle>
      <Subtitle>Update anything, any time.</Subtitle>

      <Text style={styles.label}>Engineer</Text>
      <View style={[styles.input, styles.readOnly]}>
        <Text style={TYPE.body}>{current.studentName}</Text>
      </View>
      <Text style={styles.help}>To play under a different name, switch profiles below.</Text>

      <Text style={styles.label}>Gemini API key</Text>
      <TextInput
        style={styles.input}
        value={apiKey}
        onChangeText={setApiKey}
        placeholder="Saved — enter a new key to replace it"
        placeholderTextColor={COLORS.textDim}
        secureTextEntry
        autoCapitalize="none"
      />
      <Text style={styles.help}>Shared by every engineer on this device.</Text>

      <Text style={styles.label}>Gemini model</Text>
      <TextInput style={styles.input} value={model} onChangeText={setModel} placeholderTextColor={COLORS.textDim} autoCapitalize="none" />
      <Text style={styles.help}>If Gemini ever retires this model, change it here — no app update needed.</Text>

      <Text style={styles.label}>Difficulty</Text>
      <View style={styles.row}>
        {DIFFICULTIES.map((d) => (
          <View key={d} style={{ marginRight: 8, marginBottom: 8 }}>
            <TrainButton label={d} variant={difficulty === d ? 'primary' : 'ghost'} onPress={() => setDifficulty(d)} style={{ paddingHorizontal: 18, minHeight: 44 }} />
          </View>
        ))}
      </View>

      <View style={{ height: 16 }} />
      <TrainButton
        label={saving ? 'Saving…' : 'Save Changes'}
        onPress={() => onSave({ apiKey: apiKey.trim(), model: model.trim() || DEFAULT_MODEL, difficulty })}
        disabled={saving}
      />
      <TrainButton label="Back" variant="ghost" onPress={onBack} style={{ marginTop: 10 }} />

      <View style={styles.dangerZone}>
        <Text style={[TYPE.bodyDim, styles.dangerLabel]}>ENGINEER MANAGEMENT</Text>
        <TrainButton label="Switch Profile" variant="ghost" onPress={onSwitchProfile} style={{ marginBottom: 10 }} />
        <TrainButton label="Reset This Engineer's Progress" variant="danger" onPress={confirmReset} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg },
  label: { ...TYPE.body, fontWeight: '700', marginTop: 18, marginBottom: 6 },
  input: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: COLORS.text },
  readOnly: { backgroundColor: COLORS.track },
  help: { ...TYPE.bodyDim, fontSize: 12, marginTop: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  dangerZone: { marginTop: 36, paddingTop: 20, borderTopWidth: 1, borderTopColor: COLORS.track },
  dangerLabel: { fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
});
