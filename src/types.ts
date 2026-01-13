
export interface Shape {
  name: string;
  path: string;
  viewBox?: string;
}

export interface CharacterSet {
  name: string;
  chars: string;
}

export interface Palette {
  name: string;
  background: string;
  foreground: string;
}

export interface GeneratorConfig {
  shape: Shape;
  backgroundColor: string;
  foregroundColor: string; // Color for the background noise characters
  displayMode: 'center' | 'tile';
  tileSize: number;
  transparentBg: boolean;
  animationSpeed: number;
  characterSet: CharacterSet;
  activePalette?: string;
  useGradient: boolean;
  shapeForegroundColor: string; // Solid color for shape characters
  gradientStart: string;
  gradientEnd: string;
  noiseOpacity: number;
  shapeOpacity: number;
}