
import { Component, ChangeDetectionStrategy, signal, ViewChild, ElementRef } from '@angular/core';
import { SettingsPanelComponent } from './components/settings-panel/settings-panel.component';
import { NoiseGridComponent } from './components/noise-grid/noise-grid.component';
import { GeneratorConfig, Shape, CharacterSet, Palette } from './types';

@Component({
  selector: 'app-root',
  template: `
<div class="h-screen bg-gray-900 text-gray-100 flex flex-col p-4 overflow-hidden">
  <header class="w-full max-w-7xl mx-auto text-center mb-4 flex-shrink-0">
    <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
      ASCII Noise Grid Generator
    </h1>
    <p class="mt-2 text-base text-gray-400">
      Create stunning, dynamic backgrounds with customizable shapes and effects.
    </p>
  </header>

  <main class="w-full max-w-7xl mx-auto flex-grow flex flex-col md:flex-row gap-4 min-h-0">
    
    <!-- Left Pane: Renderer -->
    <div class="w-full md:w-3/4 flex-shrink-0">
      <div class="w-full h-full bg-black rounded-xl border border-gray-700 shadow-2xl shadow-indigo-500/10 overflow-hidden">
        <app-noise-grid [config]="config()"></app-noise-grid>
      </div>
    </div>

    <!-- Right Pane: Settings Drawer -->
    <div class="w-full md:w-1/4 flex flex-col gap-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 shadow-lg overflow-y-auto">
        <app-settings-panel
          [initialConfig]="config()"
          [shapes]="initialShapes"
          [characterSets]="characterSets"
          [palettes]="palettes"
          [showSvgDebug]="showSvgDebug()"
          [lastUploadedSvg]="lastUploadedSvg()"
          [svgError]="svgError()"
          (configChange)="updateConfig($event)"
          (fileUpload)="handleFileUpload($event)"
          (debugToggle)="toggleSvgDebug()">
        </app-settings-panel>
        
        <hr class="border-gray-700">

        <div class="w-full text-center">
          <h2 class="text-xl font-bold text-gray-300 mb-3">Export Options</h2>
          <div class="grid grid-cols-2 gap-3">
            <button 
              (click)="exportForWeb()"
              class="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-3 rounded-lg text-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-500">
              Download HTML
            </button>
            <button 
              (click)="exportSvg()"
              class="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-3 rounded-lg text-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-500">
              Download SVG
            </button>
            <button 
              (click)="showExportInstructions('android')"
              class="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-3 rounded-lg text-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-500">
              Android Guide
            </button>
            <button 
              (click)="showExportInstructions('ios')"
              class="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-3 rounded-lg text-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-500">
              iOS Guide
            </button>
            <button 
              (click)="downloadPng('landscape')"
              class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-lg text-sm transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500 shadow-lg">
              PNG Landscape
            </button>
            <button 
              (click)="downloadPng('portrait')"
              class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-lg text-sm transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500 shadow-lg">
              PNG Portrait
            </button>
          </div>
        </div>
    </div>
  </main>
</div>
  `,
  // Fix: Use ChangeDetectionStrategy enum for change detection.
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SettingsPanelComponent, NoiseGridComponent],
})
export class AppComponent {
  @ViewChild(NoiseGridComponent) noiseGrid!: NoiseGridComponent;

  initialShapes: Shape[] = [
      { name: 'settings', viewBox: '0 0 24 24', path: '<path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />' },
      { name: 'power', viewBox: '0 -960 960 960', path: '<path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-84 31.5-156.5T197-763l56 56q-44 44-68.5 102T160-480q0 134 93 227t227 93q134 0 227-93t93-227q0-67-24.5-125T707-707l56-56q54 54 85.5 126.5T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-40-360v-440h80v440h-80Z" />' },
      { name: 'user', viewBox: '0 -960 960 960', path: '<path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z" />' },
      { name: 'fingerprint', viewBox: '0 -960 960 960', path: '<path d="M481-781q106 0 200 45.5T838-604q7 9 4.5 16t-8.5 12q-6 5-14 4.5t-14-8.5q-55-78-141.5-119.5T481-741q-97 0-182 41.5T158-580q-6 9-14 10t-14-4q-7-5-8.5-12.5T126-602q62-85 155.5-132T481-781Zm0 94q135 0 232 90t97 223q0 50-35.5 83.5T688-257q-51 0-87.5-33.5T564-374q0-33-24.5-55.5T481-452q-34 0-58.5 22.5T398-374q0 97 57.5 162T604-121q9 3 12 10t1 15q-2 7-8 12t-15 3q-104-26-170-103.5T358-374q0-50 36-84t87-34q51 0 87 34t36 84q0 33 25 55.5t59 22.5q34 0 58-22.5t24-55.5q0-116-85-195t-203-79q-118 0-203 79t-85 194q0 24 4.5 60t21.5 84q3 9-.5 16T208-205q-8 3-15.5-.5T182-217q-15-39-21.5-77.5T154-374q0-133 96.5-223T481-687Zm0-192q64 0 125 15.5T724-819q9 5 10.5 12t-1.5 14q-3 7-10 11t-17-1q-53-27-109.5-41.5T481-839q-58 0-114 13.5T260-783q-8 5-16 2.5T232-791q-4-8-2-14.5t10-11.5q56-30 117-46t124-16Zm0 289q93 0 160 62.5T708-374q0 9-5.5 14.5T688-354q-8 0-14-5.5t-6-14.5q0-75-55.5-125.5T481-550q-76 0-130.5 50.5T296-374q0 81 28 137.5T406-123q6 6 6 14t-6 14q-6 6-14 6t-14-6q-59-62-90.5-126.5T256-374q0-91 66-153.5T481-590Zm-1 196q9 0 14.5 6t5.5 14q0 75 54 123t126 48q6 0 17-1t23-3q9-2 15.5 2.5T744-191q2 8-3 14t-13 8q-18 5-31.5 5.5t-16.5.5q-89 0-154.5-60T460-374q0-8 5.5-14t14.5-6Z" />' },
    ];
  
  characterSets: CharacterSet[] = [
    { name: 'Standard', chars: '.:-=+*#%@' },
    { name: 'Blocks', chars: '░▒▓█' },
    { name: 'Binary', chars: '01 ' },
    { name: 'Matrix', chars: '日ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹｲﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ' },
  ];

  palettes: Palette[] = [
    { name: 'Nord', background: '#2E3440', foreground: '#ECEFF4' },
    { name: 'Solarized', background: '#002b36', foreground: '#839496' },
    { name: 'Dracula', background: '#282a36', foreground: '#f8f8f2' },
    { name: 'Cyberpunk', background: '#0c0c20', foreground: '#00f0ff' },
    { name: 'Retro', background: '#2d1b00', foreground: '#ffc800' },
  ];

  config = signal<GeneratorConfig>({
    shape: this.initialShapes[0],
    backgroundColor: '#000000',
    foregroundColor: '#C8C8DC',
    displayMode: 'center',
    tileSize: 32,
    transparentBg: false,
    animationSpeed: 50,
    characterSet: this.characterSets[0],
    activePalette: undefined,
    useGradient: false,
    shapeForegroundColor: '#FFFFFF',
    gradientStart: '#ff00ff',
    gradientEnd: '#00ffff',
    noiseOpacity: 0.3,
    shapeOpacity: 1.0,
  });

  showSvgDebug = signal(false);
  lastUploadedSvg = signal<{ raw: string; path: string; viewBox: string; pathCount: number; otherElements: string[] } | null>(null);
  svgError = signal<string | null>(null);

  toggleSvgDebug() {
    this.showSvgDebug.update(v => !v);
  }

  updateConfig(newConfig: Partial<GeneratorConfig>) {
    this.config.update(current => ({ ...current, ...newConfig }));
  }

  downloadPng(orientation: 'landscape' | 'portrait') {
    this.noiseGrid?.exportHighResPng(orientation);
  }

  exportForWeb() {
    this.noiseGrid?.exportForWeb();
  }

  exportSvg() {
    this.noiseGrid?.exportAsSvg();
  }

  handleFileUpload(event: Event) {
    this.svgError.set(null);
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    if (file.type !== 'image/svg+xml') {
      this.svgError.set('Invalid file type. Please upload a valid SVG file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        this.svgError.set('Could not read the file.');
        return;
      }
      
      try {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(text, 'image/svg+xml');

        const parserError = svgDoc.querySelector('parsererror');
        if (parserError) {
          throw new Error('Could not parse SVG. Check file for syntax errors.');
        }

        const svgElement = svgDoc.querySelector('svg');
        const pathElements = svgDoc.querySelectorAll('path');

        const otherShapeTags = ['circle', 'rect', 'ellipse', 'polygon', 'polyline', 'line', 'g'];
        const otherElements = otherShapeTags.filter(tag => svgDoc.querySelector(tag));

        if (pathElements.length === 0) {
          let error = 'No <path> elements found in the SVG. This tool requires SVGs with path data.';
          if (otherElements.length > 0) {
            error += ` Found <${otherElements.join('>, <')}> elements. Please convert them to a single path.`;
          }
          throw new Error(error);
        }
        
        const combinedPaths = Array.from(pathElements).map(p => p.outerHTML).join('');

        const viewBox = svgElement?.getAttribute('viewBox') ?? '0 0 24 24';

        this.lastUploadedSvg.set({
          raw: text,
          path: combinedPaths,
          viewBox: viewBox,
          pathCount: pathElements.length,
          otherElements: otherElements
        });

        const customShape: Shape = {
          name: 'custom',
          path: combinedPaths,
          viewBox: viewBox
        };

        this.config.update(current => ({ ...current, shape: customShape }));

      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        this.svgError.set(`Error: ${message}`);
        this.lastUploadedSvg.set({ raw: text, path: '', viewBox: '', pathCount: 0, otherElements: [] });
      }
    };
    reader.onerror = () => {
        this.svgError.set('Error reading file.');
    };
    reader.readAsText(file);
    input.value = ''; // Reset file input
  }

  showExportInstructions(platform: 'android' | 'ios') {
    const header = `--- NATIVE ${platform.toUpperCase()} IMPLEMENTATION GUIDE ---`;
    const instructions = `Generating a live, animated background natively requires recreating the animation logic in your app's native language (Kotlin/Java for Android, Swift for iOS).\n\nA static PNG is easier to use. If you need the animation, here is the core logic to guide your developer:\n
1.  **Canvas/Drawing Surface:** Use a custom View (Android) or UIView/SpriteKit Scene (iOS) as your drawing surface.

2.  **Grid System:** Calculate the number of rows and columns based on the view size and a fixed font size. Store the characters in a 2D array.

3.  **Character Set & Shape:** Pass the user's selected character set and shape data (as an SVG path or a pre-rendered bitmap) to your native view.

4.  **Animation Loop:** Use a native animation mechanism (e.g., Android's Choreographer, iOS's CADisplayLink) to create a rendering loop.

5.  **Drawing Frame:** On each frame:
    - Draw the background color.
    - Iterate through your 2D character grid.
    - For each character's position, determine its opacity based on whether it falls within the shape's boundaries.
    - Draw the character with the calculated color and opacity.
    - Randomly replace a small percentage of characters in the grid to create the "noise" effect.

This approach provides a performant, native version of the web animation.`;
    
    alert(`${header}\n\n${instructions}`);
  }
}
