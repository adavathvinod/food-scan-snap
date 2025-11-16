import { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useImageOptimization } from '@/hooks/useImageOptimization';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
}

const OptimizedImage = memo(({ src, alt, className = '' }: OptimizedImageProps) => {
  const { loaded, imgRef } = useImageOptimization(src);

  return (
    <>
      {!loaded && <Skeleton className={className} />}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`${className} ${!loaded ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`}
        loading="lazy"
        decoding="async"
      />
    </>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
