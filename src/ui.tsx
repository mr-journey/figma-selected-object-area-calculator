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

    const [pixelCount, setPixelCount] = useState(0);
    const [totalPixels, setTotalPixels] = useState("");
    const [percentage, setPercentage] = useState(0);

    // Listen for messages from the plugin's main code
    useEffect(() => {
      window.onmessage = (event) => {
        if (event.data.pluginMessage) {
          const { type, area } = event.data.pluginMessage;
          if (type === "selectionChange") {
            setPixelCount(area);
          }
        }
      };
    }, []);

    // Recalculate percentage whenever pixelCount or totalPixels changes
    useEffect(() => {
      const numericTotal = parseFloat(totalPixels);
      if (pixelCount > 0 && numericTotal > 0) {
        setPercentage((pixelCount / numericTotal) * 100);
      } else {
        setPercentage(0);
      }
    }, [pixelCount, totalPixels]);

    // Handler for the "Use Current" button
    const handleUseCurrent = () => {
      setTotalPixels(pixelCount.toFixed(0));
    };

    return (
      <div className="container">
        <h2 className="header">Pixel Counter</h2>

        <div className="section">
          <div className="label">Selected Pixels</div>
          <div className="pixel-display">
            {pixelCount.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
            px
          </div>
        </div>

        <div className="section">
          <div className="label">Percentage Calculator</div>
          <div className="input-group">
            <input
              type="number"
              className="input"
              value={totalPixels}
              onChange={(e) => setTotalPixels(e.target.value)}
              placeholder="Total pixels (e.g., 1920*1080)"
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
          <div className="percentage-display">{percentage.toFixed(2)}%</div>
        </div>
      </div>
    );
  }

  const root = ReactDOM.createRoot(appContainer);
  root.render(<App />);
};
