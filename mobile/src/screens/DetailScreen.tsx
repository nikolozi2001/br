import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

import Icon from '../components/Icon';
import ChartExportSheet from '../components/ChartExportSheet';
import PersonInvolvementSheet from '../components/PersonInvolvementSheet';
import SubjectShareSheet from '../components/SubjectShareSheet';
import { PieChart } from '../components/charts';
import { buildPieSvg } from '../utils/pieSvg';
import { Card, DataRow, EmptyState, HeroGradient, RoundButton, SectionLabel, Skeleton } from '../components/primitives';
import { fetchCoordinates, fetchSubjectDetail, formatDate, formatLongDate, groupPartnerPeriods } from '../api/registry';
import { getStrings } from '../i18n/strings';
import { useAppStore } from '../state/AppStore';
import { useTheme } from '../theme/ThemeProvider';
import type { HomeScreenProps } from '../navigation/types';
import type { PartnerPeriod, PartnerRow, PersonRow, SubjectDetail } from '../types';

interface Coords {
  lat: number;
  lng: number;
}

/** "2015-12" → "12/2015" without Date parsing (avoids month drift across timezones). */
function formatPeriod(value: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(value);
  return m ? `${m[2]}/${m[1]}` : formatDate(value) || value;
}

/** Real map when coordinates are known, otherwise the prototype's stylised placeholder. */
function MapPreview({
  onPress,
  addressLine,
  mapLabel,
  coords,
  name,
}: {
  onPress: () => void;
  addressLine: string;
  mapLabel: string;
  coords: Coords | null;
  name: string;
}) {
  const { colors, fs, radius } = useTheme();

  return (
    <Card style={{ overflow: 'hidden' }} radius={radius.xl}>
      {coords ? (
        <View style={{ height: 170 }}>
          <MapView
            provider={PROVIDER_DEFAULT}
            style={{ flex: 1 }}
            pointerEvents="none"
            initialRegion={{
              latitude: coords.lat,
              longitude: coords.lng,
              latitudeDelta: 0.012,
              longitudeDelta: 0.012,
            }}
          >
            <Marker coordinate={{ latitude: coords.lat, longitude: coords.lng }} title={name} description={addressLine} />
          </MapView>
          <Pressable
            onPress={onPress}
            style={{
              position: 'absolute',
              right: 10,
              bottom: 10,
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderWidth: 1,
              borderColor: colors.line2,
              borderRadius: 8,
              paddingVertical: 6,
              paddingHorizontal: 11,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Icon name="external" size={13} color={colors.brand} />
            <Text style={{ fontSize: fs(12), fontWeight: '600', color: colors.brand }}>{mapLabel}</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={onPress} style={{ height: 150, backgroundColor: colors.mapBg }}>
          <View style={{ position: 'absolute', top: '38%', left: '20%', width: '46%', height: 12, borderRadius: 3, backgroundColor: colors.mapRoad, transform: [{ rotate: '-18deg' }] }} />
          <View style={{ position: 'absolute', top: '60%', left: '8%', width: '70%', height: 12, borderRadius: 3, backgroundColor: colors.mapRoad, transform: [{ rotate: '6deg' }] }} />
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: '44%', width: 14, backgroundColor: colors.tint.blue10 }} />
          <View style={{ position: 'absolute', top: '50%', left: '50%', marginLeft: -15, marginTop: -30, alignItems: 'center' }}>
            <Icon name="pin" size={30} color={colors.red} filled width={1.5} />
          </View>
        </Pressable>
      )}
      <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 15 }}>
        <Icon name="pin" size={17} color={colors.faint} />
        <Text style={{ flex: 1, fontSize: fs(13.5), color: colors.ink, lineHeight: fs(18) }}>{addressLine}</Text>
      </Pressable>
    </Card>
  );
}

/** One partner-share pie for a single reporting period, mirroring the web report. */
interface PartnerPeriodCardProps {
  period: PartnerPeriod;
  title: string;
  onExport: () => void;
  captureRef: React.RefObject<View | null>;
}

function PartnerPeriodCard({ period, title, onExport, captureRef }: PartnerPeriodCardProps) {
  const { colors, fonts, fs, radius } = useTheme();
  return (
    <Card ref={captureRef} collapsable={false} style={{ overflow: 'hidden' }} radius={radius.xl}>
      <HeroGradient>
        <View
          style={{
            paddingVertical: 12,
            paddingHorizontal: 15,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Text style={{ flex: 1, fontFamily: fonts.heading, fontSize: fs(14), color: '#fff' }}>
            {`${title}, ${period.date}`}
          </Text>
          <Pressable
            onPress={onExport}
            hitSlop={8}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.18)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="download" size={17} color="#fff" />
          </Pressable>
        </View>
      </HeroGradient>
      <View
        style={{
          padding: 14,
          backgroundColor: colors.card,
          flexDirection: 'row',
          gap: 16,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <PieChart slices={period.slices} />
        <View style={{ gap: 8, flex: 1, minWidth: 130 }}>
          {period.slices.map((slice) => (
            <View key={slice.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 11, height: 11, borderRadius: 3, backgroundColor: slice.color }} />
              <Text style={{ fontSize: fs(13), color: colors.ink, flex: 1 }} numberOfLines={2}>
                {slice.label}
              </Text>
              <Text style={{ fontSize: fs(13), color: colors.muted, fontWeight: '600' }}>{slice.percent}</Text>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}

/** Flat person / share / date table for the partner details (from `/api/partners-vw`). */
function PartnerDetailsTable({ rows }: { rows: PartnerRow[] }) {
  const { colors, fonts, fs } = useTheme();
  const t = getStrings(useTheme().lang);
  return (
    <Card style={{ overflow: 'hidden' }}>
      <HeroGradient>
        <View style={{ flexDirection: 'row', paddingVertical: 11, paddingHorizontal: 15, gap: 10 }}>
          <Text style={{ flex: 1, fontFamily: fonts.heading, fontSize: fs(12.5), color: '#fff' }}>{t.colPerson}</Text>
          <Text style={{ width: 52, fontFamily: fonts.heading, fontSize: fs(12.5), color: '#fff', textAlign: 'right' }}>
            {t.colShare}
          </Text>
          <Text style={{ width: 66, fontFamily: fonts.heading, fontSize: fs(12.5), color: '#fff', textAlign: 'right' }}>
            {t.colDate}
          </Text>
        </View>
      </HeroGradient>
      {rows.map((r, i) => (
        <View
          key={`${r.person}-${r.date}-${i}`}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingVertical: 12,
            paddingHorizontal: 15,
            borderTopWidth: i === 0 ? 0 : 1,
            borderTopColor: colors.line3,
          }}
        >
          <Text style={{ flex: 1, fontSize: fs(14), color: colors.brand, fontWeight: '600' }}>{r.person}</Text>
          <Text style={{ width: 52, fontSize: fs(14), color: colors.ink, textAlign: 'right' }}>{r.shareValue}</Text>
          <Text style={{ width: 66, fontSize: fs(12), color: colors.faint, textAlign: 'right' }}>
            {formatPeriod(r.date)}
          </Text>
        </View>
      ))}
    </Card>
  );
}

function ListCard({ children }: { children: React.ReactNode }) {
  return <Card style={{ overflow: 'hidden' }}>{children}</Card>;
}

function DetailSkeleton() {
  const { colors, radius } = useTheme();
  return (
    <View style={{ gap: 20 }}>
      {[120, 140].map((w) => (
        <View key={w} style={{ gap: 8 }}>
          <Skeleton width={w} />
          <Card style={{ padding: 15, gap: 13 }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Skeleton width={80} tone="field" />
                <Skeleton width={100} />
              </View>
            ))}
          </Card>
        </View>
      ))}
      <View style={{ height: 150, borderRadius: radius.xl, backgroundColor: colors.line }} />
    </View>
  );
}

export default function DetailScreen({ navigation, route }: HomeScreenProps<'Detail'>) {
  const subject = route.params.subject;
  const { chartColors, colors, fonts, fs, lang } = useTheme();
  const t = getStrings(lang);
  const insets = useSafeAreaInsets();
  const { isFavourite, toggleFavourite, restoreFavourite, showToast } = useAppStore();

  const [detail, setDetail] = useState<SubjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  // Prefer coords from the search row; otherwise resolve them by tax id.
  const [coords, setCoords] = useState<Coords | null>(
    subject.x != null && subject.y != null ? { lat: subject.x, lng: subject.y } : null,
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetchSubjectDetail(subject.statId ?? subject.id, lang)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        if (!cancelled) {
          setDetail(null);
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [subject.statId, subject.id, lang, reloadKey]);

  // The search endpoint omits X/Y unless coord-filtered — resolve them here.
  useEffect(() => {
    if (coords || !subject.code) return;
    let cancelled = false;
    fetchCoordinates(subject.code, lang)
      .then((c) => {
        if (!cancelled && c && Number.isFinite(c.lat) && Number.isFinite(c.lng)) {
          setCoords({ lat: c.lat, lng: c.lng });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject.code, lang]);

  const favourite = isFavourite(subject.id);

  const onToggleFavourite = () => {
    const added = toggleFavourite(subject);
    if (added) {
      showToast(t.favAdded);
    } else {
      showToast(t.favRemoved, () => restoreFavourite(subject), t.undo);
    }
  };

  const openMap = () => {
    if (coords) {
      // Apple Maps on iOS, Google Maps elsewhere — labelled with the subject name.
      const label = encodeURIComponent(subject.name);
      const url =
        Platform.OS === 'ios'
          ? `http://maps.apple.com/?q=${label}&ll=${coords.lat},${coords.lng}`
          : `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
      Linking.openURL(url).catch(() => showToast(t.openingMap));
    } else {
      showToast(t.openingMap);
    }
  };

  const addressLine = [subject.addr, subject.region].filter(Boolean).join(', ');
  const relatedPersons: PersonRow[] =
    detail?.representatives?.length
      ? detail.representatives
      : subject.head
        ? [{ person: subject.head, role: t.director, date: formatDate(subject.regDate) }]
        : [];
  const partnerPeriods = useMemo(
    () => groupPartnerPeriods(detail?.partners ?? [], chartColors.pie),
    [detail?.partners, chartColors],
  );

  // Per-period capture targets, so exporting snapshots the right pie card.
  const [exportPeriod, setExportPeriod] = useState<string | null>(null);
  const periodRefs = useRef<Record<string, React.RefObject<View | null>>>({});
  const periodRefFor = (date: string) => {
    if (!periodRefs.current[date]) periodRefs.current[date] = React.createRef();
    return periodRefs.current[date];
  };
  const exportedPeriod = partnerPeriods.find((p) => p.date === exportPeriod) ?? null;

  // The related person whose involvement history is open, if any.
  const [involvement, setInvolvement] = useState<{ personId: number; name: string } | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <HeroGradient>
        <View
          style={{
            paddingTop: insets.top + 12,
            paddingHorizontal: 16,
            paddingBottom: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <RoundButton icon="back" color="#fff" background="rgba(255,255,255,0.16)" onPress={() => navigation.goBack()} />
          <Text style={{ fontFamily: fonts.heading, fontSize: fs(15), color: 'rgba(255,255,255,0.9)' }}>{t.subject}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <RoundButton
              background={favourite ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.16)'}
              onPress={onToggleFavourite}
            >
              <Icon name="heart" size={18} color={favourite ? colors.red : '#fff'} filled={favourite} />
            </RoundButton>
            <RoundButton icon="share" color={colors.brand} background="#fff" elevated onPress={() => setShareOpen(true)} />
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: 'rgba(255,255,255,0.2)',
                paddingVertical: 3,
                paddingHorizontal: 10,
                borderRadius: 999,
              }}
            >
              <View
                style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: subject.active ? '#7ef5a8' : '#fca5a5' }}
              />
              <Text style={{ color: '#fff', fontSize: fs(11), fontWeight: '600' }}>
                {subject.active ? t.active : t.inactive}
              </Text>
            </View>
            {subject.form ? (
              <View
                style={{
                  backgroundColor: 'rgba(255,255,255,0.16)',
                  paddingVertical: 3,
                  paddingHorizontal: 10,
                  borderRadius: 999,
                }}
              >
                <Text style={{ color: '#fff', fontSize: fs(11), fontWeight: '600' }}>{subject.form}</Text>
              </View>
            ) : null}
          </View>
          <Text style={{ fontFamily: fonts.heading, fontSize: fs(22), color: '#fff', letterSpacing: -0.33, lineHeight: fs(27) }}>
            {subject.name}
          </Text>
          <Text style={{ marginTop: 5, fontSize: fs(13), color: 'rgba(255,255,255,0.8)' }}>
            {t.idLabel} <Text style={{ color: '#fff', fontWeight: '600' }}>{subject.id}</Text>
          </Text>
        </View>
      </HeroGradient>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 110, gap: 20 }}>
        {loading ? (
          <DetailSkeleton />
        ) : (
          <>
            <View style={{ gap: 8 }}>
              <SectionLabel>{t.basicInfo}</SectionLabel>
              <Card style={{ paddingHorizontal: 15, paddingVertical: 2 }}>
                <DataRow label={t.legalCode} value={subject.code} />
                <DataRow label={t.legalFormFull} value={subject.formFull} />
                <DataRow label={t.head} value={subject.head} last />
              </Card>
            </View>

            <View style={{ gap: 8 }}>
              <SectionLabel>{t.legalAddress}</SectionLabel>
              <Card style={{ paddingHorizontal: 15, paddingVertical: 2 }}>
                <DataRow label={t.region} value={subject.region} />
                <DataRow label={t.municipality} value={subject.muni} />
                <DataRow label={t.address} value={subject.addr} last />
              </Card>
            </View>

            <View style={{ gap: 8 }}>
              <SectionLabel>{t.sectionNace}</SectionLabel>
              <Card style={{ paddingHorizontal: 15, paddingVertical: 2 }}>
                <DataRow label={t.activityCode} value={subject.nace} />
                <DataRow label={t.activityName} value={subject.naceName} last />
              </Card>
            </View>

            <View style={{ gap: 8 }}>
              <SectionLabel>{t.contact}</SectionLabel>
              <Card style={{ paddingHorizontal: 15, paddingVertical: 2 }}>
                <DataRow label={t.phone} value={subject.phone} valueColor={colors.brand} />
                <DataRow label={t.email} value={subject.email} valueColor={colors.brand} last />
              </Card>
            </View>

            <View style={{ gap: 8 }}>
              <SectionLabel>{t.sectionExtra}</SectionLabel>
              <Card style={{ paddingHorizontal: 15, paddingVertical: 2 }}>
                <DataRow label={t.ownership} value={subject.ownership} />
                <DataRow label={t.businessSize} value={subject.size} />
                <DataRow label={t.firstRegistration} value={formatLongDate(subject.regDate, lang)} last />
              </Card>
            </View>

            <View style={{ gap: 8 }}>
              <SectionLabel>{t.location}</SectionLabel>
              <MapPreview
                onPress={openMap}
                addressLine={addressLine}
                mapLabel={t.viewOnMap}
                coords={coords}
                name={subject.name}
              />
            </View>

            {relatedPersons.length > 0 ? (
              <View style={{ gap: 8 }}>
                <SectionLabel>{t.relatedPersons}</SectionLabel>
                <ListCard>
                  {relatedPersons.map((p, i) => {
                    const tappable = p.personId != null;
                    return (
                      <Pressable
                        key={`${p.person}-${i}`}
                        disabled={!tappable}
                        onPress={() => setInvolvement({ personId: p.personId!, name: p.person })}
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          padding: 15,
                          borderTopWidth: i === 0 ? 0 : 1,
                          borderTopColor: colors.line3,
                          backgroundColor: pressed && tappable ? colors.line3 : 'transparent',
                        })}
                      >
                        <View style={{ gap: 2, flex: 1 }}>
                          <Text style={{ fontSize: fs(15), color: colors.brand, fontWeight: '600' }}>{p.person}</Text>
                          <Text style={{ fontSize: fs(12), color: colors.muted }}>{p.role}</Text>
                        </View>
                        <Text style={{ fontSize: fs(12), color: colors.faint }}>{p.date}</Text>
                        {tappable ? <Icon name="chevronRight" size={16} color={colors.faint} /> : null}
                      </Pressable>
                    );
                  })}
                </ListCard>
              </View>
            ) : null}

            {partnerPeriods.length > 0 ? (
              <View style={{ gap: 8 }}>
                <SectionLabel>{t.partners}</SectionLabel>
                {partnerPeriods.map((period) => (
                  <PartnerPeriodCard
                    key={period.date}
                    period={period}
                    title={t.partnerShares}
                    captureRef={periodRefFor(period.date)}
                    onExport={() => setExportPeriod(period.date)}
                  />
                ))}
              </View>
            ) : null}

            {detail?.partnersDetail?.length ? (
              <View style={{ gap: 8 }}>
                <SectionLabel>{t.partnerDetails}</SectionLabel>
                <PartnerDetailsTable rows={detail.partnersDetail} />
              </View>
            ) : null}

            {detail?.addressHistory?.length ? (
              <View style={{ gap: 8 }}>
                <SectionLabel>{t.addressHistory}</SectionLabel>
                <ListCard>
                  {detail.addressHistory.map((a, i) => (
                    <View
                      key={`${a.addr}-${i}`}
                      style={{ gap: 3, padding: 15, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.line3 }}
                    >
                      <Text style={{ fontSize: fs(14), color: colors.ink, fontWeight: '500', lineHeight: fs(19) }}>
                        {a.addr}
                      </Text>
                      <Text style={{ fontSize: fs(12), color: colors.muted }}>
                        {[a.region, a.date].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                  ))}
                </ListCard>
              </View>
            ) : null}

            {detail?.nameHistory?.length ? (
              <View style={{ gap: 8 }}>
                <SectionLabel>{t.nameHistory}</SectionLabel>
                <ListCard>
                  {detail.nameHistory.map((n, i) => (
                    <View
                      key={`${n.name}-${i}`}
                      style={{ gap: 3, padding: 15, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.line3 }}
                    >
                      <Text style={{ fontSize: fs(14), color: colors.ink, fontWeight: '500' }}>{n.name}</Text>
                      <Text style={{ fontSize: fs(12), color: colors.muted }}>
                        {[n.form, n.ownership, n.date].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                  ))}
                </ListCard>
              </View>
            ) : null}

            {error ? (
              <EmptyState
                icon="search"
                title={t.networkError}
                body={t.emptyBody}
                actionLabel={t.retry}
                onAction={() => setReloadKey((k) => k + 1)}
              />
            ) : null}
          </>
        )}
      </ScrollView>

      <SubjectShareSheet visible={shareOpen} onClose={() => setShareOpen(false)} subject={subject} />

      <ChartExportSheet
        visible={Boolean(exportPeriod)}
        onClose={() => setExportPeriod(null)}
        viewRef={exportPeriod ? periodRefFor(exportPeriod) : null}
        svg={
          exportedPeriod ? buildPieSvg(exportedPeriod.slices, `${t.partnerShares}, ${exportedPeriod.date}`) : null
        }
      />

      <PersonInvolvementSheet
        visible={Boolean(involvement)}
        onClose={() => setInvolvement(null)}
        personId={involvement?.personId ?? null}
        personName={involvement?.name ?? ''}
      />
    </View>
  );
}
