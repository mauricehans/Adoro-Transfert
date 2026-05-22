"""
WebSocket consumers for the simulator app.

Security:
- Origin check against ALLOWED_HOSTS / CORS_ALLOWED_ORIGINS
- Per-connection rate limiting (max 10 messages/sec, burst 20)
- Payload size cap
- Validation of incoming events
"""

import json
import time
from urllib.parse import urlparse

from channels.generic.websocket import AsyncWebsocketConsumer
from django.conf import settings

from .calculator import recalculate

MAX_PAYLOAD_BYTES = 4 * 1024  # 4 KB
RATE_WINDOW_SEC = 1.0
RATE_MAX_PER_WINDOW = 10
BURST_LIMIT = 20


def _allowed_origins() -> set[str]:
    """Build a set of allowed origin hosts (host:port) for WS connections."""
    hosts = set()
    for origin in getattr(settings, "CORS_ALLOWED_ORIGINS", []):
        try:
            hosts.add(urlparse(origin).netloc)
        except Exception:
            pass
    for h in getattr(settings, "ALLOWED_HOSTS", []):
        if h and h != "*":
            hosts.add(h)
    # Always allow localhost during dev
    hosts.update({"localhost", "127.0.0.1", "localhost:5173", "127.0.0.1:5173"})
    return {h for h in hosts if h}


class SimulatorConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time simulation.
    Joins room sim_{session_id} and rates_global group.
    """

    async def connect(self):
        # ----- Origin check -----
        headers = dict(self.scope.get("headers") or [])
        origin = headers.get(b"origin", b"").decode("latin-1")
        host = headers.get(b"host", b"").decode("latin-1")
        allowed = _allowed_origins()

        if origin:
            origin_host = urlparse(origin).netloc
            if allowed and origin_host and origin_host not in allowed:
                # Reject — origin not whitelisted
                await self.close(code=4403)
                return
        elif host and allowed and host not in allowed:
            await self.close(code=4403)
            return

        # ----- Validate session id format (alphanum + dashes, length-bounded) -----
        session_id = self.scope["url_route"]["kwargs"]["session_id"]
        if not session_id or len(session_id) > 64 or not all(
            c.isalnum() or c in "-_" for c in session_id
        ):
            await self.close(code=4400)
            return

        self.session_id = session_id
        self.room_group = f"sim_{self.session_id}"
        self.rates_group = "rates_global"

        # Init throttle state
        self._msg_times: list[float] = []

        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.channel_layer.group_add(self.rates_group, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "room_group"):
            await self.channel_layer.group_discard(self.room_group, self.channel_name)
        if hasattr(self, "rates_group"):
            await self.channel_layer.group_discard(self.rates_group, self.channel_name)

    def _check_rate_limit(self) -> bool:
        """Sliding-window rate limit. Returns True if message is allowed."""
        now = time.monotonic()
        cutoff = now - RATE_WINDOW_SEC
        self._msg_times = [t for t in self._msg_times if t > cutoff]
        if len(self._msg_times) >= RATE_MAX_PER_WINDOW:
            return False
        self._msg_times.append(now)
        return True

    async def receive(self, text_data=None, bytes_data=None):
        """Handle incoming WebSocket messages."""
        if text_data is None:
            return
        if len(text_data) > MAX_PAYLOAD_BYTES:
            return

        if not self._check_rate_limit():
            await self.send(text_data=json.dumps({
                "type": "error",
                "payload": {"code": "rate_limited", "detail": "Trop de messages."},
            }))
            return

        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        if not isinstance(data, dict):
            return

        event_type = data.get("type")

        if event_type == "sim:change":
            payload = data.get("payload", {})
            if isinstance(payload, dict):
                await self.handle_sim_change(payload)

    async def handle_sim_change(self, payload):
        """Recalculate and broadcast result to the room."""
        from asgiref.sync import sync_to_async

        # Whitelist the fields we pass to the calculator
        safe_payload = {
            "corridor": str(payload.get("corridor", "FR_GA"))[:10],
            "amount": payload.get("amount", 0),
            "include_airtel_fee": bool(payload.get("include_airtel_fee", False)),
        }

        try:
            result = await sync_to_async(recalculate)(safe_payload)
        except Exception:
            await self.send(text_data=json.dumps({
                "type": "error",
                "payload": {"code": "calc_error", "detail": "Erreur de calcul."},
            }))
            return

        serialized_result = {k: str(v) for k, v in result.items()}

        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "sim.sync",
                "payload": serialized_result,
            },
        )

    async def sim_sync(self, event):
        """Send sim:sync event to WebSocket client."""
        await self.send(text_data=json.dumps({
            "type": "sim:sync",
            "payload": event["payload"],
        }))

    async def rates_update(self, event):
        """Send rates:update event to WebSocket client."""
        await self.send(text_data=json.dumps({
            "type": "rates:update",
            "payload": event["payload"],
        }))
