import { createContext } from "svelte";
import { type SignInStep } from "$lib/components/auth/sign-in/types"

export interface SignInContext {
  step: SignInStep;
  email: string;
}

export const [getSignInContext, setSignInContext] = createContext<SignInContext>()

