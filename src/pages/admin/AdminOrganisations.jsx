import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Building2, Trash2, Users } from 'lucide-react'

import AdminSection from './AdminSection'
import ChartCard from '@/components/ChartCard'
import ConfirmDialog from '@/components/ConfirmDialog'
import Badge from '@/components/ui/Badge'
import { Table, THead, TRow, TCell } from '@/components/ui/Table'
import { EmptyState } from '@/components/ui/EmptyState'
import { adminApi, errorMessage } from '@/services/api'
import { useToast } from '@/context/ToastContext'
import { number, shortDate } from '@/lib/formatters'

const iconBtn =
  'rounded-lg p-1.5 text-faint opacity-0 transition-all duration-200 focus:opacity-100 group-hover:opacity-100 hover:bg-[rgb(var(--c-danger)/0.12)] hover:text-danger'

export default function AdminOrganisations() {
  const { data, setData, loading } = useOutletContext()
  const toast = useToast()
  const [confirm, setConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const organisations = data?.organisations ?? []

  const remove = async () => {
    setDeleting(true)
    try {
      await adminApi.deleteOrganisation({ orgId: confirm.id })
      setData((prev) => ({
        ...prev,
        organisations: prev.organisations.filter((o) => o.id !== confirm.id),
        stats: { ...prev.stats, organisations: prev.stats.organisations - 1 },
      }))
      toast.success(`${confirm.name} deleted.`)
      setConfirm(null)
    } catch (error) {
      toast.error(errorMessage(error, 'That organisation could not be deleted.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminSection
      title="Organisations"
      description="Every Enterprise workspace, its team lead and its shared uploads."
    >
      <ChartCard
        loading={loading}
        title={`${organisations.length} organisations`}
        description="Deleting one removes its team assignments and shared uploads."
        icon={Building2}
      >
        {organisations.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No organisations"
            description="No Enterprise workspaces exist on the platform yet."
          />
        ) : (
          <Table>
            <THead
              columns={[
                { label: 'Organisation' },
                { label: 'Team lead' },
                { label: 'Members', align: 'right' },
                { label: 'Uploads', align: 'right' },
                { label: 'Created', align: 'right' },
                { label: 'Actions', align: 'right' },
              ]}
            />
            <tbody>
              <AnimatePresence initial={false}>
                {organisations.map((org, i) => (
                  <TRow key={org.id} index={i}>
                    <TCell className="font-medium">
                      <span className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[rgb(var(--c-violet)/0.15)] text-[rgb(var(--c-violet))]">
                          <Building2 className="h-4 w-4" strokeWidth={2} />
                        </span>
                        {org.name}
                      </span>
                    </TCell>
                    <TCell muted>{org.owner}</TCell>
                    <TCell align="right">
                      <Badge tone="neutral" icon={Users}>
                        {number(org.members)}
                      </Badge>
                    </TCell>
                    <TCell align="right" numeric>
                      {number(org.uploads)}
                    </TCell>
                    <TCell align="right" muted>
                      {shortDate(org.createdAt)}
                    </TCell>
                    <TCell align="right">
                      <button
                        type="button"
                        onClick={() => setConfirm(org)}
                        aria-label={`Delete ${org.name}`}
                        className={iconBtn}
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    </TCell>
                  </TRow>
                ))}
              </AnimatePresence>
            </tbody>
          </Table>
        )}
      </ChartCard>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={remove}
        loading={deleting}
        title={confirm ? `Delete ${confirm.name}?` : ''}
        description="The organisation, its team assignments and shared uploads are removed permanently."
      />
    </AdminSection>
  )
}
