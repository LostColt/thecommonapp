const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

// 1. Fetch Pages
async function fetchPages() {
  const response = await notion.databases.query({
    database_id: databaseId,
    sorts: [{ property: 'Order', direction: 'ascending' }]
  });
  return response.results;
}

// 2. Recursive Block Fetching
async function fetchPageBlocks(blockId) {
  let blocks = [];
  let cursor;
  while (true) {
    const { results, next_cursor } = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
    });
    for (const block of results) {
      if (block.has_children) {
        block.children = await fetchPageBlocks(block.id);
      }
    }
    blocks = [...blocks, ...results];
    if (!next_cursor) break;
    cursor = next_cursor;
  }
  return blocks;
}

// 3. Text Formatting
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

// 4. Block to HTML (WITH MAGIC COMMAND LOGIC)
async function blocksToHtml(blocks) {
  let html = '';
  let listType = null;

  for (const block of blocks) {
    const type = block.type;

    // Close Lists if needed
    if (type !== 'bulleted_list_item' && type !== 'numbered_list_item' && listType) {
      html += listType === 'ul' ? '</ul>\n' : '</ol>\n';
      listType = null;
    }

    // --- PARAGRAPH (Checks for "SLIDE:" Command) ---
    if (type === 'paragraph') {
      const text = richTextToHtml(block.paragraph.rich_text);
      
      // MAGIC COMMAND DETECTION
      if (text.trim().startsWith('SLIDE:')) {
          let url = text.replace('SLIDE:', '').trim();
          
          // Clean the URL (remove any rich text formatting if pasted)
          url = url.replace(/<[^>]*>/g, '');

          // Auto-Repair Google Slide Links
          if (url.includes('docs.google.com/presentation')) {
              // Convert /edit or /view to /embed
              url = url.replace(/\/edit.*$/, '/embed').replace(/\/view.*$/, '/embed');
              // Ensure plain query params
              if (!url.includes('?')) {
                  url += '?start=false&loop=false&delayms=3000';
              }
          }

          html += `<div class="slide-embed-container"><iframe src="${url}" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true"></iframe></div>\n`;
      } 
      else if (text) {
          // Normal Paragraph
          html += `<p>${text}</p>\n`;
      }
    } 
    
    // --- HEADINGS ---
    else if (type === 'heading_1') html += `<h1>${richTextToHtml(block.heading_1.rich_text)}</h1>\n`;
    else if (type === 'heading_2') html += `<h2>${richTextToHtml(block.heading_2.rich_text)}</h2>\n`;
    else if (type === 'heading_3') html += `<h3>${richTextToHtml(block.heading_3.rich_text)}</h3>\n`;
    
    // --- LISTS ---
    else if (type === 'bulleted_list_item') {
      if (listType !== 'ul') { html += '<ul>\n'; listType = 'ul'; }
      html += `<li>${richTextToHtml(block.bulleted_list_item.rich_text)}</li>\n`;
    } 
    else if (type === 'numbered_list_item') {
      if (listType !== 'ol') { html += '<ol>\n'; listType = 'ol'; }
      html += `<li>${richTextToHtml(block.numbered_list_item.rich_text)}</li>\n`;
    }

    // --- OTHER BLOCKS ---
    else if (type === 'quote') {
      html += `<blockquote>${richTextToHtml(block.quote.rich_text)}</blockquote>\n`;
    } 
    else if (type === 'callout') {
      const emoji = block.callout.icon ? block.callout.icon.emoji : '💡';
      let content = richTextToHtml(block.callout.rich_text);
      if (block.children) {
        content += await blocksToHtml(block.children);
      }
      html += `<div class="callout"><span class="icon">${emoji}</span><div class="callout-content">${content}</div></div>\n`;
    }
    else if (type === 'image') {
      const url = block.image.type === 'external' ? block.image.external.url : block.image.file.url;
      const caption = block.image.caption ? richTextToHtml(block.image.caption) : '';
      html += `<figure><img src="${url}" alt="${caption}"><figcaption>${caption}</figcaption></figure>\n`;
    }
  }

  if (listType) html += listType === 'ul' ? '</ul>\n' : '</ol>\n';
  return html;
}

// 5. Wrap Page
function wrapPage(title, subtitle, content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Gulliver Prep</title>
  <link rel="stylesheet" href="styles.css">
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

// 6. Main Build
async function build() {
  console.log('Fetching pages from Notion...');
  const pages = await fetchPages();

  if (!fs.existsSync('dist')) fs.mkdirSync('dist');
  
  if (fs.existsSync('styles.css')) fs.copyFileSync('styles.css', 'dist/styles.css');
  fs.copyFileSync('nav.js', 'dist/nav.js');

  for (const page of pages) {
    const props = page.properties;
    
    let slug = props.Slug?.rich_text[0]?.plain_text;
    if (!slug) continue;
    slug = slug.trim();
    if (slug.toLowerCase() === 'home' || slug.toLowerCase() === 'index') slug = 'index.html';
    if (!slug.endsWith('.html')) slug += '.html';

    const title = props.Page?.title[0]?.plain_text || 'Untitled';
    const subtitle = props.Subtitle?.rich_text[0]?.plain_text || '';
    
    console.log(`Building: ${slug}`);
    
    const blocks = await fetchPageBlocks(page.id);
    const contentHtml = await blocksToHtml(blocks);
    const fullHtml = wrapPage(title, subtitle, contentHtml);
    
    fs.writeFileSync(`dist/${slug}`, fullHtml);
  }
  console.log('Build complete!');
}

build();
