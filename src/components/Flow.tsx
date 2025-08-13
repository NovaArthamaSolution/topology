/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useCallback, useState, useEffect } from "react";
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
  useReactFlow,
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
  FaTemperatureLow,
  FaTowerCell,
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

const NODE_WIDTH = 200;
const NODE_HEIGHT = 50; // Adjusted for thinner nodes
const MARGIN_X = 25;
const MARGIN_Y = 0; // Reduced margin for denser layout
const U_HEIGHT = 100; // Each unit height matches node height
const RACK_HEIGHT = 42 * U_HEIGHT; // Full rack height
const LABEL_WIDTH = 30; // Width for unit labels
const RACK_WIDTH = 600 + LABEL_WIDTH; // Dynamic width to match children

const Flow: React.FC<FlowProps> = ({ data }) => {
  const [level, setLevel] = useState<number>(1);
  const [currentParentId, setCurrentParentId] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();

  const iconMap: Record<string, React.ReactNode> = {
    building: <FaBuilding />,
    aws: <AWSIcon color="#000" width={24} />,
    gcp: <GCPIcon width={24} />,
    rack: <RackIcon width={24} />,
    "dell emc": <DellEmcIcon height={20} width={80} />,
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
    cooling: <FaTemperatureLow color="skyblue" />,
    netpanel: <FaTowerCell />,
  };

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
      if (positionTag.startsWith("L")) {
        const match = positionTag.match(/[LR](\d+)/);
        if (match) positionTag = match[1] + ":1";
      }
      if (positionTag.startsWith("R")) {
        const match = positionTag.match(/[LR](\d+)/);
        if (match) positionTag = match[1] + ":3";
      }

      if (positionTag.startsWith("U")) {
        const match = positionTag.match(/U(\d+)(?:-(\d+))?/);
        if (match) {
          const startUnit = Number(match[1]);
          // @ts-ignore
          const endUnit = match[2] ? Number(match[2]) : startUnit;
          const y = (42 - startUnit) * U_HEIGHT; // Position at the bottom of the range
          return { x: LABEL_WIDTH, y }; // Offset for label column
        }
      }

      if (positionTag.includes(":")) {
        const [row, col] = positionTag.split(":").map(Number);
        if (!isNaN(row) && !isNaN(col)) {
          return { x: col * (NODE_WIDTH + MARGIN_X), y: row * (NODE_HEIGHT + MARGIN_Y) };
        }
      }
    }
    return { x: nodeLevel * (NODE_WIDTH + MARGIN_X * 2) + nodeIndex * (NODE_WIDTH + MARGIN_X), y: 0 };
  };

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

  useEffect(() => {
    const tempNodes: Node[] = [];
    const tempEdges: Edge[] = [];
    const levelCounts: Record<number, number> = {};

    const processNode = (
      node: AssetNode,
      inferredLevel: number = node.level || 1,
      // @ts-ignore
      nodeIndex: number
    ) => {
      const nodeLevel = node.level ?? inferredLevel;

      if (!currentParentId && nodeLevel > level) return;
      if (currentParentId && node.parentId !== currentParentId) return;

      levelCounts[nodeLevel] = levelCounts[nodeLevel] || 0;
      const nodeIndexAtLevel = levelCounts[nodeLevel];
      const parentNode = node.parentId !== null ? findNode(node.parentId) : undefined;
      const isRackChild = currentParentId && parentNode?.Class === "Rack" && node.position_tag.startsWith("U");
      if (isRackChild) {
        // Skip adding to tempNodes for rack children; they will be embedded in rackContainer
        return;
      }

      const { x, y } = parsePositionTag(node.position_tag, nodeLevel, nodeIndexAtLevel);
      levelCounts[nodeLevel] += 1;

      tempNodes.push({
        id: String(node.NodeId),
        position: { x, y },
        data: {
          label: node.Nama_Aset,
          Class: node.Class,
          icon: iconMap[node.view_icon] || null,
          view_icon: node.view_icon,
          children: node.children || [],
          bgColor: "white",
          borderColor: "hsl(var(--border))",
          info: node.info,
          height: NODE_HEIGHT,
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
      if (parentNode?.Class === "Rack") {
        // Add rack container only for Rack children view
        tempNodes.push({
          id: `rack-container-${currentParentId}`,
          position: { x: 0, y: 0 },
          data: {
            label: parentNode.Nama_Aset,
            height: RACK_HEIGHT + 30, // Include space for title
            width: RACK_WIDTH, 
            children: parentNode.children || [], // Pass children to rack container
          },
          type: "rackContainer",
          zIndex: -1,
        });
      }
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

  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.2, duration: 200 });
    }, 0);
    return () => clearTimeout(timer);
  }, [currentParentId, level, fitView]);

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

  const rackContainerNode = ({ data }: { data: { label: string; height: number; width: number; children: AssetNode[] } }) => {
    const unitMap: (AssetNode | null)[] = Array(43).fill(null); // 1-based index for units 1-42

    data.children.forEach((child) => {
      if (child.position_tag.startsWith("U")) {
        const match = child.position_tag.match(/U(\d+)(?:-(\d+))?/);
        if (match) {
          const startUnit = Number(match[1]);
          const endUnit = match[2] ? Number(match[2]) : startUnit;
          for (let u = startUnit; u <= endUnit; u++) {
            unitMap[u] = child; // Assign child to each unit in the range
          }
        }
      }
    });

    return (
      <div
        style={{
          width: data.width,
          height: data.height,
          border: "2px solid green",
          borderRadius: "8px",
          background: "rgba(0, 255, 0, 0.1)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "10px",
        }}
      >
        <div className="text-sm font-bold text-black mb-2">{data.label}</div>
        <div style={{ display: "flex", flexDirection: "column-reverse", width: "100%", height: RACK_HEIGHT }}>
          {Array.from({ length: 42 }, (_, i) => {
            const unit = i + 1; // U1 at bottom, U42 at top
            const child = unitMap[unit];
            return (
              <div
                key={unit}
                style={{
                  height: U_HEIGHT,
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderTop: "1px solid gray",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: "5px",
                    fontSize: "12px",
                    color: "black",
                  }}
                >
                  U{unit}
                </div>
                {child && (
                  <CustomNode
                    id={`${child.NodeId}-${unit}`} // Unique ID for each instance
                    data={{
                      label: child.Nama_Aset,
                      Class: child.Class,
                      icon: iconMap[child.view_icon] || null,
                      bgColor: "white",
                      borderColor: "hsl(var(--border))",
                      children: child.children,
                      info: child.info,
                      view_icon: child.view_icon,
                      height: U_HEIGHT, // Fixed height for each unit
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-screen h-screen relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onConnect={onConnect}
        nodeTypes={{ custom: CustomNode, rackContainer: rackContainerNode }}
        fitView
        draggable
      >
        <Background />
        <Controls showInteractive={false} />
        <MiniMap />
      </ReactFlow>
      <div className="absolute top-4 left-4 flex items-center space-x-2">
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
          Level: {level}
        </Button>
      )}
    </div>
  );
};

export default Flow;