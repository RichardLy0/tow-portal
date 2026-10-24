type LoginFormProps = {
  authenticationFailed: boolean;
};

export default function LoginForm({ authenticationFailed }: LoginFormProps) {

  return (
    <div className="relative flex items-center justify-center min-h-screen w-full overflow-hidden bg-[#060d1a]">
      {/* Animated grid background */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(245,158,11,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245,158,11,0.8) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(15,30,60,0.95) 0%, rgba(6,13,26,0.99) 100%)',
        }}
      />

      {/* Corner accent lights */}
      <div className="absolute top-0 left-0 w-96 h-96 opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle at top left, #f59e0b, transparent 60%)' }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle at bottom right, #3b82f6, transparent 60%)' }} />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Top badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Secure Portal
          </span>
        </div>

        {/* Logo / Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/20">
            <TowTruckIcon className="w-10 h-10 text-[#060d1a]" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
            Tow Deputy
          </h1>
          <p className="text-sm font-medium tracking-[0.2em] uppercase text-amber-400/80">
            Competitor Intel Portal
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 border border-white/10"
          style={{
            background:
              'linear-gradient(135deg, rgba(30,45,66,0.95) 0%, rgba(20,30,48,0.95) 100%)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,158,11,0.08)',
          }}
        >
          <p className="text-slate-400 text-sm mb-6 text-center">
            Sign in with your Tow Deputy account to continue.
          </p>

          <div className="space-y-5">
            {authenticationFailed && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Sign-in could not be completed. Please try again.
              </div>
            )}
            <a
              href="/api/login"
              className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm text-[#060d1a] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                boxShadow: '0 8px 24px rgba(245,158,11,0.25)',
              }}
            >
              Continue to Tow Deputy
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6">
          Tow Deputy &mdash; Proprietary Competitor Intelligence &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

function TowTruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="22" width="24" height="14" rx="2" fill="currentColor" />
      <rect x="28" y="28" width="14" height="8" rx="2" fill="currentColor" />
      <path d="M28 30 L36 22 L42 22 L42 30" fill="currentColor" />
      <circle cx="10" cy="38" r="4" fill="currentColor" stroke="#f59e0b" strokeWidth="1.5" />
      <circle cx="22" cy="38" r="4" fill="currentColor" stroke="#f59e0b" strokeWidth="1.5" />
      <circle cx="36" cy="38" r="4" fill="currentColor" stroke="#f59e0b" strokeWidth="1.5" />
      <path d="M28 24 L28 18 L32 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M32 18 L32 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2" />
    </svg>
  );
}
