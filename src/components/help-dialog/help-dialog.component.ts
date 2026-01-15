
import { Component, ChangeDetectionStrategy, output } from '@angular/core';

@Component({
  selector: 'app-help-dialog',
  standalone: true,
  template: `
    <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:py-8" (click)="close.emit()">
      <div class="w-full max-w-2xl bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl text-gray-300 p-6 sm:p-8 flex flex-col max-h-full relative" (click)="$event.stopPropagation()">
        
        <button (click)="close.emit()" class="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200 z-10">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>

        <header class="mb-6 flex-shrink-0">
          <div>
            <h2 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400 pr-8">
              Generator Guide
            </h2>
            <p class="text-gray-400 mt-1">How to use the ASCII Noise Grid Generator</p>
          </div>
        </header>

        <main class="space-y-6 text-gray-300 overflow-y-auto min-h-0">
          <div class="space-y-2">
            <h3 class="font-semibold text-lg text-indigo-300">Overview</h3>
            <p>This tool lets you create unique, animated backgrounds. Customize shapes, colors, animation speed, and character sets to produce a unique visual effect for your projects.</p>
          </div>

          <div class="space-y-2">
            <h3 class="font-semibold text-lg text-indigo-300">Key Features</h3>
            <ul class="list-disc list-inside space-y-2 pl-2">
              <li><strong>Shapes:</strong> Choose a default shape or upload your own SVG. For best results, use SVGs that contain simple <code class="bg-gray-700 text-pink-300 px-1 py-0.5 rounded-md text-sm">&lt;path&gt;</code> elements. The tool will automatically combine all paths found.</li>
              <li><strong>Display Mode:</strong> <code class="bg-gray-700 text-pink-300 px-1 py-0.5 rounded-md text-sm">Center</code> shows one large, centered shape. <code class="bg-gray-700 text-pink-300 px-1 py-0.5 rounded-md text-sm">Tile</code> repeats the shape in a grid, with an adjustable tile size.</li>
              <li><strong>Colors & Palettes:</strong> Customize every color individually or choose from a preset palette for a quick, professional look. Use the <code class="bg-gray-700 text-pink-300 px-1 py-0.5 rounded-md text-sm">Shape Gradient</code> option for beautiful color transitions across your shape.</li>
              <li><strong>Character Sets:</strong> Select the pool of characters used to draw the image, from standard ASCII to block characters or even Matrix-style Katakana.</li>
            </ul>
          </div>

          <div class="space-y-2">
            <h3 class="font-semibold text-lg text-indigo-300">Exporting Your Creation</h3>
            <p>You have several options to save and use your work:</p>
            <ul class="list-disc list-inside space-y-2 pl-2">
              <li><strong>PNG:</strong> Download a high-resolution, static image of the current frame, perfect for wallpapers or static website backgrounds. Available in landscape and portrait orientations.</li>
              <li><strong>SVG:</strong> Export a vector-based SVG file. This is great for scalability but does not include animation. It's a snapshot of the current state.</li>
              <li><strong>HTML:</strong> Get a self-contained HTML file with the full JavaScript animation included. You can host this file directly or embed its code into your own web projects.</li>
              <li><strong>Native Guides:</strong> The Android/iOS guides provide high-level instructions for developers on how to recreate this effect natively in their mobile apps.</li>
            </ul>
          </div>
        </main>
        
        <footer class="mt-8 text-center flex-shrink-0">
            <button (click)="close.emit()" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500 shadow-lg">
              Got it!
            </button>
        </footer>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpDialogComponent {
  close = output<void>();
}
