import { useState } from "react";
import { api } from "@/lib/api";

/**
 * Fetch a single record by id and hold it as the open state of a detail modal.
 * Replaces the repeated "look up owner/field by id, then open its dialog"
 * handlers on the list pages.
 */
export function useLookupModal<T>(endpoint: string) {
  const [record, setRecord] = useState<T | null>(null);

  const openById = async (id?: string) => {
    if (!id) return;
    const res = await api.list<T>(endpoint, { id });
    if (res.data[0]) setRecord(res.data[0]);
  };

  const close = () => setRecord(null);

  return { record, openById, close };
}
