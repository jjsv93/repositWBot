import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"
import { CompanyType } from "@prisma/client"

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const companies = await prisma.company.findMany({
    include: {
      contacts: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          autoAssign: true
        }
      }
    },
    orderBy: { name: "asc" }
  })

  return NextResponse.json(companies)
}

export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Only admin, broker, and processor can create companies
  if (user.role === 'BORROWER') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  
  const company = await prisma.company.create({
    data: {
      name: body.name,
      type: body.type as CompanyType
    },
    include: {
      contacts: true
    }
  })

  return NextResponse.json(company)
}