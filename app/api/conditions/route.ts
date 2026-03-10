import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"

export async function GET(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const loanId = searchParams.get("loanId")
  if (!loanId) return NextResponse.json({ error: "loanId required" }, { status: 400 })
  const conditions = await prisma.condition.findMany({
    where: { loanId },
    include: { documents: true },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(conditions)
}

export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const condition = await prisma.condition.create({
    data: {
      title: body.title,
      description: body.description || null,
      assignedTo: body.assignedTo || null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      loanId: body.loanId,
    },
  })
  return NextResponse.json(condition)
}
