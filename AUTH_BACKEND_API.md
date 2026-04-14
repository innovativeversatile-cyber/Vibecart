# Owner Auth Backend API

Use these endpoints to enforce server-side owner authentication.

## `POST /api/owner/auth/login`

Request body:

```json
{
  "email": "moyok367@gmail.com",
  "password": "<owner-password>",
  "securityPhrase": "<owner-security-phrase>",
  "mfaCode": "<totp-or-backup-code>"
}
```

Behavior:

- Validate owner profile is active.
- Enforce lockout policy after repeated failures.
- Verify password + security phrase hashes.
- Verify MFA factor when required.
- Create server-side session and return session token.

Response:

```json
{
  "ok": true,
  "token": "<session-token>",
  "expiresAt": "2026-04-14T12:00:00.000Z"
}
```

Failure codes:

- `INVALID_CREDENTIALS`
- `LOCKED_OUT`
- `MFA_REQUIRED_OR_INVALID`

## `POST /api/owner/auth/logout`

- Revoke session in `owner_auth_sessions` by token hash.

## `POST /api/owner/auth/rotate`

- Requires a valid active session.
- Accepts new email/password/security phrase.
- Re-hash and update `owner_auth_profiles`.
- Invalidate previous sessions except current request if desired.

## Required Security Headers

- `Strict-Transport-Security`
- `Content-Security-Policy`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`

## Production Notes

- Store real hashes as `saltHex:hashHex` format.
- Never log raw credentials.
- Rate limit auth routes by IP and account.
- Bind session checks to user-agent and optional IP heuristics.
