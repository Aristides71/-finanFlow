import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, PieChart, Smartphone, FileText, BarChart2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col">
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-20 w-auto object-contain mix-blend-multiply" />
        </div>
        <div className="space-x-4">
          <Link to="/login" className="text-gray-700 hover:text-blue-600 font-medium">Login</Link>
          <Link to="/register" className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition shadow-lg">Teste Grátis</Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center text-center p-6 max-w-6xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 leading-tight">
          Finance Manager
        </h1>
        <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-2xl">
          Controle total de receitas e despesas, relatórios profissionais em PDF e orçamento por categoria. Simples, rápido e seguro.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <Link to="/register" className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-blue-700 transition shadow-xl">Criar Conta</Link>
          <Link to="/login" className="bg-white text-gray-700 px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-50 transition shadow-md border border-gray-200">Entrar</Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 w-full">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <PieChart className="w-10 h-10 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Dashboard Moderno</h3>
            <p className="text-gray-600">Visão rápida do saldo, receitas e despesas por período.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <FileText className="w-10 h-10 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Relatórios em PDF</h3>
            <p className="text-gray-600">Exportação com logo discreta, totais e saldo final.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <BarChart2 className="w-10 h-10 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Orçamento por Categoria</h3>
            <p className="text-gray-600">Defina valores planejados e acompanhe o consumo.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <Smartphone className="w-10 h-10 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Responsivo</h3>
            <p className="text-gray-600">Acesso perfeito no celular, tablet e desktop.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <Shield className="w-10 h-10 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Seguro</h3>
            <p className="text-gray-600">Autenticação com token e proteção dos dados.</p>
          </div>
        </div>
      </main>

      <footer className="p-6 text-center text-gray-500 text-sm">
        © 2026 Finance Manager. Todos os direitos reservados.
      </footer>
    </div>
  );
}
