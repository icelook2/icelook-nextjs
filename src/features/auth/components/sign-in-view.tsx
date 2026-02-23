"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@base-ui/react/button";
import { Field } from "@base-ui/react/field";
import { Input } from "@base-ui/react/input";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toAuthUiError } from "@/features/auth/errors";
import type { SignInEmailFormValues, SignInOtpFormValues } from "@/features/auth/types";
import { signInEmailSchema, signInOtpSchema } from "@/features/auth/validation";
import { authClient } from "@/lib/auth-client";

const EMAIL_STORAGE_KEY = "icelook.auth.email";
const RESEND_COOLDOWN_SECONDS = 30;

type SignInViewProps = {
	nextPath: string;
};

export function SignInView({ nextPath }: SignInViewProps) {
	const router = useRouter();
	const [step, setStep] = useState<"email" | "otp">("email");
	const [emailForOtp, setEmailForOtp] = useState("");
	const [cooldownSeconds, setCooldownSeconds] = useState(0);

	const emailForm = useForm<SignInEmailFormValues>({
		resolver: zodResolver(signInEmailSchema),
		defaultValues: {
			email: "",
		},
	});

	const otpForm = useForm<SignInOtpFormValues>({
		resolver: zodResolver(signInOtpSchema),
		defaultValues: {
			otp: "",
		},
	});

	useEffect(() => {
		const savedEmail = window.localStorage.getItem(EMAIL_STORAGE_KEY);
		if (savedEmail) {
			setEmailForOtp(savedEmail);
			emailForm.reset({ email: savedEmail });
			setStep("otp");
		}
	}, [emailForm]);

	useEffect(() => {
		if (cooldownSeconds <= 0) {
			return;
		}

		const id = window.setInterval(() => {
			setCooldownSeconds((current) => (current <= 1 ? 0 : current - 1));
		}, 1000);

		return () => {
			window.clearInterval(id);
		};
	}, [cooldownSeconds]);

	const canResend = cooldownSeconds <= 0;

	const otpHint = useMemo(() => {
		if (!emailForOtp) {
			return "";
		}

		const [local, domain] = emailForOtp.split("@");
		const maskedLocal = `${local.slice(0, 2)}***`;
		return `${maskedLocal}@${domain ?? ""}`;
	}, [emailForOtp]);

	const handleSendOtp = emailForm.handleSubmit(async (values) => {
		emailForm.clearErrors();
		try {
			const response = await authClient.emailOtp.sendVerificationOtp({
				email: values.email,
				type: "sign-in",
			});

			if (response?.error) {
				throw response.error;
			}

			setEmailForOtp(values.email);
			window.localStorage.setItem(EMAIL_STORAGE_KEY, values.email);
			otpForm.reset({ otp: "" });
			setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
			setStep("otp");
		} catch (error) {
			const uiError = toAuthUiError(error, "email");
			emailForm.setError("root.serverError", { message: uiError.message });
		}
	});

	const handleVerifyOtp = otpForm.handleSubmit(async (values) => {
		otpForm.clearErrors();
		try {
			const response = await authClient.signIn.emailOtp({
				email: emailForOtp,
				otp: values.otp,
			});

			if (response?.error) {
				throw response.error;
			}

			window.localStorage.removeItem(EMAIL_STORAGE_KEY);
			router.replace(nextPath);
			router.refresh();
		} catch (error) {
			const uiError = toAuthUiError(error, "otp");
			otpForm.setError("root.serverError", { message: uiError.message });
		}
	});

	const handleResendOtp = async () => {
		if (!emailForOtp || !canResend) {
			return;
		}

		otpForm.clearErrors("root.serverError");

		try {
			const response = await authClient.emailOtp.sendVerificationOtp({
				email: emailForOtp,
				type: "sign-in",
			});

			if (response?.error) {
				throw response.error;
			}

			setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
		} catch (error) {
			const uiError = toAuthUiError(error, "otp");
			otpForm.setError("root.serverError", { message: uiError.message });
		}
	};

	const handleBackToEmail = () => {
		setStep("email");
		otpForm.reset({ otp: "" });
	};

	return (
		<div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
			<h1 className="text-2xl font-semibold tracking-tight text-slate-900">Sign in</h1>
			<p className="mt-2 text-sm text-slate-600">
				{step === "email"
					? "Enter your email to receive a one-time code."
					: `Enter the 6-digit code sent to ${otpHint || emailForOtp}.`}
			</p>

			{step === "email" ? (
				<form className="mt-6 space-y-4" onSubmit={handleSendOtp} noValidate>
					<Field.Root className="space-y-1">
						<Field.Label className="text-sm font-medium text-slate-700">Email</Field.Label>
						<Input
							type="email"
							autoComplete="email"
							placeholder="you@example.com"
							className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
							{...emailForm.register("email")}
						/>
					</Field.Root>

					{emailForm.formState.errors.email && (
						<p className="text-sm text-red-600">{emailForm.formState.errors.email.message}</p>
					)}
					{emailForm.formState.errors.root?.serverError && (
						<p className="text-sm text-red-600">{emailForm.formState.errors.root.serverError.message}</p>
					)}

					<Button
						type="submit"
						disabled={emailForm.formState.isSubmitting}
						className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
					>
						{emailForm.formState.isSubmitting ? "Sending code..." : "Send code"}
					</Button>
				</form>
			) : (
				<form className="mt-6 space-y-4" onSubmit={handleVerifyOtp} noValidate>
					<Field.Root className="space-y-1">
						<Field.Label className="text-sm font-medium text-slate-700">Code</Field.Label>
						<Input
							type="text"
							inputMode="numeric"
							autoComplete="one-time-code"
							maxLength={6}
							placeholder="123456"
							className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm tracking-[0.3em] text-slate-900 outline-none transition focus:border-slate-500"
							{...otpForm.register("otp")}
						/>
					</Field.Root>

					{otpForm.formState.errors.otp && (
						<p className="text-sm text-red-600">{otpForm.formState.errors.otp.message}</p>
					)}
					{otpForm.formState.errors.root?.serverError && (
						<p className="text-sm text-red-600">{otpForm.formState.errors.root.serverError.message}</p>
					)}

					<div className="flex items-center justify-between gap-3">
						<Button
							type="button"
							onClick={handleBackToEmail}
							className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-3 text-sm text-slate-700"
						>
							Back
						</Button>
						<Button
							type="button"
							onClick={handleResendOtp}
							disabled={!canResend}
							className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-3 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{canResend ? "Resend code" : `Resend in ${cooldownSeconds}s`}
						</Button>
					</div>

					<Button
						type="submit"
						disabled={otpForm.formState.isSubmitting}
						className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
					>
						{otpForm.formState.isSubmitting ? "Signing in..." : "Sign in"}
					</Button>
				</form>
			)}
		</div>
	);
}
