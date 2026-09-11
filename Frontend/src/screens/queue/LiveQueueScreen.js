import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { farmer as C } from '../../theme/colors';
import { useLang } from '../../i18n';
import { useStore, activeBookingOf } from '../../store/AppStore';
import { getQueueStatus } from '../../services/queueService';
import { Card, Chip, PulseDot, EmptyState, Button, LabelCaps } from '../../components/ui';

export default function LiveQueueScreen({ navigation, route }) {
  const { t } = useLang();
  const { bookings, online } = useStore();
  const active = activeBookingOf(bookings);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const refresh = useCallback(async () => {
    if (!active || online === false) return;
    setLoading(true);
    const s = await getQueueStatus(active.token);
    setStatus(s);
    setLastUpdated(new Date());
    setLoading(false);
  }, [active?.token, online]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 10000); // poll; later: WebSocket subscription
    return () => clearInterval(timer);
  }, [refresh]);

  if (!active) {
    return (
      <View style={styles.screen}>
        <View style={{ padding: 14 }}>
          <EmptyState icon="podium" title={t('noQueue')} sub={t('noQueueSub')} actionLabel={t('bookCta')} onAction={() => navigation.navigate('Centres')} />
        </View>
      </View>
    );
  }

  const ahead = status?.farmersAhead ?? 0;
  const banner = status?.yourTurn
    ? { text: `${t('yourTurnT')} — ${t('proceedCounter', { c: status.counter })}`, bg: '#AFF2C2', fg: '#00210F', icon: 'bullhorn' }
    : ahead <= 5
      ? { text: t('queueClose5', { n: ahead }), bg: '#FFDCC3', fg: '#2F1500', icon: 'bell' }
      : ahead <= 10
        ? { text: t('queueClose10'), bg: '#DBE1FF', fg: '#003491', icon: 'information' }
        : null;

  const fmtTime = lastUpdated ? lastUpdated.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: 110 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={C.primary} />}
    >
      {/* header row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <MaterialCommunityIcons name="podium" size={20} color={C.primary} />
        <Text style={{ fontSize: 17, fontWeight: '800', color: C.onSurface, flex: 1 }}>{t('liveQueueT')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(175,242,194,0.5)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
          <PulseDot color="#006C4A" size={6} />
          <Text style={{ fontSize: 10, fontWeight: '800', color: C.onPrimaryFixed }}>{online ? 'LIVE' : t('offline').toUpperCase()}</Text>
        </View>
      </View>
      <Text style={{ fontSize: 10.5, color: C.onSurfaceVariant }}>{t('lastUpdated')}: {fmtTime} · {t('refreshHint')}</Text>

      {/* offline banner */}
      {!online && (
        <View style={styles.offlineBar}>
          <MaterialCommunityIcons name="wifi-off" size={15} color="#93000A" />
          <Text style={{ flex: 1, fontSize: 11.5, color: '#93000A', fontWeight: '700' }}>{t('offlineQueue')}</Text>
          <TouchableOpacity onPress={refresh} style={styles.retryBtn}><Text style={{ fontSize: 11, fontWeight: '800', color: '#fff' }}>{t('retry')}</Text></TouchableOpacity>
        </View>
      )}

      {/* notification banner */}
      {banner && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: banner.bg, borderRadius: 12, padding: 12 }}>
          <MaterialCommunityIcons name={banner.icon} size={19} color={banner.fg} />
          <Text style={{ flex: 1, fontSize: 13, fontWeight: '800', color: banner.fg }}>{banner.text}</Text>
        </View>
      )}

      {/* stat grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Stat label={t('yourToken')} value={active.token} big primary />
        <Stat label={t('currentToken')} value={status?.currentToken || '—'} big />
        <Stat label={t('farmersAhead')} value={`${ahead}`} big warn={ahead <= 5} />
        <Stat label={t('estWaiting')} value={`~${status?.estWaitMins ?? '—'} ${t('minLbl')}`} />
        <Stat label={t('counterLbl')} value={`${status?.counter ?? '—'}`} />
        <Stat label={t('centreLbl')} value={active.centreName.split(' ')[0]} small />
      </View>

      {/* visual queue */}
      <Card style={{ borderRadius: 14, padding: 14, gap: 6 }}>
        <LabelCaps>{t('liveQueueT')}</LabelCaps>
        {(status?.queue || []).map((q) => {
          const rowBg = q.isYou ? 'rgba(175,242,194,0.45)' : q.state === 'current' ? 'rgba(255,220,195,0.5)' : '#fff';
          const icon = q.state === 'done' ? 'check-circle' : q.state === 'current' ? 'play-circle' : 'clock-outline';
          const iconColor = q.state === 'done' ? '#006C4A' : q.state === 'current' ? '#904D00' : '#707971';
          return (
            <View key={q.token} style={[styles.qRow, { backgroundColor: rowBg, borderWidth: q.isYou ? 2 : 1, borderColor: q.isYou ? C.primary : C.surfaceContainerHighest }]}>
              <MaterialCommunityIcons name={icon} size={18} color={iconColor} />
              <Text style={{ fontSize: 14, fontWeight: '800', color: C.onSurface, flex: 1, letterSpacing: 1 }}>{q.token}</Text>
              {q.state === 'current' && <Chip label="CURRENT" bg={C.secondaryContainer} fg="#2F1500" size={8} />}
              {q.state === 'waiting' && !q.isYou && <Text style={{ fontSize: 10, color: C.onSurfaceVariant }}>WAITING</Text>}
              {q.isYou && <Chip label="← YOU" bg={C.primary} fg="#fff" size={9} />}
            </View>
          );
        })}
      </Card>

      {/* actions */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button title={t('bookingPassBtn')} icon="qrcode" variant="secondary" style={{ flex: 1 }} onPress={() => navigation.navigate('BookingPass', { bookingId: active.bookingId })} />
        <Button title={t('navigateCentre')} icon="navigation-variant" style={{ flex: 1 }}
          onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(active.centreName)}&travelmode=driving`)} />
      </View>
    </ScrollView>
  );
}

function Stat({ label, value, big, primary, warn, small }) {
  return (
    <View style={{ flexBasis: '31%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 12, padding: 11, gap: 3, elevation: 2 }}>
      <LabelCaps>{label}</LabelCaps>
      <Text numberOfLines={1} style={{ fontSize: small ? 12 : big ? 20 : 15, fontWeight: '800', color: primary ? '#004625' : warn ? '#BA1A1A' : '#131B2E' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  offlineBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFDAD6', borderRadius: 12, padding: 11 },
  retryBtn: { backgroundColor: '#BA1A1A', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  qRow: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    borderRadius: 12, padding: 12,
  },
});
