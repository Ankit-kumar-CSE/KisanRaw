import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { farmer as C } from '../../theme/colors';
import { Button } from '../../components/ui';

export default function ClaimSuccessScreen({ navigation, route }) {
  const { claimNumber, claimId } = route.params || {};

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="check-circle" size={64} color="#006C4A" />
        </View>

        <Text style={styles.title}>Claim Filed</Text>
        <Text style={styles.sub}>Your compensation claim has been created successfully and is ready for submission.</Text>

        <View style={styles.claimBox}>
          <Text style={styles.claimLabel}>Claim Number</Text>
          <Text style={styles.claimNum}>{claimNumber}</Text>
        </View>

        <View style={styles.steps}>
          {[
            { icon: 'file-check', text: 'Claim created in Draft status' },
            { icon: 'upload', text: 'Documents attached' },
            { icon: 'send', text: 'Open the claim to submit for review' },
          ].map((s, i) => (
            <View key={i} style={styles.step}>
              <MaterialCommunityIcons name={s.icon} size={16} color={C.primary} />
              <Text style={styles.stepText}>{s.text}</Text>
            </View>
          ))}
        </View>

        <View style={{ gap: 10, width: '100%' }}>
          <Button
            title="View Claim"
            icon="eye"
            onPress={() => navigation.replace('ClaimDetail', { claimId })}
          />
          <Button
            title="Back to Compensation"
            icon="arrow-left"
            variant="secondary"
            onPress={() => navigation.navigate('CompensationDashboard')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  iconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E6F4EA', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '800', color: '#131B2E', textAlign: 'center' },
  sub: { fontSize: 13, color: '#404941', textAlign: 'center', lineHeight: 19, maxWidth: 300 },
  claimBox: { backgroundColor: '#F2F3FF', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, alignItems: 'center', gap: 4, width: '100%' },
  claimLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: '#404941', textTransform: 'uppercase' },
  claimNum: { fontSize: 20, fontWeight: '800', color: '#003491', letterSpacing: 1 },
  steps: { gap: 10, width: '100%' },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F2F3FF', borderRadius: 10, padding: 10 },
  stepText: { fontSize: 12.5, color: '#131B2E', fontWeight: '600', flex: 1 },
});
