(() => {
  const endpoint = 'https://bizpages.org/php/phpmailer_sender_remote_allnews.php';
  for (const form of document.querySelectorAll('[data-pbn-contact]')) {
    const ru = document.documentElement.lang === 'ru';
    const status = form.querySelector('[data-contact-status]');
    const button = form.querySelector('button[type="submit"]');
    let sending = false;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (sending || !form.reportValidity()) return;
      for (const field of form.querySelectorAll('[required]')) {
        field.setCustomValidity(field.value.trim() ? '' : (ru ? 'Заполните это поле.' : 'Please complete this field.'));
        if (!field.reportValidity()) return;
      }
      if (form.elements.company_url.value) return;
      const data = new FormData(form);
      const message = [form.dataset.site + ' contact request', `Language: ${ru ? 'ru' : 'en'}`,
        `Page: ${location.href}`, ...['name', 'email', 'subject'].map(key => `${key}: ${String(data.get(key)).trim()}`),
        '', String(data.get('message')).trim()].join('\n');
      let binary = '';
      for (const byte of new TextEncoder().encode(message)) binary += String.fromCharCode(byte);
      const payload = new URLSearchParams({p: btoa(binary).replaceAll('+', '_myplus_').replaceAll('/', '_myslash_'),
        h: `${form.dataset.prefix}-${Date.now()}`});
      sending = true;
      button.disabled = true;
      status.dataset.state = 'sending';
      status.textContent = ru ? 'Отправка…' : 'Sending…';
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      try {
        const response = await fetch(endpoint, {method: 'POST', mode: 'cors', credentials: 'omit', body: payload, signal: controller.signal});
        const reply = await response.text();
        if (!response.ok || !reply.includes('Mailer Success!')) throw Error('Delivery failed');
        form.reset();
        status.dataset.state = 'success';
        status.textContent = ru ? 'Ваше сообщение отправлено.' : 'Your message has been sent.';
      } catch {
        status.dataset.state = 'error';
        status.textContent = ru ? 'Не удалось отправить сообщение. Текст сохранён в форме. Повторите попытку позже.' : 'The message could not be sent. Your text remains in the form. Please try again later.';
      } finally {
        clearTimeout(timer);
        sending = false;
        button.disabled = false;
        status.focus();
      }
    });
    form.addEventListener('input', event => {
      if (event.target.matches('input,textarea')) event.target.setCustomValidity('');
      if (!sending) status.textContent = '';
    });
  }
})();
