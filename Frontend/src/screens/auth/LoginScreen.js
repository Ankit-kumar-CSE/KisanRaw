import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLang } from '../../i18n';
import { useStore } from '../../store/AppStore';
import { sendOTP } from '../../services/authService';
import { Button } from '../../components/ui';
import logo from '../../logo.png';

export default function LoginScreen({ navigation }) {
  const { t } = useLang();
  const { online } = useStore();
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const clean = mobile.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(clean)) {
      setError(t('invalidMobile'));
      return;
    }
    setError('');
    setSending(true);
    try {
      await sendOTP(clean);
      navigation.navigate('Otp', { mobile: clean });
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.body}>
        <Image source={logo} style={{ width: 140, height: 38 }} resizeMode="contain" />
        <Text style={styles.title}>{t('loginTitle')}</Text>
        <Text style={styles.sub}>{t('loginSub')}</Text>

        <View style={[styles.inputWrap, error ? { borderColor: '#BA1A1A' } : null]}>
          <Text style={styles.prefix}>+91</Text>
          <TextInput
            value={mobile}
            onChangeText={(v) => { setMobile(v); setError(''); }}
            placeholder={t('mobilePh')} placeholderTextColor="#707971"
            keyboardType="phone-pad" maxLength={10}
            style={styles.input}
          />
          {mobile.length === 10 && <MaterialCommunityIcons name="check-circle" size={20} color="#006C4A" />}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!online ? <Text style={styles.error}>{t('offlineBanner')}</Text> : null}

        <Button title={t('sendOtp')} icon="arrow-right" loading={sending} onPress={submit} style={{ marginTop: 16 }} />
      </View>
      <Text style={styles.foot}>Punjab State Mandi Board · Procurement Grid</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAF8FF', paddingHorizontal: 22 },
  body: { flex: 1, justifyContent: 'center', gap: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#131B2E', marginTop: 8 },
  sub: { fontSize: 13.5, color: '#404941' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: '#DAE2FD', paddingHorizontal: 14, height: 54, gap: 10, marginTop: 10,
  },
  prefix: { fontSize: 16, fontWeight: '800', color: '#131B2E' },
  input: { flex: 1, fontSize: 16, color: '#131B2E', letterSpacing: 1 },
  error: { color: '#BA1A1A', fontSize: 12.5, fontWeight: '600' },
  foot: { textAlign: 'center', color: '#707971', fontSize: 11, paddingBottom: 16 },
});
