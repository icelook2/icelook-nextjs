import { Suspense } from "react";
import { AuthForm } from "./_components/auth-form";

export default function AuthPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <Suspense fallback={<AuthFormSkeleton />}>
            <AuthForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

function AuthFormSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-32 mx-auto mb-2" />
      <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-8" />
      <div className="h-4 bg-gray-200 rounded w-16 mb-1.5" />
      <div className="h-12 bg-gray-200 rounded-full mb-4" />
      <div className="h-12 bg-gray-200 rounded-full" />
    </div>
  );
}
