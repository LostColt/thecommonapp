const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function fetchPages() {
  const response = await notion.databases.query({
    database_id: databaseId,
    sorts: [{ property: 'Order', direction: 'ascending' }]
  });
  return response.results;
}

async function fetchPageContent(pageId) {
  const blocks = await notion.blocks.children.list({ block_id: pageId });
  return blocks.results;
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
    if (t.href) text = '<a href="' + t.href + '">' + text + '</a>';
    return text;
  }).join('');
}

function loadComponent(name) {
  const filePath = path.join('components', name + '.html');
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf8');
  }
  return '<!-- Component not found: ' + name + ' -->';
}

function blocksToHtml(blocks) {
  let html = '';
  let inList = false;
  let listType = '';

  for (const block of blocks) {
    const type = block.type;

    if (type === 'paragraph') {
      const text = richTextToHtml(block.paragraph.rich_text);
      if (text.startsWith('COMPONENT:')) {
        const componentName = text.replace('COMPONENT:', '').trim();
        html += loadComponent(componentName);
        continue;
      }
    }

    if (inList && type !== 'bulleted_list_item' && type !== 'numbered_list_item') {
      html += listType === 'ul' ? '</ul>\n' : '</ol>\n';
      inList = false;
    }

    if (type === 'paragraph') {
      const text = richTextToHtml(block.paragraph.rich_text);
      html += text ? '<p>' + text + '</p>\n' : '';
    }
    else if (type === 'heading_1') {
      html += '<h1>' + richTextToHtml(block.heading_1.rich_text) + '</h1>\n';
    }
    else if (type === 'heading_2') {
      html += '<h2>' + richTextToHtml(block.heading_2.rich_text) + '</h2>\n';
    }
    else if (type === 'heading_3') {
      html += '<h3>' + richTextToHtml(block.heading_3.rich_text) + '</h3>\n';
    }
    else if (type === 'bulleted_list_item') {
      if (!inList || listType !== 'ul') {
        if (inList) html += '</ol>\n';
        html += '<ul>\n';
        inList = true;
        listType = 'ul';
      }
      html += '<li>' + richTextToHtml(block.bulleted_list_item.rich_text) + '</li>\n';
    }
    else if (type === 'numbered_list_item') {
      if (!inList || listType !== 'ol') {
        if (inList) html += '</ul>\n';
        html += '<ol>\n';
        inList = true;
        listType = 'ol';
      }
      html += '<li>' + richTextToHtml(block.numbered_list_item.rich_text) + '</li>\n';
    }
    else if (type === 'quote') {
      html += '<blockquote>' + richTextToHtml(block.quote.rich_text) + '</blockquote>\n';
    }
    else if (type === 'divider') {
      html += '<hr>\n';
    }
    else if (type === 'code') {
      const code = block.code.rich_text.map(t => t.plain_text).join('');
      const lang = block.code.language || '';
      html += '<pre><code class="language-' + lang + '">' + code + '</code></pre>\n';
    }
    else if (type === 'callout') {
      const icon = block.callout.icon?.emoji || '💡';
      const text = richTextToHtml(block.callout.rich_text);
      html += '<div class="callout"><span class="callout-icon">' + icon + '</span><div class="callout-content">' + text + '</div></div>\n';
    }
    else if (type === 'image') {
      const url = block.image.type === 'external' ? block.image.external.url : block.image.file.url;
      const caption = block.image.caption ? richTextToHtml(block.image.caption) : '';
      html += '<figure><img src="' + url + '" alt="' + caption + '"><figcaption>' + caption + '</figcaption></figure>\n';
    }
  }

  if (inList) {
    html += listType === 'ul' ? '</ul>\n' : '</ol>\n';
  }

  return html;
}

function generateHtml(title, subtitle, content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | College Essay Guide | Gulliver Prep</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="progress-bar"><div class="progress-bar-fill"></div></div>
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
  console.log('Fetching pages from Notion...');
  const pages = await fetchPages();

  if (!fs.existsSync('dist')) fs.mkdirSync('dist');

  fs.copyFileSync('styles.css', 'dist/styles.css');
  fs.copyFileSync('nav.js', 'dist/nav.js');

  for (const page of pages) {
    const props = page.properties;
    const slug = props.Slug?.rich_text[0]?.plain_text || 'index';
    const pageTitle = props['Page Title']?.rich_text[0]?.plain_text || '';
    const subtitle = props.Subtitle?.rich_text[0]?.plain_text || '';

    const blocks = await fetchPageContent(page.id);
    const contentHtml = blocksToHtml(blocks);
    const html = generateHtml(pageTitle, subtitle, contentHtml);

    fs.writeFileSync('dist/' + slug + '.html', html);
    console.log('Generated: ' + slug + '.html');
  }

  console.log('Build complete!');
}

build().catch(console.error);
