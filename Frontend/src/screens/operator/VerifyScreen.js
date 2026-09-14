import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, StyleSheet, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { farmer as C } from '../../theme/colors';
import { Card, Chip, PulseDot, useToast } from '../../components/ui';
import { useLang } from '../../i18n';
import { api } from '../../services/api';
import { getActiveBooking } from '../../services/bookingService';

export default function VerifyScreen() {
  const toast = useToast();
  const { t } = useLang();
  const [scannedId, setScannedId] = useState('');
  const [verified, setVerified] = useState(false);
  const [checkin, setCheckin] = useState(false);
  const [R, setResult] = useState(null);

  const verify = async (id) => {
    const code = (id ?? scannedId).trim();
    if (!code) {
      toast('Scan the farmer QR or type the Booking ID first', t('scanGate'));
      return;
    }
    try {
      const data = await api('/api/operator/verify', { method: 'POST', body: { code } });
      setResult(data.result);
      setVerified(true);
      toast(`${code} ✓`, t('scanned'));
    } catch {
      setVerified(false);
      toast('Token not found in system', t('scanGate'));
    }
  };

  const simulateGateScan = async () => {
    try {
      const active = await getActiveBooking();
      const code = active?.bookingId;
      if (!code) {
        toast('No active booking to simulate', t('scanGate'));
        return;
      }
      setScannedId(code);
      await verify(code);
    } catch {
      toast('Could not load an active booking', t('scanGate'));
    }
  };

  const admit = async () => {
    try {
      await api('/api/operator/check-in', { method: 'POST', body: { code: scannedId } });
      setCheckin(true);
    } catch (err) {
      toast(err.payload?.error === 'already_checked_in' ? 'Already checked in' : 'Check-in failed', t('scanGate'));
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 110 }}>
      {/* kiosk header band */}
      <View style={{ backgroundColor: C.primaryContainer, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <MaterialCommunityIcons name="shield-account" size={22} color={C.primaryFixed} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', letterSpacing: 1, color: C.primaryFixed }}>{t('operatorTerminal')}</Text>
          <Text style={{ fontSize: 11, color: '#94D5A8' }}>Markfed Centre, Phagwara • Gate #01</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <PulseDot color={C.primaryFixed} size={6} />
            <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#fff' }}>{t('liveSync')}</Text>
          </View>
          <Text style={{ fontSize: 9, color: '#94D5A8' }}>PUN-OPR-942</Text>
        </View>
      </View>

      {/* context bar */}
      <View style={{ backgroundColor: C.surfaceContainerHigh, paddingHorizontal: 16, paddingVertical: 7, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 11, color: C.onSurface }}>Operator: <Text style={{ fontWeight: '700' }}>Gurpreet Singh</Text></Text>
        <Text style={{ fontSize: 11, color: C.onSurface }}>Bay #2 Weighbridge • <Text style={{ color: C.primary, fontWeight: '800' }}>Ready</Text></Text>
      </View>

      <View style={{ padding: 14, gap: 12 }}>
        {/* heading */}
        <View>
          <Text style={{ fontSize: 17, fontWeight: '800', color: C.primary }}>{t('verifyHeading')}</Text>
        </View>

        {/* scan zone */}
        <Card style={{ borderRadius: 14, padding: 14, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: C.primaryFixed, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="qrcode-scan" size={21} color={C.primary} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '800', color: C.onSurface, flex: 1 }}>{t('scanGate')}</Text>
          </View>
          <Text style={{ fontSize: 11.5, color: C.onSurfaceVariant, lineHeight: 17 }}>{t('scanHint')}</Text>
          <TextInput
            value={scannedId}
            onChangeText={(v) => { setScannedId(v); setVerified(false); }}
            onSubmitEditing={() => verify()}
            placeholder="KS-XXXXXXXX-XXXX" placeholderTextColor={C.outline}
            autoCapitalize="characters" autoFocus
            style={styles.scanInput}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => verify()} style={{ flex: 1, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="magnify" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>{t('verifyBtn')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={simulateGateScan} style={{ backgroundColor: C.primaryFixed, borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center' }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: C.onPrimaryFixed }}>{t('simulateGate')}</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* verified slip */}
        {verified && R && (
          <Card style={{ borderRadius: 14, overflow: 'hidden' }}>
            <View style={{ backgroundColor: C.primary, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <MaterialCommunityIcons name="check-circle" size={26} color={C.primaryFixed} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14.5, fontWeight: '800', color: C.primaryFixed }}>{t('eligible')}</Text>
              </View>
              <View style={{ backgroundColor: C.primaryContainer, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: C.primaryFixed }}>{t('matched')}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 12, backgroundColor: 'rgba(175,242,194,0.3)' }}>
              <Chip label={t('sealValid')} bg="#AFF2C2" fg={C.onPrimaryFixed} icon="shield-check" size={10} />
              <Chip label={t('nonDuplicate')} bg="#AFF2C2" fg={C.onPrimaryFixed} icon="sync" size={10} />
              <Chip label={t('yardMatch')} bg="#AFF2C2" fg={C.onPrimaryFixed} icon="domain" size={10} />
            </View>

            <View style={{ padding: 14, gap: 12 }}>
              {/* token / slot */}
              <View style={{ backgroundColor: C.surfaceContainer, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fineLabel}>{t('tokenNumber')}</Text>
                  <Text style={{ fontSize: 24, fontWeight: '800', color: C.primary }}>{R.token}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 3 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <PulseDot color={C.secondary} size={7} />
                    <Text style={{ fontSize: 12.5, fontWeight: '800', color: C.secondary }}>{R.slot}</Text>
                  </View>
                  <Text style={{ fontSize: 10.5, color: C.onSurfaceVariant }}>{t('arrivalStatus')}: <Text style={{ color: C.primary, fontWeight: '700' }}>{R.arrival}</Text></Text>
                </View>
              </View>

              {/* details grid */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Detail label={t('farmerName')} value={R.farmer} />
                <Detail label={t('aadhaar')} value={R.aadhaar} sub="UIDAI Verified" />
                <Detail label={t('mobile')} value={R.mobile} sub="SMS Link Active" />
                <Detail label={t('vehicle')} value={R.vehicle} sub={R.vehicleType} />
              </View>

              {/* crop & payload */}
              <View style={{ backgroundColor: C.surfaceContainer, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: 'rgba(254,147,44,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name="grain" size={20} color={C.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fineLabel}>{t('commodityType')}</Text>
                  <Text style={{ fontSize: 13.5, fontWeight: '700', color: C.onSurface }}>{R.commodity}</Text>
                  <Text style={{ fontSize: 11, color: C.onSurfaceVariant }}>Mandi MSP: {R.msp}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.fineLabel}>{t('declaredWeight')}</Text>
                  <Text style={{ fontSize: 24, fontWeight: '800', color: C.secondary }}>{R.declared}</Text>
                  <Text style={{ fontSize: 10, color: C.onSurfaceVariant }}>{t('quintals')}</Text>
                </View>
              </View>

              <View style={{ backgroundColor: C.surfaceContainerLow, borderRadius: 10, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="clipboard-check" size={16} color={C.primary} />
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: C.onSurface }}>{t('firstEntry')}</Text>
                  <Text style={{ fontSize: 10.5, color: C.onSurfaceVariant }}>{t('firstEntrySub')}</Text>
                </View>
              </View>

              {/* actions */}
              <TouchableOpacity
                onPress={admit}
                style={{ backgroundColor: C.primary, borderRadius: 12, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 56 }}
              >
                <MaterialCommunityIcons name="checkbox-marked" size={19} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13.5 }}>{t('admit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => Alert.alert('Reporting Flag', 'Farmer moisture dispute or vehicle mismatch logged. Mandi Inspector alerted to inspect trolley PB-11-X-8902.')}
                style={{ backgroundColor: C.surfaceContainerHighest, borderRadius: 12, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <MaterialCommunityIcons name="flag" size={17} color={C.secondary} />
                <Text style={{ color: C.secondary, fontWeight: '700', fontSize: 12.5 }}>{t('reportDiscrepancy')}</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* rulebook */}
        <Card style={{ borderRadius: 14, padding: 14, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="security" size={16} color={C.secondary} />
            <Text style={{ fontSize: 13, fontWeight: '800', color: C.secondary }}>{t('rulebook')}</Text>
          </View>
          <Rule icon="account-cancel" color={C.error} title="If Token Not Found in System" body="Redirect farmer to Facilitation Helpdesk Counter #4." />
          <Rule icon="restore" color={C.secondary} title="Duplicate Entry Prevention" body="System blocks re-entry. Always check previous weighbridge slip." />
          <Rule icon="map-marker-off" color={C.tertiary} title="Mandi Yard Mismatch" body="Nabha/Khanna/Goraya bookings cannot unload at Phagwara. Rerouting needs Mandi Secretary approval." />
        </Card>
      </View>

      {/* check-in success modal */}
      <Modal visible={checkin} transparent animationType="fade" onRequestClose={() => setCheckin(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ width: 64, height: 64, borderRadius: 999, backgroundColor: C.primaryFixed, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }}>
              <MaterialCommunityIcons name="check-all" size={32} color={C.primary} />
            </View>
            <Text style={{ fontSize: 17, fontWeight: '800', color: C.primary, textAlign: 'center', marginTop: 12 }}>{t('entryConfirmed')}</Text>
            <Text style={{ fontSize: 12, color: C.onSurfaceVariant, textAlign: 'center' }}>{t('entryConfirmedSub')}</Text>
            <Text style={{ fontSize: 12.5, color: C.onSurface, textAlign: 'center', marginTop: 8 }}>
              {R.token} → <Text style={{ fontWeight: '800' }}>Weighbridge Bay #2</Text>
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              <View style={{ flex: 1, backgroundColor: C.surfaceContainer, borderRadius: 10, padding: 10, alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: C.onSurfaceVariant }}>{t('queuePosition')}</Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: C.secondary }}>{R.queuePos} in Line</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: C.surfaceContainer, borderRadius: 10, padding: 10, alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: C.onSurfaceVariant }}>{t('estWeighTime')}</Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: C.primary }}>{R.estWeigh}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => { setCheckin(false); setVerified(false); setScannedId(''); setResult(null); }}
              style={{ backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 }}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>{t('nextFarmer')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function Detail({ label, value, sub }) {
  return (
    <View style={{ flex: 1, minWidth: '46%', backgroundColor: C.surfaceContainerLow, borderRadius: 10, padding: 10 }}>
      <Text style={styles.fineLabel}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '700', color: C.onSurface, marginTop: 2 }}>{value}</Text>
      {sub && <Text style={{ fontSize: 10, color: C.primary, marginTop: 2 }}>{sub}</Text>}
    </View>
  );
}

function Rule({ icon, color, title, body }) {
  return (
    <View style={{ backgroundColor: C.surfaceContainerLow, borderRadius: 10, padding: 11, flexDirection: 'row', gap: 9 }}>
      <MaterialCommunityIcons name={icon} size={18} color={color} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: color }}>{title}</Text>
        <Text style={{ fontSize: 11, color: C.onSurfaceVariant, marginTop: 2 }}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  scanInput: {
    backgroundColor: C.surfaceContainerLow, borderRadius: 10, paddingHorizontal: 14, height: 48,
    fontSize: 14.5, fontWeight: '700', letterSpacing: 0.5, color: C.onSurface,
  },
  fineLabel: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.7, color: C.onSurfaceVariant, textTransform: 'uppercase' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(40,48,68,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '100%', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, elevation: 10 },
});
