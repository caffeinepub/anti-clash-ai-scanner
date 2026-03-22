import { Button } from "@/components/ui/button";
import { Camera, FlipHorizontal, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface FaceScanModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
}

export default function FaceScanModal({
  open,
  onClose,
  onCapture,
}: FaceScanModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      setCameraError("Camera access denied. Please allow camera permissions.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) {
        t.stop();
      }
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (open) {
      setPreview(null);
      startCamera();
    } else {
      stopCamera();
      setPreview(null);
    }
    return () => stopCamera();
  }, [open, startCamera, stopCamera]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const size = Math.min(video.videoWidth, video.videoHeight);
    const offsetX = (video.videoWidth - size) / 2;
    const offsetY = (video.videoHeight - size) / 2;

    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d")!;
    // Mirror flip
    ctx.translate(400, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, 400, 400);
    ctx.resetTransform();

    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setPreview(dataUrl);
    stopCamera();
  }, [stopCamera]);

  const retake = useCallback(() => {
    setPreview(null);
    startCamera();
  }, [startCamera]);

  const confirm = useCallback(() => {
    if (preview) {
      onCapture(preview);
      onClose();
    }
  }, [preview, onCapture, onClose]);

  const handleClose = useCallback(() => {
    stopCamera();
    setPreview(null);
    onClose();
  }, [stopCamera, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      data-ocid="face_scan.modal"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
        role="button"
        tabIndex={-1}
        onKeyDown={(e) => e.key === "Escape" && handleClose()}
        aria-label="Close face scan"
      />

      {/* Modal panel */}
      <div className="relative z-10 w-full max-w-sm bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="text-base font-bold text-foreground">
              Scan Your Face
            </h2>
            <p className="text-xs text-muted-foreground">
              Personalise your avatar
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-muted transition-colors"
            data-ocid="face_scan.close_button"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera / preview area */}
        <div
          className="relative mx-4 mb-4 rounded-2xl overflow-hidden bg-black"
          style={{ aspectRatio: "1/1" }}
        >
          {!preview && !cameraError && (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
                autoPlay
                playsInline
                muted
              />
              {/* Oval guide overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg
                  width="72%"
                  height="80%"
                  viewBox="0 0 200 220"
                  fill="none"
                  aria-label="Face oval guide"
                  role="img"
                >
                  <ellipse
                    cx="100"
                    cy="110"
                    rx="88"
                    ry="100"
                    stroke="white"
                    strokeWidth="3"
                    strokeDasharray="8 4"
                    opacity={0.8}
                  />
                </svg>
              </div>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </>
          )}

          {preview && (
            <img
              src={preview}
              alt="Captured face"
              className="w-full h-full object-cover"
            />
          )}

          {cameraError && (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
              <Camera className="w-10 h-10 text-muted-foreground" />
              <p className="text-center text-sm text-muted-foreground">
                {cameraError}
              </p>
              <Button size="sm" variant="outline" onClick={startCamera}>
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* Instructions */}
        {!preview && !cameraError && (
          <p className="text-center text-xs text-muted-foreground px-4 pb-2">
            <FlipHorizontal className="inline w-3 h-3 mr-1" />
            Position your face within the oval
          </p>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 px-4 pb-6">
          {!preview ? (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClose}
                data-ocid="face_scan.cancel_button"
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={capture}
                disabled={!!cameraError || isLoading}
                data-ocid="face_scan.primary_button"
              >
                <Camera className="w-4 h-4 mr-2" />
                Capture
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={retake}
                data-ocid="face_scan.secondary_button"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake
              </Button>
              <Button
                className="flex-1"
                onClick={confirm}
                data-ocid="face_scan.confirm_button"
              >
                Use This Photo
              </Button>
            </>
          )}
        </div>

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
