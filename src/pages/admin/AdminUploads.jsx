import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Database, Trash2, CheckCircle2, XCircle, FileSpreadsheet, Search } from 'lucide-react'

import AdminSection from './AdminSection'
import ChartCard from '@/components/ChartCard'
import ConfirmDialog from '@/components/ConfirmDialog'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import { SegmentedTabs } from '@/components/ui/Tabs'
import { Table, THead, TRow, TCell } from '@/components/ui/Table'
import { EmptyState } from '@/components/ui/EmptyState'
import { adminApi, errorMessage } from '@/services/api'
import { useToast } from '@/context/ToastContext'
import { number, relativeTime, fileSize } from '@/lib/formatters'

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'processed', label: 'Processed' },
  { id: 'failed', label: 'Failed' },
]

const iconBtn =
  'rounded-lg p-1.5 text-faint opacity-0 transition-all duration-200 focus:opacity-100 group-hover:opacity-100 hover:bg-[rgb(var(--c-danger)/0.12)] hover:text-danger'

export default function AdminUploads() {
  const { data, setData, loading } = useOutletContext()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [confirm, setConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const uploads = useMemo(() => {
    const list = data?.uploads ?? []
    const q = query.trim().toLowerCase()
    return list.filter((upload) => {
      const matchesStatus = status === 'all' || upload.status === status
      const matchesQuery =
        !q ||
        upload.filename.toLowerCase().includes(q) ||
        upload.uploadedBy.toLowerCase().includes(q)
      return matchesStatus && matchesQuery
    })
  }, [data, query, status])

  const totalRows = uploads.reduce((sum, upload) => sum + upload.rows, 0)

  const remove = async () => {
    setDeleting(true)
    try {
      await adminApi.deleteUpload({ uploadId: confirm.id })
      setData((prev) => ({ ...prev, uploads: prev.uploads.filter((u) => u.id !== confirm.id) }))
      toast.success(`${confirm.filename} deleted.`)
      setConfirm(null)
    } catch (error) {
      toast.error(errorMessage(error, 'That upload could not be deleted.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminSection
      title="Uploads and data"
      description="Every file processed platform-wide, including the ones that failed and why."
    >
      <ChartCard
        loading={loading}
        title={`${uploads.length} files, ${number(totalRows)} records`}
        description="Deleting a file also removes every sales record parsed from it."
        icon={Database}
        action={
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <Input
              icon={Search}
              placeholder="Search file or uploader"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              containerClassName="w-full sm:w-52"
              className="h-9 text-[13px]"
              aria-label="Search uploads"
            />
            <SegmentedTabs
              items={STATUS_FILTERS}
              value={status}
              onChange={setStatus}
              size="sm"
              layoutId="admin-upload-status"
            />
          </div>
        }
      >
        {uploads.length === 0 ? (
          <EmptyState
            icon={Database}
            title="No uploads match"
            description="Try a different search or status filter."
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setQuery('')
                  setStatus('all')
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <Table>
            <THead
              columns={[
                { label: 'File' },
                { label: 'Uploaded by' },
                { label: 'Status' },
                { label: 'Rows', align: 'right' },
                { label: 'Size', align: 'right' },
                { label: 'When', align: 'right' },
                { label: 'Actions', align: 'right' },
              ]}
            />
            <tbody>
              <AnimatePresence initial={false}>
                {uploads.map((upload, i) => (
                  <TRow key={upload.id} index={i}>
                    <TCell className="font-medium">
                      <span className="flex items-center gap-2.5">
                        <FileSpreadsheet className="h-4 w-4 shrink-0 text-faint" strokeWidth={1.8} />
                        <span>
                          {upload.filename}
                          {upload.error && (
                            <span className="mt-0.5 block text-[11.5px] font-normal text-danger">
                              {upload.error}
                            </span>
                          )}
                        </span>
                      </span>
                    </TCell>
                    <TCell muted>{upload.uploadedBy}</TCell>
                    <TCell>
                      <Badge
                        tone={upload.status === 'processed' ? 'success' : 'danger'}
                        icon={upload.status === 'processed' ? CheckCircle2 : XCircle}
                      >
                        {upload.status === 'processed' ? 'Processed' : 'Failed'}
                      </Badge>
                    </TCell>
                    <TCell align="right" numeric muted>
                      {number(upload.rows)}
                    </TCell>
                    <TCell align="right" numeric muted>
                      {fileSize(upload.size)}
                    </TCell>
                    <TCell align="right" muted>
                      {relativeTime(upload.uploadedAt)}
                    </TCell>
                    <TCell align="right">
                      <button
                        type="button"
                        onClick={() => setConfirm(upload)}
                        aria-label={`Delete ${upload.filename}`}
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
        title={confirm ? `Delete ${confirm.filename}?` : ''}
        description="The file and every sales record parsed from it are removed permanently."
      />
    </AdminSection>
  )
}
