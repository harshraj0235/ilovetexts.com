'use client';

import Link from 'next/link';

export default function PromotedTools({ lang }) {
  const lp = (path) => lang === 'en' ? path : `/${lang}${path}`;

  const promos = [
    { name: 'Background Remover', path: '/image-tools/remove-background', count: '20M', icon: '✨', bg: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)' },
    { name: 'Resume Builder', path: '/productivity-tools/resume-builder', count: '25M', icon: '📄', bg: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)' },
    { name: 'PDF to Word', path: '/pdf-text-tools/pdf-to-word', count: '15M', icon: '🔄', bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
    { name: 'HEIC to JPG', path: '/image-tools/heic-to-jpg', count: '5M', icon: '📸', bg: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' },
    { name: 'Passport Photo Maker', path: '/image-tools/passport-photo-maker', count: '8M', icon: '🖼️', bg: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)' },
    { name: 'Meme Generator', path: '/image-tools/meme-generator', count: 'Trending', icon: '😂', bg: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' }
  ];

  return (
    <div style={{ paddingTop: '12px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', marginBottom: '24px' }}>
        <span style={{ fontSize: '1.4rem' }}>🔥</span> Popular Now
      </h2>

      <div className="promo-grid">
        {promos.map((promo, idx) => (
          <Link key={idx} href={lp(promo.path)} className="promo-card">
            <div className="promo-icon" style={{ background: promo.bg }}>
              {promo.icon}
            </div>
            <h3 className="promo-title">{promo.name}</h3>
            <div className="promo-stats">
              <span className="promo-check">✓</span>
              <span>{promo.count} Uses</span>
            </div>
            <div className="promo-arrow">→</div>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .promo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 32px 24px;
        }
        .promo-card {
          display: flex;
          flex-direction: column;
          text-decoration: none;
          color: var(--text-primary);
          transition: transform 0.2s ease;
        }
        .promo-card:hover {
          transform: translateY(-2px);
        }
        .promo-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          margin-bottom: 12px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
        .promo-title {
          margin: 0 0 4px 0;
          font-size: 1.1rem;
          font-weight: 700;
          line-height: 1.3;
          color: var(--text-primary);
        }
        .promo-stats {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
          color: var(--text-secondary);
          font-weight: 500;
          margin-bottom: 4px;
        }
        .promo-check {
          color: #10b981;
          font-weight: bold;
        }
        .promo-arrow {
          color: var(--border-strong);
          font-size: 1.2rem;
          transition: transform 0.2s ease;
          line-height: 1;
        }
        .promo-card:hover .promo-arrow {
          transform: translateX(4px);
          color: var(--brand-blue);
        }
        
        @media (max-width: 768px) {
          .promo-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 24px 16px;
          }
        }
        @media (max-width: 480px) {
          .promo-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
