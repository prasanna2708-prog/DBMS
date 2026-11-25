import { useState } from 'react';
import { Utensils } from 'lucide-react';

interface RecipeImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function RecipeImage({ src, alt, className = '' }: RecipeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#EFEFED] text-[#52525B] p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Utensils className="w-7 h-7 mb-2 text-[#166534]" aria-hidden="true" />
        <span className="text-xs font-medium text-[#3F3F46] line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
