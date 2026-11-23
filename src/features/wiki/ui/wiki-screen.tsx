import { useWikiViewModel } from '../model/wiki-view-model';
import { WikiView } from './wiki-view';

export function WikiScreen() {
  const viewModel = useWikiViewModel();
  return <WikiView {...viewModel} />;
}
