"use client"

import { useState } from "react"
import { Mail, Phone, MapPin, Send } from "lucide-react"

export function DynamicContactSection({
  phone,
  email,
  address,
}: {
  phone: string | null
  email: string | null
  address: string | null
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const form = e.currentTarget
    const data = {
      name: `${(form.elements.namedItem("firstName") as HTMLInputElement).value} ${(form.elements.namedItem("lastName") as HTMLInputElement).value}`.trim(),
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    }
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (res.ok) setSubmitted(true)
      else alert("Wystąpił błąd. Spróbuj ponownie lub skontaktuj się telefonicznie.")
    } catch {
      alert("Wystąpił błąd. Spróbuj ponownie lub skontaktuj się telefonicznie.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const contactItems = [
    phone && { icon: Phone, label: "Telefon", value: phone, href: `tel:${phone}` },
    email && { icon: Mail, label: "Email", value: email, href: `mailto:${email}` },
    address && { icon: MapPin, label: "Biuro", value: address },
  ].filter(Boolean) as Array<{ icon: React.ComponentType<{ className?: string }>; label: string; value: string; href?: string }>

  return (
    <section id="kontakt" className="py-20 lg:py-32" style={{ backgroundColor: "#1a1a1a" }}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16">
          <div>
            <h2 className="font-serif text-3xl lg:text-4xl font-semibold text-white mb-6">
              Skontaktuj się z nami
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Masz pytania dotyczące inwestycji? Chętnie odpowiemy na wszystkie wątpliwości i pomożemy wybrać najlepszą opcję.
            </p>
            <div className="space-y-4">
              {contactItems.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(110,46,42,0.3)" }}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="text-white hover:underline">{item.value}</a>
                    ) : (
                      <p className="text-white">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Send className="w-12 h-12 text-green-400 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Dziękujemy!</h3>
                <p className="text-muted-foreground">Wkrótce się z Tobą skontaktujemy.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input name="firstName" placeholder="Imię" required className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-[var(--color-primary)]" />
                  <input name="lastName" placeholder="Nazwisko" required className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-[var(--color-primary)]" />
                </div>
                <input name="email" type="email" placeholder="Email" required className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-[var(--color-primary)]" />
                <input name="phone" type="tel" placeholder="Telefon" className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-[var(--color-primary)]" />
                <textarea name="message" placeholder="Wiadomość" rows={4} className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-[var(--color-primary)] resize-none" />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "var(--color-primary)", color: "white" }}
                >
                  {isSubmitting ? "Wysyłanie..." : "Wyślij wiadomość"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
