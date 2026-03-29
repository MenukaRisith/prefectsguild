"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import {
  Camera,
  CheckCircle2,
  Loader2,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
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

function guessPreferredDevice(devices: CameraDevice[]) {
  const environmentDevice = devices.find((device) =>
    /back|rear|environment|traseira|world/i.test(device.label),
  );

  return environmentDevice?.deviceId ?? "";
}

function scannerLabelForDevice(devices: CameraDevice[], deviceId: string) {
  const selected = devices.find((device) => device.deviceId === deviceId);

  if (!selected) {
    return "Browser camera scanner";
  }

  return `Browser camera scanner: ${selected.label}`;
}

export function QrScanner() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const lockRef = useRef(false);
  const [status, setStatus] = useState<"idle" | "starting" | "active">("idle");
  const [manualToken, setManualToken] = useState("");
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [restartNonce, setRestartNonce] = useState(0);

  const activeCameraLabel = useMemo(() => {
    if (!selectedDeviceId) {
      return devices.length > 0 ? "Rear or primary camera" : "Automatic camera";
    }

    return devices.find((device) => device.deviceId === selectedDeviceId)?.label ?? "Selected camera";
  }, [devices, selectedDeviceId]);

  const refreshDevices = useCallback(async () => {
    try {
      const availableDevices = (await BrowserQRCodeReader.listVideoInputDevices()).map(
        (device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${index + 1}`,
        }),
      );

      setDevices(availableDevices);
      setSelectedDeviceId((current) => {
        if (current && availableDevices.some((device) => device.deviceId === current)) {
          return current;
        }

        return guessPreferredDevice(availableDevices);
      });
    } catch {
      setDevices([]);
    }
  }, []);

  const stopScanner = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
  }, []);

  const submitToken = useCallback(
    async (token: string) => {
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
            scannerLabel: scannerLabelForDevice(devices, selectedDeviceId),
          }),
        });

        const payload = (await response.json()) as ScanResponse;
        setResult(payload);
      } catch {
        setError("Unable to submit scan result. Check the network and try again.");
      } finally {
        window.setTimeout(() => {
          lockRef.current = false;
        }, 1800);
      }
    },
    [devices, selectedDeviceId],
  );

  useEffect(() => {
    let cancelled = false;

    async function startScanner() {
      setStatus("starting");
      setError(null);
      stopScanner();

      try {
        await refreshDevices();

        const reader = new BrowserQRCodeReader();
        readerRef.current = reader;

        if (!videoRef.current) {
          throw new Error("Camera preview is not available.");
        }

        controlsRef.current = await reader.decodeFromVideoDevice(
          selectedDeviceId || undefined,
          videoRef.current,
          async (scanResult) => {
            if (!scanResult) {
              return;
            }

            await submitToken(scanResult.getText());
          },
        );

        if (!cancelled) {
          setStatus("active");
          await refreshDevices();
        }
      } catch (scanError) {
        if (!cancelled) {
          setStatus("idle");
          setError(
            scanError instanceof Error
              ? scanError.message
              : "Camera access was denied.",
          );
        }
      }
    }

    void startScanner();

    return () => {
      cancelled = true;
      stopScanner();
      readerRef.current = null;
    };
  }, [refreshDevices, restartNonce, selectedDeviceId, stopScanner, submitToken]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Card className="motion-rise motion-rise-delay-1">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Live camera scanner</CardTitle>
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
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Camera source</span>
              <select
                value={selectedDeviceId}
                onChange={(event) => setSelectedDeviceId(event.target.value)}
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
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full md:w-auto"
                onClick={() => setRestartNonce((value) => value + 1)}
              >
                <RefreshCw className="size-4" />
                Restart camera
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {status === "starting" ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Starting camera...
              </>
            ) : (
              <>
                <Camera className="size-4" />
                {status === "active"
                  ? `Camera active on ${activeCameraLabel}. Works with a phone camera, laptop webcam, or USB webcam.`
                  : "Scanner is idle."}
              </>
            )}
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Browser camera scanning works on phones, laptops, and USB webcams. Most browsers require this page to be opened over HTTPS or localhost before camera access is allowed.
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
              Waiting for the first successful scan.
            </div>
          )}

          <div className="rounded-[1.1rem] border border-border/70 bg-background/70 p-5">
            <h3 className="font-medium">Manual token / hardware scanner fallback</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              If the kiosk uses a USB barcode scanner or the camera is unavailable, paste the scanned token here.
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
