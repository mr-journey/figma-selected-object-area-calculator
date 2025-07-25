/// <reference types="@figma/plugin-typings" />

// We will load React and ReactDOM from a CDN, so we don't import them here.
// This file will be processed as JSX.

// --- Load Figma Plugin DS Stylesheet from CDN ---
const figmaPluginDsCss = document.createElement("link");
figmaPluginDsCss.rel = "stylesheet";
figmaPluginDsCss.href =
  "https://cdn.jsdelivr.net/gh/thomas-lowry/figma-plugin-ds/dist/figma-plugin-ds.css";
document.head.appendChild(figmaPluginDsCss);

// --- Custom CSS for styling the UI ---
const styles = `
  body, #react-page {
    margin: 0;
    padding: 0;
  }
  .container {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    font-family: 'Inter', sans-serif;
  }
  .header {
    font-size: 14px;
    font-weight: 600;
    text-align: center;
    margin-bottom: 8px;
  }
  .section {
    background-color: #F5F5F5;
    padding: 12px;
    border-radius: 8px;
  }
  .label {
    font-size: 11px;
    font-weight: 500;
    color: #555;
    margin-bottom: 6px;
  }
  .pixel-display {
    font-size: 20px;
    font-weight: 700;
    color: #1A1A1A;
    text-align: center;
  }
  .input-group {
    display: flex;
    gap: 8px;
  }
  .input {
    flex-grow: 1;
  }
  .result-section {
    background-color: #E6F7FF;
    border: 1px solid #91D5FF;
  }
  .percentage-display {
    font-size: 24px;
    font-weight: 700;
    color: #096DD9;
    text-align: center;
  }
  .warning {
    background-color: #FFF2E8;
    border: 1px solid #FFD591;
    border-radius: 8px;
    padding: 12px;
    margin-top: 8px;
  }
  .warning-text {
    font-size: 12px;
    color: #AD6800;
    font-weight: 500;
  }
`;

// Inject custom styles into the document head
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// --- Create root element and render React app ---
// This ensures the target container element exists before we try to render into it.
const appContainer = document.createElement("div");
appContainer.id = "react-page";
document.body.appendChild(appContainer);

// --- Load React and ReactDOM from CDN ---
// We wait for the window to load to ensure that React and ReactDOM are available.
window.onload = () => {
  // Define the App component inside the onload handler to ensure it's in scope
  function App() {
    // Access React hooks from the global React object provided by the CDN script.
    const { useState, useEffect } = React;

    const [selectedArea, setSelectedArea] = useState(0);
    const [totalArea, setTotalArea] = useState("");
    const [percentage, setPercentage] = useState(0);
    const [hasFallback, setHasFallback] = useState(false);

    // Listen for messages from the plugin's main code
    useEffect(() => {
      window.onmessage = (event) => {
        if (event.data.pluginMessage) {
          const { type, area, hasFallback } = event.data.pluginMessage;
          if (type === "selectionChange") {
            setSelectedArea(area);
            setHasFallback(hasFallback || false);
          }
        }
      };
    }, []);

    // Recalculate percentage whenever selectedArea or totalArea changes
    useEffect(() => {
      const numericTotal = parseFloat(totalArea);
      if (selectedArea > 0 && numericTotal > 0) {
        setPercentage((selectedArea / numericTotal) * 100);
      } else {
        setPercentage(0);
      }
    }, [selectedArea, totalArea]);

    // Handler for the "Use Current" button
    const handleUseCurrent = () => {
      setTotalArea(selectedArea.toFixed(0));
    };

    return (
      <div className="container">
        <h2 className="header">Area Calculator</h2>

        <div className="section">
          <div className="label">Selected Area (geometric)</div>
          <div className="pixel-display">
            {selectedArea.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}{" "}
            px²
          </div>
        </div>

        <div className="section">
          <div className="label">Area Percentage Calculator</div>
          <div className="input-group">
            <input
              type="number"
              className="input"
              value={totalArea}
              onChange={(e) => setTotalArea(e.target.value)}
              placeholder="Total area (e.g., canvas size)"
            />
            <button
              className="button button--secondary"
              onClick={handleUseCurrent}
            >
              Use Current
            </button>
          </div>
        </div>

        <div className="section result-section">
          <div className="label">Percentage of Total</div>
          <div className="percentage-display">{Math.round(percentage)}%</div>
          {hasFallback && (
            <div className="warning">
              <div className="warning-text">
                ⚠️ Some shapes used bounding box calculation instead of
                geometric area due to complexity or errors.
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const root = ReactDOM.createRoot(appContainer);
  root.render(<App />);
};
