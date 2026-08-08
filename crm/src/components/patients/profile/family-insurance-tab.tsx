"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { EntityDialog } from "@/components/shared/entity-dialog"
import { DeleteButton } from "@/components/shared/delete-button"
import { formatDate } from "@/lib/format"
import {
  addFamilyMember,
  deleteFamilyMember,
  addInsurance,
  deleteInsurance,
  addEmergencyContact,
  deleteEmergencyContact,
} from "@/actions/patients"
import type { getPatientById } from "@/actions/patients"

type Patient = NonNullable<Awaited<ReturnType<typeof getPatientById>>>

export function FamilyInsuranceTab({ patient }: { patient: Patient }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Family Members</CardTitle>
          <EntityDialog title="Add Family Member">
            {(close) => <FamilyMemberForm patientId={patient.id} onDone={close} />}
          </EntityDialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {patient.familyMembers.length === 0 && (
            <p className="text-sm text-muted-foreground">No family members recorded.</p>
          )}
          {patient.familyMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{member.name}</p>
                <p className="text-xs text-muted-foreground">
                  {member.relation}
                  {member.phone ? ` · ${member.phone}` : ""}
                  {member.isEmergencyContact ? " · Emergency contact" : ""}
                </p>
              </div>
              <DeleteButton onDelete={() => deleteFamilyMember(patient.id, member.id)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Emergency Contacts</CardTitle>
          <EntityDialog title="Add Emergency Contact">
            {(close) => <EmergencyContactForm patientId={patient.id} onDone={close} />}
          </EntityDialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {patient.emergencyContacts.length === 0 && (
            <p className="text-sm text-muted-foreground">No emergency contacts recorded.</p>
          )}
          {patient.emergencyContacts.map((contact) => (
            <div key={contact.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{contact.name}</p>
                <p className="text-xs text-muted-foreground">{contact.relation} · {contact.phone}</p>
              </div>
              <DeleteButton onDelete={() => deleteEmergencyContact(patient.id, contact.id)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Insurance</CardTitle>
          <EntityDialog title="Add Insurance Policy">
            {(close) => <InsuranceForm patientId={patient.id} onDone={close} />}
          </EntityDialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {patient.insurances.length === 0 && (
            <p className="text-sm text-muted-foreground">No insurance policies recorded.</p>
          )}
          {patient.insurances.map((ins) => (
            <div key={ins.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium flex items-center gap-2">
                  {ins.provider}
                  {ins.isPrimary && <Badge variant="secondary">Primary</Badge>}
                </p>
                <p className="text-xs text-muted-foreground">
                  Policy {ins.policyNumber}
                  {ins.planName ? ` · ${ins.planName}` : ""}
                  {ins.validTo ? ` · Valid till ${formatDate(ins.validTo)}` : ""}
                </p>
              </div>
              <DeleteButton onDelete={() => deleteInsurance(patient.id, ins.id)} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function FamilyMemberForm({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const [pending, startTransition] = useTransition()
  const [isEmergencyContact, setIsEmergencyContact] = useState(false)

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        startTransition(async () => {
          try {
            await addFamilyMember(patientId, {
              name: String(form.get("name") || ""),
              relation: String(form.get("relation") || ""),
              phone: String(form.get("phone") || "") || undefined,
              dob: form.get("dob") ? new Date(String(form.get("dob"))) : undefined,
              isEmergencyContact,
            })
            toast.success("Family member added")
            onDone()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not add family member")
          }
        })
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="fm-name">Name</Label>
        <Input id="fm-name" name="name" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fm-relation">Relation</Label>
        <Input id="fm-relation" name="relation" placeholder="Spouse, Father, Child…" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fm-phone">Phone</Label>
        <Input id="fm-phone" name="phone" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fm-dob">Date of birth</Label>
        <Input id="fm-dob" name="dob" type="date" />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="fm-emergency" checked={isEmergencyContact} onCheckedChange={(v) => setIsEmergencyContact(!!v)} />
        <Label htmlFor="fm-emergency" className="font-normal">Also an emergency contact</Label>
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Add Family Member"}
      </Button>
    </form>
  )
}

function EmergencyContactForm({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const [pending, startTransition] = useTransition()

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        startTransition(async () => {
          try {
            await addEmergencyContact(patientId, {
              name: String(form.get("name") || ""),
              relation: String(form.get("relation") || ""),
              phone: String(form.get("phone") || ""),
              altPhone: String(form.get("altPhone") || "") || undefined,
              address: String(form.get("address") || "") || undefined,
            })
            toast.success("Emergency contact added")
            onDone()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not add contact")
          }
        })
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="ec-name">Name</Label>
        <Input id="ec-name" name="name" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ec-relation">Relation</Label>
        <Input id="ec-relation" name="relation" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ec-phone">Phone</Label>
        <Input id="ec-phone" name="phone" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ec-altPhone">Alternate phone</Label>
        <Input id="ec-altPhone" name="altPhone" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ec-address">Address</Label>
        <Input id="ec-address" name="address" />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Add Emergency Contact"}
      </Button>
    </form>
  )
}

function InsuranceForm({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const [pending, startTransition] = useTransition()
  const [isPrimary, setIsPrimary] = useState(true)

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        startTransition(async () => {
          try {
            await addInsurance(patientId, {
              provider: String(form.get("provider") || ""),
              policyNumber: String(form.get("policyNumber") || ""),
              planName: String(form.get("planName") || "") || undefined,
              tpaName: String(form.get("tpaName") || "") || undefined,
              coverageAmount: form.get("coverageAmount") ? Number(form.get("coverageAmount")) : undefined,
              validFrom: form.get("validFrom") ? new Date(String(form.get("validFrom"))) : undefined,
              validTo: form.get("validTo") ? new Date(String(form.get("validTo"))) : undefined,
              isPrimary,
            })
            toast.success("Insurance added")
            onDone()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not add insurance")
          }
        })
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ins-provider">Provider</Label>
          <Input id="ins-provider" name="provider" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ins-policyNumber">Policy number</Label>
          <Input id="ins-policyNumber" name="policyNumber" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ins-planName">Plan name</Label>
          <Input id="ins-planName" name="planName" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ins-tpaName">TPA name</Label>
          <Input id="ins-tpaName" name="tpaName" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ins-coverageAmount">Coverage amount</Label>
          <Input id="ins-coverageAmount" name="coverageAmount" type="number" />
        </div>
        <div />
        <div className="space-y-1.5">
          <Label htmlFor="ins-validFrom">Valid from</Label>
          <Input id="ins-validFrom" name="validFrom" type="date" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ins-validTo">Valid to</Label>
          <Input id="ins-validTo" name="validTo" type="date" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="ins-primary" checked={isPrimary} onCheckedChange={(v) => setIsPrimary(!!v)} />
        <Label htmlFor="ins-primary" className="font-normal">Primary policy</Label>
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Add Insurance"}
      </Button>
    </form>
  )
}
