import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"
import { CompanyType } from "@prisma/client"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  
  // Get loan contacts through the junction table
  const loanContacts = await prisma.loanContact.findMany({ 
    where: { loanId: id },
    include: {
      contact: {
        include: {
          company: {
            select: { id: true, name: true, type: true }
          }
        }
      }
    },
    orderBy: { companyType: "asc" }
  })
  return NextResponse.json(loanContacts)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  // Only admin, broker, and processor can assign contacts
  if (user.role === 'BORROWER') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  
  // Check if this company type is already assigned to this loan
  const existingAssignment = await prisma.loanContact.findUnique({
    where: {
      loanId_companyType: {
        loanId: id,
        companyType: body.companyType as CompanyType
      }
    }
  })

  if (existingAssignment) {
    // Replace existing assignment
    const loanContact = await prisma.loanContact.update({
      where: { id: existingAssignment.id },
      data: { contactId: body.contactId },
      include: {
        contact: {
          include: {
            company: {
              select: { id: true, name: true, type: true }
            }
          }
        }
      }
    })
    return NextResponse.json(loanContact)
  } else {
    // Create new assignment
    const loanContact = await prisma.loanContact.create({
      data: {
        loanId: id,
        contactId: body.contactId,
        companyType: body.companyType as CompanyType
      },
      include: {
        contact: {
          include: {
            company: {
              select: { id: true, name: true, type: true }
            }
          }
        }
      }
    })
    return NextResponse.json(loanContact)
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  // Only admin, broker, and processor can remove contacts
  if (user.role === 'BORROWER') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  
  // Remove contact assignment
  await prisma.loanContact.delete({
    where: {
      loanId_companyType: {
        loanId: id,
        companyType: body.companyType as CompanyType
      }
    }
  })

  return NextResponse.json({ success: true })
}
