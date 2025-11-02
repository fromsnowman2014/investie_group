/**
 * Manual Test Script for News Analysis API
 *
 * This script tests the SERPAPI and Claude integration
 * Run with: npx ts-node test-news-api.ts
 */

import { fetchNewsFromSerpApi } from './src/lib/serpapi-client';
import { summarizeNewsWithClaude } from './src/lib/claude-news-summarizer';

async function testNewsAnalysis() {
  console.log('🧪 Testing News Analysis API Integration\n');

  try {
    // Step 1: Test SERPAPI
    console.log('📰 Step 1: Fetching news from SERPAPI...');
    const articles = await fetchNewsFromSerpApi('AAPL', 7, 20);
    console.log(`✅ Fetched ${articles.length} articles for AAPL`);

    if (articles.length > 0) {
      console.log('\nSample article:');
      console.log(`  Title: ${articles[0].title}`);
      console.log(`  Source: ${articles[0].source}`);
      console.log(`  Date: ${articles[0].date}`);
      console.log(`  Snippet: ${articles[0].snippet.substring(0, 100)}...`);
    }

    // Step 2: Test Claude Summarization
    console.log('\n🤖 Step 2: Generating AI summary with Claude...');
    const summary = await summarizeNewsWithClaude('AAPL', articles);
    console.log('✅ Summary generated successfully\n');

    console.log('📊 Summary Results:');
    console.log(`  Sentiment: ${summary.overallSentiment} (${summary.sentimentScore}/100)`);
    console.log(`  Key Points (${summary.keyPoints.length}):`);
    summary.keyPoints.forEach((point, i) => {
      console.log(`    ${i + 1}. ${point}`);
    });
    console.log(`\n  Trending Topics: ${summary.trendingTopics.join(', ')}`);
    console.log(`\n  Market Impact: ${summary.marketImpact}`);

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testNewsAnalysis();
