// =============================================================
// PilotResto — Types TypeScript (miroir exact du schéma SQL)
// =============================================================

// ── Enums ─────────────────────────────────────────────────────

export type UserRole = 'owner' | 'manager' | 'staff'
export type ProductUnit = 'kg' | 'g' | 'L' | 'cl' | 'piece' | 'boite' | 'carton'
export type SaleSource = 'pos' | 'manual' | 'import'
export type StockMovementType = 'in' | 'out' | 'adjust' | 'sale'
export type PosType = 'lightspeed' | 'tiller' | 'zelty' | 'csv'
export type EmployeeRole = 'cuisinier' | 'serveur' | 'barman' | 'plongeur' | 'manager' | 'autre'
export type ContractType = 'CDI' | 'CDD' | 'extra' | 'apprenti'
export type ShiftStatus = 'planned' | 'confirmed' | 'done' | 'absent'
export type InvoiceStatus = 'pending' | 'validated' | 'paid'
export type SubscriptionPlan = 'starter' | 'pro' | 'multi'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing'

// ── Tables ────────────────────────────────────────────────────

export type Restaurant = {
  id: string
  name: string
  siret: string | null
  address: string | null
  timezone: string
  plan_id: string
  stripe_customer_id: string | null
  created_at: string
  updated_at: string
}

export type Profile = {
  id: string
  restaurant_id: string | null
  role: UserRole
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  created_at: string
}

export type Product = {
  id: string
  restaurant_id: string
  name: string
  unit: ProductUnit
  buy_price: number
  stock_qty: number
  min_threshold: number
  supplier_name: string | null
  category: string | null
  created_at: string
  updated_at: string
}

export type Recipe = {
  id: string
  restaurant_id: string
  dish_name: string
  sell_price: number
  category: string | null
  is_active: boolean
  created_at: string
}


export type RecipeIngredient = {
  id: string
  recipe_id: string
  product_id: string
  quantity: number
}

export type Sale = {
  id: string
  restaurant_id: string
  date: string
  total_revenue: number
  covers: number
  source: SaleSource
  pos_reference: string | null
  created_at: string
}

export type SaleItem = {
  id:            string
  sale_id:       string
  restaurant_id: string
  recipe_id:     string | null
  dish_name:     string
  quantity_sold: number
  unit_price:    number
}

export type StockMovement = {
  id: string
  restaurant_id: string
  product_id: string
  type: StockMovementType
  quantity: number
  note: string | null
  created_by: string | null
  created_at: string
}

export type Employee = {
  id: string
  restaurant_id: string
  first_name: string
  last_name: string
  role: EmployeeRole
  contract_type: ContractType
  hourly_rate: number
  weekly_hours: number
  color: string
  is_active: boolean
  created_at: string
}

export type Shift = {
  id: string
  restaurant_id: string
  employee_id: string
  start_time: string
  end_time: string
  position: string | null
  status: ShiftStatus
  note: string | null
  created_at: string
}

export type TimeLog = {
  id: string
  shift_id: string | null
  employee_id: string
  restaurant_id: string
  clock_in: string | null
  clock_out: string | null
  created_at: string
}

export type Invoice = {
  id: string
  restaurant_id: string
  supplier_name: string | null
  amount: number
  vat_amount: number
  invoice_date: string | null
  due_date: string | null
  file_url: string | null
  status: InvoiceStatus
  ocr_raw_text: string | null
  created_at: string
}

export type PosIntegration = {
  id:               string
  restaurant_id:    string
  pos_type:         PosType
  access_token:     string | null
  refresh_token:    string | null
  token_expires_at: string | null
  api_key:          string | null
  is_active:        boolean
  last_synced_at:   string | null
  sync_error:       string | null
  created_at:       string
  updated_at:       string
}

export type Subscription = {
  id: string
  restaurant_id: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  plan: SubscriptionPlan
  status: SubscriptionStatus
  current_period_end: string | null
  has_payment_method: boolean | null
  created_at: string
  updated_at: string
}

// ── Types étendus (jointures fréquentes) ──────────────────────

export type RecipeWithIngredients = Recipe & {
  recipe_ingredients: (RecipeIngredient & { product: Product })[]
}

export type SaleWithItems = Sale & {
  sale_items: SaleItem[]
}

export type ShiftWithEmployee = Shift & {
  employee: Pick<Employee, 'id' | 'first_name' | 'last_name' | 'role' | 'color'>
}

export type StockMovementWithProduct = StockMovement & {
  product: Pick<Product, 'id' | 'name' | 'unit'>
}

export type EmployeeWithShifts = Employee & {
  shifts: Shift[]
}

// ── Type Supabase Database (pour le client typé) ──────────────
// Structure attendue par @supabase/supabase-js (GenericSchema) :
// chaque table DOIT avoir Relationships, et le schéma public DOIT
// avoir Views, Enums, CompositeTypes — sinon les types d'insert
// résolvent en `never`.
//
// Conseil production : utiliser `supabase gen types typescript`
// pour des types auto-générés depuis le schéma réel.

/** Relationships vides (pas de FK déclarées côté client) */
type R = []

/**
 * Transforme un type Row en type Insert :
 * - Les champs `T | null` deviennent optionnels (valeur nullable = omissible)
 * - Les autres restent requis
 * Cela reflète le comportement SQL INSERT où les colonnes nullable peuvent
 * être omises (Postgres les met à NULL) et les colonnes avec DEFAULT
 * peuvent l'être aussi (approximation — voir note ci-dessus).
 */
type ToInsert<T> = {
  [K in keyof T as null extends T[K] ? K : never]?: T[K]
} & {
  [K in keyof T as null extends T[K] ? never : K]: T[K]
}

/**
 * Rend optionnels les champs qui ont une valeur DEFAULT côté DB mais
 * dont le type TypeScript est non-nullable (ex: timezone, plan_id…).
 * Usage : `WithDefaults<Type, 'timezone' | 'plan_id'>`.
 */
type WithDefaults<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// ── Insert types précis pour chaque table ─────────────────────

type RestaurantInsert = WithDefaults<
  ToInsert<Omit<Restaurant, 'id' | 'created_at' | 'updated_at'>>,
  'timezone' | 'plan_id'
>

type ProfileInsert = ToInsert<Omit<Profile, 'created_at'>>

type ProductInsert = WithDefaults<
  ToInsert<Omit<Product, 'id' | 'created_at' | 'updated_at'>>,
  'unit' | 'buy_price' | 'stock_qty' | 'min_threshold'
>

type RecipeInsert = WithDefaults<
  ToInsert<Omit<Recipe, 'id' | 'created_at'>>,
  'sell_price' | 'is_active'
>

type SaleInsert = WithDefaults<
  ToInsert<Omit<Sale, 'id' | 'created_at'>>,
  'total_revenue' | 'covers' | 'source'
>

type SaleItemInsert = WithDefaults<
  ToInsert<Omit<SaleItem, 'id'>>,
  'quantity_sold' | 'unit_price'
>

type StockMovementInsert = ToInsert<Omit<StockMovement, 'id' | 'created_at'>>

type EmployeeInsert = WithDefaults<
  ToInsert<Omit<Employee, 'id' | 'created_at'>>,
  'role' | 'contract_type' | 'hourly_rate' | 'weekly_hours' | 'color' | 'is_active'
>

type ShiftInsert = WithDefaults<
  ToInsert<Omit<Shift, 'id' | 'created_at'>>,
  'status'
>

type TimeLogInsert = ToInsert<Omit<TimeLog, 'id' | 'created_at'>>

type InvoiceInsert = WithDefaults<
  ToInsert<Omit<Invoice, 'id' | 'created_at'>>,
  'amount' | 'vat_amount' | 'status'
>

type SubscriptionInsert = WithDefaults<
  ToInsert<Omit<Subscription, 'id' | 'created_at'>>,
  'plan' | 'status' | 'updated_at'
>

type PosIntegrationInsert = WithDefaults<
  ToInsert<Omit<PosIntegration, 'id' | 'created_at'>>,
  'is_active' | 'updated_at'
>


export type Database = {
  public: {
    Tables: {
      restaurants: {
        Row: Restaurant
        Insert: RestaurantInsert
        Update: Partial<Omit<Restaurant, 'id'>>
        Relationships: R
      }
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: Partial<Omit<Profile, 'id'>>
        Relationships: R
      }
      products: {
        Row: Product
        Insert: ProductInsert
        Update: Partial<Omit<Product, 'id'>>
        Relationships: R
      }
      recipes: {
        Row: Recipe
        Insert: RecipeInsert
        Update: Partial<Omit<Recipe, 'id'>>
        Relationships: R
      }
      recipe_ingredients: {
        Row: RecipeIngredient
        Insert: Omit<RecipeIngredient, 'id'>
        Update: Partial<Omit<RecipeIngredient, 'id'>>
        Relationships: R
      }
      sales: {
        Row: Sale
        Insert: SaleInsert
        Update: Partial<Omit<Sale, 'id'>>
        Relationships: R
      }
      sale_items: {
        Row: SaleItem
        Insert: SaleItemInsert
        Update: Partial<Omit<SaleItem, 'id'>>
        Relationships: R
      }
      stock_movements: {
        Row: StockMovement
        Insert: StockMovementInsert
        Update: Partial<Omit<StockMovement, 'id'>>
        Relationships: R
      }
      employees: {
        Row: Employee
        Insert: EmployeeInsert
        Update: Partial<Omit<Employee, 'id'>>
        Relationships: R
      }
      shifts: {
        Row: Shift
        Insert: ShiftInsert
        Update: Partial<Omit<Shift, 'id'>>
        Relationships: R
      }
      time_logs: {
        Row: TimeLog
        Insert: TimeLogInsert
        Update: Partial<Omit<TimeLog, 'id'>>
        Relationships: R
      }
      invoices: {
        Row: Invoice
        Insert: InvoiceInsert
        Update: Partial<Omit<Invoice, 'id'>>
        Relationships: R
      }
      subscriptions: {
        Row: Subscription
        Insert: SubscriptionInsert
        Update: Partial<Omit<Subscription, 'id'>>
        Relationships: R
      }
      pos_integrations: {
        Row: PosIntegration
        Insert: PosIntegrationInsert
        Update: Partial<Omit<PosIntegration, 'id'>>
        Relationships: R
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      get_user_restaurant_id: { Args: Record<never, never>; Returns: string }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
