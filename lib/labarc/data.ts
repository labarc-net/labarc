import type {
  AlertItem,
  Device,
  Equipment,
  EarlyWarning,
  Incident,
  Integration,
  InventoryItem,
  KnowledgeDoc,
  KpiSnapshot,
  MaintenanceRecord,
  QCPanel,
  StaffMember,
  TatMetric,
  TelemetrySeries,
  WorkflowStage,
} from './types'

/* ---------- deterministic pseudo-random (stable across SSR/CSR) ---------- */
function seeded(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

function series(
  key: string,
  label: string,
  unit: string,
  base: number,
  amp: number,
  drift: number,
  seed: number,
  status: TelemetrySeries['status'],
): TelemetrySeries {
  const rand = seeded(seed)
  const points = Array.from({ length: 48 }, (_, i) => {
    const trend = (drift / 100) * base * (i / 47)
    const noise = (rand() - 0.5) * amp
    const wave = Math.sin(i / 5) * amp * 0.4
    return {
      t: `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`,
      value: Number((base + trend + noise + wave).toFixed(2)),
    }
  })
  return { key, label, unit, drift, status, points }
}

/* ---------------------------------- Equipment --------------------------------- */
export const equipment: Equipment[] = [
  {
    id: 'eq-ch-02',
    name: 'Chemistry Analyzer 02',
    model: 'Cobas c503',
    manufacturer: 'Roche Diagnostics',
    serialNumber: 'RC-503-88214',
    department: 'Chemistry',
    location: 'Main Lab · Bench C2',
    status: 'watch',
    healthScore: 74,
    utilization: 87,
    failureRisk: 'high',
    installedOn: '2021-03-14',
    warrantyUntil: '2026-03-14',
    serviceProvider: 'Roche Field Service',
    nextMaintenance: 'in 12 days',
    lastMaintenance: '2026-07-19',
    downtimeHoursMonth: 3.2,
    errorCodes: [
      { code: 'E42', count: 3, lastSeen: '2h ago' },
      { code: 'W11', count: 1, lastSeen: '1d ago' },
    ],
    telemetry: [
      series('temp', 'Reaction Temp', '°C', 37, 0.6, 11, 11, 'watch'),
      series('vibration', 'Vibration', 'mm/s', 1.8, 0.5, 12, 22, 'at-risk'),
      series('power', 'Power Draw', 'W', 420, 18, 2, 33, 'healthy'),
      series('util', 'Utilization', '%', 82, 8, 6, 44, 'watch'),
    ],
    aiInsight: {
      summary:
        'Analyzer 02 is showing elevated failure risk within the next 7–14 days based on converging telemetry and QC signals.',
      signals: [
        { label: 'Reaction temperature', delta: '+11%', level: 'watch' },
        { label: 'Vibration amplitude', delta: '+12%', level: 'at-risk' },
        { label: 'Error E42 recurrence', delta: '3× in 24h', level: 'at-risk' },
        { label: 'QC CV drift', delta: '+6%', level: 'watch' },
        { label: 'Maintenance window', delta: 'due in 12d', level: 'info' },
      ],
      recommendation:
        'Inspect the probe assembly and cooling path per the approved maintenance SOP, then re-run QC before returning to production.',
      confidence: 0.78,
      source: 'Telemetry · QC history · Error log · SOP-CH-014',
    },
  },
  {
    id: 'eq-ch-01',
    name: 'Chemistry Analyzer 01',
    model: 'Cobas c503',
    manufacturer: 'Roche Diagnostics',
    serialNumber: 'RC-503-88190',
    department: 'Chemistry',
    location: 'Main Lab · Bench C1',
    status: 'operational',
    healthScore: 92,
    utilization: 79,
    failureRisk: 'low',
    installedOn: '2021-03-14',
    warrantyUntil: '2026-03-14',
    serviceProvider: 'Roche Field Service',
    nextMaintenance: 'in 34 days',
    lastMaintenance: '2026-08-02',
    downtimeHoursMonth: 0.4,
    errorCodes: [],
    telemetry: [
      series('temp', 'Reaction Temp', '°C', 37, 0.3, 1, 111, 'healthy'),
      series('vibration', 'Vibration', 'mm/s', 1.4, 0.3, 2, 122, 'healthy'),
      series('power', 'Power Draw', 'W', 410, 15, 1, 133, 'healthy'),
      series('util', 'Utilization', '%', 78, 7, 3, 144, 'healthy'),
    ],
    aiInsight: {
      summary: 'Analyzer 01 is operating within all expected parameters. No action required.',
      signals: [
        { label: 'All telemetry', delta: 'nominal', level: 'healthy' },
        { label: 'QC performance', delta: 'in control', level: 'healthy' },
      ],
      recommendation: 'Continue routine monitoring. Next preventive maintenance in 34 days.',
      confidence: 0.9,
      source: 'Telemetry · QC history',
    },
  },
  {
    id: 'eq-he-03',
    name: 'Hematology Analyzer 03',
    model: 'XN-1000',
    manufacturer: 'Sysmex',
    serialNumber: 'SX-XN-40122',
    department: 'Hematology',
    location: 'Main Lab · Bench H1',
    status: 'operational',
    healthScore: 88,
    utilization: 71,
    failureRisk: 'low',
    installedOn: '2022-06-01',
    warrantyUntil: '2027-06-01',
    serviceProvider: 'Sysmex Support',
    nextMaintenance: 'in 21 days',
    lastMaintenance: '2026-08-05',
    downtimeHoursMonth: 0.8,
    errorCodes: [{ code: 'A03', count: 1, lastSeen: '3d ago' }],
    telemetry: [
      series('temp', 'Flow Cell Temp', '°C', 41, 0.4, 3, 211, 'healthy'),
      series('vibration', 'Vibration', 'mm/s', 1.1, 0.3, 4, 222, 'healthy'),
      series('power', 'Power Draw', 'W', 380, 12, 1, 233, 'healthy'),
      series('util', 'Utilization', '%', 70, 9, 2, 244, 'healthy'),
    ],
    aiInsight: {
      summary: 'Hematology Analyzer 03 is healthy with stable throughput.',
      signals: [{ label: 'All telemetry', delta: 'nominal', level: 'healthy' }],
      recommendation: 'No action required.',
      confidence: 0.88,
      source: 'Telemetry',
    },
  },
  {
    id: 'eq-mi-01',
    name: 'Blood Culture System 01',
    model: 'BACT/ALERT VIRTUO',
    manufacturer: 'bioMérieux',
    serialNumber: 'BM-VIR-2210',
    department: 'Microbiology',
    location: 'Micro Lab · Room 2',
    status: 'at-risk',
    healthScore: 52,
    utilization: 64,
    failureRisk: 'high',
    installedOn: '2020-11-20',
    warrantyUntil: '2025-11-20',
    serviceProvider: 'bioMérieux Service',
    nextMaintenance: 'overdue 4 days',
    lastMaintenance: '2026-05-30',
    downtimeHoursMonth: 6.1,
    errorCodes: [
      { code: 'INCB-7', count: 5, lastSeen: '40m ago' },
      { code: 'DOOR-2', count: 2, lastSeen: '6h ago' },
    ],
    telemetry: [
      series('temp', 'Incubation Temp', '°C', 35, 0.8, 9, 311, 'at-risk'),
      series('vibration', 'Vibration', 'mm/s', 0.9, 0.4, 5, 322, 'watch'),
      series('power', 'Power Draw', 'W', 260, 20, 4, 333, 'watch'),
      series('util', 'Utilization', '%', 63, 10, 1, 344, 'healthy'),
    ],
    aiInsight: {
      summary:
        'Incubation temperature stability has degraded and maintenance is overdue. Sample integrity risk is elevated.',
      signals: [
        { label: 'Incubation temp variance', delta: '+9%', level: 'at-risk' },
        { label: 'Error INCB-7', delta: '5× in 24h', level: 'at-risk' },
        { label: 'Maintenance', delta: 'overdue 4d', level: 'critical' },
      ],
      recommendation:
        'Escalate to bioMérieux service. Verify door seal and incubation calibration per SOP-MI-006 before loading new bottles.',
      confidence: 0.71,
      source: 'Telemetry · Error log · SOP-MI-006',
    },
  },
  {
    id: 'eq-im-02',
    name: 'Immunoassay Analyzer 02',
    model: 'Atellica IM',
    manufacturer: 'Siemens Healthineers',
    serialNumber: 'SH-ATIM-5521',
    department: 'Immunology',
    location: 'Main Lab · Bench I2',
    status: 'operational',
    healthScore: 84,
    utilization: 68,
    failureRisk: 'moderate',
    installedOn: '2023-01-10',
    warrantyUntil: '2028-01-10',
    serviceProvider: 'Siemens Service',
    nextMaintenance: 'in 8 days',
    lastMaintenance: '2026-07-28',
    downtimeHoursMonth: 1.2,
    errorCodes: [{ code: 'C22', count: 2, lastSeen: '1d ago' }],
    telemetry: [
      series('temp', 'Reagent Temp', '°C', 8, 0.3, 4, 411, 'healthy'),
      series('vibration', 'Vibration', 'mm/s', 1.0, 0.3, 3, 422, 'healthy'),
      series('power', 'Power Draw', 'W', 350, 14, 2, 433, 'healthy'),
      series('util', 'Utilization', '%', 67, 8, 5, 444, 'watch'),
    ],
    aiInsight: {
      summary: 'Immunoassay Analyzer 02 is stable; utilization trending upward.',
      signals: [
        { label: 'Utilization', delta: '+5%', level: 'watch' },
        { label: 'Telemetry', delta: 'nominal', level: 'healthy' },
      ],
      recommendation: 'Monitor utilization; preventive maintenance scheduled in 8 days.',
      confidence: 0.82,
      source: 'Telemetry',
    },
  },
  {
    id: 'eq-mo-01',
    name: 'PCR System 01',
    model: 'cobas 6800',
    manufacturer: 'Roche Diagnostics',
    serialNumber: 'RC-6800-3312',
    department: 'Molecular',
    location: 'Molecular Lab · Room 4',
    status: 'operational',
    healthScore: 95,
    utilization: 58,
    failureRisk: 'low',
    installedOn: '2024-02-18',
    warrantyUntil: '2029-02-18',
    serviceProvider: 'Roche Field Service',
    nextMaintenance: 'in 47 days',
    lastMaintenance: '2026-08-10',
    downtimeHoursMonth: 0.1,
    errorCodes: [],
    telemetry: [
      series('temp', 'Thermocycler Temp', '°C', 95, 1.2, 1, 511, 'healthy'),
      series('vibration', 'Vibration', 'mm/s', 0.6, 0.2, 1, 522, 'healthy'),
      series('power', 'Power Draw', 'W', 520, 22, 1, 533, 'healthy'),
      series('util', 'Utilization', '%', 57, 11, 2, 544, 'healthy'),
    ],
    aiInsight: {
      summary: 'PCR System 01 is in excellent condition.',
      signals: [{ label: 'All telemetry', delta: 'nominal', level: 'healthy' }],
      recommendation: 'No action required.',
      confidence: 0.94,
      source: 'Telemetry',
    },
  },
  {
    id: 'eq-fr-03',
    name: 'Refrigerator 03',
    model: 'MPR-722R',
    manufacturer: 'PHCbi',
    serialNumber: 'PH-722-1092',
    department: 'Sample Processing',
    location: 'Cold Storage · Aisle B',
    status: 'critical',
    healthScore: 38,
    utilization: 90,
    failureRisk: 'critical',
    installedOn: '2019-09-02',
    warrantyUntil: '2024-09-02',
    serviceProvider: 'Facilities · HVAC',
    nextMaintenance: 'in 3 days',
    lastMaintenance: '2026-06-15',
    downtimeHoursMonth: 2.4,
    errorCodes: [{ code: 'TEMP-HI', count: 8, lastSeen: '9m ago' }],
    telemetry: [
      series('temp', 'Chamber Temp', '°C', 4.4, 0.7, 32, 611, 'critical'),
      series('door', 'Door Openings', '/hr', 6, 2, 15, 622, 'watch'),
      series('power', 'Compressor Load', '%', 62, 10, 18, 633, 'at-risk'),
      series('humidity', 'Humidity', '%', 40, 4, 6, 644, 'healthy'),
    ],
    aiInsight: {
      summary:
        'Refrigerator 03 chamber temperature is drifting upward and has crossed the 6°C soft limit. Reagent and sample integrity at risk.',
      signals: [
        { label: 'Chamber temperature', delta: '+32%', level: 'critical' },
        { label: 'Compressor load', delta: '+18%', level: 'at-risk' },
        { label: 'TEMP-HI events', delta: '8× today', level: 'critical' },
      ],
      recommendation:
        'Relocate temperature-sensitive reagents immediately and dispatch HVAC. Log an environmental excursion per SOP-QA-003.',
      confidence: 0.85,
      source: 'Sensor gateway · Environmental log · SOP-QA-003',
    },
  },
]

/* --------------------------------- Maintenance -------------------------------- */
export const maintenance: MaintenanceRecord[] = [
  { id: 'mx-1', equipmentId: 'eq-fr-03', equipmentName: 'Refrigerator 03', type: 'Corrective', scheduledFor: 'Aug 28, 2026', status: 'scheduled', technician: 'HVAC · M. Osei', notes: 'Compressor inspection following temperature excursions.' },
  { id: 'mx-2', equipmentId: 'eq-mi-01', equipmentName: 'Blood Culture System 01', type: 'Preventive', scheduledFor: 'Aug 21, 2026', status: 'overdue', technician: 'bioMérieux Service', notes: 'Quarterly PM overdue by 4 days.' },
  { id: 'mx-3', equipmentId: 'eq-ch-02', equipmentName: 'Chemistry Analyzer 02', type: 'Preventive', scheduledFor: 'Sep 06, 2026', status: 'scheduled', technician: 'Roche Field Service', notes: 'Probe assembly + cooling path service.' },
  { id: 'mx-4', equipmentId: 'eq-im-02', equipmentName: 'Immunoassay Analyzer 02', type: 'Calibration', scheduledFor: 'Sep 02, 2026', status: 'scheduled', technician: 'K. Adeyemi', notes: 'Multi-analyte calibration verification.' },
  { id: 'mx-5', equipmentId: 'eq-he-03', equipmentName: 'Hematology Analyzer 03', type: 'Inspection', scheduledFor: 'Aug 25, 2026', status: 'in-progress', technician: 'L. Wang', durationHours: 1.5, notes: 'Aperture and flow-cell inspection.' },
  { id: 'mx-6', equipmentId: 'eq-ch-01', equipmentName: 'Chemistry Analyzer 01', type: 'Preventive', scheduledFor: 'Aug 02, 2026', status: 'completed', technician: 'Roche Field Service', durationHours: 2.2, notes: 'Quarterly PM completed. QC verified.' },
  { id: 'mx-7', equipmentId: 'eq-mo-01', equipmentName: 'PCR System 01', type: 'Preventive', scheduledFor: 'Aug 10, 2026', status: 'completed', technician: 'Roche Field Service', durationHours: 1.8, notes: 'Optical block cleaning completed.' },
]

/* ---------------------------------- Incidents --------------------------------- */
export const incidents: Incident[] = [
  {
    id: 'inc-1',
    ref: 'INC-2026-0148',
    title: 'Chemistry Analyzer 02 repeated QC failures on Glucose',
    type: 'QC Failure',
    department: 'Chemistry',
    equipmentId: 'eq-ch-02',
    equipmentName: 'Chemistry Analyzer 02',
    severity: 'high',
    status: 'investigating',
    reporter: 'A. Bello (MLS)',
    owner: 'Quality Manager',
    reportedAt: 'Aug 25, 2026 · 07:42',
    dueDate: 'Aug 28, 2026',
    description:
      'Level 2 glucose QC exceeded 2SD on three consecutive runs. Patient results held pending investigation.',
    immediateAction: 'Placed analyte on hold, switched Glucose to Analyzer 01, notified supervisor.',
    rootCauses: ['Reagent lot change (LOT G-2291)', 'Analyzer calibration drift', 'Reaction temperature instability'],
    correctiveAction: 'Recalibrate glucose channel; verify reagent lot against retained control.',
    preventiveAction: 'Add reagent-lot cross-check to changeover checklist.',
    timeline: [
      { at: '07:42', actor: 'A. Bello', event: 'Incident reported' },
      { at: '07:55', actor: 'System', event: 'Patient results auto-held' },
      { at: '08:10', actor: 'Quality Manager', event: 'Assigned + investigation opened' },
      { at: '09:20', actor: 'LabArc AI', event: 'Similar incidents surfaced' },
    ],
    aiSimilar: [
      { ref: 'INC-2025-0921', title: 'Glucose QC drift after reagent lot change', similarity: 0.91, cause: 'Reagent-lot instability' },
      { ref: 'INC-2025-0644', title: 'Calibration drift on c503', similarity: 0.77, cause: 'Calibration drift' },
      { ref: 'INC-2024-1180', title: 'Temperature instability affecting enzymatic assay', similarity: 0.69, cause: 'Reaction temp' },
    ],
  },
  {
    id: 'inc-2',
    ref: 'INC-2026-0147',
    title: 'Refrigerator 03 temperature excursion',
    type: 'Environmental',
    department: 'Sample Processing',
    equipmentId: 'eq-fr-03',
    equipmentName: 'Refrigerator 03',
    severity: 'critical',
    status: 'open',
    reporter: 'LabArc Sensor Gateway',
    owner: 'Lab Manager',
    reportedAt: 'Aug 25, 2026 · 06:10',
    dueDate: 'Aug 25, 2026',
    description: 'Chamber temperature crossed 6°C for >15 minutes. Auto-generated from environmental monitoring.',
    immediateAction: 'Reagents flagged for integrity review; HVAC notified.',
    rootCauses: ['Compressor degradation', 'Ambient load / door usage'],
    correctiveAction: 'Dispatch HVAC; relocate sensitive reagents.',
    preventiveAction: 'Schedule compressor replacement; add door-open alerting.',
    timeline: [
      { at: '06:10', actor: 'Sensor Gateway', event: 'Excursion detected + alert raised' },
      { at: '06:12', actor: 'System', event: 'Incident auto-created' },
    ],
    aiSimilar: [
      { ref: 'INC-2025-0402', title: 'Cold storage excursion — compressor', similarity: 0.88, cause: 'Compressor failure' },
    ],
  },
  {
    id: 'inc-3',
    ref: 'INC-2026-0145',
    title: 'Sample mislabeling at registration',
    type: 'Pre-analytical',
    department: 'Sample Processing',
    severity: 'moderate',
    status: 'capa',
    reporter: 'C. Mensah (Technician)',
    owner: 'Supervisor',
    reportedAt: 'Aug 24, 2026 · 14:20',
    dueDate: 'Aug 30, 2026',
    description: 'Two samples received with transposed accession labels; caught at analysis.',
    immediateAction: 'Samples quarantined, re-collection requested.',
    rootCauses: ['Manual labeling under high workload'],
    correctiveAction: 'Retrain registration staff on barcode workflow.',
    preventiveAction: 'Enforce barcode-scan validation at registration.',
    timeline: [
      { at: '14:20', actor: 'C. Mensah', event: 'Incident reported' },
      { at: '15:00', actor: 'Supervisor', event: 'CAPA opened' },
    ],
    aiSimilar: [],
  },
  {
    id: 'inc-4',
    ref: 'INC-2026-0140',
    title: 'Immunoassay carryover suspected',
    type: 'Analytical',
    department: 'Immunology',
    equipmentId: 'eq-im-02',
    equipmentName: 'Immunoassay Analyzer 02',
    severity: 'low',
    status: 'resolved',
    reporter: 'R. Okonkwo (MLS)',
    owner: 'Quality Manager',
    reportedAt: 'Aug 22, 2026 · 11:05',
    dueDate: 'Aug 26, 2026',
    description: 'Possible carryover on high-concentration troponin samples.',
    immediateAction: 'Ran carryover verification protocol.',
    rootCauses: ['No carryover confirmed — within spec'],
    correctiveAction: 'None required.',
    preventiveAction: 'Documented verification for audit trail.',
    timeline: [
      { at: '11:05', actor: 'R. Okonkwo', event: 'Reported' },
      { at: '16:40', actor: 'Quality Manager', event: 'Resolved — no carryover' },
    ],
    aiSimilar: [],
  },
]

/* --------------------------------- Inventory ---------------------------------- */
export const inventory: InventoryItem[] = [
  { id: 'inv-1', name: 'Glucose Reagent (Gluc3)', category: 'Reagent', department: 'Chemistry', lot: 'G-2291', stock: 340, unit: 'tests', reorderLevel: 500, dailyConsumption: 54, leadTimeDays: 9, expiry: 'Dec 2026', supplier: 'Roche', status: 'stockout-risk', projectedStockoutDays: 6, consumptionTrend: [48, 51, 49, 55, 52, 58, 54] },
  { id: 'inv-2', name: 'CBC Reagent Pack', category: 'Reagent', department: 'Hematology', lot: 'H-8841', stock: 1180, unit: 'tests', reorderLevel: 600, dailyConsumption: 70, leadTimeDays: 7, expiry: 'Mar 2027', supplier: 'Sysmex', status: 'ok', projectedStockoutDays: 17, consumptionTrend: [66, 68, 71, 69, 72, 70, 70] },
  { id: 'inv-3', name: 'Level 2 QC Control — Chemistry', category: 'Control', department: 'Chemistry', lot: 'QC-C-556', stock: 24, unit: 'vials', reorderLevel: 30, dailyConsumption: 3, leadTimeDays: 12, expiry: 'Sep 2026', supplier: 'Bio-Rad', status: 'expiring', projectedStockoutDays: 8, consumptionTrend: [3, 2, 3, 3, 4, 3, 3] },
  { id: 'inv-4', name: 'Blood Culture Bottles (Aerobic)', category: 'Consumable', department: 'Microbiology', lot: 'BC-1121', stock: 210, unit: 'bottles', reorderLevel: 250, dailyConsumption: 22, leadTimeDays: 10, expiry: 'Jan 2027', supplier: 'bioMérieux', status: 'reorder', projectedStockoutDays: 9, consumptionTrend: [20, 24, 21, 23, 22, 25, 22] },
  { id: 'inv-5', name: 'Pipette Tips 1000µL', category: 'Consumable', department: 'Molecular', lot: 'PT-9007', stock: 8400, unit: 'tips', reorderLevel: 3000, dailyConsumption: 420, leadTimeDays: 5, expiry: '—', supplier: 'Eppendorf', status: 'ok', projectedStockoutDays: 20, consumptionTrend: [400, 410, 430, 420, 415, 425, 420] },
  { id: 'inv-6', name: 'Nitrile Gloves (M)', category: 'PPE', department: 'Sample Processing', lot: 'NG-3320', stock: 46, unit: 'boxes', reorderLevel: 60, dailyConsumption: 8, leadTimeDays: 6, expiry: '—', supplier: 'Medline', status: 'low', projectedStockoutDays: 6, consumptionTrend: [7, 8, 9, 8, 8, 9, 8] },
  { id: 'inv-7', name: 'Cobas Probe Assembly', category: 'Spare Part', department: 'Chemistry', lot: 'SP-c503-01', stock: 1, unit: 'units', reorderLevel: 2, dailyConsumption: 0, leadTimeDays: 21, expiry: '—', supplier: 'Roche', status: 'low', projectedStockoutDays: 0, consumptionTrend: [0, 0, 0, 0, 0, 0, 0] },
]

/* ------------------------------------ QC -------------------------------------- */
function ljPoints(mean: number, sd: number, seed: number, drift = 0) {
  const rand = seeded(seed)
  return Array.from({ length: 24 }, (_, n) => ({
    n: n + 1,
    value: Number((mean + (rand() - 0.5) * sd * 2.2 + (drift * sd * n) / 24).toFixed(2)),
  }))
}

export const qcPanels: QCPanel[] = [
  { id: 'qc-1', analyte: 'Glucose', level: 'Level 2', department: 'Chemistry', instrument: 'Chemistry Analyzer 02', mean: 5.6, sd: 0.12, cv: 2.1, target: 5.6, unit: 'mmol/L', status: 'watch', trend: 'drifting-up', risk: 'moderate', westgardFlags: ['2-2s trend'], points: ljPoints(5.6, 0.12, 71, 1.2), recommendation: 'QC is within limits but drifting upward. Review recent calibration and reagent lot G-2291 before results release.' },
  { id: 'qc-2', analyte: 'Sodium', level: 'Level 1', department: 'Chemistry', instrument: 'Chemistry Analyzer 01', mean: 140, sd: 1.1, cv: 0.8, target: 140, unit: 'mmol/L', status: 'healthy', trend: 'stable', risk: 'low', westgardFlags: [], points: ljPoints(140, 1.1, 72), recommendation: 'In control. No action required.' },
  { id: 'qc-3', analyte: 'Hemoglobin', level: 'Level 2', department: 'Hematology', instrument: 'Hematology Analyzer 03', mean: 12.4, sd: 0.2, cv: 1.6, target: 12.4, unit: 'g/dL', status: 'healthy', trend: 'stable', risk: 'low', westgardFlags: [], points: ljPoints(12.4, 0.2, 73), recommendation: 'In control. No action required.' },
  { id: 'qc-4', analyte: 'Troponin I', level: 'Level 1', department: 'Immunology', instrument: 'Immunoassay Analyzer 02', mean: 0.04, sd: 0.004, cv: 3.4, target: 0.04, unit: 'ng/mL', status: 'at-risk', trend: 'drifting-down', risk: 'high', westgardFlags: ['R-4s', 'CV↑'], points: ljPoints(0.04, 0.004, 74, -1.6), recommendation: 'Increasing CV with a downward shift. Verify reagent temperature and recalibrate before reporting.' },
  { id: 'qc-5', analyte: 'CRP', level: 'Level 2', department: 'Immunology', instrument: 'Immunoassay Analyzer 02', mean: 8.0, sd: 0.3, cv: 3.8, target: 8.0, unit: 'mg/L', status: 'healthy', trend: 'stable', risk: 'low', westgardFlags: [], points: ljPoints(8.0, 0.3, 75), recommendation: 'In control.' },
]

/* ---------------------------------- Workforce --------------------------------- */
export const staff: StaffMember[] = [
  { id: 'st-1', name: 'Adaeze Okafor', role: 'Medical Laboratory Scientist', department: 'Chemistry', shift: 'Day', capacity: 92, assignedTasks: 16, pendingTasks: 5, overdueTasks: 2, status: 'at-risk', competencies: ['Chemistry', 'QC', 'Calibration'], available: true },
  { id: 'st-2', name: 'John Adeyemi', role: 'Supervisor', department: 'Hematology', shift: 'Day', capacity: 74, assignedTasks: 11, pendingTasks: 2, overdueTasks: 0, status: 'watch', competencies: ['Hematology', 'Supervision', 'Validation'], available: true },
  { id: 'st-3', name: 'Chidera Nwosu', role: 'Technician', department: 'Sample Processing', shift: 'Day', capacity: 58, assignedTasks: 9, pendingTasks: 1, overdueTasks: 0, status: 'healthy', competencies: ['Registration', 'Centrifugation'], available: true },
  { id: 'st-4', name: 'Grace Mensah', role: 'Medical Laboratory Scientist', department: 'Microbiology', shift: 'Day', capacity: 81, assignedTasks: 13, pendingTasks: 4, overdueTasks: 1, status: 'watch', competencies: ['Microbiology', 'Culture', 'AST'], available: true },
  { id: 'st-5', name: 'Kwame Boateng', role: 'Biomedical Engineer', department: 'Chemistry', shift: 'Day', capacity: 45, assignedTasks: 6, pendingTasks: 0, overdueTasks: 0, status: 'healthy', competencies: ['Instruments', 'Maintenance'], available: true },
  { id: 'st-6', name: 'Fatima Sule', role: 'Medical Laboratory Scientist', department: 'Immunology', shift: 'Evening', capacity: 63, assignedTasks: 8, pendingTasks: 2, overdueTasks: 0, status: 'healthy', competencies: ['Immunoassay', 'QC'], available: false },
]

/* ------------------------------------ TAT ------------------------------------- */
function tatHistory(base: number, seed: number, predictedRise = 0) {
  const rand = seeded(seed)
  return Array.from({ length: 12 }, (_, i) => {
    const v = Math.round(base + (rand() - 0.5) * 14)
    const point: { t: string; tat: number; predicted?: number } = { t: `${8 + i}:00`, tat: v }
    if (i >= 9 && predictedRise) point.predicted = Math.round(v + predictedRise * (i - 8))
    return point
  })
}

export const tatMetrics: TatMetric[] = [
  { department: 'Chemistry', currentMinutes: 102, targetMinutes: 120, queue: 27, capacityPct: 83, predictedBreachMinutes: 48, recommendation: 'Move one qualified staff member to Chemistry to prevent a TAT breach.', history: tatHistory(100, 81, 8) },
  { department: 'Hematology', currentMinutes: 54, targetMinutes: 90, queue: 12, capacityPct: 61, predictedBreachMinutes: null, recommendation: 'Within target. No action required.', history: tatHistory(56, 82) },
  { department: 'Microbiology', currentMinutes: 1420, targetMinutes: 2880, queue: 34, capacityPct: 70, predictedBreachMinutes: null, recommendation: 'Within target for culture workflow.', history: tatHistory(1400, 83) },
  { department: 'Immunology', currentMinutes: 88, targetMinutes: 90, queue: 19, capacityPct: 88, predictedBreachMinutes: 22, recommendation: 'Approaching target. Prioritize STAT troponin queue.', history: tatHistory(84, 84, 6) },
]

/* --------------------------------- Workflow ----------------------------------- */
export const workflowStages: WorkflowStage[] = [
  { key: 'received', label: 'Received', count: 148, avgWaitMinutes: 4, status: 'healthy' },
  { key: 'registration', label: 'Registration', count: 32, avgWaitMinutes: 7, status: 'healthy' },
  { key: 'processing', label: 'Processing', count: 41, avgWaitMinutes: 12, status: 'watch' },
  { key: 'analysis', label: 'Analysis', count: 58, avgWaitMinutes: 26, status: 'at-risk' },
  { key: 'qc', label: 'QC Verification', count: 15, avgWaitMinutes: 9, status: 'watch' },
  { key: 'validation', label: 'Validation', count: 22, avgWaitMinutes: 14, status: 'healthy' },
  { key: 'reported', label: 'Reported', count: 402, avgWaitMinutes: 0, status: 'healthy' },
]

/* ---------------------------------- Alerts ------------------------------------ */
export const alerts: AlertItem[] = [
  { id: 'al-1', category: 'environmental', severity: 'critical', title: 'Refrigerator 03 temperature excursion', detail: 'Chamber crossed 6.0°C for >15 min', entity: 'Refrigerator 03', at: '9m ago', read: false, acknowledged: false },
  { id: 'al-2', category: 'equipment', severity: 'high', title: 'Analyzer 02 elevated failure risk', detail: 'Vibration +12%, recurring E42, QC drift', entity: 'Chemistry Analyzer 02', at: '32m ago', read: false, acknowledged: false },
  { id: 'al-3', category: 'tat', severity: 'high', title: 'Chemistry TAT breach predicted', detail: 'Target likely exceeded in 48 minutes', entity: 'Chemistry', at: '40m ago', read: false, acknowledged: false },
  { id: 'al-4', category: 'inventory', severity: 'moderate', title: 'Glucose reagent stockout risk', detail: 'Projected stockout in 6 days (lead time 9d)', entity: 'Glucose Reagent', at: '1h ago', read: true, acknowledged: false },
  { id: 'al-5', category: 'qc', severity: 'moderate', title: 'Troponin I QC drifting', detail: 'CV increasing, downward shift on Level 1', entity: 'Immunoassay Analyzer 02', at: '2h ago', read: true, acknowledged: true },
  { id: 'al-6', category: 'maintenance', severity: 'moderate', title: 'Blood Culture System PM overdue', detail: 'Preventive maintenance overdue by 4 days', entity: 'Blood Culture System 01', at: '5h ago', read: true, acknowledged: false },
  { id: 'al-7', category: 'power', severity: 'low', title: 'Grid-to-generator transition', detail: 'Clean transition, 0.4s, no equipment impact', entity: 'Main Lab', at: '8h ago', read: true, acknowledged: true },
]

/* --------------------------------- Devices ------------------------------------ */
export const devices: Device[] = [
  { id: 'dv-1', name: 'Temperature Sensor 03', sensorType: 'Temperature', connectedTo: 'Refrigerator 03', reading: '6.2 °C', status: 'critical', lastSeen: '9s ago', battery: 71, connectivity: 'Gateway' },
  { id: 'dv-2', name: 'Vibration Sensor C2', sensorType: 'Vibration', connectedTo: 'Chemistry Analyzer 02', reading: '2.0 mm/s', status: 'at-risk', lastSeen: '4s ago', battery: 88, connectivity: 'MQTT' },
  { id: 'dv-3', name: 'Room Climate 01', sensorType: 'Temp + Humidity', connectedTo: 'Main Lab', reading: '22.4 °C · 44%', status: 'healthy', lastSeen: '11s ago', battery: 95, connectivity: 'MQTT' },
  { id: 'dv-4', name: 'Power Monitor A', sensorType: 'Power Quality', connectedTo: 'Main Distribution', reading: '231 V · stable', status: 'healthy', lastSeen: '2s ago', battery: 100, connectivity: 'Modbus' },
  { id: 'dv-5', name: 'Freezer Sensor 01', sensorType: 'Temperature', connectedTo: 'Freezer 01 (-20°C)', reading: '-19.6 °C', status: 'healthy', lastSeen: '15s ago', battery: 62, connectivity: 'Gateway' },
  { id: 'dv-6', name: 'Door Sensor · Cold Storage', sensorType: 'Door State', connectedTo: 'Cold Storage', reading: 'Closed', status: 'healthy', lastSeen: '1m ago', battery: 40, connectivity: 'Gateway' },
]

/* ------------------------------- Integrations --------------------------------- */
export const integrations: Integration[] = [
  { id: 'ig-1', name: 'Hospital EMR', kind: 'FHIR', vendor: 'Epic', status: 'connected', lastSync: '2m ago', messages24h: 4820, direction: 'bidirectional' },
  { id: 'ig-2', name: 'Core LIS', kind: 'HL7', vendor: 'Cerner Millennium', status: 'connected', lastSync: '30s ago', messages24h: 12440, direction: 'bidirectional' },
  { id: 'ig-3', name: 'Chemistry Analyzers', kind: 'ASTM', vendor: 'Roche', status: 'connected', lastSync: '5s ago', messages24h: 3210, direction: 'inbound' },
  { id: 'ig-4', name: 'Sensor Gateway', kind: 'MQTT', vendor: 'LabArc Edge', status: 'connected', lastSync: 'live', messages24h: 86400, direction: 'inbound' },
  { id: 'ig-5', name: 'Reference Lab', kind: 'REST', vendor: 'Regional Reference', status: 'attention', lastSync: '3h ago', messages24h: 92, direction: 'outbound' },
  { id: 'ig-6', name: 'Legacy Micro LIMS', kind: 'ASTM', vendor: 'In-house', status: 'disconnected', lastSync: '2d ago', messages24h: 0, direction: 'inbound' },
]

/* --------------------------------- Knowledge ---------------------------------- */
export const knowledgeDocs: KnowledgeDoc[] = [
  { id: 'kb-1', title: 'Chemistry Analyzer Probe Maintenance', type: 'SOP', department: 'Chemistry', version: 'v4.2', updatedAt: 'Aug 12, 2026', status: 'approved', author: 'K. Boateng' },
  { id: 'kb-2', title: 'Cobas c503 Service Manual', type: 'Manual', department: 'Chemistry', version: 'Rev C', updatedAt: 'Feb 03, 2026', status: 'approved', author: 'Roche' },
  { id: 'kb-3', title: 'QC Failure Investigation Procedure', type: 'SOP', department: 'Quality', version: 'v2.0', updatedAt: 'Jul 28, 2026', status: 'approved', author: 'Quality Office' },
  { id: 'kb-4', title: 'Environmental Excursion Response', type: 'SOP', department: 'Quality', version: 'v1.6', updatedAt: 'Jun 15, 2026', status: 'approved', author: 'Quality Office' },
  { id: 'kb-5', title: 'Blood Culture Troubleshooting Guide', type: 'Troubleshooting', department: 'Microbiology', version: 'v1.1', updatedAt: 'May 30, 2026', status: 'under-review', author: 'bioMérieux' },
  { id: 'kb-6', title: 'New Analyst Onboarding — Hematology', type: 'Training', department: 'Hematology', version: 'v3.0', updatedAt: 'Apr 10, 2026', status: 'approved', author: 'J. Adeyemi' },
]

/* ------------------------------ Early Warnings -------------------------------- */
export const earlyWarnings: EarlyWarning[] = [
  { id: 'ew-1', severity: 'critical', entity: 'Refrigerator 03', category: 'environmental', message: 'Temperature drifting upward', detail: 'Chamber at 6.2°C and rising — reagent integrity at risk.', eta: 'Active now', confidence: 0.85, href: '/equipment/eq-fr-03' },
  { id: 'ew-2', severity: 'high', entity: 'Chemistry Analyzer 02', category: 'equipment', message: 'Elevated failure risk', detail: 'Vibration +12%, recurring E42, QC drift converging.', eta: '7–14 days', confidence: 0.78, href: '/equipment/eq-ch-02' },
  { id: 'ew-3', severity: 'high', entity: 'Chemistry', category: 'tat', message: 'TAT breach predicted', detail: 'Target likely to be exceeded within the hour at current load.', eta: '48 min', confidence: 0.74, href: '/tat' },
  { id: 'ew-4', severity: 'moderate', entity: 'Glucose Reagent', category: 'inventory', message: 'Projected stockout', detail: 'Consumption up 8%; lead time 9 days exceeds cover.', eta: '6 days', confidence: 0.8, href: '/inventory' },
  { id: 'ew-5', severity: 'moderate', entity: 'Chemistry workload', category: 'tat', message: 'Workload above capacity', detail: "Tomorrow's Chemistry volume expected +18% vs normal.", eta: 'Tomorrow', confidence: 0.68, href: '/workforce' },
]

/* ------------------------------- KPI snapshot --------------------------------- */
export const kpiSnapshot: KpiSnapshot = {
  workload: { value: 386, delta: 12 },
  pending: { value: 168, delta: 9 },
  avgTatMinutes: { value: 96, delta: -4 },
  equipmentAvailability: { value: 92.4, delta: -1.2 },
  activeIncidents: { value: 3, delta: 1 },
  qcPassRate: { value: 97.8, delta: -0.6 },
}

/* -------------------------- Department workload ------------------------------- */
export const departmentWorkload = [
  { department: 'Chemistry', workload: 148, capacity: 170 },
  { department: 'Hematology', workload: 96, capacity: 160 },
  { department: 'Immunology', workload: 74, capacity: 90 },
  { department: 'Microbiology', workload: 48, capacity: 80 },
  { department: 'Molecular', workload: 20, capacity: 60 },
]

/* -------------------------- Environmental readings ---------------------------- */
export const environmental = [
  { id: 'env-1', name: 'Refrigerator 03', reading: 6.2, unit: '°C', target: '2–6°C', status: 'critical' as const, trend: [2.8, 4.1, 5.2, 6.0, 6.2] },
  { id: 'env-2', name: 'Freezer 01', reading: -19.6, unit: '°C', target: '-25 to -15°C', status: 'healthy' as const, trend: [-20.1, -19.9, -19.8, -19.7, -19.6] },
  { id: 'env-3', name: 'Main Lab Room', reading: 22.4, unit: '°C', target: '18–24°C', status: 'healthy' as const, trend: [22.0, 22.1, 22.3, 22.4, 22.4] },
  { id: 'env-4', name: 'Reagent Store Humidity', reading: 44, unit: '%', target: '30–50%', status: 'healthy' as const, trend: [42, 43, 44, 44, 44] },
]
