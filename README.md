# charlesgum.com

My personal website built with [Astro](https://astro.build). This started as a way to kick the tires on Astro for use in both personal and client projects. It's very much a sandbox — expect some dust.

## Tech Stack

- **Framework:** Astro
- **UI:** Preact
- **Other:** Sitemap generation, RSS feed, Google Analytics

## Experiments

The site has an experiments page where I try out ideas and integrations:

- **Quote Machine** — Browse random quotes from an external API
- **Weather Dashboard** — Search for a city and get current weather (defaults to Pearl City, HI)
- **Live Visitor Counter** *(retired)* — Was a real-time visitor tracker built with Supabase and Astro islands. Removed Supabase integration.

## Upcoming Experiments

- **Cloudflare Workers Contact Form** — Replace the current mailto link with a Cloudflare Worker that handles form submissions and sends emails

## Project Structure

```text
src/
├── blog/          # Markdown blog posts
├── components/    # Reusable Astro/Preact components
├── layouts/       # Page layouts (Base, MarkdownPost)
├── pages/         # Site routes (blog, about, contact, experiments, tags, etc.)
└── ...
```

## Commands

| Command           | Action                                       |
| :---------------- | :------------------------------------------- |
| `npm install`     | Install dependencies                         |
| `npm run dev`     | Start local dev server at `localhost:4321`    |
| `npm run build`   | Build production site to `./dist/`           |
| `npm run preview` | Preview the build locally before deploying   |
