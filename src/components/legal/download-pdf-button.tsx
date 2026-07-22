"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Triggers the browser's native print dialog, which every major browser can
 * save as a PDF. This is a real, working interim implementation — swap the
 * onClick for a call to a generated PDF endpoint once one exists, without
 * changing the component's public API.
 */
export function DownloadPdfButton() {
  return (
    <Button
      type="button"
      variant="secondary"
      size="md"
      onClick={() => window.print()}
      className="no-print"
    >
      <Download size={15} />
      Télécharger en PDF
    </Button>
  );
}
