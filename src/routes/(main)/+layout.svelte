<script lang="ts">
	import { page } from '$app/state';
	import IconButtonLink from '$lib/components/ui/IconButtonLink.svelte';
	import IcelookLogo from '$lib/components/IcelookLogo.svelte';

	let { children } = $props();

	const iconColor = (active: boolean) => active ? 'text-accent-600 dark:text-accent-400' : 'text-neutral-400 dark:text-neutral-500';
</script>

<div class="grid grid-cols-[auto_1fr] min-h-screen">
  <aside class="flex flex-col items-center justify-between px-2 py-4">
    <a href="/settings" class="active:scale-[0.97] transition-transform">
      <IcelookLogo class="h-9" />
    </a>

    <nav class="flex flex-col gap-2">
      <IconButtonLink 
        href="/profile" 
        aria-label="Profile" 
        active={page.url.pathname === '/profile'} 
        class={iconColor(page.url.pathname === '/profile')}
      >
        <span class="icon-[lucide--user] size-7"></span>
      </IconButtonLink>

      <IconButtonLink 
        href="/appointments" 
        aria-label="Appointments" 
        active={page.url.pathname === '/appointments'} 
        class={iconColor(page.url.pathname === '/appointments')}
      >
        <span class="icon-[lucide--calendar-check] size-7"></span>
      </IconButtonLink>

      <IconButtonLink
        href="/specialists/:id/schedule" 
        aria-label="Schedule" 
        active={page.url.pathname.includes('/schedule')} 
        class={iconColor(page.url.pathname.includes('/schedule'))}
      >
        <span class="icon-[lucide--calendar-clock] size-7"></span>
      </IconButtonLink>

      <IconButtonLink
        href="/search" 
        aria-label="Search"
        active={page.url.pathname === '/search'} 
        class={iconColor(page.url.pathname === '/search')}
      >
        <span class="icon-[lucide--search] size-7"></span>
      </IconButtonLink>
    </nav>

    <IconButtonLink
      href="/settings" 
      aria-label="Settings" 
      active={page.url.pathname.startsWith('/settings')} 
      class={iconColor(page.url.pathname.startsWith('/settings'))}
    >
      <span class="icon-[lucide--settings] size-7"></span>
    </IconButtonLink>
  </aside>

  <main class="flex flex-col w-full mx-auto max-w-2xl">
    {@render children()}
  </main>
</div>
