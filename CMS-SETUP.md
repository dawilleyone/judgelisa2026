# Content Manager Setup — Keep Judge Langford 2026

This site uses **Decap CMS** (formerly Netlify CMS) so that non-technical campaign staff can update **Campaign Events** and **Campaign News** through a friendly admin interface — without touching any HTML.

There are two parts:

1. **One-time setup** (you or a developer does this once, before launching).
2. **Day-to-day editing** (anyone on the campaign team can do this).

---

## Part 1: One-time setup

### What's already in place

The following files were added to the site and need no changes:

| File | Purpose |
|------|---------|
| `admin/index.html` | The admin UI page that editors visit |
| `admin/config.yml` | Defines what content can be edited and what fields each entry has |
| `data/events.json` | Where all events are stored (CMS writes here) |
| `data/news.json` | Where all news posts are stored (CMS writes here) |
| `js/dynamic-content.js` | Runtime renderer — reads the JSON files and fills the site |

To make the CMS *live* (i.e. editors can log in and save changes), you need a host that supports Git-based authentication. The two paths are:

### Option A — Host on Netlify (easiest, recommended)

Netlify is free for a campaign-sized site and integrates with the CMS out of the box.

1. **Create a free Netlify account** at https://www.netlify.com.
2. **Push this site to a GitHub repo** (or GitLab / Bitbucket).
3. **In Netlify, "Add new site" → "Import from Git"** and connect the repo. The site will deploy automatically.
4. **In your Netlify site dashboard, enable Netlify Identity:**
   - Site settings → Identity → **Enable Identity**.
   - Under *Registration*, set it to **Invite only** (so random visitors can't sign up).
   - Under *Services → Git Gateway*, click **Enable Git Gateway**.
5. **Invite each editor:**
   - In the Identity tab, click **Invite users** and enter their email.
   - They'll get an email with a link to set their password.
6. **The admin URL** is `https://YOUR-SITE.netlify.app/admin/`. Editors log in there.

### Option B — Host elsewhere (Vercel, GitHub Pages, shared host, etc.)

If you're not on Netlify, swap the backend in `admin/config.yml` to use GitHub OAuth directly. Change the top of `admin/config.yml` to:

```yaml
backend:
  name: github
  repo: your-github-user/your-repo-name
  branch: main
```

You then need an OAuth provider. The easiest free option is to use a hosted bridge like:

- https://decapbridge.com/ (free, no setup)
- Or follow the official guide: https://decapcms.org/docs/external-oauth-clients/

Every editor will need a GitHub account with write access to the repo.

---

## Part 2: How editors update content

Once setup is done, this is all an editor needs to know.

### Logging in

1. Go to **`https://yoursite.com/admin/`**
2. Click **"Log in with Netlify Identity"** (or "Log in with GitHub" if using Option B).
3. Enter the email & password you were invited with.

### The admin screen

After login you'll see two collections in the left sidebar:

- 📅 **Campaign Events** — every event the campaign is running
- 📰 **Campaign News** — news headlines that appear on the homepage

### Adding a new event

1. Click **Campaign Events** in the sidebar.
2. Click **All Events**.
3. Scroll down and click **Add Events**.
4. Fill out the form:
   - **Event Title** — what people will see (e.g. *"Westside Town Hall"*)
   - **Date** — pick a date (leave blank if it's still being scheduled)
   - **Time** — optional, free text (e.g. *"6:00 pm – 8:00 pm"*)
   - **Location** — defaults to *Jefferson County, Kentucky*; change as needed
   - **Description** — a sentence or two about the event
   - **Button Text / Button Link** — optional call-to-action button
   - **Show in sidebar widget?** — leave checked so the event shows on every page; uncheck if it should only appear on the main Events page
   - **Sidebar Tag** — short label like *"Fundraiser"*, *"Rally"*, *"Town Hall"*
5. Click **Save** in the top right. This creates a draft.
6. Click **Publish → Publish now**. Within ~30 seconds, the event is live on the site.

### Editing or deleting an existing event

1. Open **Campaign Events → All Events**.
2. Find the event in the list and edit its fields.
3. To delete: click the **−** (minus) icon next to that event.
4. **Save** → **Publish now**.

### Adding news

1. Click **Campaign News** → **All News Posts** → **Add Posts**.
2. Fill in:
   - **Headline** — the post title
   - **Date** — when it was posted
   - **Summary** — 1–2 sentences shown under the headline
   - **Image** — optional; click to upload or pick one from the library
   - **Link URL** — where clicking the headline takes the visitor (leave blank to make it non-clickable)
3. **Save → Publish now**.

> The homepage shows the **3 most recent** news posts automatically — no need to manually delete old ones.

### Where edits show up

| What you edit | Where it appears |
|---------------|------------------|
| An event with **"Show in sidebar"** checked | Sidebar of every page (top 3 upcoming) + Events page |
| An event with **"Show in sidebar"** unchecked | Events page only |
| A news post | Homepage *Campaign News* section (top 3 most recent) |

---

## Troubleshooting

### "My change isn't showing up"

- Wait ~30 seconds for the site to redeploy.
- Hard-refresh your browser: `Ctrl+Shift+R` on Windows, `Cmd+Shift+R` on Mac.
- Check the Netlify *Deploys* tab to make sure the latest deploy succeeded.

### "I broke something — can I undo it?"

Yes. Every save creates a new commit in Git. From the Netlify dashboard:
- Go to **Deploys** → find the last good deploy → **Publish deploy**.
- The site rolls back to that point. (Or, in GitHub, revert the most recent commit on the data JSON file.)

### "How do I add another editor?"

Netlify dashboard → **Identity** → **Invite users**.

### "The admin page won't load / shows an error"

- Make sure Identity is enabled (Netlify → Site settings → Identity).
- Make sure Git Gateway is enabled (Identity → Services → Git Gateway).
- Open the browser developer console (F12) for the specific error message.

---

## Technical notes (for developers)

- The renderer (`js/dynamic-content.js`) is vanilla JavaScript with **no dependencies** — works in any modern browser.
- If `data/events.json` or `data/news.json` fails to load, each page's **hardcoded fallback content** is left in place, so the site degrades gracefully.
- Containers are marked with `data-events-target="sidebar"`, `data-events-target="full"`, or `data-news-target="latest"` — the renderer hooks into these attributes.
- To add a new dynamic section on a new page: add a container with one of those `data-*` attributes and include `<script src="js/dynamic-content.js"></script>` before `</body>`.
- Events with `"showInSidebar": false` are excluded from the sidebar widgets but still appear on the main Events page.
- Events whose date has passed are automatically hidden from both the sidebar and the full events list.
