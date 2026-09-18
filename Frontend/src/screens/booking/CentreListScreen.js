import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { farmer as C } from '../../theme/colors';
import { useLang } from '../../i18n';
import { getProcurementCentres } from '../../services/centreService';
import { Card, Chip, PulseDot, Segmented, CardSkeleton, EmptyState, Button, LabelCaps } from '../../components/ui';
import MockMap from '../../components/MockMap';
import { useStore } from '../../store/AppStore';

export default function CentreListScreen({ navigation }) {
  const { t } = useLang();
  const { online, userLocation, locationGranted } = useStore();
  const [view, setView] = useState('list');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [centres, setCentres] = useState([]);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await getProcurementCentres();
      setCentres(data);
      setSelected(data.find((c) => c.recommended) || data[0] || null);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = centres.filter((c) =>
    !query || `${c.name} ${c.id} ${c.address}`.toLowerCase().includes(query.toLowerCase())
  );

  const statusMeta = {
    open: { label: t('open'), bg: '#006C4A' },
    busy: { label: t('busy'), bg: C.secondaryContainer },
    closed: { label: t('closed'), bg: '#9AA3B0' },
  };

  const openDirections = (centre) => {
    if (!centre) return;
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${centre.name}, ${centre.address}`)}&travelmode=driving`);
  };

  return (
    <View style={styles.screen}>
      {/* header */}
      <View style={{ paddingHorizontal: 14, paddingTop: 12, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MaterialCommunityIcons name="map-search" size={20} color={C.primary} />
          <Text style={{ fontSize: 17, fontWeight: '800', color: C.onSurface, flex: 1 }}>{t('centresTitle')}</Text>
          <View style={[styles.gpsChip, !locationGranted && { backgroundColor: '#FFDAD6' }]}>
            <MaterialCommunityIcons name="crosshairs-gps" size={13} color={locationGranted ? C.primary : '#93000A'} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: locationGranted ? C.onSurface : '#93000A' }}>
              {locationGranted ? '±12m' : 'No GPS'}
            </Text>
          </View>
        </View>
        {!online && (
          <View style={styles.offlineBar}>
            <MaterialCommunityIcons name="wifi-off" size={14} color="#93000A" />
            <Text style={{ fontSize: 11.5, color: '#93000A', fontWeight: '700', flex: 1 }}>{t('offlineBanner')}</Text>
          </View>
        )}
        {/* search */}
        <View style={styles.searchRow}>
          <MaterialCommunityIcons name="magnify" size={20} color={C.outline} />
          <TextInput value={query} onChangeText={setQuery} placeholder={t('searchPh')} placeholderTextColor={C.outline} style={{ flex: 1, fontSize: 14, color: C.onSurface }} />
          {query ? <TouchableOpacity onPress={() => setQuery('')}><MaterialCommunityIcons name="close-circle" size={18} color={C.outline} /></TouchableOpacity> : null}
        </View>
        <Segmented options={[{ value: 'list', label: t('listV') }, { value: 'map', label: t('mapV') }]} value={view} onChange={setView} />
      </View>

      {loading ? (
        <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }}>
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </ScrollView>
      ) : loadError ? (
        <EmptyState icon="wifi-off" title={t('unableLoad')} actionLabel={t('retry')} onAction={load} />
      ) : view === 'map' ? (
        <ScrollView contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: 110 }}>
          <MockMap centres={filtered} userLocation={userLocation} selectedId={selected?.id} onSelect={setSelected} />
          {selected && (
            <Card style={{ borderRadius: 18, padding: 14, gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 15.5, fontWeight: '800', color: C.onSurface, flex: 1 }}>{selected.name}</Text>
                <Chip label={statusMeta[selected.status].label} bg={statusMeta[selected.status].bg} fg="#fff" />
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                <Text style={styles.mFact}><Text style={{ fontWeight: '800' }}>{selected.distanceKm} km</Text></Text>
                <Text style={styles.mFact}>{selected.waitingFarmers} {t('farmersWaiting')}</Text>
                <Text style={styles.mFact}>{t('estWaitLbl')}: ~{selected.waitMins} {t('minLbl')}</Text>
                <Text style={styles.mFact}>{selected.freePct}% {t('capacityAvail')}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button title={t('viewDetails')} variant="secondary" style={{ flex: 1 }} onPress={() => navigation.navigate('CentreDetails', { centre: selected })} />
                <Button title={t('bookHere')} icon="calendar-plus" style={{ flex: 1 }} disabled={selected.status === 'closed'} onPress={() => navigation.navigate('BookingFlow', { centre: selected })} />
              </View>
            </Card>
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: 110 }}>
          {/* recommendation */}
          {centres.find((c) => c.recommended) && (
            <Card style={{ borderRadius: 14, padding: 12, flexDirection: 'row', gap: 10, backgroundColor: 'rgba(175,242,194,0.3)' }}>
              <MaterialCommunityIcons name="star-circle" size={22} color={C.primary} />
              <View style={{ flex: 1 }}>
                <LabelCaps color={C.primary}>{t('recommended')}</LabelCaps>
                <Text style={{ fontSize: 12, color: C.onSurfaceVariant, marginTop: 2 }}>{t('recReason')}</Text>
              </View>
            </Card>
          )}
          {filtered.map((m) => {
            const st = statusMeta[m.status];
            return (
              <Card key={m.id} style={{ borderRadius: 16, padding: 14, gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: m.status === 'closed' ? C.surfaceContainerHigh : C.primaryFixed, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name="storefront" size={23} color={C.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={{ fontSize: 14.5, fontWeight: '800', color: C.onSurface }}>{m.name}</Text>
                      {m.recommended && <Chip label={`★ ${t('recommended').replace('Recommended for you', 'Recommended')}`} bg={C.secondaryFixed} fg="#2F1500" size={9} />}
                    </View>
                    <Text style={{ fontSize: 11, color: C.onSurfaceVariant }} numberOfLines={1}>{m.address}</Text>
                    <Text style={{ fontSize: 10.5, color: C.outline }}>Reg: {m.id}</Text>
                  </View>
                  <Chip label={st.label} bg={st.bg} fg="#fff" size={10} />
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <Metric icon="map-marker-distance" tileBg={C.tertiaryFixed} value={`${m.distanceKm} km`} label="Distance" fg={C.tertiary} />
                  <Metric icon="account-group" tileBg={C.secondaryFixed} value={`${m.waitingFarmers}`} label={t('farmersWaiting')} fg={C.secondary} />
                  <Metric icon="timer-sand" tileBg="#85F8C4" value={`~${m.waitMins}m`} label={t('estWaitLbl')} fg="#006C4A" />
                  <Metric icon="warehouse" tileBg="#85F8C4" value={`${m.freePct}%`} label={t('capacityAvail')} fg="#006C4A" />
                </View>

                <View style={{ backgroundColor: C.surfaceContainerLow, borderRadius: 10, padding: 10, gap: 3 }}>
                  <Text style={styles.detail}>🕒 {t('operatingHours')}: {m.hours}</Text>
                  <Text style={styles.detail}>🌾 {m.crops.length ? m.crops.join(', ') : '—'}</Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button title={t('viewDetails')} variant="secondary" style={{ flex: 1 }} onPress={() => navigation.navigate('CentreDetails', { centre: m })} />
                  <Button title={t('bookHere')} icon="calendar-plus" style={{ flex: 1 }} disabled={m.status === 'closed'} onPress={() => navigation.navigate('BookingFlow', { centre: m })} />
                </View>
              </Card>
            );
          })}
          {!filtered.length && <EmptyState icon="storefront-outline" title={t('noBookings')} sub={t('searchPh')} />}
        </ScrollView>
      )}
    </View>
  );
}

function Metric({ icon, tileBg, value, label, fg }) {
  return (
    <View style={{ flex: 1, minWidth: '46%', backgroundColor: C.surfaceContainerLow, borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: tileBg, alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name={icon} size={18} color={fg} />
      </View>
      <View>
        <Text style={{ fontSize: 15, fontWeight: '800', color: C.onSurface }}>{value}</Text>
        <Text style={{ fontSize: 10, color: C.onSurfaceVariant }} numberOfLines={1}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  gpsChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, elevation: 2 },
  offlineBar: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFDAD6', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 12, height: 48, borderWidth: 1, borderColor: C.surfaceContainerHighest },
  mFact: { fontSize: 12, color: C.onSurfaceVariant },
  detail: { fontSize: 12, color: C.onSurface },
});
