# Supabase Auth Setup for Icelook

This prompt is for setting up authentication in the **icelook-supabase** backend repository to work with the Next.js frontend's passwordless email + OTP flow.

## Overview

The frontend implements:
- Email input → Send OTP → Verify 6-digit code → Authenticated
- Auto-creates users on first sign-in
- Cookie-based session management via `@supabase/ssr`
- Middleware refreshes sessions on each request

## Required Backend Configuration

### 1. Enable Email OTP Authentication

In Supabase Dashboard → Authentication → Providers → Email:

| Setting | Value | Notes |
|---------|-------|-------|
| Enable Email Provider | ✅ ON | Required |
| Confirm Email | ✅ ON | Sends OTP to verify email |
| Enable Email OTP | ✅ ON | Use 6-digit code instead of magic link |
| OTP Expiry | 60 seconds | Matches frontend cooldown |

**Important:** Make sure "Magic Link" is disabled and "OTP" is enabled. The frontend uses `type: "email"` in `verifyOtp()` which expects a 6-digit code.

### 2. Configure Site URL and Redirect URLs

In Supabase Dashboard → Authentication → URL Configuration:

| Setting | Development | Production |
|---------|-------------|------------|
| Site URL | `http://localhost:3000` | `https://your-domain.com` |
| Redirect URLs | `http://localhost:3000/**` | `https://your-domain.com/**` |

### 3. Rate Limiting

Supabase has built-in rate limiting for OTP requests (~60 seconds between requests per email). The frontend displays a 60-second cooldown timer that matches this.

When rate limited, Supabase returns HTTP 429, and the frontend shows:
- "Too many requests. Please wait before trying again."
- "Please wait before requesting another code."

### 4. Email Templates (Optional)

Customize in Dashboard → Authentication → Email Templates → OTP:

```
Subject: Your Icelook verification code

Your verification code is: {{ .Token }}

This code will expire in 60 seconds.

If you didn't request this code, you can safely ignore this email.
```

### 5. Environment Variables

The frontend expects these environment variables (in `.env.local`):

```bash
NEXT_PUBLIC_IL_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_IL_SUPABASE_ANON_KEY=your-anon-key
```

Note the `IL_` prefix - this is the project convention for Icelook-specific variables.

## Frontend API Usage Reference

This is how the frontend calls Supabase Auth. The backend must support these exact flows:

### Sign In with OTP (sends code to email)
```typescript
await supabase.auth.signInWithOtp({
  email: email,
  options: {
    shouldCreateUser: true, // Creates user if doesn't exist
  },
});
```

### Verify OTP (authenticates user)
```typescript
await supabase.auth.verifyOtp({
  email: email,
  token: code,      // 6-digit string
  type: "email",    // Must be "email" for OTP flow
});
```

### Resend OTP (same as sign in)
```typescript
await supabase.auth.signInWithOtp({
  email: email,
  options: {
    shouldCreateUser: true, // Handles edge case where user record was deleted
  },
});
```

## Optional: User Profile Table

If you want to store additional user information beyond Supabase Auth:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

## Testing Checklist

After configuration, verify the flow works:

1. **Send OTP**
   - Go to `http://localhost:3000/auth`
   - Enter email address
   - Click "Continue"
   - Should see "Check your email" with OTP input

2. **Receive Email (Local Dev)**
   - Open Mailpit at `http://127.0.0.1:54324` (Supabase local)
   - Or check Inbucket at `http://127.0.0.1:54324` depending on setup
   - Should receive email with 6-digit code

3. **Verify OTP**
   - Enter 6-digit code
   - Click "Verify"
   - Should redirect to `/` (or original page if `?redirect=` was set)

4. **Session Persistence**
   - Refresh the page
   - User should remain authenticated (check via `supabase.auth.getUser()`)

5. **Resend Flow**
   - Wait for cooldown (60s) or start fresh
   - Click "Resend code"
   - Should receive new email

6. **Error Cases**
   - Wrong code → "Invalid code. Please check and try again."
   - Expired code → "Code has expired. Please request a new one."
   - Rate limited → "Please wait before requesting another code."

## Troubleshooting

| Issue | Likely Cause | Fix |
|-------|--------------|-----|
| No email received | Email provider not enabled | Enable in Dashboard |
| Magic link instead of OTP | OTP not enabled | Enable "OTP" in email settings |
| 429 errors immediately | Rate limit too aggressive | Check Supabase rate limit settings |
| Session not persisting | Cookie issues | Check Site URL matches frontend origin |
| CORS errors | URL mismatch | Add frontend URL to redirect allowlist |

## Architecture Notes

- Frontend uses `@supabase/ssr` for SSR-compatible cookie handling
- Middleware at `middleware.ts` refreshes sessions on every request
- Server Actions in `app/auth/actions.ts` handle auth operations
- Sessions are stored in HTTP-only cookies (not localStorage)
