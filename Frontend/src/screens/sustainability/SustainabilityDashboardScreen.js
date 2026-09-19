import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { farmer as C } from '../../theme/colors';
import { Card, Button, EmptyState, CardSkeleton, Chip, Bar } from '../../components/ui';
import * as sustainabilityService from '../../services/sustainabilityService';

const STATUS_MAP = {
  draft: { label: 'DRAFT', bg: '#DAE2FD', fg: '#003491' },
  submitted: { label: 'SUBMITTED', bg: '#FFDCC3', fg: '#2F1500' },
  under_review: { label: 'UNDER REVIEW', bg: '#FFDCC3', fg: '#2F1500' },
  additional_evidence_required: { label: 'MORE EVIDENCE', bg: '#FFDAD6', fg: '#93000A' },
  verified: { label: 'VERIFIED', bg: '#AFF2C2', fg: '#00210F' },
  rejected: { label: 'REJECTED', bg: '#FFDAD6', fg: '#93000A' },
  expired: { label: 'EXPIRED', bg: '#EAEDFF', fg: '#131B2E' },
};

const BENEFIT_ICONS = {
  procurement_priority: 'podium-gold',
  premium_rate: 'currency-inr',
  scheme_assistance: 'handshake',
};

export default function SustainabilityDashboardScreen({ navigation }) {
  const [data, setData] = useState({ submissions: [], totalScore: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await sustainabilityService.getProfile();
      setData(res);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const { submissions, totalScore } = data;
  const maxScore = 225; // sum of all demo goals
  const scorePct = Math.min(100, (totalScore / maxScore) * 100);

  const verifiedCount = submissions.filter((s) => s.status === 'verified').length;
  const pendingCount = submissions.filter((s) => ['submitted', 'under_review'].includes(s.status)).length;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={C.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sustainable Farming</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      >
        {/* Score Card */}
        <Card style={{ borderRadius: 16, padding: 16, gap: 10, backgroundColor: C.primaryContainer }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons name="leaf-circle" size={22} color={C.primaryFixed} />
            <Text style={{ fontSize: 13, fontWeight: '800', color: C.primaryFixed, flex: 1 }}>Green Farming Score</Text>
            <Chip label={`${totalScore} pts`} bg="rgba(255,255,255,0.2)" fg="#fff" size={11} bold />
          </View>
          <Bar pct={scorePct} fill={C.primaryFixed} track="rgba(255,255,255,0.2)" height={8} />
          <Text style={{ fontSize: 11, color: '#94D5A8' }}>{totalScore} / {maxScore} pts — {verifiedCount} goal{verifiedCount !== 1 ? 's' : ''} verified</Text>
        </Card>

        {/* Stats Row */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatCard icon="check-decagram" value={verifiedCount} label="Verified" color="#AFF2C2" iconFg={C.primary} />
          <StatCard icon="clock-outline" value={pendingCount} label="Under Review" color={C.secondaryFixed} iconFg={C.secondary} />
          <StatCard icon="format-list-bulleted" value={submissions.length} label="Total" color={C.tertiaryFixed} iconFg={C.tertiary} />
        </View>

        {/* Browse Goals CTA */}
        <Button
          title="Browse Sustainability Goals"
          icon="sprout"
          variant="secondary"
          onPress={() => navigation.navigate('GoalList')}
        />

        {/* My Submissions */}
        <Text style={styles.sectionTitle}>My Submissions</Text>

        {loading ? (
          [0, 1].map((i) => <CardSkeleton key={i} />)
        ) : submissions.length === 0 ? (
          <Card style={{ borderRadius: 16, padding: 6 }}>
            <EmptyState
              icon="leaf-circle-outline"
              title="No Submissions Yet"
              sub="Apply for sustainability goals to earn scores and unlock farming benefits."
              actionLabel="See Goals"
              onAction={() => navigation.navigate('GoalList')}
            />
          </Card>
        ) : (
          submissions.map((sub) => {
            const sm = STATUS_MAP[sub.status] || { label: sub.status.toUpperCase(), bg: '#EAEDFF', fg: '#131B2E' };
            const goal = sub.sustainability_goals;
            const benefitIcon = goal ? (BENEFIT_ICONS[goal.benefit_type] || 'star') : 'star';
            return (
              <TouchableOpacity
                key={sub.id}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('SubmissionDetail', { submissionId: sub.id })}
              >
                <Card style={{ borderRadius: 14, padding: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#E6F4EA', alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name={benefitIcon} size={20} color={C.primary} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontSize: 13.5, fontWeight: '800', color: C.onSurface }}>{goal?.title || 'Unknown Goal'}</Text>
                      <Text style={{ fontSize: 11, color: C.onSurfaceVariant }}>{sub.submitted_at?.slice(0, 10) || sub.created_at?.slice(0, 10)}</Text>
                    </View>
                    <Chip label={sm.label} bg={sm.bg} fg={sm.fg} size={9} />
                  </View>
                  {sub.status === 'verified' && sub.score_awarded > 0 && (
                    <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E6F4EA', borderRadius: 8, padding: 8 }}>
                      <MaterialCommunityIcons name="star-circle" size={16} color="#1B5E20" />
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#1B5E20' }}>Score Awarded: {sub.score_awarded} pts</Text>
                    </View>
                  )}
                  {sub.status === 'additional_evidence_required' && (
                    <View style={{ marginTop: 8, backgroundColor: '#FFDAD6', borderRadius: 8, padding: 8 }}>
                      <Text style={{ fontSize: 11, color: '#93000A', fontWeight: '700' }}>Additional evidence required — tap to upload more</Text>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.surfaceContainerHighest },
  back: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '800', color: C.onSurface },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: C.primary, textTransform: 'uppercase' },
});
