import TariffTable from '../components/TariffTable';
import Simulator from '../components/Simulator';
import { usePublicSettings } from '../hooks/usePublicSettings';

/**
 * Page Tarifs : affiche les grilles tarifaires depuis la BDD (Settings).
 * Conforme au CCTP §3.3 (ANNEXE 1) + corridors en pourcentage (page 15).
 */

const CORRIDOR_PERCENT_RULES = [
  { label: 'Sénégal ↔ Gabon', percent: 4.5 },
  { label: 'Sénégal ↔ France', percent: 5.0 },
  { label: 'Gabon ↔ Maroc', percent: 4.5 },
  { label: 'Maroc ↔ France', percent: 5.0 },
  { label: 'Sénégal ↔ Maroc', percent: 4.5 },
  { label: 'France ↔ Gabon', percent: null, note: 'Grille à paliers (voir ci-dessus)' },
];

export default function TarifsPage() {
  const { eurTariffs, fcfaTariffs, loading } = usePublicSettings();

  // Conversion des paliers BDD au format attendu par TariffTable
  const fcfaRows = fcfaTariffs.map((t) => ({ min: t.min, max: t.max, fee: t.fee }));
  const eurRows = eurTariffs.map((t) => ({ min: t.min, max: t.max, fee: t.fee }));

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-up">
          <h1 className="font-display text-5xl text-bone mb-4">NOS TARIFS</h1>
          <p className="text-ash max-w-2xl mx-auto text-lg">
            Grille tarifaire transparente, conforme au cahier des charges officiel.
            Les frais dépendent du montant envoyé et du corridor choisi.
          </p>
        </div>

        {loading ? (
          <div className="text-center text-ash py-12">Chargement des grilles tarifaires...</div>
        ) : (
          <>
            {/* Tables FR ↔ GA */}
            <div className="mb-4 animate-fade-up">
              <h2 className="font-display text-2xl text-emerald-primary mb-2 text-center">
                CORRIDOR FRANCE ↔ GABON (grille à paliers)
              </h2>
              <p className="text-ash text-sm text-center mb-6">
                Présentation dans les deux sens de transaction (CCTP §3.3, ANNEXE 1).
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
              <div className="animate-fade-up">
                <TariffTable
                  title="EUR → XAF (France → Gabon)"
                  currency="EUR"
                  rows={eurRows}
                />
              </div>
              <div className="animate-fade-up animate-delay-200">
                <TariffTable
                  title="XAF → EUR (Gabon → France)"
                  currency="FCFA"
                  rows={fcfaRows}
                />
              </div>
            </div>

            {/* Corridors en pourcentage */}
            <div className="glass-card p-6 mb-16 animate-fade-up">
              <h3 className="font-display text-xl text-bone mb-4">
                AUTRES CORRIDORS (frais en pourcentage)
              </h3>
              <p className="text-ash text-sm mb-4">
                Pour les corridors africains et Maghreb, les frais sont un pourcentage du
                montant envoyé (CCTP page 15).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {CORRIDOR_PERCENT_RULES.map((rule) => (
                  <div
                    key={rule.label}
                    className="flex justify-between items-center p-3 rounded-xl bg-dark-800/50"
                  >
                    <span className="text-bone">{rule.label}</span>
                    <span className="text-emerald-primary font-mono font-bold">
                      {rule.percent !== null ? `${rule.percent} %` : rule.note}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Additional info */}
        <div className="glass-card p-6 mb-16 animate-fade-up">
          <h3 className="font-display text-xl text-bone mb-4">INFORMATIONS COMPLÉMENTAIRES</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="text-emerald-primary font-mono text-xs uppercase tracking-wider mb-2">
                Frais Airtel Money
              </h4>
              <p className="text-ash">
                3% du montant reçu, plafonné à 5 000 FCFA. Applicable uniquement pour les
                retraits Airtel Money au Gabon.
              </p>
            </div>
            <div>
              <h4 className="text-emerald-primary font-mono text-xs uppercase tracking-wider mb-2">
                Taux de change
              </h4>
              <p className="text-ash">
                Taux actualisé en temps réel via des sources fiables
                (exchangeratesapi.io, frankfurter.app). Le taux affiché est celui appliqué.
              </p>
            </div>
            <div>
              <h4 className="text-emerald-primary font-mono text-xs uppercase tracking-wider mb-2">
                Délais
              </h4>
              <p className="text-ash">
                Transferts traités sous 24h ouvrées après confirmation du paiement.
                Express disponible sur certains corridors.
              </p>
            </div>
          </div>
        </div>

        {/* Mini simulator */}
        <div className="max-w-xl mx-auto animate-fade-up">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl text-bone mb-2">SIMULEZ VOS FRAIS</h2>
            <p className="text-ash">Calculez le coût exact de votre transfert.</p>
          </div>
          <Simulator />
        </div>
      </div>
    </div>
  );
}
