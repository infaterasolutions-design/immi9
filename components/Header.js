import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SearchOverlay from './SearchOverlay';

/* ── Navigation data structure ── */
const NAV_ITEMS = [
  {
    label: 'Home',
    href: '/',
    dropdown: [
      { label: 'Latest News', href: '/' },
      { label: 'Trending Immigration News', href: '/category/visa-news' },
    ],
  },
  {
    label: 'Visa News',
    href: '/category/visa-news',
    dropdown: [
      { label: 'H1B Visa', href: '/category/visa-news/h1b-visa' },
      { label: 'Green Card', href: '/category/visa-news/green-card' },
      { label: 'F1 & OPT/CPT', href: '/category/visa-news/f1-opt-cpt' },
      { label: 'B1/B2 (Tourist & Business)', href: '/category/visa-news/b1-b2' },
      { label: 'USCIS Updates', href: '/category/visa-news/uscis' },
      { label: 'Consulate Alerts', href: '/category/processing-times/consulate' },
    ],
  },
  {
    label: 'Visa Guides',
    href: '/category/visa-guides',
    dropdown: [
      { label: 'How-To Articles', href: '/category/visa-guides/how-to' },
      { label: 'Application Steps', href: '/category/visa-guides/steps' },
      { label: 'FAQs', href: '/category/visa-guides/faqs' },
    ],
  },
  { label: 'Visa Bulletin', href: '/category/visa-bulletin' },
  {
    label: 'Processing Times',
    href: '/category/processing-times',
    dropdown: [
      { label: 'USCIS Service Center Timelines', href: '/category/processing-times' },
      { label: 'Consulate Appointment Wait Times', href: '/category/processing-times/consulate' },
    ],
  },
  {
    label: 'Fee Calculator',
    href: '#',
    dropdown: [
      { label: 'Tool Page', href: '#' },
      { label: 'Fee Breakdown', href: '#' },
    ],
  },
  {
    label: 'Tools',
    href: '#',
    dropdown: [
      { label: 'Visa Status Checker', href: '#' },
      { label: 'USCIS Case Tracker', href: '#' },
      { label: 'H1B Lottery Tracker', href: '#' },
    ],
  },
  {
    label: 'About',
    href: '#',
    dropdown: [
      { label: 'Mission Statement', href: '#' },
      { label: 'Disclaimer', href: '#' },
      { label: 'Contact Info', href: '#' },
    ],
  },
];

export default function Header() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState(null);

  // Close mobile menu on route change
  useEffect(() => {
    const handleRouteChange = () => {
      setMobileMenuOpen(false);
      setExpandedAccordion(null);
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router]);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    setExpandedAccordion(null);
  }, []);

  const toggleAccordion = (index) => {
    setExpandedAccordion(expandedAccordion === index ? null : index);
  };

  // Ripple coordinates for premium icons
  const handleRipple = (e, btnRef) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
    btnRef.current.style.setProperty('--ripple-x', x + '%');
    btnRef.current.style.setProperty('--ripple-y', y + '%');
  };

  const searchBtnRef = useRef(null);
  const menuBtnRef = useRef(null);

  return (
    <>
      {/* ── Premium Icon Styles ── */}
      <style jsx global>{`
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .headline-font { font-family: 'Poppins', sans-serif; }
        *, *::before, *::after { border-radius: 0px !important; }

        /* ── Nav dropdown animation ── */
        .nav-dropdown {
          opacity: 0; visibility: hidden; transform: translateY(8px);
          transition: all 0.2s ease-out;
        }
        .nav-item:hover .nav-dropdown {
          opacity: 1; visibility: visible; transform: translateY(0);
        }

        /* ── Premium mobile header icons ── */
        .mob-icon-btn {
          position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;
          background: linear-gradient(145deg, rgba(255,255,255,0.85), rgba(248,250,252,0.75));
          backdrop-filter: blur(16px) saturate(1.8); -webkit-backdrop-filter: blur(16px) saturate(1.8);
          border: 1px solid rgba(226,232,240,0.6);
          box-shadow: 0 2px 8px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.02);
          transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease, background 0.3s ease;
          border-radius: 13px !important; cursor: pointer; -webkit-tap-highlight-color: transparent;
          overflow: hidden; isolation: isolate;
        }
        .mob-icon-btn::before {
          content: ''; position: absolute; inset: 0; border-radius: 13px !important;
          background: radial-gradient(circle at var(--ripple-x, 50%) var(--ripple-y, 50%), rgba(28,78,216,0.12) 0%, transparent 60%);
          opacity: 0; transition: opacity 0.4s ease; z-index: 0;
        }
        .mob-icon-btn:active::before { opacity: 1; }
        .mob-icon-btn::after {
          content: ''; position: absolute; inset: -3px; border-radius: 16px !important;
          background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.08), rgba(147,51,234,0.06));
          opacity: 0; transition: opacity 0.35s ease; z-index: -1; filter: blur(2px);
        }
        .mob-icon-btn:active::after { opacity: 1; }
        @keyframes iconBounce { 0% { transform: scale(1); } 30% { transform: scale(0.9); } 60% { transform: scale(1.04); } 100% { transform: scale(1); } }
        .mob-icon-btn:active { animation: iconBounce 0.35s ease forwards; }
        .mob-icon-btn:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08), 0 8px 32px rgba(28,78,216,0.06), inset 0 1px 0 rgba(255,255,255,0.95); }

        /* ── Premium Hamburger bars ── */
        .hamburger-bars { width: 20px; height: 14px; position: relative; display: flex; flex-direction: column; justify-content: space-between; z-index: 1; }
        .hamburger-bars span {
          display: block; height: 2px; background: #334155; border-radius: 3px !important;
          transition: transform 0.35s cubic-bezier(0.68,-0.6,0.32,1.6), opacity 0.25s ease, width 0.3s cubic-bezier(0.25,0.8,0.25,1), background 0.3s ease;
          transform-origin: center;
        }
        .hamburger-bars span:nth-child(1) { width: 100%; height: 2.2px; }
        .hamburger-bars span:nth-child(2) { width: 14px; height: 1.8px; transition-delay: 0.05s; }
        .hamburger-bars span:nth-child(3) { width: 18px; height: 2px; transition-delay: 0.1s; }
        .mob-icon-btn:hover .hamburger-bars span { width: 100% !important; }
        .mob-icon-btn.is-active .hamburger-bars span:nth-child(1) { transform: translateY(6px) rotate(45deg); width: 100%; background: #1c4ed8; }
        .mob-icon-btn.is-active .hamburger-bars span:nth-child(2) { opacity: 0; width: 0; transform: translateX(8px); }
        .mob-icon-btn.is-active .hamburger-bars span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); width: 100%; background: #1c4ed8; }
        .mob-icon-btn.is-active { background: linear-gradient(145deg, rgba(241,245,249,0.95), rgba(226,232,240,0.85)); box-shadow: 0 2px 12px rgba(28,78,216,0.08), inset 0 1px 0 rgba(255,255,255,0.9); }

        /* ── Premium Search icon SVG ── */
        .search-icon-svg {
          width: 20px; height: 20px; stroke: #334155; stroke-width: 1.8;
          stroke-linecap: round; stroke-linejoin: round; fill: none;
          transition: stroke 0.25s ease, filter 0.25s ease, transform 0.25s ease;
          filter: drop-shadow(0 1px 1px rgba(0,0,0,0.06)); z-index: 1; position: relative;
        }
        .mob-icon-btn:active .search-icon-svg { stroke: #1c4ed8; transform: scale(1.08); filter: drop-shadow(0 0 4px rgba(28,78,216,0.25)); }
        .mob-icon-btn:hover .search-icon-svg { stroke: #475569; }

        /* ── Mobile menu ── */
        .mobile-overlay { position: fixed; top: 64px; left: 0; right: 0; bottom: 0; background-color: rgba(15,23,42,0.4); z-index: 40; opacity: 0; visibility: hidden; transition: opacity 0.4s ease, visibility 0.4s ease; }
        .mobile-overlay.is-open { opacity: 1; visibility: visible; }
        .mobile-drawer {
          position: absolute; top: 100%; left: 0; width: 100%; max-height: calc(100vh - 64px);
          transform: translateX(-100%); opacity: 0; visibility: hidden;
          transition: transform 0.4s cubic-bezier(0.25,0.8,0.25,1), opacity 0.4s ease, visibility 0.4s ease;
          will-change: transform, opacity;
        }
        .mobile-drawer.is-open { transform: translateX(0); opacity: 1; visibility: visible; }

        /* ── Accordion panels ── */
        .mob-panel { display: grid; grid-template-rows: 0fr; opacity: 0; visibility: hidden; transition: grid-template-rows 0.35s cubic-bezier(0.25,0.8,0.25,1), opacity 0.35s ease, visibility 0.35s ease; }
        .mob-panel.is-open { grid-template-rows: 1fr; opacity: 1; visibility: visible; }
        .mob-panel-inner { overflow: hidden; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>

      {/* ═══════════ NAVIGATION BAR ═══════════ */}
      <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 transition-all duration-200 ease-in-out">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between px-6 py-4 h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-black tracking-tighter text-slate-900">
              <img alt="The Digital Diplomat Logo" className="w-auto object-contain h-12" src="/Logo.png" />
            </Link>
          </div>

          {/* ── Desktop Navigation ── */}
          <div className="hidden lg:flex items-center gap-1 h-full">
            {NAV_ITEMS.map((item, idx) => (
              <div key={idx} className={`${item.dropdown ? 'nav-item group' : ''} relative h-full flex items-center px-2`}>
                <Link
                  href={item.href}
                  className={`font-['Plus_Jakarta_Sans'] tracking-tight text-sm font-semibold transition-all flex items-center gap-0.5 ${
                    router.pathname === item.href ? 'text-blue-700 border-b-2 border-blue-700 pb-1' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                  {item.dropdown && <span className="material-symbols-outlined text-xs">expand_more</span>}
                </Link>
                {item.dropdown && (
                  <div className="nav-dropdown absolute top-full left-0 w-64 bg-white border border-slate-200 shadow-xl p-2 z-[60]">
                    {item.dropdown.map((sub, sidx) => (
                      <Link key={sidx} href={sub.href} className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100/50 hover:text-slate-900 transition-colors">
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Action Items ── */}
          <div className="flex items-center gap-4">
            {/* Desktop Search */}
            <div className="hidden xl:flex items-center bg-slate-100 px-4 py-1.5 border border-slate-200 relative">
              <span className="material-symbols-outlined text-slate-400 text-sm">search</span>
              <input className="bg-transparent border-none focus:ring-0 text-sm w-48" placeholder="Search news..." type="text" autoComplete="off" />
            </div>
            <button className="bg-primary text-white px-6 py-2 font-bold text-sm tracking-wide uppercase hover:opacity-90 transition-all scale-100 active:scale-[0.98]">
              Subscribe
            </button>

            {/* Premium Mobile Search Icon */}
            <button
              ref={searchBtnRef}
              className="lg:hidden mob-icon-btn ml-2"
              aria-label="Search"
              onPointerDown={(e) => handleRipple(e, searchBtnRef)}
              onClick={() => setSearchOpen(true)}
            >
              <svg className="search-icon-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="search-inner-glow">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="0.5" result="blur" />
                    <feOffset dx="0" dy="0.5" />
                    <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" />
                    <feFlood floodColor="rgba(0,0,0,0.08)" />
                    <feComposite operator="in" in2="blur" />
                    <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                <circle cx="10.5" cy="10.5" r="6.5" filter="url(#search-inner-glow)" />
                <line x1="15.5" y1="15.5" x2="20" y2="20" />
              </svg>
            </button>

            {/* Premium Animated Hamburger */}
            <button
              ref={menuBtnRef}
              className={`lg:hidden mob-icon-btn ml-1 ${mobileMenuOpen ? 'is-active' : ''}`}
              aria-label="Menu"
              onPointerDown={(e) => handleRipple(e, menuBtnRef)}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <div className="hamburger-bars">
                <span></span><span></span><span></span>
              </div>
            </button>
          </div>
        </div>

        {/* ── Mobile Menu Overlay ── */}
        <div className={`lg:hidden mobile-overlay ${mobileMenuOpen ? 'is-open' : ''}`} onClick={closeMobileMenu} />

        {/* ── Mobile Navigation Drawer ── */}
        <div className={`lg:hidden mobile-drawer bg-white border-t border-slate-200 w-full overflow-y-auto shadow-2xl z-50 ${mobileMenuOpen ? 'is-open' : ''}`}>
          <div className="p-4 space-y-0">
            {/* Live Updates */}
            <div className="border-b border-slate-100">
              <Link href="/live/h1b-visa-reform-2025" className="flex items-center gap-2 py-3 px-2 font-['Plus_Jakarta_Sans'] font-semibold text-slate-900 text-base" onClick={closeMobileMenu}>
                <span className="w-2 h-2 bg-red-600 inline-block" style={{ animation: 'livePulse 1.5s ease-in-out infinite' }}></span> Live Updates
              </Link>
            </div>
            {/* Home */}
            <div className="border-b border-slate-100">
              <Link href="/" className="block py-3 px-2 font-['Plus_Jakarta_Sans'] font-semibold text-slate-900 text-base" onClick={closeMobileMenu}>Home</Link>
            </div>

            {/* Accordion Nav Items */}
            {NAV_ITEMS.filter(item => item.dropdown && item.label !== 'Home').map((item, idx) => (
              <div key={idx} className="border-b border-slate-100">
                <button
                  className="w-full text-left py-3 px-2 font-['Plus_Jakarta_Sans'] font-semibold text-slate-900 text-base flex justify-between items-center"
                  onClick={() => toggleAccordion(idx)}
                >
                  {item.label}
                  <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${expandedAccordion === idx ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
                <div className={`mob-panel pl-4 border-l-2 border-primary ml-4 ${expandedAccordion === idx ? 'is-open' : ''}`}>
                  <div className="mob-panel-inner pb-3 space-y-0">
                    {item.dropdown.map((sub, sidx) => (
                      <Link key={sidx} href={sub.href} className="block py-2.5 px-3 text-sm text-slate-600 hover:bg-slate-50" onClick={closeMobileMenu}>
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Subscribe CTA */}
            <div className="pt-4">
              <button className="w-full bg-primary text-white py-3 px-4 font-bold text-sm tracking-wide uppercase hover:opacity-90 transition-all">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Search Overlay ── */}
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
