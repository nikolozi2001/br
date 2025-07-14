import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Menu, Download, Maximize2 } from "lucide-react";
import "../styles/Charts.scss";

const Charts = ({ isEnglish }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setIsFlipped(true);
  }, []);

  // Sample data for charts - replace with real data from your API
  const organizationsByYear = [
    { year: "2014", birth: 27323, death: 29662 },
    { year: "2015", birth: 51984, death: 24061 },
    { year: "2016", birth: 32000, death: 23992 },
    { year: "2017", birth: 30796, death: 24695 },
    { year: "2018", birth: 29458, death: 28790 },
    { year: "2019", birth: 38584, death: 32429 },
    { year: "2020", birth: 29340, death: 27555 },
    { year: "2021", birth: 37760, death: 30653 },
    { year: "2022", birth: 57583, death: 30913 },
    { year: "2023", birth: 55146, death: 29435 },
  ];

  const activityData = [
    {
      year: "2012",
      manufacturing: 8,
      construction: 4,
      retail: 15,
      transport: 3,
      finance: 2,
      other: 10,
    },
    {
      year: "2013",
      manufacturing: 9,
      construction: 5,
      retail: 16,
      transport: 4,
      finance: 3,
      other: 11,
    },
    {
      year: "2014",
      manufacturing: 12,
      construction: 6,
      retail: 18,
      transport: 5,
      finance: 4,
      other: 13,
    },
    {
      year: "2015",
      manufacturing: 14,
      construction: 8,
      retail: 20,
      transport: 6,
      finance: 5,
      other: 15,
    },
    {
      year: "2016",
      manufacturing: 16,
      construction: 9,
      retail: 22,
      transport: 7,
      finance: 6,
      other: 17,
    },
    {
      year: "2017",
      manufacturing: 18,
      construction: 10,
      retail: 24,
      transport: 8,
      finance: 7,
      other: 19,
    },
    {
      year: "2018",
      manufacturing: 20,
      construction: 12,
      retail: 26,
      transport: 9,
      finance: 8,
      other: 21,
    },
    {
      year: "2019",
      manufacturing: 22,
      construction: 14,
      retail: 28,
      transport: 10,
      finance: 9,
      other: 23,
    },
    {
      year: "2020",
      manufacturing: 18,
      construction: 10,
      retail: 24,
      transport: 8,
      finance: 7,
      other: 19,
    },
    {
      year: "2021",
      manufacturing: 25,
      construction: 16,
      retail: 30,
      transport: 12,
      finance: 10,
      other: 25,
    },
    {
      year: "2022",
      manufacturing: 28,
      construction: 18,
      retail: 32,
      transport: 14,
      finance: 12,
      other: 27,
    },
    {
      year: "2023",
      manufacturing: 30,
      construction: 20,
      retail: 35,
      transport: 16,
      finance: 14,
      other: 30,
    },
  ];

  const ownershipData = [
    { name: "კერძო", value: 87, color: "#2563eb" },
    { name: "სახელმწიფო", value: 8, color: "#dc2626" },
    { name: "მუნიციპალური", value: 3, color: "#16a34a" },
    { name: "საერთაშორისო", value: 2, color: "#ca8a04" },
  ];

  const organizationGrowthData = [
    { year: "2014", total: 27328 },
    { year: "2015", total: 32060 },
    { year: "2016", total: 30708 },
    { year: "2017", total: 31211 },
    { year: "2018", total: 38583 },
    { year: "2019", total: 37742 },
    { year: "2020", total: 34298 },
    { year: "2021", total: 55132 },
    { year: "2022", total: 57580 },
    { year: "2023", total: 55132 },
  ];

  const texts = {
    georgian: {
      title: "სტატისტიკური ანგარიშგება",
      organizationsByYear:
        "საწარმოთა დაბადება და გარდაცვალება 2014-2023 წლებში",
      regionalDistribution: "რეგისტრირებული ორგანიზაციები რეგიონების მიხედვით",
      activitySectors: "ორგანიზაციები ეკონომიკური საქმიანობის მიხედვით",
      ownershipTypes: "ორგანიზაციები საკუთრების ფორმების მიხედვით",
      legalForms: "2023 წლის ორგანიზაციები სამართლებრივი ფორმების მიხედვით",
      organizationGrowth: "ორგანიზაციების ზრდის დინამიკა (%)",
      birth: "დაბადება",
      death: "გარდაცვალება",
    },
    english: {
      title: "Statistical Reports",
      organizationsByYear: "Organizations Birth and Death 2014-2023",
      regionalDistribution: "Organizations by Regions",
      activitySectors: "Organizations by Economic Activity",
      ownershipTypes: "Organizations by Ownership Types",
      legalForms: "2023 Organizations by Legal Forms",
      organizationGrowth: "Organization Growth Dynamics (%)",
      birth: "Birth",
      death: "Death",
    },
  };

  const currentTexts = isEnglish ? texts.english : texts.georgian;

  const ChartContainer = ({ title, children, onDownload, onMaximize }) => (
    <div className="chart-container">
      <div className="chart-header">
        <h3 className="chart-title">{title}</h3>
        <div className="chart-actions">
          <button className="chart-action-btn" onClick={onDownload}>
            <Download size={16} />
          </button>
          <button className="chart-action-btn" onClick={onMaximize}>
            <Maximize2 size={16} />
          </button>
          <button className="chart-action-btn">
            <Menu size={16} />
          </button>
        </div>
      </div>
      <div className="chart-content">{children}</div>
    </div>
  );

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="max-w-[1920px] mx-auto px-2 sm:px-6 lg:px-8">
          <div className={`flipper-container ${isFlipped ? "flipped" : ""}`}>
            <div className="flipper">
              <div className="border border-[#0080BE] rounded-[0_5px_5px_5px] bg-[#fafafa] p-4">
                <div className="charts-grid">
                  {/* Bar Chart - Births and Deaths */}
                  <ChartContainer
                    title={currentTexts.organizationsByYear}
                    onDownload={() => console.log("Download chart 1")}
                    onMaximize={() => console.log("Maximize chart 1")}
                  >
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={organizationsByYear}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis 
                          tickFormatter={(value) => value.toLocaleString()}
                        />
                        <Tooltip 
                          formatter={(value, name) => [
                            value.toLocaleString(), 
                            name
                          ]}
                        />
                        <Legend />
                        <Bar
                          dataKey="birth"
                          fill="#2563eb"
                          name={currentTexts.birth}
                        />
                        <Bar
                          dataKey="death"
                          fill="#dc2626"
                          name={currentTexts.death}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>

                  {/* Line Chart - Activity Trends */}
                  <ChartContainer
                    title={currentTexts.activitySectors}
                    onDownload={() => console.log("Download chart 2")}
                    onMaximize={() => console.log("Maximize chart 2")}
                  >
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="manufacturing"
                          stroke="#2563eb"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="construction"
                          stroke="#dc2626"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="retail"
                          stroke="#16a34a"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="transport"
                          stroke="#ca8a04"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="finance"
                          stroke="#7c3aed"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="other"
                          stroke="#db2777"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>

                  {/* Stacked Bar Chart - Regional Distribution */}
                  <ChartContainer
                    title={currentTexts.regionalDistribution}
                    onDownload={() => console.log("Download chart 3")}
                    onMaximize={() => console.log("Maximize chart 3")}
                  >
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={organizationGrowthData}
                        layout="horizontal"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="year" type="category" />
                        <Tooltip />
                        <Bar dataKey="total" fill="#2563eb" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>

                  {/* Stacked Area Chart */}
                  <ChartContainer
                    title={
                      isEnglish
                        ? "Organizations by Legal Forms"
                        : "ორგანიზაციები სამართლებრივი ფორმების მიხედვით"
                    }
                    onDownload={() => console.log("Download chart 4")}
                    onMaximize={() => console.log("Maximize chart 4")}
                  >
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="manufacturing"
                          stackId="1"
                          stroke="#2563eb"
                          fill="#2563eb"
                        />
                        <Area
                          type="monotone"
                          dataKey="construction"
                          stackId="1"
                          stroke="#dc2626"
                          fill="#dc2626"
                        />
                        <Area
                          type="monotone"
                          dataKey="retail"
                          stackId="1"
                          stroke="#16a34a"
                          fill="#16a34a"
                        />
                        <Area
                          type="monotone"
                          dataKey="transport"
                          stackId="1"
                          stroke="#ca8a04"
                          fill="#ca8a04"
                        />
                        <Area
                          type="monotone"
                          dataKey="finance"
                          stackId="1"
                          stroke="#7c3aed"
                          fill="#7c3aed"
                        />
                        <Area
                          type="monotone"
                          dataKey="other"
                          stackId="1"
                          stroke="#db2777"
                          fill="#db2777"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>

                  {/* Growth Percentage Chart */}
                  <ChartContainer
                    title={currentTexts.organizationGrowth}
                    onDownload={() => console.log("Download chart 5")}
                    onMaximize={() => console.log("Maximize chart 5")}
                  >
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={organizationsByYear.map((item, index) => ({
                          year: item.year,
                          growth:
                            index > 0
                              ? (
                                  ((item.birth -
                                    organizationsByYear[index - 1].birth) /
                                    organizationsByYear[index - 1].birth) *
                                  100
                                ).toFixed(1)
                              : 0,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value}%`, "ზრდა"]} />
                        <Bar dataKey="growth" fill="#16a34a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>

                  {/* Pie Chart - Ownership Types */}
                  <ChartContainer
                    title={currentTexts.ownershipTypes}
                    onDownload={() => console.log("Download chart 6")}
                    onMaximize={() => console.log("Maximize chart 6")}
                  >
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={ownershipData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {ownershipData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charts;
