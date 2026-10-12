"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { Checkbox, Textarea } from "@/components/ui/field";

interface ReviewBlock {
  title: string;
  lines: string[];
  step: number;
}

interface Props {
  blocks: ReviewBlock[];
  onEdit: (step: number) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  acceptTerms: boolean;
  onAcceptTermsChange: (v: boolean) => void;
  error?: string;
}

export function StepReview({ blocks, onEdit, notes, onNotesChange, acceptTerms, onAcceptTermsChange, error }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <ul className="grid gap-3 sm:grid-cols-2">
        {blocks.map((b) => (
          <li key={b.title} className="rounded-xl border border-border p-4 text-sm">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="font-semibold">{b.title}</h3>
              <button type="button" onClick={() => onEdit(b.step)} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                <Pencil className="size-3" aria-hidden /> Editar
              </button>
            </div>
            {b.lines.filter(Boolean).map((line) => <p key={line} className="text-muted">{line}</p>)}
          </li>
        ))}
      </ul>
      <Textarea label="Notas para el pedido (opcional)" value={notes} onChange={(e) => onNotesChange(e.target.value)} maxLength={500} className="min-h-20" />
      <Checkbox
        checked={acceptTerms}
        onChange={(e) => onAcceptTermsChange(e.target.checked)}
        label={<>Acepto los <Link href="/legales/terminos" target="_blank" className="font-medium text-primary hover:underline">términos y condiciones</Link> y la <Link href="/legales/privacidad" target="_blank" className="font-medium text-primary hover:underline">política de privacidad</Link>.</>}
      />
      {error && <p className="text-sm font-medium text-danger" role="alert">{error}</p>}
    </div>
  );
}
