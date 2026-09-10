import React from 'react';
import { View, Text, ScrollView, StyleSheet, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { farmer as C } from '../../theme/colors';
import { useLang } from '../../i18n';
import { useStore } from '../../store/AppStore';
import { Card, Chip, PulseDot, Button, LabelCaps } from '../../components/ui';
import logo from '../../logo.png';

export default function BookingSuccessScreen({ navigation, route }) {
  const { t } = useLang();
  const { pushNotification } = useStore();
  const booking = route.params?.booking;
  if (!booking) return null;

  const copyId = async () => {
    await Clipboard.setStringAsync(booking.bookingId);
  };

  const share = async () => {
    try {
      await Share.share({ message: `kisanRaw Booking — Token ${booking.token} · ${booking.centreName} · ${booking.dateISO} ${booking.slotLabel} · ID: ${booking.bookingId}` });
    } catch { /* dismissed */ }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 14, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        {/* success hero */}
        <View style={{ alignItems: 'center', gap: 8, marginTop: 10 }}>
          <View style={{ width: 76, height: 76, borderRadius: 999, backgroundColor: '#AFF2C2', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="check-bold" size={40} color="#004625" />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: C.primary }}>{t('bookSuccessT')}</Text>
          <Text style={{ fontSize: 12.5, color: C.onSurfaceVariant, textAlign: 'center' }}>{t('bookSuccessSub')}</Text>
        </View>

        {/* booking id card */}
        <Card style={{ borderRadius: 14, padding: 14 }}>
          <LabelCaps>{t('bookingId')}</LabelCaps>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', letterSpacing: 1, color: C.primary, flex: 1 }}>{booking.bookingId}</Text>
            <TouchableOpacity onPress={copyId} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.surfaceContainerLow, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
              <MaterialCommunityIcons name="content-copy" size={14} color={C.primary} />
              <Text style={{ color: C.primary, fontWeight: '800', fontSize: 11.5 }}>{t('copyBookingId')}</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* QR pass preview */}
        <Card style={{ borderRadius: 16, overflow: 'hidden' }}>
          <View style={{ backgroundColor: C.primaryContainer, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 }}>
            <Image source={logo} style={{ width: 30, height: 30, borderRadius: 7 }} resizeMode="contain" />
            <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 0.8, color: C.primaryFixed, flex: 1 }}>PUNJAB STATE MANDI BOARD</Text>
            <Chip label={t('confirmedChip')} bg={C.primaryFixed} fg={C.onPrimaryFixed} icon="check-circle" size={10} />
          </View>
          <View style={{ alignItems: 'center', padding: 16, gap: 8 }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 12, elevation: 3 }}>
              <QRCode value={booking.bookingId} size={150} color={C.primary} logo={logo} logoSize={28} logoBackgroundColor="transparent" />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 11, color: C.onSurfaceVariant }}>{t('tokenLbl')}</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: C.secondary, letterSpacing: 2 }}>{booking.token}</Text>
            </View>
            <Text style={{ fontSize: 10.5, color: C.outline, textAlign: 'center' }}>{t('showQr')}</Text>
          </View>
        </Card>

        {/* details */}
        <Card style={{ borderRadius: 14, padding: 16, gap: 10 }}>
          <SumRow label={t('centreLbl')} value={booking.centreName} />
          <SumRow label={t('dateLbl')} value={booking.dateISO} />
          <SumRow label={t('timeLbl')} value={booking.slotLabel} />
          <SumRow label={t('cropLbl')} value={booking.crop} />
          <SumRow label={t('quantityLbl')} value={`${booking.quantity} ${t('unitQ')}`} />
        </Card>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <PulseDot color={C.primary} size={6} />
          <Text style={{ fontSize: 11, color: C.onSurfaceVariant }}>SMS confirmation sent to your mobile</Text>
        </View>
      </ScrollView>

      {/* actions */}
      <View style={styles.bottomBar}>
        <Button title={t('trackQueueBtn')} icon="podium" onPress={() => navigation.navigate('Queue', { bookingId: booking.bookingId })} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button title={t('shareBooking')} icon="share-variant" variant="secondary" style={{ flex: 1 }} onPress={share} />
          <Button title={t('viewPassBtn')} icon="qrcode" style={{ flex: 1.2 }} onPress={() => navigation.navigate('BookingPass', { bookingId: booking.bookingId })} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function SumRow({ label, value }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 14 }}>
      <Text style={{ fontSize: 12.5, color: '#404941', width: 100 }}>{label}</Text>
      <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#131B2E', flex: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    gap: 8, padding: 14, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.surfaceContainer,
  },
});
