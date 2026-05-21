import { useEffect, useState } from 'react';
import { Download, Filter, Eye, RefreshCw } from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import api from '../../lib/api';

interface Transaction {
  id: number;
  corridor: string;
  amountSent: number;
  currencySent: string;
  amountReceived: number;
  currencyReceived: string;
  adoroFee: number;
  airtelFee: number;
  rate: number;
  beneficiaryName: string;
  beneficiaryPhone: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}

const corridorLabels: Record<string, string> = {
  FR_GA: 'FR → GA',
  GA_FR: 'GA → FR',
  FR_CM: 'FR → CM',
  CM_FR: 'CM → FR',
  FR_SN: 'FR → SN',
  SN_FR: 'SN → FR',
  FR_MA: 'FR → MA',
  MA_FR: 'MA → FR',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400',
  confirmed: 'bg-blue-500/10 text-blue-400',
  completed: 'bg-emerald-primary/10 text-emerald-primary',
  cancelled: 'bg-red-500/10 text-red-400',
};

const statusLabels: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirme',
  completed: 'Termine',
  cancelled: 'Annule',
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterCorridor, setFilterCorridor] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/transactions/');
      setTransactions(data);
    } catch {
      // Fallback mock data
      setTransactions(
        Array.from({ length: 15 }, (_, i) => ({
          id: i + 1,
          corridor: ['FR_GA', 'GA_FR', 'FR_CM', 'FR_SN', 'FR_MA'][i % 5],
          amountSent: Math.round(50 + Math.random() * 950),
          currencySent: i % 5 === 1 ? 'XAF' : 'EUR',
          amountReceived: Math.round((50 + Math.random() * 950) * 655),
          currencyReceived: i % 5 === 1 ? 'EUR' : 'XAF',
          adoroFee: Math.round(5 + Math.random() * 15),
          airtelFee: i % 3 === 0 ? 2500 : 0,
          rate: 655.96,
          beneficiaryName: ['Jean Dupont', 'Marie Obame', 'Paul Nze', 'Fatou Diallo', 'Ahmed Benali'][i % 5],
          beneficiaryPhone: '+241 74 XX XX XX',
          status: (['pending', 'confirmed', 'completed', 'cancelled'] as const)[i % 4],
          createdAt: new Date(Date.now() - i * 3600000 * 6).toISOString(),
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/admin/transactions/${id}/`, { status });
      setTransactions((prev) =>
        prev.map((tx) => (tx.id === id ? { ...tx, status: status as Transaction['status'] } : tx))
      );
      setSelectedTx(null);
    } catch {
      // handle error silently
    }
  };

  const exportCSV = () => {
    const headers = 'ID,Corridor,Montant,Devise,Beneficiaire,Statut,Date\n';
    const rows = filteredTransactions
      .map(
        (tx) =>
          `${tx.id},${tx.corridor},${tx.amountSent},${tx.currencySent},${tx.beneficiaryName},${tx.status},${tx.createdAt}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filterCorridor !== 'all' && tx.corridor !== filterCorridor) return false;
    if (filterStatus !== 'all' && tx.status !== filterStatus) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-bone">TRANSACTIONS</h1>
        <div className="flex items-center gap-3">
          <Button onClick={exportCSV} variant="secondary" size="sm">
            <Download size={16} className="mr-2" />
            Export CSV
          </Button>
          <Button onClick={fetchTransactions} variant="secondary" size="sm" loading={loading}>
            <RefreshCw size={16} className="mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Filter size={16} className="text-ash" />
        <select
          value={filterCorridor}
          onChange={(e) => setFilterCorridor(e.target.value)}
          className="bg-dark-800 border border-dark-500 rounded-lg px-3 py-1.5 text-sm text-bone focus:outline-none focus:border-emerald-primary/50"
        >
          <option value="all">Tous les corridors</option>
          {Object.entries(corridorLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-dark-800 border border-dark-500 rounded-lg px-3 py-1.5 text-sm text-bone focus:outline-none focus:border-emerald-primary/50"
        >
          <option value="all">Tous les statuts</option>
          {Object.entries(statusLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <span className="text-xs text-ash font-mono ml-auto">
          {filteredTransactions.length} resultat(s)
        </span>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-600">
                <th className="px-4 py-3 text-left text-xs font-mono text-ash uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-mono text-ash uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-mono text-ash uppercase">Corridor</th>
                <th className="px-4 py-3 text-left text-xs font-mono text-ash uppercase">Montant</th>
                <th className="px-4 py-3 text-left text-xs font-mono text-ash uppercase">Beneficiaire</th>
                <th className="px-4 py-3 text-left text-xs font-mono text-ash uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-mono text-ash uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-ash font-mono">#{tx.id}</td>
                  <td className="px-4 py-3 text-sm text-ash font-mono">
                    {new Date(tx.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-sm text-bone font-mono">
                    {corridorLabels[tx.corridor] || tx.corridor}
                  </td>
                  <td className="px-4 py-3 text-sm text-emerald-primary font-mono">
                    {tx.amountSent.toLocaleString('fr-FR')} {tx.currencySent}
                  </td>
                  <td className="px-4 py-3 text-sm text-bone">{tx.beneficiaryName}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono ${statusColors[tx.status]}`}>
                      {statusLabels[tx.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedTx(tx)}
                      className="p-1.5 rounded-lg text-ash hover:text-bone hover:bg-dark-600 transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        title={`Transaction #${selectedTx?.id}`}
        size="lg"
      >
        {selectedTx && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-ash">Corridor:</span>
                <p className="text-bone font-mono">{corridorLabels[selectedTx.corridor]}</p>
              </div>
              <div>
                <span className="text-ash">Date:</span>
                <p className="text-bone font-mono">{new Date(selectedTx.createdAt).toLocaleString('fr-FR')}</p>
              </div>
              <div>
                <span className="text-ash">Montant envoye:</span>
                <p className="text-bone font-mono">{selectedTx.amountSent.toLocaleString('fr-FR')} {selectedTx.currencySent}</p>
              </div>
              <div>
                <span className="text-ash">Montant recu:</span>
                <p className="text-emerald-primary font-mono">{selectedTx.amountReceived.toLocaleString('fr-FR')} {selectedTx.currencyReceived}</p>
              </div>
              <div>
                <span className="text-ash">Frais Adoro:</span>
                <p className="text-bone font-mono">{selectedTx.adoroFee} {selectedTx.currencySent}</p>
              </div>
              <div>
                <span className="text-ash">Frais Airtel:</span>
                <p className="text-bone font-mono">{selectedTx.airtelFee} {selectedTx.currencyReceived}</p>
              </div>
              <div>
                <span className="text-ash">Taux:</span>
                <p className="text-bone font-mono">{selectedTx.rate}</p>
              </div>
              <div>
                <span className="text-ash">Beneficiaire:</span>
                <p className="text-bone">{selectedTx.beneficiaryName}</p>
                <p className="text-ash text-xs">{selectedTx.beneficiaryPhone}</p>
              </div>
            </div>

            {/* Status update */}
            <div className="border-t border-dark-600 pt-4">
              <label className="text-xs font-mono text-ash uppercase tracking-wider mb-2 block">
                Mettre a jour le statut
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(statusLabels).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => updateStatus(selectedTx.id, key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                      selectedTx.status === key
                        ? statusColors[key] + ' ring-1 ring-current'
                        : 'bg-dark-600 text-ash hover:text-bone'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
