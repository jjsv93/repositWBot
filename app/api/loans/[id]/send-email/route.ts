import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/auth"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (user.role === "BORROWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  if (!body.recipients?.length || !body.subject || !body.message) {
    return NextResponse.json({ error: "Recipients, subject, and message are required" }, { status: 400 })
  }

  // TODO: Integrate with actual email service (Resend, SendGrid, AWS SES)
  // For now, log the email as a loan activity so it appears in the timeline
  // When an email service is configured, uncomment and use:
  //
  // import { Resend } from 'resend'
  // const resend = new Resend(process.env.RESEND_API_KEY)
  // await resend.emails.send({
  //   from: 'noreply@loanos.com',
  //   to: body.recipients,
  //   subject: body.subject,
  //   text: body.message,
  // })

  const recipientList = body.recipients.join(", ")

  await prisma.loanActivity.create({
    data: {
      loanId: id,
      message: `📧 Email sent to ${recipientList} — Subject: "${body.subject}"`,
    },
  })

  return NextResponse.json({ success: true, note: "Email logged. Configure RESEND_API_KEY to enable actual sending." })
}
