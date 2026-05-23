import { ArrowRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Simulator from '../components/Simulator';
import ProcessFlow from '../components/ProcessFlow';
import CorridorCard from '../components/CorridorCard';
import Testimonials from '../components/Testimonials';
import Button from '../components/ui/Button';
import { useContactSettings } from '../hooks/useContactSettings';

const corridorsPreview = [
  { from: 'France', to: 'Gabon', fromFlag: '\u{1F1EB}\u{1F1F7}', toFlag: '\u{1F1EC}\u{1F1E6}', currencyFrom: 'EUR', currencyTo: 'XAF', methods: ['airtel', 'bank'] },
  { from: 'Gabon', to: 'France', fromFlag: '\u{1F1EC}\u{1F1E6}', toFlag: '\u{1F1EB}\u{1F1F7}', currencyFrom: 'XAF', currencyTo: 'EUR', methods: ['airtel', 'bank'] },
  { from: 'France', to: 'Cameroun', fromFlag: '\u{1F1EB}\u{1F1F7}', toFlag: '\u{1F1E8}\u{1F1F2}', currencyFrom: 'EUR', currencyTo: 'XAF', methods: ['momo', 'bank'] },
  { from: 'Cameroun', to: 'France', fromFlag: '\u{1F1E8}\u{1F1F2}', toFlag: '\u{1F1EB}\u{1F1F7}', currencyFrom: 'XAF', currencyTo: 'EUR', methods: ['momo', 'bank'] },
  { from: 'France', to: 'Senegal', fromFlag: '\u{1F1EB}\u{1F1F7}', toFlag: '\u{1F1F8}\u{1F1F3}', currencyFrom: 'EUR', currencyTo: 'XOF', methods: ['wave', 'bank'] },
  { from: 'Senegal', to: 'France', fromFlag: '\u{1F1F8}\u{1F1F3}', toFlag: '\u{1F1EB}\u{1F1F7}', currencyFrom: 'XOF', currencyTo: 'EUR', methods: ['wave', 'bank'] },
  { from: 'France', to: 'Maroc', fromFlag: '\u{1F1EB}\u{1F1F7}', toFlag: '\u{1F1F2}\u{1F1E6}', currencyFrom: 'EUR', currencyTo: 'MAD', methods: ['wafacash', 'paypal'] },
  { from: 'Maroc', to: 'France', fromFlag: '\u{1F1F2}\u{1F1E6}', toFlag: '\u{1F1EB}\u{1F1F7}', currencyFrom: 'MAD', currencyTo: 'EUR', methods: ['wafacash', 'paypal'] },
];

export default function HomePage() {
  const { whatsappNumber } = useContactSettings();

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 grid-bg" />
        {/* Glow */}
        <div className="absolute inset-0 hero-glow" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <div className="animate-fade-up">
            <h1 className="font-display text-5xl md:text-7xl text-bone leading-tight mb-6">
              TRANSFERTS<br />
              <span className="text-gradient">SIMPLES & RAPIDES</span>
            </h1>
            <p className="text-ash text-lg md:text-xl leading-relaxed mb-8 max-w-lg">
              Simulez vos transferts d'argent entre la France, le Gabon, le Cameroun, le Senegal et le Maroc. Taux en temps reel, frais transparents.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/services">
                <Button size="lg">
                  Nos corridors
                  <ArrowRight size={18} className="ml-2" />
                </Button>
              </Link>
              <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="lg">
                  <MessageCircle size={18} className="mr-2" />
                  Nous contacter
                </Button>
              </a>
            </div>
          </div>

          {/* Right: Simulator */}
          <div className="animate-fade-up animate-delay-200">
            <Simulator />
          </div>
        </div>
      </section>

      {/* Process Flow */}
      <section className="py-20 bg-dark-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-up">
            <h2 className="font-display text-4xl text-bone mb-4">COMMENT CA MARCHE</h2>
            <p className="text-ash max-w-2xl mx-auto">
              En 4 etapes simples, simulez votre transfert et contactez-nous pour finaliser.
            </p>
          </div>
          <ProcessFlow />
        </div>
      </section>

      {/* Corridors Preview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-up">
            <h2 className="font-display text-4xl text-bone mb-4">NOS CORRIDORS</h2>
            <p className="text-ash max-w-2xl mx-auto">
              Transferts bidirectionnels entre la France et l'Afrique/Maghreb.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {corridorsPreview.slice(0, 4).map((c, i) => (
              <div key={i} className="animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                <CorridorCard {...c} />
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/services">
              <Button variant="secondary">
                Voir tous les corridors
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials (CCTP §3.1) */}
      <Testimonials />

      {/* CTA */}
      <section className="py-20 bg-dark-800/50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="glass-card p-10 glow-border">
            <h2 className="font-display text-3xl md:text-4xl text-bone mb-4">
              PRET A ENVOYER ?
            </h2>
            <p className="text-ash mb-8 max-w-lg mx-auto">
              Utilisez notre simulateur ci-dessus ou contactez-nous directement sur WhatsApp pour effectuer votre transfert.
            </p>
            <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer">
              <Button size="lg">
                <MessageCircle size={18} className="mr-2" />
                Contacter via WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
