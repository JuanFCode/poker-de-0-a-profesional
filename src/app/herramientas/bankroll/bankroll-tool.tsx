"use client";

import { useMemo, useRef, useState } from "react";
import { ResultsChart } from "@/components/results-chart";
import { Stat, ToolShell } from "@/components/tool-shell";
import {
  BANKROLL_RULES,
  checkBankroll,
  FORMAT_LIST,
  sessionProfit,
  summarize,
  type Format,
  type Session,
} from "@/lib/bankroll";
import { downloadJson, STORAGE_KEYS, useStoredState } from "@/lib/storage";

interface BankrollState {
  bankroll: number;
  currency: string;
  sessions: Session[];
}

const EMPTY: BankrollState = { bankroll: 0, currency: "€", sessions: [] };

const today = () => new Date().toISOString().slice(0, 10);

const emptyDraft = () => ({
  date: today(),
  format: "cash" as Format,
  stakes: "NL10",
  bigBlind: 0.1,
  buyIn: 10,
  cashOut: 10,
  hours: 1,
  hands: 500,
  notes: "",
});

export function BankrollTool() {
  const [state, setState, { hydrated, reset }] = useStoredState<BankrollState>(
    STORAGE_KEYS.bankroll,
    EMPTY,
  );
  const [draft, setDraft] = useState(emptyDraft);
  const [checkBuyIn, setCheckBuyIn] = useState(10);
  const [checkFormat, setCheckFormat] = useState<Format>("cash");
  const fileRef = useRef<HTMLInputElement>(null);

  const summary = useMemo(() => summarize(state.sessions), [state.sessions]);
  const roll = checkBankroll(state.bankroll, checkBuyIn, checkFormat);
  const currency = state.currency;

  const addSession = () => {
    const session: Session = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: draft.date,
      format: draft.format,
      stakes: draft.stakes,
      bigBlind: draft.bigBlind,
      buyIn: draft.buyIn,
      cashOut: draft.cashOut,
      hours: draft.hours,
      hands: draft.hands,
      notes: draft.notes.trim() || undefined,
    };
    setState((current) => ({
      ...current,
      sessions: [...current.sessions, session],
      bankroll: current.bankroll + sessionProfit(session),
    }));
    setDraft((current) => ({ ...emptyDraft(), ...current, date: today(), notes: "" }));
  };

  const removeSession = (id: string) => {
    setState((current) => {
      const target = current.sessions.find((session) => session.id === id);
      return {
        ...current,
        sessions: current.sessions.filter((session) => session.id !== id),
        bankroll: target ? current.bankroll - sessionProfit(target) : current.bankroll,
      };
    });
  };

  const importJson = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as BankrollState;
      if (!Array.isArray(parsed.sessions)) throw new Error("formato");
      setState({
        bankroll: Number(parsed.bankroll) || 0,
        currency: parsed.currency || "€",
        sessions: parsed.sessions,
      });
    } catch {
      window.alert("Ese fichero no tiene el formato esperado.");
    }
  };

  const money = (value: number) =>
    `${value > 0 ? "+" : ""}${value.toLocaleString("es-ES", { maximumFractionDigits: 2 })} ${currency}`;

  return (
    <ToolShell
      eyebrow="Herramienta 04"
      title="Tracker de bankroll"
      intro="Apunta cada sesión y deja que los números hablen: curva acumulada, win-rate en bb/100, ganancia por hora y un aviso si el nivel al que juegas no cabe en tu bankroll."
    >
      {/* -------------------------------------------------- estado del bankroll */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="surface min-w-0 rounded-xl p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Resultado acumulado</p>
              <p
                className={`mt-1.5 font-display text-4xl ${
                  summary.profit >= 0 ? "text-action-call" : "text-suit-red"
                }`}
              >
                {hydrated ? money(summary.profit) : "—"}
              </p>
            </div>
            <p className="font-mono text-[11px] text-cream-faint">
              {summary.count} sesiones · {summary.hours.toFixed(1)} h ·{" "}
              {summary.hands.toLocaleString("es-ES")} manos
            </p>
          </div>
          <div className="mt-6">
            <ResultsChart points={summary.curve} currency={currency} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Stat
              label="Win-rate"
              value={summary.bbPer100 === null ? "—" : `${summary.bbPer100.toFixed(1)}`}
              hint="bb/100 manos"
              tone={summary.bbPer100 !== null && summary.bbPer100 > 0 ? "good" : "default"}
            />
            <Stat
              label="Por hora"
              value={`${summary.perHour.toFixed(1)}`}
              hint={`${currency}/hora`}
              tone={summary.perHour > 0 ? "good" : "default"}
            />
            <Stat
              label="Sesiones ganadas"
              value={
                summary.count === 0
                  ? "—"
                  : `${((summary.winningSessions / summary.count) * 100).toFixed(0)}%`
              }
            />
            <Stat
              label="Peor caída"
              value={summary.maxDrawdown === 0 ? "—" : `${summary.maxDrawdown.toFixed(0)}`}
              hint="Desde un máximo"
              tone={summary.maxDrawdown > 0 ? "warn" : "default"}
            />
          </div>

          <div
            className={`rounded-xl border p-5 ${
              roll.level === "ok"
                ? "border-action-call/40 bg-action-call/5"
                : roll.level === "justo"
                  ? "border-brass-400/40 bg-brass-500/5"
                  : "border-suit-red/40 bg-suit-red/5"
            }`}
          >
            <p className="eyebrow">Semáforo de bankroll</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="block">
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-cream-faint">
                  Bankroll
                </span>
                <input
                  type="number"
                  value={state.bankroll}
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      bankroll: Number(event.target.value) || 0,
                    }))
                  }
                  className="mt-1 w-full rounded border border-brass-500/20 bg-felt-900 px-2 py-1.5 font-mono text-sm text-cream focus:border-brass-400 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-cream-faint">
                  Buy-in del nivel
                </span>
                <input
                  type="number"
                  value={checkBuyIn}
                  onChange={(event) => setCheckBuyIn(Number(event.target.value) || 0)}
                  className="mt-1 w-full rounded border border-brass-500/20 bg-felt-900 px-2 py-1.5 font-mono text-sm text-cream focus:border-brass-400 focus:outline-none"
                />
              </label>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {FORMAT_LIST.map((rule) => (
                <button
                  key={rule.format}
                  type="button"
                  onClick={() => setCheckFormat(rule.format)}
                  className={`rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors ${
                    checkFormat === rule.format
                      ? "bg-brass-500/20 text-brass-200"
                      : "text-cream-faint hover:text-brass-300"
                  }`}
                >
                  {rule.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-cream-dim">{roll.message}</p>
            <p className="mt-2 font-mono text-[10px] text-cream-faint">
              Recomendado: {roll.recommended} buy-ins · mínimo: {roll.minimum}
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- nueva sesión */}
      <section className="mt-14">
        <h2 className="font-display text-3xl tracking-tight text-cream">Añadir sesión</h2>
        <div className="surface mt-6 grid gap-4 rounded-xl p-6 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Fecha">
            <input
              type="date"
              value={draft.date}
              onChange={(event) => setDraft({ ...draft, date: event.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Formato">
            <select
              value={draft.format}
              onChange={(event) => setDraft({ ...draft, format: event.target.value as Format })}
              className={inputClass}
            >
              {FORMAT_LIST.map((rule) => (
                <option key={rule.format} value={rule.format}>
                  {rule.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nivel">
            <input
              value={draft.stakes}
              onChange={(event) => setDraft({ ...draft, stakes: event.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label={`Ciega grande (${currency})`}>
            <input
              type="number"
              step="0.01"
              value={draft.bigBlind}
              onChange={(event) => setDraft({ ...draft, bigBlind: Number(event.target.value) })}
              className={inputClass}
            />
          </Field>
          <Field label="Buy-in / entrada">
            <input
              type="number"
              step="0.01"
              value={draft.buyIn}
              onChange={(event) => setDraft({ ...draft, buyIn: Number(event.target.value) })}
              className={inputClass}
            />
          </Field>
          <Field label="Retirada final">
            <input
              type="number"
              step="0.01"
              value={draft.cashOut}
              onChange={(event) => setDraft({ ...draft, cashOut: Number(event.target.value) })}
              className={inputClass}
            />
          </Field>
          <Field label="Horas">
            <input
              type="number"
              step="0.25"
              value={draft.hours}
              onChange={(event) => setDraft({ ...draft, hours: Number(event.target.value) })}
              className={inputClass}
            />
          </Field>
          <Field label="Manos">
            <input
              type="number"
              value={draft.hands}
              onChange={(event) => setDraft({ ...draft, hands: Number(event.target.value) })}
              className={inputClass}
            />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <Field label="Nota (opcional)">
              <input
                value={draft.notes}
                placeholder="Mesa floja, jugué cansado, probé nivel nuevo…"
                onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={addSession}
              className="rounded-full bg-brass-500 px-7 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-felt-950 transition-colors hover:bg-brass-300"
            >
              Guardar sesión
            </button>
            <p className="font-mono text-[11px] text-cream-faint">
              Resultado: {money(draft.cashOut - draft.buyIn)}
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- sesiones */}
      <section className="mt-14">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-3xl tracking-tight text-cream">Sesiones</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadJson("bankroll.json", state)}
              className="rounded-full border border-brass-500/25 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-cream-dim hover:border-brass-500/60 hover:text-brass-300"
            >
              Exportar
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-full border border-brass-500/25 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-cream-dim hover:border-brass-500/60 hover:text-brass-300"
            >
              Importar
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importJson(file);
                event.target.value = "";
              }}
            />
            {state.sessions.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("¿Borrar todas las sesiones y el bankroll guardado?")) reset();
                }}
                className="rounded-full border border-brass-500/20 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-cream-faint hover:border-suit-red/50 hover:text-suit-red"
              >
                Borrar todo
              </button>
            )}
          </div>
        </div>

        {state.sessions.length === 0 ? (
          <p className="mt-6 text-sm text-cream-faint">
            Todavía no hay sesiones. Empieza por la última que jugaste.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-lg border border-brass-500/15">
            <table className="w-full border-collapse text-left font-mono text-[12px]">
              <thead>
                <tr>
                  {["Fecha", "Formato", "Nivel", "Horas", "Manos", "Resultado", ""].map((head) => (
                    <th
                      key={head}
                      className="border-b border-brass-500/25 bg-felt-850/80 px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.14em] text-brass-300"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...state.sessions]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((session) => {
                    const profit = sessionProfit(session);
                    return (
                      <tr key={session.id}>
                        <td className="border-b border-brass-500/10 px-4 py-2.5 text-cream-dim">
                          {session.date}
                        </td>
                        <td className="border-b border-brass-500/10 px-4 py-2.5 text-cream-faint">
                          {BANKROLL_RULES[session.format].label}
                        </td>
                        <td className="border-b border-brass-500/10 px-4 py-2.5 text-cream-dim">
                          {session.stakes}
                        </td>
                        <td className="border-b border-brass-500/10 px-4 py-2.5 text-cream-faint">
                          {session.hours}
                        </td>
                        <td className="border-b border-brass-500/10 px-4 py-2.5 text-cream-faint">
                          {session.hands}
                        </td>
                        <td
                          className={`border-b border-brass-500/10 px-4 py-2.5 ${
                            profit >= 0 ? "text-action-call" : "text-suit-red"
                          }`}
                        >
                          {money(profit)}
                        </td>
                        <td className="border-b border-brass-500/10 px-4 py-2.5">
                          <button
                            type="button"
                            onClick={() => removeSession(session.id)}
                            aria-label="Borrar sesión"
                            className="text-cream-faint transition-colors hover:text-suit-red"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-6 text-xs leading-relaxed text-cream-faint">
          Todo esto vive solo en tu navegador. Exporta el JSON de vez en cuando si no quieres
          perderlo al limpiar el historial o cambiar de equipo.
        </p>
      </section>
    </ToolShell>
  );
}

const inputClass =
  "mt-1.5 w-full rounded-lg border border-brass-500/20 bg-felt-900 px-3 py-2 font-mono text-sm text-cream focus:border-brass-400 focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream-faint">
        {label}
      </span>
      {children}
    </label>
  );
}
