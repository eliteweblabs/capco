import React from 'react';
import ReactFlow, { 
    MiniMap, 
    Controls, 
    Background, 
    useNodesState, 
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    NodeTypes,
    Handle,
    Position
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom Node Component matching your design
const CustomNode = ({ data, selected }: any) => {
    return (
        <div className={`node-card ${selected ? 'selected' : ''}`}>
            <div className="node-header">
                <div className="node-icon">N</div>
                <div className="node-title">{data.title}</div>
            </div>
            <div className="node-subtitle">{data.subtitle}</div>
            <div className={`node-status status-${data.status}`}>
                <div className="status-dot"></div>
                {data.statusText}
            </div>
            
            <Handle
                type="target"
                position={Position.Top}
                id="top"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom"
            />
            <Handle
                type="target"
                position={Position.Left}
                id="left"
            />
            <Handle
                type="source"
                position={Position.Right}
                id="right"
            />
        </div>
    );
};

const nodeTypes: NodeTypes = {
    custom: CustomNode,
};

const initialNodes: Node[] = [
    {
        id: 'create-account',
        type: 'custom',
        data: { 
            title: 'Create Account',
            subtitle: 'User registration process',
            status: 'active',
            statusText: 'Active'
        },
        position: { x: 100, y: 100 },
    },
    {
        id: 'upload-files',
        type: 'custom',
        data: { 
            title: 'Upload Files',
            subtitle: 'PDF submission and validation',
            status: 'active',
            statusText: 'Active'
        },
        position: { x: 400, y: 100 },
    },
    {
        id: 'generate-proposal',
        type: 'custom',
        data: { 
            title: 'Generate Proposal',
            subtitle: 'AI processing and analysis',
            status: 'pending',
            statusText: '24 hours to complete'
        },
        position: { x: 100, y: 300 },
    },
    {
        id: 'review-approve',
        type: 'custom',
        data: { 
            title: 'Review & Approve',
            subtitle: 'Admin review and approval',
            status: 'pending',
            statusText: 'Pending review'
        },
        position: { x: 400, y: 300 },
    },
];

const initialEdges: Edge[] = [
    { 
        id: 'e1-2', 
        source: 'create-account', 
        target: 'upload-files',
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#60a5fa', strokeWidth: 2 }
    },
    { 
        id: 'e2-3', 
        source: 'upload-files', 
        target: 'generate-proposal',
        type: 'smoothstep',
        style: { stroke: '#60a5fa', strokeWidth: 2 }
    },
    { 
        id: 'e3-4', 
        source: 'generate-proposal', 
        target: 'review-approve',
        type: 'smoothstep',
        style: { stroke: '#60a5fa', strokeWidth: 2 }
    },
];

export default function ReactFlowDemo() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = (params: Connection) => {
        setEdges((eds) => addEdge({
            ...params,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#60a5fa', strokeWidth: 2 }
        }, eds));
    };

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-left"
                connectionLineType="smoothstep"
            >
                <Controls />
                <MiniMap 
                    nodeColor={(node) => {
                        if (node.data?.status === 'active') return '#48bb78';
                        if (node.data?.status === 'pending') return '#ed8936';
                        return '#4a5568';
                    }}
                    style={{
                        backgroundColor: '#2d3748',
                        border: '1px solid #4a5568'
                    }}
                />
                <Background variant="dots" gap={20} size={1} color="#4a5568" />
            </ReactFlow>
        </div>
    );
}
