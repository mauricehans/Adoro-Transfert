import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Rate {
  pair: string;
  rate: number;
  source: string;
  updatedAt: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'super_admin';
}

export interface SimulationResult {
  corridor: string;
  amountSent: number;
  currencySent: string;
  adoroFee: number;
  airtelFee: number;
  totalToSend: number;
  amountReceived: number;
  currencyReceived: string;
  rate: number;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  setAuth: (token: string, refreshToken: string, user: User) => void;
  clearAuth: () => void;
  setToken: (token: string) => void;
}

interface RatesState {
  rates: Rate[];
  setRates: (rates: Rate[]) => void;
  updateRate: (pair: string, rate: number) => void;
}

interface SimulationState {
  corridor: string;
  amount: number;
  includeAirtelFee: boolean;
  beneficiaryName: string;
  beneficiaryPhone: string;
  beneficiaryEmail: string;
  result: SimulationResult | null;
  setCorridor: (corridor: string) => void;
  setAmount: (amount: number) => void;
  setIncludeAirtelFee: (include: boolean) => void;
  setBeneficiaryName: (name: string) => void;
  setBeneficiaryPhone: (phone: string) => void;
  setBeneficiaryEmail: (email: string) => void;
  setResult: (result: SimulationResult | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      setAuth: (token, refreshToken, user) => set({ token, refreshToken, user }),
      clearAuth: () => set({ token: null, refreshToken: null, user: null }),
      setToken: (token) => set({ token }),
    }),
    { name: 'adoro-auth' }
  )
);

export const useRatesStore = create<RatesState>((set) => ({
  rates: [],
  setRates: (rates) => set({ rates }),
  updateRate: (pair, rate) =>
    set((state) => ({
      rates: state.rates.map((r) =>
        r.pair === pair ? { ...r, rate, updatedAt: new Date().toISOString() } : r
      ),
    })),
}));

// Default sending amount per corridor (in the source currency)
// — picks a sensible value within the first tariff tier so frais Adoro > 0
const DEFAULT_AMOUNT_BY_CORRIDOR: Record<string, number> = {
  FR_GA: 100, FR_CM: 100, FR_SN: 100, FR_MA: 100,
  GA_FR: 50000, CM_FR: 50000, SN_FR: 50000,
  MA_FR: 500,
};

export const useSimulationStore = create<SimulationState>((set) => ({
  corridor: 'FR_GA',
  amount: 100,
  includeAirtelFee: false,
  beneficiaryName: '',
  beneficiaryPhone: '',
  beneficiaryEmail: '',
  result: null,
  setCorridor: (corridor) =>
    set((state) => ({
      corridor,
      // si l'utilisateur n'a pas saisi un montant pertinent pour la nouvelle
      // devise (ex: 100 FCFA), on reinitialise a un default raisonnable.
      amount: DEFAULT_AMOUNT_BY_CORRIDOR[corridor] ?? state.amount,
    })),
  setAmount: (amount) => set({ amount }),
  setIncludeAirtelFee: (includeAirtelFee) => set({ includeAirtelFee }),
  setBeneficiaryName: (beneficiaryName) => set({ beneficiaryName }),
  setBeneficiaryPhone: (beneficiaryPhone) => set({ beneficiaryPhone }),
  setBeneficiaryEmail: (beneficiaryEmail) => set({ beneficiaryEmail }),
  setResult: (result) => set({ result }),
  reset: () =>
    set({
      corridor: 'FR_GA',
      amount: 100,
      includeAirtelFee: false,
      beneficiaryName: '',
      beneficiaryPhone: '',
      beneficiaryEmail: '',
      result: null,
    }),
}));
