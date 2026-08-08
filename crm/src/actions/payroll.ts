"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { toPlain } from "@/lib/serialize"
import {
  salaryStructureSchema,
  payrollRunSchema,
  type SalaryStructureInput,
  type PayrollRunInput,
} from "@/lib/validations/hr"

// ── Salary Structures ───────────────────────────────────────────────────

export async function getSalaryStructures() {
  const structures = await prisma.salaryStructure.findMany({
    include: { employee: { include: { user: true, department: true } } },
    orderBy: { employee: { user: { name: "asc" } } },
  })
  return toPlain(structures)
}

export async function upsertSalaryStructure(input: SalaryStructureInput) {
  const data = salaryStructureSchema.parse(input)
  const structure = await prisma.salaryStructure.upsert({
    where: { employeeId: data.employeeId },
    create: data,
    update: data,
  })
  revalidatePath("/hr/payroll")
  return toPlain(structure)
}

// ── Payroll Runs ────────────────────────────────────────────────────────

export async function getPayrollRuns() {
  const runs = await prisma.payrollRun.findMany({
    include: { payslips: true },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  })
  return toPlain(runs)
}

export async function getPayrollRun(id: string) {
  const run = await prisma.payrollRun.findUnique({
    where: { id },
    include: { payslips: { include: { employee: { include: { user: true, department: true } } } } },
  })
  if (!run) return null
  return toPlain(run)
}

export async function processPayrollRun(input: PayrollRunInput) {
  const data = payrollRunSchema.parse(input)

  const run = await prisma.$transaction(async (tx) => {
    const existing = await tx.payrollRun.findUnique({ where: { month_year: { month: data.month, year: data.year } } })
    if (existing && existing.status !== "DRAFT") throw new Error("This payroll run has already been processed")

    const payrollRun = existing ?? (await tx.payrollRun.create({ data: { month: data.month, year: data.year } }))

    const structures = await tx.salaryStructure.findMany({ where: { employee: { status: "ACTIVE" } } })
    for (const s of structures) {
      const grossEarnings = Number(s.basic) + Number(s.hra) + Number(s.conveyance) + Number(s.medicalAllowance) + Number(s.specialAllowance)
      const totalDeductions = Number(s.pf) + Number(s.professionalTax) + Number(s.otherDeductions)
      const netPay = grossEarnings - totalDeductions

      await tx.payslip.upsert({
        where: { payrollRunId_employeeId: { payrollRunId: payrollRun.id, employeeId: s.employeeId } },
        create: {
          payrollRunId: payrollRun.id,
          employeeId: s.employeeId,
          basic: s.basic,
          hra: s.hra,
          conveyance: s.conveyance,
          medicalAllowance: s.medicalAllowance,
          specialAllowance: s.specialAllowance,
          grossEarnings,
          pf: s.pf,
          professionalTax: s.professionalTax,
          otherDeductions: s.otherDeductions,
          totalDeductions,
          netPay,
        },
        update: {
          basic: s.basic,
          hra: s.hra,
          conveyance: s.conveyance,
          medicalAllowance: s.medicalAllowance,
          specialAllowance: s.specialAllowance,
          grossEarnings,
          pf: s.pf,
          professionalTax: s.professionalTax,
          otherDeductions: s.otherDeductions,
          totalDeductions,
          netPay,
        },
      })
    }

    return tx.payrollRun.update({ where: { id: payrollRun.id }, data: { status: "PROCESSED", processedAt: new Date() } })
  })

  revalidatePath("/hr/payroll")
  return toPlain(run)
}

export async function markPayrollRunPaid(id: string) {
  const run = await prisma.payrollRun.update({ where: { id }, data: { status: "PAID", paidAt: new Date() } })
  revalidatePath("/hr/payroll")
  return toPlain(run)
}

export async function getEmployeePayslips(employeeId: string) {
  const payslips = await prisma.payslip.findMany({
    where: { employeeId },
    include: { payrollRun: true },
    orderBy: [{ payrollRun: { year: "desc" } }, { payrollRun: { month: "desc" } }],
  })
  return toPlain(payslips)
}
