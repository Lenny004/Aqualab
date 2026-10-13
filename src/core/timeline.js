import { clamp } from './metrics.js';

export const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

export function renderTimelineMarkers(element, simulation, progress) {
  let elapsed = 0;
  const markers = [
    { label: 'Entrada', position: 0 },
    ...simulation.filters.map((filter) => {
      elapsed += filter.duration;
      return { label: filter.name, position: elapsed / simulation.totalDuration };
    }),
  ];

  element.innerHTML = markers.map((marker, index) => `<span class="timeline-marker ${progress * simulation.filters.length >= index ? 'is-active' : ''}" style="--marker-position:${marker.position * 100}%">${marker.label}</span>`).join('');
}

export const normalizeProgress = (value) => clamp(Number(value) / 1000);
