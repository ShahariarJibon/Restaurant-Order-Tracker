import { Component, useState, useEffect } from 'react';
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
import CustomerPayment from './pages/CustomerPayment';
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
import AdminPayments from './pages/AdminPayments';
import AdminFeedback from './pages/AdminFeedback';
import AdminHistory from './pages/AdminHistory';
import AdminStaff from './pages/AdminStaff';
import AdminInventory from './pages/AdminInventory';
import StaffLogin from './pages/StaffLogin';
import ChefDisplay from './pages/ChefDisplay';
import WaiterDisplay from './pages/WaiterDisplay';
import ProFeaturePlaceholder from './pages/ProFeaturePlaceholder';
import {
  ScrollText, BarChart3, CreditCard, MessageSquare, Users, Package, Gift, FileText, Bot,
} from './components/Icons';

const PRO_TAB_ICONS = {
  history: ScrollText,
  analytics: BarChart3,
  payments: CreditCard,
  notifications: MessageSquare,
  staff: Users,
  inventory: Package,
  loyalty: Gift,
  billing: FileText,
  ai: Bot,
};

const PRO_TAB_INFO = {
  history: { name: 'History', desc: 'Order history with filters & export' },
  analytics: { name: 'Advanced Analytics', desc: 'Daily reports, best sellers, revenue trends' },
  payments: { name: 'Payments', desc: 'bKash, Nagad, card payments' },
  notifications: { name: 'Feedback', desc: 'Customer reviews & comments' },
  staff: { name: 'Staff Management', desc: 'Multiple accounts with roles' },
  inventory: { name: 'Inventory', desc: 'Track ingredients & stock' },
  loyalty: { name: 'Loyalty Program', desc: 'Points, coupons, promos' },
  billing: { name: 'Billing & Reports', desc: 'Invoices, tax reports, export' },
  ai: { name: 'AI Features', desc: 'Smart suggestions & predictions' },
};

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="admin-app" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 20, textAlign: 'center' }}>
          <h2 style={{ color: '#EF4444', marginBottom: 12 }}>Something went wrong</h2>
          <pre style={{ fontSize: 13, color: 'var(--gray-500)', maxWidth: '100%', overflow: 'auto', padding: 16, background: '#FEE2E2', borderRadius: 8, border: '1px solid #FECACA' }}>{this.state.error?.message || 'Unknown error'}</pre>
          <button onClick={() => { this.setState({ error: null }); window.location.reload(); }} style={{ marginTop: 16, padding: '12px 24px', borderRadius: 10, border: 'none', background: 'var(--orange)', color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Reload Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

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

  const renderProFeature = (key) => {
    const info = PRO_TAB_INFO[key];
    const Icon = PRO_TAB_ICONS[key];
    return <ProFeaturePlaceholder name={info?.name || key} desc={info?.desc || ''} Icon={Icon} />;
  };

  const PRO_TABS = ['payments', 'notifications', 'staff', 'inventory', 'loyalty', 'billing', 'ai'];

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <AdminHome onGoToSettings={() => setActiveTab('settings')} onGoToUpgrade={() => setActiveTab('upgrade')} />;
      case 'orders': return <AdminOrders />;
      case 'menu': return <AdminMenu />;
      case 'tables': return <AdminTables />;
      case 'history': return <AdminHistory />;
      case 'analytics': return <AdminAnalytics />;
      case 'payments': return <AdminPayments />;
      case 'notifications': return isPro ? <AdminFeedback /> : <AdminHome />;
      case 'staff': return isPro ? <AdminStaff /> : <AdminHome />;
      case 'inventory': return isPro ? <AdminInventory /> : <AdminHome />;
      case 'settings': return <AdminSettings onGoToUpgrade={() => setActiveTab('upgrade')} onNavigate={setActiveTab} />;
      case 'upgrade': return <UpgradeToPro onBack={() => setActiveTab('settings')} />;
      default: {
        if (isPro && PRO_TABS.includes(activeTab)) return renderProFeature(activeTab);
        return <AdminHome />;
      }
    }
  };

  const Layout = isDesktop ? AdminDesktopLayout : AdminMobileLayout;
  return (
    <ErrorBoundary>
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {renderTab()}
      </Layout>
    </ErrorBoundary>
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
        <Route path="/payment/:restaurantId" element={<CustomerPayment />} />
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
        <Route path="/staff-login" element={<StaffLogin />} />
        <Route path="/chef" element={<ChefDisplay />} />
        <Route path="/waiter" element={<WaiterDisplay />} />
        <Route path="/login/admin" element={<SuperAdminApp />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/" element={<ProtectedAdmin />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </AuthProvider>
  );
}
