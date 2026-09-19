import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { farmer as C } from '../../theme/colors';
import { Card, Button, CardSkeleton } from '../../components/ui';
import * as sustainabilityService from '../../services/sustainabilityService';

export default function GoalDetailScreen({ navigation, route }) {
  const { goalId } = route.params;
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await sustainabilityService.getGoals();
      setGoals(list);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const goal = goals.find((g) => g.id === goalId);

  const apply = async () => {
    setApplying(true);
    try {
      const { submission } = await sustainabilityService.createSubmission(goalId);
      navigation.replace('SubmissionDetail', { submissionId: submission.id });
    } catch (e) {
      if (e.message === 'submission_already_active') {
        Alert.alert('Already Applied', 'You already have an active submission for this goal.');
      } else {
        Alert.alert('Error', e.message || 'Could not apply. Please try again.');
      }
    } finally {
      setApplying(false);
    }
  };

  const BENEFIT_ICONS = {
    procurement_priority: { icon: 'podium-gold', label: 'Procurement Priority', color: '#E65100' },
    premium_rate: { icon: 'currency-inr', label: 'Premium MSP Rate', color: '#1B5E20' },
    scheme_assistance: { icon: 'handshake', label: 'Govt. Scheme Assistance', color: '#1A237E' },
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={C.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Goal Details</Text>
          <View style={{ width: 38 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }}>
          {[0, 1].map((i) => <CardSkeleton key={i} />)}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!goal) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={C.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Goal Not Found</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: C.outline }}>Goal not found or no longer active.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const bi = BENEFIT_ICONS[goal.benefit_type] || { icon: 'star', label: 'Benefit', color: C.primary };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={C.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{goal.title}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: 120 }}>
        {/* Hero */}
        <Card style={{ borderRadius: 16, padding: 18, gap: 10, backgroundColor: '#E6F4EA' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#C8E6C9', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name={bi.icon} size={28} color="#2E7D32" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#1B5E20' }}>{goal.title}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                {goal.score_points > 0 && (
                  <View style={styles.tag}>
                    <MaterialCommunityIcons name="star" size={11} color="#004625" />
                    <Text style={styles.tagText}>{goal.score_points} pts</Text>
                  </View>
                )}
                <View style={[styles.tag, { backgroundColor: '#C8E6C9' }]}>
                  <MaterialCommunityIcons name={bi.icon} size={11} color="#2E7D32" />
                  <Text style={[styles.tagText, { color: '#1B5E20' }]}>{bi.label}</Text>
                </View>
              </View>
            </View>
          </View>
          <Text style={{ fontSize: 12.5, color: '#2E7D32', lineHeight: 18 }}>{goal.description}</Text>
        </Card>

        {/* Criteria */}
        <Card style={{ borderRadius: 14, padding: 14, gap: 8 }}>
          <Text style={styles.sec}>Eligibility Criteria</Text>
          <Text style={{ fontSize: 13, color: C.onSurface, lineHeight: 20 }}>{goal.criteria}</Text>
        </Card>

        {/* Required Evidence */}
        {goal.required_evidence && (
          <Card style={{ borderRadius: 14, padding: 14, gap: 8 }}>
            <Text style={styles.sec}>Required Evidence</Text>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
              <MaterialCommunityIcons name="file-check" size={18} color="#1B5E20" style={{ marginTop: 1 }} />
              <Text style={{ fontSize: 12.5, color: C.onSurface, lineHeight: 19, flex: 1 }}>{goal.required_evidence}</Text>
            </View>
          </Card>
        )}

        {/* Optional Evidence */}
        {goal.optional_evidence && (
          <Card style={{ borderRadius: 14, padding: 14, gap: 8 }}>
            <Text style={styles.sec}>Optional Evidence</Text>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
              <MaterialCommunityIcons name="file-plus-outline" size={18} color={C.outline} style={{ marginTop: 1 }} />
              <Text style={{ fontSize: 12.5, color: C.onSurfaceVariant, lineHeight: 19, flex: 1 }}>{goal.optional_evidence}</Text>
            </View>
          </Card>
        )}

        {/* Benefit */}
        {goal.benefit_description && (
          <Card style={{ borderRadius: 14, padding: 14, gap: 8, backgroundColor: C.tertiaryFixed }}>
            <Text style={[styles.sec, { color: C.tertiary }]}>Benefit on Verification</Text>
            <Text style={{ fontSize: 13, color: '#1a237e', lineHeight: 19 }}>{goal.benefit_description}</Text>
          </Card>
        )}

        {/* How to Apply */}
        <Card style={{ borderRadius: 14, padding: 14, gap: 8 }}>
          <Text style={styles.sec}>How to Apply</Text>
          {[
            { n: 1, t: 'Tap Apply Now below to start a new submission' },
            { n: 2, t: 'Upload required evidence (photos, certificates, invoices)' },
            { n: 3, t: 'Submit for admin review' },
            { n: 4, t: 'Score & benefits credited on verification' },
          ].map((s) => (
            <View key={s.n} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 4 }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: C.primaryFixed, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#004625' }}>{s.n}</Text>
              </View>
              <Text style={{ fontSize: 12.5, color: C.onSurface, flex: 1, lineHeight: 19 }}>{s.t}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Apply Now"
          icon="check-circle"
          onPress={apply}
          loading={applying}
          disabled={applying}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.surfaceContainerHighest },
  back: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 14, fontWeight: '800', color: C.onSurface },
  sec: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: C.primary, textTransform: 'uppercase' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primaryFixed, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 10, fontWeight: '700', color: '#00210F' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.surfaceContainerHighest },
});
