// API Usage Dashboard - Professional debugging interface
// Real-time API key usage tracking and monitoring

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { apiTracker } from '../_shared/api-usage-tracker.ts'

interface DashboardRequest {
  action: string;
  provider?: string;
  format?: 'json' | 'html';
}

// Generate HTML dashboard for browser viewing
function generateDashboard(data: {
  today: any[],
  realtime: any[],
  rateLimited: string[]
}): string {
  const { today, realtime, rateLimited } = data;

  const todayTotal = today.reduce((sum, item) => sum + (item.total_requests || 0), 0);
  const successRate = today.length > 0
    ? Math.round((today.reduce((sum, item) => sum + (item.successful_requests || 0), 0) / todayTotal) * 100)
    : 0;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Usage Dashboard - Investie</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            color: white;
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 10px;
        }
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .card {
            background: white;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
        }
        .card h2 {
            color: #2d3748;
            font-size: 1.3rem;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .card-icon {
            width: 24px;
            height: 24px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
        }
        .overview-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 20px;
        }
        .stat-item {
            text-align: center;
            padding: 16px;
            background: #f7fafc;
            border-radius: 12px;
        }
        .stat-value {
            font-size: 2rem;
            font-weight: 700;
            color: #2d3748;
            display: block;
        }
        .stat-label {
            font-size: 0.9rem;
            color: #718096;
            margin-top: 4px;
        }
        .provider-list {
            list-style: none;
        }
        .provider-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .provider-item:last-child {
            border-bottom: none;
        }
        .provider-name {
            font-weight: 600;
            color: #2d3748;
        }
        .provider-stats {
            display: flex;
            gap: 16px;
            font-size: 0.9rem;
        }
        .status-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 6px;
        }
        .status-healthy { background: #48bb78; }
        .status-warning { background: #ed8936; }
        .status-error { background: #f56565; }
        .rate-limited {
            background: #fed7d7;
            color: #9b2c2c;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        .refresh-info {
            text-align: center;
            color: #718096;
            margin-top: 20px;
            font-size: 0.9rem;
        }
        .refresh-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 10px;
            transition: transform 0.2s;
        }
        .refresh-btn:hover {
            transform: translateY(-2px);
        }
        .table-container {
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
        }
        th, td {
            text-align: left;
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
        }
        th {
            background: #f7fafc;
            font-weight: 600;
            color: #4a5568;
        }
        .usage-bar {
            background: #e2e8f0;
            height: 6px;
            border-radius: 3px;
            overflow: hidden;
            margin-top: 4px;
        }
        .usage-fill {
            height: 100%;
            background: linear-gradient(90deg, #48bb78, #38a169);
            transition: width 0.3s;
        }
        .usage-fill.warning { background: linear-gradient(90deg, #ed8936, #dd6b20); }
        .usage-fill.danger { background: linear-gradient(90deg, #f56565, #e53e3e); }
    </style>
    <script>
        function refreshDashboard() {
            window.location.reload();
        }

        // Auto-refresh every 30 seconds
        setInterval(refreshDashboard, 30000);

        // Display last update time
        document.addEventListener('DOMContentLoaded', function() {
            const now = new Date();
            document.getElementById('lastUpdate').textContent = now.toLocaleTimeString();
        });
    </script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 API Usage Dashboard</h1>
            <p>Real-time monitoring of API key usage and rate limits</p>
        </div>

        <div class="stats-grid">
            <!-- Overview Card -->
            <div class="card">
                <h2>
                    <div class="card-icon" style="background: #667eea; color: white;">📊</div>
                    Today's Overview
                </h2>
                <div class="overview-stats">
                    <div class="stat-item">
                        <span class="stat-value">${todayTotal}</span>
                        <div class="stat-label">Total Requests</div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${successRate}%</span>
                        <div class="stat-label">Success Rate</div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${rateLimited.length}</span>
                        <div class="stat-label">Rate Limited</div>
                    </div>
                </div>
            </div>

            <!-- Provider Status Card -->
            <div class="card">
                <h2>
                    <div class="card-icon" style="background: #48bb78; color: white;">🌐</div>
                    Provider Status
                </h2>
                <ul class="provider-list">
                    ${realtime.map(provider => `
                        <li class="provider-item">
                            <div>
                                <span class="status-indicator status-${provider.health_status || 'healthy'}"></span>
                                <span class="provider-name">${provider.api_provider}</span>
                                ${rateLimited.includes(provider.api_provider) ?
                                    '<span class="rate-limited">RATE LIMITED</span>' : ''}
                            </div>
                            <div class="provider-stats">
                                <span>Today: ${provider.requests_today || 0}</span>
                                <span>Hour: ${provider.requests_this_hour || 0}</span>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>

        <!-- Detailed Usage Table -->
        <div class="card">
            <h2>
                <div class="card-icon" style="background: #ed8936; color: white;">📈</div>
                Detailed Usage Statistics
            </h2>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Provider</th>
                            <th>Total Requests</th>
                            <th>Success Rate</th>
                            <th>Avg Response Time</th>
                            <th>Usage %</th>
                            <th>Last Request</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${today.map(item => {
                          const usagePercent = item.usage_percentage || 0;
                          const usageClass = usagePercent > 80 ? 'danger' : usagePercent > 60 ? 'warning' : '';
                          const successRate = item.total_requests > 0
                            ? Math.round((item.successful_requests / item.total_requests) * 100)
                            : 0;

                          return `
                            <tr>
                                <td><strong>${item.api_provider}</strong></td>
                                <td>${item.total_requests || 0}</td>
                                <td>${successRate}%</td>
                                <td>${item.avg_response_time_ms ? Math.round(item.avg_response_time_ms) + 'ms' : 'N/A'}</td>
                                <td>
                                    ${usagePercent.toFixed(1)}%
                                    <div class="usage-bar">
                                        <div class="usage-fill ${usageClass}" style="width: ${Math.min(usagePercent, 100)}%"></div>
                                    </div>
                                </td>
                                <td>${item.last_request_at ? new Date(item.last_request_at).toLocaleTimeString() : 'Never'}</td>
                            </tr>
                          `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="refresh-info">
            <div>Last updated: <span id="lastUpdate"></span></div>
            <button class="refresh-btn" onclick="refreshDashboard()">🔄 Refresh Now</button>
        </div>
    </div>
</body>
</html>
  `;
}

// Main request handler
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'dashboard';
    const provider = url.searchParams.get('provider');
    const format = url.searchParams.get('format') as 'json' | 'html' || 'html';

    switch (action) {
      case 'dashboard':
      case 'summary': {
        const summary = await apiTracker.getUsageSummary();

        if (format === 'json') {
          return new Response(JSON.stringify(summary, null, 2), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        } else {
          const html = generateDashboard(summary);
          return new Response(html, {
            headers: {
              'Content-Type': 'text/html',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
      }

      case 'daily': {
        const stats = await apiTracker.getDailyUsageStats(provider);

        return new Response(JSON.stringify(stats, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      case 'realtime': {
        const realtime = await apiTracker.getRealtimeUsage();

        return new Response(JSON.stringify(realtime, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      case 'rate_limits': {
        const providers = ['alpha_vantage', 'yahoo_finance', 'fred', 'alternative_me'];
        const rateLimitStatus = {};

        for (const prov of providers) {
          rateLimitStatus[prov] = await apiTracker.isRateLimited(prov);
        }

        return new Response(JSON.stringify(rateLimitStatus, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      default:
        return new Response(JSON.stringify({
          error: 'Invalid action',
          available: ['dashboard', 'daily', 'realtime', 'rate_limits'],
          examples: [
            '?action=dashboard&format=html',
            '?action=daily&provider=alpha_vantage',
            '?action=realtime',
            '?action=rate_limits'
          ]
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
    }

  } catch (error) {
    console.error('Dashboard error:', error.message);

    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});
