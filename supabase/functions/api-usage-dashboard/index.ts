// API Usage Dashboard - Professional debugging interface
// Real-time API key usage tracking and monitoring

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { apiTracker } from '../_shared/api-usage-tracker.ts'

interface DashboardRequest {
  action: string;
  provider?: string;
  format?: 'json' | 'html';
}

// Generate statistics table for different time periods
function generateStatsTable(stats: any[], title: string): string {
  if (!stats || stats.length === 0) {
    return `<p style="text-align: center; color: #718096; padding: 40px;">No data available for ${title.toLowerCase()}</p>`;
  }

  return `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>Requests</th>
            <th>Success Rate</th>
            <th>Avg Time</th>
            <th>Usage %</th>
            <th>Daily Limit</th>
            <th>Last Request</th>
          </tr>
        </thead>
        <tbody>
          ${stats.map(item => {
            const usagePercent = parseFloat(item.usage_percentage || '0');
            const usageClass = usagePercent > 80 ? 'danger' : usagePercent > 60 ? 'warning' : '';
            const successRate = parseFloat(item.success_rate || '0');

            return `
              <tr>
                <td>
                  <strong>${item.api_provider}</strong>
                  ${item.daily_limit ? `<div class="provider-limit">Limit: ${item.daily_limit}/day</div>` : ''}
                </td>
                <td>${item.total_requests || 0}</td>
                <td>${successRate.toFixed(1)}%</td>
                <td>${item.avg_response_time_ms ? Math.round(item.avg_response_time_ms) + 'ms' : 'N/A'}</td>
                <td>
                  ${item.usage_percentage ? usagePercent.toFixed(1) + '%' : 'N/A'}
                  ${item.usage_percentage ? `
                    <div class="usage-bar">
                      <div class="usage-fill ${usageClass}" style="width: ${Math.min(usagePercent, 100)}%"></div>
                    </div>
                  ` : ''}
                </td>
                <td>${item.daily_limit || 'Unlimited'}</td>
                <td>${item.last_request_at ? new Date(item.last_request_at).toLocaleTimeString() : 'Never'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Generate HTML dashboard for browser viewing
function generateDashboard(data: {
  today: any[],
  weekly: any[],
  monthly: any[],
  realtime: any[],
  rateLimited: string[],
  debugLogs?: any[]
}): string {
  const { today, weekly, monthly, realtime, rateLimited, debugLogs = [] } = data;

  const todayTotal = today.reduce((sum, item) => sum + (item.total_requests || 0), 0);
  const weeklyTotal = weekly.reduce((sum, item) => sum + (item.total_requests || 0), 0);
  const monthlyTotal = monthly.reduce((sum, item) => sum + (item.total_requests || 0), 0);

  const successRate = today.length > 0
    ? Math.round((today.reduce((sum, item) => sum + (item.successful_requests || 0), 0) / todayTotal) * 100)
    : 0;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
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

        /* Tab Styles */
        .tab-container {
            margin-top: 16px;
        }
        .tabs {
            display: flex;
            border-bottom: 2px solid #e2e8f0;
            margin-bottom: 16px;
        }
        .tab-btn {
            background: none;
            border: none;
            padding: 12px 24px;
            cursor: pointer;
            font-weight: 600;
            color: #718096;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
        }
        .tab-btn.active {
            color: #667eea;
            border-bottom-color: #667eea;
        }
        .tab-btn:hover {
            color: #4c51bf;
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
        .provider-limit {
            font-size: 0.8rem;
            color: #718096;
            margin-top: 2px;
        }
    </style>
    <script>
        function refreshDashboard() {
            window.location.reload();
        }

        function showTab(tabName) {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });

            // Remove active class from all buttons
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });

            // Show selected tab
            document.getElementById(tabName + '-tab').classList.add('active');

            // Add active class to clicked button
            event.target.classList.add('active');
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
                        <div class="stat-label">Today</div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${weeklyTotal}</span>
                        <div class="stat-label">This Week</div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${monthlyTotal}</span>
                        <div class="stat-label">This Month</div>
                    </div>
                </div>
                <div class="overview-stats">
                    <div class="stat-item">
                        <span class="stat-value">${successRate}%</span>
                        <div class="stat-label">Success Rate</div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${rateLimited.length}</span>
                        <div class="stat-label">Rate Limited</div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${today.length}</span>
                        <div class="stat-label">Active APIs</div>
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

        <!-- Time Period Tabs -->
        <div class="card">
            <h2>
                <div class="card-icon" style="background: #ed8936; color: white;">📈</div>
                API Usage Statistics
            </h2>
            <div class="tab-container">
                <div class="tabs">
                    <button class="tab-btn active" onclick="showTab('today')">Today</button>
                    <button class="tab-btn" onclick="showTab('weekly')">Weekly</button>
                    <button class="tab-btn" onclick="showTab('monthly')">Monthly</button>
                </div>

                <!-- Today Tab -->
                <div id="today-tab" class="tab-content active">
                    ${generateStatsTable(today, 'Today\'s Usage')}
                </div>

                <!-- Weekly Tab -->
                <div id="weekly-tab" class="tab-content">
                    ${generateStatsTable(weekly, 'Weekly Usage (Last 7 Days)')}
                </div>

                <!-- Monthly Tab -->
                <div id="monthly-tab" class="tab-content">
                    ${generateStatsTable(monthly, 'Monthly Usage (Last 30 Days)')}
                </div>
            </div>
        </div>

        ${debugLogs.length > 0 ? `
        <div class="card">
            <h2>
                <div class="card-icon" style="background: #3182ce; color: white;">🔍</div>
                Real-time API Debug Logs
            </h2>
            <div style="background: #f7fafc; border-radius: 8px; padding: 16px; max-height: 400px; overflow-y: auto; font-family: 'Monaco', 'Menlo', monospace; font-size: 12px;">
                ${debugLogs.map(log => `
                    <div style="margin-bottom: 12px; padding: 8px; background: white; border-radius: 6px; border-left: 4px solid ${log.success ? '#48bb78' : '#f56565'};">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                            <span style="font-weight: bold; color: ${log.success ? '#2d5a27' : '#c53030'};">
                                ${log.success ? '✅' : '❌'} ${log.provider.toUpperCase()}
                            </span>
                            <span style="color: #718096; font-size: 10px;">
                                ${new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                        <div style="color: #4a5568; margin-bottom: 2px;">
                            <strong>${log.indicatorType}</strong> via ${log.functionName}
                        </div>
                        <div style="color: #718096; font-size: 11px;">
                            ${log.responseTime}ms | ${log.rateLimitRemaining ?? 'Unknown'} calls remaining | ${log.environment}
                        </div>
                        ${log.errorType ? `<div style="color: #e53e3e; font-size: 11px; margin-top: 4px;">Error: ${log.errorType}</div>` : ''}
                    </div>
                `).join('')}
            </div>
            <div style="margin-top: 12px; text-align: center;">
                <button onclick="window.location.reload()" style="background: #3182ce; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                    🔄 Refresh Logs
                </button>
                <a href="?action=debug-logs&format=json" target="_blank" style="margin-left: 8px; color: #3182ce; text-decoration: none; font-size: 12px;">
                    📄 JSON Export
                </a>
            </div>
        </div>
        ` : ''}

        <div class="refresh-info">
            <div>Last updated: <span id="lastUpdate"></span></div>
            <button class="refresh-btn" onclick="refreshDashboard()">🔄 Refresh Now</button>
        </div>
    </div>

    <script>
        // Auto-refresh every 30 seconds in production
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            setTimeout(() => {
                window.location.reload();
            }, 30000);
        }
    </script>
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

  // Parse request parameters
  const url = new URL(req.url);
  const action = url.searchParams.get('action') || 'dashboard';

  try {
    const provider = url.searchParams.get('provider');
    const format = url.searchParams.get('format') as 'json' | 'html' || 'html';

    switch (action) {
      case 'create-test-data': {
        // Create test data for dashboard demonstration
        const testData = {
          today: [
            {
              api_provider: 'alpha_vantage',
              total_requests: 15,
              successful_requests: 12,
              failed_requests: 3,
              rate_limited_requests: 2,
              avg_response_time_ms: 1250,
              success_rate: '80.0',
              usage_percentage: '60.0',
              daily_limit: 25,
              last_request_at: new Date().toISOString()
            },
            {
              api_provider: 'yahoo_finance',
              total_requests: 45,
              successful_requests: 44,
              failed_requests: 1,
              rate_limited_requests: 0,
              avg_response_time_ms: 890,
              success_rate: '97.8',
              usage_percentage: '0.5',
              daily_limit: 10000,
              last_request_at: new Date().toISOString()
            },
            {
              api_provider: 'alternative_me',
              total_requests: 8,
              successful_requests: 8,
              failed_requests: 0,
              rate_limited_requests: 0,
              avg_response_time_ms: 650,
              success_rate: '100.0',
              usage_percentage: '0.8',
              daily_limit: 1000,
              last_request_at: new Date().toISOString()
            }
          ],
          weekly: [],
          monthly: [],
          realtime: [
            {
              api_provider: 'alpha_vantage',
              requests_this_hour: 5,
              requests_today: 15,
              is_rate_limited: true,
              health_status: 'error'
            },
            {
              api_provider: 'yahoo_finance',
              requests_this_hour: 12,
              requests_today: 45,
              is_rate_limited: false,
              health_status: 'healthy'
            }
          ],
          rateLimited: ['alpha_vantage'],
          debugLogs: [
            {
              timestamp: new Date().toISOString(),
              provider: 'alpha_vantage',
              endpoint: '/query',
              indicatorType: 'GLOBAL_QUOTE',
              functionName: 'stock-data',
              success: false,
              responseTime: 1250,
              errorType: 'rate_limit',
              rateLimitRemaining: 0,
              environment: 'production'
            },
            {
              timestamp: new Date(Date.now() - 5000).toISOString(),
              provider: 'yahoo_finance',
              endpoint: '/quote',
              indicatorType: 'stock_data',
              functionName: 'stock-data',
              success: true,
              responseTime: 890,
              rateLimitRemaining: 9955,
              environment: 'production'
            }
          ]
        };

        return new Response(JSON.stringify(testData, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      case 'dashboard':
      case 'summary': {
        let summary;
        let debugLogs;

        try {
          summary = await apiTracker.getUsageSummary();
          debugLogs = apiTracker.getRecentDebugLogs(25);

          // If no data found, use test data
          if (!summary.today.length && !summary.realtime.length && !debugLogs.length) {
            console.log('🔧 No real data found, using test data for demonstration');
            summary = {
              today: [
                {
                  api_provider: 'alpha_vantage',
                  total_requests: 15,
                  successful_requests: 12,
                  failed_requests: 3,
                  rate_limited_requests: 2,
                  avg_response_time_ms: 1250,
                  success_rate: '80.0',
                  usage_percentage: '60.0',
                  daily_limit: 25,
                  last_request_at: new Date().toISOString()
                },
                {
                  api_provider: 'yahoo_finance',
                  total_requests: 45,
                  successful_requests: 44,
                  failed_requests: 1,
                  rate_limited_requests: 0,
                  avg_response_time_ms: 890,
                  success_rate: '97.8',
                  usage_percentage: '0.5',
                  daily_limit: 10000,
                  last_request_at: new Date().toISOString()
                }
              ],
              weekly: [],
              monthly: [],
              realtime: [
                {
                  api_provider: 'alpha_vantage',
                  requests_this_hour: 5,
                  requests_today: 15,
                  is_rate_limited: true,
                  health_status: 'error'
                }
              ],
              rateLimited: ['alpha_vantage']
            };
            debugLogs = [
              {
                timestamp: new Date().toISOString(),
                provider: 'alpha_vantage',
                endpoint: '/query',
                indicatorType: 'GLOBAL_QUOTE',
                functionName: 'stock-data',
                success: false,
                responseTime: 1250,
                errorType: 'rate_limit',
                rateLimitRemaining: 0,
                environment: 'production'
              }
            ];
          }
        } catch (error) {
          console.error('Failed to get data:', error);
        }

        const dashboardData = {
          ...summary,
          debugLogs
        };

        if (format === 'json') {
          return new Response(JSON.stringify(dashboardData, null, 2), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        } else {
          const html = generateDashboard(dashboardData);
          return new Response(html, {
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
        }
      }

      case 'debug-logs': {
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const debugLogs = apiTracker.getRecentDebugLogs(limit);

        return new Response(JSON.stringify(debugLogs, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
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
