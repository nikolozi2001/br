// types/charts.ts
export interface ChartData {
  year: string;
  [key: string]: string | number;
}

export interface RegionalData {
  [region: string]: number;
}

export interface ActivityData {
  [activity: string]: number;
}

export interface ChartState {
  organizationsByYear: ChartData[];
  activityData: ChartData[];
  activityDataDeath: ChartData[];
  regionalData: RegionalData[];
  regionalDataDeath: RegionalData[];
  sectorData: ChartData[];
  sectorDataDeath: ChartData[];
  survivalData: ChartData[];
  distributionData: any[];
  distributionDataDeath: any[];
}

export interface ChartProps {
  isEnglish: boolean;
}

export interface LegendItem {
  name: string;
  dataKey: string;
  color: string;
}

export interface EChartsOption {
  tooltip?: any;
  legend?: any;
  grid?: any;
  xAxis?: any;
  yAxis?: any;
  series?: any[];
}

export type ChartType = 'bar' | 'line' | 'stacked-line' | 'stacked-bar';
