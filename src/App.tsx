import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminDashboard } from './pages/AdminDashboard.tsx';
import { OrderTrackingPage } from './pages/OrderTrackingPage.tsx';
import { StorefrontPage } from './pages/StorefrontPage.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StorefrontPage />} />
        <Route path="/track" element={<OrderTrackingPage />} />
        <Route path="/track/:orderNumber" element={<OrderTrackingPage />} />
        <Route path="/admin" element={<Navigate to="/admin/products" replace />} />
        <Route path="/admin/products" element={<AdminDashboard />} />
        <Route path="/admin/orders" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
