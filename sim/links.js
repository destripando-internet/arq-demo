// Link presets for the scenario. Real links use the book's example message
// and rate (L = 1000 bytes, R = 10 Mb/s, so Ttrans = 0.8 ms) and differ in
// the propagation delay Tprop = d / v; times in ms. Each one suggests a timer
// a bit longer than its RTT.

export const LINKS = [
  { id: 'figures', name: 'Book figures (a = 1)', tTrans: 1, tProp: 1 },
  { id: 'lan', name: 'LAN, 100 m copper', tTrans: 0.8, tProp: 0.0005, timeout: 1 },
  { id: 'fibre', name: 'Fibre, 1000 km', tTrans: 0.8, tProp: 5, timeout: 15 },
  { id: 'satellite', name: 'Geostationary satellite', tTrans: 0.8, tProp: 250, timeout: 600 },
];

export const linkFor = (tTrans, tProp) =>
  LINKS.find(l => l.tTrans === tTrans && l.tProp === tProp) ?? null;
