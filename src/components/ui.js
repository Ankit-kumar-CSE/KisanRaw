import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ---------- Toast ----------
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);

  const show = (message, title = 'KisanSetu') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, title });
    Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    timer.current = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setToast(null));
    }, 3500);
  };

  return (
    <ToastCtx.Provider value={show}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: anim,
              transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
            },
          ]}
        >
          <View style={styles.toastIcon}>
            <MaterialCommunityIcons name="check-decagram" size={20} color="#AFF2C2" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.toastTitle}>{toast.title}</Text>
            <Text style={styles.toastMsg}>{toast.message}</Text>
          </View>
          <TouchableOpacity onPress={() => setToast(null)}>
            <MaterialCommunityIcons name="close" size={18} color="#EEF0FF" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastCtx.Provider>
  );
}

// ---------- Pulsing dot ----------
export function PulseDot({ color = '#85F8C4', size = 8, ring = true }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });
  return (
    <View style={{ width: size * 2, height: size * 2, alignItems: 'center', justifyContent: 'center' }}>
      {ring && <Animated.View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color, transform: [{ scale }], opacity }} />}
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </View>
  );
}

// ---------- Chip / pill ----------
export function Chip({ label, bg, fg, icon, size = 11, bold = true, onPress, style }) {
  const body = (
    <View style={[styles.chip, { backgroundColor: bg }, style]}>
      {icon && <MaterialCommunityIcons name={icon} size={size + 4} color={fg} style={{ marginRight: 4 }} />}
      <Text style={{ color: fg, fontSize: size, fontWeight: bold ? '700' : '400', letterSpacing: 0.4 }}>{label}</Text>
    </View>
  );
  return onPress ? <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{body}</TouchableOpacity> : body;
}

// ---------- Card ----------
export function Card({ children, style, onPress }) {
  if (onPress)
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.card, style]}>
        {children}
      </TouchableOpacity>
    );
  return <View style={[styles.card, style]}>{children}</View>;
}

// ---------- Progress bar ----------
export function Bar({ pct, fill = '#85F8C4', track = '#DAE2FD', height = 6 }) {
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }}>
      <View style={{ width: `${Math.min(100, pct)}%`, height: '100%', borderRadius: height / 2, backgroundColor: fill }} />
    </View>
  );
}

// ---------- Icon tile ----------
export function IconTile({ name, bg = '#065F46', fg = '#AFF2C2', size = 38, iconSize = 20, radius = 10 }) {
  return (
    <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <MaterialCommunityIcons name={name} size={iconSize} color={fg} />
    </View>
  );
}

// ---------- Section label ----------
export function LabelCaps({ children, color = '#3F4944', style }) {
  return <Text style={[{ fontSize: 11, fontWeight: '700', letterSpacing: 1, color, textTransform: 'uppercase' }, style]}>{children}</Text>;
}

// ---------- Button ----------
export function Button({ title, onPress, variant = 'primary', icon, disabled, loading, style, textStyle }) {
  const looks = {
    primary: { bg: '#004625', fg: '#FFFFFF' },
    secondary: { bg: '#EAEDFF', fg: '#004625' },
    outline: { bg: '#FFFFFF', fg: '#004625', border: true },
    danger: { bg: '#BA1A1A', fg: '#FFFFFF' },
  }[variant];
  return (
    <TouchableOpacity
      onPress={onPress} disabled={disabled || loading} activeOpacity={0.85}
      style={[{
        backgroundColor: looks.bg, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        opacity: disabled || loading ? 0.6 : 1,
        borderWidth: looks.border ? 1 : 0, borderColor: looks.border ? '#C0C9BF' : 'transparent',
      }, style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={looks.fg} />
      ) : (
        <>
          {icon && <MaterialCommunityIcons name={icon} size={18} color={looks.fg} />}
          {title && <Text style={{ color: looks.fg, fontWeight: '800', fontSize: 13.5, ...textStyle }}>{title}</Text>}
        </>
      )}
    </TouchableOpacity>
  );
}

// ---------- Skeleton loader ----------
export function Skeleton({ width = '100%', height = 16, radius = 8, style }) {
  const opacity = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.9, duration: 600, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.45, duration: 600, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={{ width, height, borderRadius: radius, backgroundColor: '#E2E7FF', opacity, ...style }} />;
}

export function CardSkeleton() {
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Skeleton width={44} height={44} radius={12} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width="70%" height={14} />
          <Skeleton width="45%" height={11} />
        </View>
      </View>
      <Skeleton width="90%" height={11} />
      <Skeleton width="60%" height={11} />
    </View>
  );
}

// ---------- Empty state ----------
export function EmptyState({ icon = 'inbox-outline', title, sub, actionLabel, onAction }) {
  return (
    <View style={{ alignItems: 'center', padding: 30, gap: 8 }}>
      <View style={{ width: 64, height: 64, borderRadius: 999, backgroundColor: '#F2F3FF', alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name={icon} size={30} color="#707971" />
      </View>
      <Text style={{ fontSize: 15, fontWeight: '800', color: '#131B2E', textAlign: 'center' }}>{title}</Text>
      {sub && <Text style={{ fontSize: 12, color: '#404941', textAlign: 'center' }}>{sub}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} style={{ marginTop: 8, backgroundColor: '#004625', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12.5 }}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ---------- Timeline row ----------
export function TimelineRow({ label, sub, state }) {
  // state: done | current | pending
  const color = state === 'done' ? '#006C4A' : state === 'current' ? '#904D00' : '#DAE2FD';
  const fg = state === 'pending' ? '#404941' : '#131B2E';
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View style={{ alignItems: 'center', width: 26 }}>
        <View style={{ width: 22, height: 22, borderRadius: 999, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
          {state === 'done' && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
          {state === 'current' && <PulseDot color="#fff" size={7} />}
        </View>
        <View style={{ width: 2, flex: 1, backgroundColor: state === 'done' ? '#AFF2C2' : '#DAE2FD' }} />
      </View>
      <View style={{ flex: 1, paddingBottom: 18 }}>
        <Text style={{ fontSize: 13, fontWeight: state === 'current' ? '800' : '700', color: fg }}>{label}</Text>
        {sub && <Text style={{ fontSize: 11, color: '#404941', marginTop: 2 }}>{sub}</Text>}
      </View>
    </View>
  );
}

// ---------- Segmented control ----------
export function Segmented({ options, value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: '#EAEDFF', borderRadius: 12, padding: 4 }}>
      {options.map((o) => (
        <TouchableOpacity
          key={o.value} onPress={() => onChange(o.value)}
          style={{ flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center', backgroundColor: value === o.value ? '#fff' : 'transparent', shadowColor: '#000', shadowOpacity: value === o.value ? 0.08 : 0, shadowRadius: 4, elevation: value === o.value ? 2 : 0 }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: value === o.value ? '#004625' : '#404941' }}>{o.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ---------- Status badge ----------
export function StatusBadge({ status }) {
  const map = {
    confirmed: { label: 'CONFIRMED', bg: '#AFF2C2', fg: '#00210F' },
    'checked-in': { label: 'CHECKED IN', bg: '#AFF2C2', fg: '#00210F' },
    'in-queue': { label: 'IN QUEUE', bg: '#DBE1FF', fg: '#003491' },
    processing: { label: 'PROCESSING', bg: '#FFDCC3', fg: '#2F1500' },
    'procurement-completed': { label: 'COMPLETED', bg: '#82F5C1', fg: '#00210F' },
    'payment-initiated': { label: 'PAYMENT INITIATED', bg: '#FFDCC3', fg: '#2F1500' },
    'payment-completed': { label: 'PAID', bg: '#82F5C1', fg: '#00210F' },
    cancelled: { label: 'CANCELLED', bg: '#FFDAD6', fg: '#93000A' },
  };
  const m = map[status] || { label: String(status).toUpperCase(), bg: '#EAEDFF', fg: '#131B2E' };
  return <Chip label={m.label} bg={m.bg} fg={m.fg} size={9} />;
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute', bottom: 96, left: 16, right: 16,
    backgroundColor: '#283044', borderRadius: 14, borderWidth: 1, borderColor: '#444C66',
    borderLeftWidth: 4, borderLeftColor: '#85F8C4',
    flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  toastIcon: { width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(0,108,74,0.25)', alignItems: 'center', justifyContent: 'center' },
  toastTitle: { color: '#EEF0FF', fontSize: 13, fontWeight: '700' },
  toastMsg: { color: '#BEC9C2', fontSize: 12, marginTop: 2 },
  chip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999, alignSelf: 'flex-start',
  },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
