import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"
import { CompanyType } from "@prisma/client"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  
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
    orderBy: { createdAt: "asc" }
  })
  return NextResponse.json(loanContacts)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (user.role === 'BORROWER') return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  // Support multi-assign: contactIds array or single contactId
  const contactIds: string[] = body.contactIds || [body.contactId]
  const results = []

  for (const contactId of contactIds) {
    // Skip if already assigned
    const existing = await prisma.loanContact.findUnique({
      where: { loanId_contactId: { loanId: id, contactId } }
    })
    if (existing) continue

    const loanContact = await prisma.loanContact.create({
      data: {
        loanId: id,
        contactId,
        companyType: body.companyType as CompanyType,
        role: body.role || null,
      },
      include: {
        contact: {
          include: { company: { select: { id: true, name: true, type: true } } }
        }
      }
    })
    results.push(loanContact)
  }

  return NextResponse.json(results)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (user.role === 'BORROWER') return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  
  await prisma.loanContact.delete({
    where: { loanId_contactId: { loanId: id, contactId: body.contactId } }
  })

  return NextResponse.json({ success: true })
}
