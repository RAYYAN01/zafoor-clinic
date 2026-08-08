"use client"

import { useState, type ReactNode } from "react"
import { Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function EntityDialog({
  title,
  triggerLabel = "Add",
  triggerVariant = "outline",
  children,
}: {
  title: string
  triggerLabel?: string
  triggerVariant?: "outline" | "default" | "ghost"
  children: (close: () => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant={triggerVariant} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            {triggerLabel}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children(() => setOpen(false))}
      </DialogContent>
    </Dialog>
  )
}
