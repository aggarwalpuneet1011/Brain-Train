import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, RADIUS, TYPE, TOUCH_MIN, SHADOW } from '../theme/theme';

// Optional-chained haptics, same defensive pattern as FableAble — never
// throws if the module or hardware isn't available.
let Haptics;
try { Haptics = require('expo-haptics'); } catch (e) { Haptics = null; }
function tap() { try { Haptics?.selectionAsync?.(); } catch (e) {} }

export function Card({ children, style, elevated }) {
  return <View style={[styles.card, elevated && SHADOW.lifted, style]}>{children}</View>;
}

// Big, springy, gradient-filled button — the PRD calls for "smooth spring
// animations and subtle micro-interactions" on every touch target. Primary
// uses the icon's gold-to-coral gradient so the CTA reads as the one warm,
// unmissable thing on an otherwise cool-toned screen.
export function TrainButton({ label, onPress, variant = 'primary', disabled, style }) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();

  const content = (
    <Text style={[TYPE.button, { color: variant === 'ghost' ? COLORS.text : '#3A2100' }]}>{label}</Text>
  );

  return (
    <Animated.View style={[{ transform: [{ scale }] }, { opacity: disabled ? 0.5 : 1 }]}>
      <Pressable
        disabled={disabled}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={() => { tap(); onPress?.(); }}
        style={style}
      >
        {variant === 'primary' && (
          <LinearGradient colors={GRADIENTS.cta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.button, SHADOW.soft]}>
            {content}
          </LinearGradient>
        )}
        {variant === 'danger' && (
          <View style={[styles.button, { backgroundColor: COLORS.danger }]}>
            <Text style={[TYPE.button, { color: '#fff' }]}>{label}</Text>
          </View>
        )}
        {variant === 'ghost' && (
          <View style={[styles.button, styles.buttonGhost]}>{content}</View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function Pill({ label, tone = 'sky' }) {
  const bg = { sky: COLORS.sky, mint: COLORS.mint, lavender: COLORS.lavender, cream: COLORS.cream, coral: COLORS.coral, gold: COLORS.gold }[tone] || COLORS.sky;
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

export function ScreenTitle({ children, style }) {
  return <Text style={[TYPE.h1, { marginBottom: 4 }, style]}>{children}</Text>;
}

export function Subtitle({ children, style }) {
  return <Text style={[TYPE.bodyDim, { marginBottom: 16 }, style]}>{children}</Text>;
}

// Small uppercase label used above a headline for a bit of editorial polish
// ("CHOOSE YOUR DESTINATION" style kicker text).
export function Eyebrow({ children, style }) {
  return <Text style={[TYPE.eyebrow, { textTransform: 'uppercase' }, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: 18,
    ...SHADOW.soft,
  },
  button: {
    minHeight: TOUCH_MIN,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  buttonGhost: {
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.track,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
  },
  pillText: { fontSize: 13, fontWeight: '700', color: '#2A1B00' },
});
