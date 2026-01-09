
import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { GeneratorConfig, Shape, CharacterSet, Palette } from '../../types';

@Component({
  selector: 'app-settings-panel',
  imports: [FormsModule],
  templateUrl: './settings-panel.component.html',
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
