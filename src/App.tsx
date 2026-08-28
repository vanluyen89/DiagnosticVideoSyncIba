import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { ManualPage } from '@/pages/ManualPage';
import { HomePage } from '@/pages/HomePage';
import { CoffeePopup } from '@/components/CoffeePopup';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route index element={<HomePage />} />
          <Route path="overview" element={<DashboardPage />} />
          <Route path="manual" element={<ManualPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <CoffeePopup />
    </BrowserRouter>
  );
}
