"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type UserRecord = {
  id: number;
  phone: string;
  firebaseUid: string | null;
  name: string | null;
  email: string | null;
  platform: string | null;
  workerId: string | null;
  type: string | null;
  city: string | null;
  zone: string | null;
  activePlan: string | null;
  isProtected: boolean;
  riskScore: number;
  coveragePerDay: number;
  avgDailyEarning: number;
  createdAt: string;
  updatedAt: string;
};

type UserFormState = {
  phone: string;
  name: string;
  email: string;
  firebaseUid: string;
  platform: string;
  type: string;
  city: string;
  zone: string;
  workerId: string;
  activePlan: string;
  riskScore: string;
  coveragePerDay: string;
  avgDailyEarning: string;
  isProtected: boolean;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:5000";

const INITIAL_FORM: UserFormState = {
  phone: "",
  name: "",
  email: "",
  firebaseUid: "",
  platform: "",
  type: "",
  city: "",
  zone: "",
  workerId: "",
  activePlan: "basic",
  riskScore: "0",
  coveragePerDay: "0",
  avgDailyEarning: "0",
  isProtected: false,
};

function toFormState(user?: UserRecord | null): UserFormState {
  if (!user) return INITIAL_FORM;

  return {
    phone: user.phone || "",
    name: user.name || "",
    email: user.email || "",
    firebaseUid: user.firebaseUid || "",
    platform: user.platform || "",
    type: user.type || "",
    city: user.city || "",
    zone: user.zone || "",
    workerId: user.workerId || "",
    activePlan: user.activePlan || "basic",
    riskScore: String(user.riskScore ?? 0),
    coveragePerDay: String(user.coveragePerDay ?? 0),
    avgDailyEarning: String(user.avgDailyEarning ?? 0),
    isProtected: Boolean(user.isProtected),
  };
}

function parseNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export default function Home() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [form, setForm] = useState<UserFormState>(INITIAL_FORM);

  const endpoint = `${API_BASE}/api/admin/users`;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to fetch users.");
      }

      setUsers(payload.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const visibleUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;

    return users.filter((user) => {
      const haystack = [
        String(user.id),
        user.name || "",
        user.phone || "",
        user.email || "",
        user.platform || "",
        user.city || "",
        user.zone || "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [users, search]);

  function startCreate() {
    setEditingUserId(null);
    setForm(INITIAL_FORM);
    setError(null);
  }

  function startEdit(user: UserRecord) {
    setEditingUserId(user.id);
    setForm(toFormState(user));
    setError(null);
  }

  async function submitUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const body = {
      phone: form.phone,
      name: form.name || null,
      email: form.email || null,
      firebaseUid: form.firebaseUid || null,
      platform: form.platform || null,
      type: form.type || null,
      city: form.city || null,
      zone: form.zone || null,
      workerId: form.workerId || null,
      activePlan: form.activePlan || null,
      riskScore: parseNumber(form.riskScore),
      coveragePerDay: parseNumber(form.coveragePerDay),
      avgDailyEarning: parseNumber(form.avgDailyEarning),
      isProtected: form.isProtected,
    };

    try {
      const url =
        editingUserId === null ? endpoint : `${endpoint}/${editingUserId}`;
      const method = editingUserId === null ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Unable to save user.");
      }

      startCreate();
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save user.");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeUser(id: number) {
    const confirmed = window.confirm(
      "Delete this user? This action will remove profile data as well.",
    );
    if (!confirmed) return;

    setError(null);
    try {
      const response = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Unable to delete user.");
      }

      if (editingUserId === id) {
        startCreate();
      }
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete user.");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:px-8 sm:py-10">
      <section className="gigzo-card relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -top-24 right-0 h-52 w-52 rounded-full bg-[rgba(143,201,200,0.2)]" />
        <div className="pointer-events-none absolute -bottom-20 left-6 h-40 w-40 rounded-full bg-[rgba(122,183,191,0.16)]" />

        <p className="mb-2 inline-flex rounded-full border border-[var(--line)] bg-[var(--surface-alt)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
          GigZo Control Center
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--brand-primary-dark)] sm:text-4xl">
          Admin User Management
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--text-secondary)] sm:text-base">
          View every worker account, update profile details, create new users,
          and remove invalid accounts from one place.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Total users
            </p>
            <p className="mt-1 text-2xl font-bold text-[var(--brand-primary-dark)]">
              {users.length}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Protected users
            </p>
            <p className="mt-1 text-2xl font-bold text-[var(--brand-primary-dark)]">
              {users.filter((u) => u.isProtected).length}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Pro plans
            </p>
            <p className="mt-1 text-2xl font-bold text-[var(--brand-primary-dark)]">
              {users.filter((u) => u.activePlan === "pro").length}
            </p>
          </div>
        </div>
      </section>

      {error ? (
        <section className="gigzo-card border-[var(--brand-danger)] bg-[rgba(220,38,38,0.05)] px-4 py-3 text-sm text-[var(--brand-danger)]">
          {error}
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="gigzo-card p-5 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold text-[var(--brand-primary-dark)]">
              Users
            </h2>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className="gigzo-input sm:w-64"
                placeholder="Search by name, phone, email..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button
                type="button"
                className="gigzo-button gigzo-button-ghost"
                onClick={fetchUsers}
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Location</th>
                  <th className="px-3 py-2">Plan</th>
                  <th className="px-3 py-2">Protected</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-[var(--text-muted)]">
                      Loading users...
                    </td>
                  </tr>
                ) : visibleUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-[var(--text-muted)]">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  visibleUsers.map((user) => (
                    <tr key={user.id} className="border-b border-[var(--line)]/80 align-top">
                      <td className="px-3 py-3">
                        <p className="font-semibold text-[var(--text-primary)]">
                          {user.name || "Unnamed user"}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {user.email || "No email"}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-[var(--text-secondary)]">{user.phone}</td>
                      <td className="px-3 py-3 text-[var(--text-secondary)]">
                        {[user.city, user.zone].filter(Boolean).join(", ") || "-"}
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-[var(--brand-primary-light)] px-2.5 py-1 text-xs font-semibold uppercase text-[var(--brand-primary-dark)]">
                          {user.activePlan || "basic"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            user.isProtected
                              ? "bg-[rgba(22,163,74,0.14)] text-[var(--brand-success)]"
                              : "bg-[var(--surface-alt)] text-[var(--text-muted)]"
                          }`}
                        >
                          {user.isProtected ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="gigzo-button gigzo-button-ghost !px-3 !py-1.5 text-xs"
                            onClick={() => startEdit(user)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="gigzo-button gigzo-button-danger !px-3 !py-1.5 text-xs"
                            onClick={() => removeUser(user.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="gigzo-card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-[var(--brand-primary-dark)]">
              {editingUserId === null ? "Create User" : `Edit User #${editingUserId}`}
            </h2>
            <button
              type="button"
              onClick={startCreate}
              className="gigzo-button gigzo-button-ghost"
            >
              New
            </button>
          </div>

          <form className="space-y-4" onSubmit={submitUser}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="gigzo-label" htmlFor="phone">
                  Phone*
                </label>
                <input
                  id="phone"
                  required
                  className="gigzo-input"
                  value={form.phone}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                />
              </div>

              <div>
                <label className="gigzo-label" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  className="gigzo-input"
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
              </div>

              <div>
                <label className="gigzo-label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="gigzo-input"
                  value={form.email}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                />
              </div>

              <div>
                <label className="gigzo-label" htmlFor="firebaseUid">
                  Firebase UID
                </label>
                <input
                  id="firebaseUid"
                  className="gigzo-input"
                  value={form.firebaseUid}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, firebaseUid: event.target.value }))
                  }
                />
              </div>

              <div>
                <label className="gigzo-label" htmlFor="platform">
                  Platform
                </label>
                <select
                  id="platform"
                  className="gigzo-input"
                  value={form.platform}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, platform: event.target.value }))
                  }
                >
                  <option value="">Select</option>
                  <option value="Zomato">Zomato</option>
                  <option value="Swiggy">Swiggy</option>
                  <option value="Zepto">Zepto</option>
                  <option value="Blinkit">Blinkit</option>
                  <option value="Amazon">Amazon</option>
                </select>
              </div>

              <div>
                <label className="gigzo-label" htmlFor="type">
                  Worker Type
                </label>
                <select
                  id="type"
                  className="gigzo-input"
                  value={form.type}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, type: event.target.value }))
                  }
                >
                  <option value="">Select</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                </select>
              </div>

              <div>
                <label className="gigzo-label" htmlFor="city">
                  City
                </label>
                <input
                  id="city"
                  className="gigzo-input"
                  value={form.city}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, city: event.target.value }))
                  }
                />
              </div>

              <div>
                <label className="gigzo-label" htmlFor="zone">
                  Zone
                </label>
                <input
                  id="zone"
                  className="gigzo-input"
                  value={form.zone}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, zone: event.target.value }))
                  }
                />
              </div>

              <div>
                <label className="gigzo-label" htmlFor="workerId">
                  Worker ID
                </label>
                <input
                  id="workerId"
                  className="gigzo-input"
                  value={form.workerId}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, workerId: event.target.value }))
                  }
                />
              </div>

              <div>
                <label className="gigzo-label" htmlFor="activePlan">
                  Active plan
                </label>
                <select
                  id="activePlan"
                  className="gigzo-input"
                  value={form.activePlan}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, activePlan: event.target.value }))
                  }
                >
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                </select>
              </div>

              <div>
                <label className="gigzo-label" htmlFor="riskScore">
                  Risk score
                </label>
                <input
                  id="riskScore"
                  type="number"
                  className="gigzo-input"
                  value={form.riskScore}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, riskScore: event.target.value }))
                  }
                />
              </div>

              <div>
                <label className="gigzo-label" htmlFor="coveragePerDay">
                  Coverage per day
                </label>
                <input
                  id="coveragePerDay"
                  type="number"
                  className="gigzo-input"
                  value={form.coveragePerDay}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, coveragePerDay: event.target.value }))
                  }
                />
              </div>

              <div>
                <label className="gigzo-label" htmlFor="avgDailyEarning">
                  Avg. daily earning
                </label>
                <input
                  id="avgDailyEarning"
                  type="number"
                  className="gigzo-input"
                  value={form.avgDailyEarning}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, avgDailyEarning: event.target.value }))
                  }
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={form.isProtected}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, isProtected: event.target.checked }))
                }
              />
              Protected user
            </label>

            <button
              className="gigzo-button gigzo-button-primary w-full"
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? "Saving..."
                : editingUserId === null
                  ? "Create User"
                  : "Update User"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
