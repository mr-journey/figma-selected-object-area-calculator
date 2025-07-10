// src/code.ts
figma.showUI(__html__, { width: 400, height: 600 });
var pollingInterval = null;
var lastSentArea = null;
var checkAndUpdateSelectionArea = () => {
  const selection = figma.currentPage.selection;
  if (selection.length > 0) {
    const totalArea = selection.reduce((sum, layer) => {
      const width = Math.max(0, layer.width);
      const height = Math.max(0, layer.height);
      return sum + width * height;
    }, 0);
    if (totalArea !== lastSentArea) {
      figma.ui.postMessage({ type: "selectionChange", area: totalArea });
      lastSentArea = totalArea;
    }
  } else {
    if (lastSentArea !== 0) {
      figma.ui.postMessage({ type: "selectionChange", area: 0 });
      lastSentArea = 0;
    }
  }
};
var managePolling = () => {
  const selection = figma.currentPage.selection;
  if (selection.length > 0 && pollingInterval === null) {
    pollingInterval = setInterval(checkAndUpdateSelectionArea, 200);
  } else if (selection.length === 0 && pollingInterval !== null) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    checkAndUpdateSelectionArea();
  }
};
figma.on("selectionchange", () => {
  managePolling();
  checkAndUpdateSelectionArea();
});
managePolling();
checkAndUpdateSelectionArea();
figma.on("close", () => {
  if (pollingInterval !== null) {
    clearInterval(pollingInterval);
  }
});
