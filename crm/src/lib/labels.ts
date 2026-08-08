export const bloodGroupLabels: Record<string, string> = {
  A_POS: "A+",
  A_NEG: "A-",
  B_POS: "B+",
  B_NEG: "B-",
  AB_POS: "AB+",
  AB_NEG: "AB-",
  O_POS: "O+",
  O_NEG: "O-",
  UNKNOWN: "Unknown",
}

export const genderLabels: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
}

export const maritalStatusLabels: Record<string, string> = {
  SINGLE: "Single",
  MARRIED: "Married",
  DIVORCED: "Divorced",
  WIDOWED: "Widowed",
  UNKNOWN: "Unknown",
}

export const patientStatusLabels: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  DECEASED: "Deceased",
}

export const appointmentStatusLabels: Record<string, string> = {
  SCHEDULED: "Scheduled",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked In",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No Show",
  RESCHEDULED: "Rescheduled",
}

export const appointmentStatusColors: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  CONFIRMED: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  CHECKED_IN: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  IN_PROGRESS: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  NO_SHOW: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  RESCHEDULED: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
}

export const appointmentTypeLabels: Record<string, string> = {
  IN_PERSON: "In Person",
  VIDEO: "Video Consultation",
  WALK_IN: "Walk-in",
}

export const documentCategoryLabels: Record<string, string> = {
  ID_PROOF: "ID Proof",
  INSURANCE: "Insurance",
  LAB_REPORT: "Lab Report",
  PRESCRIPTION: "Prescription",
  DISCHARGE_SUMMARY: "Discharge Summary",
  CONSENT_FORM: "Consent Form",
  IMAGING: "Imaging",
  OTHER: "Other",
}

export const commChannelLabels: Record<string, string> = {
  SMS: "SMS",
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  CALL: "Call",
  SYSTEM: "System",
}

export const alertSeverityLabels: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
}

export const alertSeverityColors: Record<string, string> = {
  LOW: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  MEDIUM: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
}

export const followUpStatusLabels: Record<string, string> = {
  PENDING: "Pending",
  DONE: "Done",
  MISSED: "Missed",
  CANCELLED: "Cancelled",
}

export const billStatusLabels: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  PARTIALLY_PAID: "Partially Paid",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
}

export const billStatusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  PAID: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  PARTIALLY_PAID: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  CANCELLED: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  REFUNDED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
}

export const billTypeLabels: Record<string, string> = {
  OPD: "OP Billing",
  IPD: "IP Billing",
  EMERGENCY: "Emergency Billing",
  LAB: "Lab Billing",
  RADIOLOGY: "Radiology Billing",
  PHARMACY: "Pharmacy Billing",
}

export const payerTypeLabels: Record<string, string> = {
  SELF: "Self Pay",
  INSURANCE: "Insurance",
  CORPORATE: "Corporate",
}

export const paymentMethodLabels: Record<string, string> = {
  CASH: "Cash",
  CARD: "Card",
  UPI: "UPI",
  NET_BANKING: "Net Banking",
  INSURANCE: "Insurance",
  WALLET: "Wallet",
  ADVANCE: "Advance Balance",
}

export const claimStatusLabels: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  PARTIALLY_APPROVED: "Partially Approved",
  REJECTED: "Rejected",
  SETTLED: "Settled",
}

export const claimStatusColors: Record<string, string> = {
  DRAFT: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  SUBMITTED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  PARTIALLY_APPROVED: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  SETTLED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
}

export const refundStatusLabels: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  COMPLETED: "Completed",
}

export const refundStatusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  APPROVED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
}

export const expenseCategoryLabels: Record<string, string> = {
  SALARY: "Salary",
  UTILITIES: "Utilities",
  SUPPLIES: "Supplies",
  MAINTENANCE: "Maintenance",
  MARKETING: "Marketing",
  RENT: "Rent",
  EQUIPMENT: "Equipment",
  OTHER: "Other",
}

// ── Phase 4 — Hospital Operations ──────────────────────────────────────

export const wardTypeLabels: Record<string, string> = {
  GENERAL: "General Ward",
  PRIVATE: "Private Room",
  SEMI_PRIVATE: "Semi-Private Room",
  ICU: "ICU",
  NICU: "NICU",
  MATERNITY: "Maternity Ward",
  EMERGENCY: "Emergency Ward",
  OT: "Operation Theatre",
}

export const bedTypeLabels: Record<string, string> = {
  GENERAL: "General",
  ICU: "ICU",
  VENTILATOR: "Ventilator",
  ISOLATION: "Isolation",
  PEDIATRIC: "Pediatric",
}

export const bedStatusLabels: Record<string, string> = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  RESERVED: "Reserved",
  CLEANING: "Cleaning",
  MAINTENANCE: "Maintenance",
}

export const bedStatusColors: Record<string, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  OCCUPIED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  RESERVED: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  CLEANING: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  MAINTENANCE: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
}

export const otStatusLabels: Record<string, string> = {
  AVAILABLE: "Available",
  IN_USE: "In Use",
  MAINTENANCE: "Maintenance",
  CLEANING: "Cleaning",
}

export const otStatusColors: Record<string, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  IN_USE: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  MAINTENANCE: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  CLEANING: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
}

export const surgeryStatusLabels: Record<string, string> = {
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  POSTPONED: "Postponed",
}

export const surgeryStatusColors: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  IN_PROGRESS: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  POSTPONED: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
}

export const triageLevelLabels: Record<string, string> = {
  RESUSCITATION: "1 · Resuscitation",
  EMERGENT: "2 · Emergent",
  URGENT: "3 · Urgent",
  LESS_URGENT: "4 · Less Urgent",
  NON_URGENT: "5 · Non-Urgent",
}

export const triageLevelColors: Record<string, string> = {
  RESUSCITATION: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  EMERGENT: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  URGENT: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  LESS_URGENT: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  NON_URGENT: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
}

export const arrivalModeLabels: Record<string, string> = {
  AMBULANCE: "Ambulance",
  WALK_IN: "Walk-in",
  REFERRED: "Referred",
  POLICE: "Police / Legal",
}

export const emergencyStatusLabels: Record<string, string> = {
  WAITING: "Waiting",
  IN_TREATMENT: "In Treatment",
  ADMITTED: "Admitted",
  DISCHARGED: "Discharged",
  REFERRED_OUT: "Referred Out",
  LEFT_WITHOUT_TREATMENT: "Left Without Treatment",
}

export const emergencyStatusColors: Record<string, string> = {
  WAITING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  IN_TREATMENT: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  ADMITTED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  DISCHARGED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  REFERRED_OUT: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
  LEFT_WITHOUT_TREATMENT: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
}

export const ambulanceStatusLabels: Record<string, string> = {
  AVAILABLE: "Available",
  ON_TRIP: "On Trip",
  MAINTENANCE: "Maintenance",
}

export const ambulanceStatusColors: Record<string, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  ON_TRIP: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  MAINTENANCE: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
}

export const tripPurposeLabels: Record<string, string> = {
  PICKUP: "Pickup",
  DROP: "Drop",
  TRANSFER: "Inter-facility Transfer",
}

export const tripStatusLabels: Record<string, string> = {
  REQUESTED: "Requested",
  DISPATCHED: "Dispatched",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

export const tripStatusColors: Record<string, string> = {
  REQUESTED: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  DISPATCHED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
}

export const orderPriorityLabels: Record<string, string> = {
  ROUTINE: "Routine",
  STAT: "STAT",
}

export const orderPriorityColors: Record<string, string> = {
  ROUTINE: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  STAT: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
}

export const labOrderStatusLabels: Record<string, string> = {
  ORDERED: "Ordered",
  SAMPLE_COLLECTED: "Sample Collected",
  IN_LAB: "In Lab",
  RESULTED: "Resulted",
  CANCELLED: "Cancelled",
}

export const labOrderStatusColors: Record<string, string> = {
  ORDERED: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  SAMPLE_COLLECTED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  IN_LAB: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  RESULTED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
}

export const sampleTypeLabels: Record<string, string> = {
  BLOOD: "Blood",
  URINE: "Urine",
  STOOL: "Stool",
  SPUTUM: "Sputum",
  SWAB: "Swab",
  TISSUE: "Tissue",
  OTHER: "Other",
}

export const sampleStatusLabels: Record<string, string> = {
  PENDING_COLLECTION: "Pending Collection",
  COLLECTED: "Collected",
  IN_TRANSIT: "In Transit",
  RECEIVED: "Received",
  REJECTED: "Rejected",
  DISPOSED: "Disposed",
}

export const sampleStatusColors: Record<string, string> = {
  PENDING_COLLECTION: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  COLLECTED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  IN_TRANSIT: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
  RECEIVED: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  DISPOSED: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
}

export const radiologyModalityLabels: Record<string, string> = {
  XRAY: "X-Ray",
  CT: "CT Scan",
  MRI: "MRI",
  ULTRASOUND: "Ultrasound",
  MAMMOGRAPHY: "Mammography",
  OTHER: "Other",
}

export const radiologyOrderStatusLabels: Record<string, string> = {
  ORDERED: "Ordered",
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

export const radiologyOrderStatusColors: Record<string, string> = {
  ORDERED: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  IN_PROGRESS: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
}

export const medicineUnitLabels: Record<string, string> = {
  TABLET: "Tablet",
  CAPSULE: "Capsule",
  SYRUP: "Syrup",
  INJECTION: "Injection",
  OINTMENT: "Ointment",
  DROPS: "Drops",
  OTHER: "Other",
}

export const purchaseOrderStatusLabels: Record<string, string> = {
  DRAFT: "Draft",
  ORDERED: "Ordered",
  PARTIALLY_RECEIVED: "Partially Received",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
}

export const purchaseOrderStatusColors: Record<string, string> = {
  DRAFT: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  ORDERED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  PARTIALLY_RECEIVED: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  RECEIVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
}

export const equipmentCategoryLabels: Record<string, string> = {
  BIOMEDICAL: "Biomedical",
  IT: "IT Equipment",
  FURNITURE: "Furniture",
  VEHICLE: "Vehicle",
  OTHER: "Other",
}

export const equipmentStatusLabels: Record<string, string> = {
  OPERATIONAL: "Operational",
  UNDER_MAINTENANCE: "Under Maintenance",
  OUT_OF_SERVICE: "Out of Service",
  DECOMMISSIONED: "Decommissioned",
}

export const equipmentStatusColors: Record<string, string> = {
  OPERATIONAL: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  UNDER_MAINTENANCE: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  OUT_OF_SERVICE: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  DECOMMISSIONED: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
}

export const ticketCategoryLabels: Record<string, string> = {
  HOUSEKEEPING: "Housekeeping",
  LAUNDRY: "Laundry",
  MAINTENANCE: "Maintenance",
  EQUIPMENT: "Equipment",
}

export const ticketPriorityLabels: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
}

export const ticketPriorityColors: Record<string, string> = {
  LOW: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  MEDIUM: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  HIGH: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  URGENT: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
}

export const ticketStatusLabels: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
}

export const ticketStatusColors: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  RESOLVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  CLOSED: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
}

// ── Phase 5 — HRMS ──────────────────────────────────────────────────────

export const staffRoleLabels: Record<string, string> = {
  ADMIN: "Admin",
  DOCTOR: "Doctor",
  NURSE: "Nurse",
  FRONT_DESK: "Front Desk",
  BILLING: "Billing",
}

export const employmentTypeLabels: Record<string, string> = {
  FULL_TIME: "Full-Time",
  PART_TIME: "Part-Time",
  CONTRACT: "Contract",
  INTERN: "Intern",
}

export const employeeStatusLabels: Record<string, string> = {
  ACTIVE: "Active",
  ON_LEAVE: "On Leave",
  SUSPENDED: "Suspended",
  EXITED: "Exited",
}

export const employeeStatusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  ON_LEAVE: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  SUSPENDED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  EXITED: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
}

export const attendanceStatusLabels: Record<string, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  HALF_DAY: "Half Day",
  LATE: "Late",
  ON_LEAVE: "On Leave",
  HOLIDAY: "Holiday",
}

export const attendanceStatusColors: Record<string, string> = {
  PRESENT: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  ABSENT: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  HALF_DAY: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  LATE: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  ON_LEAVE: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  HOLIDAY: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
}

export const attendanceSourceLabels: Record<string, string> = {
  MANUAL: "Manual",
  BIOMETRIC: "Biometric",
}

export const payrollRunStatusLabels: Record<string, string> = {
  DRAFT: "Draft",
  PROCESSED: "Processed",
  PAID: "Paid",
}

export const payrollRunStatusColors: Record<string, string> = {
  DRAFT: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  PROCESSED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  PAID: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
}

export const leaveRequestStatusLabels: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
}

export const leaveRequestStatusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  CANCELLED: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
}

export const reviewStatusLabels: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  ACKNOWLEDGED: "Acknowledged",
}

export const reviewStatusColors: Record<string, string> = {
  DRAFT: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  SUBMITTED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  ACKNOWLEDGED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
}

export const trainingStatusLabels: Record<string, string> = {
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

export const trainingStatusColors: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
}

export const enrollmentStatusLabels: Record<string, string> = {
  ENROLLED: "Enrolled",
  COMPLETED: "Completed",
  NO_SHOW: "No Show",
}

export const enrollmentStatusColors: Record<string, string> = {
  ENROLLED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  NO_SHOW: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
}

export const jobOpeningStatusLabels: Record<string, string> = {
  OPEN: "Open",
  ON_HOLD: "On Hold",
  CLOSED: "Closed",
}

export const jobOpeningStatusColors: Record<string, string> = {
  OPEN: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  ON_HOLD: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  CLOSED: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
}

export const candidateStageLabels: Record<string, string> = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  HIRED: "Hired",
  REJECTED: "Rejected",
}

export const candidateStageColors: Record<string, string> = {
  APPLIED: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  SCREENING: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  INTERVIEW: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  OFFER: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  HIRED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
}

export const onboardingTaskStatusLabels: Record<string, string> = {
  PENDING: "Pending",
  DONE: "Done",
}

export const announcementAudienceLabels: Record<string, string> = {
  ALL: "All Staff",
  DEPARTMENT: "Department",
}

export const taskPriorityLabels: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
}

export const taskPriorityColors: Record<string, string> = {
  LOW: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  MEDIUM: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  HIGH: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  URGENT: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
}

export const taskStatusLabels: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
  CANCELLED: "Cancelled",
}

export const taskStatusColors: Record<string, string> = {
  TODO: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  DONE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
}

export const meetingStatusLabels: Record<string, string> = {
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

export const meetingStatusColors: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
}

export const attendeeResponseLabels: Record<string, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
}

export const exitStatusLabels: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  COMPLETED: "Completed",
  WITHDRAWN: "Withdrawn",
}

export const exitStatusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  APPROVED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  WITHDRAWN: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
}

export const employeeDocCategoryLabels: Record<string, string> = {
  ID_PROOF: "ID Proof",
  CONTRACT: "Contract",
  CERTIFICATE: "Certificate",
  RESUME: "Resume",
  OTHER: "Other",
}

export function enumToOptions(labels: Record<string, string>) {
  return Object.entries(labels).map(([value, label]) => ({ value, label }))
}
