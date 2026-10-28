"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/app/mis-regalos/account.module.css";

type Props = {
  onSave: (file: File) => Promise<boolean>;
  disabled?: boolean;
};

const MAX_DURATION_MS = 180_000;
const MAX_BYTES = 50 * 1024 * 1024;

function chooseMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  for (const type of ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg"]) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}
function extensionFor(type: string) {
  return type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
}

export default function VoiceRecorder({ onSave, disabled = false }: Props) {
  const [phase, setPhase] = useState<"idle" | "recording" | "ready" | "sending">("idle");
  const [duration, setDuration] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startAt = useRef(0);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingUrl = useRef<string>("");
  const canceled = useRef(false);

  const cleanupStream = () => {
    if (ticker.current) clearInterval(ticker.current);
    ticker.current = null;
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
  };
  const discardPreview = () => {
    if (recordingUrl.current) URL.revokeObjectURL(recordingUrl.current);
    recordingUrl.current = "";
    setPreviewUrl("");
    setFile(null);
  };
  useEffect(() => () => {
    if (ticker.current) clearInterval(ticker.current);
    recorder.current?.stream.getTracks().forEach(track => track.stop());
    if (recordingUrl.current) URL.revokeObjectURL(recordingUrl.current);
  }, []);

  const start = async () => {
    if (disabled || phase === "sending" || phase === "recording") return;
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Este navegador no permite grabar audio. Podés subir un archivo desde tu teléfono.");
      return;
    }
    discardPreview();
    chunks.current = [];
    canceled.current = false;
    let mic: MediaStream | null = null;
    try {
      mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
      stream.current = mic;
      const mimeType = chooseMimeType();
      const rec = mimeType ? new MediaRecorder(mic, { mimeType }) : new MediaRecorder(mic);
      recorder.current = rec;
      rec.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) chunks.current.push(event.data);
      };
      rec.onerror = () => {
        setError("La grabación se interrumpió. Podés intentar otra vez.");
        canceled.current = true;
        cleanupStream();
        setPhase("idle");
      };
      rec.onstop = () => {
        cleanupStream();
        if (canceled.current) { setPhase("idle"); return; }
        const actualMime = rec.mimeType.split(";")[0] || "audio/webm";
        const blob = new Blob(chunks.current, { type: actualMime });
        chunks.current = [];
        if (!blob.size || blob.size > MAX_BYTES) {
          setError("La grabación está vacía o supera los 50 MB.");
          setPhase("idle");
          return;
        }
        const name = "mensaje-de-voz-" + new Date().toISOString().replace(/[:.]/g, "-") + "." + extensionFor(actualMime);
        const captured = new File([blob], name, { type: actualMime, lastModified: Date.now() });
        const url = URL.createObjectURL(captured);
        recordingUrl.current = url;
        setPreviewUrl(url);
        setFile(captured);
        setPhase("ready");
      };
      rec.start(1000);
      startAt.current = Date.now();
      setDuration(0);
      setPhase("recording");
      ticker.current = setInterval(() => {
        const elapsed = Date.now() - startAt.current;
        setDuration(Math.min(180, Math.floor(elapsed / 1000)));
        if (elapsed >= MAX_DURATION_MS && rec.state === "recording") rec.stop();
      }, 250);
    } catch (cause) {
      cleanupStream();
      if (mic) mic.getTracks().forEach(track => track.stop());
      setPhase("idle");
      setError((cause instanceof Error && (cause.name === "NotAllowedError" || cause.name === "PermissionDeniedError"))
        ? "Necesitamos permiso para usar el micrófono. Habilitalo en el navegador e intentá de nuevo."
        : "No pudimos abrir el micrófono. Probá desde Safari o Chrome con conexión segura.");
    }
  };

  const stop = () => {
    if (recorder.current?.state === "recording") {
      recorder.current.stop();
    }
  };
  const discard = () => {
    canceled.current = true;
    if (recorder.current?.state === "recording") recorder.current.stop();
    cleanupStream();
    discardPreview();
    setDuration(0);
    setPhase("idle");
    setError("");
  };
  const save = async () => {
    if (!file || disabled || phase !== "ready") return;
    setPhase("sending");
    setError("");
    const ok = await onSave(file).catch(() => false);
    if (ok) {
      discardPreview();
      setDuration(0);
      setPhase("idle");
    } else {
      setPhase("ready");
      setError("No se pudo guardar el audio. Sigue acá para que puedas volver a intentarlo.");
    }
  };
  const elapsed = String(Math.floor(duration / 60)).padStart(2, "0") + ":" + String(duration % 60).padStart(2, "0");

  return (
    <div className={styles.voiceRecorder}>
      <div className={styles.voiceRecorderTop}>
        <div>
          <span className={styles.eyebrow}>UN RECUERDO EN SU PROPIA VOZ</span>
          <h3>Grabá un mensaje aquí mismo</h3>
          <p>No necesitás WhatsApp, correo ni descargar nada. Grabá, escuchá y guardá tu voz directamente en el regalo.</p>
        </div>
        <div className={phase === "recording" ? styles.voicePulseActive : styles.voicePulse} aria-hidden="true">●</div>
      </div>
      {phase === "idle" && <button className={styles.voiceRecordButton} type="button" disabled={disabled} onClick={() => void start()}>
        <span aria-hidden="true">●</span> Empezar a grabar
      </button>}
      {phase === "recording" && <div className={styles.voiceRecordingControls} role="status">
        <span className={styles.voiceTimer}><span aria-hidden="true">●</span> Grabando · {elapsed} / 03:00</span>
        <button className={styles.voiceRecordButton} type="button" onClick={stop}>■ Detener grabación</button>
        <button className={styles.ghost} type="button" onClick={discard}>Cancelar</button>
      </div>}
      {(phase === "ready" || phase === "sending") && previewUrl && <div className={styles.voiceReview}>
        <span className={styles.eyebrow}>ESCUCHÁ ANTES DE GUARDAR</span>
        <audio src={previewUrl} controls preload="metadata" aria-label="Escuchar grabación" />
        <div className={styles.voiceRecordingControls}>
          <button type="button" className={styles.voiceRecordButton} disabled={disabled || phase === "sending"} onClick={() => void save()}>
            {phase === "sending" ? "Guardando audio…" : "Guardar esta voz en el regalo →"}
          </button>
          <button type="button" className={styles.ghost} disabled={phase === "sending"} onClick={discard}>Grabar de nuevo</button>
        </div>
      </div>}
      {error && <p role="alert" className={styles.voiceRecorderError}>{error}</p>}
      <p className={styles.voicePrivacy}>Máximo 3 minutos. La grabación solo se envía cuando tocás «Guardar».</p>
    </div>
  );
}
