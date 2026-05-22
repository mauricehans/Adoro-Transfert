import { useEffect, useState } from 'react';
import { Activity, TrendingUp, Clock, BarChart3 } from 'lucide-react';
import api from '../../lib/api';

interface KPIs {
  simulations24h: number;
  simulations7j: number;
  simulations30j: number;
  totalTransactions: number;
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIs>({
    simulations24h: 0,
    simulations7j: 0,
    simulations30j: 0,
    totalTransactions: 0,
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const kpisRes = await api.get('/kpis/');
        setKpis(kpisRes.data);
      } catch {
        // Use fallback data for now if endpoints are missing
        setKpis({ simulations24h: 0, simulations7j: 0, simulations30j: 0, totalTransactions: 0 });
      }
    };
    fetchDashboard();
  }, []);

  const kpiCards = [
    { label: 'Simulations (24h)', value: kpis.simulations24h, icon: Activity, color: 'text-emerald-primary' },
    { label: 'Simulations (7j)', value: kpis.simulations7j, icon: TrendingUp, color: 'text-emerald-light' },
    { label: 'Simulations (30j)', value: kpis.simulations30j, icon: Clock, color: 'text-blue-400' },
    { label: 'Transactions totales', value: kpis.totalTransactions, icon: BarChart3, color: 'text-purple-400' },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl text-bone mb-8">DASHBOARD</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((card, i) => (
          <div key={i} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <card.icon size={20} className={card.color} />
              <span className="text-xs font-mono text-ash uppercase">{card.label}</span>
            </div>
            <p className="text-3xl font-display text-bone">{card.value.toLocaleString('fr-FR')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
