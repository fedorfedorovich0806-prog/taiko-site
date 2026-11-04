'use strict';
const platforms = {
  ios: ['Happ для iPhone и iPad', 'Установи приложение из App Store, затем вернись в бота за своей ссылкой.', 'Скачать в App Store ↗', 'https://apps.apple.com/us/app/happ-proxy-utility/id6504287215'],
  android: ['Happ для Android', 'Установи приложение из Google Play. Добавь подписку из бота и разреши VPN-подключение.', 'Скачать в Google Play ↗', 'https://play.google.com/store/apps/details?id=com.happproxy'],
  windows: ['Happ для Windows', 'Скачай установщик x64 из официального репозитория Happ. Установи приложение и добавь подписку.', 'Скачать для Windows ↗', 'https://github.com/Happ-proxy/happ-desktop/releases/latest/download/setup-Happ.x64.exe'],
  macos: ['Happ для macOS', 'Скачай универсальный установщик из репозитория Happ, открой DMG и установи приложение.', 'Скачать для macOS ↗', 'https://github.com/Happ-proxy/happ-desktop/releases/latest/download/Happ.macOS.universal.dmg']
};
document.querySelectorAll('[data-platform]').forEach(button => {
  button.addEventListener('click', () => {
    const entry = platforms[button.dataset.platform];
    document.querySelectorAll('[data-platform]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.getElementById('platform-title').textContent = entry[0];
    document.getElementById('platform-note').textContent = entry[1];
    const download = document.getElementById('download');
    download.textContent = entry[2];
    download.href = entry[3];
  });
});
const invite = new URLSearchParams(location.search).get('invite');
const go = document.getElementById('go');
if (go && invite && /^\d{1,20}$/.test(invite)) {
  const telegram = 'https://t.me/taikovpnbot?start=ref_' + invite;
  go.href = telegram;
  document.getElementById('msg').textContent = 'Открываем Telegram по приглашению… Если переход не произошёл, нажми кнопку выше.';
  setTimeout(() => location.replace(telegram), 250);
}
