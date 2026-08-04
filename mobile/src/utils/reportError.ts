/**
 * The single place a crash is handed to, so wiring up a reporting service later
 * is a change in one function rather than a hunt through the app.
 *
 * Nothing is sent anywhere today. Sentry's React Native SDK is not part of Expo
 * Go, and Expo Go is currently the only way this project runs on an iPhone (the
 * App Store client is stuck on SDK 54), so adding it would cost the iOS
 * development loop. Once a development build is working:
 *
 *   npx expo install @sentry/react-native
 *
 * then initialise it in App.tsx and replace the body below with
 * `Sentry.captureException(error, { extra: context })`.
 */

export interface ErrorContext {
  componentStack?: string;
  /** Where it happened — a screen or action name. */
  scope?: string;
}

export function reportError(error: unknown, context: ErrorContext = {}): void {
  // eslint-disable-next-line no-console
  console.error('[br] unhandled error', context.scope ?? '', error, context.componentStack ?? '');
}
