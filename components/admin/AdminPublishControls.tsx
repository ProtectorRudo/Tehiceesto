"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  publishGiftAction,
  unpublishGiftAction,
} from "@/app/admin/gifts/actions";

export default function AdminPublishControls({
  code,
  status,
}: {
  code: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const published = status === "published";

  const toggle = () => {
    startTransition(async () => {
      if (published) {
        await unpublishGiftAction(code);
      } else {
        await publishGiftAction(code);
      }
      router.refresh();
    });
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/r/${code}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="admin-publish-controls">
      <a className="ghost-action admin-copy-entry" href={`/admin/gifts/${code}/preview`}>
        Preview + editar textos
      </a>

      {published && (
        <>
          <a className="ghost-action" href={`/r/${code}`} target="_blank">
            Abrir regalo ↗
          </a>
          <button className="ghost-action" type="button" onClick={copyLink}>
            {copied ? "Copiado ✓" : "Copiar link"}
          </button>
        </>
      )}

      <button
        className={published ? "publish-button published" : "publish-button"}
        type="button"
        disabled={pending}
        onClick={toggle}
      >
        {pending
          ? "Guardando…"
          : published
            ? "✓ Publicado · despublicar"
            : "Publicar regalo"}
      </button>
    </div>
  );
}
