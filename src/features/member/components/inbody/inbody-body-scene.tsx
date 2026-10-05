import { Suspense, useEffect, useMemo, useRef, type ComponentRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { Box3, Vector3 } from 'three'
import { clone } from 'three/addons/utils/SkeletonUtils.js'

export type ViewPreset = 'front' | 'side' | 'back'
interface SceneProps {
  url: string
  preset: { view: ViewPreset; revision: number }
  autoRotate: boolean
  onReady: () => void
  onFailure: () => void
}

function HumanModel({ url, onReady }: Pick<SceneProps, 'url' | 'onReady'>) {
  // Disable remote Draco decoding. The provided GLB should be self-contained/uncompressed.
  const { scene } = useGLTF(url, false)
  const model = useMemo(() => {
    const object = clone(scene)
    const bounds = new Box3().setFromObject(object)
    const size = bounds.getSize(new Vector3())
    const dimension = Math.max(size.x, size.y, size.z)
    if (!Number.isFinite(dimension) || dimension <= 0) throw new Error('Empty model')
    const scale = 2.8 / dimension
    const center = bounds.getCenter(new Vector3()).multiplyScalar(-scale)
    return { object, scale, position: center }
  }, [scene])
  useEffect(() => {
    onReady()
  }, [onReady])
  return (
    <group scale={model.scale} position={model.position} dispose={null}>
      <primitive object={model.object} />
    </group>
  )
}

function CameraControls({ preset, autoRotate }: Pick<SceneProps, 'preset' | 'autoRotate'>) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const { camera, size, invalidate } = useThree()
  useEffect(() => {
    const distance = 5.2 / Math.min(size.width / Math.max(size.height, 1), 1)
    const position: [number, number, number] =
      preset.view === 'side'
        ? [distance, 0, 0]
        : preset.view === 'back'
          ? [0, 0, -distance]
          : [0, 0, distance]
    camera.position.set(...position)
    camera.lookAt(0, 0, 0)
    controls.current?.target.set(0, 0, 0)
    controls.current?.update()
    invalidate()
  }, [camera, invalidate, preset, size.width, size.height])
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan
      enableDamping
      autoRotate={autoRotate}
      autoRotateSpeed={0.7}
      minDistance={2}
      maxDistance={20}
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI - 0.1}
    />
  )
}

function ContextMonitor({ onFailure }: Pick<SceneProps, 'onFailure'>) {
  const gl = useThree((state) => state.gl)
  useEffect(() => {
    const handleLoss = (event: Event) => {
      event.preventDefault()
      onFailure()
    }
    const canvas = gl.domElement
    canvas.addEventListener('webglcontextlost', handleLoss)
    return () => canvas.removeEventListener('webglcontextlost', handleLoss)
  }, [gl, onFailure])
  return null
}

export default function InbodyBodyScene({
  url,
  preset,
  autoRotate,
  onReady,
  onFailure,
}: SceneProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={autoRotate ? 'always' : 'demand'}
      camera={{ position: [0, 0, 5.2], fov: 40 }}
      gl={{ antialias: true, powerPreference: 'low-power' }}
      fallback={
        <p role="status" className="p-6 text-sm text-slate-500">
          Thiết bị chưa hỗ trợ trình xem 3D.
        </p>
      }
    >
      <ambientLight intensity={1.5} />
      <directionalLight position={[3, 5, 4]} intensity={2} />
      <directionalLight position={[-3, 2, -4]} intensity={1} />
      <Suspense fallback={null}>
        <HumanModel url={url} onReady={onReady} />
      </Suspense>
      <CameraControls preset={preset} autoRotate={autoRotate} />
      <ContextMonitor onFailure={onFailure} />
    </Canvas>
  )
}
