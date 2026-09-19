import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { farmer as C } from '../../theme/colors';
import { Card, Button, EmptyState, CardSkeleton } from '../../components/ui';
import * as sustainabilityService from '../../services/sustainabilityService';

const BENEFIT_ICONS = {
  procurement_priority: 'podium-gold',
  premium_rate: 'currency-inr',
  scheme_assistance: 'handshake',
};

export default function GoalListScreen({ navigation }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await sustainabilityService.getGoals();
      setGoals(list);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={C.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sustainability Goals</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.primary} />}
      >
        {/* Banner */}
        <Card style={{ borderRadius: 14, padding: 14, gap: 6, backgroundColor: '#E6F4EA' }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <MaterialCommunityIcons name="leaf" size={18} color="#2E7D32" />
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#1B5E20' }}>Earn Rewards for Green Farming</Text>
          </View>
          <Text style={{ fontSize: 11.5, color: '#2E7D32', lineHeight: 17 }}>
            Apply for goals, upload evidence, and earn scores. Scores unlock procurement priority and rate benefits.
          </Text>
        </Card>

        {loading ? (
          [0, 1, 2].map((i) => <CardSkeleton key={i} />)
        ) : goals.length === 0 ? (
          <EmptyState icon="sprout-outline" title="No Goals Available" sub="Check back later for new sustainability goals." />
        ) : (
          goals.map((goal) => {
            const benefitIcon = BENEFIT_ICONS[goal.benefit_type] || 'star-circle';
            return (
              <TouchableOpacity
                key={goal.id}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('GoalDetail', { goalId: goal.id })}
              >
                <Card style={{ borderRadius: 14, padding: 14, gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: '#E6F4EA', alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name={benefitIcon} size={22} color="#2E7D32" />
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: C.onSurface }}>{goal.title}</Text>
                      <Text style={{ fontSize: 11.5, color: C.onSurfaceVariant, lineHeight: 17 }}>{goal.description}</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {goal.score_points > 0 && (
                      <View style={styles.tag}>
                        <MaterialCommunityIcons name="star" size={12} color="#004625" />
                        <Text style={styles.tagText}>{goal.score_points} pts</Text>
                      </View>
                    )}
                    {goal.benefit_description && (
                      <View style={[styles.tag, { backgroundColor: C.secondaryFixed }]}>
                        <MaterialCommunityIcons name="gift" size={12} color={C.secondary} />
                        <Text style={[styles.tagText, { color: '#2F1500' }]}>{goal.benefit_description.slice(0, 40)}...</Text>
                      </View>
                    )}
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: C.primary }}>Apply Now</Text>
                    <MaterialCommunityIcons name="arrow-right" size={16} color={C.primary} />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.surfaceContainerHighest },
  back: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '800', color: C.onSurface },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primaryFixed, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 10, fontWeight: '700', color: '#00210F' },
});
