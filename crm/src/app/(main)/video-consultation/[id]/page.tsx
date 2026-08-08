import { notFound } from "next/navigation"
import Link from "next/link"
import { Video, Mic, PhoneOff } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDateTime, patientDisplayName } from "@/lib/format"

export default async function VideoConsultationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { patient: true, doctor: true },
  })
  if (!appointment) notFound()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Video Consultation</h1>
        <p className="text-sm text-muted-foreground">{formatDateTime(appointment.scheduledAt)}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>{patientDisplayName(appointment.patient)} · Dr. {appointment.doctor.name}</span>
            <Badge variant="outline">{appointment.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex aspect-video items-center justify-center rounded-lg bg-neutral-900 text-neutral-400">
            <div className="text-center">
              <Video className="mx-auto h-10 w-10 mb-2" />
              <p className="text-sm">Waiting room — call has not started</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button size="icon" variant="outline" className="h-11 w-11 rounded-full"><Mic className="h-4 w-4" /></Button>
            <Button size="icon" variant="outline" className="h-11 w-11 rounded-full"><Video className="h-4 w-4" /></Button>
            <Button
              size="icon"
              variant="destructive"
              className="h-11 w-11 rounded-full"
              nativeButton={false}
              render={<Link href={`/patients/${appointment.patientId}`}><PhoneOff className="h-4 w-4" /></Link>}
            />
          </div>
          <p className="text-xs text-center text-muted-foreground">
            This is a scheduling placeholder for the video consultation slot. Connect a video provider (e.g. Twilio, Daily, or Zoom) to enable live calling here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
