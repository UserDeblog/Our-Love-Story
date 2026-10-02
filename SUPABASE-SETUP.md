# Supabase setup

The site uses the Supabase project URL and publishable key in `supabase-config.js`. A publishable key is intended to be visible in browser code. Never put a Supabase secret key in this repository or in browser code.

## Configure the project

1. In the Supabase Dashboard, open **SQL Editor** and run `supabase-setup.sql`.
2. Publish the updated `index.html`, `script.js`, `style.css`, and `supabase-config.js` through GitHub Pages.
3. Once GitHub Pages updates, the upload form is available without signing in.

The `memories` Storage bucket is public for reading and accepts images and videos up to 100 MB. Anyone with the public site link can upload files and add entries to the gallery, so only use this mode if that is acceptable. The two-person audience is not technically enforced by a public GitHub Pages link.

## Exposed secret key

A secret key was pasted into the chat. Revoke that key in **Project Settings → API Keys**. The site does not use a secret key; only the publishable key belongs in `supabase-config.js`.
