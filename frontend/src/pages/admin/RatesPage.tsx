import { useEffect, useState } from 'react';
import { RefreshCw, Filter } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Button from '../../components/ui/Button';
import api from '../../lib/api';

interface RateEntry {
  id: number;
  pair: string;
  rate: number;
  source: string;
  createdAt: string;
}

interface RateChartPoint {
  date: string;
  EUR_XAF: number;
  EUR_XOF: number;
  EUR_MAD: number;
}

const pairs = ['EUR_XAF', 'EUR_XOF', 'EUR_MAD'];

export default function RatesPage() {
  const [history, setHistory] = useState<RateEntry[]>([]);
  const [chartData, setChartData] = useState<RateChartPoint[]>([]);
  const [filterPair, setFilterPair] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const [historyRes, chartRes] = await Promise.all([
        api.get('/admin/rates/'),
        api.get('/admin/rates/history/?days=30'),
      ]);
      setHistory(historyRes.data);
      setChartData(chartRes.data);
    } catch {
      // Fallback data
      const mockHistory: RateEntry[] = pairs.flatMap((pair, pi) =>
        Array.from({ length: 10 }, (_, i) => ({
          id: pi * 10 + i + 1,
          pair,
          rate: pair === 'EUR_MAD' ? 10.85 + Math.random() * 0.1 : 655.96,
          source: i % 2 === 0 ? 'ECB' : 'XE',
          createdAt: new Date(Date.now() - i * 3600000).toISOString(),
        }))
      );
      setHistory(mockHistory);
      setChartData(
        Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
          EUR_XAF: 655.96,
          EUR_XOF: 655.96,
          EUR_MAD: 10.8 + Math.random() * 0.2,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory =
    filterPair === 'all' ? history : history.filter((r) => r.pair === filterPair);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-bone">TAUX DE CHANGE</h1>
        <Button onClick={fetchRates} loading={loading} variant="secondary" size="sm">
          <RefreshCw size={16} className="mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Chart */}
      <div className="glass-card p-6 mb-8">
        <h2 className="font-display text-xl text-bone mb-4">VARIATION SUR 30 JOURS</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3A35" />
              <XAxis dataKey="date" stroke="#8BA8A4" fontSize={11} />
              <YAxis yAxisId="left" stroke="#8BA8A4" fontSize={11} domain={['auto', 'auto']} />
              <YAxis yAxisId="right" orientation="right" stroke="#8BA8A4" fontSize={11} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111F1C',
                  border: '1px solid rgba(0,181,160,0.2)',
                  borderRadius: '12px',
                  color: '#F4FFFE',
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="EUR_XAF"
                stroke="#00B5A0"
                strokeWidth={2}
                dot={false}
                name="EUR/XAF"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="EUR_XOF"
                stroke="#00D4BC"
                strokeWidth={2}
                dot={false}
                name="EUR/XOF"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="EUR_MAD"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={false}
                name="EUR/MAD"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* History table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-emerald-primary/10 flex items-center justify-between">
          <h2 className="font-display text-xl text-bone">HISTORIQUE</h2>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-ash" />
            <select
              value={filterPair}
              onChange={(e) => setFilterPair(e.target.value)}
              className="bg-dark-800 border border-dark-500 rounded-lg px-3 py-1.5 text-sm text-bone focus:outline-none focus:border-emerald-primary/50"
            >
              <option value="all">Toutes les paires</option>
              {pairs.map((p) => (
                <option key={p} value={p}>
                  {p.replace('_', '/')}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-600">
                <th className="px-6 py-3 text-left text-xs font-mono text-ash uppercase">Paire</th>
                <th className="px-6 py-3 text-left text-xs font-mono text-ash uppercase">Taux</th>
                <th className="px-6 py-3 text-left text-xs font-mono text-ash uppercase">Source</th>
                <th className="px-6 py-3 text-left text-xs font-mono text-ash uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.slice(0, 20).map((entry) => (
                <tr key={entry.id} className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors">
                  <td className="px-6 py-3 text-sm text-bone font-mono">
                    {entry.pair.replace('_', '/')}
                  </td>
                  <td className="px-6 py-3 text-sm text-emerald-primary font-mono">
                    {entry.rate.toFixed(4)}
                  </td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-dark-600 text-xs text-ash font-mono">
                      {entry.source}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-ash font-mono">
                    {new Date(entry.createdAt).toLocaleString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
