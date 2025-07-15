
import React, { useMemo, useState, useRef, useLayoutEffect, useEffect } from 'react';
import * as d3 from 'd3';
import { TreeNode, NodeType, HeatmapMode } from '../types.ts';
import { NodeTypeIcon } from './icons.tsx';

interface CodeMapProps {
  data: TreeNode;
  selectedNode: d3.HierarchyPointNode<TreeNode> | null;
  onNodeSelect: (node: d3.HierarchyPointNode<TreeNode>) => void;
  isMinimapEnabled: boolean;
  heatmapMode: HeatmapMode;
}

const getNodeColor = (type: NodeType) => {
  switch (type) {
    case 'directory': return 'text-teal-400';
    case 'file': return 'text-gray-400';
    case 'class': return 'text-purple-400';
    case 'function': return 'text-blue-400';
    case 'arrow_function': return 'text-cyan-400';
    case 'import': return 'text-green-400';
    case 'export': return 'text-yellow-400';
    case 'variable': return 'text-orange-400';
    default: return 'text-gray-500';
  }
};

const complexityColorScale = d3.scaleSequential(d3.interpolateRgbBasis(["hsl(120, 80%, 40%)", "hsl(60, 90%, 50%)", "hsl(0, 100%, 50%)"])).domain([0, 30]);
const instabilityColorScale = d3.scaleSequential(d3.interpolateRgbBasis(["hsl(120, 80%, 40%)", "hsl(0, 100%, 50%)"])).domain([0, 1]);

const getHeatmapStyle = (nodeData: TreeNode, mode: HeatmapMode): React.CSSProperties => {
    if (mode === 'complexity' && typeof nodeData.cognitiveComplexity === 'number') {
        return { backgroundColor: complexityColorScale(nodeData.cognitiveComplexity) };
    }
    if (mode === 'instability' && nodeData.type === 'file' && typeof nodeData.instability === 'number') {
        return { backgroundColor: instabilityColorScale(nodeData.instability) };
    }
    return {};
};

interface NodeProps {
    node: d3.HierarchyPointNode<TreeNode>;
    onToggle: (node: d3.HierarchyPointNode<TreeNode>) => void;
    onSelect: (node: d3.HierarchyPointNode<TreeNode>) => void;
    isSelected: boolean;
    heatmapMode: HeatmapMode;
}

const Node: React.FC<NodeProps> = ({ node, onToggle, onSelect, isSelected, heatmapMode }) => {
  const hasChildren = !!node.data.children?.length || !!node.data._children?.length;
  const { isCyclic, isUnused } = node.data;
  const heatmapStyle = useMemo(() => getHeatmapStyle(node.data, heatmapMode), [node.data, heatmapMode]);
  
  return (
    <div
      className="absolute transition-all duration-500 ease-in-out group"
      style={{ top: `${node.x}px`, left: `${node.y}px`, transform: 'translate(-50%, -50%)' }}
    >
      <div 
        onClick={() => onSelect(node)}
        style={heatmapStyle}
        className={`flex items-center p-2 rounded-lg bg-gray-800 shadow-md border cursor-pointer hover:bg-gray-700 hover:border-sky-500 transform hover:scale-105 transition-all duration-200 ${getNodeColor(node.data.type)} ${isUnused ? 'opacity-50' : ''} ${isSelected ? 'border-sky-400 ring-2 ring-offset-2 ring-offset-gray-900 ring-sky-400' : isCyclic ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-700'}`}>
        <NodeTypeIcon type={node.data.type} />
        <span className="ml-2 text-sm text-gray-200 font-mono whitespace-nowrap">
          {node.data.name.length > 30 ? `${node.data.name.substring(0, 27)}...` : node.data.name}
        </span>
        {hasChildren && (
          <button onClick={(e) => { e.stopPropagation(); onToggle(node); }} className="ml-2 text-gray-500 hover:text-white focus:outline-none z-10">
             {node.children ? '[-]' : '[+]'}
          </button>
        )}
      </div>
    </div>
  );
};

const HeatmapLegend: React.FC<{ mode: HeatmapMode }> = ({ mode }) => {
    if (mode === 'none') return null;

    const legendInfo = {
        complexity: {
            title: '인지 복잡도',
            gradient: 'linear-gradient(to right, hsl(120, 80%, 40%), hsl(60, 90%, 50%), hsl(0, 100%, 50%))',
            min: '낮음',
            max: '높음',
        },
        instability: {
            title: '불안정성',
            gradient: 'linear-gradient(to right, hsl(120, 80%, 40%), hsl(0, 100%, 50%))',
            min: '안정',
            max: '불안정',
        }
    };

    const info = legendInfo[mode as keyof typeof legendInfo];
    if (!info) return null;

    return (
        <div className="absolute bottom-4 right-4 bg-gray-900/80 border border-gray-700 rounded-lg shadow-2xl backdrop-blur-sm p-3 text-white text-xs w-48 pointer-events-none">
            <h4 className="font-bold mb-2 text-center">{info.title}</h4>
            <div className="h-4 w-full rounded" style={{ background: info.gradient }} />
            <div className="flex justify-between mt-1">
                <span>{info.min}</span>
                <span>{info.max}</span>
            </div>
        </div>
    );
};

export const CodeMap: React.FC<CodeMapProps> = ({ data, selectedNode, onNodeSelect, isMinimapEnabled, heatmapMode }) => {
  const [treeData, setTreeData] = useState<TreeNode>(data);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [scrollPos, setScrollPos] = useState({ top: 0, left: 0 });
  const [isMinimapVisible, setIsMinimapVisible] = useState(false);

  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  useEffect(() => {
    if (!data) return;

    const rootNode: TreeNode = JSON.parse(JSON.stringify(data));

    const prepareTree = (node: TreeNode) => {
      if (node.type === 'file' && node.children && node.children.length > 0) {
        node._children = node.children;
        node.children = undefined;
      } else if (node.children) {
        node.children.forEach(prepareTree);
      }
    };
    
    prepareTree(rootNode);
    setTreeData(rootNode);
  }, [data]);


  useLayoutEffect(() => {
    if (scrollContainerRef.current) {
      const { width, height } = scrollContainerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }
    const resizeObserver = new ResizeObserver(entries => {
        if (entries[0]) {
            const { width, height } = entries[0].contentRect;
            setDimensions({ width, height });
        }
    });

    if (scrollContainerRef.current) {
        resizeObserver.observe(scrollContainerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
        requestAnimationFrame(() => {
            setScrollPos({ top: container.scrollTop, left: container.scrollLeft });
        });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // Only main button
      const target = e.target as HTMLElement;
      if (target.closest('.group') || target.closest('button')) {
        return;
      }

      e.preventDefault();
      dragRef.current = {
        isDragging: true,
        startX: e.pageX,
        startY: e.pageY,
        scrollLeft: container.scrollLeft,
        scrollTop: container.scrollTop,
      };
      container.style.cursor = 'grabbing';
      container.style.userSelect = 'none';
    };

    const onMouseUp = () => {
      if (dragRef.current.isDragging) {
        dragRef.current.isDragging = false;
        container.style.cursor = 'grab';
        container.style.userSelect = '';
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current.isDragging) return;
      e.preventDefault();
      const dx = e.pageX - dragRef.current.startX;
      const dy = e.pageY - dragRef.current.startY;
      container.scrollLeft = dragRef.current.scrollLeft - dx;
      container.scrollTop = dragRef.current.scrollTop - dy;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mousemove', onMouseMove);
    
    container.style.cursor = 'grab';

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mousemove', onMouseMove);
      container.style.cursor = 'auto';
      container.style.userSelect = '';
    };
  }, []);
  
  const { nodes, links, width, height } = useMemo(() => {
    if (!treeData) {
      return { nodes: [], links: [], width: 0, height: 0 };
    }

    const root = d3.hierarchy<TreeNode>(treeData, (d) => d.children);

    // Define spacing for the tree layout.
    const verticalNodeSeparation = 60; // Increased vertical distance between nodes.
    const horizontalLevelSeparation = 300; // Increased horizontal distance between tree levels.

    // Calculate the dimensions of the tree based on its structure.
    const layoutHeight = (root.leaves().length || 1) * verticalNodeSeparation;
    const layoutWidth = root.height * horizontalLevelSeparation;

    const treeLayout = d3.tree<TreeNode>().size([layoutHeight, layoutWidth]);
    const tree = treeLayout(root);

    return {
      nodes: tree.descendants(),
      links: tree.links(),
      width: layoutWidth,
      height: layoutHeight,
    };
  }, [treeData]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, d3.HierarchyPointNode<TreeNode>>();
    if (nodes) {
      for (const node of nodes) {
        if (node.data.uniqueId) {
          map.set(node.data.uniqueId, node);
        }
      }
    }
    return map;
  }, [nodes]);
  
  const finalSelectedNode = useMemo(() => {
    if (!selectedNode?.data.uniqueId) return null;
    return nodeMap.get(selectedNode.data.uniqueId) || null;
  }, [selectedNode, nodeMap]);

  const dependencyLinks = useMemo(() => {
    const links: { dependencies: any[], dependents: any[] } = { dependencies: [], dependents: [] };
    if (!finalSelectedNode || !nodeMap.size) return links;

    const nodeData = finalSelectedNode.data;

    if (nodeData.dependencies) {
      for (const depId of nodeData.dependencies) {
        const targetNode = nodeMap.get(depId);
        if (targetNode && targetNode.parent) {
          links.dependencies.push({ source: finalSelectedNode, target: targetNode });
        }
      }
    }

    if (nodeData.dependents) {
      for (const depId of nodeData.dependents) {
        const sourceNode = nodeMap.get(depId);
        if (sourceNode && sourceNode.parent) {
          links.dependents.push({ source: sourceNode, target: finalSelectedNode });
        }
      }
    }

    return links;
  }, [finalSelectedNode, nodeMap]);


  const handleToggle = (clickedNode: d3.HierarchyPointNode<TreeNode>) => {
    const uniqueId = clickedNode.data.uniqueId;
    if (!uniqueId) return;

    const findAndToggle = (node: TreeNode): TreeNode => {
        let newNode = { ...node };

        if (newNode.uniqueId === uniqueId) {
            if (newNode.children) {
                newNode._children = newNode.children;
                delete newNode.children;
            } else if (newNode._children) {
                newNode.children = newNode._children;
                delete newNode._children;
            }
        } else if (newNode.children) {
            newNode.children = newNode.children.map(findAndToggle);
        }
        return newNode;
    };
    
    setTreeData(prevData => findAndToggle(prevData));
  };
  
  if (!treeData || !treeData.children || treeData.children.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500">표시할 데이터가 없습니다.</div>;
  }
  
  const margin = { top: 40, right: 150, bottom: 40, left: 150 };
  const viewWidth = width + margin.left + margin.right;
  const viewHeight = Math.max(500, height + margin.top + margin.bottom);

  const isScrollable = scrollContainerRef.current && (scrollContainerRef.current.scrollWidth > scrollContainerRef.current.clientWidth || scrollContainerRef.current.scrollHeight > scrollContainerRef.current.clientHeight);

  const MINIMAP_WIDTH = 200;
  const MINIMAP_HEIGHT = 200;

  const handleMinimapNavigate = (e: React.MouseEvent<SVGSVGElement>) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = viewWidth / MINIMAP_WIDTH;
    const scaleY = viewHeight / MINIMAP_HEIGHT;

    const newScrollLeft = (x * scaleX) - (container.clientWidth / 2);
    const newScrollTop = (y * scaleY) - (container.clientHeight / 2);

    container.scrollTo({
      left: newScrollLeft,
      top: newScrollTop,
      behavior: 'smooth',
    });
  };

  return (
    <div 
        className="w-full h-full relative"
        onMouseEnter={() => setIsMinimapVisible(true)}
        onMouseLeave={() => setIsMinimapVisible(false)}
    >
        <div
            ref={scrollContainerRef}
            className="w-full h-full overflow-auto bg-gray-900 rounded-lg"
        >
            <div style={{ width: viewWidth, height: viewHeight, position: 'relative' }}>
                <svg width={viewWidth} height={viewHeight} className="absolute top-0 left-0">
                <g transform={`translate(${margin.left}, ${margin.top})`}>
                    {links.map((link, i) => {
                    const isCyclicLink = link.source.data.isCyclic && link.target.data.isCyclic && link.source.data.type === 'file' && link.target.data.type === 'file';
                    return (
                        <path
                            key={`link-${i}`}
                            className={`stroke-current fill-none transition-all duration-500 ease-in-out ${isCyclicLink ? 'text-red-500' : 'text-gray-700'}`}
                            strokeWidth={isCyclicLink ? 2 : 1.5}
                            d={d3.linkHorizontal()
                                .x(d => (d as any).y)
                                .y(d => (d as any).x)
                                (link as any) as string}
                        />
                    );
                    })}
                    
                    {dependencyLinks.dependencies.map((link, i) => (
                    <path
                        key={`dep-link-${i}`}
                        className="stroke-current text-sky-500/70 fill-none transition-all duration-500 ease-in-out"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                        d={d3.linkHorizontal()
                            .x(d => (d as any).y)
                            .y(d => (d as any).x)
                            (link as any) as string}
                    />
                    ))}

                    {dependencyLinks.dependents.map((link, i) => (
                    <path
                        key={`depd-link-${i}`}
                        className="stroke-current text-emerald-500/70 fill-none transition-all duration-500 ease-in-out"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                        d={d3.linkHorizontal()
                            .x(d => (d as any).y)
                            .y(d => (d as any).x)
                            (link as any) as string}
                    />
                    ))}
                </g>
                </svg>

                <div className="absolute" style={{ transform: `translate(${margin.left}px, ${margin.top}px)` }}>
                    {nodes.map((node: d3.HierarchyPointNode<TreeNode>) => {
                        const isSelected = !!finalSelectedNode && finalSelectedNode.data.uniqueId === node.data.uniqueId;
                        
                        return (
                            <Node 
                                key={node.data.uniqueId || node.data.name} 
                                node={node} 
                                onToggle={handleToggle} 
                                onSelect={onNodeSelect}
                                isSelected={isSelected}
                                heatmapMode={heatmapMode}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
      {isScrollable && isMinimapEnabled && (
        <div 
            className={`absolute top-4 left-4 bg-gray-900/80 border border-gray-700 rounded-lg shadow-2xl backdrop-blur-sm overflow-hidden transition-opacity duration-300 ${isMinimapVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            aria-hidden={!isMinimapVisible}
        >
            <svg
                width={MINIMAP_WIDTH}
                height={MINIMAP_HEIGHT}
                onClick={handleMinimapNavigate}
                className="cursor-pointer"
                viewBox={`0 0 ${viewWidth} ${viewHeight}`}
                preserveAspectRatio="none"
            >
                <g transform={`translate(${margin.left}, ${margin.top})`}>
                    {links.map((link, i) => {
                        const isCyclicLink = link.source.data.isCyclic && link.target.data.isCyclic;
                        return (
                            <path
                                key={`minimap-link-${i}`}
                                className={`fill-none ${isCyclicLink ? 'stroke-red-800' : 'stroke-gray-700'}`}
                                strokeWidth={isCyclicLink ? 8 : 4}
                                d={d3.linkHorizontal().x(d => (d as any).y).y(d => (d as any).x)(link as any) as string}
                            />
                        );
                    })}
                    {nodes.map(node => (
                        <circle
                            key={`minimap-node-${node.data.uniqueId}`}
                            cx={node.y}
                            cy={node.x}
                            r={node.data.type === 'directory' ? 6 : 4}
                            className="fill-current text-gray-600"
                        />
                    ))}
                </g>
                <rect
                    x={scrollPos.left}
                    y={scrollPos.top}
                    width={scrollContainerRef.current?.clientWidth}
                    height={scrollContainerRef.current?.clientHeight}
                    className="fill-sky-500/20 stroke-sky-400"
                    strokeWidth="4"
                    style={{ vectorEffect: 'non-scaling-stroke' }}
                />
            </svg>
        </div>
      )}
      <HeatmapLegend mode={heatmapMode} />
    </div>
  );
};