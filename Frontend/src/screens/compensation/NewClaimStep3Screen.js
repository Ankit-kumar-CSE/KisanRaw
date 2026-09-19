import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { farmer as C } from '../../theme/colors';
import { Card, Button, Chip } from '../../components/ui';
import { StepBar } from './NewClaimStep1Screen';
import * as compensationService from '../../services/compensationService';

const MAX_DOCS = 5;

export default function NewClaimStep3Screen({ navigation, route }) {
  const { draft } = route.params;
  const [docs, setDocs] = useState([]);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    if (docs.length >= MAX_DOCS) { Alert.alert('Limit reached', `You can upload up to ${MAX_DOCS} documents.`); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!res.canceled && res.assets.length > 0) {
      const a = res.assets[0];
      setDocs((prev) => [...prev, { uri: a.uri, name: a.fileName || `photo_${Date.now()}.jpg`, type: a.mimeType || 'image/jpeg', size: a.fileSize || 0 }]);
    }
  };

  const pickDocument = async () => {
    if (docs.length >= MAX_DOCS) { Alert.alert('Limit reached', `You can upload up to ${MAX_DOCS} documents.`); return; }
    const res = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true });
    if (!res.canceled && res.assets.length > 0) {
      const a = res.assets[0];
      setDocs((prev) => [...prev, { uri: a.uri, name: a.name, type: a.mimeType || 'application/pdf', size: a.size || 0 }]);
    }
  };

  const removeDoc = (idx) => setDocs((prev) => prev.filter((_, i) => i !== idx));

  const createAndUpload = async () => {
    setCreating(true);
    try {
      // 1. Create the claim
      const { claim } = await compensationService.createClaim(draft);

      // 2. Upload each document
      if (docs.length > 0) {
        setUploading(true);
        for (const doc of docs) {
          const { signedUrl, filePath } = await compensationService.getUploadUrl(claim.id, {
            fileName: doc.name,
            fileType: doc.type,
            fileSizeBytes: doc.size,
          });

          // PUT directly to Supabase Storage signed URL
          await fetch(signedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': doc.type },
            body: await (await fetch(doc.uri)).blob(),
          });

          // Record metadata on backend
          await compensationService.addDocument(claim.id, {
            fileName: doc.name,
            fileType: doc.type,
            fileSizeBytes: doc.size,
            filePath,
          });
        }
      }

      navigation.replace('ClaimSuccess', { claimNumber: claim.claim_number, claimId: claim.id });
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not create claim. Please try again.');
    } finally {
      setCreating(false);
      setUploading(false);
    }
  };

  const isLoading = creating || uploading;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={C.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Claim — Step 3 of 3</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, gap: 14, paddingBottom: 120 }}>
        <StepBar step={3} />

        {/* Guidance */}
        <Card style={{ borderRadius: 14, padding: 14, gap: 6, backgroundColor: C.tertiaryFixed }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <MaterialCommunityIcons name="information-outline" size={17} color={C.tertiary} />
            <Text style={{ fontSize: 12, fontWeight: '800', color: C.tertiary }}>Required Documents</Text>
          </View>
          <Text style={{ fontSize: 11.5, color: '#1a237e', lineHeight: 17 }}>
            Upload clear photos of the damaged crop, field photos, and optionally land records or Aadhaar. Max 5 files, 10 MB each.
          </Text>
        </Card>

        {/* Upload Buttons */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={pickImage} style={styles.uploadBtn} disabled={isLoading}>
            <MaterialCommunityIcons name="camera" size={22} color={C.primary} />
            <Text style={styles.uploadBtnText}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickDocument} style={styles.uploadBtn} disabled={isLoading}>
            <MaterialCommunityIcons name="file-upload" size={22} color={C.primary} />
            <Text style={styles.uploadBtnText}>File / PDF</Text>
          </TouchableOpacity>
        </View>

        {/* Queued Docs */}
        {docs.length > 0 && (
          <Card style={{ borderRadius: 14, padding: 14, gap: 6 }}>
            <Text style={styles.sectionTitle}>Files to Upload ({docs.length}/{MAX_DOCS})</Text>
            {docs.map((doc, i) => (
              <View key={i} style={styles.docRow}>
                <MaterialCommunityIcons name={doc.type === 'application/pdf' ? 'file-pdf-box' : 'image'} size={22} color={C.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: C.onSurface }} numberOfLines={1}>{doc.name}</Text>
                  <Text style={{ fontSize: 10, color: C.outline }}>{(doc.size / 1024).toFixed(1)} KB</Text>
                </View>
                <TouchableOpacity onPress={() => removeDoc(i)} disabled={isLoading}>
                  <MaterialCommunityIcons name="close-circle" size={20} color="#BA1A1A" />
                </TouchableOpacity>
              </View>
            ))}
          </Card>
        )}

        {/* Summary */}
        <Card style={{ borderRadius: 14, padding: 14, gap: 6 }}>
          <Text style={styles.sectionTitle}>Claim Summary</Text>
          <SumRow label="Crop" value={draft.crop} />
          <SumRow label="Damage" value={draft.damageType} />
          <SumRow label="Incident" value={draft.incidentDate} />
          <SumRow label="Affected Area" value={`${draft.affectedAreaAcres} acres`} />
          {draft.estimatedLossQtl && <SumRow label="Est. Loss" value={`${draft.estimatedLossQtl} Qtl`} />}
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={C.primary} />
            <Text style={{ fontSize: 13, color: C.primary, fontWeight: '700' }}>
              {uploading ? 'Uploading documents...' : 'Creating claim...'}
            </Text>
          </View>
        ) : (
          <Button title="Create Claim" icon="check-circle" onPress={createAndUpload} />
        )}
      </View>
    </SafeAreaView>
  );
}

function SumRow({ label, value }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 3, borderTopWidth: 0.5, borderTopColor: C.surfaceContainerHighest }}>
      <Text style={{ fontSize: 11.5, color: C.onSurfaceVariant, width: 100 }}>{label}</Text>
      <Text style={{ fontSize: 11.5, fontWeight: '700', color: C.onSurface, flex: 1, textTransform: 'capitalize' }}>{String(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.surfaceContainerHighest },
  back: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '800', color: C.onSurface },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: C.primary, textTransform: 'uppercase', marginBottom: 4 },
  uploadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: C.primary, borderRadius: 12, paddingVertical: 14, backgroundColor: '#fff' },
  uploadBtnText: { fontSize: 13, fontWeight: '800', color: C.primary },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.surfaceContainerHighest },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.surfaceContainerHighest },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14 },
});
