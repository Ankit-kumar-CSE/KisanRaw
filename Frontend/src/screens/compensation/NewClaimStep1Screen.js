import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { farmer as C } from '../../theme/colors';
import { Card, Button } from '../../components/ui';
import { useStore } from '../../store/AppStore';
import * as compensationService from '../../services/compensationService';

const CROPS = ['Wheat', 'Paddy', 'Maize', 'Cotton', 'Sugarcane', 'Soybean', 'Groundnut', 'Mustard', 'Pulses', 'Other'];
const DAMAGE_TYPES = [
  { key: 'flood', label: 'Flood', icon: 'waves' },
  { key: 'drought', label: 'Drought', icon: 'weather-sunny-alert' },
  { key: 'hail', label: 'Hailstorm', icon: 'weather-hail' },
  { key: 'cyclone', label: 'Cyclone', icon: 'weather-hurricane' },
  { key: 'pest', label: 'Pest Attack', icon: 'bug' },
  { key: 'fire', label: 'Fire', icon: 'fire' },
  { key: 'frost', label: 'Frost', icon: 'snowflake' },
  { key: 'other', label: 'Other', icon: 'dots-horizontal' },
];

export default function NewClaimStep1Screen({ navigation }) {
  const { profile } = useStore();
  const [crop, setCrop] = useState('');
  const [cropVariety, setCropVariety] = useState('');
  const [damageType, setDamageType] = useState('');
  const [otherDamageType, setOtherDamageType] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [loading, setLoading] = useState(false);

  // Validate YYYY-MM-DD
  const isValidDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);

  const canProceed = crop && damageType && incidentDate && isValidDate(incidentDate)
    && (damageType !== 'other' || otherDamageType.trim());

  const proceed = () => {
    if (!canProceed) return;
    navigation.navigate('NewClaimStep2', {
      draft: { crop, cropVariety, damageType, otherDamageType, incidentDate,
        village: profile?.village || '', district: profile?.district || '', state: profile?.state || '' },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={C.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Claim — Step 1 of 3</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, gap: 14, paddingBottom: 120 }}>
        {/* Step Indicator */}
        <StepBar step={1} />

        {/* Crop Selection */}
        <Card style={{ borderRadius: 14, padding: 14, gap: 10 }}>
          <Text style={styles.label}>Crop Type</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CROPS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCrop(c)}
                style={[styles.pill, crop === c && styles.pillActive]}
              >
                <Text style={[styles.pillText, crop === c && styles.pillTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: 8 }]}>Crop Variety (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. PB-1509, HD-2967..."
            placeholderTextColor={C.outline}
            value={cropVariety}
            onChangeText={setCropVariety}
          />
        </Card>

        {/* Damage Type */}
        <Card style={{ borderRadius: 14, padding: 14, gap: 10 }}>
          <Text style={styles.label}>Type of Damage</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {DAMAGE_TYPES.map((dt) => (
              <TouchableOpacity
                key={dt.key}
                onPress={() => setDamageType(dt.key)}
                style={[styles.damageChip, damageType === dt.key && styles.damageChipActive]}
              >
                <MaterialCommunityIcons name={dt.icon} size={15} color={damageType === dt.key ? '#fff' : C.primary} />
                <Text style={[styles.damageText, damageType === dt.key && { color: '#fff' }]}>{dt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {damageType === 'other' && (
            <TextInput
              style={styles.input}
              placeholder="Specify the damage type..."
              placeholderTextColor={C.outline}
              value={otherDamageType}
              onChangeText={setOtherDamageType}
            />
          )}
        </Card>

        {/* Incident Date */}
        <Card style={{ borderRadius: 14, padding: 14, gap: 10 }}>
          <Text style={styles.label}>Date of Incident</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD (e.g. 2026-08-15)"
            placeholderTextColor={C.outline}
            value={incidentDate}
            onChangeText={setIncidentDate}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
          {incidentDate.length === 10 && !isValidDate(incidentDate) && (
            <Text style={{ fontSize: 11, color: '#BA1A1A' }}>Please enter a valid date in YYYY-MM-DD format</Text>
          )}
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Next: Damage Details" icon="arrow-right" onPress={proceed} disabled={!canProceed} />
      </View>
    </SafeAreaView>
  );
}

export function StepBar({ step }) {
  const steps = ['Crop Info', 'Damage', 'Documents'];
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <View style={[stepStyles.dot, i + 1 <= step && stepStyles.dotActive, i + 1 === step && stepStyles.dotCurrent]}>
            {i + 1 < step
              ? <MaterialCommunityIcons name="check" size={12} color="#fff" />
              : <Text style={{ fontSize: 10, fontWeight: '800', color: i + 1 === step ? '#fff' : C.outline }}>{i + 1}</Text>
            }
          </View>
          <Text style={[stepStyles.stepLabel, i + 1 === step && { color: C.primary, fontWeight: '800' }]}>{s}</Text>
          {i < steps.length - 1 && <View style={stepStyles.line} />}
        </React.Fragment>
      ))}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: C.outline, alignItems: 'center', justifyContent: 'center' },
  dotActive: { backgroundColor: C.primary, borderColor: C.primary },
  dotCurrent: { backgroundColor: C.primary, borderColor: C.primary },
  stepLabel: { fontSize: 10, color: C.outline, fontWeight: '600' },
  line: { flex: 1, height: 1.5, backgroundColor: C.surfaceContainerHighest },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.surfaceContainerHighest },
  back: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '800', color: C.onSurface },
  label: { fontSize: 12, fontWeight: '800', color: C.onSurface },
  input: { borderWidth: 1.5, borderColor: C.surfaceContainerHighest, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: C.onSurface, backgroundColor: '#fff' },
  pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1.5, borderColor: C.surfaceContainerHighest, backgroundColor: '#fff' },
  pillActive: { backgroundColor: C.primaryContainer, borderColor: C.primaryContainer },
  pillText: { fontSize: 12, fontWeight: '700', color: C.onSurface },
  pillTextActive: { color: '#fff' },
  damageChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: C.surfaceContainerHighest, backgroundColor: '#fff' },
  damageChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  damageText: { fontSize: 12, fontWeight: '700', color: C.primary },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.surfaceContainerHighest },
});
