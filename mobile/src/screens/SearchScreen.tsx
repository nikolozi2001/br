import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '../components/Icon';
import PickerSheet from '../components/PickerSheet';
import ScreenHeader, { FlagChip } from '../components/ScreenHeader';
import { SelectField, Segmented, TextField } from '../components/Field';
import { Card, RoundButton, SectionLabel, Toggle } from '../components/primitives';
import useLookups from '../hooks/useLookups';
import { getStrings } from '../i18n/strings';
import { isWholeGroup, municipalitiesIn, pickedByValue, summarise, togglePicked } from '../utils/pickers';
import { useAppStore } from '../state/AppStore';
import { useSearch } from '../state/SearchStore';
import { useTheme } from '../theme/ThemeProvider';
import type { PickerAction } from '../components/PickerSheet';
import type { HomeScreenProps } from '../navigation/types';
import type { Option, PickerKey } from '../types';

/**
 * Legal-form IDs that count as business entities, mirroring the web form
 * (frontend/src/components/BasicInfoSection.jsx): შპს(1), სს(2), სპს(3),
 * კს(4), კოოპერატივი(5), იმ(30), უცხოური საწარმოს ფილიალი(39).
 */
const BUSINESS_LEGAL_FORM_IDS = ['1', '2', '3', '4', '5', '30', '39'];

export default function SearchScreen({ navigation }: HomeScreenProps<'Search'>) {
  const { colors, fonts, fs, lang, radius, shadow, update } = useTheme();
  const t = getStrings(lang);
  const insets = useSafeAreaInsets();
  const { favouriteCount, recent, clearRecent } = useAppStore();
  const { form, patchForm, resetForm, runSearch, runSearchWith } = useSearch();
  const regionCodes = useMemo(
    () => form.region.map((r) => r.code?.trim() ?? '').filter(Boolean),
    [form.region],
  );
  const lookups = useLookups(regionCodes);

  const [picker, setPicker] = useState<PickerKey | null>(null);

  const pickerConfig = useMemo<Record<PickerKey, { title: string; options: Option[] }>>(
    () => ({
      legalForm: { title: t.legalForm, options: lookups.legalForms },
      region: { title: t.region, options: lookups.regions },
      muni: { title: t.municipality, options: lookups.municipalities },
      naceCode: { title: t.activityCode, options: lookups.naceCodes },
      naceName: { title: t.activityName, options: lookups.naceNames },
      ownership: { title: t.ownership, options: lookups.ownership },
      size: { title: t.businessSize, options: lookups.sizes },
    }),
    [lookups, t],
  );

  const businessForms = useMemo(
    () => lookups.legalForms.filter((o) => BUSINESS_LEGAL_FORM_IDS.includes(o.value)),
    [lookups.legalForms],
  );

  const allFormsPicked = isWholeGroup(form.legalForm, lookups.legalForms);
  const businessFormsPicked = isWholeGroup(form.legalForm, businessForms);

  /** Tapping a group row picks the whole group, or clears it when it's already the selection. */
  const pickGroup = (group: Option[], picked: boolean) =>
    patchForm({ legalForm: picked ? [] : group });

  const legalFormActions: PickerAction[] = [
    {
      key: 'all',
      label: t.selectAllEntities,
      active: allFormsPicked,
      onPress: () => pickGroup(lookups.legalForms, allFormsPicked),
    },
    {
      key: 'business',
      label: t.selectBusinessEntities,
      active: businessFormsPicked,
      onPress: () => pickGroup(businessForms, businessFormsPicked),
    },
  ];

  const summary = (picked: Option[]): string | undefined => summarise(picked, t.morePicked);

  /** The legal-form field names the group instead of listing its members. */
  const legalFormSummary = (): string | undefined => {
    if (allFormsPicked) return t.allEntities;
    if (businessFormsPicked) return t.businessEntities;
    return summary(form.legalForm);
  };

  /** Both NACE fields for a set of activity codes. */
  const naceSelection = (values: string[]) => ({
    naceCode: pickedByValue(lookups.naceCodes, values),
    naceName: pickedByValue(lookups.naceNames, values),
  });

  /** Adds or removes one option in a picker field. */
  const toggle = (key: PickerKey, option: Option) => {
    const next = togglePicked(form[key], option);

    if (key === 'region') {
      // Dropping a region drops the municipalities that came with it.
      patchForm({ region: next, muni: municipalitiesIn(form.muni, next) });
      return;
    }
    if (key === 'naceCode' || key === 'naceName') {
      // One activity selection, shown two ways — picking a code fills in its
      // name and the other way round, as on the web form.
      patchForm(naceSelection(next.map((o) => o.value)));
      return;
    }
    patchForm({ [key]: next });
  };

  const submit = () => {
    runSearch();
    navigation.navigate('Results');
  };

  const active = picker ? pickerConfig[picker] : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title={t.searchTitle}
        subtitle={t.searchSubtitle}
        logoHeight={40}
        actions={
          <>
            <RoundButton background="rgba(255,255,255,0.16)" onPress={() => navigation.navigate('Favourites')}>
              <View>
                <Icon name="heart" size={18} color="#fff" />
                {favouriteCount > 0 ? (
                  <View
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -8,
                      minWidth: 17,
                      height: 17,
                      paddingHorizontal: 4,
                      borderRadius: 999,
                      backgroundColor: colors.red,
                      borderWidth: 2,
                      borderColor: colors.brand,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{favouriteCount}</Text>
                  </View>
                ) : null}
              </View>
            </RoundButton>
            <Pressable onPress={() => update({ lang: lang === 'ka' ? 'en' : 'ka' })}>
              <FlagChip lang={lang} />
            </Pressable>
          </>
        }
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 14, paddingBottom: 24 + insets.bottom, gap: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {recent.length > 0 ? (
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 6 }}>
                <SectionLabel style={{ paddingHorizontal: 0 }}>{t.recentSearches}</SectionLabel>
                <Pressable onPress={clearRecent} hitSlop={8}>
                  <Text style={{ fontSize: fs(12), color: colors.faint, fontWeight: '600' }}>{t.clear}</Text>
                </Pressable>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {recent.map((entry, index) => (
                  <Pressable
                    key={`${entry.id}-${entry.name}-${index}`}
                    onPress={() => {
                      runSearchWith({ id: entry.id || '', name: entry.name || '' });
                      navigation.navigate('Results');
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 7,
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.line2,
                      borderRadius: 999,
                      paddingVertical: 7,
                      paddingHorizontal: 13,
                    }}
                  >
                    <Icon name="clock" size={13} color={colors.faint} />
                    <Text style={{ fontSize: fs(13), color: colors.ink, fontWeight: '500' }}>
                      {entry.name || entry.id || t.allSubjects}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {/* Economic subject */}
          <View style={{ gap: 8 }}>
            <SectionLabel>{t.sectionSubject}</SectionLabel>
            <Card style={{ padding: 14, gap: 12 }}>
              <TextField
                label={t.idNumber}
                value={form.id}
                onChangeText={(v) => patchForm({ id: v })}
                keyboardType="number-pad"
              />
              <TextField
                label={t.orgName}
                value={form.name}
                onChangeText={(v) => patchForm({ name: v })}
              />
              <SelectField
                label={t.legalForm}
                value={legalFormSummary()}
                placeholder={t.all}
                onPress={() => setPicker('legalForm')}
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextField
                  style={{ flex: 1 }}
                  label={t.head}
                  value={form.head}
                  onChangeText={(v) => patchForm({ head: v })}
                  placeholder={t.personPlaceholder}
                />
                <TextField
                  style={{ flex: 1 }}
                  label={t.partner}
                  value={form.partner}
                  onChangeText={(v) => patchForm({ partner: v })}
                  placeholder={t.personPlaceholder}
                />
              </View>
            </Card>
          </View>

          {/* Address */}
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 6 }}>
              <SectionLabel style={{ paddingHorizontal: 0 }}>{t.sectionAddress}</SectionLabel>
              <Segmented
                value={form.addrType}
                onChange={(v) => patchForm({ addrType: v })}
                options={[
                  { value: 'jur', label: t.addrLegal },
                  { value: 'fakt', label: t.addrFactual },
                ]}
              />
            </View>
            <Card style={{ padding: 14, gap: 12 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <SelectField
                  style={{ flex: 1 }}
                  compact
                  label={t.region}
                  value={summary(form.region)}
                  placeholder={t.all}
                  onPress={() => setPicker('region')}
                />
                <SelectField
                  style={{ flex: 1 }}
                  compact
                  label={t.municipality}
                  value={summary(form.muni)}
                  placeholder={t.all}
                  onPress={() => setPicker('muni')}
                />
              </View>
              <TextField
                label={t.address}
                value={form.address}
                onChangeText={(v) => patchForm({ address: v })}
                placeholder={t.addressPlaceholder}
              />
            </Card>
          </View>

          {/* NACE */}
          <View style={{ gap: 8 }}>
            <SectionLabel>{t.sectionNace}</SectionLabel>
            <Card style={{ padding: 14, gap: 12 }}>
              <SelectField
                label={t.activityCode}
                value={summary(form.naceCode)}
                placeholder={t.choose}
                onPress={() => setPicker('naceCode')}
              />
              <SelectField
                label={t.activityName}
                value={summary(form.naceName)}
                placeholder={t.choose}
                onPress={() => setPicker('naceName')}
              />
            </Card>
          </View>

          {/* Additional */}
          <View style={{ gap: 8 }}>
            <SectionLabel>{t.sectionExtra}</SectionLabel>
            <Card style={{ padding: 14, gap: 14 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <SelectField
                  style={{ flex: 1 }}
                  compact
                  label={t.ownership}
                  value={summary(form.ownership)}
                  placeholder={t.all}
                  onPress={() => setPicker('ownership')}
                />
                <SelectField
                  style={{ flex: 1 }}
                  compact
                  label={t.businessSize}
                  value={summary(form.size)}
                  placeholder={t.all}
                  onPress={() => setPicker('size')}
                />
              </View>
              <View style={{ height: 1, backgroundColor: colors.line3 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: fs(14), color: colors.ink, fontWeight: '500' }}>{t.onlyActive}</Text>
                <Toggle value={form.activeOnly} onChange={(v) => patchForm({ activeOnly: v })} />
              </View>
            </Card>
          </View>

          {/* Action buttons — scroll with the form rather than a fixed bar */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <Pressable
              onPress={submit}
              style={({ pressed }) => [
                {
                  flex: 1,
                  height: 46,
                  borderRadius: radius.lg,
                  backgroundColor: colors.brand,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
                shadow.cta,
              ]}
            >
              <Icon name="search" size={18} color="#fff" />
              <Text style={{ fontFamily: fonts.heading, fontSize: fs(16), color: '#fff' }}>{t.search}</Text>
            </Pressable>

            <Pressable
              onPress={resetForm}
              style={({ pressed }) => ({
                flex: 1,
                height: 46,
                borderRadius: radius.lg,
                borderWidth: 1.5,
                borderColor: colors.red,
                backgroundColor: colors.card,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
            >
              <Icon name="close" size={17} color={colors.red} width={2.4} />
              <Text style={{ fontFamily: fonts.heading, fontSize: fs(16), color: colors.red }}>{t.clear}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <PickerSheet
        visible={Boolean(picker)}
        title={active?.title ?? ''}
        options={active?.options ?? []}
        selected={picker ? form[picker] : []}
        doneLabel={t.done}
        clearLabel={t.clear}
        selectedLabel={t.selectedCount}
        searchPlaceholder={t.search}
        actions={picker === 'legalForm' ? legalFormActions : undefined}
        onToggle={(option) => {
          if (picker) toggle(picker, option);
        }}
        onClear={() => {
          if (picker === 'region') patchForm({ region: [], muni: [] });
          else if (picker === 'naceCode' || picker === 'naceName') patchForm({ naceCode: [], naceName: [] });
          else if (picker) patchForm({ [picker]: [] });
        }}
        onClose={() => setPicker(null)}
      />
    </View>
  );
}
