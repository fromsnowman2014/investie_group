'use client';

import React, { useState } from 'react';
import { AIOpinionCard } from '../components/AIOpinion/AIOpinionCard';

export default function TestAIOpinion() {
  const [symbol, setSymbol] = useState('AAPL');
  const [testSymbol, setTestSymbol] = useState('AAPL');

  const handleTest = () => {
    setTestSymbol(symbol);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          AI Investment Opinion Test
        </h1>
        
        {/* Test Controls */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="flex gap-4 items-end">
            <div>
              <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-2">
                Stock Symbol
              </label>
              <input
                id="symbol"
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="border border-gray-300 rounded-md px-3 py-2 w-32 text-center font-mono"
                placeholder="AAPL"
              />
            </div>
            <button
              onClick={handleTest}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Test AI Opinion
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Try symbols like: AAPL, TSLA, MSFT, GOOGL, AMZN, NVDA, META
          </p>
        </div>

        {/* AI Opinion Component */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">AI Opinion Result</h2>
          <AIOpinionCard symbol={testSymbol} />
        </div>

        {/* API Information */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            🔧 Implementation Details
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• <strong>API Endpoint:</strong> /api/v1/ai-opinion</li>
            <li>• <strong>Method:</strong> POST with symbol in body</li>
            <li>• <strong>Caching:</strong> 30-minute server-side cache</li>
            <li>• <strong>AI Model:</strong> Google Gemini Pro</li>
            <li>• <strong>Response Time:</strong> ~3-5 seconds (first call), instant (cached)</li>
          </ul>
        </div>

        {/* Environment Check */}
        <div className="mt-6 bg-yellow-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">
            ⚙️ Environment Status
          </h3>
          <div className="text-sm text-yellow-800">
            <p>Google AI API Key: {process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY ? '✅ Configured' : '❌ Not Found'}</p>
            <p className="text-xs mt-2 text-yellow-600">
              Note: API key is checked server-side for security
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
