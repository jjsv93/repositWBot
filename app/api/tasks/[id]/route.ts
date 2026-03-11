import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"
import { TaskStatus } from "@prisma/client"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  
  // Handle status change (backwards compatibility with completed boolean)
  if (body.completed !== undefined) {
    data.status = body.completed ? TaskStatus.COMPLETED : TaskStatus.OPEN
  }
  if (body.status !== undefined) {
    data.status = body.status
  }
  
  if (body.title !== undefined) data.title = body.title
  if (body.assignedToId !== undefined) {
    data.assignedToId = body.assignedToId
    if (body.assignedToId && !data.assignedAt) {
      data.assignedAt = new Date()
    }
  }
  // Backwards compatibility for assignedTo string
  if (body.assignedTo !== undefined) {
    // Try to find user by name for backwards compatibility
    const assignedUser = await prisma.user.findFirst({
      where: { name: body.assignedTo }
    })
    if (assignedUser) {
      data.assignedToId = assignedUser.id
      data.assignedAt = new Date()
    }
  }
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null
  if (body.conditionId !== undefined) data.conditionId = body.conditionId
  
  const task = await prisma.task.update({ 
    where: { id }, 
    data,
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      condition: { select: { id: true, title: true } },
      loan: { select: { id: true, borrowerRel: true, properties: true } }
    }
  })
  return NextResponse.json(task)
}
