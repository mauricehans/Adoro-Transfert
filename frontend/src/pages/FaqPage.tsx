import { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import { useContactSettings } from '../hooks/useContactSettings';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqGroup {
  title: string;
  items: FaqItem[];
}

/**
 * Formate un numero WhatsApp pour l'affichage lisible.
 * Ex : "2417449818" -> "+241 74 49 818"
 */
function formatWhatsAppNumber(num: string): string {
  if (!num) return '';
  if (num.startsWith('241') && num.length === 10) {
    return `+241 ${num.slice(3, 5)} ${num.slice(5, 7)} ${num.slice(7)}`;
  }
  if (num.startsWith('33') && num.length === 11) {
    return `+33 ${num.slice(2, 3)} ${num.slice(3, 5)} ${num.slice(5, 7)} ${num.slice(7, 9)} ${num.slice(9)}`;
  }
  return `+${num}`;
}

function buildFaqGroups(whatsappNumber: string): FaqGroup[] {
  return [
    {
      title: 'Général',
      items: [
        {
          question: "Qu'est-ce qu'Adoro Transfert ?",
          answer:
            "Adoro Transfert est un service de simulation et d'envoi d'argent entre la France et plusieurs pays d'Afrique et du Maghreb (Gabon, Cameroun, Sénégal, Maroc). Vous simulez votre transfert en ligne puis finalisez via WhatsApp avec notre équipe.",
        },
        {
          question: 'Le site effectue-t-il des transferts réels ?',
          answer:
            "Non. Ce site est un simulateur. Il calcule les frais et le montant reçu, puis vous redirige vers WhatsApp pour finaliser le transfert avec notre équipe — conformément au cahier des charges officiel.",
        },
        {
          question: 'Quels sont les corridors disponibles ?',
          answer:
            "Nous proposons des transferts bidirectionnels entre la France, le Gabon, le Cameroun, le Sénégal et le Maroc. Au total : 14 corridors actifs incluant les liaisons inter-africaines (Gabon ↔ Sénégal, Gabon ↔ Maroc, Sénégal ↔ Maroc).",
        },
      ],
    },
    {
      title: 'Frais & Tarifs',
      items: [
        {
          question: 'Comment sont calculés les frais ?',
          answer:
            "Les frais dépendent du montant envoyé et du corridor. Pour France ↔ Gabon, c'est une grille à paliers détaillée (ANNEXE 1 du cahier des charges). Pour les autres corridors, c'est un pourcentage : 4,5 % pour les corridors africains et 5 % vers/depuis la France. Consultez la page Tarifs pour le détail.",
        },
        {
          question: "Quel est le montant minimum et maximum acceptés ?",
          answer:
            "Pour les transferts en FCFA : de 10 000 à 500 000 FCFA par transaction. Pour les transferts en euros : de 15 € à 760 € par transaction. Au-delà, n'hésitez pas à nous contacter directement.",
        },
        {
          question: "Qu'est-ce que les frais Airtel Money ?",
          answer:
            "Pour les retraits via Airtel Money au Gabon, des frais de 3 % du montant reçu s'appliquent, plafonnés à 5 000 FCFA. Vous pouvez choisir de les inclure dans la simulation via la case dédiée.",
        },
        {
          question: 'Quel taux de change appliquez-vous ?',
          answer:
            "Nous utilisons des taux actualisés en temps réel via des sources fiables (exchangeratesapi.io et frankfurter.app), avec un fallback statique de secours. Le taux affiché dans le simulateur est exactement celui appliqué au transfert.",
        },
      ],
    },
    {
      title: 'Processus',
      items: [
        {
          question: 'Comment fonctionne le processus ?',
          answer:
            "1) Simulez votre transfert sur notre site. 2) Renseignez les informations du bénéficiaire. 3) Cliquez sur 'Envoyer via WhatsApp' — le message pré-rempli contient déjà tous les détails et le moyen de paiement attendu. 4) Notre équipe confirme et finalise le transfert.",
        },
        {
          question: 'Combien de temps prend un transfert ?',
          answer:
            "Les transferts sont généralement traités sous 24 heures ouvrées après confirmation du paiement. Certains corridors proposent un traitement express.",
        },
        {
          question: 'Quels moyens de paiement acceptez-vous ?',
          answer:
            "Selon le corridor : PayPal (depuis/vers la France), Airtel Money (Gabon), Wave (Sénégal), Wafacash (Maroc), MTN Mobile Money (Cameroun). Le moyen exact est indiqué dans le message WhatsApp pré-rempli après simulation.",
        },
      ],
    },
    {
      title: 'Sécurité',
      items: [
        {
          question: 'Mes données sont-elles sécurisées ?',
          answer:
            "Oui. Toutes les communications sont chiffrées (HTTPS/WSS). Les frais sont recalculés côté serveur à chaque transaction pour empêcher toute manipulation. Vos données de simulation sont stockées de façon sécurisée et ne sont jamais partagées avec des tiers.",
        },
        {
          question: 'Comment vérifier la légitimité du service ?',
          answer: `Vous pouvez nous contacter directement via WhatsApp au ${formatWhatsAppNumber(whatsappNumber)}. Notre équipe est disponible pour répondre à toutes vos questions.`,
        },
      ],
    },
  ];
}

function AccordionItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-dark-600/50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <span className="text-bone text-sm group-hover:text-emerald-primary transition-colors pr-4">
          {item.question}
        </span>
        <ChevronDown
          size={18}
          className={`text-ash flex-shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180 text-emerald-primary' : ''
          }`}
        />
      </button>
      {open && (
        <div className="pb-4 animate-fade-up">
          <p className="text-ash text-sm leading-relaxed">{item.answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  const { whatsappNumber } = useContactSettings();
  const faqGroups = buildFaqGroups(whatsappNumber);

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-up">
          <h1 className="font-display text-5xl text-bone mb-4">FAQ</h1>
          <p className="text-ash text-lg">
            Questions fréquentes sur nos services de transfert.
          </p>
        </div>

        {/* FAQ Groups */}
        <div className="space-y-8">
          {faqGroups.map((group, i) => (
            <div key={i} className="glass-card p-6 animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
              <h2 className="font-display text-xl text-emerald-primary mb-4">{group.title}</h2>
              <div>
                {group.items.map((item, j) => (
                  <AccordionItem key={j} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center animate-fade-up">
          <p className="text-ash mb-4">Vous n'avez pas trouvé votre réponse ?</p>
          <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Bonjour, j'ai une question concernant vos services.")}`} target="_blank" rel="noopener noreferrer">
            <Button size="lg">
              <MessageCircle size={18} className="mr-2" />
              Posez votre question sur WhatsApp
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
