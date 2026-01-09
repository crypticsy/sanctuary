/**
 * Viewport Height Fix for Mobile Browsers
 *
 * Calculates actual viewport height accounting for browser UI (address bar, etc.)
 * Sets CSS variable --vh that can be used in calc() expressions
 *
 * Usage: Use calc(var(--vh, 1vh) * 100) instead of 100vh in your CSS
 */

function setVH() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Initialize on page load
setVH();

// Update on resize and orientation change
window.addEventListener('resize', setVH);
window.addEventListener('orientationchange', setVH);
