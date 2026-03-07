<script lang="ts">
	let { size = 'md', class: className = '' }: { size?: 'sm' | 'md' | 'lg'; class?: string } =
		$props();

	const sizes = {
		sm: 'h-6',
		md: 'h-8',
		lg: 'h-10'
	};
</script>

<svg
	class="{sizes[size]} w-auto {className}"
	viewBox="0 0 65 100"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	role="img"
	aria-label="Icelook logo"
>
	<ellipse cx="12.1674" cy="12.8207" rx="12.1674" ry="11.5385" fill="#A1FF06" />
	<rect y="34.6152" width="24.3347" height="65.3846" rx="12.1674" fill="#FE4090" />
	<rect x="39.7051" width="24.3347" height="100" rx="12.1674" fill="#B358FB" />
</svg>
