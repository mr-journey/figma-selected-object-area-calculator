# Figma Selected Object Area Calculator

A Figma plugin that accurately calculates the geometric area of selected objects, including complex vector shapes with bezier curves.

## Features

🔍 **Accurate Area Calculation**
- Vector shapes with complex bezier curves (adaptive sampling)
- Ellipses using mathematical formula (π × radiusX × radiusY)
- Rectangles and polygons using actual geometry
- Real-time updates during transformations

📊 **Smart Display**
- Total area in square pixels
- Percentage of canvas area
- Live updates as you resize or transform objects
- Clean, modern UI

⚡ **Performance Optimized**
- Efficient polling system
- Only updates when area actually changes
- Graceful fallback for unsupported shapes

## Installation

1. Download or clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the plugin:
   ```bash
   npm run build
   ```
4. In Figma, go to **Plugins** → **Development** → **Import plugin from manifest**
5. Select the `manifest.json` file from the project directory

## Usage

1. **Launch the plugin**: Go to **Plugins** → **Development** → **Figma Selected Object Area Calculator**
2. **Select objects**: Click on any object or multiple objects in your Figma canvas
3. **View results**: The plugin will display:
   - Total area in square pixels
   - Percentage of the total canvas area
   - Real-time updates as you modify selections

### Supported Object Types

| Object Type | Calculation Method |
|-------------|-------------------|
| **Vector** | Parses SVG path data with adaptive bezier curve sampling |
| **Ellipse** | Mathematical formula: π × radiusX × radiusY |
| **Rectangle** | Width × height |
| **Polygon** | Shoelace formula on actual geometry points |
| **Star** | Parses geometry for accurate star shape area |
| **Other** | Bounding box fallback (width × height) |

## Development

### Scripts

- `npm run build` - Build the plugin for production
- `npm run watch` - Watch for changes and rebuild automatically

### Project Structure

```
├── src/
│   ├── code.ts      # Main plugin logic (runs in Figma)
│   ├── ui.tsx       # React UI component
│   └── types.d.ts   # TypeScript declarations
├── dist/            # Built files (created by build process)
├── build.js         # Build script
├── manifest.json    # Figma plugin manifest
└── package.json     # Dependencies and scripts
```

### Technical Details

**Advanced Geometry Calculation:**
- **Bezier Curve Sampling**: Adaptively samples curves based on length for accuracy
- **Shoelace Formula**: Calculates polygon area from coordinate points
- **Path Data Parsing**: Handles SVG path commands (M, L, C, Q, Z)
- **Error Handling**: Graceful fallback to bounding box when geometry parsing fails

**TypeScript Support:**
- Full type safety with `@figma/plugin-typings`
- CDN React types for UI components
- Zero TypeScript errors

## Examples

### Simple Shapes
- **Rectangle 100×50px**: 5,000 square pixels
- **Circle 100px diameter**: ~7,854 square pixels
- **Complex vector logo**: Accurate area based on actual filled geometry

### Multiple Selection
Select multiple objects to see their combined area - perfect for:
- Calculating total icon area in a design system
- Measuring filled space in layouts
- Comparing object sizes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `npm run build`
5. Submit a pull request

## License

MIT License - feel free to use and modify!

## Troubleshooting

**Plugin not loading?**
- Make sure you've run `npm install` and `npm run build`
- Check that `manifest.json` exists in the project root

**Area calculation seems wrong?**
- The plugin calculates filled area, not bounding box area
- For complex vectors, it uses adaptive sampling which is highly accurate
- Text objects use bounding box area (actual text rendering area varies by font)

**Performance issues?**
- The plugin polls every 200ms when objects are selected
- This provides smooth real-time updates during transformations
- Polling automatically stops when nothing is selected

---

Made with ❤️ for the Figma community
