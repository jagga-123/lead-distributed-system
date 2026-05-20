import { rmSync } from 'fs';

rmSync('.next', { recursive: true, force: true });
console.log('Cleaned .next');
