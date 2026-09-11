import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { farmer as C } from '../../theme/colors';
import { useLang } from '../../i18n';
import { getAvailableSlots, getDayAvailability } from '../../services/centreService';
import { createBooking } from '../../services/bookingService';
import { useStore } from '../../store/AppStore';
import { Card, Chip, Button, LabelCaps, Skeleton } from '../../components/ui';

const CROPS = [
  { key: 'Wheat', icon: 'barley' },
  { key: 'Paddy', icon: 'grass' },
  { key: 'Maize', icon: 'corn' },
];

// next 10 days for the calendar strip
function nextDays(n) {
  const out = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    out.push(day);
  }
  return out;
}

export default function BookingFlowScreen({ navigation, route }) {
  const { t } = useLang();
  const { refreshBookings, pushNotification } = useStore();
  const centre = route.params?.centre;
  const [step, setStep] = useState(1); // 1 crop, 2 qty, 3 date, 4 slot, 5 review
  const [crop, setCrop] = useState(null);
  const [qty, setQty] = useState('');
  const [qtyErr, setQtyErr] = useState('');
  const [days, setDays] = useState(nextDays(10));
  const [dayAvail, setDayAvail] = useState({});
  const [dateISO, setDateISO] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slot, setSlot] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    // load day availability once
    (async () => {
      const map = {};
      for (const d of days) {
        const iso = d.toISOString().slice(0, 10);
        map[iso] = await getDayAvailability(centre.id, iso);
      }
      setDayAvail(map);
    })();
  }, []);

  useEffect(() => {
    if (!dateISO) return;
    setSlotsLoading(true);
    setSlot(null);
    getAvailableSlots(centre.id, dateISO).then((s) => { setSlots(s); setSlotsLoading(false); });
  }, [dateISO]);

  if (!centre) return null;

  const qtyNum = parseFloat(qty);
  const qtyValid = !isNaN(qtyNum) && qtyNum > 0 && qtyNum <= 500;
  const estProcMins = qtyValid ? Math.max(15, Math.round(qtyNum * 0.5) + 5) : null;

  const confirm = async () => {
    setConfirming(true);
    try {
      const booking = await createBooking({
        centre, crop, quantity: qtyNum, dateISO, slot, slotLabel: slot.label,
      });
      await refreshBookings();
      await pushNotification({ category: 'booking', text: `Your slot is confirmed for ${booking.dateISO} at ${booking.slotLabel}.` });
      navigation.replace('BookingSuccess', { booking });
    } catch {
      Alert.alert('Error', t('bookFail'));
    } finally {
      setConfirming(false);
    }
  };

  const dayMeta = { available: { bg: '#85F8C4', fg: '#00210F' }, limited: { bg: C.secondaryFixed, fg: '#2F1500' }, full: { bg: C.errorContainer, fg: '#93000A' } };
  const slotMeta = {
    available: { bg: '#85F8C4', fg: '#00210F', chip: 'AVAILABLE' },
    limited: { bg: C.secondaryFixed, fg: '#2F1500', chip: 'LIMITED' },
    full: { bg: C.errorContainer, fg: '#93000A', chip: t('slotFull') },
    closed: { bg: C.surfaceContainerHigh, fg: '#404941', chip: t('slotClosed') },
  };

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step === 1 ? navigation.goBack() : setStep(step - 1))} style={styles.circle}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={C.onSurface} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15.5, fontWeight: '800', color: C.onSurface }} numberOfLines={1}>{centre.name}</Text>
          <Text style={{ fontSize: 11, color: C.primary, fontWeight: '700' }}>{t('stepOf', { n: step })} · {t('selectCrop')} / {t('quantity')} / {t('selectSlot')}</Text>
        </View>
      </View>
      <View style={styles.stepBar}>
        {[1, 2, 3, 4, 5].map((s) => <View key={s} style={[styles.stepSeg, s <= step && styles.stepSegOn]} />)}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* STEP 1 — crop */}
        {step === 1 && (
          <>
            <Text style={styles.secTitle}>{t('selectCrop')}</Text>
            {CROPS.map((c) => {
              const on = crop === c.key;
              return (
                <TouchableOpacity key={c.key} onPress={() => setCrop(c.key)} style={[styles.pickRow, on && styles.pickRowOn]}>
                  <View style={[styles.pickIcon, { backgroundColor: on ? '#AFF2C2' : '#EAEDFF' }]}>
                    <MaterialCommunityIcons name={c.icon} size={26} color={on ? '#004625' : '#404941'} />
                  </View>
                  <Text style={{ flex: 1, fontSize: 16, fontWeight: '800', color: C.onSurface }}>🌾 {c.key}</Text>
                  <MaterialCommunityIcons name={on ? 'radiobox-marked' : 'radiobox-blank'} size={22} color={on ? '#004625' : '#707971'} />
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* STEP 2 — quantity */}
        {step === 2 && (
          <>
            <Text style={styles.secTitle}>{t('cropQty')}</Text>
            <Card style={{ borderRadius: 14, padding: 16, gap: 10 }}>
              <LabelCaps>{t('quantity')} ({t('unitQ')})</LabelCaps>
              <View style={styles.qtyRow}>
                <TextInput
                  value={qty} onChangeText={(v) => { setQty(v.replace(/[^0-9.]/g, '')); setQtyErr(''); }}
                  keyboardType="decimal-pad" placeholder="52" placeholderTextColor={C.outline}
                  style={styles.qtyInput}
                />
                <Text style={{ fontSize: 15, fontWeight: '700', color: C.onSurfaceVariant }}>{t('unitQ')}</Text>
              </View>
              {qtyErr ? <Text style={styles.error}>{qtyErr}</Text> : null}
              {estProcMins && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.surfaceContainerLow, borderRadius: 10, padding: 10 }}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color={C.primary} />
                  <Text style={{ fontSize: 12, color: C.onSurface }}>{t('estProc')}: ~{estProcMins} {t('minLbl')}</Text>
                </View>
              )}
            </Card>
          </>
        )}

        {/* STEP 3 — date */}
        {step === 3 && (
          <>
            <Text style={styles.secTitle}>{t('selectDate')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {days.map((d) => {
                const iso = d.toISOString().slice(0, 10);
                const avail = dayAvail[iso] || 'available';
                const on = dateISO === iso;
                const disabled = avail === 'full';
                return (
                  <TouchableOpacity
                    key={iso} disabled={disabled} onPress={() => setDateISO(iso)}
                    style={[styles.dayCard, on && styles.dayCardOn, disabled && { opacity: 0.45 }]}
                  >
                    <Text style={{ fontSize: 10.5, fontWeight: '700', color: on ? '#AFF2C2' : C.onSurfaceVariant }}>{d.toLocaleDateString('en', { weekday: 'short' }).toUpperCase()}</Text>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: on ? '#fff' : C.onSurface }}>{d.getDate()}</Text>
                    <View style={{ backgroundColor: on ? 'rgba(255,255,255,0.2)' : dayMeta[avail].bg, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 8.5, fontWeight: '800', color: on ? '#fff' : dayMeta[avail].fg }}>
                        {avail === 'full' ? t('dateFull') : avail === 'limited' ? t('dateLimited') : t('dateAvail')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {!dateISO && <Text style={styles.sub}>{t('selectDate')} → {t('selectSlot')}</Text>}
          </>
        )}

        {/* STEP 4 — slot */}
        {step === 4 && (
          <>
            <Text style={styles.secTitle}>{t('selectSlot')}</Text>
            {slotsLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} height={62} radius={12} />)
            ) : (
              slots.map((s) => {
                const m = slotMeta[s.status];
                const on = slot?.id === s.id;
                const disabled = s.status === 'full' || s.status === 'closed';
                return (
                  <TouchableOpacity key={s.id} disabled={disabled} onPress={() => setSlot(s)}
                    style={[styles.slotRow, on && styles.pickRowOn, disabled && { opacity: 0.5 }]}>
                    <MaterialCommunityIcons name="clock-time-four" size={20} color={on ? '#004625' : '#404941'} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: C.onSurface }}>{s.label}</Text>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: s.status === 'available' ? '#006C4A' : '#93000A' }}>
                        {s.status === 'full' ? t('slotFull') : s.status === 'closed' ? t('slotClosed') : t('qAvail', { q: s.qAvailable })}
                      </Text>
                    </View>
                    <MaterialCommunityIcons name={on ? 'radiobox-marked' : 'radiobox-blank'} size={22} color={on ? '#004625' : '#707971'} />
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}

        {/* STEP 5 — review */}
        {step === 5 && (
          <>
            <Text style={styles.secTitle}>{t('bookingSummary')}</Text>
            <Card style={{ borderRadius: 14, padding: 16, gap: 10 }}>
              <SumRow label={t('farmerLbl')} value="Raj Kumar" />
              <SumRow label={t('cropLbl')} value={crop} />
              <SumRow label={t('quantityLbl')} value={`${qtyNum} ${t('unitQ')}`} />
              <SumRow label={t('centreLbl')} value={centre.name} />
              <SumRow label={t('dateLbl')} value={new Date(dateISO).toDateString()} />
              <SumRow label={t('timeLbl')} value={slot.label} />
              <SumRow label={t('estProc')} value={`~${estProcMins} ${t('minLbl')}`} />
            </Card>
            <TouchableOpacity onPress={() => setStep(1)}>
              <Text style={{ color: '#004625', fontWeight: '700', fontSize: 13 }}>✎ {t('edit')}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* footer CTA */}
      <View style={styles.bottomBar}>
        {step === 1 && (
          <Button title={t('next')} disabled={!crop} onPress={() => setStep(2)} style={{ flex: 1 }} />
        )}
        {step === 2 && (
          <Button title={t('next')} disabled={!qtyValid} onPress={() => {
            if (!qtyValid) setQtyErr(t('qtyErr'));
            else setStep(3);
          }} style={{ flex: 1 }} />
        )}
        {step === 3 && (
          <Button title={t('next')} disabled={!dateISO} onPress={() => setStep(4)} style={{ flex: 1 }} />
        )}
        {step === 4 && (
          <Button title={t('next')} disabled={!slot} onPress={() => setStep(5)} style={{ flex: 1 }} />
        )}
        {step === 5 && (
          <Button title={confirming ? t('creatingBooking') : t('confirmBooking')} loading={confirming} onPress={confirm} style={{ flex: 1 }} />
        )}
      </View>
    </SafeAreaView>
  );
}

function SumRow({ label, value }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 14 }}>
      <Text style={{ fontSize: 12.5, color: '#404941', width: 110 }}>{label}</Text>
      <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#131B2E', flex: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 10 },
  circle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  stepBar: { flexDirection: 'row', gap: 5, paddingHorizontal: 16, marginTop: 10 },
  stepSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#DAE2FD' },
  stepSegOn: { backgroundColor: '#004625' },
  secTitle: { fontSize: 17, fontWeight: '800', color: C.onSurface, marginTop: 4 },
  sub: { fontSize: 12.5, color: C.onSurfaceVariant },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 2, borderColor: 'transparent' },
  pickRowOn: { borderColor: '#004625', backgroundColor: 'rgba(175,242,194,0.25)' },
  pickIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyInput: {
    flex: 1, backgroundColor: C.surfaceContainerLow, borderRadius: 12, paddingHorizontal: 16,
    height: 56, fontSize: 24, fontWeight: '800', color: C.onSurface,
  },
  error: { color: '#BA1A1A', fontSize: 12, fontWeight: '600' },
  dayCard: { width: 76, alignItems: 'center', gap: 4, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, borderWidth: 2, borderColor: 'transparent' },
  dayCardOn: { backgroundColor: '#004625', borderColor: '#004625' },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 2, borderColor: 'transparent' },
  bottomBar: { padding: 14, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.surfaceContainer },
});
