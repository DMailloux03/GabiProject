'use client';

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { getSupabaseClient } from "@/lib/supabaseClient";

type ExitTicketRecord = {
  id: string;
  mode: string | null;
  student_name: string | null;
  partner_names: string | null;
  understanding: number | null;
  partner_understanding: number | null;
  exit_ticket_response: string | null;
  lingering_questions: string | null;
  created_at: string | null;
};

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};

type SubmitState = { type: "error"; message: string } | null;

const formatDateKey = (value?: string | null) => {
  if (!value) return "";
  return new Date(value).toISOString().split("T")[0];
};

const formatDisplayDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, DATE_FORMAT);

const supabase = getSupabaseClient();

const TeacherPortal = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [tickets, setTickets] = useState<ExitTicketRecord[]>([]);
  const [isFetchingTickets, setIsFetchingTickets] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [authError, setAuthError] = useState<SubmitState>(null);
  const [isMounted, setIsMounted] = useState(false);

  const dateOptions = useMemo(() => {
    const uniqueDays = Array.from(
      new Set(
        tickets
          .map((ticket) => formatDateKey(ticket.created_at))
          .filter(Boolean),
      ),
    ).sort((a, b) => (a > b ? -1 : 1));
    if (selectedDate && !uniqueDays.includes(selectedDate)) {
      uniqueDays.unshift(selectedDate);
    }
    return uniqueDays;
  }, [tickets, selectedDate]);

  const effectiveSelectedDate =
    selectedDate ?? dateOptions[0] ?? new Date().toISOString().split("T")[0];

  const filteredTickets = tickets.filter(
    (ticket) => formatDateKey(ticket.created_at) === effectiveSelectedDate,
  );

  const fetchTickets = async () => {
    try {
      setIsFetchingTickets(true);
      const { data, error } = await supabase
        .from("exit_tickets")
        .select(
          "id, mode, student_name, partner_names, understanding, partner_understanding, exit_ticket_response, lingering_questions, created_at",
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const records = data ?? [];
      setTickets(records);
      if (!selectedDate && records.length) {
        setSelectedDate(formatDateKey(records[0].created_at));
      }
    } catch (error) {
      console.error("Failed to load exit tickets", error);
      setAuthError({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to fetch exit tickets. Please retry.",
      });
    } finally {
      setIsFetchingTickets(false);
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setIsLoading(true);
      setAuthError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      setSession(data.session);
      void fetchTickets();
    } catch (error) {
      console.error("Supabase auth error", error);
      setAuthError({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to log in. Check your credentials and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setTickets([]);
  };

  useEffect(() => {
    setIsMounted(true);
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setSession(data.session);
        await fetchTickets();
      }
    };
    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        void fetchTickets();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (!isMounted) {
    return null;
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <h1 className="text-2xl font-semibold text-slate-900">Teacher Login</h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in with your Supabase teacher credentials to review exit tickets.
          </p>
          <form className="mt-6 space-y-4" onSubmit={handleLogin}>
            <label className="flex flex-col text-sm font-semibold text-slate-700">
              Email
              <input
                type="email"
                className="mt-1 rounded-xl border border-slate-200 px-4 py-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-amber-400"
                value={email}
                onChange={(event) => setEmail(event.target.value.toLowerCase())}
                required
              />
            </label>
            <label className="flex flex-col text-sm font-semibold text-slate-700">
              Password
              <input
                type="password"
                className="mt-1 rounded-xl border border-slate-200 px-4 py-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-amber-400"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-rose-500/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
            {authError && (
              <p className="text-center text-sm text-rose-600">{authError.message}</p>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Teacher dashboard</p>
              <h1 className="text-3xl font-semibold text-slate-900">Exit ticket overview</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-semibold text-slate-600">
                day
                <select
                  className="ml-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
                  value={effectiveSelectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                >
                  {dateOptions.map((date) => (
                    <option key={date} value={date}>
                      {formatDisplayDate(date)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                onClick={fetchTickets}
                disabled={isFetchingTickets}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isFetchingTickets ? "Refreshing..." : "Refresh"}
              </button>
              <button
                onClick={handleLogout}
                className="rounded-xl border border-transparent bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Sign out
              </button>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            {filteredTickets.length} ticket{filteredTickets.length === 1 ? "" : "s"} on {formatDisplayDate(effectiveSelectedDate)}.
          </p>
        </header>

        <div className="overflow-hidden rounded-2xl bg-white shadow">
          <div className="hidden grid-cols-8 bg-slate-100 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500 lg:grid">
            <span>Name</span>
            <span>Mode</span>
            <span>Understanding</span>
            <span>Partner name(s)</span>
            <span>Partner understanding</span>
            <span>Exit ticket</span>
            <span>Questions</span>
            <span>Created</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {filteredTickets.map((ticket) => (
              <li key={ticket.id} className="grid gap-4 px-6 py-4 text-sm text-slate-700 lg:grid-cols-8">
                <div>
                  <p className="font-semibold text-slate-900">{ticket.student_name || "Unknown"}</p>
                  {ticket.partner_names && (
                    <p className="text-xs text-slate-500">Partners: {ticket.partner_names}</p>
                  )}
                </div>
                <div className="capitalize">{ticket.mode || "--"}</div>
                <div>
                  <p className="font-semibold">{ticket.understanding ?? "--"}</p>
                </div>
                <div>{ticket.partner_names ?? "--"}</div>
                <div className="font-semibold">{ticket.partner_understanding ?? "--"}</div>
                <div className="text-slate-600">{ticket.exit_ticket_response ?? "--"}</div>
                <div className="text-slate-600">{ticket.lingering_questions ?? "--"}</div>
                <div className="text-xs text-slate-500">
                  {ticket.created_at
                    ? new Date(ticket.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "--"}
                </div>
              </li>
            ))}
            {filteredTickets.length === 0 && (
              <li className="px-6 py-10 text-center text-sm text-slate-500">
                No tickets for {formatDisplayDate(effectiveSelectedDate)} yet.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TeacherPortal;
