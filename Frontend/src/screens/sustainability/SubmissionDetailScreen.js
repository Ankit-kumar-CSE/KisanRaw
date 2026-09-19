import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { farmer as C } from '../../theme/colors';
import { Card, Button, Chip, EmptyState } from '../../components/ui';
import * as sustainabilityService from '../../services/sustainabilityService';

const STATUS_MAP = {
  draft: { label: 'DRAFT', bg: '#DAE2FD', fg: '#003491' },
  submitted: { label: 'SUBMITTED', bg: '#FFDCC3', fg: '#2F1500' },
  under_review: { label: 'UNDER REVIEW', bg: '#FFDCC3', fg: '#2F1500' },
  additional_evidence_required: { label: 'MORE EVIDENCE', bg: '#FFDAD6', fg: '#93000A' },
  verified: { label: 'VERIFIED', bg: '#AFF2C2', fg: '#00210F' },
  rejected: { label: 'REJECTED', bg: '#FFDAD6', fg: '#93000A' },
};

export default function SubmissionDetailScreen({ navigation, route }) {
  const { submissionId } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await sustainabilityService.getSubmission(submissionId);
      setData(res);
    } catch (_) {}
    finally { setLoading(false); }
  }, [submissionId]);

  useEffect(() => { load(); }, [load]);

  const canUpload = data && ['draft', 'additional_evidence_required'].includes(data.submission.status);
  const canSubmit = canUpload && data.evidence.length > 0;

  const uploadFile = async (asset) => {
    setUploading(true);
    try {
      const { signedUrl, filePath } = await sustainabilityService.getUploadUrl(submissionId, {
        fileName: asset.name || asset.fileName || `evidence_${Date.now()}.jpg`,
        fileType: asset.mimeType || asset.type || 'image/jpeg',
        fileSizeBytes: asset.fileSize || asset.size || 0,
      });

      await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': asset.mimeType || 'image/jpeg' },
        body: await (await fetch(asset.uri)).blob(),
      });

      await sustainabilityService.addEvidence(submissionId, {
        fileName: asset.name || asset.fileName || `evidence_${Date.now()}.jpg`,
        fileType: asset.mimeType || asset.type || 'image/jpeg',
        fileSizeBytes: asset.fileSize || asset.size || 0,
        filePath,
      });

      await load();
    } catch (e) {
      Alert.alert('Upload Failed', e.message);
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!res.canceled && res.assets.length > 0) await uploadFile(res.assets[0]);
  };

  const pickDocument = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true });
    if (!res.canceled && res.assets.length > 0) await uploadFile(res.assets[0]);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await sustainabilityService.submitSubmission(submissionId);
      await load();
    } catch (e) {
      Alert.alert('Submission Failed', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !data) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <Header navigation={navigation} title="Submission" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const { submission, evidence } = data;
  const goal = submission.sustainability_goals;
  const sm = STATUS_MAP[submission.status] || { label: submission.status.toUpperCase(), bg: '#EAEDFF', fg: '#131B2E' };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Header navigation={navigation} title={goal?.title || 'Submission'} statusChip={<Chip label={sm.label} bg={sm.bg} fg={sm.fg} size={9} />} />

      <ScrollView contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: 120 }}>
        {/* Score/Benefit on verify */}
        {submission.status === 'verified' && (
          <Card style={{ borderRadius: 14, padding: 14, gap: 6, backgroundColor: '#E6F4EA', borderLeftWidth: 4, borderLeftColor: '#2E7D32' }}>
            <Text style={{ fontSize: 12, color: '#2E7D32', fontWeight: '700' }}>Submission Verified</Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#1B5E20' }}>{submission.score_awarded} pts earned</Text>
            {submission.benefit_awarded && (
              <Text style={{ fontSize: 12, color: '#2E7D32' }}>{submission.benefit_awarded}</Text>
            )}
          </Card>
        )}

        {/* More evidence needed */}
        {submission.status === 'additional_evidence_required' && submission.notes && (
          <Card style={{ borderRadius: 14, padding: 14, gap: 6, backgroundColor: '#FFDAD6', borderLeftWidth: 4, borderLeftColor: '#BA1A1A' }}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <MaterialCommunityIcons name="alert-circle" size={17} color="#BA1A1A" />
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#93000A' }}>Additional Evidence Required</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#410002', lineHeight: 17 }}>{submission.notes}</Text>
          </Card>
        )}

        {/* Goal Info */}
        {goal && (
          <Card style={{ borderRadius: 14, padding: 14, gap: 8 }}>
            <Text style={styles.sec}>About This Goal</Text>
            <Text style={{ fontSize: 13, fontWeight: '800', color: C.onSurface }}>{goal.title}</Text>
            <Text style={{ fontSize: 12, color: C.onSurfaceVariant, lineHeight: 17 }}>{goal.description}</Text>
            <View style={{ height: 1, backgroundColor: C.surfaceContainerHighest }} />
            <Text style={styles.sec}>Criteria</Text>
            <Text style={{ fontSize: 12, color: C.onSurfaceVariant, lineHeight: 17 }}>{goal.criteria}</Text>
            {goal.required_evidence && (
              <>
                <Text style={styles.sec}>Required Evidence</Text>
                <Text style={{ fontSize: 12, color: C.onSurface, lineHeight: 17 }}>{goal.required_evidence}</Text>
              </>
            )}
            {goal.score_points > 0 && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primaryFixed, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <MaterialCommunityIcons name="star" size={13} color="#004625" />
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#00210F' }}>{goal.score_points} pts</Text>
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Evidence Files */}
        <Card style={{ borderRadius: 14, padding: 14, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.sec}>Evidence</Text>
            <Chip label={`${evidence.length} files`} bg={C.surfaceContainerLow} fg={C.onSurfaceVariant} size={10} />
          </View>

          {evidence.length === 0 ? (
            <Text style={{ fontSize: 12, color: C.outline }}>No evidence uploaded yet.</Text>
          ) : (
            evidence.map((ev) => (
              <View key={ev.id} style={styles.evRow}>
                <MaterialCommunityIcons name={ev.file_type === 'application/pdf' ? 'file-pdf-box' : 'image'} size={22} color={C.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: C.onSurface }} numberOfLines={1}>{ev.file_name}</Text>
                  <Text style={{ fontSize: 10, color: C.outline }}>{ev.uploaded_at?.slice(0, 10)}</Text>
                </View>
                <Chip
                  label={ev.verification_status === 'pending' ? 'PENDING' : 'VERIFIED'}
                  bg={ev.verification_status === 'pending' ? '#EAEDFF' : '#AFF2C2'}
                  fg={ev.verification_status === 'pending' ? '#003491' : '#00210F'}
                  size={9}
                />
              </View>
            ))
          )}

          {canUpload && (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <TouchableOpacity onPress={pickImage} style={styles.uploadBtn} disabled={uploading}>
                {uploading
                  ? <ActivityIndicator size="small" color={C.primary} />
                  : <><MaterialCommunityIcons name="camera" size={16} color={C.primary} /><Text style={styles.uploadBtnText}>Photo</Text></>}
              </TouchableOpacity>
              <TouchableOpacity onPress={pickDocument} style={styles.uploadBtn} disabled={uploading}>
                {uploading
                  ? <ActivityIndicator size="small" color={C.primary} />
                  : <><MaterialCommunityIcons name="file-upload" size={16} color={C.primary} /><Text style={styles.uploadBtnText}>File</Text></>}
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* Submission details */}
        <Card style={{ borderRadius: 14, padding: 14, gap: 6 }}>
          <Text style={styles.sec}>Details</Text>
          <DetailRow label="Status" value={submission.status.replace(/_/g, ' ')} />
          {submission.submitted_at && <DetailRow label="Submitted" value={submission.submitted_at.slice(0, 10)} />}
          {submission.reviewed_at && <DetailRow label="Reviewed" value={submission.reviewed_at.slice(0, 10)} />}
        </Card>
      </ScrollView>

      {/* Footer action */}
      {canSubmit && (
        <View style={styles.footer}>
          <Button
            title="Submit for Review"
            icon="send"
            onPress={submit}
            loading={submitting}
            disabled={submitting}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

function Header({ navigation, title, statusChip }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <MaterialCommunityIcons name="arrow-left" size={22} color={C.onSurface} />
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      {statusChip || <View style={{ width: 38 }} />}
    </View>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 12, color: C.onSurfaceVariant, width: 90 }}>{label}</Text>
      <Text style={{ fontSize: 12, fontWeight: '700', color: C.onSurface, flex: 1, textTransform: 'capitalize' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.surfaceContainerHighest, gap: 8 },
  back: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 14, fontWeight: '800', color: C.onSurface },
  sec: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: C.primary, textTransform: 'uppercase' },
  evRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.surfaceContainerHighest },
  uploadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: C.primary, borderRadius: 10, paddingVertical: 10, backgroundColor: '#fff' },
  uploadBtnText: { fontSize: 12, fontWeight: '800', color: C.primary },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.surfaceContainerHighest },
});
