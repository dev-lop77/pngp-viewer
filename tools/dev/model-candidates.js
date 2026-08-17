// The bench for the high-resolution flora and fauna models: each subject as it
// SHIPS at Standard beside how it ships at High (2026-08-17).
//
// The user's framing from 2026-08-13 holds: "modelli ad alta risoluzione come opzione
// da alzare, non come nuovo default", and both levels ship, so nothing here is a
// candidate any more - it is a bench for looking at what was accepted, and for judging
// the next change to either model against the current one.
//
// EVERY MODEL IS IMPORTED, NONE IS DECLARED HERE. It briefly held its own copy of the
// five accepted animals and the accepted tree, which is 400 lines that would have
// drifted from the shipped ones the first time either was retuned - the same trap the
// shared treeLattice() exists to avoid. Only `treeCurrent` is local, and only because
// the standard tree is three lines assembled inside createVegetation() from constants
// this file already imports.
//
// WHAT WAS TRIED AND REJECTED, so it is not re-proposed as new:
//
//   Roundness on the animals - higher segment counts plus smooth normals, no new
//   parts. Drawn and shown; it read as an inflated loaf rather than a finer animal,
//   because these are merged primitives and a smooth-shaded capsule is a pillow. Worse
//   than what ships. The accepted axis is ANATOMY: parts the model did not have, of
//   which the most effective costs no triangles at all (scaling the body on X, because
//   a capsule's cross-section is a circle and a real ungulate is narrow across the
//   chest).
//
//   A 5-tier tree with drooping skirts - the user's words were that it "vira su
//   pagoda", and the inverted skirts read as dark bands. And a smooth 16-sided cone,
//   which stays a cone. The accepted tree is 3 tiers on a visible trunk, 41 triangles.
//
// HOW MUCH each animal got was decided by measurement, not evenly: alertM is not the
// floor it looks like, since the player walks at 4 m/s and every one of these flees
// slower, so at 4 m they stand 269, 209, 104, 62 and 38 px tall. Chamois and fox took
// the full pass; marmot and squirrel only what survives 38-62 px.
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { MODEL_BUILDERS, HI_BUILDERS } from '../../src/wildlife.js';
import {
  CONE_SEGMENTS, CANOPY_COLOR, RADIUS_MIN, RADIUS_MAX, tieredTreeParts,
} from '../../src/vegetation.js';

// A tree's radius is a FRACTION OF ITS HEIGHT, and the shipped shader applies the
// two separately: `position.x * treeR` against `position.y * treeH`, with treeR =
// treeH * this ratio. Every tree geometry here is therefore unit-height AND
// unit-radius, and the preview must scale it non-uniformly. Scaling it evenly (the
// first pass) drew 24 m-wide cones and compared four blobs filling the frame.
export const TREE_RADIUS_RATIO = (RADIUS_MIN + RADIUS_MAX) / 2;

// ---------------------------------------------------------------- flora: tree

// The current tree, from vegetation.js's own constant: one open cone, 7
// triangles, no trunk. Everything below is measured against this.
function treeCurrent() {
  const cone = new THREE.ConeGeometry(1, 1, CONE_SEGMENTS, 1, true);
  cone.translate(0, 0.5, 0);
  return [cone];
}

// ------------------------------------------------------------------ the sets

// Each entry: what to draw, how many triangles it costs, and whether it wants
// smooth normals. `smooth` is a property of the CANDIDATE, not of the preview,
// because it is half of what "higher resolution" means here.
export const SETS = {
  ibex: {
    subject: 'Ibex',
    // Metres, roughly the height of the model, for the preview's camera framing.
    heightM: 1.3,
    variants: [
      { label: 'current (shipped)', build: () => MODEL_BUILDERS.ibex(), smooth: false },
      { label: '+ anatomy', build: () => HI_BUILDERS.ibex(), smooth: false,
        note: 'narrower chest, thighs, hooves, ears, muzzle, beard, tail, ribbed horns' },
    ],
  },
  // The other four, each as current-vs-accepted-treatment. Two models per set
  // rather than four, because a squirrel and a chamois in one row would be framed
  // for whichever of them the camera favoured.
  chamois: {
    subject: 'Chamois',
    heightM: 1.07,
    variants: [
      { label: 'current (shipped)', build: () => MODEL_BUILDERS.chamois(), smooth: false },
      { label: '+ anatomy', build: () => HI_BUILDERS.chamois(), smooth: false,
        note: 'dark face mask, long ears, muzzle, thighs, hooves, tail, ringed horn base' },
    ],
  },
  fox: {
    subject: 'Fox',
    heightM: 0.54,
    variants: [
      { label: 'current (shipped)', build: () => MODEL_BUILDERS.fox(), smooth: false },
      { label: '+ anatomy', build: () => HI_BUILDERS.fox(), smooth: false,
        note: 'bigger black-tipped ears, cheek ruff, thighs, paws, three-part brush' },
    ],
  },
  marmot: {
    subject: 'Marmot',
    heightM: 0.32,
    variants: [
      { label: 'current (shipped)', build: () => MODEL_BUILDERS.marmot(), smooth: false },
      { label: '+ anatomy (light)', build: () => HI_BUILDERS.marmot(), smooth: false,
        note: 'muzzle, small round ears, thighs - 62 px at 4 m, so nothing finer' },
    ],
  },
  squirrel: {
    subject: 'Squirrel',
    heightM: 0.2,
    variants: [
      { label: 'current (shipped)', build: () => MODEL_BUILDERS.squirrel(), smooth: false },
      { label: '+ anatomy (light)', build: () => HI_BUILDERS.squirrel(), smooth: false,
        note: 'muzzle, taller tufts, four-segment plume tail - 38 px at 4 m' },
    ],
  },
  tree: {
    subject: 'Spruce',
    heightM: 11, // the mean of the shipped TREE_MIN_H..TREE_MAX_H range
    variants: [
      { label: 'current (shipped)', build: treeCurrent, smooth: false,
        note: 'one open cone, no trunk' },
      { label: '3 tiers + trunk', build: tieredTreeParts, smooth: false },
    ],
  },
};

// Merge one variant's parts into the single geometry it would actually be drawn
// as, and report what it costs. The tree parts carry no colour attribute (the
// shipped tree is one uniform material colour), so they are merged separately
// from the animals, which do.
export function buildVariant(variant, { colored }) {
  const parts = variant.build();
  const merged = BufferGeometryUtils.mergeGeometries(parts);
  if (!merged) throw new Error(`could not merge parts for "${variant.label}"`);
  if (variant.smooth) {
    // Smooth normals have to be COMPUTED, not just switched on: three's
    // primitives already carry per-face normals where they meet, and merging
    // them keeps those. This is what the material flag alone cannot do.
    merged.deleteAttribute('normal');
    merged.computeVertexNormals();
  }
  return {
    geometry: merged,
    triangles: merged.index ? merged.index.count / 3 : merged.attributes.position.count / 3,
    parts: parts.length,
    colored,
  };
}

export const TREE_COLOR = CANOPY_COLOR;
