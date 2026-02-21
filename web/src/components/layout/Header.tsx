import { useAtom } from 'jotai'
import { Moon, Sun, Github, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { themeAtom } from '@/store/atoms'

interface HeaderProps {
  onMenuToggle: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const [theme, setTheme] = useAtom(themeAtom)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <a href={import.meta.env.BASE_URL} className="flex items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}daemon-logo.png`}
            alt="Daemon"
            className="h-8 w-8 rounded-full object-contain scale-[1.3]"
          />
          <span className="text-lg font-bold">Daemon</span>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            Setup Guide
          </span>
        </a>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <a
              href="https://github.com/niiyeboah/daemon"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
            >
              <Github className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}
