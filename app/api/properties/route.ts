import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const properties = await prisma.property.findMany({
    include: { loan: { select: { id: true, status: true } } },
    orderBy: { address: "asc" },
  })
  return NextResponse.json(properties)
}
