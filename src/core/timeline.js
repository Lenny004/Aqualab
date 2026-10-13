import { clamp } from './metrics.js';

export const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

function getMarkers(simulation) {
  let elapsed = 0;
  return [
    { label: 'Entrada', position: 0 },
    ...simulation.filters.map((filter) => {
      elapsed += filter.duration;
      return { label: filter.name, position: elapsed / simulation.totalDuration };
    }),
  ];
}

export function renderTimelineMarkers(element, simulation) {
  const markers = getMarkers(simulation);
  element.replaceChildren(...markers.map((marker) => {
    const node = document.createElement('span');
    node.className = 'timeline-marker';
    node.style.setProperty('--marker-position', `${marker.position * 100}%`);
    node.textContent = marker.label;
    return node;
  }));
  element._timelineMarkers = markers.map((marker, index) => ({ node: element.children[index], position: marker.position }));
}

export function updateTimelineMarkers(element, progress) {
  element._timelineMarkers?.forEach(({ node, position }) => {
    node.classList.toggle('is-active', position <= progress);
  });
}

export const normalizeProgress = (value) => clamp(Number(value) / 1000);
