import { ArrowRight, Smartphone, CreditCard, Wallet } from 'lucide-react';

interface CorridorCardProps {
  from: string;
  to: string;
  fromFlag: string;
  toFlag: string;
  currencyFrom: string;
  currencyTo: string;
  methods: string[];
}

const methodIcons: Record<string, { icon: React.ReactNode; label: string }> = {
  airtel: { icon: <Smartphone size={14} />, label: 'Airtel Money' },
  wave: { icon: <Smartphone size={14} />, label: 'Wave' },
  wafacash: { icon: <Wallet size={14} />, label: 'Wafacash' },
  paypal: { icon: <CreditCard size={14} />, label: 'PayPal' },
  bank: { icon: <CreditCard size={14} />, label: 'Virement bancaire' },
  momo: { icon: <Smartphone size={14} />, label: 'MTN MoMo' },
};

export default function CorridorCard({
  from,
  to,
  fromFlag,
  toFlag,
  currencyFrom,
  currencyTo,
  methods,
}: CorridorCardProps) {
  return (
    <div className="glass-card p-5 hover:border-emerald-primary/30 transition-all duration-300 group">
      {/* Direction */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{fromFlag}</span>
        <div className="flex items-center gap-2">
          <span className="font-display text-lg text-bone">{from}</span>
          <ArrowRight size={16} className="text-emerald-primary group-hover:translate-x-1 transition-transform" />
          <span className="font-display text-lg text-bone">{to}</span>
        </div>
        <span className="text-2xl">{toFlag}</span>
      </div>

      {/* Currencies */}
      <div className="mb-4">
        <span className="font-mono text-xs text-ash">
          {currencyFrom} → {currencyTo}
        </span>
      </div>

      {/* Methods */}
      <div className="flex flex-wrap gap-2">
        {methods.map((method) => {
          const m = methodIcons[method];
          if (!m) return null;
          return (
            <span
              key={method}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-dark-600 text-xs text-ash border border-dark-500"
            >
              <span className="text-emerald-primary">{m.icon}</span>
              {m.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
