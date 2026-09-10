import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { farmer as C } from '../../theme/colors';
import { useLang } from '../../i18n';
import { useStore } from '../../store/AppStore';
import { simulateNextStage } from '../../services/bookingService';
import { Card, Chip, Button, EmptyState, TimelineRow, LabelCaps } from '../../components/ui';

const STEPS = ['tSlotBooked', 'tCheckedIn', 'tVerified', 'tQuality', 'tWeighing', 'tProcessing', 'tProcDone', 'tPayInit', 'tPayDone'];
const STAGE_INDEX = {
  confirmed: 1, 'checked-in': 2, 'in-queue': 3, processing: 6, 'procurement-completed': 7, 'payment-initiated': 8, 'payment-completed': 9,
};

export default function ProcurementScreen({ navigation, route }) {
  const { t } = useLang();
  const { bookings, refreshBookings, pushNotification } = useStore();
  const booking = bookings.find((b) => b.bookingId === route.params?.bookingId);
  const [advancing, setAdvancing] = useState(false);

  if (!booking) {
    return <SafeAreaView style={styles.screen} edges={['bottom']}><EmptyState icon="tractor-variant" title={t('noBookings')} actionLabel={t('bookCta')} onAction={() => navigation.navigate('Centres')} /></SafeAreaView>;
  }

  const current = STAGE_INDEX[booking.status] || 1;
  const total = booking.quantity * booking.rate;
  const done = booking.status === 'payment-completed';

  const advance = async () => {
    setAdvancing(true);
    await simulateNextStage(booking.bookingId);
    await refreshBookings();
    const nextIdx = Math.min(current + 1, 9);
    if (nextIdx === 7) await pushNotification({ category: 'procurement', text: `Your procurement of ${booking.crop} ${booking.quantity} Q has been completed.` });
    if (nextIdx === 8) await pushNotification({ category: 'payment', text: `Your payment of ₹${total.toLocaleString('en-IN')} has been initiated.` });
    if (nextIdx === 9) await pushNotification({ category: 'payment', text: `Your payment of ₹${total.toLocaleString('en-IN')} has been completed.` });
    setAdvancing(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MaterialCommunityIcons name="tractor-variant" size={20} color={C.primary} />
          <Text style={{ fontSize: 17, fontWeight: '800', color: C.onSurface, flex: 1 }}>{t('procTitle')}</Text>
          <Chip label={booking.token} bg={C.surfaceContainerLow} fg={C.primary} size={10} />
        </View>

        {/* timeline */}
        <Card style={{ borderRadius: 14, padding: 16 }}>
          {STEPS.map((key, i) => {
            const idx = i + 1;
            const state = idx < current ? 'done' : idx === current ? 'current' : 'pending';
            return <TimelineRow key={key} label={t(key)} state={state} sub={idx === current ? booking.centreName : undefined} />;
          })}
        </Card>

        {/* details */}
        <Card style={{ borderRadius: 14, padding: 16, gap: 10 }}>
          <Row label={t('cropLbl')} value={booking.crop} />
          <Row label={t('declaredQty')} value={`${booking.quantity} ${t('unitQ')}`} />
          <Row label={t('actualQty')} value={booking.actualQuantity ? `${booking.actualQuantity} ${t('unitQ')}` : t('pendingL')} />
          <Row label={t('qualityLbl')} value={booking.qualityGrade || t('pendingL')} />
          <Row label={t('weighingLbl')} value={current >= 5 ? 'Verified · Bay 1' : t('pendingL')} />
          <Row label={t('rateLbl')} value={`₹${booking.rate.toLocaleString('en-IN')} / ${t('unitQ')}`} />
          <Row label={t('totalAmt')} value={`₹${(booking.totalAmount ? Number(booking.totalAmount) : total).toLocaleString('en-IN')}`} bold />
        </Card>

        {/* payment shortcut */}
        {current >= 7 && (
          <Button title={t('payTitle')} icon="cash" variant="secondary" onPress={() => navigation.navigate('Payment', { bookingId: booking.bookingId })} />
        )}

        {/* demo advance */}
        {!done && (
          <View style={{ gap: 6 }}>
            <Button title={t('simulateNext')} icon="fast-forward" variant="outline" loading={advancing} onPress={advance} />
            <Text style={{ fontSize: 10, color: C.outline, textAlign: 'center' }}>
              Demo-only: moves this booking to its next lifecycle stage until the backend is connected.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, bold }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 14 }}>
      <Text style={{ fontSize: 12.5, color: '#404941' }}>{label}</Text>
      <Text style={{ fontSize: 12.5, fontWeight: bold ? '800' : '700', color: '#131B2E' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: C.background } });
