import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { farmer as C } from '../../theme/colors';
import { Card, Chip, TimelineRow, CardSkeleton, Button } from '../../components/ui';
import * as compensationService from '../../services/compensationService';

const STATUS_MAP = {
  draft: { label: 'DRAFT', bg: '#DAE2FD', fg: '#003491', step: 0 },
  submitted: { label: 'SUBMITTED', bg: '#FFDCC3', fg: '#2F1500', step: 1 },
  document_verification: { label: 'DOC REVIEW', bg: '#FFDCC3', fg: '#2F1500', step: 2 },
  info_required: { label: 'INFO NEEDED', bg: '#FFDAD6', fg: '#93000A', step: 2 },
  field_verification: { label: 'FIELD CHECK', bg: '#FFDCC3', fg: '#2F1500', step: 3 },
  assessment: { label: 'ASSESSMENT', bg: '#FFDCC3', fg: '#2F1500', step: 4 },
  approved: { label: 'APPROVED', bg: '#AFF2C2', fg: '#00210F', step: 5 },
  partially_approved: { label: 'PARTIAL', bg: '#AFF2C2', fg: '#00210F', step: 5 },
  rejected: { label: 'REJECTED', bg: '#FFDAD6', fg: '#93000A', step: -1 },
  payment_processing: { label: 'PAYMENT', bg: '#DBE1FF', fg: '#003491', step: 6 },
  paid: { label: 'PAID', bg: '#AFF2C2', fg: '#00210F', step: 7 },
};

const TIMELINE_STEPS = [
  'Draft Created',
  'Submitted for Review',
  'Document Verification',
  'Field Verification',
  'Assessment',
  'Approved',
  'Payment Processing',
  'Paid',
];

function stepState(claimStep, index) {
  if (claimStep < 0) return index === 0 ? 'done' : 'pending'; // rejected path
  if (index < claimStep) return 'done';
  if (index === claimStep) return 'current';
  return 'pending';
}

export default function ClaimDetailScreen({ navigation, route }) {
  const { claimId } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await compensationService.getClaim(claimId);
      setData(res);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, [claimId]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={C.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Claim Detail</Text>
          <View style={{ width: 38 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }}>
          {[0, 1, 2].map((i) => <CardSkeleton key={i} />)}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!data) return null;

  const { claim, documents, statusHistory } = data;
  const sm = STATUS_MAP[claim.status] || { label: claim.status.toUpperCase(), bg: '#EAEDFF', fg: '#131B2E', step: 0 };
  const currentStep = sm.step;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={C.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{claim.claim_number}</Text>
        <Chip label={sm.label} bg={sm.bg} fg={sm.fg} size={9} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      >
        {/* Info Needed Alert */}
        {claim.status === 'info_required' && claim.admin_notes && (
          <Card style={{ borderRadius: 14, padding: 14, gap: 6, backgroundColor: '#FFDAD6', borderLeftWidth: 4, borderLeftColor: '#BA1A1A' }}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <MaterialCommunityIcons name="alert-circle" size={17} color="#BA1A1A" />
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#93000A' }}>Additional Information Needed</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#410002', lineHeight: 17 }}>{claim.admin_notes}</Text>
          </Card>
        )}

        {/* Approved Amount */}
        {claim.approved_amount && (
          <Card style={{ borderRadius: 14, padding: 14, backgroundColor: '#E6F4EA', borderLeftWidth: 4, borderLeftColor: '#2E7D32' }}>
            <Text style={{ fontSize: 12, color: '#2E7D32', fontWeight: '700' }}>Approved Compensation</Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#1B5E20' }}>
              Rs. {Number(claim.approved_amount).toLocaleString('en-IN')}
            </Text>
          </Card>
        )}

        {/* Claim Summary */}
        <Card style={{ borderRadius: 14, padding: 14, gap: 10 }}>
          <Text style={styles.sec}>Claim Details</Text>
          <DetailRow label="Crop" value={`${claim.crop}${claim.crop_variety ? ` (${claim.crop_variety})` : ''}`} />
          <DetailRow label="Damage Type" value={claim.damage_type.replace(/_/g, ' ')} />
          {claim.other_damage_type && <DetailRow label="Specify" value={claim.other_damage_type} />}
          <DetailRow label="Incident Date" value={claim.incident_date} />
          <DetailRow label="Affected Area" value={`${claim.affected_area_acres} acres`} />
          {claim.cultivated_area_acres && <DetailRow label="Cultivated Area" value={`${claim.cultivated_area_acres} acres`} />}
          {claim.damage_pct && <DetailRow label="Damage %" value={`${claim.damage_pct}%`} />}
          {claim.estimated_loss_qtl && <DetailRow label="Est. Loss" value={`${claim.estimated_loss_qtl} Qtl`} />}
          {claim.description && <DetailRow label="Description" value={claim.description} />}
        </Card>

        {/* Location */}
        {(claim.village || claim.district) && (
          <Card style={{ borderRadius: 14, padding: 14, gap: 8 }}>
            <Text style={styles.sec}>Location</Text>
            {claim.village && <DetailRow label="Village" value={claim.village} />}
            {claim.district && <DetailRow label="District" value={claim.district} />}
            {claim.state && <DetailRow label="State" value={claim.state} />}
          </Card>
        )}

        {/* Documents */}
        <Card style={{ borderRadius: 14, padding: 14, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.sec}>Documents</Text>
            <Chip label={`${documents.length} files`} bg={C.surfaceContainerLow} fg={C.onSurfaceVariant} size={10} />
          </View>
          {documents.length === 0 ? (
            <Text style={{ fontSize: 12, color: C.outline }}>No documents uploaded yet.</Text>
          ) : (
            documents.map((doc) => (
              <View key={doc.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderTopWidth: 1, borderTopColor: C.surfaceContainerHighest }}>
                <MaterialCommunityIcons name={doc.file_type === 'application/pdf' ? 'file-pdf-box' : 'image'} size={22} color={C.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: C.onSurface }} numberOfLines={1}>{doc.file_name}</Text>
                  <Text style={{ fontSize: 10, color: C.outline }}>{doc.uploaded_at?.slice(0, 10)}</Text>
                </View>
              </View>
            ))
          )}
          {claim.status === 'draft' || claim.status === 'info_required' ? (
            <Button
              title="Upload Document"
              icon="upload"
              variant="secondary"
              onPress={() => navigation.navigate('ClaimDetail', { claimId: claim.id })}
            />
          ) : null}
        </Card>

        {/* Status Timeline */}
        <Card style={{ borderRadius: 14, padding: 14, gap: 6 }}>
          <Text style={[styles.sec, { marginBottom: 8 }]}>Status Timeline</Text>
          {claim.status === 'rejected' ? (
            <>
              <TimelineRow label="Claim Submitted" state="done" />
              <TimelineRow label={`Rejected: ${claim.admin_notes || 'See admin notes'}`} state="current" />
            </>
          ) : (
            TIMELINE_STEPS.map((step, i) => (
              <TimelineRow key={step} label={step} state={stepState(currentStep, i)} />
            ))
          )}
        </Card>

        {/* Status History */}
        {statusHistory.length > 0 && (
          <Card style={{ borderRadius: 14, padding: 14, gap: 6 }}>
            <Text style={styles.sec}>Activity Log</Text>
            {statusHistory.map((h, i) => (
              <View key={i} style={{ paddingVertical: 6, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: C.surfaceContainerHighest }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: C.onSurface }}>
                  {h.from_status ? `${h.from_status} → ${h.to_status}` : h.to_status}
                </Text>
                {h.notes && <Text style={{ fontSize: 11, color: C.onSurfaceVariant, marginTop: 2 }}>{h.notes}</Text>}
                <Text style={{ fontSize: 10, color: C.outline, marginTop: 2 }}>{h.created_at?.slice(0, 16).replace('T', ' ')}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Submit CTA */}
        {claim.status === 'draft' && (
          <Button
            title="Submit Claim for Review"
            onPress={async () => {
              try {
                await compensationService.submitClaim(claim.id);
                await load();
              } catch (e) {
                alert(e.message);
              }
            }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 12, color: C.onSurfaceVariant, width: 110 }}>{label}</Text>
      <Text style={{ fontSize: 12, fontWeight: '700', color: C.onSurface, flex: 1 }}>{String(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.surfaceContainerHighest, gap: 8 },
  back: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 14, fontWeight: '800', color: C.onSurface },
  sec: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: C.primary, textTransform: 'uppercase' },
});
