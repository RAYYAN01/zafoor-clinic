"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { toPlain } from "@/lib/serialize"
import { generateEmployeeCode } from "@/lib/sequence"
import {
  departmentSchema,
  designationSchema,
  employeeSchema,
  employeeStatusSchema,
  type DepartmentInput,
  type DesignationInput,
  type EmployeeInput,
  type EmployeeStatusInput,
} from "@/lib/validations/hr"

// ── Departments ─────────────────────────────────────────────────────────

export async function getDepartments() {
  const departments = await prisma.department.findMany({
    include: { head: true, employees: true, _count: { select: { employees: true } } },
    orderBy: { name: "asc" },
  })
  return toPlain(departments)
}

export async function createDepartment(input: DepartmentInput) {
  const data = departmentSchema.parse(input)
  const department = await prisma.department.create({
    data: { name: data.name, code: data.code || null, headId: data.headId || null },
  })
  revalidatePath("/hr/departments")
  return toPlain(department)
}

export async function deleteDepartment(id: string) {
  await prisma.department.delete({ where: { id } })
  revalidatePath("/hr/departments")
}

// ── Designations ────────────────────────────────────────────────────────

export async function getDesignations() {
  const designations = await prisma.designation.findMany({
    include: { department: true, _count: { select: { employees: true } } },
    orderBy: { title: "asc" },
  })
  return toPlain(designations)
}

export async function createDesignation(input: DesignationInput) {
  const data = designationSchema.parse(input)
  const designation = await prisma.designation.create({
    data: { title: data.title, departmentId: data.departmentId || null, level: data.level || null },
  })
  revalidatePath("/hr/departments")
  return toPlain(designation)
}

export async function deleteDesignation(id: string) {
  await prisma.designation.delete({ where: { id } })
  revalidatePath("/hr/departments")
}

// ── Employees ───────────────────────────────────────────────────────────

export async function getEmployees(params?: { departmentId?: string; status?: string }) {
  const employees = await prisma.employee.findMany({
    where: {
      departmentId: params?.departmentId || undefined,
      status: (params?.status as never) || undefined,
    },
    include: { user: true, department: true, designation: true, reportingManager: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  })
  return toPlain(employees)
}

export async function getEmployee(id: string) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      user: true,
      department: true,
      designation: true,
      reportingManager: { include: { user: true } },
      directReports: { include: { user: true } },
      salaryStructure: true,
      leaveBalances: { include: { leaveType: true } },
      documents: true,
      exitRequest: true,
    },
  })
  if (!employee) return null
  return toPlain(employee)
}

export async function getEmployeesForSelect() {
  const employees = await prisma.employee.findMany({
    where: { status: "ACTIVE" },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  })
  return toPlain(employees.map((e) => ({ id: e.id, name: e.user.name, employeeCode: e.employeeCode })))
}

export async function createEmployee(input: EmployeeInput) {
  const data = employeeSchema.parse(input)

  const employee = await prisma.$transaction(async (tx) => {
    const employeeCode = await generateEmployeeCode(tx)
    const user = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        role: "FRONT_DESK",
      },
    })
    return tx.employee.create({
      data: {
        userId: user.id,
        employeeCode,
        departmentId: data.departmentId || null,
        designationId: data.designationId || null,
        reportingManagerId: data.reportingManagerId || null,
        dateOfJoining: new Date(data.dateOfJoining),
        dob: data.dob ? new Date(data.dob) : null,
        gender: data.gender || null,
        employmentType: data.employmentType,
        address: data.address || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactPhone: data.emergencyContactPhone || null,
      },
    })
  })

  revalidatePath("/hr/employees")
  return toPlain(employee)
}

export async function updateEmployeeStatus(id: string, input: EmployeeStatusInput) {
  const data = employeeStatusSchema.parse(input)
  const employee = await prisma.employee.update({ where: { id }, data })
  revalidatePath("/hr/employees")
  revalidatePath(`/hr/employees/${id}`)
  return toPlain(employee)
}

export async function issueIdCard(id: string) {
  const employee = await prisma.employee.update({ where: { id }, data: { idCardIssuedAt: new Date() } })
  revalidatePath("/hr/id-cards")
  return toPlain(employee)
}

export async function getHeadcountSummary() {
  const employees = await prisma.employee.findMany({ include: { department: true } })
  const active = employees.filter((e) => e.status === "ACTIVE").length
  const onLeave = employees.filter((e) => e.status === "ON_LEAVE").length
  const byDepartment: Record<string, number> = {}
  for (const e of employees) {
    const name = e.department?.name ?? "Unassigned"
    byDepartment[name] = (byDepartment[name] ?? 0) + 1
  }
  return { total: employees.length, active, onLeave, byDepartment }
}
