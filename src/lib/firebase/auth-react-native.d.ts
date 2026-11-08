// `firebase/auth` lists a top-level "types" entry before its "react-native"
// export condition, so TypeScript resolves the web typings, which omit this
// React Native-only export. Metro still bundles the RN build at runtime.
import 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
