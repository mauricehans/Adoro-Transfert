import { useEffect, useState } from 'react';
import { ArrowRightLeft, Wifi, WifiOff, MessageCircle, User, Phone, Mail } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import { useSimulatorSocket } from '../hooks/useSimulatorSocket';
import { useSimulationStore } from '../store';
import { buildWhatsAppUrl, getWhatsAppNumber, getWhatsAppTemplate } from '../lib/whatsapp';
import api from '../lib/api';

const corridors = [
  { value: 'FR_GA', label: 'France → Gabon', from: 'EUR', to: 'XAF' },
  { value: 'GA_FR', label: 'Gabon → France', from: 'XAF', to: 'EUR' },
  { value: 'FR_CM', label: 'France → Cameroun', from: 'EUR', to: 'XAF' },
  { value: 'CM_FR', label: 'Cameroun → France', from: 'XAF', to: 'EUR' },
  { value: 'FR_SN', label: 'France → Senegal', from: 'EUR', to: 'XOF' },
  { value: 'SN_FR', label: 'Senegal → France', from: 'XOF', to: 'EUR' },
  { value: 'FR_MA', label: 'France → Maroc', from: 'EUR', to: 'MAD' },
  { value: 'MA_FR', label: 'Maroc → France', from: 'MAD', to: 'EUR' },
];

export default function Simulator() {
  const { sendSimulation, isConnected } = useSimulatorSocket();
  const {
    corridor,
    amount,
    includeAirtelFee,
    beneficiaryName,
    beneficiaryPhone,
    beneficiaryEmail,
    result,
    setCorridor,
    setAmount,
    setIncludeAirtelFee,
    setBeneficiaryName,
    setBeneficiaryPhone,
    setBeneficiaryEmail,
  } = useSimulationStore();

  const [sending, setSending] = useState(false);

  const selectedCorridor = corridors.find((c) => c.value === corridor);
  const needsPhone = ['FR_GA', 'FR_CM', 'FR_SN', 'GA_FR', 'CM_FR', 'SN_FR'].includes(corridor);
  const needsEmail = ['FR_MA', 'MA_FR'].includes(corridor);
  const showAirtel = ['FR_GA', 'FR_CM', 'FR_SN', 'GA_FR', 'CM_FR', 'SN_FR'].includes(corridor);

  useEffect(() => {
    if (amount > 0) {
      const timer = setTimeout(() => {
        sendSimulation({
          corridor,
          amount,
          include_airtel_fee: includeAirtelFee,
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [corridor, amount, includeAirtelFee, sendSimulation]);

  const handleSubmit = async () => {
    if (!result || !beneficiaryName || amount <= 0) return;
    setSending(true);
    try {
      // Le backend recalcule TOUTES les valeurs monetaires (frais, taux, total)
      // a partir de corridor + amount_sent + include_airtel_fee.
      // On n'envoie JAMAIS les montants/taux/frais cote client (securite).
      await api.post('/transactions/', {
        corridor,
        amount_sent: amount,
        include_airtel_fee: includeAirtelFee,
        beneficiary_name: beneficiaryName,
        beneficiary_phone: beneficiaryPhone,
        beneficiary_email: beneficiaryEmail,
      });
    } catch {
      // sauvegarde echouee, on continue quand meme vers WhatsApp
    }

    // Recuperation du numero et du template WhatsApp depuis la BDD
    const [whatsappNumber, template] = await Promise.all([
      getWhatsAppNumber(),
      getWhatsAppTemplate(),
    ]);

    const url = buildWhatsAppUrl({
      result,
      beneficiaryName,
      beneficiaryPhone,
      beneficiaryEmail,
      whatsappNumber,
      template,
    });
    window.open(url, '_blank');
    setSending(false);
  };

  return (
    <div className="glass-card p-6 md:p-8 w-full max-w-xl mx-auto animate-glow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl text-bone tracking-wide">SIMULATEUR</h2>
        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <Wifi size={14} className="text-emerald-primary" />
          ) : (
            <WifiOff size={14} className="text-red-400" />
          )}
          <span className="text-xs font-mono text-ash">
            {isConnected ? 'Live' : 'Hors ligne'}
          </span>
        </div>
      </div>

      {/* Corridor selector */}
      <div className="mb-5">
        <label className="block text-sm font-mono text-ash mb-1.5 uppercase tracking-wider">
          Corridor
        </label>
        <div className="relative">
          <ArrowRightLeft size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ash" />
          <select
            value={corridor}
            onChange={(e) => setCorridor(e.target.value)}
            className="w-full bg-dark-800 border border-dark-500 rounded-xl pl-10 pr-4 py-2.5 text-bone appearance-none focus:outline-none focus:border-emerald-primary/50 focus:ring-1 focus:ring-emerald-primary/30 transition-colors"
          >
            {corridors.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Amount */}
      <div className="mb-5">
        <Input
          label="Montant a envoyer"
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder={`Montant en ${selectedCorridor?.from || 'EUR'}`}
        />
        <p className="mt-1 text-xs text-ash">
          Devise: {selectedCorridor?.from}
        </p>
      </div>

      {/* Airtel fee checkbox (Africa corridors only) */}
      {showAirtel && (
        <div className="mb-5">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={includeAirtelFee}
                onChange={(e) => setIncludeAirtelFee(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-5 h-5 rounded-md border border-dark-500 bg-dark-800 peer-checked:bg-emerald-primary peer-checked:border-emerald-primary transition-colors flex items-center justify-center">
                {includeAirtelFee && (
                  <svg className="w-3 h-3 text-dark-900" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-ash group-hover:text-bone transition-colors">
              Inclure frais retrait Airtel Money (3%, max 5 000 FCFA)
            </span>
          </label>
        </div>
      )}

      {/* Beneficiary */}
      <div className="mb-5 space-y-3">
        <Input
          label="Nom du beneficiaire"
          value={beneficiaryName}
          onChange={(e) => setBeneficiaryName(e.target.value)}
          placeholder="Nom complet"
          icon={<User size={16} />}
        />
        {needsPhone && (
          <Input
            label="Telephone beneficiaire"
            value={beneficiaryPhone}
            onChange={(e) => setBeneficiaryPhone(e.target.value)}
            placeholder="+241 XX XX XX XX"
            icon={<Phone size={16} />}
          />
        )}
        {needsEmail && (
          <Input
            label="Email beneficiaire"
            value={beneficiaryEmail}
            onChange={(e) => setBeneficiaryEmail(e.target.value)}
            placeholder="email@example.com"
            icon={<Mail size={16} />}
          />
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="mb-6 p-4 rounded-xl bg-dark-800/80 border border-emerald-primary/10 space-y-2">
          <h3 className="font-mono text-xs uppercase tracking-wider text-emerald-primary mb-3">
            Resultat de la simulation
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-ash">Montant envoye:</span>
            <span className="text-bone text-right font-mono">
              {Number(result.amountSent).toLocaleString('fr-FR')} {result.currencySent}
            </span>
            <span className="text-ash">Frais Adoro:</span>
            <span className="text-bone text-right font-mono">
              {Number(result.adoroFee).toLocaleString('fr-FR')} {result.currencySent}
            </span>
            {Number(result.airtelFee) > 0 && (
              <>
                <span className="text-ash">Frais Airtel:</span>
                <span className="text-bone text-right font-mono">
                  {Number(result.airtelFee).toLocaleString('fr-FR')} {result.currencyReceived}
                </span>
              </>
            )}
            <span className="text-ash">Total a envoyer:</span>
            <span className="text-emerald-primary text-right font-mono font-bold">
              {Number(result.totalToSend).toLocaleString('fr-FR')} {result.currencySent}
            </span>
            <div className="col-span-2 border-t border-dark-600 my-1" />
            <span className="text-ash">Beneficiaire recoit:</span>
            <span className="text-emerald-light text-right font-mono font-bold text-lg">
              {Number(result.amountReceived).toLocaleString('fr-FR')} {result.currencyReceived}
            </span>
            <span className="text-ash">Taux:</span>
            <span className="text-bone text-right font-mono text-xs">
              1 {result.currencySent} = {Number(result.rate).toLocaleString('fr-FR')} {result.currencyReceived}
            </span>
          </div>
        </div>
      )}

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!result || !beneficiaryName}
        loading={sending}
        size="lg"
        className="w-full"
      >
        <MessageCircle size={18} className="mr-2" />
        Envoyer via WhatsApp
      </Button>

      <p className="mt-3 text-center text-xs text-ash/60">
        Aucun transfert reel. Vous serez redirige vers WhatsApp. Un email sera aussi envoye a notre equipe.
      </p>
    </div>
  );
}
