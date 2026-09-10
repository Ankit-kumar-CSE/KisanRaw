import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLang } from '../../i18n';
import { useStore } from '../../store/AppStore';
import { verifyOTP, sendOTP } from '../../services/authService';
import { Button } from '../../components/ui';

export default function OtpScreen({ navigation, route }) {
  const { t } = useLang();
  const { setSession } = useStore();
  const mobile = route.params?.mobile || '';
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [seconds, setSeconds] = useState(60);
  const inputRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  const submit = async (code) => {
    const value = code ?? otp;
    if (value.length !== 6) return;
    setChecking(true);
    setError('');
    const res = await verifyOTP(mobile, value);
    setChecking(false);
    if (!res.success) {
      setError(res.error === 'expired' ? t('otpExpired') : t('otpWrong'));
      setOtp('');
      return;
    }
    setSession(res.session);
    // Root navigator routes to Registration (no profile) or Home (profile exists).
  };

  const resend = async () => {
    setResending(true);
    await sendOTP(mobile);
    setResending(false);
    setSeconds(60);
    setOtp('');
    setError('');
  };

  const masked = mobile ? `+91 ${mobile.slice(0, 5)} XXXXX`.replace('XXXXX', `${mobile.slice(5)}`.replace(/.(?=.{2})/g, 'X')) : '';

  return (
    <SafeAreaView style={styles.screen}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <MaterialCommunityIcons name="arrow-left" size={22} color="#131B2E" />
      </TouchableOpacity>
      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="message-text-clock" size={34} color="#004625" />
        </View>
        <Text style={styles.title}>{t('otpTitle')}</Text>
        <Text style={styles.sub}>{t('otpSentTo')} <Text style={{ fontWeight: '800', color: '#131B2E' }}>+91 {mobile?.replace(/(\d{5})(\d{5})/, '$1 $2')}</Text></Text>

        <TextInput
          ref={inputRef}
          value={otp}
          onChangeText={(v) => {
            const clean = v.replace(/\D/g, '').slice(0, 6);
            setOtp(clean);
            setError('');
            if (clean.length === 6) submit(clean);
          }}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
          style={styles.otpInput}
          placeholder="_ _ _ _ _ _" placeholderTextColor="#707971"
        />
        {error ? (
          <View style={styles.errorRow}>
            <MaterialCommunityIcons name="alert-circle" size={15} color="#BA1A1A" />
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.hintRow}>
          <MaterialCommunityIcons name="information-outline" size={14} color="#904D00" />
          <Text style={styles.hint}>{t('demoOtpHint')}: 123456</Text>
        </View>

        <Button title={checking ? t('verifying') : t('verify')} loading={checking} onPress={() => submit()} style={{ marginTop: 14 }} disabled={otp.length !== 6} />

        <View style={styles.resendRow}>
          {seconds > 0 ? (
            <Text style={styles.resendDisabled}>Resend in {seconds}s</Text>
          ) : (
            <TouchableOpacity onPress={resend} disabled={resending}>
              <Text style={styles.resend}>{resending ? '…' : t('resendOtp')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.change}>{t('changeNumber')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAF8FF', paddingHorizontal: 22 },
  back: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#EAEDFF', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  body: { flex: 1, justifyContent: 'center', gap: 10, paddingBottom: 60 },
  iconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#AFF2C2', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#131B2E', marginTop: 6 },
  sub: { fontSize: 13.5, color: '#404941', lineHeight: 20 },
  otpInput: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#DAE2FD',
    height: 58, fontSize: 24, fontWeight: '800', letterSpacing: 14, textAlign: 'center', color: '#131B2E', marginTop: 8,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  error: { color: '#BA1A1A', fontSize: 12.5, fontWeight: '600' },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,220,195,0.5)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  hint: { color: '#2F1500', fontSize: 11.5, fontWeight: '700' },
  resendRow: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 6 },
  resendDisabled: { color: '#707971', fontSize: 12.5 },
  resend: { color: '#004625', fontSize: 13, fontWeight: '800' },
  change: { color: '#904D00', fontSize: 13, fontWeight: '700' },
});
