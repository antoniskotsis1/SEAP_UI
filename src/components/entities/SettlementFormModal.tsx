import { useState, useEffect } from "react";
import { FiFileText, FiFile, FiDownload } from "react-icons/fi";
import { FiFolder } from "react-icons/fi";
import toast from "react-hot-toast";
import { FormModal } from "@/components/ui/FormModal";
import { ModalTitle } from "@/components/ui/ModalTitle";
import { TextField } from "@/components/ui/TextField";
import { filesApi } from "@/lib/services";
import {
  encodeSettlementComments,
  settlementFileKind,
  settlementFileComment,
  type SettlementGroup,
} from "@/lib/settlements";

interface SettlementFormModalProps {
  open: boolean;
  /** When provided, adds files to that year's settlement; otherwise creates one. */
  settlement?: SettlementGroup | null;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Create/manage a settlement (Εκκαθάριση) — one per year, backed by the Files
 * API. Each file carries its **own** comment. Files are upload-only (no
 * update/delete), so editing an existing year means **adding** more files; the
 * year is fixed once set.
 */
export function SettlementFormModal({
  open,
  settlement,
  onClose,
  onSaved,
}: SettlementFormModalProps) {
  const isEdit = !!settlement;
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [newFiles, setNewFiles] = useState<File[]>([]);
  // One comment per newly-selected file (parallel to `newFiles`).
  const [newComments, setNewComments] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setYear(String(settlement?.year ?? new Date().getFullYear()));
    setNewFiles([]);
    setNewComments([]);
  }, [open, settlement]);

  const onPickFiles = (files: File[]) => {
    setNewFiles(files);
    setNewComments(files.map(() => ""));
  };

  const setCommentAt = (i: number, value: string) =>
    setNewComments((prev) => prev.map((c, idx) => (idx === i ? value : c)));

  const handleSubmit = async () => {
    if (!year.trim()) {
      toast.error("Το έτος είναι υποχρεωτικό");
      return;
    }
    if (newFiles.length === 0) {
      toast.error(
        isEdit
          ? "Προσθέστε τουλάχιστον ένα αρχείο. Τα υπάρχοντα αρχεία δεν τροποποιούνται."
          : "Απαιτείται τουλάχιστον ένα αρχείο",
      );
      return;
    }
    setSaving(true);
    try {
      // Each file uploads with its own comment (multipart, one at a time).
      for (let i = 0; i < newFiles.length; i++) {
        await filesApi.upload(
          newFiles[i]!,
          encodeSettlementComments(Number(year), newComments[i]),
        );
      }
      toast.success(isEdit ? "Η εκκαθάριση ενημερώθηκε" : "Η εκκαθάριση δημιουργήθηκε");
      onSaved();
      onClose();
    } catch {
      toast.error(isEdit ? "Αποτυχία ενημέρωσης" : "Αποτυχία δημιουργίας");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={
        <ModalTitle
          icon={<FiFolder className="h-5 w-5" />}
          title={isEdit ? "Επεξεργασία Εκκαθάρισης" : "Νέα Εκκαθάριση"}
        />
      }
      onSubmit={handleSubmit}
      saving={saving}
      submitLabel={isEdit ? "Αποθήκευση" : "Δημιουργία"}
    >
      <div className="space-y-4">
        <TextField
          label="Έτος"
          isRequired
          isDisabled={isEdit}
          value={year}
          onChange={setYear}
          inputProps={{ type: "number", step: "1" }}
        />

        {/* Existing files — each with its own comment (read-only). */}
        {isEdit && settlement.files.length > 0 && (
          <div>
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Υπάρχοντα αρχεία
            </span>
            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {settlement.files.map((f) => {
                const note = settlementFileComment(f);
                return (
                  <li key={f.id} className="px-3 py-2">
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand-600 hover:underline"
                    >
                      {settlementFileKind(f) === "PDF" ? (
                        <FiFile className="h-4 w-4 shrink-0 text-red-500" />
                      ) : (
                        <FiFileText className="h-4 w-4 shrink-0 text-green-600" />
                      )}
                      <span className="truncate">{f.originalFilename}</span>
                      <FiDownload className="h-3 w-3 shrink-0" />
                    </a>
                    <p className="mt-0.5 pl-6 text-xs text-gray-500">
                      {note || "—"}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Add new files — each with its own comment. */}
        <div>
          <span className="mb-1 block text-sm font-medium text-gray-700">
            {isEdit ? "Προσθήκη αρχείων" : "Αρχεία (Excel / PDF)"}
          </span>
          <input
            type="file"
            multiple
            accept=".xls,.xlsx,.csv,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={(e) => onPickFiles(Array.from(e.target.files ?? []))}
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
          />

          {newFiles.length > 0 && (
            <ul className="mt-3 space-y-3">
              {newFiles.map((f, i) => {
                const isPdf =
                  f.type.includes("pdf") ||
                  f.name.toLowerCase().endsWith(".pdf");
                return (
                <li
                  key={`${f.name}-${i}`}
                  className="rounded-lg border border-gray-200 p-3"
                >
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                    {isPdf ? (
                      <FiFile className="h-4 w-4 shrink-0 text-red-500" />
                    ) : (
                      <FiFileText className="h-4 w-4 shrink-0 text-green-600" />
                    )}
                    <span className="truncate">{f.name}</span>
                  </div>
                  <TextField
                    label="Σχόλιο αρχείου"
                    value={newComments[i] ?? ""}
                    onChange={(v) => setCommentAt(i, v)}
                    placeholder="Προαιρετικό σχόλιο για αυτό το αρχείο…"
                  />
                </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </FormModal>
  );
}
