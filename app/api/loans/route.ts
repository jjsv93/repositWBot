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
      propertyRel: true,
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

  const borrower = await prisma.borrower.create({
    data: {
      firstName: body.borrowerFirstName || null,
      middleName: body.borrowerMiddleName || null,
      lastName: body.borrowerLastName || null,
      email: body.borrowerEmail || null,
      phone: body.borrowerPhone || null,
    },
  })

  const entity = await prisma.entity.create({
    data: { entityType: body.entityType || null },
  })

  const property = await prisma.property.create({
    data: {
      address: body.propertyAddress || null,
      estimatedValue: body.estimatedValue ? parseFloat(body.estimatedValue) : null,
      taxAmount: body.annualTaxes ? parseFloat(body.annualTaxes) : null,
      taxFrequency: "ANNUAL",
      insuranceAmount: body.annualInsurance ? parseFloat(body.annualInsurance) : null,
      insuranceFrequency: "ANNUAL",
      monthlyRent: body.monthlyRent ? parseFloat(body.monthlyRent) : null,
    },
  })

  const loan = await prisma.loan.create({
    data: {
      loanType: body.loanType || "DSCR",
      status: "LEAD",
      loanAmount: body.loanAmount ? parseFloat(body.loanAmount) : null,
      ltv: body.ltv ? parseFloat(body.ltv) : null,
      interestRate: body.interestRate ? parseFloat(body.interestRate) : null,
      termMonths: body.termMonths ? parseInt(body.termMonths) : null,
      entityType: body.entityType || null,
      prepayType: body.prepayType || null,
      prepayYears: body.prepayYears ? parseInt(body.prepayYears) : null,
      brokerId: user.role === "BROKER" ? user.id : null,
      borrowerId: borrower.id,
      entityId: entity.id,
      propertyId: property.id,
    },
  })

  // Auto-create conditions
  const dscrConditions = [
    "Government ID", "SSN Card", "Bank Statements (2 months)", "Lease Agreement",
    "Current Rent Roll", "DSCR Calculation Worksheet", "Insurance Binder",
    "Operating Agreement", "EIN Letter", "Voided Check", "Appraisal",
    "CPL", "CD/ALTA/Prelim HUD", "Wire Instructions", "Tax Cert"
  ]
  const bridgeConditions = [
    "Purchase Contract", "Scope of Work", "Budget Breakdown", "Exit Strategy",
    "Insurance Binder", "Government ID", "Bank Statements", "Contractor Bid", "ARV Appraisal"
  ]

  const conditions = body.loanType === "BRIDGE" ? bridgeConditions : dscrConditions
  for (const title of conditions) {
    await prisma.condition.create({ data: { title, loanId: loan.id } })
  }

  await prisma.loanActivity.create({ data: { loanId: loan.id, message: "Loan created as LEAD" } })

  return NextResponse.json({ id: loan.id })
}
