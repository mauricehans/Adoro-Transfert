import { useState, useEffect } from 'react';
import api from '../lib/api';

interface ContactSettings {
  whatsappNumber: string;
  notificationEmail: string;
  loading: boolean;
}

let cachedSettings: { whatsappNumber: string; notificationEmail: string } | null = null;

export function useContactSettings(): ContactSettings {
  const [settings, setSettings] = useState<ContactSettings>({
    whatsappNumber: cachedSettings?.whatsappNumber || '2417449818',
    notificationEmail: cachedSettings?.notificationEmail || 'AdoroTransfert@gmail.com',
    loading: !cachedSettings,
  });

  useEffect(() => {
    if (cachedSettings) return;

    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings/public/');
        const waNumber = data.find((s: { key: string }) => s.key === 'whatsapp_number');
        const email = data.find((s: { key: string }) => s.key === 'notification_email');

        const result = {
          whatsappNumber: waNumber?.value?.number || '2417449818',
          notificationEmail: email?.value?.email || 'AdoroTransfert@gmail.com',
        };

        cachedSettings = result;
        setSettings({ ...result, loading: false });
      } catch {
        setSettings((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchSettings();
  }, []);

  return settings;
}
