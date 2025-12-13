const { Client } = require('@notionhq/client');
const fs = require('fs');

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
    return text;
  }).join('');
}

function blocksToHtml(blocks) {
  return blocks.map(block => {
    const type = block.type;
    if (type === 'paragraph') {
      const text = richTextToHtml(block.paragraph.rich_text);
      return text ? '<p>' + text + '</p>' : '';
    }
    if (type === 'heading_2') return '<h2>' + richTextToHtml(block.heading_2.rich_text) + '</h2>';
    if (type === 'heading_3') return '<h3>' + richTextToHtml(block.heading_3.rich_text) + '</h3>';
    if (type === 'bulleted_list_item') return '<li>' + richTextToHtml(block.bulleted_list_item.rich_text) + '</li>';
    if (type === 'quote') return '<blockquote>' + richTextToHtml(block.quote.rich_text) + '</blockquote>';
    if (type === 'divider') return '<hr>';
    return '';
  }).join('\n');
}

function generateHtml(title, subtitle, content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | College Essay Guide | Gulliver Prep</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700;900&display=swap" rel="stylesheet">
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