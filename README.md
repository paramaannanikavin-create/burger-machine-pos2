# Burger Machine Cashier POS

A mobile-first cashier-only POS web app. It does not contain a customer ordering screen.

## Features
- Tap-to-add products, quantity controls, optional customer name and note
- Automatic totals in Philippine Peso
- Persistent order numbering starting at #1001
- Active order hub with status changes and delete confirmation
- Completed/cancelled history with order number/customer search
- Add/edit/remove products and edit prices
- Sauces start at ₱0.00 and can be priced by the cashier
- PWA manifest and offline service worker

## Storage and syncing
Orders and menu are stored in IndexedDB in the browser on this device. They remain after closing/reopening the app, provided browser/site data is not cleared. **There is no online account, cloud backup, or two-phone sync in this version.** Each phone has its own separate data. Do not clear browser storage unless you have exported/backed up data (export is not included in this version).

## Install using only an Android phone
A PWA must be served from an HTTPS website to install and work offline as an app. This ZIP is the complete project but is not hosted by the developer, so it does not include a live install URL or APK.

Phone-only hosting route (GitHub Pages):
1. Download and extract the ZIP using your phone's Files app.
2. In Chrome, sign in or create a GitHub account and create a **public** repository, e.g. `burger-machine-pos`.
3. Upload the six project files/folders from the extracted project to the repository root: `index.html`, `styles.css`, `app.js`, `manifest.webmanifest`, `sw.js`, and `icon.svg`.
4. In the repository, open **Settings → Pages**. Under Build and deployment, choose **Deploy from a branch**, select `main` and `/ (root)`, then Save.
5. Wait for GitHub Pages to publish. Your address will look like `https://YOUR-USERNAME.github.io/burger-machine-pos/`. Open that address in Chrome.
6. In Chrome, tap **⋮ → Add to Home screen** or **Install app**. Launch it from the new home-screen icon.

GitHub Pages hosting is public: do not enter private customer details. The app itself stores orders locally on the phone; publishing the app files does not upload order records.

## Use
- **New Order:** enter optional name/note, choose a category, tap products, adjust quantities, then Confirm Order.
- **Order Hub:** update the status using the dropdown. Completed and Cancelled orders move to History. Delete removes an order permanently after confirmation.
- **History:** search by order number or customer name.
- **Menu & Prices:** tap Edit or Add item. For sauces, blank price means ₱0.00 until you enter a price.

## Important
- Delete is available to the person operating the cashier app. There is no login/PIN in this offline single-device version, so anyone with access to the app on the unlocked phone can operate it.
- This project is a PWA source package, not an Android APK. APK compilation/signing is not included.
- Back up the device/browser regularly. Clearing Chrome site data, uninstalling the browser, or device failure may remove local orders.
