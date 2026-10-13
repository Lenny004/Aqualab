import baldeBarril from './balde-barril/index.js';
import captacionLluvia from './captacion-lluvia/index.js';

export const scenarios = [baldeBarril, captacionLluvia];
export const getScenario = (id) => scenarios.find((scenario) => scenario.id === id) || scenarios[0];
