import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"
import { ReminderFrequency } from "@prisma/client"

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const settings = await prisma.taskReminderSetting.findUnique({
    where: { userId: user.id }
  })

  return NextResponse.json(settings)
}

export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  
  const settings = await prisma.taskReminderSetting.upsert({
    where: { userId: user.id },
    update: {
      enabled: body.enabled ?? false,
      frequency: body.frequency ?? ReminderFrequency.DAILY,
      recipientUserIds: body.recipientUserIds ?? []
    },
    create: {
      userId: user.id,
      enabled: body.enabled ?? false,
      frequency: body.frequency ?? ReminderFrequency.DAILY,
      recipientUserIds: body.recipientUserIds ?? []
    }
  })

  return NextResponse.json(settings)
}