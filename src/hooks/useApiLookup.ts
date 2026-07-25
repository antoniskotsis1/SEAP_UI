import { useCallback, useRef, useState } from "react";

/**
 * Fetch a single record by id from the API and hold it as the open state of a
 * detail modal. The `get`/`adapt` pair fetches the DTO and maps it to the
 * internal model the modal renders.
 */
export function useApiLookup<TDto, TItem>(
  get: (id: string) => Promise<TDto>,
  adapt: (dto: TDto) => TItem
) {
  const [record, setRecord] = useState<TItem | null>(null);
  const getRef = useRef(get);
  getRef.current = get;
  const adaptRef = useRef(adapt);
  adaptRef.current = adapt;

  const openById = useCallback(async (id?: string) => {
    if (!id) return;
    try {
      const dto = await getRef.current(id);
      setRecord(adaptRef.current(dto));
    } catch {
      setRecord(null);
    }
  }, []);

  const close = useCallback(() => setRecord(null), []);

  return { record, openById, close };
}
