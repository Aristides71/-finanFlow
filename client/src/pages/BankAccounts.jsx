import React, { useState, useEffect } from 'react';
import { getBankAccounts, createBankAccount, deleteBankAccount } from '../services/api';
import { Plus, Trash2, CreditCard, Wallet, TrendingUp, Building2 } from 'lucide-react';

export default function BankAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'CHECKING',
    bankName: '',
    initialBalance: '',
    color: '#f97316'
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await getBankAccounts();
      setAccounts(response.data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createBankAccount(formData);
      setShowModal(false);
      setFormData({ name: '', type: 'CHECKING', bankName: '', initialBalance: '', color: '#f97316' });
      fetchAccounts();
    } catch (error) {
      console.error('Error creating account:', error);
      alert('Erro ao criar conta');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza? Isso apagará todas as transações associadas a esta conta.')) {
      try {
        await deleteBankAccount(id);
        fetchAccounts();
      } catch (error) {
        console.error('Error deleting account:', error);
      }
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'CHECKING': return <CreditCard className="w-6 h-6" />;
      case 'SAVINGS': return <Wallet className="w-6 h-6" />;
      case 'INVESTMENT': return <TrendingUp className="w-6 h-6" />;
      default: return <Building2 className="w-6 h-6" />;
    }
  };

  const getTypeLabel = (type) => {
     const types = {
         'CHECKING': 'Conta Corrente',
         'SAVINGS': 'Poupança',
         'INVESTMENT': 'Investimento',
         'CASH': 'Dinheiro',
         'OTHER': 'Outros'
     };
     return types[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Minhas Contas</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600 transition"
        >
          <Plus className="w-5 h-5" /> Nova Conta
        </button>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <div key={account.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition">
              <div className="h-2" style={{ backgroundColor: account.color || '#f97316' }}></div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-600">
                    {getIcon(account.type)}
                  </div>
                  <button onClick={() => handleDelete(account.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                <h3 className="text-lg font-bold text-gray-800 mb-1">{account.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{account.bankName} • {getTypeLabel(account.type)}</p>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Saldo Atual</p>
                  <p className={`text-2xl font-bold ${account.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.currentBalance)}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {accounts.length === 0 && (
            <div className="col-span-full text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500">Nenhuma conta cadastrada.</p>
              <button onClick={() => setShowModal(true)} className="text-orange-600 font-medium mt-2 hover:underline">
                Cadastre sua primeira conta
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Nova Conta Bancária</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Conta</label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="Ex: Conta Principal"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
                    <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="Ex: Nubank"
                    value={formData.bankName}
                    onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                    <option value="CHECKING">Corrente</option>
                    <option value="SAVINGS">Poupança</option>
                    <option value="INVESTMENT">Investimento</option>
                    <option value="CASH">Dinheiro</option>
                    <option value="OTHER">Outros</option>
                    </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Inicial</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="0.00"
                  value={formData.initialBalance}
                  onChange={(e) => setFormData({...formData, initialBalance: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cor de Identificação</label>
                <div className="flex gap-2">
                    {['#f97316', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#64748b'].map(color => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => setFormData({...formData, color})}
                            className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? 'border-gray-800' : 'border-transparent'}`}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
