"use client";
import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, ZoomIn, ZoomOut, Info, Maximize2, Minimize2 } from 'lucide-react';

export default function TreeView3D({ 
  groups = [], 
  depts = [], 
  sections = [], 
  teams = [],
  highlightedPath = null
}) {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 150, y: 100 });
  const [zoomScale, setZoomScale] = useState(0.8);
  const [hoveredNodeInfo, setHoveredNodeInfo] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const isPanning = useRef(false);
  const startPan = useRef({ x: 0, y: 0 });
  const svgRef = useRef(null);
  const dragStartPositions = useRef({});

  useEffect(() => {
    const layoutNodes = [];
    const layoutLinks = [];
    const rootXGap = 420;
    const levelYGap = 160;
    const nodeSpacingX = 220;

    let groupsToRender = [...groups];

    if (selectedGroupId) {
      groupsToRender = groups.filter(g => g.Id === selectedGroupId);
    } else if (highlightedPath && highlightedPath.groupId) {
      groupsToRender = groups.filter(g => g.Id === highlightedPath.groupId);
    }

    groupsToRender.forEach((group, gIdx) => {
      const gId = `group-${group.Id}`;
      const groupExpanded = expandedNodes[gId] === true;

      let groupNode = nodes.find(n => n.id === gId);
      const gx = groupNode ? groupNode.x : 200 + gIdx * rootXGap;
      const gy = groupNode ? groupNode.y : 100;

      const subDepts = depts.filter(d => d.GroupId === group.Id);

      layoutNodes.push({
        id: gId,
        label: group.Name,
        type: 'group',
        rawId: group.Id,
        x: gx,
        y: gy,
        countText: `${subDepts.length} Departments`,
        isExpanded: groupExpanded
      });

      if (groupExpanded) {
        subDepts.forEach((dept, dIdx) => {
          const dId = `dept-${dept.Id}`;
          const deptExpanded = expandedNodes[dId] === true; 

          let deptNode = nodes.find(n => n.id === dId);
          const dx = deptNode ? deptNode.x : gx + (dIdx - (subDepts.length - 1) / 2) * nodeSpacingX;
          const dy = deptNode ? deptNode.y : gy + levelYGap;

          const subSections = sections.filter(s => s.DeptId === dept.Id);

          layoutNodes.push({
            id: dId,
            label: dept.Name,
            type: 'dept',
            rawId: dept.Id,
            parentId: gId,
            x: dx,
            y: dy,
            countText: `${subSections.length} Sections`,
            isExpanded: deptExpanded
          });

          layoutLinks.push({ source: gId, target: dId });

          if (deptExpanded) {
            subSections.forEach((sec, sIdx) => {
              const sId = `sec-${sec.Id}`;
              const secExpanded = expandedNodes[sId] === true;

              let secNode = nodes.find(n => n.id === sId);
              const sx = secNode ? secNode.x : dx + (sIdx - (subSections.length - 1) / 2) * nodeSpacingX;
              const sy = secNode ? secNode.y : dy + levelYGap;

              const subTeams = teams.filter(t => t.SectionId === sec.Id);

              layoutNodes.push({
                id: sId,
                label: sec.Name,
                type: 'section',
                rawId: sec.Id,
                parentId: dId,
                x: sx,
                y: sy,
                countText: `${subTeams.length} Teams`,
                isExpanded: secExpanded
              });

              layoutLinks.push({ source: dId, target: sId });

              if (secExpanded) {
                subTeams.forEach((team, tIdx) => {
                  const tId = `team-${team.Id}`;
                  let teamNode = nodes.find(n => n.id === tId);
                  const tx = teamNode ? teamNode.x : sx + (tIdx - (subTeams.length - 1) / 2) * nodeSpacingX;
                  const ty = teamNode ? teamNode.y : sy + levelYGap;

                  layoutNodes.push({
                    id: tId,
                    label: team.Name,
                    type: 'team',
                    rawId: team.Id,
                    parentId: sId,
                    x: tx,
                    y: ty,
                    countText: null,
                    isExpanded: false
                  });

                  layoutLinks.push({ source: sId, target: tId });
                });
              }
            });
          }
        });
      }
    });

    setNodes(layoutNodes);
    setLinks(layoutLinks);
  }, [groups, depts, sections, teams, expandedNodes, highlightedPath, selectedGroupId]);

  useEffect(() => {
    if (nodes.length > 0 && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const minX = Math.min(...nodes.map(n => n.x));
      const maxX = Math.max(...nodes.map(n => n.x));
      const minY = Math.min(...nodes.map(n => n.y));
      const maxY = Math.max(...nodes.map(n => n.y));

      const treeWidth = maxX - minX;
      const treeHeight = maxY - minY;

      const centerX = (rect.width - treeWidth * zoomScale) / 2 - minX * zoomScale;
      const centerY = (rect.height - treeHeight * zoomScale) / 2 - minY * zoomScale;

      setPanOffset({ x: centerX || 150, y: centerY || 100 });
    }
  }, [nodes.length === 0]);

  useEffect(() => {
    if (highlightedPath) {
      const expandMap = { ...expandedNodes };
      if (highlightedPath.groupId) {
        expandMap[`group-${highlightedPath.groupId}`] = true;
      }
      if (highlightedPath.deptId) {
        expandMap[`dept-${highlightedPath.deptId}`] = true;
      }
      if (highlightedPath.sectionId) {
        expandMap[`sec-${highlightedPath.sectionId}`] = true;
      }
      setExpandedNodes(expandMap);
      if (highlightedPath.groupId) {
        setSelectedGroupId(highlightedPath.groupId);
      }
    }
  }, [highlightedPath]);

  const getLinkPath = (link) => {
    const sourceNode = nodes.find(n => n.id === link.source);
    const targetNode = nodes.find(n => n.id === link.target);
    if (!sourceNode || !targetNode) return '';

    const sX = sourceNode.x;
    const sY = sourceNode.y + 22; 
    const tX = targetNode.x;
    const tY = targetNode.y - 22;
    const midY = (sY + tY) / 2;

    return `M ${sX} ${sY} C ${sX} ${midY}, ${tX} ${midY}, ${tX} ${tY}`;
  };

  const centerOnNode = (node) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.width / 2 - node.x * zoomScale;
    const centerY = rect.height / 2 - node.y * zoomScale;
    setPanOffset({ x: centerX, y: centerY });
  };

  const handleDoubleClick = (node) => {
    setExpandedNodes(prev => ({
      ...prev,
      [node.id]: !prev[node.id]
    }));

    let groupRootId = null;
    if (node.type === 'group') {
      groupRootId = node.rawId;
    } else {
      let curr = node;
      while (curr && curr.parentId) {
        curr = nodes.find(n => n.id === curr.parentId);
      }
      if (curr && curr.type === 'group') {
        groupRootId = curr.rawId;
      }
    }

    if (groupRootId) {
      setSelectedGroupId(groupRootId);
    }
    
    setTimeout(() => centerOnNode(node), 100);
  };

  const getDescendantIds = (nodeId) => {
    const descendants = [];
    const queue = [nodeId];
    while (queue.length > 0) {
      const currentId = queue.shift();
      const children = links.filter(l => l.source === currentId).map(l => l.target);
      descendants.push(...children);
      queue.push(...children);
    }
    return descendants;
  };

  const handleNodeMouseDown = (e, node) => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    setDraggedNodeId(node.id);
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    setDragOffset({
      x: (clientX / zoomScale) - node.x,
      y: (clientY / zoomScale) - node.y
    });

    const descendants = getDescendantIds(node.id);
    const startingPositions = {};
    [node.id, ...descendants].forEach(id => {
      const found = nodes.find(n => n.id === id);
      if (found) {
        startingPositions[id] = { x: found.x, y: found.y };
      }
    });
    dragStartPositions.current = startingPositions;
  };

  const handleCanvasMouseDown = (e) => {
    if (e.cancelable) e.preventDefault();
    isPanning.current = true;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    startPan.current = {
      x: clientX - panOffset.x,
      y: clientY - panOffset.y
    };
  };

  const handleMouseMove = (e) => {
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    if (draggedNodeId) {
      if (e.cancelable) e.preventDefault();
      const currentMouseX = (clientX / zoomScale);
      const currentMouseY = (clientY / zoomScale);
      
      const initialNodePos = dragStartPositions.current[draggedNodeId];
      if (!initialNodePos) return;

      const targetX = currentMouseX - dragOffset.x;
      const targetY = currentMouseY - dragOffset.y;
      
      const dx = targetX - initialNodePos.x;
      const dy = targetY - initialNodePos.y;

      setNodes(prev => {
        let updatedNodes = prev.map(n => {
          if (dragStartPositions.current[n.id]) {
            return {
              ...n,
              x: dragStartPositions.current[n.id].x + dx,
              y: dragStartPositions.current[n.id].y + dy
            };
          }
          return { ...n };
        });

        const MIN_DIST_X = 190;
        const MIN_DIST_Y = 60;

        for (let iter = 0; iter < 5; iter++) {
          for (let i = 0; i < updatedNodes.length; i++) {
            for (let j = i + 1; j < updatedNodes.length; j++) {
              let n1 = updatedNodes[i];
              let n2 = updatedNodes[j];

              const diffX = n1.x - n2.x;
              const diffY = n1.y - n2.y;
              const absX = Math.abs(diffX);
              const absY = Math.abs(diffY);

              if (absX < MIN_DIST_X && absY < MIN_DIST_Y) {
                const overlapX = MIN_DIST_X - absX;
                const overlapY = MIN_DIST_Y - absY;

                const n1Dragged = dragStartPositions.current[n1.id];
                const n2Dragged = dragStartPositions.current[n2.id];

                if (overlapX < overlapY) {
                  const pushX = overlapX / 2 + 1;
                  const signX = diffX >= 0 ? 1 : -1;

                  if (n1Dragged && !n2Dragged) {
                    n2.x -= signX * (overlapX + 1);
                  } else if (!n1Dragged && n2Dragged) {
                    n1.x += signX * (overlapX + 1);
                  } else if (!n1Dragged && !n2Dragged) {
                    n1.x += signX * pushX;
                    n2.x -= signX * pushX;
                  }
                } else {
                  const pushY = overlapY / 2 + 1;
                  const signY = diffY >= 0 ? 1 : -1;

                  if (n1Dragged && !n2Dragged) {
                    n2.y -= signY * (overlapY + 1);
                  } else if (!n1Dragged && n2Dragged) {
                    n1.y += signY * (overlapY + 1);
                  } else if (!n1Dragged && !n2Dragged) {
                    n1.y += signY * pushY;
                    n2.y -= signY * pushY;
                  }
                }
              }
            }
          }
        }

        return updatedNodes;
      });

      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const borderPadding = 60;
        let pannedX = 0;
        let pannedY = 0;

        if (clientX < rect.left + borderPadding) {
          pannedX = 12;
        } else if (clientX > rect.right - borderPadding) {
          pannedX = -12;
        }

        if (clientY < rect.top + borderPadding) {
          pannedY = 12;
        } else if (clientY > rect.bottom - borderPadding) {
          pannedY = -12;
        }

        if (pannedX !== 0 || pannedY !== 0) {
          setPanOffset(prev => ({
            x: prev.x + pannedX,
            y: prev.y + pannedY
          }));
          setDragOffset(prev => ({
            x: prev.x - pannedX / zoomScale,
            y: prev.y - pannedY / zoomScale
          }));
        }
      }
    } else if (isPanning.current) {
      if (e.cancelable) e.preventDefault();
      setPanOffset({
        x: clientX - startPan.current.x,
        y: clientY - startPan.current.y
      });
    }
  };

  const handleMouseUp = () => {
    setDraggedNodeId(null);
    isPanning.current = false;
  };

  const resetView = () => {
    setZoomScale(0.8);
    setExpandedNodes({});
    setSelectedGroupId(null);
    
    if (nodes.length > 0 && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const minX = Math.min(...nodes.map(n => n.x));
      const maxX = Math.max(...nodes.map(n => n.x));
      const minY = Math.min(...nodes.map(n => n.y));
      const maxY = Math.max(...nodes.map(n => n.y));

      const treeWidth = maxX - minX;
      const treeHeight = maxY - minY;

      const centerX = (rect.width - treeWidth * 0.8) / 2 - minX * 0.8;
      const centerY = (rect.height - treeHeight * 0.8) / 2 - minY * 0.8;

      setPanOffset({ x: centerX || 150, y: centerY || 100 });
    }
  };

  const getHoverTooltipText = (node) => {
    if (node.type === 'group') return `Group node: ${node.label}`;
    if (node.type === 'dept') {
      const parent = nodes.find(n => n.id === node.parentId);
      return `Department node: ${node.label} (Parent Group: ${parent ? parent.label : 'None'})`;
    }
    if (node.type === 'section') {
      const parent = nodes.find(n => n.id === node.parentId);
      return `Section node: ${node.label} (Parent Dept: ${parent ? parent.label : 'None'})`;
    }
    if (node.type === 'team') {
      const parent = nodes.find(n => n.id === node.parentId);
      return `Team node: ${node.label} (Parent Section: ${parent ? parent.label : 'None'})`;
    }
    return node.label;
  };

  const containerClasses = isFullscreen 
    ? "fixed inset-0 z-50 bg-background w-screen h-screen p-3 flex flex-col" 
    : "bg-card border border-primary/20 rounded-xl overflow-hidden relative select-none shadow-sm min-h-[580px] w-full flex flex-col";

  return (
    <div className={containerClasses}>
      <div className="p-3 bg-primary/5 border-b border-primary/10 flex flex-wrap justify-between items-center gap-3 z-10">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="w-4 h-4 text-primary" />
          <span>Double-click to expand & focus in center. Page scrolling disabled during interactions.</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-background border border-primary/20 hover:bg-primary/5 rounded-lg text-foreground transition cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setZoomScale(p => Math.min(p + 0.1, 1.8))} 
            className="p-1.5 bg-background border border-primary/20 hover:bg-primary/5 rounded-lg text-foreground transition cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setZoomScale(p => Math.max(p - 0.1, 0.4))} 
            className="p-1.5 bg-background border border-primary/20 hover:bg-primary/5 rounded-lg text-foreground transition cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button 
            onClick={resetView} 
            className="p-1.5 bg-background border border-primary/20 hover:bg-primary/5 rounded-lg text-foreground transition flex items-center gap-1 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset View
          </button>
        </div>
      </div>

      <div 
        ref={svgRef}
        className="flex-1 w-full relative overflow-hidden bg-background/50 cursor-grab active:cursor-grabbing min-h-[520px]"
        style={{ touchAction: 'none' }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleCanvasMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        <svg 
          className="absolute inset-0 w-full h-full"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
            transformOrigin: '0 0',
            overflow: 'visible',
            touchAction: 'none',
            transition: draggedNodeId ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          <g>
            {links.map((link, idx) => {
              const targetNode = nodes.find(n => n.id === link.target);
              const isHighlighted = highlightedPath && 
                ((targetNode?.type === 'dept' && targetNode.rawId === highlightedPath.deptId) ||
                 (targetNode?.type === 'section' && targetNode.rawId === highlightedPath.sectionId) ||
                 (targetNode?.type === 'team' && targetNode.rawId === highlightedPath.teamId));

              return (
                <path
                  key={idx}
                  d={getLinkPath(link)}
                  fill="none"
                  stroke={isHighlighted ? '#ea580c' : 'currentColor'}
                  strokeWidth={isHighlighted ? 3 : 1.5}
                  className={isHighlighted ? 'text-primary' : 'text-primary/20'}
                />
              );
            })}
          </g>

          <g>
            {nodes.map((node) => {
              const isHighPath = highlightedPath && 
                ((node.type === 'group' && node.rawId === highlightedPath.groupId) ||
                 (node.type === 'dept' && node.rawId === highlightedPath.deptId) ||
                 (node.type === 'section' && node.rawId === highlightedPath.sectionId) ||
                 (node.type === 'team' && node.rawId === highlightedPath.teamId));

              let rectColor = "#d97706";
              let textColor = "#ffffff";
              let subTextColor = "#fef3c7";

              if (node.type === 'group') {
                rectColor = "#ea580c";
                textColor = "#ffffff";
                subTextColor = "#ffedd5";
              } else if (node.type === 'dept') {
                rectColor = "#4f46e5";
                textColor = "#ffffff";
                subTextColor = "#e0e7ff";
              } else if (node.type === 'section') {
                rectColor = "#059669";
                textColor = "#ffffff";
                subTextColor = "#d1fae5";
              } else if (node.type === 'team') {
                rectColor = "#8b5cf6";
                textColor = "#ffffff";
                subTextColor = "#f5f3ff";
              }

              return (
                <g 
                  key={node.id} 
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer"
                  onDoubleClick={() => handleDoubleClick(node)}
                  onMouseDown={(e) => handleNodeMouseDown(e, node)}
                  onTouchStart={(e) => handleNodeMouseDown(e, node)}
                  onMouseEnter={() => setHoveredNodeInfo({ node, text: getHoverTooltipText(node) })}
                  onMouseLeave={() => setHoveredNodeInfo(null)}
                >
                  <rect
                    x={-85}
                    y={-22}
                    width={170}
                    height={44}
                    rx={10}
                    fill={rectColor}
                    stroke={isHighPath ? "#ea580c" : "transparent"}
                    style={{
                      strokeWidth: isHighPath ? 4 : 0,
                      filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.15))'
                    }}
                  />
                  <text
                    textAnchor="middle"
                    className="text-xs font-bold pointer-events-none select-none font-sans"
                    fill={textColor}
                    y={-1}
                  >
                    {node.label.length > 18 ? `${node.label.slice(0, 16)}...` : node.label}
                  </text>
                  {node.countText && (
                    <text
                      textAnchor="middle"
                      className="text-[9px] font-semibold pointer-events-none select-none opacity-90 font-sans"
                      fill={subTextColor}
                      y={12}
                    >
                      {node.countText}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {hoveredNodeInfo && (
          <div className="absolute top-4 left-4 bg-card border border-primary/20 rounded-xl p-3 shadow-xl max-w-xs pointer-events-none z-20">
            <h5 className="text-xs font-bold text-foreground mb-1">Node Properties</h5>
            <p className="text-[11px] text-muted-foreground">{hoveredNodeInfo.text}</p>
          </div>
        )}
      </div>
    </div>
  );
}