import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, PieChart, Shield, Smartphone } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex flex-col">
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
           <img src="/logo.png" alt="Logo" className="w-24 h-24 md:w-36 md:h-36 object-contain" />
        </div>
        <div className="space-x-4">
          <Link to="/login" className="text-gray-600 hover:text-orange-600 font-medium">Login</Link>
          <Link to="/register" className="bg-orange-500 text-white px-6 py-2 rounded-full hover:bg-orange-600 transition shadow-lg">
            Teste Grátis
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center p-6 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
          Gerencie suas finanças com <span className="text-orange-500">Inteligência</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl">
          A solução completa para PMEs e Pessoas Físicas. Controle receitas, despesas e gere relatórios detalhados em segundos.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link to="/register" className="bg-orange-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-orange-700 transition shadow-xl flex items-center justify-center gap-2">
            Começar Teste de 3 Dias <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/login" className="bg-white text-gray-700 px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-50 transition shadow-md border border-gray-200">
            Já tenho conta
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-left w-full">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <PieChart className="w-10 h-10 text-orange-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Relatórios Completos</h3>
            <p className="text-gray-600">Exporte demonstrativos em PDF estilo Livro Caixa e acompanhe gráficos interativos.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <Smartphone className="w-10 h-10 text-green-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Acesso Mobile</h3>
            <p className="text-gray-600">Design responsivo para você controlar suas finanças de onde estiver.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <Shield className="w-10 h-10 text-blue-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Segurança Total</h3>
            <p className="text-gray-600">Seus dados protegidos e acessíveis apenas por você.</p>
          </div>
        </div>
      </main>

      <footer className="p-6 text-center text-gray-500 text-sm">
        © 2026 Finance Manager. Todos os direitos reservados.
      </footer>
    </div>
  );
}
