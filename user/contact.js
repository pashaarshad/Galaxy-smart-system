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
              <div class="contact-link-icon"><svg class="contact-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
              <span>hello@galaxysmartsystem.com</span>
            </div>
            <div class="contact-link">
              <div class="contact-link-icon"><svg class="contact-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
              <span>+91 98765 00000</span>
            </div>
            <div class="contact-link">
              <div class="contact-link-icon"><svg class="contact-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
              <span>Galaxy Tech Hub, India</span>
            </div>
            <div class="contact-link">
              <div class="contact-link-icon"><svg class="contact-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
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
