/**
 * Projects Loader
 * Dynamically loads and renders project cards from JSON data
 */

// Color mapping for Gruvbox theme
const colorClasses = {
    'yellow': 'hover:border-gruvbox-yellow hover:shadow-gruvbox-yellow/20',
    'yellow-bright': 'hover:border-gruvbox-yellow-bright hover:shadow-gruvbox-yellow-bright/20',
    'green': 'hover:border-gruvbox-green hover:shadow-gruvbox-green/20',
    'blue': 'hover:border-gruvbox-blue hover:shadow-gruvbox-blue/20',
    'orange': 'hover:border-gruvbox-orange hover:shadow-gruvbox-orange/20',
    'red': 'hover:border-gruvbox-red hover:shadow-gruvbox-red/20',
    'purple': 'hover:border-gruvbox-purple hover:shadow-gruvbox-purple/20'
};

/**
 * Creates a project card element
 */
function createProjectCard(project, index) {
    const card = document.createElement('div');

    const colorClass = colorClasses[project.color] || colorClasses['yellow'];

    // All cards now have content-based height
    card.className = `project-card group bg-gruvbox-bg-soft rounded-2xl overflow-hidden transition-all duration-500 ease-out hover:-translate-y-3 shadow-lg border-2 border-transparent ${colorClass} relative`;

    card.innerHTML = `
        <a href="${project.link}" class="no-underline text-inherit block h-full flex flex-col">
            <div class="relative overflow-hidden flex-shrink-0">
                <img
                    src="${project.image}"
                    alt="${project.name} Preview"
                    class="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-gruvbox-bg via-transparent to-transparent opacity-60"></div>
            </div>

            <div class="p-5 md:p-6 flex flex-col">
                <div class="flex items-start justify-between mb-3">
                    <h2 class="text-gruvbox-fg font-comfortaa-bold text-base md:text-lg leading-tight group-hover:text-gruvbox-${project.color} transition-colors">
                        ${project.name}
                    </h2>
                    <svg class="w-5 h-5 text-gruvbox-${project.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                </div>

                <p class="text-gruvbox-fg-gray text-justify font-comfortaa-light text-xs md:text-sm mb-4" style="line-height: 1.9;">
                    ${project.description}
                </p>

                ${project.featured ? '<div class="mt-auto inline-flex items-center gap-2 text-gruvbox-yellow text-xs font-comfortaa-bold"><span class="w-2 h-2 bg-gruvbox-yellow rounded-full animate-pulse"></span>Featured</div>' : ''}
            </div>
        </a>
    `;

    return card;
}

/**
 * Loads projects from JSON and renders them
 */
async function loadProjects() {
    try {
        const response = await fetch('./assets/data/projects.json');
        const data = await response.json();

        const container = document.getElementById('projects-grid');
        if (!container) {
            console.error('Projects grid container not found');
            return;
        }

        // Clear loading state
        container.innerHTML = '';

        // Render all projects
        data.projects.forEach((project, index) => {
            const card = createProjectCard(project, index);
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading projects:', error);
        const container = document.getElementById('projects-grid');
        if (container) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <p class="text-gruvbox-red text-lg font-comfortaa-bold mb-2">Failed to load projects</p>
                    <p class="text-gruvbox-fg-gray text-sm">Please refresh the page or check your connection.</p>
                </div>
            `;
        }
    }
}

// Load projects when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProjects);
} else {
    loadProjects();
}
