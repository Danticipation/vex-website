"use client";

import { useState } from "react";
import {
  onboardingStart,
  onboardingStripe,
  onboardingTheme,
  onboardingSeed,
  onboardingConfirm,
} from "@/lib/api";

export default function OnboardPage() {
  const [step, setStep] = useState(1);
  const [tenantId, setTenantId] = useState("");
  const [onboardingToken, setOnboardingToken] = useState("");
  const [email, setEmail] = useState("");
  const [dealerName, setDealerName] = useState("");
  const [password, setPassword] = useState("");
  const [tier, setTier] = useState<"STARTER" | "PRO" | "ENTERPRISE">("STARTER");
  const [customDomain, setCustomDomain] = useState("");
  const [status, setStatus] = useState("");

  async function runStep() {
    try {
      if (step === 1) {
        const data = await onboardingStart({
          email,
          dealerName,
          password,
          captchaToken: "dev-bypass",
        });
        setTenantId(data.tenantId);
        setOnboardingToken(data.onboardingToken);
        setStep(2);
      } else if (step === 2) {
        await onboardingStripe({ tenantId, tier, interval: "monthly" }, onboardingToken);
        setStep(3);
      } else if (step === 3) {
        await onboardingTheme({ tenantId, customDomain: customDomain || undefined }, onboardingToken);
        setStep(4);
      } else if (step === 4) {
        await onboardingSeed({ tenantId, enableDemoData: true }, onboardingToken);
        setStep(5);
      } else {
        const result = await onboardingConfirm({ tenantId }, onboardingToken);
        setStatus(`Done. Magic link: ${result.magicLink}`);
      }
    } catch (e) {
      setStatus((e as Error).message);
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>Dealer onboarding</h1>
      <p>5 steps, designed to complete in under 90 seconds.</p>
      {step === 1 && (
        <>
          <input placeholder="Business email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="Dealer name" value={dealerName} onChange={(e) => setDealerName(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </>
      )}
      {step === 2 && (
        <select value={tier} onChange={(e) => setTier(e.target.value as "STARTER" | "PRO" | "ENTERPRISE")}>
          <option value="STARTER">Starter</option>
          <option value="PRO">Pro</option>
          <option value="ENTERPRISE">Enterprise</option>
        </select>
      )}
      {step === 3 && <input placeholder="Custom domain (optional)" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} />}
      {step === 4 && <p>Seed demo data (10 vehicles + 3 appraisals).</p>}
      {step === 5 && <p>Confirm and get your magic link.</p>}
      <div style={{ marginTop: "1rem" }}>
        <button onClick={runStep}>Continue</button>
      </div>
      {status && <p style={{ marginTop: "1rem" }}>{status}</p>}
    </main>
  );
}
