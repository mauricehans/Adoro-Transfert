"""
Unit tests for Simulator ↔ WebSocket link.
Tests the calculator logic and the WebSocket consumer integration.

Run with: python manage.py test simulator --verbosity=2
"""

import json
from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase, TransactionTestCase, override_settings
from channels.testing import WebsocketCommunicator
from channels.layers import get_channel_layer
from channels.routing import URLRouter

from simulator.calculator import recalculate
from simulator.consumers import SimulatorConsumer
from simulator.routing import websocket_urlpatterns


# ─────────────────────────────────────────────────────────────────────
# 1. Calculator unit tests (pure logic, no DB/WS)
# ─────────────────────────────────────────────────────────────────────


MOCK_EUR_TARIFFS = [
    {"min": 1, "max": 50, "fee": 3},
    {"min": 51, "max": 100, "fee": 5},
    {"min": 101, "max": 200, "fee": 8},
    {"min": 201, "max": 500, "fee": 10},
    {"min": 501, "max": None, "fee": 15},
]

MOCK_FCFA_TARIFFS = [
    {"min": 1000, "max": 50000, "fee": 1000},
    {"min": 50001, "max": 100000, "fee": 2000},
    {"min": 100001, "max": None, "fee": 3000},
]

MOCK_MAD_TARIFFS = [
    {"min": 10, "max": 500, "fee": 10},
    {"min": 501, "max": 1000, "fee": 20},
    {"min": 1001, "max": None, "fee": 35},
]

MOCK_RATES = {
    "FR_GA": Decimal("655.957"),
    "GA_FR": Decimal("655.957"),
    "FR_CM": Decimal("655.957"),
    "CM_FR": Decimal("655.957"),
    "FR_SN": Decimal("655.957"),
    "SN_FR": Decimal("655.957"),
    "FR_MA": Decimal("10.90"),
    "MA_FR": Decimal("10.90"),
}

MOCK_RATE = Decimal("655.957")


def mock_get_tariffs(key):
    if key == "eur_tariffs":
        return MOCK_EUR_TARIFFS
    elif key == "fcfa_tariffs":
        return MOCK_FCFA_TARIFFS
    elif key == "mad_tariffs":
        return MOCK_MAD_TARIFFS
    return []


def mock_get_rate(corridor):
    return MOCK_RATES.get(corridor, MOCK_RATE)


@patch("simulator.calculator.get_rate_for_corridor", side_effect=mock_get_rate)
@patch("simulator.calculator.get_tariffs", side_effect=mock_get_tariffs)
class CalculatorTest(TestCase):
    """Test recalculate() with mocked tariffs and rate."""

    def test_eur_to_xaf_basic(self, _mock_tariffs, _mock_rate):
        """100€ FR→GA at 655.957: fee=5€, received=65595.70 FCFA."""
        result = recalculate({
            "corridor": "FR_GA",
            "amount": 100,
            "include_airtel_fee": False,
        })
        self.assertEqual(result["corridor"], "FR_GA")
        self.assertEqual(result["amount_sent"], Decimal("100"))
        self.assertEqual(result["currency_sent"], "EUR")
        self.assertEqual(result["adoro_fee"], Decimal("5"))
        self.assertEqual(result["airtel_fee"], Decimal("0"))
        self.assertEqual(result["total_to_send"], Decimal("105"))
        self.assertEqual(result["amount_received"], Decimal("65595.70"))
        self.assertEqual(result["rate"], MOCK_RATE)

    def test_eur_to_xaf_with_airtel_below_cap(self, _mock_tariffs, _mock_rate):
        """100€ with Airtel: 3% of 65595.70 = 1967.87 (below 5000 cap)."""
        result = recalculate({
            "corridor": "FR_GA",
            "amount": 100,
            "include_airtel_fee": True,
        })
        self.assertEqual(result["airtel_fee"], Decimal("1967.87"))
        self.assertGreater(result["total_to_send"], Decimal("105"))

    def test_airtel_fee_capped_at_5000(self, _mock_tariffs, _mock_rate):
        """500€: 3% of 327978.50 = 9839.36 → capped at 5000 FCFA."""
        result = recalculate({
            "corridor": "FR_GA",
            "amount": 500,
            "include_airtel_fee": True,
        })
        self.assertEqual(result["airtel_fee"], Decimal("5000"))

    def test_xaf_to_eur(self, _mock_tariffs, _mock_rate):
        """50000 FCFA GA→FR: fee=1000, received ≈ 76.22 EUR."""
        result = recalculate({
            "corridor": "GA_FR",
            "amount": 50000,
            "include_airtel_fee": False,
        })
        self.assertEqual(result["currency_sent"], "XAF")
        self.assertEqual(result["currency_received"], "EUR")
        self.assertEqual(result["adoro_fee"], Decimal("1000"))
        self.assertAlmostEqual(float(result["amount_received"]), 76.22, places=1)

    def test_zero_amount_returns_zeros(self, _mock_tariffs, _mock_rate):
        """Zero amount → all values zero."""
        result = recalculate({"corridor": "FR_GA", "amount": 0})
        self.assertEqual(result["amount_sent"], Decimal("0"))
        self.assertEqual(result["total_to_send"], Decimal("0"))
        self.assertEqual(result["amount_received"], Decimal("0"))

    def test_negative_amount_returns_zeros(self, _mock_tariffs, _mock_rate):
        """Negative amount → treated as zero."""
        result = recalculate({"corridor": "FR_GA", "amount": -50})
        self.assertEqual(result["amount_sent"], Decimal("0"))

    def test_includeAirtel_alias_works(self, _mock_tariffs, _mock_rate):
        """Frontend sends 'includeAirtel' instead of 'include_airtel_fee'."""
        result = recalculate({
            "corridor": "FR_GA",
            "amount": 100,
            "includeAirtel": True,
        })
        self.assertGreater(result["airtel_fee"], Decimal("0"))

    def test_no_matching_tariff_fee_is_zero(self, _mock_tariffs, _mock_rate):
        """If no tariff matches, fee = 0."""
        with patch("simulator.calculator.get_tariffs", return_value=[{"min": 1, "max": 10, "fee": 2}]):
            result = recalculate({
                "corridor": "FR_GA",
                "amount": 100,
                "include_airtel_fee": False,
            })
            self.assertEqual(result["adoro_fee"], Decimal("0"))

    def test_different_corridors(self, _mock_tariffs, _mock_rate):
        """Test FR_CM, FR_SN, FR_MA corridors."""
        expected_currencies = {"FR_CM": "XAF", "FR_SN": "XOF", "FR_MA": "MAD"}
        for corridor, expected_curr in expected_currencies.items():
            result = recalculate({
                "corridor": corridor,
                "amount": 100,
                "include_airtel_fee": False,
            })
            self.assertEqual(result["corridor"], corridor)
            self.assertEqual(result["currency_sent"], "EUR")
            self.assertEqual(result["currency_received"], expected_curr)
            self.assertGreater(result["amount_received"], Decimal("0"))

    def test_rate_comes_from_bdd(self, _mock_tariffs, _mock_rate):
        """Rate should come from get_rate_for_corridor, not from client."""
        result = recalculate({
            "corridor": "FR_GA",
            "amount": 100,
            "rate": "999.999",
            "include_airtel_fee": False,
        })
        self.assertEqual(result["rate"], MOCK_RATE)

    def test_fr_ma_uses_mad_currency(self, _mock_tariffs, _mock_rate):
        """FR→MA corridor uses MAD, not XAF."""
        result = recalculate({
            "corridor": "FR_MA",
            "amount": 100,
            "include_airtel_fee": False,
        })
        self.assertEqual(result["currency_sent"], "EUR")
        self.assertEqual(result["currency_received"], "MAD")
        self.assertEqual(result["rate"], Decimal("10.90"))
        expected_received = (Decimal("100") * Decimal("10.90")).quantize(Decimal("0.01"))
        self.assertEqual(result["amount_received"], expected_received)

    def test_ma_fr_uses_mad_currency(self, _mock_tariffs, _mock_rate):
        """MA→FR corridor: currency_sent=MAD, currency_received=EUR."""
        result = recalculate({
            "corridor": "MA_FR",
            "amount": 1000,
            "include_airtel_fee": False,
        })
        self.assertEqual(result["currency_sent"], "MAD")
        self.assertEqual(result["currency_received"], "EUR")
        self.assertEqual(result["rate"], Decimal("10.90"))
        expected_received = (Decimal("1000") / Decimal("10.90")).quantize(Decimal("0.01"))
        self.assertEqual(result["amount_received"], expected_received)

    def test_airtel_ignored_for_morocco(self, _mock_tariffs, _mock_rate):
        """Airtel fee should not apply to Morocco corridors."""
        result = recalculate({
            "corridor": "FR_MA",
            "amount": 100,
            "include_airtel_fee": True,
        })
        self.assertEqual(result["airtel_fee"], Decimal("0"))

    def test_ma_fr_uses_mad_tariffs(self, _mock_tariffs, _mock_rate):
        """MA→FR uses mad_tariffs, not fcfa_tariffs."""
        result = recalculate({
            "corridor": "MA_FR",
            "amount": 1000,
            "include_airtel_fee": False,
        })
        self.assertEqual(result["adoro_fee"], Decimal("20"))


# ─────────────────────────────────────────────────────────────────────
# 2. WebSocket consumer integration tests
# ─────────────────────────────────────────────────────────────────────


@override_settings(
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}
)
class WebSocketConnectionTest(TransactionTestCase):
    """Test WebSocket connect/disconnect lifecycle."""

    def _get_app(self):
        return URLRouter(websocket_urlpatterns)

    async def test_connection_accepted(self):
        """WebSocket connection should be accepted."""
        communicator = WebsocketCommunicator(self._get_app(), "/ws/simulator/session-001/")
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        await communicator.disconnect()

    async def test_disconnect_is_clean(self):
        """Disconnect should not error."""
        communicator = WebsocketCommunicator(self._get_app(), "/ws/simulator/session-002/")
        await communicator.connect()
        await communicator.disconnect()

    async def test_invalid_url_rejected(self):
        """Invalid URL pattern should raise ValueError (no route found)."""
        communicator = WebsocketCommunicator(self._get_app(), "/ws/invalid/")
        with self.assertRaises(ValueError):
            await communicator.connect()


@override_settings(
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}
)
class WebSocketSimulationTest(TransactionTestCase):
    """Test sim:change → sim:sync flow over WebSocket."""

    def _get_app(self):
        return URLRouter(websocket_urlpatterns)

    @patch("simulator.calculator.get_rate_for_corridor", return_value=MOCK_RATE)
    @patch("simulator.calculator.get_tariffs", side_effect=mock_get_tariffs)
    async def test_sim_change_returns_sync(self, _mock_tariffs, _mock_rate):
        """Sending sim:change returns sim:sync with calculated result."""
        communicator = WebsocketCommunicator(self._get_app(), "/ws/simulator/calc-test/")
        await communicator.connect()

        await communicator.send_json_to({
            "type": "sim:change",
            "payload": {
                "corridor": "FR_GA",
                "amount": 100,
                "include_airtel_fee": False,
            },
        })

        response = await communicator.receive_json_from(timeout=5)
        self.assertEqual(response["type"], "sim:sync")
        self.assertIn("amount_received", response["payload"])
        self.assertIn("adoro_fee", response["payload"])
        self.assertEqual(response["payload"]["corridor"], "FR_GA")
        await communicator.disconnect()

    @patch("simulator.calculator.get_rate_for_corridor", return_value=MOCK_RATE)
    @patch("simulator.calculator.get_tariffs", side_effect=mock_get_tariffs)
    async def test_sim_change_with_airtel(self, _mock_tariffs, _mock_rate):
        """sim:change with include_airtel_fee returns non-zero airtel_fee."""
        communicator = WebsocketCommunicator(self._get_app(), "/ws/simulator/airtel-test/")
        await communicator.connect()

        await communicator.send_json_to({
            "type": "sim:change",
            "payload": {
                "corridor": "FR_GA",
                "amount": 200,
                "include_airtel_fee": True,
            },
        })

        response = await communicator.receive_json_from(timeout=5)
        self.assertEqual(response["type"], "sim:sync")
        airtel = Decimal(response["payload"]["airtel_fee"])
        self.assertGreater(airtel, Decimal("0"))
        await communicator.disconnect()

    async def test_unknown_event_ignored(self):
        """Unknown event type should not crash or return anything."""
        communicator = WebsocketCommunicator(self._get_app(), "/ws/simulator/unknown-test/")
        await communicator.connect()

        await communicator.send_json_to({"type": "unknown:event", "payload": {}})

        nothing = await communicator.receive_nothing(timeout=1)
        self.assertTrue(nothing)
        await communicator.disconnect()


@override_settings(
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}
)
class WebSocketBroadcastTest(TransactionTestCase):
    """Test broadcasting behavior between clients."""

    def _get_app(self):
        return URLRouter(websocket_urlpatterns)

    @patch("simulator.calculator.get_rate_for_corridor", return_value=MOCK_RATE)
    @patch("simulator.calculator.get_tariffs", side_effect=mock_get_tariffs)
    async def test_same_room_receives_broadcast(self, _mock_tariffs, _mock_rate):
        """Two clients in same room both receive sim:sync."""
        app = self._get_app()
        client_a = WebsocketCommunicator(app, "/ws/simulator/shared-room/")
        client_b = WebsocketCommunicator(app, "/ws/simulator/shared-room/")

        await client_a.connect()
        await client_b.connect()

        await client_a.send_json_to({
            "type": "sim:change",
            "payload": {"corridor": "FR_GA", "amount": 50, "include_airtel_fee": False},
        })

        response_a = await client_a.receive_json_from(timeout=5)
        response_b = await client_b.receive_json_from(timeout=5)

        self.assertEqual(response_a["type"], "sim:sync")
        self.assertEqual(response_b["type"], "sim:sync")
        self.assertEqual(response_a["payload"]["corridor"], "FR_GA")
        self.assertEqual(response_b["payload"]["corridor"], "FR_GA")

        await client_a.disconnect()
        await client_b.disconnect()

    @patch("simulator.calculator.get_rate_for_corridor", return_value=MOCK_RATE)
    @patch("simulator.calculator.get_tariffs", side_effect=mock_get_tariffs)
    async def test_different_rooms_isolated(self, _mock_tariffs, _mock_rate):
        """Clients in different rooms don't receive each other's messages."""
        app = self._get_app()
        client_a = WebsocketCommunicator(app, "/ws/simulator/room-A/")
        client_b = WebsocketCommunicator(app, "/ws/simulator/room-B/")

        await client_a.connect()
        await client_b.connect()

        await client_a.send_json_to({
            "type": "sim:change",
            "payload": {"corridor": "FR_GA", "amount": 50, "include_airtel_fee": False},
        })

        # A receives
        response_a = await client_a.receive_json_from(timeout=5)
        self.assertEqual(response_a["type"], "sim:sync")

        # B receives nothing
        nothing = await client_b.receive_nothing(timeout=1)
        self.assertTrue(nothing)

        await client_a.disconnect()
        await client_b.disconnect()

    async def test_rates_update_reaches_all_sessions(self):
        """rates:update from Celery reaches all connected simulators."""
        app = self._get_app()
        client_a = WebsocketCommunicator(app, "/ws/simulator/session-1/")
        client_b = WebsocketCommunicator(app, "/ws/simulator/session-2/")

        await client_a.connect()
        await client_b.connect()

        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            "rates_global",
            {
                "type": "rates.update",
                "payload": {
                    "date": "2026-05-22",
                    "source": "exchangerate_host",
                    "rates": {"XAF": 656.0, "XOF": 656.0, "USD": 1.09},
                },
            },
        )

        response_a = await client_a.receive_json_from(timeout=2)
        response_b = await client_b.receive_json_from(timeout=2)

        self.assertEqual(response_a["type"], "rates:update")
        self.assertEqual(response_b["type"], "rates:update")
        self.assertEqual(response_a["payload"]["rates"]["XAF"], 656.0)
        self.assertEqual(response_b["payload"]["rates"]["XAF"], 656.0)

        await client_a.disconnect()
        await client_b.disconnect()

    async def test_rates_update_after_disconnect_no_error(self):
        """Sending to group after client disconnects should not error."""
        app = self._get_app()
        client = WebsocketCommunicator(app, "/ws/simulator/disc-test/")
        await client.connect()
        await client.disconnect()

        channel_layer = get_channel_layer()
        # Should not raise
        await channel_layer.group_send(
            "rates_global",
            {"type": "rates.update", "payload": {"rates": {"XAF": 655}}},
        )
