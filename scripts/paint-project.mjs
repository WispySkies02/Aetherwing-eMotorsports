import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function findPaintProject() {
  const configured=process.env.AETHERWING_PAINT_PROJECT;
  const candidates=configured?[resolve(configured)]:[
    fileURLToPath(new URL('../../aetherwing-paint/',import.meta.url)),
    fileURLToPath(new URL('../../aetherwing_paint_public/',import.meta.url))
  ];
  const project=candidates.find((candidate)=>existsSync(join(candidate,'netlify/functions/paint-data.cjs')));
  if(configured&&!project)throw new Error(`AETHERWING_PAINT_PROJECT does not contain netlify/functions/paint-data.cjs: ${configured}`);
  return project;
}
