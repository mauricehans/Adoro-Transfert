import { SimulationResult } from '../store';

const WHATSAPP_NUMBER = '2417449818';

interface WhatsAppData {
  result: SimulationResult;
  beneficiaryName: string;
  beneficiaryPhone: string;
  beneficiaryEmail?: string;
}

const corridorLabels: Record<string, string> = {
  FR_GA: 'France vers Gabon',
  GA_FR: 'Gabon vers France',
  FR_CM: 'France vers Cameroun',
  CM_FR: 'Cameroun vers France',
  FR_SN: 'France vers Senegal',
  SN_FR: 'Senegal vers France',
  FR_MA: 'France vers Maroc',
  MA_FR: 'Maroc vers France',
};

export function buildWhatsAppUrl(data: WhatsAppData): string {
  const { result, beneficiaryName, beneficiaryPhone, beneficiaryEmail } = data;
  const corridorLabel = corridorLabels[result.corridor] || result.corridor;

  const lines = [
    `Bonjour, je souhaite effectuer un transfert via Adoro Transfert.`,
    ``,
    `--- Details de la simulation ---`,
    `Corridor: ${corridorLabel}`,
    `Montant envoye: ${result.amountSent.toLocaleString('fr-FR')} ${result.currencySent}`,
    `Frais Adoro: ${result.adoroFee.toLocaleString('fr-FR')} ${result.currencySent}`,
    result.airtelFee > 0
      ? `Frais Airtel Money: ${result.airtelFee.toLocaleString('fr-FR')} ${result.currencyReceived}`
      : null,
    `Total a envoyer: ${result.totalToSend.toLocaleString('fr-FR')} ${result.currencySent}`,
    `Beneficiaire recoit: ${result.amountReceived.toLocaleString('fr-FR')} ${result.currencyReceived}`,
    `Taux applique: 1 EUR = ${result.rate.toLocaleString('fr-FR')} XAF`,
    ``,
    `--- Beneficiaire ---`,
    `Nom: ${beneficiaryName}`,
    beneficiaryPhone ? `Telephone: ${beneficiaryPhone}` : null,
    beneficiaryEmail ? `Email: ${beneficiaryEmail}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const encoded = encodeURIComponent(lines);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}

export function getWhatsAppSupportUrl(message?: string): string {
  const text = message || 'Bonjour, je souhaite obtenir des informations sur vos services de transfert.';
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
