import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { farmer as C, helpline } from '../../theme/colors';
import { useLang } from '../../i18n';
import { useStore } from '../../store/AppStore';
import { Card, Button, LabelCaps, useToast } from '../../components/ui';

const FAQS = [
  { q: 'How do I book a procurement slot?', a: 'Open Centres → choose a centre → Book Here → select crop, quantity, date and time slot → confirm.' },
  { q: 'What if I lose internet at the centre?', a: 'Your Booking Pass with QR works offline. Show it at the gate even without network.' },
  { q: 'When will I get my payment?', a: 'PFMS DBT payment is initiated after procurement and typically completes within 48 hours.' },
  { q: 'Can I cancel my booking?', a: 'Yes — open My Bookings → your confirmed booking → Cancel Booking before the slot starts.' },
  { q: 'What is the difference between Booking ID and Token?', a: 'Booking ID identifies your booking record. Token is your queue position number at the centre.' },
];

const ISSUES = [
  { key: 'bookingIssue', icon: 'ticket-confirmation-outline' },
  { key: 'paymentIssue', icon: 'cash-remove' },
  { key: 'procIssue', icon: 'tractor-variant' },
  { key: 'centreIssue', icon: 'storefront-outline' },
];

export default function HelpScreen({ navigation }) {
  const { t } = useLang();
  const toast = useToast();
  const { pushNotification } = useStore();
  const [openFaq, setOpenFaq] = useState(null);

  const report = (key) => {
    Alert.alert(t(key), t('issueLogged'), [
      { text: 'OK', onPress: () => pushNotification({ category: 'announcement', text: `${t(key)} reported. Support will contact you.` }) },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circle}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={C.onSurface} />
          </TouchableOpacity>
          <Text style={{ fontSize: 17, fontWeight: '800', color: C.onSurface, flex: 1 }}>{t('helpTitle')}</Text>
        </View>

        {/* helpline card */}
        <Card style={{ borderRadius: 16, padding: 16, gap: 8 }}>
          <Text style={{ fontSize: 14.5, fontWeight: '800', color: C.secondary }}>{t('helpdeskTitle')}</Text>
          <Text style={{ fontSize: 12, color: C.onSurfaceVariant }}>{t('helpdeskBody')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: C.primary }}>{helpline}</Text>
            <TouchableOpacity
              style={{ marginLeft: 'auto', backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 6 }}
              onPress={() => Linking.openURL(`tel:${helpline.replace(/-/g, '')}`)}
            >
              <MaterialCommunityIcons name="phone" size={15} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700' }}>{t('callNow')}</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* FAQ */}
        <Card style={{ borderRadius: 16, padding: 14, gap: 4 }}>
          <LabelCaps>{t('faq')}</LabelCaps>
          {FAQS.map((f, i) => (
            <View key={i}>
              <TouchableOpacity onPress={() => setOpenFaq(openFaq === i ? null : i)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 }}>
                <MaterialCommunityIcons name={openFaq === i ? 'chevron-up' : 'chevron-down'} size={18} color={C.primary} />
                <Text style={{ flex: 1, fontSize: 13.5, fontWeight: '700', color: C.onSurface }}>{f.q}</Text>
              </TouchableOpacity>
              {openFaq === i && (
                <Text style={{ fontSize: 12.5, color: C.onSurfaceVariant, lineHeight: 19, paddingBottom: 10, paddingLeft: 26 }}>{f.a}</Text>
              )}
            </View>
          ))}
        </Card>

        {/* report issue */}
        <Card style={{ borderRadius: 16, padding: 14, gap: 8 }}>
          <LabelCaps>{t('reportIssue')}</LabelCaps>
          {ISSUES.map((iss) => (
            <TouchableOpacity key={iss.key} onPress={() => report(iss.key)} style={styles.issueRow}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name={iss.icon} size={18} color={C.secondary} />
              </View>
              <Text style={{ flex: 1, fontSize: 13.5, fontWeight: '600', color: C.onSurface }}>{t(iss.key)}</Text>
              <MaterialCommunityIcons name="chevron-right" size={19} color={C.outline} />
            </TouchableOpacity>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  circle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  issueRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
});
