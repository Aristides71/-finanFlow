import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import BankAccounts from './pages/BankAccounts';
import Budgets from './pages/Budgets';
import Categories from './pages/Categories';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  
  if (!user) return <Navigate to="/landing" />;
  
  // Bypass expiration check for specific testing email
  if (user.subscriptionStatus === 'EXPIRED' && user.email !== 'agomes.bel71@gmail.com') {
      return (
          <div className="flex items-center justify-center min-h-screen bg-blue-50 flex-col gap-4 p-4 text-center">
              <h1 className="text-2xl font-bold text-red-600">Período de Teste Expirado</h1>
              <p className="text-gray-700">Seu período de teste de 3 dias acabou.</p>
              <p className="text-gray-600">Por favor, entre em contato para atualizar sua assinatura e continuar usando o Finance Manager.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Tentar novamente
              </button>
          </div>
      )
  }

  return <Layout>{children}</Layout>;
};

const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (user) return <Navigate to="/" />;
    return children;
}

function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Layout><Dashboard /></Layout>;
  return <Home />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/landing" element={<PublicRoute><Landing /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          
          <Route path="/" element={<RootRoute />} />
          <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/bank-accounts" element={<ProtectedRoute><BankAccounts /></ProtectedRoute>} />
          <Route path="/budgets" element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/landing" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
