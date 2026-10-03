"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { SceneTextOverrides } from "@/data/scene-text";
import {
  removeSceneCopyOverrideAction,
  saveSceneCopyOverrideAction,
} from "@/app/admin/gifts/actions";

type Selection = {
  scene: string;
  source: string;
  current: string;
};

function textNodeAtPoint(x: number, y: number) {
  const doc = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
    caretPositionFromPoint?: (
      x: number,
      y: number,
    ) => { offsetNode: Node; offset: number } | null;
  };

  const position = doc.caretPositionFromPoint?.(x, y);
  if (position?.offsetNode?.nodeType === Node.TEXT_NODE) {
    return position.offsetNode as Text;
  }

  const range = doc.caretRangeFromPoint?.(x, y);
  if (range?.startContainer?.nodeType === Node.TEXT_NODE) {
    return range.startContainer as Text;
  }

  return null;
}

function firstTextNode(element: Element | null) {
  if (!element) return null;
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if ((node.textContent || "").trim()) return node as Text;
    node = walker.nextNode();
  }
  return null;
}

export default function AdminCopyEditor({
  code,
  initialOverrides,
}: {
  code: string;
  initialOverrides: SceneTextOverrides;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [overrides, setOverrides] = useState(initialOverrides);

  const overrideCount = useMemo(
    () =>
      Object.values(overrides).reduce(
        (total, scene) => total + Object.keys(scene).length,
        0,
      ),
    [overrides],
  );

  useEffect(() => {
    document.documentElement.classList.toggle("copy-editing", enabled);
    return () => document.documentElement.classList.remove("copy-editing");
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target || target.closest(".admin-copy-editor")) return;

      const root = document.querySelector<HTMLElement>(".experience-shell");
      if (!root || !root.contains(target)) return;

      const textNode =
        textNodeAtPoint(event.clientX, event.clientY) ||
        firstTextNode(target.closest("button, h1, h2, h3, p, small, strong, span, em, b"));

      const visibleText = (textNode?.textContent || "").trim();
      if (!visibleText) return;

      const scene = root.dataset.currentScene || "";
      if (!scene) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const sceneOverrides = overrides[scene] || {};
      const source =
        Object.entries(sceneOverrides).find(([, replacement]) => replacement === visibleText)?.[0] ||
        visibleText;
      const current = sceneOverrides[source] ?? visibleText;

      setSelection({ scene, source, current });
      setValue(current);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [enabled, overrides]);

  const save = async () => {
    if (!selection) return;
    setSaving(true);
    try {
      await saveSceneCopyOverrideAction({
        code,
        scene: selection.scene,
        source: selection.source,
        replacement: value,
      });

      setOverrides((current) => ({
        ...current,
        [selection.scene]: {
          ...(current[selection.scene] || {}),
          [selection.source]: value,
        },
      }));
      setSelection(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const restore = async () => {
    if (!selection) return;
    setSaving(true);
    try {
      await removeSceneCopyOverrideAction({
        code,
        scene: selection.scene,
        source: selection.source,
      });

      setOverrides((current) => {
        const next = { ...current };
        const scene = { ...(next[selection.scene] || {}) };
        delete scene[selection.source];
        if (Object.keys(scene).length === 0) delete next[selection.scene];
        else next[selection.scene] = scene;
        return next;
      });
      setSelection(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-copy-editor">
      <button
        type="button"
        className={enabled ? "copy-editor-toggle active" : "copy-editor-toggle"}
        onClick={() => {
          setEnabled((current) => !current);
          setSelection(null);
        }}
      >
        <span>{enabled ? "✦" : "Aa"}</span>
        <div>
          <small>{overrideCount > 0 ? `${overrideCount} personalizados` : "Edición visual"}</small>
          <strong>{enabled ? "Tocá cualquier texto" : "Editar textos"}</strong>
        </div>
      </button>

      {enabled && !selection && (
        <div className="copy-editor-hint">
          <strong>Modo edición activo</strong>
          <p>Navegá la experiencia y tocá cualquier frase visible para cambiarla.</p>
        </div>
      )}

      {selection && (
        <div className="copy-editor-panel">
          <div className="copy-editor-panel-head">
            <div>
              <small>ESCENA · {selection.scene}</small>
              <strong>Editar texto</strong>
            </div>
            <button type="button" onClick={() => setSelection(null)} aria-label="Cerrar">×</button>
          </div>

          <label>
            <span>Texto original</span>
            <p>{selection.source}</p>
          </label>

          <label>
            <span>Texto personalizado</span>
            <textarea
              rows={5}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              autoFocus
            />
          </label>

          <div className="copy-editor-actions">
            <button type="button" className="copy-reset" onClick={restore} disabled={saving}>
              Restaurar original
            </button>
            <button type="button" className="copy-save" onClick={save} disabled={saving}>
              {saving ? "Guardando…" : "Guardar cambio"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
