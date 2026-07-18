import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { COLORS, TYPE, RADIUS, SHADOW } from '../theme/theme';
import { TrainButton, ScreenTitle, Subtitle } from '../components/UI';

// "Who's riding?" — no password, just a list of names to continue as. This
// is the "simple drop-down for Continue" from the ask, rendered as a list
// of big tappable rows instead of a native <select>, which isn't a great
// touch target on a phone anyway.
export default function ProfilePickerScreen({ profiles, onSelect, onAddNew, onDelete }) {
  function confirmDelete(name) {
    Alert.alert(
      `Remove ${name}?`,
      'This deletes their streak, Hall of Fame history, and Repair Yard for good. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onDelete(name) },
      ]
    );
  }

  return (
    <View style={styles.wrap}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 60, flexGrow: 1 }}>
        <ScreenTitle>Who's riding today?</ScreenTitle>
        <Subtitle>Pick your name to continue your journey.</Subtitle>

        {profiles.map((name) => (
          <Pressable key={name} onPress={() => onSelect(name)} style={styles.row}>
            <View style={[styles.rowCard, SHADOW.soft]}>
              <View style={styles.avatar}><Text style={{ fontSize: 20 }}>🚂</Text></View>
              <Text style={[TYPE.body, { flex: 1, fontWeight: '700' }]}>{name}</Text>
              <Pressable onPress={() => confirmDelete(name)} hitSlop={10} style={{ padding: 6 }}>
                <Text style={{ fontSize: 16 }}>🗑️</Text>
              </Pressable>
            </View>
          </Pressable>
        ))}

        <View style={{ flex: 1 }} />
        <TrainButton label="＋ New Engineer" variant="ghost" onPress={onAddNew} style={{ marginTop: 16 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg },
  row: { marginBottom: 12 },
  rowCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 14,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.cream,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
});
