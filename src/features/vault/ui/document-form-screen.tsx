import { useLocalSearchParams } from 'expo-router';

import { useDocumentFormViewModel } from '../model/document-form-view-model';
import { DocumentFormView } from './document-form-view';

/** /document-form adds a document; /document-form?id=<documentId> edits one. */
export function DocumentFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <DocumentForm key={id ?? 'new'} documentId={id || undefined} />;
}

function DocumentForm({ documentId }: { documentId: string | undefined }) {
  const viewModel = useDocumentFormViewModel(documentId);
  return <DocumentFormView {...viewModel} />;
}
