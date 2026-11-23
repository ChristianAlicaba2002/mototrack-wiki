import { useHomeViewModel } from '../model/home-view-model';
import { HomeView } from './home-view';

export function HomeScreen() {
  const viewModel = useHomeViewModel();
  return <HomeView {...viewModel} />;
}
