import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import { DataProvider } from '@/context/DataContext'
import ScrollToTop from '@/components/layout/ScrollToTop'
import AppRoutes from '@/routes/AppRoutes'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <DataProvider>
              <ScrollToTop />
              <AppRoutes />
            </DataProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
