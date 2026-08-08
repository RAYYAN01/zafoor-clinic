"use server"

import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { nanoid } from "nanoid"

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads")
const MAX_SIZE_BYTES = 10 * 1024 * 1024

export async function uploadFile(formData: FormData) {
  const file = formData.get("file") as File | null
  if (!file || file.size === 0) {
    throw new Error("No file provided")
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("File exceeds 10MB limit")
  }

  await mkdir(UPLOAD_DIR, { recursive: true })

  const ext = path.extname(file.name) || ""
  const safeName = `${nanoid(12)}${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(UPLOAD_DIR, safeName), buffer)

  return {
    url: `/uploads/${safeName}`,
    name: file.name,
    type: file.type,
  }
}
