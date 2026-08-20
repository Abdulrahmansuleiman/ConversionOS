#!/usr/bin/env python3
"""Send an email via the Gmail API using credentials in .env.

Refreshes GMAIL_ACCESS_TOKEN from GMAIL_REFRESH_TOKEN when needed and writes the
fresh token back to .env.

Usage:
  python scripts/send_email.py "to@example.com" "Subject" "Body text"
  python scripts/send_email.py --attachment path.pdf "to@example.com" "Subject" "Body text"

To pass a long or symbol-heavy body without shell interpolation problems
(e.g. currency like $10k/mo), write the body to a file and prefix with @:

  python scripts/send_email.py "to@example.com" "Subject" @body.txt
"""

import base64
import json
import os
import re
import sys
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from urllib import request, error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV = os.path.join(ROOT, ".env")

OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token"
GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"


def load_env():
    if not os.path.exists(ENV):
        raise SystemExit(".env not found")
    env = {}
    with open(ENV, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip()
    os.environ.update(env)
    return env


def save_token(token):
    with open(ENV, "r", encoding="utf-8") as f:
        lines = f.readlines()
    with open(ENV, "w", encoding="utf-8") as f:
        for line in lines:
            if line.startswith("GMAIL_ACCESS_TOKEN="):
                f.write("GMAIL_ACCESS_TOKEN=" + token + "\n")
            else:
                f.write(line)


def refresh_access_token(env):
    body = json.dumps({
        "client_id": env["GMAIL_CLIENT_ID"],
        "client_secret": env["GMAIL_CLIENT_SECRET"],
        "refresh_token": env["GMAIL_REFRESH_TOKEN"],
        "grant_type": "refresh_token",
    }).encode()
    req = request.Request(OAUTH_TOKEN_URL, data=body, headers={"Content-Type": "application/json"})
    with request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
    return data["access_token"]


def send(access_token, mime_msg):
    raw = base64.urlsafe_b64encode(mime_msg.as_bytes()).decode()
    body = json.dumps({"raw": raw}).encode()
    req = request.Request(
        GMAIL_SEND_URL,
        data=body,
        headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
    )
    try:
        with request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except error.HTTPError as e:
        raise SystemExit(f"Gmail API error {e.code}: {e.read().decode()}")


def main():
    args = sys.argv[1:]
    attachment = None
    if args and args[0] == "--attachment":
        attachment = args[1]
        args = args[2:]
    if len(args) < 3:
        raise SystemExit("usage: send_email.py [--attachment path] <to> <subject> <body>")

    to, subject, body_arg = args[0], args[1], args[2]
    if body_arg.startswith("@"):
        with open(body_arg[1:], "r", encoding="utf-8") as f:
            body = f.read()
    else:
        body = body_arg
    env = load_env()

    msg = MIMEMultipart()
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain", "utf-8"))
    if attachment:
        with open(attachment, "rb") as f:
            part = MIMEApplication(f.read())
            part.add_header("Content-Disposition", "attachment", filename=os.path.basename(attachment))
            msg.attach(part)

    token = env.get("GMAIL_ACCESS_TOKEN", "")
    try:
        result = send(token, msg)
    except SystemExit as e:
        if "401" in str(e) or "invalid_grant" in str(e):
            print("Access token invalid, refreshing...")
            token = refresh_access_token(env)
            save_token(token)
            result = send(token, msg)
        else:
            raise
    print("sent:", json.dumps(result))


if __name__ == "__main__":
    main()
