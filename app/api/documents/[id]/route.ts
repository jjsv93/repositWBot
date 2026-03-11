import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"
import { ConditionStatus } from "@prisma/client"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (user.role === "BORROWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  const doc = await prisma.document.findUnique({ where: { id }, select: { loanId: true, conditionId: true, fileName: true } })
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const data: any = {}
  if (body.status) {
    data.status = body.status
    data.reviewedById = user.id
    data.reviewedAt = new Date()
  }
  if (body.reviewerNote !== undefined) data.reviewerNote = body.reviewerNote

  const updated = await prisma.document.update({ where: { id }, data })

  // Log activity
  const action = body.status === "ACCEPTED" ? "accepted" : body.status === "REJECTED" ? "rejected" : "updated"
  await prisma.loanActivity.create({
    data: { loanId: doc.loanId, message: `Document "${doc.fileName}" ${action}${body.reviewerNote ? `: ${body.reviewerNote}` : ""}` }
  })

  // Auto-update condition status based on documents
  if (doc.conditionId) {
    const condDocs = await prisma.document.findMany({ where: { conditionId: doc.conditionId }, orderBy: { createdAt: "desc" } })
    let condStatus: ConditionStatus = "OPEN"
    if (condDocs.some((d: any) => d.status === "ACCEPTED")) {
      condStatus = "CLEARED"
    } else if (condDocs.length > 0) {
      const latest = condDocs[0]
      if (latest.status === "PENDING") condStatus = "RECEIVED"
      else if (latest.status === "REJECTED") condStatus = "OPEN"
    }
    await prisma.condition.update({ where: { id: doc.conditionId }, data: { status: condStatus } })
  }

  return NextResponse.json(updated)
}
