import Link from "next/link";
import { Shield } from "lucide-react";

const TRUST_POINTS = [
  { icon: Shield, label: "SAM.gov contracts matched daily" },
];

export default function BrandPanel() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between w-[480px] min-h-screen p-12 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #635BFF 0%, #4B44D6 40%, #3B35B0 100%)" }}
    >
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-rule='evenodd'%3E%3Cpath d='M0 0h1v40H0zM39 0h1v40h-1zM0 0h40v1H0zM0 39h40v1H0z'/%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      {/* Ambient glow */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-white/[0.06] rounded-full blur-3xl" />
      <div className="absolute bottom-32 left-10 w-48 h-48 bg-white/[0.04] rounded-full blur-3xl" />

      <div className="relative z-10">
        <Link href="/" className="font-bold text-2xl tracking-tight text-white/90 hover:text-white transition-colors">
          Plexovia
        </Link>
      </div>

      <div className="relative z-10 -mt-8">
        <h2 className="text-white text-[32px] font-bold leading-tight tracking-tight mb-10">
          Federal contracts<br/>
          matched to your business.<br/>
          Every day.
        </h2>
        <div className="flex flex-col gap-4">
          {TRUST_POINTS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <Icon size={16} className="text-white/80" />
              </div>
              <span className="text-white/70 text-[14px]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-white/40 text-[13px]">
          Built for government contractors who win federal work
        </p>
      </div>
    </div>
  );
}
