# WYRD-LEDGER Deployment Guide

This guide covers deploying WYRD-LEDGER to GitHub Pages, Vercel, and Netlify.

---

## Prerequisites

- **Node.js 18+** installed
- **Firebase Console** access (to add authorized domains)
- Your project code (download as ZIP or clone from GitHub)

---

## Option 1: GitHub Pages

### Step 1: Create Repository

1. Go to [github.com/new](https://github.com/new)
2. Name your repository (e.g., `wyrd-ledger`)
3. Set to **Public** (required for free GitHub Pages)
4. Click **Create repository**

### Step 2: Push Your Code

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Add remote origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to GitHub
git push -u origin main
```

### Step 3: Add GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Step 4: Enable GitHub Pages

1. Go to **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. Push a commit to trigger the workflow

### Step 5: Add Firebase Authorized Domain

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain**
5. Add `YOUR_USERNAME.github.io`

Your app will be live at: `https://YOUR_USERNAME.github.io/YOUR_REPO/`

---

## Option 2: Vercel

### Step 1: Connect Repository

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New Project**
3. Import your GitHub repository

### Step 2: Configure Build Settings

Vercel auto-detects Vite projects, but verify:

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### Step 3: Deploy

1. Click **Deploy**
2. Wait for build to complete
3. Copy your deployment URL (e.g., `your-app.vercel.app`)

### Step 4: Add Firebase Authorized Domain

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Add your Vercel domain (e.g., `your-app.vercel.app`)

---

## Option 3: Netlify

### Step 1: Connect Repository

1. Go to [netlify.com](https://netlify.com) and sign in with GitHub
2. Click **Add new site** → **Import an existing project**
3. Select your GitHub repository

### Step 2: Configure Build Settings

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Publish directory | `dist` |

### Step 3: Deploy

1. Click **Deploy site**
2. Wait for build to complete
3. Copy your deployment URL (e.g., `your-app.netlify.app`)

### Step 4: Add Firebase Authorized Domain

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Add your Netlify domain (e.g., `your-app.netlify.app`)

---

## Post-Deployment Checklist

After deploying, verify the following:

### ✅ Authentication
- [ ] Login page loads correctly
- [ ] Can sign in with existing credentials
- [ ] Can create new account
- [ ] Logout works

### ✅ Navigation
- [ ] All sidebar links work
- [ ] URL routing works (no 404 on refresh)
- [ ] HashRouter URLs display correctly (e.g., `/#/customers`)

### ✅ Data Sync
- [ ] Firebase connection works
- [ ] Can create/edit/delete records
- [ ] Data persists after refresh
- [ ] Sync indicator shows correct status

### ✅ Offline Mode
- [ ] App works when offline
- [ ] Changes queue locally
- [ ] Data syncs when back online

---

## Troubleshooting

### "Firebase: Error (auth/unauthorized-domain)"

**Cause**: Your deployment domain isn't authorized in Firebase.

**Fix**: Add your domain to Firebase Console → Authentication → Settings → Authorized domains.

### Page shows 404 on refresh

**Cause**: SPA routing issue (shouldn't happen with HashRouter).

**Fix**: The app uses HashRouter specifically to avoid this. If you see 404s, verify the build completed successfully.

### Build fails

**Common causes**:
- Node.js version too old (needs 18+)
- Missing dependencies (run `npm install` first)
- TypeScript errors (check build logs)

---

## Custom Domain

To use a custom domain:

1. **Vercel/Netlify**: Add domain in their dashboard
2. **GitHub Pages**: Add domain in Settings → Pages
3. **DNS**: Point your domain's A record or CNAME to the hosting provider
4. **Firebase**: Add your custom domain to authorized domains

---

## Environment Variables

WYRD-LEDGER uses Firebase configuration stored in `src/lib/config.ts`. No environment variables are required for basic deployment.

If you want to use environment variables instead:

1. Create `.env` file (don't commit this):
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
```

2. Update `src/lib/config.ts` to read from `import.meta.env`

3. Add environment variables in your hosting provider's dashboard

---

## Questions?

If you encounter issues not covered here, check:
- Firebase Console for auth/database errors
- Browser DevTools console for JavaScript errors
- Network tab for failed API requests
