# Charts Components

This folder contains modular chart components extracted from the main Charts.jsx file for better maintainability and reusability.

## File Structure

```
charts/
├── index.js                          # Main export file
├── BarChart.jsx                       # Bar chart component
├── StackedLineChart.jsx              # Stacked line chart component
├── StackedBarChart.jsx               # Stacked bar chart component  
├── NormalizedStackedBarChart.jsx     # Normalized stacked bar chart component
├── GroupedBarChart.jsx               # Grouped bar chart component
├── PieChart.jsx                      # Pie chart component
├── ChartContainer.jsx                # Reusable chart container with actions
├── MaximizedChartModal.jsx           # Modal for maximized chart view
├── chartOptions.js                   # ECharts configuration functions
├── chartUtils.js                     # Utility functions for charts
└── README.md                         # This documentation file
```

## Components Overview

### Individual Chart Components
- **BarChart**: Displays birth/death data as bar charts
- **StackedLineChart**: Shows activity trends with pagination for legends
- **StackedBarChart**: Regional distribution data as stacked bars
- **NormalizedStackedBarChart**: Percentage-based sector data
- **GroupedBarChart**: Organization survival data by years
- **PieChart**: Distribution data as pie charts

### Container Components
- **ChartContainer**: Wraps individual charts with common functionality:
  - Download options (PNG, JPEG, PDF, SVG)
  - Print functionality
  - Maximize/minimize
  - Toggle between birth/death data
  - Loading and error states

- **MaximizedChartModal**: Full-screen modal view for charts with enhanced interaction

### Configuration and Utilities
- **chartOptions.js**: Contains all ECharts configuration functions
- **chartUtils.js**: Helper functions for data processing, colors, and formatting

## Usage

Import charts from the main index file:

```jsx
import {
  BarChart,
  StackedLineChart,
  ChartContainer,
  MaximizedChartModal
} from "./charts";
```

Or import individual components:

```jsx
import BarChart from "./charts/BarChart";
import { getBarChartOption } from "./charts/chartOptions";
```

## Benefits of Modularization

1. **Better Maintainability**: Each chart type is in its own file
2. **Reusability**: Components can be reused across different pages
3. **Easier Testing**: Individual components can be tested in isolation
4. **Code Organization**: Related functionality is grouped together
5. **Reduced Bundle Size**: Only needed components are imported
6. **Easier Debugging**: Issues can be traced to specific components

## Common Props

Most chart components accept these common props:

- `data`: Chart data array
- `title`: Chart title string
- `chartIndex`: Unique index for the chart
- `isEnglish`: Language preference boolean
- `chartRefs`: Ref object for chart instances
- `handleMaximizeChart`: Function to maximize chart
- `loading`: Loading state boolean
- `error`: Error state object
- `onToggle`: Function to toggle between data types (birth/death)

## Chart Container Props

The ChartContainer accepts additional props for UI functionality:

- `chartToggleStates`: Object containing toggle states
- `activeDropdown`: Currently active dropdown index
- `toggleDropdown`: Function to toggle dropdown
- `setActiveDropdown`: Function to set active dropdown
- `handlePrintChart`: Function to print chart
- `downloadChartFromECharts`: Function to download chart

## Development Notes

- All charts use ECharts library via echarts-for-react
- Chart options are configured in chartOptions.js for consistency
- Color schemes are defined in chartUtils.js
- Error handling and loading states are built into each component
- Print and download functionality is handled by ChartContainer
