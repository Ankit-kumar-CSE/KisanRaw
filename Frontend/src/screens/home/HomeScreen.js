import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { farmer as C, helpline } from '../../theme/colors';
import { useLang, LanguagePill } from '../../i18n';
import { useStore, activeBookingOf } from '../../store/AppStore';
import { Card, Chip, PulseDot, EmptyState, Button } from '../../components/ui';
import logo from '../../logo.png';

export default function HomeScreen({ navigation }) {
  const { t } = useLang();
  const { bookings, profile } = useStore();
  const active = activeBookingOf(bookings);

  const openMaps = () => {
    if (!active) return;
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(active.centreName)}&travelmode=driving`);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: 110 }}>
      {/* greeting */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 46, height: 46, borderRadius: 999, backgroundColor: C.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name="account" size={24} color={C.primaryFixed} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: C.onSurface }}>{t('greeting')}</Text>
          <Text style={{ fontSize: 12, color: C.onSurfaceVariant }}>{profile ? `${profile.village}, ${profile.district}` : t('season')}</Text>
        </View>
        <LanguagePill />
      </View>

      {/* active booking / empty */}
      {active ? (
        <Card style={{ borderRadius: 16, padding: 16, gap: 8, backgroundColor: C.primaryContainer }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons name="ticket-confirmation" size={18} color={C.primaryFixed} />
            <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, color: C.primaryFixed, flex: 1 }}>{t('activeBooking')}</Text>
            <Chip label={active.token} bg="rgba(255,255,255,0.15)" fg="#fff" size={10} />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>{active.centreName}</Text>
          <Text style={{ fontSize: 12.5, color: '#94D5A8' }}>{active.dateISO} · {active.slotLabel}</Text>
          <Text style={{ fontSize: 11, color: '#94D5A8' }}>{t('bookingId')}: {active.bookingId}</Text>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start', marginTop: 2 }}>
            <Text style={{ color: '#AFF2C2', fontSize: 11, fontWeight: '800' }}>{t('statusLbl')}: {active.status.replace(/-/g, ' ').toUpperCase()}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
            <TouchableOpacity onPress={() => navigation.navigate('Queue')} style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 11, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
              <MaterialCommunityIcons name="podium" size={17} color={C.primary} />
              <Text style={{ color: C.primary, fontWeight: '800', fontSize: 12 }}>{t('trackQueue')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('BookingPass', { bookingId: active.bookingId })} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 11, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
              <MaterialCommunityIcons name="qrcode" size={17} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>{t('bookingPassBtn')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={openMaps} style={{ width: 46, height: 42, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="navigation-variant" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </Card>
      ) : (
        <Card style={{ borderRadius: 16, padding: 6 }}>
          <EmptyState icon="calendar-plus" title={t('noBooking')} sub={t('noBookingSub')} actionLabel={t('bookCta')} onAction={() => navigation.navigate('Centres')} />
        </Card>
      )}

      {/* quick actions */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <Quick icon="map-search" label={t('quickFind')} bg="#AFF2C2" iconFg={C.primary} onPress={() => navigation.navigate('Centres')} />
        <Quick icon="podium" label={t('quickQueue')} bg={C.secondaryFixed} iconFg={C.secondary} onPress={() => navigation.navigate('Queue')} />
        <Quick icon="ticket-confirmation" label={t('quickBookings')} bg={C.tertiaryFixed} iconFg={C.tertiary} onPress={() => navigation.navigate('Bookings')} />
        <Quick icon="help-circle" label={t('quickHelp')} bg={C.surfaceContainerHigh} iconFg={C.primary} onPress={() => navigation.navigate('Help')} />
        <Quick icon="shield-check" label="Compensation" bg="#FFF3E0" iconFg="#E65100" onPress={() => navigation.navigate('CompensationDashboard')} />
        <Quick icon="leaf-circle" label="Green Farming" bg="#E8F5E9" iconFg="#2E7D32" onPress={() => navigation.navigate('SustainabilityDashboard')} />
      </View>

      {/* procurement progress teaser (if processing) */}
      {active && ['processing', 'procurement-completed', 'payment-initiated'].includes(active.status) && (
        <Card style={{ borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }} onPress={() => navigation.navigate('Procurement', { bookingId: active.bookingId })}>
          <View style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: C.secondaryFixed, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="tractor-variant" size={20} color={C.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13.5, fontWeight: '800', color: C.onSurface }}>{t('procTitle')}</Text>
            <Text style={{ fontSize: 11, color: C.onSurfaceVariant }}>{active.crop} · {active.quantity} {t('unitQ')}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={C.outline} />
        </Card>
      )}

      {/* MSP */}
      <Card style={{ borderRadius: 14, padding: 14, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MaterialCommunityIcons name="bank" size={17} color={C.primary} />
          <Text style={{ fontSize: 13.5, fontWeight: '800', color: C.onSurface, flex: 1 }}>{t('mspTitle')}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <MspBox crop="Wheat / गेहूं" rate="₹2,275" />
          <MspBox crop="Paddy / धान" rate="₹2,183" />
          <MspBox crop="Maize / मक्का" rate="₹2,500" />
        </View>
      </Card>

      {/* last payment */}
      <Card style={{ borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: C.primaryFixed, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name="currency-inr" size={20} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13.5, fontWeight: '800', color: C.onSurface }}>{t('lastPayout')}</Text>
          <Text style={{ fontSize: 11, color: C.onSurfaceVariant }}>Paddy · 38.5 Q · 2 Sep 2026</Text>
        </View>
        <Chip label={t('credited')} bg={C.secondaryContainer} fg="#00714E" size={9} icon="check-circle" />
      </Card>
    </ScrollView>
  );
}

function Quick({ icon, label, bg, iconFg, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={{ flexBasis: '48%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 6, elevation: 2 }}>
      <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name={icon} size={19} color={iconFg} />
      </View>
      <Text style={{ fontSize: 13, fontWeight: '800', color: C.onSurface }}>{label}</Text>
    </TouchableOpacity>
  );
}

function MspBox({ crop, rate }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.surfaceContainerLow, borderRadius: 10, padding: 10, alignItems: 'center' }}>
      <Text style={{ fontSize: 10, color: C.onSurfaceVariant, fontWeight: '600' }}>{crop}</Text>
      <Text style={{ fontSize: 15, fontWeight: '800', color: C.primary }}>{rate}</Text>
      <Text style={{ fontSize: 9, color: C.outline }}>/Q</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
});
