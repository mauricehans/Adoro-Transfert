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
  email: string;
  firstName: string;
  lastName: string;
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

export const useSimulationStore = create<SimulationState>((set) => ({
  corridor: 'FR_GA',
  amount: 100,
  includeAirtelFee: false,
  beneficiaryName: '',
  beneficiaryPhone: '',
  beneficiaryEmail: '',
  result: null,
  setCorridor: (corridor) => set({ corridor }),
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
