// DEFINE YOUR LINKS HERE - Ensure 'href' matches your Notion 'Slug' (+ .html)
const NAV_ITEMS = [
    { href: 'index.html', label: 'Home', id: 'index' },
    { href: 'mindset.html', label: 'The Mindset Shift', id: 'mindset' },
    { href: 'prompts.html', label: 'The Prompts', id: 'prompts' },
    { href: 'material.html', label: 'Finding Material', id: 'material' },
    { href: 'problem.html', label: 'The Core Problem', id: 'problem' },
    { href: 'moves.html', label: 'The Six Moves', id: 'moves' },
    { href: 'troubleshooting.html', label: 'Troubleshooting', id: 'troubleshooting' },
    { href: 'encouragement.html', label: 'Final Words', id: 'encouragement' }
];

function renderSidebar(currentPage) {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    let html = `
        <div class="sidebar-brand">
            <h1>Gulliver<br>Prep</h1>
            <div class="brand-line"></div>
        </div>
        <ul class="nav-list">
    `;

    NAV_ITEMS.forEach(item => {
        const isActive = item.id === currentPage || (item.id === 'index' && currentPage === '');
        html += `<li><a href="${item.href}" class="${isActive ? 'active' : ''}">${item.label}</a></li>`;
    });

    html += `</ul>`;
    sidebar.innerHTML = html;

    initGlider();
}

function initGlider() {
    const navList = document.querySelector('.nav-list');
    const activeLink = navList?.querySelector('a.active');
    
    if (!navList || !activeLink) return;

    let marker = document.createElement('div');
    marker.classList.add('nav-marker');
    navList.appendChild(marker);

    function moveMarker(target) {
        marker.style.top = target.offsetTop + 'px';
        marker.style.height = target.offsetHeight + 'px';
    }

    moveMarker(activeLink);

    // Interactive Hover
    navList.querySelectorAll('a').forEach(link => {
        link.addEventListener('mouseenter', () => moveMarker(link));
    });
    navList.addEventListener('mouseleave', () => moveMarker(activeLink));
    window.addEventListener('resize', () => moveMarker(activeLink));
}

document.addEventListener('DOMContentLoaded', function() {
    // Determine current page based on URL
    var path = window.location.pathname;
    var filename = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
    
    // Find matching ID
    var current = 'index';
    for (var i = 0; i < NAV_ITEMS.length; i++) {
        if (NAV_ITEMS[i].href === filename) { 
            current = NAV_ITEMS[i].id; 
            break; 
        }
    }

    renderSidebar(current);

    // Mobile Menu
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const pageWrapper = document.querySelector('.page-wrapper');
    const overlay = document.querySelector('.mobile-overlay');

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            pageWrapper.classList.toggle('sidebar-open');
            overlay.classList.toggle('active');
        });
        overlay.addEventListener('click', () => {
            pageWrapper.classList.remove('sidebar-open');
            overlay.classList.remove('active');
        });
    }
});
