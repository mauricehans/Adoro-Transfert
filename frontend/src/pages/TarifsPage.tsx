import TariffTable from '../components/TariffTable';
import Simulator from '../components/Simulator';

const fcfaTranches = [
  { min: 1000, max: 50000, fee: 1000 },
  { min: 50001, max: 100000, fee: 2000 },
  { min: 100001, max: 200000, fee: 3000 },
  { min: 200001, max: 350000, fee: 4500 },
  { min: 350001, max: 500000, fee: 6000 },
  { min: 500001, max: 750000, fee: 8000 },
  { min: 750001, max: 1000000, fee: 10000 },
  { min: 1000001, max: null, fee: 12000 },
];

const eurTranches = [
  { min: 1, max: 50, fee: 3 },
  { min: 51, max: 100, fee: 5 },
  { min: 101, max: 200, fee: 8 },
  { min: 201, max: 350, fee: 10 },
  { min: 351, max: 500, fee: 12 },
  { min: 501, max: 750, fee: 15 },
  { min: 751, max: 1000, fee: 18 },
  { min: 1001, max: null, fee: 22 },
];

export default function TarifsPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-up">
          <h1 className="font-display text-5xl text-bone mb-4">NOS TARIFS</h1>
          <p className="text-ash max-w-2xl mx-auto text-lg">
            Grille tarifaire transparente. Les frais dependent du montant envoye et du corridor choisi.
          </p>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <div className="animate-fade-up">
            <TariffTable title="TRANCHES FCFA" currency="FCFA" rows={fcfaTranches} />
          </div>
          <div className="animate-fade-up animate-delay-200">
            <TariffTable title="TRANCHES EUR" currency="EUR" rows={eurTranches} />
          </div>
        </div>

        {/* Additional info */}
        <div className="glass-card p-6 mb-16 animate-fade-up">
          <h3 className="font-display text-xl text-bone mb-4">INFORMATIONS COMPLEMENTAIRES</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="text-emerald-primary font-mono text-xs uppercase tracking-wider mb-2">
                Frais Airtel Money
              </h4>
              <p className="text-ash">
                3% du montant recu, plafonne a 5 000 FCFA. Applicable uniquement pour les retraits Airtel Money au Gabon.
              </p>
            </div>
            <div>
              <h4 className="text-emerald-primary font-mono text-xs uppercase tracking-wider mb-2">
                Taux de change
              </h4>
              <p className="text-ash">
                Taux actualise en temps reel depuis des sources fiables (ECB, XE). Le taux affiche est le taux applique.
              </p>
            </div>
            <div>
              <h4 className="text-emerald-primary font-mono text-xs uppercase tracking-wider mb-2">
                Delais
              </h4>
              <p className="text-ash">
                Transferts traites sous 24h ouvrees apres confirmation du paiement. Express disponible sur certains corridors.
              </p>
            </div>
          </div>
        </div>

        {/* Mini simulator */}
        <div className="max-w-xl mx-auto animate-fade-up">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl text-bone mb-2">SIMULEZ VOS FRAIS</h2>
            <p className="text-ash">Calculez le cout exact de votre transfert.</p>
          </div>
          <Simulator />
        </div>
      </div>
    </div>
  );
}
