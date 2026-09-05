'use client';

import Link from 'next/link';

export default function PromotedTools({ lang }) {
  const lp = (path) => lang === 'en' ? path : `/${lang}${path}`;

  const promos = [
    { name: 'Background Remover', path: '/image-tools/remove-background', count: '20M', icon: '✨', bg: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)' },
    { name: 'Resume Builder', path: '/productivity-tools/resume-builder', count: '25M', icon: '📄', bg: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)' },
    { name: 'PDF to Word', path: '/pdf-text-tools/pdf-to-word', count: '15M', icon: '🔄', bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)' },
    { name: 'HEIC to JPG', path: '/image-tools/heic-to-jpg', count: '5M', icon: '📸', bg: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' },
    { name: 'Passport Photo Maker', path: '/image-tools/passport-photo-maker', count: '8M', icon: '🖼️', bg: 'linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)' },
    { name: 'Meme Generator', path: '/image-tools/meme-generator', count: 'Trending', icon: '😂', bg: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' }
  ];

  return (
    <section className="promoted-tools-section" style={{ padding: '0 24px 60px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 auto 24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
          <span style={{ fontSize: '1.4rem' }}>🔥</span> Popular Now
        </h2>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Sponsored
        </span>
      </div>

      <div className="promo-grid">
        {promos.map((promo, idx) => (
          <Link key={idx} href={lp(promo.path)} className="promo-card">
            <div className="promo-icon-box" style={{ background: promo.bg }}>
              {promo.icon}
            </div>
            <div className="promo-info">
              <h3>{promo.name}</h3>
              <div className="promo-stats">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}>
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>{promo.count} Uses</span>
              </div>
            </div>
            <div className="promo-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .promoted-tools-section {
           width: 100%;
        }
        .promo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }
        .promo-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: var(--bg-white);
          border: 1px solid var(--border-light);
          border-radius: 16px;
          text-decoration: none;
          color: var(--text-primary);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: var(--shadow-sm);
          position: relative;
          overflow: hidden;
        }
        .promo-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: var(--brand-blue);
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .promo-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--border-strong);
        }
        .promo-card:hover::before {
          opacity: 1;
        }
        .promo-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          flex-shrink: 0;
          box-shadow: inset 0 2px 4px rgba(255,255,255,0.4);
        }
        .promo-info {
          flex: 1;
        }
        .promo-info h3 {
          margin: 0 0 4px 0;
          font-size: 1.05rem;
          font-weight: 600;
          line-height: 1.2;
        }
        .promo-stats {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          color: var(--text-secondary);
          font-weight: 500;
        }
        .promo-arrow {
          color: var(--border-light);
          transition: all 0.25s ease;
        }
        .promo-card:hover .promo-arrow {
          color: var(--brand-blue);
          transform: translateX(4px);
        }
        
        @media (max-width: 600px) {
          .promo-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
