import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const loan = await prisma.loan.findUnique({
    where: { id },
    include: {
      borrowerRel: true,
      propertyRel: true,
      entityRel: true,
      conditions: { include: { documents: { include: { uploadedBy: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } } }, orderBy: { createdAt: "asc" } },
      documents: true,
      tasks: { include: { assignedTo: { select: { id: true, name: true, email: true } }, condition: { select: { id: true, title: true } } }, orderBy: { createdAt: "desc" } },
      loanContacts: { include: { contact: { include: { company: { select: { id: true, name: true, type: true } } } } } },
      activities: { orderBy: { createdAt: "desc" } },
      broker: { select: { id: true, name: true, email: true, role: true } },
      processor: { select: { id: true, name: true, email: true, role: true } },
      borrowerUser: { select: { id: true, name: true, email: true } },
    },
  })
  if (!loan) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(loan)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (user.role === "BORROWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const body = await req.json()

  // Handle borrower update
  if (body.borrower) {
    const loan = await prisma.loan.findUnique({ where: { id }, select: { borrowerId: true } })
    if (loan?.borrowerId) {
      await prisma.borrower.update({ where: { id: loan.borrowerId }, data: body.borrower })
    }
    return NextResponse.json({ ok: true })
  }

  // Handle property update
  if (body.property) {
    const loan = await prisma.loan.findUnique({ where: { id }, select: { propertyId: true } })
    if (loan?.propertyId) {
      await prisma.property.update({ where: { id: loan.propertyId }, data: body.property })
    }
    return NextResponse.json({ ok: true })
  }

  // Handle entity update
  if (body.entity) {
    const loan = await prisma.loan.findUnique({ where: { id }, select: { entityId: true } })
    if (loan?.entityId) {
      await prisma.entity.update({ where: { id: loan.entityId }, data: body.entity })
    }
    return NextResponse.json({ ok: true })
  }

  // Handle loan field updates (status, DSCR fields, etc.)
  const allowedFields = ["status", "vacancyPercent", "otherExpenses", "dscrRatio", "loanAmount", "ltv", "interestRate", "termMonths", "brokerId", "processorId"]
  const data: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (body[key] !== undefined) data[key] = body[key]
  }

  const oldLoan = await prisma.loan.findUnique({ where: { id }, select: { status: true } })
  const updated = await prisma.loan.update({ where: { id }, data })

  if (body.status && oldLoan && oldLoan.status !== body.status) {
    await prisma.loanActivity.create({
      data: { loanId: id, message: `Status changed from ${oldLoan.status} to ${body.status}` },
    })
  }

  return NextResponse.json(updated)
}
