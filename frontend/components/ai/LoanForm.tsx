"use client";

import { useState } from "react";
import { Calculator, Sparkles, Building2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { formatNumber } from "@/lib/utils";

type BankRecommendation = {
  bank: string;
  product: string;
  rate: number;
  bankType?: string | null;
};

type LoanResponse = {
  decision: "approved" | "rejected";
  emi: number;
  affordabilityRatio: number;
  interestRate: number;
  bank?: string | null;
  bankType?: string | null;
  purpose?: string | null;
  loanTermMonths: number;
  incomeAnnum: number;
  usedModel: boolean;
  reason: string;
  recommendedBanks: BankRecommendation[];
};

const BANK_OPTIONS = [
  { value: "", label: "Auto-recommend" },
  { value: "Arab Bank", label: "Arab Bank" },
  { value: "Housing Bank", label: "Housing Bank" },
  { value: "Cairo Amman Bank", label: "Cairo Amman Bank" },
  { value: "Jordan Islamic Bank", label: "Jordan Islamic Bank" },
];

export function LoanForm() {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LoanResponse | null>(null);

  const [income, setIncome] = useState("1500");
  const [amount, setAmount] = useState("85000");
  const [years, setYears] = useState("20");
  const [cibil, setCibil] = useState("720");
  const [dependents, setDependents] = useState("1");
  const [education, setEducation] = useState<"Graduate" | "Not Graduate">(
    "Graduate"
  );
  const [selfEmployed, setSelfEmployed] = useState<"Yes" | "No">("No");
  const [bank, setBank] = useState("");
  const [purpose, setPurpose] = useState("home");
  const [rate, setRate] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const body = {
        incomeMonthly: Number(income),
        loanAmount: Number(amount),
        loanTermYears: Number(years),
        cibilScore: Number(cibil),
        noOfDependents: Number(dependents),
        education,
        selfEmployed,
        bank: bank || undefined,
        purpose,
        interestRate: rate ? Number(rate) : undefined,
      };
      const res = await fetch("/api/ai/loan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as
        | LoanResponse
        | { detail?: string; message?: string };
      if (!res.ok) {
        const msg =
          (json as { message?: string; detail?: string }).message ||
          (json as { detail?: string }).detail ||
          "Could not run loan AI.";
        setError(msg);
        toast(msg, "error");
        return;
      }
      setResult(json as LoanResponse);
      toast("Loan analysis ready.", "success");
    } catch {
      setError("Could not reach the AI service.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr]">
      <form onSubmit={onSubmit} className="surface-card !p-7 flex flex-col gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Net monthly income (JOD)"
            inputMode="numeric"
            required
            value={income}
            onChange={(e) => setIncome(e.target.value)}
          />
          <Input
            label="Loan amount (JOD)"
            inputMode="numeric"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input
            label="Term (years)"
            inputMode="numeric"
            required
            value={years}
            onChange={(e) => setYears(e.target.value)}
          />
          <Input
            label="CIBIL / credit score (300–900)"
            inputMode="numeric"
            required
            value={cibil}
            onChange={(e) => setCibil(e.target.value)}
          />
          <Input
            label="Dependents"
            inputMode="numeric"
            value={dependents}
            onChange={(e) => setDependents(e.target.value)}
          />
          <Select
            label="Education"
            value={education}
            onChange={(e) =>
              setEducation(e.target.value as "Graduate" | "Not Graduate")
            }
            options={[
              { value: "Graduate", label: "Graduate" },
              { value: "Not Graduate", label: "Not Graduate" },
            ]}
          />
          <Select
            label="Self employed"
            value={selfEmployed}
            onChange={(e) =>
              setSelfEmployed(e.target.value as "Yes" | "No")
            }
            options={[
              { value: "No", label: "No" },
              { value: "Yes", label: "Yes" },
            ]}
          />
          <Select
            label="Preferred bank"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            options={BANK_OPTIONS}
          />
          <Input
            label="Purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="home, car, education…"
          />
          <Input
            label="Interest rate override (%)"
            inputMode="decimal"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="leave blank to use bank default"
          />
        </div>

        {error ? (
          <div className="rounded-2xl border border-[rgba(255,107,107,0.32)] bg-[rgba(255,107,107,0.08)] p-3 text-sm text-[var(--danger)]">
            {error}
          </div>
        ) : null}

        <Button type="submit" disabled={busy}>
          <Calculator size={16} />
          {busy ? "Analysing…" : "Run loan AI"}
        </Button>
      </form>

      <aside className="flex flex-col gap-4">
        {result ? (
          <>
            <div className="surface-card !p-7">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-extrabold uppercase tracking-wider ${
                  result.decision === "approved"
                    ? "bg-[rgba(71,209,140,0.16)] text-[#1f9c63]"
                    : "bg-[rgba(255,107,107,0.16)] text-[#c53b3b]"
                }`}
              >
                {result.decision}
              </span>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Metric label="Monthly EMI" value={`${formatNumber(result.emi)} JOD`} />
                <Metric label="Interest" value={`${result.interestRate.toFixed(2)}%`} />
                <Metric
                  label="Affordability"
                  value={`${(result.affordabilityRatio * 100).toFixed(0)}%`}
                  hint="EMI / income"
                />
                <Metric
                  label="Term"
                  value={`${result.loanTermMonths} months`}
                  hint={`Annual: ${formatNumber(result.incomeAnnum)} JOD`}
                />
              </div>
              <p className="mt-5 rounded-2xl bg-black/[0.03] p-4 text-sm leading-7 text-[var(--ink)]/80">
                {result.reason}
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--muted)]">
                <Sparkles size={12} />
                {result.usedModel ? "ML model + rules" : "Rule-based fallback"}
                {result.bank ? ` · target bank: ${result.bank}` : ""}
              </p>
            </div>

            {result.recommendedBanks.length ? (
              <div className="surface-card !p-7">
                <h3 className="text-[20px] tracking-tight">
                  Bank recommendations
                </h3>
                <ul className="mt-3 flex flex-col gap-2">
                  {result.recommendedBanks.map((b) => (
                    <li
                      key={`${b.bank}-${b.product}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 bg-black/[0.02] p-3"
                    >
                      <span className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[rgba(242,201,76,0.16)] text-[#7d5c00]">
                          <Building2 size={16} />
                        </span>
                        <span>
                          <strong className="block text-sm text-[var(--ink)]">
                            {b.bank}
                          </strong>
                          <span className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
                            {b.product}
                            {b.bankType ? ` · ${b.bankType}` : ""}
                          </span>
                        </span>
                      </span>
                      <strong className="text-sm text-[var(--gold-deep)]">
                        {b.rate.toFixed(2)}%
                      </strong>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : (
          <div className="surface-card !p-7 text-center text-[var(--muted)]">
            Fill the form and run the AI to see eligibility, EMI, and bank
            recommendations.
          </div>
        )}
      </aside>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-black/[0.02] p-3">
      <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
        {label}
      </p>
      <strong className="mt-1 block text-[18px] text-[var(--ink)]">
        {value}
      </strong>
      {hint ? <span className="text-[11px] text-[var(--muted)]">{hint}</span> : null}
    </div>
  );
}
