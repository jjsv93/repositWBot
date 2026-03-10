import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  // Filter tasks based on user role and permissions
  let whereClause: any = { loanId: id }
  if (user.role === 'BORROWER') {
    // Borrowers only see tasks assigned to them
    whereClause.assignedToId = user.id
  }
  // Admin, Broker, and Processor see all tasks for this loan

  const tasks = await prisma.task.findMany({ 
    where: whereClause, 
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      condition: { select: { id: true, title: true } }
    },
    orderBy: { createdAt: "desc" } 
  })
  return NextResponse.json(tasks)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  // Only admin, broker, and processor can create tasks
  if (user.role === 'BORROWER') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  
  const taskData: any = {
    loanId: id,
    title: body.title,
    description: body.description || null,
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
    reminder: body.reminder || null,
  }

  if (body.assignedToId) {
    taskData.assignedToId = body.assignedToId
    taskData.assignedAt = new Date()
  }

  if (body.conditionId) {
    taskData.conditionId = body.conditionId
  }

  const task = await prisma.task.create({
    data: taskData,
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      condition: { select: { id: true, title: true } }
    }
  })
  return NextResponse.json(task)
}
