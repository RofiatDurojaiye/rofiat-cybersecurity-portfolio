# Durojaiye Rofiat Titilayo: Portfolio

A static, multi-page cybersecurity portfolio. No build step. Open `index.html` to preview locally.

## Pages
Home, About, Projects (with a case-study page for each project), Learning Journey, Insights (articles), Contact, and a private **admin page** (`admin.html`).

## Updating the site without code: `admin.html`
Open `admin.html` on the live site. There you can:
- add projects (cover image, screenshots, overview, investigation details, findings) and **change a project's status at any time** (In Progress, Completed, Lab Simulation, Research)
- add articles with a date (the "min read" label is worked out automatically)
- edit the Learning Journey headings and intro lines, and optionally add notes
- list roles and tools under About
- set the GitHub link and change the profile picture

Click **Publish changes** and the live site updates in about a minute or two.

### One-time connection
1. In GitHub: Settings, Developer settings, Personal access tokens, Fine-grained tokens, Generate new token.
2. Choose only this repository. Under Repository permissions set **Contents: Read and write**. Set a sensible expiry.
3. On `admin.html`, enter `your-username/repository-name`, the branch (usually `main`) and the token, then Connect.

The token stays in that browser only. It is never written to the site. Keep it private; if it leaks, delete it in GitHub and make a new one.
**Download backup** saves your content as a file if you cannot connect.

## Contact form
Messages are sent straight to the email set in `assets/js/content.js` through FormSubmit. The first message triggers an activation email to that inbox: click the confirm link once, then every later message arrives normally. Test it once after going live.

## Deploy on GitHub Pages
Push this folder to a repository, then Settings, Pages, deploy from the `main` branch root. After it is live, set `siteUrl` in `assets/js/content.js` and replace `YOUR-DOMAIN` in `robots.txt` and `sitemap.xml`.

## Files
- `data/site-data.js`: all projects, articles, learning and experience (written by the admin page)
- `assets/js/content.js`: name, email, LinkedIn, contact form endpoint
- `assets/css/styles.css`: colours and fonts at the top
- `assets/img/portrait.jpg`: profile picture (replace from the admin page)
