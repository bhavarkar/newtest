"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  Plus,
  Upload,
  Download,
  UserPlus,
  Tag,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Contact } from "@/types";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phone: "", tags: "" });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setContacts(data);
    setLoading(false);
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const tags = newContact.tags.split(",").map((t) => t.trim()).filter(Boolean);

    await supabase.from("contacts").insert({
      name: newContact.name,
      phone: newContact.phone,
      tags,
      opted_in: true,
    });

    setNewContact({ name: "", phone: "", tags: "" });
    setShowAddForm(false);
    fetchContacts();
  };

  const handleExport = () => {
    const csv = [
      "Name,Phone,Tags,Opted In,Last Seen,Created",
      ...contacts.map(
        (c) =>
          `"${c.name}","${c.phone}","${c.tags.join("; ")}",${c.opted_in},${c.last_seen || ""},${c.created_at}`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const filtered = contacts.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(s) ||
      c.phone.includes(s) ||
      c.tags.some((t) => t.toLowerCase().includes(s))
    );
  });

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Contacts</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            {contacts.length} total contacts
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-all"
          >
            <UserPlus className="w-4 h-4" /> Add Contact
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-xl bg-[var(--secondary)] text-[var(--secondary-foreground)] text-sm font-medium flex items-center gap-2 hover:opacity-80 transition-all border border-[var(--border)]"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Add Contact Form */}
      {showAddForm && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 mb-6 animate-[slide-down_0.2s_ease-out]">
          <h3 className="font-semibold text-[var(--foreground)] mb-4">Add New Contact</h3>
          <form onSubmit={handleAddContact} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="text"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              placeholder="Contact name"
              required
              className="px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--input)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            <input
              type="tel"
              value={newContact.phone}
              onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
              placeholder="Phone (+91...)"
              required
              className="px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--input)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            <input
              type="text"
              value={newContact.tags}
              onChange={(e) => setNewContact({ ...newContact, tags: e.target.value })}
              placeholder="Tags (comma-separated)"
              className="px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--input)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            <div className="sm:col-span-3 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, or tag..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
      </div>

      {/* Table */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                <th className="text-left p-4 font-medium text-[var(--muted-foreground)]">Name</th>
                <th className="text-left p-4 font-medium text-[var(--muted-foreground)]">Phone</th>
                <th className="text-left p-4 font-medium text-[var(--muted-foreground)]">Tags</th>
                <th className="text-left p-4 font-medium text-[var(--muted-foreground)]">Opt-in</th>
                <th className="text-left p-4 font-medium text-[var(--muted-foreground)]">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="p-4">
                      <div className="skeleton h-6 rounded" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[var(--muted-foreground)]">
                    No contacts found
                  </td>
                </tr>
              ) : (
                filtered.map((contact) => (
                  <tr key={contact.id} className="hover:bg-[var(--accent)] transition-colors">
                    <td className="p-4 font-medium text-[var(--foreground)]">
                      {contact.name || "Unknown"}
                    </td>
                    <td className="p-4 text-[var(--muted-foreground)]">{contact.phone}</td>
                    <td className="p-4">
                      <div className="flex gap-1 flex-wrap">
                        {contact.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full text-xs bg-[var(--primary)]/10 text-[var(--primary)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          contact.opted_in
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {contact.opted_in ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="p-4 text-[var(--muted-foreground)]">
                      {contact.last_seen ? formatDate(contact.last_seen) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
