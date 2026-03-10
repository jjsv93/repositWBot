import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  const { email, password } = await req.json()
  if (!email || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  const res = NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role })
  res.cookies.set("userId", user.id, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7 })
  return res
}
