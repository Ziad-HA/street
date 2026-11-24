import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, useGLTF } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import type { Group } from 'three'
import { Box3, CatmullRomCurve3, TubeGeometry, Vector3 } from 'three'
import { ASSETS } from './config'
import { DOTS, MARK_H, MARK_W, MARK_STROKE, STROKES } from './mark'

export interface Pose {
  rx: number
  ry: number
  rz: number
  s: number
  x: number
  y: number
}

function ChromeMark() {
  const parts = useMemo(() => {
    const k = 3.8 / MARK_W
    const P = (x: number, y: number) => new Vector3((x - MARK_W / 2) * k, -(y - MARK_H / 2) * k, 0)
    const r = (MARK_STROKE / 2) * k
    const tubes = STROKES.filter((st) => st.length > 2 || Math.hypot(st[1][0] - st[0][0], st[1][1] - st[0][1]) > 4).map((st) => {
      const pts = st.map(([x, y]) => P(x, y))
      const curve = new CatmullRomCurve3(pts.length > 2 ? pts : [pts[0], pts[0].clone().lerp(pts[1], 0.5), pts[1]], false, 'centripetal')
      return {
        geo: new TubeGeometry(curve, 48, r, 14, false),
        ends: [pts[0], pts[pts.length - 1]],
      }
    })
    const dots = DOTS.map((d) => ({ p: P(d.x, d.y), r: d.r * k }))
    return { tubes, dots, r }
  }, [])
  const mat = <meshStandardMaterial metalness={1} roughness={0.1} color="#c9ced6" envMapIntensity={1.5} />
  return (
    <group>
      {parts.tubes.map((t, i) => (
        <group key={i}>
          <mesh geometry={t.geo}>{mat}</mesh>
          {t.ends.map((e, j) => (
            <mesh key={j} position={e}>
              <sphereGeometry args={[parts.r, 16, 16]} />
              {mat}
            </mesh>
          ))}
        </group>
      ))}
      {parts.dots.map((d, i) => (
        <mesh key={i} position={d.p}>
          <sphereGeometry args={[d.r, 16, 16]} />
          {mat}
        </mesh>
      ))}
    </group>
  )
}

function GLBLogo({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  const cloned = useMemo(() => {
    const c = scene.clone(true)
    const box = new Box3().setFromObject(c)
    const size = box.getSize(new Vector3())
    const center = box.getCenter(new Vector3())
    c.position.sub(center)
    const k = 3 / Math.max(size.x, size.y, size.z)
    c.scale.setScalar(k)
    c.position.multiplyScalar(k)
    return c
  }, [scene])
  return <primitive object={cloned} />
}

interface RigProps {
  pose: Pose
  pointer?: boolean
  spin?: number
  scrollSpin?: boolean
}

function Rig({ pose, pointer, spin = 0, scrollSpin }: RigProps) {
  const g = useRef<Group>(null)
  useFrame((state, dt) => {
    const o = g.current
    if (!o) return
    const k = 1 - Math.pow(0.0015, dt)
    const px = pointer ? state.pointer.x : 0
    const py = pointer ? state.pointer.y : 0
    // One full, readable turn followed by a one-second front-facing pause.
    const spinDuration = 2.35
    const pauseDuration = 1
    const cycle = spinDuration + pauseDuration
    const phase = (state.clock.elapsedTime * Math.max(spin, 0.01)) % cycle
    const progress = Math.min(phase / spinDuration, 1)
    const eased = progress * progress * (3 - 2 * progress)
    const extra = scrollSpin ? window.scrollY * 0.006 : spin > 0 ? eased * Math.PI * 2 : 0
    o.rotation.x += (pose.rx - py * 0.35 - o.rotation.x) * k
    o.rotation.y += (pose.ry + px * 0.5 + extra - o.rotation.y) * k
    o.rotation.z += (pose.rz - o.rotation.z) * k
    const s = o.scale.x + (pose.s - o.scale.x) * k
    o.scale.setScalar(s)
    o.position.x += (pose.x - o.position.x) * k
    o.position.y += (pose.y - o.position.y) * k
  })
  return (
    <group ref={g}>{ASSETS.logoModel ? <GLBLogo url={ASSETS.logoModel} /> : <ChromeMark />}</group>
  )
}

interface Props extends RigProps {
  className?: string
  fov?: number
}

export function Logo3D({ className, fov = 35, ...rig }: Props) {
  return (
    <Canvas className={className} camera={{ position: [0, 0, 8], fov }} dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={0.2} />
      <directionalLight position={[3, 4, 6]} intensity={1.2} />
      <Environment resolution={256}>
        <color attach="background" args={["#2b323d"]} />
        <Lightformer form="rect" intensity={6} position={[0, 5, -5]} scale={[16, 6, 1]} />
        <Lightformer form="rect" intensity={3} position={[0, 0, 8]} scale={[14, 6, 1]} />
        <Lightformer form="rect" intensity={2} position={[-6, 0, 2]} scale={[2, 8, 1]} />
        <Lightformer form="rect" intensity={2} position={[6, 0, 2]} scale={[2, 8, 1]} />
        <Lightformer form="rect" intensity={1.5} position={[0, -5, 3]} scale={[12, 2, 1]} color="#8aa07a" />
        <Lightformer form="circle" intensity={3} position={[0, 2, 6]} scale={3} />
      </Environment>
      <Rig {...rig} />
    </Canvas>
  )
}
