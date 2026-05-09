const ERROR_MAP = {
  // Auth Errors
  "Invalid login credentials": {
    FR: "Email ou mot de passe incorrect. Vérifie tes informations.",
    EN: "Invalid email or password. Please check your credentials."
  },
  "User already registered": {
    FR: "Cet email est déjà utilisé. Essaie de te connecter plutôt.",
    EN: "This email is already registered. Try signing in instead."
  },
  "Password should be at least 6 characters": {
    FR: "Le mot de passe doit contenir au moins 6 caractères.",
    EN: "Password must be at least 6 characters long."
  },
  "Email not confirmed": {
    FR: "Ton email n'est pas encore confirmé. Vérifie ta boîte de réception.",
    EN: "Your email is not confirmed yet. Please check your inbox."
  },
  "Signup disabled": {
    FR: "Les inscriptions sont temporairement désactivées.",
    EN: "Signups are temporarily disabled."
  },
  "Rate limit exceeded": {
    FR: "Trop de tentatives. Réessaie dans quelques minutes.",
    EN: "Too many attempts. Please try again in a few minutes."
  },
  "Database error saving new user": {
    FR: "Une erreur est survenue lors de la création de ton profil.",
    EN: "An error occurred while creating your profile."
  },
  "User not found": {
    FR: "Aucun utilisateur trouvé avec cet email.",
    EN: "No user found with this email."
  },
  "New password should be different from the old password": {
    FR: "Le nouveau mot de passe doit être différent de l'ancien.",
    EN: "New password must be different from the old one."
  },
  // Default
  "default": {
    FR: "Une erreur inattendue est survenue. Réessaie plus tard.",
    EN: "An unexpected error occurred. Please try again later."
  }
}

/**
 * Traduit un message d'erreur Supabase en un message utilisateur amical.
 * @param {string} errorMessage Le message d'erreur brut de Supabase (err.message)
 * @param {string} lang 'FR' ou 'EN'
 */
export const translateError = (errorMessage, lang = 'FR') => {
  if (!errorMessage) return ERROR_MAP["default"][lang]

  // On cherche une correspondance exacte ou partielle
  const foundKey = Object.keys(ERROR_MAP).find(key => 
    errorMessage.toLowerCase().includes(key.toLowerCase())
  )

  if (foundKey) {
    return ERROR_MAP[foundKey][lang]
  }

  // Si on ne trouve rien, on renvoie une erreur générique propre au lieu du message technique
  console.warn("Unhandled Supabase error:", errorMessage)
  return ERROR_MAP["default"][lang]
}
