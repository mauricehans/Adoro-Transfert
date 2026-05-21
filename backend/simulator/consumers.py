"""
WebSocket consumers for the simulator app.
"""

import json

from channels.generic.websocket import AsyncWebsocketConsumer

from .calculator import recalculate


class SimulatorConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time simulation.
    Joins room sim_{session_id} and rates_global group.
    """

    async def connect(self):
        self.session_id = self.scope["url_route"]["kwargs"]["session_id"]
        self.room_group = f"sim_{self.session_id}"
        self.rates_group = "rates_global"

        # Join simulation room
        await self.channel_layer.group_add(self.room_group, self.channel_name)
        # Join global rates group
        await self.channel_layer.group_add(self.rates_group, self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group, self.channel_name)
        await self.channel_layer.group_discard(self.rates_group, self.channel_name)

    async def receive(self, text_data):
        """Handle incoming WebSocket messages."""
        data = json.loads(text_data)
        event_type = data.get("type")

        if event_type == "sim:change":
            await self.handle_sim_change(data.get("payload", {}))

    async def handle_sim_change(self, payload):
        """Recalculate and broadcast result to the room."""
        from asgiref.sync import sync_to_async

        result = await sync_to_async(recalculate)(payload)

        # Convert Decimals to strings for JSON serialization
        serialized_result = {k: str(v) for k, v in result.items()}

        # Broadcast to room
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
