'use client';

import Image from 'next/image';
import { Cast, Crew } from '@/types/movie';
import { getImageUrl } from '@/lib/tmdb';
import { cn } from '@/lib/utils';

/**
 * Cast Card Component
 * Displays actor image, name, and character
 */

interface CastCardProps {
  cast: Cast;
  className?: string;
}

export function CastCard({ cast, className }: CastCardProps) {
  return (
    <div className={cn('flex flex-col items-center text-center group', className)}>
      <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden mb-3 ring-2 ring-dark-600 group-hover:ring-primary-500 transition-all duration-300">
        <Image
          src={getImageUrl(cast.profile_path, 'w185')}
          alt={cast.name}
          fill
          className="object-cover"
          sizes="112px"
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTEyIiBoZWlnaHQ9IjExMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWYyOTM3Ii8+PC9zdmc+"
        />
        {!cast.profile_path && (
          <div className="absolute inset-0 bg-dark-700 flex items-center justify-center">
            <span className="text-3xl text-gray-500">
              {cast.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <h4 className="font-medium text-white text-sm line-clamp-1">{cast.name}</h4>
      <p className="text-xs text-gray-400 line-clamp-1">{cast.character}</p>
    </div>
  );
}

/**
 * Cast Section with horizontal scroll
 */
interface CastSectionProps {
  cast: Cast[];
  title?: string;
  className?: string;
}

export function CastSection({ cast, title = 'Cast', className }: CastSectionProps) {
  if (cast.length === 0) return null;

  return (
    <section className={cn('py-6', className)}>
      <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
        {cast.slice(0, 12).map((member) => (
          <CastCard key={member.id} cast={member} />
        ))}
      </div>
    </section>
  );
}

/**
 * Crew Card Component
 */
interface CrewCardProps {
  crew: Crew;
  className?: string;
}

export function CrewCard({ crew, className }: CrewCardProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative w-12 h-12 rounded-full overflow-hidden ring-1 ring-dark-600">
        <Image
          src={getImageUrl(crew.profile_path, 'w185')}
          alt={crew.name}
          fill
          className="object-cover"
          sizes="48px"
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzFmMjkzNyIvPjwvc3ZnPg=="
        />
        {!crew.profile_path && (
          <div className="absolute inset-0 bg-dark-700 flex items-center justify-center">
            <span className="text-lg text-gray-500">
              {crew.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div>
        <h4 className="font-medium text-white text-sm">{crew.name}</h4>
        <p className="text-xs text-gray-400">{crew.job}</p>
      </div>
    </div>
  );
}

/**
 * Director and key crew section
 */
interface CrewSectionProps {
  crew: Crew[];
  className?: string;
}

export function CrewSection({ crew, className }: CrewSectionProps) {
  // Filter key crew members
  const director = crew.find((c) => c.job === 'Director');
  const writers = crew.filter((c) => c.department === 'Writing').slice(0, 2);
  const producers = crew.filter((c) => c.job === 'Producer').slice(0, 2);

  const keyCrew = [
    director,
    ...writers,
    ...producers,
  ].filter(Boolean) as Crew[];

  if (keyCrew.length === 0) return null;

  return (
    <section className={cn('py-6', className)}>
      <h3 className="text-xl font-bold text-white mb-4">Crew</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {keyCrew.map((member) => (
          <CrewCard key={`${member.id}-${member.job}`} crew={member} />
        ))}
      </div>
    </section>
  );
}
