import { useEffect, useState } from 'react';
import { Activity, TrendingUp, Clock, BarChart3, ArrowRightLeft } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '../../lib/api';

// Composant pour les cartes statistiques (comme elles manquaient dans tes imports)
const StatCard = ({ title, value, trend, subtitle, icon }: any) => (
  <div className="glass-card p-5">
    <div className="flex items-center justify-between mb-3">
      <div className="text-emerald-primary">{icon}</div>
      <span className="text-xs font-mono text-ash uppercase">{title}</span>
    </div>
    <p className="text-3xl font-display text-bone">{value}</p>
    {(trend || subtitle) && (
      <p className={`text-xs mt-2 ${trend?.startsWith('+') ? 'text-emerald-primary' : 'text-ash'}`}>
        {trend || subtitle}
      </p>
    )}
  </div>
);

interface KPIs {
  simulations24h: number;
  simulations7j: number;
  simulations30j: number;
  totalTransactions: number;
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<any>({ simulations24h: 0, simulations30j: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [latestRates, setLatestRates] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpiRes, ratesRes] = await Promise.all([
          api.get('/kpis/'),
          api.get('/rates/history/'),
        ]);
        setKpis(kpiRes.data);
        
        // On s'assure que ratesRes.data est bien un tableau (s'il y a une pagination, ce sera ratesRes.data.results)
        const ratesList = Array.isArray(ratesRes.data) ? ratesRes.data : (ratesRes.data.results || []);
        
        const formattedData = ratesList
          .map((item: any) => {
            // Extraire correctement le taux MAD de l'objet rates (qui est en format JSON)
            let madRate = 0;
            if (item.rates && typeof item.rates === 'object') {
               madRate = item.rates.MAD || 0;
            } else if (typeof item.rates === 'string') {
               try {
                  // Remplacer les simples quotes par des doubles quotes si c'est une string Python
                  const jsonStr = item.rates.replace(/'/g, '"');
                  const parsedRates = JSON.parse(jsonStr);
                  madRate = parsedRates.MAD || 0;
               } catch (e) {
                  console.error('Erreur parsing rates:', e);
               }
            }
            
            return {
              date: new Date(item.date).toLocaleDateString('fr-FR', {
                month: 'short',
                day: 'numeric',
              }),
              MAD: Number(madRate) // S'assurer que c'est un nombre pour le graphique
            };
          })
          .filter((item) => item.MAD > 0) // <--- ICI : on supprime les jours où le MAD est à 0
          .reverse(); // Afficher du plus ancien au plus récent
        
        setChartData(formattedData);
        if (formattedData.length > 0) {
          setLatestRates(formattedData[formattedData.length - 1]);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };
    fetchData();
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Transactions aujourd'hui" value={kpis?.today_count?.toString() || kpis?.simulations24h?.toString() || '0'} trend="Simulations 24h" icon={<Activity size={20} />} />
        <StatCard title="Volume (EUR) 30j" value={`${kpis?.volume_30d?.toLocaleString('fr-FR') || kpis?.simulations30j?.toLocaleString('fr-FR') || '0'} €`} trend="Simulations 30j" icon={<ArrowRightLeft size={20} />} />
        <StatCard title="Taux EUR/XAF" value="655.957" subtitle="Fixe" icon={<ArrowRightLeft size={20} />} />
        <StatCard 
          title="Taux EUR/MAD" 
          value={latestRates?.MAD?.toFixed(4) || '...'} 
          subtitle="Dernier taux connu"
          icon={<ArrowRightLeft size={20} />} 
        />
      </div>

      <div className="glass-card p-6 mb-8">
        <h2 className="font-display text-xl text-bone mb-4">VARIATION EUR/MAD SUR 30 JOURS</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3A35" />
              <XAxis dataKey="date" stroke="#8BA8A4" fontSize={11} tickMargin={8} />
              <YAxis domain={['dataMin - 0.1', 'dataMax + 0.1']} stroke="#8BA8A4" fontSize={11} tickFormatter={(val) => val.toFixed(4)} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111F1C', border: '1px solid rgba(0, 181, 160, 0.2)', borderRadius: '12px', color: '#F4FFFE' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="MAD" 
                name="EUR/MAD" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                dot={{ r: 3, fill: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 5, fill: '#8B5CF6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
