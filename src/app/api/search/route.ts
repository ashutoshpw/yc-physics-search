import { NextResponse } from 'next/server';
import { searchStartups } from '@/lib/search';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ matches: [], categoryLabel: '' });
    }

    // Default fast local heuristic search
    const localResult = searchStartups(query);

    // If OPENAI_API_KEY is configured in .env.local, optionally enhance with LLM reasoning
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content:
                  'You parse natural language search queries for a YC startup directory. Extract relevant keywords, colors (red, blue, green, yellow, black, purple, orange), symbols (dog, cat, alien, rocket, etc.), batch (e.g. S24, W05), and region (USA, Asia, Europe). Return JSON: {"color": string|null, "symbol": string|null, "batch": string|null, "region": string|null, "keyword": string|null, "label": string}',
              },
              { role: 'user', content: query },
            ],
            response_format: { type: 'json_object' },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const parsed = JSON.parse(data.choices[0].message.content);
          // If the LLM extracted a more refined intent, combine or use it
          return NextResponse.json({
            matches: localResult.matches,
            categoryLabel: parsed.label || localResult.matchedCategoryLabel,
          });
        }
      } catch (llmErr) {
        console.error('LLM query parsing fallback to local:', llmErr);
      }
    }

    return NextResponse.json({
      matches: localResult.matches,
      categoryLabel: localResult.matchedCategoryLabel,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
