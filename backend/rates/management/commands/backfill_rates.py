import datetime
import time
from django.core.management.base import BaseCommand
from rates.tasks import fetch_daily_rates

class Command(BaseCommand):
    help = "Backfills exchange rates for the last N days."

    def add_arguments(self, parser):
        parser.add_argument(
            "days", type=int, nargs="?", default=30, help="Number of days to backfill"
        )
        parser.add_argument(
            "--delay", type=float, default=1.5, help="Delay between requests in seconds to avoid rate limiting"
        )

    def handle(self, *args, **options):
        days = options["days"]
        delay = options["delay"]
        today = datetime.date.today()

        self.stdout.write(f"Backfilling rates for the last {days} days...")

        for i in range(days - 1, -1, -1):
            try:
                # timedelta gère automatiquement les fins de mois, les années bissextiles (février), etc.
                target_date = today - datetime.timedelta(days=i)
                date_str = target_date.isoformat()
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"Date calculation error skipping day offset {i}: {e}"))
                continue

            self.stdout.write(f"Fetching rates for {date_str}...")
            
            try:
                result = fetch_daily_rates(target_date_str=date_str)
                self.stdout.write(self.style.SUCCESS(f"Successfully fetched {date_str}: {result['source']}"))
            except Exception as e:
                # Si une erreur survient pour un jour spécifique, on l'affiche mais on NE BLOQUE PAS la boucle
                self.stdout.write(self.style.ERROR(f"Failed for {date_str}: {e}"))
            
            # Pause entre les requêtes pour éviter d'être bloqué (Rate Limit 429)
            if i > 0:
                time.sleep(delay)

        self.stdout.write(self.style.SUCCESS("Backfill complete!"))
