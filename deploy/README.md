# Moving Mount Carmel ERP from AWS to Contabo

After this move:

- The app runs on the Contabo VPS at **http://169.58.243.48/** (plain HTTP until
  the new domain is ready; see the last section).
- Uploaded files (logos, photos, documents) live in **Cloudflare R2** instead of AWS S3.
- Pushing to `main` still deploys automatically, now to Contabo.
- The database is backed up every night on the new server.

You run every command yourself. The scripts stop and ask you whenever they need
something (a GitHub click, or the R2 keys).

**Time:** about an hour in total. The site is offline from step 3 until step 4
finishes, usually 20 to 40 minutes, so pick a quiet time such as an evening.

---

## 0. Before you start

1. **Replace the credentials that were pasted into chat.** Revoke the Cloudflare
   API token (Cloudflare: *My Profile > API Tokens*) and the GitHub token
   (https://github.com/settings/tokens). Also remove the pasted SSH key from the
   AWS server's `~/.ssh/authorized_keys` once the move is done. You won't need
   any of them.
2. **Change the Contabo root password** the first time you log in (step 2).
3. Make sure the latest code has deployed to the AWS server: the newest run
   under https://github.com/younglix/mcss/actions should be green. Step 3 packs
   up the scripts that are on that server, so they need to be current.

## 1. Create the R2 bucket (Cloudflare dashboard)

1. Log in at https://dash.cloudflare.com and open **R2 Object Storage** from the
   left menu. The first time, Cloudflare asks you to enable R2. The free tier
   includes 10 GB.
2. **Create bucket**: name it `mcss-files`, location *Automatic*, then **Create bucket**.
3. Open the bucket > **Settings** > **Public access** > **R2.dev subdomain** >
   **Allow Access** (type `allow` to confirm). Copy the **Public R2.dev Bucket
   URL**, which looks like `https://pub-1234abcd....r2.dev`.
4. Back on the R2 overview page, click **Manage API tokens** (or **API** >
   **Manage API tokens**) > **Create API token**:
   - Permissions: **Object Read & Write**
   - Specify bucket: **Apply to specific buckets only** > `mcss-files`
   - **Create API token**, then copy the **Access Key ID** and **Secret Access Key**.
     The secret is shown only once.
5. Note your **Account ID**. It's shown on the R2 overview page, and it's also the
   first part of the S3 endpoint `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.

You now have five values: account ID, bucket name, access key ID, secret access
key, and public URL. Keep them somewhere private. You'll type them into the new
server in step 4. Never paste them into a chat or email.

## 2. First login to the Contabo server

From PowerShell on your computer:

```powershell
ssh root@169.58.243.48
```

Enter the password from Contabo's email, then set a new one straight away:

```bash
passwd
```

Type `exit` to log out.

## 3. Export from the AWS server

Log in to the AWS server the way you normally do, then run:

```bash
sudo bash /srv/mcss/deploy/export-from-aws.sh
```

This **stops the app on AWS** (so nothing new is written), keeps it from
starting again, and creates `/root/mcss-export.tar.gz`. That file contains the
database and the app's secrets, so treat it like a password.

Copy it to the new server. You'll be asked for the Contabo root password:

```bash
sudo scp /root/mcss-export.tar.gz root@169.58.243.48:/root/
```

> **Practice run (optional, recommended):** run the export with `--keep-running`
> first. AWS stays live, and you can try steps 4 and 6 on a copy of the data.
> Don't do step 5 during a practice run. When you're happy, repeat steps 3 and 4
> without `--keep-running` for the real move. The setup script is safe to run
> again: it replaces the database with the new export and only copies files
> that are new.

## 4. Set up the Contabo server

The server can run Ubuntu 24.04 or Debian 12. Log in to Contabo
(`ssh root@169.58.243.48`) and run:

```bash
tar -xzf /root/mcss-export.tar.gz -C /root
bash /root/mcss-export/deploy-kit/setup-server.sh /root/mcss-export
```

It works through 10 stages and stops twice for you:

1. **GitHub deploy key.** It prints one line starting with `ssh-ed25519`. Open the
   link it shows (the repo's *Settings > Deploy keys > Add deploy key*), paste
   the line, leave **Allow write access unticked**, click **Add key**, then
   press Enter in the terminal.
2. **R2 details.** Type in the five values from step 1. The secret key doesn't
   show while you type. The script then copies every uploaded file from AWS S3
   to R2, checks that they all arrived, and updates the file links saved in the
   database.

When it finishes, it prints **Done. The site is live at http://169.58.243.48/**,
followed by step 5's instructions and a private key.

If it stops with an error, read the message: most can be fixed and the script
simply run again. If you're stuck, send me the error text, **not** the key or
`.env` contents.

## 5. Point GitHub's automatic deploys at Contabo

Open https://github.com/younglix/mcss/settings/secrets/actions and update the
three repository secrets with what the setup script printed:

| Secret        | New value                                                   |
|---------------|-------------------------------------------------------------|
| `EC2_HOST`    | `169.58.243.48`                                             |
| `EC2_USER`    | `mcss`                                                      |
| `EC2_SSH_KEY` | the private key it printed, including the BEGIN/END lines   |

Then delete the key from the server: `rm /root/mcss-actions-deploy-key /root/mcss-actions-deploy-key.pub`.

Test it: on GitHub, open **Actions > Deploy > Run workflow**. It should finish
green, and the log ends with `Deploy complete`.

## 6. Check the site

Open **http://169.58.243.48/** and check:

- You can log in as Super Admin with your usual password.
- The school logo shows on the login page and in the sidebar (it's now served
  from R2).
- Upload something new, such as a profile photo, and check that it displays.
- Download a report card PDF and a receipt.
- A student portal login works, and the notification bell updates.

Your browser will mark the site **Not secure**. That's expected until the
domain and HTTPS are set up.

## 7. Paystack

In the Paystack dashboard (*Settings > API Keys & Webhooks*), change the webhook
URL to:

```
http://169.58.243.48/api/v1/finance/payments/paystack/webhook
```

If Paystack refuses a plain `http://` address, leave it until the domain is
ready. Payments are still confirmed when the student returns from Paystack.

## 8. Clean up

- Delete the export from both servers: `sudo rm /root/mcss-export.tar.gz` on
  AWS, and `rm -rf /root/mcss-export /root/mcss-export.tar.gz` on Contabo.
- Keep the AWS server **stopped but not terminated** for a week or two as a
  fallback. Then terminate the EC2 instance, delete the S3 bucket and its IAM
  user, and check the AWS bill shows nothing else running.
- If school emails are sent through Amazon SES (check *Settings > Email* in the
  app), that's still an AWS service. It keeps working from Contabo, so it can
  move later.

## If something goes wrong during the real move

AWS still has everything as it was. To bring it back, run this on the AWS server:

```bash
sudo rm /etc/systemd/system/mcss-*.service.d/moved.conf
sudo systemctl daemon-reload
sudo systemctl start mcss-daphne mcss-celery-worker mcss-celery-beat
```

If you've already done step 5, change the three GitHub secrets back as well.

---

## Day-to-day on the new server

| What                    | Command (as root on Contabo)                                    |
|-------------------------|-----------------------------------------------------------------|
| Deploy by hand          | `sudo /srv/mcss/deploy.sh`  (same as `sudo mcss-deploy`)         |
| App logs                | `journalctl -u mcss-daphne -n 100`  (also `mcss-celery-worker`)  |
| Restart the app         | `systemctl restart mcss-daphne mcss-celery-worker mcss-celery-beat` |
| Database backups        | `ls /var/backups/mcss`  (nightly at 02:30, last 14 days kept)    |
| Make a backup now       | `mcss-backup`                                                   |
| App settings            | `/srv/mcss/backend/.env`, then restart the app                  |

The nightly backups stay on this server. Copy one off the server now and then:
from PowerShell, run `scp root@169.58.243.48:/var/backups/mcss/<file>.dump .`

## When the domain is ready

Send me the domain and I'll walk you through it. It's roughly:

1. Point the domain's DNS **A record** at `169.58.243.48`.
2. On the server: `certbot --nginx -d <domain>` to get a free HTTPS certificate.
3. In `/srv/mcss/backend/.env`: set `MCSS_HTTPS=true`, add the domain to
   `ALLOWED_HOSTS`, and add `https://<domain>` to `CORS_ALLOWED_ORIGINS` and
   `CSRF_TRUSTED_ORIGINS`. Then restart the app.
4. Update the Paystack webhook to `https://<domain>/api/v1/finance/payments/paystack/webhook`.
5. Recommended for R2: if the domain's DNS is on Cloudflare, connect a custom
   domain such as `files.<domain>` to the bucket. Cloudflare rate-limits the
   `r2.dev` address and doesn't recommend it for live sites. Then switch the
   saved links over:
   `manage.py rewrite_file_urls --from https://pub-xxxx.r2.dev/ --to https://files.<domain>/ --apply`
   and set `AWS_S3_CUSTOM_DOMAIN=files.<domain>`.
