// views/pages/home.js
import { mainLayout } from "../layouts/mainLayout.js";

export function homePage(user) {
  const content = `
    <div class="hero">
      <h1>Discover Your Future</h1>
      <p>Explore world-class undergraduate and postgraduate programmes. Register your interest to receive updates about open days and application deadlines.</p>
      <div class="hero-buttons">
        <a href="/programmes" class="btn btn-primary">Explore All Programmes</a>
        <a href="/programmes?level=Undergraduate" class="btn btn-secondary">Undergraduate</a>
        <a href="/programmes?level=Postgraduate" class="btn btn-secondary">Postgraduate</a>
      </div>
    </div>
    
    <div class="features">
      <h2>Why Choose Us?</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🎓</div>
          <h3>World-Class Education</h3>
          <p>Learn from leading experts</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">💼</div>
          <h3>Industry Connections</h3>
          <p>Strong links with top employers</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🌍</div>
          <h3>Global Community</h3>
          <p>Students from 100+ countries</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🔬</div>
          <h3>Research Excellence</h3>
          <p>Cutting-edge facilities</p>
        </div>
      </div>
    </div>
  `;
  
  return mainLayout(content, "Home", user);
}