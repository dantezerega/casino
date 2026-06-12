import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar, SidebarContent } from '@/components/layout/Sidebar';
import { Background } from '@/components/layout/Background';
import { SoundToggleButton } from '@/components/SoundToggleButton';
import { AudioBootstrap } from '@/audio/AudioBootstrap';
import { StatsWidget } from '@/components/stats/StatsWidget';
import { useStatsRecorder } from '@/hooks/useStatsRecorder';

/**
 * App shell: fixed sidebar on desktop, slide-in drawer on mobile. Page content
 * renders through <Outlet>. The mobile top bar exposes the menu toggle.
 */
export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  useStatsRecorder();

  return (
    <div className="relative isolate flex min-h-screen text-white">
      <Background />
      <AudioBootstrap />
      <Sidebar />
      <StatsWidget />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 border-b border-white/5 bg-panel/30 px-4 py-3 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="grid h-9 w-9 place-items-center rounded-lg bg-panel-light text-lg"
          >
            ☰
          </button>
          <span className="flex items-center gap-2 font-display font-bold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-accent to-cyan text-base">🎰</span>
            Lucky<span className="-ml-1 text-accent">Bit</span>
          </span>
          <SoundToggleButton className="ml-auto" />
        </header>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 w-64 bg-panel shadow-2xl lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            >
              <SidebarContent onNavigate={() => setDrawerOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
