import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLogin from './pages/AdminLogin';
import AdminMobileLayout from './components/AdminMobileLayout';
import AdminDesktopLayout from './components/AdminDesktopLayout';
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
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 900);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
      case 'home': return <AdminHome onGoToSettings={() => setActiveTab('settings')} />;
      case 'orders': return <AdminOrders />;
      case 'menu': return <AdminMenu />;
      case 'tables': return <AdminTables />;
      case 'settings': return <AdminSettings />;
      default: return <AdminHome />;
    }
  };

  const Layout = isDesktop ? AdminDesktopLayout : AdminMobileLayout;
  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderTab()}
    </Layout>
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
