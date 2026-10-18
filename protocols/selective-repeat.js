// Selective repeat («repetición selectiva»).
//
// - Ws = Wr ≤ 2^(k−1). Every message has its own timer and, when it expires,
//   only that message is retransmitted.
// - The receiver keeps the out-of-order messages that fall in its window and,
//   once the gap is filled, delivers all the contiguous ones.
// - Individual ACKs (default): every received message, even a duplicate that
//   was already delivered, is confirmed with its number + 1.
// - Cumulative ACKs (option): the receiver always sends the next expected
//   number, so buffered messages are not confirmed until the gap is filled
//   and the sender may retransmit them needlessly.

import { Sender, Receiver } from './arq.js';

const opts = p => ({ ack: p.ack, onTimeout: 'selective', buffer: true });

export const selectiveRepeat = {
  id: 'sr',
  name: 'Selective repeat',
  showBuffer: true,
  showReceiverBuffer: true,
  defaults: { k: 3, window: 4, count: 6, tTrans: 1, tProp: 1, timeout: 7 },
  maxWindow: k => 2 ** (k - 1),
  receiverWindow: W => W,
  ackModes: ['individual', 'cumulative'],
  requiredAck: null,
  createSender: (ctx, p) => new Sender(ctx, p, opts(p)),
  createReceiver: (ctx, p) => new Receiver(ctx, p, opts(p)),
  // Book figure selective-repeat: k = 3, message 2 is lost.
  book: { params: { k: 3, window: 4, count: 6, tTrans: 1, tProp: 1, timeout: 7 }, losses: ['d2.1'] },
};
