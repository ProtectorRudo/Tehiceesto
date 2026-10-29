"use client";

import { useState } from "react";
import SevenDaysExperience from "@/components/SevenDaysExperience";
import type { Experience } from "@/data/experiences";
import type { SceneTextOverrides } from "@/data/scene-text";
import { saveSceneCopyOverrideAction, removeSceneCopyOverrideAction } from "@/app/admin/gifts/actions";

export default function SevenDaysAdminPreview({
  code, experience, initialOverrides, photos, audio,
}: {
  code:string; experience:Experience; initialOverrides:SceneTextOverrides;
  photos:{url:string;caption?:string}[]; audio:{url:string;caption?:string}[];
}) {
  const [editing,setEditing]=useState(false);
  const [selected,setSelected]=useState<{scene:string;source:string;current:string}|null>(null);
  const [copy,setCopy]=useState("");
  const [overrides,setOverrides]=useState(initialOverrides);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  async function save(restore=false) {
    if(!selected||busy) return;
    setBusy(true);setError("");
    try {
      if(restore) await removeSceneCopyOverrideAction({code,scene:selected.scene,source:selected.source});
      else await saveSceneCopyOverrideAction({code,scene:selected.scene,source:selected.source,replacement:copy});
      const next={...overrides,[selected.scene]:{...(overrides[selected.scene]||{})}};
      if(restore) delete next[selected.scene][selected.source];
      else next[selected.scene][selected.source]=copy;
      setOverrides(next);setSelected(null);
    } catch { setError("No se pudo guardar. Volvé a intentarlo."); }
    finally {setBusy(false);}
  }
  return <div>
    <div className="admin-preview-toolbar">
      <a href={`/admin/gifts/${code}`}>← Volver al editor</a>
      <button type="button" onClick={()=>{setEditing(!editing);setSelected(null);}}>
        {editing?"Terminar edición":"✎ Editar textos de los siete días"}
      </button>
    </div>
    <SevenDaysExperience
      experience={experience} editing={editing} onTextSelect={item=>{setSelected(item);setCopy(item.current);}}
      photoMedia={photos} audioMedia={audio} sceneTextOverrides={overrides}
    />
    {selected && <div className="admin-copy-editor">
      <div className="copy-editor-panel" role="dialog" aria-label="Personalizar frase">
        <strong>{selected.scene.toUpperCase()} · EDITAR TEXTO</strong>
        <p>Original: {selected.source}</p>
        <textarea rows={5} maxLength={5000} value={copy} onChange={e=>setCopy(e.target.value)} />
        {error&&<p role="alert">{error}</p>}
        <div className="copy-editor-actions">
          <button type="button" disabled={busy} onClick={()=>setSelected(null)}>Cancelar</button>
          <button type="button" disabled={busy} onClick={()=>void save(true)}>Restaurar</button>
          <button type="button" disabled={busy} onClick={()=>void save()}>{busy?"Guardando…":"Guardar texto"}</button>
        </div>
      </div>
    </div>}
  </div>;
}
