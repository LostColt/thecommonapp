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
    var sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    var navHtml = '';
    for (var i = 0; i < NAV_ITEMS.length; i++) {
        var item = NAV_ITEMS[i];
        var isActive = item.id === currentPage;
        navHtml += '<li class="' + (isActive ? 'active' : '') + '">';
        navHtml += '<a href="' + item.href + '" class="' + (isActive ? 'active' : '') + '">' + item.label + '</a></li>';
    }
    sidebar.innerHTML = '<div class="sidebar-brand"><h1>Gulliver<br>Prep</h1><div class="sidebar-brand-divider"></div><p class="sidebar-brand-subtitle">College Essay</p><p class="sidebar-brand-subtitle">Guide 2026-27</p></div><ul class="sidebar-nav">' + navHtml + '</ul><div class="sidebar-footer"><p class="sidebar-footer-name">David Tran</p><p class="sidebar-footer-title">College Essay Writing Coach</p><a href="mailto:dtran@gulliverprep.org" class="sidebar-footer-email">dtran@gulliverprep.org</a></div>';
}

function initProgressBar() {
    var fill = document.querySelector('.progress-bar-fill');
    if (!fill) return;
    window.addEventListener('scroll', function() {
        var scrollTop = window.scrollY;
        var docHeight = document.documentElement.scrollHeight - window.innerHeight;
        fill.style.width = docHeight > 0 ? (scrollTop / docHeight) * 100 + '%' : '0%';
    });
}

function initMobileMenu() {
    var btn = document.querySelector('.mobile-menu-btn');
    var sidebar = document.querySelector('.sidebar');
    var overlay = document.querySelector('.mobile-overlay');
    if (!btn || !sidebar) return;
    btn.addEventListener('click', function() {
        sidebar.classList.toggle('mobile-open');
        if (overlay) overlay.classList.toggle('active');
    });
    if (overlay) overlay.addEventListener('click', function() {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
    });
}

// =========================================================================
// NEW CODE: DYNAMIC CONTENT LOADER AND FOCUS CAROUSEL LOGIC
// =========================================================================

// *** REPLACE THIS PLACEHOLDER WITH YOUR ACTUAL RAW GITHUB URL ***
const SLIDE_CONTENT_URL = 'https://raw.githubusercontent.com/YourUsername/YourRepo/main/slides.html'; 

function setupFocusCarousel() {
    const slides = document.querySelectorAll('#sixMovesSlides .slide');
    const container = document.querySelector('.slide-deck-container');

    if (!slides.length || !container) return; 

    // Intersection Observer configuration for centering the focus
    const options = {
        root: container,
        threshold: 0.5,
        rootMargin: '0px -40% 0px -40%' 
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const slide = entry.target;
            if (entry.isIntersecting) {
                slide.classList.add('is-focused');
            } else {
                slide.classList.remove('is-focused');
            }
        });
    }, options);

    slides.forEach(slide => {
        observer.observe(slide);
    });
}

function loadSlideContent() {
    const contentContainer = document.getElementById('slideDeckWrapper');

    if (!contentContainer) {
        console.warn("Target container #slideDeckWrapper not found. Cannot load slides.");
        return;
    }

    fetch(SLIDE_CONTENT_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(htmlContent => {
            // 1. Inject the fetched HTML content
            contentContainer.innerHTML = htmlContent;
            
            // 2. Initialize the carousel ONLY after the HTML is in the DOM
            setupFocusCarousel();
        })
        .catch(error => {
            console.error('Failed to load slide content from GitHub:', error);
            contentContainer.innerHTML = '<p class="callout" style="color:red;">Error loading content. Please check the GitHub URL and network connection.</p>';
        });
}


// --- DOCUMENT READY HANDLER ---

document.addEventListener('DOMContentLoaded', function() {
    var path = window.location.pathname;
    var filename = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
    var current = 'index';
    for (var i = 0; i < NAV_ITEMS.length; i++) {
        if (NAV_ITEMS[i].href === filename) { current = NAV_ITEMS[i].id; break; }
    }
    renderSidebar(current);
    initProgressBar();
    initMobileMenu();
    
    // Call the function to load and initialize the slides
    loadSlideContent(); 
});
