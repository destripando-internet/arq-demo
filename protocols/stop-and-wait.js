// Stop-and-wait («parada y espera»): go-back-N with k = 1 and a window of 1.
// With a single message in flight, cumulative and individual ACKs coincide.

import { goBackN } from './go-back-n.js';

export const stopAndWait = {
  ...goBackN,
  id: 'saw',
  name: 'Stop-and-wait',
  fixed: true,  // k and W cannot be changed
  showBuffer: false,
  defaults: { k: 1, window: 1, count: 3, tTrans: 1, tProp: 1, timeout: 5 },
  maxWindow: () => 1,
  ackModes: ['cumulative'],
  requiredAck: null,
  // Book figure stop-and-wait: message 1 is lost, then the 3rd ACK.
  book: { params: { k: 1, window: 1, count: 3, tTrans: 1, tProp: 1, timeout: 5 }, losses: ['d1.1', 'a3'] },
};
