import { createContext, useCallback, useContext, useMemo } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

const DataContext = createContext(null)

const STORAGE_KEY = 'insightmart.dataset'

/**
 * Holds the analysis produced by the most recent CSV upload.
 *
 * The application is upload-first: until a file has been analysed there is
 * nothing for the Dashboard to show, so it reads `hasData` from here and
 * sends the user to CSV Analysis instead.
 */
export function DataProvider({ children }) {
  const [dataset, setDataset, clearDataset] = useLocalStorage(STORAGE_KEY, null)

  const setAnalysis = useCallback(
    (analysis, meta = {}) => {
      setDataset({
        analysis,
        filename: meta.filename ?? analysis?.uploadId ?? 'sales.csv',
        rows: meta.rows ?? analysis?.rowsAnalysed ?? 0,
        uploadedAt: meta.uploadedAt ?? new Date().toISOString(),
      })
    },
    [setDataset],
  )

  const value = useMemo(
    () => ({
      dataset,
      analysis: dataset?.analysis ?? null,
      hasData: Boolean(dataset?.analysis),
      setAnalysis,
      clearDataset,
    }),
    [dataset, setAnalysis, clearDataset],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useDataset() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useDataset must be used inside a DataProvider')
  return context
}
