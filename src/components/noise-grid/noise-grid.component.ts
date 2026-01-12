
import { Component, ChangeDetectionStrategy, input, ViewChild, ElementRef, AfterViewInit, OnDestroy, effect } from '@angular/core';
import { GeneratorConfig, Shape } from '../../types.ts';

@Component({
  selector: 'app-noise-grid',
  template: `
<div class="relative w-full h-full">
  @if(config().transparentBg) {
    <div class="absolute inset-0 w-full h-full" style="background-image: repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%); background-size: 20px 20px;"></div>
  }
  <canvas #noiseCanvas class="absolute inset-0 w-full h-full"></canvas>
</div>
  `,
  // Fix: Adhere to Angular v20+ best practices by removing redundant standalone property.
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoiseGridComponent implements AfterViewInit, OnDestroy {
  config = input.required<GeneratorConfig>();
  
  @ViewChild('noiseCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  
  private ctx!: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private characters = '.:-=+*#%@';
  private grid: string[][] = [];
  private cols = 0;
  private rows = 0;
  private fontSize = 10;
  private shapeCanvas: HTMLCanvasElement;
  private shapeCtx: CanvasRenderingContext2D;
  private shapeLoaded = false;
  
  constructor() {
    this.shapeCanvas = document.createElement('canvas');
    this.shapeCtx = this.shapeCanvas.getContext('2d')!;
    
    effect(() => {
      const currentConfig = this.config();
      this.loadShape(currentConfig.shape);
      this.characters = currentConfig.characterSet.chars;
      if (this.ctx) {
         this.initializeGrid();
      }
    });
  }

  ngAfterViewInit(): void {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.startAnimation();
    this.setupResizeObserver();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private setupResizeObserver() {
    const resizeObserver = new ResizeObserver(() => {
        this.initializeGrid();
    });
    resizeObserver.observe(this.canvasRef.nativeElement.parentElement!);
  }

  private initializeGrid(): void {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement!;
    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);

    this.cols = Math.floor(rect.width / this.fontSize);
    this.rows = Math.floor(rect.height / this.fontSize);
    
    this.grid = [];
    for (let i = 0; i < this.rows; i++) {
        this.grid[i] = [];
        for (let j = 0; j < this.cols; j++) {
            this.grid[i][j] = this.getRandomChar();
        }
    }
  }

  private loadShape(shape: Shape): void {
    this.shapeLoaded = false;
    const img = new Image();
    const viewBox = shape.viewBox || '0 0 24 24';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="white">${shape.path}</svg>`;
    img.src = `data:image/svg+xml;base64,${btoa(svg)}`;
    img.onload = () => {
      this.shapeCanvas.width = 128;
      this.shapeCanvas.height = 128;
      this.shapeCtx.clearRect(0, 0, 128, 128);
      this.shapeCtx.drawImage(img, 0, 0, 128, 128);
      this.shapeLoaded = true;
    };
  }

  private startAnimation(): void {
    this.initializeGrid();
    const animate = () => {
      this.draw();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    animate();
  }

  private draw(): void {
    const currentConfig = this.config();
    const parent = this.canvasRef.nativeElement.parentElement!;
    const rect = parent.getBoundingClientRect();
    const fSize = this.fontSize;

    // Use parent rect for dimensions as canvas might scale
    if (currentConfig.transparentBg) {
       this.ctx.clearRect(0, 0, rect.width, rect.height);
    } else {
        this.ctx.fillStyle = currentConfig.backgroundColor;
        this.ctx.fillRect(0, 0, rect.width, rect.height);
    }

    this.ctx.font = `${fSize}px monospace`;
    
    const shapeImageData = this.shapeLoaded ? this.shapeCtx.getImageData(0, 0, this.shapeCanvas.width, this.shapeCanvas.height).data : null;
    this.ctx.fillStyle = currentConfig.foregroundColor;
    
    let gradient: CanvasGradient | null = null;
    if (currentConfig.useGradient) {
        gradient = this.ctx.createLinearGradient(0, 0, 0, rect.height);
        gradient.addColorStop(0, currentConfig.gradientStart);
        gradient.addColorStop(1, currentConfig.gradientEnd);
    }

    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        const x = j * fSize;
        const y = i * fSize;
        const char = this.grid[i][j];
        let isShape = false;
        
        if (shapeImageData) {
           const shapePixelInfo = this.getShapePixelInfo(j, i, rect, shapeImageData, currentConfig);
            if (shapePixelInfo.alpha > 0) {
              isShape = true;
              const calculatedOpacity = (shapePixelInfo.alpha / 255) * currentConfig.shapeOpacity;
              this.ctx.fillStyle = (currentConfig.useGradient && gradient) ? gradient : currentConfig.shapeForegroundColor;
              this.ctx.globalAlpha = calculatedOpacity;
              this.ctx.fillText(char, x, y);
            }
        }
        
        if (!isShape) {
             this.ctx.globalAlpha = currentConfig.noiseOpacity;
             this.ctx.fillStyle = currentConfig.foregroundColor;
             this.ctx.fillText(char, x, y);
        }

        // Reset alpha
        this.ctx.globalAlpha = 1.0;

        // Update a fraction of the grid for animation
        if (Math.random() < currentConfig.animationSpeed / 1000) {
            this.grid[i][j] = this.getRandomChar();
        }
      }
    }
  }

  private getShapePixelInfo(gridX: number, gridY: number, canvasRect: DOMRect, shapeData: Uint8ClampedArray, config: GeneratorConfig): { alpha: number } {
    let sx = 0, sy = 0;
    const fSize = this.fontSize;
    
    if (config.displayMode === 'center') {
      const shapeDisplaySize = Math.min(canvasRect.width, canvasRect.height) * 0.8;
      const startX = (canvasRect.width - shapeDisplaySize) / 2;
      const startY = (canvasRect.height - shapeDisplaySize) / 2;
      
      const realX = gridX * fSize;
      const realY = gridY * fSize;

      if(realX < startX || realX > startX + shapeDisplaySize || realY < startY || realY > startY + shapeDisplaySize) {
        return { alpha: 0 };
      }
      
      sx = Math.floor(((realX - startX) / shapeDisplaySize) * this.shapeCanvas.width);
      sy = Math.floor(((realY - startY) / shapeDisplaySize) * this.shapeCanvas.height);
    } else { // tile mode
      const tileSize = config.tileSize * fSize;
      sx = Math.floor(((gridX * fSize) % tileSize) / tileSize * this.shapeCanvas.width);
      sy = Math.floor(((gridY * fSize) % tileSize) / tileSize * this.shapeCanvas.height);
    }

    if (sx < 0 || sx >= this.shapeCanvas.width || sy < 0 || sy >= this.shapeCanvas.height) {
        return { alpha: 0 };
    }
    
    const index = (sy * this.shapeCanvas.width + sx) * 4;
    return { alpha: shapeData[index + 3] };
  }

  private getRandomChar(): string {
    if (!this.characters || this.characters.length === 0) {
      return '';
    }
    return this.characters[Math.floor(Math.random() * this.characters.length)];
  }

  exportHighResPng(orientation: 'landscape' | 'portrait'): void {
    let width: number;
    let height: number;

    if (orientation === 'portrait') {
      width = 1080;
      height = 1920;
    } else { // default to landscape
      width = 1920;
      height = 1080;
    }

    const currentConfig = this.config();
    const fSize = this.fontSize;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = width;
    exportCanvas.height = height;
    const ctx = exportCanvas.getContext('2d')!;
    
    const cols = Math.floor(width / fSize);
    const rows = Math.floor(height / fSize);
    
    const grid: string[][] = Array.from({ length: rows }, () => 
      Array.from({ length: cols }, () => this.getRandomChar())
    );

    if (currentConfig.transparentBg) {
       ctx.clearRect(0, 0, width, height);
    } else {
        ctx.fillStyle = currentConfig.backgroundColor;
        ctx.fillRect(0, 0, width, height);
    }

    ctx.font = `${fSize}px monospace`;
    const shapeImageData = this.shapeLoaded ? this.shapeCtx.getImageData(0, 0, this.shapeCanvas.width, this.shapeCanvas.height).data : null;
    
    let gradient: CanvasGradient | null = null;
    if (currentConfig.useGradient) {
        gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, currentConfig.gradientStart);
        gradient.addColorStop(1, currentConfig.gradientEnd);
    }
    
    const canvasRect = { width, height } as DOMRect;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const x = j * fSize;
        const y = i * fSize;
        let char = grid[i][j];
        let isShape = false;

        if (shapeImageData) {
           const shapePixelInfo = this.getShapePixelInfo(j, i, canvasRect, shapeImageData, currentConfig);
            if (shapePixelInfo.alpha > 0) {
              isShape = true;
              const calculatedOpacity = (shapePixelInfo.alpha / 255) * currentConfig.shapeOpacity;
              ctx.fillStyle = (currentConfig.useGradient && gradient) ? gradient : currentConfig.shapeForegroundColor;
              ctx.globalAlpha = calculatedOpacity;
              ctx.fillText(char, x, y);
            }
        }
        
        if (!isShape) {
            ctx.globalAlpha = currentConfig.noiseOpacity;
            ctx.fillStyle = currentConfig.foregroundColor;
            ctx.fillText(char, x, y);
        }
        ctx.globalAlpha = 1.0;
      }
    }

    const link = document.createElement('a');
    link.download = `ascii-noise-grid-${width}x${height}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  }

  exportAsSvg(): void {
    const width = 1920;
    const height = 1080;
    const currentConfig = this.config();
    const fSize = this.fontSize;

    const cols = Math.floor(width / fSize);
    const rows = Math.floor(height / fSize);
    
    const grid: string[][] = Array.from({ length: rows }, () => 
      Array.from({ length: cols }, () => this.getRandomChar())
    );

    const shapeImageData = this.shapeLoaded ? this.shapeCtx.getImageData(0, 0, this.shapeCanvas.width, this.shapeCanvas.height).data : null;
    const canvasRect = { width, height } as DOMRect;

    const noiseCharElements: string[] = [];
    const shapeCharElements: string[] = [];
    
    const escapeXml = (unsafe: string) => unsafe.replace(/[<>&'"]/g, c => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const x = j * fSize;
            const y = (i + 1) * fSize; // Use y+1 for better text baseline alignment in SVG
            const char = escapeXml(grid[i][j]);
            let isShape = false;

            if (shapeImageData) {
                const shapePixelInfo = this.getShapePixelInfo(j, i, canvasRect, shapeImageData, currentConfig);
                if (shapePixelInfo.alpha > 0) {
                    isShape = true;
                    const opacity = (shapePixelInfo.alpha / 255) * currentConfig.shapeOpacity;
                    shapeCharElements.push(`<text x="${x}" y="${y}" opacity="${opacity.toFixed(3)}">${char}</text>`);
                }
            }

            if (!isShape) {
                noiseCharElements.push(`<text x="${x}" y="${y}">${char}</text>`);
            }
        }
    }

    let defs = '';
    let shapeFill = `fill="${currentConfig.shapeForegroundColor}"`;
    if (currentConfig.useGradient) {
        defs = `
  <defs>
    <!-- Gradient definition for the main shape -->
    <linearGradient id="shapeGradient" x1="0" y1="0" x2="0" y2="100%">
      <stop offset="0%" stop-color="${currentConfig.gradientStart}"/>
      <stop offset="100%" stop-color="${currentConfig.gradientEnd}"/>
    </linearGradient>
  </defs>`;
        shapeFill = `fill="url(#shapeGradient)"`;
    }

    const backgroundGroup = currentConfig.transparentBg
      ? '<!-- Background is transparent -->'
      : `
  <!-- Background Layer -->
  <g id="background">
    <rect width="100%" height="100%" fill="${currentConfig.backgroundColor}" />
  </g>`;
    
    const svgContent = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" font-family="monospace" font-size="${fSize}px" style="background-color: ${currentConfig.transparentBg ? 'transparent' : currentConfig.backgroundColor};">
  <!-- Generated by ASCII Noise Grid Generator -->
  ${defs}
  ${backgroundGroup}
  
  <!-- Noise Characters Layer -->
  <g id="noise-characters" fill="${currentConfig.foregroundColor}" opacity="${currentConfig.noiseOpacity}">
    ${noiseCharElements.join('\n    ')}
  </g>
  
  <!-- Main Shape Layer -->
  <g id="shape-characters" ${shapeFill}>
    ${shapeCharElements.join('\n    ')}
  </g>
</svg>`;

    const blob = new Blob([svgContent.trim()], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'ascii-noise-grid.svg';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  exportForWeb(): void {
    const config = this.config();
    const escapedChars = config.characterSet.chars.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const escapedPath = config.shape.path.replace(/`/g, '\\`');
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASCII Noise Animation</title>
    <style>
        body, html { margin: 0; padding: 0; overflow: hidden; background-color: ${config.backgroundColor}; }
        canvas { display: block; width: 100vw; height: 100vh; }
    </style>
</head>
<body>
    <canvas id="noiseCanvas"></canvas>
    <script>
      const config = {
          shape: { path: \`${escapedPath}\`, viewBox: '${config.shape.viewBox || '0 0 24 24'}' },
          backgroundColor: '${config.backgroundColor}',
          foregroundColor: '${config.foregroundColor}',
          transparentBg: ${config.transparentBg},
          displayMode: '${config.displayMode}',
          tileSize: ${config.tileSize},
          animationSpeed: ${config.animationSpeed},
          characterSet: { chars: '${escapedChars}' },
          useGradient: ${config.useGradient},
          shapeForegroundColor: '${config.shapeForegroundColor}',
          gradientStart: '${config.gradientStart}',
          gradientEnd: '${config.gradientEnd}',
          noiseOpacity: ${config.noiseOpacity},
          shapeOpacity: ${config.shapeOpacity}
      };

      const canvas = document.getElementById('noiseCanvas');
      const ctx = canvas.getContext('2d');
      let grid = [], cols = 0, rows = 0;
      const fontSize = 10;
      const shapeCanvas = document.createElement('canvas');
      const shapeCtx = shapeCanvas.getContext('2d');
      let shapeLoaded = false;
      let shapeImageData = null;

      function getRandomChar() { return config.characterSet.chars[Math.floor(Math.random() * config.characterSet.chars.length)]; }

      function loadShape() {
          const img = new Image();
          const svg = \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="\${config.shape.viewBox}" fill="white">\${config.shape.path}</svg>\`;
          img.src = \`data:image/svg+xml;base64,\${btoa(svg)}\`;
          img.onload = () => {
              shapeCanvas.width = 128; shapeCanvas.height = 128;
              shapeCtx.drawImage(img, 0, 0, 128, 128);
              shapeImageData = shapeCtx.getImageData(0, 0, 128, 128).data;
              shapeLoaded = true;
          };
      }

      function getShapePixelInfo(gridX, gridY, canvasRect) {
          let sx = 0, sy = 0;
          if (config.displayMode === 'center') {
              const shapeDisplaySize = Math.min(canvasRect.width, canvasRect.height) * 0.8;
              const startX = (canvasRect.width - shapeDisplaySize) / 2;
              const startY = (canvasRect.height - shapeDisplaySize) / 2;
              const realX = gridX * fontSize, realY = gridY * fontSize;
              if (realX < startX || realX > startX + shapeDisplaySize || realY < startY || realY > startY + shapeDisplaySize) return { alpha: 0 };
              sx = Math.floor(((realX - startX) / shapeDisplaySize) * shapeCanvas.width);
              sy = Math.floor(((realY - startY) / shapeDisplaySize) * shapeCanvas.height);
          } else {
              const tileSizePixels = config.tileSize * fontSize;
              sx = Math.floor(((gridX * fontSize) % tileSizePixels) / tileSizePixels * shapeCanvas.width);
              sy = Math.floor(((gridY * fontSize) % tileSizePixels) / tileSizePixels * shapeCanvas.height);
          }
          if (sx < 0 || sx >= shapeCanvas.width || sy < 0 || sy >= shapeCanvas.height) return { alpha: 0 };
          const index = (sy * shapeCanvas.width + sx) * 4;
          return { alpha: shapeImageData[index + 3] };
      }

      function initializeGrid() {
          const dpr = window.devicePixelRatio || 1;
          const rect = canvas.getBoundingClientRect();
          canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
          ctx.scale(dpr, dpr);
          cols = Math.floor(rect.width / fontSize); rows = Math.floor(rect.height / fontSize);
          grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => getRandomChar()));
      }

      function draw() {
          const rect = canvas.getBoundingClientRect();
          if (config.transparentBg) { ctx.clearRect(0, 0, rect.width, rect.height); }
          else { ctx.fillStyle = config.backgroundColor; ctx.fillRect(0, 0, rect.width, rect.height); }
          
          let gradient = null;
          if (config.useGradient) {
              gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
              gradient.addColorStop(0, config.gradientStart);
              gradient.addColorStop(1, config.gradientEnd);
          }

          ctx.font = \`\${fontSize}px monospace\`;
          for (let i = 0; i < rows; i++) {
              for (let j = 0; j < cols; j++) {
                  const char = grid[i][j];
                  let isShape = false;

                  if (shapeLoaded) {
                      const pixelInfo = getShapePixelInfo(j, i, rect);
                      if (pixelInfo.alpha > 0) { 
                        isShape = true; 
                        const opacity = (pixelInfo.alpha / 255) * config.shapeOpacity;
                        ctx.fillStyle = (config.useGradient && gradient) ? gradient : config.shapeForegroundColor;
                        ctx.globalAlpha = opacity;
                        ctx.fillText(char, j * fontSize, i * fontSize);
                      }
                  }
                  
                  if (!isShape) {
                      ctx.fillStyle = config.foregroundColor;
                      ctx.globalAlpha = config.noiseOpacity;
                      ctx.fillText(char, j * fontSize, i * fontSize);
                  }
                  
                  ctx.globalAlpha = 1.0;

                  if (Math.random() < config.animationSpeed / 1000) grid[i][j] = getRandomChar();
              }
          }
          requestAnimationFrame(draw);
      }

      window.addEventListener('resize', initializeGrid);
      loadShape();
      initializeGrid();
      draw();
    <\/script>
</body>
</html>`;

    const blob = new Blob([htmlContent.trim()], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'ascii-animation.html';
    link.click();
    URL.revokeObjectURL(link.href);
  }
}
