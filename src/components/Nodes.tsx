/* eslint-disable @typescript-eslint/ban-ts-comment */
import React from "react";
import { useSpring, animated } from "@react-spring/web";
import * as Tooltip from "@radix-ui/react-tooltip";
import { type AssetNode } from "./Flow";

type CustomNodeProps = {
  id: string;
  data: {
    label: string;
    Class: string;
    icon?: React.ReactNode;
    bgColor: string;
    borderColor: string;
    children?: AssetNode[];
    info: any;
    view_icon: string;
  };
};

const CustomNode: React.FC<CustomNodeProps> = ({ data }) => {
  const iconStyles = { marginRight: 8, fontSize: 20 };
  const springProps = useSpring({
    from: { opacity: 0, transform: "scale(0.5)" },
    to: { opacity: 1, transform: "scale(1)" },
    config: { tension: 200, friction: 20 },
    reset: true,
  });

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <animated.div
            style={{
              ...springProps,
              padding: "10px",
              borderRadius: "8px",
              background: data.bgColor,
              border: `1px solid ${data.borderColor}`,
              display: "flex",
              alignItems: "center",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              cursor: data.children?.length ? "pointer" : "default",
              height: 100,
            }}
            className={`text-sm font-medium text-foreground ${data?.Class ? data?.Class?.toLowerCase().replace(" ", "-") : ""} ${
              data.view_icon && data.view_icon?.replace(" ", "-")
            }`}
          >
            <div className="node-container flex flex-row items-center p-4">
              {data.icon && <span style={iconStyles}>{data.icon}</span>}
              <div>
                <strong>{data.label}</strong>
                <div className="text-xs text-muted-foreground">
                  Class: {data.Class}
                </div>
              </div>
            </div>
          </animated.div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="bg-white border border-gray-200 rounded-md shadow-lg p-2 max-w-xs"
            side="top"
            sideOffset={5}
          >
            {data?.info ? (
              <div className="text-sm">
                <strong>Info</strong>
                <div
                  className="mt-1"
                  dangerouslySetInnerHTML={{ __html: data.info }}
                />
              </div>
            ) : (
              <div className="text-sm">
                <strong>Children</strong>
                <ul className="list-disc pl-4 mt-1">
                  {data.children?.map((child) => (
                    <li key={child.NodeId}>{child.Nama_Aset}</li>
                  ))}
                </ul>
              </div>
            )}
            <Tooltip.Arrow className="fill-white" />
          </Tooltip.Content>
        </Tooltip.Portal>
        {/* {data.children?.length ? (
          <Tooltip.Portal>
            <Tooltip.Content
              className="bg-white border border-gray-200 rounded-md shadow-lg p-2 max-w-xs"
              side="top"
              sideOffset={5}
            >
              <div className="text-sm">
                <strong>Info</strong>
                <ul className="list-disc pl-4 mt-1">
                  {data.children.map((child) => (
                    <li key={child.NodeId}>{child.Nama_Aset}</li>
                  ))}
                </ul>
              </div>
              <Tooltip.Arrow className="fill-white" />
            </Tooltip.Content>
          </Tooltip.Portal>
        ) : null} */}
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

export default CustomNode;
