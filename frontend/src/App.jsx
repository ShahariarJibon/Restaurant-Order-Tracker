import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLogin from './pages/AdminLogin';
import AdminMobileLayout from './components/AdminMobileLayout';
import AdminHome from './pages/AdminHome';
import AdminOrders from './pages/AdminOrders';
import AdminMenu from './pages/AdminMenu';
import AdminTables from './pages/AdminTables';
import AdminSettings from './pages/AdminSettings';
import CustomerMenu from './pages/CustomerMenu';
import OrderConfirmation from './pages/OrderConfirmation';

function ProtectedAdmin() {
  const { restaurant, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('home');

  if (loading) {
    return (
      <div className="admin-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--gray-500)' }}>Loading...</p>
      </div>
    );
  }

  if (!restaurant) return <Navigate to="/admin/login" />;

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <AdminHome />;
      case 'orders': return <AdminOrders />;
      case 'menu': return <AdminMenu />;
      case 'tables': return <AdminTables />;
      case 'settings': return <AdminSettings />;
      default: return <AdminHome />;
    }
  };

  return (
    <AdminMobileLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderTab()}
    </AdminMobileLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/menu/:restaurantId" element={<CustomerMenu />} />
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedAdmin />} />
        <Route path="*" element={<Navigate to="/admin" />} />
      </Routes>
    </AuthProvider>
  );
}
