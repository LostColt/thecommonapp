const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

// --- 1. THE STYLES (HARDCODED FOR SAFETY) ---
const SITE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap');

:root {
    --gulliver-navy: #0F172A;
    --gulliver-blue: #00338D;
    --gulliver-accent: #38BDF8;
    --text-primary: #334155;
    --text-headings: #0F172A;
    --bg-sidebar: #0F172A;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
    font-family: 'Inter', sans-serif;
    color: var(--text-primary);
    line-height: 1.7;
    background: #F8FAFC;
    -webkit-font-smoothing: antialiased;
}

/* LAYOUT STRUCTURE */
.page-wrapper {
    display: flex;
    min-height: 100vh;
    position: relative;
}

/* SIDEBAR - FORCED FIXED LEFT */
.sidebar {
    width: 280px;
    background: var(--gulliver-navy);
    color: white;
    position: fixed; /* STICKS IT TO THE WINDOW */
    top: 0;
    left: 0;
    bottom: 0;
    height: 100vh;
    overflow-y: auto;
    z-index: 100;
    padding: 3rem 0;
}

/* MAIN CONTENT - PUSHED RIGHT */
.main-content {
    flex: 1;
    margin-left: 280px; /* CRITICAL: MOVES CONTENT OUT FROM UNDER SIDEBAR */
    max-width: 900px;
    padding: 4rem 3rem;
    background: white;
    min-height: 100vh;
}

/* TYPOGRAPHY */
h1, h2 { font-family: 'Playfair Display', serif; color: var(--text-headings); }
h1.page-title { font-size: 3rem; font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; margin-bottom: 0.5rem; }
.page-subtitle { font-family: 'Playfair Display', serif; font-style: italic; font-size: 1.35rem; color: #64748B; margin-bottom: 3rem; border-bottom: 1px solid #E2E8F0; padding-bottom: 2rem; }
h2 { font-size: 2rem; margin-top: 3rem; margin-bottom: 1.5rem; border-top: 1px solid #f1f5f9; padding-top: 2rem; }
h3 { font-family: 'Inter', sans-serif; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 700; color: var(--gulliver-blue); margin-top: 2rem; margin-bottom: 1rem; }
p { margin-bottom: 1.5rem; font-size: 1.05rem; }

/* NAVIGATION ITEMS */
.sidebar-brand { padding: 0 2rem; margin-bottom: 3rem; }
.sidebar-brand h1 { color: white; font-size: 1.8rem; line-height: 1.2; }
.brand-line { width: 40px; height: 3px; background: var(--gulliver-accent); margin-top: 1rem; }

.nav-list { list-style: none; position: relative; }
.nav-list li a { 
    display: block; 
    padding: 0.8rem 2rem; 
    color: #94A3B8; 
    text-decoration: none; 
    font-size: 0.95rem; 
    font-weight: 500; 
    transition: color 0.3s ease; 
    position: relative;
    z-index: 2;
}
.nav-list li a:hover, .nav-list li a.active { color: white; }

/* THE GLIDER MARKER */
.nav-marker { 
    position: absolute; 
    left: 0; 
    width: 3px; 
    background-color: var(--gulliver-accent); 
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
    z-index: 1; 
    box-shadow: 2px 0 10px rgba(56, 189, 248, 0.3);
}

/* COMPONENTS */
.callout { display: flex; gap: 1rem; background: #F8FAFC; padding: 1.5rem; border-radius: 0.5rem; border-left: 4px solid var(--gulliver-accent); margin: 2rem 0; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
.callout .icon { font-size: 1.5rem; }
blockquote { border-left: 4px solid var(--gulliver-blue); padding-left: 1.5rem; font-style: italic; color: #475569; margin: 2rem 0; font-size: 1.2rem; }
figure { margin: 2rem 0; text-align: center; }
img { max-width: 100%; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
figcaption { margin-top: 0.8rem; font-size: 0.9rem; color: #64748B; }

/* EMBEDS */
.slide-embed-container { position: relative; width: 100%; padding-bottom: 56.25%; height: 0; margin: 2.5rem 0; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); background: #f1f5f9; }
.slide-embed-container iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }

/* MOBILE RESPONSIVE OVERRIDES */
@media (max-width: 1024px) {
    .sidebar { transform: translateX(-100%); transition: transform 0.3s ease; width: 280px; box-shadow: 10px 0 50px rgba(0,0,0,0.5); }
    .main-content { margin-left: 0; padding: 5rem 1.5rem; }
    
    .page-wrapper.sidebar-open .sidebar { transform: translateX(0); }
    
    .mobile-header { display: block; position: fixed; top: 0; left: 0; width: 100%; padding: 1rem; z-index: 50; background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); border-bottom: 1px solid #e2e8f0; }
    .mobile-menu-btn { background: transparent; color: var(--gulliver-navy); border: none; font-size: 1.8rem; cursor: pointer; }
    
    .mobile-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); opacity: 0; pointer-events: none; transition: opacity 0.3s; z-index: 90; }
    .mobile-overlay.active { opacity: 1; pointer-events: auto; }
}
@media (min-width: 1025px) { .mobile-header, .mobile-overlay { display: none; } }
`;


// --- 2. NOTION & BUILD LOGIC ---

async function fetchPages() {
  const response = await notion.databases.query({
    database_id: databaseId,
    sorts: [{ property: 'Order', direction: 'ascending' }]
  });
  return response.results;
}

async function fetchPageBlocks(blockId) {
  let blocks = [];
  let cursor;
  while (true) {
    const { results, next_cursor } = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
    });
    for (const block of results) {
      if (block.has_children) block.children = await fetchPageBlocks(block.id);
    }
    blocks = [...blocks, ...results];
    if (!next_cursor) break;
    cursor = next_cursor;
  }
  return blocks;
}

function richTextToHtml(richText) {
  if (!richText) return '';
  return richText.map(t => {
    let text = t.plain_text;
    if (t.annotations.bold) text = '<strong>' + text + '</strong>';
    if (t.annotations.italic) text = '<em>' + text + '</em>';
    if (t.annotations.code) text = '<code>' + text + '</code>';
    if (t.annotations.strikethrough) text = '<del>' + text + '</del>';
    if (t.annotations.underline) text = '<u>' + text + '</u>';
    if (t.href) text = `<a href="${t.href}" target="_blank">${text}</a>`;
    return text;
  }).join('');
}

async function blocksToHtml(blocks) {
  let html = '';
  let listType = null;

  for (const block of blocks) {
    const type = block.type;

    if (type !== 'bulleted_list_item' && type !== 'numbered_list_item' && listType) {
      html += listType === 'ul' ? '</ul>\n' : '</ol>\n';
      listType = null;
    }

    if (type === 'paragraph') {
      const text = richTextToHtml(block.paragraph.rich_text);
      if (text) html += `<p>${text}</p>\n`;
    } 
    else if (type === 'heading_1') html += `<h1>${richTextToHtml(block.heading_1.rich_text)}</h1>\n`;
    else if (type === 'heading_2') html += `<h2>${richTextToHtml(block.heading_2.rich_text)}</h2>\n`;
    else if (type === 'heading_3') html += `<h3>${richTextToHtml(block.heading_3.rich_text)}</h3>\n`;
    else if (type === 'bulleted_list_item') {
      if (listType !== 'ul') { html += '<ul>\n'; listType = 'ul'; }
      html += `<li>${richTextToHtml(block.bulleted_list_item.rich_text)}</li>\n`;
    } 
    else if (type === 'numbered_list_item') {
      if (listType !== 'ol') { html += '<ol>\n'; listType = 'ol'; }
      html += `<li>${richTextToHtml(block.numbered_list_item.rich_text)}</li>\n`;
    }
    else if (type === 'quote') {
      html += `<blockquote>${richTextToHtml(block.quote.rich_text)}</blockquote>\n`;
    } 
    else if (type === 'callout') {
      const emoji = block.callout.icon ? block.callout.icon.emoji : '💡';
      let content = richTextToHtml(block.callout.rich_text);
      if (block.children) content += await blocksToHtml(block.children);
      html += `<div class="callout"><span class="icon">${emoji}</span><div class="callout-content">${content}</div></div>\n`;
    }
    else if (type === 'image') {
      const url = block.image.type === 'external' ? block.image.external.url : block.image.file.url;
      const caption = block.image.caption ? richTextToHtml(block.image.caption) : '';
      html += `<figure><img src="${url}" alt="${caption}"><figcaption>${caption}</figcaption></figure>\n`;
    }
    else if (type === 'embed') {
        const url = block.embed.url;
        html += `<div class="slide-embed-container"><iframe src="${url}" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true"></iframe></div>\n`;
    }
  }
  if (listType) html += listType === 'ul' ? '</ul>\n' : '</ol>\n';
  return html;
}

function wrapPage(title, subtitle, content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Gulliver Prep</title>
  <style>${SITE_CSS}</style>
</head>
<body>
  <div class="mobile-overlay"></div>
  <header class="mobile-header"><button class="mobile-menu-btn">☰</button></header>
  
  <div class="page-wrapper">
    <nav class="sidebar"></nav>
    <main class="main-content">
      <h1 class="page-title">${title}</h1>
      <p class="page-subtitle">${subtitle}</p>
      <div class="prose">${content}</div>
    </main>
  </div>
  <script src="nav.js"></script>
</body>
</html>`;
}

async function build() {
  console.log('Starting All-in-One Build...');
  if (!fs.existsSync('dist')) fs.mkdirSync('dist');
  
  // No file copy needed for CSS anymore!
  fs.copyFileSync('nav.js', 'dist/nav.js');

  const pages = await fetchPages();
  for (const page of pages) {
    const props = page.properties;
    let slug = props.Slug?.rich_text[0]?.plain_text;
    if (!slug) continue;
    slug = slug.trim();
    if (slug.toLowerCase() === 'home' || slug.toLowerCase() === 'index') slug = 'index.html';
    if (!slug.endsWith('.html')) slug += '.html';

    console.log(`Building: ${slug}`);
    const blocks = await fetchPageBlocks(page.id);
    const contentHtml = await blocksToHtml(blocks);
    const fullHtml = wrapPage(props.Page?.title[0]?.plain_text || 'Untitled', props.Subtitle?.rich_text[0]?.plain_text || '', contentHtml);
    
    fs.writeFileSync(`dist/${slug}`, fullHtml);
  }
  console.log('Build complete!');
}

build();
