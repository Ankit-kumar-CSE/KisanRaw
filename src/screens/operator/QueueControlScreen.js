import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Animated, Easing, Modal, Alert, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ops as C } from '../../theme/colors';
import { counters, queueRecords, congestionZones, gridEvents } from '../../data/mock';
import { Card, Chip, Bar, PulseDot, LabelCaps, useToast } from '../../components/ui';
import { useLang } from '../../i18n';

const tabs = [
  { key: 'all', label: 'All Queued (31)' },
  { key: 'unassigned', label: 'Unassigned (18)' },
  { key: 'verified', label: 'Moisture Verified (9)' },
  { key: 'weighing', label: 'In Weighing Bay (4)' },
];

const assayStyle = {
  pass: { bg: C.secondaryFixed, fg: C.onSecondaryContainer, icon: 'check-circle' },
  pending: { bg: C.tertiaryFixed, fg: C.tertiaryContainer, icon: 'flask' },
  fail: { bg: C.errorContainer, fg: C.onErrorContainer, icon: 'alert' },
  done: { bg: C.secondaryContainer, fg: C.onSecondaryContainer, icon: 'check-decagram' },
};

const statusStyle = {
  Processing: { bg: C.primaryContainer, fg: '#A6F2D1' },
  Verification: { bg: C.tertiaryFixedDim, fg: C.onSurface },
  'Next In Line': { bg: 'rgba(128,67,0,0.15)', fg: C.tertiaryContainer },
  Escalated: { bg: C.errorContainer, fg: C.onErrorContainer },
  Waiting: { bg: C.surfaceContainerHigh, fg: C.onSurfaceVariant },
  Completed: { bg: C.secondaryContainer, fg: C.onSecondaryContainer },
};

export default function QueueControlScreen() {
  const toast = useToast();
  const { t } = useLang();
  const [syncSecs, setSyncSecs] = useState(3);
  const [chime, setChime] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [nowServing, setNowServing] = useState({ token: 'A103', farmer: 'Harpreet Singh', id: 'PB-99201', qty: '40 Quintals', tractor: 'PB-08-AU-4421', weight: '4,820 Kg' });
  const [dossier, setDossier] = useState(null);
  const [manualModal, setManualModal] = useState(false);
  const [counter4Fixed, setCounter4Fixed] = useState(false);
  const vis = useRef([0.3, 0.6, 0.2, 0.45, 0.35, 0.55, 0.25, 0.5, 0.4, 0.3].map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    const t = setInterval(() => setSyncSecs((s) => (s % 15) + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const loops = vis.map((v, i) => Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 0.4 + ((i % 4) * 0.2), duration: 500 + i * 60, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0.25, duration: 500 + i * 60, useNativeDriver: true }),
    ])));
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [vis]);

  const callNext = (token, farmer, counter = 'Counter 01') => {
    const rec = queueRecords.find((r) => r.token === token) || {};
    setNowServing({ token, farmer, id: rec.id || '—', qty: (rec.qty || '').replace(' Q', ' Quintals'), tractor: '—', weight: '—' });
    toast(`${farmer} called to ${counter}. SMS dispatched.`, 'Farmer Called to Bay');
  };

  const filtered = queueRecords.filter((r) => {
    if (tab === 'unassigned' && r.bay !== 'Unassigned') return false;
    if (tab === 'verified' && r.assay.kind !== 'pass') return false;
    if (tab === 'weighing' && r.bay === 'Unassigned') return false;
    if (search && !(`${r.token} ${r.name} ${r.village} ${r.id}`.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 110 }}>
      {/* pulse strip */}
      <Card style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(6,95,70,0.08)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
          <PulseDot color={C.primary} size={7} />
          <Text style={{ fontSize: 11.5, fontWeight: '700', color: C.primary }}>{t('liveSyncActive')}</Text>
        </View>
        <Text style={{ fontSize: 11, color: C.onSurfaceVariant }}>{t('updatedAgo', { s: syncSecs })}</Text>
        <Text style={{ fontSize: 11, color: C.onSurfaceVariant }}>· Phagwara Bay Terminal #04</Text>
        <TouchableOpacity onPress={() => setChime(!chime)} style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <MaterialCommunityIcons name={chime ? 'volume-high' : 'volume-off'} size={16} color={chime ? C.primary : C.error} />
          <Text style={{ fontSize: 11.5, fontWeight: '800', color: chime ? C.primary : C.error }}>Mandi Chime: {chime ? 'ON' : 'MUTED'}</Text>
        </TouchableOpacity>
      </Card>

      {/* hero command */}
      <Card style={{ padding: 14, gap: 12 }}>
        <TouchableOpacity
          onPress={() => callNext('A104', 'Manpreet Kaur')}
          activeOpacity={0.9}
          style={{ backgroundColor: C.primary, borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}
        >
          <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="bullhorn" size={26} color="#A6F2D1" />
          </View>
          <View style={{ flex: 1 }}>
            <LabelCaps color="#A6F2D1">{t('gridAction')}</LabelCaps>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 }}>{t('callNext')}</Text>
            <Text style={{ fontSize: 10, color: '#A6F2D1', marginTop: 2 }}>Keyboard: SPACEBAR or Alt+C</Text>
          </View>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Chip label={t('hold')} bg={C.tertiaryFixed} fg={C.tertiary} icon="pause-circle" onPress={() => toast('Token A104 placed on 10-min hold', 'Hold')} />
          <Chip label={t('manualTokenIssue')} bg={C.surfaceContainerLow} fg={C.primary} icon="plus-circle" onPress={() => setManualModal(true)} />
          <Chip label={t('fastTrack')} bg={C.secondaryContainer} fg={C.onSecondaryContainer} icon="priority-high" onPress={() => toast('DM & Mandi Secretary notified', 'Fast-Track')} />
          <Chip label={t('emergencyHold')} bg={C.errorContainer} fg={C.onErrorContainer} icon="hand-back-right" onPress={() =>
            Alert.alert('EMERGENCY YARD HOLD', 'Halt all gate inflow and bay operations?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'CONFIRM HOLD', style: 'destructive', onPress: () => toast('EMERGENCY SHUTDOWN — yard inflow halted', 'Emergency') },
            ])} />
        </View>

        {/* now serving */}
        <View style={{ backgroundColor: C.surfaceContainerLow, borderRadius: 12, padding: 12, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Chip label={t('nowServing')} bg={C.secondaryContainer} fg={C.onSecondaryContainer} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <PulseDot color={C.secondaryFixed} size={6} />
              <Text style={{ fontSize: 10, fontWeight: '700', color: C.onSurfaceVariant }}>SCALE STABLE · Counter 01</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: C.primary }}>TOKEN {nowServing.token}</Text>
            <Chip label={t('grossWeighing')} bg={C.primaryContainer} fg="#A6F2D1" />
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <ServeCell label={t('farmer')} value={nowServing.farmer} sub={`ID: ${nowServing.id}`} />
            <ServeCell label={t('commodity')} value="Paddy (PR-126)" sub={`Declared: ${nowServing.qty}`} />
            <ServeCell label={t('tractor')} value={nowServing.tractor} sub={`Bay Gross: ${nowServing.weight}`} />
          </View>
        </View>
      </Card>

      {/* metric row */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <MetricCard label={t('waitingFarmers')} value="31" chip="+4 vs 10 AM" chipBg={C.tertiaryFixed} chipFg={C.tertiary} barPct={60} barFill={C.tertiaryFixedDim} footer="Shed capacity: 62% occupied" />
        <MetricCard label={t('avgWait')} value="28m" chip="Within SLA" chipBg="rgba(130,245,193,0.4)" chipFg={C.onSecondaryContainer} barPct={80} barFill={C.secondaryFixed} footer="Regulatory Cap: <35 mins" />
        <MetricCard label={t('activeCounters')} value="4/5" footer="C-4 Maintenance · 80% ingestion" dots />
        <MetricCard label={t('procuredToday')} value="1,840 Q" barPct={57} barFill={C.primary} footer="83 cleared · Target: 3,200 Q" />
      </View>

      {/* counters */}
      <Card style={{ padding: 14, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MaterialCommunityIcons name="lan" size={17} color={C.primary} />
          <Text style={{ fontSize: 14, fontWeight: '800', color: C.onSurface }}>{t('countersHeading')}</Text>
          <Text style={{ marginLeft: 'auto', fontSize: 10.5, color: C.onSurfaceVariant }}>● 3 Processing · ● 1 Ready · ● 1 Calibration</Text>
        </View>
        {counters.map((c) => {
          const barColor = c.state === 'active' ? C.secondary : c.state === 'idle' ? C.secondaryFixedDim : c.state === 'paused' ? C.error : C.tertiaryFixedDim;
          const stateLabel = { active: 'Active', idle: 'Idle Ready', paused: 'Paused', payment: 'Payment' }[c.state];
          return (
            <View key={c.id} style={{ backgroundColor: C.surfaceContainerLow, borderRadius: 12, overflow: 'hidden' }}>
              <View style={{ height: 4, backgroundColor: barColor }} />
              <View style={{ padding: 12, gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: C.onSurface }}>{c.id}</Text>
                  <Chip label={stateLabel} bg={barColor} fg="#fff" size={10} />
                  {c.token && <Text style={{ fontSize: 11.5, color: C.onSurfaceVariant }}>Token {c.token}</Text>}
                  {c.state === 'idle' && <PulseDot size={5} />}
                </View>
                {c.farmer && <Text style={{ fontSize: 13.5, fontWeight: '700', color: C.onSurface }}>{c.farmer}</Text>}
                <Text style={{ fontSize: 11.5, color: c.state === 'paused' ? C.error : C.onSurfaceVariant }}>
                  {c.qty && `${c.qty} · Op: ${c.op}`}{c.note}{c.extra ? ` · ${c.extra}` : ''}
                  {c.elapsed ? ` · Elapsed: ${c.elapsed}` : ''}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                  {c.id === 'C01' && <Chip label="Complete" bg={C.primary} fg="#fff" size={11} onPress={() => toast('Routing to Tare Scale', 'C01')} />}
                  {c.id === 'C01' && <Chip label="Reassign" bg={C.surfaceContainerHigh} fg={C.onSurface} size={11} onPress={() => toast('Supervisor re-assignment initiated', 'C01')} />}
                  {c.id === 'C02' && <Chip label="Processing QA" bg={C.secondaryContainer} fg={C.onSecondaryContainer} size={11} onPress={() => toast('Assay accepted: 11.8% moisture', 'C02')} />}
                  {c.id === 'C03' && <Chip label="Call Next to C3" bg={C.surfaceContainerHigh} fg={C.primary} size={11} icon="phone" onPress={() => callNext('A105', 'Balwant Singh Dhillon', 'Counter 03')} />}
                  {c.id === 'C04' && !counter4Fixed && <Chip label="Verify & Resume" bg={C.errorContainer} fg={C.onErrorContainer} size={11} icon="refresh" onPress={() => { setCounter4Fixed(true); toast('Counter 04 restored after NABL recalibration', 'Counter Restored'); }} />}
                  {c.id === 'C04' && counter4Fixed && <Chip label="Recalibrated ✓" bg={C.secondary} fg="#fff" size={11} icon="check-circle" />}
                  {c.id === 'C05' && <Chip label="Dispatched (Exit Bay)" bg={C.secondary} fg="#fff" size={11} onPress={() => toast('Barrier cleared, gate pass GP-8839', 'C05')} />}
                </View>
              </View>
            </View>
          );
        })}
      </Card>

      {/* queue table */}
      <Card style={{ overflow: 'hidden' }}>
        <View style={{ padding: 12, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons name="queue-play-next" size={16} color={C.primary} />
            <Text style={{ fontSize: 13.5, fontWeight: '800', color: C.onSurface }}>{t('liveQueueTitle')} ({filtered.length})</Text>
            <TouchableOpacity onPress={() => toast('Exporting queue snapshot to PDF/Excel', 'Export')} style={{ marginLeft: 'auto' }}>
              <MaterialCommunityIcons name="download" size={18} color={C.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {tabs.map((t) => (
              <TouchableOpacity key={t.key} onPress={() => { setTab(t.key); toast(`${t.label} filter applied`, 'Queue Filter'); }}
                style={{ paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, backgroundColor: tab === t.key ? C.primary : C.surfaceContainerLow }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: tab === t.key ? '#fff' : C.onSurfaceVariant }}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.surfaceContainerLow, borderRadius: 9, paddingHorizontal: 10, height: 38 }}>
            <MaterialCommunityIcons name="filter-variant" size={15} color={C.outline} />
            <TextInput value={search} onChangeText={setSearch} placeholder={t('filterPh')} placeholderTextColor={C.outline} style={{ flex: 1, fontSize: 12.5, color: C.onSurface }} />
          </View>
        </View>
        {filtered.map((r) => {
          const a = assayStyle[r.assay.kind];
          const st = statusStyle[r.status];
          return (
            <View key={r.token} style={{ borderTopWidth: 1, borderColor: C.surfaceContainer, padding: 12, opacity: r.status === 'Completed' ? 0.72 : 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ backgroundColor: C.primaryContainer, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#A6F2D1' }}>{r.token}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: C.onSurface }}>{r.name}</Text>
                  <Text style={{ fontSize: 10.5, color: C.onSurfaceVariant }}>{r.id} • {r.village} • {r.arrival}{r.wait != null ? ` • Wait ${r.wait}m` : ''}</Text>
                </View>
                <Chip label={r.status} bg={st.bg} fg={st.fg} size={10} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 7, flexWrap: 'wrap' }}>
                <Text style={{ fontSize: 11.5, color: C.onSurface }}>{r.crop} · <Text style={{ fontWeight: '800' }}>{r.qty}</Text></Text>
                <Chip label={r.assay.label} bg={a.bg} fg={a.fg} icon={a.icon} size={10} />
                <Text style={{ fontSize: 10.5, color: C.onSurfaceVariant }}>{r.foreign}</Text>
                <Text style={{ fontSize: 10.5, color: C.onSurfaceVariant, fontStyle: r.bay === 'Unassigned' ? 'italic' : 'normal' }}>{r.bay}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                {r.status !== 'Completed' && r.status !== 'Processing' && (
                  <Chip label={t('call')} bg={C.primary} fg="#fff" size={10} icon="phone" onPress={() => callNext(r.token, r.name, r.bay === 'Unassigned' ? 'Counter 01' : r.bay)} />
                )}
                <Chip label={t('dossier')} bg={C.surfaceContainerHigh} fg={C.onSurface} size={10} icon="file-account" onPress={() => setDossier(r)} />
                {r.status === 'Completed' && <Chip label={t('receipt')} bg={C.secondaryContainer} fg={C.onSecondaryContainer} size={10} icon="receipt" onPress={() => toast('Reprinting MSP receipt...', r.token)} />}
                {r.status === 'Escalated' && <Chip label={t('retest')} bg={C.errorContainer} fg={C.onErrorContainer} size={10} onPress={() => toast('Sent for re-aeration & re-test', r.token)} />}
                {r.status === 'Next In Line' && <Chip label={t('delay')} bg={C.tertiaryFixed} fg={C.tertiary} size={10} onPress={() => toast('Token A105 delayed by 15 minutes', r.token)} />}
              </View>
            </View>
          );
        })}
        <View style={{ backgroundColor: C.surfaceContainerLow, padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 10.5, color: C.onSurfaceVariant }}>Showing {filtered.length} of 31 farmers queued</Text>
          <Text style={{ fontSize: 10.5, color: C.onSurfaceVariant }}>Page 1 of 3 ›</Text>
        </View>
      </Card>

      {/* PA broadcast + congestion + events */}
      <Card style={{ padding: 14, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MaterialCommunityIcons name="volume-high" size={16} color={C.primary} />
          <Text style={{ fontSize: 13.5, fontWeight: '800', color: C.onSurface }}>PA Broadcast Hub</Text>
          <Chip label="Tower Speaker: ON" bg={C.secondaryContainer} fg={C.onSecondaryContainer} size={9} />
        </View>
        <View style={{ backgroundColor: C.inverseSurface, borderRadius: 12, padding: 12, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 10, color: C.inverseOnSurface }}>Punjabi & Hindi Audio Stream</Text>
            <PulseDot size={5} />
            <Text style={{ fontSize: 9, fontWeight: '800', color: C.secondaryFixed, letterSpacing: 1 }}>BROADCASTING</Text>
          </View>
          <Text style={{ fontSize: 12.5, color: C.primaryFixed, lineHeight: 19 }}>
            ਧਿਆਨ ਦਿਓ: ਟੋਕਨ {nowServing.token}, {nowServing.farmer} ਕੰਡਾ ਨੰਬਰ 1 'ਤੇ ਪਹੁੰਚੋ।
          </Text>
          <Text style={{ fontSize: 11.5, color: C.inverseOnSurface, opacity: 0.8, fontStyle: 'italic' }}>
            ध्यान दें: टोकन {nowServing.token}, {nowServing.farmer} काउंटर नंबर 1 पर पहुंचें।
          </Text>
          {/* visualizer */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 26 }}>
            {vis.map((v, i) => (
              <Animated.View key={i} style={{ width: 4, borderRadius: 2, backgroundColor: C.secondaryFixed, height: 24, opacity: v }} />
            ))}
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Chip label="To Weighbridge 1" bg={C.surfaceContainerLow} fg={C.primary} icon="bullhorn" size={10} onPress={() => toast('Announcement played: proceed to Weighbridge 1', 'PA')} />
          <Chip label="To Moisture Lab" bg={C.tertiaryFixed} fg={C.tertiary} icon="flask" size={10} onPress={() => toast('Announcement played: proceed to Moisture Lab', 'PA')} />
          <Chip label="To Unload Platform" bg={C.surfaceContainerLow} fg={C.primary} icon="forklift" size={10} onPress={() => toast('Announcement played: proceed to Unload Platform', 'PA')} />
          <Chip label="DBT Window" bg={C.surfaceContainerLow} fg={C.primary} icon="receipt" size={10} onPress={() => toast('Announcement played: DBT payment window', 'PA')} />
        </View>

        <View style={{ gap: 8, marginTop: 4 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: C.onSurface }}>{t('congestionHeading')}</Text>
          {congestionZones.map((z) => (
            <View key={z.name} style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 11.5, color: C.onSurface }}>{z.name}</Text>
                <Text style={{ fontSize: 10.5, color: C.onSurfaceVariant }}>{z.note}</Text>
              </View>
              <Bar pct={z.pct} fill={z.pct > 50 ? C.tertiaryFixedDim : C.secondaryFixed} />
            </View>
          ))}
        </View>

        <View style={{ gap: 6, marginTop: 4 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: C.onSurface }}>{t('eventsHeading')}</Text>
          {gridEvents.map((e, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: e.kind === 'good' ? C.secondaryFixed : e.kind === 'bad' ? C.error : C.primary }} />
              <Text style={{ fontSize: 11.5, color: C.onSurfaceVariant, flex: 1 }}>{e.text}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* dossier modal */}
      <Modal visible={!!dossier} transparent animationType="fade" onRequestClose={() => setDossier(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="file-account" size={20} color={C.primary} />
              <Text style={{ fontSize: 15, fontWeight: '800', color: C.onSurface, flex: 1 }}>Dossier: {dossier?.name}</Text>
              <TouchableOpacity onPress={() => setDossier(null)}><MaterialCommunityIcons name="close" size={20} color={C.outline} /></TouchableOpacity>
            </View>
            <View style={{ backgroundColor: C.surfaceContainerLow, borderRadius: 12, padding: 12, gap: 8, marginTop: 12 }}>
              <DossierRow label="Mandi Token" value={`TOKEN ${dossier?.token}`} mono />
              <DossierRow label="Land Registry Status" value="4.8 Acres Verified" />
              <DossierRow label="Aadhaar Linked DBT" value="XXXX-XXXX-8821" mono />
              <DossierRow label="Bank IFSC / PFMS" value="PSIB000042 (Live)" mono />
            </View>
            <View style={{ backgroundColor: 'rgba(218,226,253,0.4)', borderRadius: 12, padding: 12, gap: 5, marginTop: 10 }}>
              <Text style={{ fontSize: 11.5, color: C.onSurface }}>Moisture: <Text style={{ color: C.secondary, fontWeight: '700' }}>11.4% (Max SLA: 12.0%)</Text></Text>
              <Text style={{ fontSize: 11.5, color: C.onSurface }}>Foreign Matter: 0.8% (OK)</Text>
              <Text style={{ fontSize: 10.5, color: C.onSurfaceVariant, fontStyle: 'italic' }}>Assayed by: S. P. Sharma (District Quality Lab, Kapurthala)</Text>
            </View>
            <TouchableOpacity
              onPress={() => { toast('Dossier digitally signed — scale authorized', 'Endorsed'); setDossier(null); }}
              style={{ backgroundColor: C.primary, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 14 }}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12.5 }}>Endorse & Authorize Scale</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* manual token modal */}
      <Modal visible={manualModal} transparent animationType="fade" onRequestClose={() => setManualModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="ticket-confirmation" size={20} color={C.primary} />
              <Text style={{ fontSize: 15, fontWeight: '800', color: C.onSurface }}>Issue Manual Gate Token</Text>
            </View>
            <ManualField label="Farmer Aadhaar or Mobile" placeholder="e.g. 98765-43210 or 12-digit Aadhaar" />
            <ManualField label="Commodity" placeholder="Paddy (PR-126)" />
            <ManualField label="Approx Weight (Quintals)" placeholder="e.g. 45" />
            <ManualField label="Vehicle Registration" placeholder="e.g. PB-08-XX-0000" />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity onPress={() => setManualModal(false)} style={{ flex: 1, backgroundColor: C.surfaceContainerHigh, borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 12.5, fontWeight: '700', color: C.onSurface }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setManualModal(false); toast('Token A109 issued. RFID gate barcode printed at Booth 1.', 'Manual Token'); }}
                style={{ flex: 1.6, backgroundColor: C.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}
              >
                <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#fff' }}>Print & Issue Token A109</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function ServeCell({ label, value, sub }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 10 }}>
      <LabelCaps>{label}</LabelCaps>
      <Text style={{ fontSize: 12.5, fontWeight: '700', color: C.onSurface, marginTop: 3 }}>{value}</Text>
      <Text style={{ fontSize: 10, color: C.onSurfaceVariant, marginTop: 2 }}>{sub}</Text>
    </View>
  );
}

function MetricCard({ label, value, chip, chipBg, chipFg, barPct, barFill, footer, dots }) {
  return (
    <View style={{ flexBasis: '48%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 5, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: C.onSurfaceVariant }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: C.primary }}>{value}</Text>
        {chip && <Chip label={chip} bg={chipBg} fg={chipFg} size={9} />}
      </View>
      {dots ? (
        <View style={{ flexDirection: 'row', gap: 5 }}>
          {['C1', 'C2', 'C3', 'C4', 'C5'].map((c) => (
            <View key={c} style={{ alignItems: 'center', gap: 2 }}>
              <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: c === 'C4' ? C.error : C.secondary }} />
              <Text style={{ fontSize: 8.5, color: C.onSurfaceVariant }}>{c}</Text>
            </View>
          ))}
        </View>
      ) : barPct ? <Bar pct={barPct} fill={barFill} /> : null}
      {footer && <Text style={{ fontSize: 10, color: C.onSurfaceVariant }}>{footer}</Text>}
    </View>
  );
}

function DossierRow({ label, value, mono }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: 11.5, color: C.onSurfaceVariant }}>{label}</Text>
      <Text style={{ fontSize: 11.5, fontWeight: mono ? '700' : '700', color: C.primary, letterSpacing: mono ? 0.5 : 0 }}>{value}</Text>
    </View>
  );
}

function ManualField({ label, placeholder }) {
  const [v, setV] = useState('');
  return (
    <View style={{ marginTop: 10 }}>
      <LabelCaps>{label}</LabelCaps>
      <TextInput
        value={v} onChangeText={setV} placeholder={placeholder} placeholderTextColor={C.outline}
        style={{ backgroundColor: C.surfaceContainerLow, borderRadius: 9, paddingHorizontal: 12, height: 42, fontSize: 12.5, color: C.onSurface, marginTop: 5 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(40,48,68,0.6)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, width: '100%', maxHeight: '85%', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, elevation: 10 },
});
