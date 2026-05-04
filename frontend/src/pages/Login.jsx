import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { login, register } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'login') {
        const { access_token } = await login(form.email, form.password);
        localStorage.setItem('token', access_token);
      } else {
        await register({ name: form.name, email: form.email, password: form.password });
        const { access_token } = await login(form.email, form.password);
        localStorage.setItem('token', access_token);
      }
      navigate('/');
    } catch (err) {
      const status = err?.response?.status;
      if (tab === 'register' && status === 400) {
        setError('Este e-mail já está cadastrado.');
      } else if (status === 401) {
        setError('E-mail ou senha inválidos.');
      } else {
        setError('Ocorreu um erro. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <span className="text-3xl">💸</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Racha+</h1>
        <p className="text-sm text-slate-400 mt-1">Divida despesas sem dor de cabeça</p>
      </div>

      <div className="bg-white w-full max-w-sm rounded-3xl shadow-sm border border-slate-100 p-6">
        {/* Tab toggle */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6">
          {['login', 'register'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              {t === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <input
              type="text"
              name="name"
              placeholder="Seu nome"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )}

          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              name="email"
              placeholder="E-mail"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showPw ? 'text' : 'password'}
              name="password"
              placeholder="Senha"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full pl-9 pr-10 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <p className="text-sm text-rose-500 font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors"
          >
            {loading ? 'Aguarde…' : tab === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  );
}
