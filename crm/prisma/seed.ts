// Zafoor Clinic — demo/seed data.
// Creates enough data to exercise every surviving module: staff accounts,
// the clinic's review services, weekly availability, a couple of demo
// patients with a full appointment → encounter → prescription → bill →
// payment chain, and the website content rows (clinic settings, FAQs).
//
// Run with: npm run db:seed
import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { scryptSync, randomBytes } from "node:crypto"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

async function main() {
  console.log("Seeding Zafoor Clinic demo data…")

  // ── Staff ────────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      name: "Clinic Admin",
      email: "admin@zafoorclinic.test",
      phone: "8940399403",
      passwordHash: hashPassword("ChangeMe123!"),
      role: "ADMIN",
    },
  })

  const doctor = await prisma.user.create({
    data: {
      name: "Dr. Mufeeda Roohi",
      email: "doctor@zafoorclinic.test",
      phone: "8940399403",
      passwordHash: hashPassword("ChangeMe123!"),
      role: "DOCTOR",
      specialization: "Aesthetic Physician, Diabetologist & Family Physician",
      consultationFee: 500,
    },
  })

  const receptionist = await prisma.user.create({
    data: {
      name: "Front Desk",
      email: "reception@zafoorclinic.test",
      phone: "8940399403",
      passwordHash: hashPassword("ChangeMe123!"),
      role: "RECEPTIONIST",
    },
  })

  console.log(`  Staff created: ${admin.email}, ${doctor.email}, ${receptionist.email}`)

  // ── Doctor availability — Mon-Sat 6:00 PM - 10:00 PM, Sunday closed ──
  for (let day = 1; day <= 6; day++) {
    await prisma.doctorAvailability.create({
      data: { doctorId: doctor.id, dayOfWeek: day, startTime: "18:00", endTime: "22:00", slotDurationMinutes: 30 },
    })
  }
  console.log("  Doctor availability set (Mon-Sat 6-10 PM)")

  // ── Services — the clinic's review types ────────────────────────────
  const serviceDefs = [
    { slug: "hairfall-review", name: "Hairfall Review", shortDescription: "Consultation for hair loss and scalp concerns." },
    { slug: "acne-review", name: "Acne Review", shortDescription: "Consultation for acne and breakouts." },
    { slug: "thyroid-review", name: "Thyroid Review", shortDescription: "Consultation for thyroid-related concerns." },
    { slug: "skin-review", name: "Skin Review", shortDescription: "General skin consultation." },
    { slug: "diabetes-review", name: "Diabetes Review", shortDescription: "Consultation for diabetes management." },
    { slug: "general-review", name: "General Review", shortDescription: "General health consultation." },
    { slug: "skin-diabetes-general-review", name: "Skin, Diabetes & General Review", shortDescription: "Combined consultation covering skin, diabetes, and general health." },
  ]
  const services = []
  for (const [i, def] of serviceDefs.entries()) {
    services.push(
      await prisma.service.create({
        data: { ...def, durationMinutes: 30, displayOrder: i, active: true },
      })
    )
  }
  console.log(`  ${services.length} services created`)

  // ── Reviews — real patient reviews from the clinic's Google listing ──
  // (see https://share.google/752spGhgtYfOZZcy2), transcribed verbatim.
  // Not fabricated — every entry below is an actual published review.
  const reviewDefs = [
    {
      patientName: "Abdul Khadar",
      rating: 5,
      comment:
        "I came here for diabetic treatment, Dr Roohi guided me very well and clearly explained diet control, and also provided a diet chart, I followed only 2 weeks, My sugar level came 92/112 From 193/293, thank you Dr❤️",
      serviceSlug: "diabetes-review",
    },
    {
      patientName: "omar ali",
      rating: 5,
      comment:
        "Dr.Mufeeda Roohi diagnosing the patient well getting the medical records perfectly and starting the treatment. The treatment is periodically step by step to cure the patient according to their satisfaction. The clinic aim is to educate the patients of their disease and after the cure post control advice to refine throughout rest of their life. The clinic is very clean and hygienic. One is getting good tips of lifestyle and food habits to over come problems related to their disease. Masha Allah.",
      serviceSlug: "diabetes-review",
    },
    {
      patientName: "Sneha Vuppala",
      rating: 5,
      comment:
        "I came here for a cosmetic treatment and doctor guided me very well and explained the procedure very patiently the staff there also kind the clinic was pleasant and also treatments where affordable.",
      serviceSlug: "skin-review",
    },
    {
      patientName: "Aaliya Parvin",
      rating: 5,
      comment:
        "I had a great experience with Dr. Mufeeda. She quickly identified the root cause of my hair fall and explained the issue very clearly. Her approach to treatment was precise and to the point, without unnecessary medications or procedures. I started noticing positive results much sooner than I expected. I truly appreciate her efficiency, professionalism, and the care she showed throughout the process. Highly recommended for anyone dealing with hair fall concerns",
      serviceSlug: "hairfall-review",
    },
    {
      patientName: "Monica subbu",
      rating: 5,
      comment: "I have done hydra facial here\nVery satisfying\nCost efficient",
      serviceSlug: "skin-review",
    },
    {
      patientName: "Ponmozhi Narayanan",
      rating: 5,
      comment: "One of the best clinic in Sevenwells, Dr.Mufeeda Roohi is kind with patient. Good to visit Dr.Mufeeda for all the problems",
      serviceSlug: "general-review",
    },
    {
      patientName: "Apsara Apsara",
      rating: 5,
      comment:
        "When I caught a nasty cold last winter, the care I received at Zafoor Clinic made all the difference. The doctor took the time to explain my treatment plan and the remedies truly helped clear my congestion and soothe my sore throat.",
      serviceSlug: "general-review",
    },
    {
      patientName: "Habeeb",
      rating: 5,
      comment:
        "I would like to express my heartfelt gratitude for the outstanding care I received at your facility. From the moment I arrived, everyone I encountered was kind, professional, and attentive. Their dedication to patient well-being truly stood out.\n\nA special thanks to Dr. Mufeeda Roohi for going above and beyond to ensure my comfort and care. It's reassuring to know that such compassionate and skilled healthcare providers are part of the community.\n\nThank you for your incredible work!",
      serviceSlug: "general-review",
    },
    {
      patientName: "Junaith King",
      rating: 5,
      comment: "I went here for my leg pain issue\nDoctor gave me clear explanation and good service at really affordable cost.\nOverall treatment was good",
      serviceSlug: "general-review",
    },
  ]
  for (const [i, def] of reviewDefs.entries()) {
    const service = services.find((s) => s.slug === def.serviceSlug)
    await prisma.review.create({
      data: {
        patientName: def.patientName,
        rating: def.rating,
        comment: def.comment,
        serviceId: service ? service.id : null,
        published: true,
        displayOrder: i,
      },
    })
  }
  console.log(`  ${reviewDefs.length} real patient reviews seeded (published)`)

  // ── Clinic settings (website content) ───────────────────────────────
  await prisma.clinicSettings.upsert({
    where: { id: "clinic" },
    create: { id: "clinic" },
    update: {},
  })
  console.log("  Clinic settings initialized")

  // ── FAQs ─────────────────────────────────────────────────────────────
  const faqDefs = [
    { question: "What are your clinic timings?", answer: "We are open Monday to Saturday, 6:00 PM to 10:00 PM. We are closed on Sundays." },
    { question: "Do I need to book an appointment in advance?", answer: "Yes, booking in advance through our website or by phone helps us reduce your waiting time." },
    { question: "Where is Zafoor Clinic located?", answer: "No. 69/70, St. Xavier Street, Broadway, Sevenwells, George Town, Chennai - 600001, opposite Huda Mosque." },
    { question: "How can I contact the clinic?", answer: "You can call us at 8940399403 or email ZafoorClinic@gmail.com." },
  ]
  for (const [i, def] of faqDefs.entries()) {
    await prisma.fAQ.create({ data: { ...def, displayOrder: i } })
  }
  console.log(`  ${faqDefs.length} FAQs created`)

  // ── Demo patients ────────────────────────────────────────────────────
  const patient1 = await prisma.patient.create({
    data: {
      uhid: "ZC-DEMO-000001",
      firstName: "Demo",
      lastName: "Patient One",
      gender: "MALE",
      phone: "9000000001",
      email: "demo.patient1@example.com",
      city: "Chennai",
      state: "Tamil Nadu",
      registeredById: receptionist.id,
      communicationPreference: { create: { preferredChannel: "SMS" } },
    },
  })

  const patient2 = await prisma.patient.create({
    data: {
      uhid: "ZC-DEMO-000002",
      firstName: "Demo",
      lastName: "Patient Two",
      gender: "FEMALE",
      phone: "9000000002",
      email: "demo.patient2@example.com",
      city: "Chennai",
      state: "Tamil Nadu",
      source: "WEBSITE",
      registeredById: receptionist.id,
      communicationPreference: { create: { preferredChannel: "WHATSAPP" } },
    },
  })
  console.log(`  2 demo patients created (${patient1.uhid}, ${patient2.uhid})`)

  // ── Demo appointment → encounter → prescription chain ────────────────
  const today = new Date()
  const scheduledAt = new Date(today)
  scheduledAt.setHours(18, 30, 0, 0)

  const appointment = await prisma.appointment.create({
    data: {
      appointmentCode: "APT-DEMO-000001",
      patientId: patient1.id,
      doctorId: doctor.id,
      serviceId: services[0].id,
      scheduledAt,
      type: "IN_PERSON",
      status: "COMPLETED",
      reason: "Hair thinning for the past 3 months",
      source: "CRM",
      completedAt: scheduledAt,
      createdById: receptionist.id,
    },
  })

  const encounter = await prisma.encounter.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor.id,
      appointmentId: appointment.id,
      chiefComplaints: ["Hair thinning", "Scalp itching"],
      status: "FINALIZED",
      signedAt: new Date(),
      diagnoses: { create: [{ patientId: patient1.id, description: "Telogen effluvium", type: "PRIMARY", status: "ACTIVE" }] },
      clinicalNote: {
        create: {
          patientId: patient1.id,
          doctorId: doctor.id,
          subjective: "Patient reports increased hair fall over 3 months.",
          objective: "Diffuse thinning noted, scalp otherwise healthy.",
          assessment: "Telogen effluvium, likely stress-related.",
          plan: "Topical treatment, dietary advice, follow-up in 4 weeks.",
          status: "SIGNED",
          signedAt: new Date(),
        },
      },
    },
  })

  await prisma.prescription.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor.id,
      appointmentId: appointment.id,
      encounterId: encounter.id,
      diagnosis: "Telogen effluvium",
      items: {
        create: [{ medicineName: "Biotin supplement", dosage: "1 tablet", frequency: "Once daily", duration: "30 days" }],
      },
    },
  })

  const bill = await prisma.bill.create({
    data: {
      billNumber: "INV-DEMO-000001",
      patientId: patient1.id,
      appointmentId: appointment.id,
      serviceId: services[0].id,
      totalAmount: 500,
      netAmount: 500,
      amountPaid: 500,
      balanceDue: 0,
      status: "PAID",
      items: { create: [{ description: "Hairfall Review consultation", quantity: 1, unitPrice: 500, amount: 500 }] },
    },
  })

  await prisma.payment.create({
    data: {
      receiptNumber: "RCPT-DEMO-000001",
      patientId: patient1.id,
      billId: bill.id,
      amount: 500,
      method: "CASH",
      status: "SUCCESS",
      receivedById: receptionist.id,
    },
  })
  console.log("  Demo appointment/encounter/prescription/bill/payment chain created")

  // ── A pending website booking, for the appointments queue ────────────
  const pendingSlot = new Date(today)
  pendingSlot.setDate(pendingSlot.getDate() + 1)
  pendingSlot.setHours(19, 0, 0, 0)
  await prisma.appointment.create({
    data: {
      appointmentCode: "APT-DEMO-000002",
      patientId: patient2.id,
      doctorId: doctor.id,
      serviceId: services[1].id,
      scheduledAt: pendingSlot,
      type: "IN_PERSON",
      status: "PENDING",
      reason: "Recurring breakouts",
      source: "WEBSITE",
    },
  })
  console.log("  Pending website booking created")

  console.log("\nDone. Login credentials (change immediately in production):")
  console.log(`  ${admin.email} / ChangeMe123!`)
  console.log(`  ${doctor.email} / ChangeMe123!`)
  console.log(`  ${receptionist.email} / ChangeMe123!`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
