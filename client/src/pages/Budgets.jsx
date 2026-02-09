import React, { useEffect, useState } from 'react';
import { getBudgets, createBudget, getBudgetProgress } from '../services/api';
import { Plus, BarChart2 } from 'lucide-react';

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    items: [{ category: '', allocatedAmount: '' }],
  });

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      const res = await getBudgets();
      setBudgets(res.data);
    } catch (err) {}
  };

  const onFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onItemChange = (index, field, value) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    setForm({ ...form, items });
  };

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { category: '', allocatedAmount: '' }] });
  };

  const removeItem = (index) => {
    const items = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items });
  };

  const submitBudget = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate,
        items: form.items.map(i => ({ category: i.category, allocatedAmount: parseFloat(i.allocatedAmount || 0) })),
      };
      await createBudget(data);
      setForm({
        name: '',
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
        items: [{ category: '', allocatedAmount: '' }],
      });
      await loadBudgets();
    } catch (err) {} finally {
      setLoading(false);
    }
  };

  const viewProgress = async (id) => {
    setSelectedBudgetId(id);
    setProgress(null);
    try {
      const res = await getBudgetProgress(id);
      setProgress(res.data);
    } catch (err) {}
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Criar Orçamento</h2>
        <form onSubmit={submitBudget} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input name="name" value={form.name} onChange={onFormChange} className="w-full p-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
              <input type="date" name="startDate" value={form.startDate} onChange={onFormChange} className="w-full p-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
              <input type="date" name="endDate" value={form.endDate} onChange={onFormChange} className="w-full p-2 border border-gray-300 rounded-lg" required />
            </div>
          </div>

          <div className="space-y-3">
            {form.items.map((item, idx) => (
              <div key={idx} className="grid md:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <input value={item.category} onChange={(e) => onItemChange(idx, 'category', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" placeholder="Ex: Alimentação" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Planejado</label>
                  <input type="number" step="0.01" value={item.allocatedAmount} onChange={(e) => onItemChange(idx, 'allocatedAmount', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" placeholder="Ex: 500.00" required />
                </div>
                <button type="button" onClick={() => removeItem(idx)} className="bg-red-100 text-red-600 px-3 py-2 rounded-lg hover:bg-red-200">Remover</button>
              </div>
            ))}
            <button type="button" onClick={addItem} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">
              <Plus className="w-4 h-4" /> Adicionar Item
            </button>
          </div>

          <button type="submit" disabled={loading} className="bg-orange-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-700 transition">
            {loading ? 'Salvando...' : 'Salvar Orçamento'}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Meus Orçamentos</h2>
        <div className="space-y-3">
          {budgets.map(b => (
            <div key={b.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold text-gray-800">{b.name}</div>
                  <div className="text-sm text-gray-500">{new Date(b.startDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} — {new Date(b.endDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</div>
                </div>
                <button onClick={() => viewProgress(b.id)} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">
                  <BarChart2 className="w-4 h-4" /> Progresso
                </button>
              </div>
              <div className="mt-3 text-sm text-gray-600">Itens: {b.items.length}</div>
              {selectedBudgetId === b.id && progress && (
                <div className="mt-4 space-y-3">
                  {progress.progress.map(p => (
                    <div key={p.itemId}>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{p.category}</span>
                        <span>
                          R$ {p.spent.toFixed(2)} de R$ {p.allocatedAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-3 rounded-full ${p.percent >= 100 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${p.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {budgets.length === 0 && <div className="text-gray-500">Nenhum orçamento criado.</div>}
        </div>
      </div>
    </div>
  );
}
