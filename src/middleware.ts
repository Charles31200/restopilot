// Next.js charge ce fichier comme middleware edge.
// La logique est dans proxy.ts pour garder la séparation des responsabilités.
export { proxy as default, config } from './proxy'
