import SignupForm from "@/components/auth/signup-form";

export default function Signup() {
  return (
    <div className="flex justify-center w-full p-8 pt-16 pb-20 sm:p-20 sm:pt-20">
      <div className="w-full max-w-xs overflow-hidden relative">
        <div className="flex flex-col gap-16">
          <h1 className="text-2xl font-bold text-secondary text-center">create account</h1>
          <SignupForm />
        </div>
      </div>
    </div>
  );
} 