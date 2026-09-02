import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, ArrowLeft, LayoutDashboard } from 'lucide-react'

import Button from '@/components/ui/Button'
import Logo from '@/components/ui/Logo'
import { AuroraBackground, GridBackdrop, PageTransition } from '@/components/motion'
import { useAuth } from '@/context/AuthContext'
import { EASE } from '@/lib/motion'

export default function NotFound() {
  const { isAuthenticated } = useAuth()

  return (
    <PageTransition>
      <div className="relative grid min-h-[100svh] place-items-center overflow-hidden bg-canvas px-6">
        <GridBackdrop size={48} />
        <AuroraBackground intensity={0.6} />

        <div className="relative text-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="flex justify-center"
          >
            <Link to="/" aria-label="InsightMart home">
              <Logo size={38} />
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
            className="text-gradient mt-10 font-display text-[92px] font-semibold leading-none tracking-[-0.045em] sm:text-[120px]"
          >
            404
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
            className="mt-4 text-display-sm"
          >
            That page is not part of the platform
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.28 }}
            className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-muted"
          >
            The link may be out of date, or the page may sit behind a role you do not have.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.36 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button as={Link} to="/" icon={Home}>
              Back to home
            </Button>
            {isAuthenticated ? (
              <Button as={Link} to="/dashboard" variant="secondary" icon={LayoutDashboard}>
                Go to dashboard
              </Button>
            ) : (
              <Button as={Link} to="/login" variant="secondary" icon={ArrowLeft}>
                Sign in
              </Button>
            )}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  )
}
