// src/components/business/application/PaymentFields.tsx
"use client";

import {
  AlertTriangle,
  Banknote,
  Check,
  Copy,
  ShieldCheck,
  Smartphone,
  Zap,
} from "@/components/ui/icons";
import * as React from "react";

import {
  DEMO_PAYMENT_CODE,
  formatPkr,
  PAYMENT_METHOD_LABEL,
  type PaymentMethod,
} from "@/lib/listing-application";
import { cn } from "@/lib/utils";

import { DocumentPicker } from "./DocumentPicker";

/** What the server tells the form about where to pay. Account details only. */
export interface PaymentAccountView {
  method: PaymentMethod;
  provider: string;
  accountTitle: string;
  accountNumber: string;
  iban: string | null;
}

export interface PaymentDraft {
  method: PaymentMethod | "";
  payerName: string;
  reference: string;
  paidOn: string;
  receipt?: File;
}

/** Today in Pakistan, as the date input wants it. */
export function karachiToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(
    new Date(),
  );
}

export function emptyPayment(): PaymentDraft {
  return { method: "", payerName: "", reference: "", paidOn: karachiToday() };
}

const FIELD =
  "h-12 w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-4 text-ui text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-plug-blue-500 focus:shadow-focus";

function CopyValue({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          // Clipboard refused (insecure context or permissions): the value is on screen to copy by hand.
        }
      }}
      aria-label={`Copy ${label}`}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-ui-xs font-semibold text-plug-blue-600 hover:bg-plug-blue-50"
    >
      {copied ? (
        <Check size={12} aria-hidden="true" />
      ) : (
        <Copy size={12} aria-hidden="true" />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export interface PaymentFieldsProps {
  fee: number;
  accounts: PaymentAccountView[];
  value: PaymentDraft;
  onChange: (next: PaymentDraft) => void;
  /** A receipt is already on record (resending a corrected payment). */
  receiptOnFile?: boolean;
  idPrefix: string;
}

/**
 * The listing fee: where to send it, then the proof that it was sent.
 *
 * There is no card gateway, so the money moves by bank transfer or mobile
 * wallet outside this page and an operator matches the transaction ID and
 * receipt against the account statement. The page says exactly that, and
 * that the listing is not reviewed until the payment is confirmed.
 */
export function PaymentFields({
  fee,
  accounts,
  value,
  onChange,
  receiptOnFile,
  idPrefix,
}: PaymentFieldsProps) {
  const set = <K extends keyof PaymentDraft>(key: K, next: PaymentDraft[K]) =>
    onChange({ ...value, [key]: next });
  const chosen = accounts.find((account) => account.method === value.method);
  const isDemo = value.method === "demo";

  if (accounts.length === 0) {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-2xl border-[1.5px] border-amber-200 bg-amber-50 p-5"
      >
        <AlertTriangle
          size={18}
          className="mt-0.5 shrink-0 text-amber-600"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-semibold text-amber-900">
            Online payment is not available right now
          </p>
          <p className="mt-1 text-sm leading-relaxed text-amber-800">
            We cannot take the listing fee at the moment. Write to{" "}
            <a href="mailto:hello@plug.pk" className="font-semibold underline">
              hello@plug.pk
            </a>{" "}
            and we will send payment details, or try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* What is being paid for */}
      <div className="rounded-2xl border-[1.5px] border-plug-blue-200 bg-plug-blue-50/60 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-ui-xs font-semibold uppercase tracking-wide text-plug-blue-700">
              Listing fee
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Standard listing · first month
            </p>
          </div>
          <p className="text-3xl font-black tracking-tight text-slate-900">
            {formatPkr(fee)}
          </p>
        </div>
        <ul className="mt-4 grid gap-1.5 border-t border-plug-blue-100 pt-4 text-ui-sm text-slate-600 sm:grid-cols-2">
          {[
            "Your chargers on the plugpk map",
            "Photos and charger details",
            "Driver reviews",
            "Views and directions dashboard",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <Check
                size={14}
                className="shrink-0 text-plug-blue-600"
                aria-hidden="true"
              />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Step 1: choose and pay */}
      <fieldset>
        <legend className="mb-1 text-sm font-semibold text-slate-700">
          1. Send the fee *
        </legend>
        <p className="mb-3 text-ui-sm text-slate-500">
          Choose a method and send exactly {formatPkr(fee)} to the account
          shown.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {accounts.map((account) => {
            const selected = value.method === account.method;
            const Icon =
              account.method === "bank"
                ? Banknote
                : account.method === "demo"
                  ? Zap
                  : Smartphone;
            return (
              <button
                key={account.method}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  if (account.method === value.method) return;
                  // The test code and a real transaction ID share a field; switching clears it.
                  const crossing =
                    account.method === "demo" || value.method === "demo";
                  onChange({
                    ...value,
                    method: account.method,
                    ...(crossing ? { reference: "" } : {}),
                  });
                }}
                className={cn(
                  "rounded-2xl border-[1.5px] p-4 text-left transition-all",
                  selected
                    ? "border-plug-blue-500 bg-plug-blue-50"
                    : "border-slate-200 bg-white hover:bg-slate-50",
                )}
              >
                <Icon
                  size={20}
                  className={cn(
                    "mb-2",
                    selected ? "text-plug-blue-600" : "text-slate-400",
                  )}
                  aria-hidden="true"
                />
                <span className="block text-sm font-semibold text-slate-900">
                  {PAYMENT_METHOD_LABEL[account.method]}
                </span>
                <span className="block truncate text-xs text-slate-400">
                  {account.provider}
                </span>
              </button>
            );
          })}
        </div>

        {chosen?.method === "demo" ? (
          <div className="mt-4 rounded-2xl border-[1.5px] border-dashed border-amber-300 bg-amber-50 p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
              <Zap size={16} aria-hidden="true" />
              Test mode — no money is taken
            </p>
            <p className="mt-1 text-ui-sm leading-relaxed text-amber-800">
              For testing until online payments are connected. Enter the test
              code{" "}
              <span className="font-mono font-semibold">
                {DEMO_PAYMENT_CODE}
              </span>{" "}
              to continue.
            </p>
            <label
              htmlFor={`${idPrefix}-demo-code`}
              className="mb-2 mt-4 block text-ui-sm font-medium text-amber-900"
            >
              Test code
            </label>
            <input
              id={`${idPrefix}-demo-code`}
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={value.reference}
              onChange={(e) =>
                set("reference", e.target.value.replace(/\D/g, ""))
              }
              placeholder="0000"
              className={cn(
                FIELD,
                "max-w-[180px] text-center font-mono text-lg tracking-[0.5em]",
              )}
            />
          </div>
        ) : chosen ? (
          <dl className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {[
              chosen.method === "bank" ? ["Bank", chosen.provider] : null,
              ["Account title", chosen.accountTitle],
              [
                chosen.method === "bank" ? "Account number" : "Mobile account",
                chosen.accountNumber,
              ],
              chosen.iban ? ["IBAN", chosen.iban] : null,
              ["Amount", formatPkr(fee)],
            ]
              .filter((row): row is [string, string] => row !== null)
              .map(([label, text]) => (
                <div
                  key={label}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                >
                  <dt className="text-ui-sm text-slate-500">{label}</dt>
                  <dd className="flex items-center gap-2 font-mono text-ui-sm font-semibold text-slate-900">
                    {text}
                    {label !== "Bank" ? (
                      <CopyValue
                        value={label === "Amount" ? String(fee) : text}
                        label={label}
                      />
                    ) : null}
                  </dd>
                </div>
              ))}
          </dl>
        ) : null}
      </fieldset>

      {/* Step 2: proof (the test payment needs none) */}
      {isDemo ? null : (
        <fieldset className="grid gap-4">
          <legend className="mb-1 text-sm font-semibold text-slate-700">
            2. Tell us about the payment *
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor={`${idPrefix}-payer`}
                className="mb-2 block text-ui-sm font-medium text-slate-600"
              >
                Name on the paying account
              </label>
              <input
                id={`${idPrefix}-payer`}
                maxLength={120}
                autoComplete="name"
                value={value.payerName}
                onChange={(e) => set("payerName", e.target.value)}
                placeholder="As it appears on your bank or wallet"
                className={FIELD}
              />
            </div>
            <div>
              <label
                htmlFor={`${idPrefix}-paid-on`}
                className="mb-2 block text-ui-sm font-medium text-slate-600"
              >
                Date paid
              </label>
              <input
                id={`${idPrefix}-paid-on`}
                type="date"
                max={karachiToday()}
                value={value.paidOn}
                onChange={(e) => set("paidOn", e.target.value)}
                className={FIELD}
              />
            </div>
          </div>
          <div>
            <label
              htmlFor={`${idPrefix}-reference`}
              className="mb-2 block text-ui-sm font-medium text-slate-600"
            >
              Transaction ID / reference
            </label>
            <input
              id={`${idPrefix}-reference`}
              maxLength={60}
              autoComplete="off"
              value={value.reference}
              onChange={(e) => set("reference", e.target.value)}
              placeholder="e.g. 0123456789 or FT24301XYZ"
              className={cn(FIELD, "font-mono")}
            />
          </div>
          <DocumentPicker
            id={`${idPrefix}-receipt`}
            label="Payment receipt"
            hint="A screenshot of the confirmation, or the bank's receipt, up to 4 MB"
            required
            allowPdf
            file={value.receipt}
            onFile={receiptOnFile}
            onChange={(file) => set("receipt", file)}
          />
        </fieldset>
      )}

      {isDemo ? null : (
        <p className="flex items-start gap-2 rounded-xl bg-slate-50 px-4 py-3 text-ui-sm text-slate-600">
          <ShieldCheck
            size={16}
            className="mt-0.5 shrink-0 text-emerald-600"
            aria-hidden="true"
          />
          Our team matches your transaction ID against our account before
          reviewing the listing. If the payment cannot be found, you will see
          why on your dashboard and can send the details again.
        </p>
      )}
    </div>
  );
}

/** The form's own check, matching the server's, so mistakes show before sending. */
export function paymentProblem(
  value: PaymentDraft,
  receiptOnFile = false,
): string | null {
  if (!value.method) return "Choose how you paid the listing fee.";
  if (value.method === "demo") {
    return value.reference.trim() === DEMO_PAYMENT_CODE
      ? null
      : `Enter the test code ${DEMO_PAYMENT_CODE} to continue.`;
  }
  if (!value.payerName.trim())
    return "Enter the name on the account you paid from.";
  if (value.reference.trim().length < 4)
    return "Enter the transaction ID from your receipt.";
  if (!value.paidOn) return "Enter the date you paid.";
  if (value.paidOn > karachiToday())
    return "The payment date cannot be in the future.";
  if (!value.receipt && !receiptOnFile) return "Upload your payment receipt.";
  return null;
}
