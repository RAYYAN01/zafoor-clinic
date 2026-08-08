"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  ListOrdered,
  Clock,
  CheckSquare,
  MessageSquare,
  CalendarClock,
  Stethoscope,
  FileEdit,
  PenTool,
  Receipt,
  ShieldCheck,
  Undo2,
  TrendingUp,
  AlertCircle,
  Wallet,
  BarChart3,
  Building2,
  Package,
  Gauge,
  BedDouble,
  HeartPulse,
  Scissors,
  Siren,
  Truck,
  FlaskConical,
  Radio,
  PillBottle,
  ClipboardList,
  Factory,
  Cpu,
  Wrench,
  LayoutGrid,
  IdCard,
  Network,
  Fingerprint,
  Wallet2,
  CalendarOff,
  CalendarRange,
  Award,
  GraduationCap,
  Briefcase,
  UserPlus2,
  Megaphone,
  MessagesSquare,
  ListTodo,
  Video,
  CalendarCheck2,
  LogOut,
  FolderOpen,
  CreditCard,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navGroups = [
  {
    label: "Care",
    dot: "bg-blue-500",
    text: "text-blue-600 dark:text-blue-400",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/patients", label: "Patients", icon: Users },
      { href: "/appointments", label: "Appointments", icon: CalendarDays },
      { href: "/queue", label: "Queue", icon: ListOrdered },
      { href: "/waiting-list", label: "Waiting List", icon: Clock },
      { href: "/follow-ups", label: "Follow-ups", icon: CheckSquare },
      { href: "/communications", label: "Communications", icon: MessageSquare },
    ],
  },
  {
    label: "Clinical",
    dot: "bg-violet-500",
    text: "text-violet-600 dark:text-violet-400",
    items: [
      { href: "/appointments/availability", label: "Doctor Availability", icon: CalendarClock },
      { href: "/templates", label: "Doctor Templates", icon: FileEdit },
      { href: "/settings/signature", label: "Digital Signature", icon: PenTool },
    ],
  },
  {
    label: "Billing & Finance",
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    items: [
      { href: "/billing", label: "Billing", icon: Receipt },
      { href: "/billing/claims", label: "Insurance Claims", icon: ShieldCheck },
      { href: "/billing/refunds", label: "Refunds", icon: Undo2 },
      { href: "/finance/dashboard", label: "Finance Dashboard", icon: TrendingUp },
      { href: "/finance/outstanding", label: "Outstanding Dues", icon: AlertCircle },
      { href: "/finance/cash-counter", label: "Cash Counter", icon: Wallet },
      { href: "/finance/expenses", label: "Expenses", icon: Receipt },
      { href: "/finance/reports", label: "Reports", icon: BarChart3 },
      { href: "/finance/corporate-accounts", label: "Corporate Accounts", icon: Building2 },
      { href: "/finance/packages", label: "Packages", icon: Package },
    ],
  },
  {
    label: "Operations",
    dot: "bg-orange-500",
    text: "text-orange-600 dark:text-orange-400",
    items: [
      { href: "/operations/dashboard", label: "Operations Dashboard", icon: Gauge },
      { href: "/operations/beds", label: "Beds & Wards", icon: BedDouble },
      { href: "/operations/icu", label: "ICU", icon: HeartPulse },
      { href: "/operations/ot", label: "Operation Theatre", icon: Scissors },
      { href: "/operations/emergency", label: "Emergency", icon: Siren },
      { href: "/operations/ambulance", label: "Ambulance", icon: Truck },
      { href: "/operations/lab", label: "Laboratory", icon: FlaskConical },
      { href: "/operations/radiology", label: "Radiology", icon: Radio },
      { href: "/operations/pharmacy", label: "Pharmacy Inventory", icon: PillBottle },
      { href: "/operations/pharmacy/purchase-orders", label: "Purchase Orders", icon: ClipboardList },
      { href: "/operations/vendors", label: "Vendor Management", icon: Factory },
      { href: "/operations/assets", label: "Equipment & Assets", icon: Cpu },
      { href: "/operations/facility", label: "Facility Tickets", icon: Wrench },
    ],
  },
  {
    label: "HR",
    dot: "bg-pink-500",
    text: "text-pink-600 dark:text-pink-400",
    items: [
      { href: "/hr/dashboard", label: "HR Dashboard", icon: LayoutGrid },
      { href: "/hr/employees", label: "Employee Profiles", icon: IdCard },
      { href: "/hr/departments", label: "Departments & Designations", icon: Network },
      { href: "/hr/attendance", label: "Attendance & Biometric", icon: Fingerprint },
      { href: "/hr/payroll", label: "Payroll & Salary", icon: Wallet2 },
      { href: "/hr/leaves", label: "Leaves", icon: CalendarOff },
      { href: "/hr/shifts", label: "Shift Scheduling", icon: CalendarRange },
      { href: "/hr/performance", label: "Performance", icon: Award },
      { href: "/hr/training", label: "Training", icon: GraduationCap },
      { href: "/hr/recruitment", label: "Recruitment", icon: Briefcase },
      { href: "/hr/onboarding", label: "Onboarding", icon: UserPlus2 },
      { href: "/hr/announcements", label: "Announcements", icon: Megaphone },
      { href: "/hr/chat", label: "Internal Chat", icon: MessagesSquare },
      { href: "/hr/tasks", label: "Task Management", icon: ListTodo },
      { href: "/hr/meetings", label: "Meeting Scheduler", icon: Video },
      { href: "/hr/calendar", label: "Calendar", icon: CalendarCheck2 },
      { href: "/hr/exit", label: "Exit Management", icon: LogOut },
      { href: "/hr/documents", label: "Documents", icon: FolderOpen },
      { href: "/hr/id-cards", label: "ID Cards", icon: CreditCard },
    ],
  },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r bg-background">
      <div className="flex items-center gap-2 px-5 h-16 border-b shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Stethoscope className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Naaz Hospital</p>
          <p className="text-xs text-muted-foreground">Patient CRM</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className={cn("flex items-center gap-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide", group.text)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", group.dot)} />
              {group.label}
            </p>
            {group.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href === "/appointments" && pathname.startsWith("/appointments/") && !pathname.startsWith("/appointments/availability")) ||
                (item.href === "/billing" && pathname.startsWith("/billing/") && !pathname.startsWith("/billing/claims") && !pathname.startsWith("/billing/refunds")) ||
                (item.href === "/operations/pharmacy" && pathname.startsWith("/operations/pharmacy/") && !pathname.startsWith("/operations/pharmacy/purchase-orders")) ||
                (!["/appointments", "/billing", "/operations/pharmacy"].includes(item.href) && item.href.length > 1 && pathname.startsWith(`${item.href}/`))
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", !isActive && group.text)} />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
