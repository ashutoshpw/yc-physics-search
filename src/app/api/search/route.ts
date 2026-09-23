import { NextResponse } from 'next/server';
import { choice, TypeSafeClient, type ChoiceResponse } from '@typesafe-ai/sdk';
import { searchStartups } from '@/lib/search';
import { applyFilters, describeFilters, FILTER_VOCAB, hasFilters, type SearchApiResponse, type SearchFilters } from '@/lib/filters';

// Below this confidence an extracted filter is ignored rather than risk a wrong match.
const MIN_CONFIDENCE = 0.5;
const NONE = 'none';

// Created lazily so a missing TYPESAFE_API_KEY only disables AI parsing instead of crashing the route.
let client: TypeSafeClient | null | undefined;
function getClient(): TypeSafeClient | null {
  if (client === undefined) {
    client = process.env.TYPESAFE_API_KEY ? new TypeSafeClient({ timeout: 5000, retry: { maxRetries: 1 } }) : null;
  }
  return client;
}

const options = (labels: string[]) =>
  Object.fromEntries([...labels, NONE].map((label) => [label, label === NONE ? 'Not mentioned in the query' : null]));

const QUESTIONS = {
  color: choice('Which dominant logo color does the query ask for?', options(FILTER_VOCAB.colors)),
  symbol: choice('Which logo symbol, animal, or object does the query ask for?', options(FILTER_VOCAB.symbols)),
  batch: choice(
    'Which YC batch does the query ask for? W = Winter, S = Summer, digits = year (e.g. "summer 2024" = S24).',
    options(FILTER_VOCAB.batches)
  ),
  region: choice('Which geographic region does the query restrict to?', options(FILTER_VOCAB.regions)),
  category: choice('Which industry or product category does the query ask for?', options(FILTER_VOCAB.categories)),
  era: choice('Does the query ask for the earliest or the most recent YC startups?', {
    first: 'The first / earliest / original YC startups',
    newest: 'The newest / latest / most recent YC startups',
    [NONE]: 'Neither',
  }),
};

function pick<T extends string>(answer: ChoiceResponse): T | undefined {
  return answer.choice !== NONE && answer.confidence >= MIN_CONFIDENCE ? (answer.choice as T) : undefined;
}

async function parseWithTypeSafe(ts: TypeSafeClient, query: string): Promise<SearchFilters> {
  const { answers } = await ts.systemOne({ state: { query }, questions: QUESTIONS });
  return {
    color: pick(answers.color),
    symbol: pick(answers.symbol),
    batch: pick(answers.batch),
    region: pick(answers.region),
    category: pick(answers.category),
    era: pick(answers.era),
  };
}

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json<SearchApiResponse>({ matchIds: [], source: 'local' });
    }

    const ts = getClient();
    if (ts) {
      try {
        const filters = await parseWithTypeSafe(ts, query);
        const matches = hasFilters(filters) ? applyFilters(filters) : [];
        if (matches.length > 0) {
          return NextResponse.json<SearchApiResponse>({
            matchIds: matches.map((s) => s.id),
            categoryLabel: describeFilters(filters),
            source: 'ai',
          });
        }
      } catch (aiErr) {
        console.error('TypeSafe query parsing failed; falling back to local search:', aiErr);
      }
    }

    const localResult = searchStartups(query);
    return NextResponse.json<SearchApiResponse>({
      matchIds: localResult.matches.map((s) => s.id),
      categoryLabel: localResult.matchedCategoryLabel,
      source: 'local',
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
