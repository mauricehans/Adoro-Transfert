"""
Celery configuration for adoro project.
"""

import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "adoro.settings")

app = Celery("adoro")
app.config_from_object("django.conf:settings", namespace="CELERY")

# Override beat schedule with proper crontab
app.conf.beat_schedule = {
    "fetch-daily-rates": {
        "task": "rates.tasks.fetch_daily_rates",
        "schedule": crontab(hour=6, minute=0),
    },
}

app.autodiscover_tasks()
