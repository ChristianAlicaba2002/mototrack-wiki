import { router } from 'expo-router';

export function openDocument(documentId: string) {
  router.push({ pathname: '/document', params: { id: documentId } });
}

/** The document's photo, full screen with zoom. */
export function openDocumentViewer(documentId: string) {
  router.push({ pathname: '/document-viewer', params: { id: documentId } });
}

/** Add a document (no id) or edit one. */
export function openDocumentForm(documentId?: string) {
  router.push(documentId ? { pathname: '/document-form', params: { id: documentId } } : '/document-form');
}

/** Back to where the user came from, or the vault if the screen was opened directly. */
export function closeVaultScreen() {
  if (router.canGoBack()) router.back();
  else router.replace('/vault');
}
