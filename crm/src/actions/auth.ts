"use server"

import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { verifyPassword, createSession, destroySession } from "@/lib/auth"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"

export async function login(input: LoginInput) {
  const data = loginSchema.parse(input)

  const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } })
  // Constant-shape failure: don't reveal whether the email exists.
  if (!user || !user.active || !verifyPassword(data.password, user.passwordHash)) {
    throw new Error("Invalid email or password")
  }

  await createSession(user.id)
  return { id: user.id, name: user.name, role: user.role }
}

export async function logout() {
  await destroySession()
  redirect("/login")
}
