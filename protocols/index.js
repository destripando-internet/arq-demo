import { stopAndWait } from './stop-and-wait.js';
import { goBackN } from './go-back-n.js';
import { selectiveRepeat } from './selective-repeat.js';

export const PROTOCOLS = [stopAndWait, goBackN, selectiveRepeat];

export const byId = id => PROTOCOLS.find(p => p.id === id) ?? PROTOCOLS[0];
