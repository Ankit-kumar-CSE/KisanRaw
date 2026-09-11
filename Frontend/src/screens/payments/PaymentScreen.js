import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { farmer as C } from '../../theme/colors';
import { useLang } from '../../i18n';
import { getPaymentStatus } from '../../services/paymentService';
import { Card, Chip, Button, Skeleton, TimelineRow, EmptyState } from '../../components/ui';

export default function PaymentScreen({ navigation, route }) {
  const { t } = useLang();
  const bookingId = route.params?.bookingId;
  const [pay, setPay] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPaymentStatus(bookingId).then((p) => { setPay(p); setLoading(false); });
  }, [bookingId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }}>
          <Skeleton height={120} radius={16} />
          <Skeleton height={180} radius={14} />
          <Skeleton height={140} radius={14} />
        </ScrollView>
      </SafeAreaView>
    );
  }
  if (!pay) {
    return <SafeAreaView style={styles.screen} edges={['bottom']}><EmptyState icon="cash-remove" title={t('noBookings')} /></SafeAreaView>;
  }

  const completed = pay.status === 'payment-completed';
  const initiated = ['payment-initiated', 'payment-completed'].includes(pay.status);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {/* hero */}
        <Card style={{ borderRadius: 18, padding: 18, backgroundColor: completed ? C.primaryContainer : '#fff', gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons name={completed ? 'check-decagram' : 'progress-clock'} size={22} color={completed ? C.primaryFixed : C.secondary} />
            <Text style={{ fontSize: 15, fontWeight: '800', color: completed ? C.primaryFixed : C.onSurface, flex: 1 }}>{t('payTitle')}</Text>
            <Chip
              label={completed ? t('tPayDone').toUpperCase() : initiated ? pay.status === 'payment-initiated' ? t('tPayInit').toUpperCase() : t('tPayProc').toUpperCase() : t('pendingL').toUpperCase()}
              bg={completed ? C.primaryFixed : initiated ? C.secondaryFixed : C.surfaceContainerHigh}
              fg={completed ? C.onPrimaryFixed : '#2F1500'}
              size={9}
            />
          </View>
          <Text style={{ fontSize: 30, fontWeight: '800', color: completed ? '#fff' : C.primary }}>
            ₹{pay.total.toLocaleString('en-IN')}
          </Text>
          <Text style={{ fontSize: 11.5, color: completed ? '#94D5A8' : C.onSurfaceVariant }}>
            {pay.crop} · {pay.quantity} {t('unitQ')} × ₹{pay.rate.toLocaleString('en-IN')}
          </Text>
        </Card>

        {/* details */}
        <Card style={{ borderRadius: 14, padding: 16, gap: 10 }}>
          <Row label={t('cropLbl')} value={pay.crop} />
          <Row label={t('quantityLbl')} value={`${pay.quantity} ${t('unitQ')}`} />
          <Row label={t('rateLbl')} value={`₹${pay.rate.toLocaleString('en-IN')} / ${t('unitQ')}`} />
          <Row label={t('totalAmt')} value={`₹${pay.total.toLocaleString('en-IN')}`} bold />
          <Row label={t('bankLbl')} value={pay.bank} />
          {pay.txnId && <Row label={t('txnId')} value={pay.txnId} bold />}
        </Card>

        {/* timeline */}
        <Card style={{ borderRadius: 14, padding: 16 }}>
          <TimelineRow label={t('tProcDone')} state={initiated ? 'done' : 'current'} />
          <TimelineRow label={t('tPayInit')} state={initiated ? 'done' : 'pending'} />
          <TimelineRow label={t('tPayProc')} state={completed ? 'done' : initiated && pay.status !== 'payment-initiated' ? 'current' : 'pending'} />
          <TimelineRow label={t('tPayDone')} state={completed ? 'current' : 'pending'} />
        </Card>

        {!initiated && (
          <Text style={{ fontSize: 11.5, color: C.onSurfaceVariant, textAlign: 'center', lineHeight: 17 }}>
            {t('tPayInit')} → {t('tPayDone')} · PFMS DBT within 48 hours of procurement.
          </Text>
        )}
        {completed && (
          <Button title={t('trackQueueBtn')} icon="podium" variant="secondary" onPress={() => navigation.navigate('Centres')} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, bold }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 14 }}>
      <Text style={{ fontSize: 12.5, color: '#404941' }}>{label}</Text>
      <Text style={{ fontSize: 12.5, fontWeight: bold ? '800' : '700', color: '#131B2E', flex: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: C.background } });
