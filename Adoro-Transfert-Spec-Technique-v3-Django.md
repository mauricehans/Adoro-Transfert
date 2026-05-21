# Projet Web — Adôro Transfert
## Spécification technique enrichie (v3.0 — stack Django)

> Document de conception complémentaire au CCTP N°002 LOT 060599.
> Couvre la totalité des attentes initiales du cahier des charges + 4 extensions :
> 1. API taux de change quotidiens (primaire + secondaire / fallback)
> 2. Page admin (variations monétaires + transactions + paramétrage tarifs)
> 3. WebSocket temps réel sur le simulateur
> 4. Charte graphique / UI inspirée du pitch HTML fourni (émeraude `#00B5A0` sur fond sombre)

> ⚠️ **NB métier important** : le site **ne réalise pas** le transfert d'argent lui-même. Il **collecte la simulation**, l'enregistre en base, puis **notifie un tiers (Adôro)** par **email + WhatsApp**. L'admin pilote les paramètres (frais, plafonds, devises, statuts).

---

## 1. Stack technique retenue

| Couche | Technologie | Rôle |
|---|---|---|
| **Frontend public + admin** | **React 18 + Vite + TypeScript** | SPA rapide, dev experience moderne |
| **Styling** | **Tailwind CSS 3** | Reproduit fidèlement le design émeraude/sombre du `paste.txt` |
| **Routing** | React Router v6 | Pages publiques + routes `/admin/*` protégées |
| **State** | Zustand ou Redux Toolkit | Store global (rates, user, simulation) |
| **Data fetching** | TanStack Query (React Query) | Cache, retry, invalidation des appels API |
| **Charts admin** | Recharts | Graphiques variations devises |
| **WebSocket client** | `react-use-websocket` ou `socket.io-client` | Connexion temps réel |
| **Backend** | **Django 5 + Django REST Framework** | API REST, ORM, admin natif |
| **WebSocket serveur** | **Django Channels 4** | ASGI, rooms, groupes |
| **Cron / Tâches async** | **Celery + Celery Beat** | Worker quotidien fetch taux + jobs email |
| **Broker** | **Redis 7** | Broker Celery + Channels layer + cache |
| **BDD** | **PostgreSQL 16** | Stockage relationnel |
| **Auth admin** | Django Auth + JWT (djangorestframework-simplejwt) | Sessions admin + tokens API |
| **Mail** | Django Mail Backend (SMTP : Brevo/Resend/Gandi) | Notif tiers Adôro |
| **Conteneurisation** | **Docker** + **docker-compose** | 7 services orchestrés |
| **Reverse proxy** | Nginx | TLS + static + proxy ASGI (Daphne/Uvicorn) |
| **Hébergement** | VPS OVH/Hetzner ou Railway/Fly.io | |
| **CI/CD** | GitHub Actions | Build + tests + déploiement |

---

## 2. Architecture générale

```
                       ┌──────────────────────────────┐
                       │   FRONTEND React + Vite      │
                       │   • Accueil + simulateur     │
                       │   • Services / Tarifs / FAQ  │
                       │   • Contact                  │
                       │   • /admin (protégé JWT)     │
                       └──────────────┬───────────────┘
                                      │ HTTPS REST + WSS
                       ┌──────────────▼───────────────┐
                       │   NGINX (TLS, static)        │
                       └──────┬─────────────┬─────────┘
                              │             │
                       ┌──────▼─────┐  ┌────▼──────────────┐
                       │ Gunicorn   │  │ Daphne (ASGI)     │
                       │ /api/*     │  │ /ws/*  Channels   │
                       │ DRF        │  │ Consumers         │
                       └──────┬─────┘  └────┬──────────────┘
                              │             │
                              └──────┬──────┘
                                     │
                  ┌──────────────────┼──────────────────┐
                  │                  │                  │
        ┌─────────▼──────┐  ┌────────▼─────┐   ┌────────▼──────┐
        │  PostgreSQL    │  │  Redis 7     │   │  Celery       │
        │  • users       │  │  • cache 60s │   │  • beat (cron)│
        │  • transactions│  │  • channels  │   │  • worker     │
        │  • rates_hist  │  │    layer     │   │  • fetch_rates│
        │  • fees_grid   │  │  • broker    │   │  • send_email │
        │  • settings    │  └──────────────┘   └───────┬───────┘
        └────────────────┘                             │
                                                       │ daily 06:00 UTC
                                            ┌──────────▼──────────────┐
                                            │ ① exchangerate.host     │
                                            │ ② frankfurter.dev       │
                                            │ ③ fallback static FCFA  │
                                            └─────────────────────────┘
```

---

## 3. Pages publiques (reprend le CCTP)

| Page | Route React | Composant | Contenu clé |
|---|---|---|---|
| Accueil | `/` | `HomePage.tsx` | Hero + **simulateur** + avantages + corridors + CTA WhatsApp |
| Services | `/services` | `ServicesPage.tsx` | 12 sens de transaction détaillés |
| Tarifs | `/tarifs` | `TarifsPage.tsx` | Grille tarifaire (FCFA + €) + simulateur répliqué |
| FAQ | `/faq` | `FaqPage.tsx` | Questions par pays + lien WhatsApp |
| Contact | `/contact` | `ContactPage.tsx` | Formulaire → redirection WhatsApp |
| Admin | `/admin/*` | `AdminLayout.tsx` (Outlet) | Routes protégées par `RequireAuth` (cf. §5) |

### 3.1. Simulateur (cœur métier)

**Champs** :
- Sens de la transaction (8+ corridors bidirectionnels)
- Montant à envoyer (devise selon corridor)
- ☑ Case « Inclure les frais de retrait Airtel Money »
- Informations bénéficiaire (Airtel/Wave/Wafacash ou email PayPal)

**Sortie dynamique** :
- Montant envoyé, frais Adôro, frais retrait Airtel (si coché — 3 % plafonné 5000 FCFA)
- Total à envoyer + Bénéficiaire reçoit (conversion via taux du jour)
- Bouton **« Envoyer via WhatsApp »** → `wa.me/2417449818?text=<message_dynamique>`

**Avant l'envoi** :
1. `POST /api/transactions/` → enregistre la simulation (`status: pending_contact`)
2. Backend déclenche tâche Celery `send_notification_email`
3. Redirection navigateur vers `wa.me` avec message pré-rempli
4. Le tiers Adôro pilote ensuite manuellement la finalisation (le site **n'effectue aucun mouvement de fonds**)

---

## 4. EXTENSION 1 — API Taux de Change quotidiens

### 4.1. Sources

| Rang | API | URL | Plan |
|---|---|---|---|
| **① Primaire** | exchangerate.host | `https://api.exchangerate.host/latest?base=EUR&symbols=XAF,XOF,MAD,USD` | Gratuit, 100 req/min |
| **② Secondaire (fallback)** | Frankfurter | `https://api.frankfurter.dev/latest?from=EUR&to=XAF,XOF,MAD,USD` | Gratuit, sans clé |
| **③ Fallback statique** | Parité fixe zone franc CFA | `1 EUR = 655,957 XAF/XOF` | Constante |

### 4.2. Tâche Celery + Celery Beat

```python
# adoro/tasks.py
from celery import shared_task
from django.utils import timezone
import requests
from .models import RatesHistory
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

PRIMARY  = "https://api.exchangerate.host/latest"
SECONDARY = "https://api.frankfurter.dev/latest"
STATIC_FCFA = {"XAF": 655.957, "XOF": 655.957}

@shared_task(bind=True, max_retries=3)
def fetch_daily_rates(self):
    payload, source = None, None
    try:
        r = requests.get(PRIMARY, params={"base": "EUR",
            "symbols": "XAF,XOF,MAD,USD"}, timeout=5)
        r.raise_for_status()
        payload = r.json().get("rates")
        source = "primary"
    except Exception as e1:
        try:
            r = requests.get(SECONDARY, params={"from": "EUR",
                "to": "XAF,XOF,MAD,USD"}, timeout=5)
            r.raise_for_status()
            payload = r.json().get("rates")
            source = "secondary"
        except Exception as e2:
            payload = STATIC_FCFA
            source = "fallback_static"

    rec = RatesHistory.objects.create(
        date=timezone.now().date(),
        fetched_at=timezone.now(),
        source=source,
        rates=payload,
    )

    # Broadcast WebSocket à tous les clients connectés
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "rates_global",
        {"type": "rates.update", "rates": payload,
         "source": source, "fetched_at": str(rec.fetched_at)}
    )
    return {"id": rec.id, "source": source}
```

```python
# adoro/settings.py — Celery Beat schedule
from celery.schedules import crontab

CELERY_BROKER_URL = "redis://redis:6379/0"
CELERY_RESULT_BACKEND = "redis://redis:6379/1"

CELERY_BEAT_SCHEDULE = {
    "fetch-rates-daily": {
        "task": "adoro.tasks.fetch_daily_rates",
        "schedule": crontab(hour=6, minute=0),   # 06:00 UTC
    },
}
```

### 4.3. Endpoints REST

| Méthode | URL | Description | Auth |
|---|---|---|---|
| GET | `/api/rates/latest/` | Derniers taux (cache Redis 60s) | Public |
| GET | `/api/rates/history/?from=YYYY-MM-DD&to=YYYY-MM-DD&pair=EUR_XAF` | Historique | Admin |
| POST | `/api/rates/refresh/` | Force un fetch immédiat | Admin |

---

## 5. EXTENSION 2 — Espace Admin

### 5.1. Deux options possibles

**Option A — Admin custom React (recommandée)**
Routes `/admin/*` dans le SPA React, protégées par `RequireAuth` (JWT vérifié, redirige `/admin/login` sinon). Design cohérent avec le site public.

**Option B — Django Admin natif**
Accessible à `/django-admin/` pour gestion brute (utile en backup). Personnalisable via `ModelAdmin`.

→ On garde **les deux** : React pour l'usage quotidien, Django Admin comme filet de sécurité.

### 5.2. Pages admin React

| Route | Contenu |
|---|---|
| `/admin/login` | Form email+password → POST `/api/auth/token/` (JWT) |
| `/admin` | Dashboard : KPI cards (simulations 24h/7j/30j, total simulé), graphique variations, badge statut source API |
| `/admin/rates` | Tableau historique filtrable + graphique Recharts multi-séries + comparaison J/J-1/J-7/J-30 + alertes seuils |
| `/admin/transactions` | Liste des simulations avec filtres (période, corridor, statut, montant), détail en modale, MAJ statut, export CSV |
| `/admin/settings` | Édition grille tarifaire, plafonds, % corridors, n° WhatsApp, email destinataire, templates, devises actives, seuils d'alerte, URLs API |
| `/admin/users` (V2) | Gestion des comptes admin |

### 5.3. Paramètres modifiables par l'admin

> Tous les paramètres affichés sur le site public proviennent de la BDD → modification immédiate.

| Catégorie | Paramètres |
|---|---|
| Grille tarifaire | Tranches FCFA, tranches €, frais par tranche, % corridors fixes |
| Plafonds | Min / max par devise et par corridor |
| Frais Airtel Money | Activable, %, plafond |
| Coordonnées | N° WhatsApp, email Adôro destinataire |
| Templates WhatsApp | Messages par corridor avec variables `{montant}`, `{recu}`, `{nom}` |
| Devises actives | Activer/désactiver des corridors |
| Sources API taux | URL primaire/secondaire, clés, fréquence cron |
| Seuils d'alerte | % de variation déclenchant un badge rouge |

---

## 6. EXTENSION 3 — WebSocket temps réel (Django Channels)

### 6.1. Cas d'usage

1. **Push des nouveaux taux** : quand le cron Celery met à jour les taux, tous les simulateurs ouverts dans le navigateur des clients **recalculent automatiquement** le montant reçu sans recharger la page.
2. **Co-simulation client** : un client partage un lien `/simulate?session=abc123` avec un proche. Les deux navigateurs sont connectés à la **même room** et voient les changements de l'un et l'autre en direct.

### 6.2. Configuration Channels

```python
# adoro/settings.py
ASGI_APPLICATION = "adoro.asgi.application"

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {"hosts": [("redis", 6379)]},
    },
}
```

```python
# adoro/asgi.py
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import simulator.routing

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "adoro.settings")
django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(URLRouter(simulator.routing.websocket_urlpatterns)),
})
```

### 6.3. Consumer simulateur

```python
# simulator/consumers.py
import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from .calculator import recalculate

class SimulatorConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.session_id = self.scope["url_route"]["kwargs"]["session_id"]
        self.room = f"sim_{self.session_id}"
        await self.channel_layer.group_add(self.room, self.channel_name)
        await self.channel_layer.group_add("rates_global", self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.room, self.channel_name)
        await self.channel_layer.group_discard("rates_global", self.channel_name)

    async def receive_json(self, content, **kwargs):
        if content.get("event") == "sim:change":
            state = content.get("state", {})
            result = await recalculate(state)   # call DB + cache
            await self.channel_layer.group_send(
                self.room,
                {"type": "sim.sync", "state": state, "result": result}
            )

    async def sim_sync(self, event):
        await self.send_json({
            "event": "sim:sync",
            "state": event["state"],
            "result": event["result"],
        })

    async def rates_update(self, event):
        await self.send_json({
            "event": "rates:update",
            "rates": event["rates"],
            "source": event["source"],
            "fetched_at": event["fetched_at"],
        })
```

```python
# simulator/routing.py
from django.urls import re_path
from .consumers import SimulatorConsumer

websocket_urlpatterns = [
    re_path(r"ws/simulate/(?P<session_id>[\w-]+)/$", SimulatorConsumer.as_asgi()),
]
```

### 6.4. Côté client React

```ts
// src/hooks/useSimulatorSocket.ts
import useWebSocket from "react-use-websocket";

export function useSimulatorSocket(sessionId: string) {
  const url = `wss://adoro.app/ws/simulate/${sessionId}/`;
  return useWebSocket(url, {
    shouldReconnect: () => true,
    reconnectInterval: 2000,
  });
}
```

### 6.5. Sécurité WebSocket

- Throttling : max 10 msg/s par client (middleware custom)
- Validation des payloads (DRF serializers ou pydantic)
- Session ID = UUID v4, expire après 1h d'inactivité
- Pas de données sensibles (n° Airtel) sur le canal partagé avant validation

---

## 7. Modèle Django (apps & models)

### 7.1. Apps Django

```
adoro/                  # projet
├── adoro/              # settings, urls, asgi, celery
├── accounts/           # Admin custom user
├── simulator/          # Transactions, calculator, consumers
├── rates/              # RatesHistory, tasks fetch
├── tariffs/            # FeesGrid, Settings
└── notifications/      # Email, WhatsApp templates
```

### 7.2. Models principaux

```python
# accounts/models.py
from django.contrib.auth.models import AbstractUser
class AdminUser(AbstractUser):
    role = models.CharField(max_length=20, default="admin")

# simulator/models.py
class Transaction(models.Model):
    STATUS = [
        ("pending_contact", "En attente de contact"),
        ("in_progress", "En cours"),
        ("completed", "Finalisé"),
        ("cancelled", "Annulé"),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    corridor = models.CharField(max_length=40)            # ex. "FR_GA"
    amount_sent = models.DecimalField(max_digits=14, decimal_places=2)
    currency_sent = models.CharField(max_length=3)
    fees_adoro = models.DecimalField(max_digits=14, decimal_places=2)
    fees_airtel = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_to_pay = models.DecimalField(max_digits=14, decimal_places=2)
    amount_received = models.DecimalField(max_digits=14, decimal_places=2)
    currency_received = models.CharField(max_length=3)
    rate_used = models.DecimalField(max_digits=14, decimal_places=6)
    rate_source = models.CharField(max_length=20)
    beneficiary_name = models.CharField(max_length=120, blank=True)
    beneficiary_phone = models.CharField(max_length=30, blank=True)
    beneficiary_email = models.EmailField(blank=True)
    payment_method = models.CharField(max_length=20)
    status = models.CharField(max_length=30, choices=STATUS, default="pending_contact")
    whatsapp_opened = models.BooleanField(default=False)
    email_sent = models.BooleanField(default=False)
    admin_note = models.TextField(blank=True)
    ip_hash = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

# rates/models.py
class RatesHistory(models.Model):
    date = models.DateField()
    fetched_at = models.DateTimeField()
    source = models.CharField(max_length=20)              # primary/secondary/fallback_static
    base = models.CharField(max_length=3, default="EUR")
    rates = models.JSONField()                            # {"XAF": 655.957, "USD": 1.087, ...}
    raw_payload = models.JSONField(blank=True, null=True)
    class Meta:
        unique_together = [("date", "source")]
        indexes = [models.Index(fields=["-date"])]

# tariffs/models.py
class FeesGrid(models.Model):
    corridor = models.CharField(max_length=40)
    currency = models.CharField(max_length=3)
    min_amount = models.DecimalField(max_digits=14, decimal_places=2)
    max_amount = models.DecimalField(max_digits=14, decimal_places=2)
    fee_amount = models.DecimalField(max_digits=14, decimal_places=2, null=True)
    fee_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    active = models.BooleanField(default=True)

class Settings(models.Model):
    key = models.CharField(max_length=80, primary_key=True)
    value = models.JSONField()
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey("accounts.AdminUser", on_delete=models.SET_NULL, null=True)

# notifications/models.py
class AdminAudit(models.Model):
    admin = models.ForeignKey("accounts.AdminUser", on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=80)
    target = models.CharField(max_length=120)
    payload = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

---

## 8. Endpoints REST (DRF)

| Méthode | URL | Description | Permission |
|---|---|---|---|
| POST | `/api/auth/token/` | Login admin (retourne JWT) | Public |
| POST | `/api/auth/token/refresh/` | Refresh token | Public |
| GET | `/api/rates/latest/` | Derniers taux | Public |
| GET | `/api/rates/history/` | Historique | IsAdmin |
| POST | `/api/rates/refresh/` | Force fetch | IsAdmin |
| GET | `/api/tariffs/` | Grille tarifaire publique | Public |
| PATCH | `/api/tariffs/{id}/` | Modifier une tranche | IsAdmin |
| GET | `/api/settings/public/` | Settings exposables (devises actives, WA number) | Public |
| GET / PATCH | `/api/settings/` | Tous les settings | IsAdmin |
| POST | `/api/transactions/` | Créer une simulation | Public + rate limit |
| GET | `/api/transactions/` | Liste (admin) | IsAdmin |
| PATCH | `/api/transactions/{id}/` | MAJ statut/note | IsAdmin |
| GET | `/api/transactions/export/?format=csv` | Export CSV | IsAdmin |

---

## 9. Flux complet d'une simulation (sans transfert réel)

```
1. Client charge "/"
     └─► GET /api/rates/latest/  (taux du jour, cache Redis 60s)
     └─► WS connect /ws/simulate/<uuid>/
            └─► join group rates_global

2. Client remplit le simulateur
     └─► WS sim:change → Channels recalcule → broadcast sim:sync
     └─► Si Celery beat tombe pendant la session → WS rates:update → recalcul auto

3. Client clique "Envoyer via WhatsApp"
     └─► POST /api/transactions/   { ...données simulation }
            ├─► INSERT Transaction (status = pending_contact)
            ├─► Celery task : send_notification_email.delay(tx_id)
            │     → email à AdoroTransfert@gmail.com :
            │       "[Adôro] Nouvelle demande #ID — 100€ FR→GA"
            │     → corps : récap complet + lien /admin/transactions/<id>
            └─► Réponse { id, whatsapp_url }
     └─► window.location = whatsapp_url   (wa.me/2417449818?text=...)

4. Tiers Adôro reçoit :
     - 📧 Email avec tous les détails
     - 💬 Message WhatsApp pré-rempli du client
     - 🖥️ Notification dans /admin/transactions (badge "nouveau")

5. Admin dialogue via WhatsApp → finalise hors-site
     └─► PATCH /api/transactions/{id}/   { status: "completed", admin_note: "..." }
     └─► Le site n'a JAMAIS manipulé de fonds.
```

---

## 10. Charte graphique React + Tailwind

### 10.1. Config Tailwind (palette)

```js
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        emerald: {
          DEFAULT: "#00B5A0",
          dark: "#008F7E",
          light: "#00D4BC",
          glow: "rgba(0,181,160,0.15)",
        },
        ink: {
          black: "#050A09",
          dark: "#0D1614",
          dark2: "#111F1C",
        },
        bone: "#F4FFFE",
        ash: "#8BA8A4",
      },
      fontFamily: {
        display: ["'Bebas Neue'", "sans-serif"],
        sans:    ["'DM Sans'", "sans-serif"],
        mono:    ["'Space Mono'", "monospace"],
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: 0, transform: "translateY(24px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        pulse: {
          "0%,100%": { opacity: 0.7, transform: "translate(-50%,-50%) scale(1)" },
          "50%":     { opacity: 1, transform: "translate(-50%,-50%) scale(1.08)" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.8s ease both",
        "pulse-slow": "pulse 4s ease-in-out infinite",
      },
      backgroundImage: {
        "grid-emerald":
          "linear-gradient(rgba(0,181,160,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,181,160,0.04) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
```

### 10.2. Composants React à créer (équivalents du paste.txt)

| Composant | Équivalent paste.txt | Usage |
|---|---|---|
| `<Navbar />` | `nav` fixe | Logo SVG + liens + CTA WhatsApp |
| `<GridBg />` | `.grid-bg` | Fond grille émeraude subtile |
| `<Glow />` | `.cover-glow` | Halo radial animé |
| `<Simulator />` | `.sim-mockup` | **Vrai simulateur** interactif WS |
| `<CorridorCard />` | `.corridor-card` | Page Services |
| `<TariffTable />` | `.tariff-table` | Page Tarifs |
| `<ProcessFlow />` | `.process-flow` | Parcours 4 étapes |
| `<ButtonPrimary />` | `.btn-primary` | CTA principal |
| `<ButtonOutline />` | `.btn-outline` | CTA secondaire |
| `<SectionHeader />` | `.section-header` | Titre numéroté |

### 10.3. Exemple : composant `<Simulator />` (extrait)

```tsx
// src/components/Simulator.tsx
import { useEffect, useState } from "react";
import { useSimulatorSocket } from "@/hooks/useSimulatorSocket";

export function Simulator({ sessionId }: { sessionId: string }) {
  const { sendJsonMessage, lastJsonMessage } = useSimulatorSocket(sessionId);
  const [state, setState] = useState({ corridor: "FR_GA", amount: 100, includeAirtel: true });
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    sendJsonMessage({ event: "sim:change", state });
  }, [state]);

  useEffect(() => {
    if (lastJsonMessage?.event === "sim:sync") setResult(lastJsonMessage.result);
    if (lastJsonMessage?.event === "rates:update") {
      // déclenche un recalcul auto
      sendJsonMessage({ event: "sim:change", state });
    }
  }, [lastJsonMessage]);

  return (
    <div className="bg-ink-dark2 border border-emerald/20 rounded-2xl p-7 relative overflow-hidden">
      <div className="font-mono text-[10px] tracking-[0.2em] text-emerald uppercase mb-5 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald" />
        Simulateur Adôro
      </div>
      {/* champs corridor, montant, checkbox airtel */}
      {/* ... */}
      <div className="bg-ink-black rounded-xl p-4 mt-4 border border-emerald/15">
        <Row label="Montant envoyé" value={`${state.amount} €`} />
        <Row label="Frais Adôro" value={`${result?.fees_adoro ?? 0} €`} />
        <Row label="Total à envoyer" value={`${result?.total ?? 0} €`} />
        <Row label="Bénéficiaire reçoit" value={`${result?.received ?? 0} FCFA`} total />
      </div>
      <button className="w-full mt-4 bg-emerald text-ink-black font-bold py-3.5 rounded-xl uppercase tracking-wider hover:bg-emerald-light transition">
        📲 Envoyer via WhatsApp
      </button>
    </div>
  );
}
```

---

## 11. Docker Compose (7 services)

```yaml
# docker-compose.yml
version: "3.9"
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: adoro
      POSTGRES_USER: adoro
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes: [pg_data:/var/lib/postgresql/data]
    ports: ["5432:5432"]

  redis:
    image: redis:7-alpine
    volumes: [redis_data:/data]

  web:                    # Django + Gunicorn (HTTP)
    build: ./backend
    command: gunicorn adoro.wsgi:application --bind 0.0.0.0:8000 --workers 3
    env_file: .env
    depends_on: [postgres, redis]

  ws:                     # Daphne ASGI (WebSocket)
    build: ./backend
    command: daphne -b 0.0.0.0 -p 8001 adoro.asgi:application
    env_file: .env
    depends_on: [postgres, redis]

  celery_worker:
    build: ./backend
    command: celery -A adoro worker -l info
    env_file: .env
    depends_on: [redis, postgres]

  celery_beat:
    build: ./backend
    command: celery -A adoro beat -l info
    env_file: .env
    depends_on: [redis, postgres]

  frontend:               # Build statique React → servi par nginx
    build: ./frontend
    volumes: [front_dist:/app/dist]

  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
      - front_dist:/usr/share/nginx/html:ro
    depends_on: [web, ws]

volumes:
  pg_data:
  redis_data:
  front_dist:
```

### 11.1. Nginx routing

```nginx
# /api/*       → web (Gunicorn:8000)
# /django-admin → web
# /ws/*        → ws  (Daphne:8001)  + Upgrade headers
# /            → front_dist (SPA fallback index.html)
```

---

## 12. Sécurité

| Couche | Mesure |
|---|---|
| Transport | HTTPS partout (Let's Encrypt via Certbot) + HSTS |
| Auth admin | Django auth + bcrypt + JWT 1h + refresh httpOnly |
| Brute force | django-axes ou django-ratelimit (5 tentatives / 15 min) |
| Inputs | Serializers DRF avec validators stricts |
| CORS | django-cors-headers, whitelist domaine front |
| Headers | django-csp + middleware SecurityMiddleware |
| WS | Origin check (`ALLOWED_HOSTS`) + token JWT en query string pour admin |
| RGPD | Hash IP (SHA-256 + salt), pas de données bancaires, route DELETE |
| Secrets | Variables d'environnement (`.env`), jamais commit |
| Backups | `pg_dump` quotidien → S3 chiffré (cron host, 7 jours rolling) |

---

## 13. Structure du repo

```
adoro-transfert/
├── backend/
│   ├── adoro/                  # settings, urls, asgi, wsgi, celery
│   │   ├── settings.py
│   │   ├── celery.py
│   │   ├── asgi.py
│   │   └── urls.py
│   ├── accounts/               # AdminUser
│   ├── simulator/              # Transactions, calculator, consumers, routing
│   │   ├── consumers.py
│   │   ├── routing.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── calculator.py
│   ├── rates/                  # RatesHistory, tasks
│   │   ├── tasks.py
│   │   ├── models.py
│   │   └── views.py
│   ├── tariffs/                # FeesGrid, Settings
│   ├── notifications/          # Email, WhatsApp templates
│   ├── requirements.txt
│   ├── manage.py
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── ServicesPage.tsx
│   │   │   ├── TarifsPage.tsx
│   │   │   ├── FaqPage.tsx
│   │   │   ├── ContactPage.tsx
│   │   │   └── admin/
│   │   │       ├── AdminLayout.tsx
│   │   │       ├── LoginPage.tsx
│   │   │       ├── DashboardPage.tsx
│   │   │       ├── RatesPage.tsx
│   │   │       ├── TransactionsPage.tsx
│   │   │       └── SettingsPage.tsx
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Simulator.tsx
│   │   │   ├── CorridorCard.tsx
│   │   │   ├── TariffTable.tsx
│   │   │   ├── ProcessFlow.tsx
│   │   │   └── ui/             # Button, Input, Modal...
│   │   ├── hooks/
│   │   │   ├── useSimulatorSocket.ts
│   │   │   └── useAuth.ts
│   │   ├── lib/
│   │   │   ├── api.ts          # axios + interceptor JWT
│   │   │   └── whatsapp.ts     # builder URL wa.me
│   │   ├── store/              # zustand
│   │   └── main.tsx
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   ├── package.json
│   └── Dockerfile
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 14. requirements.txt backend

```
Django==5.0.6
djangorestframework==3.15.1
djangorestframework-simplejwt==5.3.1
django-cors-headers==4.3.1
django-axes==6.4.0
channels==4.1.0
channels-redis==4.2.0
daphne==4.1.2
gunicorn==22.0.0
celery==5.4.0
redis==5.0.4
psycopg2-binary==2.9.9
requests==2.32.0
python-decouple==3.8
Pillow==10.3.0
```

## 15. package.json frontend (extrait)

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.0",
    "@tanstack/react-query": "^5.40.0",
    "zustand": "^4.5.2",
    "axios": "^1.7.2",
    "react-use-websocket": "^4.8.1",
    "recharts": "^2.12.7",
    "lucide-react": "^0.378.0"
  },
  "devDependencies": {
    "vite": "^5.2.11",
    "typescript": "^5.4.5",
    "tailwindcss": "^3.4.3",
    "@types/react": "^18.3.2",
    "@types/react-dom": "^18.3.0"
  }
}
```

---

## 16. Roadmap d'implémentation (sprints d'une semaine)

| Sprint | Livrables |
|---|---|
| **S1** | Setup monorepo, Docker compose, Django + DRF, Postgres, modèles, Django Admin |
| **S2** | Auth JWT admin, settings de base, seed grille tarifaire FCFA/€ |
| **S3** | Frontend React + Vite + Tailwind + design émeraude (pages statiques) |
| **S4** | Simulateur fonctionnel (calcul serveur via `/api/transactions/preview`) |
| **S5** | Celery + Celery Beat + fetch taux (primaire + secondaire + fallback) |
| **S6** | Channels WebSocket : push rates + co-simulation room |
| **S7** | Admin React : dashboard, rates, transactions, settings + Recharts |
| **S8** | Emails (Nodemailer Django → SMTP), tests Pytest/Playwright, durcissement, déploiement VPS |

---

## 17. Critères de validation

✅ Le simulateur reflète exactement la grille tarifaire du CCTP (annexes 1 & 2)
✅ Les 8 corridors bidirectionnels fonctionnent avec leurs messages WhatsApp respectifs
✅ Le bouton WhatsApp redirige vers `wa.me/2417449818` avec message pré-rempli
✅ Une simulation déclenche un email vers `AdoroTransfert@gmail.com` ET enregistre en BDD
✅ Celery Beat fetch les taux à 06:00 UTC chaque jour, avec fallback automatique
✅ Le dashboard admin affiche un graphique des variations sur 30 jours minimum
✅ L'admin peut éditer la grille tarifaire et le changement est immédiat sur le site public
✅ Si je modifie le montant dans un onglet, un second onglet partagé voit la mise à jour en < 200 ms (WS Channels)
✅ Le design respecte la charte émeraude/sombre + polices Bebas Neue / DM Sans / Space Mono
✅ Responsive mobile (test 360 px)
✅ HTTPS + headers de sécurité valides (securityheaders.com → A minimum)
✅ `docker-compose up` lance les 7 services et le site est accessible localement

---

*Document v3.0 — stack Django + React + Tailwind + PostgreSQL + Redis + Docker.*
*Cohérent avec tes compétences : Linux, Docker, PostgreSQL, Python, JavaScript/TypeScript, IDE VS Code.*
