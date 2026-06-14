"use client";

import { useState, useTransition } from "react";
import { savePeekPayoutDetails } from "@/app/profile/actions";
import type { PayoutMethod } from "@/types/payout";
import { PAYOUT_METHOD_LABELS } from "@/types/payout";
import type { RunnerProfile } from "@/types/runner";

type PeekPayoutPanelProps = {
  profile: RunnerProfile | null;
};

export function PeekPayoutPanel({ profile }: PeekPayoutPanelProps) {
  const [method, setMethod] = useState<PayoutMethod | "">(
    profile?.payout_method ?? ""
  );
  const [wiseEmail, setWiseEmail] = useState(profile?.wise_email ?? "");
  const [bankAccountName, setBankAccountName] = useState(
    profile?.bank_account_name ?? ""
  );
  const [bankSortCode, setBankSortCode] = useState(profile?.bank_sort_code ?? "");
  const [bankAccountNumber, setBankAccountNumber] = useState(
    profile?.bank_account_number ?? ""
  );
  const [bankIban, setBankIban] = useState(profile?.bank_iban ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await savePeekPayoutDetails({
        payout_method: method || null,
        wise_email: wiseEmail,
        bank_account_name: bankAccountName,
        bank_sort_code: bankSortCode,
        bank_account_number: bankAccountNumber,
        bank_iban: bankIban
      });

      if (result.error) {
        setError(result.error);
      } else {
        setMessage("Payout details saved.");
      }
    });
  }

  return (
    <article className="card-static space-y-6">
      <div>
        <h2 className="heading-section text-lg">How you get paid</h2>
        <p className="mt-2 text-body">
          After you complete a job, we pay you manually via your chosen method.
          Pick Wise or bank transfer and fill in the details we need.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-peek-text">
            Payout method
          </legend>
          {(["wise", "bank_transfer"] as PayoutMethod[]).map((option) => (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 hover:border-peek-primary"
            >
              <input
                type="radio"
                name="payout_method"
                value={option}
                checked={method === option}
                onChange={() => setMethod(option)}
                disabled={isPending}
              />
              <span className="text-sm font-medium text-peek-text">
                {PAYOUT_METHOD_LABELS[option]}
              </span>
            </label>
          ))}
        </fieldset>

        {method === "wise" && (
          <div className="space-y-2">
            <label htmlFor="wise_email" className="text-sm font-semibold text-peek-text">
              Wise email
            </label>
            <input
              id="wise_email"
              type="email"
              value={wiseEmail}
              onChange={(event) => setWiseEmail(event.target.value)}
              required
              disabled={isPending}
              placeholder="you@email.com"
              className="input-field"
            />
          </div>
        )}

        {method === "bank_transfer" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="bank_account_name"
                className="text-sm font-semibold text-peek-text"
              >
                Account name
              </label>
              <input
                id="bank_account_name"
                type="text"
                value={bankAccountName}
                onChange={(event) => setBankAccountName(event.target.value)}
                required
                disabled={isPending}
                className="input-field"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="bank_sort_code"
                  className="text-sm font-semibold text-peek-text"
                >
                  Sort code (UK)
                </label>
                <input
                  id="bank_sort_code"
                  type="text"
                  value={bankSortCode}
                  onChange={(event) => setBankSortCode(event.target.value)}
                  disabled={isPending}
                  placeholder="00-00-00"
                  className="input-field"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="bank_account_number"
                  className="text-sm font-semibold text-peek-text"
                >
                  Account number
                </label>
                <input
                  id="bank_account_number"
                  type="text"
                  value={bankAccountNumber}
                  onChange={(event) => setBankAccountNumber(event.target.value)}
                  disabled={isPending}
                  className="input-field"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="bank_iban" className="text-sm font-semibold text-peek-text">
                IBAN (if outside UK)
              </label>
              <input
                id="bank_iban"
                type="text"
                value={bankIban}
                onChange={(event) => setBankIban(event.target.value)}
                disabled={isPending}
                className="input-field"
              />
              <p className="text-xs text-peek-muted">
                Provide sort code + account number for UK accounts, or IBAN for
                international.
              </p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || !method}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save payout details"}
        </button>
      </form>

      {message && (
        <p className="text-sm text-emerald-700" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </article>
  );
}
