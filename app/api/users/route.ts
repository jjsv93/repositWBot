import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function GET(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const companyOnly = searchParams.get("company") === "true"

  const where: any = {}
  if (companyOnly && user.companyId) {
    where.companyId = user.companyId
    where.role = { not: "BORROWER" }
  }

  const users = await prisma.user.findMany({
    where,
    select: { id: true, email: true, name: true, role: true, companyId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(users)
}

export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Only admins can invite users" }, { status: 403 })
  if (!user.companyId) return NextResponse.json({ error: "No company associated" }, { status: 400 })

  const body = await req.json()
  if (!body.email || !body.name || !body.role) {
    return NextResponse.json({ error: "Name, email, and role are required" }, { status: 400 })
  }

  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email: body.email } })
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 })

  // Default password — user would change on first login in a real system
  const hash = await bcrypt.hash("password123", 10)

  const newUser = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: hash,
      role: body.role,
      companyId: user.companyId,
    },
    select: { id: true, email: true, name: true, role: true, companyId: true, createdAt: true },
  })

  return NextResponse.json(newUser)
}

export async function DELETE(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Only admins can remove users" }, { status: 403 })

  const body = await req.json()
  if (!body.userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  // Don't let admin remove themselves
  if (body.userId === user.id) return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 })

  // Remove company association (don't delete the user account)
  await prisma.user.update({
    where: { id: body.userId },
    data: { companyId: null },
  })

  return NextResponse.json({ success: true })
}
