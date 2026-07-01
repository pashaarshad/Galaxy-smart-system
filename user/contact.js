/**
 * GALAXY SMART SYSTEM – contact.js
 * Contact form with validation and API submission
 */

import { showToast } from '../assets/js/animations.js';
import { sendMessage } from '../firebase/firestore.js';

export function initContact() {
  const section = document.getElementById('contact');
  if (!section) return;

  section.innerHTML = `
    <div class="container">
      <div class="section-header reveal">
        <span class="section-label">Get In Touch</span>
        <h2 class="section-title">Let's Build Something Great</h2>
        <p class="section-desc">Have a project in mind? We'd love to hear from you. Reach out and let's start a conversation.</p>
      </div>

      <div class="contact-grid">

        <div class="contact-info reveal-left">
          <h3>We're Ready to Help</h3>
          <p>Whether you need a new digital platform, want to scale your existing one, or are exploring what's possible — our team is here to guide you every step of the way.</p>

          <div class="contact-links">
            <div class="contact-link">
              <div class="contact-link-icon">📧</div>
              <span>hello@galaxysmartsystem.com</span>
            </div>
            <div class="contact-link">
              <div class="contact-link-icon">📞</div>
              <span>+91 98765 00000</span>
            </div>
            <div class="contact-link">
              <div class="contact-link-icon">📍</div>
              <span>Galaxy Tech Hub, India</span>
            </div>
            <div class="contact-link">
              <div class="contact-link-icon">⏰</div>
              <span>Mon – Sat, 9AM – 7PM IST</span>
            </div>
          </div>
        </div>

        <div class="contact-form reveal-right">
          <form id="contact-form" novalidate>

            <div class="form-group" id="fg-name">
              <label for="cf-name">Full Name</label>
              <input type="text" id="cf-name" name="name" placeholder="John Smith" autocomplete="name">
              <span class="error-msg">Please enter your name.</span>
            </div>

            <div class="form-group" id="fg-email">
              <label for="cf-email">Email Address</label>
              <input type="email" id="cf-email" name="email" placeholder="john@example.com" autocomplete="email">
              <span class="error-msg">Please enter a valid email.</span>
            </div>

            <div class="form-group" id="fg-message">
              <label for="cf-message">Message</label>
              <textarea id="cf-message" name="message" placeholder="Tell us about your project…"></textarea>
              <span class="error-msg">Please enter your message.</span>
            </div>

            <button type="submit" class="btn btn-primary btn-submit" id="cf-submit">
              <span id="cf-btn-text">Send Message</span>
              <span id="cf-btn-spinner" style="display:none;" class="spinner"></span>
            </button>

          </form>
        </div>

      </div>
    </div>
  `;

  document.getElementById('contact-form').addEventListener('submit', handleSubmit);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setError(groupId, show) {
  const g = document.getElementById(groupId);
  if (!g) return;
  g.classList.toggle('has-error', show);
  const inp = g.querySelector('input, textarea');
  if (inp) inp.classList.toggle('error', show);
}

async function handleSubmit(e) {
  e.preventDefault();

  const nameEl = document.getElementById('cf-name');
  const emailEl = document.getElementById('cf-email');
  const msgEl = document.getElementById('cf-message');
  const submitBtn = document.getElementById('cf-submit');
  const btnText = document.getElementById('cf-btn-text');
  const spinner = document.getElementById('cf-btn-spinner');

  const name = nameEl.value.trim();
  const email = emailEl.value.trim();
  const message = msgEl.value.trim();

  // Validate
  let valid = true;
  setError('fg-name', !name); if (!name) valid = false;
  setError('fg-email', !validateEmail(email)); if (!validateEmail(email)) valid = false;
  setError('fg-message', !message); if (!message) valid = false;

  if (!valid) return;

  // Loading state
  submitBtn.disabled = true;
  btnText.style.display = 'none';
  spinner.style.display = 'inline-block';

  try {
    await sendMessage({
      name,
      email,
      message
    });

    showToast('✅ Message sent! We\'ll get back to you soon.', 'success');
    nameEl.value = '';
    emailEl.value = '';
    msgEl.value = '';
  } catch (error) {
    console.error('Submission error:', error);
    showToast('⚠️ Error sending message. Please try again later.', 'error');
  } finally {
    submitBtn.disabled = false;
    btnText.style.display = 'inline';
    spinner.style.display = 'none';
  }
}
