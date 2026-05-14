import { Resend } from "resend"
import { NextResponse } from "next/server"

const resend = new Resend(process.env.RESEND_API_KEY)

const RECIPIENTS = ["vmdbondarenko@gmail.com"]

export async function POST(req: Request) {
  try {
    const { name, email, phone, message, subject } = await req.json()

    const emailSubject = subject
      ? `Zapytanie: ${subject} — ${name}`
      : `Nowa wiadomość od ${name}`

    await resend.emails.send({
      from: "Formularz kontaktowy <kontakt@vmd-development.com>",
      to: RECIPIENTS,
      replyTo: email,
      subject: emailSubject,
      text: [
        subject ? `Zapytanie dot.: ${subject}` : "",
        `Imię i nazwisko: ${name}`,
        `Email: ${email}`,
        `Telefon: ${phone || "—"}`,
        ``,
        `Wiadomość:`,
        message || "—",
      ].filter(Boolean).join("\n"),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Resend error:", err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
