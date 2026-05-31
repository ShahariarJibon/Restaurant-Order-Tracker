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
import SuperAdminLogin from './pages/SuperAdminLogin';
import SuperAdminLayout from './components/SuperAdminLayout';
import SuperAdminOverview from './pages/SuperAdminOverview';
import SuperAdminRestaurants from './pages/SuperAdminRestaurants';
import SuperAdminPayments from './pages/SuperAdminPayments';
import SuperAdminSubscriptions from './pages/SuperAdminSubscriptions';
import SuperAdminReports from './pages/SuperAdminReports';
import SuperAdminSettings from './pages/SuperAdminSettings';
import UpgradeToPro from './pages/UpgradeToPro';
import AdminAnalytics from './pages/AdminAnalytics';

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

  if (!restaurant) return <Navigate to="/login" />;

  const isPro = restaurant?.plan === 'pro';

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <AdminHome onGoToSettings={() => setActiveTab('settings')} onGoToUpgrade={() => setActiveTab('upgrade')} />;
      case 'orders': return <AdminOrders />;
      case 'menu': return <AdminMenu />;
      case 'tables': return <AdminTables />;
      case 'history': return <AdminOrders />;
      case 'analytics': return <AdminAnalytics />;
      case 'settings': return <AdminSettings onGoToUpgrade={() => setActiveTab('upgrade')} />;
      case 'upgrade': return <UpgradeToPro onBack={() => setActiveTab('settings')} />;
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

function SuperAdminApp() {
  const [token, setToken] = useState(localStorage.getItem('super_token'));
  const [activeTab, setActiveTab] = useState('overview');

  if (!token) {
    return <SuperAdminLogin onLogin={(t) => setToken(t)} />;
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'overview': return <SuperAdminOverview />;
      case 'restaurants': return <SuperAdminRestaurants />;
      case 'payments': return <SuperAdminPayments />;
      case 'subscriptions': return <SuperAdminSubscriptions />;
      case 'reports': return <SuperAdminReports />;
      case 'settings': return <SuperAdminSettings />;
      default: return <SuperAdminOverview />;
    }
  };

  return (
    <SuperAdminLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={() => { localStorage.removeItem('super_token'); setToken(null); }}
    >
      {renderPage()}
    </SuperAdminLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/menu/:restaurantId" element={<CustomerMenu />} />
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
        <Route path="/login/admin" element={<SuperAdminApp />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/" element={<ProtectedAdmin />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </AuthProvider>
  );
}
