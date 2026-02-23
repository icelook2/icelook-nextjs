import { z } from "zod";

export const signInEmailSchema = z.object({
	email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
});

export const signInOtpSchema = z.object({
	otp: z
		.string()
		.trim()
		.regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export type SignInEmailSchema = z.infer<typeof signInEmailSchema>;
export type SignInOtpSchema = z.infer<typeof signInOtpSchema>;
