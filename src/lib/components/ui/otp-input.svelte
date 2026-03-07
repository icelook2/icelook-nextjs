<script lang="ts">
	let {
		length = 6,
		value = $bindable(''),
		disabled = false
	}: {
		length?: number;
		value?: string;
		disabled?: boolean;
	} = $props();

	let inputs: HTMLInputElement[] = [];
	let digits = $derived(Array.from({ length }, (_, i) => value[i] ?? ''));

	function setDigit(index: number, val: string) {
		const chars = Array.from({ length }, (_, i) => value[i] ?? '');
		chars[index] = val;
		value = chars.join('');
	}

	function focusInput(index: number) {
		inputs[index]?.focus();
	}

	function handleInput(index: number, e: Event) {
		const input = e.target as HTMLInputElement;
		const val = input.value;

		if (!/^\d$/.test(val)) {
			setDigit(index, '');
			return;
		}

		setDigit(index, val);

		if (index < length - 1) {
			focusInput(index + 1);
		}
	}

	function handleKeydown(index: number, e: KeyboardEvent) {
		if (e.key === 'Backspace') {
			if (digits[index]) {
				setDigit(index, '');
			} else if (index > 0) {
				focusInput(index - 1);
				setDigit(index - 1, '');
			}
			e.preventDefault();
		}
	}

	function handlePaste(e: ClipboardEvent) {
		e.preventDefault();
		const text = e.clipboardData?.getData('text') ?? '';
		const chars = text.replace(/\D/g, '').slice(0, length).split('');
		if (!chars.length) return;

		value = Array.from({ length }, (_, i) => chars[i] ?? '').join('');

		if (chars.length >= length) {
			focusInput(length - 1);
		} else {
			focusInput(chars.length);
		}
	}
</script>

<div class="flex justify-center gap-2" role="group" aria-label="One-time password">
	{#each digits as digit, i (i)}
		<input
			bind:this={inputs[i]}
			type="text"
			inputmode="numeric"
			maxlength="1"
			value={digit}
			{disabled}
			oninput={(e) => handleInput(i, e)}
			onkeydown={(e) => handleKeydown(i, e)}
			onpaste={handlePaste}
			class="h-12 w-10 rounded-lg border border-neutral-300 bg-white text-center text-lg font-medium text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50 dark:focus-visible:outline-neutral-50"
		/>
	{/each}
</div>
