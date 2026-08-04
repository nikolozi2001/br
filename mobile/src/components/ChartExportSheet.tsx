import React from 'react';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { saveMessage, saveToDevice, saveTextToDevice, saveUriToDevice, type SaveResult } from '../utils/save';
import { captureRef } from 'react-native-view-shot';

import type { View } from 'react-native';

import BottomSheet, { SheetRow } from './BottomSheet';
import { getStrings } from '../i18n/strings';
import { useAppStore } from '../state/AppStore';
import { useTheme } from '../theme/ThemeProvider';

type CaptureRef = React.RefObject<View | null>;

/** Rasterises the chart card into the cache under a readable name. */
async function captureToFile(viewRef: CaptureRef, format: 'png' | 'jpg'): Promise<File> {
  const uri = await captureRef(viewRef, { format, quality: 0.95, result: 'tmpfile' });
  const target = new File(Paths.cache, `chart.${format}`);
  if (target.exists) target.delete();
  await new File(uri).copy(target);
  return target;
}

/** Hands the rasterised card to the share sheet, for sending it on. */
async function captureAndShare(viewRef: CaptureRef, format: 'png' | 'jpg', mimeType: string) {
  const target = await captureToFile(viewRef, format);
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
  /**
   * A real (vector) SVG string for the chart. When provided, an SVG row is
   * offered — used by charts whose geometry we can re-serialise (partner pies).
   */
  svg?: string | null;
}



export default function ChartExportSheet({ visible, onClose, viewRef, svg }: ChartExportSheetProps) {
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

  /** Same as `guard`, but reports where the file ended up. */
  const save = (message: string, action: (ref: CaptureRef) => Promise<SaveResult>) =>
    guard(message, async (ref) => showToast(saveMessage(await action(ref), t)));

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
        onPress={save(t.preparingPng, async (ref) => saveToDevice(await captureToFile(ref, 'png'), 'image/png'))}
      />
      <SheetRow
        badge="JPG"
        badgeColor="#1d4ed8"
        badgeBg="#dbeafe"
        title={t.jpegImage}
        subtitle=".jpg"
        onPress={save(t.preparingJpeg, async (ref) => saveToDevice(await captureToFile(ref, 'jpg'), 'image/jpeg'))}
      />
      {svg ? (
        <SheetRow
          badge="SVG"
          badgeColor="#6d28d9"
          badgeBg="#ede9fe"
          title={t.svgImage}
          subtitle=".svg"
          onPress={async () => {
            onClose();
            showToast(t.preparingSvg);
            try {
              showToast(saveMessage(await saveTextToDevice('chart.svg', svg, 'image/svg+xml'), t));
            } catch (err) {
              showToast((err as Error)?.message || t.networkError);
            }
          }}
        />
      ) : null}
      <SheetRow
        badge="PDF"
        badgeColor="#c81723"
        badgeBg="#fee2e2"
        title={t.pdfDocument}
        subtitle=".pdf"
        onPress={save(t.preparingPdf, async (ref) => {
          const dataUri = await captureRef(ref, { format: 'png', quality: 1, result: 'data-uri' });
          const { uri } = await Print.printToFileAsync({ html: `<img src="${dataUri}" style="width:100%"/>` });
          return saveUriToDevice(uri, 'chart.pdf', 'application/pdf');
        })}
      />
      {/* The image rows save to the gallery now, so sharing gets its own row. */}
      <SheetRow
        icon="share"
        badgeColor={colors.brand}
        badgeBg={colors.tint.blue10}
        title={t.shareEllipsis}
        subtitle={t.shareTargets}
        divider={false}
        onPress={guard(t.openingShare, (ref) => captureAndShare(ref, 'png', 'image/png'))}
      />
    </BottomSheet>
  );
}
