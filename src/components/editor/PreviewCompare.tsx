import React, { Suspense } from 'react';
import type { MaterialDraft } from '../../types/material';
import type { PreviewEnv, PreviewModel } from './EditorFields';
import type { MaterialPreviewHandle } from '../MaterialPreview';

const MaterialPreview = React.lazy(() => import('../MaterialPreview'));

type PreviewCompareProps = {
  compareOn: boolean;
  compareA: MaterialDraft | null;
  material: MaterialDraft;
  previewRef: React.RefObject<MaterialPreviewHandle>;
  previewEnabled: boolean;
  previewAutoEnable: boolean;
  onEnablePreview: () => void;
  onAlwaysEnablePreview: () => void;
  previewEnv: PreviewEnv;
  previewModel: PreviewModel;
  autoRotate: boolean;
  enableZoom: boolean;
  showGrid: boolean;
  showBackground: boolean;
  onPrimaryPreviewReady?: () => void;
};

const previewFallback = <div className="w-full h-full rounded-xl bg-white/5 animate-pulse" aria-hidden="true" />;
const frameClass = 'w-full sm:w-[360px] md:w-[400px] aspect-square relative rounded-2xl overflow-hidden glass-panel';

export function PreviewCompare({
  compareOn,
  compareA,
  material,
  previewRef,
  previewEnabled,
  previewAutoEnable,
  onEnablePreview,
  onAlwaysEnablePreview,
  previewEnv,
  previewModel,
  autoRotate,
  enableZoom,
  showGrid,
  showBackground,
  onPrimaryPreviewReady,
}: PreviewCompareProps) {
  const fallbackSwatchStyle: React.CSSProperties = {
    background: `radial-gradient(circle at 25% 20%, rgba(255,255,255,0.28), rgba(255,255,255,0) 45%), linear-gradient(145deg, ${material.color} 0%, #111827 100%)`,
  };
  const [renderPreview, setRenderPreview] = React.useState(false);

  React.useEffect(() => {
    if (!previewEnabled) {
      setRenderPreview(false);
      return;
    }

    let timeoutId: number | undefined;
    let idleId: number | undefined;
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (idleWindow.requestIdleCallback) {
      idleId = idleWindow.requestIdleCallback(() => setRenderPreview(true), { timeout: 300 });
    } else {
      timeoutId = window.setTimeout(() => setRenderPreview(true), 120);
    }

    return () => {
      if (idleId !== undefined && idleWindow.cancelIdleCallback) {
        idleWindow.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [previewEnabled]);

  if (!previewEnabled) {
    return (
      <div className={compareOn && compareA ? 'flex flex-col sm:flex-row gap-4' : ''}>
        {compareOn && compareA && (
          <div className={frameClass}>
            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-black/50 text-xs text-white/80">
              A
            </div>
            <div className="w-full h-full rounded-2xl" style={fallbackSwatchStyle} aria-hidden="true" />
          </div>
        )}
        <div className={frameClass}>
          {compareOn && compareA && (
            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-black/50 text-xs text-white/80">
              B
            </div>
          )}
          <div className="w-full h-full rounded-2xl relative" style={fallbackSwatchStyle}>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center bg-slate-950/40 backdrop-blur-[2px]">
              <div className="text-xs text-white/90 max-w-[280px] leading-relaxed">
                3D preview is off for faster startup and lower memory use.
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button type="button" onClick={onEnablePreview} className="ui-btn ui-btn-primary px-4 py-2 text-sm">
                  Enable 3D now
                </button>
                {!previewAutoEnable && (
                  <button type="button" onClick={onAlwaysEnablePreview} className="ui-btn px-4 py-2 text-sm">
                    Always enable on startup
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!renderPreview) {
    return (
      <div className={compareOn && compareA ? 'flex flex-col sm:flex-row gap-4' : ''}>
        {compareOn && compareA && (
          <div className={frameClass}>
            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-black/50 text-xs text-white/80">
              A
            </div>
            {previewFallback}
          </div>
        )}
        <div className={frameClass}>
          {compareOn && compareA && (
            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-black/50 text-xs text-white/80">
              B
            </div>
          )}
          {previewFallback}
        </div>
      </div>
    );
  }

  return (
    <div className={compareOn && compareA ? 'flex flex-col sm:flex-row gap-4' : ''}>
      {compareOn && compareA && (
        <div className={frameClass}>
          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-black/50 text-xs text-white/80">A</div>
          <Suspense fallback={previewFallback}>
            <MaterialPreview
              className="w-full h-full"
              color={compareA.color}
              metalness={compareA.metalness}
              roughness={compareA.roughness}
              emissive={compareA.emissive}
              emissiveIntensity={compareA.emissiveIntensity}
              clearcoat={compareA.clearcoat}
              clearcoatRoughness={compareA.clearcoatRoughness}
              transmission={compareA.transmission}
              ior={compareA.ior}
              opacity={compareA.opacity}
              baseColorMap={compareA.baseColorMap}
              normalMap={compareA.normalMap}
              normalScale={compareA.normalScale}
              roughnessMap={compareA.roughnessMap}
              metalnessMap={compareA.metalnessMap}
              aoMap={compareA.aoMap}
              emissiveMap={compareA.emissiveMap}
              alphaMap={compareA.alphaMap}
              aoIntensity={compareA.aoIntensity}
              alphaTest={compareA.alphaTest}
              repeatX={compareA.repeatX}
              repeatY={compareA.repeatY}
              environment={previewEnv}
              model={previewModel}
              autoRotate={autoRotate}
              enableZoom={enableZoom}
              showGrid={showGrid}
              showBackground={showBackground}
            />
          </Suspense>
        </div>
      )}

      <div className={frameClass}>
        {compareOn && compareA && (
          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-black/50 text-xs text-white/80">B</div>
        )}
        <Suspense fallback={previewFallback}>
          <MaterialPreview
            ref={previewRef}
            onReady={onPrimaryPreviewReady}
            className="w-full h-full"
            color={material.color}
            metalness={material.metalness}
            roughness={material.roughness}
            emissive={material.emissive}
            emissiveIntensity={material.emissiveIntensity}
            clearcoat={material.clearcoat}
            clearcoatRoughness={material.clearcoatRoughness}
            transmission={material.transmission}
            ior={material.ior}
            opacity={material.opacity}
            baseColorMap={material.baseColorMap}
            normalMap={material.normalMap}
            normalScale={material.normalScale}
            roughnessMap={material.roughnessMap}
            metalnessMap={material.metalnessMap}
            aoMap={material.aoMap}
            emissiveMap={material.emissiveMap}
            alphaMap={material.alphaMap}
            aoIntensity={material.aoIntensity}
            alphaTest={material.alphaTest}
            repeatX={material.repeatX}
            repeatY={material.repeatY}
            environment={previewEnv}
            model={previewModel}
            autoRotate={autoRotate}
            enableZoom={enableZoom}
            showGrid={showGrid}
            showBackground={showBackground}
          />
        </Suspense>
      </div>
    </div>
  );
}
