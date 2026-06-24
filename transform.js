const fs = require('fs');

function transformFile(path) {
  let content = fs.readFileSync(path, 'utf8');

  // Replace standard zinc background colors
  content = content.replace(/bg-zinc-950/g, 'bg-zinc-50 dark:bg-zinc-950');
  content = content.replace(/bg-zinc-900\/40/g, 'bg-zinc-200/50 dark:bg-zinc-900/40');
  content = content.replace(/bg-zinc-900\/10/g, 'bg-zinc-100 dark:bg-zinc-900/10');
  content = content.replace(/bg-zinc-900\/20/g, 'bg-zinc-100 dark:bg-zinc-900/20');
  content = content.replace(/bg-zinc-900\/25/g, 'bg-zinc-100 dark:bg-zinc-900/25');
  content = content.replace(/bg-zinc-900\/30/g, 'bg-zinc-200 dark:bg-zinc-900/30');
  content = content.replace(/bg-zinc-900\/80/g, 'bg-zinc-200 dark:bg-zinc-900/80');
  content = content.replace(/bg-zinc-900/g, 'bg-zinc-100 dark:bg-zinc-900');
  content = content.replace(/bg-zinc-800\/80/g, 'bg-zinc-200/80 dark:bg-zinc-800/80');
  content = content.replace(/bg-zinc-800\/60/g, 'bg-zinc-200/60 dark:bg-zinc-800/60');
  content = content.replace(/bg-zinc-800/g, 'bg-zinc-200 dark:bg-zinc-800');
  content = content.replace(/bg-zinc-950\/80/g, 'bg-zinc-50/80 dark:bg-zinc-950/80');
  content = content.replace(/bg-zinc-950\/90/g, 'bg-zinc-50/90 dark:bg-zinc-950/90');

  // Borders
  content = content.replace(/border-zinc-900/g, 'border-zinc-200 dark:border-zinc-900');
  content = content.replace(/border-zinc-800\/80/g, 'border-zinc-300/80 dark:border-zinc-800/80');
  content = content.replace(/border-zinc-800/g, 'border-zinc-300 dark:border-zinc-800');
  content = content.replace(/border-zinc-700/g, 'border-zinc-400 dark:border-zinc-700');

  // Text colors
  content = content.replace(/text-zinc-100/g, 'text-zinc-900 dark:text-zinc-100');
  content = content.replace(/text-zinc-200/g, 'text-zinc-800 dark:text-zinc-200');
  content = content.replace(/text-zinc-300/g, 'text-zinc-700 dark:text-zinc-300');
  content = content.replace(/text-zinc-400/g, 'text-zinc-600 dark:text-zinc-400');
  content = content.replace(/text-zinc-500/g, 'text-zinc-500 dark:text-zinc-500');

  // Specific text-white replacements
  content = content.replace(/text-white/g, 'text-zinc-900 dark:text-white');
  // Restore text-white in emerald buttons
  content = content.replace(/text-zinc-900 dark:text-white hover:from/g, 'text-white hover:from');
  content = content.replace(/from-white to-zinc-400/g, 'from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400');
  content = content.replace(/fill-zinc-900 dark:fill-white/g, 'fill-white'); // Fix fill-white on Play button

  // Add ThemeToggle to page.tsx
  if (path.includes('page.tsx')) {
    if (!content.includes('import { ThemeToggle }')) {
      content = content.replace(/import { Chessboard } from 'react-chessboard';/, "import { Chessboard } from 'react-chessboard';\nimport { ThemeToggle } from '../components/ThemeToggle';");
    }
    
    // Header toggle
    if (content.includes('Play Now')) {
      const targetStr = "<button\n            onClick={() => {\n              const el = document.getElementById('modes');";
      const replaceStr = "<div className=\"flex items-center gap-4\">\n            <ThemeToggle />\n            <button\n            onClick={() => {\n              const el = document.getElementById('modes');";
      
      content = content.replace(targetStr, replaceStr);
      
      const targetStrEnd = "Play Now\n          </button>\n        </header>";
      const replaceStrEnd = "Play Now\n          </button>\n          </div>\n        </header>";
      content = content.replace(targetStrEnd, replaceStrEnd);
    }
  }

  fs.writeFileSync(path, content, 'utf8');
  console.log(`${path} transformed!`);
}

const filesToTransform = [
  'src/app/page.tsx',
  'src/app/game/page.tsx',
  'src/components/GameControls.tsx',
  'src/components/SettingsDrawer.tsx',
  'src/components/PlayerCard.tsx',
  'src/components/MoveHistory.tsx',
  'src/components/GameTimer.tsx',
  'src/components/DifficultySelector.tsx',
  'src/components/GameResultModal.tsx',
  'src/components/ChessBoard.tsx'
];

filesToTransform.forEach(f => {
  if (fs.existsSync(f)) {
    transformFile(f);
  } else {
    console.warn("File not found:", f);
  }
});
