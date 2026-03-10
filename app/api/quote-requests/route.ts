import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"
import { QuoteRequestStatus } from "@prisma/client"

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let whereClause = {}
  if (user.role === 'BORROWER') {
    // Borrowers only see their own quote requests
    whereClause = { borrowerUserId: user.id }
  } else if (user.role === 'BROKER') {
    // Brokers see requests they created or are assigned to
    whereClause = { brokerId: user.id }
  }
  // Admin and Processor see all quote requests

  const quoteRequests = await prisma.quoteRequest.findMany({
    where: whereClause,
    include: {
      borrower: {
        select: { id: true, name: true, email: true }
      },
      quoteOptions: {
        orderBy: { createdAt: "asc" }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  return NextResponse.json(quoteRequests)
}

export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Only admin and broker can create quote requests
  if (!['ADMIN', 'BROKER'].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  
  // Try to find existing borrower by email
  let borrowerUserId = null
  const existingBorrower = await prisma.user.findUnique({
    where: { email: body.borrowerEmail }
  })
  if (existingBorrower && existingBorrower.role === 'BORROWER') {
    borrowerUserId = existingBorrower.id
  }
  
  const quoteRequest = await prisma.quoteRequest.create({
    data: {
      borrowerEmail: body.borrowerEmail,
      borrowerUserId: borrowerUserId,
      brokerId: user.id,
      propertyAddress: body.propertyAddress,
      propertyCity: body.propertyCity,
      propertyState: body.propertyState,
      propertyZip: body.propertyZip,
      status: QuoteRequestStatus.OPEN
    },
    include: {
      borrower: {
        select: { id: true, name: true, email: true }
      },
      quoteOptions: true
    }
  })

  return NextResponse.json(quoteRequest)
}