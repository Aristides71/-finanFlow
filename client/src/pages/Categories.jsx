import React, { useEffect, useState } from 'react';
import { getCategories, createCategoryApi, updateCategoryApi, deleteCategoryApi } from '../services/api';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [editing, setEditing] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await getCategories();
      setCategories(res.data || []);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addCategory = async (e) => {
    e.preventDefault();
    const name = String(newCat || '').trim();
    if (!name) return;
    await createCategoryApi(name);
    setNewCat('');
    await load();
  };

  const saveEdit = async (id) => {
    const name = String(editing[id] || '').trim();
    if (!name) return;
    await updateCategoryApi(id, name);
    setEditing(prev => {
      const p = { ...prev };
      delete p[id];
      return p;
    });
    await load();
  };

  const remove = async (id) => {
    if (!window.confirm('Excluir esta categoria?')) return;
    await deleteCategoryApi(id);
    await load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Gerenciar Categorias</h1>

      <form onSubmit={addCategory} className="flex gap-2 items-end bg-white p-4 rounded-lg shadow">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Nova Categoria</label>
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
            placeholder="Ex: Escritório"
          />
        </div>
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Adicionar</button>
      </form>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && (
              <tr><td className="px-6 py-4 text-sm text-gray-500">Carregando...</td><td></td></tr>
            )}
            {!loading && categories.map(cat => (
              <tr key={cat.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {editing[cat.id] !== undefined ? (
                    <input
                      value={editing[cat.id]}
                      onChange={(e) => setEditing(prev => ({ ...prev, [cat.id]: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  ) : (
                    cat.name
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  {editing[cat.id] !== undefined ? (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => saveEdit(cat.id)} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Salvar</button>
                      <button onClick={() => setEditing(prev => { const p = { ...prev }; delete p[cat.id]; return p; })} className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300">Cancelar</button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditing(prev => ({ ...prev, [cat.id]: cat.name }))} className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700">Renomear</button>
                      <button onClick={() => remove(cat.id)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Excluir</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!loading && categories.length === 0 && (
              <tr><td className="px-6 py-4 text-sm text-gray-500">Nenhuma categoria cadastrada.</td><td></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
