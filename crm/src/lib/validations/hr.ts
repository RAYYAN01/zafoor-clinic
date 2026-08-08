import { z } from "zod"

// ── Departments & Designations ─────────────────────────────────────────

export const departmentSchema = z.object({
  name: z.string().trim().min(1, "Department name is required"),
  code: z.string().trim().optional(),
  headId: z.string().optional(),
})
export type DepartmentInput = z.infer<typeof departmentSchema>

export const designationSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  departmentId: z.string().optional(),
  level: z.string().trim().optional(),
})
export type DesignationInput = z.infer<typeof designationSchema>

// ── Employees ───────────────────────────────────────────────────────────

export const employeeSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Valid email is required"),
  phone: z.string().trim().optional(),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  reportingManagerId: z.string().optional(),
  dateOfJoining: z.string().min(1, "Date of joining is required"),
  dob: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]),
  address: z.string().trim().optional(),
  emergencyContactName: z.string().trim().optional(),
  emergencyContactPhone: z.string().trim().optional(),
})
export type EmployeeInput = z.infer<typeof employeeSchema>

export const employeeStatusSchema = z.object({
  status: z.enum(["ACTIVE", "ON_LEAVE", "SUSPENDED", "EXITED"]),
})
export type EmployeeStatusInput = z.infer<typeof employeeStatusSchema>

// ── Attendance & Biometric ─────────────────────────────────────────────

export const attendanceMarkSchema = z.object({
  employeeId: z.string().min(1, "Select an employee"),
  date: z.string().min(1, "Date is required"),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "LATE", "ON_LEAVE", "HOLIDAY"]),
  notes: z.string().trim().optional(),
})
export type AttendanceMarkInput = z.infer<typeof attendanceMarkSchema>

export const biometricLogSchema = z.object({
  employeeId: z.string().min(1, "Select an employee"),
  deviceId: z.string().min(1, "Select a device"),
  punchTime: z.string().min(1, "Punch time is required"),
  punchType: z.enum(["IN", "OUT"]),
})
export type BiometricLogInput = z.infer<typeof biometricLogSchema>

// ── Payroll & Salary ────────────────────────────────────────────────────

export const salaryStructureSchema = z.object({
  employeeId: z.string().min(1, "Select an employee"),
  basic: z.coerce.number().nonnegative(),
  hra: z.coerce.number().nonnegative().default(0),
  conveyance: z.coerce.number().nonnegative().default(0),
  medicalAllowance: z.coerce.number().nonnegative().default(0),
  specialAllowance: z.coerce.number().nonnegative().default(0),
  pf: z.coerce.number().nonnegative().default(0),
  professionalTax: z.coerce.number().nonnegative().default(0),
  otherDeductions: z.coerce.number().nonnegative().default(0),
})
export type SalaryStructureInput = z.infer<typeof salaryStructureSchema>

export const payrollRunSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000),
})
export type PayrollRunInput = z.infer<typeof payrollRunSchema>

// ── Leaves ──────────────────────────────────────────────────────────────

export const leaveTypeSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  daysPerYear: z.coerce.number().int().positive(),
  paid: z.boolean().default(true),
})
export type LeaveTypeInput = z.infer<typeof leaveTypeSchema>

export const leaveRequestSchema = z.object({
  employeeId: z.string().min(1, "Select an employee"),
  leaveTypeId: z.string().min(1, "Select a leave type"),
  fromDate: z.string().min(1, "From date is required"),
  toDate: z.string().min(1, "To date is required"),
  reason: z.string().trim().optional(),
})
export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>

export const leaveDecisionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "CANCELLED"]),
})
export type LeaveDecisionInput = z.infer<typeof leaveDecisionSchema>

// ── Shift Scheduling ────────────────────────────────────────────────────

export const shiftSchema = z.object({
  name: z.string().trim().min(1, "Shift name is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
})
export type ShiftInput = z.infer<typeof shiftSchema>

export const shiftAssignmentSchema = z.object({
  employeeId: z.string().min(1, "Select an employee"),
  shiftId: z.string().min(1, "Select a shift"),
  date: z.string().min(1, "Date is required"),
})
export type ShiftAssignmentInput = z.infer<typeof shiftAssignmentSchema>

// ── Performance & Training ─────────────────────────────────────────────

export const performanceReviewSchema = z.object({
  employeeId: z.string().min(1, "Select an employee"),
  periodLabel: z.string().trim().min(1, "Period is required"),
  rating: z.coerce.number().int().min(1).max(5),
  strengths: z.string().trim().optional(),
  improvements: z.string().trim().optional(),
  goals: z.string().trim().optional(),
})
export type PerformanceReviewInput = z.infer<typeof performanceReviewSchema>

export const reviewStatusSchema = z.object({
  status: z.enum(["DRAFT", "SUBMITTED", "ACKNOWLEDGED"]),
})
export type ReviewStatusInput = z.infer<typeof reviewStatusSchema>

export const trainingProgramSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  trainer: z.string().trim().optional(),
  scheduledAt: z.string().min(1, "Scheduled date is required"),
  durationHours: z.coerce.number().positive().optional(),
})
export type TrainingProgramInput = z.infer<typeof trainingProgramSchema>

export const trainingEnrollSchema = z.object({
  employeeIds: z.array(z.string()).min(1, "Select at least one employee"),
})
export type TrainingEnrollInput = z.infer<typeof trainingEnrollSchema>

export const enrollmentStatusSchema = z.object({
  status: z.enum(["ENROLLED", "COMPLETED", "NO_SHOW"]),
  score: z.coerce.number().min(0).max(100).optional(),
})
export type EnrollmentStatusInput = z.infer<typeof enrollmentStatusSchema>

// ── Recruitment & Onboarding ────────────────────────────────────────────

export const jobOpeningSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  departmentId: z.string().optional(),
  positions: z.coerce.number().int().positive().default(1),
  description: z.string().trim().optional(),
})
export type JobOpeningInput = z.infer<typeof jobOpeningSchema>

export const jobOpeningStatusSchema = z.object({
  status: z.enum(["OPEN", "ON_HOLD", "CLOSED"]),
})
export type JobOpeningStatusInput = z.infer<typeof jobOpeningStatusSchema>

export const candidateSchema = z.object({
  jobOpeningId: z.string().min(1, "Select a job opening"),
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Valid email is required"),
  phone: z.string().trim().optional(),
  resumeUrl: z.string().trim().optional(),
  notes: z.string().trim().optional(),
})
export type CandidateInput = z.infer<typeof candidateSchema>

export const candidateStageSchema = z.object({
  stage: z.enum(["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"]),
})
export type CandidateStageInput = z.infer<typeof candidateStageSchema>

export const onboardingTaskSchema = z.object({
  employeeId: z.string().min(1, "Select an employee"),
  title: z.string().trim().min(1, "Title is required"),
  dueDate: z.string().optional(),
  assignedToId: z.string().optional(),
})
export type OnboardingTaskInput = z.infer<typeof onboardingTaskSchema>

// ── Announcements & Chat ────────────────────────────────────────────────

export const announcementSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  body: z.string().trim().min(1, "Body is required"),
  audience: z.enum(["ALL", "DEPARTMENT"]),
  departmentId: z.string().optional(),
  pinned: z.boolean().default(false),
})
export type AnnouncementInput = z.infer<typeof announcementSchema>

export const chatChannelSchema = z.object({
  name: z.string().trim().min(1, "Channel name is required"),
  memberIds: z.array(z.string()).default([]),
})
export type ChatChannelInput = z.infer<typeof chatChannelSchema>

export const chatMessageSchema = z.object({
  body: z.string().trim().min(1, "Message cannot be empty"),
})
export type ChatMessageInput = z.infer<typeof chatMessageSchema>

// ── Tasks & Meetings ────────────────────────────────────────────────────

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  assignedToId: z.string().min(1, "Select an assignee"),
  dueDate: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
})
export type TaskInput = z.infer<typeof taskSchema>

export const taskStatusSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]),
})
export type TaskStatusInput = z.infer<typeof taskStatusSchema>

export const meetingSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  location: z.string().trim().optional(),
  meetingLink: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  attendeeIds: z.array(z.string()).default([]),
})
export type MeetingInput = z.infer<typeof meetingSchema>

export const meetingStatusSchema = z.object({
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]),
})
export type MeetingStatusInput = z.infer<typeof meetingStatusSchema>

// ── Exit Management ─────────────────────────────────────────────────────

export const exitRequestSchema = z.object({
  employeeId: z.string().min(1, "Select an employee"),
  resignationDate: z.string().min(1, "Resignation date is required"),
  lastWorkingDate: z.string().min(1, "Last working date is required"),
  reason: z.string().trim().optional(),
})
export type ExitRequestInput = z.infer<typeof exitRequestSchema>

export const exitUpdateSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "COMPLETED", "WITHDRAWN"]),
  clearanceIT: z.boolean().optional(),
  clearanceFinance: z.boolean().optional(),
  clearanceAdmin: z.boolean().optional(),
  exitInterviewNotes: z.string().trim().optional(),
})
export type ExitUpdateInput = z.infer<typeof exitUpdateSchema>

// ── Documents ────────────────────────────────────────────────────────────

export const employeeDocumentSchema = z.object({
  employeeId: z.string().min(1, "Select an employee"),
  title: z.string().trim().min(1, "Title is required"),
  category: z.enum(["ID_PROOF", "CONTRACT", "CERTIFICATE", "RESUME", "OTHER"]),
  fileUrl: z.string().trim().min(1, "File URL is required"),
})
export type EmployeeDocumentInput = z.infer<typeof employeeDocumentSchema>
