// ============================================================================
// Fermat.js | Random Numbers
// (c) Mathigon
// ============================================================================



/** @module random */

import { each, some, tabulate, square, uid } from '@mathigon/core';
import { integrate } from './numeric';


// -----------------------------------------------------------------------------
// Array Shuffle

/**
 * Randomly shuffles the elements in an array a.
 * @param {Array} a
 * @returns {Array}
 */
export function shuffle(a) {
  a = a.slice(0); // create copy
  for (let i = a.length - 1; i > 0; --i) {
    let j = Math.floor(Math.random() * (i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


// -----------------------------------------------------------------------------
// Simple Random Number Generators

/**
 * Generates a random integer between 0 and a, or between a and b.
 * @param {number} a
 * @param {?number} b
 * @returns {number}
 */
export function integer(a, b = null) {
  let start = (b == null ? 0 : a);
  let length = (b == null ? a : b - a + 1);
  return start + Math.floor(length * Math.random());
}

/**
 * Generates an array of the integers from 0 to n in random order.
 * @param {number} n
 * @returns {number[]}
 */
export function intArray(n) {
  let a = [];
  for (let i = 0; i < n; ++i) a.push(i);
  return shuffle(a);
}

const TOTAL_CACHE = new WeakMap();

/**
 * Chooses a random value from weights [2, 5, 3] or { a: 2, b: 5, c: 3 }.
 * @param {Object|Array} obj
 * @returns {*}
 */
export function weighted(obj) {
  let total = 0;

  if (TOTAL_CACHE.has(obj)) {
    total = TOTAL_CACHE.get(obj);
  } else {
    each(obj, function(x) { total += (+x); });
    TOTAL_CACHE.set(obj, total);
  }

  let rand = Math.random() * total;
  let curr = 0;

  return some(obj, function(x, i) {
    curr += obj[i];
    if (rand <= curr) return i;
  });
}


// -----------------------------------------------------------------------------
// Smart Random Number Generators

const SMART_RANDOM_CACHE = new Map();

/**
 * Returns a random number between 0 and n, but avoids returning the same number
 * multiple times in a row.
 * @param {number} n
 * @param {?string} id
 * @returns {number}
 */
export function smart(n, id) {
  if (!id) id = uid();
  if (!SMART_RANDOM_CACHE.has(id)) SMART_RANDOM_CACHE.set(id, tabulate(1, n));

  let cache = SMART_RANDOM_CACHE.get(id);
  let x = weighted(cache.map(x => x * x));

  cache[x] -= 1;
  if (cache[x] <= 0) SMART_RANDOM_CACHE.set(id, cache.map(x => x + 1));

  return x;
}


// -----------------------------------------------------------------------------
// Discrete Distribution

/**
 * Generates a Bernoulli random variable.
 * @param {number} p
 * @returns {number}
 */
export function bernoulli(p = 0.5) {
  p = Math.max(0,Math.min(1,p));
  return (Math.random() < p ? 1 : 0);
}

/**
 * Generates a Binomial random variable.
 * @param {number} n
 * @param {number} p
 * @returns {number}
 */
export function binomial(n = 1, p = 0.5) {
  let t = 0;
  for (let i = 0; i < n; ++i) t += bernoulli(p);
  return t;
}

/**
 * Generates a Poisson random variable.
 * @param {number} l
 * @returns {number}
 */
export function poisson(l = 1) {
  if (l <= 0) return 0;
  let L = Math.exp(-l), p = 1;

  let k = 0;
  for (; p > L; ++k) p *= Math.random();
  return k - 1;
}


// -----------------------------------------------------------------------------
// Continuous Distribution

/**
 * Generates a uniform random variable.
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function uniform(a = 0, b = 1) {
  return a + (b-a) * Math.random();
}

/**
 * Generates a normal random variable with mean m and variance v.
 * @param {number} m
 * @param {number} v
 * @returns {number}
 */
export function normal(m = 0, v = 1) {
  let u1 = Math.random();
  let u2 = Math.random();
  let rand = Math.sqrt( -2 * Math.log(u1) ) * Math.cos( 2 * Math.PI * u2 );

  return rand * Math.sqrt(v) + m;
}

/**
 * Generates an exponential random variable.
 * @param {number} l
 * @returns {number}
 */
export function exponential(l = 1) {
  return l <= 0 ? 0 : -Math.log(Math.random()) / l;
}

/**
 * Generates a geometric random variable.
 * @param {number} p
 * @returns {number}
 */
export function geometric(p = 0.5) {
  if (p <= 0 || p > 1) return null;
  return Math.floor( Math.log(Math.random()) / Math.log(1-p) );
}

/**
 * Generates an Cauchy random variable.
 * @returns {number}
 */
export function cauchy() {
  let rr, v1, v2;
  do {
    v1 = 2 * Math.random() - 1;
    v2 = 2 * Math.random() - 1;
    rr = v1 * v1 + v2 * v2;
  } while (rr >= 1);
  return v1/v2;
}


// -----------------------------------------------------------------------------
// PDFs and CDFs

/**
 * Generates pdf(x) for the normal distribution with mean m and variance v.
 * @param {number} x
 * @param {number} m
 * @param {number} v
 * @returns {number}
 */
export function normalPDF(x, m = 1, v = 0) {
  return Math.exp(-square(x - m) / (2 * v)) / Math.sqrt(2 * Math.PI * v);
}

const G = 7;
const P = [
  0.99999999999980993,
  676.5203681218851,
  -1259.1392167224028,
  771.32342877765313,
  -176.61502916214059,
  12.507343278686905,
  -0.13857109526572012,
  9.9843695780195716e-6,
  1.5056327351493116e-7
];

function gamma(z) {
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));

  z -= 1;
  let x = P[0];
  for (let i = 1; i < G + 2; i++) x += P[i] / (z + i);
  let t = z + G + 0.5;

  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

/**
 * The chi CDF function.
 * @param {number} chi
 * @param {number} deg
 * @returns {number}
 */
export function chiCDF(chi, deg) {
  let int = integrate(t => Math.pow(t, (deg-2)/2) * Math.exp(-t/2), 0, chi);
  return 1 - int / Math.pow(2, deg/2) / gamma(deg/2);
}
