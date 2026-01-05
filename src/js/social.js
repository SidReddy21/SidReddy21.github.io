(() => {
  const socials = {
    github: {
      href: 'https://github.com/sidreddy21',
      target: '_blank',
    },
    linkedin: {
      href: 'https://www.linkedin.com/in/sid~reddy/',
      target: '_blank',
    },
    email: {
      href: 'mailto:sidreddy21@gmail.com',
      target: '_self',
    },
  };

  const elements = document.querySelectorAll('[data-social]');
  elements.forEach((el) => {
    const key = el.getAttribute('data-social');
    const meta = socials[key];
    if (!meta) return;

    // make sure we have href and target attributes set
    el.setAttribute('href', meta.href);
    if (meta.target) el.setAttribute('target', meta.target);
    el.setAttribute('rel', 'noreferrer');
    el.setAttribute('aria-label', key);
    el.style.cursor = 'pointer';

    // handle clicks the same way whether it's a link or button
    el.addEventListener('click', (event) => {
      event.preventDefault();
      const target = meta.target || '_self';
      if (target === '_self') {
        window.location.href = meta.href;
      } else {
        window.open(meta.href, target);
      }
    });
  });
})();
