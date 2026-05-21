import json
from decimal import Decimal
from django.test import TransactionTestCase
from channels.testing import WebsocketCommunicator
from adoro.asgi import application
from tariffs.models import FeesGrid

class SimulatorWebSocketTests(TransactionTestCase):
    async def test_websocket_connection_and_simulation(self):
        # We need to test the websocket logic
        communicator = WebsocketCommunicator(application, "/ws/simulator/test_session_123/")
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected, "Failed to connect to websocket")

        # Send a simulation request
        await communicator.send_json_to({
            "type": "sim:change",
            "payload": {
                "corridor": "EUR_XAF",
                "amount": 100,
                "includeAirtel": False,
                "rate": 655.96
            }
        })

        # Receive the response
        response = await communicator.receive_json_from()
        
        self.assertEqual(response["type"], "sim:sync")
        self.assertIn("amount_sent", response["payload"])
        self.assertEqual(response["payload"]["amount_sent"], "100")
        self.assertIn("amount_received", response["payload"])

        await communicator.disconnect()

