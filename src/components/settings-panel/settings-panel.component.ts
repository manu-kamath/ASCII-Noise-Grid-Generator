
import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { GeneratorConfig, Shape, CharacterSet, Palette } from '../../types.js';

@Component({
  selector: 'app-settings-panel',
  imports: [FormsModule],
  template: `
<div class="flex flex-col gap-6">

  <!-- Default Shape Selection -->
  <div class="space-y-3">
    <label class="block text-sm font-semibold text-gray-400">Default Shapes</label>
    <div class="grid grid-cols-4 gap-2">
      @for (shape of shapes(); track shape.name) {
        <button
          (click)="onShapeSelect(shape)"
          [class]="'p-2 rounded-lg transition-colors duration-200 ' + (initialConfig().shape.name === shape.name && initialConfig().shape.name !== 'custom' ? 'bg-indigo-600 ring-2 ring-indigo-400' : 'bg-gray-700 hover:bg-gray-600')"
          [title]="shape.name">
          <svg class="w-6 h-6 mx-auto text-white" [attr.viewBox]="shape.viewBox || '0 0 24 24'" fill="currentColor" [innerHTML]="getSafeShapeHtml(shape.path)"></svg>
        </button>
      }
    </div>
  </div>

  <!-- Custom SVG Upload -->
  <div class="space-y-3">
    <label class="block text-sm font-semibold text-gray-400">Custom Shape</label>
    @if (initialConfig().shape.name !== 'custom') {
      <label for="svg-upload" class="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700/50 hover:bg-gray-700">
        <div class="flex flex-col items-center justify-center pt-5 pb-6">
          <svg class="w-8 h-8 mb-2 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/></svg>
          <p class="text-sm text-gray-400"><span class="font-semibold">Click to upload</span></p>
          <p class="text-xs text-gray-500">SVG file with one or more paths</p>
        </div>
        <input id="svg-upload" type="file" class="hidden" accept=".svg,image/svg+xml" (change)="onFileSelect($event)" />
      </label>
    } @else {
      <div class="flex items-center gap-4">
        <div class="p-2 rounded-lg bg-indigo-600 ring-2 ring-indigo-400">
          <svg class="w-12 h-12 text-white" [attr.viewBox]="initialConfig().shape.viewBox || '0 0 24 24'" fill="currentColor" [innerHTML]="getSafeShapeHtml(initialConfig().shape.path)"></svg>
        </div>
        <label for="svg-upload-replace" class="text-sm text-indigo-400 hover:text-indigo-300 cursor-pointer underline">
          Upload new
          <input id="svg-upload-replace" type="file" class="hidden" accept=".svg,image/svg+xml" (change)="onFileSelect($event)" />
        </label>
      </div>
    }
  </div>

  <!-- SVG Debugger Toggle -->
  <div class="flex items-center justify-between">
    <label for="debug-toggle" class="text-sm font-semibold text-gray-400">Show SVG Debugger</label>
    <label class="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" id="debug-toggle" class="sr-only peer" [checked]="showSvgDebug()" (change)="onDebugToggle()">
      <div class="w-9 h-5 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
    </label>
  </div>

  <!-- SVG Debugger Panel -->
  @if (showSvgDebug()) {
    <div class="p-3 space-y-3 bg-gray-900/70 rounded-lg border border-gray-700 text-xs">
      @if (svgError(); as error) {
        <div class="p-2 bg-red-800/50 border border-red-700 rounded-md text-red-300">
          {{ error }}
        </div>
      }
      @if (lastUploadedSvg(); as svg) {
        <div class="grid grid-cols-2 gap-3">
          <div>
            <h4 class="font-bold text-gray-300 mb-1">Original Uploaded SVG</h4>
            <div class="w-full h-32 p-1 bg-gray-800 border border-gray-600 rounded-md overflow-auto" [innerHTML]="getSafeSvg(svg.raw)"></div>
          </div>
          <div>
            <h4 class="font-bold text-gray-300 mb-1">Processed for Canvas</h4>
            <div class="w-full h-32 p-1 flex items-center justify-center bg-gray-800 border border-gray-600 rounded-md">
              @if (svg.path) {
                <img [src]="getProcessedSvgSrc(svg)" alt="Processed SVG" class="max-w-full max-h-full" />
              } @else {
                <span class="text-gray-500">No path data to show</span>
              }
            </div>
          </div>
        </div>
        <div>
          <h4 class="font-bold text-gray-300 mb-1">Extraction Details</h4>
          <ul class="list-none space-y-1 text-gray-400 bg-gray-800 p-2 rounded-md">
            <li><strong>ViewBox:</strong> <code class="text-indigo-300">{{ svg.viewBox }}</code></li>
            <li><strong>Paths Found & Used:</strong> <code class="text-indigo-300">{{ svg.pathCount }}</code> 
            </li>
            <li>
              <strong>Other Elements:</strong> 
              @if(svg.otherElements.length > 0) {
                <code class="text-yellow-400">{{ svg.otherElements.join(', ') }}</code>
                <span class="text-yellow-400">(Note: These are ignored)</span>
              } @else {
                <span class="text-gray-500">None</span>
              }
            </li>
          </ul>
        </div>
      } @else {
        <p class="text-gray-500 text-center">Upload an SVG to see debug information.</p>
      }
    </div>
  }

  <!-- Display Mode -->
  <div class="space-y-3">
    <label class="block text-sm font-semibold text-gray-400">Display Mode</label>
    <div class="flex rounded-md bg-gray-700 p-1">
      <button (click)="onDisplayModeChange('center')" [class]="'w-1/2 py-1.5 text-sm font-medium rounded-md transition ' + (initialConfig().displayMode === 'center' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600')">
        Center
      </button>
      <button (click)="onDisplayModeChange('tile')" [class]="'w-1/2 py-1.5 text-sm font-medium rounded-md transition ' + (initialConfig().displayMode === 'tile' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600')">
        Tile
      </button>
    </div>
    @if (initialConfig().displayMode === 'tile') {
      <div class="pt-1">
        <label class="text-xs text-gray-400">Tile Size: {{ initialConfig().tileSize }}</label>
        <input type="range" min="8" max="128" step="4" [value]="initialConfig().tileSize" (input)="onTileSizeChange($event)" class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500">
      </div>
    }
  </div>
  
  <!-- Animation Speed -->
  <div class="space-y-3">
      <label for="speed-slider" class="block text-sm font-semibold text-gray-400">Animation Speed</label>
      <input id="speed-slider" type="range" min="1" max="100" [value]="initialConfig().animationSpeed" (input)="onAnimationSpeedChange($event)" class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500">
  </div>

  <!-- Character Set -->
  <div class="space-y-3">
    <label class="block text-sm font-semibold text-gray-400">Character Set</label>
    <div class="grid grid-cols-2 gap-2">
      @for(set of characterSets(); track set.name) {
        <button (click)="onCharacterSetSelect(set)" [class]="'px-3 py-2 text-sm rounded-md transition ' + (initialConfig().characterSet.name === set.name ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300')">
          {{ set.name }}
        </button>
      }
    </div>
  </div>
    
  <!-- Colors -->
  <div class="space-y-3">
    <label class="block text-sm font-semibold text-gray-400">Colors</label>
    <div class="flex items-center">
      <input type="checkbox" id="transparent-toggle" [checked]="initialConfig().transparentBg" (change)="onTransparentToggle($event.target.checked)" class="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500">
      <label for="transparent-toggle" class="ml-2 text-sm text-gray-300">Transparent BG</label>
    </div>

    <div class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <label class="text-gray-300 self-center">Background</label>
        <div class="relative w-10 h-8 justify-self-end">
          <input type="color" [value]="initialConfig().backgroundColor" (input)="onBackgroundColorChange($event)" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" [disabled]="initialConfig().transparentBg">
          <div class="w-full h-full rounded-md border-2 pointer-events-none" [class]="initialConfig().transparentBg ? 'bg-gray-600 border-gray-500' : 'border-gray-400'" [style.background-color]="initialConfig().transparentBg ? '' : initialConfig().backgroundColor"></div>
        </div>

        <label class="text-gray-300 self-center">Noise</label>
        <div class="relative w-10 h-8 justify-self-end">
          <input type="color" [value]="initialConfig().foregroundColor" (input)="onForegroundColorChange($event)" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
          <div class="w-full h-full rounded-md border-2 border-gray-400 pointer-events-none" [style.background-color]="initialConfig().foregroundColor"></div>
        </div>

        <label class="text-gray-300 self-center">Shape Gradient</label>
        <label class="relative inline-flex items-center cursor-pointer justify-self-end">
          <input type="checkbox" class="sr-only peer" [checked]="initialConfig().useGradient" (change)="onUseGradientToggle($event.target.checked)">
          <div class="w-9 h-5 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>

        @if (!initialConfig().useGradient) {
          <label class="text-gray-300 self-center">Shape</label>
          <div class="relative w-10 h-8 justify-self-end">
            <input type="color" [value]="initialConfig().shapeForegroundColor" (input)="onShapeForegroundColorChange($event)" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
            <div class="w-full h-full rounded-md border-2 border-gray-400 pointer-events-none" [style.background-color]="initialConfig().shapeForegroundColor"></div>
          </div>
        } @else {
          <label class="text-gray-300 self-center">Gradient Start</label>
          <div class="relative w-10 h-8 justify-self-end">
            <input type="color" [value]="initialConfig().gradientStart" (input)="onGradientStartChange($event)" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
            <div class="w-full h-full rounded-md border-2 border-gray-400 pointer-events-none" [style.background-color]="initialConfig().gradientStart"></div>
          </div>
          <label class="text-gray-300 self-center">Gradient End</label>
          <div class="relative w-10 h-8 justify-self-end">
            <input type="color" [value]="initialConfig().gradientEnd" (input)="onGradientEndChange($event)" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
            <div class="w-full h-full rounded-md border-2 border-gray-400 pointer-events-none" [style.background-color]="initialConfig().gradientEnd"></div>
          </div>
        }
    </div>
    
    <!-- Opacity Controls -->
    <div class="pt-2 space-y-3">
      <div class="space-y-1">
        <label class="text-xs text-gray-400">Noise Opacity: {{ initialConfig().noiseOpacity.toFixed(2) }}</label>
        <input type="range" min="0" max="1" step="0.05" [value]="initialConfig().noiseOpacity" (input)="onNoiseOpacityChange($event)" class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500">
      </div>
      <div class="space-y-1">
        <label class="text-xs text-gray-400">Shape Opacity: {{ initialConfig().shapeOpacity.toFixed(2) }}</label>
        <input type="range" min="0" max="1" step="0.05" [value]="initialConfig().shapeOpacity" (input)="onShapeOpacityChange($event)" class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500">
      </div>
    </div>
  </div>

  <!-- Palette -->
  <div class="space-y-3">
    <label for="palette-select" class="block text-sm font-semibold text-gray-400">Palette</label>
    <select id="palette-select" (change)="onPaletteDropdownChange($event)" class="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5">
      <option value="">Custom</option>
      @for(palette of palettes(); track palette.name) {
        <option [value]="palette.name" [selected]="initialConfig().activePalette === palette.name">{{ palette.name }}</option>
      }
    </select>
  </div>
</div>
  `,
  // Fix: Adhere to Angular v20+ best practices by removing redundant standalone property.
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPanelComponent {
  shapes = input.required<Shape[]>();
  characterSets = input.required<CharacterSet[]>();
  palettes = input.required<Palette[]>();
  initialConfig = input.required<GeneratorConfig>();
  
  // Debugger inputs
  showSvgDebug = input.required<boolean>();
  lastUploadedSvg = input.required<{ raw: string; path: string; viewBox: string; pathCount: number; otherElements: string[] } | null>();
  svgError = input.required<string | null>();

  configChange = output<Partial<GeneratorConfig>>();
  fileUpload = output<Event>();
  debugToggle = output<void>();

  private sanitizer = inject(DomSanitizer);

  onShapeSelect(shape: Shape) {
    this.configChange.emit({ shape });
  }

  onFileSelect(event: Event) {
    this.fileUpload.emit(event);
  }

  onDebugToggle() {
    this.debugToggle.emit();
  }
  
  getSafeSvg(rawSvg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(rawSvg);
  }

  getSafeShapeHtml(path: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(path);
  }

  getProcessedSvgSrc(svgData: { path: string; viewBox: string }): string {
    if (!svgData.path) return '';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${svgData.viewBox}" fill="white">${svgData.path}</svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  onBackgroundColorChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.configChange.emit({ backgroundColor: value, transparentBg: false, activePalette: undefined });
  }

  onForegroundColorChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.configChange.emit({ foregroundColor: value, activePalette: undefined });
  }

  onShapeForegroundColorChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.configChange.emit({ shapeForegroundColor: value });
  }

  onUseGradientToggle(useGradient: boolean) {
    this.configChange.emit({ useGradient });
  }

  onGradientStartChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.configChange.emit({ gradientStart: value });
  }

  onGradientEndChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.configChange.emit({ gradientEnd: value });
  }

  onTransparentToggle(isTransparent: boolean) {
    this.configChange.emit({ transparentBg: isTransparent });
  }

  onDisplayModeChange(mode: 'center' | 'tile') {
    this.configChange.emit({ displayMode: mode });
  }

  onTileSizeChange(event: Event) {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    this.configChange.emit({ tileSize: value });
  }

  onAnimationSpeedChange(event: Event) {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    this.configChange.emit({ animationSpeed: value });
  }

  onNoiseOpacityChange(event: Event) {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.configChange.emit({ noiseOpacity: value });
  }

  onShapeOpacityChange(event: Event) {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.configChange.emit({ shapeOpacity: value });
  }

  onCharacterSetSelect(characterSet: CharacterSet) {
    this.configChange.emit({ characterSet });
  }

  onPaletteSelect(palette: Palette) {
    this.configChange.emit({ 
      backgroundColor: palette.background, 
      foregroundColor: palette.foreground,
      shapeForegroundColor: palette.foreground,
      activePalette: palette.name,
      transparentBg: false
    });
  }

  onPaletteDropdownChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const paletteName = selectElement.value;
    if (!paletteName) {
      this.configChange.emit({ activePalette: undefined });
      return;
    }
    const selectedPalette = this.palettes().find(p => p.name === paletteName);
    if (selectedPalette) {
      this.onPaletteSelect(selectedPalette);
    }
  }
}