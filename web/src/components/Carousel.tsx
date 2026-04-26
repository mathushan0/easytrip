import React, { useState, useCallback } from 'react';
import clsx from 'clsx';

/**
 * Carousel Component
 * Image carousel with Prev/Next buttons and dots navigation
 */

export interface CarouselProps {
  images: Array<{ url: string; alt?: string }>;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

const Carousel: React.FC<CarouselProps> = ({
  images,
  autoPlay = false,
  autoPlayInterval = 5000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  }, [images.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  React.useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, goToNext]);

  if (!images || images.length === 0) {
    return (
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-lg aspect-video flex items-center justify-center">
        <span className="text-gray-500 dark:text-gray-400">No images</span>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-lg overflow-hidden">
      {/* Carousel container */}
      <div className="relative aspect-video bg-black">
        {/* Images */}
        {images.map((image, index) => (
          <img
            key={index}
            src={image.url}
            alt={image.alt || `Slide ${index + 1}`}
            className={clsx(
              'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
              index === currentIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
          />
        ))}

        {/* Previous button */}
        {images.length > 1 && (
          <button
            onClick={goToPrevious}
            className={clsx(
              'absolute left-4 top-1/2 -translate-y-1/2',
              'z-10',
              'bg-black bg-opacity-50 hover:bg-opacity-75',
              'text-white',
              'w-10 h-10 flex items-center justify-center',
              'rounded-full',
              'transition-colors',
              'tap-target'
            )}
            aria-label="Previous slide"
          >
            ‹
          </button>
        )}

        {/* Next button */}
        {images.length > 1 && (
          <button
            onClick={goToNext}
            className={clsx(
              'absolute right-4 top-1/2 -translate-y-1/2',
              'z-10',
              'bg-black bg-opacity-50 hover:bg-opacity-75',
              'text-white',
              'w-10 h-10 flex items-center justify-center',
              'rounded-full',
              'transition-colors',
              'tap-target'
            )}
            aria-label="Next slide"
          >
            ›
          </button>
        )}

        {/* Slide counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm font-semibold">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Dots navigation */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-2 p-4">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={clsx(
                'w-2 h-2 rounded-full transition-all',
                index === currentIndex
                  ? 'bg-blue-500 w-6'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Carousel;
