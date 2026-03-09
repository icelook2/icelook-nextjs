<script lang="ts">
	import { page } from '$app/state';
	import { ChevronRight, Instagram, MessageCircle, Phone, Send } from 'lucide-svelte';
	import BackButton from '$lib/components/ui/back-button.svelte';

	const contacts = $derived(page.data.contacts);

	const fields = [
		{ key: 'phoneNumber1' as const, label: 'Phone 1', icon: Phone, href: '/settings/contacts/phone-1' },
		{ key: 'phoneNumber2' as const, label: 'Phone 2', icon: Phone, href: '/settings/contacts/phone-2' },
		{ key: 'instagram' as const, label: 'Instagram', icon: Instagram, href: '/settings/contacts/instagram' },
		{ key: 'telegram' as const, label: 'Telegram', icon: Send, href: '/settings/contacts/telegram' },
		{ key: 'whatsapp' as const, label: 'WhatsApp', icon: MessageCircle, href: '/settings/contacts/whatsapp' },
		{ key: 'viber' as const, label: 'Viber', icon: MessageCircle, href: '/settings/contacts/viber' }
	];

	function displayValue(key: string, val: string | null | undefined): string {
		if (!val) return 'Not set';
		if (key === 'instagram' || key === 'telegram') return `@${val}`;
		return val;
	}
</script>

<header class="flex items-center gap-3">
	<BackButton fallback="/settings" />
	<h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Contacts</h1>
</header>

<div class="mt-6 divide-y divide-neutral-200 dark:divide-neutral-700">
	{#each fields as field (field.key)}
		{@const val = contacts?.[field.key]}
		<a
			href={field.href}
			class="flex w-full items-center justify-between py-3 text-left"
		>
			<span class="flex items-center gap-3">
				<field.icon size={16} class="shrink-0 text-neutral-400 dark:text-neutral-500" />
				<span class="text-sm text-neutral-900 dark:text-neutral-50">{field.label}</span>
			</span>
			<span class="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
				<span class={val ? '' : 'italic'}>{displayValue(field.key, val)}</span>
				<ChevronRight size={16} />
			</span>
		</a>
	{/each}
</div>
