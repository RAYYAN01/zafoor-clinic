import { getChatChannels } from "@/actions/chat"
import { getAllStaff, getCurrentUser } from "@/lib/auth"
import { ChatBoard } from "@/components/hr/chat-board"

export default async function ChatPage() {
  const [channels, staff, currentUser] = await Promise.all([getChatChannels(), getAllStaff(), getCurrentUser()])

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Internal Chat</h1>
        <p className="text-sm text-muted-foreground">{channels.length} channel{channels.length === 1 ? "" : "s"}.</p>
      </div>
      <div className="flex-1 min-h-0">
        <ChatBoard initialChannels={channels} staff={staff} currentUserId={currentUser.id} />
      </div>
    </div>
  )
}
