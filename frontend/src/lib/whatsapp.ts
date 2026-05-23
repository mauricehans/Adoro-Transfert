import { SimulationResult } from '../store';
import api from './api';
import { getCorridorTemplate } from './whatsappTemplates';

let cachedWhatsAppNumber: string | null = null;
let cachedTemplate: string | null = null;

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

export async function getWhatsAppTemplate(): Promise<string | null> {
  if (cachedTemplate) return cachedTemplate;
  try {
    const { data } = await api.get('/settings/public/');
    const setting = data.find((s: { key: string; value: any }) => s.key === 'whatsapp_template');
    const tpl = setting?.value?.template;
    // Si vide => null, pour laisser la priorité au template corridor
    if (tpl && tpl.trim().length > 0) {
      cachedTemplate = tpl;
      return cachedTemplate;
    }
  } catch {
    // fallback
  }
  return null;
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
  cachedTemplate = null;
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

interface WhatsAppData {
  result: SimulationResult;
  beneficiaryName: string;
  beneficiaryPhone: string;
  beneficiaryEmail?: string;
  whatsappNumber: string;
  template: string | null;
}

function buildFromTemplate(template: string, data: WhatsAppData): string {
  const { result, beneficiaryName, beneficiaryPhone, beneficiaryEmail } = data;
  return template
    .replace(/{corridor}/g, corridorLabels[result.corridor] || result.corridor)
    .replace(/{amount_sent}/g, Number(result.amountSent).toLocaleString('fr-FR'))
    .replace(/{currency_sent}/g, result.currencySent)
    .replace(/{adoro_fee}/g, Number(result.adoroFee).toLocaleString('fr-FR'))
    .replace(/{airtel_fee}/g, Number(result.airtelFee).toLocaleString('fr-FR'))
    .replace(/{total_to_send}/g, Number(result.totalToSend).toLocaleString('fr-FR'))
    .replace(/{amount_received}/g, Number(result.amountReceived).toLocaleString('fr-FR'))
    .replace(/{currency_received}/g, result.currencyReceived)
    .replace(/{rate}/g, `1 ${result.currencySent} = ${Number(result.rate).toLocaleString('fr-FR')} ${result.currencyReceived}`)
    .replace(/{beneficiary_name}/g, beneficiaryName)
    .replace(/{beneficiary_phone}/g, beneficiaryPhone || '')
    .replace(/{beneficiary_email}/g, beneficiaryEmail || '');
}

function buildDefault(data: WhatsAppData): string {
  const { result, beneficiaryName, beneficiaryPhone, beneficiaryEmail } = data;
  const corridorLabel = corridorLabels[result.corridor] || result.corridor;

  const lines = [
    `Bonjour, je souhaite effectuer un transfert via Adoro Transfert.`,
    ``,
    `--- Details de la simulation ---`,
    `Corridor: ${corridorLabel}`,
    `Montant envoye: ${Number(result.amountSent).toLocaleString('fr-FR')} ${result.currencySent}`,
    `Frais Adoro: ${Number(result.adoroFee).toLocaleString('fr-FR')} ${result.currencySent}`,
    Number(result.airtelFee) > 0
      ? `Frais Airtel Money: ${Number(result.airtelFee).toLocaleString('fr-FR')} ${result.currencyReceived}`
      : null,
    `Total a envoyer: ${Number(result.totalToSend).toLocaleString('fr-FR')} ${result.currencySent}`,
    `Beneficiaire recoit: ${Number(result.amountReceived).toLocaleString('fr-FR')} ${result.currencyReceived}`,
    `Taux applique: 1 ${result.currencySent} = ${Number(result.rate).toLocaleString('fr-FR')} ${result.currencyReceived}`,
    ``,
    `--- Beneficiaire ---`,
    `Nom: ${beneficiaryName}`,
    beneficiaryPhone ? `Telephone: ${beneficiaryPhone}` : null,
    beneficiaryEmail ? `Email: ${beneficiaryEmail}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return lines;
}

export function buildWhatsAppUrl(data: WhatsAppData): string {
  const { whatsappNumber, template, result } = data;

  // Priorité :
  // 1. Template BDD admin (si configuré via Settings)
  // 2. Template spécifique au corridor (CCTP §2.2 à §2.7)
  // 3. Template générique de secours
  const corridorTemplate = getCorridorTemplate(result.corridor);
  const finalTemplate = template || corridorTemplate;

  const message = finalTemplate
    ? buildFromTemplate(finalTemplate, data)
    : buildDefault(data);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${whatsappNumber}?text=${encoded}`;
}

export async function getWhatsAppSupportUrl(message?: string): Promise<string> {
  const number = await getWhatsAppNumber();
  const text = message || 'Bonjour, je souhaite obtenir des informations sur vos services de transfert.';
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
