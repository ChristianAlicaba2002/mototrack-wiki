import { useLoginViewModel } from '../model/login-view-model';
import { LoginView } from './login-view';

export function LoginScreen() {
  const viewModel = useLoginViewModel();
  return <LoginView {...viewModel} />;
}
