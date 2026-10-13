export function getEnabledLayers(layers) {
  return layers.filter((layer) => layer.enabled !== false);
}

export function setLayerEnabled(layers, id, enabled) {
  const layer = layers.find((item) => item.id === id);

  if (layer) {
    layer.enabled = enabled;
  }

  if (!getEnabledLayers(layers).length && layers[0]) {
    layers[0].enabled = true;
  }
}
