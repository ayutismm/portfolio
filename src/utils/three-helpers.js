import * as THREE from 'three'
import {
  SLOT_W,
  CAM_FOV,
  CAM_Z_WIDE,
  TILT_YAW_RAD,
  TILT_PITCH_RAD,
  STAGE_SLIDE_X,
  STAGE_SLIDE_Y,
  depthAtSlot,
  yawAtSlot,
  camZFor,
} from './arc-surface'

/*
  The hero's 3D screen row.

  Geometry: N phone-shaped planes sit on a CONCAVE arc — the row curves *away*
  from the viewer in the middle and sweeps forward at both ends, so the centre
  card is the farthest (and smallest) and the cards grow toward the edges.

  This is the opposite of a convex wheel bulging outward, and the difference
  matters: convex puts the largest card dead centre, which is exactly where the
  character illustration covers it, and it turns the end cards away until they
  are edge-on slivers. Concave keeps the middle recessed behind the figure and
  presents the end cards to the viewer, which is what the reference does.

  The row is a strip of slots, not a closed wheel. `offset` slides it sideways
  and cards recycle from one end to the other; they fade out before reaching the
  recycle point, so the jump never shows.

  Corners are rounded in the fragment shader with a rounded-box SDF instead of
  pre-masking each texture — one material, no per-image canvas work, and the
  radius stays crisp at any resolution.
*/

const PHONE_ASPECT = 390 / 844 // matches the placeholder screen SVGs
/*
  Plane height in world units. With the camera at CAM_Z_WIDE and a 34° vertical
  FOV the visible height at the centre card is ~6.73 units, so 2.5 makes that
  card read at ~37% of the viewport — the proportion the reference holds.
*/
const PLANE_H = 2.5
const PLANE_W = PLANE_H * PHONE_ASPECT
const CORNER_RADIUS = 0.11

/*
  Arc shape lives in utils/arc-surface.js — the single source of truth shared
  with the DOM type so the cards and the text stay on the same surface. What
  remains here is the row's own layout: slot count, fade band, drift.

  Slot count. Enough to cover the viewport (|s| ≲ 3.2) plus the fade band, so
  cards are invisible by the time they recycle. More screens than that means
  more slots rather than repeated textures.
*/
const SLOTS_MIN = 11
const FADE_FROM = 1.8 // first 2 cards on each side stay fully opaque
const FADE_TO = 3.8 // outer cards fade gradually into the edges

// Idle drift and scroll response, both in slots (one slot = one card step).
const DRIFT_PER_SEC = 0.16
const SLOTS_PER_VIEWPORT = 2.5

/*
  Intro spin. The wheel launches at a fast clip the moment it is uncovered, then
  eases down to the idle drift over INTRO_SPIN_SETTLE seconds. The boost is a
  multiplier on DRIFT_PER_SEC that decays from INTRO_SPIN_BOOST to 1 with an
  ease-out, so the slowdown reads as deceleration rather than a linear brake.

  The clock is started by startIntroSpin(), NOT by mount. The intro hides the
  wheel behind an opaque backdrop until the subject is established, and if the
  decay ran from mount the boost would be spent by the time anyone could see it —
  the reveal would show an already-idle row.

  SETTLE deliberately outlasts the rest of the intro so the row is still visibly
  slowing as the site arrives, instead of having flattened to idle first.
*/
const INTRO_SPIN_BOOST = 14
const INTRO_SPIN_SETTLE = 4

/*
  Hover interaction. A hovered card grows to SCALE_UP × its slot size — ~8%
  at full hover, a clear nudge that still stays inside its slot spacing — and
  blends from grayscale to full colour (see the uGray uniform). Scaling about
  the card's centre reads as the card pushing toward the viewer instead of
  leaving its slot.
*/
const SCALE_UP = 1.08

// Camera distance: CAM_Z_WIDE frames ~6.7 units of height at the centre card;
// narrow viewports pull back (CAM_Z_NARROW) so the row still reads as a row
// instead of one phone. Both live in arc-surface.js.

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uMap;
  uniform vec2 uSize;
  uniform float uRadius;
  uniform float uOpacity;
  uniform float uGray;

  // Signed distance to a rounded box centred on the origin.
  float roundedBoxSDF(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  void main() {
    vec4 tex = texture2D(uMap, vUv);
    vec2 p = (vUv - 0.5) * uSize;
    float d = roundedBoxSDF(p, uSize * 0.5, uRadius);
    // Feather proportional to the plane size so the edge stays ~1px on screen.
    float edge = 0.012 * uSize.y;
    float alpha = (1.0 - smoothstep(-edge, edge, d)) * uOpacity;
    if (alpha <= 0.001) discard;
    // Grayscale by default; uGray is lerped 1→0 on hover so the card fills in
    // with colour. Luminance weights match sRGB perceptual brightness.
    vec3 gray = vec3(dot(tex.rgb, vec3(0.299, 0.587, 0.114)));
    vec3 rgb = mix(tex.rgb, gray, uGray);
    gl_FragColor = vec4(rgb, tex.a * alpha);
  }
`

const lerp = (a, b, t) => a + (b - a) * t
const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

export function createCarousel(canvas, { images }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true, // the page's white paper shows through
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.setClearAlpha(0)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(CAM_FOV, 1, 0.1, 100)
  camera.position.set(0, 0, CAM_Z_WIDE)
  camera.lookAt(0, 0, 0)

  // stage → tilts with the pointer;  row → slides.
  const stage = new THREE.Group()
  const row = new THREE.Group()
  
  // Position the row in the upper-middle of the viewport so cards sit
  // behind the character's torso area, matching the reference. Sits a touch
  // lower than centre so the row clears the smaller heading above it.
  row.position.y = 0.15
  stage.add(row)
  scene.add(stage)

  const COUNT = Math.max(SLOTS_MIN, images.length)

  const loader = new THREE.TextureLoader()
  const geometry = new THREE.PlaneGeometry(PLANE_W, PLANE_H, 1, 1)
  const textures = []
  const materials = []
  const meshes = []

  images.forEach((src) => {
    const tex = loader.load(src)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.generateMipmaps = true
    tex.minFilter = THREE.LinearMipmapLinearFilter
    tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy())
    textures.push(tex)
  })

  for (let i = 0; i < COUNT; i++) {
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      /*
        No depth writes. The end cards fade out, and a half-transparent card
        that wrote depth would punch a hole in whatever sits behind it. The
        cards never intersect, so Three's back-to-front sort of transparent
        objects orders them exactly.
      */
      depthWrite: false,
      uniforms: {
        uMap: { value: textures[i % textures.length] },
        uSize: { value: new THREE.Vector2(PLANE_W, PLANE_H) },
        uRadius: { value: CORNER_RADIUS },
        uOpacity: { value: 1 },
        uGray: { value: 1 }, // 1 = full grayscale; hover lerps it to 0
      },
    })
    materials.push(material)

    const mesh = new THREE.Mesh(geometry, material)
    mesh.userData.index = i // for the hover raycast to name its hit
    meshes.push(mesh)
    row.add(mesh)
  }

  /*
    Place one card at slot `s`. Called every frame — it is a handful of cheap
    scalar ops per card, and driving position from a continuous slot value is
    what lets the row slide and recycle without rebuilding anything.
  */
  const placeCard = (mesh, s) => {
    const a = Math.abs(s)

    const fade = 1 - smoothstep(FADE_FROM, FADE_TO, a)
    mesh.visible = fade > 0.001
    if (!mesh.visible) return
    mesh.material.uniforms.uOpacity.value = fade

    mesh.position.x = s * SLOT_W
    // Concave arc: positive Z pulls outer cards FORWARD toward the camera.
    mesh.position.z = depthAtSlot(s)
    // Each card lies ON the surface, so its yaw is the surface normal's angle —
    // the same curve the DOM glyphs ride (see arc-surface.js).
    mesh.rotation.y = yawAtSlot(s)
  }

  // Map any offset slot into [-COUNT/2, COUNT/2) so cards recycle end to end.
  const HALF = COUNT / 2
  const wrapSlot = (v) => ((((v + HALF) % COUNT) + COUNT) % COUNT) - HALF

  // ---- driven state ----
  let scrollProgress = 0
  const pointer = { x: 0, y: 0 }
  let pointerActive = false // stays false until the pointer first moves
  const smoothed = { x: 0, y: 0, offset: 0 }
  let drift = 0
  // Intro-spin clock. Stays parked until startIntroSpin() — see INTRO_SPIN_*.
  let introSpin = 0
  let introSpinning = false

  /*
    Hover state. Each card carries a 0→1 progress that drives both the
    grayscale→colour blend and the scale-up. The ray is cast from the pointer's
    NDC against the card planes, so the hover tracks a card's real screen spot
    through the drift, the scroll slide and the stage parallax — if a hovered
    card slides out from under the cursor, the interaction hands off to the
    next card that passes through.
  */
  const raycaster = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  const hover = new Array(COUNT).fill(0)
  // Reused per frame as the hover targets (1 = under the cursor), so the
  // render loop doesn't allocate a new set of targets on every tick.
  const hoverTargets = new Array(COUNT).fill(0)

  /*
    Under reduced motion the row stops drifting on its own and stops tilting to
    the pointer — both are autonomous motion the visitor didn't ask for. The
    scroll-linked slide stays: it's a direct response to their own scrolling,
    and freezing it would make the hero look broken rather than calm.
  */
  const calmMedia = window.matchMedia('(prefers-reduced-motion: reduce)')

  const setScroll = (v) => {
    scrollProgress = v
  }
  const setPointer = (x, y) => {
    pointer.x = x
    pointer.y = y
    pointerActive = true
  }
  const setPointerActive = (active) => {
    pointerActive = active
  }

  /*
    Kick the fast intro spin. Called when the wheel is actually uncovered rather
    than on mount; idempotent, so a re-render that re-signals the reveal can't
    restart the decay and make the row lurch back up to speed.
  */
  const startIntroSpin = () => {
    introSpinning = true
  }

  const resize = () => {
    const parent = canvas.parentElement
    if (!parent) return
    const { clientWidth: w, clientHeight: h } = parent
    if (!w || !h) return
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.position.z = camZFor(w, h)
    camera.updateProjectionMatrix()
  }

  const render = (dt) => {
    const calm = calmMedia.matches

    // Fast intro spin decaying to the idle drift, then the scroll-linked slide.
    let spinBoost = 1
    if (introSpinning && introSpin < INTRO_SPIN_SETTLE) {
      introSpin = Math.min(INTRO_SPIN_SETTLE, introSpin + dt)
      spinBoost = 1 + (INTRO_SPIN_BOOST - 1) * (1 - easeOutCubic(introSpin / INTRO_SPIN_SETTLE))
    }
    if (!calm) drift += dt * DRIFT_PER_SEC * spinBoost
    const targetOffset = drift + scrollProgress * SLOTS_PER_VIEWPORT
    smoothed.offset = lerp(smoothed.offset, targetOffset, 0.08)

    for (let i = 0; i < meshes.length; i++) {
      const mesh = meshes[i]
      placeCard(mesh, wrapSlot(i + smoothed.offset))
      // Hover effects ride on top of the card's slot transform: the card
      // scales up about its own centre and the colour blend is per-material.
      // Both read the previous frame's progress so the lerp stays smooth.
      mesh.scale.setScalar(1 + hover[i] * (SCALE_UP - 1))
      mesh.material.uniforms.uGray.value = 1 - hover[i]
    }

    /*
      Pointer parallax. The stage slides toward the pointer AND tilts toward it —
      a screen-space translation plus a gentle yaw and pitch, all in the same
      direction the DOM layers above move (see useHeroParallax, which reads the
      same pointer with a matching lerp).

      Translation (X and Y): the whole stage shifts so the composition tracks
      the pointer rather than only rotating in place. X follows the pointer
      directly; Y is negated because Three's +Y points UP while the pointer's
      +Y points DOWN (the same flip the pitch uses). The DOM text applies the
      SAME slide, converted to screen px via pxPerWorldUnit (--hero-slide-x/y
      in useArcSurface), so the title and cards travel together.

      Tilt: the yaw and pitch lean the row toward the pointer on top of the
      slide. Both are negated so the row leans TOWARD the pointer (positive
      rotation.y / rotation.x turn the right / top edge away from the camera).
      The DOM layerScene applies the same tilt with its own sign conventions —
      see TILT_*_CSS in arc-surface.js, which exist because CSS rotateX's +Y is
      DOWN while Three's is UP, so only the pitch sign differs between the two.
    */
    const px = calm ? 0 : pointer.x
    const py = calm ? 0 : pointer.y
    smoothed.x = lerp(smoothed.x, px, 0.06)
    smoothed.y = lerp(smoothed.y, py, 0.06)
    stage.position.x = smoothed.x * STAGE_SLIDE_X
    stage.position.y = smoothed.y * -STAGE_SLIDE_Y
    stage.rotation.y = smoothed.x * -TILT_YAW_RAD
    stage.rotation.x = smoothed.y * -TILT_PITCH_RAD

    /*
      Hover raycast. The cards' world matrices must include this frame's slot
      positions and the stage parallax, so flush them before intersecting.
      The pointer is NDC (-1..1) and lines up with the canvas, so no manual
      picking from CSS coordinates is needed.
    */
    if (pointerActive) {
      scene.updateMatrixWorld(true)
      camera.updateMatrixWorld(true)
      // The pointer y runs +1 at the bottom (CSS clientY), but Three.js NDC
      // wants +1 at the top — negate so the ray lands where the cursor is.
      ndc.set(pointer.x, -pointer.y)
      raycaster.setFromCamera(ndc, camera)
      hoverTargets.fill(0)
      const hits = raycaster.intersectObjects(meshes, false)
      for (const hit of hits) hoverTargets[hit.object.userData.index] = 1
      for (let i = 0; i < COUNT; i++) {
        hover[i] = lerp(hover[i], hoverTargets[i], 0.14)
      }
    } else {
      // Pointer has never moved (or left the viewport) — ease any lingering
      // hover back to rest so cards don't keep highlighting themselves as
      // they drift through the cursor's last known spot.
      for (let i = 0; i < COUNT; i++) hover[i] = lerp(hover[i], 0, 0.14)
    }

    renderer.render(scene, camera)
  }

  const dispose = () => {
    geometry.dispose()
    materials.forEach((m) => m.dispose())
    textures.forEach((t) => t.dispose())
    renderer.dispose()
  }

  resize()

  return { render, resize, setScroll, setPointer, setPointerActive, startIntroSpin, dispose }
}
