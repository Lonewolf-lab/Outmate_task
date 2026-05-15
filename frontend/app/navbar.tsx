"use client";

import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ArrowUpRight } from 'lucide-react';

const cardNavCSS =
  '.card-nav-container { position: fixed; top: 16px; left: 50%; transform: translateX(-50%); width: 90%; max-width: 820px; z-index: 50; box-sizing: border-box; }' +
  '.card-nav { display: block; height: 60px; overflow: hidden; padding: 0; background: rgba(62,37,34,0.96); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(211,163,118,0.25); border-radius: 0.85rem; box-shadow: 0 1px 0 rgba(211,163,118,0.08), 0 8px 32px rgba(62,37,34,0.25); position: relative; will-change: height; }' +
  '.card-nav-content { position: absolute; left: 0; right: 0; top: 60px; bottom: 0; padding: 0.5rem; display: flex; align-items: flex-end; gap: 10px; z-index: 1; }' +
  '.card-nav.open .card-nav-content { visibility: visible; pointer-events: auto; }' +
  '.nav-card { height: 100%; flex: 1 1 0; min-width: 0; border-radius: calc(0.85rem - 0.25rem); position: relative; display: flex; flex-direction: column; padding: 14px 18px; gap: 8px; user-select: none; border: 1px solid rgba(211,163,118,0.2); transition: border-color 0.2s ease; }' +
  '.nav-card:hover { border-color: rgba(211,163,118,0.5); }' +
  '.nav-card-label { font-weight: 500; font-size: 20px; letter-spacing: -0.3px; color: #FFF2DF; }' +
  '.nav-card-links { margin-top: auto; display: flex; flex-direction: column; gap: 2px; }' +
  '.nav-card-link { font-size: 14px; cursor: pointer; text-decoration: none; transition: opacity 0.25s ease, color 0.2s ease; display: inline-flex; align-items: center; gap: 5px; font-family: var(--font-geist-mono); color: #D3A376; }' +
  '.nav-card-link:hover { opacity: 0.7; }' +
  '@media (max-width: 768px) {' +
  '.card-nav-container { width: 92%; top: 1em; }' +
  '.card-nav-content { flex-direction: column; align-items: stretch; gap: 8px; padding: 0.5rem; bottom: 0; justify-content: flex-start; }' +
  '.nav-card { height: auto; min-height: 60px; flex: 1 1 auto; }' +
  '.nav-card-label { font-size: 17px; }' +
  '.nav-card-link { font-size: 13px; }' +
  '}';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const navRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const baseColor = 'transparent';
  const menuColor = '#D3A376';

  const items = [
    {
      label: "GTM Intelligence",
      bgColor: "rgba(255,248,239,0.08)",
      textColor: "#FFF2DF",
      links: [
        { label: "Run Analysis", href: "/gtm" },
        { label: "Strategy", href: "/gtm" }
      ]
    },
    {
      label: "Social Intent",
      bgColor: "rgba(255,248,239,0.06)",
      textColor: "#FFF2DF",
      links: [
        { label: "Search Leads", href: "/social-intent" },
        { label: "Intent Signals", href: "/social-intent" }
      ]
    },
    {
      label: "Voice Agent",
      bgColor: "rgba(255,248,239,0.04)",
      textColor: "#FFF2DF",
      links: [
        { label: "Start Call", href: "/voice" },
        { label: "Call History", href: "/voice" }
      ]
    },
  ];

  // Inject CSS — always remove stale tag first so HMR picks up changes
  useEffect(() => {
    const existing = document.getElementById('card-nav-styles');
    if (existing) existing.remove();
    const style = document.createElement('style');
    style.id = 'card-nav-styles';
    style.textContent = cardNavCSS;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById('card-nav-styles');
      if (el) el.remove();
    };
  }, []);

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return;

    gsap.set(navEl, { height: 60, overflow: 'hidden' });

    const contentEl = navEl.querySelector('.card-nav-content') as HTMLElement | null;
    const cards = cardsRef.current.filter(Boolean);

    const expandedHeight = window.innerWidth < 768 ? 360 : 200;

    const tl = gsap.timeline({ paused: true });

    tl.to(navEl, {
      height: expandedHeight,
      duration: 0.45,
      ease: 'power3.out',
      onStart: () => {
        if (contentEl) {
          contentEl.style.visibility = 'visible';
          contentEl.style.pointerEvents = 'auto';
        }
      },
      onReverseComplete: () => {
        if (contentEl) {
          contentEl.style.visibility = 'hidden';
          contentEl.style.pointerEvents = 'none';
        }
      }
    });

    if (cards.length > 0) {
      tl.fromTo(
        cards,
        { opacity: 0, y: 12, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.3, stagger: 0.06, ease: 'power2.out' },
        '-=0.2'
      );
    }

    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    if (tl) tlRef.current = tl;
  }, []);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;

    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play(0);
    } else {
      setIsHamburgerOpen(false);
      tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
      tl.reverse();
    }
  };

  const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
    if (el) cardsRef.current[i] = el;
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 pointer-events-none">
      <div className="card-nav-container pointer-events-auto">
        <nav
          ref={navRef}
          className={`card-nav ${isExpanded ? 'open' : ''}`}
          style={{ height: '60px', overflow: 'hidden' }}
          suppressHydrationWarning
        >
          {/* Top bar — fully inline styled */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.1rem', zIndex: 2 }}>

            {/* Hamburger */}
            <div
              onClick={toggleMenu}
              role="button"
              aria-label={isExpanded ? 'Close menu' : 'Open menu'}
              tabIndex={0}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '6px', padding: '4px' }}
            >
              <span style={{
                display: 'block', width: '22px', height: '2px',
                backgroundColor: menuColor, borderRadius: '2px',
                transition: 'transform 0.25s ease',
                transform: isHamburgerOpen ? 'translateY(4px) rotate(45deg)' : 'none',
              }} />
              <span style={{
                display: 'block', width: '22px', height: '2px',
                backgroundColor: menuColor, borderRadius: '2px',
                transition: 'transform 0.25s ease',
                transform: isHamburgerOpen ? 'translateY(-4px) rotate(-45deg)' : 'none',
              }} />
            </div>

            {/* Logo — centered */}
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
              <span style={{
                fontFamily: 'var(--font-geist-mono)',
                fontWeight: 600,
                fontSize: '1.1rem',
                color: '#FFF2DF',
                letterSpacing: '-0.02em',
                cursor: 'pointer',
                transition: 'color 200ms ease',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = '#D3A376')}
                onMouseLeave={e => (e.currentTarget.style.color = '#FFF2DF')}
                onClick={() => router.push('/gtm')}
              >
                OUTMATE
              </span>
            </div>

            {/* BETA badge */}
            <div>
              <span style={{
                fontFamily: 'var(--font-geist-mono)',
                fontSize: '10px',
                letterSpacing: '0.12em',
                fontWeight: 600,
                color: '#FFE0B2',
                border: '1px solid rgba(211,163,118,0.4)',
                borderRadius: '20px',
                padding: '3px 10px',
                background: 'transparent',
                textTransform: 'uppercase',
              }}>
                BETA
              </span>
            </div>
          </div>

          {/* Nav cards */}
          <div
            className="card-nav-content"
            aria-hidden={!isExpanded}
            style={{ visibility: isExpanded ? 'visible' : 'hidden', pointerEvents: isExpanded ? 'auto' : 'none' }}
          >
            {items.map((item, idx) => (
              <div
                key={`${item.label}-${idx}`}
                className="nav-card"
                ref={setCardRef(idx)}
                style={{ backgroundColor: item.bgColor, color: item.textColor, cursor: 'pointer' }}
                onClick={() => {
                  toggleMenu();
                  router.push(item.links[0].href);
                }}
              >
                <div className="nav-card-label" style={{ fontFamily: 'var(--font-geist-sans)', color: '#FFF2DF' }}>
                  {item.label}
                </div>
                <div className="nav-card-links">
                  {item.links?.map((lnk, i) => (
                    <Link
                      key={`${lnk.label}-${i}`}
                      className="nav-card-link"
                      href={lnk.href}
                      style={{ color: '#D3A376' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu();
                      }}
                    >
                      <ArrowUpRight className="nav-card-link-icon w-3.5 h-3.5" aria-hidden="true" />
                      {lnk.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
