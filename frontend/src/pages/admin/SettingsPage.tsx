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
  apiUrls: { name: string; url: string }[];
  fcfaTariffs: TariffRow[];
  eurTariffs: TariffRow[];
  madTariffs: TariffRow[];
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    whatsappNumber: '2417449818',
    emailRecipient: 'contact@adoro-transfert.com',
    apiUrls: [
      { name: 'ECB', url: 'https://api.exchangeratesapi.io/v1/latest' },
      { name: 'XE', url: 'https://xecdapi.xe.com/v1/convert_from' },
    ],
    fcfaTariffs: [
      { min: 10000, max: 30000, fee: 1500 },
      { min: 30001, max: 50000, fee: 2500 },
      { min: 50001, max: 70000, fee: 3000 },
      { min: 70001, max: 90000, fee: 4500 },
      { min: 90001, max: 110000, fee: 5000 },
      { min: 110001, max: 130000, fee: 5500 },
      { min: 130001, max: 150000, fee: 6500 },
      { min: 150001, max: 170000, fee: 7000 },
      { min: 170001, max: 190000, fee: 7500 },
      { min: 190001, max: 210000, fee: 9500 },
      { min: 210001, max: 230000, fee: 10500 },
      { min: 230001, max: 250000, fee: 11000 },
      { min: 250001, max: 270000, fee: 11500 },
      { min: 270001, max: 290000, fee: 12500 },
      { min: 290001, max: 310000, fee: 13000 },
      { min: 310001, max: 330000, fee: 14000 },
      { min: 330001, max: 350000, fee: 14500 },
      { min: 350001, max: 370000, fee: 16500 },
      { min: 370001, max: 390000, fee: 18000 },
      { min: 390001, max: 410000, fee: 19500 },
      { min: 410001, max: 430000, fee: 21000 },
      { min: 430001, max: 450000, fee: 22500 },
      { min: 450001, max: 470000, fee: 23500 },
      { min: 470001, max: 500000, fee: 26000 },
      { min: 500001, max: null, fee: 35000 },
    ],
    eurTariffs: [
      { min: 15.24, max: 45.73, fee: 2.29 },
      { min: 45.74, max: 76.24, fee: 3.81 },
      { min: 76.25, max: 106.74, fee: 4.57 },
      { min: 106.75, max: 137.24, fee: 6.86 },
      { min: 137.25, max: 167.74, fee: 7.62 },
      { min: 167.75, max: 198.24, fee: 8.38 },
      { min: 198.25, max: 227.74, fee: 9.91 },
      { min: 227.75, max: 257.24, fee: 10.66 },
      { min: 257.25, max: 286.74, fee: 11.42 },
      { min: 286.75, max: 316.24, fee: 14.48 },
      { min: 316.25, max: 345.74, fee: 16.00 },
      { min: 345.75, max: 375.24, fee: 16.77 },
      { min: 375.25, max: 404.74, fee: 17.53 },
      { min: 404.75, max: 434.24, fee: 19.05 },
      { min: 434.25, max: 463.74, fee: 19.81 },
      { min: 463.75, max: 493.24, fee: 21.33 },
      { min: 493.25, max: 522.74, fee: 22.09 },
      { min: 522.75, max: 552.24, fee: 25.19 },
      { min: 552.25, max: 581.74, fee: 27.45 },
      { min: 581.75, max: 611.24, fee: 29.72 },
      { min: 611.25, max: 640.74, fee: 31.98 },
      { min: 640.75, max: 670.24, fee: 34.24 },
      { min: 670.25, max: 699.74, fee: 35.99 },
      { min: 699.75, max: 761.24, fee: 39.62 },
      { min: 761.25, max: null, fee: 50.00 },
    ],
    madTariffs: [{ min: 150, max: 450, fee: 23 },
      { min: 451, max: 750, fee: 38 },
      { min: 751, max: 1050, fee: 46 },
      { min: 1051, max: 1350, fee: 68 },
      { min: 1351, max: 1650, fee: 76 },
      { min: 1651, max: 1950, fee: 83 },
      { min: 1951, max: 2250, fee: 99 },
      { min: 2251, max: 2550, fee: 106 },
      { min: 2551, max: 2850, fee: 114 },
      { min: 2851, max: 3150, fee: 144 },
      { min: 3151, max: 3450, fee: 160 },
      { min: 3451, max: 3750, fee: 167 },
      { min: 3751, max: 4050, fee: 175 },
      { min: 4051, max: 4350, fee: 190 },
      { min: 4351, max: 4650, fee: 198 },
      { min: 4651, max: 4950, fee: 213 },
      { min: 4951, max: 5250, fee: 220 },
      { min: 5251, max: 5550, fee: 251 },
      { min: 5551, max: 5850, fee: 274 },
      { min: 5851, max: 6150, fee: 297 },
      { min: 6151, max: 6450, fee: 319 },
      { min: 6451, max: 6750, fee: 342 },
      { min: 6751, max: 7050, fee: 359 },
      { min: 7051, max: 7500, fee: 396 },
      { min: 7501, max: null, fee: 500 },
    ],
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Calcul dynamique de la grille MAD en fonction de la grille EUR (1 EUR = 10.9 MAD environ)
  // On utilise le hook pour récupérer le vrai taux de l'API s'il est disponible
  const [currentMadRate, setCurrentMadRate] = useState(10.90);

  useEffect(() => {
    const fetchLatestRate = async () => {
      try {
        const { data } = await api.get('/rates/latest/');
        if (data && data.rates && data.rates.MAD) {
          setCurrentMadRate(data.rates.MAD);
        }
      } catch {
        // Garde la valeur par défaut de 10.90 en cas d'erreur
      }
    };
    fetchLatestRate();
  }, []);

  const computedMadTariffs = settings.eurTariffs.map(row => ({
    min: Math.round(row.min * currentMadRate),
    max: row.max ? Math.round(row.max * currentMadRate) : null,
    fee: Math.round(row.fee * currentMadRate)
  }));

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
          fcfaTariffs: map.fcfa_tariffs?.tariffs || prev.fcfaTariffs,
          eurTariffs: map.eur_tariffs?.tariffs || prev.eurTariffs,
          // La grille MAD n'est plus lue depuis l'API, on la calcule à la volée !
          madTariffs: prev.madTariffs,
          apiUrls: map.api_urls?.urls || prev.apiUrls,
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
        api.patch('/settings/fcfa_tariffs/', {
          value: { tariffs: settings.fcfaTariffs },
        }),
        api.patch('/settings/eur_tariffs/', {
          value: { tariffs: settings.eurTariffs },
        }),
        api.patch('/settings/api_urls/', {
          value: { urls: settings.apiUrls },
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

  const updateTariff = (type: 'fcfaTariffs' | 'eurTariffs' | 'madTariffs', index: number, field: keyof TariffRow, value: number | null) => {
    setSettings((prev) => ({
      ...prev,
      [type]: prev[type].map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }));
  };

  const addTariff = (type: 'fcfaTariffs' | 'eurTariffs' | 'madTariffs') => {
    setSettings((prev) => ({
      ...prev,
      [type]: [...prev[type], { min: 0, max: null, fee: 0 }],
    }));
  };

  const removeTariff = (type: 'fcfaTariffs' | 'eurTariffs' | 'madTariffs', index: number) => {
    setSettings((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
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
        {/* MAD Tariffs (Read-Only, calculé dynamiquement) */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-bone">GRILLE TARIFAIRE MAD (Maroc)</h2>
            <div className="flex items-center gap-2 text-xs font-mono text-ash bg-dark-800 px-3 py-1.5 rounded-lg border border-dark-500">
              <span className="w-2 h-2 rounded-full bg-emerald-primary/50"></span>
              Calculé automatiquement (1 EUR = {currentMadRate.toFixed(4)} MAD)
            </div>
          </div>
          <div className="space-y-2 opacity-75">
            <div className="grid grid-cols-3 gap-3 text-xs font-mono text-ash uppercase mb-1 px-1">
              <span>Min (MAD)</span>
              <span>Max (MAD)</span>
              <span>Frais (MAD)</span>
            </div>
            {computedMadTariffs.map((row, i) => (
              <div key={i} className="grid grid-cols-3 gap-3 items-center">
                <input
                  type="number"
                  value={row.min}
                  disabled
                  className="bg-dark-900 border border-dark-500 rounded-lg px-3 py-1.5 text-sm text-ash cursor-not-allowed"
                />
                <input
                  type="number"
                  value={row.max ?? ''}
                  disabled
                  placeholder="Illimite"
                  className="bg-dark-900 border border-dark-500 rounded-lg px-3 py-1.5 text-sm text-ash cursor-not-allowed"
                />
                <input
                  type="number"
                  value={row.fee}
                  disabled
                  className="bg-dark-900 border border-dark-500 rounded-lg px-3 py-1.5 text-sm text-ash cursor-not-allowed"
                />
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-ash italic text-center">
            Cette grille ne peut pas être modifiée manuellement. Elle se met à jour automatiquement en fonction de la grille EUR et du taux de change.
          </p>
        </div>
      </div>
    </div>
  );
}
