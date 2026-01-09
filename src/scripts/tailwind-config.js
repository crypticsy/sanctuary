/**
 * Tailwind CSS Configuration
 *
 * Extends Tailwind with custom font families
 * Note: This file requires Tailwind CSS to be loaded via CDN
 */

tailwind.config = {
    theme: {
        extend: {
            fontFamily: {
                'comfortaa-light': ['comfortaa_l', 'sans-serif'],
                'comfortaa-bold': ['comfortaa_b', 'sans-serif'],
                'retro': ['retro_text', 'monospace'],
                'typo': ['typo', 'sans-serif'],
                'randc': ['rAndC', 'sans-serif'],
            }
        }
    }
};
