// Real Google Maps view with live user location and mandi centre pins.
// Props contract (same as old MockMap):
//   centres: [{id, name, mapPos:{x,y}, status, waitMins, distanceKm}]
//   userLocation: { lat, lng } | null
//   selectedId: string | null
//   onSelect(centre): void
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { farmer as C } from '../theme/colors';
import { PulseDot } from './ui';

// Reads from EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env
const MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Phagwara, Punjab — fallback centre when GPS unavailable
const DEFAULT_REGION = {
  latitude: 31.2241,
  longitude: 75.7737,
  latitudeDelta: 0.12,
  longitudeDelta: 0.08,
};

// Each mandi in the DB has a mapPos:{x,y} (0-100 relative coords).
// We convert those to real GPS coords relative to the default region bounds.
function mapPosToLatLng(mapPos, region) {
  if (!mapPos) return null;
  const lat = region.latitude + region.latitudeDelta * (0.5 - mapPos.y / 100);
  const lng = region.longitude + region.longitudeDelta * (mapPos.x / 100 - 0.5);
  return { latitude: lat, longitude: lng };
}

const STATUS_COLORS = {
  open: C.primary,
  busy: C.secondary,
  closed: '#9AA3B0',
};

const STATUS_ICONS = {
  open: 'grain',
  busy: 'storefront',
  closed: 'lock',
};

export default function MapComponent({ centres = [], userLocation = null, selectedId, onSelect }) {
  const mapRef = useRef(null);

  const region = userLocation
    ? { latitude: userLocation.lat, longitude: userLocation.lng, latitudeDelta: 0.12, longitudeDelta: 0.08 }
    : DEFAULT_REGION;

  // Show a clear error if the API key is missing (blank map symptom)
  if (!MAPS_API_KEY) {
    return (
      <View style={[styles.container, styles.errorBox]}>
        <MaterialCommunityIcons name="map-off" size={32} color="#93000A" />
        <Text style={styles.errorText}>Google Maps API key not set.</Text>
        <Text style={styles.errorSub}>Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file and restart the server.</Text>
      </View>
    );
  }

  // Animate map to user location when it becomes available
  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        { latitude: userLocation.lat, longitude: userLocation.lng, latitudeDelta: 0.12, longitudeDelta: 0.08 },
        800,
      );
    }
  }, [userLocation?.lat, userLocation?.lng]);

  // Animate to selected centre
  useEffect(() => {
    if (selectedId && mapRef.current) {
      const c = centres.find((x) => x.id === selectedId);
      const coords = c?.mapPos ? mapPosToLatLng(c.mapPos, region) : null;
      if (coords) {
        mapRef.current.animateToRegion({ ...coords, latitudeDelta: 0.06, longitudeDelta: 0.04 }, 600);
      }
    }
  }, [selectedId]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={region}
        showsUserLocation={!!userLocation}
        showsMyLocationButton={true}
        showsCompass={true}
        showsTraffic={false}
        mapType="standard"
      >
        {/* User accuracy ring */}
        {userLocation && (
          <Circle
            center={{ latitude: userLocation.lat, longitude: userLocation.lng }}
            radius={150}
            fillColor="rgba(29,78,216,0.08)"
            strokeColor="rgba(29,78,216,0.25)"
            strokeWidth={1}
          />
        )}

        {/* Mandi centre markers */}
        {centres.filter((c) => c.mapPos).map((c) => {
          const coords = mapPosToLatLng(c.mapPos, DEFAULT_REGION);
          if (!coords) return null;
          const active = c.id === selectedId;
          const color = STATUS_COLORS[c.status] || C.primary;
          const icon = STATUS_ICONS[c.status] || 'grain';

          return (
            <Marker
              key={c.id}
              coordinate={coords}
              onPress={() => onSelect(c)}
              anchor={{ x: 0.5, y: 1 }}
            >
              <View style={styles.markerWrap}>
                <View style={[
                  styles.markerBubble,
                  { backgroundColor: color, width: active ? 44 : 34, height: active ? 44 : 34, borderRadius: active ? 22 : 17 },
                  active && styles.markerActive,
                ]}>
                  <MaterialCommunityIcons name={icon} size={active ? 22 : 17} color="#fff" />
                </View>
                <View style={styles.markerTail} />
                <View style={[styles.markerLabel, active && { backgroundColor: color }]}>
                  <Text style={[styles.markerLabelText, active && { color: '#fff' }]} numberOfLines={1}>
                    {c.name.split(' ')[0]}{c.status !== 'closed' ? ` · ${c.waitMins}m` : ' · Closed'}
                  </Text>
                </View>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* GPS accuracy chip */}
      {userLocation && (
        <View style={styles.gpsChip}>
          <PulseDot color="#1D4ED8" size={5} />
          <Text style={styles.gpsText}>±12m</Text>
        </View>
      )}
      {!userLocation && (
        <View style={[styles.gpsChip, { backgroundColor: '#FFDAD6' }]}>
          <MaterialCommunityIcons name="crosshairs-gps" size={12} color="#93000A" />
          <Text style={[styles.gpsText, { color: '#93000A' }]}>No GPS</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },
  markerWrap: { alignItems: 'center' },
  markerBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  markerActive: {
    elevation: 8,
    shadowOpacity: 0.35,
  },
  markerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
    marginTop: -1,
  },
  markerLabel: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 3,
    maxWidth: 120,
    elevation: 3,
  },
  markerLabelText: {
    fontSize: 9,
    fontWeight: '700',
    color: C.onSurface,
  },
  gpsChip: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  gpsText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.onSurface,
  },
  errorBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFDAD6',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#93000A',
    textAlign: 'center',
  },
  errorSub: {
    fontSize: 11,
    color: '#93000A',
    textAlign: 'center',
    opacity: 0.8,
  },
});
