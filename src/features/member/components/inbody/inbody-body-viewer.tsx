import { lazy, Suspense, useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Box, Loader2, PersonStanding, RotateCcw, RotateCw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InbodyVisualBoundary } from './inbody-visual-boundary'
import type { ViewPreset } from './inbody-body-scene'

const BodyScene = lazy(() => import('./inbody-body-scene'))
const modelUrl = `${import.meta.env.BASE_URL}models/inbody-human.glb`

function ViewerPlaceholder({ loading = false, message }: { loading?: boolean; message: string }) {
  return (
    <div
      role="status"
      className="flex h-full flex-col items-center justify-center px-5 text-center"
    >
      <div className="mb-6 flex h-44 w-32 items-center justify-center rounded-full border border-slate-200 bg-white/70 text-slate-300">
        <PersonStanding className="h-32 w-24" strokeWidth={1} aria-hidden="true" />
      </div>
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {message}
      </p>
      <p className="mb-0 max-w-xs text-xs leading-relaxed text-slate-500">
        {loading
          ? 'Vui lòng đợi trong giây lát.'
          : 'Bạn vẫn có thể theo dõi đầy đủ các chỉ số và lịch sử bên dưới.'}
      </p>
    </div>
  )
}

export function InbodyBodyViewer() {
  const [preset, setPreset] = useState<{ view: ViewPreset; revision: number }>({
    view: 'front',
    revision: 0,
  })
  const [autoRotate, setAutoRotate] = useState(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const onReady = useCallback(() => setReady(true), [])
  const onFailure = useCallback(() => {
    setFailed(true)
    setReady(false)
  }, [])
  const model = useQuery({
    queryKey: ['inbody', 'model', modelUrl],
    queryFn: async ({ signal }) => {
      // Vite's SPA fallback returns HTML for absent assets; don't pass it to GLTFLoader.
      const response = await fetch(modelUrl, { method: 'HEAD', signal })
      if (!response.ok || response.headers.get('content-type')?.includes('text/html'))
        throw new Error('Model unavailable')
      return modelUrl
    },
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
  const chooseView = (view: ViewPreset) => {
    setAutoRotate(false)
    setPreset((current) => ({ view, revision: current.revision + 1 }))
  }
  const fallback = <ViewerPlaceholder message="Không thể hiển thị mô hình 3D trên thiết bị này." />
  const disabled = !ready || failed

  return (
    <Card
      role="region"
      aria-label="Tổng quan cơ thể 3D"
      className="inbody-visual-card flex flex-col overflow-hidden"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Tổng quan cơ thể</h2>
        </div>
        <span className="rounded-lg bg-emerald-50 p-2 text-[#008b74]">
          <Box className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <div
        role="group"
        aria-label="Trình xem mô hình cơ thể 3D minh họa"
        className="inbody-model-stage relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50"
      >
        {model.isPending ? (
          <ViewerPlaceholder loading message="Đang kiểm tra mô hình 3D..." />
        ) : model.isError ? (
          <ViewerPlaceholder message="3D body model chưa được cấu hình" />
        ) : failed ? (
          fallback
        ) : (
          <InbodyVisualBoundary fallback={fallback} onError={onFailure}>
            <Suspense fallback={null}>
              <BodyScene
                url={model.data}
                preset={preset}
                autoRotate={autoRotate}
                onReady={onReady}
                onFailure={onFailure}
              />
            </Suspense>
          </InbodyVisualBoundary>
        )}
        {model.isSuccess && !ready && !failed && (
          <div className="pointer-events-none absolute inset-0 bg-slate-50">
            <ViewerPlaceholder loading message="Đang tải mô hình 3D..." />
          </div>
        )}
      </div>
      <div role="group" aria-label="Điều khiển góc nhìn 3D" className="mt-4 flex flex-wrap gap-2">
        {(
          [
            { view: 'front', label: 'Trước' },
            { view: 'side', label: 'Bên' },
            { view: 'back', label: 'Sau' },
          ] as const
        ).map(({ view, label }) => (
          <Button
            key={view}
            type="button"
            variant="outline"
            data-variant="outline"
            size="sm"
            title={`Góc nhìn ${label.toLowerCase()}`}
            aria-label={`Góc nhìn ${label.toLowerCase()}`}
            aria-pressed={preset.view === view}
            disabled={disabled}
            onClick={() => chooseView(view)}
          >
            {label}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          data-variant="outline"
          size="sm"
          title="Đặt lại camera"
          aria-label="Đặt lại camera"
          disabled={disabled}
          onClick={() => chooseView('front')}
        >
          <RotateCcw aria-hidden="true" />
          Đặt lại
        </Button>
        <Button
          type="button"
          variant="outline"
          data-variant="outline"
          size="sm"
          title="Bật hoặc tắt tự xoay"
          aria-label="Tự xoay mô hình"
          aria-pressed={autoRotate}
          disabled={disabled}
          onClick={() => setAutoRotate((value) => !value)}
        >
          <RotateCw aria-hidden="true" />
          Tự xoay
        </Button>
      </div>
      <p className="mb-0 mt-4 text-xs leading-relaxed text-slate-500">
        Kéo chuột để xoay · Cuộn để thu phóng · Kéo chuột phải để di chuyển. Mô hình chỉ minh họa cơ
        thể tổng quan, không phản ánh số đo cá nhân.
      </p>
    </Card>
  )
}
