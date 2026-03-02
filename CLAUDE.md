You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

## Architecture & Constraints
* **Organization:** `icelook2`
* **Projects:** * 
    * `/api`: Cloudflare Workers (Hono, Better-Auth, Drizzle + Neon).
    * `/web-app`: SvelteKit (Full-stack framework used as a **Frontend only**).
* **Strict Logic Separation:** * **NO** business logic, database queries, or server-side endpoints (`+server.ts`) in `web-app`.
    * **ALL** data interaction and business logic must reside in `/api`.
    * If a feature requires a new endpoint, implement it in `icelook2/api`.

## Communication & Auth
* **API URL:** `https://api.icelook.app` (Production)
* **Web URL:** `https://icelook.app` (Production)
* **Authentication:** Managed via **Secure HTTP-only cookies**. 
* **Data Fetching:** SvelteKit must fetch all data via HTTP REST calls to the API. Use the API as the single source of truth.

## Tech Stack Guidelines
* **Web:** Use SvelteKit for UI and routing, but delegate all processing to the backend.
* **Security:** Maintain CORS and cookie settings to allow secure communication between the subdomains.

### Implementation Standards
* Before creating a Svelte server action, stop and move that logic to a Hono route in `/api`.
* Ensure all types for API responses are strictly defined to keep the frontend in sync.
