import Link from "next/link";
import { Scale, ShieldCheck, Clock, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 border-b border-slate-100 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Scale className="h-6 w-6 text-slate-900" />
          <span className="text-xl font-bold tracking-tight text-slate-900">LegalCase NY</span>
        </div>
        <div className="flex gap-4">
          <Link href="/auth/login" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">
            Sign In
          </Link>
          <Link href="/auth/sign-up" className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-24 text-center max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
          Matrimonial Case Management <span className="text-emerald-600">Reimagined.</span>
        </h1>
        <p className="text-xl text-slate-500 mb-10 leading-relaxed">
          The only end-to-end platform designed for New York divorce law. 
          Automated CSSA 2026 calculations, secure client portals, and one-click Net Worth generation.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/login?role=lawyer" className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all">
            Attorney Access
          </Link>
          <Link href="/login?role=client" className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-900 rounded-xl font-bold hover:bg-slate-50 transition-all">
            Client Portal Login
          </Link>
        </div>
      </section>

      {/* Trust Features */}
      <section className="bg-slate-50 py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <FeatureCard 
            icon={<ShieldCheck className="h-8 w-8 text-emerald-600" />}
            title="NY Legal Compliance"
            desc="Built-in logic for DRL §170 and 2026 maintenance caps ensures every filing is accurate."
          />
          <FeatureCard 
            icon={<Clock className="h-8 w-8 text-emerald-600" />}
            title="Automatic Deadlines"
            desc="Never miss a CPLR 306-b service deadline with automated 120-day tracking."
          />
          <FeatureCard 
            icon={<Users className="h-8 w-8 text-emerald-600" />}
            title="Secure Collaboration"
            desc="Encrypted client portals for effortless document collection and asset tracking."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center text-slate-400 text-sm border-t border-slate-100">
        © 2026 LegalCase NY. Encrypted & Secured for New York Law Practices.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: any) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-emerald-200 transition-colors">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}