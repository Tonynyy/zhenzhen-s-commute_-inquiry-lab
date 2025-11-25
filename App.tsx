import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { NodeGraph } from './components/NodeGraph';
import { SimulationPanel } from './components/SimulationPanel';
import { LEVELS } from './constants';
import { NodeData, Connection, SimulationResult } from './types';
import { runSimulation, validateGraph } from './utils';
import { GraduationCap, AlertCircle, Info, Lock } from 'lucide-react';

const App: React.FC = () => {
  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [maxReachedLevel, setMaxReachedLevel] = useState(1); // Track max progress
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  // Game State
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [notification, setNotification] = useState<{msg: string, type: 'error' | 'info'} | null>(null);

  // Ref for simulation interval to clear it properly on reset
  const simulationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const levelConfig = LEVELS.find(l => l.id === currentLevelId) || LEVELS[0];

  // Initialize Level
  useEffect(() => {
    if (currentLevelId === 1) {
      // Reset completely for Level 1
      const initialNodes = levelConfig.availableNodes.map(n => ({...n}));
      setNodes(initialNodes);
      setConnections([]);
      setResults([]);
      setUserAnswer('');
      setIsSuccess(null);
      setNotification({ msg: `第 ${currentLevelId} 关开始！请根据提示构建模型。`, type: 'info' });
    } else {
      // For subsequent levels, merge new nodes and KEEP connections
      setNodes(prevNodes => {
        const existingIds = new Set(prevNodes.map(n => n.id));
        const newNodes = levelConfig.availableNodes
          .filter(n => !existingIds.has(n.id))
          .map(n => ({...n}));
        return [...prevNodes, ...newNodes];
      });
      
      // Logic for Level Transition
      if (currentLevelId === 6) {
        // Special Case: Level 6 is the "Conclusion" of Level 5.
        // DO NOT clear results. Keep the data on screen so user can answer the question.
        setUserAnswer('');
        setIsSuccess(null);
        setNotification({ msg: `最后一步！请根据已有的模拟数据得出结论。`, type: 'info' });
      } else {
        // Normal Level Change: Clear previous results
        setResults([]);
        setUserAnswer('');
        setIsSuccess(null);
        setNotification({ msg: `第 ${currentLevelId} 关！请继续完善模型。`, type: 'info' });
      }
    }
    
    // Auto-clear notification
    const timer = setTimeout(() => setNotification(null), 3000);
    return () => clearTimeout(timer);
  }, [currentLevelId]);

  // Node Handlers
  const handleUpdateNode = useCallback((id: string, value: string | number) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, value } : n));
  }, []);

  const handleNodeMove = useCallback((id: string, x: number, y: number) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
  }, []);

  const handleConnect = useCallback((source: string, target: string) => {
    // Prevent duplicates and loops
    setConnections(prev => {
      if (prev.some(c => c.source === source && c.target === target)) return prev;
      if (source === target) return prev;
      return [...prev, { id: `${source}-${target}`, source, target }];
    });
  }, []);

  const handleDisconnect = useCallback((id: string) => {
    setConnections(prev => prev.filter(c => c.id !== id));
  }, []);

  // Simulation
  const handleRun = () => {
    // Prevent multiple runs at same time
    if (isRunning) return;

    // 1. Structural Validation: Are required connections made?
    const isValid = validateGraph(connections, levelConfig.requiredConnections);
    
    if (!isValid) {
      setNotification({ msg: "模型连接似乎不完整或不正确，请参考真真的提示。", type: 'error' });
      return;
    }

    // 2. Logic/Parameter Validation
    
    // Level 4 Check: Weather -> Speed
    if (currentLevelId === 4) {
        const weatherNode = nodes.find(n => n.id === 'weather');
        const speedNode = nodes.find(n => n.id === 'speed');
        
        if (weatherNode && speedNode) {
            const isRaining = weatherNode.value === '下雨';
            const speed = Number(speedNode.value);
            
            // User must manually set speed to approx 16
            if (isRaining && (speed > 17 || speed < 15)) {
                setNotification({ msg: "逻辑错误：下雨天车速应该是平时的80% (20 x 0.8)，请修改【行车速度】数值！", type: 'error' });
                return;
            }
        }
    }

    // Level 5 & 6 Check: Departure -> Congestion
    if (currentLevelId >= 5) {
        const depNode = nodes.find(n => n.id === 'departure');
        const congNode = nodes.find(n => n.id === 'congestion');

        if (depNode && congNode) {
            // Task requirement: 8:00 departure
            if (depNode.value !== '08:00') {
                setNotification({ msg: "题目要求模拟 8:00 出发的情况，请修改出发时间。", type: 'error' });
                return;
            }

            // Task requirement: Manually set congestion
            if (depNode.value === '08:00' && congNode.value === '通畅') {
                 setNotification({ msg: "8:00出发属于早高峰，请手动将【交通拥堵】设置为'拥堵'！", type: 'error' });
                 return;
            }
        }
    }

    setIsRunning(true);
    setResults([]); // Clear previous runs

    // Animate the runs
    let count = 0;
    
    if (simulationInterval.current) clearInterval(simulationInterval.current);

    simulationInterval.current = setInterval(() => {
      count++;
      // We run one iteration per interval step
      const runResult = runSimulation(nodes, connections, 1, currentLevelId)[0];
      
      setResults(prev => [...prev, runResult]);
      
      // Update the graph visualization (update final node value AND any forced physics updates like congestion)
      setNodes(prevNodes => prevNodes.map(n => {
        // Update Arrival Time Node
        if (n.id === 'arrival') {
            return { ...n, value: runResult.arrivalTime };
        }
        return n;
      }));

      if (count >= 5) {
        if (simulationInterval.current) clearInterval(simulationInterval.current);
        simulationInterval.current = null;
        setIsRunning(false);
      }
    }, 200); // Speed of simulation
  };

  const handleReset = () => {
    // Clear any active interval
    if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
        simulationInterval.current = null;
    }
    setIsRunning(false); // Force stop
    setResults([]);
    setNodes(prev => prev.map(n => n.id === 'arrival' ? { ...n, value: '--:--' } : n));
    setIsSuccess(null);
    setUserAnswer('');
  };

  const handleCheckResult = () => {
    if (userAnswer === levelConfig.correctAnswer) {
      setIsSuccess(true);
      
      // Unlock next level logic
      if (currentLevelId === maxReachedLevel && currentLevelId < LEVELS.length) {
          setMaxReachedLevel(curr => curr + 1);
      }

      setTimeout(() => {
        if (currentLevelId < LEVELS.length) {
            setCurrentLevelId(curr => curr + 1);
        } else {
            // Final Level Complete - Show notification instead of trying to go to next
            setNotification({ msg: "恭喜！所有探究任务圆满完成！", type: 'info' });
        }
      }, 1500);
    } else {
      setIsSuccess(false);
      setNotification({ msg: "结论似乎不太对，观察一下模拟数据？", type: 'error' });
      setTimeout(() => {
          setIsSuccess(null);
          setNotification(null);
      }, 2000);
    }
  };

  const handleLevelJump = (id: number) => {
      // Only allow jumping to levels that have been reached
      if (id <= maxReachedLevel) {
          setCurrentLevelId(id);
      }
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-blue-200 shadow-lg">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg leading-tight">Zhenzhen's Commute Lab</h1>
            <p className="text-xs text-slate-500 font-medium">综合学科探究测试</p>
          </div>
        </div>
        
        <div className="absolute left-1/2 -translate-x-1/2 bg-slate-100 rounded-full px-6 py-2 flex items-center gap-4">
             {LEVELS.map(l => {
                 const isLocked = l.id > maxReachedLevel;
                 return (
                 <button 
                    key={l.id} 
                    onClick={() => handleLevelJump(l.id)}
                    disabled={isLocked}
                    className={`flex items-center gap-2 transition-all relative
                        ${isLocked ? 'cursor-not-allowed opacity-40 grayscale' : 'hover:scale-110 active:scale-95 cursor-pointer'}
                    `}
                    title={isLocked ? "关卡未解锁" : `跳转到关卡 ${l.id}`}
                 >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                        ${currentLevelId === l.id ? 'bg-blue-600 text-white shadow-md scale-110' : 
                          l.id < maxReachedLevel ? 'bg-green-500 text-white' : 
                          'bg-slate-300 text-slate-600'
                        }`}>
                        {isLocked ? <Lock size={12} /> : l.id}
                    </div>
                 </button>
             )})}
        </div>

        <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-md">
                Level {currentLevelId}: {levelConfig.title}
            </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Sidebar */}
        <Sidebar clues={levelConfig.clues} />

        {/* Center Canvas */}
        <main className="flex-1 relative bg-slate-50">
           <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white/90 backdrop-blur border border-slate-200 shadow-sm rounded-lg p-4 max-w-xl w-full text-center">
               <h3 className="font-bold text-slate-800 mb-1 flex justify-center items-center gap-2">
                   <Info size={16} className="text-blue-500"/> 
                   本关任务
               </h3>
               <p className="text-sm text-slate-600">{levelConfig.question}</p>
           </div>

           <NodeGraph 
             nodes={nodes}
             connections={connections}
             onUpdateNode={handleUpdateNode}
             onConnect={handleConnect}
             onDisconnect={handleDisconnect}
             onNodeMove={handleNodeMove}
           />

           {/* Toast Notification */}
           {notification && (
               <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-xl text-white font-medium flex items-center gap-2 animate-bounce z-50
                   ${notification.type === 'error' ? 'bg-red-500' : 'bg-blue-600'}
               `}>
                   <AlertCircle size={20} />
                   {notification.msg}
               </div>
           )}
        </main>

        {/* Right Panel */}
        <SimulationPanel 
            results={results}
            onRun={handleRun}
            onReset={handleReset}
            isRunning={isRunning}
            decisionPrompt={levelConfig.decisionPrompt || "你认为真真能准时到达吗？"}
            correctAnswer={levelConfig.correctAnswer}
            userAnswer={userAnswer}
            options={levelConfig.options}
            onSelectAnswer={setUserAnswer}
            isSuccess={isSuccess}
            checkResult={handleCheckResult}
            isLastLevel={currentLevelId === LEVELS.length}
        />
      </div>
    </div>
  );
};

export default App;