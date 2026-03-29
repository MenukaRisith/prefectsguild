import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function buildPrefectPassPdf(options: {
  fullName: string;
  displayName: string;
  grade: number;
  prefectIdentifier: string;
  qrPngBytes: Uint8Array;
}) {
  const document = await PDFDocument.create();
  const page = document.addPage([420, 595]);
  const font = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const qrImage = await document.embedPng(options.qrPngBytes);
  const qrDimensions = qrImage.scale(0.45);

  page.drawRectangle({
    x: 24,
    y: 24,
    width: 372,
    height: 547,
    color: rgb(0.98, 0.98, 0.96),
    borderColor: rgb(0.07, 0.13, 0.15),
    borderWidth: 1.5,
  });

  page.drawRectangle({
    x: 24,
    y: 460,
    width: 372,
    height: 111,
    color: rgb(0.07, 0.13, 0.15),
  });

  page.drawText("Kekirawa Central College", {
    x: 40,
    y: 540,
    size: 24,
    font: bold,
    color: rgb(0.98, 0.98, 0.96),
  });

  page.drawText("Prefects Guild QR Pass", {
    x: 40,
    y: 512,
    size: 13,
    font,
    color: rgb(0.89, 0.9, 0.86),
  });

  page.drawImage(qrImage, {
    x: 110,
    y: 250,
    width: qrDimensions.width,
    height: qrDimensions.height,
  });

  page.drawText(options.fullName, {
    x: 40,
    y: 205,
    size: 22,
    font: bold,
    color: rgb(0.07, 0.13, 0.15),
  });

  page.drawText(`Display Name: ${options.displayName}`, {
    x: 40,
    y: 175,
    size: 12,
    font,
    color: rgb(0.25, 0.3, 0.32),
  });

  page.drawText(`Grade: ${options.grade}`, {
    x: 40,
    y: 154,
    size: 12,
    font,
    color: rgb(0.25, 0.3, 0.32),
  });

  page.drawText(`Prefect ID: ${options.prefectIdentifier}`, {
    x: 40,
    y: 133,
    size: 12,
    font,
    color: rgb(0.25, 0.3, 0.32),
  });

  page.drawText("Print this pass and present it for attendance scanning.", {
    x: 40,
    y: 95,
    size: 11,
    font,
    color: rgb(0.38, 0.42, 0.44),
  });

  return document.save();
}
