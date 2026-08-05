import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Sentry from '@sentry/react-native';

/**
 * The single place a crash is handed to, so the reporting service is wired in
 * one function rather than scattered through the app.
 *
 * Reporting is off until a DSN is configured — `expo.extra.sentryDsn` in
 * app.json, or EXPO_PUBLIC_SENTRY_DSN in the build environment. Without one the
 * error is logged and nothing leaves the device, which is also what happens in
 * Expo Go: Sentry's native module is not part of that client, so initialising
 * it there would break the only way this project currently runs on an iPhone.
 *
 * To turn it on: create a project at sentry.io, put its DSN in app.json, and
 * build. Add the `@sentry/react-native/expo` plugin's org/project settings if
 * you also want stack traces symbolicated.
 */

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? (Constants.expoConfig?.extra?.sentryDsn as string | undefined);

/**
 * Release builds only. Expo Go has no Sentry native module — initialising it
 * there would break the only way this project currently runs on an iPhone — and
 * a development build's crashes belong in the console, not in the dashboard.
 */
const active = Boolean(DSN) && Constants.executionEnvironment === ExecutionEnvironment.Standalone;

/** Called once at startup. Safe to call when no DSN is set — it does nothing. */
export function initErrorReporting(): void {
  if (!active) return;
  Sentry.init({
    dsn: DSN,
    // Crashes only: no traces, no session replay, nothing about what the user
    // searched for. This is a public register, but the queries are the user's.
    sendDefaultPii: false,
    tracesSampleRate: 0,
  });
}

export interface ErrorContext {
  componentStack?: string;
  /** Where it happened — a screen or action name. */
  scope?: string;
}

export function reportError(error: unknown, context: ErrorContext = {}): void {
  // eslint-disable-next-line no-console
  console.error('[br] unhandled error', context.scope ?? '', error, context.componentStack ?? '');
  if (!active) return;
  Sentry.captureException(error, {
    extra: { componentStack: context.componentStack, scope: context.scope },
  });
}
