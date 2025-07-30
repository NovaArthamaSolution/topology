/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type NodeMouseHandler,
} from "@xyflow/react";
import {
  FaBuilding,
  FaDatabase,
  FaShare,
  FaBriefcase,
  FaEnvelope,
  FaDesktop,
  FaDoorOpen,
  FaPassport,
  FaPersonMilitaryToPerson,
  FaPlane,
  FaHand,
  FaFingerprint,
  FaChartLine,
  FaGlobe,
  FaShield,
} from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import "@xyflow/react/dist/style.css";
import AWSIcon from "../assets/icons/aws";
import GCPIcon from "../assets/icons/gcp";
import RackIcon from "../assets/icons/rack";
import DellEmcIcon from "../assets/icons/dellemc";
import HPEIcon from "../assets/icons/hpe";
import KubernetesIcon from "../assets/icons/kubernetes";
import EC2Icon from "../assets/icons/ec2";
import NetBoxIcon from "../assets/icons/netbox";
import BigQueryIcon from "../assets/icons/bigquery";
import ContainmentIcon from "../assets/icons/containment";
import CustomNode from "./Nodes";
import HPEIconAlt from "@/assets/icons/hpe-alt";
import PostgresIcon from "@/assets/icons/postgresql";
import MySQLIcon from "@/assets/icons/mysql";

export type AssetNode = {
  NodeId: number;
  Nama_Aset: string;
  No_Aset: string;
  Class: string;
  parentId: number | null;
  position_tag: string;
  view_icon: string;
  grouping: string;
  info: string;
  level: number | null;
  children?: AssetNode[];
};

type FlowProps = {
  data: AssetNode[];
};

type HistoryState = {
  nodes: Node[];
  edges: Edge[];
  parentId: number | null;
};

const Flow: React.FC<FlowProps> = ({ data }) => {
  const [level, setLevel] = useState<number>(1); 
  const [currentParentId, setCurrentParentId] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const iconMap: Record<string, React.ReactNode> = {
    building: <FaBuilding />,
    aws: <AWSIcon color="#000" width={24} />,
    gcp: <GCPIcon width={24} />,
    rack: <RackIcon width={24}  />,
    "dell emc": <DellEmcIcon  height={20} width={80}/>,
    "hpe proliant": <HPEIconAlt width={80} />,
    postgresql: <PostgresIcon width={24} />,
    compute: <EC2Icon width={24} />,
    kubernetes: <KubernetesIcon width={24} />,
    share: <FaShare />,
    login: <FaDoorOpen />,
    briefcase: <FaBriefcase />,
    email: <FaEnvelope />,
    pc: <FaDesktop />,
    epaspor: <FaPassport />,
    imigrasi: <FaPersonMilitaryToPerson />,
    plane: <FaPlane />,
    hand: <FaHand />,
    biometric: <FaFingerprint />,
    dashboard: <FaChartLine />,
    network: <NetBoxIcon color="black" width={24} />,
    data: <FaDatabase />,
    www: <FaGlobe />,
    security: <FaShield />,
    bigquery: <BigQueryIcon width={24} height={24} />,
    containment: <ContainmentIcon width={24} />,
    xp7: <HPEIcon color="#FF9900" />,
    mysql: <MySQLIcon width={24} />,
  };

  // const classStyleMap: Record<
  //   string,
  //   { bgColor: string; borderColor: string }
  // > = {
  //   OnPremise: {
  //     bgColor: "white",
  //     borderColor: "hsl(var(--primary))",
  //   },
  //   Cloud: {
  //     bgColor: "skyblue",
  //     borderColor: "hsl(var(--secondary))",
  //   },
  //   Containment: {
  //     bgColor: "lightgray",
  //     borderColor: "hsl(var(--accent-foreground))",
  //   },
  //   Rack: {
  //     bgColor: "lightyellow",
  //     borderColor: "hsl(var(--border))",
  //   },
  //   Server: {
  //     bgColor: "white",
  //     borderColor: "hsl(var(--destructive))",
  //   },
  //   "Cloud Account": {
  //     bgColor: "skyblue",
  //     borderColor: "hsl(var(--muted-foreground))",
  //   },
  //   "Cloud Instance": {
  //     bgColor: "white",
  //     borderColor: "hsl(var(--secondary))",
  //   },
  //   "Cloud Service": {
  //     bgColor: "skyblue",
  //     borderColor: "hsl(var(--accent-foreground))",
  //   },
  // };

  const getEdgeStyle = (_sourceNode?: AssetNode, targetNode?: AssetNode) => {
    const classType = targetNode?.Class || "default";
    const styleMap: Record<string, React.CSSProperties> = {
      Server: { stroke: "hsl(var(--destructive))", strokeWidth: 2 },
      Rack: { stroke: "hsl(var(--border))", strokeWidth: 2 },
      Containment: { stroke: "hsl(var(--accent-foreground))", strokeWidth: 2 },
      default: { stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 },
    };
    return styleMap[classType] || styleMap.default;
  };

  const parsePositionTag = (
    positionTag: string,
    nodeLevel: number,
    nodeIndex: number
  ) => {
    if (positionTag && positionTag !== "x,y") {
      if (positionTag.startsWith("L") ) {
        const match = positionTag.match(/[LR](\d+)/);
        if (match)
          positionTag = match[1] + ":1"
      }
      if (positionTag.startsWith("R")) { 
        const match = positionTag.match(/[LR](\d+)/);
        if (match) 
          positionTag = match[1] + ":3"
      }
       
      if (positionTag.startsWith("U")) {
        const match = positionTag.match(/U(\d+)(?:-(\d+))?/);
        if (match) {
          const unit = Number(match[1]);
          return { x: 300, y: unit * 50 };
        }
      }
  
      if (positionTag.includes(":")) {
        const [row, col] = positionTag.split(":").map(Number);
        if (!isNaN(row) && !isNaN(col)) {
          return { x: col * 200, y: row * 100 };
        }
      }
      
    }
    return { x: nodeLevel * 300 + nodeIndex * 200, y: 0 };
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem("flowHistory");
    const savedParentId = localStorage.getItem("flowCurrentParentId");
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedParentId) setCurrentParentId(JSON.parse(savedParentId));
  }, []);

  useEffect(() => {
    localStorage.setItem("flowHistory", JSON.stringify(history));
    localStorage.setItem(
      "flowCurrentParentId",
      JSON.stringify(currentParentId)
    );
  }, [history, currentParentId]);

  const findNode = useCallback(
    (id: number): AssetNode | undefined => {
      return data
        .flatMap((n) => [n, ...(n.children || [])])
        .flatMap((n) => [n, ...(n.children || [])])
        .flatMap((n) => [n, ...(n.children || [])])
        .find((n) => n.NodeId === id);
    },
    [data]
  );

  const getBreadcrumbs = useCallback(() => {
    const breadcrumbs: { id: number | null; label: string }[] = [];
    let currentId = currentParentId;
    while (currentId !== null) {
      const node = findNode(currentId);
      if (node) {
        breadcrumbs.unshift({ id: currentId, label: node.Nama_Aset });
        currentId = node.parentId;
      } else break;
    }
    breadcrumbs.unshift({ id: null, label: "Infrastruktur SIMKIM" });
    return breadcrumbs;
  }, [currentParentId, findNode]);

  useMemo(() => {
    const tempNodes: Node[] = [];
    const tempEdges: Edge[] = [];
    const levelCounts: Record<number, number> = {};

    const processNode = (
      node: AssetNode,
      inferredLevel: number = node.level || 1,
      _nodeIndex: number
    ) => {
      const nodeLevel =
        node.level !== null && node.level !== undefined
          ? node.level
          : inferredLevel;

      if (!currentParentId && nodeLevel > level) return;
      if (currentParentId && node.parentId !== currentParentId) return;

      levelCounts[nodeLevel] = levelCounts[nodeLevel] || 0;
      const nodeIndexAtLevel = levelCounts[nodeLevel];
      const { x, y } = parsePositionTag(
        node.position_tag,
        nodeLevel,
        nodeIndexAtLevel
      );
      levelCounts[nodeLevel] += 1;

      // const styles = classStyleMap[node.Class] || {
      //   bgColor: "hsl(var(--background))",
      //   borderColor: "hsl(var(--border))",
      // };

      tempNodes.push({
        id: String(node.NodeId),
        position: { x, y },
        data: {
          label: node.Nama_Aset,
          Class: node.Class,
          icon: iconMap[node.view_icon] || null,
          children: node.children || [],
          bgColor: "white",
          // ...styles,
        },
        type: "custom",
      });

      if (node.parentId !== null && node.parentId !== undefined) {
        const parentNode = findNode(node.parentId);
        const parentLevel = parentNode?.level || inferredLevel - 1;
        if (!currentParentId || parentLevel <= level) {
          tempEdges.push({
            id: `e${node.parentId}-${node.NodeId}`,
            source: String(node.parentId),
            target: String(node.NodeId),
            style: {
              ...getEdgeStyle(parentNode, node),
              transition: "all 0.3s ease",
            },
          });
        }
      }

      if (!currentParentId && node.children) {
        node.children.forEach((child, index) =>
          processNode(child, nodeLevel + 1, index)
        );
      }
    };

    if (currentParentId) {
      const parentNode = findNode(currentParentId);
      if (parentNode?.children) {
        parentNode.children.forEach((child, index) =>
          processNode(child, child.level || (parentNode.level || 0) + 1, index)
        );
      }
    } else {
      const walk = (nodesArray: AssetNode[], currentLevel = 1) => {
        nodesArray.forEach((node, index) => {
          if (currentLevel <= level) {
            processNode(node, currentLevel, index);
            if (node.children?.length) {
              walk(node.children, currentLevel + 1);
            }
          }
        });
      };
      walk(data);
    }
    // @ts-ignore
    setNodes(tempNodes);
    // @ts-ignore
    setEdges(tempEdges);
  }, [data, level, currentParentId, findNode, setNodes, setEdges]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      setHistory((prev) => [
        ...prev,
        {
          // @ts-ignore
          nodes: nodes.map(({ data, ...rest }) => ({
            ...rest,
            // @ts-ignore
            data: { ...data, icon: null },
          })),
          edges,
          parentId: currentParentId,
        },
      ]);
      setCurrentParentId(Number(node.id));
    },
    [nodes, edges, currentParentId]
  );

  const goBack = useCallback(() => {
    if (!history.length) return;
    const lastState = history[history.length - 1];
    // @ts-ignore
    setNodes(lastState.nodes);
    // @ts-ignore
    setEdges(lastState.edges);
    setCurrentParentId(lastState.parentId);
    setHistory((prev) => prev.slice(0, -1));
  }, [history, setNodes, setEdges]);

  const handleBreadcrumbClick = useCallback(
    (id: number | null) => {
      const targetHistoryIndex = history.findIndex((h) => h.parentId === id);
      if (targetHistoryIndex !== -1) {
        const targetState = history[targetHistoryIndex];
        // @ts-ignore
        setNodes(targetState.nodes);
        // @ts-ignore
        setEdges(targetState.edges);
        setCurrentParentId(targetState.parentId);
        setHistory((prev) => prev.slice(0, targetHistoryIndex));
      } else {
        setHistory((prev) =>
          id === null
            ? []
            : [...prev, { nodes, edges, parentId: currentParentId }]
        );
        setCurrentParentId(id);
      }
    },
    [history, nodes, edges, currentParentId, setNodes, setEdges]
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((els) => addEdge(params, els)),
    [setEdges]
  );

  return (
    <div className="w-screen h-screen relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onConnect={onConnect}
        nodeTypes={{ custom: CustomNode }}
        fitView
        // colorMode="dark"
        draggable
      >
        <Background />
        <Controls showInteractive={false} />
        <MiniMap />
      </ReactFlow>
      <div className="absolute top-4 left-4 flex items-center space-x-2">
        {history.length > 0 && (
          <Button onClick={goBack} variant="outline" className="text-white">
            Back
          </Button>
        )}
        <Breadcrumb>
          <BreadcrumbList>
            {getBreadcrumbs().map((crumb, index) => (
              <React.Fragment key={crumb.id ?? "root"}>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    onClick={() => handleBreadcrumbClick(crumb.id)}
                    className="cursor-pointer hover:underline text-white text-2xl"
                  >
                    {crumb.label}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {index < getBreadcrumbs().length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      {!currentParentId && (
        <Button
          onClick={() => setLevel((prev) => prev + 1)}
          variant="outline"
          className="absolute top-4 right-4 text-white"
          disabled
        >
          Show Next Level (Current: {level})
        </Button>
      )}
    </div>
  );
};

export default Flow;
