"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import styles from "./account.module.css";
import StudioEnhancements, { type StudioMedia, type StudioGift } from "@/components/StudioEnhancements";

type Mode = "signin" | "signup" | "email" | "recover";
type Gift = {
  code: string;
  status: string;
  experienceSlug: string;
  templateVersion: string;
  assisted?: boolean;
  giverName: string;
  recipientName: string;
  purchasedAt: string;
  publishedAt: string | null;
};
type Story = Record<string, unknown>;
type EditableGift = {
  giver_name: string;
  recipient_name: string;
  occasion?: string | null;
  feeling?: string | null;
  opening_text?: string | null;
  letter_text?: string | null;
  closing_text?: string | null;
  music_url?: string | null;
  story_data?: Story | null;
};
type Studio = { code: string; editorToken: string; gift: EditableGift; media: StudioMedia[] };

const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const labels: Record<string, string> = {
  pareja: "Para tu pareja", cumpleanos: "Cumpleaños", hijos: "Para tus hijos",
  abuelos: "Para tus abuelos", aniversario: "Aniversario", propuesta: "Una propuesta",
  mama: "Para mamá", papa: "Para papá", amistad: "Amistad",
  secreto: "Un secreto", "siete-dias": "Un poquito de mí, cada día", "frasco365": "Un año de cosas lindas", "escape-caso-m": "Escape · Caso M",
  "escape-ultima-funcion": "Escape · Última función",
  "escape-ultima-campanada": "Escape · Última campanada",
};

function assisted(gift: Gift) {
  return gift.assisted === true || gift.experienceSlug.startsWith("escape-") ||
    (gift.experienceSlug === "pareja" && gift.templateVersion === "premium-v5");
}
function errorText(error: string) {
  if (/invalid.login|invalid.credentials/i.test(error)) return "Ese correo y contraseña no coinciden.";
  if (/email.not.confirmed/i.test(error)) return "Confirmá tu correo desde el enlace que te enviamos.";
  if (/rate.limit|too.many/i.test(error)) return "Demasiados intentos. Volvé a probar más tarde.";
  if (/already.registered|already.exists/i.test(error)) return "Esta cuenta ya existe. Probá ingresar o pedir un enlace por correo.";
  if (/password/i.test(error)) return "La contraseña debe tener al menos 8 caracteres y ser segura.";
  if (error === "account_unauthorized") return "Tu sesión venció. Volvé a iniciar sesión.";
  if (error === "email_unavailable") return "No pudimos enviar el mensaje. Probá de nuevo más tarde.";
  return "No pudimos completar la operación. Revisá los datos y volvé a intentarlo.";
}

async function callApi(
  endpoint: "gift-account" | "creator-api",
  payload: Record<string, unknown>,
  token = ""
) {
  const response = await fetch(projectUrl + "/functions/v1/" + endpoint, {
    method: "POST",
    cache: "no-store",
    headers: {
      apikey: publicKey,
      "content-type": "application/json",
      ...(token ? { authorization: "Bearer " + token } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    throw new Error(typeof data.error === "string" ? data.error : "request_failed");
  }
  return data;
}

export default function AccountPortal() {
  const supabase = useMemo<SupabaseClient | null>(() => {
    return projectUrl && publicKey
      ? createClient(projectUrl, publicKey, {
          auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
        })
      : null;
  }, []);
  const [mode, setMode] = useState<Mode>("signin");
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingGifts, setLoadingGifts] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordRepeat, setNewPasswordRepeat] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [studio, setStudio] = useState<Studio | null>(null);
  const [studioData, setStudioData] = useState<EditableGift | null>(null);
  const [passwordPanel, setPasswordPanel] = useState(false);
  const [openingCode, setOpeningCode] = useState("");
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async (current: Session) => {
    setLoadingGifts(true);
    try {
      const result = await callApi("gift-account", { action: "list" }, current.access_token);
      setGifts(Array.isArray(result.gifts) ? result.gifts : []);
    } catch (cause) {
      setError(errorText(cause instanceof Error ? cause.message : ""));
    } finally {
      setLoadingGifts(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) { setChecking(false); return; }
    let alive = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, current) => {
      if (!alive) return;
      setSession(current);
      if (event === "PASSWORD_RECOVERY") {
        setPasswordPanel(true);
        setMessage("Elegí una nueva contraseña para tu cuenta.");
      }
    });
    const initialise = async () => {
      try {
        const hash = new URLSearchParams(window.location.hash.slice(1));
        const tokenHash = hash.get("token_hash");
        const kind = hash.get("type");
        if (tokenHash && (kind === "magiclink" || kind === "recovery" || kind === "signup" || kind === "email" || kind === "invite")) {
          // Auth can create a recovery token for an existing account, even when
          // the link generator was asked for a magic link. Accept old emails
          // that carried the incorrect type as well as new correct links.
          let verifiedKind = kind;
          let verified = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: kind,
          });
          if (verified.error && kind === "magiclink") {
            verified = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: "recovery",
            });
            if (!verified.error) verifiedKind = "recovery";
          }
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
          if (verified.error) throw verified.error;
          if (verifiedKind === "recovery") {
            setPasswordPanel(true);
            setMessage("Acceso verificado. Ya podés crear tu contraseña personal.");
          }
        }
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (alive) setSession(data.session);
      } catch {
        if (alive) {
          setMode("email");
          setError("El enlace venció o fue reemplazado. Pedí uno nuevo desde «Entrar sin contraseña» y abrí el correo más reciente.");
        }
      } finally {
        if (alive) setChecking(false);
      }
    };
    void initialise();
    return () => { alive = false; subscription.unsubscribe(); };
  }, [supabase]);

  useEffect(() => {
    if (session) void reload(session);
    else { setGifts([]); setStudio(null); setStudioData(null); }
  }, [session?.access_token, reload]);

  const clearFeedback = () => { setMessage(""); setError(""); };
  const switchMode = (value: Mode) => {
    setMode(value);
    setPassword("");
    setPasswordRepeat("");
    clearFeedback();
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || loading) return;
    clearFeedback();
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    try {
      if (mode === "email") {
        const throttleKey = "thi-last-magiclink-" + cleanEmail;
        const lastRequested = Number(window.sessionStorage.getItem(throttleKey) || 0);
        const remaining = Math.ceil((45000 - (Date.now() - lastRequested)) / 1000);
        if (remaining > 0 && remaining <= 45) {
          setMessage("Ya solicitaste un enlace. Revisá el correo más reciente. Podrás pedir otro en " + remaining + " segundos.");
          return;
        }
        await callApi("gift-account", { action: "requestLink", email: cleanEmail });
        window.sessionStorage.setItem(throttleKey, String(Date.now()));
        setMessage("Te enviamos un enlace privado. Usá solamente el correo más reciente, también revisá Spam.");
      } else if (mode === "recover") {
        const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: window.location.origin + "/mis-regalos",
        });
        if (recoveryError) throw recoveryError;
        setMessage("Si esa cuenta existe, vas a recibir un enlace para elegir una contraseña nueva.");
      } else if (mode === "signup") {
        if (password.length < 8) throw new Error("password");
        if (password !== passwordRepeat) throw new Error("password_mismatch");
        const { data, error: signupError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { emailRedirectTo: window.location.origin + "/mis-regalos" },
        });
        if (signupError) throw signupError;
        if (data.session) setMessage("Cuenta creada. Ya podés entrar a tus regalos.");
        else setMessage("Te enviamos un correo para confirmar tu cuenta. Si ya tenías una, elegí «Entrar» o «Acceso por correo».");
        setPassword(""); setPasswordRepeat("");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (signInError) throw signInError;
        setPassword("");
      }
    } catch (cause) {
      const causeText = cause instanceof Error ? cause.message : "";
      setError(causeText === "password_mismatch" ? "Las contraseñas no coinciden." : errorText(causeText));
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    if (!supabase) return;
    clearFeedback();
    setStudio(null); setStudioData(null);
    await supabase.auth.signOut();
    setSession(null);
    setPasswordPanel(false);
    setMode("signin");
  };

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || saving) return;
    clearFeedback();
    if (newPassword.length < 8) { setError("Usá una contraseña de al menos 8 caracteres."); return; }
    if (newPassword !== newPasswordRepeat) { setError("Las contraseñas no coinciden."); return; }
    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      setNewPassword(""); setNewPasswordRepeat("");
      setPasswordPanel(false);
      setMessage("Tu contraseña se guardó correctamente.");
    } catch (cause) {
      setError(errorText(cause instanceof Error ? cause.message : ""));
    } finally { setSaving(false); }
  };

  const openGift = async (gift: Gift) => {
    if (!session || assisted(gift) || openingCode) return;
    clearFeedback();
    setOpeningCode(gift.code);
    try {
      const { editorToken } = await callApi("gift-account", { action: "open", code: gift.code }, session.access_token);
      const detail = await callApi("creator-api", { action: "openStudio", code: gift.code, editorToken });
      setStudio({ code: gift.code, editorToken, gift: detail.gift, media: Array.isArray(detail.media) ? detail.media : [] });
      setStudioData(detail.gift);
    } catch (cause) {
      setError(errorText(cause instanceof Error ? cause.message : ""));
    } finally { setOpeningCode(""); }
  };

  const saveGift = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!studio || !studioData || saving) return;
    clearFeedback(); setSaving(true);
    const story = studioData.story_data || {};
    try {
      await callApi("creator-api", {
        action: "saveStudioBasics", code: studio.code, editorToken: studio.editorToken,
        giverName: studioData.giver_name,
        recipientName: studioData.recipient_name,
        occasion: studioData.occasion || "",
        feeling: studioData.feeling || "",
        openingText: studioData.opening_text || "",
        letterText: studioData.letter_text || "",
        closingText: studioData.closing_text || "",
        musicUrl: studioData.music_url || "",
        relationship: story.relationship || "",
        anecdote: story.anecdote || "",
        keyDate: story.keyDate || "",
      });
      setMessage("Cambios guardados. La estructura y los efectos del modelo se mantienen intactos.");
      if (session) void reload(session);
    } catch (cause) {
      setError(errorText(cause instanceof Error ? cause.message : ""));
    } finally { setSaving(false); }
  };

  const changeGiftField = (key: keyof EditableGift, value: string) => {
    setStudioData((old) => old ? { ...old, [key]: value } : old);
  };

  return (
    <main id="mis-regalos" className={styles.page + " studio-page studio-account-page"}>
      <div className={styles.ambient} aria-hidden="true" />
      <div className={styles.frame}>
        <div className={styles.topline}>
          <span>TE HICE ESTO <span aria-hidden="true">♥</span></span>
          <a href="/">Volver al inicio <span aria-hidden="true">↗</span></a>
        </div>
        {checking ? (
          <section className={styles.authShell} aria-live="polite">
            <p className={styles.eyebrow}>ESPACIO PRIVADO</p>
            <h1>Preparando tus recuerdos<span className={styles.dot}>.</span></h1>
            <p>Estamos verificando tu acceso seguro.</p>
          </section>
        ) : !supabase ? (
          <section className={styles.authShell}>
            <h1>El acceso privado no está disponible.</h1>
            <p>Falta configurar la conexión de esta instalación. Ninguno de tus regalos se perdió.</p>
          </section>
        ) : !session ? (
          <section className={styles.authShell}>
            <div className={styles.authIntro}>
              <span className={styles.eyebrow}>UN LUGAR PARA VOLVER</span>
              <h1>Tus historias merecen <em>su propio lugar.</em></h1>
              <p>Entrá a tus experiencias, conservá los recuerdos y volvé a compartirlos cuando quieras.</p>
              <div className={styles.miniScene} aria-hidden="true">
                <span>01 / UNA HISTORIA</span>
                <span className={styles.sceneHeart}>♡</span>
                <strong>Lo que importa<br />queda.</strong>
                <span className={styles.sceneBottom}>UNA EXPERIENCIA PRIVADA PARA VOS</span>
              </div>
            </div>
            <div className={styles.authCard}>
              <span className={styles.eyebrow}>TU CUENTA</span>
              <h2>{mode === "signup" ? "Creá tu cuenta" : mode === "email" ? "Entrá desde tu correo" : mode === "recover" ? "Recuperá tu contraseña" : "Qué lindo verte de nuevo."}</h2>
              <p className={styles.subtle}>El mismo correo que usaste al comprar reúne todos tus regalos.</p>
              <div className={styles.tabs} role="group" aria-label="Forma de acceso">
                <button type="button" className={mode === "signin" ? styles.activeTab : ""} onClick={() => switchMode("signin")}>Entrar</button>
                <button type="button" className={mode === "signup" ? styles.activeTab : ""} onClick={() => switchMode("signup")}>Crear cuenta</button>
              </div>
              <form onSubmit={submit} className={styles.form}>
                <label>Correo electrónico
                  <input required autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@email.com" />
                </label>
                {mode !== "email" && mode !== "recover" && <label>Contraseña
                  <input required minLength={mode === "signup" ? 8 : undefined} autoComplete={mode === "signup" ? "new-password" : "current-password"} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Tu contraseña" />
                </label>}
                {mode === "signup" && <label>Repetí tu contraseña
                  <input required minLength={8} autoComplete="new-password" type="password" value={passwordRepeat} onChange={(event) => setPasswordRepeat(event.target.value)} placeholder="Repetir contraseña" />
                </label>}
                {error && <p className={styles.error} role="alert">{error}</p>}
                {message && <p className={styles.success} role="status">{message}</p>}
                <button className={styles.primary} disabled={loading} type="submit">
                  {loading ? "Un momento…" : mode === "signup" ? "Crear mi cuenta →" : mode === "email" ? "Enviarme un enlace →" : mode === "recover" ? "Recuperar contraseña →" : "Entrar a mis regalos →"}
                </button>
              </form>
              <div className={styles.authFooter}>
                {mode === "signin" ? <><button onClick={() => switchMode("recover")}>Olvidé mi contraseña</button><span className={styles.authDivider}> · </span><button onClick={() => switchMode("email")}>Entrar sin contraseña</button></> :
                  mode === "signup" ? <button onClick={() => switchMode("email")}>Ya tengo regalos, quiero un enlace de acceso</button> :
                  <button onClick={() => switchMode("signin")}>Prefiero usar mi contraseña</button>}
              </div>
              <p className={styles.secure}><span aria-hidden="true">✧</span> Acceso protegido. Solo vos podés ver los regalos asociados a tu correo.</p>
            </div>
          </section>
        ) : (
          <section className={styles.dashboard}>
            <div className={styles.dashboardHead}>
              <div>
                <span className={styles.eyebrow}>TU ESPACIO PERSONAL</span>
                <h1>{studio ? "Tu historia, a tu manera." : "Los recuerdos tienen casa."}</h1>
                <p>{session.user.email}</p>
              </div>
              <div className={styles.dashboardTools}>
                <button className={styles.ghost} onClick={() => { setStudio(null); setStudioData(null); setPasswordPanel((value) => !value); clearFeedback(); }}>{passwordPanel ? "Cerrar contraseña" : "Crear o cambiar contraseña"}</button>
                <button className={styles.ghost} onClick={logOut}>Cerrar sesión</button>
              </div>
            </div>
            {message && <p role="status" className={styles.success}>{message}</p>}
            {error && <p role="alert" className={styles.error}>{error}</p>}
            {passwordPanel && <form onSubmit={changePassword} className={styles.passwordCard}>
              <div><span className={styles.eyebrow}>SEGURIDAD</span><h2>Tu nueva contraseña</h2><p>Usala para ingresar sin esperar un correo. Mínimo 8 caracteres.</p></div>
              <label>Nueva contraseña<input required type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
              <label>Repetí la contraseña<input required type="password" autoComplete="new-password" minLength={8} value={newPasswordRepeat} onChange={(event) => setNewPasswordRepeat(event.target.value)} /></label>
              <button type="submit" disabled={saving} className={styles.primary}>{saving ? "Guardando…" : "Guardar contraseña"}</button>
            </form>}
            {studio && studioData ? (
              <div className={styles.studio}>
                <button type="button" className={styles.back} onClick={() => { setStudio(null); setStudioData(null); clearFeedback(); }}>← Volver a mis regalos</button>
                <div className={styles.studioHeading}>
                  <span className={styles.eyebrow}>EDITAR CONTENIDO · SIN MODIFICAR EL DISEÑO</span>
                  <h2>{labels[gifts.find((gift) => gift.code === studio.code)?.experienceSlug || ""] || "Mi regalo"}</h2>
                  <p>Personalizá nombres y mensajes. Las escenas y animaciones originales permanecen iguales.</p>
                </div>
                <form className={styles.editForm} onSubmit={saveGift}>
                  <div className={styles.editGrid}>
                    {([["giver_name", "De parte de"], ["recipient_name", "Para"], ["occasion", "Ocasión"], ["feeling", "Emoción"]] as const).map(([key, label]) =>
                      <label key={key}>{label}<input value={String(studioData[key] || "")} onChange={(event) => changeGiftField(key, event.target.value)} required={key === "giver_name" || key === "recipient_name"} maxLength={key === "occasion" ? 120 : 80} /></label>
                    )}
                    {([["opening_text", "Mensaje de bienvenida"], ["letter_text", "Carta personal"], ["closing_text", "Mensaje final"]] as const).map(([key, label]) =>
                      <label key={key} className={styles.wide}>{label}<textarea rows={key === "letter_text" ? 7 : 4} value={String(studioData[key] || "")} onChange={(event) => changeGiftField(key, event.target.value)} maxLength={key === "letter_text" ? 14000 : 5000} /></label>
                    )}
                  </div>
                  <div className={styles.personalDetails}>
                    <label>Fecha especial
                      <input type="date" value={String(studioData.story_data?.keyDate || "")}
                        onChange={(event) => setStudioData(old => old ? {...old,story_data:{...(old.story_data || {}),keyDate:event.target.value}} : old)} />
                    </label>
                    <label>Contexto / vínculo
                      <textarea rows={3} maxLength={5000} value={String(studioData.story_data?.relationship || "")}
                        onChange={(event) => setStudioData(old => old ? {...old,story_data:{...(old.story_data || {}),relationship:event.target.value}} : old)} />
                    </label>
                    <label>Un recuerdo o anécdota especial
                      <textarea rows={3} maxLength={4000} value={String(studioData.story_data?.anecdote || "")}
                        onChange={(event) => setStudioData(old => old ? {...old,story_data:{...(old.story_data || {}),anecdote:event.target.value}} : old)} />
                    </label>
                    <label>Enlace de música (opcional)
                      <input type="url" value={String(studioData.music_url || "")} maxLength={700} placeholder="https://..."
                        onChange={(event) => changeGiftField("music_url",event.target.value)} />
                    </label>
                  </div>
                  <div className={styles.saveBar}>
                    <span>Los cambios no alteran la estructura de la experiencia.</span>
                    <button className={styles.primary} type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar cambios →"}</button>
                  </div>
                </form>
                <StudioEnhancements
                  key={studio.code}
                  access={{ code: studio.code, editorToken: studio.editorToken }}
                  ownerToken={session?.access_token || ""}
                  gift={studioData as StudioGift}
                  initialMedia={studio.media}
                  onError={(value) => { setError(value); setMessage(""); }}
                  onNotice={(value) => { setMessage(value); setError(""); }}
                  onPublished={() => { if (session) void reload(session); }}
                />
              </div>
            ) : (
              <>
                <div className={styles.counter}>
                  <span>{loadingGifts ? "··" : gifts.length.toString().padStart(2, "0")}</span>
                  <div><strong>Experiencias en tu colección</strong><p>Cada historia tiene su propio lugar.</p></div>
                </div>
                {loadingGifts ? <p className={styles.empty}>Buscando tus regalos…</p> : gifts.length === 0 ?
                  <div className={styles.empty}><h2>Todavía no hay historias acá.</h2><p>Si compraste un regalo, asegurate de ingresar con el mismo correo de compra.</p><a className={styles.primary} href="/#experiencias">Explorar experiencias →</a></div> :
                  <div className={styles.giftGrid}>{gifts.map((gift, index) =>
                    <article className={styles.giftCard} key={gift.code}>
                      <div className={styles.giftTop}><span>{String(index + 1).padStart(2, "0")} / TE HICE ESTO</span><span className={styles.giftState}>{gift.status === "published" ? "PUBLICADO" : assisted(gift) ? "EDICIÓN ASISTIDA" : "PARA PERSONALIZAR"}</span></div>
                      <div className={styles.giftArt} aria-hidden="true"><span>♡</span></div>
                      <span className={styles.eyebrow}>{labels[gift.experienceSlug] || gift.experienceSlug.replaceAll("-", " ")}</span>
                      <h2>{gift.recipientName || "Una persona especial"}</h2>
                      <p>De {gift.giverName || "alguien especial"}</p>
                      <div className={styles.giftActions}>
                        {assisted(gift) ? <><span className={styles.assisted}>Nuestro equipo personaliza esta experiencia.</span><a href={"https://wa.me/5492215653163?text="+encodeURIComponent("Hola, quiero coordinar la personalización de mi regalo "+gift.code+" de Te Hice Esto.")} target="_blank" rel="noopener noreferrer">Coordinar por WhatsApp ↗</a></> :
                          <button disabled={Boolean(openingCode)} onClick={() => void openGift(gift)}>{openingCode === gift.code ? "Abriendo…" : "Editar mensajes →"}</button>}
                        {gift.status === "published" && <a href={(gift.experienceSlug.startsWith("escape-") ? "/escape-r/" : "/r/") + gift.code} target="_blank" rel="noopener noreferrer">Ver regalo ↗</a>}
                      </div>
                    </article>
                  )}</div>}
                <p className={styles.collectionFoot}>Todos tus regalos están asociados a tu correo de compra. Si no ves alguno, escribinos y lo revisamos.</p>
              </>
            )}
          </section>
        )}
        <footer className={styles.footer}><span>Hay cosas que merecen algo más que un mensaje.</span><span>© TE HICE ESTO</span></footer>
      </div>
    </main>
  );
}
