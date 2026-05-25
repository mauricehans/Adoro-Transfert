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
  withPhone?: boolean;
  withEmail?: boolean;
}): string {
  const { fromCountry, toCountry, paymentFrom, paymentTo, withAirtel, withPhone, withEmail } = opts;

  const airtelLine = withAirtel
    ? `Frais de retrait Airtel Money : {airtel_fee} {currency_received}\n`
    : '';
  const phoneLine = withPhone ? `Téléphone : {beneficiary_phone}\n` : '';
  const emailLine = withEmail ? `Email PayPal : {beneficiary_email}\n` : '';

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
    phoneLine +
    emailLine +
    `Merci de me confirmer les instructions de paiement via ${paymentFrom}.`
  );
}

export const CORRIDOR_TEMPLATES: Record<string, CorridorTemplate> = {
  // France → Gabon (PayPal → Airtel Money) : téléphone requis
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
      withPhone: true,
    }),
  },

  // Gabon → France (Airtel Money → PayPal) : email requis
  GA_FR: {
    corridor: 'GA_FR',
    paymentFrom: 'Airtel Money',
    paymentTo: 'PayPal',
    template: makeTemplate({
      fromCountry: 'le Gabon',
      toCountry: 'la France',
      paymentFrom: 'Airtel Money',
      paymentTo: 'PayPal',
      withEmail: true,
    }),
  },

  // France → Sénégal (PayPal → Wave) : téléphone requis
  FR_SN: {
    corridor: 'FR_SN',
    paymentFrom: 'PayPal',
    paymentTo: 'Wave',
    template: makeTemplate({
      fromCountry: 'la France',
      toCountry: 'le Sénégal',
      paymentFrom: 'PayPal',
      paymentTo: 'Wave',
      withPhone: true,
    }),
  },

  // Sénégal → France (Wave → PayPal) : email requis
  SN_FR: {
    corridor: 'SN_FR',
    paymentFrom: 'Wave',
    paymentTo: 'PayPal',
    template: makeTemplate({
      fromCountry: 'le Sénégal',
      toCountry: 'la France',
      paymentFrom: 'Wave',
      paymentTo: 'PayPal',
      withEmail: true,
    }),
  },

  // France → Maroc (PayPal → Wafacash) : téléphone requis
  FR_MA: {
    corridor: 'FR_MA',
    paymentFrom: 'PayPal',
    paymentTo: 'Wafacash',
    template: makeTemplate({
      fromCountry: 'la France',
      toCountry: 'le Maroc',
      paymentFrom: 'PayPal',
      paymentTo: 'Wafacash',
      withPhone: true,
    }),
  },

  // Maroc → France (Wafacash → PayPal) : email requis
  MA_FR: {
    corridor: 'MA_FR',
    paymentFrom: 'Wafacash',
    paymentTo: 'PayPal',
    template: makeTemplate({
      fromCountry: 'le Maroc',
      toCountry: 'la France',
      paymentFrom: 'Wafacash',
      paymentTo: 'PayPal',
      withEmail: true,
    }),
  },

  // Gabon → Sénégal (Airtel Money → Wave) : téléphone requis
  GA_SN: {
    corridor: 'GA_SN',
    paymentFrom: 'Airtel Money',
    paymentTo: 'Wave',
    template: makeTemplate({
      fromCountry: 'le Gabon',
      toCountry: 'le Sénégal',
      paymentFrom: 'Airtel Money',
      paymentTo: 'Wave',
      withPhone: true,
    }),
  },

  // Sénégal → Gabon (Wave → Airtel Money) : téléphone requis
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
      withPhone: true,
    }),
  },

  // Gabon → Maroc (Airtel Money → Wafacash) : téléphone requis
  GA_MA: {
    corridor: 'GA_MA',
    paymentFrom: 'Airtel Money',
    paymentTo: 'Wafacash',
    template: makeTemplate({
      fromCountry: 'le Gabon',
      toCountry: 'le Maroc',
      paymentFrom: 'Airtel Money',
      paymentTo: 'Wafacash',
      withPhone: true,
    }),
  },

  // Maroc → Gabon (Wafacash → Airtel Money) : téléphone requis
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
      withPhone: true,
    }),
  },

  // Sénégal → Maroc (Wave → Wafacash) : téléphone requis
  SN_MA: {
    corridor: 'SN_MA',
    paymentFrom: 'Wave',
    paymentTo: 'Wafacash',
    template: makeTemplate({
      fromCountry: 'le Sénégal',
      toCountry: 'le Maroc',
      paymentFrom: 'Wave',
      paymentTo: 'Wafacash',
      withPhone: true,
    }),
  },

  // Maroc → Sénégal (Wafacash → Wave) : téléphone requis
  MA_SN: {
    corridor: 'MA_SN',
    paymentFrom: 'Wafacash',
    paymentTo: 'Wave',
    template: makeTemplate({
      fromCountry: 'le Maroc',
      toCountry: 'le Sénégal',
      paymentFrom: 'Wafacash',
      paymentTo: 'Wave',
      withPhone: true,
    }),
  },

  // France → Cameroun (PayPal → MTN MoMo) : téléphone requis
  FR_CM: {
    corridor: 'FR_CM',
    paymentFrom: 'PayPal',
    paymentTo: 'MTN Mobile Money',
    template: makeTemplate({
      fromCountry: 'la France',
      toCountry: 'le Cameroun',
      paymentFrom: 'PayPal',
      paymentTo: 'MTN Mobile Money',
      withPhone: true,
    }),
  },

  // Cameroun → France (MTN MoMo → PayPal) : email requis
  CM_FR: {
    corridor: 'CM_FR',
    paymentFrom: 'MTN Mobile Money',
    paymentTo: 'PayPal',
    template: makeTemplate({
      fromCountry: 'le Cameroun',
      toCountry: 'la France',
      paymentFrom: 'MTN Mobile Money',
      paymentTo: 'PayPal',
      withEmail: true,
    }),
  },
};

export function getCorridorTemplate(corridorKey: string): string | null {
  return CORRIDOR_TEMPLATES[corridorKey]?.template || null;
}
