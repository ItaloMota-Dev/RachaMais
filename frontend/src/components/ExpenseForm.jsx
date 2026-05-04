import { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  DollarSign,
  FileText,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { createExpense, scanExpense } from '../services/api';

// ── Small helpers ─────────────────────────────────────────────────────────────

function Toast({ message, type = 'success', onClose }) {
  const styles = {
    success: 'bg-emerald-500 text-white',
    error: 'bg-rose-400 text-white',
  };
  const Icon = type === 'success' ? CheckCircle : XCircle;
  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg ${styles[type]}`}
    >
      <Icon size={18} />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        ×
      </button>
    </div>
  );
}

function ConfidenceBadge({ score }) {
  if (score == null) return null;
  const pct = Math.round(score * 100);
  const colorClass = pct >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      <AlertCircle size={12} />
      Confiança OCR: {pct}%
    </span>
  );
}

function SkeletonField() {
  return <div className="h-12 bg-slate-200 rounded-xl animate-pulse" />;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ExpenseForm({ groups = [], onSuccess }) {
  const fileInputRef = useRef(null);

  const [mode, setMode] = useState('manual'); // 'manual' | 'ocr'
  const [isScanning, setIsScanning] = useState(false);
  const [ocrConfidence, setOcrConfidence] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    group_id: '',
    paid_by_id: '',
    splits: [],
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Field change ──────────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ── OCR ───────────────────────────────────────────────────────────────────

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);

    // Scan
    setIsScanning(true);
    try {
      const result = await scanExpense(file);
      setOcrConfidence(result.confidence_score);
      setFormData((prev) => ({
        ...prev,
        amount: result.amount != null ? String(result.amount) : prev.amount,
        date: result.date
          ? result.date.split('T')[0]
          : prev.date,
      }));
      showToast('Dados extraídos com sucesso!', 'success');
    } catch {
      showToast('Falha ao processar imagem. Preencha manualmente.', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.group_id) {
      showToast('Preencha todos os campos obrigatórios.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await createExpense({
        ...formData,
        amount: parseFloat(formData.amount),
        group_id: parseInt(formData.group_id, 10),
        paid_by_id: parseInt(formData.paid_by_id, 10),
        date: new Date(formData.date).toISOString(),
      });
      showToast('Despesa salva com sucesso!', 'success');
      setFormData({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        group_id: '',
        paid_by_id: '',
        splits: [],
      });
      setImagePreview(null);
      setOcrConfidence(null);
      onSuccess?.();
    } catch {
      showToast('Erro ao salvar despesa.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-md mx-auto">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-colors ${
            mode === 'manual'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FileText size={16} />
          Manual
        </button>
        <button
          type="button"
          onClick={() => setMode('ocr')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-colors ${
            mode === 'ocr'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Camera size={16} />
          Inteligente (OCR)
        </button>
      </div>

      {/* OCR upload area */}
      {mode === 'ocr' && (
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-indigo-300 rounded-2xl p-6 flex flex-col items-center gap-3 text-indigo-500 hover:bg-indigo-50 transition-colors"
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-h-40 object-contain rounded-xl"
              />
            ) : (
              <>
                <Upload size={32} />
                <span className="text-sm font-medium">
                  Toque para fotografar ou selecionar cupom
                </span>
              </>
            )}
          </button>
          {ocrConfidence != null && (
            <div className="mt-2 flex justify-center">
              <ConfidenceBadge score={ocrConfidence} />
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Descrição *
          </label>
          {isScanning ? (
            <SkeletonField />
          ) : (
            <div className="relative">
              <FileText
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Ex: Jantar no restaurante"
                required
                className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Valor (R$) *
          </label>
          {isScanning ? (
            <SkeletonField />
          ) : (
            <div className="relative">
              <DollarSign
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0,00"
                step="0.01"
                min="0"
                required
                className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Data *
          </label>
          {isScanning ? (
            <SkeletonField />
          ) : (
            <div className="relative">
              <Calendar
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Group */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Grupo *
          </label>
          <div className="relative">
            <Users
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              name="group_id"
              value={formData.group_id}
              onChange={handleChange}
              required
              className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Selecione um grupo</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.category_icon} {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || isScanning}
          className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span className="animate-pulse">Salvando…</span>
          ) : (
            <>
              <CheckCircle size={18} />
              Salvar Despesa
            </>
          )}
        </button>
      </form>
    </div>
  );
}
