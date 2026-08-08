import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import {
  generateUHID,
  generateBillNumber,
  generateReceiptNumber,
  generateClaimNumber,
  generateCaseNumber,
  generateLabOrderNumber,
  generateRadiologyOrderNumber,
  generateBarcode,
  generatePoNumber,
  generateTicketNumber,
  generateEmployeeCode,
} from "../src/lib/sequence"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding staff...")

  async function upsertStaff(data: Parameters<typeof prisma.user.create>[0]["data"]) {
    return prisma.user.upsert({
      where: { email: data.email },
      update: data,
      create: data,
    })
  }

  const admin = await upsertStaff({
    name: "System Admin",
    email: "admin@naazhospital.test",
    phone: "9000000001",
    role: "ADMIN",
  })

  const drAisha = await upsertStaff({
    name: "Aisha Khan",
    email: "aisha.khan@naazhospital.test",
    phone: "9000000002",
    role: "DOCTOR",
    specialization: "Cardiology",
    department: "Cardiology",
    consultationFee: 800,
  })

  const drRohan = await upsertStaff({
    name: "Rohan Mehta",
    email: "rohan.mehta@naazhospital.test",
    phone: "9000000003",
    role: "DOCTOR",
    specialization: "Orthopedics",
    department: "Orthopedics",
    consultationFee: 700,
  })

  const drPriya = await upsertStaff({
    name: "Priya Nair",
    email: "priya.nair@naazhospital.test",
    phone: "9000000004",
    role: "DOCTOR",
    specialization: "Pediatrics",
    department: "Pediatrics",
    consultationFee: 600,
  })

  const frontDesk = await upsertStaff({
    name: "Sana Sheikh",
    email: "frontdesk@naazhospital.test",
    phone: "9000000005",
    role: "FRONT_DESK",
  })

  const nurse = await upsertStaff({
    name: "Neha Kulkarni",
    email: "nurse@naazhospital.test",
    phone: "9000000006",
    role: "NURSE",
  })

  await upsertStaff({
    name: "Farhan Ali",
    email: "billing@naazhospital.test",
    phone: "9000000007",
    role: "BILLING",
  })

  const doctors = [drAisha, drRohan, drPriya]

  console.log("Seeding doctor availability...")
  for (const doctor of doctors) {
    const existing = await prisma.doctorAvailability.findFirst({ where: { doctorId: doctor.id } })
    if (existing) continue
    for (const dayOfWeek of [1, 2, 3, 4, 5, 6]) {
      await prisma.doctorAvailability.create({
        data: {
          doctorId: doctor.id,
          dayOfWeek,
          startTime: "09:00",
          endTime: "13:00",
          slotDurationMinutes: 15,
          location: "OPD Block A",
        },
      })
      await prisma.doctorAvailability.create({
        data: {
          doctorId: doctor.id,
          dayOfWeek,
          startTime: "16:00",
          endTime: "19:00",
          slotDurationMinutes: 15,
          location: "OPD Block A",
        },
      })
    }
  }

  console.log("Seeding tags...")
  const tagNames = [
    { name: "VIP", color: "#d97706" },
    { name: "Diabetic", color: "#dc2626" },
    { name: "Cardiac", color: "#db2777" },
    { name: "Follow-up Required", color: "#2563eb" },
    { name: "Corporate Insurance", color: "#059669" },
  ]
  const tags: Record<string, string> = {}
  for (const t of tagNames) {
    const tag = await prisma.tag.upsert({
      where: { name: t.name },
      update: {},
      create: t,
    })
    tags[t.name] = tag.id
  }

  console.log("Seeding patients...")

  type SeedPatientInput = {
    firstName: string
    lastName?: string
    dob?: Date
    gender?: "MALE" | "FEMALE" | "OTHER"
    bloodGroup?: "A_POS" | "A_NEG" | "B_POS" | "B_NEG" | "AB_POS" | "AB_NEG" | "O_POS" | "O_NEG" | "UNKNOWN"
    maritalStatus?: "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED" | "UNKNOWN"
    occupation?: string
    email?: string
    addressLine1?: string
    city?: string
    state?: string
    postalCode?: string
    registeredById?: string
  }

  async function createPatientIfMissing(phone: string, data: SeedPatientInput) {
    const existing = await prisma.patient.findFirst({ where: { phone } })
    if (existing) return existing
    return prisma.$transaction(async (tx) => {
      const uhid = await generateUHID(tx)
      return tx.patient.create({ data: { ...data, uhid, phone } })
    })
  }

  const p1 = await createPatientIfMissing("9820000001", {
    firstName: "Imran",
    lastName: "Sheikh",
    dob: new Date("1985-04-12"),
    gender: "MALE",
    bloodGroup: "B_POS",
    maritalStatus: "MARRIED",
    occupation: "Software Engineer",
    email: "imran.sheikh@example.com",
    addressLine1: "12 Marine Drive",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400002",
    registeredById: frontDesk.id,
  })

  const p2 = await createPatientIfMissing("9820000002", {
    firstName: "Fatima",
    lastName: "Rizvi",
    dob: new Date("1990-09-23"),
    gender: "FEMALE",
    bloodGroup: "O_POS",
    maritalStatus: "MARRIED",
    occupation: "Teacher",
    email: "fatima.rizvi@example.com",
    addressLine1: "45 Bandra West",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400050",
    registeredById: frontDesk.id,
  })

  const p3 = await createPatientIfMissing("9820000003", {
    firstName: "Aarav",
    lastName: "Kapoor",
    dob: new Date("2018-01-15"),
    gender: "MALE",
    bloodGroup: "A_POS",
    registeredById: frontDesk.id,
  })

  const p4 = await createPatientIfMissing("9820000004", {
    firstName: "Meera",
    lastName: "Iyer",
    dob: new Date("1965-06-30"),
    gender: "FEMALE",
    bloodGroup: "AB_NEG",
    maritalStatus: "WIDOWED",
    occupation: "Retired",
    email: "meera.iyer@example.com",
    addressLine1: "7 Andheri East",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400069",
    registeredById: frontDesk.id,
  })

  const p5 = await createPatientIfMissing("9820000005", {
    firstName: "Karan",
    lastName: "Malhotra",
    dob: new Date("1978-11-02"),
    gender: "MALE",
    bloodGroup: "O_NEG",
    maritalStatus: "MARRIED",
    occupation: "Business Owner",
    email: "karan.malhotra@example.com",
    addressLine1: "88 Powai",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400076",
    registeredById: frontDesk.id,
  })

  const patients = [p1, p2, p3, p4, p5]

  console.log("Seeding patient sub-records...")

  // Tags
  await prisma.patientTag.upsert({
    where: { patientId_tagId: { patientId: p5.id, tagId: tags["VIP"] } },
    update: {},
    create: { patientId: p5.id, tagId: tags["VIP"] },
  })
  await prisma.patientTag.upsert({
    where: { patientId_tagId: { patientId: p1.id, tagId: tags["Diabetic"] } },
    update: {},
    create: { patientId: p1.id, tagId: tags["Diabetic"] },
  })
  await prisma.patientTag.upsert({
    where: { patientId_tagId: { patientId: p4.id, tagId: tags["Cardiac"] } },
    update: {},
    create: { patientId: p4.id, tagId: tags["Cardiac"] },
  })
  await prisma.patientTag.upsert({
    where: { patientId_tagId: { patientId: p2.id, tagId: tags["Follow-up Required"] } },
    update: {},
    create: { patientId: p2.id, tagId: tags["Follow-up Required"] },
  })

  // Family members
  for (const p of patients) {
    const count = await prisma.familyMember.count({ where: { patientId: p.id } })
    if (count > 0) continue
    await prisma.familyMember.create({
      data: {
        patientId: p.id,
        name: p.firstName === "Aarav" ? "Rakesh Kapoor" : "Family Member of " + p.firstName,
        relation: p.firstName === "Aarav" ? "Father" : "Spouse",
        phone: "9821111" + Math.floor(Math.random() * 900 + 100),
        isEmergencyContact: true,
      },
    })
  }

  // Insurance
  for (const p of [p1, p4, p5]) {
    const count = await prisma.insurance.count({ where: { patientId: p.id } })
    if (count > 0) continue
    await prisma.insurance.create({
      data: {
        patientId: p.id,
        provider: "Star Health Insurance",
        policyNumber: "SHI" + Math.floor(100000 + Math.random() * 900000),
        planName: "Family Floater Gold",
        tpaName: "MedAssist TPA",
        coverageAmount: 500000,
        validFrom: new Date("2025-01-01"),
        validTo: new Date("2026-12-31"),
        isPrimary: true,
      },
    })
  }

  // Emergency contacts
  for (const p of patients) {
    const count = await prisma.emergencyContact.count({ where: { patientId: p.id } })
    if (count > 0) continue
    await prisma.emergencyContact.create({
      data: {
        patientId: p.id,
        name: "Emergency Contact for " + p.firstName,
        relation: "Sibling",
        phone: "9822222" + Math.floor(Math.random() * 900 + 100),
      },
    })
  }

  // Medical alerts / allergies / chronic diseases
  const alertCount = await prisma.medicalAlert.count({ where: { patientId: p4.id } })
  if (alertCount === 0) {
    await prisma.medicalAlert.create({
      data: {
        patientId: p4.id,
        type: "CONDITION",
        severity: "HIGH",
        description: "History of myocardial infarction (2021). Avoid NSAIDs.",
      },
    })
  }

  const allergyCount = await prisma.allergy.count({ where: { patientId: p1.id } })
  if (allergyCount === 0) {
    await prisma.allergy.create({
      data: { patientId: p1.id, allergen: "Penicillin", reaction: "Rash, breathlessness", severity: "HIGH" },
    })
  }

  const chronicCount = await prisma.chronicDisease.count({ where: { patientId: p1.id } })
  if (chronicCount === 0) {
    await prisma.chronicDisease.create({
      data: { patientId: p1.id, name: "Type 2 Diabetes", diagnosedOn: new Date("2019-03-01"), status: "MANAGED" },
    })
  }

  const vaccCount = await prisma.vaccination.count({ where: { patientId: p3.id } })
  if (vaccCount === 0) {
    await prisma.vaccination.create({
      data: {
        patientId: p3.id,
        vaccineName: "MMR",
        doseNumber: 2,
        dateGiven: new Date("2024-01-15"),
        nextDueDate: new Date("2027-01-15"),
        administeredBy: "Dr. Priya Nair",
      },
    })
  }

  // Communication preferences
  for (const p of patients) {
    await prisma.communicationPreference.upsert({
      where: { patientId: p.id },
      update: {},
      create: {
        patientId: p.id,
        preferredChannel: "WHATSAPP",
        allowMarketing: p.id === p5.id,
      },
    })
  }

  console.log("Seeding appointments, queue, prescriptions, billing, CRM...")

  const now = new Date()
  const today9 = new Date(now); today9.setHours(9, 30, 0, 0)
  const today10 = new Date(now); today10.setHours(10, 0, 0, 0)
  const today11 = new Date(now); today11.setHours(11, 15, 0, 0)
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1); yesterday.setHours(10, 0, 0, 0)
  const nextWeek = new Date(now); nextWeek.setDate(now.getDate() + 7); nextWeek.setHours(9, 0, 0, 0)

  async function ensureAppointment(patientId: string, doctorId: string, scheduledAt: Date, status: "SCHEDULED" | "CHECKED_IN" | "COMPLETED" | "NO_SHOW", type: "IN_PERSON" | "VIDEO" | "WALK_IN", token: number) {
    const existing = await prisma.appointment.findFirst({ where: { patientId, doctorId, scheduledAt } })
    if (existing) return existing
    return prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        scheduledAt,
        type,
        status,
        tokenNumber: token,
        reason: "General consultation",
        createdById: frontDesk.id,
        checkedInAt: status === "CHECKED_IN" || status === "COMPLETED" ? scheduledAt : null,
        completedAt: status === "COMPLETED" ? scheduledAt : null,
      },
    })
  }

  await ensureAppointment(p1.id, drAisha.id, today9, "CHECKED_IN", "IN_PERSON", 1)
  await ensureAppointment(p2.id, drAisha.id, today10, "SCHEDULED", "IN_PERSON", 2)
  await ensureAppointment(p3.id, drPriya.id, today11, "SCHEDULED", "VIDEO", 1)
  const aptYesterday = await ensureAppointment(p4.id, drRohan.id, yesterday, "COMPLETED", "IN_PERSON", 1)
  await ensureAppointment(p5.id, drRohan.id, new Date(yesterday.getTime() + 60 * 60 * 1000), "NO_SHOW", "IN_PERSON", 2)
  await ensureAppointment(p1.id, drAisha.id, nextWeek, "SCHEDULED", "IN_PERSON", 1)

  // Waiting list
  const wlCount = await prisma.waitingListEntry.count({ where: { patientId: p2.id } })
  if (wlCount === 0) {
    await prisma.waitingListEntry.create({
      data: {
        patientId: p2.id,
        doctorId: drPriya.id,
        requestedDate: nextWeek,
        reason: "Wants earliest available slot",
        priority: 1,
      },
    })
  }

  // Admission + discharge
  let admission = await prisma.admission.findFirst({ where: { patientId: p4.id } })
  if (!admission) {
    admission = await prisma.admission.create({
      data: {
        patientId: p4.id,
        doctorId: drRohan.id,
        wardType: "General Ward",
        roomNumber: "G-204",
        reason: "Hip fracture surgery recovery",
        status: "DISCHARGED",
        admittedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        dischargedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        dischargeSummary: "Recovered well post-surgery. Advised physiotherapy for 4 weeks.",
      },
    })
  }

  // Prescription
  const rxCount = await prisma.prescription.count({ where: { patientId: p4.id } })
  if (rxCount === 0) {
    await prisma.prescription.create({
      data: {
        patientId: p4.id,
        doctorId: drRohan.id,
        appointmentId: aptYesterday.id,
        diagnosis: "Post-operative hip pain management",
        issuedAt: yesterday,
        items: {
          create: [
            { medicineName: "Paracetamol 650mg", dosage: "1 tablet", frequency: "TID", duration: "5 days" },
            { medicineName: "Calcium + Vitamin D3", dosage: "1 tablet", frequency: "OD", duration: "30 days" },
          ],
        },
      },
    })
  }

  // Billing
  const p4Insurance = await prisma.insurance.findFirst({ where: { patientId: p4.id } })
  const billCount = await prisma.bill.count({ where: { patientId: p4.id } })
  if (billCount === 0 && p4Insurance) {
    const bill = await prisma.$transaction(async (tx) => {
      const billNumber = await generateBillNumber(tx)
      return tx.bill.create({
        data: {
          billNumber,
          patientId: p4.id,
          admissionId: admission.id,
          type: "IPD",
          payerType: "INSURANCE",
          insuranceId: p4Insurance.id,
          totalAmount: 45000,
          discountAmount: 2000,
          cgstAmount: 1075,
          sgstAmount: 1075,
          taxAmount: 2150,
          netAmount: 45150,
          amountPaid: 45150,
          balanceDue: 0,
          status: "PAID",
          issuedAt: yesterday,
          items: {
            create: [
              { description: "Hip Surgery - Package", quantity: 1, unitPrice: 40000, taxRatePercent: 0, amount: 40000 },
              { description: "Room Charges (5 days)", quantity: 5, unitPrice: 1000, taxRatePercent: 0, amount: 5000 },
            ],
          },
        },
      })
    })
    await prisma.$transaction(async (tx) => {
      const receiptNumber = await generateReceiptNumber(tx)
      await tx.payment.create({
        data: {
          receiptNumber,
          patientId: p4.id,
          billId: bill.id,
          amount: 45150,
          method: "INSURANCE",
          status: "SUCCESS",
          referenceNumber: "TXN" + Math.floor(100000 + Math.random() * 900000),
          receivedById: frontDesk.id,
          paidAt: yesterday,
        },
      })
      const claimNumber = await generateClaimNumber(tx)
      await tx.insuranceClaim.create({
        data: {
          billId: bill.id,
          patientId: p4.id,
          insuranceId: p4Insurance.id,
          claimNumber,
          claimedAmount: 45150,
          approvedAmount: 45150,
          status: "SETTLED",
          submittedAt: yesterday,
          settledAt: now,
        },
      })
    })
  }

  // CRM: messages / notes / follow-ups / feedback
  const msgCount = await prisma.message.count({ where: { patientId: p1.id } })
  if (msgCount === 0) {
    await prisma.message.createMany({
      data: [
        { patientId: p1.id, channel: "WHATSAPP", direction: "OUTBOUND", body: "Hi Imran, your appointment with Dr. Aisha Khan is confirmed for today 9:30 AM.", sentById: frontDesk.id },
        { patientId: p1.id, channel: "SMS", direction: "OUTBOUND", body: "Reminder: Your appointment is tomorrow at 9:30 AM.", sentById: frontDesk.id },
        { patientId: p1.id, channel: "EMAIL", direction: "OUTBOUND", subject: "Your lab report is ready", body: "Please find your lab report attached.", sentById: nurse.id },
      ],
    })
  }

  const noteCount = await prisma.patientNote.count({ where: { patientId: p1.id } })
  if (noteCount === 0) {
    await prisma.patientNote.create({
      data: {
        patientId: p1.id,
        authorId: drAisha.id,
        body: "Patient reports occasional chest tightness during exertion. Recommended stress test.",
        category: "CLINICAL",
        pinned: true,
      },
    })
  }

  const followUpCount = await prisma.followUp.count({ where: { patientId: p2.id } })
  if (followUpCount === 0) {
    await prisma.followUp.create({
      data: {
        patientId: p2.id,
        assignedToId: frontDesk.id,
        dueDate: nextWeek,
        reason: "Confirm pediatric vaccination follow-up slot",
        status: "PENDING",
      },
    })
  }

  const feedbackCount = await prisma.feedback.count({ where: { patientId: p4.id } })
  if (feedbackCount === 0) {
    await prisma.feedback.create({
      data: {
        patientId: p4.id,
        appointmentId: aptYesterday.id,
        rating: 5,
        comment: "Excellent care from Dr. Mehta and the nursing staff during my recovery.",
        category: "Doctor Experience",
      },
    })
  }

  console.log("Seeding EMR (Phase 2)...")

  function signatureSvg(name: string) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80"><text x="10" y="50" font-family="cursive" font-size="32" fill="#111827">${name}</text></svg>`
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  }

  await prisma.digitalSignature.upsert({
    where: { doctorId: drAisha.id },
    update: {},
    create: { doctorId: drAisha.id, signatureUrl: signatureSvg("Aisha Khan") },
  })
  await prisma.digitalSignature.upsert({
    where: { doctorId: drRohan.id },
    update: {},
    create: { doctorId: drRohan.id, signatureUrl: signatureSvg("Rohan Mehta") },
  })

  const soapTemplateCount = await prisma.doctorTemplate.count({ where: { doctorId: drAisha.id } })
  if (soapTemplateCount === 0) {
    await prisma.doctorTemplate.create({
      data: {
        doctorId: drAisha.id,
        name: "Routine Cardiology Follow-up",
        type: "SOAP",
        subjective: "Patient reports no new chest pain, palpitations, or breathlessness since last visit.",
        objective: "BP and pulse within normal range. Heart sounds S1 S2 normal, no murmurs.",
        assessment: "Stable. No new cardiac events.",
        plan: "Continue current medications. Review in 4 weeks. Advised low-salt diet and regular exercise.",
      },
    })
  }

  const encounterCount = await prisma.encounter.count({ where: { patientId: p1.id } })
  if (encounterCount === 0) {
    const encounter = await prisma.encounter.create({
      data: {
        patientId: p1.id,
        doctorId: drAisha.id,
        encounterDate: yesterday,
        chiefComplaints: ["Chest tightness on exertion", "Occasional palpitations"],
        status: "FINALIZED",
        signedAt: yesterday,
        vitals: {
          create: {
            patientId: p1.id,
            heightCm: 175,
            weightKg: 82,
            bmi: 26.8,
            temperatureC: 36.8,
            pulseBpm: 78,
            bpSystolic: 138,
            bpDiastolic: 88,
            spo2: 98,
            respiratoryRate: 16,
            recordedAt: yesterday,
          },
        },
        diagnoses: {
          create: [
            { patientId: p1.id, description: "Essential (primary) hypertension", icdCode: "I10", type: "PRIMARY", status: "ACTIVE" },
            { patientId: p1.id, description: "Type 2 diabetes mellitus, without complications", icdCode: "E11.9", type: "SECONDARY", status: "ACTIVE" },
          ],
        },
        clinicalNote: {
          create: {
            patientId: p1.id,
            doctorId: drAisha.id,
            subjective: "Patient reports occasional chest tightness during exertion over the past 2 weeks, no radiation, resolves with rest. No breathlessness at rest.",
            objective: "BP 138/88, pulse 78 regular. Heart sounds normal, no murmurs. Chest clear on auscultation.",
            assessment: "Borderline hypertension with exertional chest tightness, likely stable angina to be ruled out. Known type 2 diabetic.",
            plan: "Order lipid profile and ECG. Start low-dose beta blocker. Advised stress test. Review in 2 weeks with reports.",
            status: "SIGNED",
            version: 2,
            signedAt: yesterday,
            versions: {
              create: [
                { versionNumber: 1, subjective: "Patient reports occasional chest tightness during exertion.", objective: "BP 138/88, pulse 78.", assessment: "Borderline hypertension.", plan: "Order ECG.", savedAt: yesterday },
                { versionNumber: 2, subjective: "Patient reports occasional chest tightness during exertion over the past 2 weeks, no radiation, resolves with rest. No breathlessness at rest.", objective: "BP 138/88, pulse 78 regular. Heart sounds normal, no murmurs. Chest clear on auscultation.", assessment: "Borderline hypertension with exertional chest tightness, likely stable angina to be ruled out. Known type 2 diabetic.", plan: "Order lipid profile and ECG. Start low-dose beta blocker. Advised stress test. Review in 2 weeks with reports.", savedAt: yesterday },
              ],
            },
          },
        },
        prescriptions: {
          create: {
            patientId: p1.id,
            doctorId: drAisha.id,
            diagnosis: "Hypertension with exertional chest tightness",
            issuedAt: yesterday,
            items: {
              create: [
                { medicineName: "Metoprolol 25mg", dosage: "1 tablet", frequency: "OD", duration: "30 days" },
                { medicineName: "Atorvastatin 10mg", dosage: "1 tablet", frequency: "OD (night)", duration: "30 days" },
              ],
            },
          },
        },
      },
    })

    await prisma.clinicalReport.create({
      data: {
        patientId: p1.id,
        doctorId: drAisha.id,
        encounterId: encounter.id,
        type: "LAB",
        title: "Lipid Profile & HbA1c",
        status: "COMPLETED",
        reportDate: yesterday,
        impression: "HbA1c mildly elevated, LDL borderline high. Continue lifestyle modification and current management.",
        labResults: {
          create: [
            { testName: "HbA1c", value: "6.8", unit: "%", referenceRange: "4.0 - 5.6", flag: "HIGH" },
            { testName: "LDL Cholesterol", value: "142", unit: "mg/dL", referenceRange: "<100", flag: "HIGH" },
            { testName: "HDL Cholesterol", value: "44", unit: "mg/dL", referenceRange: ">40", flag: "NORMAL" },
            { testName: "Fasting Glucose", value: "118", unit: "mg/dL", referenceRange: "70 - 100", flag: "HIGH" },
          ],
        },
      },
    })
  }

  const radReportCount = await prisma.clinicalReport.count({ where: { patientId: p4.id, type: "RADIOLOGY" } })
  if (radReportCount === 0) {
    await prisma.clinicalReport.create({
      data: {
        patientId: p4.id,
        doctorId: drRohan.id,
        type: "RADIOLOGY",
        title: "Pelvis X-Ray (Post-op)",
        modality: "X-RAY",
        status: "COMPLETED",
        reportDate: yesterday,
        findings: "Hip implant well-positioned. No signs of loosening or fracture. Healing progressing as expected.",
        impression: "Satisfactory post-operative appearance of right hip prosthesis.",
      },
    })
  }

  const dischargeRecordCount = await prisma.dischargeSummaryRecord.count({ where: { admissionId: admission.id } })
  if (dischargeRecordCount === 0) {
    await prisma.dischargeSummaryRecord.create({
      data: {
        admissionId: admission.id,
        patientId: p4.id,
        doctorId: drRohan.id,
        diagnosis: "Right hip fracture, post total hip replacement",
        proceduresPerformed: "Total hip replacement (right side) under spinal anaesthesia.",
        hospitalCourse: "Patient tolerated surgery well. Post-operative recovery uneventful. Mobilized with walker from day 2.",
        medicationsOnDischarge: "Paracetamol 650mg TID x5 days, Calcium + Vitamin D3 OD x30 days, Rivaroxaban 10mg OD x14 days.",
        followUpInstructions: "Physiotherapy 3x/week for 4 weeks. Follow-up in OPD after 2 weeks with X-ray.",
        conditionAtDischarge: "Stable, mobilizing with support, pain well controlled.",
        signedAt: yesterday,
      },
    })
  }

  const referralCount = await prisma.referralNote.count({ where: { patientId: p1.id } })
  if (referralCount === 0) {
    await prisma.referralNote.create({
      data: {
        patientId: p1.id,
        fromDoctorId: drAisha.id,
        toDoctor: "Dr. Sunil Kapadia",
        toSpecialty: "Endocrinology",
        reason: "Suboptimal glycemic control (HbA1c 6.8%) with cardiac risk factors — request co-management.",
        urgency: "ROUTINE",
        signedAt: yesterday,
      },
    })
  }

  const certificateCount = await prisma.certificate.count({ where: { patientId: p4.id } })
  if (certificateCount === 0) {
    await prisma.certificate.create({
      data: {
        patientId: p4.id,
        doctorId: drRohan.id,
        type: "MEDICAL",
        title: "Medical Certificate — Post-operative Rest",
        content: "This is to certify that the patient underwent total hip replacement surgery and requires medical rest and restricted mobility for 4 weeks from the date of surgery.",
        validFrom: admission.dischargedAt ?? yesterday,
        validTo: nextWeek,
        signedAt: yesterday,
      },
    })
  }

  const medicalHistoryCount = await prisma.medicalHistory.count({ where: { patientId: p1.id } })
  if (medicalHistoryCount === 0) {
    await prisma.medicalHistory.create({
      data: { patientId: p1.id, description: "Diagnosed with Type 2 Diabetes", occurredOn: new Date("2019-03-01") },
    })
  }

  const familyHistoryCount = await prisma.familyHistoryEntry.count({ where: { patientId: p1.id } })
  if (familyHistoryCount === 0) {
    await prisma.familyHistoryEntry.create({
      data: { patientId: p1.id, relation: "Father", condition: "Coronary artery disease", notes: "MI at age 58" },
    })
  }

  const surgicalHistoryCount = await prisma.surgicalHistory.count({ where: { patientId: p4.id } })
  if (surgicalHistoryCount === 0) {
    await prisma.surgicalHistory.create({
      data: {
        patientId: p4.id,
        procedure: "Total Hip Replacement (Right)",
        surgeryDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        surgeon: "Dr. Rohan Mehta",
        hospital: "Naaz Hospital",
      },
    })
  }

  const medicationCount = await prisma.currentMedication.count({ where: { patientId: p1.id } })
  if (medicationCount === 0) {
    await prisma.currentMedication.create({
      data: {
        patientId: p1.id,
        medicineName: "Metformin 500mg",
        dosage: "1 tablet",
        frequency: "BID",
        startDate: new Date("2019-03-15"),
        status: "ACTIVE",
        prescribedBy: "Dr. Aisha Khan",
      },
    })
  }

  console.log("Seeding billing & finance (Phase 3)...")

  let corporateAccount = await prisma.corporateAccount.findFirst({ where: { companyName: "Tech Solutions Pvt Ltd" } })
  if (!corporateAccount) {
    corporateAccount = await prisma.corporateAccount.create({
      data: {
        companyName: "Tech Solutions Pvt Ltd",
        contactName: "HR Department",
        contactPhone: "9876543210",
        contactEmail: "hr@techsolutions.test",
        gstin: "27AAAAA1111A1Z9",
        creditLimit: 200000,
        address: "Andheri East, Mumbai",
      },
    })
  }
  const corpLinkCount = await prisma.corporatePatient.count({ where: { corporateAccountId: corporateAccount.id, patientId: p2.id } })
  if (corpLinkCount === 0) {
    await prisma.corporatePatient.create({ data: { corporateAccountId: corporateAccount.id, patientId: p2.id, employeeId: "TS-1042" } })
  }

  const pkgCount = await prisma.package.count({ where: { name: "Full Body Health Checkup" } })
  if (pkgCount === 0) {
    await prisma.package.create({
      data: {
        name: "Full Body Health Checkup",
        description: "Comprehensive preventive health screening package",
        price: 4999,
        includedItems: ["CBC", "Lipid Profile", "Liver Function Test", "Kidney Function Test", "Chest X-Ray", "ECG", "Physician Consultation"],
      },
    })
  }

  let cashSession = await prisma.cashSession.findFirst({ where: { status: "OPEN" } })
  if (!cashSession) {
    cashSession = await prisma.cashSession.create({ data: { openedById: frontDesk.id, openingBalance: 2000 } })
  }

  const opdBillCount = await prisma.bill.count({ where: { patientId: p3.id, type: "OPD" } })
  if (opdBillCount === 0) {
    const opdBill = await prisma.$transaction(async (tx) => {
      const billNumber = await generateBillNumber(tx)
      return tx.bill.create({
        data: {
          billNumber,
          patientId: p3.id,
          type: "OPD",
          payerType: "SELF",
          totalAmount: 1400,
          cgstAmount: 20,
          sgstAmount: 20,
          taxAmount: 40,
          netAmount: 1440,
          amountPaid: 1440,
          balanceDue: 0,
          status: "PAID",
          issuedAt: now,
          items: {
            create: [
              { description: "Pediatric Consultation", quantity: 1, unitPrice: 600, taxRatePercent: 0, taxAmount: 0, amount: 600 },
              { description: "Vaccination - MMR", quantity: 1, unitPrice: 800, taxRatePercent: 5, taxAmount: 40, amount: 800 },
            ],
          },
        },
      })
    })
    await prisma.$transaction(async (tx) => {
      const receiptNumber = await generateReceiptNumber(tx)
      await tx.payment.create({
        data: {
          receiptNumber,
          patientId: p3.id,
          billId: opdBill.id,
          amount: 1440,
          method: "CASH",
          status: "SUCCESS",
          cashSessionId: cashSession!.id,
          receivedById: frontDesk.id,
          paidAt: now,
        },
      })
    })
  }

  const pharmBillCount = await prisma.bill.count({ where: { patientId: p1.id, type: "PHARMACY" } })
  if (pharmBillCount === 0) {
    const pharmBill = await prisma.$transaction(async (tx) => {
      const billNumber = await generateBillNumber(tx)
      return tx.bill.create({
        data: {
          billNumber,
          patientId: p1.id,
          type: "PHARMACY",
          payerType: "SELF",
          totalAmount: 430,
          cgstAmount: 25.8,
          sgstAmount: 25.8,
          taxAmount: 51.6,
          netAmount: 481.6,
          amountPaid: 300,
          balanceDue: 181.6,
          status: "PARTIALLY_PAID",
          issuedAt: yesterday,
          items: {
            create: [
              { description: "Metoprolol 25mg x30", hsnCode: "3004", quantity: 1, unitPrice: 250, taxRatePercent: 12, taxAmount: 30, amount: 250 },
              { description: "Atorvastatin 10mg x30", hsnCode: "3004", quantity: 1, unitPrice: 180, taxRatePercent: 12, taxAmount: 21.6, amount: 180 },
            ],
          },
        },
      })
    })
    await prisma.$transaction(async (tx) => {
      const receiptNumber = await generateReceiptNumber(tx)
      await tx.payment.create({
        data: {
          receiptNumber,
          patientId: p1.id,
          billId: pharmBill.id,
          amount: 300,
          method: "UPI",
          status: "SUCCESS",
          referenceNumber: "UPI" + Math.floor(100000000 + Math.random() * 900000000),
          receivedById: frontDesk.id,
          paidAt: yesterday,
        },
      })
    })
  }

  const corpBillCount = await prisma.bill.count({ where: { patientId: p2.id, payerType: "CORPORATE" } })
  if (corpBillCount === 0) {
    await prisma.$transaction(async (tx) => {
      const billNumber = await generateBillNumber(tx)
      return tx.bill.create({
        data: {
          billNumber,
          patientId: p2.id,
          type: "OPD",
          payerType: "CORPORATE",
          corporateAccountId: corporateAccount!.id,
          totalAmount: 3500,
          netAmount: 3500,
          amountPaid: 0,
          balanceDue: 3500,
          status: "PENDING",
          issuedAt: now,
          items: {
            create: [{ description: "Antenatal Checkup Package", quantity: 1, unitPrice: 3500, amount: 3500 }],
          },
        },
      })
    })
  }

  const advanceCount = await prisma.patientAdvance.count({ where: { patientId: p5.id } })
  if (advanceCount === 0) {
    await prisma.patientAdvance.create({
      data: {
        patientId: p5.id,
        amount: 5000,
        balance: 5000,
        method: "CARD",
        referenceNumber: "ADV" + Math.floor(100000 + Math.random() * 900000),
        receivedById: frontDesk.id,
        paidAt: now,
        notes: "Advance deposit for upcoming procedure",
      },
    })
  }

  const p4Bill = await prisma.bill.findFirst({ where: { patientId: p4.id, type: "IPD" } })
  if (p4Bill) {
    const refundCount = await prisma.refund.count({ where: { billId: p4Bill.id } })
    if (refundCount === 0) {
      await prisma.refund.create({
        data: {
          billId: p4Bill.id,
          patientId: p4.id,
          amount: 1000,
          reason: "Overcharged room charges — patient discharged a day early",
          method: "INSURANCE",
          status: "PENDING",
        },
      })
    }
  }

  const expenseCount = await prisma.expense.count()
  if (expenseCount === 0) {
    await prisma.expense.createMany({
      data: [
        { category: "RENT", description: "Monthly facility rent", amount: 150000, expenseDate: now, method: "NET_BANKING", recordedById: admin.id },
        { category: "SALARY", description: "Staff salaries — current month", amount: 500000, expenseDate: now, method: "NET_BANKING", recordedById: admin.id },
        { category: "UTILITIES", description: "Electricity & water bills", amount: 25000, expenseDate: yesterday, method: "NET_BANKING", recordedById: frontDesk.id },
        { category: "SUPPLIES", description: "Medical consumables restock", amount: 40000, expenseDate: yesterday, method: "CARD", recordedById: nurse.id },
        { category: "MAINTENANCE", description: "AC servicing", amount: 8000, expenseDate: now, method: "CASH", recordedById: frontDesk.id },
      ],
    })
  }

  // ── Phase 4 — Hospital Operations ──────────────────────────────────────

  console.log("Seeding wards & beds...")
  async function upsertWard(name: string, type: "GENERAL" | "ICU" | "EMERGENCY", floor: string) {
    const existing = await prisma.ward.findFirst({ where: { name } })
    if (existing) return existing
    return prisma.ward.create({ data: { name, type, floor } })
  }
  const generalWard = await upsertWard("General Ward A", "GENERAL", "2nd Floor")
  const icuWard = await upsertWard("ICU", "ICU", "3rd Floor")
  const erWard = await upsertWard("Emergency Ward", "EMERGENCY", "Ground Floor")

  async function upsertBed(wardId: string, bedNumber: string, type: "GENERAL" | "ICU" | "VENTILATOR", dailyRate: number) {
    const existing = await prisma.bed.findFirst({ where: { wardId, bedNumber } })
    if (existing) return existing
    return prisma.bed.create({ data: { wardId, bedNumber, type, dailyRate } })
  }
  const gBed1 = await upsertBed(generalWard.id, "G-101", "GENERAL", 2500)
  await upsertBed(generalWard.id, "G-102", "GENERAL", 2500)
  const icuBed1 = await upsertBed(icuWard.id, "ICU-1", "ICU", 12000)
  await upsertBed(icuWard.id, "ICU-2", "VENTILATOR", 18000)
  const erBed1 = await upsertBed(erWard.id, "ER-1", "GENERAL", 1500)

  console.log("Seeding ICU admission...")
  let icuAdmission = await prisma.admission.findFirst({ where: { patientId: p1.id, status: "ADMITTED" } })
  if (!icuAdmission) {
    icuAdmission = await prisma.admission.create({
      data: {
        patientId: p1.id,
        doctorId: drAisha.id,
        wardType: "ICU",
        roomNumber: "ICU-1",
        bedId: icuBed1.id,
        reason: "Post-cardiac event monitoring",
        status: "ADMITTED",
        admittedAt: yesterday,
      },
    })
    await prisma.bed.update({ where: { id: icuBed1.id }, data: { status: "OCCUPIED" } })
  }
  await prisma.bed.update({ where: { id: gBed1.id }, data: { status: "AVAILABLE" } })

  const icuRoundCount = await prisma.icuRound.count({ where: { admissionId: icuAdmission.id } })
  if (icuRoundCount === 0) {
    await prisma.icuRound.create({
      data: {
        admissionId: icuAdmission.id,
        recordedById: nurse.id,
        pulseBpm: 88,
        bpSystolic: 128,
        bpDiastolic: 82,
        spo2: 97,
        temperatureC: 37.1,
        respiratoryRate: 18,
        gcsScore: 15,
        notes: "Stable overnight. Continue current medication.",
      },
    })
  }

  console.log("Seeding operation theatres & surgery...")
  async function upsertTheatre(name: string, location: string) {
    const existing = await prisma.operationTheatre.findFirst({ where: { name } })
    if (existing) return existing
    return prisma.operationTheatre.create({ data: { name, location } })
  }
  const ot1 = await upsertTheatre("OT-1", "3rd Floor, Surgical Block")
  await upsertTheatre("OT-2", "3rd Floor, Surgical Block")

  const surgeryCount = await prisma.surgery.count({ where: { patientId: p2.id } })
  if (surgeryCount === 0) {
    const surgeryStart = new Date(now); surgeryStart.setHours(14, 0, 0, 0)
    const surgeryEnd = new Date(now); surgeryEnd.setHours(16, 0, 0, 0)
    await prisma.surgery.create({
      data: {
        otId: ot1.id,
        patientId: p2.id,
        surgeonId: drRohan.id,
        procedureName: "Diagnostic Laparoscopy",
        anesthesiaType: "General",
        scheduledStart: surgeryStart,
        scheduledEnd: surgeryEnd,
        status: "SCHEDULED",
        notes: "Pre-op fasting confirmed.",
      },
    })
  }

  console.log("Seeding emergency cases...")
  const emergencyCount = await prisma.emergencyCase.count()
  if (emergencyCount === 0) {
    await prisma.$transaction(async (tx) => {
      const caseNumber1 = await generateCaseNumber(tx)
      await tx.emergencyCase.create({
        data: {
          caseNumber: caseNumber1,
          patientId: p3.id,
          triageLevel: "URGENT",
          chiefComplaint: "High fever and vomiting",
          arrivalMode: "WALK_IN",
          status: "IN_TREATMENT",
          attendingDoctorId: drPriya.id,
          bedId: erBed1.id,
          seenAt: now,
        },
      })
      await tx.bed.update({ where: { id: erBed1.id }, data: { status: "OCCUPIED" } })

      const caseNumber2 = await generateCaseNumber(tx)
      await tx.emergencyCase.create({
        data: {
          caseNumber: caseNumber2,
          walkInName: "Ramesh Gupta",
          walkInPhone: "9820099999",
          triageLevel: "LESS_URGENT",
          chiefComplaint: "Sprained ankle after fall",
          arrivalMode: "WALK_IN",
          status: "WAITING",
        },
      })
    })
  }

  console.log("Seeding ambulance fleet...")
  async function upsertAmbulance(vehicleNumber: string, driverName: string, driverPhone: string) {
    const existing = await prisma.ambulance.findFirst({ where: { vehicleNumber } })
    if (existing) return existing
    return prisma.ambulance.create({ data: { vehicleNumber, driverName, driverPhone } })
  }
  const amb1 = await upsertAmbulance("MH-02-AB-1234", "Suresh Patil", "9820011111")
  await upsertAmbulance("MH-02-AB-5678", "Vikas Jadhav", "9820022222")

  const tripCount = await prisma.ambulanceTrip.count()
  if (tripCount === 0) {
    await prisma.ambulanceTrip.create({
      data: {
        ambulanceId: amb1.id,
        patientId: p3.id,
        purpose: "PICKUP",
        pickupLocation: "Andheri East residence",
        dropLocation: "Naaz Hospital Emergency",
        status: "COMPLETED",
        requestedAt: yesterday,
        dispatchedAt: yesterday,
        completedAt: yesterday,
      },
    })
  }

  console.log("Seeding lab & radiology orders...")
  const labOrderCount = await prisma.labOrder.count()
  if (labOrderCount === 0) {
    await prisma.$transaction(async (tx) => {
      const orderNumber1 = await generateLabOrderNumber(tx)
      const order1 = await tx.labOrder.create({
        data: { orderNumber: orderNumber1, patientId: p1.id, doctorId: drAisha.id, testName: "Complete Blood Count (CBC)", priority: "STAT", status: "IN_LAB" },
      })
      const barcode1 = await generateBarcode(tx)
      await tx.sample.create({ data: { barcode: barcode1, labOrderId: order1.id, type: "BLOOD", status: "RECEIVED", collectedAt: yesterday, receivedAt: yesterday, collectedById: nurse.id } })

      const orderNumber2 = await generateLabOrderNumber(tx)
      const order2 = await tx.labOrder.create({
        data: { orderNumber: orderNumber2, patientId: p4.id, doctorId: drRohan.id, testName: "Lipid Profile", priority: "ROUTINE", status: "ORDERED" },
      })
      const barcode2 = await generateBarcode(tx)
      await tx.sample.create({ data: { barcode: barcode2, labOrderId: order2.id, type: "BLOOD", status: "PENDING_COLLECTION" } })
    })
  }

  const radiologyOrderCount = await prisma.radiologyOrder.count()
  if (radiologyOrderCount === 0) {
    await prisma.$transaction(async (tx) => {
      const orderNumber = await generateRadiologyOrderNumber(tx)
      await tx.radiologyOrder.create({
        data: { orderNumber, patientId: p4.id, doctorId: drRohan.id, modality: "XRAY", bodyPart: "Right Hip", priority: "ROUTINE", status: "COMPLETED" },
      })
    })
  }

  console.log("Seeding vendors, medicines & purchase orders...")
  async function upsertVendor(name: string, contactName: string, phone: string, gstin: string) {
    const existing = await prisma.vendor.findFirst({ where: { name } })
    if (existing) return existing
    return prisma.vendor.create({ data: { name, contactName, phone, gstin } })
  }
  const vendor1 = await upsertVendor("MedPlus Distributors", "Ashok Rane", "9820033333", "27AAAAA0000A1Z5")
  await upsertVendor("PharmaCorp Supplies", "Deepak Shah", "9820044444", "27BBBBB0000B1Z5")

  async function upsertMedicine(name: string, genericName: string, unit: "TABLET" | "SYRUP" | "INJECTION", reorderLevel: number) {
    const existing = await prisma.medicine.findFirst({ where: { name } })
    if (existing) return existing
    return prisma.medicine.create({ data: { name, genericName, unit, reorderLevel, category: "General" } })
  }
  const medParacetamol = await upsertMedicine("Paracetamol 650mg", "Paracetamol", "TABLET", 100)
  const medAmoxicillin = await upsertMedicine("Amoxicillin 500mg", "Amoxicillin", "TABLET", 50)
  const medCetirizine = await upsertMedicine("Cetirizine 10mg", "Cetirizine", "TABLET", 30)

  const batchCount = await prisma.medicineBatch.count()
  if (batchCount === 0) {
    const farExpiry = new Date(now); farExpiry.setFullYear(farExpiry.getFullYear() + 1)
    const soonExpiry = new Date(now); soonExpiry.setDate(soonExpiry.getDate() + 30)
    await prisma.medicineBatch.createMany({
      data: [
        { medicineId: medParacetamol.id, batchNumber: "PCM-24A", vendorId: vendor1.id, expiryDate: farExpiry, quantity: 500, mrp: 2, purchasePrice: 1.2 },
        { medicineId: medAmoxicillin.id, batchNumber: "AMX-24B", vendorId: vendor1.id, expiryDate: soonExpiry, quantity: 20, mrp: 8, purchasePrice: 5 },
        { medicineId: medCetirizine.id, batchNumber: "CTZ-24C", vendorId: vendor1.id, expiryDate: farExpiry, quantity: 15, mrp: 3, purchasePrice: 1.8 },
      ],
    })
  }

  const poCount = await prisma.purchaseOrder.count()
  if (poCount === 0) {
    await prisma.$transaction(async (tx) => {
      const poNumber = await generatePoNumber(tx)
      await tx.purchaseOrder.create({
        data: {
          poNumber,
          vendorId: vendor1.id,
          status: "ORDERED",
          createdById: admin.id,
          expectedDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          items: {
            create: [
              { medicineId: medAmoxicillin.id, quantity: 200, unitCost: 5 },
              { medicineId: medCetirizine.id, quantity: 150, unitCost: 1.8 },
            ],
          },
        },
      })
    })
  }

  console.log("Seeding equipment & facility tickets...")
  const equipmentCount = await prisma.equipment.count()
  if (equipmentCount === 0) {
    await prisma.equipment.createMany({
      data: [
        { assetCode: "AST-2026-00001", name: "Ventilator — Drager V500", category: "BIOMEDICAL", department: "ICU", location: "ICU Bay 1", vendorId: vendor1.id, status: "OPERATIONAL" },
        { assetCode: "AST-2026-00002", name: "Digital X-Ray Machine", category: "BIOMEDICAL", department: "Radiology", location: "Radiology Suite", status: "OPERATIONAL" },
        { assetCode: "AST-2026-00003", name: "ECG Machine", category: "BIOMEDICAL", department: "Cardiology", location: "OPD Block A", status: "UNDER_MAINTENANCE" },
      ],
    })
  }

  const ticketCount = await prisma.facilityTicket.count()
  if (ticketCount === 0) {
    await prisma.$transaction(async (tx) => {
      const t1 = await generateTicketNumber(tx)
      await tx.facilityTicket.create({
        data: { ticketNumber: t1, category: "HOUSEKEEPING", title: "Deep clean required — Ward G-102", location: "General Ward A", priority: "MEDIUM", status: "OPEN", reportedById: nurse.id },
      })
      const t2 = await generateTicketNumber(tx)
      await tx.facilityTicket.create({
        data: { ticketNumber: t2, category: "MAINTENANCE", title: "AC not cooling in OT-2", location: "Surgical Block", priority: "HIGH", status: "IN_PROGRESS", reportedById: frontDesk.id, assignedToId: admin.id },
      })
      const t3 = await generateTicketNumber(tx)
      await tx.facilityTicket.create({
        data: { ticketNumber: t3, category: "LAUNDRY", title: "Linen shortage in ICU", location: "ICU", priority: "LOW", status: "RESOLVED", reportedById: nurse.id, resolvedAt: now },
      })
    })
  }

  // ── Phase 5 — HRMS ──────────────────────────────────────────────────────

  console.log("Seeding departments & designations...")
  const billingUser = await prisma.user.findFirstOrThrow({ where: { email: "billing@naazhospital.test" } })

  async function upsertDepartment(name: string, headId: string) {
    const existing = await prisma.department.findFirst({ where: { name } })
    if (existing) return existing
    return prisma.department.create({ data: { name, headId } })
  }
  const deptCardiology = await upsertDepartment("Cardiology", drAisha.id)
  const deptOrthopedics = await upsertDepartment("Orthopedics", drRohan.id)
  const deptPediatrics = await upsertDepartment("Pediatrics", drPriya.id)
  const deptAdmin = await upsertDepartment("Administration", admin.id)

  async function upsertDesignation(title: string, departmentId: string | null) {
    const existing = await prisma.designation.findFirst({ where: { title, departmentId } })
    if (existing) return existing
    return prisma.designation.create({ data: { title, departmentId } })
  }
  const desigSeniorConsultant = await upsertDesignation("Senior Consultant", deptCardiology.id)
  const desigConsultant = await upsertDesignation("Consultant", deptOrthopedics.id)
  const desigPediatrician = await upsertDesignation("Consultant Pediatrician", deptPediatrics.id)
  const desigFrontDesk = await upsertDesignation("Front Desk Executive", deptAdmin.id)
  const desigNurse = await upsertDesignation("Staff Nurse", deptCardiology.id)
  const desigBilling = await upsertDesignation("Billing Executive", deptAdmin.id)
  const desigAdmin = await upsertDesignation("System Administrator", deptAdmin.id)

  console.log("Seeding employee profiles...")
  async function upsertEmployee(userId: string, departmentId: string, designationId: string, dateOfJoining: Date, reportingManagerId?: string) {
    const existing = await prisma.employee.findUnique({ where: { userId } })
    if (existing) return existing
    return prisma.$transaction(async (tx) => {
      const employeeCode = await generateEmployeeCode(tx)
      return tx.employee.create({
        data: { userId, employeeCode, departmentId, designationId, dateOfJoining, employmentType: "FULL_TIME", reportingManagerId },
      })
    })
  }
  const empAisha = await upsertEmployee(drAisha.id, deptCardiology.id, desigSeniorConsultant.id, new Date("2019-03-01"))
  const empRohan = await upsertEmployee(drRohan.id, deptOrthopedics.id, desigConsultant.id, new Date("2020-06-15"))
  const empPriya = await upsertEmployee(drPriya.id, deptPediatrics.id, desigPediatrician.id, new Date("2021-01-10"))
  const empFrontDesk = await upsertEmployee(frontDesk.id, deptAdmin.id, desigFrontDesk.id, new Date("2022-02-01"))
  const empNurse = await upsertEmployee(nurse.id, deptCardiology.id, desigNurse.id, new Date("2022-08-20"), empAisha.id)
  const empBilling = await upsertEmployee(billingUser.id, deptAdmin.id, desigBilling.id, new Date("2023-04-05"))
  const empAdmin = await upsertEmployee(admin.id, deptAdmin.id, desigAdmin.id, new Date("2018-01-01"))

  console.log("Seeding salary structures...")
  async function upsertSalary(employeeId: string, basic: number, hra: number, pf: number) {
    const existing = await prisma.salaryStructure.findUnique({ where: { employeeId } })
    if (existing) return existing
    return prisma.salaryStructure.create({
      data: { employeeId, basic, hra, conveyance: 2000, medicalAllowance: 1500, specialAllowance: 3000, pf, professionalTax: 200, otherDeductions: 0 },
    })
  }
  await upsertSalary(empFrontDesk.id, 35000, 14000, 1800)
  await upsertSalary(empNurse.id, 45000, 18000, 2400)
  await upsertSalary(empBilling.id, 38000, 15000, 2000)
  await upsertSalary(empAdmin.id, 80000, 32000, 4800)

  console.log("Seeding leave types & balances...")
  async function upsertLeaveType(name: string, daysPerYear: number, paid: boolean) {
    const existing = await prisma.leaveType.findFirst({ where: { name } })
    if (existing) return existing
    return prisma.leaveType.create({ data: { name, daysPerYear, paid } })
  }
  const leaveCasual = await upsertLeaveType("Casual Leave", 12, true)
  const leaveSick = await upsertLeaveType("Sick Leave", 10, true)
  await upsertLeaveType("Earned Leave", 15, true)
  await upsertLeaveType("Unpaid Leave", 0, false)

  const year = now.getFullYear()
  async function upsertLeaveBalance(employeeId: string, leaveTypeId: string, allocated: number, used: number) {
    await prisma.leaveBalance.upsert({
      where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year } },
      create: { employeeId, leaveTypeId, year, allocated, used },
      update: {},
    })
  }
  await upsertLeaveBalance(empFrontDesk.id, leaveCasual.id, 12, 2)
  await upsertLeaveBalance(empNurse.id, leaveSick.id, 10, 1)

  const leaveRequestCount = await prisma.leaveRequest.count()
  if (leaveRequestCount === 0) {
    const leaveFrom = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
    const leaveTo = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000)
    await prisma.leaveRequest.create({
      data: { employeeId: empFrontDesk.id, leaveTypeId: leaveCasual.id, fromDate: leaveFrom, toDate: leaveTo, days: 2, reason: "Family function", status: "PENDING" },
    })
  }

  console.log("Seeding shifts & assignments...")
  async function upsertShift(name: string, startTime: string, endTime: string) {
    const existing = await prisma.shift.findFirst({ where: { name } })
    if (existing) return existing
    return prisma.shift.create({ data: { name, startTime, endTime } })
  }
  const shiftMorning = await upsertShift("Morning", "08:00", "16:00")
  await upsertShift("Evening", "16:00", "00:00")
  await upsertShift("Night", "00:00", "08:00")

  const shiftAssignmentCount = await prisma.shiftAssignment.count()
  if (shiftAssignmentCount === 0) {
    await prisma.shiftAssignment.create({ data: { employeeId: empNurse.id, shiftId: shiftMorning.id, date: new Date(now.toDateString()) } })
  }

  console.log("Seeding performance reviews & training...")
  const reviewCount = await prisma.performanceReview.count()
  if (reviewCount === 0) {
    await prisma.performanceReview.create({
      data: {
        employeeId: empNurse.id,
        reviewerId: drAisha.id,
        periodLabel: "Q2 2026",
        rating: 4,
        strengths: "Excellent patient care and punctuality.",
        improvements: "Could improve documentation speed.",
        goals: "Complete advanced cardiac care certification.",
        status: "SUBMITTED",
      },
    })
  }

  const trainingCount = await prisma.trainingProgram.count()
  if (trainingCount === 0) {
    const program = await prisma.trainingProgram.create({
      data: {
        title: "Basic Life Support (BLS) Recertification",
        description: "Mandatory annual BLS recertification for clinical staff.",
        trainer: "Dr. Aisha Khan",
        scheduledAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        durationHours: 4,
      },
    })
    await prisma.trainingEnrollment.createMany({
      data: [{ programId: program.id, employeeId: empNurse.id }, { programId: program.id, employeeId: empFrontDesk.id }],
    })
  }

  console.log("Seeding recruitment...")
  const jobOpeningCount = await prisma.jobOpening.count()
  if (jobOpeningCount === 0) {
    const opening = await prisma.jobOpening.create({
      data: { title: "Staff Nurse — ICU", departmentId: deptCardiology.id, positions: 2, description: "Looking for experienced ICU nurses.", postedById: admin.id },
    })
    await prisma.candidate.create({
      data: { jobOpeningId: opening.id, name: "Kavita Menon", email: "kavita.menon@example.com", phone: "9820055555", stage: "INTERVIEW" },
    })
  }

  console.log("Seeding onboarding tasks...")
  const onboardingCount = await prisma.onboardingTask.count()
  if (onboardingCount === 0) {
    await prisma.onboardingTask.createMany({
      data: [
        { employeeId: empBilling.id, title: "Issue laptop and system access", assignedToId: admin.id },
        { employeeId: empBilling.id, title: "Complete HR orientation session", dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) },
      ],
    })
  }

  console.log("Seeding announcements...")
  const announcementCount = await prisma.announcement.count()
  if (announcementCount === 0) {
    await prisma.announcement.create({
      data: { title: "Annual Health Checkup Camp", body: "Free annual health checkup camp for all staff on the last Friday of this month.", postedById: admin.id, audience: "ALL", pinned: true },
    })
  }

  console.log("Seeding chat channels...")
  const channelCount = await prisma.chatChannel.count()
  if (channelCount === 0) {
    const channel = await prisma.chatChannel.create({
      data: {
        name: "general",
        members: { create: [{ userId: admin.id }, { userId: drAisha.id }, { userId: frontDesk.id }, { userId: nurse.id }] },
      },
    })
    await prisma.chatMessage.create({ data: { channelId: channel.id, senderId: admin.id, body: "Welcome to the Naaz Hospital staff channel!" } })
    await prisma.chatMessage.create({ data: { channelId: channel.id, senderId: frontDesk.id, body: "Thanks! Glad to be here." } })
  }

  console.log("Seeding tasks & meetings...")
  const taskCount = await prisma.task.count()
  if (taskCount === 0) {
    await prisma.task.create({
      data: { title: "Prepare monthly attendance report", assignedToId: frontDesk.id, assignedById: admin.id, dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), priority: "MEDIUM" },
    })
  }

  const meetingCount = await prisma.meeting.count()
  if (meetingCount === 0) {
    await prisma.meeting.create({
      data: {
        title: "Monthly Department Heads Sync",
        organizerId: admin.id,
        startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        location: "Conference Room A",
        attendees: { create: [{ userId: admin.id }, { userId: drAisha.id }, { userId: drRohan.id }, { userId: drPriya.id }] },
      },
    })
  }

  console.log("Seeding exit request & documents...")
  const exitCount = await prisma.exitRequest.count()
  if (exitCount === 0) {
    await prisma.exitRequest.create({
      data: {
        employeeId: empBilling.id,
        resignationDate: yesterday,
        lastWorkingDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
        reason: "Relocating to another city",
        status: "PENDING",
      },
    })
    await prisma.employee.update({ where: { id: empBilling.id }, data: { status: "ACTIVE" } })
  }

  const employeeDocCount = await prisma.employeeDocument.count()
  if (employeeDocCount === 0) {
    await prisma.employeeDocument.create({
      data: { employeeId: empNurse.id, title: "Nursing License", category: "CERTIFICATE", fileUrl: "https://example.com/docs/nursing-license.pdf" },
    })
  }

  console.log("Seeding biometric device & today's attendance...")
  const deviceCount = await prisma.biometricDevice.count()
  const mainGateDevice = deviceCount === 0
    ? await prisma.biometricDevice.create({ data: { name: "Main Gate Scanner", location: "Main Entrance" } })
    : await prisma.biometricDevice.findFirstOrThrow()

  const todayAttendanceCount = await prisma.attendanceRecord.count({ where: { date: new Date(now.toDateString()) } })
  if (todayAttendanceCount === 0) {
    const punchIn = new Date(now); punchIn.setHours(9, 2, 0, 0)
    await prisma.biometricLog.create({ data: { deviceId: mainGateDevice.id, employeeId: empNurse.id, punchTime: punchIn, punchType: "IN" } })
    await prisma.attendanceRecord.create({
      data: { employeeId: empNurse.id, date: new Date(now.toDateString()), checkIn: punchIn, status: "PRESENT", source: "BIOMETRIC" },
    })
    await prisma.attendanceRecord.create({
      data: { employeeId: empFrontDesk.id, date: new Date(now.toDateString()), checkIn: new Date(new Date(now).setHours(9, 0, 0, 0)), status: "PRESENT", source: "MANUAL" },
    })
  }

  console.log("Seed complete.")
  console.log({
    admin: admin.email,
    doctors: doctors.map((d) => d.email),
    patients: patients.map((p) => p.uhid),
    employees: [empAisha, empRohan, empPriya, empFrontDesk, empNurse, empBilling, empAdmin].map((e) => e.employeeCode),
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
