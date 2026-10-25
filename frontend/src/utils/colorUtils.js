/**
 * Consistent project-based color palette generator.
 * Members assigned to the same project will receive the exact same harmonious color scheme.
 */

const PROJECT_PALETTES = [
  {
    bg: '#2563eb', // Blue
    light: 'rgba(37, 99, 235, 0.1)',
    border: 'rgba(37, 99, 235, 0.3)',
    text: '#1d4ed8',
    badge: '#2563eb',
    name: 'Ocean Blue'
  },
  {
    bg: '#0891b2', // Cyan
    light: 'rgba(8, 145, 178, 0.1)',
    border: 'rgba(8, 145, 178, 0.3)',
    text: '#0e7490',
    badge: '#0891b2',
    name: 'Teal Cyan'
  },
  {
    bg: '#7c3aed', // Purple / Violet
    light: 'rgba(124, 58, 237, 0.1)',
    border: 'rgba(124, 58, 237, 0.3)',
    text: '#6d28d9',
    badge: '#7c3aed',
    name: 'Royal Purple'
  },
  {
    bg: '#059669', // Emerald Green
    light: 'rgba(5, 150, 105, 0.1)',
    border: 'rgba(5, 150, 105, 0.3)',
    text: '#047857',
    badge: '#059669',
    name: 'Emerald Green'
  },
  {
    bg: '#d97706', // Amber / Gold
    light: 'rgba(217, 119, 6, 0.1)',
    border: 'rgba(217, 119, 6, 0.3)',
    text: '#b45309',
    badge: '#d97706',
    name: 'Warm Amber'
  },
  {
    bg: '#db2777', // Rose / Pink
    light: 'rgba(219, 39, 119, 0.1)',
    border: 'rgba(219, 39, 119, 0.3)',
    text: '#be185d',
    badge: '#db2777',
    name: 'Vibrant Rose'
  },
  {
    bg: '#4f46e5', // Indigo
    light: 'rgba(79, 70, 229, 0.1)',
    border: 'rgba(79, 70, 229, 0.3)',
    text: '#4338ca',
    badge: '#4f46e5',
    name: 'Deep Indigo'
  }
];

/**
 * Returns a consistent palette for a project ID or project name.
 * All members belonging to the same project will share this color.
 */
export function getProjectTheme(projectId, projectName = '') {
  let seed = 0;
  if (projectId !== undefined && projectId !== null) {
    seed = Math.abs(parseInt(projectId, 10) || 0);
  } else if (projectName) {
    for (let i = 0; i < projectName.length; i++) {
      seed = (seed * 31 + projectName.charCodeAt(i)) & 0xffffffff;
    }
    seed = Math.abs(seed);
  }
  return PROJECT_PALETTES[seed % PROJECT_PALETTES.length];
}
