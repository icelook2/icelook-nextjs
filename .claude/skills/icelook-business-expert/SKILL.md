# Icelook Business Expert

Detailed business rules and domain knowledge for the Icelook booking platform.

## Core Concept

Icelook is a web-service for managing and booking beauty appointments. Clients discover beauty pages, browse services, and book appointments with specialists.

## Client Booking Flow

1. Find a beauty page by its unique nickname
2. Browse available services (organized in service groups)
3. Select a service
4. Choose a specialist who offers that service
5. Pick an available time slot
6. Confirm the appointment

## Beauty Page

A beauty page is the central entity where services are offered.

- **Nickname**: Each beauty page has a unique nickname (used in URLs)
- **Creation**: Any Icelook user can create a beauty page
- **Ownership**: The user who creates a beauty page becomes its **owner**

## User Roles

Users can participate in beauty pages with different roles:

| Role | Description |
|------|-------------|
| **Owner** | Created the beauty page. Full control. |
| **Admin** | Invited by owner. Can manage the beauty page. |
| **Specialist** | Provides services to clients. |

**Important:** One user can be part of multiple beauty pages in different roles. For example, a user could be an owner of one beauty page and a specialist on another.

## Specialists

- Owners can create specialist positions on a beauty page
- Invited users can be assigned as specialists
- Specialists provide services and have their own schedules

## Service Groups & Services

### Service Groups

- Beauty pages organize services into **service groups** (categories)
- Examples: "Haircuts", "Coloring", "Styling", "Beard"

### Services

- Services are created inside a service group
- When creating a service, only **name** and **service group** are required
- Services have no price by default — pricing comes from specialist assignments

## Specialist-Service Assignment & Pricing

This is a key concept:

1. After a service is created, specialists can be **assigned** to it
2. When assigning a specialist to a service, a **price** is specified
3. Different specialists can have **different prices** for the same service

### Price Display Logic

On the beauty page, service prices are displayed as follows:

| Scenario | Price Display |
|----------|---------------|
| One specialist assigned | Show that specialist's price |
| Multiple specialists, same price | Show the single price |
| Multiple specialists, different prices | Show as a **range** (min – max) |

**Example:**
- Service: "Haircut"
- Specialist A: $25
- Specialist B: $30
- Specialist C: $35
- **Displayed price:** $25 – $35

## Data Model Overview

```
User
  └── can create → Beauty Page (becomes owner)
  └── can be invited to → Beauty Page (as admin or specialist)

Beauty Page
  └── has unique nickname
  └── contains → Service Groups
  └── contains → Specialists

Service Group
  └── contains → Services

Service
  └── belongs to → Service Group
  └── has many → Specialist Assignments

Specialist Assignment
  └── links → Specialist + Service
  └── has → Price

Appointment
  └── links → Client + Specialist + Service + Time
```

## Business Rules Summary

1. Any user can create a beauty page and become its owner
2. Owners can invite users as admins or specialists
3. One user can have different roles on different beauty pages
4. Services are organized in service groups
5. Services don't have prices — specialist assignments do
6. Different specialists can charge different prices for the same service
7. Price ranges (min–max) are shown when specialists have varying prices
