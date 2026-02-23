export type SignInEmailFormValues = {
	email: string;
};

export type SignInOtpFormValues = {
	otp: string;
};

export type SafeSession = {
	session: {
		userId: string;
	};
	user?: {
		id?: string;
		email?: string;
		name?: string;
	};
} | null;

export type AuthUiErrorCode =
	| "INVALID_OTP"
	| "EXPIRED_OTP"
	| "THROTTLED"
	| "NETWORK"
	| "VALIDATION"
	| "UNKNOWN";

export type AuthUiError = {
	code: AuthUiErrorCode;
	message: string;
	field?: "email" | "otp";
};
