'use strict';
(() => {
  const open = document.getElementById('open');
  const copy = document.getElementById('copy');
  const hint = document.getElementById('hint');
  const error = document.getElementById('err');
  const status = document.getElementById('status');
  let timer;
  let subscription = '';
  let revision = 0;

  function refresh() {
    clearTimeout(timer);
    revision += 1;
    subscription = '';
    open.hidden = copy.hidden = true;
    open.removeAttribute('href');
    error.hidden = true;
    document.getElementById('manual-copy').hidden = true;
    document.getElementById('subscription').value = '';
    document.getElementById('copy-status').textContent = '';
    status.textContent = 'ЖДЁМ ЛИЧНУЮ ССЫЛКУ';
    hint.textContent = 'Открой эту страницу по кнопке «Подключить в 1 клик» в Telegram-боте.';
    const raw = location.hash.slice(1);
    if (!raw) return;
    let url;
    let candidate;
    try {
      // Support both raw URLs and encodeURIComponent URLs without decoding path tokens twice.
      candidate = /^https?:\/\//i.test(raw) ? raw : decodeURIComponent(raw);
      decodeURIComponent(candidate);
      if (!/^https?:\/\//i.test(candidate) || /[\s\u0000-\u001f\u007f"'<>\\]/.test(candidate)) throw new Error('invalid');
      url = new URL(candidate);
      if (!url.hostname || url.username || url.password || !['https:', 'http:'].includes(url.protocol)) throw new Error('invalid');
    } catch {
      status.textContent = 'ССЫЛКА НЕ РАСПОЗНАНА';
      hint.textContent = 'Не удалось прочитать ссылку подписки.';
      error.textContent = 'Вернись в бота и нажми «Подключить в 1 клик» ещё раз. Не редактируй адрес вручную.';
      error.hidden = false;
      return;
    }
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    if (host === 'example.com' || host.endsWith('.example.com')) {
      status.textContent = 'ДЕМОНСТРАЦИОННЫЙ РЕЖИМ';
      hint.textContent = 'Это пример, а не рабочая VPN-подписка.';
      error.textContent = 'Адрес example.com — заглушка. Он не подключит VPN. Запроси действующую ссылку в поддержке бота; импорт демо-ссылки отключён.';
      error.hidden = false;
      return;
    }
    subscription = candidate;
    const deep = 'happ://add/' + subscription;
    open.href = deep;
    open.hidden = copy.hidden = false;
    status.textContent = 'ГОТОВО К ИМПОРТУ';
    hint.textContent = 'Пробуем открыть Happ. Если браузер запросит разрешение, подтверди переход. Это не проверка активности подписки.';
    // The subscription stays client-side; only Happ receives it. Never fetch or log it.
    timer = setTimeout(() => { location.href = deep; }, 400);
  }
  open.addEventListener('click', () => clearTimeout(timer));
  copy.addEventListener('click', async () => {
    if (!subscription) return;
    clearTimeout(timer);
    const current = revision;
    const value = subscription;
    try {
      await navigator.clipboard.writeText(value);
      if (current === revision) document.getElementById('copy-status').textContent = 'Скопировано. В Happ нажми «+» → «Вставить из буфера».';
    } catch {
      if (current !== revision) return;
      document.getElementById('copy-status').textContent = 'Браузер не разрешил копирование. Скопируй ссылку вручную ниже.';
      document.getElementById('manual-copy').hidden = false;
      const field = document.getElementById('subscription');
      field.value = value;
      field.focus();
      field.select();
    }
  });
  window.addEventListener('hashchange', refresh);
  refresh();
})();
