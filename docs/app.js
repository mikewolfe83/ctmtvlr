'use strict';
(() => {
  // Private Studio is hosted separately; no login credentials are embedded here.
  document.querySelectorAll('[data-studio-link]').forEach(link => {
    const studioUrl = (window.CTM_STUDIO_URL || '').trim();
    if (studioUrl.startsWith('https://')) {
      link.href = studioUrl;
    } else {
      link.addEventListener('click', event => {
        event.preventDefault();
        window.alert('Creator Studio is not connected yet. Set CTM_STUDIO_URL in studio-config.js after deploying your Cloudflare Worker.');
      });
    }
  });

  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#site-nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const opening = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', opening);
      navToggle.setAttribute('aria-expanded', String(opening));
      navToggle.setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation');
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }));
  }

  const search = document.querySelector('#episode-search');
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const cards = [...document.querySelectorAll('.episode-card')];
  const empty = document.querySelector('#episode-empty');
  let currentFilter = 'all';
  function updateCards() {
    const query = (search?.value || '').toLowerCase().trim();
    let shown = 0;
    cards.forEach(card => {
      const correctShow = currentFilter === 'all' || card.dataset.show === currentFilter;
      const correctSearch = !query || (card.dataset.search + ' ' + card.textContent).toLowerCase().includes(query);
      const visible = correctShow && correctSearch;
      card.hidden = !visible;
      // Style must not override the hidden attribute.
      card.style.display = visible ? '' : 'none';
      if (visible) shown++;
    });
    if (empty) empty.hidden = shown > 0;
  }
  filterButtons.forEach(button => button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach(b => {
      const active = b === button;
      b.classList.toggle('is-selected', active);
      b.setAttribute('aria-pressed', String(active));
    });
    updateCards();
  }));
  search?.addEventListener('input', updateCards);

  const spotlightItems = [
    {title: 'WHAT DOES IT REALLY TAKE TO <em>WIN IN LIFE?</em>', summary: 'Success is more than a highlight reel. Explore the decisions, discipline, and mindset behind meaningful progress.'},
    {title: 'TALENT OR WORK ETHIC: <em>WHAT WINS GAMES?</em>', summary: 'A CTM Sports debate on preparation, natural ability, consistency, and the competitive edge.'},
    {title: 'IS YOUR ENVIRONMENT <em>SHAPING YOUR FUTURE?</em>', summary: 'A conversation about peer pressure, choices, personal accountability, and the next generation.'}
  ];
  let index = 0;
  const spotlightTitle = document.querySelector('#spotlight-title');
  const spotlightSummary = document.querySelector('#spotlight-summary');
  const spotlightPosition = document.querySelector('#spotlight-position');
  function changeSpotlight(direction) {
    index = (index + direction + spotlightItems.length) % spotlightItems.length;
    spotlightTitle.innerHTML = spotlightItems[index].title; // All strings are local, hardcoded design content.
    spotlightSummary.textContent = spotlightItems[index].summary;
    spotlightPosition.textContent = `${String(index+1).padStart(2,'0')} / ${String(spotlightItems.length).padStart(2,'0')}`;
  }
  document.querySelector('#spotlight-prev')?.addEventListener('click', () => changeSpotlight(-1));
  document.querySelector('#spotlight-next')?.addEventListener('click', () => changeSpotlight(1));
  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
