"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DeleteButton } from "@/components/shared/delete-button"
import { formatCurrency, formatDate } from "@/lib/format"
import { expenseCategoryLabels, paymentMethodLabels } from "@/lib/labels"
import { deleteExpense, type getExpenses } from "@/actions/finance"

type Expenses = Awaited<ReturnType<typeof getExpenses>>

export function ExpensesTable({ expenses }: { expenses: Expenses }) {
  if (expenses.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No expenses recorded.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Paid To</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((e) => (
          <TableRow key={e.id}>
            <TableCell>{formatDate(e.expenseDate)}</TableCell>
            <TableCell><Badge variant="outline">{expenseCategoryLabels[e.category]}</Badge></TableCell>
            <TableCell>{e.description}</TableCell>
            <TableCell className="text-muted-foreground">{e.paidTo || "—"}</TableCell>
            <TableCell>{paymentMethodLabels[e.method]}</TableCell>
            <TableCell className="text-right">{formatCurrency(Number(e.amount))}</TableCell>
            <TableCell>
              <DeleteButton onDelete={() => deleteExpense(e.id)} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
