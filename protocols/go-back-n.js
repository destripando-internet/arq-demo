// Go-back-N («repetición continua»).
//
// - The sender keeps up to Ws ≤ 2^k − 1 unconfirmed messages, each with its
//   own timer. When one expires, it retransmits that message and every later
//   one already sent (it «goes back N»).
// - The receiver only accepts the expected message (Wr = 1); it discards the
//   rest and confirms the last in-order one again (duplicate ACKs).
// - ACKs must be cumulative: ACK n confirms every message before n. The
//   individual option exists to show why: the receiver answers every
//   retransmission with the next expected number, so if the ACK of a message
//   is lost, that message is never confirmed and the sender retransmits it
//   forever. Individual ACKs would need a receiver that recognises
//   duplicates and confirms each one, and telling duplicates from
//   out-of-order messages limits the window to 2^(k−1), as in selective
//   repeat.

import { Sender, Receiver } from './arq.js';

const opts = p => ({ ack: p.ack, onTimeout: 'go-back', buffer: false });

export const goBackN = {
  id: 'gbn',
  name: 'Go-back-N',
  showBuffer: true,
  defaults: { k: 2, window: 3, count: 4, tTrans: 1, tProp: 1, timeout: 6 },
  maxWindow: k => 2 ** k - 1,
  receiverWindow: () => 1,
  ackModes: ['cumulative', 'individual'],
  requiredAck: 'cumulative',
  createSender: (ctx, p) => new Sender(ctx, p, opts(p)),
  createReceiver: (ctx, p) => new Receiver(ctx, p, opts(p)),
  // Book figure go-back-n: k = 2, message 1 is lost.
  book: { params: { k: 2, window: 3, count: 4, tTrans: 1, tProp: 1, timeout: 6 }, losses: ['d1.1'] },
};
