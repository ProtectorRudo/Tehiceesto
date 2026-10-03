"use client";

import { useMemo, useState } from "react";
import type { SceneType } from "@/data/experiences";

const catalog: { type: SceneType; label: string; hint: string }[] = [
  { type: "intro", label: "Entrada", hint: "Apertura cinematográfica" },
  { type: "door", label: "Puerta", hint: "Puerta interactiva" },
  { type: "memories", label: "Recuerdos", hint: "Fotos / polaroids" },
  { type: "timeline", label: "Línea de tiempo", hint: "Historia por etapas" },
  { type: "stars", label: "Estrellas", hint: "Mensajes escondidos" },
  { type: "light", label: "Luz", hint: "Frase revelada desde la oscuridad" },
  { type: "hold", label: "Mantener", hint: "Promesa que requiere mantener presionado" },
  { type: "quiz", label: "Pregunta", hint: "Quiz de la historia" },
  { type: "scratch", label: "Raspadita", hint: "Sorpresa para descubrir" },
  { type: "voices", label: "Voces", hint: "Audios de personas" },
  { type: "video", label: "Video", hint: "Momento audiovisual" },
  { type: "candles", label: "Velitas", hint: "Cumpleaños interactivo" },
  { type: "balloons", label: "Globos", hint: "Mensajes escondidos" },
  { type: "vault", label: "Bóveda", hint: "Revelación bloqueada" },
  { type: "capsule", label: "Cápsula", hint: "Mensaje para el futuro" },
  { type: "letter", label: "Carta", hint: "Sobre con lacre" },
  { type: "archive", label: "Archivo familiar", hint: "Carpeta de legado interactiva" },
  { type: "home", label: "La casa", hint: "Recuerdos cotidianos del hogar" },
  { type: "legacy", label: "Legado", hint: "Huella familiar y generaciones" },
  { type: "rituals", label: "Rituales", hint: "Pequeñas costumbres de pareja" },
  { type: "chapters", label: "Capítulos", hint: "Etapas y cosas atravesadas juntos" },
  { type: "future", label: "Lo que sigue", hint: "Próximo capítulo compartido" },
  { type: "origin", label: "El origen", hint: "Primer recuerdo antes de la pregunta" },
  { type: "reasons", label: "Razones", hint: "Razones íntimas para elegir a esa persona" },
  { type: "certainty", label: "Certeza", hint: "Promesa realista antes de la propuesta" },
  { type: "threshold", label: "Último umbral", hint: "Gesto intencional antes de revelar la pregunta" },
  { type: "childhood", label: "Infancia", hint: "Volver a mirar la niñez desde adulto" },
  { type: "care", label: "Cuidados", hint: "Gestos cotidianos e invisibles de mamá" },
  { type: "sacrifices", label: "Lo invisible", hint: "Tiempo, energía y esfuerzos que no se veían" },
  { type: "return", label: "Volver a casa", hint: "Refugio y vínculo con mamá" },
  { type: "lessons", label: "Lecciones", hint: "Aprendizajes cotidianos de papá" },
  { type: "presence", label: "Presencia", hint: "Formas silenciosas de estar" },
  { type: "inheritance", label: "Herencia", hint: "Rasgos y gestos que quedaron en los hijos" },
  { type: "lookback", label: "Mirar de adulto", hint: "Volver a conocer a papá como persona" },
  { type: "casefile", label: "Expediente", hint: "Archivo confidencial interactivo de amistad" },
  { type: "insidejokes", label: "Código interno", hint: "Frases y códigos que sólo ustedes entienden" },
  { type: "incidents", label: "Incidentes", hint: "Anécdotas y malas decisiones compartidas" },
  { type: "proof", label: "Pruebas reales", hint: "Momentos en los que la amistad estuvo de verdad" },
  { type: "pact", label: "Pacto", hint: "Acuerdo simbólico de amistad" },
  { type: "proposal", label: "Propuesta", hint: "Pregunta de casamiento" },
  { type: "finale", label: "Final", hint: "Cierre emocional" },
];

export default function SceneRecipeEditor({
  initialRecipe,
}: {
  initialRecipe: SceneType[];
}) {
  const [recipe, setRecipe] = useState<SceneType[]>(
    initialRecipe.length > 0 ? initialRecipe : ["intro", "memories", "letter", "finale"],
  );
  const [selected, setSelected] = useState<SceneType>("memories");

  const info = useMemo(
    () => new Map(catalog.map((item) => [item.type, item])),
    [],
  );

  const move = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= recipe.length) return;

    setRecipe((current) => {
      const copy = [...current];
      [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
      return copy;
    });
  };

  const remove = (index: number) => {
    if (recipe.length <= 1) return;
    setRecipe((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const add = () => setRecipe((current) => [...current, selected]);

  return (
    <div className="scene-editor">
      <input type="hidden" name="sceneRecipe" value={JSON.stringify(recipe)} />

      <div className="scene-editor-list">
        {recipe.map((scene, index) => {
          const meta = info.get(scene);
          return (
            <div className="scene-editor-row" key={`${scene}-${index}`}>
              <span className="scene-order">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{meta?.label || scene}</strong>
                <small>{meta?.hint || "Escena interactiva"}</small>
              </div>
              <div className="scene-row-actions">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label="Subir escena"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={index === recipe.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label="Bajar escena"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="danger"
                  disabled={recipe.length <= 1}
                  onClick={() => remove(index)}
                  aria-label="Quitar escena"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="scene-add-row">
        <select
          value={selected}
          onChange={(event) => setSelected(event.target.value as SceneType)}
        >
          {catalog.map((item) => (
            <option key={item.type} value={item.type}>
              {item.label} — {item.hint}
            </option>
          ))}
        </select>
        <button type="button" className="ghost-action" onClick={add}>
          + Agregar escena
        </button>
      </div>
    </div>
  );
}
