'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getAllTools } from '@/lib/tools-config';

export default function RecentTools() {
  const [recentTools, setRecentTools] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const params = useParams();
  const lang = params?.lang || 'en';

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('ilt-recent-tools') || '[]');
    if (stored.length === 0) return;

    const allTools = getAllTools(lang);
    const toolsWithData = stored
      .map((item) => {
        const toolData = allTools.find(
          (t) => t.categoryId === item.categoryId && t.slug === item.slug
        );
        if (!toolData) return null;
        return { ...toolData, lastUsed: item.lastUsed };
      })
      .filter(Boolean)
      .slice(0, 5);

    setRecentTools(toolsWithData);
  }, []);

  if (recentTools.length === 0) return null;

  const lp = (path) => lang === 'en' ? path : `/${lang}${path}`;

  return (
    <div className={`recent-tools-widget ${isExpanded ? 'expanded' : ''}`}>
      <button
        className="recent-tools-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label={isExpanded ? 'Collapse recent tools' : 'Expand recent tools'}
        title="Recently Used Tools"
      >
        <span className="recent-tools-icon" role="img" aria-label="clock">🕐</span>
        {isExpanded && <span className="recent-tools-label">Recent</span>}
      </button>

      {isExpanded && (
        <div className="recent-tools-list">
          <h4>Recently Used</h4>
          {recentTools.map((tool) => (
            <Link
              key={`${tool.categoryId}-${tool.slug}`}
              href={lp(`/${tool.categoryId}/${tool.slug}`)}
              className="recent-tool-item"
              onClick={() => setIsExpanded(false)}
            >
              <span className="recent-tool-item-icon" role="img" aria-label={tool.name}>
                {tool.icon}
              </span>
              <span className="recent-tool-item-name">{tool.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
