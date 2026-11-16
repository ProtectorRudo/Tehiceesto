import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const app=readFileSync(new URL("../app/page.jsx",import.meta.url),"utf8");

test("el acceso permite recuperar una cuenta existente sin registrarse otra vez",()=>{
 assert.match(app,/Olvidé mi contraseña/);
 assert.match(app,/resetPasswordForEmail\(email\.trim\(\),\{redirectTo:/);
 assert.match(app,/recoveryMode==="request"\?requestPasswordRecovery:login/);
});

test("la recuperación acepta el evento seguro de Supabase y pide una nueva contraseña",()=>{
 assert.match(app,/_event==="PASSWORD_RECOVERY"/);
 assert.match(app,/updateUser\(\{password:recoveryPass\}\)/);
 assert.match(app,/recoveryPass!==recoveryConfirm/);
 assert.match(app,/minLength=\{8\}/);
});

test("la invitación se conserva durante el correo de recuperación",()=>{
 assert.match(app,/\?invite="\+inviteInput/);
 assert.match(app,/cp_pending_invite/);
 assert.match(app,/recoveryMode==="update"/);
});

test("el error de credenciales muestra la recuperación sin divulgar usuarios",()=>{
 assert.match(app,/result\.error\.code==="invalid_credentials"/);
 assert.match(app,/Correo o contraseña incorrectos/);
});
