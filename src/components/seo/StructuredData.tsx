/**
 * JSON-LD Structured Data Components
 * Provides rich snippets for Google Search results
 */

interface WebSiteSchemaProps {
  url: string;
  name: string;
  description: string;
}

export function WebSiteSchema({ url, name, description }: WebSiteSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface MovieSchemaProps {
  name: string;
  description: string;
  image?: string;
  datePublished?: string;
  director?: string;
  genre?: string[];
  rating?: number;
  ratingCount?: number;
  duration?: string;
  url: string;
}

export function MovieSchema({
  name,
  description,
  image,
  datePublished,
  director,
  genre,
  rating,
  ratingCount,
  duration,
  url,
}: MovieSchemaProps) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name,
    description,
    url,
  };

  if (image) schema.image = image;
  if (datePublished) schema.datePublished = datePublished;
  if (director) {
    schema.director = { '@type': 'Person', name: director };
  }
  if (genre && genre.length > 0) schema.genre = genre;
  if (duration) schema.duration = duration;
  if (rating && ratingCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.toFixed(1),
      bestRating: '10',
      ratingCount,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface TVSeriesSchemaProps {
  name: string;
  description: string;
  image?: string;
  datePublished?: string;
  genre?: string[];
  rating?: number;
  ratingCount?: number;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  url: string;
}

export function TVSeriesSchema({
  name,
  description,
  image,
  datePublished,
  genre,
  rating,
  ratingCount,
  numberOfSeasons,
  numberOfEpisodes,
  url,
}: TVSeriesSchemaProps) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name,
    description,
    url,
  };

  if (image) schema.image = image;
  if (datePublished) schema.datePublished = datePublished;
  if (genre && genre.length > 0) schema.genre = genre;
  if (numberOfSeasons) schema.numberOfSeasons = numberOfSeasons;
  if (numberOfEpisodes) schema.numberOfEpisodes = numberOfEpisodes;
  if (rating && ratingCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.toFixed(1),
      bestRating: '10',
      ratingCount,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BreadcrumbSchemaProps {
  items: { name: string; url: string }[];
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface FAQSchemaProps {
  questions: { question: string; answer: string }[];
}

export function FAQSchema({ questions }: FAQSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
