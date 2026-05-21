import { SimulationResult } from '../store';
import api from './api';

let cachedWhatsAppNumber: string | null = null;

export async function getWhatsAppNumber(): Promise<string> {
  if (cachedWhatsAppNumber) return cachedWhatsAppNumber;
  try {
    const { data } = await api.get('/settings/public/');
    const setting = data.find((s: { key: string; value: any }) => s.key === 'whatsapp_number');
    if (setting?.value?.number) {
      cachedWhatsAppNumber = setting.value.number;
      return cachedWhatsAppNumber!;
    }
  } catch {
    // fallback
  }
  return '2417449818';
}

export async function getNotificationEmail(): Promise<string> {
  try {
    const { data } = await api.get('/settings/public/');
    const setting = data.find((s: { key: string; value: any }) => s.key === 'notification_email');
    if (setting?.value?.email) return setting.value.email;
  } catch {
    // fallback
  }
  return 'AdoroTransfert@gmail.com';
}

export function invalidateWhatsAppCache(): void {
  cachedWhatsAppNumber = null;
}

interface WhatsAppData {
  result: SimulationResult;
  beneficiaryName: string;
  beneficiaryPhone: string;
  beneficiaryEmail?: string;
  whatsappNumber?: string;
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
  const { result, beneficiaryName, beneficiaryPhone, beneficiaryEmail, whatsappNumber } = data;
  const number = whatsappNumber || '2417449818';
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
  return `https://wa.me/${number}?text=${encoded}`;
}

export async function getWhatsAppSupportUrl(message?: string): Promise<string> {
  const number = await getWhatsAppNumber();
  const text = message || 'Bonjour, je souhaite obtenir des informations sur vos services de transfert.';
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
