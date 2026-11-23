/* newspectrum.org — header behavior: stuck shadow + language dropdown */
(function () {
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 6);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  var lang = document.querySelector('.lang');
  if (lang) {
    var toggle = lang.querySelector('.lang-toggle');
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = lang.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function () {
      lang.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        lang.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
})();


/* PBN_FRONTEND_CAPTCHA_V1: browser-only spam checks; direct requests can bypass these. */
;(() => {
  if (window.__pbnCaptchaV1) return;
  window.__pbnCaptchaV1 = true;
  const style = document.createElement('style');
  style.textContent = '.pbn-captcha{position:relative;min-width:0;margin:1rem 0;padding:1rem;border:1px solid #89939e;border-radius:4px}.pbn-captcha legend{padding:0 .35rem;font-weight:700}.pbn-captcha .pbn-captcha-trap{position:absolute!important;left:-10000px!important;width:1px!important;height:1px!important;overflow:hidden!important}.pbn-captcha-row{display:flex;align-items:center;gap:.75rem;flex-wrap:wrap}.pbn-captcha .pbn-captcha-answer{box-sizing:border-box;width:6rem;max-width:100%;margin:0}.pbn-captcha [type=button]{font:inherit;padding:.55rem .75rem;white-space:normal}.pbn-captcha small{display:block;margin-top:.5rem}.pbn-captcha-status{margin:.5rem 0 0}.pbn-captcha-status:empty{display:none}';
  document.head.append(style);
  function init() {
    document.querySelectorAll('form').forEach((form, index) => {
      if (form.dataset.pbnCaptcha || !form.querySelector('textarea[name="message"],textarea[name="comment"],textarea[name="text"]') || !form.querySelector('input[type="email"],input[name="email"]')) return;
      const submit = form.querySelector('button[type="submit"],button:not([type]),input[type="submit"]');
      if (!submit) return;
      form.dataset.pbnCaptcha = '1';
      const ru = (form.dataset.language || form.dataset.lang || document.documentElement.lang || '').startsWith('ru');
      const t = ru ? {
        title:'Проверка перед отправкой', question:'Сколько будет', refresh:'Другой пример', hint:'Введите ответ цифрами.',
        wrong:'Неверный ответ. Попробуйте ещё раз.', fast:'Подождите несколько секунд перед отправкой.', blocked:'Проверка не пройдена. Перезагрузите страницу и попробуйте снова.'
      } : {
        title:'Before you send', question:'What is', refresh:'New question', hint:'Enter the answer as a number.',
        wrong:'Incorrect answer. Please try again.', fast:'Please wait a few seconds before sending.', blocked:'Verification failed. Reload the page and try again.'
      };
      const box = document.createElement('fieldset');box.className='pbn-captcha';
      const id=`pbn-captcha-${index}`;
      box.innerHTML=`<legend>${t.title}</legend><label class="pbn-captcha-trap" aria-hidden="true">Company website<input type="text" name="pbn_company_website" tabindex="-1" autocomplete="off"></label><label for="${id}"></label><div class="pbn-captcha-row"><input class="pbn-captcha-answer" id="${id}" type="text" inputmode="numeric" pattern="[0-9]+" autocomplete="off" required aria-describedby="${id}-hint ${id}-status"><input type="button" value="${t.refresh}"></div><small id="${id}-hint">${t.hint}</small><p class="pbn-captcha-status" id="${id}-status" role="status" aria-live="polite"></p>`;
      // Keep the original status element first for existing handlers using [role=status].
      form.append(box);
      submit.before(box);
      const originalStatus=form.querySelector('[role="status"]:not(.pbn-captcha-status)');
      if (!originalStatus) { const status=document.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');form.insertBefore(status,box); }
      else box.querySelector('[role=status]').removeAttribute('role');
      const answer=box.querySelector('.pbn-captcha-answer'), trap=box.querySelector('[name=pbn_company_website]'), status=box.querySelector('.pbn-captcha-status');
      let expected, started=performance.now();
      function refresh() {
        const values=crypto.getRandomValues(new Uint32Array(2)), a=values[0]%9+1, b=values[1]%9+1;expected=a+b;
        box.querySelector(`label[for="${id}"]`).textContent=`${t.question} ${a} + ${b}?`;
        answer.value='';answer.setCustomValidity('');status.textContent='';
      }
      refresh();
      answer.addEventListener('input',()=>{answer.setCustomValidity('');status.textContent='';});
      box.querySelector('[type=button]').addEventListener('click',()=>{refresh();answer.focus();});
      form.addEventListener('reset',()=>queueMicrotask(()=>{started=performance.now();refresh();}));
      form.addEventListener('submit',event=>{
        let error='';
        if(trap.value.trim()) error=t.blocked;
        else if(performance.now()-started<4000) error=t.fast;
        else if(!/^[0-9]+$/.test(answer.value.trim())||Number(answer.value.trim())!==expected){error=t.wrong;answer.setCustomValidity(error);}
        if(error){event.preventDefault();event.stopImmediatePropagation();status.textContent=error;answer.focus();if(error===t.wrong)answer.reportValidity();return;}
        if(!form.reportValidity()){event.preventDefault();event.stopImmediatePropagation();return;}
        status.textContent='';
        if(form.querySelector('textarea[name="comment"]')) queueMicrotask(()=>{started=performance.now();refresh();});
      },true);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
/* END_PBN_FRONTEND_CAPTCHA_V1 */
