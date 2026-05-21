import { useState, useEffect } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import api from '../../lib/api';

interface TariffRow {
  min: number;
  max: number | null;
  fee: number;
}

interface Settings {
  whatsappNumber: string;
  emailRecipient: string;
  activeCurrencies: string[];
  apiUrls: { name: string; url: string }[];
  fcfaTariffs: TariffRow[];
  eurTariffs: TariffRow[];
  whatsappTemplate: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    whatsappNumber: '2417449818',
    emailRecipient: 'contact@adoro-transfert.com',
    activeCurrencies: ['EUR', 'XAF', 'XOF', 'MAD'],
    apiUrls: [
      { name: 'ECB', url: 'https://api.exchangeratesapi.io/v1/latest' },
      { name: 'XE', url: 'https://xecdapi.xe.com/v1/convert_from' },
    ],
    fcfaTariffs: [
      { min: 1000, max: 50000, fee: 1000 },
      { min: 50001, max: 100000, fee: 2000 },
      { min: 100001, max: 200000, fee: 3000 },
      { min: 200001, max: 350000, fee: 4500 },
      { min: 350001, max: 500000, fee: 6000 },
      { min: 500001, max: 750000, fee: 8000 },
      { min: 750001, max: 1000000, fee: 10000 },
      { min: 1000001, max: null, fee: 12000 },
    ],
    eurTariffs: [
      { min: 1, max: 50, fee: 3 },
      { min: 51, max: 100, fee: 5 },
      { min: 101, max: 200, fee: 8 },
      { min: 201, max: 350, fee: 10 },
      { min: 351, max: 500, fee: 12 },
      { min: 501, max: 750, fee: 15 },
      { min: 751, max: 1000, fee: 18 },
      { min: 1001, max: null, fee: 22 },
    ],
    whatsappTemplate:
      'Bonjour, je souhaite effectuer un transfert.\n\nCorridor: {corridor}\nMontant: {amount} {currency}\nBeneficiaire: {beneficiary}',
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings/');
        const map: Record<string, any> = {};
        data.forEach((s: { key: string; value: any }) => {
          map[s.key] = s.value;
        });
        setSettings((prev) => ({
          ...prev,
          whatsappNumber: map.whatsapp_number?.number || prev.whatsappNumber,
          emailRecipient: map.notification_email?.email || prev.emailRecipient,
          activeCurrencies: map.active_currencies?.currencies || prev.activeCurrencies,
          whatsappTemplate: map.whatsapp_template?.template || prev.whatsappTemplate,
        }));
      } catch {
        // use defaults
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        api.patch('/settings/notification_email/', {
          value: { email: settings.emailRecipient },
        }),
        api.patch('/settings/whatsapp_number/', {
          value: { number: settings.whatsappNumber },
        }),
        api.patch('/settings/whatsapp_template/', {
          value: { template: settings.whatsappTemplate },
        }),
        api.patch('/settings/active_currencies/', {
          value: { currencies: settings.activeCurrencies },
        }),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const updateTariff = (type: 'fcfaTariffs' | 'eurTariffs', index: number, field: keyof TariffRow, value: number | null) => {
    setSettings((prev) => ({
      ...prev,
      [type]: prev[type].map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }));
  };

  const addTariff = (type: 'fcfaTariffs' | 'eurTariffs') => {
    setSettings((prev) => ({
      ...prev,
      [type]: [...prev[type], { min: 0, max: null, fee: 0 }],
    }));
  };

  const removeTariff = (type: 'fcfaTariffs' | 'eurTariffs', index: number) => {
    setSettings((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const addCurrency = () => {
    const currency = prompt('Code devise (ex: USD):');
    if (currency && !settings.activeCurrencies.includes(currency.toUpperCase())) {
      setSettings((prev) => ({
        ...prev,
        activeCurrencies: [...prev.activeCurrencies, currency.toUpperCase()],
      }));
    }
  };

  const removeCurrency = (currency: string) => {
    setSettings((prev) => ({
      ...prev,
      activeCurrencies: prev.activeCurrencies.filter((c) => c !== currency),
    }));
  };

  const addApiUrl = () => {
    setSettings((prev) => ({
      ...prev,
      apiUrls: [...prev.apiUrls, { name: '', url: '' }],
    }));
  };

  const removeApiUrl = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      apiUrls: prev.apiUrls.filter((_, i) => i !== index),
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-bone">PARAMETRES</h1>
        <Button onClick={handleSave} loading={saving}>
          <Save size={16} className="mr-2" />
          {saved ? 'Sauvegarde !' : 'Sauvegarder'}
        </Button>
      </div>

      <div className="space-y-8">
        {/* General settings */}
        <div className="glass-card p-6">
          <h2 className="font-display text-xl text-bone mb-4">GENERAL</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Numero WhatsApp"
              value={settings.whatsappNumber}
              onChange={(e) => setSettings((prev) => ({ ...prev, whatsappNumber: e.target.value }))}
              placeholder="2417449818"
            />
            <Input
              label="Email destinataire"
              type="email"
              value={settings.emailRecipient}
              onChange={(e) => setSettings((prev) => ({ ...prev, emailRecipient: e.target.value }))}
              placeholder="contact@adoro-transfert.com"
            />
          </div>
        </div>

        {/* WhatsApp template */}
        <div className="glass-card p-6">
          <h2 className="font-display text-xl text-bone mb-4">TEMPLATE WHATSAPP</h2>
          <div>
            <label className="block text-sm font-mono text-ash mb-1.5 uppercase tracking-wider">
              Message pre-rempli
            </label>
            <textarea
              value={settings.whatsappTemplate}
              onChange={(e) => setSettings((prev) => ({ ...prev, whatsappTemplate: e.target.value }))}
              rows={5}
              className="w-full bg-dark-800 border border-dark-500 rounded-xl px-4 py-2.5 text-bone placeholder:text-ash/50 focus:outline-none focus:border-emerald-primary/50 focus:ring-1 focus:ring-emerald-primary/30 transition-colors resize-none font-mono text-sm"
            />
            <p className="mt-2 text-xs text-ash">
              Variables disponibles: {'{corridor}'}, {'{amount}'}, {'{currency}'}, {'{beneficiary}'}, {'{fee}'}
            </p>
          </div>
        </div>

        {/* Active currencies */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-bone">DEVISES ACTIVES</h2>
            <Button onClick={addCurrency} variant="secondary" size="sm">
              <Plus size={14} className="mr-1" />
              Ajouter
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {settings.activeCurrencies.map((currency) => (
              <span
                key={currency}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-600 border border-dark-500 text-sm text-bone font-mono"
              >
                {currency}
                <button
                  onClick={() => removeCurrency(currency)}
                  className="text-ash hover:text-red-400 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* API URLs */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-bone">SOURCES API</h2>
            <Button onClick={addApiUrl} variant="secondary" size="sm">
              <Plus size={14} className="mr-1" />
              Ajouter
            </Button>
          </div>
          <div className="space-y-3">
            {settings.apiUrls.map((apiUrl, i) => (
              <div key={i} className="flex items-center gap-3">
                <Input
                  value={apiUrl.name}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      apiUrls: prev.apiUrls.map((a, j) => (j === i ? { ...a, name: e.target.value } : a)),
                    }))
                  }
                  placeholder="Nom"
                  className="w-32"
                />
                <Input
                  value={apiUrl.url}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      apiUrls: prev.apiUrls.map((a, j) => (j === i ? { ...a, url: e.target.value } : a)),
                    }))
                  }
                  placeholder="URL"
                  className="flex-1"
                />
                <button
                  onClick={() => removeApiUrl(i)}
                  className="p-2 text-ash hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FCFA Tariffs */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-bone">GRILLE TARIFAIRE FCFA</h2>
            <Button onClick={() => addTariff('fcfaTariffs')} variant="secondary" size="sm">
              <Plus size={14} className="mr-1" />
              Ligne
            </Button>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-3 text-xs font-mono text-ash uppercase mb-1 px-1">
              <span>Min (FCFA)</span>
              <span>Max (FCFA)</span>
              <span>Frais (FCFA)</span>
              <span></span>
            </div>
            {settings.fcfaTariffs.map((row, i) => (
              <div key={i} className="grid grid-cols-4 gap-3 items-center">
                <input
                  type="number"
                  value={row.min}
                  onChange={(e) => updateTariff('fcfaTariffs', i, 'min', Number(e.target.value))}
                  className="bg-dark-800 border border-dark-500 rounded-lg px-3 py-1.5 text-sm text-bone focus:outline-none focus:border-emerald-primary/50"
                />
                <input
                  type="number"
                  value={row.max ?? ''}
                  onChange={(e) => updateTariff('fcfaTariffs', i, 'max', e.target.value ? Number(e.target.value) : null)}
                  placeholder="Illimite"
                  className="bg-dark-800 border border-dark-500 rounded-lg px-3 py-1.5 text-sm text-bone placeholder:text-ash/50 focus:outline-none focus:border-emerald-primary/50"
                />
                <input
                  type="number"
                  value={row.fee}
                  onChange={(e) => updateTariff('fcfaTariffs', i, 'fee', Number(e.target.value))}
                  className="bg-dark-800 border border-dark-500 rounded-lg px-3 py-1.5 text-sm text-bone focus:outline-none focus:border-emerald-primary/50"
                />
                <button
                  onClick={() => removeTariff('fcfaTariffs', i)}
                  className="p-2 text-ash hover:text-red-400 transition-colors justify-self-center"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* EUR Tariffs */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-bone">GRILLE TARIFAIRE EUR</h2>
            <Button onClick={() => addTariff('eurTariffs')} variant="secondary" size="sm">
              <Plus size={14} className="mr-1" />
              Ligne
            </Button>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-3 text-xs font-mono text-ash uppercase mb-1 px-1">
              <span>Min (EUR)</span>
              <span>Max (EUR)</span>
              <span>Frais (EUR)</span>
              <span></span>
            </div>
            {settings.eurTariffs.map((row, i) => (
              <div key={i} className="grid grid-cols-4 gap-3 items-center">
                <input
                  type="number"
                  value={row.min}
                  onChange={(e) => updateTariff('eurTariffs', i, 'min', Number(e.target.value))}
                  className="bg-dark-800 border border-dark-500 rounded-lg px-3 py-1.5 text-sm text-bone focus:outline-none focus:border-emerald-primary/50"
                />
                <input
                  type="number"
                  value={row.max ?? ''}
                  onChange={(e) => updateTariff('eurTariffs', i, 'max', e.target.value ? Number(e.target.value) : null)}
                  placeholder="Illimite"
                  className="bg-dark-800 border border-dark-500 rounded-lg px-3 py-1.5 text-sm text-bone placeholder:text-ash/50 focus:outline-none focus:border-emerald-primary/50"
                />
                <input
                  type="number"
                  value={row.fee}
                  onChange={(e) => updateTariff('eurTariffs', i, 'fee', Number(e.target.value))}
                  className="bg-dark-800 border border-dark-500 rounded-lg px-3 py-1.5 text-sm text-bone focus:outline-none focus:border-emerald-primary/50"
                />
                <button
                  onClick={() => removeTariff('eurTariffs', i)}
                  className="p-2 text-ash hover:text-red-400 transition-colors justify-self-center"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
