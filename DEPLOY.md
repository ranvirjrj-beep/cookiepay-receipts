# Deployment

The repository root is the deployable app: `index.html`, `app.js`, and `styles.css`.

## GitHub Pages

A Pages workflow is included at `.github/workflows/pages.yml` and deploys the root static app.

If GitHub Pages has never been enabled for this repository, do the one-time repository setting:

**Settings → Pages → Build and deployment → Source → GitHub Actions**

After that, push to `main` or run **Deploy CookiePay to GitHub Pages** from the Actions tab.

Expected URL:

`https://ranvirjrj-beep.github.io/cookiepay-receipts/`

## Other static hosts

No build command is required. Deploy these root files:

- `index.html`
- `app.js`
- `styles.css`
- `.nojekyll` (harmless outside GitHub Pages)

## Runtime requirements

- Browser with internet access.
- Nightly Wallet extension.
- Cookie Chain RPC reachable from the browser.

No API keys or environment variables are required.
