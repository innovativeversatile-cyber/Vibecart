# VibeCart GitHub + Deployment (Railway + Netlify)

This is the exact copy/paste checklist to publish and deploy.

## 1) What you need first

- GitHub account
- Railway account
- Netlify account
- A MySQL database (Railway MySQL plugin or external MySQL)

## 2) Push project to GitHub

Run these commands in your `vibecart` folder:

```bash
git init
git add .
git commit -m "Initial VibeCart deploy setup"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/vibecart.git
git push -u origin main
```

## 3) Deploy API on Railway

### Railway steps

1. Create a new Railway project.
2. Connect your GitHub repo.
3. Set root directory to the repo root (`vibecart`) if asked.
4. Add these environment variables in Railway:
   - `DB_HOST`
   - `DB_PORT` (usually `3306`)
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME` (usually `vibecart`)
5. Deploy.
6. Copy your Railway public URL, for example:
   - `https://vibecart-production.up.railway.app`

### API health check

Open this URL in browser:

- `https://YOUR-RAILWAY-URL/api/owner/auth/login`

Expected response for GET is likely `NOT_FOUND` (that is fine).  
The server is running if Railway shows deployment success and logs no startup errors.

## 4) Run SQL schema (important)

Run `schema.sql` on your MySQL database before using the API.

If you use Railway MySQL, connect with a SQL client and execute:

```sql
SOURCE schema.sql;
```

Then replace any auth placeholders as needed in `owner_auth_profiles`.

## 5) Deploy website on Netlify

1. Create a new Netlify site from GitHub repo.
2. Build command: leave empty (static site).
3. Publish directory: `.`
4. Deploy site.

## 6) Connect Netlify frontend to Railway API

Edit `netlify.toml` and replace:

- `https://YOUR-RAILWAY-API.up.railway.app`

with your real Railway URL, then push again:

```bash
git add netlify.toml
git commit -m "Configure Netlify API proxy"
git push
```

## 7) Update app URLs

- In `mobile-app/app.json`, set:
  - `expo.extra.vibecartBaseUrl` to your real frontend URL (Netlify custom domain or netlify.app URL)

## 8) Production security minimum

- Use HTTPS domains only.
- Never commit real secrets to GitHub.
- Keep credentials only in Railway/Netlify environment settings.
- Enable MFA on GitHub, Railway, Netlify.
- Rotate DB password after first production setup.

## Notes

- I assumed you meant **Netlify** by "net nest/netflix".
- Netflix is not a hosting platform for websites.
