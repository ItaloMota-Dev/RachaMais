import { useEffect, useState } from 'react';
import { PlusCircle, X } from 'lucide-react';
import GroupCard from '../components/GroupCard';
import { getGroups, createGroup } from '../services/api';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', category_icon: '🏠' });

  const load = () => {
    getGroups()
      .then(setGroups)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await createGroup(newGroup);
    setNewGroup({ name: '', category_icon: '🏠' });
    setShowForm(false);
    load();
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-200 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800">Grupos</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl"
        >
          <PlusCircle size={16} />
          Novo
        </button>
      </div>

      {/* New group modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Novo Grupo</h2>
              <button onClick={() => setShowForm(false)}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <input
                type="text"
                placeholder="Nome do grupo"
                required
                value={newGroup.name}
                onChange={(e) => setNewGroup((p) => ({ ...p, name: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Emoji / ícone (ex: 🍕)"
                value={newGroup.category_icon}
                onChange={(e) =>
                  setNewGroup((p) => ({ ...p, category_icon: e.target.value }))
                }
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl"
              >
                Criar Grupo
              </button>
            </form>
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <p className="text-center text-slate-400 py-12">
          Nenhum grupo ainda. Crie o primeiro!
        </p>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} />
          ))}
        </div>
      )}
    </div>
  );
}
