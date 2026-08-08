import { redirect } from "next/navigation"
import { getCurrentUserOrNull } from "@/lib/auth"
import { LoginForm } from "@/components/auth/login-form"

export const dynamic = "force-dynamic"

export default async function LoginPage() {
  const user = await getCurrentUserOrNull()
  if (user) redirect("/dashboard")

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-semibold">
            Z
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Zafoor Clinic</h1>
          <p className="text-sm text-muted-foreground">Sign in to the clinic CRM</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
