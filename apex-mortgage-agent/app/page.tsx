import dynamic from "next/dynamic";
import { Building2, Shield, Zap } from "lucide-react";

const ChatInterface = dynamic(() => import("@/components/chat-interface"), {
  ssr: false,
});

const FEATURES = [
  { icon: Zap, label: "Instant calculations" },
  { icon: Shield, label: "Bank-grade accuracy" },
  { icon: Building2, label: "All loan types" },
];

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-[#f4f7fb]">
      {/* Header */}
      <header className="bg-apex-navy text-white px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-apex-gold flex items-center justify-center">
            <Building2 className="w-5 h-5 text-apex-navy" />
          </div>
          <div>
            <h1 className="font-semibold text-base leading-tight">Apex Mortgage Agent</h1>
            <p className="text-xs text-blue-300 leading-tight">AI-Powered Mortgage Advisor</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-6">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-blue-200">
              <Icon className="w-3.5 h-3.5 text-apex-gold" />
              {label}
            </div>
          ))}
        </div>
      </header>

      {/* Chat */}
      <main className="flex-1 overflow-hidden max-w-5xl mx-auto w-full">
        <ChatInterface />
      </main>
    </div>
  );
}
