import { useEffect, useState } from 'react';
import { Download, Filter, Eye, RefreshCw, Trash2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import api from '../../lib/api';

interface Transaction {
  id: string;
  corridor: string;
  amount_sent: number;
  currency_sent: string;
  amount_received: number;
  currency_received: string;
  fees_adoro: number;
  fees_airtel: number;
  total_to_send: number;
  rate_used: number;
  beneficiary_name: string;
  beneficiary_phone: string;
  beneficiary_email: string;
  status: 'pending_contact' | 'in_progress' | 'completed' | 'cancelled';
  admin_notes: string;
  email_sent: boolean;
  created_at: string;
  updated_at: string;
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
  SN_GA: 'SN → GA',
  GA_SN: 'GA → SN',
  MA_GA: 'MA → GA',
  GA_MA: 'GA → MA',
  SN_MA: 'SN → MA',
  MA_SN: 'MA → SN',
};

const statusColors: Record<string, string> = {
  pending_contact: 'bg-yellow-500/10 text-yellow-400',
  in_progress: 'bg-blue-500/10 text-blue-400',
  completed: 'bg-emerald-primary/10 text-emerald-primary',
  cancelled: 'bg-red-500/10 text-red-400',
};

const statusLabels: Record<string, string> = {
  pending_contact: 'En attente',
  in_progress: 'En cours',
  completed: 'Terminee',
  cancelled: 'Annulee',
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
      const params: Record<string, string> = {};
      if (filterCorridor !== 'all') params.corridor = filterCorridor;
      if (filterStatus !== 'all') params.status = filterStatus;
      const { data } = await api.get('/transactions/list/', { params });
      setTransactions(data.results || data);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filterCorridor, filterStatus]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/transactions/${id}/`, { status: newStatus });
      setTransactions((prev) =>
        prev.map((tx) => (tx.id === id ? { ...tx, status: newStatus as Transaction['status'] } : tx))
      );
      setSelectedTx(null);
    } catch {
      // handle error silently
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!window.confirm('Etes-vous sur de vouloir supprimer cette transaction ? Cette action est irreversible.')) {
      return;
    }
    
    try {
      await api.delete(`/transactions/${id}/`);
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
      if (selectedTx?.id === id) {
        setSelectedTx(null);
      }
    } catch {
      alert('Erreur lors de la suppression de la transaction.');
    }
  };

  const exportCSV = async () => {
    try {
      const response = await api.get('/transactions/export/?format=csv', {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_adoro_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // fallback: nothing
    }
  };

  const filteredTransactions = transactions;

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
                <th className="px-4 py-3 text-left text-xs font-mono text-ash uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-mono text-ash uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-mono text-ash uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-ash font-mono">#{tx.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-sm text-ash font-mono">
                    {new Date(tx.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-sm text-bone font-mono">
                    {corridorLabels[tx.corridor] || tx.corridor}
                  </td>
                  <td className="px-4 py-3 text-sm text-emerald-primary font-mono">
                    {Number(tx.amount_sent).toLocaleString('fr-FR')} {tx.currency_sent}
                  </td>
                  <td className="px-4 py-3 text-sm text-bone">{tx.beneficiary_name}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={tx.email_sent ? 'text-emerald-primary' : 'text-ash'}>
                      {tx.email_sent ? 'Envoye' : 'Non'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono ${statusColors[tx.status]}`}>
                      {statusLabels[tx.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="p-1.5 rounded-lg text-ash hover:text-bone hover:bg-dark-600 transition-colors"
                        title="Voir les details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => deleteTransaction(tx.id)}
                        className="p-1.5 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Supprimer la transaction"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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
        title={`Transaction #${selectedTx?.id.slice(0, 8)}`}
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
                <p className="text-bone font-mono">{new Date(selectedTx.created_at).toLocaleString('fr-FR')}</p>
              </div>
              <div>
                <span className="text-ash">Montant envoye:</span>
                <p className="text-bone font-mono">{Number(selectedTx.amount_sent).toLocaleString('fr-FR')} {selectedTx.currency_sent}</p>
              </div>
              <div>
                <span className="text-ash">Montant recu:</span>
                <p className="text-emerald-primary font-mono">{Number(selectedTx.amount_received).toLocaleString('fr-FR')} {selectedTx.currency_received}</p>
              </div>
              <div>
                <span className="text-ash">Frais Adoro:</span>
                <p className="text-bone font-mono">{Number(selectedTx.fees_adoro).toLocaleString('fr-FR')} {selectedTx.currency_sent}</p>
              </div>
              <div>
                <span className="text-ash">Frais Airtel:</span>
                <p className="text-bone font-mono">{Number(selectedTx.fees_airtel).toLocaleString('fr-FR')} {selectedTx.currency_received}</p>
              </div>
              <div>
                <span className="text-ash">Total a envoyer:</span>
                <p className="text-bone font-mono">{Number(selectedTx.total_to_send).toLocaleString('fr-FR')} {selectedTx.currency_sent}</p>
              </div>
              <div>
                <span className="text-ash">Taux:</span>
                <p className="text-bone font-mono">{selectedTx.rate_used}</p>
              </div>
              <div>
                <span className="text-ash">Beneficiaire:</span>
                <p className="text-bone">{selectedTx.beneficiary_name}</p>
                {selectedTx.beneficiary_phone && <p className="text-ash text-xs">{selectedTx.beneficiary_phone}</p>}
                {selectedTx.beneficiary_email && <p className="text-ash text-xs">{selectedTx.beneficiary_email}</p>}
              </div>
              <div>
                <span className="text-ash">Email envoye:</span>
                <p className={selectedTx.email_sent ? 'text-emerald-primary font-mono' : 'text-red-400 font-mono'}>
                  {selectedTx.email_sent ? 'Oui' : 'Non'}
                </p>
              </div>
            </div>

            {selectedTx.admin_notes && (
              <div className="border-t border-dark-600 pt-3">
                <span className="text-xs font-mono text-ash uppercase">Notes admin:</span>
                <p className="text-bone text-sm mt-1">{selectedTx.admin_notes}</p>
              </div>
            )}

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
