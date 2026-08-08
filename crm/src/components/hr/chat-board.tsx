"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus, Send } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { initials, formatTime } from "@/lib/format"
import { getChatChannels, getChatMessages, sendChatMessage, createChatChannel } from "@/actions/chat"

type Channels = Awaited<ReturnType<typeof getChatChannels>>
type Messages = Awaited<ReturnType<typeof getChatMessages>>
type Staff = { id: string; name: string }[]

export function ChatBoard({ initialChannels, staff, currentUserId }: { initialChannels: Channels; staff: Staff; currentUserId: string }) {
  const [channels, setChannels] = useState(initialChannels)
  const [activeId, setActiveId] = useState(initialChannels[0]?.id ?? "")
  const [messages, setMessages] = useState<Messages>([])
  const [body, setBody] = useState("")
  const [newChannelOpen, setNewChannelOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activeId) return
    let cancelled = false
    async function load() {
      const msgs = await getChatMessages(activeId)
      if (!cancelled) setMessages(msgs)
    }
    load()
    const interval = setInterval(load, 4000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [activeId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  function handleSend() {
    if (!body.trim() || !activeId) return
    const text = body
    setBody("")
    startTransition(async () => {
      try {
        await sendChatMessage(activeId, { body: text })
        const msgs = await getChatMessages(activeId)
        setMessages(msgs)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not send message")
      }
    })
  }

  return (
    <div className="grid h-full grid-cols-[220px_1fr] gap-4">
      <Card className="flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Channels</p>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setNewChannelOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {channels.length === 0 && <p className="px-3 py-4 text-xs text-muted-foreground">No channels yet.</p>}
          {channels.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${activeId === c.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              <span className="truncate"># {c.name}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col overflow-hidden">
        {activeId ? (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No messages yet. Say hello.</p>}
              {messages.map((m) => (
                <div key={m.id} className={`flex items-start gap-2 ${m.senderId === currentUserId ? "flex-row-reverse" : ""}`}>
                  <Avatar className="h-7 w-7 shrink-0"><AvatarFallback className="text-[10px]">{initials(m.sender.name)}</AvatarFallback></Avatar>
                  <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${m.senderId === currentUserId ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <p>{m.body}</p>
                    <p className={`text-[10px] mt-0.5 ${m.senderId === currentUserId ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {m.sender.name} · {formatTime(m.sentAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 border-t p-3">
              <Input
                placeholder="Type a message…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
              <Button size="icon" onClick={handleSend} disabled={pending || !body.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Create a channel to start chatting.</div>
        )}
      </Card>

      <NewChannelDialog
        open={newChannelOpen}
        onOpenChange={setNewChannelOpen}
        staff={staff}
        onCreated={(channel) => {
          setChannels((prev) => [...prev, channel])
          setActiveId(channel.id)
        }}
      />
    </div>
  )
}

function NewChannelDialog({
  open,
  onOpenChange,
  staff,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  staff: Staff
  onCreated: (channel: Channels[number]) => void
}) {
  const [selected, setSelected] = useState<string[]>([])
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Channel</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                const channel = await createChatChannel({ name: String(fd.get("name") || ""), memberIds: selected })
                toast.success("Channel created")
                onOpenChange(false)
                onCreated(channel as unknown as Channels[number])
                setSelected([])
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not create channel")
              }
            })
          }}
        >
          <div className="space-y-1.5"><Label htmlFor="name">Channel name</Label><Input id="name" name="name" required /></div>
          <div className="space-y-1.5">
            <Label>Members</Label>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {staff.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm rounded-md px-2 py-1.5 hover:bg-muted">
                  <Checkbox
                    checked={selected.includes(s.id)}
                    onCheckedChange={(v) => setSelected((prev) => (v ? [...prev, s.id] : prev.filter((id) => id !== s.id)))}
                  />
                  {s.name}
                </label>
              ))}
            </div>
          </div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Creating…" : "Create Channel"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
