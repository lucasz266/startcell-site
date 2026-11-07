const menuToggle = document.querySelector('#menuToggle');
const mainNav = document.querySelector('#mainNav');

menuToggle?.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
});

mainNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

document.querySelector('#year').textContent = new Date().getFullYear();

const phoneInput = document.querySelector('input[name="phone"]');
phoneInput?.addEventListener('input', () => {
  const digits = phoneInput.value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) phoneInput.value = digits ? `(${digits}` : '';
  else if (digits.length <= 7) phoneInput.value = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  else if (digits.length <= 10) phoneInput.value = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  else phoneInput.value = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
});

const form = document.querySelector('#contactForm');
const status = document.querySelector('#formStatus');
form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  status.textContent = '';
  status.classList.remove('error');
  if (!form.reportValidity()) return;

  const button = form.querySelector('button[type="submit"]');
  const originalText = button.innerHTML;
  button.disabled = true;
  button.textContent = 'Preparando mensagem...';
  // Abre a aba durante o clique do usuário para evitar bloqueio de pop-up após o fetch.
  const whatsappWindow = window.open('about:blank', '_blank');

  try {
    const payload = Object.fromEntries(new FormData(form).entries());
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.message || 'Não foi possível enviar.');

    if (result.whatsappUrl) {
      if (whatsappWindow) {
        whatsappWindow.opener = null;
        whatsappWindow.location.href = result.whatsappUrl;
      } else {
        window.location.href = result.whatsappUrl;
      }
      status.textContent = 'Mensagem preparada! Continue o atendimento na janela do WhatsApp.';
      form.reset();
    } else {
      status.textContent = 'Obrigado!';
    }
  } catch (error) {
    if (whatsappWindow && !whatsappWindow.closed) whatsappWindow.close();
    status.textContent = error.message || 'Não foi possível preparar sua mensagem. Tente pelo botão de WhatsApp.';
    status.classList.add('error');
  } finally {
    button.disabled = false;
    button.innerHTML = originalText;
  }
});
