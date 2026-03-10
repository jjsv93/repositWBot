import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  const old = await prisma.condition.findUnique({ where: { id }, select: { status: true, loanId: true } })
  const data: Record<string, unknown> = {}
  if (body.status !== undefined) data.status = body.status
  if (body.notes !== undefined) data.notes = body.notes
  if (body.description !== undefined) data.description = body.description
  if (body.assignedTo !== undefined) data.assignedTo = body.assignedTo

  const updated = await prisma.condition.update({ where: { id }, data })

  if (body.status && old && old.status !== body.status) {
    await prisma.loanActivity.create({
      data: { loanId: old.loanId, message: `Condition "${updated.title}" changed to ${body.status}` },
    })
  }

  return NextResponse.json(updated)
}
