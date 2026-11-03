"use client";

import styles from "./gift-error.module.css";

/**
 * Never substitute an unrelated template for a paid gift.
 * Preserve its URL and provide a safe retry without revealing private data.
 */
export default function PrivateGiftError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className={styles.page}>
      <section className={styles.panel} role="alert" aria-labelledby="gift-error-heading">
        <div className={styles.symbol} aria-hidden="true">✦</div>
        <p className={styles.kicker}>TE HICE ESTO</p>
        <h1 id="gift-error-heading">No pudimos abrir este regalo</h1>
        <p className={styles.message}>
          El enlace no cambió. Ocurrió un problema al cargar la experiencia;
          podés volver a intentarlo sin perder el recorrido.
        </p>
        <button className={styles.retry} type="button" onClick={reset}>
          Volver a intentar
        </button>
        <p className={styles.hint}>
          Si continúa sin abrirse, compartí este mismo enlace con nuestro
          equipo para que podamos revisar el problema.
        </p>
      </section>
    </main>
  );
}
