"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

type RiveApi = typeof import("@rive-app/webgl2");
type RiveInstance = InstanceType<RiveApi["Rive"]>;
type ViewModelInstance = import("@rive-app/webgl2").ViewModelInstance;
type ViewModelInstanceValue = import("@rive-app/webgl2").ViewModelInstanceValue;

const RIVE_ARTBOARD = "HomeComponent";
const RIVE_STATE_MACHINE = "State Machine 1";
const RIVE_VIEW_MODEL = "MainView";
const RIVE_VIEW_MODEL_INSTANCE = "Instance";
const REVEAL_DELAY_MS = 500;

export type RiveEvidence = {
  skin: string;
  eyes: string;
  hair: string;
};

export type RiveStageHandle = {
  captureFrame: () => string | null;
  reset: () => void;
  setAcceptedPermissions: (value: boolean) => void;
  setTakenImage: (dataUrl: string) => Promise<void>;
  setAiGeneratedImage: (dataUrl: string) => Promise<void>;
  setResultedPaletteId: (value: number) => void;
  setAnalyseComplete: (value: boolean) => void;
  setProgress: (value: number) => void;
  setAnalysingLabel: (value: string) => void;
  setEvidence: (evidence: RiveEvidence) => void;
};

type RiveStageProps = {
  className?: string;
  onReady?: () => void;
  onShowPermissions?: () => void;
  onPhotoTaken?: () => void;
  onAnalyseCompleteChange?: (value: boolean) => void;
  onVisibleChange?: (value: boolean) => void;
  onLoadError?: (message: string) => void;
};

function bytesFromDataUrl(dataUrl: string): Uint8Array {
  const [, base64] = dataUrl.split(",");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function normaliseRiveModule(module: unknown): RiveApi {
  const maybeDefault = module as unknown as { default?: RiveApi };
  return maybeDefault.default ?? (module as unknown as RiveApi);
}

function getLayoutScaleFactor(): number {
  return 1 / Math.max(1, window.devicePixelRatio || 1);
}

function getRiveSource(): string {
  return process.env.NODE_ENV === "development" ? `/rive/xerocon.riv?v=${Date.now()}` : "/rive/xerocon.riv";
}

export const RiveStage = forwardRef<RiveStageHandle, RiveStageProps>(function RiveStage(
  {
    className,
    onReady,
    onShowPermissions,
    onPhotoTaken,
    onAnalyseCompleteChange,
    onVisibleChange,
    onLoadError,
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const apiRef = useRef<RiveApi | null>(null);
  const riveRef = useRef<RiveInstance | null>(null);
  const vmiRef = useRef<ViewModelInstance | null>(null);
  const cleanupListenersRef = useRef<(() => void) | null>(null);
  const initialiseRef = useRef<(() => void) | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const listenerRefreshFrameRef = useRef<number | null>(null);
  const callbacksRef = useRef<
    Pick<
      RiveStageProps,
      "onAnalyseCompleteChange" | "onLoadError" | "onPhotoTaken" | "onReady" | "onShowPermissions" | "onVisibleChange"
    >
  >({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  callbacksRef.current = {
    onAnalyseCompleteChange,
    onLoadError,
    onPhotoTaken,
    onReady,
    onShowPermissions,
    onVisibleChange,
  };

  const getVmi = useCallback(() => vmiRef.current, []);

  const safelyResize = useCallback((rive: RiveInstance | null) => {
    if (!rive || !canvasRef.current?.isConnected) {
      return;
    }

    try {
      rive.resizeDrawingSurfaceToCanvas();
    } catch {
      // The canvas runtime can receive a late resize after cleanup during dev reloads.
    }
  }, []);

  const refreshRiveListeners = useCallback((rive: RiveInstance | null) => {
    if (!rive || !canvasRef.current?.isConnected) {
      return;
    }

    try {
      rive.setupRiveListeners({ isTouchScrollEnabled: false });
    } catch {
      // Listener setup can race with cleanup during fast refreshes.
    }
  }, []);

  const queueRiveListenerRefresh = useCallback(
    (rive: RiveInstance | null) => {
      if (!rive || typeof window === "undefined") {
        return;
      }

      if (listenerRefreshFrameRef.current) {
        window.cancelAnimationFrame(listenerRefreshFrameRef.current);
      }

      listenerRefreshFrameRef.current = window.requestAnimationFrame(() => {
        listenerRefreshFrameRef.current = null;

        if (riveRef.current !== rive) {
          return;
        }

        safelyResize(rive);
        refreshRiveListeners(rive);
      });
    },
    [refreshRiveListeners, safelyResize],
  );

  const setBoolean = useCallback(
    (name: string, value: boolean) => {
      const property = getVmi()?.boolean(name);

      if (property && property.value !== value) {
        property.value = value;
      }
    },
    [getVmi],
  );

  const setNumber = useCallback(
    (name: string, value: number) => {
      const property = getVmi()?.number(name);

      if (property) {
        property.value = value;
      }
    },
    [getVmi],
  );

  const setString = useCallback(
    (name: string, value: string) => {
      const property = getVmi()?.string(name);

      if (property) {
        property.value = value;
      }
    },
    [getVmi],
  );

  const setImage = useCallback(
    async (name: string, dataUrl: string) => {
      const api = apiRef.current;
      const property = getVmi()?.image(name);

      if (!api || !property) {
        return;
      }

      const image = await api.decodeImage(bytesFromDataUrl(dataUrl));
      property.value = image as never;
      image.unref();
    },
    [getVmi],
  );

  const attachViewModel = useCallback(
    (rive: RiveInstance) => {
      cleanupListenersRef.current?.();

      let vmi: ViewModelInstance | null = null;
      const configuredViewModel = rive.viewModelByName(RIVE_VIEW_MODEL);

      if (configuredViewModel) {
        vmi =
          configuredViewModel.instanceByName(RIVE_VIEW_MODEL_INSTANCE) ??
          configuredViewModel.defaultInstance() ??
          configuredViewModel.instance();
      }

      if (!vmi) {
        const fallbackViewModel = rive.defaultViewModel() ?? rive.viewModelByIndex(0);
        vmi = fallbackViewModel?.defaultInstance() ?? fallbackViewModel?.instance() ?? null;
      }

      if (vmi) {
        rive.bindViewModelInstance(vmi);
      }

      vmiRef.current = vmi;

      if (!vmi) {
        callbacksRef.current.onLoadError?.(`Could not bind ${RIVE_VIEW_MODEL}/${RIVE_VIEW_MODEL_INSTANCE}.`);
        return;
      }

      const cleanup: Array<() => void> = [];
      const listen = (property: ViewModelInstanceValue | null, callback: () => void) => {
        if (!property) {
          return;
        }

        property.on(callback);
        cleanup.push(() => property.off(callback));
      };

      listen(vmi.trigger("showPermissions"), () => callbacksRef.current.onShowPermissions?.());
      listen(vmi.trigger("photoTaken"), () => callbacksRef.current.onPhotoTaken?.());

      const analyseComplete = vmi.boolean("analyseComplete");
      const analyseCallback = ((value: boolean) =>
        callbacksRef.current.onAnalyseCompleteChange?.(Boolean(value))) as never;

      if (analyseComplete) {
        analyseComplete.on(analyseCallback);
        cleanup.push(() => analyseComplete.off(analyseCallback));
        callbacksRef.current.onAnalyseCompleteChange?.(Boolean(analyseComplete.value));
      }

      cleanupListenersRef.current = () => {
        cleanup.forEach((callback) => callback());
      };

      callbacksRef.current.onReady?.();
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    const initialise = async () => {
      const canvas = canvasRef.current;

      if (!canvas) {
        return;
      }

      const api = apiRef.current ?? normaliseRiveModule(await import("@rive-app/webgl2"));

      if (cancelled) {
        return;
      }

      apiRef.current = api;
      cleanupListenersRef.current?.();
      if (listenerRefreshFrameRef.current) {
        window.cancelAnimationFrame(listenerRefreshFrameRef.current);
        listenerRefreshFrameRef.current = null;
      }
      riveRef.current?.cleanup();
      vmiRef.current = null;
      setIsLoaded(false);
      setIsVisible(false);
      callbacksRef.current.onVisibleChange?.(false);

      if (revealTimerRef.current) {
        window.clearTimeout(revealTimerRef.current);
        revealTimerRef.current = null;
      }

      const rive = new api.Rive({
        src: getRiveSource(),
        canvas,
        artboard: RIVE_ARTBOARD,
        autoplay: true,
        autoBind: false,
        shouldDisableRiveListeners: false,
        isTouchScrollEnabled: false,
        dispatchPointerExit: true,
        enableMultiTouch: true,
        stateMachines: RIVE_STATE_MACHINE,
        layout: new api.Layout({
          fit: api.Fit.Layout,
          layoutScaleFactor: getLayoutScaleFactor(),
        }),
        onLoad: () => {
          if (cancelled) {
            return;
          }
          safelyResize(rive);
          riveRef.current = rive;
          attachViewModel(rive);
          queueRiveListenerRefresh(rive);
          setIsLoaded(true);
          revealTimerRef.current = window.setTimeout(() => {
            setIsVisible(true);
            callbacksRef.current.onVisibleChange?.(true);
            revealTimerRef.current = null;
          }, REVEAL_DELAY_MS);
        },
        onLoadError: (event) => {
          callbacksRef.current.onLoadError?.(String(event.data ?? "Rive failed to load."));
        },
      });

      riveRef.current = rive;
    };

    initialiseRef.current = () => {
      void initialise();
    };

    void initialise();

    if (canvasRef.current) {
      resizeObserver = new ResizeObserver(() => {
        const rive = riveRef.current;

        if (rive && apiRef.current) {
          rive.layout = new apiRef.current.Layout({
            fit: apiRef.current.Fit.Layout,
            layoutScaleFactor: getLayoutScaleFactor(),
          });
        }

        safelyResize(rive);
        queueRiveListenerRefresh(rive);
      });
      resizeObserver.observe(canvasRef.current);
    }

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      if (revealTimerRef.current) {
        window.clearTimeout(revealTimerRef.current);
      }
      if (listenerRefreshFrameRef.current) {
        window.cancelAnimationFrame(listenerRefreshFrameRef.current);
        listenerRefreshFrameRef.current = null;
      }
      cleanupListenersRef.current?.();
      riveRef.current?.cleanup();
      riveRef.current = null;
      vmiRef.current = null;
      callbacksRef.current.onVisibleChange?.(false);
    };
  }, [attachViewModel, queueRiveListenerRefresh, safelyResize]);

  useImperativeHandle(
    ref,
    () => ({
      captureFrame: () => {
        const canvas = canvasRef.current;

        if (!canvas) {
          return null;
        }

        return canvas.toDataURL("image/png");
      },
      reset: () => {
        callbacksRef.current.onAnalyseCompleteChange?.(false);
        initialiseRef.current?.();
      },
      setAcceptedPermissions: (value: boolean) => setBoolean("acceptedPermissions", value),
      setTakenImage: (dataUrl: string) => setImage("takenImage", dataUrl),
      setAiGeneratedImage: (dataUrl: string) => setImage("aiGeneratedImage", dataUrl),
      setResultedPaletteId: (value: number) => setNumber("resultedPaletteID", value),
      setAnalyseComplete: (value: boolean) => {
        setBoolean("analyseComplete", value);
        callbacksRef.current.onAnalyseCompleteChange?.(value);
      },
      setProgress: (value: number) => setNumber("progress", value),
      setAnalysingLabel: (value: string) => setString("analysingLabel", value),
      setEvidence: (evidence: RiveEvidence) => {
        setString("evidenceSkin", evidence.skin);
        setString("evidenceEyes", evidence.eyes);
        setString("evidenceHair", evidence.hair);
      },
    }),
    [setBoolean, setImage, setNumber, setString],
  );

  return (
    <div className={className} data-rive-loaded={isLoaded} data-rive-visible={isVisible}>
      <canvas ref={canvasRef} aria-label="Xero Hue interactive colour analysis experience" />
      {!isVisible ? <div className="rive-loading">Loading experience</div> : null}
    </div>
  );
});
