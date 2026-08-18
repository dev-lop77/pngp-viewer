// Cutting a polyline into short enough pieces to follow the ground.
//
// WHY THIS EXISTS (2026-08-18, the user's third report): "Le due tracce, rossa e
// gialla non sono vicine fra loro e galleggiano sul terreno, molto nella versione
// High Res."
//
// The floating half is geometry, not seating. Every line layer seats its VERTICES
// on the drawn surface (trails.js, roads.js, poi.js all do it) - but between two
// seated vertices the line is straight, and the ground is not. The trail dataset's
// vertices average 29 m apart, and measured over the segments near the camera at
// Rifugio Benevolo the straight chord leaves the drawn surface by up to 3.3 m in
// the air and 5.9 m under it (p90 0.7 m, p99 2.1 m). Add the clearance the line is
// lifted by and that is exactly a trail floating over a dip.
//
// It shows up worst on the high-resolution terrain because that is where the
// ground under the chord actually has the shape to deviate: at 5 m the surface
// keeps the gully the 20.5 m grid smoothed away, and the line still spans it.
//
// So the fix is more vertices, and they are added HERE rather than in the data:
// public/data/trails.json would grow from 957 KB to several megabytes for
// something the renderer can do at load in a few milliseconds, and the extra
// points carry no information - they are interpolations of what the file already
// says.
export function densify(line, maxSegmentM) {
  if (line.length < 2) return line;
  const out = [line[0]];
  for (let i = 1; i < line.length; i++) {
    const [x0, y0, z0] = line[i - 1];
    const [x1, y1, z1] = line[i];
    // Horizontal length: the vertical part is about to be replaced by the drawn
    // surface anyway (see each layer's alignToGround), so it must not decide how
    // many pieces this segment is cut into.
    const length = Math.hypot(x1 - x0, z1 - z0);
    const pieces = Math.ceil(length / maxSegmentM);
    for (let k = 1; k < pieces; k++) {
      const t = k / pieces;
      out.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z0 + (z1 - z0) * t]);
    }
    out.push(line[i]);
  }
  return out;
}
