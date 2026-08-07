import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { reportError } from '../utils/reportError';

/**
 * Catches a render-time crash so the app shows something explicable instead of
 * a white screen, and hands the error to {@link reportError}.
 *
 * "Try again" clears the error and re-renders the tree. That is enough for a
 * transient failure — bad data from one response, a null where one was not
 * expected — and honest about the rest: if it crashes again the screen comes
 * straight back rather than pretending to recover.
 */
interface Props {
  children: React.ReactNode;
  /** Copy is passed in so this stays independent of the i18n dictionary. */
  labels: { title: string; body: string; retry: string };
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    reportError(error, { componentStack: info.componentStack ?? undefined });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const { title, body, retry } = this.props.labels;
    return (
      <View style={{ flex: 1, backgroundColor: '#f4f7fb', justifyContent: 'center', padding: 24 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 22, gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1a1a2e' }}>{title}</Text>
          <Text style={{ fontSize: 14, color: '#64748b' }}>{body}</Text>

          {__DEV__ ? (
            <ScrollView style={{ maxHeight: 160 }}>
              <Text style={{ fontSize: 11, color: '#c81723' }}>{String(error.stack ?? error.message)}</Text>
            </ScrollView>
          ) : null}

          <Pressable
            onPress={() => this.setState({ error: null })}
            style={({ pressed }) => ({
              marginTop: 4,
              height: 46,
              borderRadius: 14,
              backgroundColor: '#0080be',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{retry}</Text>
          </Pressable>
        </View>
      </View>
    );
  }
}
