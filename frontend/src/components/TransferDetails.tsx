import { Info } from 'lucide-react';

interface Props {
  corridor: string;
}

const corridorData: Record<string, any> = {
  FR_GA: { sender: 'France', receiver: 'Gabon', sendMethod: 'PayPal', receiveMethod: 'Airtel Money', prepS: 'en ', prepR: 'au ' },
  GA_FR: {
    sender: 'Gabon', receiver: 'France', sendMethod: 'Airtel Money', receiveMethod: 'PayPal', prepS: 'au ', prepR: 'en ',
    customAdvantages: [
      { title: "Facilité d'utilisation", desc: "Airtel Money est accessible même sans compte bancaire." },
      { title: "Transfert international direct", desc: "Pas besoin d'intermédiaires complexes." },
      { title: "Taux compétitifs", desc: "Conversion automatique des devises à des taux souvent avantageux." },
      { title: "Grande couverture", desc: "Airtel Money est largement disponible au Gabon, et PayPal est accepté dans le monde entier." },
      { title: "Flexibilité", desc: "Le bénéficiaire peut utiliser les fonds reçus directement pour des achats en ligne ou des retraits via PayPal." }
    ]
  },
  SN_GA: { sender: 'Sénégal', receiver: 'Gabon', sendMethod: 'Wave', receiveMethod: 'Airtel Money', prepS: 'au ', prepR: 'au ' },
  GA_SN: { sender: 'Gabon', receiver: 'Sénégal', sendMethod: 'Airtel Money', receiveMethod: 'Wave', prepS: 'au ', prepR: 'au ' },
  SN_FR: { sender: 'Sénégal', receiver: 'France', sendMethod: 'Wave', receiveMethod: 'PayPal', prepS: 'au ', prepR: 'en ' },
  FR_SN: { sender: 'France', receiver: 'Sénégal', sendMethod: 'PayPal', receiveMethod: 'Wave', prepS: 'en ', prepR: 'au ' },
  MA_GA: { sender: 'Maroc', receiver: 'Gabon', sendMethod: 'Wafacash', receiveMethod: 'Airtel Money', prepS: 'au ', prepR: 'au ' },
  GA_MA: { sender: 'Gabon', receiver: 'Maroc', sendMethod: 'Airtel Money', receiveMethod: 'Wafacash', prepS: 'au ', prepR: 'au ' },
  MA_SN: { sender: 'Maroc', receiver: 'Sénégal', sendMethod: 'Wafacash', receiveMethod: 'Wave', prepS: 'au ', prepR: 'au ' },
  SN_MA: { sender: 'Sénégal', receiver: 'Maroc', sendMethod: 'Wave', receiveMethod: 'Wafacash', prepS: 'au ', prepR: 'au ' },
  FR_CM: { sender: 'France', receiver: 'Cameroun', sendMethod: 'PayPal', receiveMethod: 'Mobile Money', prepS: 'en ', prepR: 'au ' },
  CM_FR: { sender: 'Cameroun', receiver: 'France', sendMethod: 'Mobile Money', receiveMethod: 'PayPal', prepS: 'au ', prepR: 'en ' },
  FR_MA: { sender: 'France', receiver: 'Maroc', sendMethod: 'PayPal', receiveMethod: 'Wafacash', prepS: 'en ', prepR: 'au ' },
  MA_FR: { sender: 'Maroc', receiver: 'France', sendMethod: 'Wafacash', receiveMethod: 'PayPal', prepS: 'au ', prepR: 'en ' },
};

export default function TransferDetails({ corridor }: Props) {
  const data = corridorData[corridor];
  if (!data) return null;

  const { sender, receiver, sendMethod, receiveMethod, prepS, prepR, customAdvantages } = data;

  const advantages = customAdvantages || [
    { title: 'Rapidité', desc: 'Le transfert est traité rapidement, souvent en quelques minutes.' },
    { title: 'Sécurité', desc: `${sendMethod === 'PayPal' ? 'PayPal offre' : 'La plateforme offre'} une plateforme sécurisée pour les paiements en ligne.` },
    { title: 'Accessibilité', desc: receiveMethod === 'PayPal' ? `Le bénéficiaire peut utiliser les fonds reçus directement pour des achats en ligne ou des retraits via PayPal.` : `Le bénéficiaire reçoit directement les fonds sur son compte ${receiveMethod} sans avoir besoin d'un compte bancaire.` },
    { title: 'Traçabilité', desc: 'Vous recevez une confirmation du transfert, garantissant que les fonds ont bien été envoyés.' }
  ];

  return (
    <div className="mt-10 pt-8 border-t border-dark-600 text-left animate-fade-in">
      <h3 className="font-display text-xl text-emerald-primary mb-4 flex items-center gap-2">
        <Info size={22} />
        Transfert {sender} → {receiver} via {sendMethod} pour {receiveMethod}
      </h3>
      <p className="text-sm text-ash mb-6 leading-relaxed">
        Ce mode de transfert permet à un expéditeur basé {prepS}<strong className="text-bone">{sender}</strong> d'envoyer de l'argent via <strong className="text-bone">{sendMethod}</strong> à un bénéficiaire {prepR}<strong className="text-bone">{receiver}</strong>, qui recevra les fonds sur son compte <strong className="text-bone">{receiveMethod}</strong>.
      </p>

      <div className="space-y-4 text-sm">
        <div className="bg-dark-800/50 p-5 rounded-xl border border-dark-600">
          <h4 className="font-bold text-bone mb-3">1. Pour l'expéditeur {prepS}{sender} :</h4>
          <ul className="space-y-2 text-ash">
            {sendMethod === 'PayPal' ? (
              <>
                <li className="flex gap-2"><span className="text-emerald-primary">✓</span> Connectez-vous à votre compte PayPal.</li>
                <li className="flex gap-2"><span className="text-emerald-primary">✓</span> <span>Indiquez le montant que vous souhaitez transférer et renseignez l'adresse e-mail <strong className="text-emerald-light">AdoroTransfert@gmail.com</strong></span></li>
                <li className="flex gap-2"><span className="text-emerald-primary">✓</span> Effectuez le paiement via PayPal.</li>
              </>
            ) : sendMethod === 'Wafacash' ? (
              <>
                <li className="flex gap-2"><span className="text-emerald-primary">✓</span> Rendez-vous dans une agence Wafacash.</li>
                <li className="flex gap-2"><span className="text-emerald-primary">✓</span> Effectuez le transfert en fournissant le montant à envoyer et les informations du bénéficiaire.</li>
              </>
            ) : (
              <>
                <li className="flex gap-2"><span className="text-emerald-primary">✓</span> Chargez votre compte {sendMethod} avec le montant souhaité.</li>
                <li className="flex gap-2"><span className="text-emerald-primary">✓</span> <span>Effectuez le transfert en fournissant :<br/>
                  <span className="block ml-4 mt-1">- Le montant à envoyer.</span>
                  <span className="block ml-4">- {receiveMethod === 'PayPal' ? `L'adresse e-mail PayPal du bénéficiaire ${prepR}${receiver}.` : `Les coordonnées du bénéficiaire ${prepR}${receiver}.`}</span>
                </span></li>
              </>
            )}
          </ul>
        </div>

        <div className="bg-dark-800/50 p-5 rounded-xl border border-dark-600">
          <h4 className="font-bold text-bone mb-3">2. Pour le bénéficiaire {prepR}{receiver} :</h4>
          <ul className="space-y-2 text-ash">
            <li className="flex gap-2"><span className="text-emerald-primary">✓</span> <span>Les fonds {receiveMethod === 'PayPal' ? 'envoyés' : 'transférés'} sont convertis et crédités sur le compte {receiveMethod} du bénéficiaire{receiveMethod === 'PayPal' ? '' : ','} après déduction des frais.</span></li>
            <li className="flex gap-2"><span className="text-emerald-primary">✓</span> {receiveMethod === 'PayPal' ? 'Une notification PayPal est envoyée au bénéficiaire dès que les fonds sont disponibles.' : `Le bénéficiaire reçoit une notification ${receiveMethod} confirmant la réception des fonds.`}</li>
          </ul>
        </div>

        <div className="bg-dark-800/50 p-5 rounded-xl border border-dark-600">
          <h4 className="font-bold text-bone mb-3">Avantages :</h4>
          <ul className="space-y-3 text-ash">
            {advantages.map((adv: any, idx: number) => (
              <li key={idx}>
                <strong className="text-bone block mb-0.5">{adv.title} :</strong> {adv.desc}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}