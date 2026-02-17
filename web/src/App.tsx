import { useState, useEffect, useMemo } from 'react'
import { useAtomValue } from 'jotai'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { HeroSection } from '@/components/sections/HeroSection'
import { HardwareSection } from '@/components/sections/HardwareSection'
import { OsSetupSection } from '@/components/sections/OsSetupSection'
import { PostInstallSection } from '@/components/sections/PostInstallSection'
import { OllamaSection } from '@/components/sections/OllamaSection'
import { DaemonBotSection } from '@/components/sections/DaemonBotSection'
import { SecuritySection } from '@/components/sections/SecuritySection'
import { TroubleshootingSection } from '@/components/sections/TroubleshootingSection'
import { NextStepsSection } from '@/components/sections/NextStepsSection'
import { useScrollSpy } from '@/hooks/useScrollSpy'
import { themeAtom, osAtom } from '@/store/atoms'
import { SECTIONS } from '@/store/constants'

function App() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const theme = useAtomValue(themeAtom)
  const selectedOs = useAtomValue(osAtom)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const visibleSections = useMemo(() => {
    return SECTIONS.filter((s) => {
      if (s.id === 'post-install' && selectedOs !== 'ubuntu') return false
      return true
    }).map((s) => s.id)
  }, [selectedOs])

  useScrollSpy(visibleSections)

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setMobileOpen(true)} />

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
            <Sidebar />
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-8 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-16">
            <HeroSection />
            <HardwareSection />
            <OsSetupSection />
            <PostInstallSection />
            <OllamaSection />
            <DaemonBotSection />
            <SecuritySection />
            <TroubleshootingSection />
            <NextStepsSection />
          </div>
        </main>
      </div>

      <ScrollToTop />
    </div>
  )
}

export default App
