"""
ASGI config for adoro project.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "adoro.settings")

application = get_asgi_application()
