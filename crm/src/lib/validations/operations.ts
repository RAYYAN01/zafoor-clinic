import { z } from "zod"

// ── Beds & Wards ────────────────────────────────────────────────────────

export const wardSchema = z.object({
  name: z.string().trim().min(1, "Ward name is required"),
  type: z.enum(["GENERAL", "PRIVATE", "SEMI_PRIVATE", "ICU", "NICU", "MATERNITY", "EMERGENCY", "OT"]),
  floor: z.string().trim().optional(),
})
export type WardInput = z.infer<typeof wardSchema>

export const bedSchema = z.object({
  wardId: z.string().min(1, "Select a ward"),
  bedNumber: z.string().trim().min(1, "Bed number is required"),
  type: z.enum(["GENERAL", "ICU", "VENTILATOR", "ISOLATION", "PEDIATRIC"]),
  dailyRate: z.coerce.number().nonnegative().optional(),
  notes: z.string().trim().optional(),
})
export type BedInput = z.infer<typeof bedSchema>

export const bedStatusSchema = z.object({
  status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "CLEANING", "MAINTENANCE"]),
})
export type BedStatusInput = z.infer<typeof bedStatusSchema>

export const assignBedSchema = z.object({
  bedId: z.string().min(1, "Select a bed"),
})
export type AssignBedInput = z.infer<typeof assignBedSchema>

// ── ICU ─────────────────────────────────────────────────────────────────

export const icuRoundSchema = z.object({
  pulseBpm: z.coerce.number().int().optional(),
  bpSystolic: z.coerce.number().int().optional(),
  bpDiastolic: z.coerce.number().int().optional(),
  spo2: z.coerce.number().int().optional(),
  temperatureC: z.coerce.number().optional(),
  respiratoryRate: z.coerce.number().int().optional(),
  ventilatorMode: z.string().trim().optional(),
  gcsScore: z.coerce.number().int().optional(),
  notes: z.string().trim().optional(),
})
export type IcuRoundInput = z.infer<typeof icuRoundSchema>

// ── Operation Theatre ───────────────────────────────────────────────────

export const otSchema = z.object({
  name: z.string().trim().min(1, "Theatre name is required"),
  location: z.string().trim().optional(),
})
export type OtInput = z.infer<typeof otSchema>

export const otStatusSchema = z.object({
  status: z.enum(["AVAILABLE", "IN_USE", "MAINTENANCE", "CLEANING"]),
})
export type OtStatusInput = z.infer<typeof otStatusSchema>

export const surgerySchema = z.object({
  otId: z.string().min(1, "Select a theatre"),
  patientId: z.string().min(1, "Select a patient"),
  admissionId: z.string().optional(),
  surgeonId: z.string().min(1, "Select a surgeon"),
  procedureName: z.string().trim().min(1, "Procedure name is required"),
  anesthesiaType: z.string().trim().optional(),
  scheduledStart: z.string().min(1, "Start time is required"),
  scheduledEnd: z.string().min(1, "End time is required"),
  notes: z.string().trim().optional(),
})
export type SurgeryInput = z.infer<typeof surgerySchema>

export const surgeryStatusSchema = z.object({
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "POSTPONED"]),
})
export type SurgeryStatusInput = z.infer<typeof surgeryStatusSchema>

// ── Emergency ───────────────────────────────────────────────────────────

export const emergencyCaseSchema = z.object({
  patientId: z.string().optional(),
  walkInName: z.string().trim().optional(),
  walkInPhone: z.string().trim().optional(),
  triageLevel: z.enum(["RESUSCITATION", "EMERGENT", "URGENT", "LESS_URGENT", "NON_URGENT"]),
  chiefComplaint: z.string().trim().min(1, "Chief complaint is required"),
  arrivalMode: z.enum(["AMBULANCE", "WALK_IN", "REFERRED", "POLICE"]),
  broughtBy: z.string().trim().optional(),
  attendingDoctorId: z.string().optional(),
})
export type EmergencyCaseInput = z.infer<typeof emergencyCaseSchema>

export const emergencyUpdateSchema = z.object({
  status: z.enum(["WAITING", "IN_TREATMENT", "ADMITTED", "DISCHARGED", "REFERRED_OUT", "LEFT_WITHOUT_TREATMENT"]),
  attendingDoctorId: z.string().optional(),
  bedId: z.string().optional(),
  disposition: z.string().trim().optional(),
  notes: z.string().trim().optional(),
})
export type EmergencyUpdateInput = z.infer<typeof emergencyUpdateSchema>

// ── Ambulance ───────────────────────────────────────────────────────────

export const ambulanceSchema = z.object({
  vehicleNumber: z.string().trim().min(1, "Vehicle number is required"),
  driverName: z.string().trim().optional(),
  driverPhone: z.string().trim().optional(),
})
export type AmbulanceInput = z.infer<typeof ambulanceSchema>

export const ambulanceTripSchema = z.object({
  ambulanceId: z.string().min(1, "Select an ambulance"),
  patientId: z.string().optional(),
  purpose: z.enum(["PICKUP", "DROP", "TRANSFER"]),
  pickupLocation: z.string().trim().optional(),
  dropLocation: z.string().trim().optional(),
  notes: z.string().trim().optional(),
})
export type AmbulanceTripInput = z.infer<typeof ambulanceTripSchema>

export const tripStatusSchema = z.object({
  status: z.enum(["REQUESTED", "DISPATCHED", "COMPLETED", "CANCELLED"]),
})
export type TripStatusInput = z.infer<typeof tripStatusSchema>

// ── Laboratory ──────────────────────────────────────────────────────────

export const labOrderSchema = z.object({
  patientId: z.string().min(1, "Select a patient"),
  doctorId: z.string().optional(),
  encounterId: z.string().optional(),
  testName: z.string().trim().min(1, "Test name is required"),
  priority: z.enum(["ROUTINE", "STAT"]),
  sampleType: z.enum(["BLOOD", "URINE", "STOOL", "SPUTUM", "SWAB", "TISSUE", "OTHER"]),
})
export type LabOrderInput = z.infer<typeof labOrderSchema>

export const labOrderStatusSchema = z.object({
  status: z.enum(["ORDERED", "SAMPLE_COLLECTED", "IN_LAB", "RESULTED", "CANCELLED"]),
})
export type LabOrderStatusInput = z.infer<typeof labOrderStatusSchema>

export const sampleStatusSchema = z.object({
  status: z.enum(["PENDING_COLLECTION", "COLLECTED", "IN_TRANSIT", "RECEIVED", "REJECTED", "DISPOSED"]),
  rejectionReason: z.string().trim().optional(),
})
export type SampleStatusInput = z.infer<typeof sampleStatusSchema>

// ── Radiology ───────────────────────────────────────────────────────────

export const radiologyOrderSchema = z.object({
  patientId: z.string().min(1, "Select a patient"),
  doctorId: z.string().optional(),
  encounterId: z.string().optional(),
  modality: z.enum(["XRAY", "CT", "MRI", "ULTRASOUND", "MAMMOGRAPHY", "OTHER"]),
  bodyPart: z.string().trim().min(1, "Body part / region is required"),
  priority: z.enum(["ROUTINE", "STAT"]),
  scheduledAt: z.string().optional(),
})
export type RadiologyOrderInput = z.infer<typeof radiologyOrderSchema>

export const radiologyOrderStatusSchema = z.object({
  status: z.enum(["ORDERED", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  scheduledAt: z.string().optional(),
})
export type RadiologyOrderStatusInput = z.infer<typeof radiologyOrderStatusSchema>

export const pacsImageSchema = z.object({
  imageUrl: z.string().trim().min(1, "Image URL is required"),
  seriesDescription: z.string().trim().optional(),
})
export type PacsImageInput = z.infer<typeof pacsImageSchema>

// ── Pharmacy / Inventory ───────────────────────────────────────────────

export const vendorSchema = z.object({
  name: z.string().trim().min(1, "Vendor name is required"),
  contactName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  address: z.string().trim().optional(),
  gstin: z.string().trim().optional(),
})
export type VendorInput = z.infer<typeof vendorSchema>

export const medicineSchema = z.object({
  name: z.string().trim().min(1, "Medicine name is required"),
  genericName: z.string().trim().optional(),
  category: z.string().trim().optional(),
  unit: z.enum(["TABLET", "CAPSULE", "SYRUP", "INJECTION", "OINTMENT", "DROPS", "OTHER"]),
  hsnCode: z.string().trim().optional(),
  reorderLevel: z.coerce.number().int().nonnegative().default(10),
})
export type MedicineInput = z.infer<typeof medicineSchema>

export const medicineBatchSchema = z.object({
  medicineId: z.string().min(1, "Select a medicine"),
  batchNumber: z.string().trim().min(1, "Batch number is required"),
  vendorId: z.string().optional(),
  expiryDate: z.string().min(1, "Expiry date is required"),
  quantity: z.coerce.number().int().nonnegative(),
  mrp: z.coerce.number().positive("MRP must be greater than zero"),
  purchasePrice: z.coerce.number().nonnegative().optional(),
})
export type MedicineBatchInput = z.infer<typeof medicineBatchSchema>

export const poItemSchema = z.object({
  medicineId: z.string().min(1, "Select a medicine"),
  quantity: z.coerce.number().int().positive(),
  unitCost: z.coerce.number().nonnegative(),
})
export type PoItemInput = z.infer<typeof poItemSchema>

export const purchaseOrderSchema = z.object({
  vendorId: z.string().min(1, "Select a vendor"),
  expectedDate: z.string().optional(),
  notes: z.string().trim().optional(),
  items: z.array(poItemSchema).min(1, "Add at least one item"),
})
export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>

export const poStatusSchema = z.object({
  status: z.enum(["DRAFT", "ORDERED", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"]),
})
export type PoStatusInput = z.infer<typeof poStatusSchema>

export const dispenseItemSchema = z.object({
  medicineId: z.string().min(1, "Select a medicine"),
  batchId: z.string().min(1, "Select a batch"),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().nonnegative(),
})
export type DispenseItemInput = z.infer<typeof dispenseItemSchema>

export const pharmacyDispenseSchema = z.object({
  patientId: z.string().min(1, "Select a patient"),
  prescriptionId: z.string().optional(),
  items: z.array(dispenseItemSchema).min(1, "Add at least one item"),
})
export type PharmacyDispenseInput = z.infer<typeof pharmacyDispenseSchema>

// ── Equipment / Assets ─────────────────────────────────────────────────

export const equipmentSchema = z.object({
  name: z.string().trim().min(1, "Equipment name is required"),
  category: z.enum(["BIOMEDICAL", "IT", "FURNITURE", "VEHICLE", "OTHER"]),
  department: z.string().trim().optional(),
  location: z.string().trim().optional(),
  vendorId: z.string().optional(),
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  nextServiceDue: z.string().optional(),
  notes: z.string().trim().optional(),
})
export type EquipmentInput = z.infer<typeof equipmentSchema>

export const equipmentStatusSchema = z.object({
  status: z.enum(["OPERATIONAL", "UNDER_MAINTENANCE", "OUT_OF_SERVICE", "DECOMMISSIONED"]),
})
export type EquipmentStatusInput = z.infer<typeof equipmentStatusSchema>

// ── Facility Tickets (Housekeeping / Laundry / Maintenance) ───────────

export const facilityTicketSchema = z.object({
  category: z.enum(["HOUSEKEEPING", "LAUNDRY", "MAINTENANCE", "EQUIPMENT"]),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  location: z.string().trim().optional(),
  equipmentId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  assignedToId: z.string().optional(),
})
export type FacilityTicketInput = z.infer<typeof facilityTicketSchema>

export const ticketStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
  assignedToId: z.string().optional(),
  notes: z.string().trim().optional(),
})
export type TicketStatusInput = z.infer<typeof ticketStatusSchema>
