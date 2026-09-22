export const selectedGroups = {
 reading: ['map-choice-lab', 'earth-evidence-grid', 'climate-chart'],
 process: ['mountain-rain-shadow', 'water-transfer', 'karez-water-budget'],
 decisions: ['settlement-location', 'polar-station', 'factory-location', 'china-route-designer'],
} as const;
export const selectedSlugs: readonly string[] = Object.values(selectedGroups).flat();
