import './letter-reveal.css';

export type LetterPhase = 'sealed' | 'opened' | 'read';

type Props = {
  phase: LetterPhase;
  onBreakSeal: () => void;
  onRead: () => void;
  onClose: () => void;
};

/** Three tangible steps, no autoplay or timer, so touch and keyboard players control the reveal. */
export function LetterReveal({phase,onBreakSeal,onRead,onClose}: Props){
  const reading=phase==='read';
  return <div className={'letter-reveal letter-phase-'+phase}>
    <button type="button" className="letter-exit" onClick={onClose} aria-label="Guardar la carta y volver al invernadero">×</button>
    {!reading ? <>
      <div className="letter-intro">
        <span className="letter-eyebrow">OBJETO ENCONTRADO · III</span>
        <h2>{phase==='sealed'?'Un sobre esperaba por vos.':'El sello se ha roto.'}</h2>
        <p>{phase==='sealed'?'El cajón se abre lentamente. Entre el terciopelo hay un sobre antiguo, cerrado con cera.':'La solapa cedió. Hay una carta escrita a mano esperando ser desplegada.'}</p>
      </div>
      <button className="envelope-control" type="button" onClick={phase==='sealed'?onBreakSeal:onRead}
        aria-label={phase==='sealed'?'Romper el sello de cera del sobre':'Extraer y desplegar la carta'}>
        <span className="envelope-3d" aria-hidden="true">
          <span className="envelope-back"/>
          <span className="envelope-paper"><span>Para quien llegó hasta aquí</span><span className="paper-decoration">✿</span></span>
          <span className="envelope-front"/>
          <span className="envelope-flap"/>
          <span className="envelope-seal">✿</span>
        </span>
        <span className="envelope-action">{phase==='sealed'?'✧ Tocá para romper el sello':'✧ Tocá para desplegar la carta'}</span>
      </button>
      <p className="letter-small-print">Una pista puede cambiar el destino de este jardín.</p>
    </> : <>
      <article className="letter-paper" aria-label="Carta hallada dentro del cajón">
        <div className="letter-paper-flourish" aria-hidden="true">✦ ── ✿ ── ✦</div>
        <span className="letter-paper-label">CARTA Nº III · UN SECRETO GUARDADO</span>
        <h2>Para quien llegó hasta aquí...</h2>
        <div className="letter-ink">
          <p>Hay momentos que todavía no vivimos, pero que ya tengo ganas de recordar con vos.</p>
          <p>Primero nació una flor. La lluvia le dio vida. Cuando llegó la luna, el jardín aprendió a guardar secretos.</p>
          <div className="letter-illustration" aria-hidden="true"><span>✿</span><i/><span>☂</span><i/><span>☾</span></div>
          <p>Y cuando el tiempo quiera cerrarlo todo: la lluvia mojará la noche; bajo la luna florecerá lo que falta.</p>
        </div>
        <div className="letter-signature">Alguien que todavía espera del otro lado... <span>♡</span></div>
        <div className="letter-fold-line" aria-hidden="true"/>
      </article>
      <p className="letter-afterword">Algo se oculta entre los libros. Guardá también el último verso para el jardín.</p>
      <button className="primary letter-continue" type="button" onClick={onClose}>Guardar carta y continuar <span aria-hidden="true">→</span></button>
      <p className="letter-reassurance">Podés volver a leerla desde el botón «Carta».</p>
    </>}
  </div>;
}
