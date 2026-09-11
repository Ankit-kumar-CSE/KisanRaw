import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLang } from '../../i18n';
import { useStore } from '../../store/AppStore';
import { saveFarmerProfile } from '../../services/profileService';
import { Button } from '../../components/ui';

const CROPS = [
  { key: 'Wheat', icon: 'barley', labelKey: 'wheat' },
  { key: 'Paddy', icon: 'grass', labelKey: 'paddy' },
  { key: 'Maize', icon: 'corn', labelKey: 'maize' },
  { key: 'Other', icon: 'sprout', labelKey: 'otherCrop' },
];

export default function RegisterScreen() {
  const { t } = useLang();
  const { session, setProfile } = useStore();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', farmerId: '', state: 'Punjab', district: 'Kapurthala', village: '', address: '',
  });
  const [crops, setCrops] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  const validateStep1 = () => {
    const e = {};
    if (!form.name.trim()) e.name = t('reqField');
    if (!form.village.trim()) e.village = t('reqField');
    if (!form.district.trim()) e.district = t('reqField');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const finish = async () => {
    setSaving(true);
    const profile = await saveFarmerProfile({ ...form, crops, mobile: session?.mobile || '' });
    setProfile(profile);
    // root navigator switches to Main automatically
  };

  const Field = ({ k, label, ph, keyboardType }) => (
    <View style={{ gap: 4 }}>
      <Text style={styles.label}>{label} *</Text>
      <TextInput
        value={form[k]} onChangeText={(v) => set(k, v)} placeholder={ph} placeholderTextColor="#707971"
        keyboardType={keyboardType || 'default'} style={[styles.input, errors[k] && { borderColor: '#BA1A1A' }]}
      />
      {errors[k] ? <Text style={styles.error}>{errors[k]}</Text> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      {/* step header */}
      <View style={styles.stepHead}>
        <Text style={styles.stepTitle}>{t('regTitle')}</Text>
        <Text style={styles.stepOf}>{t('stepOf', { n: step })}</Text>
      </View>
      <View style={styles.stepBar}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={[styles.stepSeg, s <= step && styles.stepSegOn]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, gap: 12, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <>
            <Text style={styles.secTitle}>{t('personalInfo')}</Text>
            <Field k="name" label={t('fullName')} ph="e.g. Raj Kumar" />
            <Field k="farmerId" label={`${t('farmerId')} (${t('emptyQ')})`} ph="e.g. PB-KPR-2024-88392" />
            <Field k="state" label={t('stateL')} ph="Punjab" />
            <Field k="district" label={t('district')} ph="Kapurthala" />
            <Field k="village" label={t('village')} ph="e.g. Kotrani" />
            <Field k="address" label={`${t('address')} (${t('emptyQ')})`} ph="House / Street" />
          </>
        )}
        {step === 2 && (
          <>
            <Text style={styles.secTitle}>{t('cropInfo')}</Text>
            <Text style={styles.sub}>{t('selectCrops')}</Text>
            {errors.crops ? <Text style={styles.error}>{errors.crops}</Text> : null}
            {CROPS.map((c) => {
              const on = crops.includes(c.key);
              return (
                <TouchableOpacity key={c.key} onPress={() => {
                  setCrops((cs) => (on ? cs.filter((x) => x !== c.key) : [...cs, c.key]));
                  setErrors((e) => ({ ...e, crops: undefined }));
                }} style={[styles.cropRow, on && styles.cropRowOn]}>
                  <View style={[styles.cropIcon, { backgroundColor: on ? '#AFF2C2' : '#EAEDFF' }]}>
                    <MaterialCommunityIcons name={c.icon} size={22} color={on ? '#004625' : '#404941'} />
                  </View>
                  <Text style={{ flex: 1, fontSize: 14.5, fontWeight: '700', color: '#131B2E' }}>{t(c.labelKey)}</Text>
                  <MaterialCommunityIcons name={on ? 'checkbox-marked' : 'checkbox-blank-outline'} size={22} color={on ? '#004625' : '#707971'} />
                </TouchableOpacity>
              );
            })}
          </>
        )}
        {step === 3 && (
          <>
            <Text style={styles.secTitle}>{t('regSummary')}</Text>
            <View style={styles.summary}>
              <SumRow label={t('fullName')} value={form.name} />
              <SumRow label={t('mobileL')} value={`+91 ${session?.mobile || ''}`} />
              <SumRow label={t('farmerId')} value={form.farmerId || '—'} />
              <SumRow label={t('village')} value={`${form.village}, ${form.district}, ${form.state}`} />
              <SumRow label={t('cropLbl')} value={crops.join(', ')} />
            </View>
            <TouchableOpacity onPress={() => setStep(1)} style={{ alignSelf: 'flex-start' }}>
              <Text style={{ color: '#004625', fontWeight: '700', fontSize: 13 }}>{t('edit')}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity onPress={() => setStep(step - 1)} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#131B2E" />
          </TouchableOpacity>
        )}
        <Button
          title={step === 3 ? (saving ? t('completing') : t('completeReg')) : t('continueC')}
          loading={saving}
          style={{ flex: 1 }}
          onPress={() => {
            if (step === 1 && validateStep1()) setStep(2);
            else if (step === 2) {
              if (!crops.length) setErrors((e) => ({ ...e, crops: t('pickCrop') }));
              else setStep(3);
            } else finish();
          }}
        />
      </View>
    </SafeAreaView>
  );
}

function SumRow({ label, value }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text style={{ fontSize: 12.5, color: '#404941' }}>{label}</Text>
      <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#131B2E', flex: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAF8FF' },
  stepHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 12 },
  stepTitle: { fontSize: 18, fontWeight: '800', color: '#131B2E', flex: 1 },
  stepOf: { fontSize: 12, fontWeight: '700', color: '#004625' },
  stepBar: { flexDirection: 'row', gap: 6, paddingHorizontal: 18, marginTop: 10 },
  stepSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#DAE2FD' },
  stepSegOn: { backgroundColor: '#004625' },
  secTitle: { fontSize: 16, fontWeight: '800', color: '#131B2E', marginTop: 6 },
  sub: { fontSize: 12.5, color: '#404941' },
  label: { fontSize: 11.5, fontWeight: '700', color: '#404941' },
  input: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#DAE2FD',
    paddingHorizontal: 14, height: 48, fontSize: 14, color: '#131B2E',
  },
  error: { color: '#BA1A1A', fontSize: 11.5, fontWeight: '600' },
  cropRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    borderRadius: 14, padding: 14, borderWidth: 2, borderColor: 'transparent',
  },
  cropRowOn: { borderColor: '#004625', backgroundColor: 'rgba(175,242,194,0.25)' },
  cropIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  summary: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 10 },
  footer: {
    flexDirection: 'row', gap: 10, padding: 16, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#EAEDFF', alignItems: 'center',
  },
  backBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#EAEDFF', alignItems: 'center', justifyContent: 'center' },
});
