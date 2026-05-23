import { Quote, Star } from 'lucide-react';

/**
 * Section Temoignages clients (CCTP §3.1).
 * Les temoignages sont fictifs/representatifs et peuvent etre remplaces
 * a terme par un endpoint API (Settings ou modele dedie).
 */

interface Testimonial {
  name: string;
  role: string;
  corridor: string;
  rating: number;
  text: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Aïcha M.',
    role: 'Cliente France → Gabon',
    corridor: '🇫🇷 → 🇬🇦',
    rating: 5,
    text: "J'envoie de l'argent à ma famille à Libreville chaque mois. Le simulateur est ultra-précis, et le contact WhatsApp est rapide. Frais Airtel Money très clairs.",
  },
  {
    name: 'Mamadou D.',
    role: 'Client Sénégal → France',
    corridor: '🇸🇳 → 🇫🇷',
    rating: 5,
    text: "Service très transparent. Le taux affiché est celui réellement appliqué, pas de surprise. Wave vers PayPal en moins de 24h.",
  },
  {
    name: 'Yacine R.',
    role: 'Client Maroc → France',
    corridor: '🇲🇦 → 🇫🇷',
    rating: 4,
    text: "Pratique et rapide. Le 5 % de frais est annoncé clairement avant l'envoi. Je recommande pour les transferts Wafacash vers PayPal.",
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 bg-dark-800/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-up">
          <h2 className="font-display text-4xl text-bone mb-4">TÉMOIGNAGES CLIENTS</h2>
          <p className="text-ash max-w-2xl mx-auto">
            La confiance de nos utilisateurs à travers la France, le Gabon, le Sénégal et le Maroc.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="glass-card p-6 animate-fade-up flex flex-col"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <Quote size={24} className="text-emerald-primary opacity-60" />
                <span className="text-xs font-mono text-ash">{t.corridor}</span>
              </div>

              <p className="text-ash text-sm leading-relaxed mb-6 flex-1">
                « {t.text} »
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-dark-600/50">
                <div>
                  <p className="text-bone text-sm font-medium">{t.name}</p>
                  <p className="text-ash text-xs">{t.role}</p>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      size={14}
                      className={
                        idx < t.rating
                          ? 'text-emerald-primary fill-emerald-primary'
                          : 'text-dark-500'
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
