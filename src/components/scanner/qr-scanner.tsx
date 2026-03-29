"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { Camera, CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
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

export function QrScanner() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const lockRef = useRef(false);
  const [status, setStatus] = useState<"idle" | "starting" | "active">("idle");
  const [manualToken, setManualToken] = useState("");
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitToken = useCallback(async (token: string) => {
    if (!token || lockRef.current) {
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
          token,
          scannerLabel: "Web kiosk camera",
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
  }, []);

  const startScanner = useCallback(async () => {
    setStatus("starting");
    setError(null);

    try {
      const reader = new BrowserQRCodeReader();
      const devices = await BrowserQRCodeReader.listVideoInputDevices();
      const preferred = devices[0]?.deviceId;

      if (!videoRef.current || !preferred) {
        throw new Error("No camera device available.");
      }

      controlsRef.current = await reader.decodeFromVideoDevice(
        preferred,
        videoRef.current,
        async (scanResult) => {
          if (!scanResult) {
            return;
          }

          await submitToken(scanResult.getText());
        },
      );

      setStatus("active");
    } catch (scanError) {
      setStatus("idle");
      setError(
        scanError instanceof Error
          ? scanError.message
          : "Camera access was denied.",
      );
    }
  }, [submitToken]);

  useEffect(() => {
    void startScanner();

    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [startScanner]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Card className="motion-rise motion-rise-delay-1">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Live camera scanner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-black">
            <video ref={videoRef} className="aspect-video w-full object-cover" />
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
                  ? "Camera active. Present a prefect QR pass to scan."
                  : "Scanner is idle."}
              </>
            )}
          </div>
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
            <h3 className="font-medium">Manual token / USB scanner fallback</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              If the kiosk uses a hardware scanner, paste or type the QR token and submit it here.
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
