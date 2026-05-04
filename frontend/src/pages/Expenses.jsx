import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ExpenseForm from '../components/ExpenseForm';
import { getGroups, getExpensesByGroup } from '../services/api';
import { Receipt } from 'lucide-react';

export default function Expenses() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    getGroups().then(setGroups);
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      getExpensesByGroup(selectedGroup.id).then(setExpenses);
    }
  }, [selectedGroup]);

  const reload = () => {
    if (selectedGroup) {
      getExpensesByGroup(selectedGroup.id).then(setExpenses);
    }
    setShowForm(false);
  };

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-800">Despesas</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl"
        >
          {showForm ? 'Fechar' : '+ Nova'}
        </button>
      </div>

      {/* Group selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelectedGroup(g)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedGroup?.id === g.id
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {g.category_icon} {g.name}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="mb-6 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <ExpenseForm groups={groups} onSuccess={reload} />
        </div>
      )}

      {!selectedGroup ? (
        <p className="text-center text-slate-400 py-12">
          Selecione um grupo para ver as despesas.
        </p>
      ) : expenses.length === 0 ? (
        <p className="text-center text-slate-400 py-12">
          Nenhuma despesa neste grupo ainda.
        </p>
      ) : (
        <div className="space-y-3">
          {expenses.map((e) => (
            <div
              key={e.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Receipt size={18} className="text-indigo-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{e.description}</p>
                <p className="text-xs text-slate-400">
                  {new Date(e.date).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <p className="font-bold text-slate-800">
                R${' '}
                {e.amount.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
