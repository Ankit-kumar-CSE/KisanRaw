import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { farmer as C } from '../../theme/colors';
import { useLang } from '../../i18n';
import { useStore } from '../../store/AppStore';
import { cancelBooking } from '../../services/bookingService';
import { Card, Chip, Button, StatusBadge, EmptyState, Segmented } from '../../components/ui';

export default function MyBookingsScreen({ navigation }) {
  const { t } = useLang();
  const { bookings, refreshBookings, pushNotification } = useStore();
  const [tab, setTab] = useState('active');

  const groups = {
    active: bookings.filter((b) => !['payment-completed', 'cancelled'].includes(b.status) && b.dateISO >= new Date().toISOString().slice(0, 10) && !['procurement-completed', 'payment-initiated'].includes(b.status)),
    upcoming: bookings.filter((b) => b.status === 'confirmed' && b.dateISO > new Date().toISOString().slice(0, 10)),
    completed: bookings.filter((b) => ['procurement-completed', 'payment-initiated', 'payment-completed'].includes(b.status)),
    cancelled: bookings.filter((b) => b.status === 'cancelled'),
  };
  const list = groups[tab] || [];

  const doCancel = (b) => {
    Alert.alert(t('cancelBookingQ'), `${b.centreName} · ${b.dateISO}`, [
      { text: t('back'), style: 'cancel' },
      {
        text: t('cancelYes'), style: 'destructive',
        onPress: async () => {
          await cancelBooking(b.bookingId);
          await refreshBookings();
          await pushNotification({ category: 'booking', text: `Booking ${b.bookingId} was cancelled.` });
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <View style={{ padding: 14, gap: 10 }}>
        <Text style={{ fontSize: 17, fontWeight: '800', color: C.onSurface }}>{t('quickBookings')}</Text>
        <Segmented
          options={[
            { value: 'active', label: t('active') },
            { value: 'upcoming', label: t('upcoming') },
            { value: 'completed', label: t('completed') },
            { value: 'cancelled', label: t('cancelledB') },
          ]}
          value={tab} onChange={setTab}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, paddingTop: 0, gap: 12, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {!list.length ? (
          <Card style={{ borderRadius: 16, padding: 6 }}>
            <EmptyState icon="ticket-confirmation-outline" title={t('noBookings')} sub={t('noBookingsSub')} actionLabel={t('bookCta')} onAction={() => navigation.navigate('Centres')} />
          </Card>
        ) : (
          list.map((b) => (
            <Card key={b.bookingId} style={{ borderRadius: 16, padding: 14, gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: C.primaryFixed, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 11.5, fontWeight: '800', color: C.primary }}>{b.token}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14.5, fontWeight: '800', color: C.onSurface }}>{b.crop} · {b.quantity} {t('unitQ')}</Text>
                  <Text style={{ fontSize: 11.5, color: C.onSurfaceVariant }}>{b.centreName}</Text>
                </View>
                <StatusBadge status={b.status} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={styles.fact}><MaterialCommunityIcons name="calendar" size={13} color={C.primary} /> {b.dateISO}</Text>
                <Text style={styles.fact}><MaterialCommunityIcons name="clock-time-four" size={13} color={C.primary} /> {b.slotLabel}</Text>
              </View>
              {b.status === 'payment-completed' && (
                <View style={{ backgroundColor: C.surfaceContainerLow, borderRadius: 10, padding: 10, gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 11.5, color: C.onSurfaceVariant }}>{t('amount')}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: C.primary }}>₹{Number(b.totalAmount).toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 11.5, color: C.onSurfaceVariant }}>{t('payStatus')}</Text>
                    <Chip label="PAID" bg="#82F5C1" fg="#00210F" size={9} icon="check-circle" />
                  </View>
                </View>
              )}
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <Chip label={t('viewBooking')} bg={C.surfaceContainerHigh} fg={C.onSurface} icon="eye" size={10} onPress={() => navigation.navigate('BookingPass', { bookingId: b.bookingId })} />
                {!['cancelled'].includes(b.status) && (
                  <Chip label={t('trackQueue')} bg={C.surfaceContainerHigh} fg={C.primary} icon="podium" size={10} onPress={() => navigation.navigate('Queue', { bookingId: b.bookingId })} />
                )}
                {b.status === 'payment-completed' && (
                  <Chip label={t('payTitle')} bg={C.secondaryContainer} fg="#00714E" icon="cash" size={10} onPress={() => navigation.navigate('Payment', { bookingId: b.bookingId })} />
                )}
                {b.status === 'confirmed' && (
                  <Chip label={t('navigateBtn')} bg={C.tertiaryFixed} fg={C.tertiary} icon="navigation-variant" size={10}
                    onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(b.centreName)}&travelmode=driving`)} />
                )}
                {b.status === 'confirmed' && (
                  <Chip label={t('cancelYes')} bg={C.errorContainer} fg={C.onErrorContainer} icon="close-circle" size={10} onPress={() => doCancel(b)} />
                )}
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  fact: { fontSize: 12, color: C.onSurfaceVariant, flexDirection: 'row', alignItems: 'center', gap: 4 },
});
