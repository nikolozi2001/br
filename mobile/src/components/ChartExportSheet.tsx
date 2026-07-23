import React from 'react';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';

import type { View } from 'react-native';

import BottomSheet, { SheetRow } from './BottomSheet';
import { getStrings } from '../i18n/strings';
import { useAppStore } from '../state/AppStore';
import { useTheme } from '../theme/ThemeProvider';

/** Rasterises the chart card, copies it into the cache, and opens the share sheet. */
type CaptureRef = React.RefObject<View | null>;

async function captureAndShare(viewRef: CaptureRef, format: 'png' | 'jpg', mimeType: string) {
  const uri = await captureRef(viewRef, { format, quality: 0.95, result: 'tmpfile' });
  const target = new File(Paths.cache, `chart.${format}`);
  if (target.exists) target.delete();
  new File(uri).copy(target);
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(target.uri, { mimeType, UTI: mimeType });
}

/**
 * Export options for a single chart card. Everything is produced from a real
 * snapshot of the rendered card — there is no SVG option because the card is
 * rasterised, not re-serialised.
 */
export interface ChartExportSheetProps {
  visible: boolean;
  onClose: () => void;
  /** The chart card to rasterise; null while no card is selected. */
  viewRef: CaptureRef | null;
}

export default function ChartExportSheet({ visible, onClose, viewRef }: ChartExportSheetProps) {
  const { colors, lang } = useTheme();
  const t = getStrings(lang);
  const { showToast } = useAppStore();

  /** Closes the sheet, then runs `action` with the (guaranteed) capture target. */
  const guard = (message: string, action: (ref: CaptureRef) => Promise<unknown>) => async () => {
    const ref = viewRef;
    onClose();
    if (!ref) return;
    showToast(message);
    try {
      await action(ref);
    } catch (err) {
      showToast((err as Error)?.message || t.networkError);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t.chartExport} cancelLabel={t.cancel}>
      <SheetRow
        icon="printer"
        badgeColor="#475569"
        badgeBg={colors.line}
        title={t.print}
        subtitle={t.airPrint}
        onPress={guard(t.openingPrint, async (ref) => {
          const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'data-uri' });
          await Print.printAsync({ html: `<img src="${uri}" style="width:100%"/>` });
        })}
      />
      <SheetRow
        badge="PNG"
        badgeColor="#15803d"
        badgeBg="#dcfce7"
        title={t.pngImage}
        subtitle=".png"
        onPress={guard(t.preparingPng, (ref) => captureAndShare(ref, 'png', 'image/png'))}
      />
      <SheetRow
        badge="JPG"
        badgeColor="#1d4ed8"
        badgeBg="#dbeafe"
        title={t.jpegImage}
        subtitle=".jpg"
        onPress={guard(t.preparingJpeg, (ref) => captureAndShare(ref, 'jpg', 'image/jpeg'))}
      />
      <SheetRow
        badge="PDF"
        badgeColor="#c81723"
        badgeBg="#fee2e2"
        title={t.pdfDocument}
        subtitle=".pdf"
        divider={false}
        onPress={guard(t.preparingPdf, async (ref) => {
          const dataUri = await captureRef(ref, { format: 'png', quality: 1, result: 'data-uri' });
          const { uri } = await Print.printToFileAsync({ html: `<img src="${dataUri}" style="width:100%"/>` });
          if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
        })}
      />
    </BottomSheet>
  );
}
