"use client";

import Image from "next/image";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminGiftMedia } from "@/lib/gifts/repository";
import {
  deleteMediaAction,
  prepareMediaUploadAction,
  registerMediaAction,
  reorderMediaAction,
  updateMediaAction,
} from "@/app/admin/gifts/actions";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

type UploadState = {
  name: string;
  progress: number;
  status: "preparing" | "uploading" | "saving" | "done" | "error";
  error?: string;
};

function humanSize(value?: number) {
  if (!value) return "";
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminMediaManager({
  code,
  media,
}: {
  code: string;
  media: AdminGiftMedia[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [busyIds, setBusyIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const mediaIds = useMemo(() => media.map((item) => item.id), [media]);

  const setUpload = (name: string, patch: Partial<UploadState>) => {
    setUploads((current) => {
      const existing = current.find((item) => item.name === name);
      if (!existing) {
        return [
          ...current,
          {
            name,
            progress: 0,
            status: "preparing",
            ...patch,
          } as UploadState,
        ];
      }

      return current.map((item) =>
        item.name === name ? { ...item, ...patch } : item,
      );
    });
  };

  const uploadOne = async (file: File) => {
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      setUpload(file.name, {
        status: "error",
        error: "El archivo supera el límite de 50 MB.",
      });
      return;
    }

    try {
      setUpload(file.name, { status: "preparing", progress: 0, error: undefined });

      const prepared = await prepareMediaUploadAction({
        code,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
      });

      setUpload(file.name, { status: "uploading", progress: 1 });

      const tus = await import("tus-js-client");

      await new Promise<void>((resolve, reject) => {
        const upload = new tus.Upload(file, {
          endpoint: prepared.endpoint,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          headers: {
            "x-signature": prepared.token,
          },
          chunkSize: 6 * 1024 * 1024,
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          metadata: {
            bucketName: prepared.bucketName,
            objectName: prepared.storagePath,
            contentType: file.type,
            cacheControl: "3600",
          },
          onError(error) {
            reject(error);
          },
          onProgress(bytesUploaded, bytesTotal) {
            const progress = bytesTotal
              ? Math.max(1, Math.round((bytesUploaded / bytesTotal) * 100))
              : 1;
            setUpload(file.name, { status: "uploading", progress });
          },
          onSuccess() {
            resolve();
          },
        });

        upload
          .findPreviousUploads()
          .then((previous) => {
            if (previous.length > 0) {
              upload.resumeFromPreviousUpload(previous[0]);
            }
            upload.start();
          })
          .catch(reject);
      });

      setUpload(file.name, { status: "saving", progress: 100 });

      await registerMediaAction({
        code,
        storagePath: prepared.storagePath,
        kind: prepared.kind,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
      });

      setUpload(file.name, { status: "done", progress: 100 });
      router.refresh();
    } catch (error) {
      console.error(error);
      setUpload(file.name, {
        status: "error",
        error: "No se pudo completar la carga. Podés volver a intentarla.",
      });
    }
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;

    const selected = Array.from(files).slice(0, 20);
    for (const file of selected) {
      await uploadOne(file);
    }

    if (inputRef.current) inputRef.current.value = "";
  };

  const move = (mediaId: string, direction: -1 | 1) => {
    const index = mediaIds.indexOf(mediaId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= mediaIds.length) return;

    const next = [...mediaIds];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];

    startTransition(async () => {
      await reorderMediaAction({ code, mediaIds: next });
      router.refresh();
    });
  };

  const updateMedia = (
    item: AdminGiftMedia,
    form: HTMLFormElement,
  ) => {
    const data = new FormData(form);
    setBusyIds((current) => [...current, item.id]);

    startTransition(async () => {
      try {
        await updateMediaAction({
          code,
          mediaId: item.id,
          caption: String(data.get("caption") || ""),
          fit: String(data.get("fit") || "cover") as "cover" | "contain",
          position: String(data.get("position") || "center") as
            | "center"
            | "top"
            | "bottom"
            | "left"
            | "right",
          role:
            item.kind === "audio"
              ? (String(data.get("role") || "voice") as "voice" | "soundtrack")
              : undefined,
        });
        router.refresh();
      } finally {
        setBusyIds((current) => current.filter((id) => id !== item.id));
      }
    });
  };

  const remove = (item: AdminGiftMedia) => {
    if (!window.confirm(`¿Eliminar ${item.metadata?.originalName || "este archivo"}?`)) {
      return;
    }

    setBusyIds((current) => [...current, item.id]);

    startTransition(async () => {
      try {
        await deleteMediaAction({ code, mediaId: item.id });
        router.refresh();
      } finally {
        setBusyIds((current) => current.filter((id) => id !== item.id));
      }
    });
  };

  return (
    <section className="admin-media-block">
      <div className="admin-block-heading">
        <div>
          <span className="eyebrow">Archivos</span>
          <h2>Fotos, audios y videos</h2>
          <p>
            Los originales van directo al storage privado. Para música, subí el
            archivo de audio y marcá “Música de fondo”; los demás audios quedan
            como mensajes de voz.
          </p>
        </div>

        <button
          type="button"
          className="primary-action"
          onClick={() => inputRef.current?.click()}
        >
          + Subir archivos
        </button>

        <input
          ref={inputRef}
          className="admin-hidden-input"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic,audio/mpeg,audio/mp4,audio/webm,audio/wav,video/mp4,video/webm,video/quicktime"
          onChange={(event) => uploadFiles(event.target.files)}
        />
      </div>

      {uploads.length > 0 && (
        <div className="upload-queue">
          {uploads.map((upload) => (
            <article key={upload.name}>
              <div>
                <strong>{upload.name}</strong>
                <small>
                  {upload.status === "preparing" && "Preparando carga segura…"}
                  {upload.status === "uploading" && `Subiendo… ${upload.progress}%`}
                  {upload.status === "saving" && "Guardando en el regalo…"}
                  {upload.status === "done" && "Listo ✓"}
                  {upload.status === "error" && (upload.error || "Error")}
                </small>
              </div>
              <span className="upload-progress">
                <i style={{ width: `${upload.progress}%` }} />
              </span>
            </article>
          ))}
        </div>
      )}

      {media.length === 0 ? (
        <div className="admin-empty admin-empty-media">
          <strong>Todavía no hay archivos.</strong>
          <p>
            Cuando carguemos el primer material, acá vas a poder revisar
            encuadre, orden y texto antes de publicar.
          </p>
        </div>
      ) : (
        <div className="media-editor-grid">
          {media.map((item, index) => {
            const fit = item.metadata?.fit || "cover";
            const position = item.metadata?.position || "center";
            const role =
              item.kind === "audio" && item.metadata?.role === "soundtrack"
                ? "soundtrack"
                : "voice";
            const busy = busyIds.includes(item.id) || isPending;

            return (
              <article className="media-editor-card" key={item.id}>
                <div className="media-editor-preview">
                  {item.kind === "image" && item.signed_url && (
                    <Image
                      src={item.signed_url}
                      alt={item.caption || item.metadata?.originalName || "Foto"}
                      fill
                      unoptimized
                      sizes="(max-width: 760px) 100vw, 320px"
                      style={{
                        objectFit: fit,
                        objectPosition: position,
                      }}
                    />
                  )}

                  {item.kind === "video" && item.signed_url && (
                    <video src={item.signed_url} controls preload="metadata" />
                  )}

                  {item.kind === "audio" && item.signed_url && (
                    <div className="audio-preview">
                      <span>♪</span>
                      <audio src={item.signed_url} controls preload="metadata" />
                    </div>
                  )}

                  <span className="media-order-badge">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="media-kind-badge">
                    {item.kind === "audio" && role === "soundtrack"
                      ? "música"
                      : item.kind}
                  </span>
                </div>

                <form
                  className="media-editor-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    updateMedia(item, event.currentTarget);
                  }}
                >
                  <div className="media-file-meta">
                    <strong>{item.metadata?.originalName || item.storage_path.split("/").pop()}</strong>
                    <small>{humanSize(item.metadata?.size)}</small>
                  </div>

                  <label>
                    <span>Texto / caption</span>
                    <input
                      name="caption"
                      defaultValue={item.caption || ""}
                      placeholder="Ej. Nuestro primer viaje"
                    />
                  </label>

                  {item.kind === "audio" && (
                    <div className="media-soundtrack-control">
                      <label>
                        <span>Uso del audio</span>
                        <select name="role" defaultValue={role}>
                          <option value="voice">Mensaje de voz</option>
                          <option value="soundtrack">Música de fondo</option>
                        </select>
                      </label>
                      {role === "soundtrack" && (
                        <p>
                          Esta pista acompaña toda la experiencia, entra con fade y
                          baja automáticamente cuando suena una voz o un video.
                        </p>
                      )}
                    </div>
                  )}

                  {item.kind === "image" && (
                    <div className="media-control-grid">
                      <label>
                        <span>Encuadre</span>
                        <select name="fit" defaultValue={fit}>
                          <option value="cover">Llenar marco</option>
                          <option value="contain">Mostrar completa</option>
                        </select>
                      </label>

                      <label>
                        <span>Foco</span>
                        <select name="position" defaultValue={position}>
                          <option value="center">Centro</option>
                          <option value="top">Arriba</option>
                          <option value="bottom">Abajo</option>
                          <option value="left">Izquierda</option>
                          <option value="right">Derecha</option>
                        </select>
                      </label>
                    </div>
                  )}

                  <div className="media-card-actions">
                    <button
                      type="button"
                      className="mini-action"
                      disabled={index === 0 || busy}
                      onClick={() => move(item.id, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="mini-action"
                      disabled={index === media.length - 1 || busy}
                      onClick={() => move(item.id, 1)}
                    >
                      ↓
                    </button>
                    <button className="mini-action save" type="submit" disabled={busy}>
                      Guardar
                    </button>
                    <button
                      className="mini-action danger"
                      type="button"
                      disabled={busy}
                      onClick={() => remove(item)}
                    >
                      Eliminar
                    </button>
                  </div>
                </form>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
