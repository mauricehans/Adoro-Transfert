interface TariffRow {
  min: number;
  max: number | null;
  fee: number;
}

interface TariffTableProps {
  title: string;
  currency: string;
  rows: TariffRow[];
}

export default function TariffTable({ title, currency, rows }: TariffTableProps) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-emerald-primary/10">
        <h3 className="font-display text-xl text-bone tracking-wide">{title}</h3>
        <p className="text-xs font-mono text-ash mt-1">Frais en {currency}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-600">
              <th className="px-5 py-3 text-left text-xs font-mono text-ash uppercase tracking-wider">
                Tranche
              </th>
              <th className="px-5 py-3 text-right text-xs font-mono text-ash uppercase tracking-wider">
                Frais Adoro
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors"
              >
                <td className="px-5 py-3 text-sm text-bone">
                  {row.max
                    ? `${row.min.toLocaleString('fr-FR')} - ${row.max.toLocaleString('fr-FR')} ${currency}`
                    : `${row.min.toLocaleString('fr-FR')}+ ${currency}`}
                </td>
                <td className="px-5 py-3 text-sm text-emerald-primary text-right font-mono">
                  {row.fee.toLocaleString('fr-FR')} {currency}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
