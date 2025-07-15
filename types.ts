
export type NodeType = 'directory' | 'file' | 'class' | 'function' | 'arrow_function' | 'import' | 'export' | 'variable' | 'struct' | 'interface' | 'enum' | 'protocol';
export type HeatmapMode = 'none' | 'complexity' | 'instability';

export interface TreeNode {
  name: string;
  type: NodeType;
  path?: string;
  children?: TreeNode[];
  _children?: TreeNode[]; // For collapsing

  // Fields for dependency analysis
  uniqueId?: string;
  dependencies?: string[]; // uniqueIds of nodes this node depends on
  dependents?: string[]; // uniqueIds of nodes that depend on this node
  
  // For regex parser
  imports?: string[]; // paths imported by this file

  // Fields for advanced analysis
  isCyclic?: boolean;
  isUnused?: boolean;
  isExported?: boolean;
  loc?: { start: { line: number, column: number }, end: { line: number, column: number } };
  instability?: number; // (0=stable, 1=unstable)
  cognitiveComplexity?: number;
}