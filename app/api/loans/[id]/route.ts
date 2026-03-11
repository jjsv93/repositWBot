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
      properties: true,
      entityRel: true,
      conditions: { include: { documents: { include: { uploadedBy: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } }, property: { select: { id: true, address: true } } }, orderBy: { createdAt: "asc" } },
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

  // Handle property update (by propertyId)
  if (body.property) {
    if (body.property.id) {
      await prisma.property.update({ where: { id: body.property.id }, data: body.property })
    } else {
      // Legacy: update first property on loan
      const loan = await prisma.loan.findUnique({ where: { id }, include: { properties: true } })
      if (loan?.properties?.[0]) {
        const { id: _pid, ...propData } = body.property
        await prisma.property.update({ where: { id: loan.properties[0].id }, data: propData })
      }
    }
    return NextResponse.json({ ok: true })
  }

  // Add new property to loan
  if (body.addProperty) {
    const property = await prisma.property.create({
      data: { ...body.addProperty, loanId: id }
    })
    // Create per-property conditions
    const propConditions = ["Rent Roll", "Insurance Binder", "Tax Bill", "Appraisal"]
    for (const title of propConditions) {
      await prisma.condition.create({ data: { title, loanId: id, propertyId: property.id, category: "PROPERTY" } })
    }
    await prisma.loanActivity.create({ data: { loanId: id, message: `Property "${body.addProperty.address || 'New Property'}" added` } })
    return NextResponse.json(property)
  }

  // Remove property from loan
  if (body.removePropertyId) {
    // Delete associated conditions and their documents
    const propConditions = await prisma.condition.findMany({ where: { propertyId: body.removePropertyId } })
    for (const c of propConditions) {
      await prisma.document.deleteMany({ where: { conditionId: c.id } })
    }
    await prisma.condition.deleteMany({ where: { propertyId: body.removePropertyId } })
    await prisma.property.delete({ where: { id: body.removePropertyId } })
    await prisma.loanActivity.create({ data: { loanId: id, message: "Property removed from loan" } })
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
  const allowedFields = ["status", "vacancyPercent", "otherExpenses", "dscrRatio", "loanAmount", "ltv", "interestRate", "termMonths", "brokerId", "processorId", "isPortfolio", "entityId"]
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
