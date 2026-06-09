/**
 * types.ts — Contrats partagés entre toutes les intégrations POS.
 *
 * Chaque connecteur (Lightspeed, Tiller, Zelty, CSV) doit retourner
 * des objets conformes à POSSale / POSSaleItem, que le moteur de sync
 * convertit ensuite en lignes `sales` + `sale_items` Supabase.
 */

// ── Données normalisées depuis un POS ─────────────────────────

export type POSSaleItem = {
  dish_name:     string
  quantity_sold: number
  unit_price:    number
}

export type POSSale = {
  date:          string          // YYYY-MM-DD
  total_revenue: number
  covers:        number          // nb couverts (0 si inconnu)
  items:         POSSaleItem[]
  pos_reference?: string         // identifiant côté caisse
}

// ── Résultat d'une synchronisation ────────────────────────────

export type SyncResult = {
  success:        boolean
  salesCreated:   number
  itemsProcessed: number
  stockUpdated:   boolean
  errors:         string[]
}

// ── Résultat d'un import CSV ──────────────────────────────────

export type CSVImportResult = {
  imported:  number
  skipped:   number
  errors:    Array<{ row: number; message: string }>
  sales:     POSSale[]
}

// ── Interface commune des connecteurs ─────────────────────────

export interface POSConnector {
  /** Récupère les ventes pour une date donnée (YYYY-MM-DD). */
  getSales(restaurantId: string, date: string): Promise<POSSale[]>
}
