from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async


@database_sync_to_async
def _user_role_slugs(user):
    if user.is_superadmin:
        return ["super_admin"]
    return list(user.user_roles.select_related("role").values_list("role__slug", flat=True))


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]
        if user is None or user.is_anonymous:
            await self.close()
            return

        role_slugs = await _user_role_slugs(user)
        self.groups_joined = [f"user.{user.id}"] + [f"role.{slug}" for slug in role_slugs]
        for group in self.groups_joined:
            await self.channel_layer.group_add(group, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        for group in getattr(self, "groups_joined", []):
            await self.channel_layer.group_discard(group, self.channel_name)

    # server -> client, dispatched via group_send(..., {"type": "notify", ...})
    async def notify(self, event):
        await self.send_json(event["payload"])
