"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Select from "react-select";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

/** 
[Local_currency_financial_years]
1949-2024년 국가별 군사비 지출(현지 통화 기준) © SIPRI 2024
수치는 현재 시세에 따른 현지 통화로 표시되었으며 회계연도별 수치입니다. 국가는 지역 및 하위 지역별로 분류되어 있습니다.
모든 수치는 현재 통화 기준으로 표시됩니다. 초인플레이션과 여러 차례의 통화 재개발이 있었던 경우, 이전 연도 수치는 현재 통화 단위의 일부에 불과할 수 있습니다.
회계연도는 항상 지정된 연도부터 시작됩니다. 예를 들어, 회계연도가 10월-9월인 국가의 경우, 1974 회계연도는 1974년 10월부터 1975년 9월까지를 의미합니다.
파란색 수치는 SIPRI 추정치입니다. 빨간색 수치는 매우 불확실한 데이터를 나타냅니다.
". ." = 데이터 없음. "xxx" = 해당 국가가 존재하지 않았거나 해당 연도의 일부 기간 동안 독립적이지 않았음.

[Local_currency_calendar_years]
국가별 군사비 지출(현지 통화 기준, 1949-2024년) © SIPRI 2024
수치는 달리 명시되지 않는 한, 현행 환율을 적용한 현지 통화로 표시되었으며, 연도별 수치입니다. 국가는 지역 및 하위 지역별로 분류되어 있습니다.
모든 수치는 현재 통화 기준으로 표시됩니다. 초인플레이션과 여러 차례의 화폐 단위 변경이 있었던 경우, 이전 연도 수치는 현재 통화 단위의 일부에 불과할 수 있습니다.
파란색 수치는 SIPRI 추정치입니다. 빨간색 수치는 매우 불확실한 데이터를 나타냅니다.
". ." = 데이터 없음. "xxx" = 해당 국가가 존재하지 않았거나 해당 연도의 일부 또는 전부 동안 독립적이지 않았음.

[Constant_2023_US]
국가별 군사비 지출(불변 기준, 2023년 백만 달러), 1949-2024 © SIPRI 2024
수치는 백만 달러이며, 2023년 기준 가격 및 환율을 기준으로 합니다.
파란색 수치는 SIPRI 추정치입니다. 빨간색 수치는 매우 불확실한 데이터를 나타냅니다.
". ." = 데이터 없음. "xxx" = 해당 국가가 존재하지 않았거나 해당 연도의 일부 기간 동안 독립적이지 않았음.


[Current_US]
1949년부터 2024년까지의 국가별 군사비 지출(백만 달러, 현재 가격 및 환율 기준) © SIPRI 2024
수치는 백만 달러(미화)이며, 현재 가격을 기준으로 해당 연도의 환율로 환산되었습니다.
파란색 수치는 SIPRI 추정치입니다. 빨간색 수치는 매우 불확실한 데이터를 나타냅니다.
". ." = 데이터 없음. "xxx" = 해당 국가가 존재하지 않았거나 해당 연도의 일부 기간 동안 독립적이지 않았음.


[Share_of_GDP]
1949-2024년 국내총생산(GDP) 대비 국가별 군사비 지출 비율 © SIPRI 2024
국가들은 지역 및 하위 지역별로 분류되었습니다.
파란색 수치는 SIPRI 추정치입니다. 빨간색 수치는 매우 불확실한 데이터를 나타냅니다.
". ." = 데이터 없음. "xxx" = 해당 연도의 일부 또는 전부 동안 해당 국가가 존재하지 않았거나 독립적이지 않았음.



 * 
 * 
 */
const sheets = [
  { file: "Regional_totals.json", label: "세계 및 지역별 군사비 요약." },
  {
    file: "Local_currency_financial_years.json",
    label: "국가별 군사비 지출(현지 통화 기준)",
  },
  {
    file: "Local_currency_calendar_years.json",
    label: "국가별 군사비 지출(현지 통화 기준, 1949-2024년)",
  },
  {
    file: "Constant_2023_US.json",
    label: "국가별 군사비 지출(당시 달러 환산 기준, 백만 달러)",
  },
  {
    file: "Current_US.json",
    label: "국가별 군사비 지출(현재 가격 및 환율 기준, 백만 달러)",
  },
  { file: "Share_of_GDP.json", label: "GDP 대비 군사비 비율" },
  { file: "Per_capita.json", label: "1인당 군사비 지출." },
  { file: "Share_of_Govt_spending.json", label: "정부 지출 대비 군사비 비율." },
];

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [selectedSheet, setSelectedSheet] = useState(sheets[0].file);
  const [selectedCountries, setSelectedCountries] = useState<
    { label: string; value: string }[]
  >([]);
  const [years, setYears] = useState<string[]>([]);
  const [countries, setCountries] = useState<
    { label: string; value: string }[]
  >([]);
  const [description, setDescription] = useState(sheets[0].label);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`/data/${selectedSheet}`);
      const json = await res.json();

      // 데이터 로딩 전 차트 초기화
      setSelectedCountries([]);
      setData(json);

      if (json.length > 0) {
        const keys = Object.keys(json[0]);
        const yearKeys = keys.filter((k) => /^\d{4}$/.test(k)).sort();
        setYears(yearKeys);

        const countryList = json
          .map((item: any) => item.country || item.Region || item.name)
          .filter(Boolean)
          .sort((a: string, b: string) => a.localeCompare(b))
          .map((c: string) => ({ label: c, value: c }));

        setCountries(countryList);
      } else {
        setYears([]);
        setCountries([]);
      }
    }
    fetchData();
  }, [selectedSheet]);

  const option = {
    title: {
      text: "국가별 연도별 군사비 지출 추이",
      left: "center",
    },
    tooltip: {
      trigger: "axis",
    },
    legend: {
      data: selectedCountries.map((c) => c.label),
      top: 40,
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: years,
    },
    yAxis: {
      type: "value",
    },
    series:
      selectedCountries.length > 0
        ? selectedCountries.map(({ value: country }) => {
            const record = data.find(
              (item) =>
                item.country === country ||
                item.Region === country ||
                item.name === country
            );
            return {
              name: country,
              type: "line",
              data: years.map((year) =>
                record && record[year] != null ? record[year] : null
              ),
              connectNulls: true,
            };
          })
        : [],
  };

  function onCountryChange(selected: any) {
    setSelectedCountries(selected ?? []);
  }

  function onSheetChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const file = e.target.value;
    setSelectedSheet(file);
    setSelectedCountries([]);
    setData([]);
    const desc = sheets.find((s) => s.file === file)?.label ?? "";
    setDescription(desc);
  }

  return (
    <main className="h-screen flex flex-col bg-[#f5f7fa] text-[#2d2d2d]">
      <div className="w-full max-w-screen-lg mx-auto">
        <header className="p-6 shadow-md bg-white rounded-b-xl mb-6">
          <h1 className="text-3xl font-semibold tracking-wide text-[#1a2533]">
            SIPRI 군사비 시각화
          </h1>
        </header>

        <div className="bg-white shadow-md rounded-xl p-6 mb-6">
          <div className="mb-5">
            <label className="block font-semibold text-[#3a4a63] mb-2">
              📂 데이터 유형 선택
            </label>
            <select
              value={selectedSheet}
              onChange={onSheetChange}
              className="mt-1 w-full border border-gray-300 rounded-md p-3 text-lg focus:outline-none focus:ring-2 focus:ring-[#3a4a63] transition"
            >
              {sheets.map(({ file, label }) => (
                <option key={file} value={file}>
                  {label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              데이터가 없는 경우 해당 연도의 일부 또는 전부 동안 해당 국가가
              존재하지 않았거나 독립적이지 않았음
            </p>
          </div>

          <div className="mb-5">
            <label className="block font-semibold text-[#3a4a63] mb-2">
              🌍 국가 선택 (검색 및 다중 선택 가능)
            </label>
            <Select
              options={countries}
              value={selectedCountries}
              onChange={onCountryChange}
              isMulti
              closeMenuOnSelect={false}
              placeholder="국가 이름을 입력하세요..."
              className="mt-1"
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: "#cbd5e1",
                  boxShadow: "none",
                  "&:hover": { borderColor: "#3a4a63" },
                  fontSize: "1rem",
                }),
                multiValue: (base) => ({
                  ...base,
                  backgroundColor: "#e0e7ff",
                  color: "#1e293b",
                }),
                multiValueLabel: (base) => ({
                  ...base,
                  color: "#1e293b",
                }),
                multiValueRemove: (base) => ({
                  ...base,
                  color: "#64748b",
                  ":hover": { backgroundColor: "#c7d2fe", color: "#1e293b" },
                }),
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 w-full h-full p-6 bg-white shadow-lg rounded-xl">
        <ReactECharts
          key={selectedSheet}
          option={option}
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    </main>
  );
}
