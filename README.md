# Kyle Boxey Realtor Website

Single-file static website for `kyleboxeyrealtor.com`.

## Project Structure

- `index.html` contains the site markup, styles, existing contact script, and embedded logo/headshot assets.
- `assets/mortgage-calculator.js` powers the fixed-rate payment estimator at `/#mortgage-calculator`. It runs entirely in the visitor's browser and does not send calculator inputs anywhere.
- External services currently include Google Fonts, Zillow-hosted listing photos, Google Drive for the client roadmap PDF, and Formspree for form submissions.

## Deployment

This site is designed to deploy from the project root on Netlify. No build step is required.

For local review, open `index.html` in a browser and click **Mortgage Calculator** in the navigation. You can also share the `#mortgage-calculator` section link on the deployed site. The calculator uses a local classic script and needs no server or third-party service.
