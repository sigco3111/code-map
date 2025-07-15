
import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { parseProject } from './services/parser.ts';
import { CodeMap } from './components/CodeMap.tsx';
import { DetailPanel } from './components/DetailPanel.tsx';
import { SearchIcon, NodeTypeIcon } from './components/icons.tsx';
import type { TreeNode, HeatmapMode } from './types.ts';

// Augment React's InputHTMLAttributes to include non-standard directory-related properties
declare module 'react' {
    interface InputHTMLAttributes<T> extends React.HTMLAttributes<T> {
      webkitdirectory?: string;
      directory?: string;
    }
}

const Header = () => (
    <header className="p-4 border-b border-gray-700 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M10 20v-6m0 0v-6m0 6H4m6 0h6"/><path d="M7 7h.01"/><path d="M17 7h.01"/><path d="M7 17h.01"/><path d="M17 17h.01"/></svg>
        </div>
        <div>
            <h1 className="text-xl font-bold text-white">코드맵 생성기</h1>
            <p className="text-sm text-gray-400">프로젝트 코드 구조를 즉시 시각화하세요</p>
        </div>
    </header>
);

const Footer = () => (
    <footer className="text-center p-4 text-xs text-gray-500 border-t border-gray-700">
        시니어 프론트엔드 리액트 엔지니어 제작. 클라이언트 측에서만 처리됩니다. 코드는 브라우저를 벗어나지 않습니다.
    </footer>
);


const App: React.FC = () => {
  const [mapData, setMapData] = useState<TreeNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<d3.HierarchyPointNode<TreeNode> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileContents, setFileContents] = useState<{path: string, content: string}[] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<d3.HierarchyNode<TreeNode>[]>([]);
  const [allNodes, setAllNodes] = useState<d3.HierarchyNode<TreeNode>[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMinimapEnabled, setIsMinimapEnabled] = useState(true);
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('none');

  const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      setError('폴더에서 파일을 찾을 수 없습니다.');
      return;
    }

    setError(null);
    setIsLoading(true);
    setMapData(null);
    setSelectedNode(null);
    setFileContents(null);
    setAllNodes([]);

    setTimeout(async () => {
        try {
            const readFiles = await Promise.all(
                Array.from(files).map(file => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            resolve({
                                path: (file as any).webkitRelativePath,
                                content: e.target?.result as string,
                            });
                        };
                        reader.onerror = (e) => reject(e);
                        reader.readAsText(file);
                    });
                })
            );
            
            setFileContents(readFiles as {path: string, content: string}[]);

            const data = parseProject(readFiles as {path: string, content: string}[]);
            if (!data.children || data.children.length === 0) {
              setError("분석할 수 있는 지원되는 파일(예: .js, .ts, .py, .java, .c, .cpp, .h, .m, .mm, .swift, .kt, .go, .rs)이 폴더에 없습니다.");
              setMapData(null);
            } else {
              setMapData(data);
              const root = d3.hierarchy(data);
              setAllNodes(root.descendants());
            }
        } catch (e) {
            setError('프로젝트 분석에 실패했습니다. 자세한 내용은 콘솔을 확인해주세요.');
            console.error(e);
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
        }
    }, 50);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.length > 1) {
        const results = allNodes.filter(node => 
            node.data.name.toLowerCase().includes(term.toLowerCase()) && 
            node.data.type !== 'directory'
        );
        setSearchResults(results);
    } else {
        setSearchResults([]);
    }
  };
  
  const handleSearchResultClick = (node: d3.HierarchyNode<TreeNode>) => {
    setSelectedNode(node as d3.HierarchyPointNode<TreeNode>);
    setSearchTerm('');
    setSearchResults([]);
    setIsSearchFocused(false);
  };

  const triggerFolderSelect = () => fileInputRef.current?.click();
  
  const handleNodeSelect = useCallback((node: d3.HierarchyPointNode<TreeNode>) => {
    setSelectedNode(node);
  }, []);
  
  const handlePanelClose = useCallback(() => {
    setSelectedNode(null);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-200">
      <Header />
      <main className="flex-grow flex flex-col p-4 gap-4 overflow-hidden">
        <div className="flex-shrink-0 flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700 shadow-md gap-4">
            <h2 className="font-semibold text-lg text-white flex-shrink-0">프로젝트 시각화</h2>
            <div className="relative w-full max-w-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon />
                </div>
                <input
                    type="text"
                    placeholder="파일, 함수, 클래스 검색..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)} // Delay to allow click
                    className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    disabled={!mapData}
                />
                {isSearchFocused && searchResults.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-80 overflow-y-auto">
                        {searchResults.map(node => (
                            <li
                                key={node.data.uniqueId}
                                onMouseDown={() => handleSearchResultClick(node)}
                                className="px-4 py-2 hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                            >
                                <span className="text-gray-400"><NodeTypeIcon type={node.data.type} /></span>
                                <span className="text-white">{node.data.name}</span>
                                <span className="text-xs text-gray-500 truncate ml-auto">{node.data.path}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                    <label htmlFor="heatmap-select" className="text-sm font-medium text-gray-300 whitespace-nowrap">히트맵 모드</label>
                    <select
                        id="heatmap-select"
                        value={heatmapMode}
                        onChange={(e) => setHeatmapMode(e.target.value as HeatmapMode)}
                        disabled={!mapData || isLoading}
                        className="bg-gray-900 border border-gray-600 rounded-md py-1.5 pl-2 pr-8 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm disabled:opacity-50"
                    >
                        <option value="none">끄기</option>
                        <option value="complexity">인지 복잡도</option>
                        <option value="instability">불안정성</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-300">미니맵</span>
                    <button
                        onClick={() => setIsMinimapEnabled(!isMinimapEnabled)}
                        disabled={!mapData}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                            isMinimapEnabled ? 'bg-blue-600' : 'bg-gray-600'
                        }`}
                        aria-pressed={isMinimapEnabled}
                    >
                        <span className="sr-only">미니맵 토글</span>
                        <span
                            aria-hidden="true"
                            className={`inline-block h-5 w-5 rounded-full bg-white shadow-lg transform ring-0 transition ease-in-out duration-200 ${
                                isMinimapEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                     <input 
                         type="file" 
                         ref={fileInputRef} 
                         onChange={handleFolderUpload} 
                         className="hidden" 
                         webkitdirectory=""
                         directory=""
                     />
                     <button 
                         onClick={triggerFolderSelect} 
                         disabled={isLoading}
                         className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400"
                     >
                         {isLoading ? '분석 중...' : '프로젝트 폴더 선택'}
                     </button>
                </div>
            </div>
        </div>
        
        <div className="flex-grow flex gap-4 overflow-hidden">
            <div className="flex-grow bg-gray-800 rounded-lg border border-gray-700 shadow-lg overflow-hidden relative">
                {error && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-red-400 p-4 text-center whitespace-pre-wrap">{error}</p>
                  </div>
                )}
                {!error && isLoading && (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                  </div>
                )}
                {!error && !isLoading && mapData && (
                  <CodeMap data={mapData} selectedNode={selectedNode} onNodeSelect={handleNodeSelect} isMinimapEnabled={isMinimapEnabled} heatmapMode={heatmapMode} />
                )}
                 {!error && !isLoading && !mapData && (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-gray-600"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.23A2 2 0 0 0 8.27 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path></svg>
                      <h3 className="text-lg font-semibold text-gray-400">프로젝트 맵이 여기에 표시됩니다</h3>
                      <p className="max-w-sm mt-2">"프로젝트 폴더 선택" 버튼을 클릭하여 분석할 폴더를 선택하세요. 전체 코드베이스의 시각적 맵이 생성됩니다.</p>
                  </div>
                )}
              </div>
              <DetailPanel node={selectedNode} onClose={handlePanelClose} files={fileContents} />
        </div>
        
      </main>
      <Footer />
    </div>
  );
};

export default App;