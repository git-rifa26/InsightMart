import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { UploadCloud, FileSpreadsheet, X } from 'lucide-react'

import { ProgressRing } from './Progress'
import { fileSize } from '@/lib/formatters'
import { EASE } from '@/lib/motion'
import { cn } from '@/lib/cn'

/**
 * Drag-and-drop CSV picker. Reports the chosen file upward; the page owns
 * parsing and upload so this stays a presentational control.
 */
export function FileDropzone({ file, onSelect, onClear, progress = null, disabled = false, error }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const handleFiles = (fileList) => {
    const next = fileList?.[0]
    if (!next) return
    onSelect(next)
  }

  const onDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    if (disabled) return
    handleFiles(event.dataTransfer.files)
  }

  return (
    <div>
      <motion.div
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !disabled && !file && inputRef.current?.click()}
        animate={{ scale: dragging ? 1.01 : 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className={cn(
          'relative overflow-hidden rounded-2xl border-2 border-dashed p-8 text-center transition-colors duration-250',
          dragging
            ? 'border-[rgb(var(--c-brand))] bg-[rgb(var(--c-brand)/0.07)]'
            : 'border-[rgb(var(--c-hairline)/0.16)] bg-[rgb(var(--c-hairline)/0.025)]',
          error && 'border-[rgb(var(--c-danger)/0.5)]',
          !file && !disabled && 'cursor-pointer hover:border-[rgb(var(--c-brand)/0.5)]',
          disabled && 'opacity-60',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />

        <AnimatePresence mode="wait">
          {progress != null ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center"
            >
              <ProgressRing value={progress} size={68} />
              <p className="mt-4 text-[14px] font-medium text-ink">Uploading {file?.name}</p>
              <p className="mt-1 text-[12.5px] text-muted">Validating schema and parsing rows</p>
            </motion.div>
          ) : file ? (
            <motion.div
              key="chosen"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[rgb(var(--c-success)/0.13)] text-success">
                <FileSpreadsheet className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <p className="mt-4 text-[14.5px] font-medium text-ink">{file.name}</p>
              <p className="mt-1 text-[12.5px] text-muted">{fileSize(file.size)} ready to analyse</p>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onClear()
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-muted transition-colors hover:text-danger"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.2} />
                Choose a different file
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center"
            >
              <motion.span
                animate={dragging ? { y: -5 } : { y: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                className="grid h-12 w-12 place-items-center rounded-2xl bg-[rgb(var(--c-brand)/0.12)] text-brand"
              >
                <UploadCloud className="h-5 w-5" strokeWidth={1.9} />
              </motion.span>
              <p className="mt-4 text-[14.5px] font-medium text-ink">
                {dragging ? 'Drop the file to begin' : 'Drop your sales CSV here'}
              </p>
              <p className="mt-1 text-[12.5px] text-muted">
                or click to browse. Needs a date, product and revenue column.
              </p>
              <p className="mt-3 text-[11.5px] text-faint">
                A cost column unlocks the profitability analysis.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="overflow-hidden pt-2.5 text-[13px] text-danger"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FileDropzone
