import React from 'react';
import { SimulationResult } from '../types';
import { Play, RotateCcw, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface SimulationPanelProps {
  results: SimulationResult[];
  onRun: () => void;
  onReset: () => void;
  isRunning: boolean;
  decisionPrompt: string; // New prop for the question text
  correctAnswer: string;
  userAnswer: string;
  options: string[];
  onSelectAnswer: (ans: string) => void;
  isSuccess: boolean | null;
  checkResult: () => void;
  isLastLevel?: boolean;
}

export const SimulationPanel: React.FC<SimulationPanelProps> = ({
  results,
  onRun,
  onReset,
  isRunning,
  decisionPrompt,
  correctAnswer,
  userAnswer,
  options,
  onSelectAnswer,
  isSuccess,
  checkResult,
  isLastLevel = false
}) => {
  // Process data for Chart
  const chartData = results.map(r => ({
    run: `T${r.runId}`,
    minutes: r.travelDurationMinutes
  }));

  const avgTime = results.length > 0 
    ? Math.round(results.reduce((acc, curr) => acc + curr.travelDurationMinutes, 0) / results.length) 
    : 0;

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 shadow-xl w-96 flex-shrink-0 z-20">
      <div className="p-4 bg-slate-800 text-white flex items-center justify-between">
        <h2 className="font-bold text-lg flex items-center gap-2">
            <Activity size={20} className="text-green-400" />
            模拟控制台
        </h2>
        <span className="text-xs font-mono bg-slate-700 px-2 py-1 rounded text-slate-300">
            Runs: {results.length}
        </span>
      </div>

      {/* Controls */}
      <div className="p-4 grid grid-cols-2 gap-3 border-b border-slate-100 bg-slate-50">
        <button
          onClick={onRun}
          disabled={isRunning}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg font-bold shadow-sm transition-all active:scale-95"
        >
          <Play size={18} fill="currentColor" />
          运行模拟
        </button>
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 py-2 px-4 rounded-lg font-semibold transition-all active:scale-95"
        >
          <RotateCcw size={18} />
          重置数据
        </button>
      </div>

      {/* Visualization */}
      <div className="flex-1 p-4 overflow-y-auto min-h-0">
        {results.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
            <Activity size={48} strokeWidth={1} />
            <p>点击运行以生成数据</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
               <div className="text-xs text-blue-500 font-bold uppercase mb-1">模拟摘要</div>
               <div className="flex justify-between items-end">
                 <div>
                    <span className="text-2xl font-black text-blue-700">{avgTime}</span>
                    <span className="text-sm text-blue-600 ml-1">分钟 (平均耗时)</span>
                 </div>
                 <div className="text-right">
                    <div className="text-xs text-blue-400">最新到达</div>
                    <div className="font-mono font-bold text-blue-700">{results[results.length-1].arrivalTime}</div>
                 </div>
               </div>
            </div>

            {/* Chart */}
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="run" tick={{fontSize: 10}} interval={0} />
                  <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                    itemStyle={{fontSize: '12px', color: '#334155'}}
                    cursor={{fill: '#f1f5f9'}}
                  />
                  <ReferenceLine y={avgTime} stroke="#f59e0b" strokeDasharray="3 3" />
                  <Bar dataKey="minutes" fill="#3b82f6" radius={[4, 4, 0, 0]} animationDuration={300} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-center text-[10px] text-slate-400 mt-1">耗时波动 (分钟)</p>
            </div>

            {/* Log List */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">运行记录 (倒序)</h3>
              <div className="space-y-2">
                {[...results].reverse().slice(0, 5).map((r) => (
                  <div key={r.runId} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded border border-slate-100 animate-fadeIn">
                    <span className="font-mono text-slate-400 text-xs">#{r.runId}</span>
                    <span className="font-medium text-slate-700">{r.details}</span>
                    <span className="font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded text-xs">{r.arrivalTime}</span>
                  </div>
                ))}
                {results.length > 5 && <div className="text-center text-xs text-slate-400 italic">... 更多数据隐藏</div>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Answer Section */}
      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <h3 className="font-bold text-sm text-slate-800 mb-3">{decisionPrompt}</h3>
        <div className="grid grid-cols-2 gap-2 mb-3">
            {options.map(opt => (
                <button
                    key={opt}
                    onClick={() => onSelectAnswer(opt)}
                    className={`py-2 px-1 text-sm rounded border font-medium transition-all
                        ${userAnswer === opt 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-200 ring-offset-1' 
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                        }
                    `}
                >
                    {opt}
                </button>
            ))}
        </div>
        <button 
            onClick={checkResult}
            disabled={!userAnswer}
            className={`w-full py-3 rounded-lg font-bold text-white transition-all shadow-lg
                ${isSuccess === true ? 'bg-green-500 pointer-events-none' : 
                  isSuccess === false ? 'bg-red-500 animate-pulse' :
                  !userAnswer ? 'bg-slate-300' : 'bg-slate-800 hover:bg-slate-900'
                }
            `}
        >
            {isSuccess === true 
                ? (isLastLevel ? '恭喜通关！全部完成' : '回答正确！下一关') 
                : isSuccess === false 
                    ? '回答错误，再想想' 
                    : '提交结论'
            }
        </button>
      </div>
    </div>
  );
};