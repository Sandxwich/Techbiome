import { Link, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="flex gap-6 border-b border-border bg-sidebar px-4 py-4 text-sidebar-foreground">
        <Link to="/" className="rounded-md px-2 py-1 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">Dashboard</Link>
        <Link to="/logs" className="rounded-md px-2 py-1 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">Logs</Link>
        <Link to="/settings" className="rounded-md px-2 py-1 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">Settings</Link>
      </nav>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}
