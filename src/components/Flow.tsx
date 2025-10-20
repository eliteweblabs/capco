import { useCallback, useState, useEffect, useRef } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  type OnConnect,
  Handle,
  Position,
  type Node,
  type Edge,
  type Connection,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

// Custom Node Component matching your design
const CustomNode = ({ data, selected }: any) => {
  const iconMap: { [key: string]: string } = {
    database: "D",
    analytics: "A",
    storage: "S",
    default: "N",
  };

  const nodeStyles = {
    position: "relative",
    width: "200px",
    height: "100px",
    background: "#1a1a1a",
    border: selected ? "1px solid #3b82f6" : "1px solid #333",
    borderRadius: "8px",
    padding: "16px",
    cursor: "move",
    zIndex: 5,
    userSelect: "none" as const,
    boxSizing: "border-box" as const,
    color: "white",
    boxShadow: selected ? "0 0 0 2px rgba(59, 130, 246, 0.2)" : "none",
    // Add very obvious styling to test
    borderWidth: "3px",
    borderColor: "#ff0000",
    borderStyle: "solid",
  };

  const headerStyles = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
  };

  const iconStyles = {
    width: "24px",
    height: "24px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "bold",
    color: "white",
    background:
      data.type === "database"
        ? "#3b82f6"
        : data.type === "analytics"
          ? "#8b5cf6"
          : data.type === "storage"
            ? "#f59e0b"
            : "#6b7280",
  };

  const titleStyles = {
    fontWeight: 600,
    color: "#fff",
    fontSize: "14px",
    margin: 0,
    padding: 0,
  };

  const subtitleStyles = {
    fontSize: "12px",
    color: "#888",
    marginTop: "2px",
    margin: 0,
    padding: 0,
  };

  const statusStyles = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#888",
  };

  const indicatorStyles = {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#48bb78",
  };

  return (
    <div style={nodeStyles}>
      <div style={headerStyles}>
        <div style={iconStyles}>{iconMap[data.type] || "N"}</div>
        <div>
          <div style={titleStyles}>{data.title}</div>
          {data.subtitle && <div style={subtitleStyles}>{data.subtitle}</div>}
        </div>
      </div>
      <div style={statusStyles}>
        <div style={indicatorStyles}></div>
        <span>{data.status}</span>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ background: "#60a5fa", width: "8px", height: "8px", border: "2px solid #1a1a1a" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ background: "#60a5fa", width: "8px", height: "8px", border: "2px solid #1a1a1a" }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ background: "#60a5fa", width: "8px", height: "8px", border: "2px solid #1a1a1a" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ background: "#60a5fa", width: "8px", height: "8px", border: "2px solid #1a1a1a" }}
      />
      {/* Additional handles for better connection routing */}
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        style={{ background: "#60a5fa", width: "8px", height: "8px", border: "2px solid #1a1a1a" }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        style={{ background: "#60a5fa", width: "8px", height: "8px", border: "2px solid #1a1a1a" }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        style={{ background: "#60a5fa", width: "8px", height: "8px", border: "2px solid #1a1a1a" }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        style={{ background: "#60a5fa", width: "8px", height: "8px", border: "2px solid #1a1a1a" }}
      />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

// Node templates matching your existing design
const nodeTemplates = {
  database: {
    title: "Database",
    subtitle: "Data storage and retrieval",
    status: "Active",
    type: "database",
  },
  analytics: {
    title: "Analytics",
    subtitle: "Data processing and analysis",
    status: "Processing",
    type: "analytics",
  },
  storage: {
    title: "Storage",
    subtitle: "File and document management",
    status: "Available",
    type: "storage",
  },
  default: {
    title: "Process",
    subtitle: "Workflow step",
    status: "Ready",
    type: "default",
  },
};

// Generate random timeline nodes from left to right
const generateTimelineNodes = (screenWidth: number = 1200): { nodes: Node[]; edges: Edge[] } => {
  const nodeTypes = ["database", "analytics", "storage", "default"];
  const statuses = ["Active", "Processing", "Complete", "Pending", "Ready"];
  const titles = [
    "Data Collection",
    "User Input",
    "File Processing",
    "Analysis",
    "Validation",
    "Storage",
    "Retrieval",
    "Processing",
    "Review",
    "Approval",
    "Submission",
    "Upload",
    "Download",
    "Sync",
    "Backup",
  ];
  const subtitles = [
    "Initial data gathering",
    "User interaction required",
    "File processing in progress",
    "Data analysis phase",
    "Validation and verification",
    "Storage operations",
    "Data retrieval process",
    "Background processing",
    "Review and approval",
    "Final submission",
    "File upload process",
    "Download preparation",
  ];

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const numNodes = Math.floor(Math.random() * 8) + 5; // 5-12 nodes
  const nodeSpacing = screenWidth / (numNodes + 1);
  const centerY = 200;

  for (let i = 0; i < numNodes; i++) {
    const nodeType = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];
    const title = titles[Math.floor(Math.random() * titles.length)];
    const subtitle = subtitles[Math.floor(Math.random() * subtitles.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const node: Node = {
      id: (i + 1).toString(),
      type: "custom",
      data: {
        title,
        subtitle,
        status,
        type: nodeType,
      },
      position: {
        x: nodeSpacing * (i + 1) - 100, // Center the node
        y: centerY + (Math.random() - 0.5) * 100, // Add some vertical variation
      },
    };

    nodes.push(node);

    // Create connections between adjacent nodes
    if (i > 0) {
      edges.push({
        id: `e${i}-${i + 1}`,
        source: i.toString(),
        target: (i + 1).toString(),
        type: "smoothstep",
        animated: true,
        style: { stroke: "#60a5fa", strokeWidth: 2 },
      });
    }
  }

  return { nodes, edges };
};

// Initialize with default nodes (will be replaced on client)
const initialNodes: Node[] = [
  {
    id: "1",
    type: "custom",
    data: {
      title: "Loading...",
      subtitle: "Generating timeline",
      status: "Processing",
      type: "default",
    },
    position: { x: 100, y: 200 },
  },
];
const initialEdges: Edge[] = [];

export default function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isAutoDeploying, setIsAutoDeploying] = useState(false);
  const [nodeCounter, setNodeCounter] = useState(1);
  const reactFlowInstance = useRef<any>(null);
  const autoDeployInterval = useRef<NodeJS.Timeout | null>(null);

  // Generate initial timeline on client side
  useEffect(() => {
    const screenWidth = window.innerWidth || 1200;
    const { nodes: newNodes, edges: newEdges } = generateTimelineNodes(screenWidth);
    setNodes(newNodes);
    setEdges(newEdges);
    setNodeCounter(newNodes.length + 1);
  }, []);

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      // React Flow automatically chooses the best handle based on connection direction
      // The smoothstep edge type ensures L-shaped connections
      setEdges((edges) =>
        addEdge(
          {
            ...connection,
            type: "smoothstep",
            animated: true,
            style: { stroke: "#60a5fa", strokeWidth: 2 },
          },
          edges
        )
      );
    },
    [setEdges]
  );

  // Custom connection validation to ensure optimal routing
  const isValidConnection = useCallback((connection: Connection) => {
    return true; // Allow all connections - React Flow will handle optimal routing
  }, []);

  // Generate new random timeline
  const generateNewTimeline = () => {
    const screenWidth = window.innerWidth || 1200;
    const { nodes: newNodes, edges: newEdges } = generateTimelineNodes(screenWidth);
    setNodes(newNodes);
    setEdges(newEdges);
    setNodeCounter(newNodes.length + 1);
  };

  // Add a single node to the timeline
  const addSingleNode = () => {
    const nodeTypes = ["database", "analytics", "storage", "default"];
    const statuses = ["Active", "Processing", "Complete", "Pending", "Ready"];
    const titles = [
      "Data Collection",
      "User Input",
      "File Processing",
      "Analysis",
      "Validation",
      "Storage",
      "Retrieval",
      "Processing",
      "Review",
      "Approval",
      "Submission",
      "Upload",
      "Download",
      "Sync",
      "Backup",
    ];
    const subtitles = [
      "Initial data gathering",
      "User interaction required",
      "File processing in progress",
      "Data analysis phase",
      "Validation and verification",
      "Storage operations",
      "Data retrieval process",
      "Background processing",
      "Review and approval",
      "Final submission",
      "File upload process",
      "Download preparation",
    ];

    const nodeType = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];
    const title = titles[Math.floor(Math.random() * titles.length)];
    const subtitle = subtitles[Math.floor(Math.random() * subtitles.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const newNode: Node = {
      id: nodeCounter.toString(),
      type: "custom",
      data: {
        title,
        subtitle,
        status,
        type: nodeType,
      },
      position: {
        x: 1200 + nodeCounter * 50, // Place new node to the right
        y: 200 + (Math.random() - 0.5) * 100, // Add some vertical variation
      },
    };

    setNodes((prevNodes) => {
      const newNodes = [...prevNodes, newNode];

      // Connect to the last node if there are existing nodes
      if (prevNodes.length > 0) {
        const lastNode = prevNodes[prevNodes.length - 1];
        const newEdge: Edge = {
          id: `e${lastNode.id}-${nodeCounter}`,
          source: lastNode.id,
          target: nodeCounter.toString(),
          type: "smoothstep",
          animated: true,
          style: { stroke: "#60a5fa", strokeWidth: 2 },
        };
        setEdges((prevEdges) => [...prevEdges, newEdge]);
      }

      return newNodes;
    });

    setNodeCounter((prev) => prev + 1);

    // Auto-scroll to show the new node
    setTimeout(() => {
      if (reactFlowInstance.current) {
        reactFlowInstance.current.fitView({
          padding: 0.1,
          includeHiddenNodes: false,
          minZoom: 0.5,
          maxZoom: 1,
        });
      }
    }, 100);
  };

  // Start auto-deploying nodes
  const startAutoDeploy = () => {
    if (autoDeployInterval.current) return; // Already running

    setIsAutoDeploying(true);
    autoDeployInterval.current = setInterval(() => {
      addSingleNode();
    }, 2000); // Add a node every 2 seconds
  };

  // Stop auto-deploying nodes
  const stopAutoDeploy = () => {
    if (autoDeployInterval.current) {
      clearInterval(autoDeployInterval.current);
      autoDeployInterval.current = null;
    }
    setIsAutoDeploying(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoDeployInterval.current) {
        clearInterval(autoDeployInterval.current);
      }
    };
  }, []);

  // Clear all nodes
  const clearAll = () => {
    setNodes([]);
    setEdges([]);
    setNodeCounter(1);
    stopAutoDeploy();
  };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* Toolbar for timeline generation */}
      <div className="node-toolbar">
        <button className="add-node-btn" onClick={generateNewTimeline}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
          </svg>
          Generate Timeline
        </button>
        <button className="add-node-btn" onClick={addSingleNode}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
          </svg>
          Add Node
        </button>
        <button
          className={isAutoDeploying ? "clear-btn" : "add-node-btn"}
          onClick={isAutoDeploying ? stopAutoDeploy : startAutoDeploy}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            {isAutoDeploying ? (
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
            ) : (
              <path d="M8 5v14l11-7z" />
            )}
          </svg>
          {isAutoDeploying ? "Stop Auto" : "Start Auto"}
        </button>
        <button className="clear-btn" onClick={clearAll}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
          </svg>
          Clear All
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        edges={edges}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onInit={(instance) => {
          reactFlowInstance.current = instance;
        }}
        fitView
        deleteKeyCode={["Backspace", "Delete"]}
        multiSelectionKeyCode={["Meta", "Ctrl"]}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: true,
          style: { stroke: "#60a5fa", strokeWidth: 2 },
        }}
        connectionLineType="smoothstep"
        connectionLineStyle={{ stroke: "#60a5fa", strokeWidth: 2 }}
        snapToGrid={true}
        snapGrid={[15, 15]}
        attributionPosition="bottom-right"
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        panOnDrag={false}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={true}
        preventScrolling={false}
        selectNodesOnDrag={false}
      >
        <Background />
      </ReactFlow>
    </div>
  );
}
