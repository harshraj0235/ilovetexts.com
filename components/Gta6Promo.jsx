'use client';

import Link from 'next/link';

export default function Gta6Promo({ lang }) {
  return (
    <div className="gta-promo-outer">
      <style jsx>{`
        .gta-promo-outer {
          position: relative;
          border-radius: 16px;
          padding: 2px;
          margin: 2rem 0 3rem;
          background: linear-gradient(135deg, #ec4899, #a855f7, #6366f1);
          box-shadow: 0 0 40px rgba(236, 72, 153, 0.2), 0 8px 32px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }
        .gta-promo-outer::before {
          content: '';
          position: absolute;
          inset: -2px;
          background: linear-gradient(135deg, #ec4899, #a855f7, #6366f1, #ec4899);
          background-size: 300% 300%;
          animation: gta-border-glow 4s ease infinite;
          filter: blur(8px);
          opacity: 0.4;
          z-index: 0;
        }
        .gta-promo-inner {
          position: relative;
          z-index: 1;
          background: #0f172a;
          border-radius: 14px;
          padding: 2.5rem 2.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          overflow: hidden;
        }
        @media (max-width: 768px) {
          .gta-promo-inner {
            flex-direction: column;
            padding: 2rem 1.5rem;
            text-align: center;
          }
        }
        /* Background blobs */
        .gta-promo-blob-1 {
          position: absolute;
          bottom: -60px;
          right: -40px;
          width: 250px;
          height: 250px;
          background: rgba(236, 72, 153, 0.12);
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
        }
        .gta-promo-blob-2 {
          position: absolute;
          top: -50px;
          left: -30px;
          width: 200px;
          height: 200px;
          background: rgba(34, 211, 238, 0.1);
          border-radius: 50%;
          filter: blur(50px);
          pointer-events: none;
        }
        .gta-promo-content {
          flex: 1;
          position: relative;
          z-index: 2;
        }
        .gta-promo-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.3rem 0.85rem;
          border-radius: 20px;
          background: rgba(236, 72, 153, 0.15);
          border: 1px solid rgba(236, 72, 153, 0.3);
          color: #f9a8d4;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin-bottom: 1rem;
        }
        .gta-promo-dot {
          position: relative;
          width: 8px;
          height: 8px;
        }
        .gta-promo-dot-inner {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: #ec4899;
        }
        .gta-promo-dot-ping {
          position: absolute;
          inset: -2px;
          border-radius: 50%;
          background: #ec4899;
          animation: gta-ping 1.5s ease-in-out infinite;
          opacity: 0;
        }
        .gta-promo-title {
          font-size: clamp(1.6rem, 4vw, 2.2rem);
          font-weight: 900;
          color: #fff;
          margin: 0 0 0.75rem;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .gta-promo-title-accent {
          background: linear-gradient(90deg, #f472b6, #22d3ee);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .gta-promo-desc {
          color: #94a3b8;
          font-size: 1rem;
          line-height: 1.7;
          margin: 0 0 1.5rem;
          max-width: 520px;
        }
        @media (max-width: 768px) {
          .gta-promo-desc { margin-left: auto; margin-right: auto; }
        }
        .gta-promo-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.8rem 1.5rem;
          background: linear-gradient(135deg, #db2777, #ec4899);
          color: #fff;
          font-size: 0.95rem;
          font-weight: 700;
          border-radius: 10px;
          text-decoration: none;
          transition: all 0.25s ease;
          box-shadow: 0 0 20px rgba(219, 39, 119, 0.35);
        }
        .gta-promo-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 35px rgba(219, 39, 119, 0.55);
          background: linear-gradient(135deg, #be185d, #db2777);
        }
        .gta-promo-cta svg {
          width: 18px;
          height: 18px;
          transition: transform 0.2s;
        }
        .gta-promo-cta:hover svg {
          transform: translateX(3px);
        }

        /* Right side decorative cards */
        .gta-promo-cards {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          position: relative;
          z-index: 2;
          opacity: 0.85;
        }
        @media (max-width: 768px) {
          .gta-promo-cards { display: none; }
        }
        .gta-promo-card {
          width: 240px;
          padding: 1rem 1.2rem;
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          transition: all 0.3s ease;
        }
        .gta-promo-card:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(-4px);
        }
        .gta-promo-card-1 {
          transform: rotate(-3deg) translateY(4px);
        }
        .gta-promo-card-1:hover { transform: rotate(0deg) translateY(0); }
        .gta-promo-card-2 {
          transform: rotate(2deg) translateX(-8px);
        }
        .gta-promo-card-2:hover { transform: rotate(0deg) translateX(-4px); }
        .gta-promo-card-bar {
          height: 5px;
          border-radius: 3px;
          margin-bottom: 0.6rem;
        }
        .gta-promo-card-line {
          height: 4px;
          background: rgba(255, 255, 255, 0.12);
          border-radius: 2px;
          margin-bottom: 0.35rem;
        }

        @keyframes gta-border-glow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes gta-ping {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>

      <div className="gta-promo-inner">
        <div className="gta-promo-blob-1"></div>
        <div className="gta-promo-blob-2"></div>

        <div className="gta-promo-content">
          <div className="gta-promo-tag">
            <span className="gta-promo-dot">
              <span className="gta-promo-dot-ping"></span>
              <span className="gta-promo-dot-inner"></span>
            </span>
            TRENDING NOW
          </div>
          <h2 className="gta-promo-title">
            Prepare for <span className="gta-promo-title-accent">Vice City</span>
          </h2>
          <p className="gta-promo-desc">
            Check out our new suite of GTA 6 tools! Generate your own &apos;Florida Man&apos; breaking news headlines, create custom license plates, and build the ultimate hype.
          </p>
          <Link href={`/${lang}/gta-6-tools/vice-city-headline-generator`} className="gta-promo-cta">
            Try the Headline Generator
            <svg fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
          </Link>
        </div>

        {/* Decorative cards */}
        <div className="gta-promo-cards">
          <div className="gta-promo-card gta-promo-card-1">
            <div className="gta-promo-card-bar" style={{ width: '40%', background: '#ec4899' }}></div>
            <div className="gta-promo-card-line" style={{ width: '100%' }}></div>
            <div className="gta-promo-card-line" style={{ width: '80%' }}></div>
          </div>
          <div className="gta-promo-card gta-promo-card-2">
            <div className="gta-promo-card-bar" style={{ width: '55%', background: '#22d3ee' }}></div>
            <div className="gta-promo-card-line" style={{ width: '100%' }}></div>
            <div className="gta-promo-card-line" style={{ width: '70%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
