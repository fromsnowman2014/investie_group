# Railway Backend Debug Guide

## 🚨 Problem Analysis
From the console logs, the Vercel frontend is calling:
```
https://investie-group-web.vercel.app/api/v1/dashboard/AAPL/news-analysis
```

This means the `NEXT_PUBLIC_API_URL` is NOT set in Vercel, so it's defaulting to calling itself instead of the Railway backend.

## 🔍 How to Find Your Railway Backend URL

### Method 1: Railway Dashboard
1. Go to [railway.app](https://railway.app)
2. Login to your account  
3. Find your `investie_group` project
4. Click on the backend service
5. Go to the "Settings" tab
6. Copy the "Public Domain" URL (should end with `.up.railway.app`)

### Method 2: Railway CLI
```bash
# Install Railway CLI if not installed
npm install -g @railway/cli

# Login and list deployments
railway login
railway list
railway status
```

### Method 3: Git Remote (if configured)
```bash
git remote -v
# Look for railway remote
```

## 🔧 Expected Railway URL Patterns
Your backend URL should look like one of these:
- `https://web-production-XXXX.up.railway.app`
- `https://investie-group-backend-production.up.railway.app`
- `https://backend-production-XXXX.up.railway.app`

## ✅ Fix Steps

### 1. Set Vercel Environment Variable
Once you find the Railway URL:

1. Go to [vercel.com](https://vercel.com)
2. Open your `investie-group-web` project
3. Go to Settings → Environment Variables
4. Add/Update:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://YOUR-RAILWAY-URL` (without trailing slash)
   - **Environments**: Production, Preview, Development

### 2. Redeploy Vercel
After setting the environment variable:
- Trigger a new deployment by pushing to main branch
- OR manually redeploy from Vercel dashboard

### 3. Test Railway Backend
Once you have the URL, test it:
```bash
curl https://YOUR-RAILWAY-URL/health
curl https://YOUR-RAILWAY-URL/api/v1/market/overview
```

### 4. Verify ALPHA_VANTAGE_API_KEY on Railway
In Railway dashboard:
1. Go to your backend service
2. Variables tab
3. Confirm `ALPHA_VANTAGE_API_KEY` is set
4. Check the logs for any API errors

## 🧪 Debug Commands for Railway Backend
```bash
# Test health endpoint
curl https://YOUR-RAILWAY-URL/health

# Test market overview API
curl https://YOUR-RAILWAY-URL/api/v1/market/overview

# Test with headers
curl -H "Accept: application/json" https://YOUR-RAILWAY-URL/api/v1/market/overview
```

## 📋 Checklist
- [ ] Find Railway backend URL
- [ ] Set `NEXT_PUBLIC_API_URL` in Vercel
- [ ] Redeploy Vercel frontend  
- [ ] Verify `ALPHA_VANTAGE_API_KEY` in Railway
- [ ] Test both endpoints work
- [ ] Check console logs show correct API calls

## 🐛 Common Issues
1. **Railway URL wrong**: Double-check the exact URL from Railway dashboard
2. **CORS issues**: Railway backend should allow Vercel domain
3. **API Key missing**: Verify ALPHA_VANTAGE_API_KEY is set in Railway
4. **Cache issues**: Hard refresh browser after Vercel redeploy

Please find your Railway URL and update the Vercel environment variable, then the debugging information we added to MacroIndicators will show the correct API endpoint.