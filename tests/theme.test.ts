import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
const css = readFileSync('src/globals.css', 'utf8');
function tokens(selector: string): Record<string, string> {
  const start = css.indexOf(`  ${selector} {`);
  return Object.fromEntries([...css.slice(start, css.indexOf('}', start)).matchAll(/--([\w-]+): ([^;]+);/g)].map(m => [m[1], m[2]]));
}
function rgb(hsl: string): number[] {
  const [h,s,l] = hsl.split(' ').map(parseFloat); const saturation=s/100, light=l/100;
  const a=saturation*Math.min(light,1-light);
  return [0,8,4].map(n=> { const k=(n+h/30)%12;return light-a*Math.max(-1,Math.min(k-3,9-k,1)); });
}
function luminance(color: number[]) { return color.map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4).reduce((v,c,i)=>v+c*[0.2126,0.7152,0.0722][i],0); }
function contrast(a: number[],b:number[]) { const x=luminance(a),y=luminance(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05); }
for (const dark of [false,true]) for (const variant of ['default','blue','green','purple','orange','pink']) {
  it(`${dark?'dark':'light'} ${variant}: normal text and action labels remain legible`,()=>{
    const t={...tokens(':root'),...(dark?tokens('.dark'):{}),...(variant==='default'?{}:tokens(`${dark?'.dark':''}.theme-${variant}`))};
    for (const [text,bg] of [['foreground','background'],['muted-foreground','background'],['muted-foreground','card'],['primary','background'],['primary-foreground','primary'],['destructive','background'],['destructive-foreground','destructive'],['popover-foreground','popover']]) {
      expect(contrast(rgb(t[text]),rgb(t[bg])),`${text} on ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
    const selected=rgb(t.primary).map((v,i)=>v*0.12+rgb(t.sidebar)[i]*0.88);
    expect(contrast(rgb(t.primary),selected),'selected folder label').toBeGreaterThanOrEqual(4.5);
  });
}
