import { SignUp } from "@clerk/nextjs";

const clerkDark = {
  variables: {
    colorPrimary: "#6366f1",
    colorBackground: "#0e0e12",
    colorInputBackground: "#111114",
    colorText: "#f2f2f5",
    colorTextSecondary: "#a0a0b0",
    colorTextOnPrimaryBackground: "#ffffff",
    colorNeutral: "#2a2a32",
    colorDanger: "#ef4444",
    borderRadius: "0.75rem",
    fontFamily: "inherit",
  },
  elements: {
    card: "bg-[#0e0e12] border border-[#1e1e24] shadow-2xl",
    headerTitle: "text-[#f2f2f5]",
    headerSubtitle: "text-[#a0a0b0]",
    socialButtonsBlockButton:
      "border border-[#2a2a32] bg-[#111114] text-[#f2f2f5] hover:bg-[#1a1a20] transition-colors",
    socialButtonsBlockButtonText: "text-[#f2f2f5]",
    dividerLine: "bg-[#2a2a32]",
    dividerText: "text-[#606070]",
    formFieldLabel: "text-[#a0a0b0]",
    formFieldInput:
      "bg-[#111114] border-[#2a2a32] text-[#f2f2f5] focus:border-indigo-500/40",
    formButtonPrimary:
      "bg-indigo-500 hover:bg-indigo-600 text-white transition-colors",
    footerActionLink: "text-indigo-400 hover:text-indigo-300",
    footerActionText: "text-[#606070]",
    identityPreviewText: "text-[#f2f2f5]",
    identityPreviewEditButton: "text-indigo-400",
    formFieldInputShowPasswordButton: "text-[#606070]",
    alertText: "text-[#f2f2f5]",
    internal: "bg-[#0e0e12]",
  },
};

export default function SignUpPage() {
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
        <SignUp appearance={clerkDark} />
      </div>
    </div>
  );
}
