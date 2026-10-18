import { stopAndWait } from './stop-and-wait.js';
import { goBackN } from './go-back-n.js';

export const PROTOCOLS = [stopAndWait, goBackN];

export const byId = id => PROTOCOLS.find(p => p.id === id) ?? PROTOCOLS[0];
