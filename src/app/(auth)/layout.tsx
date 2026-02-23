export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<div className="min-h-screen bg-slate-100 bg-[radial-gradient(circle_at_top,_#e2e8f0,_#f8fafc_55%)] px-4 py-10">
			<div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl items-center justify-center">
				{children}
			</div>
		</div>
	);
}
