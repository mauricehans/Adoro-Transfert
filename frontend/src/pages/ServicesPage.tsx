import CorridorCard from '../components/CorridorCard';

const allCorridors = [
  { from: 'France', to: 'Gabon', fromFlag: '\u{1F1EB}\u{1F1F7}', toFlag: '\u{1F1EC}\u{1F1E6}', currencyFrom: 'EUR', currencyTo: 'XAF', methods: ['airtel', 'bank'] },
  { from: 'Gabon', to: 'France', fromFlag: '\u{1F1EC}\u{1F1E6}', toFlag: '\u{1F1EB}\u{1F1F7}', currencyFrom: 'XAF', currencyTo: 'EUR', methods: ['airtel', 'bank'] },
  { from: 'France', to: 'Cameroun', fromFlag: '\u{1F1EB}\u{1F1F7}', toFlag: '\u{1F1E8}\u{1F1F2}', currencyFrom: 'EUR', currencyTo: 'XAF', methods: ['momo', 'bank'] },
  { from: 'Cameroun', to: 'France', fromFlag: '\u{1F1E8}\u{1F1F2}', toFlag: '\u{1F1EB}\u{1F1F7}', currencyFrom: 'XAF', currencyTo: 'EUR', methods: ['momo', 'bank'] },
  { from: 'France', to: 'Senegal', fromFlag: '\u{1F1EB}\u{1F1F7}', toFlag: '\u{1F1F8}\u{1F1F3}', currencyFrom: 'EUR', currencyTo: 'XOF', methods: ['wave', 'bank'] },
  { from: 'Senegal', to: 'France', fromFlag: '\u{1F1F8}\u{1F1F3}', toFlag: '\u{1F1EB}\u{1F1F7}', currencyFrom: 'XOF', currencyTo: 'EUR', methods: ['wave', 'bank'] },
  { from: 'France', to: 'Maroc', fromFlag: '\u{1F1EB}\u{1F1F7}', toFlag: '\u{1F1F2}\u{1F1E6}', currencyFrom: 'EUR', currencyTo: 'MAD', methods: ['wafacash', 'paypal'] },
  { from: 'Maroc', to: 'France', fromFlag: '\u{1F1F2}\u{1F1E6}', toFlag: '\u{1F1EB}\u{1F1F7}', currencyFrom: 'MAD', currencyTo: 'EUR', methods: ['wafacash', 'paypal'] },
];

export default function ServicesPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-up">
          <h1 className="font-display text-5xl text-bone mb-4">NOS SERVICES</h1>
          <p className="text-ash max-w-2xl mx-auto text-lg">
            Transferts bidirectionnels entre la France et l'Afrique/Maghreb.
            Plusieurs moyens de paiement disponibles selon le corridor.
          </p>
        </div>

        {/* Corridors grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {allCorridors.map((corridor, i) => (
            <div key={i} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              <CorridorCard {...corridor} />
            </div>
          ))}
        </div>

        {/* Payment methods details */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-card p-6">
            <h3 className="font-display text-xl text-bone mb-4">MOYENS DE PAIEMENT - ENVOI</h3>
            <ul className="space-y-3 text-ash text-sm">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 mt-1.5 rounded-full bg-emerald-primary flex-shrink-0" />
                <span><strong className="text-bone">Virement bancaire</strong> - Depuis votre banque (tous corridors)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 mt-1.5 rounded-full bg-emerald-primary flex-shrink-0" />
                <span><strong className="text-bone">Airtel Money</strong> - Envoi depuis Gabon</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 mt-1.5 rounded-full bg-emerald-primary flex-shrink-0" />
                <span><strong className="text-bone">MTN MoMo</strong> - Envoi depuis Cameroun</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 mt-1.5 rounded-full bg-emerald-primary flex-shrink-0" />
                <span><strong className="text-bone">Wave</strong> - Envoi depuis Senegal</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 mt-1.5 rounded-full bg-emerald-primary flex-shrink-0" />
                <span><strong className="text-bone">Wafacash / PayPal</strong> - Envoi depuis Maroc</span>
              </li>
            </ul>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-display text-xl text-bone mb-4">MOYENS DE RECEPTION</h3>
            <ul className="space-y-3 text-ash text-sm">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 mt-1.5 rounded-full bg-emerald-primary flex-shrink-0" />
                <span><strong className="text-bone">Airtel Money</strong> - Reception au Gabon (frais retrait 3% max 5000 FCFA)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 mt-1.5 rounded-full bg-emerald-primary flex-shrink-0" />
                <span><strong className="text-bone">MTN MoMo</strong> - Reception au Cameroun</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 mt-1.5 rounded-full bg-emerald-primary flex-shrink-0" />
                <span><strong className="text-bone">Wave</strong> - Reception au Senegal</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 mt-1.5 rounded-full bg-emerald-primary flex-shrink-0" />
                <span><strong className="text-bone">Wafacash</strong> - Reception au Maroc</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 mt-1.5 rounded-full bg-emerald-primary flex-shrink-0" />
                <span><strong className="text-bone">Virement bancaire</strong> - Reception en France</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
