/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useState, useEffect } from "react";
import Papa from "papaparse";
import _ from "lodash";
import Flow from "./components/Flow";
import "./App.css";

type RawData = {
  [key: string]: string;
};

type Node = {
  NodeId: number | null;
  Nama_Aset: string;
  No_Aset: string;
  Class: string;
  parentId: number | null;
  position_tag: string;
  view_icon: string;
  grouping: string;
  info: string;
  level: number | null;
  children?: Node[];
};

function App() {
  const [data, setData] = useState<Node[]>([]);

  const processAndCleanData = (rawData: RawData[]): Node[] => {
    return rawData
      .map(
        (row): Node => ({
          NodeId: row["NodeId"] ? parseInt(row["NodeId"], 10) : null,
          Nama_Aset: row["Nama Aset"] || "",
          No_Aset: row["No Aset"] || "",
          Class: row["Class"] || "",
          parentId: row["parentId"] ? parseInt(row["parentId"], 10) : null,
          position_tag: row["position_tag"] || "",
          view_icon: row["view_icon"] || "",
          grouping: row["grouping"] || "",
          info: row["info"] || "",
          level: row["level"] ? parseInt(row["level"], 10) : null,
        })
      )
      .filter((row) => row.NodeId !== null);
  };

  const groupDataByParentId = (cleanedData: Node[]): Node[] => {
    const grouped = _.groupBy(cleanedData, (row) =>
      row.parentId === null ? "root" : row.parentId
    );

    const buildHierarchy = (node: Node): Node => ({
      ...node,
      children: (grouped[node.NodeId!] || []).map((child) =>
        buildHierarchy(child)
      ),
    });

    return (grouped["root"] || []).map((node) => buildHierarchy(node));
  };

  useEffect(() => {
    const url = import.meta.env.VITE_CSV_URL || ''
    fetch(url, {
      headers: {
        'Accept': 'text/csv',
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch CSV");
        return response.text();
      })
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim().replace(/^"|"$/g, ""),
          transform: (value) => value.trim().replace(/^"|"$/g, ""),
          complete: (result: Papa.ParseResult<RawData>) => {
            const cleanedData = processAndCleanData(result.data);
            const groupedData = groupDataByParentId(cleanedData);
            setData(groupedData);
          },
          error: (err: { message: string }) =>
            console.log(`Error parsing CSV: ${err?.message}`),
        });
      })
      .catch((err) => console.log(`Error fetching CSV: ${err.message}`));
  }, []);
  // @ts-expect-error
  return <div id="app">{data && <Flow data={data} />}</div>;
}

export default App;