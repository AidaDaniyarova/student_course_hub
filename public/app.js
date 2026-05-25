// public/js/app.js - Client-side JavaScript

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', function() {
      const navLinks = document.querySelector('.nav-links');
      navLinks.classList.toggle('active');
      const expanded = navLinks.classList.contains('active');
      mobileMenuBtn.setAttribute('aria-expanded', expanded);
    });
  }
  
  // Programme filtering
  const filterBtns = document.querySelectorAll('.filter-btn');
  if (filterBtns.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const level = this.dataset.level;
        if (level === 'all') {
          window.location.href = '/programmes';
        } else {
          window.location.href = `/programmes?level=${level}`;
        }
      });
    });
  }
  
  // Search functionality
  const searchInput = document.getElementById('searchProgrammes');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const searchTerm = this.value;
        window.location.href = `/programmes?search=${encodeURIComponent(searchTerm)}`;
      }, 500);
    });
  }
  
  // Newsletter subscription
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('newsletterEmail').value;
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const result = await response.json();
      const msgDiv = document.getElementById('newsletterMessage');
      if (response.ok) {
        msgDiv.innerHTML = '<div class="alert alert-success">Thank you for subscribing!</div>';
        newsletterForm.reset();
      } else {
        msgDiv.innerHTML = '<div class="alert alert-error">' + (result.error || 'Something went wrong') + '</div>';
      }
    });
  }
});