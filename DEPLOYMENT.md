# ITAM Backend - Render Deployment Guide

## 🚀 Quick Start

Your backend is ready to deploy to Render! Follow these steps:

### Prerequisites
- [ ] GitHub account
- [ ] Render account (sign up at [render.com](https://render.com))
- [ ] Git repository (GitHub, GitLab, or Bitbucket)

---

## Step 1: Push to GitHub

If you haven't already pushed your code to GitHub:

```bash
# Navigate to your project
cd c:\Users\100\Desktop\ITAM-BACKEND

# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Ready for Render deployment"

# Add your GitHub repository
git remote add origin <YOUR_GITHUB_REPO_URL>

# Push to main branch
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy on Render

### Option A: Blueprint Deployment (Recommended - Uses render.yaml)

1. **Login to Render**: Go to [dashboard.render.com](https://dashboard.render.com)

2. **New Blueprint**: 
   - Click **"New +"** → **"Blueprint"**
   - Connect your GitHub account if not already connected
   - Select your repository: `ITAM-BACKEND`
   - Render will detect the `render.yaml` file automatically

3. **Review Configuration**:
   - Service name: `itam-backend`
   - Plan: Free
   - Click **"Apply"**

4. **Add Environment Variables**:
   - Go to your service → **"Environment"** tab
   - Add these variables:

   ```
   MONGO_URI = mongodb+srv://heetdilipshah_db_user:oww8VHcvwwe0omCs@cluster0.fe6wkh8.mongodb.net/ITAM_BACKEND?retryWrites=true&w=majority
   NODE_ENV = production
   ```

5. **Deploy**: Render will automatically build and deploy your app

### Option B: Manual Deployment

1. **New Web Service**:
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub repository

2. **Configure**:
   - **Name**: `itam-backend`
   - **Region**: Oregon (or closest to you)
   - **Branch**: `main`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

3. **Environment Variables** (same as Option A)

4. **Create Web Service**

---

## Step 3: Verify Deployment

### Check Deployment Status
1. Monitor the **Logs** tab in Render dashboard
2. Wait for "Your service is live 🎉" message
3. Note your service URL: `https://itam-backend.onrender.com`

### Test Your API

```bash
# Replace with your actual Render URL
curl https://itam-backend.onrender.com/api/assets

# Or open in browser
https://itam-backend.onrender.com/api/assets
```

### Verify Database Connection
Check the logs for:
```
✅ Database connected successfully
✅ Server running in production mode on port 10000
```

---

## 📝 Important Notes

### Free Tier Limitations
- ⚠️ **Cold Starts**: Service sleeps after 15 minutes of inactivity
- ⏱️ **Wake Time**: First request after sleep takes ~30-60 seconds
- 💾 **Storage**: Ephemeral (files don't persist between deploys)
- 🕐 **Runtime**: 750 hours/month

### Auto-Deployment
Once connected, Render automatically deploys when you push to `main`:

```bash
git add .
git commit -m "Update feature"
git push origin main
# ✅ Render auto-deploys
```

### Environment Variables
Never commit `.env` to Git! Always set environment variables in Render dashboard.

---

## 🔧 Troubleshooting

### Build Fails
- Check **Logs** tab for error messages
- Verify `package.json` has correct `start` script
- Ensure all dependencies are in `dependencies` (not `devDependencies`)

### Database Connection Issues
- Verify `MONGO_URI` is correctly set in Render
- Check MongoDB Atlas allows connections from all IPs (0.0.0.0/0)
- Verify MongoDB Atlas user credentials

### Service Not Responding
- Check if service is "Live" in dashboard
- Wait 30-60 seconds for cold start on free tier
- Check logs for runtime errors

---

## 🎯 Next Steps

1. **Custom Domain** (Optional):
   - Go to Settings → Custom Domain
   - Add your domain and update DNS

2. **Monitoring**:
   - Use Render's built-in metrics
   - Set up uptime monitoring (e.g., UptimeRobot)

3. **Upgrade Plan** (When ready):
   - Paid plans eliminate cold starts
   - Get persistent storage and better performance

---

## 📚 Resources

- [Render Documentation](https://render.com/docs)
- [Node.js on Render](https://render.com/docs/deploy-node-express-app)
- [Environment Variables](https://render.com/docs/environment-variables)

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] Service created on Render
- [ ] Environment variables configured
- [ ] Deployment successful
- [ ] API endpoints tested
- [ ] Database connection verified
- [ ] Frontend connected (if applicable)

---

**Your backend URL**: `https://itam-backend.onrender.com`

Update your frontend to use this URL for API calls!
