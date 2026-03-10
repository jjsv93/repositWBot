import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const documents = await prisma.document.findMany({
    where: { loanId: id },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(documents)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const formData = await req.formData()
  const file = formData.get("file") as File
  const conditionId = formData.get("conditionId") as string | null
  const docType = formData.get("type") as string | null

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  const uploadsDir = path.join(process.cwd(), "public", "uploads", id)
  await mkdir(uploadsDir, { recursive: true })

  const timestamp = Date.now()
  const fileName = `${timestamp}-${file.name}`
  const filePath = path.join(uploadsDir, fileName)
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filePath, buffer)

  const fileUrl = `/uploads/${id}/${fileName}`

  const document = await prisma.document.create({
    data: {
      loanId: id,
      conditionId: conditionId || null,
      type: docType || null,
      fileName: file.name,
      fileUrl,
      uploadedById: user.id,
    },
  })

  await prisma.loanActivity.create({
    data: { loanId: id, message: `Document "${file.name}" uploaded` },
  })

  return NextResponse.json(document)
}
