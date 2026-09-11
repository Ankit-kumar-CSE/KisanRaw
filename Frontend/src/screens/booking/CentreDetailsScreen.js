import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { farmer as C } from '../../theme/colors';
import { useLang } from '../../i18n';
import { getCentre, getAvailableSlots } from '../../services/centreService';
import { Card, Chip, Button, CardSkeleton, LabelCaps } from '../../components/ui';

export default function CentreDetailsScreen({ navigation, route }) {
  const { t } = useLang();
  const [centre, setCentre] = useState(route.params?.centre || null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);

  useEffect(() => {
    if (!centre && route.params?.centreId) {
      getCentre(route.params.centreId).then(setCentre);
    }
  }, []);

  useEffect(() => {
    if (centre) {
      setLoadingSlots(true);
      const today = new Date().toISOString().slice(0, 10);
      getAvailableSlots(centre.id, today).then((s) => { setSlots(s); setLoadingSlots(false); });
    }
  }, [centre?.id]);

  if (!centre) {
    return <View style={{ flex: 1, backgroundColor: C.background, padding: 14 }}><CardSkeleton /></View>;
  }

  const openDirections = () => {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${centre.name}, ${centre.address}`)}&travelmode=driving`);
  };

  const slotMeta = {
    available: { bg: '#85F8C4', fg: '#00210F' },
    limited: { bg: C.secondaryFixed, fg: '#2F1500' },
    full: { bg: C.errorContainer, fg: '#93000A' },
    closed: { bg: C.surfaceContainerHigh, fg: '#404941' },
  };

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circle}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={C.onSurface} />
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: '800', color: C.onSurface, flex: 1 }} numberOfLines={1}>{t('centreDetails')}</Text>
        <TouchableOpacity onPress={openDirections} style={styles.circle}>
          <MaterialCommunityIcons name="navigation-variant" size={18} color={C.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: 120 }}>
        <Card style={{ borderRadius: 16, padding: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: C.primaryFixed, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="storefront" size={25} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: C.onSurface }}>{centre.name}</Text>
              <Text style={{ fontSize: 12, color: C.onSurfaceVariant }}>{centre.address}</Text>
              <Text style={{ fontSize: 11, color: C.outline }}>Reg: {centre.id}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            <Chip label={`${centre.distanceKm} km`} bg={C.tertiaryFixed} fg={C.tertiary} icon="map-marker-distance" />
            <Chip label={`${centre.waitingFarmers} ${t('farmersWaiting')}`} bg={C.secondaryFixed} fg="#2F1500" icon="account-group" />
            <Chip label={`~${centre.waitMins} ${t('minLbl')}`} bg="#85F8C4" fg="#00210F" icon="timer-sand" />
            <Chip label={`${centre.freePct}% ${t('capacityAvail')}`} bg="#85F8C4" fg="#00210F" icon="warehouse" />
          </View>
        </Card>

        {/* map snapshot → Google Maps */}
        <Card style={{ borderRadius: 14, padding: 14, gap: 10 }}>
          <LabelCaps>{t('centreTag')}</LabelCaps>
          <Button title={t('getDirections')} icon="navigation-variant" onPress={openDirections} />
          <Text style={{ fontSize: 10.5, color: C.onSurfaceVariant, textAlign: 'center' }}>
            Tractor mode: turn-by-turn works without mobile data.
          </Text>
        </Card>

        {/* info */}
        <Card style={{ borderRadius: 14, padding: 14, gap: 8 }}>
          <Row icon="clock-outline" label={t('operatingHours')} value={centre.hours} />
          <Row icon="scale-balance" label="Weighbridge" value={centre.bays} />
          <Row icon="sprout" label={t('cropLbl')} value={centre.crops.length ? centre.crops.join(', ') : '—'} />
        </Card>

        {/* today's slots */}
        <Card style={{ borderRadius: 14, padding: 14, gap: 10 }}>
          <LabelCaps>{t('todaySlots')}</LabelCaps>
          {loadingSlots ? (
            [1, 2, 3].map((i) => <CardSkeleton key={i} />)
          ) : slots.length === 0 ? (
            <Text style={{ fontSize: 12.5, color: C.onSurfaceVariant }}>No slots are currently available.</Text>
          ) : (
            slots.map((s) => {
              const m = slotMeta[s.status];
              return (
                <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceContainerLow, borderRadius: 12, padding: 12, gap: 10 }}>
                  <MaterialCommunityIcons name="clock-time-four" size={20} color={C.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13.5, fontWeight: '700', color: C.onSurface }}>{s.label}</Text>
                    <Text style={{ fontSize: 11, color: s.status === 'available' ? '#006C4A' : s.status === 'limited' ? C.secondary : '#93000A', fontWeight: '700' }}>
                      {s.status === 'full' ? t('slotFull') : s.status === 'closed' ? t('slotClosed') : t('qAvail', { q: s.qAvailable })}
                    </Text>
                  </View>
                  <Chip label={s.status.toUpperCase()} bg={m.bg} fg={m.fg} size={9} />
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>

      {/* bottom CTA */}
      <View style={styles.bottomBar}>
        <Button
          title={t('bookHere')} icon="calendar-plus" style={{ flex: 1 }}
          disabled={centre.status === 'closed'}
          onPress={() => navigation.navigate('BookingFlow', { centre })}
        />
      </View>
    </SafeAreaView>
  );
}

function Row({ icon, label, value }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <MaterialCommunityIcons name={icon} size={17} color={C.primary} />
      <Text style={{ fontSize: 12.5, color: C.onSurfaceVariant, width: 120 }}>{label}</Text>
      <Text style={{ fontSize: 12.5, fontWeight: '700', color: C.onSurface, flex: 1 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 10 },
  circle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  bottomBar: { padding: 14, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.surfaceContainer },
});
