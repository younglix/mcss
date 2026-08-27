import re

from django.db import transaction
from django.utils import timezone

from .models import NumberSequence, SystemSetting

_SEQ_TOKEN = re.compile(r"\{seq(?::0(\d+))?\}")


def _default_format(key):
    return {
        "admission": "MC/{year}/{seq:04}",
        "application": "APP/{year}/{seq:05}",
        "staff": "STF/{year}/{seq:04}",
        "receipt": "RCT/{year}/{seq:05}",
        "invoice": "INV/{year}/{seq:05}",
        "expense": "EXP/{year}/{seq:05}",
        "registration": "REG/{year}/{seq:04}",
    }.get(key, "{year}/{seq:05}")


def generate_number(key, setting_key=None):
    """Generates the next formatted number for `key` (e.g. "admission"),
    reading the format string from the `numbering.<setting_key or key>_format`
    SystemSetting. Atomically increments a per-(key, year) counter so
    concurrent requests never hand out the same number twice.
    """
    format_setting_key = f"numbering.{setting_key or key}_format"
    setting = SystemSetting.objects.filter(key=format_setting_key).first()
    fmt = setting.value if setting else _default_format(key)

    year = timezone.now().year
    with transaction.atomic():
        seq_row, _created = NumberSequence.objects.select_for_update().get_or_create(key=key, year=year)
        seq_row.last_seq += 1
        seq_row.save(update_fields=["last_seq"])
        seq = seq_row.last_seq

    def replace_seq(match):
        width = match.group(1)
        return str(seq).zfill(int(width)) if width else str(seq)

    return _SEQ_TOKEN.sub(replace_seq, fmt.replace("{year}", str(year)))
