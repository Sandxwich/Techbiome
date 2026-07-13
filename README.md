# Techbiome Website Starter

A clean, responsive starter website using plain HTML, CSS, and JavaScript.

## Files

- `index.html`: Main page and semantic structure
- `styles.css`: Theme, layout, responsive rules, and animations
- `script.js`: Basic interactive behavior
- `favicon.svg`: Site icon
- `.gitignore`: Standard ignore rules
- `docs/c4/context.mmd`: C4 System Context source
- `docs/c4/container.mmd`: C4 Container source
- `docs/c4/component.mmd`: C4 Component source

## Run Locally

Open `index.html` directly in your browser.

## Customize

1. Replace text content in `index.html`.
2. Adjust theme colors and typography in `styles.css`.
3. Add features in `script.js`.

## C4 Architecture Model

These Mermaid C4 diagrams render in Markdown viewers that support Mermaid C4 syntax, including GitHub.

### 1. System Context

```mermaid
C4Context
	title System Context diagram for Techbiome Website

	Person(visitor, "Visitor", "A person using a web browser to access the site")
	System_Boundary(techbiome_boundary, "Techbiome") {
		System(website, "Techbiome Website", "Static website", "Provides landing page content and basic interaction")
	}
	System_Ext(github_pages, "GitHub Pages", "Static hosting platform")

	Rel(visitor, website, "Views website", "HTTPS")
	Rel(website, github_pages, "Hosted on", "Static files")
```

### 2. Container

```mermaid
C4Container
	title Container diagram for Techbiome Website

	Person(visitor, "Visitor", "Website user")
	System_Boundary(techbiome_boundary, "Techbiome Website") {
		Container(browser, "Browser", "User's web browser", "Renders UI and runs JavaScript")
		Container(web_assets, "Static Web Assets", "HTML/CSS/JavaScript", "Delivers content, style, and interaction")
	}
	System_Ext(hosting, "Static Hosting", "GitHub Pages, Netlify, or similar")

	Rel(visitor, browser, "Uses")
	Rel(browser, web_assets, "Requests and loads", "HTTPS")
	Rel(web_assets, hosting, "Served by")
```

### 3. Component

```mermaid
C4Component
	title Component diagram for Techbiome Website static assets

	Container_Boundary(web_assets, "Static Web Assets") {
		Component(index_html, "index.html", "HTML", "Semantic page structure and content")
		Component(styles_css, "styles.css", "CSS", "Theme, responsive layout, and animation")
		Component(script_js, "script.js", "JavaScript", "Handles UI interaction and status updates")
		Component(favicon_svg, "favicon.svg", "SVG", "Brand icon shown by browser")
	}

	Rel(index_html, styles_css, "Loads")
	Rel(index_html, script_js, "Loads")
	Rel(index_html, favicon_svg, "References")
	Rel(script_js, index_html, "Updates DOM content")
```

Source files for these diagrams are in `docs/c4/`.
