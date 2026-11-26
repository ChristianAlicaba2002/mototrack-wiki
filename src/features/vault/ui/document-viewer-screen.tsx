import { useLocalSearchParams } from 'expo-router';

import { useDocumentViewerViewModel } from '../model/document-viewer-view-model';
import { DocumentViewerView } from './document-viewer-view';

/** /document-viewer?id=<documentId> */
export function DocumentViewerScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <DocumentViewer key={id ?? ''} documentId={id ?? ''} />;
}

function DocumentViewer({ documentId }: { documentId: string }) {
  const viewModel = useDocumentViewerViewModel(documentId);
  return <DocumentViewerView {...viewModel} />;
}
