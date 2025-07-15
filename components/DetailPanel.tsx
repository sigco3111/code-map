import React, { useMemo } from 'react';
import { NodeTypeIcon, CloseIcon } from './icons.tsx';
import { TreeNode, NodeType } from '../types.ts';
import * as d3 from 'd3';

interface DetailPanelProps {
  node: d3.HierarchyPointNode<TreeNode> | null;
  onClose: () => void;
  files: {path: string, content: string}[] | null;
}

const formatNodeType = (type: NodeType) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const cleanId = (id: string = ''): string => {
    if (!id.includes(':')) return id;
    const parts = id.split(':');
    const name = parts.pop();
    const type = parts[0];
    
    if (type === 'file' || type === 'dir') {
        return name || id;
    }
    return name || id;
}

const getComplexityColor = (score: number): string => {
    if (score <= 5) return 'text-green-400';
    if (score <= 15) return 'text-yellow-400';
    return 'text-red-400';
};

const SnippetViewer: React.FC<{node: TreeNode, files: {path: string, content: string}[]}> = ({ node, files }) => {
    const snippetInfo = useMemo(() => {
        if (!node.loc || !node.path || !files) return null;
        const file = files.find(f => f.path === node.path);
        if (!file) return null;

        const lines = file.content.split('\n');
        const { start, end } = node.loc;
        const context = 2;
        const startLine = Math.max(0, start.line - 1 - context);
        const endLine = Math.min(lines.length, end.line + context);
        
        const extractedLines = lines.slice(startLine, endLine).map((line, index) => {
            const lineNumber = startLine + 1 + index;
            return {
                number: lineNumber,
                content: line,
                isHighlighted: lineNumber >= start.line && lineNumber <= end.line,
            };
        });
        
        return extractedLines;

    }, [node, files]);

    if (!snippetInfo) return null;

    return (
        <div className="mt-4">
            <h3 className="text-gray-400 text-xs uppercase font-semibold mb-2">Code Snippet</h3>
            <div className="bg-gray-900/70 p-3 rounded-lg text-xs overflow-x-auto">
                {snippetInfo.map(line => (
                    <div key={line.number} className={`flex gap-4 ${line.isHighlighted ? 'bg-sky-900/30' : ''}`}>
                        <span className="w-8 text-right text-gray-500 select-none">{line.number}</span>
                        <pre className="flex-1 text-gray-300"><code>{line.content}</code></pre>
                    </div>
                ))}
            </div>
        </div>
    );
};


export const DetailPanel: React.FC<DetailPanelProps> = ({ node, onClose, files }) => {
  if (!node) {
    return null;
  }

  const { name, type, path, dependencies, dependents, isCyclic, isUnused, instability, cognitiveComplexity } = node.data;
  const hasDependencyInfo = (dependencies && dependencies.length > 0) || (dependents && dependents.length > 0);

  const instabilityPercentage = typeof instability === 'number' ? instability * 100 : 0;

  return (
    <aside className="w-96 flex-shrink-0 bg-gray-800/50 rounded-lg border border-gray-700 flex flex-col">
      <header className="p-4 border-b border-gray-700 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 text-lg font-bold text-white min-w-0">
          <span className="flex-shrink-0 text-gray-300">
            <NodeTypeIcon type={type} />
          </span>
          <span className="truncate" title={name}>{name}</span>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white flex-shrink-0">
          <CloseIcon />
        </button>
      </header>

      <div className="flex-grow p-4 overflow-y-auto font-mono text-sm">
        <div className="space-y-5">
            {isCyclic && type === 'file' && (
                <div className="p-2 bg-red-900/50 border border-red-500/70 rounded-lg text-red-300 text-xs">
                    <strong className="font-semibold">순환 종속성 경고:</strong><br />이 파일은 순환 종속성 고리의 일부입니다.
                </div>
            )}
            {isUnused && (
                 <div className="p-2 bg-yellow-900/50 border border-yellow-500/70 rounded-lg text-yellow-300 text-xs">
                    <strong className="font-semibold">미사용 코드 알림:</strong><br />Export된 이 코드는 외부에서 사용되지 않는 것으로 보입니다.
                </div>
            )}
          <div>
            <h3 className="text-gray-400 text-xs uppercase font-semibold mb-2">유형</h3>
            <p className="text-gray-200 bg-gray-700/50 rounded px-2 py-1 inline-block">{formatNodeType(type)}</p>
          </div>

          {path && (
            <div>
              <h3 className="text-gray-400 text-xs uppercase font-semibold mb-2">경로</h3>
              <p className="text-gray-200 break-words">{path}</p>
            </div>
          )}

          {typeof cognitiveComplexity === 'number' && (
            <div>
                <h3 className="text-gray-400 text-xs uppercase font-semibold mb-2" title="코드의 이해 및 유지보수 어려움을 나타내는 지표입니다. 낮을수록 좋습니다. (JS/TS는 정확, 기타 언어는 근사치)">
                    인지 복잡도
                </h3>
                <p className={`text-2xl font-bold ${getComplexityColor(cognitiveComplexity)}`}>
                    {cognitiveComplexity}
                </p>
                <p className="text-gray-300 text-xs mt-1">
                    {cognitiveComplexity <= 5 ? '매우 관리하기 쉬운 코드입니다.' : cognitiveComplexity <= 15 ? '약간의 복잡성이 있습니다.' : '복잡성이 높아 리팩토링을 권장합니다.'}
                </p>
            </div>
          )}

          {type === 'file' && typeof instability === 'number' && (
            <div>
                <h3 className="text-gray-400 text-xs uppercase font-semibold mb-2">안정성 지표 (Instability)</h3>
                <div className="w-full bg-gray-700 rounded-full h-2.5 my-1" title={`불안정성: ${instability.toFixed(3)}\n0에 가까울수록 안정적, 1에 가까울수록 불안정합니다.`}>
                    <div
                        className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-2.5 rounded-full"
                        style={{ width: `${instabilityPercentage}%` }}
                    ></div>
                </div>
                <p className="text-gray-300 text-xs">{instability.toFixed(3)}</p>
            </div>
          )}
          
          {hasDependencyInfo && (
            <div className="border-t border-gray-700 pt-5 mt-5">
                {dependencies && dependencies.length > 0 && (
                    <div className="mb-4">
                    <h3 className="text-gray-400 text-xs uppercase font-semibold mb-2">이 노드가 사용하는 것 (Dependencies): {dependencies.length}</h3>
                    <ul className="text-sky-400 list-disc list-inside space-y-1 text-xs">
                        {dependencies.map(dep => <li key={dep} className="truncate" title={dep}>{cleanId(dep)}</li>)}
                    </ul>
                    </div>
                )}
                {dependents && dependents.length > 0 && (
                    <div>
                    <h3 className="text-gray-400 text-xs uppercase font-semibold mb-2">이 노드를 사용하는 것 (Dependents): {dependents.length}</h3>
                    <ul className="text-emerald-400 list-disc list-inside space-y-1 text-xs">
                        {dependents.map(dep => <li key={dep} className="truncate" title={dep}>{cleanId(dep)}</li>)}
                    </ul>
                    </div>
                )}
            </div>
          )}
          {node.data.loc && files && <SnippetViewer node={node.data} files={files} />}
        </div>
      </div>
    </aside>
  );
};