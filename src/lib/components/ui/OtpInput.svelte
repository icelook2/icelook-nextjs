<script lang="ts">
	import { cva, cx } from '$lib/cva';

	const inputStyles = cva({
		base: [
			'w-12 h-14 text-center text-lg font-semibold',
			'rounded-lg border-2 border-neutral-300 bg-transparent',
			'transition-all',
			'focus-visible:outline-2 focus-visible:outline-offset-2',
			'focus-visible:outline-neutral-900 focus-visible:border-neutral-900',
			'disabled:pointer-events-none disabled:opacity-50',
			'dark:border-neutral-600',
			'dark:focus-visible:outline-neutral-100 dark:focus-visible:border-neutral-100'
		]
	});

	interface Props {
    length?: number;
		value?: string;
		disabled?: boolean;
		oncomplete?: (otp: string) => void;
		class?: string;
	}

  const length = 6;

	let {
		value = $bindable(''),
		disabled = false,
		oncomplete,
		class: className
	}: Props = $props();

	let digits: string[] = $state(Array(length).fill(''));
	let inputs: HTMLInputElement[] = $state([]);

	// Sync the combined value back to the bindable prop
	let otp = $derived(digits.join(''));

	$effect(() => {
		value = otp;
	});

	function focusInput(index: number) {
		inputs[index]?.focus();
	}

	function setDigit(index: number, char: string) {
		digits[index] = char;
	}

	function clearDigit(index: number) {
		digits[index] = '';
	}

	function extractDigit(raw: string): string | null {
		const match = raw.replace(/\D/g, '').slice(-1);
		return match || null;
	}

	function checkComplete() {
		if (otp.length === length && oncomplete) {
			oncomplete(otp);
		}
	}

	function handleBeforeinput(e: InputEvent) {
		if (e.inputType === 'insertText' && e.data && /\D/.test(e.data)) {
			e.preventDefault();
		}
	}

	function handleInput(e: Event, index: number) {
		const input = e.target as HTMLInputElement;
		const raw = input.value;
		const digit = extractDigit(raw);

		if (digit) {
			setDigit(index, digit);
			focusInput(index + 1);
			checkComplete();
		} else {
			clearDigit(index);
		}
	}

	function handleKeydown(e: KeyboardEvent, index: number) {
    if (e.key === 'Backspace') {
				e.preventDefault();

				if (digits[index]) {
					clearDigit(index);
				} else if (index > 0) {
					clearDigit(index - 1);
					focusInput(index - 1);
				}
    } else if (e.key === 'ArrowLeft') {
				e.preventDefault();
				focusInput(index - 1);
    } else if (e.key === 'ArrowRight') {
				e.preventDefault();
				focusInput(index + 1);
    }
	}

	function handlePaste(e: ClipboardEvent) {
		e.preventDefault();

		const text = e.clipboardData?.getData('text') ?? '';
		const pasted = text.replace(/\D/g, '').slice(0, length).split('');

		// Fill digits from pasted content, clear the rest
		for (let i = 0; i < length; i++) {
			digits[i] = pasted[i] ?? '';
		}

		// Focus the next empty slot, or the last one if all filled
		const nextEmpty = Math.min(pasted.length, length - 1);
		focusInput(nextEmpty);
		checkComplete();
	}
</script>

<div role="group" aria-label="One-time password" class={cx('flex gap-3', className)}>
	{#each digits as digit, i (i)}
		<input
			bind:this={inputs[i]}
			class={inputStyles()}
			type="text"
			inputmode="numeric"
			pattern="[0-9]"
			maxlength="1"
			autocomplete="one-time-code"
			aria-label={`Digit ${i + 1} of ${length}`}
			{disabled}
			value={digit}
			onbeforeinput={handleBeforeinput}
			oninput={(e) => handleInput(e, i)}
			onkeydown={(e) => handleKeydown(e, i)}
			onpaste={handlePaste}
		/>
	{/each}
</div>
