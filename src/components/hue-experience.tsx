"use client";

import QRCode from "qrcode";
import { Download, RotateCcw, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AnalysisResult } from "@/lib/analysis-types";
import { RiveStage, type RiveStageHandle } from "@/components/rive-stage";

type ReportUploadResponse = {
  id: string;
  storage: "blob" | "memory";
  downloadPageUrl: string;
  imageUrl: string;
};

type QrOverlayState = {
  status: "loading" | "ready";
  qrDataUrl?: string;
  downloadPageUrl?: string;
  imageUrl?: string;
  storage?: "blob" | "memory";
};

type ConsentModalState = "closed" | "entering" | "exiting";

const CONSENT_EXIT_MS = 460;
const CONSENT_OPEN_DELAY_MS = 300;
const CAPTURE_ASPECT_RATIO = 3 / 4;
const CAPTURE_WIDTH = 960;
const CAPTURE_HEIGHT = 1280;
const GENERATED_IMAGE_WIDTH = 2048;
const GENERATED_IMAGE_HEIGHT = 2048;
const REPORT_UPLOAD_MAX_WIDTH = 1620;
const REPORT_UPLOAD_MAX_HEIGHT = 2160;
const REPORT_UPLOAD_TARGET_BYTES = 3_400_000;
const ANALYSIS_RETRY_DELAY_MS = 900;
const PHOTO_CAPTURE_DELAY_MS = 3000;
const PROGRESS_TWEEN_MS = 650;
const ANALYSIS_PROGRESS_STEPS = [
  { progress: 0, label: "INITIALIZING CHROMATIC SCANNER..." },
  { progress: 10, label: "ANALYSING FACIAL TONES..." },
  { progress: 20, label: "MAPPING COLOUR PROFILE..." },
  { progress: 30, label: "SCANNING NATURAL CONTRAST..." },
  { progress: 40, label: "DETECTING UNDERTONES..." },
  { progress: 50, label: "CALIBRATING HUE RANGE..." },
  { progress: 60, label: "PROCESSING COLOUR MATCH..." },
  { progress: 70, label: "BUILDING PERSONAL PALETTE..." },
  { progress: 80, label: "REFINING SHADE SELECTION..." },
  { progress: 90, label: "GENERATING COLOUR REPORT..." },
  { progress: 100, label: "GENERATING COLOUR REPORT..." },
] as const;

class AnalysisRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AnalysisRequestError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function isTransientAiCapacityError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  const status = error instanceof AnalysisRequestError ? error.status : 0;

  return (
    status === 503 ||
    message.includes("503") ||
    message.includes("unavailable") ||
    message.includes("high demand") ||
    message.includes("please try again later")
  );
}

function getAnalysisLabel(progress: number): string {
  for (let index = ANALYSIS_PROGRESS_STEPS.length - 1; index >= 0; index -= 1) {
    const step = ANALYSIS_PROGRESS_STEPS[index];

    if (progress >= step.progress) {
      return step.label;
    }
  }

  return ANALYSIS_PROGRESS_STEPS[0].label;
}

function easeOutCubic(value: number): number {
  return 1 - (1 - value) ** 3;
}

type NormalizedImage = {
  dataUrl: string;
  mimeType: string;
  sourceWidth: number;
  sourceHeight: number;
  width: number;
  height: number;
};

function loadDataUrlImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load generated image for Rive."));
    image.src = dataUrl;
  });
}

async function normalizeImageForRive(
  dataUrl: string,
  width: number,
  height: number,
  mimeType = "image/jpeg",
): Promise<NormalizedImage> {
  const image = await loadDataUrlImage(dataUrl);
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;

  if (!sourceWidth || !sourceHeight) {
    throw new Error("Generated image has no readable dimensions.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not create a generated image resize canvas.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, width, height);

  const scale = Math.min(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const drawX = (width - drawWidth) / 2;
  const drawY = (height - drawHeight) / 2;

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);

  return {
    dataUrl: canvas.toDataURL(mimeType, 0.94),
    mimeType,
    sourceWidth,
    sourceHeight,
    width,
    height,
  };
}

async function encodeReportFrameForUpload(dataUrl: string): Promise<string> {
  const image = await loadDataUrlImage(dataUrl);
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;

  if (!sourceWidth || !sourceHeight) {
    throw new Error("Report image has no readable dimensions.");
  }

  const scale = Math.min(1, REPORT_UPLOAD_MAX_WIDTH / sourceWidth, REPORT_UPLOAD_MAX_HEIGHT / sourceHeight);
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not create a report export canvas.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const qualities = [0.9, 0.82, 0.74, 0.66];
  let encoded = canvas.toDataURL("image/jpeg", qualities[0]);
  let quality = qualities[0];

  for (const nextQuality of qualities) {
    const nextEncoded = canvas.toDataURL("image/jpeg", nextQuality);
    encoded = nextEncoded;
    quality = nextQuality;

    if (Math.ceil((nextEncoded.length * 3) / 4) <= REPORT_UPLOAD_TARGET_BYTES) {
      break;
    }
  }

  console.info("[hue] Report frame encoded for upload", {
    sourceWidth,
    sourceHeight,
    uploadWidth: width,
    uploadHeight: height,
    quality,
    approximateBytes: Math.ceil((encoded.length * 3) / 4),
  });

  return encoded;
}

function captureVideoFrame(video: HTMLVideoElement): string {
  if (!video.videoWidth || !video.videoHeight) {
    throw new Error("Camera is still warming up. Please try again in a moment.");
  }

  const videoAspectRatio = video.videoWidth / video.videoHeight;
  let sourceWidth = video.videoWidth;
  let sourceHeight = video.videoHeight;

  if (videoAspectRatio > CAPTURE_ASPECT_RATIO) {
    sourceWidth = video.videoHeight * CAPTURE_ASPECT_RATIO;
  } else {
    sourceHeight = video.videoWidth / CAPTURE_ASPECT_RATIO;
  }

  const sourceX = (video.videoWidth - sourceWidth) / 2;
  const sourceY = (video.videoHeight - sourceHeight) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = CAPTURE_WIDTH;
  canvas.height = CAPTURE_HEIGHT;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not create a camera capture canvas.");
  }

  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", 0.92);
}

function isAnalysisOnlyDebugEnabled(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get("analysisOnly") === "1" || window.localStorage.getItem("hue:analysis-only") === "true";
}

export function HueExperience() {
  const stageRef = useRef<RiveStageHandle | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const progressAnimationFrameRef = useRef<number | null>(null);
  const progressValueRef = useRef(0);
  const photoCaptureTimerRef = useRef<number | null>(null);
  const consentOpenTimerRef = useRef<number | null>(null);
  const consentExitTimerRef = useRef<number | null>(null);
  const acceptedConsentRef = useRef(false);
  const [consentState, setConsentState] = useState<ConsentModalState>("closed");
  const [consentChecked, setConsentChecked] = useState(true);
  const [hasAcceptedConsent, setHasAcceptedConsent] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isRiveVisible, setIsRiveVisible] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [qrOverlay, setQrOverlay] = useState<QrOverlayState | null>(null);
  const [, setError] = useState<string | null>(null);
  const [, setRiveError] = useState<string | null>(null);

  const clearProgressTimer = useCallback(() => {
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  const clearProgressAnimation = useCallback(() => {
    if (progressAnimationFrameRef.current) {
      window.cancelAnimationFrame(progressAnimationFrameRef.current);
      progressAnimationFrameRef.current = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const openConsent = useCallback(() => {
    if (consentOpenTimerRef.current) {
      window.clearTimeout(consentOpenTimerRef.current);
      consentOpenTimerRef.current = null;
    }

    if (consentExitTimerRef.current) {
      window.clearTimeout(consentExitTimerRef.current);
      consentExitTimerRef.current = null;
    }

    setConsentState("entering");
  }, []);

  const closeConsent = useCallback((afterClosed?: () => void) => {
    if (consentOpenTimerRef.current) {
      window.clearTimeout(consentOpenTimerRef.current);
      consentOpenTimerRef.current = null;
    }

    if (consentExitTimerRef.current) {
      window.clearTimeout(consentExitTimerRef.current);
    }

    setConsentState("exiting");
    consentExitTimerRef.current = window.setTimeout(() => {
      setConsentState("closed");
      consentExitTimerRef.current = null;
      afterClosed?.();
    }, CONSENT_EXIT_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (consentOpenTimerRef.current) {
        window.clearTimeout(consentOpenTimerRef.current);
      }

      if (consentExitTimerRef.current) {
        window.clearTimeout(consentExitTimerRef.current);
      }

      clearProgressTimer();
      clearProgressAnimation();
      if (photoCaptureTimerRef.current) {
        window.clearTimeout(photoCaptureTimerRef.current);
      }
      stopCamera();
    };
  }, [clearProgressAnimation, clearProgressTimer, stopCamera]);

  const startCamera = useCallback(async () => {
    if (streamRef.current) {
      return true;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser does not expose camera access.");
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraReady(true);
      setError(null);
      return true;
    } catch (cameraError) {
      setError(cameraError instanceof Error ? cameraError.message : "Camera permission was not granted.");
      return false;
    }
  }, []);

  useEffect(() => {
    const cameraWarmupTimer = window.setTimeout(() => {
      void startCamera();
    }, 0);

    return () => {
      window.clearTimeout(cameraWarmupTimer);
    };
  }, [startCamera]);

  const handleConsentConfirm = useCallback(() => {
    if (!consentChecked) {
      setError("Please acknowledge the privacy terms before continuing.");
      return;
    }

    acceptedConsentRef.current = true;
    closeConsent(() => {
      setHasAcceptedConsent(true);
      stageRef.current?.setAcceptedPermissions(true);
    });
    setError(null);
    void startCamera();
  }, [closeConsent, consentChecked, startCamera]);

  const handleConsentDecline = useCallback(() => {
    closeConsent();
    setError(null);
  }, [closeConsent]);

  const setAnalysisProgress = useCallback(
    (progress: number, label?: string, immediate = false) => {
      const targetProgress = Math.max(0, Math.min(100, progress));
      const startProgress = progressValueRef.current;

      clearProgressAnimation();

      if (immediate || startProgress === targetProgress) {
        progressValueRef.current = targetProgress;
        stageRef.current?.setProgress(targetProgress);
        stageRef.current?.setAnalysingLabel(label ?? getAnalysisLabel(targetProgress));
        return;
      }

      const startedAt = performance.now();

      const tick = (now: number) => {
        const elapsed = now - startedAt;
        const amount = Math.min(1, elapsed / PROGRESS_TWEEN_MS);
        const easedAmount = easeOutCubic(amount);
        const currentProgress = Number((startProgress + (targetProgress - startProgress) * easedAmount).toFixed(2));

        progressValueRef.current = currentProgress;
        stageRef.current?.setProgress(currentProgress);
        stageRef.current?.setAnalysingLabel(label ?? getAnalysisLabel(currentProgress));

        if (amount < 1) {
          progressAnimationFrameRef.current = window.requestAnimationFrame(tick);
        } else {
          progressAnimationFrameRef.current = null;
          progressValueRef.current = targetProgress;
          stageRef.current?.setProgress(targetProgress);
          stageRef.current?.setAnalysingLabel(label ?? getAnalysisLabel(targetProgress));
        }
      };

      progressAnimationFrameRef.current = window.requestAnimationFrame(tick);
    },
    [clearProgressAnimation],
  );

  const resetExperience = useCallback(() => {
    clearProgressTimer();
    clearProgressAnimation();
    if (photoCaptureTimerRef.current) {
      window.clearTimeout(photoCaptureTimerRef.current);
      photoCaptureTimerRef.current = null;
    }
    stageRef.current?.reset();
    setAnalysisProgress(0, undefined, true);
    if (consentOpenTimerRef.current) {
      window.clearTimeout(consentOpenTimerRef.current);
      consentOpenTimerRef.current = null;
    }
    if (consentExitTimerRef.current) {
      window.clearTimeout(consentExitTimerRef.current);
      consentExitTimerRef.current = null;
    }
    setConsentState("closed");
    acceptedConsentRef.current = false;
    setHasAcceptedConsent(false);
    setIsRiveVisible(false);
    setAnalysisComplete(false);
    setAnalysisResult(null);
    setIsAnalysing(false);
    setIsSaving(false);
    setQrOverlay(null);
    setError(null);
    void startCamera();
  }, [clearProgressAnimation, clearProgressTimer, setAnalysisProgress, startCamera]);

  const analyseImage = useCallback(
    async (image: string) => {
      setIsAnalysing(true);
      setAnalysisComplete(false);
      setAnalysisResult(null);
      setQrOverlay(null);
      setError(null);
      stageRef.current?.setAnalyseComplete(false);
      stageRef.current?.setEvidence({ skin: "", eyes: "", hair: "" });
      setAnalysisProgress(0, undefined, true);

      let progress = 10;
      clearProgressTimer();
      progressTimerRef.current = window.setInterval(() => {
        progress = Math.min(progress + 5, 85);
        setAnalysisProgress(progress);
      }, 1600);

      try {
        await stageRef.current?.setTakenImage(image);
        setAnalysisProgress(20);
        const debugAnalysisOnly = isAnalysisOnlyDebugEnabled();

        const requestAnalysis = async () => {
          const response = await fetch("/api/analyse", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ image, debugAnalysisOnly }),
          });

          if (!response.ok) {
            const body = (await response.json().catch(() => null)) as { error?: string } | null;
            throw new AnalysisRequestError(body?.error ?? "Palette analysis failed.", response.status);
          }

          return (await response.json()) as AnalysisResult;
        };

        let result: AnalysisResult;

        try {
          result = await requestAnalysis();
        } catch (firstAttemptError) {
          if (!isTransientAiCapacityError(firstAttemptError)) {
            throw firstAttemptError;
          }

          console.info("[hue] AI capacity error, retrying analysis once.", {
            message: firstAttemptError instanceof Error ? firstAttemptError.message : String(firstAttemptError),
          });
          setAnalysisProgress(55, "PROCESSING COLOUR MATCH...");
          await sleep(ANALYSIS_RETRY_DELAY_MS);
          result = await requestAnalysis();
        }

        const normalizedGeneratedImage = await normalizeImageForRive(
          result.generatedImage,
          GENERATED_IMAGE_WIDTH,
          GENERATED_IMAGE_HEIGHT,
        );

        console.info("[hue] AI colour analysis result", {
          paletteId: result.paletteId,
          paletteName: result.paletteName,
          confidence: result.confidence,
          stylePresentation: result.stylePresentation,
          rationale: result.rationale,
          evidence: result.evidence,
          warnings: result.warnings,
          generatedImage: {
            sourceMimeType: result.generatedImageMimeType,
            sourceWidth: normalizedGeneratedImage.sourceWidth,
            sourceHeight: normalizedGeneratedImage.sourceHeight,
            riveMimeType: normalizedGeneratedImage.mimeType,
            riveWidth: normalizedGeneratedImage.width,
            riveHeight: normalizedGeneratedImage.height,
          },
        });

        setAnalysisProgress(90);
        stageRef.current?.setEvidence(result.evidence);
        await stageRef.current?.setAiGeneratedImage(normalizedGeneratedImage.dataUrl);
        stageRef.current?.setResultedPaletteId(result.paletteId);
        setAnalysisProgress(100);
        stageRef.current?.setAnalyseComplete(true);

        setAnalysisResult(result);
        setAnalysisComplete(true);

        if (result.warnings?.length) {
          setError(result.warnings[0]);
        }
      } catch (analysisError) {
        stageRef.current?.setAnalyseComplete(false);
        if (isTransientAiCapacityError(analysisError)) {
          console.warn("[hue] AI capacity error after retry; resetting experience.", {
            message: analysisError instanceof Error ? analysisError.message : String(analysisError),
          });
          resetExperience();
        } else {
          setError(analysisError instanceof Error ? analysisError.message : "Something went wrong during analysis.");
        }
      } finally {
        clearProgressTimer();
        setIsAnalysing(false);
      }
    },
    [clearProgressTimer, resetExperience, setAnalysisProgress],
  );

  const handlePhotoTaken = useCallback(async () => {
    if (isAnalysing) {
      return;
    }

    if (photoCaptureTimerRef.current) {
      return;
    }

    if (!streamRef.current || !videoRef.current) {
      void startCamera();
      setError("Camera is still getting ready. Please try again in a moment.");
      return;
    }

    photoCaptureTimerRef.current = window.setTimeout(() => {
      photoCaptureTimerRef.current = null;

      if (isAnalysing) {
        return;
      }

      if (!streamRef.current || !videoRef.current) {
        void startCamera();
        setError("Camera is still getting ready. Please try again in a moment.");
        return;
      }

      try {
        const image = captureVideoFrame(videoRef.current);
        void analyseImage(image);
      } catch (captureError) {
        setError(captureError instanceof Error ? captureError.message : "Could not capture the camera frame.");
      }
    }, PHOTO_CAPTURE_DELAY_MS);
  }, [analyseImage, isAnalysing, startCamera]);

  const handleShowPermissions = useCallback(() => {
    if (acceptedConsentRef.current) {
      stageRef.current?.setAcceptedPermissions(true);
      return;
    }

    if (consentOpenTimerRef.current) {
      window.clearTimeout(consentOpenTimerRef.current);
    }

    consentOpenTimerRef.current = window.setTimeout(() => {
      consentOpenTimerRef.current = null;
      openConsent();
    }, CONSENT_OPEN_DELAY_MS);
  }, [openConsent]);

  const handleReset = useCallback(() => {
    resetExperience();
  }, [resetExperience]);

  const handleSaveReport = useCallback(async () => {
    if (!analysisComplete || isSaving) {
      return;
    }

    const frame = stageRef.current?.captureFrame();

    if (!frame) {
      setError("The report frame is not ready to save yet.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setQrOverlay({ status: "loading" });

    try {
      const uploadFrame = await encodeReportFrameForUpload(frame);

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: uploadFrame,
          paletteId: analysisResult?.paletteId,
          paletteName: analysisResult?.paletteName,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Could not save your report image.");
      }

      const report = (await response.json()) as ReportUploadResponse;
      const qrDataUrl = await QRCode.toDataURL(report.downloadPageUrl, {
        width: 380,
        margin: 1,
        color: {
          dark: "#062F48",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "M",
      });

      setQrOverlay({
        status: "ready",
        qrDataUrl,
        downloadPageUrl: report.downloadPageUrl,
        imageUrl: report.imageUrl,
        storage: report.storage,
      });
    } catch (saveError) {
      setQrOverlay(null);
      setError(saveError instanceof Error ? saveError.message : "Could not create the QR code.");
    } finally {
      setIsSaving(false);
    }
  }, [analysisComplete, analysisResult, isSaving]);

  const footerMode = analysisComplete ? "report" : hasAcceptedConsent ? "active" : "home";

  return (
    <main className="experience-shell">
      <section className="experience-frame" aria-label="Xero Hue colour analysis booth">
        <video
          ref={videoRef}
          className="camera-feed"
          autoPlay
          muted
          playsInline
          data-ready={cameraReady}
          data-rive-visible={isRiveVisible}
        />

        <RiveStage
          ref={stageRef}
          className="rive-stage"
          onShowPermissions={handleShowPermissions}
          onPhotoTaken={handlePhotoTaken}
          onAnalyseCompleteChange={setAnalysisComplete}
          onVisibleChange={setIsRiveVisible}
          onLoadError={setRiveError}
        />

        {!isRiveVisible ? <div className="experience-loading-mask" aria-hidden="true" /> : null}

        {consentState !== "closed" ? (
          <div
            className="modal-layer consent-layer"
            data-state={consentState}
            role="dialog"
            aria-modal="true"
            aria-labelledby="consent-title"
          >
            <div className="consent-card">
              <button className="icon-button close-button" type="button" onClick={handleConsentDecline} aria-label="Close">
                <X size={18} />
              </button>
              <h1 id="consent-title">PRIVACY &amp; CONSENT</h1>
              <p className="consent-intro">Before we begin, please review and confirm the agreements below.</p>
              <ol className="consent-list">
                <li>We use a camera to capture one photo for analysis.</li>
                <li>Your photo is processed in real time to determine your palette.</li>
                <li>Photos are not permanently stored and are deleted after your session ends.</li>
                <li>No personal data such as name or email is collected or shared.</li>
                <li>The generated visual synthesis is for personal use and entertainment.</li>
              </ol>
              <label className="consent-check">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(event) => setConsentChecked(event.target.checked)}
                />
                <span className="check-mark">
                  <ShieldCheck size={24} />
                </span>
                <span>
                  <strong>I understand and agree to the processing of my image</strong>
                  <small>
                    Xero will collect and use your photo solely for the purpose of providing your color palette. For more
                    information on how Xero processes your personal data, please see our Privacy Notice. By clicking continue
                    below, you acknowledge and agree to these terms.
                  </small>
                </span>
              </label>
              <div className="consent-actions">
                <button className="primary-action" type="button" onClick={handleConsentConfirm}>
                  Continue
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {qrOverlay ? (
          <div className="modal-layer qr-layer" role="dialog" aria-modal="true" aria-labelledby="qr-title">
            <div className="qr-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="qr-logo" src="/images/Logo-Xero.svg" alt="Xero" />
              <p id="qr-title" className="qr-kicker">
                KEEP IT FOREVER
              </p>
              {qrOverlay.status === "loading" ? (
                <div className="qr-loading" aria-label="Preparing QR code" />
              ) : (
                <a className="qr-link" href={qrOverlay.imageUrl} target="_blank" rel="noreferrer" aria-label="Open report image">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="qr-image" src={qrOverlay.qrDataUrl} alt="QR code to download your Hue report" />
                </a>
              )}
              <p className="qr-copy">
                {qrOverlay.status === "loading"
                  ? "Preparing your report for download."
                  : "Scan the QR code and save the image straight to your phone."}
              </p>
              {qrOverlay.status === "ready" && qrOverlay.storage === "memory" ? (
                <p className="qr-warning">Local preview mode: cross-device download needs Vercel Blob configured.</p>
              ) : null}
              <div className="qr-actions">
                <button className="primary-action compact" type="button" onClick={() => setQrOverlay(null)}>
                  Back to report
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <footer className="experience-footer" data-mode={footerMode}>
        {hasAcceptedConsent ? (
          <button className="footer-button" type="button" onClick={handleReset} disabled={isAnalysing || isSaving}>
            <RotateCcw size={16} />
            Start over
          </button>
        ) : null}
        {!analysisComplete ? (
          <p className="footer-legal">
            For more information, please visit Xero&apos;s{" "}
            <a href="https://www.xero.com/sg/legal/privacy/" target="_blank" rel="noreferrer">
              Privacy Policy
            </a>{" "}
            and{" "}
            <a href="https://www.xero.com/sg/legal/terms/" target="_blank" rel="noreferrer">
              Terms &amp; Conditions
            </a>
            .
          </p>
        ) : null}
        {analysisComplete ? (
          <button
            className="footer-button primary-footer"
            type="button"
            onClick={handleSaveReport}
            disabled={isAnalysing || isSaving}
          >
            <Download size={16} />
            Save your report
          </button>
        ) : null}
      </footer>
    </main>
  );
}
