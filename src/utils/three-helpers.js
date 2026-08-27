import * as THREE from 'three'

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
  Arc shape. A card's slot `s` is 0 at the centre of the row, ±1 for its
  immediate neighbours, and so on:

      x = s * SLOT_W                    evenly spaced across the row
      z = DEPTH * |s| ** DEPTH_POW      pulled toward the camera as it moves out

  Spacing is even in x rather than along the arc, so the row keeps widening
  instead of curling back on itself the way a circle would.

  DEPTH_POW just above 1 keeps the middle of the row nearly flat while the ends
  pull forward. Measured off the reference hero, cards one slot out are ~1.08x
  the height of the centre card, two out ~1.23x, three out ~1.38x; these values
  track that within a couple of percent. Pushing DEPTH_POW higher makes the end
  cards loom at the camera instead of receding into the blur.
*/
const SLOT_W = 1.55
const DEPTH = 0.9
const DEPTH_POW = 1.3

/*
  Rotation follows the arc's surface normal: each card lies on the curved
  surface, so only the centre card faces the viewer head-on and the side cards
  angle inward toward the centre of the row — the "spokes of a wheel" read.
  The surface normal of the curve z = DEPTH·|s|^DEPTH_POW is atan(slope) off
  the +Z axis, which would put the ends ~50° and squish them into slivers.
  FAN_RATIO scales that back so the turn is clearly visible but the screens
  stay readable; the outer edge of every card still leads toward the camera,
  which is what sells the curve.
*/
const FAN_RATIO = 0.7

/*
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

// Camera distance. 11 frames ~6.7 units of height at the centre card; narrow
// viewports pull back so the row still reads as a row instead of one phone.
const CAM_Z_WIDE = 11
const CAM_Z_NARROW = 15

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
    gl_FragColor = vec4(tex.rgb, tex.a * alpha);
  }
`

const lerp = (a, b, t) => a + (b - a) * t
const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export function createCarousel(canvas, { images }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true, // the page's white paper shows through
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.setClearAlpha(0)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
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
      },
    })
    materials.push(material)

    const mesh = new THREE.Mesh(geometry, material)
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
    mesh.position.z = DEPTH * a ** DEPTH_POW

    // Slope magnitude for the rotation
    const slope = (DEPTH * DEPTH_POW * a ** (DEPTH_POW - 1)) / SLOT_W
    /*
      Cards face slightly outward so each card's face stays readable.
    */
    mesh.rotation.y = -Math.sign(s) * Math.atan(slope) * FAN_RATIO
  }

  // Map any offset slot into [-COUNT/2, COUNT/2) so cards recycle end to end.
  const HALF = COUNT / 2
  const wrapSlot = (v) => ((((v + HALF) % COUNT) + COUNT) % COUNT) - HALF

  // ---- driven state ----
  let scrollProgress = 0
  const pointer = { x: 0, y: 0 }
  const smoothed = { x: 0, y: 0, offset: 0 }
  let drift = 0

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
  }

  const resize = () => {
    const parent = canvas.parentElement
    if (!parent) return
    const { clientWidth: w, clientHeight: h } = parent
    if (!w || !h) return
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.position.z = w / h < 1 ? CAM_Z_NARROW : CAM_Z_WIDE
    camera.updateProjectionMatrix()
  }

  const render = (dt) => {
    const calm = calmMedia.matches

    // Constant slow drift, plus a scroll-linked slide along the row.
    if (!calm) drift += dt * DRIFT_PER_SEC
    const targetOffset = drift + scrollProgress * SLOTS_PER_VIEWPORT
    smoothed.offset = lerp(smoothed.offset, targetOffset, 0.08)

    for (let i = 0; i < meshes.length; i++) {
      placeCard(meshes[i], wrapSlot(i + smoothed.offset))
    }

    /*
      Pointer parallax. The cards are the deepest layer in the composition, so
      they travel the least — a small horizontal slide plus a gentle yaw and
      pitch, all in the same direction the DOM layers above move (see
      useHeroParallax, which reads the same pointer with a matching lerp).

      Horizontal (X): the whole stage slides and yaws, so every card — the
      centre "main subject" included — tracks the pointer left and right. The
      slide matters: a yaw alone pins the centre card in place, and a
      motionless middle reads as a bug.

      Vertical (Y): deliberately NO y-translation of the stage. Instead the
      stage pitches about its own origin, which the centre card sits on — so
      the focal card holds its vertical position while the cards fanning out to
      either side rise and dip. That gives the row a genuine y-axis parallax
      without lifting the hero's centre photo off its mark.

      Translation is in world units; at the centre card's distance one unit is
      ~116px of screen, so 0.08 lands just under the title's 18px of travel.
    */
    const px = calm ? 0 : pointer.x
    const py = calm ? 0 : pointer.y
    smoothed.x = lerp(smoothed.x, px, 0.06)
    smoothed.y = lerp(smoothed.y, py, 0.06)
    stage.position.x = smoothed.x * 0.08
    // Yaw tracks the pointer; negated so the cards tilt in the same direction
    // as the DOM overlay (CSS rotateY positive turns the left edge toward the
    // viewer, while Three.js positive rotation.y turns the right edge toward
    // the camera — opposite conventions, hence the sign flip).
    stage.rotation.y = smoothed.x * -0.055
    // Pitch, not translate: the centre card is on this axis and stays put in Y
    // while the outer cards carry the vertical travel.
    stage.rotation.x = smoothed.y * -0.06

    renderer.render(scene, camera)
  }

  const dispose = () => {
    geometry.dispose()
    materials.forEach((m) => m.dispose())
    textures.forEach((t) => t.dispose())
    renderer.dispose()
  }

  resize()

  return { render, resize, setScroll, setPointer, dispose }
}
