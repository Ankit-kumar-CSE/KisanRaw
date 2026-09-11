import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, StyleSheet, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ops as C } from '../../theme/colors';
import { kpis, intakeSlots, telemetry, processing as P } from '../../data/mock';
import { Card, Chip, Bar, PulseDot, LabelCaps, IconTile, useToast } from '../../components/ui';
import { useLang } from '../../i18n';

export default function ConsoleScreen() {
  const [tab, setTab] = useState('dashboard'); // dashboard | processing
  const { t } = useLang();
  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      {/* console header strip */}
      <View style={{ backgroundColor: C.inverseSurface, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: C.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name="console" size={16} color={C.primaryFixed} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 13.5, fontWeight: '800', color: C.inverseOnSurface }}>{t('consoleTitle')}</Text>
            <View style={{ backgroundColor: C.surfaceContainerHigh, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: C.onSurface }}>v2.4</Text>
            </View>
          </View>
          <Text style={{ fontSize: 10, color: '#BEC9C2' }}>Phagwara Main Mandi (PB-KPR-014) · Rabi 2024-25 · Morning Shift</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <PulseDot color={C.secondaryFixed} size={6} />
          <Text style={{ fontSize: 9.5, fontWeight: '700', color: C.secondaryFixed }}>SYNC 0.4s</Text>
        </View>
      </View>
      {/* internal tab */}
      <View style={{ flexDirection: 'row', backgroundColor: C.surfaceContainerLow, paddingHorizontal: 10, paddingTop: 8, gap: 6 }}>
        {[
          { k: 'dashboard', label: t('overview'), icon: 'view-dashboard' },
          { k: 'processing', label: t('weighingIngestion'), icon: 'scale-balance' },
        ].map((t) => (
          <TouchableOpacity key={t.k} onPress={() => setTab(t.k)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 10, backgroundColor: tab === t.k ? '#fff' : 'transparent' }}>
            <MaterialCommunityIcons name={t.icon} size={15} color={tab === t.k ? C.primary : C.onSurfaceVariant} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: tab === t.k ? C.primary : C.onSurfaceVariant }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {tab === 'dashboard' ? <Dashboard /> : <Processing />}
    </View>
  );
}

function Dashboard() {
  const toast = useToast();
  const [showAdvisory, setShowAdvisory] = useState(true);
  const [congestionModal, setCongestionModal] = useState(false);

  return (
    <ScrollView contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 110 }}>
      {showAdvisory && (
        <Card style={{ padding: 12, flexDirection: 'row', gap: 10 }}>
          <IconTile name="alert" bg={C.tertiaryFixed} fg={C.tertiary} />
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={{ fontSize: 12.5, fontWeight: '800', color: C.onSurface }}>Yard Surge Advisory: Peak Inflow Window</Text>
              <Chip label="Level-2 Advisory" bg={C.tertiaryContainer} fg={C.tertiaryFixed} size={9} />
            </View>
            <Text style={{ fontSize: 11, color: C.onSurfaceVariant, lineHeight: 16 }}>
              High arrival volume predicted for 13:00–16:00. ~45 tractors from Rawalpindi & Hadiabad clusters. Backup Moisture Analyzer Unit #2 pre-calibrated & deployed.
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Chip label="View Congestion Protocol" bg={C.surfaceContainerHigh} fg={C.onSurface} icon="traffic-light" size={10} onPress={() => setCongestionModal(true)} />
              <Chip label="Acknowledge" bg={C.primary} fg="#fff" size={10} onPress={() => setShowAdvisory(false)} />
            </View>
          </View>
        </Card>
      )}

      {/* KPI grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {kpis.map((k) => (
          <View key={k.label} style={{ flexBasis: '31%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 12, padding: 11, gap: 4, elevation: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <MaterialCommunityIcons name={k.icon} size={14} color={C.onSurfaceVariant} />
              <Text style={{ fontSize: 9.5, fontWeight: '700', color: C.onSurfaceVariant, flex: 1 }} numberOfLines={1}>{k.label}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: C.primary }}>{k.value}</Text>
              <Text style={{ fontSize: 9.5, color: C.onSurfaceVariant }}>{k.unit}</Text>
            </View>
            {k.chip && <Chip label={k.chip} bg={C.secondaryContainer} fg={C.onSecondaryContainer} size={9} />}
            <Text style={{ fontSize: 9, color: C.onSurfaceVariant }} numberOfLines={2}>{k.footer}</Text>
          </View>
        ))}
      </View>

      {/* intake chart */}
      <Card style={{ padding: 14, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Text style={{ fontSize: 13.5, fontWeight: '800', color: C.onSurface, flex: 1 }}>Hourly Intake & Capacity Ceiling</Text>
          <Chip label="Wheat RMS 24" bg={C.surfaceContainerLow} fg={C.onSurfaceVariant} size={9} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 130, gap: 12 }}>
          {intakeSlots.map((s) => {
            const fill = s.state === 'done' ? C.primary : s.state === 'active' ? C.secondary : C.surfaceContainerHighest;
            return (
              <View key={s.slot} style={{ flex: 1, alignItems: 'center', gap: 5 }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: C.onSurface }}>{s.q.toLocaleString()} Q</Text>
                <View style={{ width: '100%', flex: 1, borderRadius: 6, backgroundColor: C.surfaceContainerHigh, overflow: 'hidden', justifyContent: 'flex-end' }}>
                  <View style={{ width: '100%', height: `${s.pct}%`, backgroundColor: fill, borderTopLeftRadius: 6, borderTopRightRadius: 6 }} />
                </View>
                <Text style={{ fontSize: 8.5, color: C.onSurfaceVariant, textAlign: 'center' }}>{s.slot}</Text>
                {s.state === 'active'
                  ? <Chip label="ACTIVE" bg={C.secondaryContainer} fg={C.onSecondaryContainer} size={8} />
                  : <Text style={{ fontSize: 8.5, color: s.state === 'pending' ? C.tertiary : C.onSurfaceVariant, fontWeight: '700' }}>{s.full}</Text>}
              </View>
            );
          })}
        </View>
        <View style={{ height: 2, borderTopWidth: 2, borderTopColor: C.error, borderStyle: 'dashed' }} />
        <Text style={{ fontSize: 10, color: C.error, fontWeight: '700', textAlign: 'center' }}>Max Shift Ceiling (1,400 Q)</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
          <Mini label="Gate-Pass" value="125 / 150 Issued" />
          <Mini label="WB Clearance" value="3.8 mins / vehicle" />
          <Mini label="Avg Moisture" value="11.3% (Grade 'A')" />
          <Mini label="Daily Pace" value="On Track (98.2%)" good />
        </View>
      </Card>

      {/* telemetry + actions */}
      <Card style={{ padding: 14, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MaterialCommunityIcons name="access-point" size={16} color={C.primary} />
          <Text style={{ fontSize: 13.5, fontWeight: '800', color: C.onSurface, flex: 1 }}>Live Depot Sensor Telemetry</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(130,245,193,0.4)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
            <PulseDot size={5} />
            <Text style={{ fontSize: 9.5, fontWeight: '700', color: C.onSecondaryContainer }}>All Feeds Live</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {telemetry.map((t) => (
            <View key={t.name} style={{ flexBasis: '48%', flexGrow: 1, backgroundColor: C.surfaceContainerLow, borderRadius: 10, padding: 11 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: C.onSurface, flex: 1 }}>{t.name}</Text>
                <Chip label={t.chip} bg={C.surfaceContainerHigh} fg={C.onSurfaceVariant} size={8} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: C.primary, marginTop: 5 }}>{t.value}</Text>
              <Text style={{ fontSize: 10, color: C.onSurfaceVariant }}>{t.sub}</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
          {[
            { label: 'Direct Gate Pass', icon: 'qrcode-scan', sub: 'Emergency fast-track' },
            { label: 'QA Lot Override', icon: 'ruler-square', sub: 'Supervisor re-assay' },
            { label: 'Slot Extender', icon: 'clock-plus', sub: '+60 min buffer zone' },
            { label: 'Gunny Bags Indent', icon: 'bag-personal', sub: 'Stock: 14,200 (85%)' },
          ].map((a) => (
            <TouchableOpacity key={a.label} onPress={() => toast(`${a.label} triggered`, 'Rapid Action')} style={{ flexBasis: '48%', flexGrow: 1, backgroundColor: C.surfaceContainerLow, borderRadius: 10, padding: 11, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <MaterialCommunityIcons name={a.icon} size={18} color={C.primary} />
              <View>
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: C.onSurface }}>{a.label}</Text>
                <Text style={{ fontSize: 9.5, color: C.onSurfaceVariant }}>{a.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* MSP strip */}
      <Card style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <IconTile name="file-certificate" bg={C.surfaceContainer} fg={C.primary} />
        <View style={{ flex: 1, minWidth: 140 }}>
          <Text style={{ fontSize: 12.5, fontWeight: '800', color: C.onSurface }}>Notified MSP Rates Grid</Text>
          <Text style={{ fontSize: 10, color: C.onSurfaceVariant }}>DA&FW Gazetted · PSS & Central Pool 2024-25</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <Chip label="Wheat: ₹2,275/Q" bg={C.surfaceContainerLow} fg={C.primary} size={10} />
          <Chip label="Paddy: ₹2,183/Q" bg={C.surfaceContainerLow} fg={C.secondary} size={10} />
        </View>
      </Card>

      {/* congestion protocol modal */}
      <Modal visible={congestionModal} transparent animationType="fade" onRequestClose={() => setCongestionModal(false)}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="traffic-light" size={20} color={C.primary} />
              <Text style={{ fontSize: 15, fontWeight: '800', color: C.onSurface, flex: 1 }}>Yard Surge Protocol v1.4</Text>
              <TouchableOpacity onPress={() => setCongestionModal(false)}><MaterialCommunityIcons name="close" size={20} color={C.outline} /></TouchableOpacity>
            </View>
            <Text style={{ fontSize: 11.5, color: C.onSurfaceVariant, marginTop: 10, lineHeight: 17 }}>
              Based on satellite predictive queue telemetry, these overrides are pre-triggered for 13:00–16:00:
            </Text>
            {[
              { t: 'Dual Tare Lane', s: 'Weighbridge 02 → tare-only egress, clear 12 tractors' },
              { t: 'Moisture Unit 2 Active', s: 'Assayers at Gate 1 holding yard' },
              { t: 'SMS Transit Buffer', s: '18 farmers notified +20 min' },
            ].map((r) => (
              <View key={r.t} style={{ backgroundColor: C.surfaceContainerLow, borderRadius: 10, padding: 11, flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <MaterialCommunityIcons name="check-circle" size={16} color={C.secondary} />
                <View>
                  <Text style={{ fontSize: 12.5, fontWeight: '700', color: C.onSurface }}>{r.t}</Text>
                  <Text style={{ fontSize: 10.5, color: C.onSurfaceVariant }}>{r.s}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity onPress={() => setCongestionModal(false)} style={{ backgroundColor: C.primary, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 14 }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12.5 }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function Mini({ label, value, good }) {
  return (
    <View style={{ flexBasis: '48%', flexGrow: 1, borderTopWidth: 1, borderTopColor: C.surfaceContainerHigh, paddingTop: 7 }}>
      <LabelCaps>{label}</LabelCaps>
      <Text style={{ fontSize: 11.5, fontWeight: '700', color: good ? C.secondary : C.onSurface, marginTop: 2 }}>{value}</Text>
    </View>
  );
}

function Processing() {
  const toast = useToast();
  const [dbt, setDbt] = useState(true);
  const [reject, setReject] = useState('');
  const [done, setDone] = useState(false);

  return (
    <ScrollView contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 110 }}>
      {/* farmer token card */}
      <Card style={{ padding: 14, gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: C.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: C.primaryFixed }}>{P.token}</Text>
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: C.onSurface }}>{P.farmer}</Text>
            <Text style={{ fontSize: 11, color: C.onSurfaceVariant }}>{P.father} · {P.reg}</Text>
            <Text style={{ fontSize: 11, color: C.onSurfaceVariant }}>{P.village}</Text>
            <Text style={{ fontSize: 11, color: C.onSurfaceVariant }}>{P.phone}</Text>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
              <Chip label="Aadhaar Biometric Authenticated" bg={C.secondaryContainer} fg={C.onSecondaryContainer} size={9} icon="check-decagram" />
              <Chip label={P.land} bg={C.surfaceContainerLow} fg={C.onSurfaceVariant} size={9} />
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <InfoPill icon="tractor-variant" label="Carrier" value={P.tractor} />
          <InfoPill icon="login" label="Gate Inflow" value={P.gateIn} />
          <InfoPill icon="account-check" label="KYC" value="KYC PASS" />
        </View>
      </Card>

      {/* stepper */}
      <Card style={{ padding: 14 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {P.steps.map((s, i) => {
              const idx = i + 1;
              const state = idx < P.currentStep ? 'done' : idx === P.currentStep ? 'current' : 'pending';
              return (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ alignItems: 'center', width: 78 }}>
                    <View style={{
                      width: 34, height: 34, borderRadius: 999, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: state === 'done' ? C.secondary : state === 'current' ? C.primaryContainer : C.surfaceContainerHigh,
                      borderWidth: state === 'current' ? 3 : 0, borderColor: C.primaryFixed,
                    }}>
                      {state === 'done'
                        ? <MaterialCommunityIcons name="check" size={17} color="#fff" />
                        : <MaterialCommunityIcons name={idx === 2 ? 'fingerprint' : idx === 3 ? 'flask' : idx === 4 ? 'scale-balance' : idx === 5 ? 'calculator' : idx === 6 ? 'receipt-text' : idx === 7 ? 'bank' : 'door'} size={16} color={state === 'current' ? C.primaryFixed : C.onSurfaceVariant} />}
                    </View>
                    <Text style={{ fontSize: 9, fontWeight: state === 'current' ? '800' : '600', color: state === 'current' ? C.primary : C.onSurfaceVariant, textAlign: 'center', marginTop: 4 }} numberOfLines={2}>
                      {idx}. {s.title}
                    </Text>
                    {s.time ? <Text style={{ fontSize: 8, color: C.secondary }}>{s.time}</Text> : null}
                  </View>
                  {idx < 7 && <View style={{ width: 26, height: 3, borderRadius: 2, backgroundColor: state === 'done' ? C.secondary : C.surfaceContainerHighest, marginBottom: 26 }} />}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </Card>

      {/* assay */}
      <Card style={{ padding: 14, gap: 10 }}>
        <Text style={{ fontSize: 13.5, fontWeight: '800', color: C.onSurface }}>Lot Inspection Assay — Paddy (Grade-A / PR-126)</Text>
        <Text style={{ fontSize: 10.5, color: C.onSurfaceVariant }}>Declared Booking 40.00 Quintals</Text>
        <AssayBar label="Grain Moisture" value={P.assay.moisture} max={P.assay.moistureMax} pct={68} status="ACCEPTED" />
        <AssayBar label="Foreign Matter" value={P.assay.foreign} max={P.assay.foreignMax} pct={40} status="PASS" />
        <AssayBar label="Damaged Grains" value={P.assay.damaged} max={P.assay.damagedMax} pct={36} status="PASS" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          <Chip label="Inorganic Admix 0.1% (Norm 0.5%)" bg={C.surfaceContainerLow} fg={C.onSurfaceVariant} size={9} />
          <Chip label="Chalky 2.4% (Max 5%)" bg={C.surfaceContainerLow} fg={C.onSurfaceVariant} size={9} />
          <Chip label="Infestation: Zero/Clean" bg={C.surfaceContainerLow} fg={C.onSurfaceVariant} size={9} />
          <Chip label="Kernel Luster: Golden Amber" bg={C.surfaceContainerLow} fg={C.onSurfaceVariant} size={9} />
        </View>
        <View style={{ borderTopWidth: 1, borderStyle: 'dashed', borderColor: C.outlineVariant, paddingTop: 8 }}>
          <Text style={{ fontSize: 10.5, color: C.onSurfaceVariant, fontStyle: 'italic' }}>"Lot conforms to FAQ Grade-A specification across all mandated parameters."</Text>
          <Text style={{ fontSize: 10.5, fontWeight: '700', color: C.onSurface, marginTop: 3 }}>Gurvinder Singh (Inspector #AG-441) · <Text style={{ color: C.secondary }}>DIGITALLY SIGNED</Text></Text>
        </View>
        <Text style={{ fontSize: 10, color: C.onSurfaceVariant }}>Bagging: 80 Standard 50kg Jute Bags · Certified Type-II Mandi Sacks · Tare Deduction: Nil</Text>
      </Card>

      {/* weighbridge */}
      <Card style={{ padding: 14, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <PulseDot color={C.secondaryFixed} size={7} />
          <Text style={{ fontSize: 13.5, fontWeight: '800', color: C.onSurface, flex: 1 }}>Weighbridge Bay 1 (Avery Berkel)</Text>
          <Chip label="WB-2024-09 (Valid)" bg={C.surfaceContainerLow} fg={C.onSurfaceVariant} size={9} />
        </View>
        <View style={{ backgroundColor: C.inverseSurface, borderRadius: 12, padding: 12 }}>
          <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 1.2, color: C.inversePrimary, textAlign: 'center' }}>NABL CALIBRATED</Text>
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            <WBCol label="GROSS" value={P.weights.gross} sub="10:27 AM" />
            <WBCol label="TARE" value={P.weights.tare} sub="Swaraj 855 + Trolley" />
            <WBCol label="NET" value={P.weights.net} sub={`${P.weights.netQ} Quintals`} highlight />
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 10, color: C.onSurfaceVariant, flex: 1 }}>Declared match: 100% (0.00 kg drift)</Text>
          <Chip label="Re-poll Scale" bg={C.surfaceContainerHigh} fg={C.onSurface} icon="refresh" size={10} onPress={() => toast('Scale re-polled — readings confirmed', 'Weighbridge')} />
        </View>
      </Card>

      {/* MSP ledger */}
      <Card style={{ padding: 14, gap: 8 }}>
        <Text style={{ fontSize: 13.5, fontWeight: '800', color: C.onSurface }}>MSP Sanction Ledger</Text>
        <LedgerRow label="MSP Rate" value={`${P.ledger.msp} / Quintal`} />
        <LedgerRow label="Gross Value" value={P.ledger.gross} />
        <LedgerRow label="Deductions" value={`${P.ledger.deductions} (Zero Penalty)`} />
        <LedgerRow label="Cess" value={`${P.ledger.cess} (100% Subsidy)`} />
        <View style={{ borderTopWidth: 1, borderColor: C.surfaceContainerHigh, paddingTop: 8, marginTop: 2 }}>
          <LabelCaps>Net Farmer Disbursable</LabelCaps>
          <Text style={{ fontSize: 22, fontWeight: '800', color: C.primary }}>{P.ledger.net}</Text>
          <Text style={{ fontSize: 10, color: C.onSurfaceVariant, fontStyle: 'italic' }}>{P.ledger.words}</Text>
        </View>
        <View style={{ backgroundColor: C.surfaceContainerLow, borderRadius: 10, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MaterialCommunityIcons name="bank" size={17} color={C.primary} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.onSurface }}>{P.bank.name}</Text>
              <Chip label="NPCI MAPPED" bg={C.secondaryContainer} fg={C.onSecondaryContainer} size={8} />
            </View>
            <Text style={{ fontSize: 10.5, color: C.onSurfaceVariant }}>A/C: {P.bank.ac} • IFSC: {P.bank.ifsc}</Text>
          </View>
          <MaterialCommunityIcons name="verified" size={18} color={C.secondary} />
        </View>
      </Card>

      {/* action bar */}
      <Card style={{ padding: 14, gap: 10 }}>
        <TouchableOpacity onPress={() => setDbt(!dbt)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MaterialCommunityIcons name={dbt ? 'checkbox-marked' : 'checkbox-blank-outline'} size={20} color={C.primary} />
          <Text style={{ fontSize: 12.5, fontWeight: '700', color: C.onSurface }}>Direct PFMS DBT Trigger on Approval</Text>
        </TouchableOpacity>
        <RejectSelect value={reject} onChange={setReject} />
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Chip label="Joint Lab Review" bg={C.surfaceContainerHigh} fg={C.onSurface} icon="flask" size={10} onPress={() => toast('Joint lab review requested', 'Assay')} />
          <Chip label="Weighbridge Slip" bg={C.surfaceContainerHigh} fg={C.onSurface} icon="printer" size={10} onPress={() => toast('Printing weighbridge slip...', 'Print')} />
        </View>
        <TouchableOpacity
          onPress={() => setDone(true)}
          style={{ backgroundColor: C.primary, borderRadius: 12, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <MaterialCommunityIcons name="check-all" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>COMPLETE PROCUREMENT & GENERATE E-KAPAS/E-KHASRA</Text>
        </TouchableOpacity>
      </Card>

      {/* success modal */}
      <Modal visible={done} transparent animationType="fade" onRequestClose={() => setDone(false)}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.card}>
            <View style={{ width: 60, height: 60, borderRadius: 999, backgroundColor: C.primaryFixed, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }}>
              <MaterialCommunityIcons name="shield-check" size={30} color={C.primary} />
            </View>
            <Text style={{ fontSize: 17, fontWeight: '800', color: C.primary, textAlign: 'center', marginTop: 12 }}>Procurement Complete</Text>
            <Text style={{ fontSize: 12.5, fontWeight: '700', color: C.onSurface, textAlign: 'center' }}>Receipt #{P.receipt} Issued</Text>
            <Text style={{ fontSize: 11.5, color: C.onSurfaceVariant, textAlign: 'center', marginTop: 8, lineHeight: 17 }}>
              ₹87,320.00 queued into PFMS T+0 batch for direct Aadhaar-linked credit to {P.bank.name}.
            </Text>
            <View style={{ backgroundColor: C.surfaceContainerLow, borderRadius: 10, padding: 11, gap: 5, marginTop: 12 }}>
              <LedgerRow label="Quantity" value="40.00 Qtl (Grade-A Paddy)" />
              <LedgerRow label="FCI Allocation" value="Silo Bay 4 — Elevator Intake A" />
              <LedgerRow label="e-Kapas Hash" value="0x8a92f...44b2" />
            </View>
            <TouchableOpacity
              onPress={() => { setDone(false); toast('Loading next farmer from queue...', 'Next'); }}
              style={{ backgroundColor: C.primary, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 14 }}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12.5 }}>Print & Load Next Farmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function InfoPill({ icon, label, value }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.surfaceContainerLow, borderRadius: 10, padding: 9 }}>
      <LabelCaps>{label}</LabelCaps>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
        <MaterialCommunityIcons name={icon} size={13} color={C.primary} />
        <Text style={{ fontSize: 10.5, fontWeight: '600', color: C.onSurface, flex: 1 }}>{value}</Text>
      </View>
    </View>
  );
}

function AssayBar({ label, value, max, pct, status }) {
  const ok = status !== 'REJECT';
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 11.5, fontWeight: '600', color: C.onSurface, flex: 1 }}>{label}</Text>
        <Text style={{ fontSize: 12.5, fontWeight: '800', color: C.onSurface }}>{value}%</Text>
        <Chip label={status} bg={ok ? C.secondaryContainer : C.errorContainer} fg={ok ? C.onSecondaryContainer : C.onErrorContainer} size={8} style={{ marginLeft: 6 }} />
      </View>
      <Bar pct={pct} fill={ok ? C.secondaryFixed : C.error} />
      <Text style={{ fontSize: 9, color: C.onSurfaceVariant }}>Target ≤ {max}%</Text>
    </View>
  );
}

function WBCol({ label, value, sub, highlight }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', backgroundColor: highlight ? 'rgba(166,242,209,0.12)' : 'transparent', borderRadius: 10, paddingVertical: 8 }}>
      <LabelCaps color="#BEC9C2">{label}</LabelCaps>
      <Text style={{ fontSize: 15, fontWeight: '800', color: highlight ? C.primaryFixed : C.inverseOnSurface, marginTop: 3 }}>{value}</Text>
      <Text style={{ fontSize: 9, color: '#BEC9C2', marginTop: 2, textAlign: 'center' }}>{sub}</Text>
    </View>
  );
}

function LedgerRow({ label, value }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: 11.5, color: C.onSurfaceVariant }}>{label}</Text>
      <Text style={{ fontSize: 11.5, fontWeight: '700', color: C.onSurface }}>{value}</Text>
    </View>
  );
}

function RejectSelect({ value, onChange }) {
  const reasons = ['', 'Excess Moisture >17%', 'Foreign Matter >2.5%', 'Land Mismatch/Impersonation', 'Live Weevil/Contamination'];
  return (
    <View style={{ backgroundColor: C.surfaceContainerLow, borderRadius: 10, paddingHorizontal: 12, height: 44, justifyContent: 'center' }}>
      <Text style={{ fontSize: 12, color: C.onSurface }}>
        Reject Reason: <Text style={{ fontWeight: '700', color: value ? C.error : C.outline }}>{value || '— none —'}</Text>
      </Text>
      <View style={{ position: 'absolute', right: 10 }}>
        <MaterialCommunityIcons name="chevron-down" size={18} color={C.outline} />
      </View>
      {/* simple cycle-through since RN has no native select */}
      <TouchableOpacity style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        onPress={() => onChange(reasons[(reasons.indexOf(value) + 1) % reasons.length])} />
    </View>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(19,27,46,0.5)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, width: '100%', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, elevation: 10 },
});
