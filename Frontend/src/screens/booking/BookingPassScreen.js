import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Share, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { farmer as C, helpline } from '../../theme/colors';
import { useLang } from '../../i18n';
import { useStore } from '../../store/AppStore';
import { Card, Chip, PulseDot, Button, StatusBadge, LabelCaps, EmptyState } from '../../components/ui';
import logo from '../../logo.png';

export default function BookingPassScreen({ navigation, route }) {
  const { t } = useLang();
  const { bookings } = useStore();
  const booking = bookings.find((b) => b.bookingId === route.params?.bookingId)
    || bookings.find((b) => !['payment-completed', 'cancelled'].includes(b.status))
    || null;

  if (!booking) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
        <EmptyState icon="ticket-confirmation-outline" title={t('noBooking')} sub={t('noBookingSub')} actionLabel={t('bookCta')} onAction={() => navigation.navigate('Centres')} />
      </SafeAreaView>
    );
  }

  const copyId = async () => { await Clipboard.setStringAsync(booking.bookingId); };
  const share = async () => {
    try { await Share.share({ message: `kisanRaw Booking Pass — Token ${booking.token} (${booking.farmer}) · ID: ${booking.bookingId}` }); } catch { /* dismissed */ }
  };
  const navigate = () => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booking.centreName)}&travelmode=driving`);

  const phase = { confirmed: 1, 'checked-in': 2, 'in-queue': 3, processing: 4, 'procurement-completed': 6, 'payment-initiated': 7, 'payment-completed': 8 }[booking.status] || 1;
  const phases = [t('tSlotBooked'), 'Gate Check-In', t('tVerified'), t('tWeighing'), t('tQuality'), t('tProcDone'), t('tPayInit'), t('tPayDone')];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        {/* offline security pill */}
        <View style={styles.securePill}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <PulseDot color={C.primary} size={7} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: C.onPrimaryFixed, flex: 1 }}>{t('validOffline')}</Text>
          </View>
          <Text style={{ fontSize: 10, fontWeight: '700', color: C.onPrimaryFixedVariant }}>ECDSA-256</Text>
        </View>

        {/* ticket */}
        <Card style={{ borderRadius: 16, overflow: 'hidden' }}>
          <View style={{ backgroundColor: C.primaryContainer, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Image source={logo} style={{ width: 32, height: 32, borderRadius: 8 }} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 0.8, color: C.primaryFixed }}>PUNJAB STATE MANDI BOARD</Text>
              <Text style={{ fontSize: 9.5, color: 'rgba(175,242,194,0.8)' }}>FCI Central Pool Procurement</Text>
            </View>
            <StatusBadge status={booking.status} />
          </View>

          <View style={{ padding: 14, gap: 12 }}>
            {/* booking id */}
            <View style={{ backgroundColor: C.surfaceContainerLow, borderRadius: 12, padding: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <LabelCaps>{t('bookingIdLbl')}</LabelCaps>
                <TouchableOpacity onPress={copyId} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <MaterialCommunityIcons name="content-copy" size={13} color={C.primary} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: C.primary }}>{t('copy')}</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 15.5, fontWeight: '800', letterSpacing: 1, color: C.primary, marginTop: 8 }}>{booking.bookingId}</Text>
              <Text style={{ fontSize: 10, color: C.outline, marginTop: 4 }}>{t('uniqueId')}</Text>
            </View>

            {/* token + crop */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: 'rgba(255,220,195,0.55)', borderRadius: 12, padding: 12 }}>
                <LabelCaps>{t('tokenLbl')}</LabelCaps>
                <Text style={{ fontSize: 24, fontWeight: '800', color: C.secondary, letterSpacing: 2 }}>{booking.token}</Text>
                <Text style={{ fontSize: 10.5, color: C.onSurfaceVariant, marginTop: 3 }}>{t('mandiGatePass')}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: 'rgba(175,242,194,0.55)', borderRadius: 12, padding: 12 }}>
                <LabelCaps>{t('cropTag')}</LabelCaps>
                <Text style={{ fontSize: 24, fontWeight: '800', color: C.primary }}>{booking.quantity}</Text>
                <Text style={{ fontSize: 10.5, color: C.onSurfaceVariant, marginTop: 3 }}>{booking.crop} · {t('unitQ')}</Text>
              </View>
            </View>

            {/* farmer row */}
            <View style={{ backgroundColor: C.surfaceContainer, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 38, height: 38, borderRadius: 999, backgroundColor: C.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="account" size={19} color={C.primaryFixed} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13.5, fontWeight: '700', color: C.onSurface }}>{booking.farmer}</Text>
                <Text style={{ fontSize: 11, color: C.onSurfaceVariant }}>Aadhaar Linked · ••••••4721</Text>
              </View>
              <MaterialCommunityIcons name="shield-check" size={20} color={C.primary} />
            </View>

            {/* QR */}
            <View style={{ backgroundColor: C.surfaceContainerHigh, borderRadius: 12, padding: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 11.5, color: C.onSurface, fontWeight: '600', alignSelf: 'flex-start', marginBottom: 8 }}>{t('showQr')}</Text>
              <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, elevation: 3 }}>
                <QRCode value={booking.bookingId} size={170} color={C.primary} logo={logo} logoSize={32} logoBackgroundColor="transparent" />
              </View>
            </View>

            {/* quick actions */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <QuickA icon="content-copy" label={t('copyId')} onPress={copyId} />
              <QuickA icon="share-variant" label={t('share')} color={C.secondary} onPress={share} />
              <QuickA icon="download-circle-outline" label={t('saveOffline')} onPress={() => {}} />
            </View>
          </View>
        </Card>

        {/* centre + slot + navigate */}
        <Card style={{ borderRadius: 14, padding: 14, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: C.primaryFixed, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="map-marker" size={20} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <LabelCaps color={C.secondary}>{t('centreTag')}</LabelCaps>
              <Text style={{ fontSize: 15, fontWeight: '700', color: C.onSurface }}>{booking.centreName}</Text>
            </View>
          </View>
          <View style={{ backgroundColor: C.surfaceContainerLow, borderRadius: 10, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <MaterialCommunityIcons name="calendar-clock" size={18} color={C.secondary} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.onSurface }}>{booking.dateISO}</Text>
              <Text style={{ fontSize: 11.5, color: C.onSurfaceVariant }}>{t('slotLbl')}: {booking.slotLabel}</Text>
            </View>
          </View>
          <Button title={t('navigateCentre')} icon="navigation-variant" onPress={navigate} />
          <Button title={t('trackQueue')} icon="podium" variant="secondary" onPress={() => navigation.navigate('Queue')} />
        </Card>

        {/* journey */}
        <Card style={{ borderRadius: 14, padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: C.onSurface }}>{t('journey')}</Text>
            <Text style={{ fontSize: 12, fontWeight: '800', color: C.primary }}>{phase} / 8</Text>
          </View>
          {phases.map((p, i) => {
            const idx = i + 1;
            const done = idx < phase;
            const cur = idx === phase;
            return (
              <View key={idx} style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ alignItems: 'center', width: 26 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 999, backgroundColor: done ? C.primary : cur ? C.secondary : C.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center' }}>
                    {done ? <MaterialCommunityIcons name="check" size={14} color="#fff" /> : cur ? <PulseDot color="#fff" size={7} /> : null}
                  </View>
                  {idx < 8 && <View style={{ width: 2, flex: 1, backgroundColor: done ? C.primary : C.surfaceContainerHighest }} />}
                </View>
                <View style={{ flex: 1, paddingBottom: idx === 8 ? 0 : 14, opacity: done || cur ? 1 : 0.6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 12.5, fontWeight: cur ? '800' : '700', color: cur ? C.secondary : C.onSurface }}>{p}</Text>
                    {cur && <Chip label={t('youAreHere')} bg={C.secondaryFixed} fg="#2F1500" size={8} />}
                  </View>
                </View>
              </View>
            );
          })}
        </Card>

        {/* helpdesk */}
        <View style={{ backgroundColor: C.surfaceContainer, borderRadius: 14, padding: 14 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: C.secondary }}>{t('helpdeskTitle')}</Text>
          <Text style={{ fontSize: 11.5, color: C.onSurfaceVariant, marginTop: 4 }}>{t('helpdeskBody')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: C.primary }}>{helpline}</Text>
            <TouchableOpacity
              style={{ marginLeft: 'auto', backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 6 }}
              onPress={() => Linking.openURL(`tel:${helpline.replace(/-/g, '')}`)}
            >
              <MaterialCommunityIcons name="phone" size={15} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700' }}>{t('callNow')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickA({ icon, label, color = C.primary, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flex: 1, backgroundColor: C.surfaceContainer, borderRadius: 10, paddingVertical: 10, alignItems: 'center', gap: 4 }}>
      <MaterialCommunityIcons name={icon} size={18} color={color} />
      <Text style={{ fontSize: 10, fontWeight: '600', color: C.onSurface }}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  securePill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(175,242,194,0.6)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9,
  },
});
