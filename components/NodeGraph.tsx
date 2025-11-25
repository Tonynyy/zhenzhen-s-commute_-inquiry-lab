import React, { useRef, useState } from 'react';
import { NodeData, Connection, NodeType } from '../types';
import { Settings, ArrowRight } from 'lucide-react';

interface NodeGraphProps {
  nodes: NodeData[];
  connections: Connection[];
  onUpdateNode: (nodeId: string, value: string | number) => void;
  onConnect: (source: string, target: string) => void;
  onDisconnect: (id: string) => void;
  onNodeMove: (id: string, x: number, y: number) => void;
}

export const NodeGraph: React.FC<NodeGraphProps> = ({
  nodes,
  connections,
  onUpdateNode,
  onConnect,
  onDisconnect,
  onNodeMove
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [connectingSource, setConnectingSource] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    // Only allow dragging if not clicking an input or select
    if ((e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'SELECT') {
      setDraggingNode(nodeId);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePos({ x, y });

      if (draggingNode) {
        onNodeMove(draggingNode, x, y);
      }
    }
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
  };

  // Connection Logic
  const handlePortClick = (e: React.MouseEvent, nodeId: string, isInput: boolean) => {
    e.stopPropagation();
    if (!isInput) {
      // Start connecting from output
      setConnectingSource(nodeId);
    } else {
      // End connecting at input
      if (connectingSource && connectingSource !== nodeId) {
        onConnect(connectingSource, nodeId);
        setConnectingSource(null);
      }
    }
  };

  const cancelConnection = () => setConnectingSource(null);

  // Helper to calculate Bezier path
  const getPath = (sx: number, sy: number, tx: number, ty: number) => {
    const dist = Math.abs(tx - sx);
    const cpOffset = Math.max(dist * 0.5, 50); // Dynamic control point offset
    return `M${sx},${sy} C${sx + cpOffset},${sy} ${tx - cpOffset},${ty} ${tx},${ty}`;
  };

  return (
    <div 
      ref={canvasRef}
      className="relative w-full h-full bg-slate-50 overflow-hidden cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={cancelConnection}
      style={{
        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}
    >
      <style>{`
        @keyframes flowAnimation {
          from { stroke-dashoffset: 20; }
          to { stroke-dashoffset: 0; }
        }
        .flow-line {
          animation: flowAnimation 1s linear infinite;
        }
      `}</style>

      <div className="absolute top-4 left-4 z-0 pointer-events-none opacity-40">
        <h3 className="text-4xl font-black text-slate-300 tracking-tight">MODEL CANVAS</h3>
        <p className="text-slate-400">拖动节点 • 点击两侧圆点连线 • 输入数据</p>
      </div>

      {/* SVG Layer for Connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
        <defs>
          <linearGradient id="lineGradient" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
             <path d="M0,0 L6,3 L0,6 L0,0" fill="#06b6d4" />
          </marker>
        </defs>
        
        {/* Existing Connections */}
        {connections.map((conn) => {
          const source = nodes.find(n => n.id === conn.source);
          const target = nodes.find(n => n.id === conn.target);
          if (!source || !target) return null;
          
          const sx = source.x + 190; 
          const sy = source.y + 50; 
          const tx = target.x - 10; 
          const ty = target.y + 50;

          const d = getPath(sx, sy, tx, ty);

          return (
            <g key={conn.id} className="group pointer-events-auto cursor-pointer" onClick={(e) => { e.stopPropagation(); onDisconnect(conn.id); }}>
              {/* Invisible wide path for easier clicking */}
              <path d={d} fill="none" stroke="transparent" strokeWidth="20" />
              
              {/* Background Glow (Visible on hover) */}
              <path d={d} fill="none" stroke="#60a5fa" strokeWidth="8" className="opacity-0 group-hover:opacity-30 transition-opacity" strokeLinecap="round" />

              {/* Main Colored Line */}
              <path d={d} fill="none" stroke="url(#lineGradient)" strokeWidth="3" />

              {/* Animated Dash Line */}
              <path 
                d={d} 
                fill="none" 
                stroke="white" 
                strokeWidth="2" 
                strokeDasharray="4, 4" 
                strokeOpacity="0.5"
                className="flow-line"
                markerEnd="url(#arrowhead)"
              />

              {/* Delete Button (Visible on hover) */}
              <circle cx={(sx+tx)/2} cy={(sy+ty)/2} r="10" fill="#f1f5f9" stroke="#94a3b8" className="opacity-0 group-hover:opacity-100 transition-opacity shadow-sm" />
              <text x={(sx+tx)/2} y={(sy+ty)/2 + 4} textAnchor="middle" fontSize="12" fill="#ef4444" className="opacity-0 group-hover:opacity-100 font-bold select-none">×</text>
            </g>
          );
        })}

        {/* Dragging Line */}
        {connectingSource && (
          <path 
            d={getPath(
                nodes.find(n => n.id === connectingSource)!.x + 190,
                nodes.find(n => n.id === connectingSource)!.y + 50,
                mousePos.x,
                mousePos.y
            )} 
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="3" 
            strokeDasharray="5,5" 
            className="animate-pulse"
          />
        )}
      </svg>

      {/* Nodes */}
      {nodes.map((node) => (
        <div
          key={node.id}
          className={`absolute z-20 w-[180px] bg-white rounded-lg shadow-md border-2 transition-shadow hover:shadow-xl group
            ${node.type === NodeType.OUTPUT ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}
            ${node.type === NodeType.CALC ? 'border-orange-200 bg-orange-50' : ''}
          `}
          style={{ 
            left: node.x, 
            top: node.y,
            cursor: draggingNode === node.id ? 'grabbing' : 'grab'
          }}
          onMouseDown={(e) => handleMouseDown(e, node.id)}
        >
          {/* Header */}
          <div className={`px-3 py-2 border-b text-xs font-bold uppercase tracking-wider flex justify-between items-center rounded-t-md select-none
             ${node.type === NodeType.OUTPUT ? 'bg-blue-500 text-white border-blue-600' : 'bg-slate-100 text-slate-600 border-slate-200'}
             ${node.type === NodeType.CALC ? '!bg-orange-100 !text-orange-700 !border-orange-200' : ''}
          `}>
            {node.label}
            {node.type === NodeType.CALC && <Settings size={12} />}
          </div>

          {/* Body */}
          <div className="p-4 space-y-2 relative min-h-[80px] flex flex-col justify-center">
            
            {/* Input Port (Left) - BIG BUTTON */}
            {node.id !== 'departure' && (
              <div 
                className="absolute -left-5 top-1/2 -translate-y-1/2 z-30 group/port"
                onMouseDown={(e) => e.stopPropagation()} /* STOP DRAG HERE */
                onClick={(e) => handlePortClick(e, node.id, true)}
                title="Input: Connect logic TO here"
              >
                {/* Visual Circle */}
                <div className="w-8 h-8 rounded-full bg-slate-50 border-2 border-slate-400 flex items-center justify-center shadow-sm group-hover/port:bg-blue-500 group-hover/port:border-blue-600 group-hover/port:scale-110 transition-all">
                    <ArrowRight size={16} className="text-slate-400 group-hover/port:text-white" />
                </div>
                {/* Hit Area Extender */}
                <div className="absolute inset-0 w-12 h-12 -translate-x-2 -translate-y-2 bg-transparent cursor-pointer rounded-full" />
              </div>
            )}

            {/* Content */}
            <div className="text-xs text-slate-500 mb-1 leading-tight text-center">{node.description}</div>
            
            {node.type === NodeType.INPUT && (
              <div className="flex items-center gap-1">
                {node.options ? (
                  <select 
                    className="w-full text-sm p-2 border border-slate-300 rounded bg-white shadow-inner focus:ring-2 focus:ring-blue-500 outline-none"
                    value={node.value}
                    onChange={(e) => onUpdateNode(node.id, e.target.value)}
                  >
                    {node.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <>
                    <input 
                      type={node.category === 'TIME' ? 'time' : 'number'}
                      className="w-full text-sm p-2 border border-slate-300 rounded bg-white shadow-inner focus:ring-2 focus:ring-blue-500 outline-none font-bold text-center text-slate-700"
                      value={node.value}
                      onChange={(e) => onUpdateNode(node.id, e.target.value)}
                    />
                    {node.unit && <span className="absolute right-6 top-[60%] -translate-y-1/2 text-xs text-slate-400 font-mono pointer-events-none">{node.unit}</span>}
                  </>
                )}
              </div>
            )}

            {node.type === NodeType.CALC && (
               <div className="text-center py-1 font-mono text-sm text-orange-600 bg-orange-100/50 rounded border border-orange-100">
                 自动计算中...
               </div>
            )}
            
            {node.type === NodeType.OUTPUT && (
               <div className="text-center py-2 font-black text-2xl text-blue-600 bg-blue-50 rounded border border-blue-100">
                 {node.value}
               </div>
            )}

            {/* Output Port (Right) - BIG BUTTON */}
            {node.type !== NodeType.OUTPUT && (
              <div 
                className="absolute -right-5 top-1/2 -translate-y-1/2 z-30 group/port"
                onMouseDown={(e) => e.stopPropagation()} /* STOP DRAG HERE */
                onClick={(e) => handlePortClick(e, node.id, false)}
                title="Output: Connect logic FROM here"
              >
                 {/* Visual Circle */}
                 <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-sm transition-all group-hover/port:scale-110
                    ${connectingSource === node.id 
                        ? 'bg-blue-600 border-blue-400 ring-4 ring-blue-200 animate-pulse' 
                        : 'bg-slate-50 border-slate-400 group-hover/port:bg-blue-500 group-hover/port:border-blue-600'
                    }
                 `}>
                    <div className={`w-2 h-2 rounded-full ${connectingSource === node.id ? 'bg-white' : 'bg-slate-400 group-hover/port:bg-white'}`} />
                 </div>
                 {/* Hit Area Extender */}
                 <div className="absolute inset-0 w-12 h-12 -translate-x-2 -translate-y-2 bg-transparent cursor-pointer rounded-full" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};