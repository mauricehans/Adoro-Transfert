import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, ShieldCheck, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import api from '../../lib/api';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'super_admin';
  phone: string;
  is_active: boolean;
  date_joined: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'admin' as 'admin' | 'super_admin',
    phone: '',
    password: '',
  });

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users/');
      setUsers(data.results || data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await api.post('/users/create/', newUser);
      setShowCreateModal(false);
      setNewUser({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        role: 'admin',
        phone: '',
        password: '',
      });
      fetchUsers();
    } catch (err: any) {
      const detail = err?.response?.data;
      if (detail && typeof detail === 'object') {
        const messages = Object.values(detail).flat().join(' ');
        setError(messages);
      } else {
        setError('Erreur lors de la creation.');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`Supprimer l'utilisateur ${user.username} ?`)) return;
    try {
      await api.delete(`/users/${user.id}/delete/`);
      fetchUsers();
    } catch {
      // handle error
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-bone">GESTION DES UTILISATEURS</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          <UserPlus size={16} className="mr-2" />
          Nouvel admin
        </Button>
      </div>

      {/* Users table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-600">
              <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ash">Utilisateur</th>
              <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ash">Email</th>
              <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ash">Role</th>
              <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ash">Telephone</th>
              <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ash">Inscrit le</th>
              <th className="text-right px-4 py-3 font-mono text-xs uppercase tracking-wider text-ash">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-dark-700 hover:bg-dark-700/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-primary/20 flex items-center justify-center">
                      <span className="text-emerald-primary font-bold text-sm">
                        {(user.first_name?.[0] || user.username[0]).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-bone text-sm font-medium">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-ash text-xs">@{user.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-ash text-sm">{user.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono ${
                      user.role === 'super_admin'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-primary/10 text-emerald-primary border border-emerald-primary/20'
                    }`}
                  >
                    {user.role === 'super_admin' ? (
                      <ShieldCheck size={12} />
                    ) : (
                      <Shield size={12} />
                    )}
                    {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </span>
                </td>
                <td className="px-4 py-3 text-ash text-sm font-mono">{user.phone || '-'}</td>
                <td className="px-4 py-3 text-ash text-sm">
                  {new Date(user.date_joined).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(user)}
                    className="p-2 text-ash hover:text-red-400 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12 text-ash">Aucun utilisateur trouve.</div>
        )}
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card p-6 w-full max-w-md relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-ash hover:text-bone transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="font-display text-2xl text-bone mb-6">NOUVEL ADMINISTRATEUR</h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Nom d'utilisateur"
                value={newUser.username}
                onChange={(e) => setNewUser((p) => ({ ...p, username: e.target.value }))}
                placeholder="nom_utilisateur"
                required
              />
              <Input
                label="Email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                placeholder="email@example.com"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Prenom"
                  value={newUser.first_name}
                  onChange={(e) => setNewUser((p) => ({ ...p, first_name: e.target.value }))}
                  placeholder="Prenom"
                />
                <Input
                  label="Nom"
                  value={newUser.last_name}
                  onChange={(e) => setNewUser((p) => ({ ...p, last_name: e.target.value }))}
                  placeholder="Nom"
                />
              </div>
              <Input
                label="Telephone"
                value={newUser.phone}
                onChange={(e) => setNewUser((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+241 XX XX XX XX"
              />
              <div>
                <label className="block text-sm font-mono text-ash mb-1.5 uppercase tracking-wider">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value as 'admin' | 'super_admin' }))}
                  className="w-full bg-dark-800 border border-dark-500 rounded-xl px-4 py-2.5 text-bone appearance-none focus:outline-none focus:border-emerald-primary/50 focus:ring-1 focus:ring-emerald-primary/30 transition-colors"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <Input
                label="Mot de passe"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
                placeholder="Minimum 8 caracteres"
                required
              />

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <Button type="submit" size="lg" className="w-full" loading={creating}>
                <UserPlus size={18} className="mr-2" />
                Creer l'administrateur
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
