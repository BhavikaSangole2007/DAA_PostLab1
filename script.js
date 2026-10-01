// Default poster tree data representation
const defaultNodes = [
  { id: 'S', parent: null, cost: 0, h: 3 },
  { id: 'A', parent: 'S', cost: 1, h: 5 },
  { id: 'B', parent: 'S', cost: 2, h: 7 },
  { id: 'C', parent: 'S', cost: 3, h: 6 },
  { id: 'D', parent: 'A', cost: 2, h: 4 },
  { id: 'E', parent: 'A', cost: 3, h: 5 },
  { id: 'F', parent: 'B', cost: 1, h: 7 },
  { id: 'G', parent: 'C', cost: 2, h: 6 },
  { id: 'H', parent: 'C', cost: 3, h: 9 },
  { id: 'Goal', parent: 'C', cost: 4, h: 0 }
];

let nodesData = JSON.parse(JSON.stringify(defaultNodes));
let network = null;
let visNodes = null;
let visEdges = null;

let animationSteps = [];
let currentStepIdx = 0;
let isPlaying = false;
let playInterval = null;

// Initialize Web App
window.addEventListener('DOMContentLoaded', () => {
  renderTable();
  buildGraph();
  setupEventListeners();
});

// Setup Control Listeners
function setupEventListeners() {
  document.getElementById('btn-run').addEventListener('click', startSimulation);
  document.getElementById('btn-step-next').addEventListener('click', stepForward);
  document.getElementById('btn-reset').addEventListener('click', resetSimulation);

  document.getElementById('speed-slider').addEventListener('input', (e) => {
    document.getElementById('speed-val').innerText = `${e.target.value}ms`;
    if (isPlaying) {
      pauseSimulation();
      playSimulation();
    }
  });

  document.getElementById('btn-add-node').addEventListener('click', addNewNodeRow);
  document.getElementById('btn-preset-poster').addEventListener('click', () => loadPreset(defaultNodes));
  document.getElementById('btn-preset-binary').addEventListener('click', loadBinaryPreset);
  document.getElementById('btn-preset-deep').addEventListener('click', loadDeepPreset);
}

// Build Graph using Vis.js Library
function buildGraph() {
  const container = document.getElementById('graph-canvas');
  
  const nodesArray = nodesData.map(node => ({
    id: node.id,
    label: `${node.id}\nh=${node.h}`,
    color: { background: '#90caf9', border: '#1565c0' },
    font: { multi: true, bold: { color: '#000' } },
    shape: 'circle',
    size: 25
  }));

  const edgesArray = nodesData
    .filter(node => node.parent !== null)
    .map(node => ({
      from: node.parent,
      to: node.id,
      label: `g=${node.cost}`,
      arrows: 'to',
      color: { color: '#888' },
      font: { align: 'horizontal', size: 12 }
    }));

  visNodes = new vis.DataSet(nodesArray);
  visEdges = new vis.DataSet(edgesArray);

  const data = { nodes: visNodes, edges: visEdges };
  const options = {
    layout: {
      hierarchical: {
        direction: 'UD',
        sortMethod: 'directed',
        nodeSpacing: 120,
        levelSeparation: 80
      }
    },
    physics: false,
    interaction: { dragNodes: true, zoomView: true }
  };

  network = new vis.Network(container, data, options);
}

// Render Input Table
function renderTable() {
  const tbody = document.getElementById('node-table-body');
  tbody.innerHTML = '';

  nodesData.forEach((node, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" value="${node.id}" onchange="updateNodeData(${index}, 'id', this.value)"></td>
      <td><input type="text" value="${node.parent || ''}" onchange="updateNodeData(${index}, 'parent', this.value)" placeholder="None"></td>
      <td><input type="number" value="${node.cost}" onchange="updateNodeData(${index}, 'cost', parseInt(this.value)||0)"></td>
      <td><input type="number" value="${node.h}" onchange="updateNodeData(${index}, 'h', parseInt(this.value)||0)"></td>
      <td><button class="btn btn-outline" style="color:red" onclick="deleteNodeRow(${index})"><i class="fa-solid fa-trash"></i></button></td>
    `;
    tbody.appendChild(tr);
  });
}

function updateNodeData(index, key, value) {
  nodesData[index][key] = value === '' ? null : value;
  buildGraph();
}

function addNewNodeRow() {
  const newId = `N${nodesData.length + 1}`;
  nodesData.push({ id: newId, parent: 'S', cost: 1, h: 2 });
  renderTable();
  buildGraph();
}

function deleteNodeRow(index) {
  nodesData.splice(index, 1);
  renderTable();
  buildGraph();
}

function loadPreset(preset) {
  nodesData = JSON.parse(JSON.stringify(preset));
  renderTable();
  buildGraph();
  resetSimulation();
}

function loadBinaryPreset() {
  const binaryPreset = [
    { id: 'S', parent: null, cost: 0, h: 4 },
    { id: 'A', parent: 'S', cost: 2, h: 3 },
    { id: 'B', parent: 'S', cost: 1, h: 2 },
    { id: 'C', parent: 'A', cost: 1, h: 2 },
    { id: 'D', parent: 'A', cost: 3, h: 1 },
    { id: 'Goal', parent: 'B', cost: 2, h: 0 }
  ];
  loadPreset(binaryPreset);
}

function loadDeepPreset() {
  const deepPreset = [
    { id: 'S', parent: null, cost: 0, h: 6 },
    { id: 'A', parent: 'S', cost: 1, h: 5 },
    { id: 'B', parent: 'A', cost: 1, h: 4 },
    { id: 'C', parent: 'B', cost: 1, h: 3 },
    { id: 'Goal', parent: 'C', cost: 1, h: 0 }
  ];
  loadPreset(deepPreset);
}

// Generate IDA* Animation Steps
function generateIDAStarSteps(initialThreshold) {
  const steps = [];
  const startNode = nodesData.find(n => n.parent === null) || nodesData[0];
  const goalNode = nodesData.find(n => n.id.toLowerCase().includes('goal')) || nodesData[nodesData.length - 1];

  let threshold = initialThreshold;
  let found = false;

  // Map graph relations
  const childrenMap = {};
  nodesData.forEach(n => {
    if (!childrenMap[n.id]) childrenMap[n.id] = [];
    if (n.parent) {
      if (!childrenMap[n.parent]) childrenMap[n.parent] = [];
      childrenMap[n.parent].push(n);
    }
  });

  while (!found) {
    let nextMinThreshold = Infinity;

    steps.push({
      type: 'NEW_ITERATION',
      threshold: threshold,
      log: `--- Starting New Iteration with Threshold = ${threshold} ---`
    });

    function dfs(nodeId, g, path) {
      const nodeObj = nodesData.find(n => n.id === nodeId);
      const f = g + nodeObj.h;
      const currentPath = [...path, nodeId];

      steps.push({
        type: 'VISIT_NODE',
        currentNode: nodeId,
        g: g,
        h: nodeObj.h,
        f: f,
        threshold: threshold,
        path: currentPath,
        log: `Visiting node ${nodeId} | g=${g}, h=${nodeObj.h} => f=${f}`
      });

      if (f > threshold) {
        if (f < nextMinThreshold) nextMinThreshold = f;
        steps.push({
          type: 'PRUNE_NODE',
          currentNode: nodeId,
          g: g,
          h: nodeObj.h,
          f: f,
          threshold: threshold,
          path: currentPath,
          nextMinThreshold: nextMinThreshold,
          log: `Pruned node ${nodeId}! f(${f}) > Threshold(${threshold}). Next min threshold set to ${nextMinThreshold}`
        });
        return false;
      }

      if (nodeId === goalNode.id) {
        steps.push({
          type: 'GOAL_FOUND',
          currentNode: nodeId,
          g: g,
          h: nodeObj.h,
          f: f,
          threshold: threshold,
          path: currentPath,
          log: `🎉 Goal node ${nodeId} FOUND within threshold ${threshold}! Path: ${currentPath.join(' -> ')}`
        });
        found = true;
        return true;
      }

      const children = childrenMap[nodeId] || [];
      for (let child of children) {
        const isGoalFound = dfs(child.id, g + child.cost, currentPath);
        if (isGoalFound) return true;
      }

      return false;
    }

    const isGoalFound = dfs(startNode.id, 0, []);

    if (isGoalFound) break;

    if (nextMinThreshold === Infinity) {
      steps.push({
        type: 'SEARCH_FAILED',
        log: `Search failed! Goal cannot be reached from the given start configuration.`
      });
      break;
    }

    threshold = nextMinThreshold;
  }

  return steps;
}

// Controller Functions
function startSimulation() {
  if (isPlaying) {
    pauseSimulation();
    return;
  }

  const initialT = parseInt(document.getElementById('initial-threshold').value) || 0;
  animationSteps = generateIDAStarSteps(initialT);
  currentStepIdx = 0;
  
  document.getElementById('execution-log').innerHTML = '';
  document.getElementById('btn-run').innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
  document.getElementById('btn-step-next').disabled = false;

  playSimulation();
}

function playSimulation() {
  isPlaying = true;
  const speed = parseInt(document.getElementById('speed-slider').value) || 800;
  
  playInterval = setInterval(() => {
    if (currentStepIdx < animationSteps.length) {
      executeStep(animationSteps[currentStepIdx]);
      currentStepIdx++;
    } else {
      pauseSimulation();
    }
  }, speed);
}

function pauseSimulation() {
  isPlaying = false;
  clearInterval(playInterval);
  document.getElementById('btn-run').innerHTML = '<i class="fa-solid fa-play"></i> Resume';
}

function stepForward() {
  if (currentStepIdx < animationSteps.length) {
    executeStep(animationSteps[currentStepIdx]);
    currentStepIdx++;
  }
}

function resetSimulation() {
  pauseSimulation();
  currentStepIdx = 0;
  animationSteps = [];
  
  document.getElementById('btn-run').innerHTML = '<i class="fa-solid fa-play"></i> Run Search';
  document.getElementById('btn-step-next').disabled = true;
  document.getElementById('execution-log').innerHTML = '<div class="log-entry info">Simulation reset. Click Run to start...</div>';

  document.getElementById('current-threshold').innerText = '-';
  document.getElementById('current-node').innerText = '-';
  document.getElementById('current-f-val').innerText = '-';
  document.getElementById('next-min-threshold').innerText = '∞';

  buildGraph();
}

// Render Step to UI & Network
function executeStep(step) {
  const logBox = document.getElementById('execution-log');
  const logEntry = document.createElement('div');
  logEntry.className = 'log-entry';

  // Reset graph colors
  nodesData.forEach(n => {
    visNodes.update({ id: n.id, color: { background: '#90caf9', border: '#1565c0' } });
  });

  if (step.type === 'NEW_ITERATION') {
    logEntry.className += ' threshold';
    logEntry.innerText = step.log;
    document.getElementById('current-threshold').innerText = step.threshold;
  } 
  else if (step.type === 'VISIT_NODE') {
    logEntry.className += ' info';
    logEntry.innerText = step.log;

    document.getElementById('current-node').innerText = step.currentNode;
    document.getElementById('current-f-val').innerText = `${step.f} (g=${step.g}, h=${step.h})`;

    // Highlight active path
    step.path.forEach(nodeId => {
      visNodes.update({ id: nodeId, color: { background: '#81c784', border: '#2e7d32' } });
    });

    // Highlight current node
    visNodes.update({ id: step.currentNode, color: { background: '#ffb74d', border: '#e65100' } });
  } 
  else if (step.type === 'PRUNE_NODE') {
    logEntry.className += ' pruned';
    logEntry.innerText = step.log;

    document.getElementById('next-min-threshold').innerText = step.nextMinThreshold;

    visNodes.update({ id: step.currentNode, color: { background: '#e57373', border: '#c62828' } });
  } 
  else if (step.type === 'GOAL_FOUND') {
    logEntry.className += ' success';
    logEntry.innerText = step.log;

    step.path.forEach(nodeId => {
      visNodes.update({ id: nodeId, color: { background: '#ba68c8', border: '#6a1b9a' } });
    });
  }

  logBox.appendChild(logEntry);
  logBox.scrollTop = logBox.scrollHeight;
}
