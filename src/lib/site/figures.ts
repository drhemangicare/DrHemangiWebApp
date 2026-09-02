// Ported verbatim from the original single-file build. Generates the layered
// 3D-shaded SVG for each life chapter. Returns a markup string that callers
// inject with dangerouslySetInnerHTML — it is fully developer-authored (the
// only interpolations are numeric coordinates and a caller-supplied uid used
// to keep gradient ids unique between the two rigs on the page), so there is
// no user data and no XSS surface.
export function figSVG(k: number, uid: string): string {
  const g=uid+k;
  const defs=`<defs>
<linearGradient id="B${g}" x1=".1" y1="0" x2=".92" y2=".96">
<stop offset="0" stop-color="#FDE9E4"/><stop offset=".2" stop-color="#F8D2CB"/>
<stop offset=".54" stop-color="#E9A49D"/><stop offset=".82" stop-color="#D68C86"/><stop offset="1" stop-color="#B96A65"/></linearGradient>
<linearGradient id="S${g}" x1=".14" y1="0" x2=".92" y2=".96">
<stop offset="0" stop-color="#FFFAF8"/><stop offset=".42" stop-color="#F8DCD6"/>
<stop offset=".8" stop-color="#E3A69F"/><stop offset="1" stop-color="#C9857F"/></linearGradient>
<linearGradient id="H${g}" x1=".2" y1="0" x2=".85" y2="1">
<stop offset="0" stop-color="#7C4059"/><stop offset=".55" stop-color="#53243C"/><stop offset="1" stop-color="#331124"/></linearGradient>
<radialGradient id="C${g}" cx=".42" cy=".36" r=".64">
<stop offset="0" stop-color="#FFFFFF"/><stop offset=".28" stop-color="#FFDCD6"/>
<stop offset=".62" stop-color="#F08C85" stop-opacity=".55"/><stop offset="1" stop-color="#F08C85" stop-opacity="0"/></radialGradient>
<radialGradient id="G${g}" cx=".5" cy=".5" r=".5">
<stop offset="0" stop-color="#C9A87C" stop-opacity=".34"/><stop offset="1" stop-color="#C9A87C" stop-opacity="0"/></radialGradient>
<filter id="F${g}" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="9"/></filter>
<filter id="D${g}" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="12"/></filter>
</defs>`;

  const LN='#95534F', LW=1.35, LO=.72;
  const shadow=(cx:number,cy:number,rx:number)=>`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="10" fill="#6E3A4E" opacity=".22" filter="url(#D${g})"/>`;
  const halo=(cx:number,cy:number,r:number)=>`<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#G${g})" filter="url(#F${g})"/>`;

  /* head + hair + serene face */
  const head=(hx:number,hy:number,r:number,bun:boolean)=>`
${bun?`<ellipse cx="${hx+r*1.02}" cy="${hy-r*.72}" rx="${r*.5}" ry="${r*.46}" fill="url(#H${g})"/>`:''}
<ellipse cx="${hx}" cy="${hy-r*.14}" rx="${r*1.15}" ry="${r*1.22}" fill="url(#H${g})"/>
<circle cx="${hx}" cy="${hy+r*.12}" r="${r*.88}" fill="url(#S${g})" stroke="${LN}" stroke-width="${LW*.8}" stroke-opacity="${LO*.7}"/>
<path d="M${hx-r*.88} ${hy-r*.3}c${r*.16}-${r*.52} ${r*.5}-${r*.78} ${r*.88}-${r*.78}s${r*.72} ${r*.26} ${r*.88} ${r*.78}c-${r*.36}-${r*.36}-${r*.52}-${r*.44}-${r*.88}-${r*.44}s-${r*.52} ${r*.08}-${r*.88} ${r*.44}z" fill="url(#H${g})"/>
<path d="M${hx-r*.5} ${hy+r*.08}a${r*.17} ${r*.17} 0 0 1 ${r*.32} 0" stroke="#8C4F58" stroke-width="${r*.085}" stroke-linecap="round" fill="none" opacity=".72"/>
<path d="M${hx+r*.18} ${hy+r*.08}a${r*.17} ${r*.17} 0 0 1 ${r*.32} 0" stroke="#8C4F58" stroke-width="${r*.085}" stroke-linecap="round" fill="none" opacity=".72"/>
<path d="M${hx-r*.16} ${hy+r*.46}a${r*.19} ${r*.19} 0 0 0 ${r*.32} 0" stroke="#8C4F58" stroke-width="${r*.08}" stroke-linecap="round" fill="none" opacity=".55"/>
<ellipse cx="${hx-r*.58}" cy="${hy+r*.34}" rx="${r*.17}" ry="${r*.11}" fill="#EE9E9A" opacity=".45"/>
<ellipse cx="${hx+r*.58}" cy="${hy+r*.34}" rx="${r*.17}" ry="${r*.11}" fill="#EE9E9A" opacity=".45"/>`;

  /* full standing figure, local coords, dress hem ~244 */
  type PersonOpts = {
    x?: number; y?: number; s?: number; op?: number;
    armL?: string; armR?: string; bun?: boolean; extra?: string; hideLegs?: boolean;
  };
  const person=(o: PersonOpts = {})=>{
    const {x=0,y=0,s=1,op=1,armL='M99 102c-11 15-17 33-17 54',armR='M141 102c11 15 17 33 17 54',bun=true,extra='',hideLegs=false}=o;
    return `<g transform="translate(${x},${y}) scale(${s})" opacity="${op}">
${hideLegs?'':`<path d="M107 234v58M133 234v58" stroke="url(#S${g})" stroke-width="11.5" stroke-linecap="round" fill="none"/>
<path d="M101 294h12M127 294h12" stroke="url(#S${g})" stroke-width="8.5" stroke-linecap="round"/>`}
<path d="M120 88c-16 0-27 9-30 24l-8 34c-1 5-2 8-4 12l-20 84c19 9 40 13 62 13s43-4 62-13l-20-84c-2-4-3-7-4-12l-8-34c-3-15-14-24-30-24z" fill="url(#B${g})" stroke="${LN}" stroke-width="${LW}" stroke-opacity="${LO}"/>
<path d="M120 88c-14 0-24 8-28 21l-7 30c-1 5-2 8-4 12l-19 81c5 2 10 4 16 5l30-149z" fill="#fff" opacity=".26"/>
<path d="M150 112l8 34c1 5 2 8 4 12l20 84c-8 4-17 7-26 9l-14-139z" fill="#A6595A" opacity=".2"/>
<path d="M120 96c3 22 5 66 4 138" stroke="#C98A85" stroke-width="1.1" opacity=".3" fill="none"/>
<path d="M60 242c19 9 40 13 60 13s41-4 60-13l2 6c-19 9-40 13-62 13s-43-4-62-13z" fill="#A6595A" opacity=".16"/>
<path d="${armL}" stroke="url(#S${g})" stroke-width="10.5" stroke-linecap="round" fill="none"/>
<path d="${armR}" stroke="url(#S${g})" stroke-width="10.5" stroke-linecap="round" fill="none"/>
<path d="M120 74v16" stroke="url(#S${g})" stroke-width="15" stroke-linecap="round"/>
${head(120,56,21,bun)}
${extra}
</g>`;
  };

  const dots=`<circle cx="30" cy="72" r="4" fill="#C9A87C" opacity=".65"/>
<circle cx="212" cy="94" r="3.2" fill="#E3A7A2" opacity=".75"/>
<circle cx="206" cy="238" r="5" fill="#F2C9C4" opacity=".6"/>
<circle cx="26" cy="212" r="3.4" fill="#C9A87C" opacity=".55"/>
<circle cx="196" cy="44" r="2.4" fill="#C9A87C" opacity=".5"/>`;

  if(k===0) return `<svg viewBox="0 0 240 320">${defs}${halo(120,168,108)}${shadow(120,302,62)}
${person({})}
<circle class="fg-core" cx="120" cy="152" r="24" fill="url(#C${g})" filter="url(#F${g})"/>
${dots}</svg>`;

  if(k===1) return `<svg viewBox="0 0 240 320">${defs}${halo(120,160,112)}
${shadow(74,272,40)}${shadow(166,272,40)}
${person({x:-17,y:38,s:.76,armL:'M99 102c-11 15-17 33-17 54',armR:'M141 102c14 12 22 26 25 42'})}
${person({x:75,y:38,s:.76,op:.97,armL:'M99 102c-14 12-22 26-25 42',armR:'M141 102c11 15 17 33 17 54',bun:false})}
<g class="fg-core">
<circle cx="120" cy="126" r="30" fill="url(#C${g})" filter="url(#F${g})"/>
<path d="M120 142s-20-13-20-25.2A11.1 11.1 0 0 1 120 110a11.1 11.1 0 0 1 20 6.8c0 12.2-20 25.2-20 25.2z" fill="#EF9F99" stroke="#D07E78" stroke-width="1.2" opacity=".92"/>
</g>
<circle cx="120" cy="74" r="4.4" fill="#C9A87C" opacity=".8"/>
<circle cx="99" cy="60" r="2.8" fill="#C9A87C" opacity=".55"/><circle cx="141" cy="60" r="2.8" fill="#C9A87C" opacity=".55"/>
${dots}</svg>`;

  if(k===2) return `<svg viewBox="0 0 240 320">${defs}${halo(122,172,114)}${shadow(120,302,64)}
${person({armL:'M97 102c-14 14-21 32-21 52',armR:'M143 102c13 11 20 24 22 40',extra:`
<ellipse cx="122" cy="170" rx="46" ry="44" fill="url(#B${g})" stroke="${LN}" stroke-width="${LW}" stroke-opacity="${LO}"/>
<path d="M122 126a46 44 0 0 1 0 88 46 44 0 0 0 0-88z" fill="#A6595A" opacity=".22"/>
<path d="M94 140a46 44 0 0 1 44-9 46 44 0 0 0-53 39z" fill="#fff" opacity=".38"/>`})}
<g class="fg-core"><circle cx="122" cy="170" r="32" fill="url(#C${g})" filter="url(#F${g})"/></g>
<g>
<path d="M122 144c-13 0-23 10-23 22 0 9 5 16 13 20-3 6-2 12 3 15 6 3 13 0 16-6 11-4 17-14 17-25 0-14-13-26-26-26z" fill="#FFF7F5" stroke="#C88C86" stroke-width="1.5"/>
<path d="M113 158a3.6 3.6 0 0 1 6 0" stroke="#8B4A50" stroke-width="1.5" fill="none" stroke-linecap="round"/>
<path d="M125 157a3.6 3.6 0 0 1 6 0" stroke="#8B4A50" stroke-width="1.5" fill="none" stroke-linecap="round"/>
<path d="M118 166a4.6 4.6 0 0 0 7 0" stroke="#C88C86" stroke-width="1.5" fill="none" stroke-linecap="round"/>
</g>
${dots}</svg>`;

  return `<svg viewBox="0 0 240 320">${defs}${halo(120,168,110)}${shadow(116,302,62)}
${person({x:-4,armL:'M99 102c-13 15-20 34-18 54 1 8 8 13 17 11',armR:'M141 98c15 11 24 27 24 44 0 8-7 13-15 12'})}
<g>
<circle class="fg-core" cx="148" cy="166" r="27" fill="url(#C${g})" filter="url(#F${g})"/>
<path d="M148 140c-19 0-33 11-33 25 0 13 11 23 26 26 2 7 9 11 16 9 7-2 11-9 10-16 8-5 13-12 13-21 0-13-13-23-32-23z" fill="#FFF9F7" stroke="#D3A09A" stroke-width="1.5"/>
<path d="M139 155a3.5 3.5 0 0 1 6 0" stroke="#8B4A50" stroke-width="1.5" fill="none" stroke-linecap="round"/>
<path d="M151 154a3.5 3.5 0 0 1 6 0" stroke="#8B4A50" stroke-width="1.5" fill="none" stroke-linecap="round"/>
<path d="M144 163a4.4 4.4 0 0 0 7 0" stroke="#D3A09A" stroke-width="1.4" fill="none" stroke-linecap="round"/>
<path d="M121 178c-7 4-11 9-12 16" stroke="#E7B0AA" stroke-width="7" stroke-linecap="round" fill="none" opacity=".85"/>
</g>
${dots}</svg>`;
}

export const CHAPTERS = [
  { key: 0, eyebrow: "Chapter One",   pill: "Her own body" },
  { key: 1, eyebrow: "Chapter Two",   pill: "Trying to conceive" },
  { key: 2, eyebrow: "Chapter Three", pill: "Pregnancy" },
  { key: 3, eyebrow: "Chapter Four",  pill: "Postpartum & beyond" },
] as const;
