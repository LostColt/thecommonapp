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

    // 1. Build the Header
    let html = `
        <div class="sidebar-brand">
            <h1>Gulliver<br>Prep</h1>
            <div class="brand-line"></div>
        </div>
        <ul class="nav-list">
    `;

    // 2. Build the Links
    NAV_ITEMS.forEach(item => {
        const isActive = item.id === currentPage;
        // We do NOT add the active style inline anymore, we rely on the class
        html += `<li><a href="${item.href}" class="${isActive ? 'active' : ''}">${item.label}</a></li>`;
    });

    html += `</ul>`;
    
    // 3. Inject HTML
    sidebar.innerHTML = html;

    // 4. Initialize the "Glider" (The moving marker)
    initGlider();
}

function initGlider() {
    const navList = document.querySelector('.nav-list');
    const activeLink = navList.querySelector('a.active');
    
    if (!navList || !activeLink) return;

    // Create the marker element if it doesn't exist
    let marker = document.querySelector('.nav-marker');
    if (!marker) {
        marker = document.createElement('div');
        marker.classList.add('nav-marker');
        navList.appendChild(marker);
    }

    // Function to move marker to the target element
    function moveMarker(target) {
        // We calculate position relative to the UL parent
        marker.style.top = target.offsetTop + 'px';
        marker.style.height = target.offsetHeight + 'px';
    }

    // Move to the active link immediately
    moveMarker(activeLink);

    // Optional: Make it follow hover (Interactive Gliding)
    const links = navList.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('mouseenter', () => moveMarker(link));
    });

    // Return to active link when mouse leaves the sidebar area
    navList.addEventListener('mouseleave', () => moveMarker(activeLink));
    
    // Recalculate on window resize
    window.addEventListener('resize', () => moveMarker(activeLink));
}

// --- DOCUMENT READY HANDLER ---
document.addEventListener('DOMContentLoaded', function() {
    // 1. Determine Current Page
    var path = window.location.pathname;
    var filename = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
    var current = 'index';
    
    for (var i = 0; i < NAV_ITEMS.length; i++) {
        if (NAV_ITEMS[i].href === filename) { 
            current = NAV_ITEMS[i].id; 
            break; 
        }
    }

    // 2. Render Sidebar
    renderSidebar(current);

    // 3. Mobile Menu Logic
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const pageWrapper = document.querySelector('.page-wrapper');
    const overlay = document.querySelector('.mobile-overlay');

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            pageWrapper.classList.toggle('sidebar-open');
            overlay.classList.toggle('active');
        });
    }
    
    if (overlay) {
        overlay.addEventListener('click', () => {
            pageWrapper.classList.remove('sidebar-open');
            overlay.classList.remove('active');
        });
    }
});
