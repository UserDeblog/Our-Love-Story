# Supabase setup

The site uses the Supabase project URL and publishable key in `supabase-config.js`. A publishable key is intended to be visible in browser code. Never put a Supabase secret key in this repository or in browser code.

## Configure the project

1. In the Supabase Dashboard, open **SQL Editor** and run the latest `supabase-setup.sql`. If you ran an earlier version, run this updated script again.
2. To enable delete controls, create your admin account in **Authentication → Users** and add its email to `public.gallery_admins`:

   ```sql
   insert into public.gallery_admins (email)
   values ('you@example.com')
   on conflict (email) do nothing;
   ```

3. Publish the updated `index.html`, `script.js`, `style.css`, and `supabase-config.js` through GitHub Pages.
4. Uploads and Daily News publishing remain available without signing in. To edit or delete a saved news item, or delete an uploaded memory, sign in as the allowlisted admin from **Our Photos**. News entries are stored in `public.daily_news` and remain available to all visitors.

The `memories` Storage bucket is public for reading and accepts images and videos up to 100 MB. Anyone with the public site link can upload files and add entries to the gallery; only allowlisted admins can view Storage metadata for deletion and delete Supabase uploads. Storage deletion requires both `SELECT` and `DELETE` policies. Photos stored in the repository itself must be removed from the project files. The two-person audience is not technically enforced by a public GitHub Pages link.

## Exposed secret key

A secret key was pasted into the chat. Revoke that key in **Project Settings → API Keys**. The site does not use a secret key; only the publishable key belongs in `supabase-config.js`.
