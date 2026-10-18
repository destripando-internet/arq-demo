// Parada y espera: es repetición continua con k = 1 y ventana 1.

import { goBackN } from './go-back-n.js';

export const stopAndWait = {
  ...goBackN,
  id: 'saw',
  name: 'Parada y espera',
  fixed: true,  // k y W no son configurables
  showBuffer: false,
  defaults: { k: 1, window: 1, count: 3, tProp: 1, timeout: 5 },
  maxWindow: () => 1,
  // Figura stop-and-wait del libro: se pierde el mensaje 1 y luego el 3.er ACK.
  book: { params: { k: 1, window: 1, count: 3, tProp: 1, timeout: 5 }, losses: ['d1.1', 'a3'] },
};
