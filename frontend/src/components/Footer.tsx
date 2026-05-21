import { Link } from 'react-router-dom';
import { Zap, MessageCircle, Mail, Phone } from 'lucide-react';
import { getWhatsAppSupportUrl } from '../lib/whatsapp';

export default function Footer() {
  return (
    <footer className="bg-dark-800 border-t border-emerald-primary/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-primary/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-emerald-primary" />
              </div>
              <span className="font-display text-xl text-bone tracking-wide">
                ADORO<span className="text-emerald-primary">TRANSFERT</span>
              </span>
            </Link>
            <p className="text-ash text-sm leading-relaxed">
              Simulateur de transfert d'argent entre la France, l'Afrique et le Maghreb. Rapide, transparent, fiable.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-emerald-primary mb-4">
              Navigation
            </h4>
            <ul className="space-y-2">
              {['Accueil', 'Services', 'Tarifs', 'FAQ', 'Contact'].map((item) => (
                <li key={item}>
                  <Link
                    to={item === 'Accueil' ? '/' : `/${item.toLowerCase()}`}
                    className="text-ash text-sm hover:text-bone transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Corridors */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-emerald-primary mb-4">
              Corridors
            </h4>
            <ul className="space-y-2 text-ash text-sm">
              <li>France - Gabon</li>
              <li>France - Cameroun</li>
              <li>France - Senegal</li>
              <li>France - Maroc</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-emerald-primary mb-4">
              Contact
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href={getWhatsAppSupportUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-ash text-sm hover:text-bone transition-colors"
                >
                  <MessageCircle size={16} className="text-emerald-primary" />
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href="mailto:contact@adoro-transfert.com"
                  className="flex items-center gap-2 text-ash text-sm hover:text-bone transition-colors"
                >
                  <Mail size={16} className="text-emerald-primary" />
                  contact@adoro-transfert.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+2417449818"
                  className="flex items-center gap-2 text-ash text-sm hover:text-bone transition-colors"
                >
                  <Phone size={16} className="text-emerald-primary" />
                  +241 74 49 818
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-dark-600 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-ash text-xs">
            &copy; {new Date().getFullYear()} Adoro Transfert. Tous droits reserves. Simulateur uniquement.
          </p>
          <p className="text-ash/50 text-xs">
            Aucun transfert reel n'est effectue via ce site.
          </p>
        </div>
      </div>
    </footer>
  );
}
