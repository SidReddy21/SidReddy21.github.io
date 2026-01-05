(() => {
  // type "light" or "dark" to toggle theme
  let keyBuffer = '';
  
  // get the saved theme preference or use system preference
  function getSavedTheme() {
    return localStorage.getItem('theme-preference');
  }
  
  // apply the theme
  function applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.style.colorScheme = 'light';
      document.documentElement.setAttribute('data-theme', 'light');
    } else if (theme === 'dark') {
      document.documentElement.style.colorScheme = 'dark';
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      // auto - use system preference
      document.documentElement.style.colorScheme = 'normal';
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('theme-preference', theme);
  }
  
  // initialize theme on page load
  const savedTheme = getSavedTheme();
  if (savedTheme) {
    applyTheme(savedTheme);
  }
  
  // watch for key presses
  document.addEventListener('keypress', (e) => {
    const char = e.key.toLowerCase();
    keyBuffer += char;
    
    // only remember the last 5 characters
    if (keyBuffer.length > 5) {
      keyBuffer = keyBuffer.slice(-5);
    }
    
    // did they just type "light"?
    if (keyBuffer.includes('light')) {
      applyTheme('light');
      console.log('Light mode activated');
      keyBuffer = ''; // clear the buffer after we activate
    }
    // did they just type "dark"?
    else if (keyBuffer.includes('dark')) {
      applyTheme('dark');
      console.log('Dark mode activated');
      keyBuffer = ''; // clear the buffer after we activate
    }
  });
})();
