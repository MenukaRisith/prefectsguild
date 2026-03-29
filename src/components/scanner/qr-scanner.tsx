"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import {
  Camera,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import {
  getAttendanceScanWindow,
  type AttendanceWindowSettings,
} from "@/lib/attendance-windows";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ScanResponse = {
  status: "accepted" | "duplicate" | "invalid" | "closed";
  mode: "check_in" | "check_out" | "closed";
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

function createClosedResult(message: string): ScanResponse {
  return {
    status: "closed",
    mode: "closed",
    message,
    prefect: null,
  };
}

export function QrScanner({ schedule }: { schedule: AttendanceWindowSettings }) {
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
  const [windowState, setWindowState] = useState(() => getAttendanceScanWindow(schedule));
  const windowStateRef = useRef(windowState);

  const syncWindowState = useCallback(() => {
    const nextState = getAttendanceScanWindow(schedule);
    windowStateRef.current = nextState;
    setWindowState(nextState);
  }, [schedule]);

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

    const currentWindow = windowStateRef.current;

    if (currentWindow.mode === "closed") {
      setResult(createClosedResult(currentWindow.message));
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

      const payload = await response.json();

      if (!response.ok) {
        setError(
          typeof payload?.error === "string"
            ? payload.error
            : "Unable to process this scan right now.",
        );
        return;
      }

      setResult(payload as ScanResponse);
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
    syncWindowState();
    const intervalId = window.setInterval(syncWindowState, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [syncWindowState]);

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
  const resultTone =
    result?.status === "accepted"
      ? "border-emerald-500/25 bg-emerald-500/8"
      : result?.status === "duplicate"
        ? "border-amber-500/25 bg-amber-500/8"
        : result?.status === "closed"
          ? "border-sky-500/25 bg-sky-500/8"
          : "border-rose-500/25 bg-rose-500/8";

  return (
    <div className="grid gap-6 2xl:grid-cols-[1.14fr_0.86fr]">
      <Card className="motion-rise motion-rise-delay-1 overflow-hidden rounded-[2rem] border-primary/16">
        <CardHeader className="border-b border-border/70 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <CardTitle className="font-heading text-3xl">Live camera scanner</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="secondary"
                  className={cn(
                    "rounded-full border px-3 py-1 text-[0.68rem] tracking-[0.22em]",
                    windowState.mode === "check_in"
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                      : windowState.mode === "check_out"
                        ? "border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                        : "border-sky-500/20 bg-sky-500/10 text-sky-800 dark:text-sky-200",
                  )}
                >
                  {windowState.mode === "check_in"
                    ? "arrival window"
                    : windowState.mode === "check_out"
                      ? "leaving window"
                      : "scanner closed"}
                </Badge>
                <Badge
                  variant="secondary"
                  className="rounded-full border border-border/80 bg-background/80 px-3 py-1 text-[0.68rem] tracking-[0.22em]"
                >
                  {windowState.todayLabel}
                </Badge>
              </div>
            </div>
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
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div className="relative overflow-hidden rounded-[1.6rem] border border-border/70 bg-black">
            <video
              ref={videoRef}
              className="aspect-video w-full object-cover"
              autoPlay
              muted
              playsInline
            />
            {windowState.mode === "closed" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-6 text-center text-white backdrop-blur-sm">
                <Clock3 className="size-8" />
                <p className="mt-4 text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-white/72">
                  Scanner closed
                </p>
                <p className="mt-3 max-w-md text-sm leading-7 text-white/82">
                  {windowState.message}
                </p>
              </div>
            ) : null}
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

          <div className="rounded-[1.35rem] border border-border/70 bg-background/78 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {status === "starting" ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Opening camera. Allow access if your browser asks.
                </>
              ) : status === "active" ? (
                <>
                  <Camera className="size-4" />
                  {windowState.mode === "closed"
                    ? "Camera preview is live, but recording is locked until the next valid window."
                    : "Camera ready. Point it at the prefect QR pass."}
                </>
              ) : (
                <>
                  <TriangleAlert className="size-4" />
                  Camera unavailable.
                </>
              )}
            </div>

            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Use HTTPS on phones and browsers. The scanner keeps listening after each read, but only submits during the approved weekday windows.
            </p>

            {error ? (
              <div className="mt-4 rounded-[1rem] border border-rose-500/30 bg-rose-500/8 p-4 text-sm text-rose-800 dark:text-rose-100">
                {error}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card className="motion-rise motion-rise-delay-2 overflow-hidden rounded-[2rem] border-primary/16 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--card)_92%,white_8%)_0%,color-mix(in_srgb,var(--card)_88%,var(--accent)_12%)_100%)]">
          <CardHeader className="border-b border-border/70 pb-5">
            <CardTitle className="font-heading text-3xl">Scanner schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="rounded-[1.5rem] border border-primary/18 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_84%,black_16%)_0%,color-mix(in_srgb,var(--primary)_92%,var(--accent)_8%)_100%)] p-5 text-primary-foreground">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-primary-foreground/68">
                Live window
              </p>
              <p className="mt-3 font-heading text-3xl font-semibold">
                {windowState.activeWindowLabel}
              </p>
              <p className="mt-3 text-sm leading-7 text-primary-foreground/78">
                {windowState.message}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.4rem] border border-border/70 bg-background/78 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Arrival
                </p>
                <p className="mt-3 font-heading text-2xl font-semibold">
                  {windowState.checkInLabel}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  QR check-in is accepted Monday to Friday only.
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-border/70 bg-background/78 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Leaving
                </p>
                <p className="mt-3 font-heading text-2xl font-semibold">
                  {windowState.checkOutLabel}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Departure marks the end-of-day exit record.
                </p>
              </div>
            </div>

            <p className="text-sm leading-7 text-muted-foreground">
              {windowState.summaryLabel}
            </p>
          </CardContent>
        </Card>

        <Card className="motion-rise motion-rise-delay-2 rounded-[2rem] border-primary/16">
          <CardHeader className="border-b border-border/70 pb-5">
            <CardTitle className="font-heading text-3xl">Scan result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {result ? (
              <div className={cn("rounded-[1.4rem] border p-5", resultTone)}>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {result.status === "accepted" ? (
                    <CheckCircle2 className="size-5 text-emerald-600" />
                  ) : result.status === "closed" ? (
                    <Clock3 className="size-5 text-sky-600" />
                  ) : (
                    <TriangleAlert className="size-5 text-amber-600" />
                  )}
                  <Badge
                    variant="secondary"
                    className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[0.68rem] tracking-[0.2em]"
                  >
                    {result.mode === "check_in"
                      ? "arrival"
                      : result.mode === "check_out"
                        ? "leaving"
                        : "closed"}
                  </Badge>
                </div>
                <h3 className="font-heading text-2xl font-semibold">{result.message}</h3>
                {result.prefect ? (
                  <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                    <p>{result.prefect.fullName}</p>
                    <p>{result.prefect.displayName}</p>
                    <p>{result.prefect.prefectIdentifier}</p>
                  </div>
                ) : (
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
                    Wait for the correct window or scan a valid prefect QR pass.
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-border/70 bg-muted/30 p-5 text-sm text-muted-foreground">
                Waiting for the first scan.
              </div>
            )}

            <div className="rounded-[1.4rem] border border-border/70 bg-background/78 p-5">
              <h3 className="font-medium">Manual fallback</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                For a USB scanner or temporary camera issue, paste the token and submit it. Manual entry follows the same weekday time windows.
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
                  disabled={!manualToken.trim() || windowState.mode === "closed"}
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
    </div>
  );
}
