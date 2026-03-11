import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let where: Record<string, unknown> = {}
  if (user.role === "BROKER") where = { OR: [{ brokerId: user.id }, { borrowerRel: { email: user.email } }] }
  if (user.role === "PROCESSOR") where = { processorId: user.id }
  if (user.role === "BORROWER") where = { OR: [{ borrowerUserId: user.id }, { borrowerRel: { email: user.email } }] }

  const loans = await prisma.loan.findMany({
    where,
    include: {
      borrowerRel: true,
      properties: true,
      entityRel: true,
      conditions: true,
      broker: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(loans)
}

export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (user.role === "BORROWER") return NextResponse.json({ error: "Borrowers cannot create loans" }, { status: 403 })

  const body = await req.json()

  // Borrower: use existing or create new
  let borrowerId = body.existingBorrowerId || null
  if (!borrowerId) {
    const borrower = await prisma.borrower.create({
      data: {
        firstName: body.borrowerFirstName || null,
        middleName: body.borrowerMiddleName || null,
        lastName: body.borrowerLastName || null,
        email: body.borrowerEmail || null,
        phone: body.borrowerPhone || null,
      },
    })
    borrowerId = borrower.id
  }

  // Entity: use existing or create new
  let entityId = body.existingEntityId || null
  if (!entityId) {
    const entity = await prisma.entity.create({
      data: { entityType: body.entityType || null },
    })
    entityId = entity.id
  }

  const loan = await prisma.loan.create({
    data: {
      loanType: body.loanType || "DSCR",
      isPortfolio: body.isPortfolio || false,
      status: "LEAD",
      loanAmount: body.loanAmount ? parseFloat(body.loanAmount) : null,
      ltv: body.ltv ? parseFloat(body.ltv) : null,
      interestRate: body.interestRate ? parseFloat(body.interestRate) : null,
      termMonths: body.termMonths ? parseInt(body.termMonths) : null,
      entityType: body.entityType || null,
      prepayType: body.prepayType || null,
      prepayYears: body.prepayYears ? parseInt(body.prepayYears) : null,
      brokerId: user.role === "BROKER" ? user.id : null,
      borrowerId,
      entityId,
    },
  })

  // Create property and attach to loan
  const property = await prisma.property.create({
    data: {
      loanId: loan.id,
      address: body.propertyAddress || null,
      estimatedValue: body.estimatedValue ? parseFloat(body.estimatedValue) : null,
      taxAmount: body.annualTaxes ? parseFloat(body.annualTaxes) : null,
      taxFrequency: "ANNUAL",
      insuranceAmount: body.annualInsurance ? parseFloat(body.annualInsurance) : null,
      insuranceFrequency: "ANNUAL",
      monthlyRent: body.monthlyRent ? parseFloat(body.monthlyRent) : null,
    },
  })

  // Auto-create categorized conditions
  // Borrower conditions (once per loan)
  const borrowerConditions = ["Government ID", "SSN Card", "Bank Statements (2 months)"]
  for (const title of borrowerConditions) {
    await prisma.condition.create({ data: { title, loanId: loan.id, category: "BORROWER" } })
  }

  // Entity conditions (once per loan)
  const entityConditions = ["Operating Agreement", "EIN Letter", "Voided Check"]
  for (const title of entityConditions) {
    await prisma.condition.create({ data: { title, loanId: loan.id, category: "ENTITY" } })
  }

  // Property conditions (per property)
  const propertyConditions = body.loanType === "BRIDGE"
    ? ["Purchase Contract", "Scope of Work", "Budget Breakdown", "Insurance Binder", "Appraisal"]
    : ["Lease Agreement", "Rent Roll", "Insurance Binder", "Tax Bill", "Appraisal"]
  for (const title of propertyConditions) {
    await prisma.condition.create({ data: { title, loanId: loan.id, propertyId: property.id, category: "PROPERTY" } })
  }

  // General conditions
  const generalConditions = body.loanType === "BRIDGE"
    ? ["Exit Strategy", "Contractor Bid", "ARV Appraisal"]
    : ["DSCR Calculation Worksheet", "CPL", "CD/ALTA/Prelim HUD", "Wire Instructions", "Tax Cert"]
  for (const title of generalConditions) {
    await prisma.condition.create({ data: { title, loanId: loan.id, category: "GENERAL" } })
  }

  await prisma.loanActivity.create({ data: { loanId: loan.id, message: "Loan created as LEAD" } })

  return NextResponse.json({ id: loan.id })
}
