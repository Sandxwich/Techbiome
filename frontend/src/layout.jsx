import { NavLink, Outlet } from 'react-router-dom'
import { Leaf, LayoutDashboard, ScrollText, Settings, Cpu, Wifi } from 'lucide-react'
import SolarGlobeWidget from './components/SolarGlobeWidget.jsx'
import { useDeviceCount } from './hooks/useDeviceCount.js'

const navItems = [
    { id: 'dashboard', label: 'Dashboard', to: '/', Icon: LayoutDashboard },
    { id: 'devices', label: 'Devices', to: '/devices', Icon: Cpu },
    { id: 'logs', label: 'Logs', to: '/logs', Icon: ScrollText },
    { id: 'settings', label: 'Settings', to: '/settings', Icon: Settings },
]

export default function Layout() {
    const { count, loading, error } = useDeviceCount()

  return (
    <div className="flex h-screen bg-background overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar */}
        <aside className="rounded-b-lg w-56 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
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
            <nav className="sidebar-nav-pattern flex flex-1 flex-col gap-1 px-3 py-4">
                {navItems.map((item) => (
                    <NavLink
                        key={item.id}
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) =>
                            [
                            'sidebar-nav-item flex items-center gap-2 rounded-md px-2 py-1 transition-colors',
                            isActive
                                ? 'bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-sidebar-ring'
                                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                            ].join(' ')
                        }
                        >
                        {({ isActive }) => (
                            <>
                                <item.Icon size={16} />
                                <span>{item.label}</span>
                                {isActive && (
                                    <span
                                        aria-hidden="true"
                                        className="ml-auto h-2 w-2 rounded-full bg-[rgb(127,244,241)] shadow-[0_0_10px_rgba(127,244,241,0.9)]"
                                    />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Status footer */}
            <div className="px-4 py-4 border-t border-sidebar-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Network</span>
                    <span className="flex items-center gap-1 text-primary"><Wifi size={11} /> Live</span>
                </div>
            </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
            {/* Top bar */}
            <header className="h-20 rounded-r-lg shrink-0 border-b border-border topbar/80 px-4 py-2 backdrop-blur-sm sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-xl font-bold text-foreground">Welcome to TechBiome</h1>
                    {/* Solar Globe Widget */}
                    <div className="flex h-full items-center gap-3 rounded-xl border border-border bg-card">
                        <SolarGlobeWidget size={50} count={count} loading={loading} error={error} />
                    </div>
                </div>
            </header>
            <main className="min-w-0 flex-1 p-6">
                <Outlet />
            </main>
        </div>
    </div>
  )
}
