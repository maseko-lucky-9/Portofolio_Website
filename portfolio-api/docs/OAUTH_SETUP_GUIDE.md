# OAuth Authentication Setup Guide

This guide explains how to set up GitHub and Google OAuth authentication for your portfolio API.

## Prerequisites

- Portfolio API running locally or deployed
- GitHub account for GitHub OAuth
- Google Cloud account for Google OAuth

---

## GitHub OAuth Setup

### 1. Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the application details:
   - **Application name**: `Portfolio - Development` (or your preferred name)
   - **Homepage URL**: `http://localhost:5173` (your frontend URL)
   - **Authorization callback URL**: `http://localhost:3000/api/v1/auth/oauth/github/callback`
   - **Description**: Portfolio authentication
4. Click **"Register application"**

### 2. Get Client Credentials

After creating the app:

1. Copy the **Client ID**
2. Click **"Generate a new client secret"**
3. Copy the **Client Secret** (you won't be able to see it again!)

### 3. Add to Environment Variables

Add to your `.env` file in `portfolio-api`:

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
```

### 4. Production Setup

For production deployment:

1. Create a new OAuth App with production URLs
2. Set callback URL to: `https://yourdomain.com/api/v1/auth/oauth/github/callback`
3. Use separate credentials in production `.env`

---

## Google OAuth Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** (for profile information)

### 2. Configure OAuth Consent Screen

1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type
3. Fill in required fields:
   - **App name**: Portfolio
   - **User support email**: your email
   - **Developer contact information**: your email
4. Add scopes:
   - `openid`
   - `email`
   - `profile`
5. Add test users (your email) for development
6. Save and continue

### 3. Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **OAuth client ID**
3. Choose **Web application**
4. Configure:
   - **Name**: Portfolio OAuth
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (frontend)
     - `http://localhost:3000` (API)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/v1/auth/oauth/google/callback`
5. Click **"CREATE"**

### 4. Get Client Credentials

After creation:

1. Copy the **Client ID**
2. Copy the **Client Secret**

### 5. Add to Environment Variables

Add to your `.env` file in `portfolio-api`:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### 6. Production Setup

For production:

1. Update authorized origins to include production domain
2. Update redirect URI to: `https://yourdomain.com/api/v1/auth/oauth/google/callback`
3. Verify domain ownership in Google Search Console
4. Publish the OAuth consent screen

---

## Environment Variables Summary

Your `portfolio-api/.env` file should include:

```bash
# Existing variables...

# OAuth GitHub
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# OAuth Google
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OAuth Security (generate a random 32+ character string)
OAUTH_STATE_SECRET=your-random-32-character-secret-key-here
```

## Generate OAuth State Secret

Generate a secure random secret:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 32
```

---

## Testing OAuth Flow

### 1. Start the API

```bash
npm run dev:api
```

### 2. Test GitHub OAuth

Navigate to:

```
http://localhost:3000/api/v1/auth/oauth/github
```

This will redirect you to GitHub for authorization. After approval, you'll be redirected back to your frontend.

### 3. Test Google OAuth

Navigate to:

```
http://localhost:3000/api/v1/auth/oauth/google
```

This will redirect you to Google for authorization.

---

## Available OAuth Endpoints

### Initiate OAuth Flow

```
GET /api/v1/auth/oauth/:provider
```

Parameters:

- `provider`: `github` or `google`

### OAuth Callback (automatic)

```
GET /api/v1/auth/oauth/:provider/callback
```

This endpoint is called automatically by the OAuth provider after user authorization.

### Link OAuth to Existing Account

```
POST /api/v1/auth/oauth/link
Authorization: Bearer {access_token}
```

Body:

```json
{
  "provider": "github",
  "code": "oauth_code",
  "state": "oauth_state"
}
```

### Unlink OAuth Provider

```
DELETE /api/v1/auth/oauth/unlink/:provider
Authorization: Bearer {access_token}
```

### Get Linked Providers

```
GET /api/v1/auth/oauth/providers
Authorization: Bearer {access_token}
```

---

## Security Considerations

### CSRF Protection

- OAuth state parameter is validated to prevent CSRF attacks
- States expire after 5 minutes
- Each state is single-use

### Cookie Security

- Cookies are `httpOnly` (JavaScript can't access them)
- `secure` flag in production (HTTPS only)
- `sameSite: lax` prevents CSRF

### Account Linking

- OAuth accounts can only be linked to authenticated users
- Prevents accidental account merging
- Checks for existing OAuth connections

### Account Unlinking

- Users must have at least one authentication method
- Cannot unlink if it's the only way to sign in
- Requires setting a password first for OAuth-only accounts

---

## Troubleshooting

### "OAuth provider not configured" Error

- Verify environment variables are set correctly
- Restart the API server after adding environment variables
- Check for typos in variable names

### "Invalid redirect URI" Error from Provider

- Ensure redirect URI in provider console matches exactly
- Include protocol (`http://` or `https://`)
- Don't include trailing slash
- Port must match (e.g., `:3000`)

### "Invalid OAuth state" Error

- State may have expired (5-minute limit)
- Try initiating the OAuth flow again
- Check Redis is running for state storage in production

### Cookies Not Being Set

- Verify `@fastify/cookie` plugin is registered
- Check CORS settings allow credentials
- Frontend must send requests with `credentials: 'include'`

---

## Migration to Production

1. **Update OAuth Apps**:

   - Add production URLs to authorized origins/redirects
   - Consider separate OAuth apps for production

2. **Environment Variables**:

   - Use different credentials for production
   - Store in secure environment variable management system

3. **HTTPS**:

   - OAuth only works with HTTPS in production
   - Get SSL certificate (Let's Encrypt, Cloudflare, etc.)

4. **Frontend Integration**:
   - Update frontend OAuth buttons with correct API URLs
   - Handle OAuth errors gracefully
   - Display linked providers in user settings

---

## Next Steps

1. ✅ OAuth backend is ready
2. Create frontend OAuth login buttons
3. Implement OAuth callback handler in frontend
4. Add account linking UI in user profile
5. Test complete OAuth flow
6. Deploy to production with HTTPS

## Support

For issues or questions:

- Check API logs for detailed error messages
- Verify OAuth app settings in provider console
- Review CORS configuration
- Test with Postman/curl before frontend integration
