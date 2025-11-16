import { useState, useEffect, useRef } from 'react';

export const useImageOptimization = (src: string) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.src = src;
    img.onload = () => setLoaded(true);

    // Intersection Observer for lazy loading
    if ('IntersectionObserver' in window && imgRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const target = entry.target as HTMLImageElement;
              if (target.dataset.src) {
                target.src = target.dataset.src;
                observer.unobserve(target);
              }
            }
          });
        },
        { rootMargin: '50px' }
      );

      observer.observe(imgRef.current);

      return () => observer.disconnect();
    }
  }, [src]);

  return { loaded, imgRef };
};
