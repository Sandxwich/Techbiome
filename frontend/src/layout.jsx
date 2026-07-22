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
            {/* App shell: fixed sidebar plus routed content area. */}
        <aside className="rounded-b-lg w-56 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
            {/* Brand block doubles as a visual anchor for the navigation. */}
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

            {/* Route navigation keeps the selected page highlighted. */}
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

            {/* Small footer status line for quick at-a-glance connectivity context. */}
            <div className="px-4 py-4 border-t border-sidebar-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Network</span>
                    <span className="flex items-center gap-1 text-primary"><Wifi size={11} /> Live</span>
                </div>
            </div>
        </aside>

        {/* The routed page content renders here. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Top bar combines page title and the live device count widget. */}
            <header className="app-topbar h-20 rounded-r-lg shrink-0 border-b border-border px-4 py-2 backdrop-blur-sm sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-xl font-bold text-foreground">Welcome to TechBiome</h1>
                    {/* This widget surfaces the current device count and loading state. */}
                    <div className="elevated-card flex h-full items-center gap-3 rounded-xl border border-border bg-card">
                        <SolarGlobeWidget size={50} count={count} loading={loading} error={error} />
                    </div>
                </div>
            </header>
            <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6">
                <Outlet />
            </main>
        </div>
    </div>
  )
}
