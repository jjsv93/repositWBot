import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"
import { LoanInviteStatus, Role } from "@prisma/client"
import { randomBytes } from "crypto"

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const invites = await prisma.loanInvite.findMany({
    where: {
      OR: [
        { senderId: user.id },
        { receiverId: user.id },
        { email: user.email }
      ]
    },
    include: {
      loan: {
        select: { id: true, borrowerRel: true, properties: true }
      },
      sender: {
        select: { id: true, name: true, email: true }
      },
      receiver: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  return NextResponse.json(invites)
}

export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Only admin and broker can send invites
  if (!['ADMIN', 'BROKER'].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  
  // Generate unique token
  const token = randomBytes(32).toString('hex')
  
  const invite = await prisma.loanInvite.create({
    data: {
      loanId: body.loanId,
      email: body.email,
      role: body.role as Role,
      companyId: body.companyId || null,
      token: token,
      senderId: user.id
    },
    include: {
      loan: {
        select: { id: true, borrowerRel: true, properties: true }
      },
      sender: {
        select: { id: true, name: true, email: true }
      }
    }
  })

  // TODO: Send email invite here
  
  return NextResponse.json(invite)
}

// Accept invite endpoint
export async function PATCH(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  
  // Find invite by token
  const invite = await prisma.loanInvite.findUnique({
    where: { token: body.token },
    include: { loan: true }
  })

  if (!invite || invite.status !== LoanInviteStatus.PENDING) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 400 })
  }

  if (invite.email !== user.email) {
    return NextResponse.json({ error: "Invite not for this user" }, { status: 400 })
  }

  // Accept invite
  const updatedInvite = await prisma.loanInvite.update({
    where: { id: invite.id },
    data: {
      status: LoanInviteStatus.ACCEPTED,
      receiverId: user.id,
      acceptedAt: new Date()
    }
  })

  // Link borrower to loan if role is BORROWER
  if (invite.role === Role.BORROWER) {
    await prisma.loan.update({
      where: { id: invite.loanId },
      data: { borrowerUserId: user.id }
    })
  }

  // Update user company if specified
  if (invite.companyId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { companyId: invite.companyId }
    })
  }

  return NextResponse.json(updatedInvite)
}