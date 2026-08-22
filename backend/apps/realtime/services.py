from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def push_to_user(user_id, payload):
    async_to_sync(get_channel_layer().group_send)(
        f"user.{user_id}", {"type": "notify", "payload": payload}
    )


def push_to_role(role_slug, payload):
    async_to_sync(get_channel_layer().group_send)(
        f"role.{role_slug}", {"type": "notify", "payload": payload}
    )
