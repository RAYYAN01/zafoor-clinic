"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { openCashSession, closeCashSession, type getOpenCashSession, type getCashSessionHistory } from "@/actions/cash-counter"
import type { getPayments } from "@/actions/payments"

type OpenSession = Awaited<ReturnType<typeof getOpenCashSession>>
type History = Awaited<ReturnType<typeof getCashSessionHistory>>
type Payments = Awaited<ReturnType<typeof getPayments>>["payments"]

export function CashCounterPanel({
  openSession,
  sessionPayments,
  history,
}: {
  openSession: OpenSession
  sessionPayments: Payments
  history: History
}) {
  return (
    <div className="space-y-6">
      {openSession ? (
        <OpenSessionCard session={openSession} payments={sessionPayments} />
      ) : (
        <OpenSessionForm />
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Session History</CardTitle></CardHeader>
        <CardContent className="p-0">
          {history.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground px-6">No previous sessions.</p>}
          {history.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Opened</TableHead>
                  <TableHead>Opened By</TableHead>
                  <TableHead>Opening</TableHead>
                  <TableHead>Collected</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{formatDateTime(s.openedAt)}</TableCell>
                    <TableCell>{s.openedBy.name}</TableCell>
                    <TableCell>{formatCurrency(Number(s.openingBalance))}</TableCell>
                    <TableCell>{formatCurrency(s.cashCollected)}</TableCell>
                    <TableCell>{s.expectedClosing != null ? formatCurrency(Number(s.expectedClosing)) : "—"}</TableCell>
                    <TableCell>{s.closingBalance != null ? formatCurrency(Number(s.closingBalance)) : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === "OPEN" ? "default" : "secondary"}>{s.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function OpenSessionForm() {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Open Cash Session</CardTitle></CardHeader>
      <CardContent>
        <form
          className="flex items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await openCashSession(Number(fd.get("openingBalance") || 0))
                toast.success("Cash session opened")
                router.refresh()
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not open session")
              }
            })
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="openingBalance">Opening cash balance</Label>
            <Input id="openingBalance" name="openingBalance" type="number" defaultValue={0} className="w-48" />
          </div>
          <Button type="submit" disabled={pending}>{pending ? "Opening…" : "Open Session"}</Button>
        </form>
      </CardContent>
    </Card>
  )
}

function OpenSessionCard({ session, payments }: { session: NonNullable<OpenSession>; payments: Payments }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const cashCollected = session.payments.filter((p) => p.status === "SUCCESS").reduce((sum, p) => sum + Number(p.amount), 0)
  const expected = Number(session.openingBalance) + cashCollected

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>Session opened by {session.openedBy.name}</span>
          <Badge>OPEN</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div><p className="text-xs text-muted-foreground uppercase">Opening</p><p className="font-medium mt-0.5">{formatCurrency(Number(session.openingBalance))}</p></div>
          <div><p className="text-xs text-muted-foreground uppercase">Cash Collected</p><p className="font-medium mt-0.5">{formatCurrency(cashCollected)}</p></div>
          <div><p className="text-xs text-muted-foreground uppercase">Expected Closing</p><p className="font-medium mt-0.5">{formatCurrency(expected)}</p></div>
        </div>

        {payments.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground uppercase">Cash Payments This Session</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {payments.map((p) => (
                <div key={p.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                  <span>{p.patient.firstName} {p.patient.lastName}</span>
                  <span>{formatCurrency(Number(p.amount))}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <form
          className="space-y-3 border-t pt-4"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await closeCashSession(session.id, {
                  closingBalance: Number(fd.get("closingBalance") || 0),
                  notes: String(fd.get("notes") || "") || undefined,
                })
                toast.success("Cash session closed")
                router.refresh()
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not close session")
              }
            })
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="closingBalance">Actual counted cash</Label>
            <Input id="closingBalance" name="closingBalance" type="number" defaultValue={expected} className="w-48" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" name="notes" placeholder="Explain any discrepancy…" />
          </div>
          <Button type="submit" variant="outline" disabled={pending}>{pending ? "Closing…" : "Close Session"}</Button>
        </form>
      </CardContent>
    </Card>
  )
}
