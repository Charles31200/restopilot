import { FileText } from "lucide-react";

export type InvoiceRow = {
  id: string;
  number: string | null;
  createdAt: string;
  amount: number;
  currency: string;
  status: string | null;
  hostedUrl: string | null;
  pdfUrl: string | null;
};

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function InvoiceList({ invoices }: { invoices: InvoiceRow[] }) {
  if (invoices.length === 0) {
    return (
      <p className="text-[14px] text-ink-muted">
        Aucune facture pour le moment.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {invoices.map((invoice) => (
        <li key={invoice.id} className="flex items-center justify-between gap-4 py-3.5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-(--radius-sm) bg-canvas-alt text-ink-subtle">
              <FileText size={15} />
            </span>
            <div>
              <p className="text-[14px] font-medium text-ink">
                {invoice.number ?? invoice.id}
              </p>
              <p className="text-[12.5px] text-ink-subtle">
                {new Date(invoice.createdAt).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[14px] font-medium text-ink">
              {formatAmount(invoice.amount, invoice.currency)}
            </span>
            {invoice.pdfUrl && (
              <a
                href={invoice.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-medium text-ink underline decoration-line-strong underline-offset-4 hover:text-blue"
              >
                PDF
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
