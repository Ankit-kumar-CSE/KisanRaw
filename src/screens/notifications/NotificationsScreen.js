import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { farmer as C } from '../../theme/colors';
import { useLang } from '../../i18n';
import { useStore } from '../../store/AppStore';
import { Card, EmptyState, Segmented } from '../../components/ui';
import { useState } from 'react';

const CAT_META = {
  booking: { icon: 'ticket-confirmation', color: '#004625', bg: '#AFF2C2' },
  queue: { icon: 'podium', color: '#904D00', bg: '#FFDCC3' },
  procurement: { icon: 'tractor-variant', color: '#003491', bg: '#DBE1FF' },
  payment: { icon: 'cash', color: '#006C4A', bg: '#82F5C1' },
  announcement: { icon: 'bullhorn', color: '#404941', bg: '#EAEDFF' },
};

export default function NotificationsScreen({ navigation }) {
  const { t } = useLang();
  const { notifications, markAllRead } = useStore();
  const [filter, setFilter] = useState('all');

  const list = notifications.filter((n) => filter === 'all' || n.category === filter);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }} edges={['bottom']}>
      <View style={{ padding: 14, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circle}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={C.onSurface} />
          </TouchableOpacity>
          <Text style={{ fontSize: 17, fontWeight: '800', color: C.onSurface, flex: 1 }}>{t('notifTitle')}</Text>
          {unread > 0 && (
            <TouchableOpacity onPress={markAllRead} style={styles.markBtn}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: C.primary }}>{t('markAllRead')}</Text>
            </TouchableOpacity>
          )}
        </View>
        <Segmented
          options={[
            { value: 'all', label: 'All' },
            { value: 'booking', label: t('catBooking') },
            { value: 'queue', label: t('catQueue') },
            { value: 'payment', label: t('catPayment') },
          ]}
          value={filter} onChange={setFilter}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, paddingTop: 0, gap: 10, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {!list.length ? (
          <Card style={{ borderRadius: 16, padding: 6 }}>
            <EmptyState icon="bell-off-outline" title={t('noNotifs')} />
          </Card>
        ) : (
          list.map((n) => {
            const meta = CAT_META[n.category] || CAT_META.announcement;
            return (
              <Card key={n.id} style={{ borderRadius: 14, padding: 12, flexDirection: 'row', gap: 10, opacity: n.read ? 0.65 : 1 }}>
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: meta.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name={meta.icon} size={19} color={meta.color} />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 10.5, fontWeight: '800', color: meta.color, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                      {t(`cat${n.category[0].toUpperCase()}${n.category.slice(1)}`) || n.category}
                    </Text>
                    {!n.read && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#BA1A1A' }} />}
                  </View>
                  <Text style={{ fontSize: 12.5, color: C.onSurface, lineHeight: 17 }}>{n.text}</Text>
                  <Text style={{ fontSize: 10, color: C.outline }}>{n.at || ''}</Text>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  circle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  markBtn: { backgroundColor: C.surfaceContainerLow, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
});
