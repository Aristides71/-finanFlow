import React, { useState, useEffect } from 'react';
import { createTransaction, getBankAccounts, getCategories, createCategoryApi } from '../services/api';

export default function TransactionForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'EXPENSE',
    category: '',
    date: new Date().toISOString().split('T')[0],
    bankAccountId: ''
  });
  
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await getBankAccounts();
      setAccounts(response.data);
      // Set default account if exists
      if (response.data.length > 0) {
        setFormData(prev => ({ ...prev, bankAccountId: response.data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      const defaults = ["Alimentação","Transporte","Salário","Vendas","Contas"];
      const names = Array.from(new Set([...(res.data || []).map(c => c.name), ...defaults]));
      setCategories(names);
    } catch {}
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createTransaction(formData);
      setFormData({
        description: '',
        amount: '',
        type: 'EXPENSE',
        category: '',
        date: new Date().toISOString().split('T')[0],
        bankAccountId: accounts.length > 0 ? accounts[0].id : ''
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Erro ao salvar transação');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-700">Nova Transação</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Conta Bancária</label>
          <select
            name="bankAccountId"
            value={formData.bankAccountId}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
          >
            <option value="">Selecione uma conta (Opcional)</option>
            {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} ({acc.bankName})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Descrição</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Valor</label>
          <input
            type="number"
            step="0.01"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
          >
            <option value="INCOME">Receita</option>
            <option value="EXPENSE">Despesa</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Categoria</label>
          <input
            type="text"
            name="category"
            list="app-categories"
            value={formData.category}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
            placeholder="Ex: Alimentação, Vendas"
          />
          <datalist id="app-categories">
            {categories.map(name => (<option key={name} value={name} />))}
          </datalist>
          <div className="mt-2">
            <button
              type="button"
              onClick={async () => {
                if (formData.category && !categories.includes(formData.category)) {
                  await createCategoryApi(formData.category);
                  await fetchCategories();
                }
              }}
              className="text-xs text-indigo-600 hover:underline"
            >
              Adicionar categoria
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Data</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200"
      >
        Salvar
      </button>
    </form>
  );
}
