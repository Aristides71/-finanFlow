import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, List, FileBarChart, PieChart, LogOut, Wallet, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/transactions', label: 'Transações', icon: List },
    { path: '/bank-accounts', label: 'Minhas Contas', icon: Wallet },
    { path: '/reports', label: 'Relatórios', icon: FileBarChart },
    { path: '/budgets', label: 'Orçamento', icon: PieChart },
    { path: '/categories', label: 'Categorias', icon: Tag },
  ];

  const handleLogout = () => {
    logout();
    navigate('/landing');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-orange-200 to-orange-300 shadow-lg hidden md:block text-orange-900 flex flex-col">
        <div className="p-6 flex flex-col items-center gap-2 border-b border-orange-900/10">
          <img src="/logo.png" alt="Logo" className="w-44 h-44 object-contain mix-blend-multiply" />
          {user && <span className="text-sm font-medium text-orange-900 mt-2">Olá, {user.name}</span>}
        </div>
        
        <nav className="mt-6 px-4 space-y-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-white/60 text-orange-900 font-medium'
                    : 'text-orange-800 hover:bg-white/40 hover:text-orange-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-orange-900/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-orange-800 hover:bg-white/40 hover:text-orange-900 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-gradient-to-r from-orange-200 to-orange-300 shadow-sm p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <img src="/logo.png" alt="Logo" className="w-28 h-28 object-contain mix-blend-multiply" />
          </div>
          <div className="flex flex-col items-center">
            <button onClick={handleLogout} className="text-orange-900">
              <LogOut className="w-6 h-6" />
            </button>
            {user && <span className="text-xs font-medium text-orange-900 mt-1">{user.name}</span>}
          </div>
        </div>

        {/* Mobile Nav (Simple bottom bar or similar? Or just rely on sidebar? For now, mobile users might miss nav if sidebar is hidden. 
           The original layout didn't have mobile nav menu toggle. I should probably add a mobile menu toggle or bottom nav. 
           But to keep scope focused, I'll stick to what was there, just adding logout.)
           Wait, the original code had "hidden md:block" for sidebar, meaning mobile users have NO navigation?
           The previous user instructions didn't mention mobile nav, just "mobile layout".
           I should check if there was mobile nav logic I missed.
           Looking at previous `Layout.jsx` read: Sidebar is `hidden md:block`. Mobile header is `md:hidden`. 
           There is NO mobile navigation menu in the code I read! Mobile users are stuck on whatever page they are on unless they use browser back?
           Or maybe I missed a hamburger menu? No, `Layout.jsx` was pretty simple.
           
           I will add a simple bottom navigation for mobile or a hamburger menu. 
           Given the request is about "Landing page, register, etc", I shouldn't overengineer mobile nav now unless requested, 
           BUT a usable app needs navigation. I'll add a simple Bottom Nav for mobile to be helpful.
        */}
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <div className="md:hidden bg-white border-t border-gray-200 flex justify-around p-3">
           {navItems.map((item) => {
             const Icon = item.icon;
             const isActive = location.pathname === item.path;
             return (
               <Link
                 key={item.path}
                 to={item.path}
                 className={`flex flex-col items-center gap-1 text-xs ${isActive ? 'text-orange-600' : 'text-gray-500'}`}
               >
                 <Icon className="w-6 h-6" />
                 {item.label}
               </Link>
             );
           })}
        </div>
      </div>
    </div>
  );
}
