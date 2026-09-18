"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Capacitor, SystemBars, SystemBarsStyle } from "@capacitor/core";
import { appPathFromDeepLink } from "@/lib/deep-links";
import { CLIENT_REVIEW_UNAVAILABLE_MESSAGE } from "@/lib/client-review";

type PreviewState = { url: string; title: string; kind: "image" | "pdf" | "other" } | null;

type PdfViewport = { width: number; height: number };
type PdfPage = {
  getViewport: (options: { scale: number }) => PdfViewport;
  render: (options: { canvasContext: CanvasRenderingContext2D; viewport: PdfViewport; transform?: number[] }) => { promise: Promise<unknown> };
};
type PdfDocument = { numPages: number; getPage: (pageNumber: number) => Promise<PdfPage> };

function isNativeAndroid() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

function sameOrigin(href: string) {
  try { return new URL(href, window.location.href).origin === window.location.origin; } catch { return false; }
}

function filenameFromHeader(header: string | null, fallback: string) {
  const match = header?.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i);
  return match ? decodeURIComponent(match[1].replace(/["']/g, "")) : fallback;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  return btoa(binary);
}

function PdfPreview({ url, title }: { url: string; title: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      setState("loading");
      setError("");
      try {
        const response = await fetch(url, { credentials: "include", cache: "no-store" });
        if (!response.ok) throw new Error("The private PDF bytes could not be read.");
        const bytes = new Uint8Array(await response.arrayBuffer());
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        // Keep the renderer local to the installed app. The worker is bundled
        // from the pinned dependency; no remote viewer or public URL is used.
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
        const pdf = await pdfjs.getDocument({ data: bytes, isEvalSupported: false }).promise as unknown as PdfDocument;
        if (cancelled) return;
        const safePage = Math.min(pageNumber, pdf.numPages);
        if (safePage !== pageNumber) setPageNumber(safePage);
        setPageCount(pdf.numPages);
        const page = await pdf.getPage(safePage);
        if (cancelled) return;
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (!canvas || !context) throw new Error("This phone could not create a private preview surface.");
        const unscaled = page.getViewport({ scale: 1 });
        const availableWidth = Math.max(280, (canvas.parentElement?.clientWidth ?? window.innerWidth) - 24);
        const scale = Math.min(2, Math.max(0.75, availableWidth / unscaled.width));
        const viewport = page.getViewport({ scale });
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.ceil(viewport.width * pixelRatio);
        canvas.height = Math.ceil(viewport.height * pixelRatio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        context.clearRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: context, viewport, transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0] }).promise;
        if (!cancelled) setState("ready");
      } catch (reason) {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "This PDF could not be rendered on this phone.");
          setState("error");
        }
      }
    };
    void render();
    return () => { cancelled = true; };
  }, [pageNumber, url]);

  return (
    <div className="native-preview__pdf" aria-label={title}>
      {state === "loading" ? <p className="native-preview__message">Preparing private preview…</p> : null}
      {state === "error" ? <p className="native-preview__message">{error}</p> : null}
      <canvas ref={canvasRef} aria-label={`${title}, page ${pageNumber} of ${pageCount}`} />
      {state === "ready" ? (
        <div className="native-preview__pages">
          <button type="button" disabled={pageNumber <= 1} onClick={() => setPageNumber((value) => Math.max(1, value - 1))}>Previous</button>
          <span>Page {pageNumber} of {pageCount}</span>
          <button type="button" disabled={pageNumber >= pageCount} onClick={() => setPageNumber((value) => Math.min(pageCount, value + 1))}>Next</button>
        </div>
      ) : null}
    </div>
  );
}

function closeOpenSheet() {
  const dialog = document.querySelector<HTMLDialogElement>("dialog[open]");
  if (!dialog) return false;
  dialog.dispatchEvent(new Event("cancel", { bubbles: true, cancelable: true }));
  return true;
}

export async function takeNativePhoto(): Promise<File | null> {
  if (!isNativeAndroid()) return null;
  const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
  const photo = await Camera.getPhoto({
    source: CameraSource.Camera,
    resultType: CameraResultType.DataUrl,
    quality: 88,
    correctOrientation: true,
  });
  if (!photo.dataUrl) return null;
  const response = await fetch(photo.dataUrl);
  const blob = await response.blob();
  const type = blob.type || "image/jpeg";
  const extension = type === "image/png" ? "png" : "jpeg";
  return new File([blob], `sukoon-camera-${Date.now()}.${extension}`, { type });
}

function isNativeClient() {
  return Capacitor.isNativePlatform();
}

function nativeSubscribe() {
  return () => undefined;
}

export function NativeRuntime() {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const previewRef = useRef<PreviewState>(null);
  const native = useSyncExternalStore(nativeSubscribe, isNativeClient, () => false);
  const [offline, setOffline] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState>(null);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);
  useEffect(() => {
    previewRef.current = preview;
  }, [preview]);

  useEffect(() => {
    if (!native) return;
    document.documentElement.classList.add("is-native-shell");
    if (Capacitor.getPlatform() === "android") document.documentElement.classList.add("is-android-webview");
    let cancelled = false;
    const handles: Array<{ remove: () => Promise<void> | void }> = [];

    const boot = async () => {
      const [{ App }, { Keyboard, KeyboardResize }, { Browser }, { Network }] = await Promise.all([
        import("@capacitor/app"),
        import("@capacitor/keyboard"),
        import("@capacitor/browser"),
        import("@capacitor/network"),
      ]);
      if (cancelled) return;
      try { await SystemBars.setStyle({ style: SystemBarsStyle.Light }); } catch { /* core plugin unavailable in browser tests */ }
      try { await Keyboard.setResizeMode({ mode: KeyboardResize.Body }); } catch { /* config also sets resize */ }

      handles.push(await App.addListener("backButton", ({ canGoBack }) => {
        const currentPreview = previewRef.current;
        if (currentPreview) {
          URL.revokeObjectURL(currentPreview.url);
          setPreview(null);
          return;
        }
        if (closeOpenSheet()) return;
        if (canGoBack || (pathnameRef.current !== "/" && window.history.length > 1)) {
          router.back();
          return;
        }
        void App.minimizeApp();
      }));

      const openDeepLink = (url: string) => {
        const path = appPathFromDeepLink(url, window.location.origin);
        if (path) router.push(path);
      };
      handles.push(await App.addListener("appUrlOpen", (event) => openDeepLink(event.url)));
      const launch = await App.getLaunchUrl();
      if (launch?.url) openDeepLink(launch.url);

      handles.push(await Network.addListener("networkStatusChange", (status) => setOffline(!status.connected)));
      const status = await Network.getStatus();
      if (!cancelled) setOffline(!status.connected);

      const onClick = (event: MouseEvent) => {
        const link = (event.target as HTMLElement | null)?.closest("a[href]") as HTMLAnchorElement | null;
        if (!link) return;
        const href = link.getAttribute("href");
        if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
        const url = new URL(href, window.location.href);
        const download = link.hasAttribute("download") || url.searchParams.get("download") === "true" || /\/download(?:\?|$)/.test(url.pathname);
        const previewLink = sameOrigin(url.href) && /\/api\/(?:documents|exports)\//.test(url.pathname) && url.searchParams.get("download") !== "true" && url.searchParams.get("metadata") !== "true" && !/\/download(?:\?|$)/.test(url.pathname);
        if (download && sameOrigin(url.href)) {
          event.preventDefault();
          void saveAuthenticatedFile(url.href, setNotice);
          return;
        }
        if (previewLink && (link.target === "_blank" || /\/api\/documents\//.test(url.pathname))) {
          event.preventDefault();
          void openAuthenticatedPreview(url.href, setPreview, setNotice);
          return;
        }
        if (!sameOrigin(url.href) && (url.protocol === "http:" || url.protocol === "https:")) {
          event.preventDefault();
          void Browser.open({ url: url.href });
        }
      };
      document.addEventListener("click", onClick, true);
      handles.push({ remove: () => document.removeEventListener("click", onClick, true) });
    };

    void boot();
    return () => {
      cancelled = true;
      document.documentElement.classList.remove("is-native-shell", "is-android-webview");
      handles.forEach((handle) => void handle.remove());
    };
  }, [native, router]);

  if (!native) return null;
  return (
    <>
      <style>{`nextjs-portal{display:none!important}`}</style>
      {offline ? (
        <div className="native-network-banner" role="status">
          <span>{CLIENT_REVIEW_UNAVAILABLE_MESSAGE}</span>
          <button type="button" onClick={() => window.location.reload()}>Retry</button>
        </div>
      ) : null}
      {notice ? <p className="native-notice" role="status">{notice}</p> : null}
      {preview ? (
        <div className="native-preview" role="dialog" aria-label={preview.title}>
          <div className="native-preview__bar">
            <p>{preview.title}</p>
            <button type="button" onClick={() => { URL.revokeObjectURL(preview.url); setPreview(null); }}>Close</button>
          </div>
          {preview.kind === "image" ? (
            // Private authenticated blob; next/image cannot host Vault bytes.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview.url} alt={preview.title} />
          ) : preview.kind === "pdf" ? <PdfPreview url={preview.url} title={preview.title} /> : <iframe title={preview.title} src={preview.url} />}
        </div>
      ) : null}
    </>
  );
}

async function openAuthenticatedPreview(href: string, setPreview: (value: PreviewState) => void, setNotice: (value: string | null) => void) {
  try {
    const response = await fetch(href, { credentials: "include", cache: "no-store" });
    if (!response.ok) throw new Error("Preview is not available for this record.");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const kind = blob.type.startsWith("image/") ? "image" : blob.type === "application/pdf" ? "pdf" : "other";
    setPreview({ url, title: "Private preview", kind });
  } catch (error: unknown) {
    setNotice(error instanceof Error ? error.message : "Preview is not available.");
    window.setTimeout(() => setNotice(null), 3200);
  }
}

async function saveAuthenticatedFile(href: string, setNotice: (value: string | null) => void) {
  try {
    const response = await fetch(href, { credentials: "include", cache: "no-store" });
    if (!response.ok) throw new Error("Download is not available for this record.");
    const bytes = new Uint8Array(await response.arrayBuffer());
    const name = filenameFromHeader(response.headers.get("content-disposition"), "sukoon-download");
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");
    const path = `Sukoon/${Date.now()}-${name.replace(/[^\w.\-]+/g, "_")}`;
    const written = await Filesystem.writeFile({ path, data: bytesToBase64(bytes), directory: Directory.Cache, recursive: true });
    await Share.share({
      title: name,
      text: "Authorized Sukoon file. This is not a public Vault link.",
      files: written.uri ? [written.uri] : undefined,
      dialogTitle: "Save or share this authorized file",
    });
    setNotice("Choose where to save. Sukoon did not leave this file in public Downloads.");
    window.setTimeout(() => setNotice(null), 4200);
  } catch (error: unknown) {
    setNotice(error instanceof Error ? error.message : "Download could not be completed.");
    window.setTimeout(() => setNotice(null), 3200);
  }
}
