import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { farmer as C } from '../../theme/colors';
import { Card, Button, EmptyState, CardSkeleton, Chip } from '../../components/ui';
import * as compensationService from '../../services/compensationService';

const STATUS_MAP = {
  draft: { label: 'DRAFT', bg: '#DAE2FD', fg: '#003491' },
  submitted: { label: 'SUBMITTED', bg: '#FFDCC3', fg: '#2F1500' },
  document_verification: { label: 'DOC REVIEW', bg: '#FFDCC3', fg: '#2F1500' },
  info_required: { label: 'INFO NEEDED', bg: '#FFDAD6', fg: '#93000A' },
  field_verification: { label: 'FIELD CHECK', bg: '#FFDCC3', fg: '#2F1500' },
  assessment: { label: 'ASSESSMENT', bg: '#FFDCC3', fg: '#2F1500' },
  approved: { label: 'APPROVED', bg: '#AFF2C2', fg: '#00210F' },
  partially_approved: { label: 'PARTIAL', bg: '#AFF2C2', fg: '#00210F' },
  rejected: { label: 'REJECTED', bg: '#FFDAD6', fg: '#93000A' },
  payment_processing: { label: 'PAYMENT', bg: '#DBE1FF', fg: '#003491' },
  paid: { label: 'PAID', bg: '#AFF2C2', fg: '#00210F' },
};

export default function CompensationDashboardScreen({ navigation }) {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await compensationService.getClaims();
      setClaims(list);
    } catch (_) {
      // keep existing data on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const stats = {
    total: claims.length,
    active: claims.filter((c) => !['approved', 'rejected', 'paid', 'draft'].includes(c.status)).length,
    approved: claims.filter((c) => ['approved', 'partially_approved', 'paid'].includes(c.status)).length,
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={C.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crop Damage Compensation</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      >
        {/* Stats Row */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatCard icon="file-document-multiple" value={stats.total} label="Total Claims" color={C.tertiaryFixed} iconFg={C.tertiary} />
          <StatCard icon="clock-outline" value={stats.active} label="Under Review" color={C.secondaryFixed} iconFg={C.secondary} />
          <StatCard icon="check-decagram" value={stats.approved} label="Approved" color="#AFF2C2" iconFg={C.primary} />
        </View>

        {/* New Claim CTA */}
        <Button
          title="File New Claim"
          icon="plus-circle"
          onPress={() => navigation.navigate('NewClaimStep1')}
        />

        {/* Info Card */}
        <Card style={{ borderRadius: 14, padding: 14, gap: 6, backgroundColor: C.tertiaryFixed }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <MaterialCommunityIcons name="information-outline" size={17} color={C.tertiary} />
            <Text style={{ fontSize: 13, fontWeight: '800', color: C.tertiary }}>How Compensation Works</Text>
          </View>
          <Text style={{ fontSize: 11.5, color: '#1a237e', lineHeight: 17 }}>
            File a claim with details of the crop damage. Upload photos and documents. Submit for review — admins will verify and approve an eligible amount.
          </Text>
        </Card>

        {/* Claims List */}
        <Text style={styles.sectionTitle}>Your Claims</Text>

        {loading ? (
          [0, 1, 2].map((i) => <CardSkeleton key={i} />)
        ) : claims.length === 0 ? (
          <Card style={{ borderRadius: 16, padding: 6 }}>
            <EmptyState
              icon="file-document-outline"
              title="No Claims Yet"
              sub="File a compensation claim if your crops were damaged by flood, drought, hail or other natural calamities."
              actionLabel="File First Claim"
              onAction={() => navigation.navigate('NewClaimStep1')}
            />
          </Card>
        ) : (
          claims.map((claim) => {
            const s = STATUS_MAP[claim.status] || { label: claim.status.toUpperCase(), bg: '#EAEDFF', fg: '#131B2E' };
            return (
              <TouchableOpacity
                key={claim.id}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('ClaimDetail', { claimId: claim.id })}
              >
                <Card style={{ borderRadius: 14, padding: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: C.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name="sprout" size={20} color={C.primary} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontSize: 13.5, fontWeight: '800', color: C.onSurface }}>{claim.crop}</Text>
                      <Text style={{ fontSize: 11, color: C.onSurfaceVariant }}>{claim.claim_number}</Text>
                    </View>
                    <Chip label={s.label} bg={s.bg} fg={s.fg} size={9} />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
                    <InfoPill icon="weather-lightning-rainy" label={claim.damage_type.replace(/_/g, ' ')} />
                    <InfoPill icon="calendar" label={claim.incident_date} />
                    <InfoPill icon="ruler-square" label={`${claim.affected_area_acres} ac`} />
                  </View>
                  {claim.approved_amount && (
                    <View style={{ marginTop: 8, backgroundColor: '#E6F4EA', borderRadius: 8, padding: 8 }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#1B5E20' }}>
                        Approved Amount: Rs. {Number(claim.approved_amount).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, value, label, color, iconFg }) {
  return (
    <Card style={{ flex: 1, borderRadius: 14, padding: 12, gap: 6, backgroundColor: color }}>
      <MaterialCommunityIcons name={icon} size={20} color={iconFg} />
      <Text style={{ fontSize: 22, fontWeight: '800', color: '#131B2E' }}>{value}</Text>
      <Text style={{ fontSize: 10, fontWeight: '700', color: '#404941' }}>{label}</Text>
    </Card>
  );
}

function InfoPill({ icon, label }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <MaterialCommunityIcons name={icon} size={12} color={C.outline} />
      <Text style={{ fontSize: 11, color: C.onSurfaceVariant, textTransform: 'capitalize' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.surfaceContainerHighest },
  back: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '800', color: C.onSurface },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: C.primary, textTransform: 'uppercase' },
});
