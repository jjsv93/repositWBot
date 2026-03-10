import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"
import { QuoteStatus, QuoteRequestStatus, LoanType } from "@prisma/client"

export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Only admin and broker can create quote options
  if (!['ADMIN', 'BROKER'].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  
  const quoteOption = await prisma.quoteOption.create({
    data: {
      quoteRequestId: body.quoteRequestId,
      loanType: body.loanType as LoanType,
      loanAmount: body.loanAmount,
      interestRate: body.interestRate,
      termMonths: body.termMonths,
      points: body.points || null,
      estimatedPayment: body.estimatedPayment,
      status: QuoteStatus.SENT
    }
  })

  return NextResponse.json(quoteOption)
}

// Accept a quote option
export async function PATCH(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  
  // Get the quote option and verify permissions
  const quoteOption = await prisma.quoteOption.findUnique({
    where: { id: body.quoteOptionId },
    include: {
      quoteRequest: {
        include: { borrower: true }
      }
    }
  })

  if (!quoteOption) {
    return NextResponse.json({ error: "Quote option not found" }, { status: 404 })
  }

  // Only the borrower can accept quote options
  if (user.role !== 'BORROWER' || quoteOption.quoteRequest.borrowerUserId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Accept this option and reject others
  await prisma.$transaction(async (tx) => {
    // Mark this option as accepted
    await tx.quoteOption.update({
      where: { id: body.quoteOptionId },
      data: {
        status: QuoteStatus.ACCEPTED,
        acceptedAt: new Date()
      }
    })

    // Mark other options as rejected
    await tx.quoteOption.updateMany({
      where: {
        quoteRequestId: quoteOption.quoteRequestId,
        id: { not: body.quoteOptionId }
      },
      data: {
        status: QuoteStatus.REJECTED
      }
    })

    // Mark quote request as closed
    await tx.quoteRequest.update({
      where: { id: quoteOption.quoteRequestId },
      data: {
        status: QuoteRequestStatus.CLOSED
      }
    })
  })

  return NextResponse.json({ success: true })
}