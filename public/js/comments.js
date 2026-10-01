/* comment form: no network send, moderation notice only */
document.querySelectorAll('.comment-form').forEach(function (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    alert(form.dataset.lang === 'ru' ? 'Ваш комментарий на модерации' : 'Your comment is awaiting moderation');
    form.reset();
  });
});
