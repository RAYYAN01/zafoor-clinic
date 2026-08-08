"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PatientPicker } from "@/components/appointments/patient-picker"
import { billTypeLabels, payerTypeLabels } from "@/lib/labels"
import { formatCurrency } from "@/lib/format"
import { createBill } from "@/actions/billing"
import { getPatientInsurances } from "@/actions/patients"

type Package = { id: string; name: string; price: unknown; includedItems: string[] }
type CorporateAccount = { id: string; companyName: string }
type Insurance = { id: string; provider: string; policyNumber: string }
type LineItem = { description: string; hsnCode: string; quantity: string; unitPrice: string; taxRatePercent: string }

const emptyItem: LineItem = { description: "", hsnCode: "", quantity: "1", unitPrice: "", taxRatePercent: "0" }

export function BillForm({
  packages,
  corporateAccounts,
  initialPatient,
  defaultAdmissionId,
  defaultAppointmentId,
  defaultType,
}: {
  packages: Package[]
  corporateAccounts: CorporateAccount[]
  initialPatient: { id: string; name: string; uhid: string; phone: string; insurances: Insurance[] } | null
  defaultAdmissionId?: string
  defaultAppointmentId?: string
  defaultType?: string
}) {
  const router = useRouter()
  const [patientId, setPatientId] = useState(initialPatient?.id ?? "")
  const [patientInsurances, setPatientInsurances] = useState<Insurance[]>(initialPatient?.insurances ?? [])
  const [type, setType] = useState(defaultType ?? "OPD")
  const [payerType, setPayerType] = useState("SELF")
  const [insuranceId, setInsuranceId] = useState("")
  const [corporateAccountId, setCorporateAccountId] = useState("")
  const [packageId, setPackageId] = useState("")
  const [discountAmount, setDiscountAmount] = useState("0")
  const [items, setItems] = useState<LineItem[]>([{ ...emptyItem }])
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!patientId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset stale insurance list when the patient selection is cleared
      setPatientInsurances([])
      return
    }
    getPatientInsurances(patientId).then((list) =>
      setPatientInsurances(list.map((i) => ({ id: i.id, provider: i.provider, policyNumber: i.policyNumber })))
    )
  }, [patientId])

  function updateItem(index: number, field: keyof LineItem, value: string) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)))
  }

  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem }])
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function applyPackage(id: string) {
    setPackageId(id)
    const pkg = packages.find((p) => p.id === id)
    if (!pkg) return
    setItems([
      {
        description: pkg.name,
        hsnCode: "",
        quantity: "1",
        unitPrice: String(Number(pkg.price)),
        taxRatePercent: "0",
      },
    ])
  }

  const totals = useMemo(() => {
    let totalAmount = 0
    let totalTax = 0
    for (const item of items) {
      const qty = Number(item.quantity) || 0
      const price = Number(item.unitPrice) || 0
      const taxRate = Number(item.taxRatePercent) || 0
      const amount = qty * price
      totalAmount += amount
      totalTax += amount * (taxRate / 100)
    }
    const discount = Number(discountAmount) || 0
    const netAmount = totalAmount + totalTax - discount
    return {
      totalAmount,
      cgst: totalTax / 2,
      sgst: totalTax / 2,
      totalTax,
      discount,
      netAmount: Math.max(netAmount, 0),
    }
  }, [items, discountAmount])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!patientId) {
      toast.error("Select a patient")
      return
    }
    const validItems = items.filter((it) => it.description.trim() && Number(it.unitPrice) > 0)
    if (validItems.length === 0) {
      toast.error("Add at least one valid line item")
      return
    }
    if (payerType === "INSURANCE" && !insuranceId) {
      toast.error("Select an insurance policy")
      return
    }
    if (payerType === "CORPORATE" && !corporateAccountId) {
      toast.error("Select a corporate account")
      return
    }

    startTransition(async () => {
      try {
        const bill = await createBill({
          patientId,
          type: type as never,
          payerType: payerType as never,
          insuranceId: payerType === "INSURANCE" ? insuranceId : undefined,
          corporateAccountId: payerType === "CORPORATE" ? corporateAccountId : undefined,
          admissionId: defaultAdmissionId,
          appointmentId: defaultAppointmentId,
          packageId: packageId || undefined,
          discountAmount: Number(discountAmount) || 0,
          items: validItems.map((it) => ({
            description: it.description,
            hsnCode: it.hsnCode || undefined,
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
            taxRatePercent: Number(it.taxRatePercent) || 0,
          })),
        })
        toast.success(`Bill ${bill.billNumber} created`)
        router.push(`/billing/${bill.id}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not create bill")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Patient</CardTitle></CardHeader>
        <CardContent>
          <PatientPicker value={patientId} onChange={setPatientId} initial={initialPatient} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Billing Type & Payer</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Bill type</Label>
            <Select items={billTypeLabels} value={type} onValueChange={(v) => setType(v ?? "OPD")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(billTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Payer type</Label>
            <Select items={payerTypeLabels} value={payerType} onValueChange={(v) => setPayerType(v ?? "SELF")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(payerTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {payerType === "INSURANCE" && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Insurance policy</Label>
              {patientInsurances.length === 0 ? (
                <p className="text-sm text-muted-foreground">No insurance on file for this patient.</p>
              ) : (
                <Select
                  items={Object.fromEntries(patientInsurances.map((i) => [i.id, `${i.provider} — ${i.policyNumber}`]))}
                  value={insuranceId}
                  onValueChange={(v) => setInsuranceId(v ?? "")}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select policy" /></SelectTrigger>
                  <SelectContent>
                    {patientInsurances.map((i) => (
                      <SelectItem key={i.id} value={i.id}>{i.provider} — {i.policyNumber}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {payerType === "CORPORATE" && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Corporate account</Label>
              <Select
                items={Object.fromEntries(corporateAccounts.map((c) => [c.id, c.companyName]))}
                value={corporateAccountId}
                onValueChange={(v) => setCorporateAccountId(v ?? "")}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Select company" /></SelectTrigger>
                <SelectContent>
                  {corporateAccounts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {packages.length > 0 && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Apply package (optional)</Label>
              <Select
                items={{ NONE: "No package", ...Object.fromEntries(packages.map((p) => [p.id, `${p.name} — ${formatCurrency(Number(p.price))}`])) }}
                value={packageId || "NONE"}
                onValueChange={(v) => (v && v !== "NONE" ? applyPackage(v) : setPackageId(""))}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">No package</SelectItem>
                  {packages.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} — {formatCurrency(Number(p.price))}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Line Items</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border p-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                  className="col-span-2 sm:col-span-2"
                />
                <Input
                  placeholder="HSN/SAC"
                  value={item.hsnCode}
                  onChange={(e) => updateItem(index, "hsnCode", e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Unit price"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Tax %"
                  value={item.taxRatePercent}
                  onChange={(e) => updateItem(index, "taxRatePercent", e.target.value)}
                />
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => removeItem(index)}
                disabled={items.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={addItem}>
            <Plus className="h-3.5 w-3.5" />
            Add Line Item
          </Button>

          <Separator />

          <div className="flex items-center justify-between">
            <Label htmlFor="discountAmount">Discount</Label>
            <Input
              id="discountAmount"
              type="number"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              className="w-32"
            />
          </div>

          <div className="space-y-1.5 rounded-lg bg-muted p-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(totals.totalAmount)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">CGST</span><span>{formatCurrency(totals.cgst)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">SGST</span><span>{formatCurrency(totals.sgst)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-{formatCurrency(totals.discount)}</span></div>
            <Separator />
            <div className="flex justify-between font-semibold text-base"><span>Net Amount</span><span>{formatCurrency(totals.netAmount)}</span></div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create Bill"}</Button>
      </div>
    </form>
  )
}
