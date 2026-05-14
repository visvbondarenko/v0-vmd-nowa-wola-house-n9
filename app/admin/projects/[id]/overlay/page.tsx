import AdminOverlayEditor from '@/components/admin/admin-overlay-editor'

export const dynamic = 'force-dynamic'

export default async function OverlayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AdminOverlayEditor projectId={id} />
}
