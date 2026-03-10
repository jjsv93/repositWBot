import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const profile = await prisma.borrowerProfile.findUnique({
    where: { userId: user.id },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  })

  return NextResponse.json(profile)
}

export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  
  const profile = await prisma.borrowerProfile.upsert({
    where: { userId: user.id },
    update: {
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone || null,
      entities: body.entities || [],
      properties: body.properties || []
    },
    create: {
      userId: user.id,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone || null,
      entities: body.entities || [],
      properties: body.properties || []
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  })

  return NextResponse.json(profile)
}