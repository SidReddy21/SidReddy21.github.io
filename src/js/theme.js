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

  // set copyright year
  document.addEventListener('DOMContentLoaded', () => {
    const yearElement = document.getElementById('copyright-year');
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }

    // handle email copy to clipboard
    const emailBtn = document.getElementById('email-btn');
    const notification = document.getElementById('copy-notification');
    if (emailBtn && notification) {
      emailBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const email = emailBtn.getAttribute('data-email');
        navigator.clipboard.writeText(email).then(() => {
          notification.classList.add('show');
          setTimeout(() => {
            notification.classList.remove('show');
          }, 2000);
        }).catch(err => {
          console.error('Failed to copy email:', err);
        });
      });
    }
  });
  
  // watch for key presses for light/dark theme
  document.addEventListener('keypress', (e) => {
    const char = e.key.toLowerCase();
    keyBuffer += char;
    
    // only remember the last 7 characters
    if (keyBuffer.length > 7) {
      keyBuffer = keyBuffer.slice(-7);
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
    // did they just type "awesome"?
    else if (keyBuffer.includes('awesome')) {
      toggleAwesome();
      keyBuffer = ''; // clear the buffer after we activate
    }
  });
  
  // awesome mode easter egg - type "awesome" to unlock the rainbow mode
  let awesomeKeyBuffer = '';
  let isAwesome = false;
  let hue = 0;
  let animationFrame = null;

  // detect if we're in dark mode (check the applied theme, not system preference)
  function isDarkMode() {
    const appliedTheme = document.documentElement.getAttribute('data-theme');
    // if a theme is explicitly set, use that
    if (appliedTheme === 'light') {
      return false;
    }
    if (appliedTheme === 'dark') {
      return true;
    }
    // otherwise, fall back to system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  // keep track of the original colors so we can restore them
  let originalColors = null;
  
  // capture the current colors before awesome mode starts
  function captureOriginalColors() {
    if (!originalColors) {
      originalColors = {
        backgroundColor: document.body.style.backgroundColor,
        buttons: [],
        constellationColors: null
      };
      
      // capture button colors
      const buttons = document.querySelectorAll('[data-social]');
      buttons.forEach(btn => {
        originalColors.buttons.push({
          element: btn,
          backgroundColor: btn.style.backgroundColor,
          borderColor: btn.style.borderColor,
          hoverColor: btn.dataset.hoverColor
        });
      });
      
      // capture constellation colors
      if (window.constellationColors) {
        originalColors.constellationColors = {
          BASE_COLOR: { ...window.constellationColors.BASE_COLOR },
          HIGHLIGHT_COLOR: { ...window.constellationColors.HIGHLIGHT_COLOR },
          LINE_COLOR: { ...window.constellationColors.LINE_COLOR },
          EDGE_COLOR: { ...window.constellationColors.EDGE_COLOR }
        };
      }
    }
  }

  // convert hsl color values to rgb
  function hslToRgb(h, s, l) {
    h = h / 360;
    s = s / 100;
    l = l / 100;
    
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  // update all the colors on the page to match the current hue
  function updateColors() {
    const saturation = 70;
    const darkMode = isDarkMode();
    
    // adjust lightness based on dark mode
    const bgLightness = darkMode ? 15 : 85;
    // light mode: buttons at 55% (30% darker than bg for contrast), hover at 45%
    // dark mode: buttons at 65% (50% brighter than bg for contrast), hover at 55%
    const buttonLightness = darkMode ? 65 : 55;
    const buttonHoverLightness = darkMode ? 55 : 45;
    const baseLightness = darkMode ? 35 : 70;
    const highlightLightness = darkMode ? 50 : 60;
    
    // background color
    const bgColor = hslToRgb(hue, saturation, bgLightness);
    document.body.style.backgroundColor = `rgb(${bgColor.r}, ${bgColor.g}, ${bgColor.b})`;
    
    // get all the social buttons
    const buttons = document.querySelectorAll('[data-social]');
    const buttonColor = hslToRgb(hue, saturation, buttonLightness);
    const buttonHoverColor = hslToRgb(hue, saturation, buttonHoverLightness);
    
    buttons.forEach(btn => {
      btn.style.backgroundColor = `rgb(${buttonColor.r}, ${buttonColor.g}, ${buttonColor.b})`;
      btn.style.borderColor = `rgb(${buttonColor.r}, ${buttonColor.g}, ${buttonColor.b})`;
      
      // stash the hover color so we can use it later
      btn.dataset.hoverColor = `rgb(${buttonHoverColor.r}, ${buttonHoverColor.g}, ${buttonHoverColor.b})`;
    });
    
    // update the constellation animation colors too
    if (window.constellationColors) {
      // particle color
      const baseColor = hslToRgb(hue, saturation, baseLightness);
      window.constellationColors.BASE_COLOR = baseColor;
      
      // brighter particle color for highlights
      const highlightColor = hslToRgb(hue, saturation, highlightLightness);
      window.constellationColors.HIGHLIGHT_COLOR = highlightColor;
      
      // color for lines between particles
      const lineColor = hslToRgb(hue, saturation, baseLightness);
      window.constellationColors.LINE_COLOR = lineColor;
      
      // brighter color for edge animations
      const edgeColor = hslToRgb(hue, saturation, highlightLightness);
      window.constellationColors.EDGE_COLOR = edgeColor;
    }
  }

  // put everything back to the original colors
  function restoreColors() {
    if (!originalColors) return;
    
    // restore background
    document.body.style.backgroundColor = originalColors.backgroundColor;
    
    // restore buttons to their original state
    originalColors.buttons.forEach(btn => {
      btn.element.style.backgroundColor = btn.backgroundColor;
      btn.element.style.borderColor = btn.borderColor;
      btn.element.dataset.hoverColor = btn.hoverColor || '';
    });
    
    // restore constellation colors
    if (originalColors.constellationColors && window.constellationColors) {
      window.constellationColors.BASE_COLOR = originalColors.constellationColors.BASE_COLOR;
      window.constellationColors.HIGHLIGHT_COLOR = originalColors.constellationColors.HIGHLIGHT_COLOR;
      window.constellationColors.LINE_COLOR = originalColors.constellationColors.LINE_COLOR;
      window.constellationColors.EDGE_COLOR = originalColors.constellationColors.EDGE_COLOR;
    }
  }

  // animate the hue rotation
  function animate() {
    if (!isAwesome) return;
    
    // cycle through the rainbow
    hue = (hue + 1) % 360;
    updateColors();
    
    animationFrame = requestAnimationFrame(animate);
  }

  // turn rainbow mode on or off
  function toggleAwesome() {
    isAwesome = !isAwesome;
    
    if (isAwesome) {
      captureOriginalColors();
      console.log('AWESOME MODE ACTIVATED');
      animate();
    } else {
      console.log('AWESOME MODE DEACTIVATED');
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
      restoreColors();
    }
  }

  // handle button hover effects during rainbow mode
  document.addEventListener('mouseover', (e) => {
    if (isAwesome && e.target.dataset.social && e.target.dataset.hoverColor) {
      e.target.style.backgroundColor = e.target.dataset.hoverColor;
      e.target.style.borderColor = e.target.dataset.hoverColor;
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (isAwesome && e.target.dataset.social) {
      const saturation = 70;
      const darkMode = isDarkMode();
      const buttonLightness = darkMode ? 65 : 55;
      const buttonColor = hslToRgb(hue, saturation, buttonLightness);
      e.target.style.backgroundColor = `rgb(${buttonColor.r}, ${buttonColor.g}, ${buttonColor.b})`;
      e.target.style.borderColor = `rgb(${buttonColor.r}, ${buttonColor.g}, ${buttonColor.b})`;
    }
  });
})();
