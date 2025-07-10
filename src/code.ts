// This plugin calculates the total pixel area of selected layers and sends it to the UI.
// It uses a polling mechanism to provide more frequent updates during transformations.

figma.showUI(__html__, { width: 400, height: 600 });

let pollingInterval: number | null = null;
let lastSentArea: number | null = null;

// This function calculates the current selection's area and sends it to the UI if it has changed.
const checkAndUpdateSelectionArea = () => {
  const selection = figma.currentPage.selection;

  if (selection.length > 0) {
    const totalArea = selection.reduce((sum, layer) => {
      // Ensure width and height are non-negative
      const width = Math.max(0, layer.width);
      const height = Math.max(0, layer.height);
      return sum + width * height;
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
