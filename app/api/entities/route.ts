import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const entities = await prisma.entity.findMany({
    include: { loan: { select: { id: true, status: true } } },
    orderBy: { entityName: "asc" },
  })
  return NextResponse.json(entities)
}
