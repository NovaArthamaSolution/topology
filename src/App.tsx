/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useState, useEffect } from "react";
import _ from "lodash";
import Flow from "./components/Flow";
import { ReactFlowProvider } from "@xyflow/react";
import "./App.css";
import axios from "axios";

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
  const [loading, setLoading] = useState<boolean>(true);

  const processAndCleanData = (rawData: Node[]): Node[] => {
    return rawData
      .map(
        (row): Node => ({
          NodeId: row.NodeId ? Number(row.NodeId) : null,
          Nama_Aset: row.Nama_Aset || "",
          No_Aset: row.No_Aset || "",
          Class: row.Class || "",
          parentId: row.parentId ? Number(row.parentId) : null,
          position_tag: row.position_tag || "",
          view_icon: row.view_icon || "",
          grouping: row.grouping || "",
          info: row.info || "",
          level: row.level ? Number(row.level) : null,
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
    setLoading(true);
    const url = "https://i7plhatethomcitjx7i3qkrkxy0eflzh.lambda-url.ap-southeast-1.on.aws"; // Replace with your actual JSON API URL
    axios
      .get(url, {
        headers: {
          Accept: "application/json",
        },
      })
      .then((response) => {
        console.log('response',response)
        const rawData = response?.data;
        // const rawData = resData?.data; // Assuming the JSON response is an array of Node objects
        const cleanedData = processAndCleanData(rawData);
        const groupedData = groupDataByParentId(cleanedData);
        console.log('cleanedData',cleanedData)
        console.log('groupedData',groupedData)
        setData(groupedData);
        setLoading(false);
      })
      .catch((err) => {
        console.log('err',err)
        console.log(`Error fetching JSON: ${err.message}`);
        setLoading(false);
      });
  }, []);

  return (
    <div id="app">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-t-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            <span className="text-white text-lg font-medium">
              Rendering Data....
            </span>
          </div>
        </div>
      )}
      {data && (
        <ReactFlowProvider>
          {/* @ts-ignore */}
          <Flow data={data} />
        </ReactFlowProvider>
      )}
    </div>
  );
}

export default App;
