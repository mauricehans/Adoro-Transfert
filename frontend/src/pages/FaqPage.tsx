import { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import { getWhatsAppSupportUrl } from '../lib/whatsapp';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqGroup {
  title: string;
  items: FaqItem[];
}

const faqGroups: FaqGroup[] = [
  {
    title: 'General',
    items: [
      {
        question: "Qu'est-ce qu'Adoro Transfert ?",
        answer:
          "Adoro Transfert est un service de simulation et d'envoi d'argent entre la France et plusieurs pays d'Afrique et du Maghreb (Gabon, Cameroun, Senegal, Maroc). Nous vous permettons de simuler votre transfert en ligne puis de finaliser via WhatsApp.",
      },
      {
        question: 'Le site effectue-t-il des transferts reels ?',
        answer:
          "Non. Ce site est un simulateur. Il vous permet de calculer les frais et le montant recu, puis vous redirige vers WhatsApp pour finaliser le transfert avec notre equipe.",
      },
      {
        question: 'Quels sont les corridors disponibles ?',
        answer:
          "Nous proposons des transferts bidirectionnels entre la France et le Gabon, le Cameroun, le Senegal et le Maroc. Soit 8 corridors au total.",
      },
    ],
  },
  {
    title: 'Frais & Tarifs',
    items: [
      {
        question: 'Comment sont calcules les frais ?',
        answer:
          "Les frais dependent du montant envoye et du corridor. Consultez notre page Tarifs pour la grille complete. Le simulateur vous donne le calcul exact en temps reel.",
      },
      {
        question: "Qu'est-ce que les frais Airtel Money ?",
        answer:
          "Pour les retraits via Airtel Money au Gabon, des frais de 3% du montant recu s'appliquent, plafonnes a 5 000 FCFA. Vous pouvez choisir de les inclure dans la simulation.",
      },
      {
        question: 'Quel taux de change appliquez-vous ?',
        answer:
          "Nous utilisons les taux de change en temps reel provenant de sources fiables (BCE, XE). Le taux affiche dans le simulateur est le taux exact qui sera applique.",
      },
    ],
  },
  {
    title: 'Processus',
    items: [
      {
        question: 'Comment fonctionne le processus ?',
        answer:
          "1) Simulez votre transfert sur notre site. 2) Renseignez les informations du beneficiaire. 3) Cliquez sur 'Envoyer via WhatsApp'. 4) Notre equipe confirme et finalise le transfert.",
      },
      {
        question: 'Combien de temps prend un transfert ?',
        answer:
          "Les transferts sont generalement traites sous 24 heures ouvrees apres confirmation du paiement. Certains corridors proposent un traitement express.",
      },
      {
        question: 'Quels moyens de paiement acceptez-vous ?',
        answer:
          "Selon le corridor : virement bancaire, Airtel Money, MTN MoMo, Wave, Wafacash et PayPal. Les options disponibles sont indiquees sur chaque corridor.",
      },
    ],
  },
  {
    title: 'Securite',
    items: [
      {
        question: 'Mes donnees sont-elles securisees ?',
        answer:
          "Oui. Toutes les communications sont chiffrees (HTTPS/WSS). Vos donnees de simulation sont stockees de facon securisee et ne sont jamais partagees avec des tiers.",
      },
      {
        question: 'Comment verifier la legitimite du service ?',
        answer:
          "Vous pouvez nous contacter directement via WhatsApp au +241 74 49 818. Notre equipe est disponible pour repondre a toutes vos questions.",
      },
    ],
  },
];

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
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-up">
          <h1 className="font-display text-5xl text-bone mb-4">FAQ</h1>
          <p className="text-ash text-lg">
            Questions frequentes sur nos services de transfert.
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
          <p className="text-ash mb-4">Vous n'avez pas trouve votre reponse ?</p>
          <a href={getWhatsAppSupportUrl('Bonjour, j\'ai une question concernant vos services.')} target="_blank" rel="noopener noreferrer">
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
