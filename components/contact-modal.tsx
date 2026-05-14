"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { X, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
  subject?: string
}

export function ContactModal({ isOpen, onClose, subject }: ContactModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!isOpen) {
      setSubmitted(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const form = e.currentTarget
    const data = {
      subject,
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
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
      if (res.ok) {
        setSubmitted(true)
        formRef.current?.reset()
      } else {
        alert("Wystąpił błąd. Spróbuj ponownie lub skontaktuj się telefonicznie.")
      }
    } catch {
      alert("Wystąpił błąd. Spróbuj ponownie lub skontaktuj się telefonicznie.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card rounded-3xl border border-border shadow-2xl w-full max-w-md p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-foreground/10 hover:bg-foreground/20 transition-colors"
          aria-label="Zamknij"
        >
          <X className="h-3.5 w-3.5" />
          Zamknij
        </button>

        <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">
          Skontaktuj się z nami
        </h2>
        {subject && (
          <p className="text-sm text-muted-foreground mb-6">
            Zapytanie dot.: <span className="font-medium text-foreground">{subject}</span>
          </p>
        )}
        {!subject && (
          <p className="text-sm text-muted-foreground mb-6">
            Wypełnij formularz, a wkrótce się z Tobą skontaktujemy.
          </p>
        )}

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Send className="h-12 w-12 mb-4" style={{ color: 'var(--color-primary)' }} />
            <h3 className="text-xl font-semibold text-foreground mb-2">Dziękujemy!</h3>
            <p className="text-muted-foreground">Wkrótce się z Tobą skontaktujemy.</p>
            <Button onClick={onClose} className="mt-6" variant="outline">Zamknij</Button>
          </div>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="modal-name" className="block text-sm font-medium text-foreground mb-1.5">
                Imię i nazwisko *
              </label>
              <Input id="modal-name" name="name" type="text" required placeholder="Jan Kowalski" className="bg-background border-border" />
            </div>
            <div>
              <label htmlFor="modal-phone" className="block text-sm font-medium text-foreground mb-1.5">
                Telefon *
              </label>
              <Input id="modal-phone" name="phone" type="tel" required placeholder="+48 123 456 789" className="bg-background border-border" />
            </div>
            <div>
              <label htmlFor="modal-email" className="block text-sm font-medium text-foreground mb-1.5">
                Adres e-mail *
              </label>
              <Input id="modal-email" name="email" type="email" required placeholder="jan@example.com" className="bg-background border-border" />
            </div>
            <div>
              <label htmlFor="modal-message" className="block text-sm font-medium text-foreground mb-1.5">
                Treść wiadomości
              </label>
              <Textarea id="modal-message" name="message" rows={3} placeholder="Napisz do nas..." className="bg-background border-border resize-none" />
            </div>
            <div className="flex items-start gap-3">
              <Checkbox id="modal-privacy" required className="mt-1" />
              <label htmlFor="modal-privacy" className="text-xs text-muted-foreground leading-relaxed">
                Zapoznałem się z informacjami na temat przetwarzania danych osobowych, które znajdują się w Polityce prywatności.
              </label>
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full font-medium"
              style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
            >
              {isSubmitting ? "Wysyłanie..." : (
                <>Wyślij wiadomość <Send className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>,
    document.body
  )
}
