import { Link, Route, Routes } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { ServersPage } from './pages/ServersPage';

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[--color-border] bg-[--color-surface]">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-8 px-4">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            MultiServerKit
          </Link>
          <nav className="flex gap-4 text-sm text-[--color-muted]">
            <Link to="/" className="hover:text-[--color-foreground]">
              Dashboard
            </Link>
            <Link to="/servers" className="hover:text-[--color-foreground]">
              Servers
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/servers" element={<ServersPage />} />
        </Routes>
      </main>
    </div>
  );
}
