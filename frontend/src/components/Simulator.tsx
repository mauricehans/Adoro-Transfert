import { useEffect, useState } from 'react';
import { ArrowRightLeft, MessageCircle, User, Phone, Mail, Activity } from 'lucide-react';
import Button from './ui/Button';
import { useSimulationStore } from '../store';
import { buildWhatsAppUrl, getWhatsAppNumber } from '../lib/whatsapp';
import api from '../lib/api';
import TransferDetails from './TransferDetails';
import { usePublicSettings } from '../hooks/usePublicSettings';

const corridors = [
  { value: 'FR_GA', label: 'France → Gabon (PayPal vers Airtel Money)', from: 'EUR', to: 'XAF' },
  { value: 'GA_FR', label: 'Gabon → France (Airtel Money vers PayPal)', from: 'XAF', to: 'EUR' },
  { value: 'FR_CM', label: 'France → Cameroun (PayPal vers Mobile Money)', from: 'EUR', to: 'XAF' },
  { value: 'CM_FR', label: 'Cameroun → France (Mobile Money vers PayPal)', from: 'XAF', to: 'EUR' },
  { value: 'FR_SN', label: 'France → Sénégal (PayPal vers Wave)', from: 'EUR', to: 'XOF' },
  { value: 'SN_FR', label: 'Sénégal → France (Wave vers PayPal)', from: 'XOF', to: 'EUR' },
  { value: 'FR_MA', label: 'France → Maroc (PayPal vers Wafacash)', from: 'EUR', to: 'MAD' },
  { value: 'MA_FR', label: 'Maroc → France (Wafacash vers PayPal)', from: 'MAD', to: 'EUR' },
  { value: 'SN_GA', label: 'Sénégal → Gabon (Wave vers Airtel Money)', from: 'XOF', to: 'XAF' },
  { value: 'GA_SN', label: 'Gabon → Sénégal (Airtel Money vers Wave)', from: 'XAF', to: 'XOF' },
  { value: 'MA_GA', label: 'Maroc → Gabon (Wafacash vers Airtel Money)', from: 'MAD', to: 'XAF' },
  { value: 'GA_MA', label: 'Gabon → Maroc (Airtel Money vers Wafacash)', from: 'XAF', to: 'MAD' },
  { value: 'SN_MA', label: 'Sénégal → Maroc (Wave vers Wafacash)', from: 'XOF', to: 'MAD' },
  { value: 'MA_SN', label: 'Maroc → Sénégal (Wafacash vers Wave)', from: 'MAD', to: 'XOF' },
];

export default function Simulator() {
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
    setResult,
  } = useSimulationStore();

  const [sending, setSending] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const { amountLimits } = usePublicSettings();
  const selectedCorridor = corridors.find((c) => c.value === corridor);
  const fromCurrency = selectedCorridor?.from || 'EUR';
  const limits = amountLimits[fromCurrency] || { min: 1, max: 1000000 };
  
  const destination = corridor.split('_')[1];
  
  let needsPhone = false;
  let needsEmail = false;
  let phoneLabel = "Téléphone du bénéficiaire";
  let phonePlaceholder = "+241 XX XX XX XX";
  let emailLabel = "Adresse e-mail du bénéficiaire";
  let emailPlaceholder = "email@example.com";
  let nameLabel = "Nom du bénéficiaire :";
  let namePlaceholder = "Nom complet";

  switch (destination) {
    case 'FR':
      needsEmail = true;
      emailLabel = "Adresse e-mail PayPal du bénéficiaire";
      emailPlaceholder = "compte@paypal.com";
      break;
    case 'GA':
      needsPhone = true;
      phoneLabel = "Numéro Airtel Money du bénéficiaire";
      phonePlaceholder = "+241 07 XX XX XX";
      break;
    case 'SN':
      needsPhone = true;
      phoneLabel = "Numéro Wave du bénéficiaire";
      phonePlaceholder = "+221 XX XXX XX XX";
      break;
    case 'CM':
      needsPhone = true;
      phoneLabel = "Numéro MTN MoMo du bénéficiaire";
      phonePlaceholder = "+237 6X XX XX XX";
      break;
    case 'MA':
      needsPhone = true;
      phoneLabel = "Téléphone du bénéficiaire (Wafacash)";
      phonePlaceholder = "+212 6 XX XX XX XX";
      nameLabel = "Nom complet (tel que sur la pièce d'identité) :";
      break;
  }

  // Si on envoie depuis un pays africain VERS la France (destination = FR), on a potentiellement besoin du numéro de l'expéditeur en +33
  // Mais si tu parles du destinataire en France, la logique est plutôt d'avoir le +33
  if (destination === 'FR') {
    needsPhone = true; // Forcer le téléphone même pour la France
    phoneLabel = "Numéro de téléphone du bénéficiaire";
    phonePlaceholder = "+33 6 XX XX XX XX";
  }

  // Airtel Money s'applique UNIQUEMENT quand l'argent arrive au Gabon
  const showAirtel = ['FR_GA', 'SN_GA', 'MA_GA'].includes(corridor);

  const isFormValid = () => {
    if (!result || amount <= 0) return false;
    if (amount > limits.max || amount < limits.min) return false;
    if (!beneficiaryName.trim()) return false;
    if (needsPhone && !beneficiaryPhone.trim()) return false;
    if (needsEmail && !beneficiaryEmail.trim()) return false;
    return true;
  };

  useEffect(() => {
    const calculateSimulation = async () => {
      if (amount <= 0) {
        setResult(null);
        return;
      }
      
      setCalculating(true);
      try {
        const { data } = await api.post('/simulator/calculate/', {
          corridor,
          amount,
          include_airtel_fee: includeAirtelFee,
        });
        
        setResult({
          corridor: data.corridor,
          amountSent: data.amount_sent,
          currencySent: data.currency_sent,
          adoroFee: data.adoro_fee,
          airtelFee: data.airtel_fee,
          totalToSend: data.total_to_send,
          amountReceived: data.amount_received,
          currencyReceived: data.currency_received,
          rate: data.rate,
        });
      } catch (error) {
        console.error("Erreur de calcul:", error);
      } finally {
        setCalculating(false);
      }
    };

    const timer = setTimeout(() => {
      calculateSimulation();
    }, 400); // Debounce de 400ms

    return () => clearTimeout(timer);
  }, [corridor, amount, includeAirtelFee, setResult]);

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

    const whatsappNumber = await getWhatsAppNumber();

    const url = buildWhatsAppUrl({
      result,
      beneficiaryName,
      beneficiaryPhone,
      beneficiaryEmail,
      whatsappNumber,
      template: null,
    });
    window.open(url, '_blank');
    setSending(false);
  };

  return (
    <div className="glass-card p-6 md:p-8 w-full max-w-xl mx-auto animate-glow">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl text-bone tracking-wide mb-2">Simulateur Adoro</h2>
        <p className="text-ash text-sm">Trouvez combien vous devez envoyer</p>
      </div>

      <div className="flex items-center justify-end mb-6">
        <div className="flex items-center gap-1.5">
          {calculating ? (
            <Activity size={14} className="text-emerald-primary animate-pulse" />
          ) : (
            <Activity size={14} className="text-emerald-primary" />
          )}
          <span className="text-xs font-mono text-ash">
            {calculating ? 'Calcul...' : 'Pret'}
          </span>
        </div>
      </div>

      {/* Corridor selector */}
      <div className="mb-6">
        <label className="block text-sm font-mono text-ash mb-1.5 uppercase tracking-wider">
          Sens de la transaction :
        </label>
        <div className="relative">
          <ArrowRightLeft size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ash" />
          <select
            value={corridor}
            onChange={(e) => setCorridor(e.target.value)}
            className="w-full bg-dark-800 border border-dark-500 rounded-xl pl-10 pr-4 py-3 text-bone appearance-none focus:outline-none focus:border-emerald-primary/50 focus:ring-1 focus:ring-emerald-primary/30 transition-colors"
          >
            {corridors.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-2 text-xs text-ash italic">
          Montant accepté : {limits.min.toLocaleString('fr-FR')} - {limits.max.toLocaleString('fr-FR')} {fromCurrency}
        </p>
      </div>

      {/* Amount */}
      <div className="mb-6">
        <label className="block text-sm font-mono text-ash mb-1.5 uppercase tracking-wider">
          J'envoie :
        </label>
        <div className="flex">
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder={`Montant sans frais`}
            className={`w-full bg-dark-800 border ${amount > limits.max || (amount > 0 && amount < limits.min) ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/30' : 'border-dark-500 focus:border-emerald-primary/50 focus:ring-emerald-primary/30'} border-r-0 rounded-l-xl px-4 py-3 text-bone placeholder:text-ash/50 focus:outline-none focus:ring-1 transition-colors`}
          />
          <div className="flex items-center justify-center bg-dark-600 border border-dark-500 rounded-r-xl px-4 text-bone font-mono">
            {selectedCorridor?.from || 'EUR'}
          </div>
        </div>
        
        {amount > limits.max && (
          <p className="mt-2 text-xs text-red-400 font-medium">
            ⚠️ Le montant dépasse la limite maximum de {limits.max.toLocaleString('fr-FR')} {fromCurrency}.
          </p>
        )}
        
        {amount > 0 && amount < limits.min && (
          <p className="mt-2 text-xs text-red-400 font-medium">
            ⚠️ Le montant doit être d'au moins {limits.min.toLocaleString('fr-FR')} {fromCurrency}.
          </p>
        )}

        {result && amount >= limits.min && amount <= limits.max && (
          <p className="mt-2 text-xs text-ash italic">
            Montant des frais : {Number(result.adoroFee).toLocaleString('fr-FR')} {result.currencySent}
          </p>
        )}
      </div>

      {/* Airtel fee checkbox (Africa corridors only) */}
      {showAirtel && (
        <div className="mb-6">
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
              Inclure frais de retrait Airtel Money
            </span>
          </label>
        </div>
      )}

      {/* Total to send */}
      <div className="mb-6">
        <label className="block text-sm font-mono text-ash mb-1.5 uppercase tracking-wider">
          Total a envoyer a Adoro :
        </label>
        <div className="flex">
          <input
            type="text"
            value={result ? Number(result.totalToSend).toLocaleString('fr-FR') : ''}
            disabled
            placeholder="Montant TTC"
            className="w-full bg-dark-900 border border-dark-500 border-r-0 rounded-l-xl px-4 py-3 text-emerald-primary font-bold focus:outline-none disabled:opacity-80"
          />
          <div className="flex items-center justify-center bg-dark-700 border border-dark-500 rounded-r-xl px-4 text-emerald-primary font-mono font-bold">
            {selectedCorridor?.from || 'EUR'}
          </div>
        </div>
      </div>

      {/* Amount received */}
      <div className="mb-6">
        <label className="block text-sm font-mono text-ash mb-1.5 uppercase tracking-wider">
          Le beneficiaire recevra :
        </label>
        <div className="flex">
          <input
            type="text"
            value={result ? Number(result.amountReceived).toLocaleString('fr-FR') : ''}
            disabled
            placeholder="Montant recu"
            className="w-full bg-dark-900 border border-dark-500 border-r-0 rounded-l-xl px-4 py-3 text-emerald-light font-bold focus:outline-none disabled:opacity-80"
          />
          <div className="flex items-center justify-center bg-dark-700 border border-dark-500 rounded-r-xl px-4 text-emerald-light font-mono font-bold">
            {selectedCorridor?.to || 'XAF'}
          </div>
        </div>
        {result && (
          <p className="mt-2 text-xs text-ash italic">
            Taux de change : 1 {result.currencySent} = {Number(result.rate).toLocaleString('fr-FR')} {result.currencyReceived}
          </p>
        )}
      </div>

      {/* Beneficiary */}
      <div className="mb-8 space-y-4">
        <div className="w-full">
          <label className="block text-sm font-mono text-ash mb-1.5 uppercase tracking-wider">{nameLabel}</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ash">
              <User size={16} />
            </div>
            <input 
              className="w-full bg-dark-800 border border-dark-500 rounded-xl px-4 py-3 text-bone placeholder:text-ash/50 focus:outline-none focus:border-emerald-primary/50 focus:ring-1 focus:ring-emerald-primary/30 transition-colors pl-10" 
              placeholder={namePlaceholder}
              value={beneficiaryName}
              onChange={(e) => setBeneficiaryName(e.target.value)}
            />
          </div>
        </div>
        
        {needsPhone && (
          <div className="w-full">
            <label className="block text-sm font-mono text-ash mb-1.5 uppercase tracking-wider">
              <mark className="bg-emerald-primary/20 text-emerald-primary font-bold px-1 rounded">{phoneLabel.split(' ')[0]}</mark> {phoneLabel.substring(phoneLabel.indexOf(' ') + 1)} :
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ash">
                <Phone size={16} />
              </div>
              <input 
                className="w-full bg-dark-800 border border-dark-500 rounded-xl px-4 py-3 text-bone placeholder:text-ash/50 focus:outline-none focus:border-emerald-primary/50 focus:ring-1 focus:ring-emerald-primary/30 transition-colors pl-10" 
                placeholder={phonePlaceholder}
                value={beneficiaryPhone}
                onChange={(e) => setBeneficiaryPhone(e.target.value)}
              />
            </div>
          </div>
        )}
        
        {needsEmail && (
          <div className="w-full">
            <label className="block text-sm font-mono text-ash mb-1.5 uppercase tracking-wider">
              <mark className="bg-emerald-primary/20 text-emerald-primary font-bold px-1 rounded">{emailLabel.split(' ')[0]}</mark> {emailLabel.substring(emailLabel.indexOf(' ') + 1)} :
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ash">
                <Mail size={16} />
              </div>
              <input 
                className="w-full bg-dark-800 border border-dark-500 rounded-xl px-4 py-3 text-bone placeholder:text-ash/50 focus:outline-none focus:border-emerald-primary/50 focus:ring-1 focus:ring-emerald-primary/30 transition-colors pl-10" 
                placeholder={emailPlaceholder}
                value={beneficiaryEmail}
                onChange={(e) => setBeneficiaryEmail(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!isFormValid()}
        loading={sending}
        size="lg"
        className="w-full py-4 text-lg"
      >
        <MessageCircle size={20} className="mr-2" />
        Continuer sur WhatsApp
      </Button>

      <p className="mt-4 text-center text-sm text-ash italic">
        En appuyant sur ce bouton, vous serez redirige sur WhatsApp pour finaliser la transaction.
      </p>

      <TransferDetails corridor={corridor} />
    </div>
  );
}
