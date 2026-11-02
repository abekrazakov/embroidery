/* =========================================================================
   Bek Collective Embroidery Studio · small enhancements
   1. Live lettering preview in the inquiry form
   2. Inquiry submission (form service or preview mode)
   3. Footer year
   The page reads fine without JavaScript; only these extras depend on it.
   ========================================================================= */
(() => {
  'use strict';

  /* ---------- 3. Footer year ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  const form = document.getElementById('inquiry-form');
  if (!form) return;

  /* ---------- 1. Live lettering preview ---------- */
  const preview = document.getElementById('preview-text');
  const textInput = form.elements.custom_text;
  const PREVIEW_FALLBACK = 'Juniper';
  const STYLE_CLASSES = {
    'Modern Script': 'font-script',
    'Modern Block': 'font-block',
    'Tailored Serif': 'font-serif'
  };

  function updatePreview() {
    const style = form.elements.lettering.value;
    const thread = form.querySelector('input[name="thread"]:checked');

    preview.textContent = textInput.value.trim() || PREVIEW_FALLBACK;
    preview.className = 'stitch-preview__text ' + (STYLE_CLASSES[style] || 'font-script');
    if (thread) preview.style.setProperty('--thread', thread.dataset.color);
  }

  form.addEventListener('input', updatePreview);
  form.addEventListener('change', updatePreview);
  updatePreview();

  /* ---------- 2. Inquiry submission ----------
     Set data-endpoint on the <form> to the Google Apps Script web app URL
     (see docs/form-setup.md), e.g.
       <form id="inquiry-form" data-endpoint="https://script.google.com/macros/s/…/exec">
     Any service that accepts a standard form post (such as Formspree) also works.
     Without an endpoint the form runs in preview mode: it shows the
     confirmation panel but sends nothing. */
  const thanks = document.getElementById('inquiry-thanks');
  const thanksTitle = document.getElementById('thanks-title');
  const thanksMessage = document.getElementById('thanks-message');
  const errorBox = document.getElementById('form-error');
  const submitButton = form.querySelector('button[type="submit"]');
  const againButton = document.getElementById('inquiry-again');

  function showThanks(firstName, previewOnly) {
    thanksTitle.textContent = firstName ? `Thank you, ${firstName}.` : 'Thank you.';
    thanksMessage.textContent = previewOnly
      ? 'This form is in preview mode, so nothing was sent. Connect a form service to start receiving inquiries.'
      : 'Your inquiry is on its way. We will reply by email with a stitch proof and a quote.';
    form.hidden = true;
    thanks.hidden = false;
    thanks.focus();
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.hidden = true;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const firstName = form.elements.name.value.trim().split(/\s+/)[0];
    const endpoint = form.dataset.endpoint;

    if (!endpoint) {
      showThanks(firstName, true);
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Sending…';

    try {
      // Sent as a standard URL-encoded form post, which Apps Script reads
      // directly and which needs no cross-site preflight request.
      const response = await fetch(endpoint, {
        method: 'POST',
        body: new URLSearchParams(new FormData(form)),
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

      const result = await response.json().catch(() => ({}));
      if (result.result === 'error') throw new Error(result.error || 'Submission rejected');
      showThanks(firstName, false);
    } catch (error) {
      errorBox.textContent = 'Your inquiry could not be sent. Check your connection and try again, or email us at hello@bekcollective.com.';
      errorBox.hidden = false;
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Send inquiry';
    }
  });

  againButton.addEventListener('click', () => {
    form.reset();
    updatePreview();
    thanks.hidden = true;
    form.hidden = false;
    form.elements.name.focus();
  });
})();
