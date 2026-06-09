/**
 * POST /api/invoices/scan
 * Reçoit un fichier image en multipart/form-data,
 * l'envoie à GPT-4o Vision et retourne les champs de la facture.
 *
 * Champ FormData : "file" (File — JPEG, PNG, WEBP, GIF)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { OCRResult } from '@/types/comptabilite'

// ── Auth helper ───────────────────────────────────────────────

async function isAuthenticated(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return !!user
}

// ── Prompt OCR ────────────────────────────────────────────────

const OCR_PROMPT = `Tu es un expert en lecture de factures françaises.
Extrait les informations de cette facture fournisseur.
Retourne UNIQUEMENT un objet JSON valide (sans markdown, sans explication) avec ces champs :
{
  "supplier_name": "Nom du fournisseur (string)",
  "invoice_date": "YYYY-MM-DD (string)",
  "amount_ht": 0.00 (number — montant hors taxe),
  "vat_amount": 0.00 (number — montant de la TVA),
  "due_date": "YYYY-MM-DD ou null"
}
Si un champ est illisible ou absent, utilise null ou 0.`

// ── Appel GPT-4o Vision ───────────────────────────────────────

async function callGPT4oVision(
  base64: string,
  mimeType: string
): Promise<OCRResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY non configurée')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type:      'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' },
            },
            {
              type: 'text',
              text: OCR_PROMPT,
            },
          ],
        },
      ],
      max_tokens:  300,
      temperature: 0,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenAI API erreur : ${response.status} — ${err.slice(0, 200)}`)
  }

  const json = await response.json()
  const content: string = json.choices?.[0]?.message?.content ?? ''

  // Nettoyer les éventuels blocs markdown ```json ... ```
  const cleaned = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  const parsed  = JSON.parse(cleaned)

  return {
    supplier_name: parsed.supplier_name ?? '',
    invoice_date:  parsed.invoice_date  ?? '',
    amount_ht:     Number(parsed.amount_ht)  || 0,
    vat_amount:    Number(parsed.vat_amount) || 0,
    due_date:      parsed.due_date ?? null,
  }
}

// ── Route Handler ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Requête multipart invalide' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'Aucun fichier reçu (champ "file" manquant)' }, { status: 400 })
  }

  const mimeType = file.type
  const isPDF    = mimeType === 'application/pdf'

  // Les PDFs ne sont pas supportés par l'API Vision — retourner un formulaire vide
  if (isPDF) {
    const empty: OCRResult = {
      supplier_name: '',
      invoice_date:  '',
      amount_ht:     0,
      vat_amount:    0,
      due_date:      null,
      error:         'PDF détecté — extraction automatique non disponible. Veuillez renseigner les informations manuellement.',
    }
    return NextResponse.json(empty)
  }

  const supported = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!supported.includes(mimeType)) {
    return NextResponse.json(
      { error: `Format non supporté : ${mimeType}. Utilisez JPEG, PNG ou WEBP.` },
      { status: 422 }
    )
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo)' }, { status: 422 })
  }

  try {
    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const result = await callGPT4oVision(base64, mimeType)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur OCR inconnue'
    // Retourner un résultat vide avec le message d'erreur
    const fallback: OCRResult = {
      supplier_name: '',
      invoice_date:  '',
      amount_ht:     0,
      vat_amount:    0,
      due_date:      null,
      error:         `Analyse impossible : ${message}. Veuillez saisir manuellement.`,
    }
    return NextResponse.json(fallback, { status: 200 })  // 200 pour que le client puisse afficher le form
  }
}
