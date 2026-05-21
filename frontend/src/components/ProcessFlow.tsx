import { Calculator, UserCheck, MessageCircle, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: Calculator,
    title: 'Simulez',
    description: 'Choisissez votre corridor et entrez le montant a envoyer.',
  },
  {
    icon: UserCheck,
    title: 'Renseignez',
    description: 'Indiquez les informations du beneficiaire.',
  },
  {
    icon: MessageCircle,
    title: 'Contactez',
    description: 'Envoyez votre simulation via WhatsApp en un clic.',
  },
  {
    icon: CheckCircle,
    title: 'Confirmez',
    description: 'Notre equipe finalise le transfert et vous confirme.',
  },
];

export default function ProcessFlow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {steps.map((step, i) => (
        <div key={i} className="relative group">
          {/* Connector line */}
          {i < steps.length - 1 && (
            <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-emerald-primary/30 to-transparent" />
          )}

          <div className="flex flex-col items-center text-center">
            {/* Step number */}
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-2xl bg-dark-700 border border-emerald-primary/20 flex items-center justify-center group-hover:border-emerald-primary/50 group-hover:shadow-lg group-hover:shadow-emerald-primary/10 transition-all duration-300">
                <step.icon size={24} className="text-emerald-primary" />
              </div>
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-primary text-dark-900 text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
            </div>

            <h3 className="font-display text-lg text-bone mb-2">{step.title}</h3>
            <p className="text-ash text-sm leading-relaxed">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
