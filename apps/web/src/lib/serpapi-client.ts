/**
 * SERPAPI Client
 *
 * Fetches news articles from SERPAPI for stock symbols
 */

export interface SerpApiNewsArticle {
  title: string;
  link: string;
  snippet: string;
  source: string;
  date: string;
}

interface SerpApiResponse {
  news_results?: Array<{
    title?: string;
    link?: string;
    snippet?: string;
    source?: string;
    date?: string;
    thumbnail?: string;
  }>;
  error?: string;
}

/**
 * Fetches news articles from SERPAPI for a given stock symbol
 *
 * @param symbol - Stock symbol (e.g., "AAPL")
 * @param days - Number of days to look back (default: 7)
 * @param maxArticles - Maximum number of articles to fetch (default: 20)
 * @returns Array of news articles
 * @throws Error if API key is missing or API call fails
 */
export async function fetchNewsFromSerpApi(
  symbol: string,
  days: number = 7,
  maxArticles: number = 20
): Promise<SerpApiNewsArticle[]> {
  // Validate API key
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    throw new Error('SERPAPI_API_KEY is not configured');
  }

  // Build query parameters
  const query = `${symbol} stock news`;
  const params = new URLSearchParams({
    q: query,
    tbm: 'nws', // News search
    tbs: 'qdr:w', // Past week (SERPAPI doesn't support exact day ranges)
    num: maxArticles.toString(),
    api_key: apiKey,
  });

  const url = `https://serpapi.com/search?${params.toString()}`;

  try {
    const response = await fetch(url);

    // Handle rate limiting
    if (response.status === 429) {
      throw new Error('SERPAPI rate limit exceeded. Please try again later.');
    }

    // Handle other HTTP errors
    if (!response.ok) {
      throw new Error(
        `SERPAPI API error: ${response.status} - ${response.statusText}`
      );
    }

    const data: SerpApiResponse = await response.json();

    // Handle malformed response
    if (!data.news_results) {
      console.warn('SERPAPI returned no news_results field', data);
      return [];
    }

    // Parse and validate news articles
    const articles: SerpApiNewsArticle[] = data.news_results
      .filter(
        (article) =>
          article.title &&
          article.link &&
          article.snippet &&
          article.source &&
          article.date
      )
      .map((article) => ({
        title: article.title!,
        link: article.link!,
        snippet: article.snippet!,
        source: article.source!,
        date: article.date!,
      }));

    return articles;
  } catch (error) {
    // Handle network errors
    if (error instanceof Error) {
      if (error.message.includes('SERPAPI')) {
        // Re-throw SERPAPI-specific errors
        throw error;
      }
      // Wrap other errors
      throw new Error(`Failed to fetch news from SERPAPI: ${error.message}`);
    }
    throw new Error('Failed to fetch news from SERPAPI: Unknown error');
  }
}
