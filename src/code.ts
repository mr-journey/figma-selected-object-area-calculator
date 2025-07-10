/// <reference types="@figma/plugin-typings" />

// This plugin calculates the total pixel area of selected layers and sends it to the UI.
// It uses a polling mechanism to provide more frequent updates during transformations.

figma.showUI(__html__, { width: 400, height: 600 });

let pollingInterval: number | null = null;
let lastSentArea: number | null = null;

// Helper function to parse SVG path data and extract coordinate points
const parsePathData = (pathData: string): { x: number; y: number }[] => {
  const points: { x: number; y: number }[] = [];
  const commands = pathData.match(/[MLCZ][^MLCZ]*/gi) || [];

  let currentX = 0;
  let currentY = 0;
  let startX = 0;
  let startY = 0;

  // Adaptive sampling based on path length - more samples for longer paths
  const getSegmentSamples = (length: number): number => {
    return Math.max(8, Math.min(32, Math.floor(length / 10)));
  };

  // Function to sample points along a cubic bezier curve
  const sampleCubicBezier = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    samples: number
  ): { x: number; y: number }[] => {
    const curvePoints: { x: number; y: number }[] = [];

    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const mt = 1 - t;
      const mt2 = mt * mt;
      const mt3 = mt2 * mt;
      const t2 = t * t;
      const t3 = t2 * t;

      const x = mt3 * x0 + 3 * mt2 * t * x1 + 3 * mt * t2 * x2 + t3 * x3;
      const y = mt3 * y0 + 3 * mt2 * t * y1 + 3 * mt * t2 * y2 + t3 * y3;

      curvePoints.push({ x, y });
    }

    return curvePoints;
  };

  // Function to sample points along a quadratic bezier curve
  const sampleQuadraticBezier = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    samples: number
  ): { x: number; y: number }[] => {
    const curvePoints: { x: number; y: number }[] = [];

    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const mt = 1 - t;
      const mt2 = mt * mt;
      const t2 = t * t;

      const x = mt2 * x0 + 2 * mt * t * x1 + t2 * x2;
      const y = mt2 * y0 + 2 * mt * t * y1 + t2 * y2;

      curvePoints.push({ x, y });
    }

    return curvePoints;
  };

  // Estimate curve length for adaptive sampling
  const estimateCurveLength = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3?: number,
    y3?: number
  ): number => {
    if (x3 !== undefined && y3 !== undefined) {
      // Cubic bezier - approximate with control polygon
      return (
        Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2) +
        Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) +
        Math.sqrt((x3 - x2) ** 2 + (y3 - y2) ** 2)
      );
    } else {
      // Quadratic bezier
      return (
        Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2) +
        Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
      );
    }
  };

  for (const command of commands) {
    const type = command[0].toUpperCase();
    const coords = command
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .map(Number)
      .filter((n) => !isNaN(n));

    switch (type) {
      case "M": // Move to
        if (coords.length >= 2) {
          currentX = coords[0];
          currentY = coords[1];
          startX = currentX;
          startY = currentY;
          points.push({ x: currentX, y: currentY });
        }
        break;

      case "L": // Line to
        if (coords.length >= 2) {
          currentX = coords[0];
          currentY = coords[1];
          points.push({ x: currentX, y: currentY });
        }
        break;

      case "C": // Cubic bezier curve
        if (coords.length >= 6) {
          const x1 = coords[0];
          const y1 = coords[1];
          const x2 = coords[2];
          const y2 = coords[3];
          const x3 = coords[4];
          const y3 = coords[5];

          // Estimate curve length and determine sample count
          const curveLength = estimateCurveLength(
            currentX,
            currentY,
            x1,
            y1,
            x2,
            y2,
            x3,
            y3
          );
          const samples = getSegmentSamples(curveLength);

          // Sample points along the curve (skip first point since it's already added)
          const curvePoints = sampleCubicBezier(
            currentX,
            currentY,
            x1,
            y1,
            x2,
            y2,
            x3,
            y3,
            samples
          );
          points.push(...curvePoints.slice(1));

          currentX = x3;
          currentY = y3;
        }
        break;

      case "Q": // Quadratic bezier curve
        if (coords.length >= 4) {
          const x1 = coords[0];
          const y1 = coords[1];
          const x2 = coords[2];
          const y2 = coords[3];

          // Estimate curve length and determine sample count
          const curveLength = estimateCurveLength(
            currentX,
            currentY,
            x1,
            y1,
            x2,
            y2
          );
          const samples = getSegmentSamples(curveLength);

          // Sample points along the curve (skip first point since it's already added)
          const curvePoints = sampleQuadraticBezier(
            currentX,
            currentY,
            x1,
            y1,
            x2,
            y2,
            samples
          );
          points.push(...curvePoints.slice(1));

          currentX = x2;
          currentY = y2;
        }
        break;

      case "Z": // Close path
        // Close the path by connecting back to start if not already there
        if (currentX !== startX || currentY !== startY) {
          points.push({ x: startX, y: startY });
        }
        break;
    }
  }

  return points;
};

// Shoelace formula for calculating polygon area
const calculatePolygonArea = (points: { x: number; y: number }[]): number => {
  if (points.length < 3) return 0;

  let area = 0;
  const n = points.length;

  for (let i = 0; i < n - 1; i++) {
    area += points[i].x * points[i + 1].y;
    area -= points[i + 1].x * points[i].y;
  }

  // Close the polygon
  area += points[n - 1].x * points[0].y;
  area -= points[0].x * points[n - 1].y;

  return Math.abs(area) / 2;
};

// Calculate area for different node types
const calculateNodeArea = (node: SceneNode): number => {
  // For vector nodes, use actual geometry
  if (node.type === "VECTOR") {
    const vectorNode = node as VectorNode;

    try {
      // Use fillGeometry to get the actual filled areas
      const fillPaths = vectorNode.fillGeometry;
      let totalArea = 0;

      for (const path of fillPaths) {
        const points = parsePathData(path.data);
        totalArea += calculatePolygonArea(points);
      }

      return totalArea;
    } catch (error) {
      console.log(
        "Vector area calculation failed, falling back to bounding box:",
        error
      );
      return Math.max(0, node.width) * Math.max(0, node.height);
    }
  }

  // For ellipse nodes, calculate actual circular area
  if (node.type === "ELLIPSE") {
    const radiusX = Math.max(0, node.width) / 2;
    const radiusY = Math.max(0, node.height) / 2;
    return Math.PI * radiusX * radiusY;
  }

  // For rectangle nodes, use geometric area (accounting for corner radius if significant)
  if (node.type === "RECTANGLE") {
    const rectNode = node as RectangleNode;
    const width = Math.max(0, node.width);
    const height = Math.max(0, node.height);

    // If there's significant corner radius, we could subtract the corner areas
    // For now, we'll use the full rectangle area as it's the most common case
    return width * height;
  }

  // For polygon nodes, try to calculate actual polygon area
  if (node.type === "POLYGON") {
    const polygonNode = node as PolygonNode;
    try {
      const fillPaths = polygonNode.fillGeometry;
      let totalArea = 0;

      for (const path of fillPaths) {
        const points = parsePathData(path.data);
        totalArea += calculatePolygonArea(points);
      }

      return totalArea;
    } catch (error) {
      console.log(
        "Polygon area calculation failed, falling back to bounding box:",
        error
      );
      return Math.max(0, node.width) * Math.max(0, node.height);
    }
  }

  // For star nodes, try to calculate actual star area
  if (node.type === "STAR") {
    const starNode = node as StarNode;
    try {
      const fillPaths = starNode.fillGeometry;
      let totalArea = 0;

      for (const path of fillPaths) {
        const points = parsePathData(path.data);
        totalArea += calculatePolygonArea(points);
      }

      return totalArea;
    } catch (error) {
      console.log(
        "Star area calculation failed, falling back to bounding box:",
        error
      );
      return Math.max(0, node.width) * Math.max(0, node.height);
    }
  }

  // For all other node types (frames, groups, text, etc.), use bounding box
  return Math.max(0, node.width) * Math.max(0, node.height);
};

// This function calculates the current selection's area and sends it to the UI if it has changed.
const checkAndUpdateSelectionArea = () => {
  const selection = figma.currentPage.selection;

  if (selection.length > 0) {
    const totalArea = selection.reduce((sum, layer) => {
      return sum + calculateNodeArea(layer);
    }, 0);

    // To avoid flooding the UI with messages, only post an update if the area has actually changed.
    if (totalArea !== lastSentArea) {
      figma.ui.postMessage({ type: "selectionChange", area: totalArea });
      lastSentArea = totalArea;
    }
  } else {
    // If nothing is selected, send an area of 0 if the last known state wasn't 0.
    if (lastSentArea !== 0) {
      figma.ui.postMessage({ type: "selectionChange", area: 0 });
      lastSentArea = 0;
    }
  }
};

// This function starts or stops the polling based on whether anything is selected.
const managePolling = () => {
  const selection = figma.currentPage.selection;

  // If there's a selection and no active poll, start one.
  if (selection.length > 0 && pollingInterval === null) {
    // Start an interval to check for changes every 200 milliseconds.
    pollingInterval = setInterval(checkAndUpdateSelectionArea, 200);
  }
  // If there's no selection and a poll is active, stop it.
  else if (selection.length === 0 && pollingInterval !== null) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    // Also send a final update to reset the UI to 0.
    checkAndUpdateSelectionArea();
  }
};

// The 'selectionchange' event is now used to manage the polling's lifecycle.
figma.on("selectionchange", () => {
  // Start or stop the polling as needed.
  managePolling();
  // Also run an immediate check for instant feedback on new selections.
  checkAndUpdateSelectionArea();
});

// Perform an initial check when the plugin is first launched.
managePolling();
checkAndUpdateSelectionArea();

// It's good practice to clean up the interval when the plugin UI is closed.
figma.on("close", () => {
  if (pollingInterval !== null) {
    clearInterval(pollingInterval);
  }
});
