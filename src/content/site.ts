export const site = {
  name: "PilotResto",
  tagline: "Le centre de pilotage intelligent des restaurants.",
  contactEmail: "charles.lecussan@gmail.com",
};

export const nav = [
  { label: "Fonctionnalités", href: "#fonctionnalites" },
  { label: "Produit", href: "#produit" },
  { label: "Tarifs", href: "#tarifs" },
  { label: "FAQ", href: "#faq" },
];

export const problems = [
  {
    title: "Commandes dispersées",
    description:
      "Salle, comptoir, livraison : les commandes arrivent de partout et se perdent entre les carnets, les tablettes et les appels.",
  },
  {
    title: "Manque de visibilité",
    description:
      "Impossible de savoir où en est le restaurant à l'instant T sans appeler la salle ou attendre le rapport de fin de journée.",
  },
  {
    title: "Gestion complexe",
    description:
      "Un outil pour les stocks, un pour le planning, un pour la caisse : chaque process devient une source d'erreurs.",
  },
  {
    title: "Perte de temps",
    description:
      "Ressaisir la même donnée dans trois outils différents, ce n'est pas du temps passé à gérer le restaurant.",
  },
  {
    title: "Performances difficiles à analyser",
    description:
      "Les chiffres existent, mais dispersés dans des exports Excel que personne n'a le temps de croiser.",
  },
] as const;

export const solutions = [
  {
    title: "Gestion des commandes",
    description: "Toutes les commandes centralisées et suivies en temps réel, quel que soit le canal.",
  },
  {
    title: "Gestion de la salle",
    description: "Tables, réservations et occupation pilotées depuis une seule vue claire.",
  },
  {
    title: "Analyse des performances",
    description: "Chiffre d'affaires, marges et indicateurs clés, mis à jour en continu.",
  },
  {
    title: "Gestion des équipes",
    description: "Plannings, rôles et disponibilités organisés sans allers-retours inutiles.",
  },
  {
    title: "Automatisation",
    description: "Les tâches répétitives sont prises en charge, pas ajoutées à la liste du jour.",
  },
  {
    title: "Connexion avec vos outils",
    description: "Caisse, réservation, comptabilité : PilotResto s'intègre à ce que vous utilisez déjà.",
  },
] as const;

export const features = [
  {
    title: "Centralisez votre activité",
    description:
      "Commandes, salle, équipes et fournisseurs réunis dans une seule interface, pensée pour être lue en un coup d'œil pendant le service.",
  },
  {
    title: "Optimisez vos opérations",
    description:
      "Les processus répétitifs sont automatisés pour que votre équipe se concentre sur la salle et la cuisine, pas sur la saisie.",
  },
  {
    title: "Analysez vos performances",
    description:
      "Un tableau de bord clair pour suivre chiffre d'affaires, marges et tendances, et décider avec des données à jour.",
  },
  {
    title: "Connectez vos outils",
    description:
      "PilotResto se branche à votre caisse, vos réservations et votre comptabilité au lieu de vous demander d'en changer.",
  },
] as const;

export const advantages = [
  {
    title: "Gain de temps",
    description: "Moins de ressaisie, moins d'allers-retours entre outils, chaque jour de service.",
  },
  {
    title: "Meilleure organisation",
    description: "Équipes, salle et opérations coordonnées depuis un seul endroit.",
  },
  {
    title: "Vision complète du restaurant",
    description: "Un seul écran pour comprendre où en est l'établissement, à tout moment.",
  },
  {
    title: "Décisions basées sur les données",
    description: "Des chiffres fiables et à jour pour arbitrer, plutôt que des impressions.",
  },
  {
    title: "Solution évolutive",
    description: "D'un établissement unique à plusieurs sites, PilotResto grandit avec vous.",
  },
] as const;

export const partners = [
  "Le Petit Bistrot",
  "Table Ronde",
  "Chez Marcel",
  "La Brasserie du Port",
  "Bistrot Lumière",
  "Maison Verdier",
] as const;

export const trustStats = [
  { value: "1", label: "plateforme", description: "pour remplacer plusieurs outils du quotidien." },
  { value: "100%", label: "temps réel", description: "sur les commandes, la salle et les performances." },
  { value: "0", label: "double saisie", description: "entre vos outils une fois connectés." },
] as const;

export const testimonials = [
  {
    quote:
      "On voit enfin l'activité du restaurant en un coup d'œil, sans attendre le rapport de fin de service.",
    name: "Exemple — restaurant indépendant",
    role: "Bistrot, centre-ville",
  },
  {
    quote:
      "Toutes nos commandes remontent au même endroit. Fini les allers-retours entre la caisse et le carnet de réservation.",
    name: "Exemple — brasserie",
    role: "Brasserie, équipe de 12",
  },
  {
    quote:
      "Les décisions se prennent sur des chiffres à jour, pas sur une impression de fin de mois.",
    name: "Exemple — groupe de restauration",
    role: "3 établissements",
  },
] as const;

export const faqs = [
  {
    question: "Qu'est-ce que PilotResto ?",
    answer:
      "PilotResto est une plateforme SaaS qui centralise le pilotage d'un restaurant : commandes, salle, équipes, performances et outils tiers réunis dans une seule interface.",
  },
  {
    question: "Avec quels outils peut-on connecter PilotResto ?",
    answer:
      "PilotResto est conçu pour se connecter à vos outils existants : systèmes de caisse, plateformes de réservation et solutions de comptabilité. La liste des intégrations s'enrichit en continu.",
  },
  {
    question: "Est-ce adapté aux restaurants indépendants ?",
    answer:
      "Oui. PilotResto est pensé pour un établissement unique dès le départ, et s'adapte tout aussi bien aux groupes qui gèrent plusieurs sites.",
  },
  {
    question: "Comment commencer ?",
    answer:
      "Trois étapes suffisent : vous demandez une démonstration, nous configurons votre établissement avec vous, puis votre équipe est opérationnelle sur la plateforme.",
  },
  {
    question: "Mes données sont-elles en sécurité ?",
    answer:
      "Oui. Vos données sont hébergées en France, chiffrées, et ne sont jamais partagées avec des tiers.",
  },
] as const;

export const pricingPlans = [
  {
    name: "Starter",
    description: "Pour un établissement qui centralise ses premiers outils.",
    features: [
      "1 établissement",
      "Gestion des commandes",
      "Gestion de la salle",
      "Support par email",
    ],
    highlighted: false,
  },
  {
    name: "Professionnel",
    description: "Pour un restaurant qui veut piloter finement son activité.",
    features: [
      "Tout Starter, plus :",
      "Analyse des performances",
      "Automatisation des tâches",
      "Connexions à vos outils",
      "Support prioritaire",
    ],
    highlighted: true,
  },
  {
    name: "Entreprise",
    description: "Pour les groupes de plusieurs établissements.",
    features: [
      "Tout Professionnel, plus :",
      "Multi-établissements",
      "Vue consolidée du groupe",
      "Intégrations sur mesure",
      "Accompagnement dédié",
    ],
    highlighted: false,
  },
] as const;
