import baldeBarril from './balde-barril/index.js';

export const scenarios = [baldeBarril];
export const getScenario = (id) => scenarios.find((scenario) => scenario.id === id) || scenarios[0];
