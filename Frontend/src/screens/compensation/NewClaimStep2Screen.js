import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { farmer as C } from '../../theme/colors';
import { Card, Button } from '../../components/ui';
import { StepBar } from './NewClaimStep1Screen';

export default function NewClaimStep2Screen({ navigation, route }) {
  const { draft } = route.params;
  const [affectedAreaAcres, setAffectedAreaAcres] = useState('');
  const [cultivatedAreaAcres, setCultivatedAreaAcres] = useState('');
  const [damagePct, setDamagePct] = useState('');
  const [estimatedLossQtl, setEstimatedLossQtl] = useState('');
  const [sowingDate, setSowingDate] = useState('');
  const [harvestDate, setHarvestDate] = useState('');
  const [village, setVillage] = useState(draft.village || '');
  const [district, setDistrict] = useState(draft.district || '');
  const [state, setState] = useState(draft.state || '');
  const [description, setDescription] = useState('');

  const canProceed = affectedAreaAcres && Number(affectedAreaAcres) > 0;

  const proceed = () => {
    if (!canProceed) return;
    navigation.navigate('NewClaimStep3', {
      draft: {
        ...draft,
        affectedAreaAcres: Number(affectedAreaAcres),
        cultivatedAreaAcres: cultivatedAreaAcres ? Number(cultivatedAreaAcres) : undefined,
        damagePct: damagePct ? Number(damagePct) : undefined,
        estimatedLossQtl: estimatedLossQtl ? Number(estimatedLossQtl) : undefined,
        sowingDate: sowingDate || undefined,
        harvestDate: harvestDate || undefined,
        village, district, state,
        description,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={C.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Claim — Step 2 of 3</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, gap: 14, paddingBottom: 120 }}>
        <StepBar step={2} />

        {/* Area Details */}
        <Card style={{ borderRadius: 14, padding: 14, gap: 10 }}>
          <Text style={styles.sectionTitle}>Area Details</Text>

          <Text style={styles.label}>Affected Area (acres) *</Text>
          <TextInput style={styles.input} placeholder="e.g. 2.5" placeholderTextColor={C.outline} value={affectedAreaAcres} onChangeText={setAffectedAreaAcres} keyboardType="decimal-pad" />

          <Text style={styles.label}>Total Cultivated Area (acres)</Text>
          <TextInput style={styles.input} placeholder="e.g. 5.0" placeholderTextColor={C.outline} value={cultivatedAreaAcres} onChangeText={setCultivatedAreaAcres} keyboardType="decimal-pad" />

          <Text style={styles.label}>Estimated Damage %</Text>
          <TextInput style={styles.input} placeholder="0–100" placeholderTextColor={C.outline} value={damagePct} onChangeText={setDamagePct} keyboardType="decimal-pad" maxLength={5} />

          <Text style={styles.label}>Estimated Crop Loss (Qtl)</Text>
          <TextInput style={styles.input} placeholder="e.g. 12.5" placeholderTextColor={C.outline} value={estimatedLossQtl} onChangeText={setEstimatedLossQtl} keyboardType="decimal-pad" />
        </Card>

        {/* Crop Dates */}
        <Card style={{ borderRadius: 14, padding: 14, gap: 10 }}>
          <Text style={styles.sectionTitle}>Crop Calendar (optional)</Text>
          <Text style={styles.label}>Sowing Date (YYYY-MM-DD)</Text>
          <TextInput style={styles.input} placeholder="e.g. 2026-06-20" placeholderTextColor={C.outline} value={sowingDate} onChangeText={setSowingDate} keyboardType="numbers-and-punctuation" maxLength={10} />
          <Text style={styles.label}>Harvest Date (YYYY-MM-DD)</Text>
          <TextInput style={styles.input} placeholder="e.g. 2026-10-15" placeholderTextColor={C.outline} value={harvestDate} onChangeText={setHarvestDate} keyboardType="numbers-and-punctuation" maxLength={10} />
        </Card>

        {/* Location */}
        <Card style={{ borderRadius: 14, padding: 14, gap: 10 }}>
          <Text style={styles.sectionTitle}>Farm Location</Text>
          <Text style={styles.label}>Village</Text>
          <TextInput style={styles.input} placeholder="Village name" placeholderTextColor={C.outline} value={village} onChangeText={setVillage} />
          <Text style={styles.label}>District</Text>
          <TextInput style={styles.input} placeholder="District" placeholderTextColor={C.outline} value={district} onChangeText={setDistrict} />
          <Text style={styles.label}>State</Text>
          <TextInput style={styles.input} placeholder="State" placeholderTextColor={C.outline} value={state} onChangeText={setState} />
        </Card>

        {/* Description */}
        <Card style={{ borderRadius: 14, padding: 14, gap: 10 }}>
          <Text style={styles.sectionTitle}>Additional Details</Text>
          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]}
            placeholder="Describe the extent of damage, any immediate actions taken, etc."
            placeholderTextColor={C.outline}
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Next: Upload Documents" icon="arrow-right" onPress={proceed} disabled={!canProceed} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.surfaceContainerHighest },
  back: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '800', color: C.onSurface },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: C.primary, textTransform: 'uppercase' },
  label: { fontSize: 12, fontWeight: '700', color: C.onSurface },
  input: { borderWidth: 1.5, borderColor: C.surfaceContainerHighest, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: C.onSurface, backgroundColor: '#fff' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.surfaceContainerHighest },
});
