import { Startup, YC_STARTUPS } from '@/data/startups';

export interface SearchResult {
  matches: Startup[];
  matchedCategoryLabel?: string;
}

export function searchStartups(rawQuery: string): SearchResult {
  const query = rawQuery.trim().toLowerCase();
  if (!query) {
    return { matches: [] };
  }

  // 1. Color matching (e.g. "show me startups with a red logo")
  const colorKeywords: Array<'red' | 'blue' | 'green' | 'yellow' | 'black' | 'purple' | 'orange' | 'white'> = [
    'red', 'blue', 'green', 'yellow', 'black', 'purple', 'orange', 'white'
  ];
  for (const color of colorKeywords) {
    if (query.includes(`${color} logo`) || query.includes(`with a ${color}`) || query.includes(`${color} startups`) || query === color) {
      const matches = YC_STARTUPS.filter(s => s.dominantColor === color);
      return { matches, matchedCategoryLabel: `Startups with a ${color} logo` };
    }
  }

  // 2. Symbol / Animal matching (e.g. "show me startups with a dog logo")
  const symbolKeywords = ['dog', 'cat', 'alien', 'rocket', 'shield', 'whale', 'carrot', 'box', 'wolf', 'wheel', 'llama'];
  for (const sym of symbolKeywords) {
    if (query.includes(`${sym} logo`) || query.includes(`with a ${sym}`) || query.includes(sym)) {
      const matches = YC_STARTUPS.filter(s => s.symbols.includes(sym));
      if (matches.length > 0) {
        return { matches, matchedCategoryLabel: `Startups with a ${sym} logo` };
      }
    }
  }

  // 3. Batch / Time queries: "first startups in yc", "newest startups in yc", "summer 2024"
  if (query.includes('first startup') || query.includes('earliest') || query.includes('w05') || query.includes('s05') || query.includes('2005')) {
    const matches = YC_STARTUPS.filter(s => s.categories.includes('first') || s.year <= 2007);
    return { matches, matchedCategoryLabel: 'First Startups in YC' };
  }

  if (query.includes('newest') || query.includes('latest') || query.includes('recent') || query.includes('s24') || query.includes('summer 2024')) {
    // If combined with another keyword (like inventory management)
    if (query.includes('inventory')) {
      const matches = YC_STARTUPS.filter(s => s.batch === 'S24' && s.categories.includes('inventory management'));
      return { matches, matchedCategoryLabel: 'Inventory Management Startups in S24 Batch' };
    }
    const matches = YC_STARTUPS.filter(s => s.batch === 'S24' || s.year === 2024);
    return { matches, matchedCategoryLabel: 'Newest Startups in YC (Summer 2024)' };
  }

  // 4. Inventory Management queries
  if (query.includes('inventory') || query.includes('warehouse') || query.includes('supply chain')) {
    const matches = YC_STARTUPS.filter(s => s.categories.includes('inventory management'));
    return { matches, matchedCategoryLabel: 'Inventory Management Startups' };
  }

  // 5. Food Delivery queries with location filtering: "food delivery software in usa", "food delivery software in asia"
  if (query.includes('food delivery') || query.includes('grocery') || query.includes('meal')) {
    if (query.includes('asia') || query.includes('india')) {
      const matches = YC_STARTUPS.filter(s => s.categories.includes('food delivery') && s.region === 'Asia');
      return { matches, matchedCategoryLabel: 'Food Delivery Software in Asia' };
    }
    if (query.includes('usa') || query.includes('us') || query.includes('america')) {
      const matches = YC_STARTUPS.filter(s => s.categories.includes('food delivery') && s.region === 'USA');
      return { matches, matchedCategoryLabel: 'Food Delivery Software in USA' };
    }
    const matches = YC_STARTUPS.filter(s => s.categories.includes('food delivery'));
    return { matches, matchedCategoryLabel: 'Food Delivery Startups' };
  }

  // 6. Space Tech
  if (query.includes('space') || query.includes('satellite') || query.includes('orbital') || query.includes('rocket')) {
    const matches = YC_STARTUPS.filter(s => s.categories.includes('space tech'));
    return { matches, matchedCategoryLabel: 'Startups in Space Tech' };
  }

  // 7. AI Testing Niche
  if (query.includes('ai testing') || (query.includes('testing') && query.includes('ai')) || query.includes('qa')) {
    const matches = YC_STARTUPS.filter(s => s.categories.includes('ai testing'));
    return { matches, matchedCategoryLabel: 'Startups in AI Testing Niche' };
  }

  // 8. AI Coding Agents in Cloud Niche
  if (query.includes('coding agent') || query.includes('ai coding') || query.includes('developer agent') || query.includes('cloud niche')) {
    const matches = YC_STARTUPS.filter(s => s.categories.includes('ai coding agents'));
    return { matches, matchedCategoryLabel: 'Startups in AI Coding Agents in the Cloud Niche' };
  }

  // 9. Generic search by name, description, tags
  const matches = YC_STARTUPS.filter(s => {
    return (
      s.name.toLowerCase().includes(query) ||
      s.description.toLowerCase().includes(query) ||
      s.batch.toLowerCase().includes(query) ||
      s.categories.some(c => c.toLowerCase().includes(query)) ||
      s.symbols.some(sym => sym.toLowerCase().includes(query))
    );
  });

  return {
    matches,
    matchedCategoryLabel: matches.length > 0 ? `Results for "${rawQuery}"` : undefined
  };
}
