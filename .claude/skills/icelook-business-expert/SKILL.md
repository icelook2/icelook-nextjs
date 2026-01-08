# Icelook Business Expert

Detailed business rules and domain knowledge for the Icelook booking platform.

## Core Concept

Icelook is a web-service for managing and booking beauty appointments. Think of it like **Instagram Business profiles for beauty professionals** — individual creators set up their personal booking pages where clients can discover them and book appointments.

## The Two User Types

### Clients
Regular users who browse beauty pages, discover services, and book appointments.

### Creators
Users who create a beauty page to offer their services. A creator:
- IS the specialist (one person = one beauty page)
- Manages their own services and pricing
- Sets their own schedule (working days and hours)
- Accepts or declines appointment requests

## Client Booking Flow

1. Find a beauty page by its unique nickname (e.g., `icelook.com/anna-nails`)
2. Browse available services (organized in service groups)
3. Select a service
4. Pick an available time slot from the creator's schedule
5. Confirm the appointment

## Beauty Page

A beauty page is a **personal business profile** for an individual creator.

- **Nickname**: Each beauty page has a unique nickname (used in URLs)
- **One creator per page**: Unlike a salon model, each beauty page belongs to one person
- **The creator IS the specialist**: No team or employees — it's the creator's personal booking page

## Creator Capabilities

| Capability | Description |
|------------|-------------|
| **Services** | Create services and organize them into service groups |
| **Pricing** | Set prices for each service |
| **Schedule** | Define working days and specific hours for each day |
| **Appointments** | View, accept, or decline booking requests |

## Service Groups & Services

### Service Groups

- Creators organize services into **service groups** (categories)
- Examples: "Haircuts", "Coloring", "Nails", "Makeup"

### Services

- Services are created inside a service group
- Each service has a **name** and a **price**
- The price is set by the creator (no price ranges — one person = one price)

## Schedule Management

Creators define their availability:

- **Working days**: Which days of the week they work
- **Working hours**: Specific hours for each working day (can vary by day)
- Example: Monday 9:00–18:00, Tuesday 10:00–20:00, Wednesday OFF

## Appointments

- Clients request appointments by selecting a service and time slot
- Creators can **accept** or **decline** appointment requests
- Accepted appointments are confirmed and added to both parties' schedules

## Data Model Overview

```
User
  └── can browse → Beauty Pages (as client)
  └── can create → Beauty Page (becomes creator)

Beauty Page
  └── has unique nickname
  └── has one creator
  └── contains → Service Groups
  └── has → Schedule (working days/hours)

Service Group
  └── contains → Services

Service
  └── belongs to → Service Group
  └── has → Name
  └── has → Price

Appointment
  └── links → Client + Beauty Page + Service + Time
  └── has → Status (pending, accepted, declined, completed)
```

## Business Rules Summary

1. Any user can create a beauty page and become its creator
2. One beauty page = one creator (personal business profile model)
3. The creator is the specialist — they provide all services on their page
4. Creators set their own prices for each service
5. Creators define their own schedule (working days and hours per day)
6. Creators can accept or decline appointment requests
7. Clients discover creators by beauty page nickname
