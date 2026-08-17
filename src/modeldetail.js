// Which level of detail the flora and fauna models are drawn at (2026-08-17): the
// last of the user's four optional extras, and like the terrain tier an option to
// turn UP rather than a new default - "modelli ad alta risoluzione come opzione da
// alzare, non come nuovo default".
//
// A module of its own, holding one mutable object, for the same reason SNOW_LEVEL
// and the HEIGHT_TIER holders have theirs: it is read by src/wildlife.js and
// src/vegetation.js and written by src/main.js from a control. Putting it in
// wildlife.js (the first attempt) made vegetation.js import wildlife.js while
// wildlife.js already imports vegetation.js for nearestTree - a cycle that happens
// to work because nothing reads the binding at module-evaluation time, which is
// exactly the kind of dependency that breaks later for a reason nobody can see.
//
// It is also the pattern Vite's HMR requires here: a shared holder split across two
// module instances is the defect docs/PROGRESS.md records twice already, so the
// holder lives in one module and everyone reads THAT object.
//
// 0 = standard, the models that shipped before this option. 1 = high.
export const MODEL_DETAIL = { value: 0 };

export function setModelDetail(level) {
  MODEL_DETAIL.value = level ? 1 : 0;
}
