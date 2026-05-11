const PARTICLES = [
  { s: 3, t: '8%',  l: '12%', d: '7s',  dl: '0s',    o: 0.5  },
  { s: 2, t: '18%', l: '88%', d: '9s',  dl: '1.5s',  o: 0.35 },
  { s: 4, t: '30%', l: '4%',  d: '6s',  dl: '3s',    o: 0.25 },
  { s: 2, t: '42%', l: '93%', d: '11s', dl: '0.5s',  o: 0.4  },
  { s: 3, t: '55%', l: '20%', d: '8s',  dl: '2s',    o: 0.3  },
  { s: 2, t: '63%', l: '76%', d: '7s',  dl: '4s',    o: 0.35 },
  { s: 5, t: '72%', l: '40%', d: '10s', dl: '1s',    o: 0.18 },
  { s: 2, t: '85%', l: '62%', d: '6s',  dl: '2.5s',  o: 0.45 },
  { s: 3, t: '22%', l: '48%', d: '12s', dl: '0.8s',  o: 0.15 },
  { s: 2, t: '78%', l: '8%',  d: '8s',  dl: '3.5s',  o: 0.4  },
  { s: 4, t: '50%', l: '67%', d: '9s',  dl: '1s',    o: 0.2  },
  { s: 2, t: '92%', l: '84%', d: '7s',  dl: '2s',    o: 0.3  },
  { s: 3, t: '5%',  l: '60%', d: '11s', dl: '4.5s',  o: 0.35 },
  { s: 2, t: '60%', l: '30%', d: '6s',  dl: '1.5s',  o: 0.22 },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0a0a0f, #0d0a1e, #0a0f1e, #080a0f, #0d0a1e, #0a0a0f)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 8s ease infinite',
      }}
    >
      <style>{`
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          25%  { background-position: 100% 50%; }
          50%  { background-position: 100% 0%; }
          75%  { background-position: 0% 100%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes glowPulse {
          0%, 100% {
            text-shadow:
              0 0 8px rgba(124,58,237,0.9),
              0 0 22px rgba(124,58,237,0.6),
              0 0 45px rgba(124,58,237,0.35);
          }
          50% {
            text-shadow:
              0 0 14px rgba(167,139,250,1),
              0 0 35px rgba(124,58,237,0.9),
              0 0 70px rgba(124,58,237,0.55),
              0 0 100px rgba(79,70,229,0.3);
          }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes particleFloat {
          0%   { transform: translate(0, 0);        opacity: var(--p-lo); }
          33%  { transform: translate(8px, -16px);  opacity: var(--p-hi); }
          66%  { transform: translate(-6px, 9px);   opacity: var(--p-mid); }
          100% { transform: translate(0, 0);        opacity: var(--p-lo); }
        }
        .glow-up-text {
          color: #a78bfa;
          animation: glowPulse 2.5s ease-in-out infinite;
        }
        .tagline-anim {
          animation: fadeInUp 0.9s ease-out 0.35s both;
        }
        .auth-card-border {
          background: linear-gradient(
            135deg,
            rgba(124,58,237,0.45),
            rgba(79,70,229,0.2),
            rgba(124,58,237,0.1),
            rgba(79,70,229,0.3)
          );
          padding: 1px;
          border-radius: 1rem;
          box-shadow: 0 0 60px rgba(124,58,237,0.15), 0 25px 60px rgba(0,0,0,0.55);
        }
        .auth-card-inner {
          background: rgba(8, 5, 20, 0.88);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border-radius: calc(1rem - 1px);
        }
        .btn-violet-glow {
          background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 50%, #4f46e5 100%);
          box-shadow: 0 4px 22px rgba(124,58,237,0.45);
          transition: box-shadow 0.25s ease, transform 0.2s ease, opacity 0.2s ease;
        }
        .btn-violet-glow:hover:not(:disabled) {
          box-shadow: 0 6px 35px rgba(124,58,237,0.75), 0 0 25px rgba(124,58,237,0.35);
          transform: translateY(-1px);
        }
        .btn-violet-glow:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 2px 15px rgba(124,58,237,0.45);
        }
        .btn-violet-glow:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-google {
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }
        .btn-google:hover:not(:disabled) {
          box-shadow: 0 4px 18px rgba(0,0,0,0.25);
          transform: translateY(-1px);
        }
        .btn-google:active:not(:disabled) { transform: translateY(0); }
        .btn-google:disabled { opacity: 0.6; cursor: not-allowed; }
        .auth-input {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(124,58,237,0.18);
          color: #fff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          outline: none;
        }
        .auth-input::placeholder { color: rgba(255,255,255,0.2); }
        .auth-input:focus {
          border-color: rgba(124,58,237,0.6);
          box-shadow: 0 0 0 3px rgba(124,58,237,0.15);
        }
      `}</style>

      {/* Partículas de fundo */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: p.s,
              height: p.s,
              top: p.t,
              left: p.l,
              borderRadius: '50%',
              background: 'rgba(139,92,246,0.7)',
              '--p-lo': p.o * 0.5,
              '--p-mid': p.o * 0.75,
              '--p-hi': p.o,
              animation: `particleFloat ${p.d} ease-in-out ${p.dl} infinite`,
              willChange: 'transform',
            } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
