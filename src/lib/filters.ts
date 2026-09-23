import { Startup, YC_STARTUPS } from '@/data/startups';

/** Structured intent extracted from a natural-language query. Every field is optional. */
export interface SearchFilters {
  color?: Startup['dominantColor'];
  symbol?: string;
  batch?: string;
  region?: Startup['region'];
  category?: string;
  era?: 'first' | 'newest';
}

const unique = (values: string[]) => [...new Set(values)].sort();

// Vocabulary is derived from the dataset so the model can only pick values that exist.
export const FILTER_VOCAB = {
  colors: unique(YC_STARTUPS.map((s) => s.dominantColor)),
  symbols: unique(YC_STARTUPS.flatMap((s) => s.symbols)),
  batches: unique(YC_STARTUPS.map((s) => s.batch)),
  regions: unique(YC_STARTUPS.map((s) => s.region)),
  // 'first' / 'newest' are era markers, handled by the `era` filter instead.
  categories: unique(YC_STARTUPS.flatMap((s) => s.categories)).filter((c) => c !== 'first' && c !== 'newest'),
};

const NEWEST_YEAR = Math.max(...YC_STARTUPS.map((s) => s.year));

export function hasFilters(filters: SearchFilters): boolean {
  return Object.values(filters).some((v) => v !== undefined);
}

export function applyFilters(filters: SearchFilters, startups: Startup[] = YC_STARTUPS): Startup[] {
  return startups.filter(
    (s) =>
      (!filters.color || s.dominantColor === filters.color) &&
      (!filters.symbol || s.symbols.includes(filters.symbol)) &&
      (!filters.batch || s.batch === filters.batch) &&
      (!filters.region || s.region === filters.region) &&
      (!filters.category || s.categories.includes(filters.category)) &&
      (!filters.era ||
        (filters.era === 'first'
          ? s.categories.includes('first') || s.year <= 2007
          : s.categories.includes('newest') || s.year === NEWEST_YEAR))
  );
}

export function describeFilters(filters: SearchFilters): string {
  const parts: string[] = [];
  if (filters.era) parts.push(filters.era === 'first' ? 'First' : 'Newest');
  parts.push(filters.category ? `${filters.category} startups` : 'Startups');
  if (filters.batch) parts.push(`in ${filters.batch}`);
  if (filters.region) parts.push(`in ${filters.region}`);
  const logo = [filters.color, filters.symbol].filter(Boolean).join(' ');
  if (logo) parts.push(`with a ${logo} logo`);
  const label = parts.join(' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Response body of POST /api/search. */
export interface SearchApiResponse {
  matchIds: string[];
  categoryLabel?: string;
  source: 'ai' | 'local';
}
