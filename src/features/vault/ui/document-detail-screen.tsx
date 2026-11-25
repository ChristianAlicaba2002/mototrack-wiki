import { useLocalSearchParams } from 'expo-router';

import { useDocumentDetailViewModel } from '../model/document-detail-view-model';
import { DocumentDetailView } from './document-detail-view';

/** /document?id=<documentId> */
export function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  // Keyed so opening another document starts from a clean state.
  return <DocumentDetail key={id ?? ''} documentId={id ?? ''} />;
}

function DocumentDetail({ documentId }: { documentId: string }) {
  const viewModel = useDocumentDetailViewModel(documentId);
  return <DocumentDetailView {...viewModel} />;
}
