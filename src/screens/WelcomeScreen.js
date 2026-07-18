import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, TYPE, RADIUS, SHADOW } from '../theme/theme';
import { TrainButton, Eyebrow } from '../components/UI';
import { BRAND } from '../utils/constants';

const SPARKLES = [
  { emoji: '✨', top: '14%', left: '10%', size: 22, delay: 0 },
  { emoji: '⭐', top: '20%', right: '12%', size: 18, delay: 300 },
  { emoji: '💫', top: '58%', left: '6%', size: 20, delay: 600 },
];

function Sparkle({ emoji, top, left, right, size, delay }) {
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(float, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const opacity = float.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  return (
    <Animated.Text
      style={[
        styles.sparkle,
        { top, left, right, fontSize: size, opacity, transform: [{ translateY }] },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

export default function WelcomeScreen({ onContinue, returning }) {
  const heroScale = useRef(new Animated.Value(0.9)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(heroScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      Animated.timing(heroOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <LinearGradient colors={GRADIENTS.sky} style={styles.wrap}>
      {SPARKLES.map((s, i) => <Sparkle key={i} {...s} />)}

      <View style={styles.hero}>
        <Animated.View
          style={[
            styles.heroImageWrap,
            SHADOW.lifted,
            { opacity: heroOpacity, transform: [{ scale: heroScale }, { rotate: '-2deg' }] },
          ]}
        >
          <Image source={require('../../assets/icon.png')} style={styles.heroImage} />
        </Animated.View>

        <Eyebrow style={{ marginTop: 28, color: COLORS.skyDeep }}>Brain Train</Eyebrow>
        <Text style={[TYPE.display, styles.title]}>{BRAND.welcome}</Text>
        <Text style={[TYPE.body, styles.tagline]}>{BRAND.tagline}</Text>
      </View>

      <View style={styles.trackDots}>
        {Array.from({ length: 9 }).map((_, i) => (
          <View key={i} style={[styles.tie, i % 2 === 0 && { backgroundColor: COLORS.coral }]} />
        ))}
      </View>

      <TrainButton
        label={returning ? 'Continue Journey' : 'Board the Train'}
        onPress={onContinue}
        style={{ width: '100%' }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroImageWrap: {
    width: '72%',
    aspectRatio: 1,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
  },
  heroImage: { width: '100%', height: '100%' },
  title: { textAlign: 'center', marginTop: 6 },
  tagline: { textAlign: 'center', marginTop: 8, color: COLORS.textDim, fontStyle: 'italic' },
  sparkle: { position: 'absolute', zIndex: 5 },
  trackDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 18,
  },
  tie: {
    width: 14,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.mint,
  },
});
