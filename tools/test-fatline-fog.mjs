#!/usr/bin/env node
// Does the aerial perspective actually reach the FAT lines?
//
// A Node test, not a browser one (like tools/test-rendered-height.mjs), because
// the thing that can break is a string match against three's own shader source:
// src/atmosphere.js's attachAtmoFatLine() patches LineMaterial by replacing its
// `#include <fog_*>` lines, and three is free to rename or move those between
// versions. If a replacement silently misses, the roads and the Alta Via casing
// keep drawing - at full brightness, thirty kilometres away, with no haze on
// them at all while every other line in the scene recedes. Nothing throws, and
// the screenshot looks almost right.
//
// The one failure mode that IS loud is the opposite: a replacement that half
// applies (parameters injected, the call not, or the other way round) is a GLSL
// compile error. Both are checked here against the real ShaderLib source rather
// than a copy of it.
//
// Usage: node tools/test-fatline-fog.mjs

import { ShaderLib } from 'three';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { attachAtmoFatLine } from '../src/atmosphere.js';

const material = attachAtmoFatLine(new LineMaterial({ linewidth: 2 }));
const shader = {
  uniforms: {},
  vertexShader: ShaderLib.line.vertexShader,
  fragmentShader: ShaderLib.line.fragmentShader,
};
// three calls this itself at program build time, with the un-resolved source.
material.onBeforeCompile(shader, {});

const checks = [
  ['three still has the anchors this patch replaces',
    ShaderLib.line.vertexShader.includes('#include <fog_pars_vertex>')
    && ShaderLib.line.vertexShader.includes('#include <fog_vertex>')
    && ShaderLib.line.fragmentShader.includes('#include <fog_pars_fragment>')
    && ShaderLib.line.fragmentShader.includes('#include <fog_fragment>')],
  ['fog is off on the material, so the ShaderChunk path (which needs `transformed`) never runs',
    material.fog === false],
  ['the shared ATMO uniforms are merged in',
    'uAtmoHaze' in shader.uniforms && 'uAtmoFogColor' in shader.uniforms],
  ['the vertex shader carries a world position over',
    shader.vertexShader.includes('varying vec3 vAtmoWorld;')
    && shader.vertexShader.includes('vAtmoWorld = (modelMatrix * vec4(position.y < 0.5 ? instanceStart : instanceEnd, 1.0)).xyz;')],
  ['the fragment shader has both the function and the call',
    shader.fragmentShader.includes('vec3 atmoApply(')
    && shader.fragmentShader.includes('gl_FragColor.rgb = atmoApply(gl_FragColor.rgb, uAtmoFogColor, vAtmoWorld, cameraPosition);')],
  ['no fog include is left behind in either stage',
    !shader.vertexShader.includes('#include <fog_') && !shader.fragmentShader.includes('#include <fog_')],
];

let failed = 0;
for (const [what, passed] of checks) {
  console.log(`${passed ? 'ok  ' : 'FAIL'} ${what}`);
  if (!passed) failed++;
}
console.log(failed ? `\n${failed} check(s) failed.` : '\nThe fat lines haze like every other line in the scene.');
process.exit(failed ? 1 : 0);
