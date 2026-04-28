# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

This is a Claude Code workspace pre-configured with skills for building scroll-driven video websites and frontend interfaces. There is no application source code — the project is a skill-equipped environment for generating frontend output on demand.

## Available Skills

### `/frontend-design`
Creates distinctive, production-grade frontend interfaces (HTML/CSS/JS, React, Vue). Invokes bold aesthetic direction — avoids generic AI aesthetics. Also contains scroll-driven website design guidelines (typography, color zones, layout variety, animation choreography, stats/counters) used alongside `video-to-website`.

### `/video-to-website`
Converts a video file into a premium scroll-driven animated website using canvas frame rendering, GSAP, and Lenis. Requires `ffmpeg` and `ffprobe` on PATH. Output: `index.html` + `css/style.css` + `js/app.js` + `frames/` directory. Serve output via HTTP (not `file://`).

Typical invocation:
```
/video-to-website path/to/video.mp4
```

### `/skill-builder`
Guides creation, audit, and optimization of Claude Code skills. Runs a discovery interview before writing any files. Full technical reference is in `.claude/skills/skill-builder/reference.md`.

## Skill Locations

```
.claude/skills/
├── frontend-design/   # UI/UX generation skill
├── video-to-website/  # Video → scroll site skill
└── skill-builder/     # Skill authoring skill
```

## Local Development Server

When testing generated websites:
```bash
npx serve .
# or
python -m http.server 8000
```

Canvas frame loading requires HTTP — do not open `index.html` directly via `file://`.
