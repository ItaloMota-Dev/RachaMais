import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Key, Mail } from 'lucide-react';
import { getMe } from '../services/api';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => navigate('/login'));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-200 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      <h1 className="text-xl font-bold text-slate-800 mb-6">Perfil</h1>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-3 mb-8">
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.name}
            className="w-20 h-20 rounded-full object-cover ring-4 ring-indigo-100"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
            <User size={36} className="text-indigo-500" />
          </div>
        )}
        <div className="text-center">
          <p className="text-lg font-bold text-slate-800">{user.name}</p>
          <p className="text-sm text-slate-400">{user.email}</p>
        </div>
      </div>

      {/* Info cards */}
      <div className="space-y-3 mb-8">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
          <Mail size={18} className="text-indigo-400" />
          <div>
            <p className="text-xs text-slate-400">E-mail</p>
            <p className="text-sm font-medium text-slate-700">{user.email}</p>
          </div>
        </div>
        {user.pix_key && (
          <div className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
            <Key size={18} className="text-indigo-400" />
            <div>
              <p className="text-xs text-slate-400">Chave Pix</p>
              <p className="text-sm font-medium text-slate-700">{user.pix_key}</p>
            </div>
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-rose-200 text-rose-500 font-medium hover:bg-rose-50 transition-colors"
      >
        <LogOut size={18} />
        Sair
      </button>
    </div>
  );
}
