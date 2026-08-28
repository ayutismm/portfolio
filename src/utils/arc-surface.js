/*
  The hero's single curved surface, shared by the WebGL card row and the DOM
  type (display title + side taglines). One source of truth for the radius, the
  fan, the camera and the pointer tilt, so the cards and the text can never
  drift apart again.

  The surface is CONCAVE — the centre sits deepest and the outer slots sweep
  forward toward the viewer — following

      z = DEPTH * |s| ** DEPTH_POW        (s = slot index, 0 at the centre)

  and every point lies ON that surface, so its yaw is the surface normal's
  tangent angle scaled by FAN_RATIO (the "spokes of a wheel" read).

  WebGL consumes these numbers directly in world units. The DOM side uses the
  same numbers through the pixel bridge in surfaceAtPx / placeOnSurface, which
  converts world depth to CSS translateZ via the perspective identity

      P / (P - dz_px) == camZ / (camZ - z_world)

  so a glyph pushed forward by dz_px magnifies by exactly the same factor as a
  card at the same depth, and the two surfaces cannot diverge.
*/

const SLOT_W = 1.55 // world units between card centres
const DEPTH = 0.9 // world depth at |s| = 1
const DEPTH_POW = 1.3 // exponent; >1 keeps the middle flat, the ends pulled forward
const FAN_RATIO = 0.7 // scales the surface-normal yaw back so screens stay readable

const CAM_FOV = 34 // vertical field of view, degrees
const CAM_Z_WIDE = 11
const CAM_Z_NARROW = 15 // narrow viewports pull back so the row reads as a row

/*
  Pointer tilt, shared by the WebGL stage and the DOM overlay.

  The magnitudes live here once; the two consumers apply their own sign
  conventions:

    - Three.js rotates the stage NEGATIVELY — rotation.y = smoothed.x * -TILT_YAW,
      rotation.x = smoothed.y * -TILT_PITCH — so the row leans toward the pointer.
    - CSS rotateY shares Three's convention (positive turns the right edge away
      from the viewer), so the overlay yaw is also negative. CSS rotateX does
      NOT share it: CSS +Y points DOWN while Three's +Y points UP, so the same
      "lean toward the pointer" that is a negative Three pitch is a POSITIVE
      CSS rotateX.

  TILT_*_CSS carry those sign conversions, ready to paste into a transform.
*/
const TILT_YAW_RAD = 0.055
const TILT_PITCH_RAD = 0.06
const TILT_YAW_CSS = `${-((TILT_YAW_RAD * 180) / Math.PI)}deg`
const TILT_PITCH_CSS = `${(TILT_PITCH_RAD * 180) / Math.PI}deg`

/*
  Screen-space slide of the whole stage under the pointer, in world units. Shared
  with the DOM layerScene so the text slides by the same screen amount the cards
  do (converted via pxPerWorldUnit) instead of hand-picked px values. The tilt is
  additive on top of this slide, so the scene both shifts and leans toward the
  pointer. Tuned to the ~18-24px the text used to travel across viewports.
*/
const STAGE_SLIDE_X = 0.15
const STAGE_SLIDE_Y = 0.12

// Arc depth at a slot index, in world units. Matches placeCard in three-helpers.js.
const depthAtSlot = (s) => DEPTH * Math.abs(s) ** DEPTH_POW

// Surface-normal yaw at a slot, in radians. Matches placeCard.
const yawAtSlot = (s) => {
  const slope = (DEPTH * DEPTH_POW * Math.abs(s) ** (DEPTH_POW - 1)) / SLOT_W
  return -Math.sign(s) * Math.atan(slope) * FAN_RATIO
}

const camZFor = (w, h) => (w / h < 1 ? CAM_Z_NARROW : CAM_Z_WIDE)

// CSS pixels per world unit at the z=0 plane, at the current viewport size.
const pxPerWorldUnit = (w, h) => {
  const camZ = camZFor(w, h)
  return h / (2 * camZ * Math.tan((CAM_FOV * Math.PI) / 360))
}

/*
  Screen x (px, signed about the viewport centre) → the point on the surface
  that a card there would occupy: its CSS translateZ, its yaw in radians, and
  the magnification perspective applies to it.
*/
const surfaceAtPx = (xPx, { w, h, perspective }) => {
  const k = pxPerWorldUnit(w, h)
  const camZ = camZFor(w, h)
  const s = xPx / k / SLOT_W
  const dz = (perspective * depthAtSlot(s)) / camZ
  return { dz, yaw: yawAtSlot(s), scale: perspective / (perspective - dz) }
}

/*
  Inverse of surfaceAtPx: the pre-projection x that PROJECTS onto xTargetPx once
  its own depth magnifies it. A span pushed to dz ~280px magnifies ~1.25x, which
  would fling it outward; solving backwards keeps it landing where it belongs.

  Fixed-point iteration on x = xTarget * (P - dz(x)) / P — dz depends on x, so
  we step until the change is under half a pixel. Six passes is plenty; it
  converges for the tagline geometry in under four.
*/
const placeOnSurface = (xTargetPx, view) => {
  let x = xTargetPx
  for (let i = 0; i < 6; i++) {
    const dz = surfaceAtPx(x, view).dz
    const next = (xTargetPx * (view.perspective - dz)) / view.perspective
    if (Math.abs(next - x) < 0.5) {
      x = next
      break
    }
    x = next
  }
  return { x, ...surfaceAtPx(x, view) }
}

export {
  SLOT_W,
  DEPTH,
  DEPTH_POW,
  FAN_RATIO,
  CAM_FOV,
  CAM_Z_WIDE,
  CAM_Z_NARROW,
  TILT_YAW_RAD,
  TILT_PITCH_RAD,
  TILT_YAW_CSS,
  TILT_PITCH_CSS,
  STAGE_SLIDE_X,
  STAGE_SLIDE_Y,
  depthAtSlot,
  yawAtSlot,
  camZFor,
  pxPerWorldUnit,
  surfaceAtPx,
  placeOnSurface,
}
