import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0c0e]">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <a href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-[#f2f2f5] font-semibold text-lg">SpecHub</span>
          </a>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
