'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const prevPathRef = useRef(pathname);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Saat pathname berubah → navigasi selesai, sembunyikan bar
  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname;
      // Beri sedikit delay supaya bar sempat terlihat sebelum hilang
      timerRef.current = setTimeout(() => setVisible(false), 200);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  // Intercept klik pada <a> internal → tampilkan bar
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Hanya internal link (tidak mengandung protocol, atau same origin)
      const isInternal =
        href.startsWith('/') ||
        href.startsWith(window.location.origin);

      // Abaikan anchor link dan link yang sudah aktif
      const isSamePage =
        href === pathname ||
        href === window.location.pathname ||
        href.startsWith('#');

      if (isInternal && !isSamePage && !anchor.hasAttribute('target')) {
        setVisible(true);
      }
    };

    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[9999] h-[2px] overflow-hidden"
    >
      <div className="h-full bg-emerald-500 animate-[nav-progress_1.2s_ease-in-out_infinite]" />
    </div>
  );
}
