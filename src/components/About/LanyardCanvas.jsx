/* eslint-disable react/no-unknown-property */
import { useEffect, useRef, useState, Suspense, Component } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { useGLTF, useTexture, Environment, Lightformer } from '@react-three/drei';
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import * as THREE from 'three';

extend({ MeshLineGeometry, MeshLineMaterial });

const FRONT_UV_RECT = { x: 0, y: 0, w: 0.5, h: 0.755 };
const BACK_UV_RECT = { x: 0.5, y: 0, w: 0.5, h: 0.757 };

class WebGLErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.warn('Lanyard 3D Canvas Error (falling back to 2D badge):', error);
  }

  render() {
    if (this.state.hasError) {
      return <LanyardFallback />;
    }
    return this.props.children;
  }
}

export default function LanyardCanvas({
  position = [0, 0, 20],
  gravity = [0, -35, 0],
  fov = 24,
  transparent = true,
  frontImage = '/profile-photo.png',
  backImage = null,
  imageFit = 'cover',
  lanyardImage = '/lanyard.png',
  lanyardWidth = 1.15
}) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '480px', position: 'relative' }}>
      <WebGLErrorBoundary>
        <Suspense fallback={<LanyardFallback />}>
          <Canvas
            camera={{ position: position, fov: fov }}
            dpr={[1, isMobile ? 1.25 : 1.5]}
            gl={{ alpha: transparent, antialias: true, powerPreference: 'high-performance' }}
            onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)}
          >
            <ambientLight intensity={Math.PI * 0.85} />
            <Physics gravity={gravity} timeStep={isMobile ? 1 / 30 : 1 / 60}>
              <Band
                isMobile={isMobile}
                frontImage={frontImage}
                backImage={backImage}
                imageFit={imageFit}
                lanyardImage={lanyardImage}
                lanyardWidth={lanyardWidth}
              />
            </Physics>
            <Environment blur={0.75}>
              <Lightformer
                intensity={2}
                color="white"
                position={[0, -1, 5]}
                rotation={[0, 0, Math.PI / 3]}
                scale={[100, 0.1, 1]}
              />
              <Lightformer
                intensity={3}
                color="white"
                position={[-1, -1, 1]}
                rotation={[0, 0, Math.PI / 3]}
                scale={[100, 0.1, 1]}
              />
              <Lightformer
                intensity={3}
                color="white"
                position={[1, 1, 1]}
                rotation={[0, 0, Math.PI / 3]}
                scale={[100, 0.1, 1]}
              />
              <Lightformer
                intensity={8}
                color="white"
                position={[-10, 0, 14]}
                rotation={[0, Math.PI / 2, Math.PI / 3]}
                scale={[100, 10, 1]}
              />
            </Environment>
          </Canvas>
        </Suspense>
      </WebGLErrorBoundary>
    </div>
  );
}

function LanyardFallback() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      minHeight: '480px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'radial-gradient(circle at center, #1c1c24 0%, #0d0d11 100%)',
      borderRadius: '24px',
      color: '#ffffff',
      fontFamily: 'var(--font-sans)',
      textAlign: 'center',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <div style={{
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        overflow: 'hidden',
        border: '3px solid #db0508',
        boxShadow: '0 8px 24px rgba(219, 5, 8, 0.3)',
        marginBottom: '1rem'
      }}>
        <img src="/profile-photo.png" alt="Ayush Singh" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', letterSpacing: '0.04em', margin: '0 0 0.2rem 0' }}>
        AYUSH SINGH
      </h3>
      <p style={{ fontFamily: 'var(--font-alt)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Product Designer & Developer
      </p>
    </div>
  );
}

function Band({
  maxSpeed = 50,
  minSpeed = 0,
  isMobile = false,
  frontImage = '/profile-photo.png',
  backImage = null,
  imageFit = 'cover',
  lanyardImage = '/lanyard.png',
  lanyardWidth = 1.15
}) {
  const band = useRef(),
    fixed = useRef(),
    j1 = useRef(),
    j2 = useRef(),
    j3 = useRef(),
    card = useRef();

  const vec = new THREE.Vector3(),
    ang = new THREE.Vector3(),
    rot = new THREE.Vector3(),
    dir = new THREE.Vector3();

  const segmentProps = { type: 'dynamic', canSleep: true, colliders: false, angularDamping: 4, linearDamping: 4 };
  const { nodes, materials } = useGLTF('/card.glb');
  const texture = useTexture(lanyardImage || '/lanyard.png');

  // Configure band texture wrapping safely outside frame loop
  useEffect(() => {
    if (texture) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.needsUpdate = true;
    }
  }, [texture]);

  // Safe async compositing for front profile image on the card atlas
  const [compositedMap, setCompositedMap] = useState(null);

  useEffect(() => {
    let active = true;
    const baseMap = materials.base?.map;
    if (!baseMap) return;

    // Use default map as base
    setCompositedMap(baseMap);

    if (!frontImage && !backImage) return;

    const baseImg = baseMap.image;
    if (!baseImg || !baseImg.width || !baseImg.height) return;

    const frontImg = new Image();
    if (frontImage) {
      frontImg.crossOrigin = 'anonymous';
      frontImg.src = frontImage;
    }

    const processComposite = () => {
      if (!active) return;
      try {
        const W = baseImg.width;
        const H = baseImg.height;
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw original baked base map
        ctx.drawImage(baseImg, 0, 0, W, H);

        if (frontImage && frontImg.complete && frontImg.naturalWidth > 0 && frontImg.naturalHeight > 0) {
          const rx = FRONT_UV_RECT.x * W;
          const ry = FRONT_UV_RECT.y * H;
          const rw = FRONT_UV_RECT.w * W;
          const rh = FRONT_UV_RECT.h * H;
          const scale = Math.max(rw / frontImg.naturalWidth, rh / frontImg.naturalHeight);
          const dw = frontImg.naturalWidth * scale;
          const dh = frontImg.naturalHeight * scale;
          const dx = rx + (rw - dw) / 2;
          const dy = ry + (rh - dh) / 2;

          ctx.save();
          ctx.beginPath();
          ctx.rect(rx, ry, rw, rh);
          ctx.clip();
          ctx.drawImage(frontImg, dx, dy, dw, dh);
          ctx.restore();
        }

        const canvasTex = new THREE.CanvasTexture(canvas);
        canvasTex.colorSpace = THREE.SRGBColorSpace;
        canvasTex.flipY = baseMap.flipY;
        canvasTex.needsUpdate = true;

        if (active) {
          setCompositedMap(canvasTex);
        }
      } catch (err) {
        console.warn('Card texture composition error, falling back to baseMap:', err);
      }
    };

    if (frontImage) {
      if (frontImg.complete && frontImg.naturalWidth > 0) {
        processComposite();
      } else {
        frontImg.onload = processComposite;
        frontImg.onerror = () => console.warn('Failed to load profile photo for 3D card texture');
      }
    } else {
      processComposite();
    }

    return () => {
      active = false;
    };
  }, [frontImage, backImage, materials.base]);

  const [curve] = useState(
    () => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()])
  );
  const [dragged, drag] = useState(false);
  const [hovered, hover] = useState(false);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.45, 0]
  ]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab';
      return () => void (document.body.style.cursor = 'auto');
    }
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach(ref => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z });
    }
    if (fixed.current) {
      [j1, j2].forEach(ref => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
        const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())));
        ref.current.lerped.lerp(
          ref.current.translation(),
          delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed))
        );
      });
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2.current.lerped);
      curve.points[2].copy(j1.current.lerped);
      curve.points[3].copy(fixed.current.translation());
      band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
    }
  });

  curve.curveType = 'chordal';

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[2, 0, 0]} ref={card} {...segmentProps} type={dragged ? 'kinematicPosition' : 'dynamic'}>
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={e => (e.target.releasePointerCapture(e.pointerId), drag(false))}
            onPointerDown={e => (
              e.target.setPointerCapture(e.pointerId),
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())))
            )}
          >
            <mesh geometry={nodes.card.geometry} material={materials.base}>
              <meshPhysicalMaterial
                map={compositedMap || materials.base?.map}
                clearcoat={isMobile ? 0 : 1}
                clearcoatRoughness={0.15}
                roughness={0.8}
                metalness={0.8}
              />
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          useMap
          map={texture}
          repeat={[-4, 1]}
          lineWidth={lanyardWidth}
        />
      </mesh>
    </>
  );
}

useGLTF.preload('/card.glb');
