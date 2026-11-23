import { router } from 'expo-router';

export function openWikiSpec(id: string) {
  router.push({ pathname: '/wiki-spec', params: { id } });
}

export function openWikiGuide(id: string) {
  router.push({ pathname: '/wiki-guide', params: { id } });
}

export function closeWikiScreen() {
  if (router.canGoBack()) router.back();
  else router.replace('/wiki');
}
