import { TargoLogo } from '@/components/TargoLogo'
import { Separator } from '@/components/ui/separator'

const links = [
  { href: '#/home/features', label: 'Home' },
  { href: '#/commute', label: 'Commute' },
  { href: '#/commute/neighbourhood', label: 'Friendly neighbourhood' },
  { href: '#/jaam', label: 'Jaam' },
  { href: '#/emergency', label: 'Emergency services' },
  { href: '#/home/features', label: 'Product' },
  { href: '#/home/about', label: 'About' },
  { href: '#/home/contact', label: 'Contact' },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-white/8 bg-[#050505] px-8 py-12 md:px-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <TargoLogo />
        <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/70">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-white">
              {l.label}
            </a>
          ))}
        </nav>
      </div>
      <Separator className="mx-auto my-8 max-w-6xl bg-white/10" />
      <div className="mx-auto flex max-w-6xl flex-col gap-2 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} targo. All rights reserved.</p>
        <p className="text-white/35">Hackathon prototype — Urban congestion intelligence (demo)</p>
      </div>
    </footer>
  )
}
