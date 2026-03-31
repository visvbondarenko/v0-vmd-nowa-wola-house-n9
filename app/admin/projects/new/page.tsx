'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Plus, Loader2 } from 'lucide-react'
import { slugify } from '@/lib/slugify'

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    slug: '',
    location: '',
  })

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: prev.slug || slugify(name),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, status: 'active', description: '', imageUrl: '', svgContent: '' }),
    })

    if (res.ok) {
      const project = await res.json()
      router.push(`/admin/projects/${project.id}`)
    } else {
      const data = await res.json()
      setError(data.error || 'Wystąpił błąd')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Powrót
          </Button>
        </Link>
        <h1 className="text-3xl font-serif font-bold text-foreground">Nowa inwestycja</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Utwórz projekt</CardTitle>
          <p className="text-sm text-muted-foreground">Podaj podstawowe dane — resztę skonfigurujesz na następnej stronie.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nazwa inwestycji *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="np. Wola House"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug URL *</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                placeholder="np. wola-house"
                required
              />
              <p className="text-xs text-muted-foreground">URL: /projects/{form.slug || 'slug'}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Lokalizacja *</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                placeholder="np. Nowa Wola, Warszawa"
                required
              />
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              {loading ? 'Tworzenie...' : 'Utwórz i konfiguruj'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
