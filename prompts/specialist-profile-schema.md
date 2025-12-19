# Specialist Profile Database Schema

This prompt is for setting up the specialist profile tables in the **icelook-supabase** backend repository to support the specialist creation and management features in the Next.js frontend.

## Overview

The frontend implements:
- Multi-step wizard: Profile → Services → Contacts (services/contacts are skippable)
- Public specialist profiles at `/@username` URLs
- Specialist settings at `/@username/settings/*` routes
- Service groups with a default "Services" group auto-created
- Multiple contact options (Instagram, Phone, Telegram, Viber, WhatsApp)

## Database Schema

### 1. Specialists Table

Main table storing specialist profile information.

```sql
CREATE TABLE specialists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  specialty TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT specialists_username_unique UNIQUE (username),
  CONSTRAINT specialists_user_id_unique UNIQUE (user_id),
  CONSTRAINT specialists_username_format CHECK (username ~ '^[a-z0-9_-]{3,30}$'),
  CONSTRAINT specialists_specialty_valid CHECK (specialty IN (
    'barber',
    'hair_stylist',
    'colorist',
    'nail_tech',
    'makeup_artist',
    'lash_tech',
    'brow_artist'
  ))
);

-- Indexes
CREATE INDEX idx_specialists_username ON specialists(username);
CREATE INDEX idx_specialists_user_id ON specialists(user_id);
CREATE INDEX idx_specialists_is_active ON specialists(is_active);
CREATE INDEX idx_specialists_specialty ON specialists(specialty);
```

**Column Notes:**
- `user_id` - References the user who owns this specialist profile (1:1 relationship)
- `username` - URL-friendly unique identifier (e.g., "john-doe" for `/@john-doe`)
- `display_name` - Public display name (can differ from user's `full_name`)
- `bio` - Optional description/about text
- `specialty` - One of the predefined specialties
- `is_active` - For hiding profile without deleting (soft delete)

### 2. Specialist Contacts Table

Stores contact information for specialists.

```sql
CREATE TABLE specialist_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  instagram TEXT,
  phone TEXT,
  telegram TEXT,
  viber TEXT,
  whatsapp TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One contact record per specialist
  CONSTRAINT specialist_contacts_specialist_id_unique UNIQUE (specialist_id)
);

CREATE INDEX idx_specialist_contacts_specialist_id ON specialist_contacts(specialist_id);
```

**Column Notes:**
- All contact fields are optional (free text)
- Instagram: username or full URL
- Phone/Viber/WhatsApp: phone number format
- Telegram: username or phone

### 3. Service Groups Table

Groups services together. A default group is auto-created for each specialist.

```sql
CREATE TABLE service_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Only one default group per specialist
  CONSTRAINT service_groups_one_default EXCLUDE USING btree (specialist_id WITH =) WHERE (is_default = true)
);

CREATE INDEX idx_service_groups_specialist_id ON service_groups(specialist_id);
```

**Column Notes:**
- `is_default` - The default group cannot be deleted, all ungrouped services go here
- `name` - For default group, use "Services" (translated on frontend)

### 4. Services Table

Individual services offered by specialists.

```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_group_id UUID NOT NULL REFERENCES service_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT services_price_positive CHECK (price >= 0),
  CONSTRAINT services_duration_valid CHECK (duration_minutes > 0 AND duration_minutes <= 480),
  CONSTRAINT services_currency_valid CHECK (currency IN ('UAH', 'USD', 'EUR'))
);

CREATE INDEX idx_services_service_group_id ON services(service_group_id);
CREATE INDEX idx_services_is_active ON services(is_active);
```

**Column Notes:**
- `price` - Decimal for precision (e.g., 150.00)
- `currency` - UAH (Ukrainian hryvnia), USD, EUR
- `duration_minutes` - Service duration (e.g., 30, 60, 90)
- `is_active` - For hiding services without deleting

## Row Level Security (RLS)

### Enable RLS on all tables

```sql
ALTER TABLE specialists ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialist_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
```

### Specialists Policies

```sql
-- Public can view active specialists
CREATE POLICY "Public can view active specialists"
  ON specialists FOR SELECT
  USING (is_active = true);

-- Users can view their own specialist profile (even if inactive)
CREATE POLICY "Users can view own specialist profile"
  ON specialists FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own specialist profile
CREATE POLICY "Users can create own specialist profile"
  ON specialists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own specialist profile
CREATE POLICY "Users can update own specialist profile"
  ON specialists FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own specialist profile
CREATE POLICY "Users can delete own specialist profile"
  ON specialists FOR DELETE
  USING (auth.uid() = user_id);
```

### Specialist Contacts Policies

```sql
-- Public can view contacts of active specialists
CREATE POLICY "Public can view contacts of active specialists"
  ON specialist_contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM specialists s
      WHERE s.id = specialist_contacts.specialist_id
      AND s.is_active = true
    )
  );

-- Users can manage their own contacts
CREATE POLICY "Users can manage own contacts"
  ON specialist_contacts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM specialists s
      WHERE s.id = specialist_contacts.specialist_id
      AND s.user_id = auth.uid()
    )
  );
```

### Service Groups Policies

```sql
-- Public can view service groups of active specialists
CREATE POLICY "Public can view service groups of active specialists"
  ON service_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM specialists s
      WHERE s.id = service_groups.specialist_id
      AND s.is_active = true
    )
  );

-- Users can manage their own service groups
CREATE POLICY "Users can manage own service groups"
  ON service_groups FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM specialists s
      WHERE s.id = service_groups.specialist_id
      AND s.user_id = auth.uid()
    )
  );
```

### Services Policies

```sql
-- Public can view active services of active specialists
CREATE POLICY "Public can view active services"
  ON services FOR SELECT
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM service_groups sg
      JOIN specialists s ON s.id = sg.specialist_id
      WHERE sg.id = services.service_group_id
      AND s.is_active = true
    )
  );

-- Users can manage their own services
CREATE POLICY "Users can manage own services"
  ON services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM service_groups sg
      JOIN specialists s ON s.id = sg.specialist_id
      WHERE sg.id = services.service_group_id
      AND s.user_id = auth.uid()
    )
  );
```

## Helper Function: Create Default Service Group

Auto-create a default service group when a specialist is created.

```sql
CREATE OR REPLACE FUNCTION create_default_service_group()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO service_groups (specialist_id, name, is_default)
  VALUES (NEW.id, 'Services', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_specialist_created
  AFTER INSERT ON specialists
  FOR EACH ROW
  EXECUTE FUNCTION create_default_service_group();
```

## Helper Function: Prevent Default Group Deletion

```sql
CREATE OR REPLACE FUNCTION prevent_default_group_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_default = true THEN
    RAISE EXCEPTION 'Cannot delete default service group';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_default_group_delete
  BEFORE DELETE ON service_groups
  FOR EACH ROW
  EXECUTE FUNCTION prevent_default_group_deletion();
```

## Helper Function: Update Timestamps

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_specialists_updated_at
  BEFORE UPDATE ON specialists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_specialist_contacts_updated_at
  BEFORE UPDATE ON specialist_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## TypeScript Types (for Frontend Reference)

```typescript
type Specialty =
  | 'barber'
  | 'hair_stylist'
  | 'colorist'
  | 'nail_tech'
  | 'makeup_artist'
  | 'lash_tech'
  | 'brow_artist';

type Currency = 'UAH' | 'USD' | 'EUR';

interface Specialist {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string | null;
  specialty: Specialty;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SpecialistContacts {
  id: string;
  specialist_id: string;
  instagram: string | null;
  phone: string | null;
  telegram: string | null;
  viber: string | null;
  whatsapp: string | null;
  created_at: string;
  updated_at: string;
}

interface ServiceGroup {
  id: string;
  specialist_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
}

interface Service {
  id: string;
  service_group_id: string;
  name: string;
  price: number;
  currency: Currency;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

## Frontend API Usage Reference

### Check if User is Specialist

```typescript
const { data: specialist } = await supabase
  .from('specialists')
  .select('id, username')
  .eq('user_id', user.id)
  .single();

const isSpecialist = specialist !== null;
```

### Get Specialist by Username (Public Profile)

```typescript
const { data: specialist } = await supabase
  .from('specialists')
  .select(`
    *,
    specialist_contacts (*),
    service_groups (
      *,
      services (*)
    )
  `)
  .eq('username', username)
  .eq('is_active', true)
  .single();
```

### Create Specialist

```typescript
// 1. Create specialist
const { data: specialist, error } = await supabase
  .from('specialists')
  .insert({
    user_id: user.id,
    username: 'john-doe',
    display_name: 'John Doe',
    bio: 'Professional barber with 10 years experience',
    specialty: 'barber',
  })
  .select()
  .single();

// 2. Default service group is auto-created by trigger

// 3. Add contacts (optional)
await supabase
  .from('specialist_contacts')
  .insert({
    specialist_id: specialist.id,
    instagram: '@johndoe',
    phone: '+380123456789',
  });

// 4. Get default group ID
const { data: defaultGroup } = await supabase
  .from('service_groups')
  .select('id')
  .eq('specialist_id', specialist.id)
  .eq('is_default', true)
  .single();

// 5. Add services (optional)
await supabase
  .from('services')
  .insert([
    {
      service_group_id: defaultGroup.id,
      name: 'Haircut',
      price: 350,
      currency: 'UAH',
      duration_minutes: 30,
    },
    {
      service_group_id: defaultGroup.id,
      name: 'Beard Trim',
      price: 200,
      currency: 'UAH',
      duration_minutes: 20,
    },
  ]);
```

### Check Username Availability

```typescript
const { data: existing } = await supabase
  .from('specialists')
  .select('id')
  .eq('username', username)
  .single();

const isAvailable = existing === null;
```

### Deactivate Specialist (Hide Profile)

```typescript
await supabase
  .from('specialists')
  .update({ is_active: false })
  .eq('id', specialistId);
```

### Delete Specialist (Cascades to all related data)

```typescript
await supabase
  .from('specialists')
  .delete()
  .eq('id', specialistId);
```

## Entity Relationships

```
profiles (existing)
    │
    └── 1:1 ──► specialists
                    │
                    ├── 1:1 ──► specialist_contacts
                    │
                    └── 1:many ──► service_groups
                                       │
                                       └── 1:many ──► services
```

## Testing Checklist

After migration, verify:

1. **Create Specialist**
   - User can create specialist profile
   - Username uniqueness enforced
   - Default service group auto-created

2. **Public View**
   - Active specialists visible to everyone
   - Inactive specialists hidden from public
   - Services and contacts visible

3. **Ownership**
   - Users can only edit their own specialist
   - Users can only add/edit/delete their own services
   - RLS policies enforce this

4. **Deletion**
   - Cannot delete default service group
   - Deleting specialist cascades to contacts, groups, services
   - Deleting group cascades to services

5. **Timestamps**
   - `created_at` set on insert
   - `updated_at` updated on update

## Future Extensions

This schema is designed to support future features:

- **Salons**: Add `salon_id` to specialists for salon membership
- **Organizations**: Add organizations table that owns salons
- **Verification**: Add `is_verified` boolean to specialists
- **Schedule**: Add schedule/availability tables referencing specialists
- **Bookings**: Add appointments table referencing specialists and services
