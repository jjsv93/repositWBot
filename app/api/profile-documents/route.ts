import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"

// GET /api/profile-documents?borrowerId=X or ?entityId=X or ?propertyId=X
export async function GET(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const borrowerId = searchParams.get("borrowerId")
  const entityId = searchParams.get("entityId")
  const propertyId = searchParams.get("propertyId")

  const where: any = {}
  if (borrowerId) where.borrowerId = borrowerId
  if (entityId) where.entityId = entityId
  if (propertyId) where.propertyId = propertyId

  const docs = await prisma.profileDocument.findMany({
    where,
    include: { uploadedBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" }
  })

  return NextResponse.json(docs)
}

// POST /api/profile-documents — create a profile document record
export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { name, category, fileName, fileUrl, borrowerId, entityId, propertyId } = body

  if (!name || !fileName || !fileUrl) {
    return NextResponse.json({ error: "name, fileName, and fileUrl are required" }, { status: 400 })
  }

  if (!borrowerId && !entityId && !propertyId) {
    return NextResponse.json({ error: "Must specify borrowerId, entityId, or propertyId" }, { status: 400 })
  }

  const doc = await prisma.profileDocument.create({
    data: {
      name,
      category: category || null,
      fileName,
      fileUrl,
      borrowerId: borrowerId || null,
      entityId: entityId || null,
      propertyId: propertyId || null,
      uploadedById: user.id,
    },
    include: { uploadedBy: { select: { id: true, name: true } } }
  })

  return NextResponse.json(doc)
}

// DELETE /api/profile-documents?id=X
export async function DELETE(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  // Borrowers can only delete their own uploads
  const doc = await prisma.profileDocument.findUnique({ where: { id } })
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (user.role === "BORROWER" && doc.uploadedById !== user.id) {
    return NextResponse.json({ error: "Cannot delete another user's document" }, { status: 403 })
  }

  await prisma.profileDocument.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
