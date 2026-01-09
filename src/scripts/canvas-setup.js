/**
 * Common Canvas Setup Utilities for p5.js Projects
 *
 * Provides helper functions for consistent canvas configuration
 * Note: Requires p5.js to be loaded
 */

/**
 * Creates a canvas inside a specific container
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {string} containerId - Container element ID (default: 'canvas-container')
 * @returns {p5.Renderer} The created canvas
 */
function createCanvasInContainer(width, height, containerId = 'canvas-container') {
    const canvas = createCanvas(width, height);
    const container = document.getElementById(containerId);
    if (container) {
        canvas.parent(containerId);
    }
    return canvas;
}

/**
 * Gets responsive canvas dimensions based on screen size
 * Automatically adjusts for mobile (single column) vs desktop (two column) layout
 * @returns {Object} Object with width and height properties
 */
function getResponsiveCanvasDimensions() {
    const isMobile = window.innerWidth < 768;
    const width = isMobile ? window.innerWidth : window.innerWidth * 0.5;
    const height = isMobile ? window.innerHeight * 0.5 : window.innerHeight;
    return { width, height };
}

/**
 * Gets canvas dimensions based on a specific container element
 * @param {string} containerId - Container element ID
 * @returns {Object} Object with width and height properties
 */
function getContainerDimensions(containerId = 'canvas-container') {
    const container = document.getElementById(containerId);
    if (!container) {
        return { width: windowWidth / 2, height: windowHeight };
    }
    return {
        width: container.offsetWidth,
        height: container.offsetHeight
    };
}
