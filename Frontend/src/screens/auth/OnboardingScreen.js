import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLang, LANGS } from '../../i18n';
import { useStore } from '../../store/AppStore';
import { Button } from '../../components/ui';

const SLIDES = [
  { icon: 'calendar-check', tint: '#AFF2C2', bg: '#004625', key: 'ob1' },
  { icon: 'podium', tint: '#FFDCC3', bg: '#904D00', key: 'ob2' },
  { icon: 'cash-check', tint: '#DBE1FF', bg: '#003491', key: 'ob3' },
];

export default function OnboardingScreen() {
  const { t, lang, setLang } = useLang();
  const { completeOnboarding } = useStore();
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];
  const last = idx === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.screen}>
      {/* language selection */}
      <Text style={styles.langTitle}>{t('chooseLang')}</Text>
      <View style={styles.langRow}>
        {LANGS.map((l) => (
          <TouchableOpacity key={l.code} onPress={() => setLang(l.code)} style={[styles.langBtn, lang === l.code && styles.langBtnActive]}>
            <Text style={{ fontWeight: '800', fontSize: 13, color: lang === l.code ? '#fff' : '#131B2E' }}>{l.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* slide */}
      <View style={styles.slide}>
        <View style={[styles.slideIcon, { backgroundColor: slide.bg }]}>
          <MaterialCommunityIcons name={slide.icon} size={54} color={slide.tint} />
        </View>
        <Text style={styles.slideTitle}>{t(`${slide.key}t`)}</Text>
        <Text style={styles.slideBody}>{t(`${slide.key}b`)}</Text>
      </View>

      {/* dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === idx && styles.dotActive]} />
        ))}
      </View>

      {/* actions */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={completeOnboarding} style={styles.skip}>
          <Text style={{ color: '#404941', fontWeight: '700', fontSize: 13 }}>{t('skip')}</Text>
        </TouchableOpacity>
        <Button
          title={last ? t('getStarted') : t('next')}
          icon={last ? 'arrow-right' : null}
          onPress={() => (last ? completeOnboarding() : setIdx(idx + 1))}
          style={{ flex: 1 }}
        />
      </View>
      <Text style={styles.helpline} onPress={() => Linking.openURL('tel:18001801551')}>
        Helpline: 1800-180-1551
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAF8FF', paddingHorizontal: 22 },
  langTitle: { fontSize: 12, fontWeight: '700', color: '#404941', marginTop: 10 },
  langRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  langBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: '#EAEDFF' },
  langBtnActive: { backgroundColor: '#004625' },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  slideIcon: { width: 110, height: 110, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  slideTitle: { fontSize: 24, fontWeight: '800', color: '#131B2E', textAlign: 'center' },
  slideBody: { fontSize: 14.5, color: '#404941', textAlign: 'center', lineHeight: 22, paddingHorizontal: 12 },
  dots: { flexDirection: 'row', gap: 7, justifyContent: 'center', marginBottom: 18 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#DAE2FD' },
  dotActive: { width: 22, backgroundColor: '#004625' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 10 },
  skip: { paddingHorizontal: 8 },
  helpline: { textAlign: 'center', color: '#904D00', fontSize: 12, fontWeight: '700', paddingBottom: 12 },
});
