import { useEffect, useRef } from 'react';

export function ScrollReveal({ as: Element = 'div', className = '', delay = 0, children, style, ...props }) {
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) return undefined;

    if (
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      element.classList.add('is-visible');
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -32px 0px',
    });

    element.classList.add('is-pending');
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <Element
      {...props}
      ref={elementRef}
      className={`scroll-reveal ${className}`.trim()}
      style={{ '--reveal-delay': `${delay}ms`, ...style }}
    >
      {children}
    </Element>
  );
}