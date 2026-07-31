import { getReport, parseCountsReport, parseMatrixReport, REPORTS } from './reports';

describe('getReport', () => {
  it('finds a report by numeric or string id', () => {
    expect(getReport(1)?.id).toBe(1);
    expect(getReport('2')?.id).toBe(2);
  });

  it('returns undefined for an unknown id', () => {
    expect(getReport(999)).toBeUndefined();
  });

  it('every report has both language titles', () => {
    for (const report of REPORTS) {
      expect(report.title.ka).toBeTruthy();
      expect(report.title.en).toBeTruthy();
    }
  });
});

describe('parseCountsReport', () => {
  const report = getReport(2)!; // legal forms — nameColumn Legal_Form, codeColumn ID

  it('uses the totals row for percentages and excludes it from items', () => {
    const rows = [
      { data_type: 'totals', ID: null, Legal_Form: null, Registered_Qty: 100, Active_Qty: 40 },
      { data_type: 'detail', ID: 1, Legal_Form: 'შპს', Registered_Qty: 75, Active_Qty: 30 },
      { data_type: 'detail', ID: 30, Legal_Form: 'ინდ. მეწარმე', Registered_Qty: 25, Active_Qty: 10 },
    ];
    const parsed = parseCountsReport(rows, report);

    expect(parsed.items).toHaveLength(2);
    expect(parsed.totalReg).toBe(100);
    expect(parsed.totalAct).toBe(40);
    expect(parsed.items[0]).toMatchObject({ code: '1', name: 'შპს', reg: 75, act: 30 });
    // 75/100 = 75%, 30/40 = 75%
    expect(parsed.items[0].regP).toBe('75.0%');
    expect(parsed.items[0].actP).toBe('75.0%');
  });

  it('falls back to summing rows when no totals row is present', () => {
    const rows = [
      { ID: 1, Legal_Form: 'A', Registered_Qty: 60, Active_Qty: 20 },
      { ID: 2, Legal_Form: 'B', Registered_Qty: 40, Active_Qty: 30 },
    ];
    const parsed = parseCountsReport(rows, report);
    expect(parsed.totalReg).toBe(100);
    expect(parsed.totalAct).toBe(50);
    expect(parsed.items[1].regP).toBe('40.0%'); // 40/100
  });

  it('prefers server-provided percentages when present', () => {
    const report1 = getReport(1)!;
    const rows = [
      { Activity_Code: 'G', Activity_Name: 'Trade', Registered_Qty: 10, Active_Qty: 5, pct: 19.6, pct_act: 26.7 },
    ];
    const parsed = parseCountsReport(rows, report1);
    expect(parsed.items[0].regP).toBe('19.6%');
    expect(parsed.items[0].actP).toBe('26.7%');
  });
});

describe('parseMatrixReport', () => {
  it('splits the first string column as the label and keeps the rest as columns', () => {
    const rows = [
      { Legal_Form: 'შპს', '2012': 100, '2013': 200 },
      { Legal_Form: 'სს', '2012': 5, '2013': 7 },
    ];
    const parsed = parseMatrixReport(rows);
    expect(parsed.columns).toEqual(['2012', '2013']);
    expect(parsed.items).toEqual([
      { label: 'შპს', values: [100, 200] },
      { label: 'სს', values: [5, 7] },
    ]);
  });

  it('returns empty structure for no rows', () => {
    expect(parseMatrixReport([])).toEqual({ columns: [], items: [] });
  });
});

describe('parseCountsReport — embedded grand total (report 1)', () => {
  const report1 = getReport(1)!; // NACE — nameColumn Activity_Name, codeColumn Activity_Code

  const total = (name: string) => ({
    Activity_Code: null,
    Activity_Name: name,
    Registered_Qty: 1133623,
    pct: 100,
    Active_Qty: 280811,
    pct_act: 100,
  });
  const detail = {
    Activity_Code: 'A',
    Activity_Name: 'სოფლის მეურნეობა',
    Registered_Qty: 12031,
    pct: 1.061287570912,
    Active_Qty: 3431,
    pct_act: 1.2,
  };

  it.each([['სულ'], ['TOTAL']])('lifts the codeless 100%% row (%s) out of the list', (label) => {
    const parsed = parseCountsReport([total(label), detail], report1);

    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0].code).toBe('A');
    // Not 2 267 246 — the total row must not be summed in as a category.
    expect(parsed.totalReg).toBe(1133623);
    expect(parsed.totalAct).toBe(280811);
  });

  it('rounds server percentages to one decimal', () => {
    const parsed = parseCountsReport([total('სულ'), detail], report1);
    expect(parsed.items[0].regP).toBe('1.1%');
    expect(parsed.items[0].actP).toBe('1.2%');
  });

  it('keeps every row when no grand total is present (reports 3–5)', () => {
    const report4 = getReport(4)!;
    const rows = [
      { Location_Code: '15', Location_Name: 'აჭარა', Registered_Qty: 114568, Active_Qty: 32604 },
      { Location_Code: '26', Location_Name: 'იმერეთი', Registered_Qty: 133029, Active_Qty: 29837 },
    ];
    const parsed = parseCountsReport(rows, report4);
    expect(parsed.items).toHaveLength(2);
    expect(parsed.totalReg).toBe(247597);
  });
});
