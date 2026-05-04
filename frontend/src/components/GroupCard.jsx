import { Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GroupCard({ group }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/groups/${group.id}`)}
      className="w-full flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow text-left"
    >
      <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-2xl">
        {group.category_icon || '🏠'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 truncate">{group.name}</p>
        <p className="text-sm text-slate-400 flex items-center gap-1 mt-0.5">
          <Users size={13} />
          Grupo
        </p>
      </div>
      <span className="text-slate-300 text-lg">›</span>
    </button>
  );
}
