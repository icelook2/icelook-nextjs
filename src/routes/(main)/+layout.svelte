<script lang="ts">
	import Avatar from '$lib/components/ui/avatar.svelte';
	import IcelookLogo from '$lib/components/ui/icelook-logo.svelte';
	import { CalendarDays, Search, Settings, UserRound } from 'lucide-svelte';

	let { data, children } = $props();

	const defaultSpecialist = $derived(data.defaultSpecialist);
</script>

<div class="flex h-screen">
	<!-- Sidebar -->
	<aside class="hidden sm:flex flex-col items-center justify-between py-4 px-2 w-16 shrink-0">
		<!-- Logo (top) -->
		<a href="/" aria-label="Home">
			<IcelookLogo size="md" />
		</a>

		<!-- Navigation (center) -->
		<div class="flex flex-col items-center gap-2">
			{#if defaultSpecialist}
				<a
					href="/{defaultSpecialist.nickname}"
					class="inline-flex h-12 w-12 items-center justify-center rounded-full transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
					aria-label="My profile"
				>
					<Avatar src={defaultSpecialist.avatarUrl} name={defaultSpecialist.name} size="sm" />
				</a>
			{:else}
				<div
					class="inline-flex h-12 w-12 items-center justify-center rounded-full text-neutral-400 dark:text-neutral-600"
					aria-label="No profile"
				>
					<UserRound size={24} />
				</div>
			{/if}
			{#if defaultSpecialist}
				<a
					href="/{defaultSpecialist.nickname}/schedule"
					class="inline-flex h-12 w-12 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-100 dark:text-neutral-50 dark:hover:bg-neutral-800"
					aria-label="Appointments"
				>
					<CalendarDays size={24} />
				</a>
			{/if}
			<a
				href="/search"
				class="inline-flex h-12 w-12 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-100 dark:text-neutral-50 dark:hover:bg-neutral-800"
				aria-label="Search"
			>
				<Search size={24} />
			</a>
		</div>

		<!-- Settings (bottom) -->
		<a
			href="/settings"
			class="inline-flex h-12 w-12 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-100 dark:text-neutral-50 dark:hover:bg-neutral-800"
			aria-label="Settings"
		>
			<Settings size={24} />
		</a>
	</aside>

	<!-- Main content -->
	<main class="flex-1 overflow-auto pb-16 sm:pb-0">
		{@render children()}
	</main>

	<!-- Bottom nav: visible on mobile, hidden on sm+ -->
	<nav
		class="fixed bottom-0 left-0 right-0 flex items-center justify-around border-t border-neutral-200 bg-white px-4 py-2 dark:border-neutral-800 dark:bg-neutral-900 sm:hidden"
	>
		{#if defaultSpecialist}
			<a
				href="/{defaultSpecialist.nickname}"
				class="inline-flex h-12 w-12 items-center justify-center rounded-full transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
				aria-label="My profile"
			>
				<Avatar src={defaultSpecialist.avatarUrl} name={defaultSpecialist.name} size="sm" />
			</a>
		{:else}
			<div
				class="inline-flex h-12 w-12 items-center justify-center rounded-full text-neutral-400 dark:text-neutral-600"
				aria-label="No profile"
			>
				<UserRound size={24} />
			</div>
		{/if}
		{#if defaultSpecialist}
			<a
				href="/{defaultSpecialist.nickname}/schedule"
				class="inline-flex h-12 w-12 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-100 dark:text-neutral-50 dark:hover:bg-neutral-800"
				aria-label="Appointments"
			>
				<CalendarDays size={24} />
			</a>
		{/if}
		<a
			href="/search"
			class="inline-flex h-12 w-12 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-100 dark:text-neutral-50 dark:hover:bg-neutral-800"
			aria-label="Search"
		>
			<Search size={24} />
		</a>
		<a
			href="/settings"
			class="inline-flex h-12 w-12 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-100 dark:text-neutral-50 dark:hover:bg-neutral-800"
			aria-label="Settings"
		>
			<Settings size={24} />
		</a>
	</nav>
</div>
