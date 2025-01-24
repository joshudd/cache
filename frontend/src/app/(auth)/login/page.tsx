"use client";

import LoginForm from "@/components/auth/login-form";

export default function Login() {
  return (
    <div className="flex justify-center w-full p-8 pt-16 pb-20 sm:p-20 sm:pt-20">
      <div className="w-full max-w-xs overflow-hidden relative">
        <div className="flex flex-col gap-16">
          <h1 className="text-2xl text-secondary font-bold text-center">
            cache
          </h1>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
