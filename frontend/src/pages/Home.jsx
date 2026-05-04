import { useEffect, useState } from 'react';
import { PlusCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BalanceCard from '../components/BalanceCard';
import GroupCard from '../components/GroupCard';
import { getGroups, getMe } from '../services/api';

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMe(), getGroups()])
      .then(([me, grps]) => {
        setUser(me);
        setGroups(grps);
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [navigate]);

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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-slate-500">Olá,</p>
          <h1 className="text-xl font-bold text-slate-800">
            {user?.name ?? 'usuário'} 👋
          </h1>
        </div>
        <button
          onClick={() => navigate('/expenses/new')}
          className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl"
        >
          <PlusCircle size={16} />
          Nova despesa
        </button>
      </div>

      {/* Balance summary (placeholder) */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <BalanceCard label="A receber" amount={0} type="credit" />
        <BalanceCard label="A pagar" amount={0} type="debit" />
      </div>

      {/* Groups */}
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
        Seus grupos
      </h2>
      {groups.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="mb-2">Nenhum grupo ainda.</p>
          <button
            onClick={() => navigate('/groups')}
            className="text-indigo-600 font-medium text-sm"
          >
            Criar grupo →
          </button>
        </div>
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
