import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Global address book - all contacts with their companies
  const contacts = await prisma.contact.findMany({
    include: { 
      company: { 
        select: { id: true, name: true, type: true } 
      },
      loanContacts: {
        include: {
          loan: {
            select: { id: true, borrowerRel: true, properties: true }
          }
        }
      }
    },
    orderBy: [{ company: { name: "asc" } }, { firstName: "asc" }],
  })
  return NextResponse.json(contacts)
}

export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Only admin, broker, and processor can create contacts
  if (user.role === 'BORROWER') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  
  const contact = await prisma.contact.create({
    data: {
      firstName: body.firstName,
      lastName: body.lastName || null,
      email: body.email || null,
      phone: body.phone || null,
      role: body.role || null,
      autoAssign: body.autoAssign ?? false,
      companyId: body.companyId
    },
    include: {
      company: {
        select: { id: true, name: true, type: true }
      }
    }
  })

  return NextResponse.json(contact)
}
