"use client";

import { useEffect, useMemo, useState } from "react";
import ExperienceEngine from "@/components/ExperienceEngine";
import { experiences, getExperience } from "@/data/experiences";

type Draft = {
  experience: string;
  giverName: string;
  recipient: string;
  feeling: string;
  relationship: string;
  keyDate: string;
  anecdote: string;
  opening: string;
  letter: string;
  closing: string;
  musicUrl: string;
};

const STORAGE_KEY = "tehiceesto:draft:v1";
const feelings = ["Emoción", "Amor", "Sorpresa", "Diversión", "Nostalgia"];

const emptyDraft: Draft = {
  experience: "pareja",
  giverName: "",
  recipient: "",
  feeling: "Emoción",
  relationship: "",
  keyDate: "",
  anecdote: "",
  opening: "",
  letter: "",
  closing: "",
  musicUrl: "",
};

export default function CreatorWizard() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoNames, setPhotoNames] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setDraft({ ...emptyDraft, ...(JSON.parse(saved) as Draft) });
    } catch {
      // A broken local draft should never block creation.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft, hydrated]);

  useEffect(() => {
    return () => photoUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [photoUrls]);

  const baseExperience = getExperience(draft.experience) || experiences[0];

  const personalizedExperience = useMemo(
    () => ({
      ...baseExperience,
      demoGiver: draft.giverName || "Alguien que te quiere",
      demoRecipient: draft.recipient || "Vos",
      opening: draft.opening.trim() || baseExperience.opening,
      closing: draft.closing.trim() || baseExperience.closing,
    }),
    [baseExperience, draft],
  );

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const selectPhotos = (files: FileList | null) => {
    if (!files) return;

    photoUrls.forEach((url) => URL.revokeObjectURL(url));
    const selected = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 10);

    setPhotoNames(selected.map((file) => file.name));
    setPhotoUrls(selected.map((file) => URL.createObjectURL(file)));
  };

  if (previewMode) {
    return (
      <div className="creator-preview-overlay">
        <button className="preview-close" onClick={() => setPreviewMode(false)}>
          ← Volver a editar
        </button>
        <ExperienceEngine
          experience={personalizedExperience}
          letterText={draft.letter || undefined}
          photoUrls={photoUrls}
        />
      </div>
    );
  }

  const progress = ((step + 1) / 6) * 100;

  return (
    <div className="creator-card creator-card-wide">
      <div className="creator-progress">
        <span style={{ width: `${progress}%` }} />
      </div>

      {step === 0 && (
        <div className="creator-step">
          <span className="eyebrow">01 · Elegí el momento</span>
          <h1>¿Qué querés convertir en algo inolvidable?</h1>
          <div className="choice-grid">
            {experiences.map((item) => (
              <button
                key={item.slug}
                onClick={() => update("experience", item.slug)}
                className={draft.experience === item.slug ? "selected" : ""}
              >
                <span>{item.icon}</span>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.eyebrow}</small>
                </div>
              </button>
            ))}
          </div>
          <button className="primary-action" onClick={() => setStep(1)}>
            Continuar
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="creator-step">
          <span className="eyebrow">02 · Ustedes</span>
          <h1>¿Quién hace esto y para quién?</h1>

          <div className="two-inputs">
            <label className="big-input">
              <span>Tu nombre</span>
              <input
                value={draft.giverName}
                onChange={(event) => update("giverName", event.target.value)}
                placeholder="Ej. Mauro"
              />
            </label>

            <label className="big-input">
              <span>Nombre de quien lo recibe</span>
              <input
                value={draft.recipient}
                onChange={(event) => update("recipient", event.target.value)}
                placeholder="Ej. Ailín"
              />
            </label>
          </div>

          <span className="field-title">¿Qué querés que sienta?</span>
          <div className="feeling-row">
            {feelings.map((item) => (
              <button
                key={item}
                onClick={() => update("feeling", item)}
                className={draft.feeling === item ? "selected" : ""}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="wizard-navigation">
            <button className="ghost-action" onClick={() => setStep(0)}>Atrás</button>
            <button
              className="primary-action"
              disabled={!draft.giverName.trim() || !draft.recipient.trim()}
              onClick={() => setStep(2)}
            >
              Seguir
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="creator-step">
          <span className="eyebrow">03 · La historia</span>
          <h1>Ahora contame lo que una plantilla nunca podría saber.</h1>

          <label className="story-field">
            <span>¿Qué relación tienen?</span>
            <textarea
              value={draft.relationship}
              onChange={(event) => update("relationship", event.target.value)}
              placeholder="Ej. Estamos juntos hace 8 años. Nos conocimos trabajando y al principio no nos soportábamos..."
              rows={4}
            />
          </label>

          <label className="story-field">
            <span>Una fecha que importe</span>
            <input
              type="date"
              value={draft.keyDate}
              onChange={(event) => update("keyDate", event.target.value)}
            />
          </label>

          <label className="story-field">
            <span>Una anécdota que sólo ustedes entiendan</span>
            <textarea
              value={draft.anecdote}
              onChange={(event) => update("anecdote", event.target.value)}
              placeholder="Ese viaje, esa frase, ese papelón, ese día..."
              rows={4}
            />
          </label>

          <div className="wizard-navigation">
            <button className="ghost-action" onClick={() => setStep(1)}>Atrás</button>
            <button className="primary-action" onClick={() => setStep(3)}>Agregar recuerdos</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="creator-step">
          <span className="eyebrow">04 · Los recuerdos</span>
          <h1>Elegí las fotos que cuentan la historia sin explicar nada.</h1>

          <label className="upload-zone">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              multiple
              onChange={(event) => selectPhotos(event.target.files)}
            />
            <span className="upload-icon">＋</span>
            <strong>Subir hasta 10 fotos</strong>
            <small>JPG, PNG, WEBP o HEIC · se usan sólo en tu preview por ahora</small>
          </label>

          {photoUrls.length > 0 && (
            <div className="photo-preview-grid">
              {photoUrls.map((url, index) => (
                <figure key={url}>
                  <img src={url} alt={photoNames[index] || "Recuerdo"} />
                  <figcaption>0{index + 1}</figcaption>
                </figure>
              ))}
            </div>
          )}

          <label className="story-field">
            <span>Canción especial · opcional</span>
            <input
              value={draft.musicUrl}
              onChange={(event) => update("musicUrl", event.target.value)}
              placeholder="Pegá un link de Spotify, YouTube o escribí el nombre"
            />
          </label>

          <div className="wizard-navigation">
            <button className="ghost-action" onClick={() => setStep(2)}>Atrás</button>
            <button className="primary-action" onClick={() => setStep(4)}>Escribir la parte importante</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="creator-step">
          <span className="eyebrow">05 · Tus palabras</span>
          <h1>Ahora aparece lo que sólo vos podés decir.</h1>

          <label className="story-field">
            <span>Primera frase · opcional</span>
            <textarea
              value={draft.opening}
              onChange={(event) => update("opening", event.target.value)}
              placeholder={baseExperience.opening}
              rows={3}
            />
          </label>

          <label className="story-field story-field-important">
            <span>La carta</span>
            <textarea
              value={draft.letter}
              onChange={(event) => update("letter", event.target.value)}
              placeholder="Escribí como hablás. No tiene que ser perfecta; tiene que ser tuya."
              rows={8}
            />
          </label>

          <label className="story-field">
            <span>La última frase · opcional</span>
            <textarea
              value={draft.closing}
              onChange={(event) => update("closing", event.target.value)}
              placeholder={baseExperience.closing}
              rows={3}
            />
          </label>

          <div className="wizard-navigation">
            <button className="ghost-action" onClick={() => setStep(3)}>Atrás</button>
            <button className="primary-action" onClick={() => setStep(5)}>Ver lo que creamos</button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="creator-step creator-review">
          <span className="eyebrow">06 · Antes de publicarlo</span>
          <h1>Esto ya empieza a parecerse a {draft.recipient}.</h1>

          <div className="review-card">
            <div className="review-icon">{baseExperience.icon}</div>
            <div>
              <span>{baseExperience.eyebrow}</span>
              <h2>{baseExperience.title}</h2>
              <p>
                De <strong>{draft.giverName}</strong> para <strong>{draft.recipient}</strong> · {draft.feeling.toLowerCase()} · {photoUrls.length} fotos seleccionadas
              </p>
            </div>
          </div>

          <div className="privacy-note">
            <span>◉</span>
            <div>
              <strong>Tu borrador todavía vive sólo en este dispositivo.</strong>
              <p>No subimos la historia al servidor hasta el paso de publicación. Las fotos elegidas tampoco se guardan si cerrás o recargás esta pestaña.</p>
            </div>
          </div>

          <div className="creator-actions creator-actions-review">
            <button className="primary-action" onClick={() => setPreviewMode(true)}>
              Vivir mi preview
            </button>
            <button className="ghost-action" onClick={() => setStep(4)}>
              Seguir editando
            </button>
          </div>

          <p className="publish-coming">
            El siguiente módulo conecta publicación, pago y link privado permanente.
          </p>
        </div>
      )}
    </div>
  );
}
