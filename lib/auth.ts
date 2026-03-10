import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function getUser() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) return null
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true },
  })
  return user
}
