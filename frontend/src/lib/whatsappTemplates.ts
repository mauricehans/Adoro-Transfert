/**
 * Templates de messages WhatsApp par corridor.
 * Conformes au CCTP §2.2 à §2.7 : chaque corridor doit citer explicitement
 * les moyens de paiement attendus (PayPal, Airtel Money, Wave, Wafacash, MTN MoMo).
 *
 * Les placeholders {amount_sent}, {currency_sent}, {adoro_fee}, {airtel_fee},
 * {total_to_send}, {amount_received}, {currency_received}, {rate},
 * {beneficiary_name}, {beneficiary_phone}, {beneficiary_email}, {corridor}
 * sont remplaces par buildFromTemplate() dans whatsapp.ts.
 */

interface CorridorTemplate {
  corridor: string;
  paymentFrom: string;
  paymentTo: string;
  template: string;
}

function makeTemplate(opts: {
  fromCountry: string;
  toCountry: string;
  paymentFrom: string;
  paymentTo: string;
  withAirtel?: boolean;
}): string {
  const { fromCountry, toCountry, paymentFrom, paymentTo, withAirtel } = opts;
  const airtelLine = withAirtel
    ? "Frais de retrait Airtel Money : {airtel_fee} {currency_received}\n"
    : '';
  return (
    `Bonjour Adoro Transfert,\n\n` +
    `Je souhaite effectuer un transfert depuis ${fromCountry} vers ${toCountry}.\n\n` +
    `--- Détails de la simulation ---\n` +
    `Corridor : {corridor}\n` +
    `Moyen de paiement (envoi) : ${paymentFrom}\n` +
    `Moyen de réception : ${paymentTo}\n` +
    `Montant envoyé : {amount_sent} {currency_sent}\n` +
    `Frais Adoro : {adoro_fee} {currency_sent}\n` +
    airtelLine +
    `Total à envoyer : {total_to_send} {currency_sent}\n` +
    `Le bénéficiaire reçoit : {amount_received} {currency_received}\n` +
    `Taux appliqué : {rate}\n\n` +
    `--- Bénéficiaire ---\n` +
    `Nom : {beneficiary_name}\n` +
    `Téléphone : {beneficiary_phone}\n` +
    `Email : {beneficiary_email}\n\n` +
    `Merci de me confirmer les instructions de paiement via ${paymentFrom}.`
  );
}

export const CORRIDOR_TEMPLATES: Record<string, CorridorTemplate> = {
  // ---------- §2.2 : France ↔ Gabon ----------
  FR_GA: {
    corridor: 'FR_GA',
    paymentFrom: 'PayPal',
    paymentTo: 'Airtel Money',
    template: makeTemplate({
      fromCountry: 'la France',
      toCountry: 'le Gabon',
      paymentFrom: 'PayPal',
      paymentTo: 'Airtel Money',
      withAirtel: true,
    }),
  },
  GA_FR: {
    corridor: 'GA_FR',
    paymentFrom: 'Airtel Money',
    paymentTo: 'PayPal',
    template: makeTemplate({
      fromCountry: 'le Gabon',
      toCountry: 'la France',
      paymentFrom: 'Airtel Money',
      paymentTo: 'PayPal',
    }),
  },

  // ---------- §2.3 : France ↔ Sénégal ----------
  FR_SN: {
    corridor: 'FR_SN',
    paymentFrom: 'PayPal',
    paymentTo: 'Wave',
    template: makeTemplate({
      fromCountry: 'la France',
      toCountry: 'le Sénégal',
      paymentFrom: 'PayPal',
      paymentTo: 'Wave',
    }),
  },
  SN_FR: {
    corridor: 'SN_FR',
    paymentFrom: 'Wave',
    paymentTo: 'PayPal',
    template: makeTemplate({
      fromCountry: 'le Sénégal',
      toCountry: 'la France',
      paymentFrom: 'Wave',
      paymentTo: 'PayPal',
    }),
  },

  // ---------- §2.4 : France ↔ Maroc ----------
  FR_MA: {
    corridor: 'FR_MA',
    paymentFrom: 'PayPal',
    paymentTo: 'Wafacash',
    template: makeTemplate({
      fromCountry: 'la France',
      toCountry: 'le Maroc',
      paymentFrom: 'PayPal',
      paymentTo: 'Wafacash',
    }),
  },
  MA_FR: {
    corridor: 'MA_FR',
    paymentFrom: 'Wafacash',
    paymentTo: 'PayPal',
    template: makeTemplate({
      fromCountry: 'le Maroc',
      toCountry: 'la France',
      paymentFrom: 'Wafacash',
      paymentTo: 'PayPal',
    }),
  },

  // ---------- §2.5 : Gabon ↔ Sénégal ----------
  GA_SN: {
    corridor: 'GA_SN',
    paymentFrom: 'Airtel Money',
    paymentTo: 'Wave',
    template: makeTemplate({
      fromCountry: 'le Gabon',
      toCountry: 'le Sénégal',
      paymentFrom: 'Airtel Money',
      paymentTo: 'Wave',
    }),
  },
  SN_GA: {
    corridor: 'SN_GA',
    paymentFrom: 'Wave',
    paymentTo: 'Airtel Money',
    template: makeTemplate({
      fromCountry: 'le Sénégal',
      toCountry: 'le Gabon',
      paymentFrom: 'Wave',
      paymentTo: 'Airtel Money',
      withAirtel: true,
    }),
  },

  // ---------- §2.6 : Gabon ↔ Maroc ----------
  GA_MA: {
    corridor: 'GA_MA',
    paymentFrom: 'Airtel Money',
    paymentTo: 'Wafacash',
    template: makeTemplate({
      fromCountry: 'le Gabon',
      toCountry: 'le Maroc',
      paymentFrom: 'Airtel Money',
      paymentTo: 'Wafacash',
    }),
  },
  MA_GA: {
    corridor: 'MA_GA',
    paymentFrom: 'Wafacash',
    paymentTo: 'Airtel Money',
    template: makeTemplate({
      fromCountry: 'le Maroc',
      toCountry: 'le Gabon',
      paymentFrom: 'Wafacash',
      paymentTo: 'Airtel Money',
      withAirtel: true,
    }),
  },

  // ---------- §2.7 : Sénégal ↔ Maroc ----------
  SN_MA: {
    corridor: 'SN_MA',
    paymentFrom: 'Wave',
    paymentTo: 'Wafacash',
    template: makeTemplate({
      fromCountry: 'le Sénégal',
      toCountry: 'le Maroc',
      paymentFrom: 'Wave',
      paymentTo: 'Wafacash',
    }),
  },
  MA_SN: {
    corridor: 'MA_SN',
    paymentFrom: 'Wafacash',
    paymentTo: 'Wave',
    template: makeTemplate({
      fromCountry: 'le Maroc',
      toCountry: 'le Sénégal',
      paymentFrom: 'Wafacash',
      paymentTo: 'Wave',
    }),
  },

  // ---------- Cameroun (non spécifié au CCTP, conservé par cohérence) ----------
  FR_CM: {
    corridor: 'FR_CM',
    paymentFrom: 'PayPal',
    paymentTo: 'MTN Mobile Money',
    template: makeTemplate({
      fromCountry: 'la France',
      toCountry: 'le Cameroun',
      paymentFrom: 'PayPal',
      paymentTo: 'MTN Mobile Money',
    }),
  },
  CM_FR: {
    corridor: 'CM_FR',
    paymentFrom: 'MTN Mobile Money',
    paymentTo: 'PayPal',
    template: makeTemplate({
      fromCountry: 'le Cameroun',
      toCountry: 'la France',
      paymentFrom: 'MTN Mobile Money',
      paymentTo: 'PayPal',
    }),
  },
};

/**
 * Récupère le template spécifique pour un corridor donné.
 * Retourne `null` si aucun template spécifique n'existe (fallback générique).
 */
export function getCorridorTemplate(corridorKey: string): string | null {
  return CORRIDOR_TEMPLATES[corridorKey]?.template || null;
}
