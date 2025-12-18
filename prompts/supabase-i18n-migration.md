# Supabase i18n Migration

## Context

I've implemented internationalization (i18n) in my Next.js frontend (icelook-nextjs repo) using next-intl. The system supports two languages: Ukrainian (uk) and English (en).

**How it works:**
- Guest users: locale is detected from browser's Accept-Language header and stored in a cookie (`IL_LOCALE`)
- Authenticated users: locale preference should be stored in the database and synced to the cookie on login

The frontend is already complete and expects a `preferred_locale` column on the `profiles` table.

## Required Migration

Add a `preferred_locale` column to the `profiles` table to persist user language preferences across devices.

### SQL Migration

```sql
-- Add preferred_locale column to profiles table
ALTER TABLE profiles
ADD COLUMN preferred_locale TEXT
CHECK (preferred_locale IN ('en', 'uk') OR preferred_locale IS NULL);

-- Add comment for documentation
COMMENT ON COLUMN profiles.preferred_locale IS
  'User preferred language: en (English) or uk (Ukrainian). NULL means use browser default.';
```

### Column Details

| Property | Value |
|----------|-------|
| Column name | `preferred_locale` |
| Type | `TEXT` |
| Nullable | `YES` (NULL = use browser default) |
| Allowed values | `'en'`, `'uk'`, or `NULL` |
| Default | `NULL` |

## How the Frontend Uses This

1. **On login/page load** (in `proxy.ts` middleware):
   ```typescript
   const { data: profile } = await supabase
     .from("profiles")
     .select("full_name, preferred_locale")
     .eq("id", user.id)
     .single();

   // Sync DB preference to cookie
   if (profile?.preferred_locale) {
     response.cookies.set("IL_LOCALE", profile.preferred_locale);
   }
   ```

2. **On language change** (in `/app/actions/locale.ts`):
   ```typescript
   await supabase
     .from("profiles")
     .update({ preferred_locale: locale })
     .eq("id", profile.id);
   ```

## RLS Considerations

The existing RLS policies on `profiles` should already handle this:
- Users can read their own profile (to get `preferred_locale`)
- Users can update their own profile (to change `preferred_locale`)

No new RLS policies should be needed, but please verify the existing policies allow SELECT and UPDATE on the new column for the profile owner.

## Verification

After running the migration, verify:
1. Column exists: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferred_locale';`
2. Check constraint works: Try inserting invalid value like `'fr'` - should fail
3. RLS allows user to update their own `preferred_locale`

## TypeScript Type (for reference)

The frontend expects this type in `lib/auth/session.ts`:
```typescript
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  preferred_locale: string | null;  // <-- This field
}
```
