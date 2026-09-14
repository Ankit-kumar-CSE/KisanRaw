export function mapCentre(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    distanceKm: Number(row.distance_km),
    driveMins: row.drive_mins,
    waitingFarmers: row.waiting_farmers,
    waitMins: row.wait_mins,
    freePct: row.free_pct,
    hours: row.hours,
    bays: row.bays,
    crops: row.crops || [],
    status: row.status,
    recommended: !!row.recommended,
    mapPos: { x: Number(row.map_x), y: Number(row.map_y) },
  };
}

export function mapProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    mobile: row.mobile,
    role: row.role,
    name: row.name,
    farmerId: row.farmer_id,
    state: row.state,
    district: row.district,
    village: row.village,
    address: row.address,
    crops: row.crops || [],
    aadhaarLast4: row.aadhaar_last4,
    bankName: row.bank_name,
    bankLast4: row.bank_last4,
    ifsc: row.ifsc,
    vehicle: row.vehicle,
    updatedAt: row.updated_at,
  };
}

export function mapBooking(row) {
  if (!row) return null;
  return {
    bookingId: row.booking_id,
    token: row.token,
    tokenNum: row.token_num,
    farmer: row.farmer_name,
    profileId: row.profile_id,
    centreId: row.centre_id,
    centreName: row.centre_name,
    centreAddress: row.centre_address,
    crop: row.crop,
    quantity: Number(row.quantity),
    actualQuantity: row.actual_quantity == null ? undefined : Number(row.actual_quantity),
    qualityGrade: row.quality_grade || undefined,
    dateISO: row.date_iso,
    slotId: row.slot_id,
    slotLabel: row.slot_label,
    rate: Number(row.rate),
    status: row.status,
    totalAmount: row.total_amount == null ? undefined : Number(row.total_amount).toFixed(2),
    txnId: row.txn_id || undefined,
    createdAt: row.created_at,
    estProcessingMins: row.est_processing_mins,
    checkedInAt: row.checked_in_at || undefined,
  };
}

export function mapNotification(row) {
  return {
    id: row.id,
    category: row.category,
    text: row.text,
    at: new Date(row.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }),
    read: row.read,
    createdAt: row.created_at,
  };
}

export function bankLabel(profile) {
  const name = profile?.bank_name || 'Punjab National Bank';
  const last4 = profile?.bank_last4 || '4821';
  return `${name} •••• ${last4}`;
}
