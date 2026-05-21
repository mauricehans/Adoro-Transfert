import { useState } from 'react';
import { Zap, LogIn } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setError('Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 grid-bg p-4">
      <div className="hero-glow absolute inset-0" />
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-card p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-emerald-primary/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-primary" />
            </div>
            <span className="font-display text-2xl text-bone tracking-wide">
              ADORO<span className="text-emerald-primary">ADMIN</span>
            </span>
          </div>

          <h1 className="font-display text-2xl text-bone text-center mb-6">CONNEXION</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@adoro-transfert.com"
              required
            />
            <Input
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              required
            />

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" loading={loading}>
              <LogIn size={18} className="mr-2" />
              Se connecter
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
