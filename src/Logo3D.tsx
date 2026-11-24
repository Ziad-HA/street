import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, useGLTF } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import type { Group } from 'three'
import { Box3, Vector3 } from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import fontJson from './assets/fonts/helvetiker_bold.typeface.json'
import { ASSETS, BRAND } from './config'

export interface Pose {
  rx: number
  ry: number
  rz: number
  s: number
  x: number
  y: number
}

function ChromeText() {
  const geo = useMemo(() => {
    const font = new FontLoader().parse(fontJson as never)
    const g = new TextGeometry(BRAND, {
      font,
      size: 1,
      depth: 0.35,
      curveSegments: 10,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.04,
      bevelSegments: 6,
    })
    g.center()
    const box = new Box3().setFromBufferAttribute(g.attributes.position as never)
    const size = box.getSize(new Vector3())
    g.scale(3 / size.x, 3 / size.x, 3 / size.x)
    return g
  }, [])
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial metalness={1} roughness={0.12} color="#c9ced6" envMapIntensity={1.5} />
    </mesh>
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
    const extra = scrollSpin ? window.scrollY * 0.006 : state.clock.elapsedTime * spin
    o.rotation.x += (pose.rx - py * 0.35 - o.rotation.x) * k
    o.rotation.y += (pose.ry + px * 0.5 + extra - o.rotation.y) * k
    o.rotation.z += (pose.rz - o.rotation.z) * k
    const s = o.scale.x + (pose.s - o.scale.x) * k
    o.scale.setScalar(s)
    o.position.x += (pose.x - o.position.x) * k
    o.position.y += (pose.y - o.position.y) * k
  })
  return (
    <group ref={g}>{ASSETS.logoModel ? <GLBLogo url={ASSETS.logoModel} /> : <ChromeText />}</group>
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
