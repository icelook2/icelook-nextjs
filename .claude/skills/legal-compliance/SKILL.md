---
description: Legal compliance guide for Privacy Policy, Terms of Use, Cookie Policy, and Cookie Consent
---

# Legal Compliance Guide

This guide explains how to handle updates to legal documents and cookie consent in Icelook.

## The 4 Legal Documents (Don't Mix Them Up!)

| Document | What It Is | Location | Update Frequency |
|----------|-----------|----------|------------------|
| **Privacy Policy** | How we collect, use, and protect user data | `/privacy` page | When data practices change |
| **Terms of Use** | Legal agreement for using the service | `/terms` page | When service terms change |
| **Cookie Policy** | What cookies we use and why | Part of Privacy Policy or separate | When cookie usage changes |
| **Cookie Consent Banner** | The popup asking Accept/Reject | `lib/consent/` | When adding new tracking tools |

## Quick Decision Tree

```
┌─────────────────────────────────────────────────────────────────┐
│  What are you changing?                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │ Adding new  │    │ Privacy or  │    │ Cookie      │
   │ tracking    │    │ Terms text  │    │ Policy text │
   │ (Mixpanel)  │    │ changes     │    │ changes     │
   └─────────────┘    └─────────────┘    └─────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │ Bump        │    │ Email users │    │ Just update │
   │ CONSENT_    │    │ Wait 30 days│    │ the page    │
   │ POLICY_     │    │ Then update │    │ No email    │
   │ VERSION     │    │             │    │ needed      │
   └─────────────┘    └─────────────┘    └─────────────┘
```

---

## Scenario 1: Adding New Tracking Tool (e.g., Mixpanel)

**This is the COOKIE CONSENT flow - NO email required.**

### Steps

1. **Update the code constant**

   File: `lib/consent/handlers.ts` (line ~16)

   ```typescript
   // Change from:
   export const CONSENT_POLICY_VERSION = "1.0";

   // To:
   export const CONSENT_POLICY_VERSION = "1.1";
   ```

2. **Deploy**

3. **Done!** Users see the consent banner on next visit.

### Why It Works

```
User visits site
    │
    ▼
showConsentBannerHandler() runs
    │
    ▼
Checks database: user consented to version "1.0"
    │
    ▼
Checks code: CONSENT_POLICY_VERSION = "1.1"
    │
    ▼
"1.0" ≠ "1.1" → Show banner!
    │
    ▼
User clicks Accept → New record saved with version "1.1"
    │
    ▼
Next visit: versions match → No banner
```

### When to Bump Version

| Change | Bump Version? |
|--------|---------------|
| Adding new tracking tool (Mixpanel, Hotjar) | ✅ Yes |
| Adding new consent category (functionality) | ✅ Yes |
| Removing a tracking tool | ❌ No |
| Changing banner UI/text | ❌ No |

---

## Scenario 2: Changing Privacy Policy or Terms of Use

**This is the LEGAL DOCUMENT flow - EMAIL required.**

### Steps

1. **Draft the changes** with your legal team

2. **Send email to all users** (30 days before)

   Subject: "Updates to our Privacy Policy"

   Content should include:
   - What's changing
   - Why it's changing
   - Effective date (30 days from now)
   - Link to view the new policy

3. **Wait 30 days**

4. **Update the document** on the website

5. **Update the "Last updated" date** on the page

### Email Template

```
Subject: Important Updates to Our Privacy Policy

Hi [Name],

We're updating our Privacy Policy to [brief description].

Key changes:
• [Change 1]
• [Change 2]

These changes take effect on [DATE - 30 days from now].

You can review the updated policy here: [LINK]

If you have questions, contact us at [EMAIL].

Best,
The Icelook Team
```

### Why 30 Days?

- GDPR requires "reasonable notice" for material changes
- 30 days is industry standard
- Gives users time to review and decide if they want to continue using the service

---

## Scenario 3: Updating Cookie Policy Text

**Just update the page - NO email, NO version bump.**

Cookie Policy is informational - it describes what cookies you use. If you're just clarifying text (not adding new cookies), simply:

1. Update the page content
2. Update "Last updated" date
3. Deploy

---

## Our Cookie Consent System

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User's Browser                          │
├─────────────────────────────────────────────────────────────────┤
│  localStorage: c15t_subject_id = "abc-123"                      │
│  cookie: c15t = {consents: {...}, consentInfo: {...}}          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase Database                          │
├─────────────────────────────────────────────────────────────────┤
│  consent_records table:                                         │
│  ┌────────────────┬───────────────────────────────────────────┐ │
│  │ subject_id     │ "abc-123"                                 │ │
│  │ policy_version │ "1.0"                                     │ │
│  │ preferences    │ {necessary: true, measurement: true, ...} │ │
│  │ given_at       │ 2026-01-22                                │ │
│  │ user_id        │ (linked when user logs in)                │ │
│  └────────────────┴───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `lib/consent/handlers.ts` | Consent logic + `CONSENT_POLICY_VERSION` |
| `lib/consent/consent-banner.tsx` | The UI banner component |
| `components/cookie-consent-provider.tsx` | Provider wrapping the app |

### Consent Categories

Currently configured in `cookie-consent-provider.tsx`:

```typescript
consentCategories: ["necessary", "measurement", "marketing"]
```

| Category | Description | Can User Disable? | Our Tools |
|----------|-------------|-------------------|-----------|
| `necessary` | Essential cookies | ❌ No (always on) | Auth, CSRF |
| `measurement` | Analytics | ✅ Yes | Mixpanel |
| `marketing` | Advertising | ✅ Yes | (none yet) |
| `functionality` | Enhanced features | ✅ Yes | (not shown) |
| `experience` | Personalization | ✅ Yes | (not shown) |

### Adding a New Category

1. Add to `consentCategories` array in `cookie-consent-provider.tsx`
2. Add translations in `messages/en.json` and `messages/uk.json` under `consent.categories`
3. Bump `CONSENT_POLICY_VERSION`
4. Deploy

---

## Database: consent_records Table

### Schema

```sql
CREATE TABLE consent_records (
  id uuid PRIMARY KEY,
  subject_id text NOT NULL,        -- Anonymous user ID (from localStorage)
  user_id uuid,                     -- Linked auth user (if logged in)
  domain text NOT NULL,             -- "localhost" or "icelook.com"
  consent_type text DEFAULT 'cookie_banner',
  preferences jsonb NOT NULL,       -- {necessary: true, measurement: false, ...}
  policy_version text DEFAULT '1.0', -- Which version they consented to
  user_agent text,
  given_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL
);
```

### Querying Consent Records

```sql
-- Find all consents for a user (by email)
SELECT cr.*
FROM consent_records cr
JOIN auth.users u ON cr.user_id = u.id
WHERE u.email = 'user@example.com'
ORDER BY cr.given_at DESC;

-- Find users who haven't re-consented to latest version
SELECT DISTINCT subject_id
FROM consent_records
WHERE policy_version < '1.1';

-- Count consents by version
SELECT policy_version, COUNT(*)
FROM consent_records
GROUP BY policy_version;
```

---

## Sentry vs Mixpanel: Which Category?

| Tool | Category | Reasoning |
|------|----------|-----------|
| **Sentry** | `necessary` | Error monitoring is essential for site reliability. Not tracking users for marketing. GDPR "legitimate interest" applies. |
| **Mixpanel** | `measurement` | Product analytics - tracks user behavior. Requires consent. |
| **Google Analytics** | `measurement` | Same as Mixpanel |
| **Meta Pixel** | `marketing` | Advertising/remarketing |
| **Hotjar** | `experience` | Session recordings, personalization |

**Rule of thumb**: If it helps YOU understand user behavior = consent needed. If it helps the SITE function = necessary.

---

## Checklist: Before You Make Changes

### Adding New Tracking Tool
- [ ] Identify which consent category it belongs to
- [ ] If new category needed, add to `consentCategories`
- [ ] Bump `CONSENT_POLICY_VERSION` in `lib/consent/handlers.ts`
- [ ] Update Cookie Policy page if needed
- [ ] Deploy
- [ ] Verify banner appears for existing users

### Changing Privacy Policy / Terms
- [ ] Draft changes with legal team
- [ ] Prepare email notification
- [ ] Send email to all users
- [ ] Wait 30 days
- [ ] Update page content
- [ ] Update "Last updated" date
- [ ] Deploy

### Minor Cookie Policy Text Update
- [ ] Update page content
- [ ] Update "Last updated" date
- [ ] Deploy

---

## Common Mistakes to Avoid

| Mistake | Why It's Wrong | Correct Approach |
|---------|---------------|------------------|
| Bump consent version for Privacy Policy changes | Privacy Policy ≠ Cookie Consent. They're separate. | Email users + wait 30 days for Privacy Policy |
| Email users for new tracking tool | Cookie consent doesn't require email. Just show banner. | Bump version + deploy |
| Add tracking without consent | GDPR violation. Fines up to €20M. | Always get consent first |
| Show empty consent categories | Confuses users. Only show categories you use. | Remove unused categories |

---

## Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   COOKIE CONSENT (Adding tracking tools)                        │
│   ────────────────────────────────────────                      │
│   1. Bump CONSENT_POLICY_VERSION                                │
│   2. Deploy                                                     │
│   3. Users see banner → Done!                                   │
│                                                                 │
│   NO EMAIL. NO WAITING.                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   PRIVACY POLICY / TERMS OF USE (Legal document changes)        │
│   ────────────────────────────────────────────────────          │
│   1. Email all users                                            │
│   2. Wait 30 days                                               │
│   3. Update document                                            │
│   4. Done!                                                      │
│                                                                 │
│   EMAIL REQUIRED. 30 DAY WAIT.                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
