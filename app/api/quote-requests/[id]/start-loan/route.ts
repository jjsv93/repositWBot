import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"
import { QuoteStatus, QuoteRequestStatus, LoanStatus } from "@prisma/client"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Only admin and broker can start loans from quotes
  if (!['ADMIN', 'BROKER'].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  
  // Get the quote request with accepted option
  const quoteRequest = await prisma.quoteRequest.findUnique({
    where: { id },
    include: {
      borrower: true,
      quoteOptions: {
        where: { status: QuoteStatus.ACCEPTED }
      }
    }
  })

  if (!quoteRequest || quoteRequest.status !== QuoteRequestStatus.CLOSED) {
    return NextResponse.json({ error: "Quote request not found or not closed" }, { status: 400 })
  }

  const acceptedOption = quoteRequest.quoteOptions[0]
  if (!acceptedOption) {
    return NextResponse.json({ error: "No accepted quote option found" }, { status: 400 })
  }

  // Create borrower if doesn't exist
  let borrower = null
  if (quoteRequest.borrowerUserId) {
    // Find existing borrower profile or create one
    const existingProfile = await prisma.borrowerProfile.findUnique({
      where: { userId: quoteRequest.borrowerUserId }
    })
    
    if (!existingProfile) {
      await prisma.borrowerProfile.create({
        data: {
          userId: quoteRequest.borrowerUserId,
          firstName: quoteRequest.borrower?.name?.split(' ')[0] || 'Unknown',
          lastName: quoteRequest.borrower?.name?.split(' ').slice(1).join(' ') || '',
          entities: [],
          properties: []
        }
      })
    }
  } else {
    // Create new borrower user and profile
    const newBorrower = await prisma.user.create({
      data: {
        email: quoteRequest.borrowerEmail,
        password: 'temp-password', // They'll need to reset this
        name: quoteRequest.borrowerEmail.split('@')[0],
        role: 'BORROWER'
      }
    })

    await prisma.borrowerProfile.create({
      data: {
        userId: newBorrower.id,
        firstName: quoteRequest.borrowerEmail.split('@')[0],
        lastName: '',
        entities: [],
        properties: []
      }
    })

    borrower = newBorrower
  }

  // Create loan first
  const loan = await prisma.loan.create({
    data: {
      status: LoanStatus.LEAD,
      loanType: acceptedOption.loanType,
      loanAmount: acceptedOption.loanAmount,
      interestRate: acceptedOption.interestRate,
      termMonths: acceptedOption.termMonths,
      brokerId: user.id,
      borrowerUserId: borrower?.id || quoteRequest.borrowerUserId,
    },
    include: {
      borrowerUser: {
        select: { id: true, name: true, email: true }
      },
      properties: true
    }
  })

  // Create property attached to loan
  await prisma.property.create({
    data: {
      loanId: loan.id,
      address: `${quoteRequest.propertyAddress}, ${quoteRequest.propertyCity}, ${quoteRequest.propertyState} ${quoteRequest.propertyZip}`,
    }
  })

  // Reload loan with properties
  const fullLoan = await prisma.loan.findUnique({
    where: { id: loan.id },
    include: { borrowerUser: { select: { id: true, name: true, email: true } }, properties: true }
  })

  return NextResponse.json(fullLoan)
}