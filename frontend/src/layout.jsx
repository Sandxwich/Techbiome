import { Link, Outlet } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import SolarGlobeWidget from './components/SolarGlobeWidget.jsx'

export default function Layout() {
  return (
    <div className="flex h-screen bg-background overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar */}
        <aside className="w-56 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
            {/* Logo */}
            <div className="h-20 px-5 py-5 border-b border-sidebar-border">
            <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                    <Leaf size={14} className="text-primary-foreground" />
                </div>
                <div>
                    <p className="font-['Bitter',serif] font-bold text-foreground text-sm leading-tight">TechBiome</p>
                    <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Tech Ecosystem</p>
                </div>
                </div>
            </div>
            {/* Navigation */}
            <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
                <Link to="/" className="block rounded-md px-2 py-1 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">Dashboard</Link>
                <Link to="/logs" className="block rounded-md px-2 py-1 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">Logs</Link>
                <Link to="/settings" className="block rounded-md px-2 py-1 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">Settings</Link>
            </nav>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
            {/* Top bar */}
            <header className="h-20 shrink-0 border-b border-border bg-background/80 px-4 py-2 backdrop-blur-sm sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="font-['Bitter',serif] text-xl font-bold text-foreground">Welcome to TechBiome</h1>
                    <SolarGlobeWidget size={56} />
                </div>
            </header>
            <main className="min-w-0 flex-1 p-6">
                <Outlet />
            </main>
        </div>
    </div>
  )
}
