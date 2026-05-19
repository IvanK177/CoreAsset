"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "@/lib/graphql-client";
import { z } from "zod";

const CREATE_HARDWARE_MUTATION = `
  mutation(
    $serialNumber: String!
    $name: String!
    $type: String!
    $brand: String!
    $model: String!
    $lifecycleState: String
    $purchaseDate: String
    $warrantyEndDate: String
  ) {
    createHardwareAsset(
      serialNumber: $serialNumber
      name: $name
      type: $type
      brand: $brand
      model: $model
      lifecycleState: $lifecycleState
      purchaseDate: $purchaseDate
      warrantyEndDate: $warrantyEndDate
    ) {
      id
      serialNumber
      name
    }
  }
`;

const hardwareSchema = z.object({
  serialNumber: z.string().min(1, "Serial number is required"),
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  lifecycleState: z.string().default("active"),
  purchaseDate: z.string().optional(),
  warrantyEndDate: z.string().optional(),
});

const hardwareTypes = ["laptop", "desktop", "monitor", "printer", "phone", "tablet", "server", "network_equipment", "other"];
const lifecycleStates = ["active", "in_repair", "in_storage", "decommissioned", "disposed"];

export default function NewHardwarePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    serialNumber: "",
    name: "",
    type: "laptop",
    brand: "",
    model: "",
    lifecycleState: "active",
    purchaseDate: "",
    warrantyEndDate: "",
  });

  const mutation = useMutation({
    mutationFn: (variables: any) => graphqlRequest(CREATE_HARDWARE_MUTATION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hardwareAssets"] });
      router.push("/hardware");
    },
    onError: (error: any) => {
      setErrors({ form: error.message || "Failed to create hardware asset" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = hardwareSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    mutation.mutate(result.data);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="mb-8 text-3xl font-bold text-[var(--foreground)]">Register New Hardware</h1>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        {errors.form && (
          <div className="p-3 rounded-md bg-red-50 text-red-800 text-sm">{errors.form}</div>
        )}

        {/* Serial Number */}
        <div>
          <label className="block mb-1 text-sm font-medium text-[var(--foreground)]">Serial Number *</label>
          <input
            type="text"
            value={form.serialNumber}
            onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            placeholder="SN-00123"
          />
          {errors.serialNumber && <p className="mt-1 text-xs text-[var(--destructive)]">{errors.serialNumber}</p>}
        </div>

        {/* Name */}
        <div>
          <label className="block mb-1 text-sm font-medium text-[var(--foreground)]">Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            placeholder="Dell Latitude 5520"
          />
          {errors.name && <p className="mt-1 text-xs text-[var(--destructive)]">{errors.name}</p>}
        </div>

        {/* Type */}
        <div>
          <label className="block mb-1 text-sm font-medium text-[var(--foreground)]">Type *</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            {hardwareTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {errors.type && <p className="mt-1 text-xs text-[var(--destructive)]">{errors.type}</p>}
        </div>

        {/* Brand & Model */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-[var(--foreground)]">Brand *</label>
            <input
              type="text"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              placeholder="Dell"
            />
            {errors.brand && <p className="mt-1 text-xs text-[var(--destructive)]">{errors.brand}</p>}
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-[var(--foreground)]">Model *</label>
            <input
              type="text"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              placeholder="Latitude 5520"
            />
            {errors.model && <p className="mt-1 text-xs text-[var(--destructive)]">{errors.model}</p>}
          </div>
        </div>

        {/* Lifecycle State */}
        <div>
          <label className="block mb-1 text-sm font-medium text-[var(--foreground)]">Lifecycle State</label>
          <select
            value={form.lifecycleState}
            onChange={(e) => setForm({ ...form, lifecycleState: e.target.value })}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            {lifecycleStates.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Purchase Date & Warranty End */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-[var(--foreground)]">Purchase Date</label>
            <input
              type="date"
              value={form.purchaseDate}
              onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-[var(--foreground)]">Warranty End Date</label>
            <input
              type="date"
              value={form.warrantyEndDate}
              onChange={(e) => setForm({ ...form, warrantyEndDate: e.target.value })}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-lg bg-[var(--primary)] px-6 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 disabled:opacity-50"
          >
            {mutation.isPending ? "Creating..." : "Create Hardware Asset"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/hardware")}
            className="rounded-lg border border-[var(--border)] px-6 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent)]"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}