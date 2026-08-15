/** Toutes les URL de l'application. Aucun chemin n'est écrit en dur ailleurs. */
export const routes = {
  home: "/",
  signIn: "/sign-in",
  signUp: "/sign-up",
  app: "/app",
  note: (noteId: string) => `/app/notes/${noteId}`,
  api: {
    attachmentAccess: (attachmentId: string) => `/api/attachments/${attachmentId}/access`,
    attachmentUploadUrl: "/api/attachments/upload-url",
  },
  manifest: "/manifest.webmanifest",
  serviceWorker: "/sw.js",
} as const;
