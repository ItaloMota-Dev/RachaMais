import { TrendingUp, TrendingDown } from 'lucide-react';

export default function BalanceCard({ label, amount, type = 'neutral' }) {
  const isCredit = type === 'credit';
  const isDebit = type === 'debit';

  const colorClass = isCredit
    ? 'text-emerald-600'
    : isDebit
    ? 'text-rose-400'
    : 'text-slate-700';

  const bgClass = isCredit
    ? 'bg-emerald-50'
    : isDebit
    ? 'bg-rose-50'
    : 'bg-slate-50';

  const Icon = isCredit ? TrendingUp : isDebit ? TrendingDown : null;

  return (
    <div className={`rounded-2xl p-4 ${bgClass} flex flex-col gap-1`}>
      <div className="flex items-center gap-2">
        {Icon && <Icon size={16} className={colorClass} />}
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className={`text-2xl font-bold ${colorClass}`}>
        R${' '}
        {Math.abs(amount).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
    </div>
  );
}
