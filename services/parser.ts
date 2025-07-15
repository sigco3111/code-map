import { TreeNode, NodeType } from '../types.ts';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

const languageConfigs: Record<string, any> = {
    py: {
        name: 'Python',
        regex: {
            imports: [/^\s*from\s+([\w.]+)\s+import/gm, /^\s*import\s+([\w.]+)/gm],
            class: /^\s*class\s+(\w+)/gm,
            function: /^\s*def\s+(\w+)/gm,
        }
    },
    java: {
        name: 'Java',
        regex: {
            imports: [/^\s*import\s+([\w.*]+);/gm],
            class: [/^\s*(?:public|private|protected)?\s*class\s+(\w+)/gm],
            interface: [/^\s*(?:public|private|protected)?\s*interface\s+(\w+)/gm],
            function: [/^\s*(?:public|private|protected|static|final|abstract|synchronized)?\s*[\w<>,.?\s\[\]]+\s+(\w+)\s*\([^)]*\)\s*(?:throws\s+[\w,\s]+)?\s*\{/gm],
        }
    },
    c: { name: 'C', alias: 'cpp' },
    h: { name: 'C/C++ Header', alias: 'cpp' },
    cpp: {
        name: 'C++',
        regex: {
            imports: [/^\s*#include\s*["<]([\w./]+)[">]/gm],
            class: [/^\s*(?:class|struct)\s+(\w+)/gm],
            struct: [/^\s*struct\s+(\w+)/gm],
            function: [/^(?!#|using|\s*\*)\s*(?:[\w\s\*\&<>:]+?)\s+([\w:~]+)\s*\([^)]*\)\s*(?:const|noexcept)?\s*\{/gm],
        }
    },
    m: { name: 'Objective-C', alias: 'objc' },
    mm: { name: 'Objective-C++', alias: 'objc' },
    objc: {
        name: 'Objective-C',
        regex: {
            imports: [/^\s*#import\s*["<]([\w./]+)[">]/gm],
            class: [/^\s*@interface\s+(\w+)/gm],
            protocol: [/^\s*@protocol\s+(\w+)/gm],
            function: [/^\s*[-+]\s*\([\w\s*<>,]+\)\s*(\w+)/gm],
        }
    },
    swift: {
        name: 'Swift',
        regex: {
            imports: [/^\s*import\s+(\w+)/gm],
            class: [/^\s*(?:public|internal|fileprivate|private)?\s*class\s+(\w+)/gm],
            struct: [/^\s*(?:public|internal|fileprivate|private)?\s*struct\s+(\w+)/gm],
            protocol: [/^\s*(?:public|internal|fileprivate|private)?\s*protocol\s+(\w+)/gm],
            enum: [/^\s*(?:public|internal|fileprivate|private)?\s*enum\s+(\w+)/gm],
            function: [/^\s*(?:private|public|internal|fileprivate)?\s*func\s+(\w+)/gm],
        }
    },
    kt: {
        name: 'Kotlin',
        regex: {
            imports: [/^\s*import\s+([\w.]+)/gm],
            class: [/^\s*(?:public|internal|private)?\s*(?:data|open|sealed)?\s*class\s+(\w+)/gm],
            interface: [/^\s*(?:public|internal|private)?\s*interface\s+(\w+)/gm],
            function: [/^\s*fun\s+(\w+)/gm],
        }
    },
    go: {
        name: 'Go',
        regex: {
            imports: [/^\s*import\s*\(\s*([^)]+)\s*\)/gm, /^\s*import\s*"([^"]+)"/gm],
            struct: [/^\s*type\s+(\w+)\s+struct/gm],
            function: [/^\s*func\s+(?:\([^)]*\)\s*)?(\w+)/gm],
        }
    },
    rs: {
        name: 'Rust',
        regex: {
            imports: [/^\s*use\s+([\w:]+);/gm, /^\s*mod\s+([\w:]+);/gm],
            struct: [/^\s*struct\s+(\w+)/gm],
            enum: [/^\s*enum\s+(\w+)/gm],
            function: [/^\s*(?:pub(?:\(crate\))?)?\s*fn\s+(\w+)/gm],
        }
    }
};

// --- Cognitive Complexity Calculator ---
const calculateCognitiveComplexity = (functionNode: any): number => {
    if (!functionNode || !functionNode.body) return 0;
    
    const functionName = functionNode.id ? functionNode.id.name : null;
    let complexity = 0;
    let nesting = 0;
    let logicalChainOperator: string | null = null;

    const visitor = { ...walk.base };
    const leave = (type: string) => {
        const original = visitor[type];
        visitor[type] = (node: any, st: any, c: any) => {
            original(node, st, c);
            nesting--;
        };
    };

    leave('IfStatement');
    leave('ForStatement');
    leave('WhileStatement');
    leave('DoWhileStatement');
    leave('ConditionalExpression');
    leave('SwitchStatement');
    leave('CatchClause');
    leave('FunctionExpression');
    leave('ArrowFunctionExpression');
    
    walk.simple(functionNode.body, {
        FunctionExpression() { nesting++; },
        ArrowFunctionExpression() { nesting++; },
        
        IfStatement() { complexity += 1 + nesting; nesting++; logicalChainOperator = null; },
        ForStatement() { complexity += 1 + nesting; nesting++; logicalChainOperator = null; },
        WhileStatement() { complexity += 1 + nesting; nesting++; logicalChainOperator = null; },
        DoWhileStatement() { complexity += 1 + nesting; nesting++; logicalChainOperator = null; },
        ConditionalExpression() { complexity += 1 + nesting; nesting++; logicalChainOperator = null; },
        SwitchStatement() { complexity += 1 + nesting; nesting++; logicalChainOperator = null; },
        CatchClause() { complexity += 1; nesting++; logicalChainOperator = null; },
        
        SwitchCase(node: any) { if (node.test) complexity++; logicalChainOperator = null; },
        BreakStatement(node: any) { if (node.label) complexity++; },
        ContinueStatement(node: any) { if (node.label) complexity++; },
        CallExpression(node: any) {
            if (functionName && node.callee.type === 'Identifier' && node.callee.name === functionName) {
                complexity++;
            }
            logicalChainOperator = null;
        },
        LogicalExpression(node: any) {
            if (logicalChainOperator !== node.operator && (node.operator === '&&' || node.operator === '||')) {
                complexity++;
                logicalChainOperator = node.operator;
            }
        },
        // Reset logical chain on non-logical expressions to correctly count subsequent chains
        MemberExpression() { logicalChainOperator = null; },
        UnaryExpression() { logicalChainOperator = null; },
        UpdateExpression() { logicalChainOperator = null; },
    }, visitor);

    return complexity;
};

const calculatePythonCognitiveComplexity = (content: string, functionName: string): number => {
    const lines = content.split('\n');
    let complexity = 0;
    let startLine = -1;
    
    // Find the first occurrence of the function definition
    for (let i = 0; i < lines.length; i++) {
        const trimmedLine = lines[i].trim();
        if (trimmedLine.startsWith('#')) continue;
        const functionRegex = new RegExp(`^def\\s+${functionName}\\s*\\(`);
        if (functionRegex.test(trimmedLine)) {
            startLine = i;
            break;
        }
    }

    if (startLine === -1) return 0;

    const functionIndent = lines[startLine].length - lines[startLine].trimStart().length;
    const functionBodyLines: string[] = [];

    // Extract function body based on indentation
    for (let i = startLine + 1; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        const indent = line.length - line.trimStart().length;
        if (trimmed && indent <= functionIndent) {
            break;
        }
        functionBodyLines.push(line);
    }
    
    // Calculate complexity on the extracted body
    const nestingStack: number[] = [];
    for (const line of functionBodyLines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const indent = line.length - line.trimStart().length;
        
        while (nestingStack.length > 0 && indent <= nestingStack[nestingStack.length - 1]) {
            nestingStack.pop();
        }
        const nestingDepth = nestingStack.length;

        const nestingKeywords = ['if', 'for', 'while', 'except', 'with'];
        const simpleKeywords = ['elif', 'else'];

        let processed = false;
        for (const kw of nestingKeywords) {
            if (new RegExp(`^${kw}\\b`).test(trimmed)) {
                complexity += (1 + nestingDepth);
                nestingStack.push(indent);
                processed = true;
                break;
            }
        }
        
        if (!processed) {
            for (const kw of simpleKeywords) {
                if (new RegExp(`^${kw}\\b`).test(trimmed)) {
                    complexity += 1;
                    processed = true;
                    break;
                }
            }
        }
        
        const logicalOperators = (trimmed.match(/\s(and|or)\s/g) || []).length;
        complexity += logicalOperators;
        
        if (new RegExp(`\\b${functionName}\\b`).test(trimmed)) {
            complexity++; // Recursion
        }
    }
    
    return complexity;
};

const extractBraceBody = (content: string, startIndex: number): string | null => {
    const firstBraceIndex = content.indexOf('{', startIndex);
    if (firstBraceIndex === -1) return null;

    let braceCount = 1;
    for (let i = firstBraceIndex + 1; i < content.length; i++) {
        const char = content[i];
        if (char === '{') {
            braceCount++;
        } else if (char === '}') {
            braceCount--;
        }

        if (braceCount === 0) {
            return content.substring(firstBraceIndex + 1, i);
        }
    }
    return null; // Unmatched brace
};

const calculateBraceBasedCognitiveComplexity = (functionBody: string, functionName: string): number => {
    if (!functionBody) return 0;
    
    let complexity = 0;
    let nesting = 0;

    const lines = functionBody.split('\n');
    for (const line of lines) {
        // Decrement nesting for lines that contain a closing brace
        if (line.includes('}')) {
            nesting = Math.max(0, nesting - (line.match(/\}/g) || []).length);
        }
        
        const trimmedLine = line.trim().split('//')[0].split('/*')[0];
        if (!trimmedLine) continue;

        // Keywords that increment complexity and nesting level
        if (/\b(if|for|while|switch|catch)\b/.test(trimmedLine)) {
            complexity += (1 + nesting);
        }

        // Keywords that just increment complexity
        if (/\b(else|case|goto)\b/.test(trimmedLine)) {
            complexity += 1;
        }
        
        // Ternary operators
        complexity += (trimmedLine.match(/\?/g) || []).length;

        // Logical operators - simple count
        complexity += (trimmedLine.match(/&&|\|\|/g) || []).length;
        
        // Recursion
        if (new RegExp(`\\b${functionName}\\s*\\(`).test(trimmedLine)) {
            complexity++;
        }

        // Increment nesting for lines that contain an opening brace
        if (line.includes('{')) {
            nesting += (line.match(/\{/g) || []).length;
        }
    }

    return complexity;
};


// --- AST-based parser helpers for JS/TS ---
const getDeclarationName = (declaration: any): string | null => {
    if (!declaration) return null;
    if (declaration.id && declaration.id.type === 'Identifier') {
        return declaration.id.name;
    }
    // For `export const a = ...`
    if (declaration.type === 'VariableDeclaration' && declaration.declarations[0] && declaration.declarations[0].id.type === 'Identifier') {
        return declaration.declarations[0].id.name;
    }
    return null;
};

// --- AST-based parser for JS/TS ---
const parseFileWithAcorn = (file: { path: string; content: string }, fileNode: TreeNode, allNodesByUniqueId: Map<string, TreeNode>) => {
    try {
        const ast = acorn.parse(file.content, { ecmaVersion: 'latest', sourceType: 'module', locations: true });
        
        const createSymbolNode = (name: string, type: NodeType, loc: any, isExported = false, displayName = name, cognitiveComplexity?: number) => {
            const uniqueId = `${file.path}:${name}`;
            const existingNode = allNodesByUniqueId.get(uniqueId);
            if (existingNode) {
                if (isExported) existingNode.isExported = true;
                if (loc && !existingNode.loc) existingNode.loc = loc;
                if (cognitiveComplexity !== undefined) existingNode.cognitiveComplexity = cognitiveComplexity;
                return;
            }

            const symbolNode: TreeNode = { name: displayName, type, path: file.path, uniqueId, dependencies: [], dependents: [], isExported, loc, cognitiveComplexity };
            if(!fileNode.children) fileNode.children = [];
            fileNode.children.push(symbolNode);
            allNodesByUniqueId.set(uniqueId, symbolNode);
        };

        walk.simple(ast, {
            FunctionDeclaration(node: any) { 
                if (node.id?.name) {
                    const complexity = calculateCognitiveComplexity(node);
                    createSymbolNode(node.id.name, 'function', node.loc, false, node.id.name, complexity); 
                }
            },
            ClassDeclaration(node: any) { 
                if (node.id?.name) createSymbolNode(node.id.name, 'class', node.loc); 
                 // Also parse methods inside class
                if (node.body?.body) {
                    for (const method of node.body.body) {
                        if (method.type === 'MethodDefinition' && method.key.type === 'Identifier' && method.value.type === 'FunctionExpression') {
                            const complexity = calculateCognitiveComplexity(method.value);
                            const methodName = method.key.name;
                            const displayName = `${node.id.name}.${methodName}`;
                            // Attach to file node for simplicity in the current tree structure
                            createSymbolNode(displayName, 'function', method.loc, false, displayName, complexity);
                        }
                    }
                }
            },
            VariableDeclaration(node: any) {
                for (const declaration of node.declarations) {
                    if (declaration.id.type === 'Identifier') {
                        const init = declaration.init;
                        const isFunction = init && (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression');
                        const type: NodeType = isFunction ? 'arrow_function' : 'variable';
                        const complexity = isFunction ? calculateCognitiveComplexity(init) : undefined;
                        createSymbolNode(declaration.id.name, type, declaration.loc, false, declaration.id.name, complexity);
                    }
                }
            },
            ExportNamedDeclaration(node: any) {
                if (node.declaration) {
                    const name = getDeclarationName(node.declaration);
                    if (name) {
                        let complexity: number | undefined = undefined;
                        let type: NodeType = 'variable';

                        if(node.declaration.type === 'ClassDeclaration') {
                            type = 'class';
                        } else if (node.declaration.type === 'FunctionDeclaration') {
                            type = 'function';
                            complexity = calculateCognitiveComplexity(node.declaration);
                        } else if (node.declaration.type === 'VariableDeclaration') {
                            const decl = node.declaration.declarations[0];
                            if (decl && decl.init && (decl.init.type === 'ArrowFunctionExpression' || decl.init.type === 'FunctionExpression')) {
                                type = 'arrow_function';
                                complexity = calculateCognitiveComplexity(decl.init);
                            }
                        }
                        createSymbolNode(name, type, node.declaration.loc, true, name, complexity);
                    }
                }
                for (const specifier of node.specifiers) {
                    const localName = specifier.local.name;
                    const symbolId = `${file.path}:${localName}`;
                    const targetNode = allNodesByUniqueId.get(symbolId);
                    if (targetNode) {
                         targetNode.isExported = true;
                    }
                }
            },
            ExportDefaultDeclaration(node: any) {
               const name = 'default';
               let symbolType: NodeType = 'variable';
               let complexity: number | undefined = undefined;
               let declarationNode = node.declaration;

               if (declarationNode.type === 'ClassDeclaration') symbolType = 'class';
               if (declarationNode.type === 'FunctionDeclaration') {
                   symbolType = 'function';
                   complexity = calculateCognitiveComplexity(declarationNode);
               }
               if (declarationNode.type === 'ArrowFunctionExpression' || declarationNode.type === 'FunctionExpression') {
                   symbolType = 'arrow_function';
                   complexity = calculateCognitiveComplexity(declarationNode);
               }
               
               const displayName = node.declaration.name || node.declaration.id?.name || file.path.split('/').pop()?.split('.')[0] || 'default';
               createSymbolNode(name, symbolType, node.declaration.loc, true, displayName, complexity);
            }
        });
    } catch (e) {
        console.warn(`Could not parse ${file.path} with Acorn:`, e);
    }
};

const linkDependenciesWithAcorn = (file: { path: string; content: string }, allNodesByUniqueId: Map<string, TreeNode>, filePaths: string[]) => {
    const sourceFileNode = allNodesByUniqueId.get(`file:${file.path}`);
    if (!sourceFileNode) return;
    
    const importOrigins = new Map<string, { path: string, name: string }[]>();

    try {
        const ast = acorn.parse(file.content, { ecmaVersion: 'latest', sourceType: 'module' });

        walk.simple(ast, {
            ImportDeclaration(node: any) {
                if (typeof node.source.value !== 'string') return;
                
                const resolveImportPath = (importStr: string, currentPath: string): string | null => {
                    if (!importStr.startsWith('.')) {
                        const baseName = importStr.split('/')[0];
                        return filePaths.find(p => p.includes(baseName)) || null;
                    }
                    try {
                        const url = new URL(importStr, `file:///${currentPath}`);
                        const resolved = url.pathname.substring(1);
                        return filePaths.find(p => p === resolved || p.startsWith(resolved + '.') || p.startsWith(resolved + '/')) || 
                               filePaths.find(p => p.startsWith(resolved.substring(0, resolved.lastIndexOf('/')))) ||
                               null;
                    } catch (e) {
                        return null;
                    }
                };

                const targetFilePath = resolveImportPath(node.source.value, file.path);
                if (!targetFilePath) return;

                const targetFileNode = allNodesByUniqueId.get(`file:${targetFilePath}`);
                if(targetFileNode && sourceFileNode.uniqueId !== targetFileNode.uniqueId) {
                    sourceFileNode.dependencies?.push(targetFileNode.uniqueId!);
                    targetFileNode.dependents?.push(sourceFileNode.uniqueId!);
                }

                for (const specifier of node.specifiers) {
                    const localName = specifier.local.name;
                    let importedName = 'default';
                    if (specifier.type === 'ImportSpecifier') {
                        importedName = specifier.imported.name;
                    } else if (specifier.type === 'ImportNamespaceSpecifier') {
                         importedName = '*';
                    }
                    
                    if (!importOrigins.has(localName)) {
                        importOrigins.set(localName, []);
                    }
                    importOrigins.get(localName)?.push({ path: targetFilePath, name: importedName });
                }
            }
        });

        const usedSymbols = new Set<string>();
        walk.simple(ast, {
            Identifier(node: any) {
                const origins = importOrigins.get(node.name);
                if (origins) {
                    for (const origin of origins) {
                        const targetSymbolId = `${origin.path}:${origin.name}`;
                        if(usedSymbols.has(targetSymbolId)) continue;

                        const targetSymbolNode = allNodesByUniqueId.get(targetSymbolId);
                        
                        if (targetSymbolNode) {
                            sourceFileNode.dependencies?.push(targetSymbolNode.uniqueId!);
                            targetSymbolNode.dependents?.push(sourceFileNode.uniqueId!);
                            usedSymbols.add(targetSymbolId);
                        } else {
                             // Handle namespace import usage e.g. import * as api from './api'; api.doSomething();
                             const namespaceFileNode = allNodesByUniqueId.get(`file:${origin.path}`);
                             if (namespaceFileNode) {
                                sourceFileNode.dependencies?.push(namespaceFileNode.uniqueId!);
                                namespaceFileNode.dependents?.push(sourceFileNode.uniqueId!);
                             }
                        }
                    }
                }
            }
        });
    } catch(e) { /* ignore parse errors */ }
};


// --- Regex-based parser for other languages ---
const parseFileWithRegex = (content: string, config: any, fileNode: TreeNode, path: string, allNodesByUniqueId: Map<string, TreeNode>) => {
    if (!config.regex) return;
    
    const isPython = config.name === 'Python';
    const braceBasedLanguages = ['Java', 'C++', 'C/C++ Header', 'Objective-C', 'Objective-C++', 'Swift', 'Kotlin', 'Go', 'Rust'];
    const isBraceBased = braceBasedLanguages.includes(config.name);

    fileNode.imports = [];
    
    for (const tokenType in config.regex) {
        const patterns = Array.isArray(config.regex[tokenType]) ? config.regex[tokenType] : [config.regex[tokenType]];
        for (const pattern of patterns) {
            pattern.lastIndex = 0; // Reset for global regexes
            let match;
            while((match = pattern.exec(content)) !== null) {
                const name = match[1]?.trim();
                if (!name) continue;

                if (tokenType === 'imports') {
                    fileNode.imports.push(name);
                } else {
                    const uniqueId = `${path}:${name}`;
                    if (allNodesByUniqueId.has(uniqueId)) continue;

                    let complexity: number | undefined;
                    if (tokenType === 'function') {
                        if (isPython) {
                            complexity = calculatePythonCognitiveComplexity(content, name);
                        } else if (isBraceBased) {
                            const functionBody = extractBraceBody(content, match.index + match[0].length);
                            if (functionBody) {
                                complexity = calculateBraceBasedCognitiveComplexity(functionBody, name);
                            }
                        }
                    }
                    
                    const node: TreeNode = {
                        name,
                        type: tokenType as NodeType,
                        path: path,
                        uniqueId,
                        dependencies: [],
                        dependents: [],
                        cognitiveComplexity: complexity,
                    };
                    if(!fileNode.children) fileNode.children = [];
                    fileNode.children?.push(node);
                    allNodesByUniqueId.set(uniqueId, node);
                }
            }
        }
    }
};


// --- Main Project Parser ---
export const parseProject = (files: { path: string; content: string }[]): TreeNode => {
    const root: TreeNode = { name: '프로젝트 루트', type: 'directory', children: [], uniqueId: 'project_root' };
    const allNodesByUniqueId = new Map<string, TreeNode>();

    const jsExtensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
    const allSupportedExtensions = [...jsExtensions, ...Object.keys(languageConfigs).map(k => `.${k}`)];
    const filteredFiles = files.filter(f => f.path && allSupportedExtensions.some(ext => f.path.endsWith(ext)));
    
    // Pass 1: Discover all nodes and parse content
    for (const file of filteredFiles) {
        const pathParts = file.path.split('/').filter(p => p);
        let currentNode = root;
        for (let i = 0; i < pathParts.length; i++) {
            const part = pathParts[i];
            const isFile = i === pathParts.length - 1;
            const currentPath = pathParts.slice(0, i + 1).join('/');
            let childNode = currentNode.children?.find(child => child.name === part);
            if (!childNode) {
                childNode = {
                    name: part,
                    type: isFile ? 'file' : 'directory',
                    path: currentPath,
                    uniqueId: (isFile ? 'file:' : 'dir:') + currentPath,
                    children: isFile ? [] : undefined,
                    dependencies: [],
                    dependents: [],
                    imports: [],
                };
                if (!currentNode.children) currentNode.children = [];
                currentNode.children.push(childNode);
                allNodesByUniqueId.set(childNode.uniqueId!, childNode);
            }
            currentNode = childNode;
        }

        const fileNode = currentNode;
        if (fileNode.type !== 'file') continue;
        
        const extension = `.${file.path.split('.').pop() || ''}`;
        if (jsExtensions.includes(extension)) {
            parseFileWithAcorn(file, fileNode, allNodesByUniqueId);
        } else {
            let config = languageConfigs[extension.substring(1)];
            if (config?.alias) config = languageConfigs[config.alias];
            if (config) {
                parseFileWithRegex(file.content, config, fileNode, file.path, allNodesByUniqueId);
            }
        }
    }
    
    // Pass 2: Link dependencies
    const filePaths = filteredFiles.map(f => f.path);
    for (const file of filteredFiles) {
        const extension = `.${file.path.split('.').pop() || ''}`;
        if (jsExtensions.includes(extension)) {
            linkDependenciesWithAcorn(file, allNodesByUniqueId, filePaths);
        } else {
            const sourceFileNode = allNodesByUniqueId.get(`file:${file.path}`);
            if (!sourceFileNode || !sourceFileNode.imports) continue;

            for (const importPath of sourceFileNode.imports) {
                const resolvedPath = filePaths.find(p => p.includes(importPath));
                if (resolvedPath) {
                    const targetFileNode = allNodesByUniqueId.get(`file:${resolvedPath}`);
                    if (targetFileNode && sourceFileNode.uniqueId !== targetFileNode.uniqueId) {
                        sourceFileNode.dependencies?.push(targetFileNode.uniqueId!);
                        targetFileNode.dependents?.push(sourceFileNode.uniqueId!);
                    }
                }
            }
        }
    }

    // Final cleanup of dependencies and dependents before analysis
    for (const node of allNodesByUniqueId.values()) {
        if (node.dependencies) node.dependencies = [...new Set(node.dependencies)];
        if (node.dependents) node.dependents = [...new Set(node.dependents)];
    }

    // Pass 3: Analyze graph for cycles, unused code, and instability
    allNodesByUniqueId.forEach(node => {
        // Unused code analysis
        if (node.isExported) {
            const hasExternalDependents = node.dependents?.some(depId => {
                const dependentNode = allNodesByUniqueId.get(depId);
                return dependentNode && dependentNode.path !== node.path;
            });

            if (!hasExternalDependents) {
                 node.isUnused = true;
            }
        }
        
        // Instability analysis for file nodes
        if (node.type === 'file') {
            const Ca = node.dependents?.filter(id => id.startsWith('file:')).length || 0; // Afferent couplings
            const Ce = node.dependencies?.filter(id => id.startsWith('file:')).length || 0; // Efferent couplings
            const totalCouplings = Ca + Ce;
            node.instability = (totalCouplings === 0) ? 0 : Ce / totalCouplings;
        }
    });

    const fileNodes = Array.from(allNodesByUniqueId.values()).filter(n => n.type === 'file');
    const adj = new Map<string, string[]>();
    fileNodes.forEach(node => {
        const uniqueDeps = [...new Set(node.dependencies?.filter(d => d.startsWith('file:')))];
        adj.set(node.uniqueId!, uniqueDeps);
    });

    const visited = new Set<string>(), recursionStack = new Set<string>(), cycles = new Set<string>();
    function detectCycleUtil(u: string) {
        visited.add(u);
        recursionStack.add(u);
        const neighbors = adj.get(u) || [];
        for (const v of neighbors) {
            if (!visited.has(v)) {
                if (detectCycleUtil(v)) { cycles.add(u); return true; }
            } else if (recursionStack.has(v)) {
                cycles.add(u); cycles.add(v); return true;
            }
        }
        recursionStack.delete(u);
        return false;
    }
    for (const node of fileNodes) if (!visited.has(node.uniqueId!)) detectCycleUtil(node.uniqueId!);
    cycles.forEach(cyclicId => {
        const node = allNodesByUniqueId.get(cyclicId);
        if (node) node.isCyclic = true;
    });

    // Final Sort
    const sortNodes = (node: TreeNode) => {
        if (!node.children) return;
        node.children.sort((a, b) => {
            if (a.type === 'directory' && b.type !== 'directory') return -1;
            if (a.type !== 'directory' && b.type === 'directory') return 1;
            return a.name.localeCompare(b.name);
        });
        node.children.forEach(sortNodes);
    };
    sortNodes(root);
    
    return root;
};