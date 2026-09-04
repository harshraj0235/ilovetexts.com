'use client';

import { useState, useEffect } from 'react';

export default function InstallPrompt({ t }) {
  const installTexts = t?.installPrompt || {
    title: "Add ilovetexts to Home Screen",
    subtitle: "Instant access to 129+ text tools — even offline!",
    button: "Install"
  };
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user dismissed before
    const dismissed = localStorage.getItem('ilt-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 14) return; // Don't show for 14 days after dismissal
    }

    // Check if user has engaged enough (used at least 2 tools)
    const recentTools = JSON.parse(localStorage.getItem('ilt-recent-tools') || '[]');
    if (recentTools.length < 2) return;

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('ilt-install-dismissed', new Date().toISOString());
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <div className="install-prompt">
      <div className="install-prompt-content">
        <div className="install-prompt-icon" role="img" aria-label="rocket">🚀</div>
        <div className="install-prompt-text">
          <strong>{installTexts.title}</strong>
          <span>{installTexts.subtitle}</span>
        </div>
        <div className="install-prompt-actions">
          <button className="btn btn-primary install-prompt-btn" onClick={handleInstall}>
            {installTexts.button}
          </button>
          <button className="install-prompt-dismiss" onClick={handleDismiss} aria-label="Dismiss">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
