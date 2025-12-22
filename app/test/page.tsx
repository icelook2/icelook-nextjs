import { Paper } from "@/lib/ui/paper";
import { ThemeToggle } from "@/components/theme-toggle";

export default function TestPage() {
	return (
		<div className="min-h-screen bg-background p-8">
			<div className="mx-auto max-w-2xl space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-4xl font-bold text-text">Theme Test Page</h1>
						<p className="text-text/60">Testing Threads-inspired color scheme</p>
					</div>
					<ThemeToggle />
				</div>

				<div className="space-y-4">
					<Paper className="p-6">
						<h2 className="text-2xl font-semibold mb-2">Surface Component</h2>
						<p className="text-text">
							This Paper component uses bg-surface. In light mode it should be white (#ffffff),
							in dark mode it should be dark gray (#181818).
						</p>
					</Paper>

					<Paper className="p-6">
						<h2 className="text-2xl font-semibold mb-2">Another Card</h2>
						<p className="text-text">
							The background behind these cards should be slightly darker/grayer.
							Light mode: #f5f5f5, Dark mode: #000000 (pure black).
						</p>
					</Paper>

					<div className="rounded-2xl bg-background p-6 border border-text/10">
						<h2 className="text-2xl font-semibold mb-2">Background Color Box</h2>
						<p className="text-text">
							This box explicitly uses bg-background to show the page background color.
						</p>
					</div>
				</div>

				<div className="grid grid-cols-3 gap-4 mt-8">
					<div className="p-4 bg-background rounded-lg border border-text/20">
						<div className="text-sm font-mono mb-1">background</div>
						<div className="text-xs opacity-60">Light: #f5f5f5<br/>Dark: #000000</div>
					</div>
					<div className="p-4 bg-surface rounded-lg border border-text/20">
						<div className="text-sm font-mono mb-1">surface</div>
						<div className="text-xs opacity-60">Light: #ffffff<br/>Dark: #181818</div>
					</div>
					<div className="p-4 bg-surface rounded-lg border border-text/20">
						<div className="text-sm font-mono mb-1">text</div>
						<div className="text-xs opacity-60">Light: #000000<br/>Dark: #ffffff</div>
					</div>
				</div>
			</div>
		</div>
	);
}
