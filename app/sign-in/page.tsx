"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "../../components/site-header";
import { createClient } from "../../lib/supabase/client";
export default function SignIn() {
  const router = useRouter();
  const supabase = createClient();
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [mode,setMode]=useState<"signin"|"signup">("signin"); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const result=mode==="signin" ? await supabase.auth.signInWithPassword({email,password}) : await supabase.auth.signUp({email,password});
    setBusy(false); if(result.error){setError(result.error.message);return;} router.push("/account"); router.refresh();
  }
  return <><SiteHeader/><main className="auth-page"><div className="auth-card">
    <span className="eyebrow">CARIBBEAN STAR STORE</span><h1>{mode==="signin"?"Sign in":"Create account"}</h1>
    <p>One identity for buying, selling, organizations and the services that power the marketplace.</p>
    <form onSubmit={submit}>
      <label>Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
      <label>Password<input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/></label>
      {error?<p className="form-error">{error}</p>:null}
      <button className="button primary" disabled={busy} type="submit">{busy?"Please wait…":mode==="signin"?"Continue":"Create account"}</button>
    </form>
    <button className="text-button" type="button" onClick={()=>{setMode(mode==="signin"?"signup":"signin");setError("");}}>{mode==="signin"?"Need an account? Create one":"Already have an account? Sign in"}</button>
  </div></main></>;
}
