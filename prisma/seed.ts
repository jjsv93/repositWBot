import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Clearing old data...")
  await prisma.document.deleteMany()
  await prisma.loanContact.deleteMany()
  await prisma.contact.deleteMany()
  await prisma.company.deleteMany()
  await prisma.quoteOption.deleteMany()
  await prisma.quoteRequest.deleteMany()
  await prisma.loanInvite.deleteMany()
  await prisma.taskReminderSetting.deleteMany()
  await prisma.task.deleteMany()
  await prisma.condition.deleteMany()
  await prisma.loanActivity.deleteMany()
  await prisma.loan.deleteMany()
  await prisma.borrowerProfile.deleteMany()
  await prisma.borrower.deleteMany()
  await prisma.entity.deleteMany()
  await prisma.property.deleteMany()
  await prisma.user.deleteMany()

  const hash = await bcrypt.hash("password123", 10)

  console.log("Creating companies...")
  const lenderCompany = await prisma.company.create({ data: { name: "Capital Lending Corp", type: "LENDER" } })
  const titleCompany = await prisma.company.create({ data: { name: "Secure Title Co", type: "TITLE" } })
  const insuranceCompany = await prisma.company.create({ data: { name: "Premier Insurance Agency", type: "INSURANCE" } })

  console.log("Creating users...")
  const admin = await prisma.user.create({ data: { email: "admin@loanos.com", password: hash, name: "Admin User", role: "ADMIN" } })
  const sarah = await prisma.user.create({ data: { email: "sarah@capitallending.com", password: hash, name: "Sarah Chen", role: "BROKER", companyId: lenderCompany.id } })
  const john = await prisma.user.create({ data: { email: "john@email.com", password: hash, name: "John Smith", role: "BORROWER" } })
  const emma = await prisma.user.create({ data: { email: "emma@processing.com", password: hash, name: "Emma Wilson", role: "PROCESSOR", companyId: lenderCompany.id } })

  console.log("Creating borrower profiles...")
  await prisma.borrowerProfile.create({
    data: {
      userId: john.id,
      firstName: "John",
      lastName: "Smith", 
      phone: "555-0123",
      entities: [],
      properties: []
    }
  })

  console.log("Creating contacts...")
  const contact1 = await prisma.contact.create({ 
    data: { firstName: "David", lastName: "Chen", email: "david@secuire-title.com", phone: "555-9876", autoAssign: true, companyId: titleCompany.id }
  })
  const contact2 = await prisma.contact.create({ 
    data: { firstName: "Mike", lastName: "Torres", email: "mike@premier-insurance.com", phone: "555-3333", autoAssign: false, companyId: insuranceCompany.id }
  })
  const contact3 = await prisma.contact.create({ 
    data: { firstName: "Jennifer", lastName: "Wu", email: "jen@secure-title.com", phone: "555-2222", autoAssign: false, companyId: titleCompany.id }
  })
  const contact4 = await prisma.contact.create({ 
    data: { firstName: "Robert", lastName: "Martinez", email: "rob@premier-insurance.com", phone: "555-4444", autoAssign: true, companyId: insuranceCompany.id }
  })

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

  // Loan 1: LEAD - Bridge - Marcus Williams, Miami
  console.log("Creating Loan 1 (LEAD/BRIDGE)...")
  const b1 = await prisma.borrower.create({ data: { firstName: "Marcus", lastName: "Williams", email: "marcus@email.com", phone: "305-555-1234", creditScore: 720, liquidity: 150000, netWorth: 800000, experience: 3 } })
  const e1 = await prisma.entity.create({ data: { entityType: "LLC_SINGLE", entityName: "Williams Capital LLC", ein: "82-1234567", stateOfFormation: "FL" } })
  const p1 = await prisma.property.create({ data: { address: "1247 Ocean Drive, Miami Beach, FL 33139", estimatedValue: 550000, taxAmount: 7200, taxFrequency: "ANNUAL", insuranceAmount: 3200, insuranceFrequency: "ANNUAL", monthlyRent: 3800 } })
  const loan1 = await prisma.loan.create({
    data: {
      status: "LEAD", loanType: "BRIDGE", brokerId: sarah.id,
      loanAmount: 385000, ltv: 70, interestRate: 9.5, termMonths: 12,
      annualTaxes: 7200, annualInsurance: 3200,
      borrowerId: b1.id, entityId: e1.id, 
    }
  })
  await prisma.property.update({ where: { id: p1.id }, data: { loanId: loan1.id } })
  for (const title of bridgeConditions) {
    await prisma.condition.create({ data: { title, loanId: loan1.id, status: "OPEN" } })
  }
  await prisma.task.create({ data: { loanId: loan1.id, title: "Order appraisal", assignedToId: emma.id, assignedAt: new Date(), dueDate: new Date("2026-03-10") } })
  await prisma.task.create({ data: { loanId: loan1.id, title: "Verify borrower docs", assignedToId: sarah.id, assignedAt: new Date(), dueDate: new Date("2026-03-05") } })
  // Assign contacts to loan1
  await prisma.loanContact.create({ data: { loanId: loan1.id, contactId: contact1.id, companyType: "TITLE" } })
  await prisma.loanContact.create({ data: { loanId: loan1.id, contactId: contact4.id, companyType: "INSURANCE" } })
  await prisma.loanActivity.create({ data: { loanId: loan1.id, message: "Loan created as LEAD" } })

  // Loan 2: PROCESSING - DSCR - Sarah Johnson, NYC
  console.log("Creating Loan 2 (PROCESSING/DSCR)...")
  const b2 = await prisma.borrower.create({ data: { firstName: "Sarah", lastName: "Johnson", email: "sjohnson@email.com", phone: "212-555-4567", creditScore: 745, liquidity: 250000, netWorth: 1200000, experience: 7 } })
  const e2 = await prisma.entity.create({ data: { entityType: "LLC_MULTI", entityName: "Park Ave Holdings LLC", ein: "45-9876543", stateOfFormation: "NY" } })
  const p2 = await prisma.property.create({ data: { address: "88 Park Ave, New York, NY 10016", estimatedValue: 685000, taxAmount: 9600, taxFrequency: "ANNUAL", insuranceAmount: 4200, insuranceFrequency: "ANNUAL", monthlyRent: 4800 } })
  const loan2 = await prisma.loan.create({
    data: {
      status: "PROCESSING", loanType: "DSCR", brokerId: sarah.id,
      loanAmount: 480000, ltv: 70, interestRate: 7.25, termMonths: 360,
      annualTaxes: 9600, annualInsurance: 4200,
      monthlyRent: 4800, vacancyPercent: 5, otherExpenses: 200, dscrRatio: 1.28,
      borrowerId: b2.id, entityId: e2.id, 
    }
  })
  await prisma.property.update({ where: { id: p2.id }, data: { loanId: loan2.id } })
  for (const title of dscrConditions) {
    await prisma.condition.create({ data: { title, loanId: loan2.id, status: "OPEN" } })
  }
  await prisma.task.create({ data: { loanId: loan2.id, title: "Review bank statements", assignedToId: emma.id, assignedAt: new Date(), dueDate: new Date("2026-03-01") } })
  await prisma.task.create({ data: { loanId: loan2.id, title: "Order title search", assignedToId: emma.id, assignedAt: new Date(), dueDate: new Date("2026-03-08") } })
  // Assign contacts to loan2
  await prisma.loanContact.create({ data: { loanId: loan2.id, contactId: contact3.id, companyType: "TITLE" } })
  await prisma.loanContact.create({ data: { loanId: loan2.id, contactId: contact2.id, companyType: "INSURANCE" } })
  await prisma.loanActivity.create({ data: { loanId: loan2.id, message: "Loan created as LEAD" } })
  await prisma.loanActivity.create({ data: { loanId: loan2.id, message: "Status changed to SUBMITTED" } })
  await prisma.loanActivity.create({ data: { loanId: loan2.id, message: "Status changed to PROCESSING" } })

  // Loan 3: APPROVED - DSCR - Michael Brown, Tampa
  console.log("Creating Loan 3 (APPROVED/DSCR)...")
  const b3 = await prisma.borrower.create({ data: { firstName: "Michael", lastName: "Brown", email: "mbrown@email.com", phone: "813-555-7890", creditScore: 780, liquidity: 500000, netWorth: 2500000, experience: 12 } })
  const e3 = await prisma.entity.create({ data: { entityType: "LLC_SINGLE", entityName: "Bayshore Properties LLC", ein: "67-1112233", stateOfFormation: "FL" } })
  const p3 = await prisma.property.create({ data: { address: "400 Bayshore Blvd, Tampa, FL 33606", estimatedValue: 1030000, taxAmount: 12000, taxFrequency: "ANNUAL", insuranceAmount: 5400, insuranceFrequency: "ANNUAL", monthlyRent: 6500 } })
  const loan3 = await prisma.loan.create({
    data: {
      status: "APPROVED", loanType: "DSCR", brokerId: sarah.id,
      loanAmount: 720000, ltv: 70, interestRate: 6.99, termMonths: 360,
      annualTaxes: 12000, annualInsurance: 5400,
      monthlyRent: 6500, vacancyPercent: 5, otherExpenses: 300, dscrRatio: 1.15,
      borrowerId: b3.id, entityId: e3.id, 
    }
  })
  await prisma.property.update({ where: { id: p3.id }, data: { loanId: loan3.id } })
  const loan3Conditions = dscrConditions.map((title, i) => {
    if (i < 5) return { title, status: "CLEARED" as const }
    if (i < 8) return { title, status: "RECEIVED" as const }
    return { title, status: "OPEN" as const }
  })
  for (const c of loan3Conditions) {
    await prisma.condition.create({ data: { title: c.title, status: c.status, loanId: loan3.id } })
  }
  await prisma.task.create({ data: { loanId: loan3.id, title: "Schedule closing", assignedToId: emma.id, assignedAt: new Date(), dueDate: new Date("2026-03-15") } })
  // Assign contacts to loan3
  await prisma.loanContact.create({ data: { loanId: loan3.id, contactId: contact1.id, companyType: "TITLE" } })
  await prisma.loanContact.create({ data: { loanId: loan3.id, contactId: contact4.id, companyType: "INSURANCE" } })
  await prisma.loanActivity.create({ data: { loanId: loan3.id, message: "Loan created as LEAD" } })
  await prisma.loanActivity.create({ data: { loanId: loan3.id, message: "Status changed to APPROVED" } })

  // Loan 4: FUNDED - DSCR - Lisa Park, Atlanta
  console.log("Creating Loan 4 (FUNDED/DSCR)...")
  const b4 = await prisma.borrower.create({ data: { firstName: "Lisa", lastName: "Park", email: "lpark@email.com", phone: "404-555-3456", creditScore: 760, liquidity: 350000, netWorth: 1800000, experience: 9 } })
  const e4 = await prisma.entity.create({ data: { entityType: "LLC_SINGLE", entityName: "Peachtree Investments LLC", ein: "91-4455667", stateOfFormation: "GA" } })
  const p4 = await prisma.property.create({ data: { address: "2100 Peachtree Rd NW, Atlanta, GA 30309", estimatedValue: 785000, taxAmount: 8400, taxFrequency: "ANNUAL", insuranceAmount: 3800, insuranceFrequency: "ANNUAL", monthlyRent: 5200 } })
  const loan4 = await prisma.loan.create({
    data: {
      status: "FUNDED", loanType: "DSCR", brokerId: sarah.id,
      loanAmount: 550000, ltv: 70, interestRate: 7.0, termMonths: 360,
      annualTaxes: 8400, annualInsurance: 3800,
      monthlyRent: 5200, vacancyPercent: 5, otherExpenses: 250, dscrRatio: 1.22,
      borrowerId: b4.id, entityId: e4.id, 
    }
  })
  await prisma.property.update({ where: { id: p4.id }, data: { loanId: loan4.id } })
  for (const title of dscrConditions) {
    await prisma.condition.create({ data: { title, status: "CLEARED", loanId: loan4.id } })
  }
  await prisma.task.create({ data: { loanId: loan4.id, title: "Send welcome packet", assignedToId: sarah.id, assignedAt: new Date(), dueDate: new Date("2026-02-20"), status: "COMPLETED" } })
  // Assign contacts to loan4
  await prisma.loanContact.create({ data: { loanId: loan4.id, contactId: contact2.id, companyType: "TITLE" } })
  await prisma.loanContact.create({ data: { loanId: loan4.id, contactId: contact3.id, companyType: "INSURANCE" } })
  await prisma.loanActivity.create({ data: { loanId: loan4.id, message: "Loan created as LEAD" } })
  await prisma.loanActivity.create({ data: { loanId: loan4.id, message: "Status changed to FUNDED" } })
  await prisma.loanActivity.create({ data: { loanId: loan4.id, message: "All conditions cleared" } })

  console.log("Creating sample quote requests...")
  const quoteRequest1 = await prisma.quoteRequest.create({
    data: {
      borrowerEmail: "new.borrower@email.com",
      brokerId: sarah.id,
      propertyAddress: "123 Main Street",
      propertyCity: "Dallas",
      propertyState: "TX",
      propertyZip: "75201",
      status: "OPEN"
    }
  })

  await prisma.quoteOption.create({
    data: {
      quoteRequestId: quoteRequest1.id,
      loanType: "DSCR",
      loanAmount: 400000,
      interestRate: 7.5,
      termMonths: 360,
      points: 1.0,
      estimatedPayment: 2796,
      status: "SENT"
    }
  })

  await prisma.quoteOption.create({
    data: {
      quoteRequestId: quoteRequest1.id,
      loanType: "DSCR",
      loanAmount: 400000,
      interestRate: 7.25,
      termMonths: 360,
      points: 1.5,
      estimatedPayment: 2731,
      status: "SENT"
    }
  })

  console.log("Creating task reminder settings...")
  await prisma.taskReminderSetting.create({
    data: {
      userId: sarah.id,
      enabled: true,
      frequency: "DAILY",
      recipientUserIds: [sarah.id, emma.id]
    }
  })

  await prisma.taskReminderSetting.create({
    data: {
      userId: emma.id,
      enabled: true,
      frequency: "WEEKDAYS_ONLY",
      recipientUserIds: [emma.id]
    }
  })

  console.log("Updating existing loans with borrowerUserId...")
  // Link existing borrowers to their loans
  const marcusBorrower = await prisma.user.create({ 
    data: { email: "marcus.williams@email.com", password: hash, name: "Marcus Williams", role: "BORROWER" }
  })
  await prisma.borrowerProfile.create({
    data: {
      userId: marcusBorrower.id,
      firstName: "Marcus",
      lastName: "Williams",
      phone: "305-555-1234",
      entities: ["Williams Capital LLC"],
      properties: ["1247 Ocean Drive, Miami Beach"]
    }
  })
  await prisma.loan.update({
    where: { id: loan1.id },
    data: { borrowerUserId: marcusBorrower.id }
  })

  const sarahJohnsonBorrower = await prisma.user.create({ 
    data: { email: "sarah.johnson@email.com", password: hash, name: "Sarah Johnson", role: "BORROWER" }
  })
  await prisma.borrowerProfile.create({
    data: {
      userId: sarahJohnsonBorrower.id,
      firstName: "Sarah",
      lastName: "Johnson",
      phone: "212-555-4567",
      entities: ["Park Ave Holdings LLC"],
      properties: ["88 Park Ave, New York"]
    }
  })
  await prisma.loan.update({
    where: { id: loan2.id },
    data: { borrowerUserId: sarahJohnsonBorrower.id }
  })

  console.log("Seed complete!")
}

main().catch(console.error).finally(() => prisma.$disconnect())
