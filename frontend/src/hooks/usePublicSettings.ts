import { useState, useEffect } from 'react';
import api from '../lib/api';

/**
 * Hook centralise qui charge TOUS les settings publics depuis l'API
 * et expose un acces typé aux principales clés utilisees dans le frontend.
 *
 * La requete est mise en cache au niveau module pour eviter de re-fetcher
 * a chaque montage de composant.
 */

export interface TariffTier {
  min: number;
  max: number | null;
  fee: number;
}

export interface AmountLimits {
  [currency: string]: { min: number; max: number };
}

export interface BusinessAddress {
  city: string;
  country: string;
  full?: string;
}

export interface BusinessHours {
  weekdays: string;
  saturday: string;
  sunday: string;
  timezone?: string;
  note?: string;
}

export interface PublicSettingsData {
  whatsappNumber: string;
  notificationEmail: string;
  eurTariffs: TariffTier[];
  fcfaTariffs: TariffTier[];
  madTariffs: TariffTier[];
  amountLimits: AmountLimits;
  activeCurrencies: string[];
  address: BusinessAddress;
  hours: BusinessHours;
  loading: boolean;
}

const DEFAULTS: Omit<PublicSettingsData, 'loading'> = {
  whatsappNumber: '2417449818',
  notificationEmail: 'AdoroTransfert@gmail.com',
  eurTariffs: [],
  fcfaTariffs: [],
  madTariffs: [],
  amountLimits: {
    EUR: { min: 15, max: 1000 },
    XAF: { min: 10000, max: 1000000 },
    XOF: { min: 10000, max: 1000000 },
    MAD: { min: 150, max: 10000 },
    USD: { min: 15, max: 1000 },
  },
  activeCurrencies: ['EUR', 'XAF', 'XOF', 'MAD', 'USD'],
  address: { city: 'Libreville', country: 'Gabon' },
  hours: {
    weekdays: '08:00 - 20:00',
    saturday: '09:00 - 17:00',
    sunday: 'Ferme',
    timezone: 'Heures de Libreville (UTC+1). WhatsApp disponible 7j/7.',
  },
};

let cachedData: Omit<PublicSettingsData, 'loading'> | null = null;
let pendingPromise: Promise<Omit<PublicSettingsData, 'loading'>> | null = null;

async function fetchAllSettings(): Promise<Omit<PublicSettingsData, 'loading'>> {
  if (cachedData) return cachedData;
  if (pendingPromise) return pendingPromise;

  pendingPromise = (async () => {
    try {
      const { data } = await api.get('/settings/public/');
      const get = (key: string) =>
        data.find((s: { key: string }) => s.key === key)?.value;

      const result: Omit<PublicSettingsData, 'loading'> = {
        whatsappNumber: get('whatsapp_number')?.number || DEFAULTS.whatsappNumber,
        notificationEmail: get('notification_email')?.email || DEFAULTS.notificationEmail,
        eurTariffs: get('eur_tariffs')?.tariffs || DEFAULTS.eurTariffs,
        fcfaTariffs: get('fcfa_tariffs')?.tariffs || DEFAULTS.fcfaTariffs,
        madTariffs: get('mad_tariffs')?.tariffs || DEFAULTS.madTariffs,
        amountLimits: get('amount_limits')?.limits || DEFAULTS.amountLimits,
        activeCurrencies: get('active_currencies')?.currencies || DEFAULTS.activeCurrencies,
        address: get('business_address') || DEFAULTS.address,
        hours: get('business_hours') || DEFAULTS.hours,
      };

      cachedData = result;
      return result;
    } catch {
      return DEFAULTS;
    } finally {
      pendingPromise = null;
    }
  })();

  return pendingPromise;
}

export function usePublicSettings(): PublicSettingsData {
  const [state, setState] = useState<PublicSettingsData>({
    ...(cachedData || DEFAULTS),
    loading: !cachedData,
  });

  useEffect(() => {
    if (cachedData) {
      setState({ ...cachedData, loading: false });
      return;
    }
    let mounted = true;
    fetchAllSettings().then((data) => {
      if (mounted) setState({ ...data, loading: false });
    });
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}

export function invalidatePublicSettingsCache(): void {
  cachedData = null;
  pendingPromise = null;
}
