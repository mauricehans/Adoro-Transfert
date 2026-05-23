import CorridorCard from '../components/CorridorCard';

const allCorridors = [
  { from: 'France', to: 'Gabon', fromFlag: '\u{1F1EB}\u{1F1F7}', toFlag: '\u{1F1EC}\u{1F1E6}', currencyFrom: 'EUR', currencyTo: 'XAF', methods: ['paypal', 'airtel'] },
  { from: 'Gabon', to: 'France', fromFlag: '\u{1F1EC}\u{1F1E6}', toFlag: '\u{1F1EB}\u{1F1F7}', currencyFrom: 'XAF', currencyTo: 'EUR', methods: ['airtel', 'paypal'] },
  { from: 'France', to: 'Cameroun', fromFlag: '\u{1F1EB}\u{1F1F7}', toFlag: '\u{1F1E8}\u{1F1F2}', currencyFrom: 'EUR', currencyTo: 'XAF', methods: ['paypal', 'momo'] },
  { from: 'Cameroun', to: 'France', fromFlag: '\u{1F1E8}\u{1F1F2}', toFlag: '\u{1F1EB}\u{1F1F7}', currencyFrom: 'XAF', currencyTo: 'EUR', methods: ['momo', 'paypal'] },
  { from: 'France', to: 'Senegal', fromFlag: '\u{1F1EB}\u{1F1F7}', toFlag: '\u{1F1F8}\u{1F1F3}', currencyFrom: 'EUR', currencyTo: 'XOF', methods: ['paypal', 'wave'] },
  { from: 'Senegal', to: 'France', fromFlag: '\u{1F1F8}\u{1F1F3}', toFlag: '\u{1F1EB}\u{1F1F7}', currencyFrom: 'XOF', currencyTo: 'EUR', methods: ['wave', 'paypal'] },
  { from: 'France', to: 'Maroc', fromFlag: '\u{1F1EB}\u{1F1F7}', toFlag: '\u{1F1F2}\u{1F1E6}', currencyFrom: 'EUR', currencyTo: 'MAD', methods: ['paypal', 'wafacash'] },
  { from: 'Maroc', to: 'France', fromFlag: '\u{1F1F2}\u{1F1E6}', toFlag: '\u{1F1EB}\u{1F1F7}', currencyFrom: 'MAD', currencyTo: 'EUR', methods: ['wafacash', 'paypal'] },
  { from: 'Senegal', to: 'Gabon', fromFlag: '\u{1F1F8}\u{1F1F3}', toFlag: '\u{1F1EC}\u{1F1E6}', currencyFrom: 'XOF', currencyTo: 'XAF', methods: ['wave', 'airtel'] },
  { from: 'Gabon', to: 'Senegal', fromFlag: '\u{1F1EC}\u{1F1E6}', toFlag: '\u{1F1F8}\u{1F1F3}', currencyFrom: 'XAF', currencyTo: 'XOF', methods: ['airtel', 'wave'] },
  { from: 'Maroc', to: 'Gabon', fromFlag: '\u{1F1F2}\u{1F1E6}', toFlag: '\u{1F1EC}\u{1F1E6}', currencyFrom: 'MAD', currencyTo: 'XAF', methods: ['wafacash', 'airtel'] },
  { from: 'Gabon', to: 'Maroc', fromFlag: '\u{1F1EC}\u{1F1E6}', toFlag: '\u{1F1F2}\u{1F1E6}', currencyFrom: 'XAF', currencyTo: 'MAD', methods: ['airtel', 'wafacash'] },
  { from: 'Maroc', to: 'Senegal', fromFlag: '\u{1F1F2}\u{1F1E6}', toFlag: '\u{1F1F8}\u{1F1F3}', currencyFrom: 'MAD', currencyTo: 'XOF', methods: ['wafacash', 'wave'] },
  { from: 'Senegal', to: 'Maroc', fromFlag: '\u{1F1F8}\u{1F1F3}', toFlag: '\u{1F1F2}\u{1F1E6}', currencyFrom: 'XOF', currencyTo: 'MAD', methods: ['wave', 'wafacash'] },
];

export default function ServicesPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-up">
          <h1 className="font-display text-5xl text-bone mb-4">NOS SERVICES</h1>
          <p className="text-ash max-w-2xl mx-auto text-lg mb-8">
            Transferts bidirectionnels entre la France et l'Afrique/Maghreb.
            Plusieurs moyens de paiement disponibles selon le corridor.
          </p>

          <div className="glass-card p-8 max-w-4xl mx-auto text-left mb-16 border-emerald-primary/30">
            <h2 className="font-display text-2xl text-emerald-primary mb-4 flex items-center gap-3">
              <span className="bg-emerald-primary/10 p-2 rounded-lg">🚀</span> 
              Comment fonctionne Adôro Transfert ?
            </h2>
            <p className="text-ash leading-relaxed mb-6">
              Adôro Transfert est une plateforme de simulation et de mise en relation conçue pour faciliter vos transferts d'argent internationaux. Le processus est simple, transparent et s'appuie sur des moyens de paiement populaires et sécurisés.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-dark-800/50 p-5 rounded-xl border border-dark-600">
                <div className="text-3xl font-display text-emerald-light mb-3">1</div>
                <h4 className="font-bold text-bone mb-2">Simulez votre transfert</h4>
                <p className="text-sm text-ash">Utilisez notre simulateur en page d'accueil. Choisissez vos pays de départ et d'arrivée, entrez le montant et découvrez instantanément les frais et le montant que recevra le bénéficiaire, sans frais cachés.</p>
              </div>
              <div className="bg-dark-800/50 p-5 rounded-xl border border-dark-600">
                <div className="text-3xl font-display text-emerald-light mb-3">2</div>
                <h4 className="font-bold text-bone mb-2">Initiez la demande</h4>
                <p className="text-sm text-ash">Renseignez les informations du bénéficiaire. En cliquant sur "Continuer sur WhatsApp", votre demande de transaction est enregistrée dans notre système de manière sécurisée.</p>
              </div>
              <div className="bg-dark-800/50 p-5 rounded-xl border border-dark-600">
                <div className="text-3xl font-display text-emerald-light mb-3">3</div>
                <h4 className="font-bold text-bone mb-2">Finalisez le paiement</h4>
                <p className="text-sm text-ash">Vous êtes redirigé vers WhatsApp pour échanger avec notre équipe. Vous effectuez le paiement (via PayPal, Wave, Airtel Money, etc.) et nous créditons immédiatement le compte du bénéficiaire.</p>
              </div>
            </div>
          </div>
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
            <h3 className="font-display text-xl text-bone mb-4">MOYENS D'ENVOI (SELON LE PAYS DE DÉPART)</h3>
            <ul className="space-y-3 text-ash text-sm">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 mt-1.5 rounded-full bg-emerald-primary flex-shrink-0" />
                <span><strong className="text-bone">PayPal</strong> - Depuis la France (ou carte bancaire via PayPal)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 mt-1.5 rounded-full bg-emerald-primary flex-shrink-0" />
                <span><strong className="text-bone">Airtel Money</strong> - Depuis le Gabon</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 mt-1.5 rounded-full bg-emerald-primary flex-shrink-0" />
                <span><strong className="text-bone">Wave</strong> - Depuis le Sénégal</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 mt-1.5 rounded-full bg-emerald-primary flex-shrink-0" />
                <span><strong className="text-bone">Wafacash</strong> - Depuis le Maroc</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 mt-1.5 rounded-full bg-emerald-primary flex-shrink-0" />
                <span><strong className="text-bone">Mobile Money (MoMo)</strong> - Depuis le Cameroun</span>
              </li>
            </ul>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-display text-xl text-bone mb-4">MOYENS DE RÉCEPTION (SELON LE PAYS D'ARRIVÉE)</h3>
            <ul className="space-y-3 text-ash text-sm">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 mt-1.5 rounded-full bg-emerald-primary flex-shrink-0" />
                <span><strong className="text-bone">Airtel Money</strong> - Réception au Gabon</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 mt-1.5 rounded-full bg-emerald-primary flex-shrink-0" />
                <span><strong className="text-bone">Wave</strong> - Réception au Sénégal</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 mt-1.5 rounded-full bg-emerald-primary flex-shrink-0" />
                <span><strong className="text-bone">Wafacash</strong> - Réception au Maroc</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 mt-1.5 rounded-full bg-emerald-primary flex-shrink-0" />
                <span><strong className="text-bone">Mobile Money (MoMo)</strong> - Réception au Cameroun</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 mt-1.5 rounded-full bg-emerald-primary flex-shrink-0" />
                <span><strong className="text-bone">PayPal</strong> - Réception en France</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
