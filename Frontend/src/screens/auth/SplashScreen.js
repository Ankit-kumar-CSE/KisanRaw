import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import logo from '../../logo.png';

export default function SplashScreen() {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <Animated.View style={[styles.center, { opacity: fade, transform: [{ scale }] }]}>
        <Image source={logo} style={{ width: 180, height: 48 }} resizeMode="contain" />
        <Text style={styles.tagline}>Smart Procurement. Less Waiting.</Text>
      </Animated.View>
      <Text style={styles.footer}>Punjab Mandi Procurement Grid · Rabi 2026-27</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#004625' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  tagline: { color: '#AFF2C2', fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  footer: { color: 'rgba(175,242,194,0.6)', fontSize: 11, textAlign: 'center', paddingBottom: 24 },
});
