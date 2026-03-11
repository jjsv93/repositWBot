import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Filter tasks based on user role and permissions
  let whereClause = {}
  if (user.role === 'BORROWER') {
    // Borrowers only see tasks assigned to them
    whereClause = { assignedToId: user.id }
  }
  // Admin, Broker, and Processor see all tasks

  const tasks = await prisma.task.findMany({
    where: whereClause,
    include: { 
      loan: { select: { id: true, borrowerRel: true, properties: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      condition: { select: { id: true, title: true } }
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(tasks)
}
