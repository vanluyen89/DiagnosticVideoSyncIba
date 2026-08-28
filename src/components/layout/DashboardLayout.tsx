import { Outlet, useLocation } from 'react-router-dom';
import { Toolbar } from '@/components/layout/Toolbar';
import { Timeline } from '@/components/layout/Timeline';

export function DashboardLayout() {
  const { pathname } = useLocation();

  return (
    <div className="bg-surface-950 flex h-full flex-col overflow-hidden">
      <Toolbar />
      <Outlet />
      {pathname === '/overview' && <Timeline />}
    </div>
  );
}
