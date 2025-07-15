import React from 'react';
import { NodeType } from '../types.ts';

const IconWrapper = ({ children }: { children: React.ReactNode }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

export const DirectoryIcon = () => (
    <IconWrapper>
        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.23A2 2 0 0 0 8.27 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
    </IconWrapper>
);

export const FileIcon = () => (
  <IconWrapper>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </IconWrapper>
);

export const ClassIcon = () => (
    <IconWrapper>
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
        <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"></path>
    </IconWrapper>
);


export const FunctionIcon = () => (
  <IconWrapper>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v2" />
    <path d="M12 21v2" />
    <path d="m4.22 4.22 1.42 1.42" />
    <path d="m18.36 18.36 1.42 1.42" />
    <path d="M1 12h2" />
    <path d="M21 12h2" />
    <path d="m4.22 19.78 1.42-1.42" />
    <path d="m18.36 5.64 1.42-1.42" />
  </IconWrapper>
);

export const ArrowFunctionIcon = () => (
  <IconWrapper>
    <path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3" />
    <path d="M12 15l-3-3 3-3" />
    <path d="M9 12h9" />
  </IconWrapper>
);

export const ImportIcon = () => (
  <IconWrapper>
    <path d="M12 15l-3-3 3-3" />
    <path d="M9 12h9" />
    <path d="M19 3h-4.4a2 2 0 0 0-1.6.8L9 9" />
    <path d="M3 3v13a2 2 0 0 0 2 2h13"/>
  </IconWrapper>
);

export const ExportIcon = () => (
  <IconWrapper>
    <path d="M12 9l-3 3 3 3" />
    <path d="M15 12H3" />
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14 2z" />
  </IconWrapper>
);


export const VariableIcon = () => (
    <IconWrapper>
        <path d="M12 8V4H8" />
        <rect x="4" y="12" width="16" height="8" rx="2" />
        <path d="M4 14h16" />
    </IconWrapper>
);

export const InterfaceIcon = () => (
    <IconWrapper>
        <path d="M10 2.3a1 1 0 0 1 4 0l6.25 6.25a1 1 0 0 1 0 1.4l-2.35 2.35a1 1 0 0 1-1.4 0L14.2 10H9.8l-2.3 2.3a1 1 0 0 1-1.4 0L3.75 9.95a1 1 0 0 1 0-1.4L10 2.3z"/>
        <path d="M12 12v10" />
    </IconWrapper>
);


export const CloseIcon = () => (
    <IconWrapper>
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </IconWrapper>
);

export const SearchIcon = () => (
    <IconWrapper>
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </IconWrapper>
);

export const NodeTypeIcon = ({ type }: { type: NodeType }) => {
  switch (type) {
    case 'directory': return <DirectoryIcon />;
    case 'file': return <FileIcon />;
    case 'class': return <ClassIcon />;
    case 'function': return <FunctionIcon />;
    case 'arrow_function': return <ArrowFunctionIcon />;
    case 'import': return <ImportIcon />;
    case 'export': return <ExportIcon />;
    case 'variable': return <VariableIcon />;
    case 'struct': return <ClassIcon />;
    case 'interface': return <InterfaceIcon />;
    case 'protocol': return <InterfaceIcon />;
    case 'enum': return <VariableIcon />;
    default: return <FileIcon />;
  }
};