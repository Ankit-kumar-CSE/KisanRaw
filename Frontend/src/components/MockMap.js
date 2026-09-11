// MockMap — frontend map placeholder with centre markers.
// To connect real Google Maps later, replace this component's internals with
// react-native-maps (or a WebView); the props contract stays the same:
//   centres: [{id,name,mapPos:{x,y},status,waitMins}], userPos:{x,y}, selectedId, onSelect(centre)
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { farmer as C } from '../theme/colors';
import { PulseDot } from './ui';

const markerMeta = {
  open: { color: C.primary, icon: 'grain' },
  busy: { color: C.secondaryContainer, icon: 'storefront' },
  closed: { color: '#9AA3B0', icon: 'lock' },
};

export default function MockMap({ centres = [], userPos = { x: 16, y: 18 }, selectedId, onSelect }) {
  return (
    <View style={styles.map}>
      {/* terrain zones */}
      <View style={[styles.zone, { backgroundColor: C.farmland, top: 0, left: 0, right: 0, height: '38%' }]} />
      <View style={[styles.zone, { backgroundColor: C.urban, bottom: 0, left: 0, right: 0, height: '40%' }]} />
      <View style={{ position: 'absolute', top: '36%', left: 0, right: 0, height: 12, backgroundColor: C.water, transform: [{ rotate: '-2deg' }] }} />
      <View style={{ position: 'absolute', top: '52%', left: -10, right: -10, height: 14, backgroundColor: C.highwayCasing, transform: [{ rotate: '-6deg' }] }}>
        <View style={{ flex: 1, marginVertical: 3, backgroundColor: C.highway }} />
      </View>
      <Text style={[styles.roadLabel, { top: '53%', right: 14 }]}>NH-44</Text>

      {/* user GPS */}
      <View style={{ position: 'absolute', top: `${userPos.y}%`, left: `${userPos.x}%`, alignItems: 'center' }}>
        <PulseDot color="#1D4ED8" size={12} />
        <Text style={styles.userLabel}>You (Chiheru)</Text>
      </View>

      {/* centre markers */}
      {centres.filter((c) => c.mapPos).map((c) => {
        const meta = markerMeta[c.status] || markerMeta.open;
        const active = c.id === selectedId;
        return (
          <Pressable key={c.id} onPress={() => onSelect(c)} style={{ position: 'absolute', top: `${c.mapPos.y}%`, left: `${c.mapPos.x}%`, alignItems: 'center' }}>
            <View style={{
              width: active ? 36 : 28, height: active ? 36 : 28, borderRadius: 999,
              backgroundColor: meta.color, alignItems: 'center', justifyContent: 'center',
              borderWidth: 2, borderColor: '#fff', elevation: 4,
            }}>
              <MaterialCommunityIcons name={meta.icon} size={active ? 20 : 15} color="#fff" />
            </View>
            <View style={styles.pinLabel}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: C.onSurface }} numberOfLines={1}>
                {c.name.split(' ')[0]}{c.status !== 'closed' ? ` • ${c.waitMins}m` : ' • Closed'}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { height: 300, borderRadius: 16, overflow: 'hidden', backgroundColor: C.farmland, borderWidth: 1, borderColor: C.outlineVariant },
  zone: { position: 'absolute' },
  roadLabel: { position: 'absolute', fontSize: 9, fontWeight: '800', color: '#7A4A00', backgroundColor: '#ffffffcc', borderRadius: 5, paddingHorizontal: 4 },
  userLabel: { fontSize: 9, fontWeight: '700', color: C.onSurface, backgroundColor: '#ffffffcc', borderRadius: 6, paddingHorizontal: 4, marginTop: 2 },
  pinLabel: { backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, marginTop: 3, maxWidth: 110, elevation: 2 },
});
