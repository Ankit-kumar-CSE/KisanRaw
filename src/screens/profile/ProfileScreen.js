import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { farmer as C, helpline } from '../../theme/colors';
import { useLang, LanguagePill } from '../../i18n';
import { useStore } from '../../store/AppStore';
import { Card, Button } from '../../components/ui';
import logo from '../../logo.png';

export default function ProfileScreen({ navigation }) {
  const { t } = useLang();
  const { profile, session, logout, notifications } = useStore();
  const unread = notifications.filter((n) => !n.read).length;

  const doLogout = () => {
    Alert.alert(t('logoutConfirm'), '', [
      { text: t('back'), style: 'cancel' },
      { text: t('logoutYes'), style: 'destructive', onPress: logout },
    ]);
  };

  const sections = [
    {
      title: t('personalInfo'),
      items: [
        { icon: 'account-outline', label: t('fullName'), value: profile?.name || 'Raj Kumar', onPress: null },
        { icon: 'card-bulleted-outline', label: t('farmerId'), value: profile?.farmerId || '—', onPress: null },
        { icon: 'phone-outline', label: t('mobileL'), value: session?.mobile ? `+91 ${session.mobile}` : '—', onPress: null },
        { icon: 'home-map-marker', label: t('village'), value: profile ? `${profile.village}, ${profile.district}, ${profile.state}` : '—', onPress: null },
      ],
    },
    {
      title: t('cropInfo'),
      items: [{ icon: 'sprout', label: t('cropLbl'), value: profile?.crops?.length ? profile.crops.join(', ') : '—', onPress: null }],
    },
    {
      title: 'App',
      items: [
        { icon: 'file-document-outline', label: t('documents'), value: 'Aadhaar · Jamabandi · Bank', onPress: () => {} },
        { icon: 'translate', label: t('language'), custom: 'lang', onPress: null },
        { icon: 'bell-outline', label: t('notifLbl'), value: unread ? `${unread} new` : '', onPress: () => navigation.navigate('Notifications') },
        { icon: 'help-circle-outline', label: t('helpSupport'), onPress: () => navigation.navigate('Help') },
        { icon: 'shield-lock-outline', label: t('privacy'), value: 'v1.0', onPress: () => {} },
      ],
    },
    {
      title: t('operatorTools'),
      items: [
        { icon: 'qrcode-scan', label: t('gateVerify'), onPress: () => navigation.navigate('Verify') },
        { icon: 'view-dashboard', label: t('consoleLbl'), onPress: () => navigation.navigate('Console') },
        { icon: 'podium', label: t('queueControl'), onPress: () => navigation.navigate('QueueControl') },
      ],
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {/* header card */}
        <Card style={{ borderRadius: 18, padding: 18, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 62, height: 62, borderRadius: 999, backgroundColor: C.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="account" size={32} color={C.primaryFixed} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: C.onSurface }}>{profile?.name || 'Raj Kumar'}</Text>
              <Text style={{ fontSize: 12, color: C.onSurfaceVariant }}>{profile?.farmerId || t('farmerId')} · kisanRaw</Text>
            </View>
            <Image source={logo} style={{ width: 54, height: 30 }} resizeMode="contain" />
          </View>
        </Card>

        {sections.map((sec) => (
          <Card key={sec.title} style={{ borderRadius: 16, padding: 14, gap: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, color: C.primary, textTransform: 'uppercase', marginBottom: 6 }}>{sec.title}</Text>
            {sec.items.map((it) => (
              <TouchableOpacity key={it.label} onPress={it.onPress || (() => {})} disabled={!it.onPress} style={styles.row}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: C.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name={it.icon} size={17} color={C.primary} />
                </View>
                <Text style={{ flex: 1, fontSize: 13.5, fontWeight: '600', color: C.onSurface, marginLeft: 4 }}>{it.label}</Text>
                {it.custom === 'lang' ? (
                  <LanguagePill />
                ) : it.value ? (
                  <Text style={{ fontSize: 11.5, color: C.onSurfaceVariant, maxWidth: 140 }} numberOfLines={1}>{it.value}</Text>
                ) : null}
                {it.onPress && <MaterialCommunityIcons name="chevron-right" size={19} color={C.outline} />}
              </TouchableOpacity>
            ))}
          </Card>
        ))}

        {/* helpline */}
        <TouchableOpacity style={styles.helpCard} onPress={() => Linking.openURL(`tel:${helpline.replace(/-/g, '')}`)}>
          <MaterialCommunityIcons name="headset" size={20} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, color: '#FFDCC3', fontWeight: '700' }}>Mandi Helpline</Text>
            <Text style={{ fontSize: 14, color: '#fff', fontWeight: '800' }}>{helpline}</Text>
          </View>
          <MaterialCommunityIcons name="phone" size={20} color="#fff" />
        </TouchableOpacity>

        <Button title={t('logout')} icon="logout" variant="outline" onPress={doLogout} />
        <Text style={{ textAlign: 'center', fontSize: 10.5, color: C.outline }}>kisanRaw v1.0 · Smart Procurement. Less Waiting.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  helpCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#904D00',
    borderRadius: 16, padding: 14, shadowColor: '#904D00', shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
});
