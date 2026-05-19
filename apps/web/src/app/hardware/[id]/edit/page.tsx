"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "@/lib/graphql-client";
import { z } from "zod";

const HARDWARE_DETAIL_QUERY = `
  query($id: String!) {
    hardwareAsset(id: $id) {
      id
      serialNumber
      name
      type
      brand
      model
      lifecycleState
      purchaseDate
      warrantyEndDate
    }
  }
`;

const UPDATE_HARDWARE_MUTATION = `
  mutation(
    $id: String!
    $name: String
    $lifecycleState: String
    $brand: String
    $model: String
    $type: String
  ) {
    updateHardwareAsset(
      id: $id
      name: $name
      lifecycleState: $lifecycleState
      brand: $brand
      model: $model
      type: $type
    ) {
      id
      name
    }
  }
`;

const hardwareEditSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  lifecycleState: z.string().min(1, "Lifecycle state is required"),
});

const hardwareTypes = ["laptop", "desktop", "monitor", "printer", "phone", "tablet", "server", "network_equipment", "other"];
const lifecycleStates = ["active", "in_repair", "in_storage", "decommissioned", "disposed"];

export default function EditHardwarePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["hardwareAsset", id],
    queryFn: () => graphqlRequest(HARDWARE_DETAIL_QUERY, { id }),
    enabled: !!id,
  });

  const hw = data?.hardwareAsset;

  const [form, setForm] = useState({
    name: "",
    type: "laptop",
    brand: "",
    model: "",
    lifecycleState: "active",
  });

  // Sync form with fetched data
  useState(() => {
    if (hw) {
      setForm({
        name: hw.name || "",
        type: hw.type || "laptop",
        brand: hw.brand || "",
        model: hw.model || "",
        lifecycleState: hw.lifecycleState || "active",
      });
    }
  });

  // Update form when data arrives
  if (hw && form.name === "" && hw.name !== "") {
    setForm({
      name: hw.name,
      type: hw.type,
      brand: hw.brand,
      model: hw.model,
      lifecycleState: hw.lifecycleState,
    });
  }

  const mutation = useMutation({
    mutationFn: (variables: any) => graphqlRequest(UPDATE_HARDWARE_MUTATION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hardwareAssets"] });
      queryClient.invalidateQueries({ queryKey: ["hardwareAsset", id] });
      router.push(`/hardware/${id}`);
    },
    onError: (error: any) => {
      setErrors({ form: error.message || "Failed to update hardware asset" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = hardwareEditSchema.safeParse(form);
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
    mutation.mutate({ id, ...result.data });
  };

  if (isLoading) return <div className="py-20 text-center text-[var(--muted-foreground)]">Loading hardware details...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="mb-8 text-3xl font-bold text-[var(--foreground)]">Edit Hardware Asset</h1>
      <p className="mb-4 text-sm text-[var(--muted-foreground)]">Serial Number: {hw?.serialNumber} (read-only)</p>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        {errors.form && (
          <div className="p-3 rounded-md bg-red-50 text-red-800 text-sm">{errors.form}</div>
        )}

        {/* Name */}
        <div>
          <label className="block mb-1 text-sm font-medium text-[var(--foreground)]">Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
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
            />
            {errors.model && <p className="mt-1 text-xs text-[var(--destructive)]">{errors.model}</p>}
          </div>
        </div>

        {/* Lifecycle State */}
        <div>
          <label className="block mb-1 text-sm font-medium text-[var(--foreground)]">Lifecycle State *</label>
          <select
            value={form.lifecycleState}
            onChange={(e) => setForm({ ...form, lifecycleState: e.target.value })}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            {lifecycleStates.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.lifecycleState && <p className="mt-1 text-xs text-[var(--destructive)]">{errors.lifecycleState}</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-lg bg-[var(--primary)] px-6 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 disabled:opacity-50"
          >
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/hardware/${id}`)}
            className="rounded-lg border border-[var(--border)] px-6 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent)]"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}