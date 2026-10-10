/**
 * ==============================================================================
 * Pokemon Type Chart Network Visualization
 * ==============================================================================
 * 
 * Features:
 * - 18 types network relation graph with D3.js v7
 * - Gen 6-9 complete type compatibility (2x, 0.5x, 0x)
 * - Single type & Dual type compatibility (4x, 2x, 0.5x, 0.25x, 0x)
 * - Circular layout & Force-directed physics layout
 * - Interactive inspector drawer & quick-filter ribbon
 * - Pure Vanilla CSS design system (No Tailwind dependency)
 */

// ==============================================================================
// 1. Types & Chart Data (Generation 6 - 9)
// ==============================================================================

const TYPES = [
  { id: 'normal', name: 'ノーマル', color: '#9FA19F', textDark: false },
  { id: 'fire', name: 'ほのお', color: '#E62829', textDark: false },
  { id: 'water', name: 'みず', color: '#2980EF', textDark: false },
  { id: 'electric', name: 'でんき', color: '#FAC000', textDark: true },
  { id: 'grass', name: 'くさ', color: '#3FA129', textDark: false },
  { id: 'ice', name: 'こおり', color: '#3DCEF3', textDark: true },
  { id: 'fighting', name: 'かくとう', color: '#FF8000', textDark: false },
  { id: 'poison', name: 'どく', color: '#9141CB', textDark: false },
  { id: 'ground', name: 'じめん', color: '#915121', textDark: false },
  { id: 'flying', name: 'ひこう', color: '#81B9EF', textDark: true },
  { id: 'psychic', name: 'エスパー', color: '#EF4179', textDark: false },
  { id: 'bug', name: 'むし', color: '#91A119', textDark: false },
  { id: 'rock', name: 'いわ', color: '#AFA981', textDark: true },
  { id: 'ghost', name: 'ゴースト', color: '#704170', textDark: false },
  { id: 'dragon', name: 'ドラゴン', color: '#5060E1', textDark: false },
  { id: 'dark', name: 'あく', color: '#50413F', textDark: false },
  { id: 'steel', name: 'はがね', color: '#60A1B8', textDark: false },
  { id: 'fairy', name: 'フェアリー', color: '#EF70EF', textDark: false }
];

const TYPE_CHART = {
  normal: {
    superAgainst: [],
    notVeryAgainst: ['rock', 'steel'],
    noEffectAgainst: ['ghost']
  },
  fire: {
    superAgainst: ['grass', 'ice', 'bug', 'steel'],
    notVeryAgainst: ['fire', 'water', 'rock', 'dragon'],
    noEffectAgainst: []
  },
  water: {
    superAgainst: ['fire', 'ground', 'rock'],
    notVeryAgainst: ['water', 'grass', 'dragon'],
    noEffectAgainst: []
  },
  electric: {
    superAgainst: ['water', 'flying'],
    notVeryAgainst: ['electric', 'grass', 'dragon'],
    noEffectAgainst: ['ground']
  },
  grass: {
    superAgainst: ['water', 'ground', 'rock'],
    notVeryAgainst: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'],
    noEffectAgainst: []
  },
  ice: {
    superAgainst: ['grass', 'ground', 'flying', 'dragon'],
    notVeryAgainst: ['fire', 'water', 'ice', 'steel'],
    noEffectAgainst: []
  },
  fighting: {
    superAgainst: ['normal', 'ice', 'rock', 'dark', 'steel'],
    notVeryAgainst: ['poison', 'flying', 'psychic', 'bug', 'fairy'],
    noEffectAgainst: ['ghost']
  },
  poison: {
    superAgainst: ['grass', 'fairy'],
    notVeryAgainst: ['poison', 'ground', 'rock', 'ghost'],
    noEffectAgainst: ['steel']
  },
  ground: {
    superAgainst: ['fire', 'electric', 'poison', 'rock', 'steel'],
    notVeryAgainst: ['grass', 'bug'],
    noEffectAgainst: ['flying']
  },
  flying: {
    superAgainst: ['grass', 'fighting', 'bug'],
    notVeryAgainst: ['electric', 'rock', 'steel'],
    noEffectAgainst: []
  },
  psychic: {
    superAgainst: ['fighting', 'poison'],
    notVeryAgainst: ['psychic', 'steel'],
    noEffectAgainst: ['dark']
  },
  bug: {
    superAgainst: ['grass', 'psychic', 'dark'],
    notVeryAgainst: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'],
    noEffectAgainst: []
  },
  rock: {
    superAgainst: ['fire', 'ice', 'flying', 'bug'],
    notVeryAgainst: ['fighting', 'ground', 'steel'],
    noEffectAgainst: []
  },
  ghost: {
    superAgainst: ['psychic', 'ghost'],
    notVeryAgainst: ['dark'],
    noEffectAgainst: ['normal']
  },
  dragon: {
    superAgainst: ['dragon'],
    notVeryAgainst: ['steel'],
    noEffectAgainst: ['fairy']
  },
  dark: {
    superAgainst: ['psychic', 'ghost'],
    notVeryAgainst: ['fighting', 'dark', 'fairy'],
    noEffectAgainst: []
  },
  steel: {
    superAgainst: ['ice', 'rock', 'fairy'],
    notVeryAgainst: ['fire', 'water', 'electric', 'steel'],
    noEffectAgainst: []
  },
  fairy: {
    superAgainst: ['fighting', 'dragon', 'dark'],
    notVeryAgainst: ['fire', 'poison', 'steel'],
    noEffectAgainst: []
  }
};

// ==============================================================================
// 2. Application State
// ==============================================================================

let currentLayout = 'circular'; // 'circular' | 'force'
let selectionMode = 'single';    // 'single' | 'dual'
let focusedType1 = null;
let focusedType2 = null;

let showSuper = true;
let showNotVery = true;
let showImmune = true;
let isGuideVisible = true;

let simulation = null;
let svgContainer = null;
let zoomBehavior = null;
let nodesData = [];

// ==============================================================================
// 3. Type Compatibility Calculation Helpers
// ==============================================================================

/**
 * Get offensive multiplier from attackType -> defendType
 */
function getSingleMultiplier(attackType, defendType) {
  const chart = TYPE_CHART[attackType];
  if (!chart) return 1.0;
  if (chart.superAgainst.includes(defendType)) return 2.0;
  if (chart.notVeryAgainst.includes(defendType)) return 0.5;
  if (chart.noEffectAgainst.includes(defendType)) return 0.0;
  return 1.0;
}

/**
 * Get defensive multiplier when defending as def1 (+ def2) against incoming attackType
 */
function getDefensiveMultiplier(attackType, def1, def2 = null) {
  if (!def1) return 1.0;
  const m1 = getSingleMultiplier(attackType, def1);
  if (!def2) return m1;
  const m2 = getSingleMultiplier(attackType, def2);
  return m1 * m2;
}

/**
 * Get offensive multiplier when attacking targetDef using atk1 (+ atk2)
 * Dual-type attacks: evaluates best move or dual coverage
 *ばつぐん(2倍)といまひとつ(0.5倍)は 2 * 0.5 = 1 (等倍) となる
 */
function getOffensiveMultiplier(atk1, atk2, targetDef) {
  if (!atk1) return 1.0;
  const m1 = getSingleMultiplier(atk1, targetDef);
  if (!atk2) return m1;
  const m2 = getSingleMultiplier(atk2, targetDef);
  return m1 * m2;
}

/**
 * Extract active graph edges based on current filter states
 */
function getEdges() {
  const edges = [];
  TYPES.forEach(src => {
    const chart = TYPE_CHART[src.id];
    if (showSuper) {
      chart.superAgainst.forEach(tgt => edges.push({ source: src.id, target: tgt, type: 'super' }));
    }
    if (showNotVery) {
      chart.notVeryAgainst.forEach(tgt => edges.push({ source: src.id, target: tgt, type: 'notvery' }));
    }
    if (showImmune) {
      chart.noEffectAgainst.forEach(tgt => edges.push({ source: src.id, target: tgt, type: 'immune' }));
    }
  });
  return edges;
}

// ==============================================================================
// 4. D3 Graph Initialization & Layout Engine
// ==============================================================================

function initGraph() {
  const svg = d3.select('#network-svg');
  svg.selectAll('*').remove();

  const defs = svg.append('defs');

  // Helper to append arrow marker with exact pixel geometry outside node stroke
  const addMarker = (id, color, isLarge = false, opacity = 1.0) => {
    const tipX = isLarge ? 9.5 : 8.0;
    const baseY = isLarge ? 5.5 : 4.5;
    // Clearance: node radius is 23px, stroke extends to 25.25px.
    // Placing tip at 27.5px ensures tip lands directly at node border
    const refX = tipX + 27.5;

    defs.append('marker')
      .attr('id', id)
      .attr('viewBox', '0 -10 40 20')
      .attr('refX', refX)
      .attr('refY', 0)
      .attr('markerUnits', 'userSpaceOnUse')
      .attr('markerWidth', 40)
      .attr('markerHeight', 20)
      .attr('orient', 'auto')
      .attr('overflow', 'visible')
      .append('path')
      .attr('d', `M 0,${-baseY} L ${tipX},0 L 0,${baseY} Z`)
      .attr('fill', color)
      .attr('fill-opacity', opacity);
  };

  // Attack Markers (実線, ばつぐん:赤, いまひとつ:緑, むこう:青)
  addMarker('marker-super', '#f43f5e', false, 1.0);         // ばつぐん (赤)
  addMarker('marker-notvery', '#22c55e', false, 1.0);       // いまひとつ (緑)
  addMarker('marker-immune-atk', '#3b82f6', false, 1.0);    // むこう (青)

  // Ambient Markers (Unfocused state)
  addMarker('marker-super-dim', '#f43f5e', false, 0.90);
  addMarker('marker-notvery-dim', '#22c55e', false, 0.85);
  addMarker('marker-immune-atk-dim', '#3b82f6', false, 0.85);
  
  // Defense Markers (破線, ばつぐん:赤, いまひとつ:緑, むこう:青)
  addMarker('marker-quad', '#f43f5e', true, 1.0);           // 4x二重弱点 (赤・大)
  addMarker('marker-danger', '#f43f5e', false, 1.0);        // 2x弱点 (赤)
  addMarker('marker-resist', '#22c55e', false, 1.0);        // 0.5x耐性 (緑)
  addMarker('marker-quarter', '#22c55e', true, 1.0);        // 0.25x二重耐性 (緑・大)
  addMarker('marker-immune', '#3b82f6', false, 1.0);        // 0x無効 (青)

  // Main Zoomable Canvas Group
  svgContainer = svg.append('g').attr('class', 'main-view');

  zoomBehavior = d3.zoom()
    .scaleExtent([0.35, 2.5])
    .on('zoom', (event) => {
      svgContainer.attr('transform', event.transform);
    });

  svg.call(zoomBehavior);

  svgContainer.append('g').attr('class', 'links-group');
  svgContainer.append('g').attr('class', 'nodes-group');

  renderGraph();
  buildQuickTypeButtons();
}

/**
 * Render or re-layout nodes and links
 */
function renderGraph() {
  const svgElement = document.getElementById('network-svg');
  const width = svgElement.clientWidth || window.innerWidth;
  const height = svgElement.clientHeight || window.innerHeight;
  const centerX = width / 2;
  const centerY = height / 2 - 25;
  const radius = Math.min(width, height) * 0.38;

  // Node Positions (Circular by default)
  nodesData = TYPES.map((t, i) => {
    const angle = (i / TYPES.length) * 2 * Math.PI - Math.PI / 2;
    return {
      id: t.id,
      name: t.name,
      color: t.color,
      textDark: t.textDark,
      circleX: centerX + radius * Math.cos(angle),
      circleY: centerY + radius * Math.sin(angle),
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  });

  const linksData = getEdges();

  if (simulation) simulation.stop();

  if (currentLayout === 'force') {
    simulation = d3.forceSimulation(nodesData)
      .force('link', d3.forceLink(linksData).id(d => d.id).distance(150).strength(0.3))
      .force('charge', d3.forceManyBody().strength(-550))
      .force('center', d3.forceCenter(centerX, centerY))
      .force('collision', d3.forceCollide().radius(45))
      .on('tick', onTick);
  } else {
    nodesData.forEach(d => {
      d.x = d.circleX;
      d.y = d.circleY;
    });
  }

  // Render Links
  const linksGroup = svgContainer.select('.links-group');
  const linkSelection = linksGroup.selectAll('path')
    .data(linksData, d => `${d.source.id || d.source}->${d.target.id || d.target}-${d.type}`);

  linkSelection.exit().remove();

  const linkEnter = linkSelection.enter().append('path')
    .attr('class', 'graph-link')
    .attr('fill', 'none')
    .attr('stroke-dasharray', null);

  const allLinks = linkEnter.merge(linkSelection);

  // Render Nodes
  const nodesGroup = svgContainer.select('.nodes-group');
  const nodeSelection = nodesGroup.selectAll('g.node')
    .data(nodesData, d => d.id);

  nodeSelection.exit().remove();

  const nodeEnter = nodeSelection.enter().append('g')
    .attr('class', 'node cursor-pointer select-none')
    .call(d3.drag()
      .on('start', onDragStart)
      .on('drag', onDragging)
      .on('end', onDragEnd)
    )
    .on('click', (event, d) => toggleFocus(d.id));

  // Node Circle Base
  nodeEnter.append('circle')
    .attr('class', 'node-circle')
    .attr('r', 23)
    .attr('fill', d => d.color)
    .attr('stroke', '#0f172a')
    .attr('stroke-width', 2.5);

  // Node Text Label
  nodeEnter.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('fill', d => d.textDark ? '#0f172a' : '#ffffff')
    .attr('font-size', '11px')
    .attr('font-weight', '900')
    .attr('pointer-events', 'none')
    .text(d => d.name);

  const allNodes = nodeEnter.merge(nodeSelection);

  // Link & Node position update
  function onTick() {
    allLinks.attr('d', d => {
      const srcId = d.source.id || d.source;
      const tgtId = d.target.id || d.target;
      const srcNode = d.source.x !== undefined ? d.source : nodesData.find(n => n.id === srcId);
      const tgtNode = d.target.x !== undefined ? d.target : nodesData.find(n => n.id === tgtId);
      if (!srcNode || !tgtNode) return '';

      const sx = srcNode.x;
      const sy = srcNode.y;
      const tx = tgtNode.x;
      const ty = tgtNode.y;

      // Handle Self-Loop (e.g. fire -> fire, steel -> steel, dragon -> dragon)
      if (srcId === tgtId) {
        const vx = sx - centerX;
        const vy = sy - centerY;
        const dist = Math.hypot(vx, vy);
        const nx = dist > 15 ? vx / dist : 0;
        const ny = dist > 15 ? vy / dist : -1;
        const txNorm = -ny;
        const tyNorm = nx;

        const angle = 32 * Math.PI / 180;
        const sinA = Math.sin(angle);
        const cosA = Math.cos(angle);
        const rIn = 40;
        const cpDist = 28;

        const dirOutX = -txNorm * sinA + nx * cosA;
        const dirOutY = -tyNorm * sinA + ny * cosA;
        const poutX = sx + dirOutX * rIn;
        const poutY = sy + dirOutY * rIn;
        const cp1x = poutX + dirOutX * cpDist;
        const cp1y = poutY + dirOutY * cpDist;

        const dirInX = txNorm * sinA + nx * cosA;
        const dirInY = tyNorm * sinA + ny * cosA;
        const pinX = sx + dirInX * rIn;
        const pinY = sy + dirInY * rIn;
        const cp2x = pinX + dirInX * cpDist;
        const cp2y = pinY + dirInY * cpDist;

        // Straight segment from (pinX, pinY) to (sx, sy) ensures marker tangent at (sx, sy)
        // is 100% collinear with the line, and arrowhead tip lands squarely at the node outer border
        return `M${sx},${sy}L${poutX},${poutY}C${cp1x},${cp1y} ${cp2x},${cp2y} ${pinX},${pinY}L${sx},${sy}`;
      }

      const dx = tx - sx;
      const dy = ty - sy;
      const dr = Math.sqrt(dx * dx + dy * dy) * 1.25;
      return `M${sx},${sy}A${dr},${dr} 0 0,1 ${tx},${ty}`;
    });

    allNodes.attr('transform', d => `translate(${d.x},${d.y})`);
  }

  if (currentLayout === 'circular') {
    onTick();
  }

  // Node Drag Handlers
  function onDragStart(event, d) {
    if (currentLayout === 'force') {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
  }
  function onDragging(event, d) {
    d.x = event.x;
    d.y = event.y;
    if (currentLayout === 'force') {
      d.fx = event.x;
      d.fy = event.y;
    } else {
      onTick();
    }
  }
  function onDragEnd(event, d) {
    if (currentLayout === 'force') {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  }

  applyFocusStyles();
}

// ==============================================================================
// 5. Interaction & Focus Control
// ==============================================================================

/**
 * Toggle focus for a clicked type
 */
function toggleFocus(typeId) {
  if (selectionMode === 'single') {
    if (focusedType1 === typeId && !focusedType2) {
      focusedType1 = null;
    } else {
      focusedType1 = typeId;
      focusedType2 = null;
    }
  } else {
    // Dual selection mode
    if (!focusedType1) {
      focusedType1 = typeId;
    } else if (focusedType1 === typeId) {
      if (focusedType2) {
        focusedType1 = focusedType2;
        focusedType2 = null;
      } else {
        focusedType1 = null;
      }
    } else if (!focusedType2) {
      focusedType2 = typeId;
    } else if (focusedType2 === typeId) {
      focusedType2 = null;
    } else {
      // Replace slot 2 if both were filled
      focusedType2 = typeId;
    }
  }

  applyFocusStyles();
  updateInspector();
}

/**
 * Clear all selections
 */
function clearFocus() {
  focusedType1 = null;
  focusedType2 = null;
  applyFocusStyles();
  updateInspector();
}

/**
 * Reset all selections, node positions, and zoom/pan to initial layout state
 */
function resetAll() {
  focusedType1 = null;
  focusedType2 = null;

  // Reset node positions to original circular positions
  nodesData.forEach(d => {
    d.x = d.circleX;
    d.y = d.circleY;
    d.fx = null;
    d.fy = null;
    d.vx = 0;
    d.vy = 0;
  });

  // Reset zoom & pan
  const svg = d3.select('#network-svg');
  if (zoomBehavior) {
    svg.transition().duration(350).call(zoomBehavior.transform, d3.zoomIdentity);
  }

  // Restart force simulation if in force layout
  if (simulation && currentLayout === 'force') {
    simulation.alpha(0.3).restart();
  }

  renderGraph();
  applyFocusStyles();
  updateInspector();
}

/**
 * Switch selection mode (single vs dual)
 */
function setSelectionMode(mode) {
  selectionMode = mode;
  const btnSingle = document.getElementById('btn-mode-single');
  const btnDual = document.getElementById('btn-mode-dual');
  if (btnSingle && btnDual) {
    btnSingle.classList.toggle('active', mode === 'single');
    btnDual.classList.toggle('active', mode === 'dual');
  }

  if (mode === 'single' && focusedType2) {
    focusedType2 = null;
    applyFocusStyles();
    updateInspector();
  }
}

/**
 * Clear individual type slot
 */
function clearTypeSlot(slot) {
  if (slot === 1) {
    if (focusedType2) {
      focusedType1 = focusedType2;
      focusedType2 = null;
    } else {
      focusedType1 = null;
    }
  } else if (slot === 2) {
    focusedType2 = null;
  }
  applyFocusStyles();
  updateInspector();
}

// ==============================================================================
// 6. Graph Highlighting
// ==============================================================================

function applyFocusStyles() {
  if (!svgContainer) return;

  const allNodes = svgContainer.selectAll('g.node');
  const allLinks = svgContainer.selectAll('.graph-link');

  // Ambient State (Nothing selected)
  if (!focusedType1) {
    allLinks
      .attr('stroke', d => {
        if (d.type === 'super') return '#f43f5e';
        if (d.type === 'notvery') return '#22c55e';
        return '#3b82f6';
      })
      .attr('stroke-opacity', d => {
        if (d.type === 'super') return 0.65;
        if (d.type === 'notvery') return 0.50;
        return 0.55;
      })
      .attr('stroke-width', d => {
        if (d.type === 'super') return 1.6;
        return 1.4;
      })
      .attr('stroke-dasharray', null)
      .attr('marker-end', d => {
        if (d.type === 'super') return 'url(#marker-super-dim)';
        if (d.type === 'notvery') return 'url(#marker-notvery-dim)';
        return 'url(#marker-immune-atk-dim)';
      });

    allNodes
      .attr('opacity', 1)
      .select('circle')
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 2.5);

    return;
  }

  // Focused Highlights
  allLinks.each(function (d) {
    const srcId = d.source.id || d.source;
    const tgtId = d.target.id || d.target;

    const isTarget1 = tgtId === focusedType1;
    const isTarget2 = focusedType2 && tgtId === focusedType2;
    const isSource1 = srcId === focusedType1;
    const isSource2 = focusedType2 && srcId === focusedType2;

    if (!focusedType2) {
      // Single Type Focused
      if (isSource1) {
        // 攻撃: 実線, ばつぐん: 赤, いまひとつ: 緑, むこう: 青
        if (d.type === 'super') {
          d3.select(this)
            .attr('stroke', '#f43f5e')
            .attr('stroke-opacity', 1.0)
            .attr('stroke-width', 2.8)
            .attr('stroke-dasharray', null)
            .attr('marker-end', 'url(#marker-super)')
            .raise();
        } else if (d.type === 'notvery') {
          d3.select(this)
            .attr('stroke', '#22c55e')
            .attr('stroke-opacity', 0.95)
            .attr('stroke-width', 2.2)
            .attr('stroke-dasharray', null)
            .attr('marker-end', 'url(#marker-notvery)')
            .raise();
        } else if (d.type === 'immune') {
          d3.select(this)
            .attr('stroke', '#3b82f6')
            .attr('stroke-opacity', 0.95)
            .attr('stroke-width', 2.2)
            .attr('stroke-dasharray', null)
            .attr('marker-end', 'url(#marker-immune-atk)')
            .raise();
        }
      } else if (isTarget1 && d.type === 'super') {
        // 防御: 破線, ばつぐん: 赤
        d3.select(this)
          .attr('stroke', '#f43f5e')
          .attr('stroke-opacity', 1.0)
          .attr('stroke-width', 2.6)
          .attr('stroke-dasharray', '5 4')
          .attr('marker-end', 'url(#marker-danger)')
          .raise();
      } else if (isTarget1 && d.type === 'notvery') {
        // 防御: 破線, いまひとつ: 緑
        d3.select(this)
          .attr('stroke', '#22c55e')
          .attr('stroke-opacity', 0.95)
          .attr('stroke-width', 2.2)
          .attr('stroke-dasharray', '5 4')
          .attr('marker-end', 'url(#marker-resist)')
          .raise();
      } else if (isTarget1 && d.type === 'immune') {
        // 防御: 破線, むこう: 青
        d3.select(this)
          .attr('stroke', '#3b82f6')
          .attr('stroke-opacity', 0.95)
          .attr('stroke-width', 2.2)
          .attr('stroke-dasharray', '5 4')
          .attr('marker-end', 'url(#marker-immune)')
          .raise();
      } else {
        d3.select(this)
          .attr('stroke-opacity', 0.02)
          .attr('stroke-width', 0.8)
          .attr('marker-end', null);
      }
    } else {
      // Dual Types Focused
      const incomingDefMult = getDefensiveMultiplier(srcId, focusedType1, focusedType2);

      if (isTarget1 || isTarget2) {
        // Incoming attack to the dual type defender
        if (incomingDefMult === 4) {
          d3.select(this)
            .attr('stroke', '#f43f5e')
            .attr('stroke-opacity', 1.0)
            .attr('stroke-width', 3.8)
            .attr('stroke-dasharray', '6 4')
            .attr('marker-end', 'url(#marker-quad)')
            .raise();
        } else if (incomingDefMult === 2) {
          d3.select(this)
            .attr('stroke', '#f43f5e')
            .attr('stroke-opacity', 0.95)
            .attr('stroke-width', 2.6)
            .attr('stroke-dasharray', '5 4')
            .attr('marker-end', 'url(#marker-danger)')
            .raise();
        } else if (incomingDefMult === 0.5) {
          d3.select(this)
            .attr('stroke', '#22c55e')
            .attr('stroke-opacity', 0.95)
            .attr('stroke-width', 2.2)
            .attr('stroke-dasharray', '5 4')
            .attr('marker-end', 'url(#marker-resist)')
            .raise();
        } else if (incomingDefMult === 0.25) {
          d3.select(this)
            .attr('stroke', '#22c55e')
            .attr('stroke-opacity', 1.0)
            .attr('stroke-width', 3.2)
            .attr('stroke-dasharray', '6 4')
            .attr('marker-end', 'url(#marker-quarter)')
            .raise();
        } else if (incomingDefMult === 0) {
          d3.select(this)
            .attr('stroke', '#3b82f6')
            .attr('stroke-opacity', 1.0)
            .attr('stroke-width', 2.6)
            .attr('stroke-dasharray', '5 4')
            .attr('marker-end', 'url(#marker-immune)')
            .raise();
        } else {
          d3.select(this)
            .attr('stroke-opacity', 0.02)
            .attr('stroke-width', 0.8)
            .attr('marker-end', null);
        }
      } else if (isSource1 || isSource2) {
        // Outgoing attack from dual types
        if (d.type === 'super') {
          d3.select(this)
            .attr('stroke', '#f43f5e')
            .attr('stroke-opacity', 1.0)
            .attr('stroke-width', 2.8)
            .attr('stroke-dasharray', null)
            .attr('marker-end', 'url(#marker-super)')
            .raise();
        } else if (d.type === 'notvery') {
          d3.select(this)
            .attr('stroke', '#22c55e')
            .attr('stroke-opacity', 0.95)
            .attr('stroke-width', 2.2)
            .attr('stroke-dasharray', null)
            .attr('marker-end', 'url(#marker-notvery)')
            .raise();
        } else if (d.type === 'immune') {
          d3.select(this)
            .attr('stroke', '#3b82f6')
            .attr('stroke-opacity', 0.95)
            .attr('stroke-width', 2.2)
            .attr('stroke-dasharray', null)
            .attr('marker-end', 'url(#marker-immune-atk)')
            .raise();
        }
      } else {
        d3.select(this)
          .attr('stroke-opacity', 0.02)
          .attr('stroke-width', 0.8)
          .attr('marker-end', null);
      }
    }
  });

  allNodes.each(function (d) {
    const isSelf1 = d.id === focusedType1;
    const isSelf2 = focusedType2 && d.id === focusedType2;
    const circle = d3.select(this).select('circle');

    if (isSelf1) {
      d3.select(this).attr('opacity', 1.0).raise();
      circle.attr('stroke', '#38bdf8').attr('stroke-width', 4.5);
    } else if (isSelf2) {
      d3.select(this).attr('opacity', 1.0).raise();
      circle.attr('stroke', '#d946ef').attr('stroke-width', 4.5);
    } else {
      const totalDefMult = getDefensiveMultiplier(d.id, focusedType1, focusedType2);
      const totalAtkMult = getOffensiveMultiplier(focusedType1, focusedType2, d.id);

      if (totalDefMult >= 2) {
        d3.select(this).attr('opacity', 1.0);
        circle.attr('stroke', '#f43f5e').attr('stroke-width', totalDefMult === 4 ? 4.0 : 3.5);
      } else if (totalDefMult === 0.5 || totalDefMult === 0.25) {
        d3.select(this).attr('opacity', 1.0);
        circle.attr('stroke', '#22c55e').attr('stroke-width', totalDefMult === 0.25 ? 4.0 : 3.5);
      } else if (totalDefMult === 0) {
        d3.select(this).attr('opacity', 1.0);
        circle.attr('stroke', '#3b82f6').attr('stroke-width', 3.5);
      } else if (totalAtkMult >= 2) {
        d3.select(this).attr('opacity', 1.0);
        circle.attr('stroke', '#f43f5e').attr('stroke-width', 3.0);
      } else {
        d3.select(this).attr('opacity', 0.25);
        circle.attr('stroke', '#0f172a').attr('stroke-width', 2.0);
      }
    }
  });
}

// ==============================================================================
// 7. UI, Ribbon & Inspector Controls
// ==============================================================================

function buildQuickTypeButtons() {
  const container = document.getElementById('quick-types-container');
  if (!container) return;
  container.innerHTML = '';
  TYPES.forEach(t => {
    const btn = document.createElement('button');
    btn.setAttribute('data-id', t.id);
    btn.className = `ribbon-btn ${t.textDark ? 'text-dark' : 'text-light'}`;
    btn.style.backgroundColor = t.color;
    btn.textContent = t.name;
    btn.onclick = () => toggleFocus(t.id);
    container.appendChild(btn);
  });
}

function createBadge(typeObj, extra = '') {
  const textTheme = typeObj.textDark ? 'text-dark' : 'text-light';
  return `
    <span class="type-pill ${textTheme}" style="background-color: ${typeObj.color}">
      <span>${typeObj.name}</span>
      ${extra ? `<span class="type-pill-multiplier">${extra}</span>` : ''}
    </span>
  `;
}

function fillCard(key, list) {
  const listEl = document.getElementById(`inspector-${key}-list`);
  const cardEl = document.getElementById(`card-${key}`);
  if (!listEl) return;

  listEl.innerHTML = '';

  if (list.length === 0) {
    listEl.innerHTML = '<span class="badge-none">なし</span>';
    if (cardEl) cardEl.style.opacity = '0.5';
  } else {
    if (cardEl) cardEl.style.opacity = '1';
    list.forEach(item => {
      const typeObj = item.type || item;
      const extra = item.extra || '';
      listEl.innerHTML += createBadge(typeObj, extra);
    });
  }
}

function updateInspector() {
  const emptyEl = document.getElementById('inspector-empty');
  const contentEl = document.getElementById('inspector-content');

  if (!focusedType1) {
    emptyEl.classList.remove('hidden');
    contentEl.classList.add('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  contentEl.classList.remove('hidden');

  const t1 = TYPES.find(t => t.id === focusedType1);
  const t2 = focusedType2 ? TYPES.find(t => t.id === focusedType2) : null;

  // Badges
  const badge1 = document.getElementById('inspector-badge-1');
  const badge2 = document.getElementById('inspector-badge-2');
  const plusSign = document.getElementById('inspector-plus');

  badge1.style.backgroundColor = t1.color;
  badge1.className = `inspector-badge ${t1.textDark ? 'text-dark' : 'text-light'}`;
  badge1.innerHTML = `<span>${t1.name}</span>${focusedType2 ? `<button onclick="clearTypeSlot(1)" class="badge-dismiss-btn" title="解除">✕</button>` : ''}`;

  if (t2) {
    plusSign.classList.remove('hidden');
    badge2.classList.remove('hidden');
    badge2.style.backgroundColor = t2.color;
    badge2.className = `inspector-badge ${t2.textDark ? 'text-dark' : 'text-light'}`;
    badge2.innerHTML = `<span>${t2.name}</span><button onclick="clearTypeSlot(2)" class="badge-dismiss-btn" title="解除">✕</button>`;
  } else {
    plusSign.classList.add('hidden');
    badge2.classList.add('hidden');
  }

  // Multiplier format helper for dual types
  const getMultLabel = (mult) => {
    if (!focusedType2) return '';
    if (mult === 4) return '4倍';
    if (mult === 2) return '2倍';
    if (mult === 0.5) return '0.5倍';
    if (mult === 0.25) return '0.25倍';
    if (mult === 0) return '0倍';
    return `${mult}倍`;
  };

  // 1. 防御相性 (3分類: むこう, いまひとつ, ばつぐん)
  const defZeroList = [];
  const defHalfList = [];
  const defWeakList = [];

  TYPES.forEach(atk => {
    const mult = getDefensiveMultiplier(atk.id, focusedType1, focusedType2);
    if (mult >= 2) {
      defWeakList.push({ type: atk, mult, extra: getMultLabel(mult) });
    } else if (mult === 0.5 || mult === 0.25) {
      defHalfList.push({ type: atk, mult, extra: getMultLabel(mult) });
    } else if (mult === 0) {
      defZeroList.push({ type: atk, mult, extra: getMultLabel(mult) });
    }
  });

  // 2. 攻撃相性 (3分類: ばつぐん, いまひとつ, むこう)
  const atkWeakList = [];
  const atkHalfList = [];
  const atkZeroList = [];

  TYPES.forEach(def => {
    const mult = getOffensiveMultiplier(focusedType1, focusedType2, def.id);
    if (mult >= 2) {
      atkWeakList.push({ type: def, mult, extra: getMultLabel(mult) });
    } else if (mult === 0.5 || mult === 0.25) {
      atkHalfList.push({ type: def, mult, extra: getMultLabel(mult) });
    } else if (mult === 0) {
      atkZeroList.push({ type: def, mult, extra: getMultLabel(mult) });
    }
  });

  // Sort dual-type cards by multiplier
  if (focusedType2) {
    defWeakList.sort((a, b) => b.mult - a.mult);
    defHalfList.sort((a, b) => a.mult - b.mult);
    atkWeakList.sort((a, b) => b.mult - a.mult);
    atkHalfList.sort((a, b) => a.mult - b.mult);
  }

  // Fill all 6 cards
  fillCard('atk-weak', atkWeakList);
  fillCard('atk-half', atkHalfList);
  fillCard('atk-zero', atkZeroList);
  fillCard('def-zero', defZeroList);
  fillCard('def-half', defHalfList);
  fillCard('def-weak', defWeakList);
}

// Layout Switcher
function setLayout(mode) {
  currentLayout = mode;
  const btnCircular = document.getElementById('btn-circular');
  const btnForce = document.getElementById('btn-force');

  if (btnCircular && btnForce) {
    btnCircular.classList.toggle('active', mode === 'circular');
    btnForce.classList.toggle('active', mode === 'force');
  }

  renderGraph();
}

// Filter Toggles
function toggleFilter(type) {
  if (type === 'super') showSuper = document.getElementById('chk-super').checked;
  if (type === 'notvery') showNotVery = document.getElementById('chk-notvery').checked;
  if (type === 'immune') showImmune = document.getElementById('chk-immune').checked;
  renderGraph();
  applyFocusStyles();
}

// Guide Visibility Toggle
function toggleGuide(forceState) {
  const chk = document.getElementById('chk-guide');
  if (forceState !== undefined) {
    isGuideVisible = forceState;
  } else if (chk) {
    isGuideVisible = chk.checked;
  } else {
    isGuideVisible = !isGuideVisible;
  }

  if (chk) {
    chk.checked = isGuideVisible;
  }

  const elements = document.querySelectorAll('.legend-overlay, .guide-overlay');
  elements.forEach(el => {
    if (isGuideVisible) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });
}

// ==============================================================================
// 8. Event Listeners & Initialization
// ==============================================================================

window.addEventListener('resize', () => {
  renderGraph();
});

window.addEventListener('DOMContentLoaded', () => {
  initGraph();
});
