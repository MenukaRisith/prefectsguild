"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { Camera, CheckCircle2, Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ScanResponse = {
  status: "accepted" | "duplicate" | "invalid";
  message: string;
  prefect: {
    fullName: string;
    displayName: string;
    prefectIdentifier: string;
  } | null;
};

type CameraDevice = {
  deviceId: string;
  label: string;
};

type ScannerStatus = "starting" | "active" | "error";

function mapCameraDevices(devices: MediaDeviceInfo[]) {
  return devices
    .filter((device) => device.kind === "videoinput")
    .map((device, index) => ({
      deviceId: device.deviceId,
      label: device.label || `Camera ${index + 1}`,
    }));
}

function scannerLabelForDevice(devices: CameraDevice[], deviceId: string) {
  const selected = devices.find((device) => device.deviceId === deviceId);

  if (!selected) {
    return "Browser camera scanner";
  }

  return `Browser camera scanner: ${selected.label}`;
}

function buildCameraConstraints(deviceId?: string): MediaStreamConstraints {
  if (deviceId) {
    return {
      audio: false,
      video: {
        deviceId: { exact: deviceId },
      },
    };
  }

  return {
    audio: false,
    video: {
      facingMode: { ideal: "environment" },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  };
}

export function QrScanner() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const devicesRef = useRef<CameraDevice[]>([]);
  const selectedDeviceIdRef = useRef("");
  const requestIdRef = useRef(0);
  const isMountedRef = useRef(false);
  const lockRef = useRef(false);
  const [status, setStatus] = useState<ScannerStatus>("starting");
  const [manualToken, setManualToken] = useState("");
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [showCameraOptions, setShowCameraOptions] = useState(false);

  const loadDevices = useCallback(async () => {
    try {
      const availableDevices = mapCameraDevices(
        await BrowserQRCodeReader.listVideoInputDevices(),
      );

      devicesRef.current = availableDevices;
      setDevices(availableDevices);
      return availableDevices;
    } catch {
      devicesRef.current = [];
      setDevices([]);
      return [];
    }
  }, []);

  const stopScanner = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const submitToken = useCallback(async (token: string, deviceId = selectedDeviceIdRef.current) => {
    const trimmedToken = token.trim();

    if (!trimmedToken || lockRef.current) {
      return;
    }

    lockRef.current = true;
    setError(null);

    try {
      const response = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: trimmedToken,
          scannerLabel: scannerLabelForDevice(devicesRef.current, deviceId),
        }),
      });

      const payload = (await response.json()) as ScanResponse;
      setResult(payload);
    } catch {
      setError("Unable to submit the scan right now. Check the connection and try again.");
    } finally {
      window.setTimeout(() => {
        lockRef.current = false;
      }, 1200);
    }
  }, []);

  const startScanner = useCallback(async (deviceId = selectedDeviceIdRef.current) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setStatus("starting");
    setError(null);
    stopScanner();

    try {
      const reader = readerRef.current ?? new BrowserQRCodeReader();
      readerRef.current = reader;

      if (!videoRef.current) {
        throw new Error("Camera preview is not available.");
      }

      const controls = await reader.decodeFromConstraints(
        buildCameraConstraints(deviceId),
        videoRef.current,
        async (scanResult) => {
          if (!scanResult) {
            return;
          }

          await submitToken(scanResult.getText(), deviceId);
        },
      );

      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        controls.stop();
        return;
      }

      controlsRef.current = controls;
      setStatus("active");

      const availableDevices = await loadDevices();

      if (
        deviceId &&
        !availableDevices.some((device) => device.deviceId === deviceId)
      ) {
        selectedDeviceIdRef.current = "";
        setSelectedDeviceId("");
      }
    } catch (scanError) {
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setStatus("error");
      setError(
        scanError instanceof Error
          ? scanError.message
          : "Camera access was denied.",
      );
      await loadDevices();
    }
  }, [loadDevices, stopScanner, submitToken]);

  const handleCameraChange = useCallback(async (deviceId: string) => {
    selectedDeviceIdRef.current = deviceId;
    setSelectedDeviceId(deviceId);
    await startScanner(deviceId);
  }, [startScanner]);

  useEffect(() => {
    isMountedRef.current = true;
    void startScanner();

    return () => {
      isMountedRef.current = false;
      requestIdRef.current += 1;
      stopScanner();
      readerRef.current = null;
    };
  }, [startScanner, stopScanner]);

  const hasMultipleCameras = devices.length > 1;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
      <Card className="motion-rise motion-rise-delay-1">
        <CardHeader className="space-y-3">
          <CardTitle className="font-heading text-2xl">Live camera scanner</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => void startScanner()}
            >
              <RefreshCw className="size-4" />
              Refresh camera
            </Button>
            {hasMultipleCameras ? (
              <Button
                type="button"
                variant="ghost"
                className="rounded-full"
                onClick={() => setShowCameraOptions((current) => !current)}
              >
                <Camera className="size-4" />
                {showCameraOptions ? "Hide camera list" : "Switch camera"}
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-black">
            <video
              ref={videoRef}
              className="aspect-video w-full object-cover"
              autoPlay
              muted
              playsInline
            />
          </div>

          {showCameraOptions && hasMultipleCameras ? (
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Camera source</span>
              <select
                value={selectedDeviceId}
                onChange={(event) => {
                  void handleCameraChange(event.target.value);
                }}
                className="flex h-11 w-full rounded-xl border border-input bg-input/60 px-3.5 text-sm text-foreground outline-none transition focus:border-primary/35 focus:bg-background focus:ring-3 focus:ring-ring/20"
              >
                <option value="">Automatic rear / primary camera</option>
                {devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {status === "starting" ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Opening camera. Allow access if your browser asks.
              </>
            ) : status === "active" ? (
              <>
                <Camera className="size-4" />
                Camera ready. Point it at the prefect QR pass.
              </>
            ) : (
              <>
                <TriangleAlert className="size-4" />
                Camera unavailable.
              </>
            )}
          </div>

          <p className="text-xs leading-5 text-muted-foreground">
            Use HTTPS on phones and browsers. The scanner starts automatically and keeps listening after each scan.
          </p>

          {error ? (
            <div className="rounded-[1rem] border border-rose-500/30 bg-rose-500/8 p-4 text-sm text-rose-800 dark:text-rose-100">
              {error}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="motion-rise motion-rise-delay-2">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Scan result</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result ? (
            <div
              className={`rounded-[1.1rem] border p-5 ${
                result.status === "accepted"
                  ? "border-emerald-500/30 bg-emerald-500/8"
                  : result.status === "duplicate"
                    ? "border-amber-500/30 bg-amber-500/8"
                    : "border-rose-500/30 bg-rose-500/8"
              }`}
            >
              <div className="mb-3 flex items-center gap-2">
                {result.status === "accepted" ? (
                  <CheckCircle2 className="size-5 text-emerald-600" />
                ) : (
                  <TriangleAlert className="size-5 text-amber-600" />
                )}
                <h3 className="font-medium">{result.message}</h3>
              </div>
              {result.prefect ? (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{result.prefect.fullName}</p>
                  <p>{result.prefect.displayName}</p>
                  <p>{result.prefect.prefectIdentifier}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-[1.1rem] border border-dashed border-border/70 bg-muted/30 p-5 text-sm text-muted-foreground">
              Waiting for the first scan.
            </div>
          )}

          <div className="rounded-[1.1rem] border border-border/70 bg-background/70 p-5">
            <h3 className="font-medium">Manual fallback</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              For a USB scanner or temporary camera issue, paste the token and submit it.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Input
                value={manualToken}
                onChange={(event) => setManualToken(event.target.value)}
                placeholder="Paste scanned token"
              />
              <Button
                type="button"
                className="rounded-full sm:w-auto"
                onClick={() => {
                  void submitToken(manualToken);
                  setManualToken("");
                }}
              >
                Submit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
