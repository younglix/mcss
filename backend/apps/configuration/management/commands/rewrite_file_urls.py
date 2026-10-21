"""Rewrite stored file links after moving uploads to a new storage provider.

Uploads don't live in FileFields: every upload view returns
default_storage.url(...) and the frontend saves that ABSOLUTE URL into plain
text/JSON columns (school logo, avatars, custom-field attachments, HR
documents, resources, settings...). So after copying the bucket to a new
provider (e.g. AWS S3 -> Cloudflare R2, same object keys), every one of those
saved links still points at the old host until it's rewritten here.

    manage.py rewrite_file_urls --scan
        List the storage URL prefixes currently saved in the database.
    manage.py rewrite_file_urls --from-aws --bucket mcss-assets --to https://pub-xxxx.r2.dev/
        Dry run: show what would change (that bucket's AWS S3 prefixes -> --to).
    manage.py rewrite_file_urls --from https://old.example/ --to https://new.example/ --apply
        Make the change (one transaction).

Scans every CharField/TextField (incl. URLField) and JSONField on this
project's own models. Audit logs are left alone on purpose: they record what
was true at the time.
"""

import json
import re
from collections import Counter

from django.apps import apps
from django.core.management.base import BaseCommand, CommandError
from django.db import models, transaction
from django.db.models import F, Q, TextField, Value
from django.db.models.functions import Cast, Replace

STORAGE_HOST_MARKERS = ("amazonaws.com", "r2.dev", "r2.cloudflarestorage.com")
SKIPPED_APPS = {"audit"}
_URL_PREFIX = re.compile(r"https?://[^/\s\"'<>]+/")


def _scannable_fields():
    """(model, field, is_json) for every text-ish column on our own apps."""
    for model in apps.get_models():
        meta = model._meta
        if meta.proxy or not meta.managed or not model.__module__.startswith("apps."):
            continue
        if meta.app_label in SKIPPED_APPS:
            continue
        for field in meta.concrete_fields:
            if isinstance(field, models.JSONField):
                yield model, field, True
            elif isinstance(field, (models.CharField, models.TextField)) and not field.choices:
                yield model, field, False


def _rows_containing(model, field, is_json, needle):
    qs = model._base_manager.all()
    if is_json:
        return qs.annotate(_txt=Cast(field.name, TextField())).filter(_txt__contains=needle)
    return qs.filter(**{f"{field.name}__contains": needle})


def _prefix_of(url):
    """scheme://host/ — plus the bucket segment for path-style S3 URLs
    (https://s3.<region>.amazonaws.com/<bucket>/key), so the prefix is
    always the part that's identical for every file in one bucket."""
    m = _URL_PREFIX.match(url)
    if not m:
        return None
    prefix = m.group(0)
    host = prefix.split("/")[2]
    if host.startswith("s3.") or host.startswith("s3-"):
        rest = url[len(prefix):].split("/", 1)
        if len(rest) == 2:
            prefix += rest[0] + "/"
    return prefix


def scan_storage_prefixes():
    """Counter of storage URL prefixes saved anywhere in the database."""
    found = Counter()
    for model, field, is_json in _scannable_fields():
        q = Q()
        for marker in STORAGE_HOST_MARKERS:
            q |= Q(**{f"{field.name}__contains": marker}) if not is_json else Q(_txt__contains=marker)
        qs = model._base_manager.all()
        if is_json:
            qs = qs.annotate(_txt=Cast(field.name, TextField()))
        for value in qs.filter(q).values_list(field.name, flat=True):
            text = json.dumps(value) if is_json else (value or "")
            for match in re.finditer(r"https?://[^\s\"'<>]+", text):
                prefix = _prefix_of(match.group(0))
                if prefix and any(marker in prefix for marker in STORAGE_HOST_MARKERS):
                    found[prefix] += 1
    return found


def rewrite(old, new, *, apply):
    """{"model.field": rows_changed} for one old -> new prefix."""
    changed = {}
    for model, field, is_json in _scannable_fields():
        rows = _rows_containing(model, field, is_json, old)
        count = rows.count()
        if not count:
            continue
        changed[f"{model._meta.label}.{field.name}"] = count
        if not apply:
            continue
        if is_json:
            for pk, value in rows.values_list("pk", field.name):
                new_value = json.loads(json.dumps(value).replace(old, new))
                model._base_manager.filter(pk=pk).update(**{field.name: new_value})
        else:
            model._base_manager.filter(**{f"{field.name}__contains": old}).update(
                **{field.name: Replace(F(field.name), Value(old), Value(new))}
            )
    return changed


class Command(BaseCommand):
    help = "Rewrite saved file links after moving uploads to a new storage provider (dry run unless --apply)."

    def add_arguments(self, parser):
        parser.add_argument("--scan", action="store_true", help="Only list the storage URL prefixes in use.")
        parser.add_argument("--from", dest="old", action="append", default=[], help="Old URL prefix (repeatable).")
        parser.add_argument("--from-aws", action="store_true", help="Use every AWS S3 prefix found by --scan as --from.")
        parser.add_argument(
            "--bucket", help="With --from-aws: only that bucket's prefixes, so unrelated AWS links are left alone.",
        )
        parser.add_argument("--to", dest="new", help="New URL prefix, e.g. https://pub-xxxx.r2.dev/")
        parser.add_argument("--apply", action="store_true", help="Actually write the changes.")

    def handle(self, *args, **opts):
        if opts["scan"]:
            found = scan_storage_prefixes()
            if not found:
                self.stdout.write("No storage URLs found in the database.")
            for prefix, n in found.most_common():
                self.stdout.write(f"{n:6d}  {prefix}")
            return

        olds = list(opts["old"])
        if opts["from_aws"]:
            bucket = opts["bucket"]
            olds += [
                p for p in scan_storage_prefixes()
                if "amazonaws.com" in p and (not bucket or f"//{bucket}." in p or f"/{bucket}/" in p)
            ]
        new = opts["new"]
        if not olds or not new:
            raise CommandError("Pass --to and at least one --from (or --from-aws). Use --scan to see what's stored.")
        if not new.endswith("/"):
            new += "/"
        olds = [o if o.endswith("/") else o + "/" for o in dict.fromkeys(olds)]
        if new in olds:
            raise CommandError("--to is the same as a --from prefix.")

        verb = "Rewrote" if opts["apply"] else "Would rewrite"
        with transaction.atomic():
            total = 0
            for old in olds:
                changed = rewrite(old, new, apply=opts["apply"])
                self.stdout.write(f"{old} -> {new}")
                for where, n in sorted(changed.items()):
                    self.stdout.write(f"  {n:6d} row(s)  {where}")
                    total += n
            self.stdout.write(f"{verb} {total} row(s) in total.")
        if not opts["apply"]:
            self.stdout.write("Dry run only. Re-run with --apply to save the changes.")
