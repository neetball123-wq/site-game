import{$ as e,A as t,B as n,C as r,D as i,E as a,F as o,G as s,H as c,I as l,J as u,K as d,L as f,M as p,O as m,P as h,Q as g,R as _,S as v,T as y,U as b,V as x,W as S,X as C,Y as ee,Z as te,_ as ne,a as w,b as T,c as E,d as D,et as re,f as ie,g as ae,h as oe,i as se,it as O,j as ce,k as le,l as ue,m as k,n as de,nt as A,o as j,p as M,q as fe,r as pe,rt as me,s as he,t as N,tt as P,u as F,v as I,w as ge,x as _e,y as ve,z as ye}from"./index-B5yuXwf0.js";function L(e){let t=e=>e<=.04045?e/12.92:((e+.055)/1.055)**2.4;return[t((e>>16&255)/255),t((e>>8&255)/255),t((e&255)/255)]}var R={void:L(263946),grid:L(1323068),gridHot:L(2912121),player:L(14680053),stable:L(6025924),charged:L(13169226),unstable:L(16756283),fractured:L(16735813),hostile:L(16723311),node:L(16777215),nodeHalo:L(8257512),field:L(5952767),fieldDeep:L(1925007),warning:L(16723311),enemy:L(10466493),enemyHot:L(16723311),glyph:L(4156282),glyphCut:L(16767392)},be=[R.stable,R.charged,R.unstable,R.fractured,R.hostile];function xe(e,t,n=0){let r=e<0?0:e>4?4:e,i=Math.min(3,r|0),a=r-i,o=be[i],s=be[i+1];t[n]=o[0]+(s[0]-o[0])*a,t[n+1]=o[1]+(s[1]-o[1])*a,t[n+2]=o[2]+(s[2]-o[2])*a}function Se(){let e=new Float32Array(15);for(let t=0;t<5;t++){let n=be[t];e[t*3]=n[0],e[t*3+1]=n[1],e[t*3+2]=n[2]}return e}var Ce=class{handlers=new Map;counts=new Map;on(e,t){let n=this.handlers.get(e);return n||(n=[],this.handlers.set(e,n)),n.push(t),()=>{let n=this.handlers.get(e);if(!n)return;let r=n.indexOf(t);r>=0&&n.splice(r,1)}}emit(e,t){this.counts.set(e,(this.counts.get(e)??0)+1);let n=this.handlers.get(e);if(n)for(let e=0;e<n.length;e++)n[e](t)}subscriberCount(e){return this.handlers.get(e)?.length??0}},we=[{id:`echo`,name:`ECHO`,desc:`EVERY STROKE REPEATS ITSELF A MOMENT LATER`,tint:R.nodeHalo,max:1,changes:[`rule`,`visual`,`playstyle`]},{id:`prism`,name:`PRISM`,desc:`YOUR LINE SPLITS INTO THREE`,tint:R.field,max:1,changes:[`rule`,`visual`,`playstyle`]},{id:`axis`,name:`AXIS`,desc:`EVERYTHING YOU DRAW IS MIRRORED ACROSS THE ARENA`,tint:R.charged,max:1,changes:[`rule`,`visual`,`playstyle`]},{id:`blackbox`,name:`BLACK BOX`,desc:`THE ARENA GOES DARK  YOUR LINES ARE THE ONLY LIGHT`,tint:R.grid,max:1,changes:[`visual`,`playstyle`]},{id:`well`,name:`GRAVITY WELL`,desc:`A FIXED POINT PULLS EVERYTHING TOWARD IT`,tint:R.fieldDeep,max:1,changes:[`rule`,`visual`,`playstyle`]},{id:`ghost`,name:`GHOST`,desc:`RELEASED TRACES TURN INVISIBLE  THEY STILL WORK`,tint:R.player,max:1,changes:[`visual`,`playstyle`]},{id:`overflow`,name:`OVERFLOW`,desc:`TWICE THE LINES  TWICE THE DECAY`,tint:R.unstable,max:1,changes:[`rule`,`playstyle`]},{id:`fractal`,name:`FRACTAL`,desc:`EVERY CROSSING SPAWNS CROSSINGS OF ITS OWN`,tint:R.node,max:1,changes:[`rule`,`visual`,`playstyle`]}],Te=new Map(we.map(e=>[e.id,e]));function Ee(e){return Te.get(e)}var z={active:new Set,order:[],has(e){return this.active.has(e)},take(e){this.active.has(e)||(this.active.add(e),this.order.push(e))},reset(){this.active.clear(),this.order.length=0}},B={decayScale:1,killStateBonus:0,integrityBonus:0,invulnMul:1,hostileDamageMul:1,fieldLifeMul:1,fieldSlowMul:1,comboWindowMul:1,blastKill:!1,ghost:!1,blackBox:!1,enemySpeedMul:1,levels:new Map,order:[],get maxIntegrity(){return O.player.maxIntegrity+this.integrityBonus},get invulnTime(){return O.player.invulnTime*this.invulnMul},get killState(){return Math.min(O.enemy.traceHostileState-.15,O.enemy.traceKillMaxState+this.killStateBonus)},get hostileDamage(){return O.enemy.hostileDamage*this.hostileDamageMul},get comboWindow(){return O.node.comboWindow*this.comboWindowMul},get fieldLife(){return O.field.life*this.fieldLifeMul},get fieldTimeScale(){return O.field.timeScale*this.fieldSlowMul},get decayStable(){return O.trace.decay.stable*this.decayScale},get decayCharged(){return O.trace.decay.charged*this.decayScale},get decayUnstable(){return O.trace.decay.unstable*this.decayScale},get decayFractured(){return O.trace.decay.fractured*this.decayScale},get hostileLife(){return O.trace.decay.hostileLife*this.decayScale},get maxPointAge(){return this.decayFractured+this.hostileLife},get dissolve(){return O.trace.decay.dissolve*this.decayScale},level(e){return this.levels.get(e)??0}},V={wave:0,speedMul:1,damageMul:1,drainMul:1,aimMul:1,setWave(e){this.wave=e;let t=Math.max(0,e-1);this.speedMul=Math.min(1.55,1+t*.035),this.damageMul=Math.min(1.75,1+t*.045),this.drainMul=Math.min(2,1+t*.07),this.aimMul=Math.max(.62,1-t*.03)},get aimTime(){return O.enemy.needle.aimTime*this.aimMul},reset(){this.wave=0,this.speedMul=1,this.damageMul=1,this.drainMul=1,this.aimMul=1}};function H(){return V.speedMul*B.enemySpeedMul}function De(){B.decayScale=1,B.killStateBonus=0,B.integrityBonus=0,B.invulnMul=1,B.hostileDamageMul=1,B.fieldLifeMul=1,B.fieldSlowMul=1,B.comboWindowMul=1,B.blastKill=!1,B.ghost=!1,B.blackBox=!1,B.enemySpeedMul=1,B.levels.clear(),B.order.length=0,z.reset(),V.reset()}var U=class e{slot;id=0;active=!1;drawing=!1;px;py;pSpeed;pCurv;pDist;pBirth;count=0;bornAt=0;releasedAt=-1;length=0;avgSpeed=0;avgCurvature=0;speedSum=0;curvSum=0;intersections=0;enclosedAreas=0;energy=0;stability=1;flash=0;fade=0;dirtyFrom=0;geomDirty=!1;seed=0;constructor(e){this.slot=e;let t=O.trace.maxPoints;this.px=new Float32Array(t),this.py=new Float32Array(t),this.pSpeed=new Float32Array(t),this.pCurv=new Float32Array(t),this.pDist=new Float32Array(t),this.pBirth=new Float32Array(t)}reset(e,t,n){this.id=e,this.active=!0,this.drawing=!0,this.count=0,this.bornAt=t,this.releasedAt=-1,this.length=0,this.avgSpeed=0,this.avgCurvature=0,this.speedSum=0,this.curvSum=0,this.intersections=0,this.enclosedAreas=0,this.energy=0,this.stability=1,this.flash=0,this.fade=0,this.seed=n,this.dirtyFrom=0,this.geomDirty=!0}get full(){return this.count>=O.trace.maxPoints}push(e,t,n,r){if(this.full)return;let i=this.count;if(this.px[i]=e,this.py[i]=t,this.pSpeed[i]=n,this.pBirth[i]=r,this.pCurv[i]=0,i>0){let n=d(this.px[i-1],this.py[i-1],e,t);this.length+=n,this.pDist[i]=this.length}else this.pDist[i]=0;if(this.count++,this.speedSum+=n,this.avgSpeed=this.speedSum/this.count,i>=2){let e=this.computeCurvature(i-1);this.pCurv[i-1]=e,this.curvSum+=e,this.avgCurvature=this.curvSum/Math.max(1,this.count-2)}this.geomDirty?this.dirtyFrom=Math.min(this.dirtyFrom,Math.max(0,i-1)):(this.geomDirty=!0,this.dirtyFrom=Math.max(0,i-1))}computeCurvature(e){let t=this.px[e-1],n=this.py[e-1],r=this.px[e],i=this.py[e],a=this.px[e+1],o=this.py[e+1],s=r-t,c=i-n,l=a-r,u=o-i,d=Math.hypot(s,c),f=Math.hypot(l,u);if(d<1e-5||f<1e-5)return 0;s/=d,c/=d,l/=f,u/=f;let p=s*u-c*l,m=s*l+c*u;return Math.atan2(Math.abs(p),m)/((d+f)*.5)}smoothCommitted(){let e=O.input.smoothingLagPoints,t=this.count-1-e;if(t<1||t>=this.count-1)return;let n=O.input.smoothingStrength,r=(this.px[t-1]+this.px[t+1])*.5,i=(this.py[t-1]+this.py[t+1])*.5;this.px[t]=this.px[t]+(r-this.px[t])*n,this.py[t]=this.py[t]+(i-this.py[t])*n,this.geomDirty?this.dirtyFrom=Math.min(this.dirtyFrom,t-1):(this.geomDirty=!0,this.dirtyFrom=t-1)}headAge(e){return this.count===0?0:e-this.pBirth[this.count-1]}tailAge(e){return this.count===0?0:e-this.pBirth[0]}static stateForAge(e){let t=B.decayStable,n=B.decayCharged,r=B.decayUnstable,i=B.decayFractured;return e<t?C(0,t,e):e<n?1+C(t,n,e):e<r?2+C(n,r,e):e<i?3+C(r,i,e):4}static get maxPointAge(){return B.maxPointAge}peakState(t){return e.stateForAge(this.tailAge(t))}chargeLevel(){return S(this.intersections/6+this.enclosedAreas*.35)}},Oe=-1,ke=class{cellSize;cols=0;rows=0;cellHead=new Int32Array;entryNext;entryTrace;entryIndex;entryCount=0;capacity;constructor(e=64,t=65536){this.cellSize=e,this.capacity=t,this.entryNext=new Int32Array(t),this.entryTrace=new Int32Array(t),this.entryIndex=new Int32Array(t)}resize(e,t){this.cols=Math.max(1,Math.ceil(e/this.cellSize)+2),this.rows=Math.max(1,Math.ceil(t/this.cellSize)+2),this.cellHead=new Int32Array(this.cols*this.rows).fill(Oe),this.entryCount=0}clear(){this.cellHead.fill(Oe),this.entryCount=0}cellOf(e,t){let n=Math.floor(e/this.cellSize)+1,r=Math.floor(t/this.cellSize)+1;return n<0?n=0:n>=this.cols&&(n=this.cols-1),r<0?r=0:r>=this.rows&&(r=this.rows-1),r*this.cols+n}insert(e,t,n,r,i,a){let o=n<i?n:i,s=n<i?i:n,c=r<a?r:a,l=r<a?a:r,u=this.cellOf(o,c),d=this.cellOf(s,l);if(u===d){this.addEntry(u,e,t);return}let f=u%this.cols,p=u/this.cols|0,m=d%this.cols,h=d/this.cols|0;for(let n=p;n<=h;n++)for(let r=f;r<=m;r++)this.addEntry(n*this.cols+r,e,t)}addEntry(e,t,n){if(this.entryCount>=this.capacity)return;let r=this.entryCount++;this.entryNext[r]=this.cellHead[e],this.entryTrace[r]=t,this.entryIndex[r]=n,this.cellHead[e]=r}query(e,t,n,r,i){let a=e<n?e:n,o=e<n?n:e,s=t<r?t:r,c=t<r?r:t,l=this.cellOf(a,s),u=this.cellOf(o,c),d=l%this.cols,f=l/this.cols|0,p=u%this.cols,m=u/this.cols|0;for(let e=f;e<=m;e++){let t=e*this.cols;for(let e=d;e<=p;e++){let n=this.cellHead[t+e];for(;n!==Oe;)i(this.entryTrace[n],this.entryIndex[n]),n=this.entryNext[n]}}}get load(){return this.entryCount/this.capacity}get gridCols(){return this.cols}get gridRows(){return this.rows}get entries(){return this.entryCount}},Ae=class{clock;bus;traces=[];hash=new ke(56);current=null;headX=0;headY=0;headSpeed01=0;hasHead=!1;nextId=1;seedCounter=1;lastX=0;lastY=0;lastSpeed01=0;hashDirty=!1;liveTraces=0;livePoints=0;constructor(e,t){this.clock=e,this.bus=t;for(let e=0;e<O.trace.maxTraces;e++)this.traces.push(new U(e))}resize(e,t){this.hash.resize(e,t),this.hashDirty=!0}acquire(){for(let e=0;e<this.traces.length;e++){let t=this.traces[e];if(!t.active)return t}let e=null;for(let t=0;t<this.traces.length;t++){let n=this.traces[t];n.drawing||(!e||n.bornAt<e.bornAt)&&(e=n)}return e?(e.active=!1,this.hashDirty=!0,e):null}begin(e,t){let n=this.acquire();n&&(n.reset(this.nextId++,this.clock.gameTime,this.seedCounter++*.61803398875%1),n.push(e,t,this.headSpeed01,this.clock.gameTime),this.current=n,this.lastX=e,this.lastY=t,this.lastSpeed01=this.headSpeed01,this.bus.emit(`traceStart`,{x:e,y:t}))}released=null;end(){let e=this.current;if(e){if(this.current=null,e.drawing=!1,e.releasedAt=this.clock.gameTime,e.length<O.trace.minLength){e.active=!1,this.hashDirty=!0;return}this.released=e,this.bus.emit(`traceRelease`,{x:e.px[e.count-1],y:e.py[e.count-1],length:e.length,avgSpeed01:e.avgSpeed})}}update(e,t){let n=this.clock.gameTime,r=O.input.resampleSpacing;e.drain((i,a,o,s)=>{if(this.headX=i,this.headY=a,this.hasHead=!0,s&&!this.current){this.begin(i,a);return}if(!this.current)return;let c=this.current,l=i-this.lastX,u=a-this.lastY,d=Math.hypot(l,u),f=this.lastSpeed01,p=e.speed01,m=d,h=0;for(;d>=r&&h++<512;){let e=this.lastX+l/d*r,o=this.lastY+u/d*r,s=m>1e-4?1-(d-r)/m:1,h=f+(p-f)*(s<0?0:s>1?1:s);if(c.push(e,o,h,n),t(c,c.count-1),c.smoothCommitted(),this.lastX=e,this.lastY=o,c.full){this.end(),this.begin(e,o);let t=this.current;if(!t)return;c=t}l=i-this.lastX,u=a-this.lastY,d=Math.hypot(l,u)}this.lastSpeed01=p}),this.headSpeed01=e.speed01,e.justUp&&this.current&&this.end()}tick(e){let t=this.clock.gameTime,n=U.maxPointAge;this.liveTraces=0,this.livePoints=0;for(let r=0;r<this.traces.length;r++){let i=this.traces[r];if(i.active){if(i.fade=s(i.fade,1,26,e),i.flash=s(i.flash,0,11,e),i.energy=s(i.energy,i.chargeLevel(),4.5,e),i.stability=S(1-U.stateForAge(i.tailAge(t))/4),!i.drawing&&i.headAge(t)>n){this.bus.emit(`traceExpire`,{state:4,x:i.px[i.count>>1]??0,y:i.py[i.count>>1]??0}),i.active=!1,this.hashDirty=!0;continue}this.liveTraces++,this.livePoints+=i.count}}this.hashDirty&&this.rebuildHash()}rebuildHash(){this.hash.clear();for(let e=0;e<this.traces.length;e++){let t=this.traces[e];if(t.active)for(let e=0;e<t.count-1;e++)this.hash.insert(t.slot,e,t.px[e],t.py[e],t.px[e+1],t.py[e+1])}this.hashDirty=!1}injectPoints(e,t,n,r,i=0,a=0,o=1,s=1,c=0,l=0,u=1,d=0){if(r<2)return null;let f=this.acquire();if(!f)return null;let p=this.clock.gameTime;f.reset(this.nextId++,p,this.seedCounter++*.61803398875%1);for(let l=0;l<r;l+=u){let m=i+e[d+l]*o,h=a+t[d+l]*s;if(c!==0){let n=l>0?Math.max(0,l-u):l,f=l+u<r?l+u:l,p=i+e[d+f]*o-(i+e[d+n]*o),g=a+t[d+f]*s-(a+t[d+n]*s),_=Math.hypot(p,g);_>1e-5&&(p/=_,g/=_,m+=-g*c,h+=p*c)}f.push(m,h,n[d+l],p)}if((r-1)%u!=0){let c=r-1;f.push(i+e[d+c]*o,a+t[d+c]*s,n[d+c],p)}if(f.drawing=!1,f.releasedAt=p,l!==0)for(let e=0;e<f.count;e++)f.pBirth[e]=f.pBirth[e]-l;for(let e=1;e<f.count;e++)this.insertSegment(f,e);return f.geomDirty=!0,f.dirtyFrom=0,f}insertSegment(e,t){t<1||this.hash.insert(e.slot,t-1,e.px[t-1],e.py[t-1],e.px[t],e.py[t])}traceBySlot(e){let t=this.traces[e];return t&&t.active?t:null}nearestTraceDistance(e,t,n){let r=n;for(let n=0;n<this.traces.length;n++){let i=this.traces[n];if(i.active)for(let n=0;n<i.count;n+=3){let a=d(e,t,i.px[n],i.py[n]);a<r&&(r=a)}}return r}clear(){for(let e=0;e<this.traces.length;e++)this.traces[e].active=!1;this.current=null,this.hashDirty=!0}},je=class{traces;clock;bus;nodes=[];combo=0;comboBest=0;lastHitTime=-99;onSelfLoop=null;liveNodes=0;testsThisFrame=0;constructor(e,t,n){this.traces=e,this.clock=t,this.bus=n;for(let e=0;e<O.node.maxNodes;e++)this.nodes.push({active:!1,x:0,y:0,bornAt:0,expiresAt:0,sharpness:0,combo:0,energy:0,angleA:0,angleB:0,flash:0,punch:0,punchVel:0,crossTrace:!1,slotA:-1,slotB:-1,seed:0})}onPointAdded=(e,t)=>{if(t<1)return;let n=e.px[t-1],r=e.py[t-1],i=e.px[t],a=e.py[t];this.traces.hash.query(n,r,i,a,(o,s)=>{if(o===e.slot&&Math.abs(s-(t-1))<=2)return;let c=this.traces.traceBySlot(o);if(!c||s+1>=c.count)return;let l=c.px[s],u=c.py[s],d=c.px[s+1],f=c.py[s+1];this.testsThisFrame++;let p=P(n,r,i,a,l,u,d,f);if(p<0)return;let m=n+(i-n)*p,h=r+(a-r)*p,g=Math.atan2(a-r,i-n),_=Math.atan2(f-u,d-l);if(this.spawn(m,h,g,_,e,c)&&o===e.slot&&this.onSelfLoop){te();let n=Math.min(s,t-1),r=Math.max(s+1,t);this.onSelfLoop(e,n,r)}}),this.traces.insertSegment(e,t)};spawn(e,t,r,i,a,o){let s=this.clock.gameTime,c=O.node.mergeDistance*O.node.mergeDistance;for(let n=0;n<this.nodes.length;n++){let r=this.nodes[n];if(r.active&&fe(r.x,r.y,e,t)<c)return r.energy=S(r.energy+.22),r.flash=Math.min(1,r.flash+.45),r.punchVel+=9,r.expiresAt=Math.max(r.expiresAt,s+O.node.graceTime),!1}let l=-1,u=1/0,d=0;for(let e=0;e<this.nodes.length;e++){let t=this.nodes[e];if(!t.active){l=e;break}t.bornAt<u&&(u=t.bornAt,d=e)}l<0&&(l=d);let f=Math.abs(r-i)%n;f>n*.5&&(f=n-f);let p=S(f/(n*.5));s-this.lastHitTime<B.comboWindow?this.combo=Math.min(O.node.maxCombo,this.combo+1):(this.combo>1&&this.bus.emit(`comboBreak`,{combo:this.combo}),this.combo=1),this.lastHitTime=s,this.combo>this.comboBest&&(this.comboBest=this.combo);let m=this.nodes[l];return m.active=!0,m.x=e,m.y=t,m.bornAt=s,m.expiresAt=s+U.maxPointAge*.55+O.node.graceTime,m.sharpness=p,m.combo=this.combo,m.energy=.35+p*.3,m.angleA=r,m.angleB=i,m.flash=1,m.punch=0,m.punchVel=26+p*12,m.crossTrace=a.slot!==o.slot,m.slotA=a.slot,m.slotB=o.slot,m.seed=l*.7548776662%1,a.intersections++,o!==a&&o.intersections++,a.flash=Math.min(1,a.flash+.5),o.flash=Math.min(1,o.flash+.5),this.bus.emit(`intersection`,{x:e,y:t,sharpness:p,combo:this.combo,crossTrace:m.crossTrace}),!0}tick(e){let t=this.clock.gameTime;this.liveNodes=0;for(let n=0;n<this.nodes.length;n++){let r=this.nodes[n];if(!r.active)continue;if(t>r.expiresAt){r.active=!1;continue}r.flash+=(0-r.flash)*Math.min(1,e*9);let i=(0-r.punch)*320-r.punchVel*24;r.punchVel+=i*e,r.punch+=r.punchVel*e,this.liveNodes++}this.combo>0&&t-this.lastHitTime>B.comboWindow&&(this.combo>1&&this.bus.emit(`comboBreak`,{combo:this.combo}),this.combo=0)}beginFrame(){this.testsThisFrame=0}spawnDerived(e,t,n,r,i,a,o){let s=-1;for(let e=0;e<this.nodes.length;e++)if(!this.nodes[e].active){s=e;break}if(s<0)return null;let c=this.clock.gameTime,l=this.nodes[s];return l.active=!0,l.x=e,l.y=t,l.bornAt=c,l.expiresAt=c+o,l.sharpness=n,l.combo=r,l.energy=.2+n*.2,l.angleA=i,l.angleB=a,l.flash=1,l.punch=0,l.punchVel=14,l.crossTrace=!1,l.slotA=-1,l.slotB=-1,l.seed=s*.7548776662%1,l}nearest(e,t,n){let r=null,i=n*n;for(let n=0;n<this.nodes.length;n++){let a=this.nodes[n];if(!a.active)continue;let o=a.x-e,s=a.y-t,c=o*o+s*s;c<i&&(i=c,r=a)}return r}destroy(e){e.active=!1}countInside(e){let t=0;for(let n=0;n<this.nodes.length;n++){let r=this.nodes[n];r.active&&e(r.x,r.y)&&t++}return t}consumeInside(e,t){let n=0;for(let r=0;r<this.nodes.length;r++){let i=this.nodes[r];!i.active||!e(i.x,i.y)||(t(i),i.active=!1,n++)}return n}clear(){for(let e=0;e<this.nodes.length;e++)this.nodes[e].active=!1;this.combo=0}},W=new Set,Me=!1;function Ne(e,t,n=2){let r=t&&t.length,i=r?t[0]*n:e.length;W.size&&W.clear();let a=Pe(e,0,i,n,!0),o=[];if(!a||a.next===a.prev)return o;let s=0,c=0,l=0;if(r&&(a=Ve(e,t,a,n)),e.length>80*n){s=e[0],c=e[1];let t=s,r=c;for(let a=n;a<i;a+=n){let n=e[a],i=e[a+1];n<s&&(s=n),i<c&&(c=i),n>t&&(t=n),i>r&&(r=i)}l=Math.max(t-s,r-c),l=l===0?0:32767/l}return Fe(a,o,s,c,l),o}function Pe(e,t,n,r,i){let a=null;if(i===bt(e,t,n,r)>0)for(let i=t;i<n;i+=r)a=_t(i/r|0,e[i],e[i+1],a);else for(let i=n-r;i>=t;i-=r)a=_t(i/r|0,e[i],e[i+1],a);return a&&ut(a,a.next)&&(vt(a),a=a.next),a}function G(e,t=e){let n=t===e,r=e,i;do i=!1,r!==r.next&&(W.size===0||!W.has(r))&&(ut(r,r.next)||X(r.prev,r,r.next)===0)?((n||r===t)&&(t=r.prev),Me=!0,vt(r),r=r.prev,i=!0):(n||r!==t)&&(r=r.next,i=!n);while(i||r!==t);return t}function Fe(e,t,n,r,i){i&&rt(e,n,r,i);let a=e,o=!1;for(;e.prev!==e.next;){let s=e.prev,c=e.next;if(X(s,e,c)<0&&(i?Le(e,n,r,i):Ie(e))){t.push(s.i,e.i,c.i),vt(e),e=c,a=c;continue}if(e=c,e===a){if(Me=!1,e=G(e),Me){a=e;continue}if(!o){e=Re(e,t),a=e,o=!0;continue}ze(e,t,n,r,i);break}}}function Ie(e){let t=e.prev,n=e,r=e.next,i=t.x,a=n.x,o=r.x,s=t.y,c=n.y,l=r.y,u=Math.min(i,a,o),d=Math.min(s,c,l),f=Math.max(i,a,o),p=Math.max(s,c,l),m=r.next;for(;m!==t;){if(m.x>=u&&m.x<=f&&m.y>=d&&m.y<=p&&(i!==m.x||s!==m.y)&&ct(i,s,a,c,o,l,m.x,m.y)&&X(m.prev,m,m.next)>=0)return!1;m=m.next}return!0}function Le(e,t,n,r){let i=e.prev,a=e,o=e.next,s=i.x,c=a.x,l=o.x,u=i.y,d=a.y,f=o.y,p=Math.min(s,c,l),m=Math.min(u,d,f),h=Math.max(s,c,l),g=Math.max(u,d,f),_=ot(p,m,t,n,r),v=ot(h,g,t,n,r),y=e.prevZ;for(;y&&y.z>=_;){if(y.x>=p&&y.x<=h&&y.y>=m&&y.y<=g&&y!==o&&(s!==y.x||u!==y.y)&&ct(s,u,c,d,l,f,y.x,y.y)&&X(y.prev,y,y.next)>=0)return!1;y=y.prevZ}let b=e.nextZ;for(;b&&b.z<=v;){if(b.x>=p&&b.x<=h&&b.y>=m&&b.y<=g&&b!==o&&(s!==b.x||u!==b.y)&&ct(s,u,c,d,l,f,b.x,b.y)&&X(b.prev,b,b.next)>=0)return!1;b=b.nextZ}return!0}function Re(e,t){let n=e,r=!1;do{let i=n.prev,a=n.next.next;dt(i,n,n.next,a,!1)&&mt(i,a)&&mt(a,i)&&(t.push(i.i,n.i,a.i),vt(n),vt(n.next),n=e=a,r=!0),n=n.next}while(n!==e);return r?G(n):n}function ze(e,t,n,r,i){let a=e;do{let e=a.next.next;for(;e!==a.prev;){if(a.i!==e.i&&lt(a,e)){let o=gt(a,e);a=G(a,a.next),o=G(o,o.next),Fe(a,t,n,r,i),Fe(o,t,n,r,i);return}e=e.next}a=a.next}while(a!==e)}var Be=!1;function Ve(e,t,n,r){let i=[];for(let n=0,a=t.length;n<a;n++){let o=Pe(e,t[n]*r,n<a-1?t[n+1]*r:e.length,r,!1);o===o.next&&W.add(o),i.push(st(o))}i.sort(He),Je(e.length/r,t.length),Ye(n,n),Be=!0;for(let e=0;e<i.length;e++)n=Ue(i[e],n);return Be=!1,G(n)}function He(e,t){return e.x-t.x||e.y-t.y||(e.next.y-e.y)/(e.next.x-e.x)-(t.next.y-t.y)/(t.next.x-t.x)}function Ue(e,t){let n=$e(e,t);if(!n)return t;let r=gt(n,e),i=r.next;return Ye(n,i.next),G(r,r.next),G(n,n.next)}var We=16,K=new Float64Array,Ge=0,Ke=[],qe=[];function Je(e,t){let n=Math.ceil((e+2*t)/We)+t+2;K.length<n*4&&(K=new Float64Array(n*4)),Ge=0}function Ye(e,t){let n=e;do{let e=Ge++;Ke[e]=n;let r=1/0,i=1/0,a=-1/0,o=-1/0,s=0;do{let t=n.next;n.z=e,n.x<r&&(r=n.x),n.x>a&&(a=n.x),n.y<i&&(i=n.y),n.y>o&&(o=n.y),t.x<r&&(r=t.x),t.x>a&&(a=t.x),t.y<i&&(i=t.y),t.y>o&&(o=t.y),n=t}while(++s<We&&n!==t);qe[e]=n;let c=e*4;K[c]=r,K[c+1]=i,K[c+2]=a,K[c+3]=o}while(n!==t)}function Xe(e,t){let n=e.z*4;t.x<K[n]&&(K[n]=t.x),t.y<K[n+1]&&(K[n+1]=t.y),t.x>K[n+2]&&(K[n+2]=t.x),t.y>K[n+3]&&(K[n+3]=t.y)}function Ze(e){let t=qe[e];for(;t.prev.next!==t;)t=t.next;return qe[e]=t,t}function Qe(e){let t=Ke[e];for(;t.prev.next!==t;)t=t.next;return Ke[e]=t,t}function $e(e,t){let n=t,r=e.x,i=e.y,a=-1/0,o;if(ut(e,n))return n;for(let t=0,s=0;t<Ge;t++,s+=4){if(i<K[s+1]||i>K[s+3]||K[s]>r||K[s+2]<=a)continue;let c=Ze(t);n=Qe(t);do{if(n.prev.next===n){if(ut(e,n.next))return n.next;if(i<=n.y&&i>=n.next.y&&n.next.y!==n.y){let e=n.x+(i-n.y)*(n.next.x-n.x)/(n.next.y-n.y);if(e<=r&&e>a&&(a=e,o=n.x<n.next.x?n:n.next,e===r))return o}}n=n.next}while(n!==c)}if(!o)return null;let s=o.x,c=o.y,l=Math.min(i,c),u=Math.max(i,c),d=1/0;for(let t=0,f=0;t<Ge;t++,f+=4){if(K[f+2]<s||K[f]>r||K[f+3]<l||K[f+1]>u)continue;let p=Ze(t);n=Qe(t);do{if(n.prev.next===n&&r>=n.x&&n.x>=s&&r!==n.x&&ct(i<c?r:a,i,s,c,i<c?a:r,i,n.x,n.y)){let t=Math.abs(i-n.y)/(r-n.x);(mt(n,e)||n.y===i&&n.next.y===i&&n.next.x>r)&&(t<d||t===d&&(n.x>o.x||n.x===o.x&&et(o,n)))&&(o=n,d=t)}n=n.next}while(n!==p)}return o}function et(e,t){return X(e.prev,e,t.prev)<0&&X(t.next,e,e.next)<0}var q=[],J=[],Y=new Uint32Array,tt=new Uint32Array,nt=new Uint32Array(256);function rt(e,t,n,r){let i=e,a=0;do i.z=ot(i.x,i.y,t,n,r),q[a++]=i,i=i.next;while(i!==e);it(a);let o=null;for(let e=0;e<a;e++){let t=q[e];t.prevZ=o,o&&(o.nextZ=t),o=t}o.nextZ=null}function it(e){if(e<=32){for(let t=1;t<e;t++){let e=q[t],n=e.z,r=t-1;for(;r>=0&&q[r].z>n;)q[r+1]=q[r],r--;q[r+1]=e}return}Y.length<e&&(Y=new Uint32Array(e),tt=new Uint32Array(e),J=Array(e));for(let t=0;t<e;t++)Y[t]=q[t].z;at(e,q,Y,J,tt,0),at(e,J,tt,q,Y,8),at(e,q,Y,J,tt,16),at(e,J,tt,q,Y,24)}function at(e,t,n,r,i,a){nt.fill(0);for(let t=0;t<e;t++)nt[n[t]>>>a&255]++;let o=0;for(let e=0;e<256;e++){let t=nt[e];nt[e]=o,o+=t}for(let o=0;o<e;o++){let e=n[o],s=nt[e>>>a&255]++;r[s]=t[o],i[s]=e}}function ot(e,t,n,r,i){return e=(e-n)*i|0,t=(t-r)*i|0,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,e|t<<1}function st(e){let t=e,n=e;do(t.x<n.x||t.x===n.x&&t.y<n.y)&&(n=t),t=t.next;while(t!==e);return n}function ct(e,t,n,r,i,a,o,s){return(i-o)*(t-s)>=(e-o)*(a-s)&&(e-o)*(r-s)>=(n-o)*(t-s)&&(n-o)*(a-s)>=(i-o)*(r-s)}function lt(e,t){let n=ut(e,t)&&X(e.prev,e,e.next)>0&&X(t.prev,t,t.next)>0;return e.next.i!==t.i&&(n||mt(e,t)&&mt(t,e)&&(X(e.prev,e,t.prev)!==0||X(e,t.prev,t)!==0))&&!pt(e,t)&&(n||ht(e,t))}function X(e,t,n){return(t.y-e.y)*(n.x-t.x)-(t.x-e.x)*(n.y-t.y)}function ut(e,t){return e.x===t.x&&e.y===t.y}function dt(e,t,n,r,i=!0){let a=X(e,t,n),o=X(e,t,r),s=X(n,r,e),c=X(n,r,t);return(a>0&&o<0||a<0&&o>0)&&(s>0&&c<0||s<0&&c>0)?!0:i?!!(a===0&&ft(e,n,t)||o===0&&ft(e,r,t)||s===0&&ft(n,e,r)||c===0&&ft(n,t,r)):!1}function ft(e,t,n){return t.x<=Math.max(e.x,n.x)&&t.x>=Math.min(e.x,n.x)&&t.y<=Math.max(e.y,n.y)&&t.y>=Math.min(e.y,n.y)}function pt(e,t){let n=Math.min(e.x,t.x),r=Math.max(e.x,t.x),i=Math.min(e.y,t.y),a=Math.max(e.y,t.y),o=e;do{let s=o.next;if(o.x>r&&s.x>r||o.x<n&&s.x<n||o.y>a&&s.y>a||o.y<i&&s.y<i){o=s;continue}if(o.i!==e.i&&s.i!==e.i&&o.i!==t.i&&s.i!==t.i&&dt(o,s,e,t))return!0;o=s}while(o!==e);return!1}function mt(e,t){return X(e.prev,e,e.next)<0?X(e,t,e.next)>=0&&X(e,e.prev,t)>=0:X(e,t,e.prev)<0||X(e,e.next,t)<0}function ht(e,t){let n=e,r=!1,i=(e.x+t.x)/2,a=(e.y+t.y)/2;do{let e=n.next;n.y>a!=e.y>a&&i<(e.x-n.x)*(a-n.y)/(e.y-n.y)+n.x&&(r=!r),n=e}while(n!==e);return r}function gt(e,t){let n=yt(e.i,e.x,e.y),r=yt(t.i,t.x,t.y),i=e.next,a=t.prev;return e.next=t,t.prev=e,n.next=i,i.prev=n,r.next=n,n.prev=r,a.next=r,r.prev=a,r}function _t(e,t,n,r){let i=yt(e,t,n);return r?(i.next=r.next,i.prev=r,r.next.prev=i,r.next=i):(i.prev=i,i.next=i),i}function vt(e){e.next.prev=e.prev,e.prev.next=e.next,e.prevZ&&(e.prevZ.nextZ=e.nextZ),e.nextZ&&(e.nextZ.prevZ=e.prevZ),Be&&Xe(e.prev,e.next)}function yt(e,t,n){return{i:e,x:t,y:n,prev:null,next:null,z:0,prevZ:null,nextZ:null}}function bt(e,t,n,r){let i=0;for(let a=t,o=n-r;a<n;a+=r)i+=(e[o]-e[a])*(e[a+1]+e[o+1]),o=a;return i}var xt=256,St=class{clock;bus;fields=[];liveFields=0;shockX=new Float32Array(6);shockY=new Float32Array(6);shockR=new Float32Array(6);shockAmp=new Float32Array(6);shockCursor=0;constructor(e,t){this.clock=e,this.bus=t;for(let e=0;e<O.field.maxFields;e++)this.fields.push({active:!1,slot:e,pts:new Float32Array(xt*2),restPts:new Float32Array(xt*2),count:0,cx:0,cy:0,area:0,circularity:0,radius:0,bornAt:0,life:0,state:0,phase:0,form:0,formVel:0,energy:0,capturedNodes:0,seed:0,indices:new Uint16Array(xt*3),indexCount:0})}createFromLoop(e,t,n){let r=n-t+1;if(r<4)return;let i=this.acquire();if(!i)return;let a=Math.max(1,Math.ceil(r/xt)),o=0;for(let r=t;r<=n&&o<xt;r+=a)i.pts[o*2]=e.px[r],i.pts[o*2+1]=e.py[r],o++;if(o<4)return;i.count=o;let s=Math.abs(re(i.pts,0,o));if(s<O.field.minArea)return;let l=0,u=0;for(let e=0;e<o;e++)l+=i.pts[e*2],u+=i.pts[e*2+1];i.cx=l/o,i.cy=u/o;for(let e=0;e<this.fields.length;e++){let t=this.fields[e];if(!(!t.active||t===i)&&d(t.cx,t.cy,i.cx,i.cy)<t.radius*.55&&Math.abs(t.area-s)<t.area*.4)return}let f=0;for(let e=0;e<o;e++)f+=d(i.cx,i.cy,i.pts[e*2],i.pts[e*2+1]);i.radius=f/o;let p=Ne(Array.from(i.pts.subarray(0,o*2)),void 0,2);if(p.length<3)return;let m=Math.min(p.length,i.indices.length);for(let e=0;e<m;e++)i.indices[e]=p[e];i.indexCount=m,i.restPts.set(i.pts.subarray(0,o*2)),i.active=!0,i.area=s,i.circularity=c(i.pts,0,o),i.bornAt=this.clock.gameTime,i.life=B.fieldLife,i.state=0,i.phase=0,i.form=0,i.formVel=7+i.circularity*9,i.energy=.25+i.circularity*.4,i.capturedNodes=0,i.seed=i.slot*.3819660112%1,e.enclosedAreas++,e.flash=1,this.bus.emit(`fieldForm`,{x:i.cx,y:i.cy,area:s,circularity:i.circularity,radius:i.radius})}acquire(){for(let e=0;e<this.fields.length;e++)if(!this.fields[e].active)return this.fields[e];let e=null;for(let t=0;t<this.fields.length;t++){let n=this.fields[t];n.state===0&&(!e||n.bornAt<e.bornAt)&&(e=n)}return e}containsPoint(t,n){for(let r=0;r<this.fields.length;r++){let i=this.fields[r];if(!(!i.active||i.state!==0)&&!(d(t,n,i.cx,i.cy)>i.radius*1.6)&&e(t,n,i.pts,0,i.count))return i}return null}detonateAll(e){let t=0;for(let n=0;n<this.fields.length;n++){let r=this.fields[n];!r.active||r.state!==0||(r.state=1,r.phase=0,e(r),t++)}return t}pushShock(e,t,n){let r=this.shockCursor%this.shockX.length;this.shockCursor++,this.shockX[r]=e,this.shockY[r]=t,this.shockR[r]=0,this.shockAmp[r]=n}tick(e){this.liveFields=0;let t=O.field.detonate;for(let n=0;n<this.shockR.length;n++)this.shockAmp[n]<=0||(this.shockR[n]=this.shockR[n]+t.shockSpeed*e,this.shockAmp[n]=Math.max(0,this.shockAmp[n]-e*1.6));for(let n=0;n<this.fields.length;n++){let r=this.fields[n];if(!r.active)continue;let i=(1-r.form)*260-r.formVel*19;if(r.formVel+=i*e,r.form+=r.formVel*e,r.state===0)r.life-=e,r.life<=0&&(r.state=2,r.phase=.55),this.liveFields++;else if(r.state===1){r.phase+=e/t.implodeTime;let n=A(0,1,S(r.phase));for(let e=0;e<r.count;e++){let t=r.restPts[e*2],i=r.restPts[e*2+1];r.pts[e*2]=t+(r.cx-t)*n,r.pts[e*2+1]=i+(r.cy-i)*n}r.phase>=1&&(r.state=2,r.phase=0,this.pushShock(r.cx,r.cy,1),this.bus.emit(`fieldDetonate`,{x:r.cx,y:r.cy,area:r.area,radius:r.radius,captured:r.capturedNodes}))}else r.phase+=e/t.burstTime,r.phase>=1&&(r.active=!1)}}static ageOf(e){return S(1-e.life/B.fieldLife)}clear(){for(let e=0;e<this.fields.length;e++)this.fields[e].active=!1;this.shockAmp.fill(0)}},Ct=`
precision highp float;
in vec3 position;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
out vec2 vWorld;
out vec2 vScreenUv;
void main() {
  vWorld = position.xy;
  vec4 clip = projectionMatrix * modelViewMatrix * vec4(position.xy, 0.0, 1.0);
  vScreenUv = clip.xy * 0.5 + 0.5;
  gl_Position = clip;
}
`,wt=`
precision highp float;
in vec3 position;
out vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`,Tt=`
precision highp float;

in vec2 vWorld;
in vec2 vScreenUv;

uniform sampler2D uInfluence;
uniform vec2  uResolution;
uniform float uTime;
uniform vec3  uGridColor;
uniform vec3  uGridHot;
uniform vec3  uFieldColor;
uniform vec2  uPlayer;
uniform float uPlayerEnergy;
uniform float uCellSize;

out vec4 fragColor;

${E}

/**
 * Antialiased lattice. Derivative-based line width keeps the lines one pixel
 * wide however hard the space around them is stretched — a fixed width would
 * fatten and blur exactly where the warp is most interesting to look at.
 */
float lattice(vec2 p, float cell, float thickness) {
  vec2 g = p / cell;
  vec2 f = abs(fract(g - 0.5) - 0.5);
  vec2 w = fwidth(g) * thickness;
  // NOTE: smoothstep with edge0 > edge1 is UNDEFINED in GLSL and silently
  // returns 0 on some drivers. Always ramp upward and invert.
  vec2 l = vec2(1.0) - smoothstep(vec2(0.0), w, f);
  return max(l.x, l.y);
}

/** A tick where lattice lines cross. Reads as a plotted grid, not a texture. */
float latticeNodes(vec2 p, float cell) {
  vec2 g = p / cell;
  vec2 f = abs(fract(g - 0.5) - 0.5);
  vec2 w = fwidth(g) * 2.4;
  return (1.0 - smoothstep(0.0, w.x, f.x)) * (1.0 - smoothstep(0.0, w.y, f.y));
}

void main() {
  vec2 px = vWorld;

  vec4 inf = texture(uInfluence, vScreenUv);
  vec2 disp = inf.xy;
  float energy = inf.z;
  float fieldMask = inf.w;

  // Bend the coordinate system itself. Displacing the sample position would
  // smear a picture; displacing the lattice INPUT deforms the space the
  // lattice lives in. That is the difference between a filter and a world.
  vec2 warped = px - disp * 26.0;

  // A field does not merely push space, it draws it inward, which is what
  // sells "time runs differently in here".
  warped = mix(warped, px + disp * 34.0, fieldMask);

  // Ambient drift: two decorrelated low-frequency waves at an amplitude just
  // above the noise floor. Enough that the world is not frozen, small enough
  // that you would never call it an animation.
  warped += vec2(
    sin(px.y * 0.0031 + uTime * 0.13),
    cos(px.x * 0.0027 - uTime * 0.11)
  ) * 2.2;

  float fine   = lattice(warped, uCellSize, 1.0);
  float coarse = lattice(warped, uCellSize * 5.0, 1.35);
  float ticks  = latticeNodes(warped, uCellSize);

  // Influence energy is additive and unbounded; a linear map saturates the
  // whole lattice to maximum heat as soon as a couple of strokes overlap, which
  // destroys the gradient that made it informative. Exponential saturation
  // keeps a usable slope across the entire range.
  float heat = 1.0 - exp(-energy * 1.15);

  vec3 col = vec3(0.0);
  col += uGridColor * fine   * 0.30;
  col += uGridColor * coarse * 0.62;
  col += uGridColor * ticks  * 0.46;

  // Disturbed lattice does not just brighten, it shifts hue toward the hot end,
  // so the disturbance survives a greyscale screenshot and colour blindness.
  col = mix(col, uGridHot * (fine * 0.85 + coarse * 1.5 + ticks * 1.2), heat * 0.9);
  col += uFieldColor * fieldMask * (coarse * 0.9 + fine * 0.35) * 0.9;

  // The player's own footprint. Small and always present, so the cursor is
  // never lost on an empty screen.
  float halo = exp(-length(px - uPlayer) / 190.0);
  col += uGridHot * halo * (0.05 + uPlayerEnergy * 0.09);

  // A very slow luminance wave stops large flat areas reading as dead pixels
  // without adding anything the eye can actually track.
  col *= 0.94 + 0.06 * sin(uTime * 0.21 + px.x * 0.0005 + px.y * 0.0004);

  fragColor = vec4(col, 1.0);
}
`,Et=`
precision highp float;
in vec2 vUv;
uniform sampler2D uScene;
uniform float uThreshold;
uniform float uKnee;
out vec4 fragColor;

void main() {
  vec3 c = texture(uScene, vUv).rgb;
  float br = max(c.r, max(c.g, c.b));
  float soft = clamp(br - uThreshold + uKnee, 0.0, 2.0 * uKnee);
  soft = soft * soft / (4.0 * uKnee + 1e-5);
  float contrib = max(soft, br - uThreshold) / max(br, 1e-5);
  fragColor = vec4(c * contrib, 1.0);
}
`,Dt=`
precision highp float;
in vec2 vUv;
uniform sampler2D uSource;
uniform vec2 uDirection;
out vec4 fragColor;

void main() {
  // Offsets and weights precomputed for sigma ~2.0 with bilinear tap folding.
  const float o1 = 1.3846153846;
  const float o2 = 3.2307692308;
  const float w0 = 0.2270270270;
  const float w1 = 0.3162162162;
  const float w2 = 0.0702702703;

  vec3 c = texture(uSource, vUv).rgb * w0;
  c += texture(uSource, vUv + uDirection * o1).rgb * w1;
  c += texture(uSource, vUv - uDirection * o1).rgb * w1;
  c += texture(uSource, vUv + uDirection * o2).rgb * w2;
  c += texture(uSource, vUv - uDirection * o2).rgb * w2;
  fragColor = vec4(c, 1.0);
}
`,Ot=`
precision highp float;
in vec2 vUv;
uniform sampler2D uPrev;
uniform sampler2D uBright;
uniform float uDecay;
uniform float uGain;
uniform vec2  uDrift;
out vec4 fragColor;

void main() {
  vec3 prev = texture(uPrev, vUv + uDrift).rgb * uDecay;
  vec3 add  = texture(uBright, vUv).rgb * uGain;
  // Clamp the accumulator: without this, a stationary bright pixel integrates
  // to infinity and blows a permanent white hole in the frame.
  fragColor = vec4(min(prev + add, vec3(6.0)), 1.0);
}
`,kt=`
precision highp float;
in vec2 vUv;

uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform sampler2D uTrail;
uniform sampler2D uInfluence;

uniform vec2  uResolution;
uniform float uTime;
uniform float uBloomStrength;
uniform float uTrailStrength;
uniform float uChroma;        // accessibility 0..1
uniform float uVignette;
uniform float uFade;          // global fade for transitions
uniform vec4  uShock[6];      // xy = centre px, z = radius px, w = amplitude
uniform float uRefract;
uniform float uGrain;
// BLACK BOX (Phase 5). x = strength 0..1, y = unlit floor, zw = the
// influence-energy band that counts as lit.
uniform vec4  uBlackBox;

out vec4 fragColor;

${E}

void main() {
  vec2 px = vUv * uResolution;
  vec2 uv = vUv;

  vec4 inf = texture(uInfluence, vUv);
  vec2 disp = inf.xy;
  float energy = inf.z;
  float fieldMask = inf.w;

  // --- one combined displacement ---------------------------------------
  // Everything that bends the image contributes to a single offset, and the
  // frame is sampled exactly once. Ambient refraction from any trace is small;
  // inside a FIELD it becomes large, which is what makes a closed loop feel
  // like a hole in the picture rather than a sticker on it.
  //
  // NOTE: disp is an ADDITIVE accumulation, so a dense region pushes it well past
  // 1. Left unbounded the offset exceeds the size of the features being
  // refracted and the image folds back on itself — the field stops reading as
  // glass and starts reading as a mirror. Normalising the direction and
  // clamping the magnitude keeps it as refraction at any density.
  float dispLen = length(disp);
  vec2 dispDir = dispLen > 1e-4 ? disp / dispLen : vec2(0.0);
  float bend = (1.0 - exp(-dispLen * 1.3)) * (0.35 + fieldMask * 2.4);
  vec2 offset = dispDir * bend * uRefract;

  // --- shockwaves --------------------------------------------------------
  float shockLight = 0.0;
  for (int i = 0; i < 6; i++) {
    float amp = uShock[i].w;
    if (amp <= 0.001) continue;
    vec2 d = px - uShock[i].xy;
    float dist = length(d);
    float band = exp(-pow((dist - uShock[i].z) / 46.0, 2.0));
    vec2 dir = dist > 1e-4 ? d / dist : vec2(0.0);
    offset += dir * band * amp * 0.052;
    shockLight += band * amp;
  }

  uv += offset;

  // --- chromatic separation ---------------------------------------------
  // Driven by how disturbed this part of the screen is, never applied
  // uniformly. Calm areas stay perfectly crisp, which is what stops it
  // reading as a cheap always-on filter.
  float radial = length(vUv - 0.5);
  // dispLen is unbounded; using it raw put visible red/cyan fringes on every
  // fringe of a field's interior. Saturating it keeps the separation as a hint
  // of stressed optics rather than a colour-separation filter.
  float aberr = ((1.0 - exp(-dispLen * 1.1)) * 0.55 + shockLight * 0.45
              + radial * radial * 0.35) * uChroma * 0.0028;
  vec2 caDir = radial > 1e-4 ? (vUv - 0.5) / radial : vec2(1.0, 0.0);

  vec3 scene;
  scene.r = texture(uScene, uv + caDir * aberr).r;
  scene.g = texture(uScene, uv).g;
  scene.b = texture(uScene, uv - caDir * aberr).b;

  vec3 bloom = texture(uBloom, uv).rgb;
  vec3 trail = texture(uTrail, uv).rgb;

  vec3 col = scene;
  col += bloom * uBloomStrength;
  col += trail * uTrailStrength;
  col += vec3(0.55, 0.95, 1.0) * shockLight * 0.55;

  // Disturbed space gets a faint lift, so the eye is drawn to where the
  // player is acting even before the lines themselves register.
  col += vec3(0.05, 0.14, 0.16) * energy * 0.5;

  // --- BLACK BOX ---------------------------------------------------------
  // The arena is unlit except where the player has disturbed space. Keyed off
  // the influence buffer's energy channel, thresholded ABOVE what an enemy
  // writes into it (0.10-0.16) and below what a trace writes (up to ~1.4), so
  // your own lines light the room and the things hunting you do not. Applied
  // before the tonemap because it is a loss of light, not a loss of contrast.
  col *= mix(
    1.0,
    max(uBlackBox.y, smoothstep(uBlackBox.z, uBlackBox.w, energy)),
    uBlackBox.x
  );

  col = tonemap(col);

  // --- vignette ----------------------------------------------------------
  col *= 1.0 - uVignette * smoothstep(0.28, 0.92, radial);
  col *= uFade;

  vec3 outCol = encodeSRGB(col);

  // --- grain -------------------------------------------------------------
  // Applied AFTER the sRGB encode, deliberately. In linear space a +/-0.006
  // perturbation on a near-black pixel becomes ~0.09 after encoding: the
  // gamma curve is near-vertical at the bottom, so linear-space grain is
  // roughly 15x stronger in the shadows than intended and buries the
  // background in noise. In display space the amplitude means what it says.
  float g = hash21(px + fract(uTime) * 431.7) - 0.5;
  outCol += g * uGrain * (1.0 - smoothstep(0.0, 0.5, dot(outCol, vec3(0.333))));

  fragColor = vec4(outCol, 1.0);
}
`,At=class e{mesh;material;static geometry=null;static camera=new oe;static scene=null;constructor(n,r){if(!e.geometry){let t=new k;t.setAttribute(`position`,new M(new Float32Array([-1,-1,0,3,-1,0,-1,3,0]),3)),e.geometry=t}this.material=new t({vertexShader:wt,fragmentShader:n,uniforms:r,glslVersion:T,depthTest:!1,depthWrite:!1,side:2}),this.mesh=new a(e.geometry,this.material),this.mesh.frustumCulled=!1}render(t,n){e.scene||=new ce;let r=e.scene;r.clear(),r.add(this.mesh),t.setRenderTarget(n),t.render(r,e.camera)}dispose(){this.material.dispose()}},jt=class{three;canvas;camera;world=new ce;influence=new ce;width=1;height=1;bufferWidth=1;bufferHeight=1;pixelRatio=1;sceneRT;influenceRT;brightRT;bloomA;bloomB;trailA;trailB;trailFlip=!1;brightPass;blurPass;trailPass;compositePass;hdrType;camOffsetX=0;camOffsetY=0;camZoom=1;fade=1;constructor(e){this.three=new ie({antialias:!1,alpha:!1,depth:!1,stencil:!1,powerPreference:`high-performance`,preserveDrawingBuffer:!1}),this.canvas=this.three.domElement,this.three.setClearColor(0,1),this.three.autoClear=!1,this.three.info.autoReset=!1,this.three.outputColorSpace=y,this.three.toneMapping=0,e.appendChild(this.canvas);let t=this.three.getContext(),n=!!t.getExtension(`EXT_color_buffer_half_float`)||!!t.getExtension(`EXT_color_buffer_float`);this.hdrType=n?_e:h,this.camera=new m(0,1,0,1,-1e3,1e3),this.brightPass=new At(Et,{uScene:{value:null},uThreshold:{value:.62},uKnee:{value:.45}}),this.blurPass=new At(Dt,{uSource:{value:null},uDirection:{value:new o}}),this.trailPass=new At(Ot,{uPrev:{value:null},uBright:{value:null},uDecay:{value:.8},uGain:{value:.26},uDrift:{value:new o}});let r=[];for(let e=0;e<6;e++)r.push(new f);this.compositePass=new At(kt,{uScene:{value:null},uBloom:{value:null},uTrail:{value:null},uInfluence:{value:null},uResolution:{value:new o(1,1)},uTime:{value:0},uBloomStrength:{value:.72},uTrailStrength:{value:.26},uChroma:{value:1},uVignette:{value:.55},uFade:{value:1},uShock:{value:r},uRefract:{value:O.field.refraction},uGrain:{value:.012},uBlackBox:{value:new f(0,O.mutator.blackBoxFloor,O.mutator.blackBoxLo,O.mutator.blackBoxHi)}}),this.resize()}makeRT(e,t){let n=new _(Math.max(1,e),Math.max(1,t),{type:this.hdrType,format:le,minFilter:ge,magFilter:ge,wrapS:ae,wrapT:ae,depthBuffer:!1,stencilBuffer:!1,generateMipmaps:!1});return n.texture.colorSpace=``,n}resize(){let e=window.innerWidth>0&&window.innerHeight>0,t=e?window.innerWidth:this.sceneRT?this.width:O.reference.width,n=e?window.innerHeight:this.sceneRT?this.height:O.reference.height,r=Math.min(window.devicePixelRatio||1,O.render.maxPixelRatio);this.width=t,this.height=n,this.pixelRatio=r,this.three.setPixelRatio(r),this.three.setSize(t,n,!1),this.canvas.style.width=`${t}px`,this.canvas.style.height=`${n}px`,this.bufferWidth=Math.max(1,Math.round(t*r)),this.bufferHeight=Math.max(1,Math.round(n*r));let i=this.bufferWidth,a=this.bufferHeight,o=O.render.influenceDiv,s=O.render.trailDiv,c=O.render.bloomDiv;this.sceneRT?(this.sceneRT.setSize(i,a),this.influenceRT.setSize(Math.ceil(i/o),Math.ceil(a/o)),this.brightRT.setSize(Math.ceil(i/c),Math.ceil(a/c)),this.bloomA.setSize(Math.ceil(i/c),Math.ceil(a/c)),this.bloomB.setSize(Math.ceil(i/c),Math.ceil(a/c)),this.trailA.setSize(Math.ceil(i/s),Math.ceil(a/s)),this.trailB.setSize(Math.ceil(i/s),Math.ceil(a/s)),this.clearTarget(this.trailA),this.clearTarget(this.trailB)):(this.sceneRT=this.makeRT(i,a),this.influenceRT=this.makeRT(i/o,a/o),this.brightRT=this.makeRT(i/c,a/c),this.bloomA=this.makeRT(i/c,a/c),this.bloomB=this.makeRT(i/c,a/c),this.trailA=this.makeRT(i/s,a/s),this.trailB=this.makeRT(i/s,a/s)),this.updateCamera(),this.compositePass.material.uniforms.uResolution.value.set(t,n)}clearTarget(e){this.three.setRenderTarget(e),this.three.setClearColor(0,1),this.three.clear(!0,!1,!1),this.three.setRenderTarget(null)}updateCamera(){let e=this.camera,t=this.width/this.camZoom,n=this.height/this.camZoom,r=this.width*.5+this.camOffsetX,i=this.height*.5+this.camOffsetY;e.left=r-t*.5,e.right=r+t*.5,e.top=i-n*.5,e.bottom=i+n*.5,e.updateProjectionMatrix()}setCamera(e,t,n){this.camOffsetX=e,this.camOffsetY=t,this.camZoom=n,this.updateCamera()}setShockwaves(e,t,n,r){let i=this.compositePass.material.uniforms.uShock.value;for(let a=0;a<i.length;a++)i[a].set(e[a]??0,t[a]??0,n[a]??0,r[a]??0)}get influenceTexture(){return this.influenceRT.texture}render(e){let t=this.three;t.info.reset(),t.setRenderTarget(this.influenceRT),t.setClearColor(0,0),t.clear(!0,!1,!1),t.render(this.influence,this.camera),t.setRenderTarget(this.sceneRT),t.setClearColor(0,1),t.clear(!0,!1,!1),t.render(this.world,this.camera),this.brightPass.material.uniforms.uScene.value=this.sceneRT.texture,this.brightPass.render(t,this.brightRT);let n=this.blurPass.material.uniforms,r=this.brightRT.width,i=this.brightRT.height;n.uSource.value=this.brightRT.texture,n.uDirection.value.set(1/r,0),this.blurPass.render(t,this.bloomA),n.uSource.value=this.bloomA.texture,n.uDirection.value.set(0,1/i),this.blurPass.render(t,this.bloomB),n.uSource.value=this.bloomB.texture,n.uDirection.value.set(2.4/r,0),this.blurPass.render(t,this.bloomA),n.uSource.value=this.bloomA.texture,n.uDirection.value.set(0,2.4/i),this.blurPass.render(t,this.bloomB);let a=this.trailFlip?this.trailB:this.trailA,o=this.trailFlip?this.trailA:this.trailB,s=this.trailPass.material.uniforms;s.uPrev.value=a.texture,s.uBright.value=this.brightRT.texture,this.trailPass.render(t,o),this.trailFlip=!this.trailFlip;let c=this.compositePass.material.uniforms;c.uScene.value=this.sceneRT.texture,c.uBloom.value=this.bloomB.texture,c.uTrail.value=o.texture,c.uInfluence.value=this.influenceRT.texture,c.uTime.value=e,c.uChroma.value=O.a11y.chromaticAberration,c.uFade.value=this.fade;let l=c.uBlackBox.value;l.x+=(+!!B.blackBox-l.x)*.06,this.compositePass.render(t,null),t.setRenderTarget(null)}clearTrails(){this.clearTarget(this.trailA),this.clearTarget(this.trailB)}get info(){return this.three.info}shaderErrors(){let e=[],t=this.three.info.programs;if(!t)return e;for(let n of t){let t=n,r=t.diagnostics;if(!r)continue;let i=[r.programLog,r.vertexShader?.log,r.fragmentShader?.log].filter(e=>!!e&&e.trim().length>0).join(` | `).replace(/ /g,``).trim();e.push(`${t.name||`shader`}: ${i||`failed to compile`}`)}return e}dispose(){this.brightPass.dispose(),this.blurPass.dispose(),this.trailPass.dispose(),this.compositePass.dispose(),this.sceneRT.dispose(),this.influenceRT.dispose(),this.brightRT.dispose(),this.bloomA.dispose(),this.bloomB.dispose(),this.trailA.dispose(),this.trailB.dispose(),this.three.dispose()}};new l(...R.grid),new l(...R.gridHot),new l(...R.field),new l(...R.fieldDeep),new l(...R.node),new l(...R.nodeHalo),new l(...R.player),new l(...R.warning);var Mt=class{mesh;geometry;material;positions=new Float32Array(12);constructor(e){this.geometry=new k,this.geometry.setAttribute(`position`,new M(this.positions,3)),this.geometry.setIndex([0,1,2,0,2,3]),this.geometry.boundingSphere=new p(new l,1e7),this.material=new t({vertexShader:Ct,fragmentShader:Tt,glslVersion:T,depthTest:!1,depthWrite:!1,side:2,uniforms:{uInfluence:{value:e},uResolution:{value:new o(1,1)},uTime:{value:0},uGridColor:{value:new l(...R.grid)},uGridHot:{value:new l(...R.gridHot)},uFieldColor:{value:new l(...R.field)},uPlayer:{value:new o},uPlayerEnergy:{value:0},uCellSize:{value:34}}}),this.mesh=new a(this.geometry,this.material),this.mesh.frustumCulled=!1,this.mesh.renderOrder=D.background}resize(e,t){let n=-120,r=-120,i=e+120,a=t+120,o=this.positions;o[0]=n,o[1]=r,o[2]=0,o[3]=i,o[4]=r,o[5]=0,o[6]=i,o[7]=a,o[8]=0,o[9]=n,o[10]=a,o[11]=0,this.geometry.getAttribute(`position`).needsUpdate=!0,this.material.uniforms.uResolution.value.set(e,t)}update(e,t,n,r){let i=this.material.uniforms;i.uTime.value=e,i.uPlayer.value.set(t,n),i.uPlayerEnergy.value=r}dispose(){this.geometry.dispose(),this.material.dispose()}},Nt=`
precision highp float;

in vec3 position;   // centerline point, z unused
in vec4 aExt;       // nx, ny, side(-1..1), outerHalf(px)
in vec4 aInfo;      // coreHalf(px), along01, speed01, curv01
in vec4 aMeta;      // birthTime, seed, slot, arcLength(px from stroke start)

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float uTime;
uniform sampler2D uTraceData;   // per-trace: r=energy g=flash b=fade a=totalLength(px)
uniform float uTraceCount;
uniform float uTipTaper;        // arclength over which a stroke tip narrows

out float vSide;
out float vOuter;
out float vCore;
out float vAlong;
out float vSpeed;
out float vCurv;
out float vSeed;
out float vAge;
out float vEnergy;
out float vFlash;
out float vFade;
out vec2 vNormal;

${ue}

void main() {
  vSide  = aExt.z;
  vAlong = aInfo.y;
  vSpeed = aInfo.z;
  vCurv  = aInfo.w;
  vSeed  = aMeta.y;

  vAge = max(0.0, uTime - aMeta.x);
  float state = stateForAge(vAge);

  // Per-trace dynamics arrive through a 1-row data texture rather than a
  // uniform, so all traces still batch into one draw call.
  float u = (aMeta.z + 0.5) / uTraceCount;
  vec4 td = texture(uTraceData, vec2(u, 0.5));
  vEnergy = td.r;
  vFlash  = td.g;
  vFade   = td.b;

  // Energy inflates the line slightly. A charged trace is visibly fatter before
  // you read any colour, so the state is legible in silhouette alone.
  float widthScale = 1.0 + vEnergy * 0.28 + vFlash * 0.22;

  // TIP TAPER, computed live rather than baked into the vertex.
  //
  // The taper depends on the stroke's TOTAL length, which keeps growing while
  // you draw. Baking it made a vertex's width correct only for the instant it
  // was written: points scrolled out of the renderer's rewrite window still
  // carrying the narrow width they had when they were near the head, leaving a
  // permanent sawtooth of chevrons along every stroke. Deriving it here from an
  // immutable per-vertex arclength plus the trace's current length means it is
  // exact for every point on every frame, and no rewrite window can be wrong.
  float arc = aMeta.w;
  float totalLen = max(1.0, td.a);
  float taper = smoothstep(0.0, uTipTaper, arc)
              * smoothstep(0.0, uTipTaper * 1.7, totalLen - arc);

  // The glow keeps most of its width where the core narrows to a point, which
  // is how an actual pen stroke ends — a sharp tip inside a soft halo.
  float coreTaper  = max(taper, 0.04);
  float outerTaper = mix(0.38, 1.0, taper);

  // FRACTURED and beyond: the line physically loses its footing. This is a
  // geometric tell, not a colour tell, so it survives colour blindness and
  // survives being seen at the edge of vision.
  float unstable = smoothstep(2.1, 4.0, state);
  float wobble =
      sin(vAlong * 61.0 + uTime * 13.0 + vSeed * 40.0) *
      cos(vAlong * 23.0 - uTime * 7.3 + vSeed * 12.0);
  float lateral = wobble * unstable * (2.6 + vEnergy * 2.0);

  // vOuter and the extrusion MUST use the same scale or the distance field in
  // the fragment shader no longer measures pixels.
  float outerPx = aExt.w * outerTaper * widthScale;
  vOuter = outerPx;
  vCore  = aInfo.x * coreTaper * widthScale;

  vec2 n = aExt.xy;
  vNormal = n;
  vec2 p = position.xy
         + n * (aExt.z * outerPx * vFade)
         + n * lateral;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 0.0, 1.0);
}
`,Pt=`
precision highp float;

in float vSide;
in float vOuter;
in float vCore;
in float vAlong;
in float vSpeed;
in float vCurv;
in float vSeed;
in float vAge;
in float vEnergy;
in float vFlash;
in float vFade;
in vec2 vNormal;

uniform float uTime;
uniform float uFlashScale;   // accessibility: flash intensity 0..1
// GHOST (Phase 5), 0 or 1. A trace stops being VISIBLE shortly after it is laid
// down while remaining fully present in every other respect. Implemented on age
// rather than on a per-trace "released" flag, and that turned out to be the
// better mechanic as well as the cheaper one: what you get is a short glowing
// head-trail under the cursor that dissolves behind you, so drawing still has
// immediate feedback and only your MEMORY of the board is taken away.
uniform float uGhost;
uniform float uGhostFade;    // seconds over which a ghosted line disappears
uniform vec2  uLifespan;     // x = max point age, y = dissolve window

out vec4 fragColor;

${E}
${ue}

void main() {
  // Pixel distance from the centerline. This one value drives every layer.
  float d = abs(vSide) * vOuter;

  float state = stateForAge(vAge);
  vec3 base = rampColor(state);

  // ---- LAYER 4: OUTER FIELD -------------------------------------------
  // Wide, dim, exponential. This is the trace's presence in space; it is what
  // makes two nearby lines feel like they are pressing against each other.
  float outer = exp(-d / max(1.0, vOuter * 0.34));

  // ---- LAYER 3: INNER GLOW --------------------------------------------
  float ig = d / max(0.75, vCore * 2.5);
  float inner = exp(-ig * ig * 1.35);

  // ---- LAYER 2: BODY ---------------------------------------------------
  // The solid stroke. Sharp-edged, antialiased by fwidth on the SDF.
  float body = 1.0 - smoothstep(vCore - fwidth(d) - 0.5, vCore + fwidth(d) + 0.5, d);

  // ---- LAYER 1: CORE ---------------------------------------------------
  // A hot filament inside the body, only visible when moving fast or charged.
  // This is the "fast = sharp, strong highlight" half of spec §4.
  float coreW = vCore * mix(0.62, 0.24, vSpeed);
  float core = 1.0 - smoothstep(coreW - 0.6, coreW + 0.6, d);

  // FRACTURED: perforate the line along its length. Holes are stable in
  // arclength, so they read as damage to a physical object rather than noise.
  float fracture = smoothstep(2.7, 4.0, state);

  // DEATH. Every point dies on its own clock.
  //
  // Previously the whole trace was culled the instant its NEWEST point expired,
  // which meant the oldest end of a stroke stayed fully lit long past its own
  // lifetime — the single biggest reason old lines felt like they overstayed.
  // Dissolving per point makes a stroke disintegrate from the tail forward, so
  // it reads as decay finishing rather than as an object being deleted.
  float dying = smoothstep(uLifespan.x - uLifespan.y, uLifespan.x, vAge);

  float grain = vnoise(vec2(vAlong * 260.0, vSeed * 90.0));
  float holes = max(fracture * 0.62, dying * 0.98);
  float perforate = 1.0 - step(grain, holes);
  float breakup = mix(1.0, perforate, step(0.01, holes));

  // HOSTILE: a charge runs along the line looking for a way out.
  float hostile = smoothstep(3.4, 4.0, state);
  float spark = pow(max(0.0, sin((vAlong * 8.0 - uTime * 2.4 + vSeed) * PI)), 26.0);

  // Curvature tension: the outside of a hard turn heats up. Local, subtle, and
  // the only reason a sharp corner reads differently from a gentle one.
  float tension = vCurv * (1.0 - abs(vSide) * 0.4);

  vec3 col = vec3(0.0);
  col += base * outer * (0.30 + vEnergy * 0.45);
  col += base * inner * (0.85 + tension * 0.7);
  col += base * body  * 1.55;
  // The core reads white-hot but keeps a tint of the state colour, so even a
  // saturated core still tells you the trace is about to turn on you.
  col += mix(base, vec3(1.0), 0.72) * core * (1.1 + vSpeed * 2.3 + vEnergy * 1.4);
  col += base * spark * hostile * 4.0;
  col += vec3(1.0) * vFlash * body * 2.2 * uFlashScale;

  col *= breakup;
  col *= vFade;
  col *= 1.0 - dying * 0.7;

  // GHOST. Applied to the world pass only — the influence pass is untouched, so
  // an invisible line still bends the background lattice around itself. That is
  // deliberate and is the mechanic's one concession: space remembers the line
  // even when you cannot see it, which is the difference between a hard puzzle
  // and an unfair one.
  col *= mix(1.0, 1.0 - smoothstep(0.0, max(0.0001, uGhostFade), vAge), uGhost);

  // Slight additive lift on the outer field only, so overlapping glows build
  // toward a bloom rather than banding.
  float alpha = clamp(outer * 0.5 + body + core, 0.0, 4.0);
  if (alpha < 0.002) discard;

  fragColor = vec4(col, 1.0);
}
`,Ft=`
precision highp float;

in float vSide;
in float vOuter;
in float vCore;
in float vAlong;
in float vSpeed;
in float vCurv;
in float vSeed;
in float vAge;
in float vEnergy;
in float vFlash;
in float vFade;
in vec2 vNormal;

out vec4 fragColor;

${E}
${ue}

void main() {
  float d = abs(vSide) * vOuter;
  float falloff = exp(-d / max(1.0, vOuter * 0.42));

  // Space is pushed AWAY from the line, along its normal. sign(vSide) picks
  // which side of the ribbon this fragment is on.
  float dir = vSide >= 0.0 ? 1.0 : -1.0;

  float state = stateForAge(vAge);
  // A decayed trace disturbs space MORE violently, not less: it is failing.
  float agitation = 1.0 + smoothstep(2.0, 4.0, state) * 1.4;

  float strength = falloff * vFade * (0.55 + vEnergy * 0.9 + vFlash) * agitation;

  fragColor = vec4(vNormal * dir * strength, falloff * vFade * (0.4 + vEnergy), 0.0);
}
`,It=class{traces;mesh;influenceMesh;geometry;aPosition;aExt;aInfo;aMeta;indexAttr;posArr;extArr;infoArr;metaArr;idxArr;vertsPerTrace;maxVerts;dataTex;dataArr;material;influenceMaterial;dirtyMin=1/0;dirtyMax=-1/0;indexDirty=!0;lastPointCounts;drawnVertices=0;drawnIndices=0;constructor(e){this.traces=e;let n=O.trace.maxTraces;this.vertsPerTrace=(O.trace.maxPoints+1)*2,this.maxVerts=n*this.vertsPerTrace;let r=n*O.trace.maxPoints*6;this.posArr=new Float32Array(this.maxVerts*3),this.extArr=new Float32Array(this.maxVerts*4),this.infoArr=new Float32Array(this.maxVerts*4),this.metaArr=new Float32Array(this.maxVerts*4),this.idxArr=new Uint32Array(r),this.lastPointCounts=new Int32Array(n).fill(-1),this.geometry=new k,this.aPosition=new M(this.posArr,3),this.aExt=new M(this.extArr,4),this.aInfo=new M(this.infoArr,4),this.aMeta=new M(this.metaArr,4);for(let e of[this.aPosition,this.aExt,this.aInfo,this.aMeta])e.setUsage(I);this.geometry.setAttribute(`position`,this.aPosition),this.geometry.setAttribute(`aExt`,this.aExt),this.geometry.setAttribute(`aInfo`,this.aInfo),this.geometry.setAttribute(`aMeta`,this.aMeta),this.indexAttr=new M(this.idxArr,1),this.indexAttr.setUsage(I),this.geometry.setIndex(this.indexAttr),this.geometry.setDrawRange(0,0),this.geometry.boundingSphere=new p(new l,1e7),this.dataArr=new Float32Array(n*4),this.dataTex=new ne(this.dataArr,n,1,le,ve),this.dataTex.minFilter=i,this.dataTex.magFilter=i,this.dataTex.needsUpdate=!0;let s=O.trace.decay,c={uTime:{value:0},uTraceData:{value:this.dataTex},uTraceCount:{value:n},uRamp:{value:Se()},uDecayThresholds:{value:new f(s.stable,s.charged,s.unstable,s.fractured)},uTipTaper:{value:O.trace.tipTaper},uLifespan:{value:new o(U.maxPointAge,O.trace.decay.dissolve)}};this.material=new t({vertexShader:Nt,fragmentShader:Pt,glslVersion:T,uniforms:{...c,uFlashScale:{value:1},uGhost:{value:0},uGhostFade:{value:O.mutator.ghostFade}},...F}),this.influenceMaterial=new t({vertexShader:Nt,fragmentShader:Ft,glslVersion:T,uniforms:{...c},...F}),this.mesh=new a(this.geometry,this.material),this.mesh.frustumCulled=!1,this.mesh.renderOrder=D.trace,this.influenceMesh=new a(this.geometry,this.influenceMaterial),this.influenceMesh.frustumCulled=!1,this.influenceMesh.renderOrder=D.trace}halfWidthAt(e,t){let n=O.trace,r=e.pSpeed[t],i=n.slowWidthMul+(n.fastWidthMul-n.slowWidthMul)*r,a=S(e.pCurv[t]/n.curvatureSaturation),o=1+(n.curvatureWidthMul-1)*a;return Math.max(.35,n.baseHalfWidth*i*o)}markDirty(e,t){e<this.dirtyMin&&(this.dirtyMin=e),t>this.dirtyMax&&(this.dirtyMax=t)}writePoint(e,t,n,r,i,a){let o=e.count,s=r?i:e.px[t],c=r?a:e.py[t],l,u;r?(l=s-e.px[o-1],u=c-e.py[o-1]):o===1?(l=1,u=0):t===0?(l=e.px[1]-e.px[0],u=e.py[1]-e.py[0]):t===o-1?(l=e.px[t]-e.px[t-1],u=e.py[t]-e.py[t-1]):(l=e.px[t+1]-e.px[t-1],u=e.py[t+1]-e.py[t-1]);let d=Math.hypot(l,u);d>1e-5?(l/=d,u/=d):(l=1,u=0);let f=-u,p=l,m=r?o-1:t,h=this.halfWidthAt(e,m);r&&(h*=.55);let g=Math.max(h*O.trace.outerGlowScale,3),_=r?e.length:e.pDist[t],v=e.length>.001?r?1:e.pDist[t]/e.length:0,y=e.pSpeed[m],b=S(e.pCurv[m]/O.trace.curvatureSaturation),x=e.pBirth[m],C=n+(r?o:t)*2;for(let t=0;t<2;t++){let n=C+t,r=t===0?-1:1;this.posArr[n*3]=s,this.posArr[n*3+1]=c,this.posArr[n*3+2]=0,this.extArr[n*4]=f,this.extArr[n*4+1]=p,this.extArr[n*4+2]=r,this.extArr[n*4+3]=g,this.infoArr[n*4]=h,this.infoArr[n*4+1]=v,this.infoArr[n*4+2]=y,this.infoArr[n*4+3]=b,this.metaArr[n*4]=x,this.metaArr[n*4+1]=e.seed,this.metaArr[n*4+2]=e.slot,this.metaArr[n*4+3]=_}this.markDirty(C,C+1)}update(e){this.dirtyMin=1/0,this.dirtyMax=-1/0,this.material.uniforms.uDecayThresholds.value.set(B.decayStable,B.decayCharged,B.decayUnstable,B.decayFractured),this.material.uniforms.uLifespan.value.set(B.maxPointAge,B.dissolve);let t=this.traces.traces,n=this.traces.current;for(let e=0;e<t.length;e++){let r=t[e],i=e*this.vertsPerTrace;if(!r.active){this.lastPointCounts[e]!==0&&(this.lastPointCounts[e]=0,this.indexDirty=!0);continue}let a=r===n&&this.traces.hasHead;if(r.geomDirty){let e=Math.max(0,Math.min(r.dirtyFrom,r.count-12));for(let t=e;t<r.count;t++)this.writePoint(r,t,i,!1,0,0);r.geomDirty=!1,r.dirtyFrom=r.count}a&&this.writePoint(r,r.count,i,!0,this.traces.headX,this.traces.headY);let o=r.count+ +!!a;this.lastPointCounts[e]!==o&&(this.lastPointCounts[e]=o,this.indexDirty=!0),this.dataArr[e*4]=r.energy,this.dataArr[e*4+1]=r.flash,this.dataArr[e*4+2]=r.fade,this.dataArr[e*4+3]=r.length}if(this.dataTex.needsUpdate=!0,this.indexDirty){let e=0;for(let n=0;n<t.length;n++){if(!t[n].active)continue;let r=this.lastPointCounts[n];if(r<2)continue;let i=n*this.vertsPerTrace;for(let t=0;t<r-1;t++){let n=i+t*2;this.idxArr[e++]=n,this.idxArr[e++]=n+1,this.idxArr[e++]=n+2,this.idxArr[e++]=n+1,this.idxArr[e++]=n+3,this.idxArr[e++]=n+2}}this.drawnIndices=e,this.geometry.setDrawRange(0,e),this.indexAttr.needsUpdate=!0,this.indexDirty=!1}if(this.dirtyMax>=this.dirtyMin){let e=this.dirtyMin,t=this.dirtyMax-this.dirtyMin+1;this.uploadRange(this.aPosition,e,t,3),this.uploadRange(this.aExt,e,t,4),this.uploadRange(this.aInfo,e,t,4),this.uploadRange(this.aMeta,e,t,4)}this.material.uniforms.uTime.value=e,this.influenceMaterial.uniforms.uTime.value=e,this.material.uniforms.uFlashScale.value=O.a11y.flashIntensity,this.material.uniforms.uGhost.value=+!!B.ghost}uploadRange(e,t,n,r){e.clearUpdateRanges(),e.addUpdateRange(t*r,n*r),e.needsUpdate=!0}invalidate(){this.lastPointCounts.fill(-1),this.indexDirty=!0;for(let e of this.traces.traces)e.geomDirty=!0,e.dirtyFrom=0}dispose(){this.geometry.dispose(),this.material.dispose(),this.influenceMaterial.dispose(),this.dataTex.dispose()}},Lt=`
precision highp float;

in vec3 position;      // unit quad corner, -1..1
in vec2 aPos;          // node centre, px
in vec4 aParams;       // radius, energy, flash, punch
in vec2 aAngles;       // angleA, angleB (radians)
in vec2 aMeta;         // combo, seed

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

out vec2  vLocal;
out float vRadius;
out float vEnergy;
out float vFlash;
out float vCombo;
out float vSeed;
out vec2  vDirA;
out vec2  vDirB;

void main() {
  // The punch spring can overshoot below zero on the rebound; clamping keeps
  // the quad from inverting while preserving the overshoot above.
  float scale = aParams.x * max(0.15, 1.0 + aParams.w * 0.05);
  // Quad is oversized relative to the node radius so the glow has room to fall
  // off inside the geometry instead of being clipped at the edge.
  float quad = scale * 4.2;

  vLocal  = position.xy * 4.2;
  vRadius = 1.0;
  vEnergy = aParams.y;
  vFlash  = aParams.z;
  vCombo  = aMeta.x;
  vSeed   = aMeta.y;
  vDirA   = vec2(cos(aAngles.x), sin(aAngles.x));
  vDirB   = vec2(cos(aAngles.y), sin(aAngles.y));

  vec2 p = aPos + position.xy * quad;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 0.0, 1.0);
}
`,Rt=`
precision highp float;

in vec2  vLocal;
in float vRadius;
in float vEnergy;
in float vFlash;
in float vCombo;
in float vSeed;
in vec2  vDirA;
in vec2  vDirB;

uniform float uTime;
uniform vec3  uCore;
uniform vec3  uHalo;
uniform float uFlashScale;

out vec4 fragColor;

${E}

/** Distance to an infinite line through the origin with direction d. */
float lineDist(vec2 p, vec2 d) {
  return abs(p.x * d.y - p.y * d.x);
}

void main() {
  float r = length(vLocal);

  // --- the two parent directions, drawn as tapering shards -------------
  // This is the whole idea: the node shows you WHICH two strokes made it.
  float reach = 3.4 + vEnergy * 1.1 + vFlash * 1.6;
  float taper = exp(-r / reach);
  float shardA = exp(-lineDist(vLocal, vDirA) * 7.0) * taper;
  float shardB = exp(-lineDist(vLocal, vDirB) * 7.0) * taper;
  float shards = (shardA + shardB) * (0.55 + vFlash * 1.4);

  // --- core --------------------------------------------------------------
  float coreR = 0.62 + vEnergy * 0.2;
  float core = 1.0 - smoothstep(coreR - 0.14, coreR + 0.14, r);
  float innerGlow = exp(-r * r * 0.85);

  // --- ring: a containment boundary that snaps outward on formation ------
  float ringR = 1.45 + vFlash * 1.5 + vEnergy * 0.35;
  float ring = exp(-pow((r - ringR) * 3.6, 2.0)) * (0.35 + vFlash * 1.1);

  // --- combo ticks: countable marks orbiting the node --------------------
  // Reading "how big is this chain" should not require reading a number
  // (spec §25 keeps typography rare). Up to 8 ticks, then the ring saturates.
  float ticks = 0.0;
  if (vCombo > 1.5) {
    float n = min(vCombo, 8.0);
    float a = atan(vLocal.y, vLocal.x) + uTime * 0.55 + vSeed * TAU;
    float seg = fract(a / TAU * n);
    float mark = pow(max(0.0, sin(seg * PI)), 34.0);
    ticks = mark * exp(-pow((r - 2.25) * 4.5, 2.0)) * 0.9;
  }

  vec3 col = vec3(0.0);
  col += uHalo * innerGlow * (0.5 + vEnergy * 0.9);
  col += uHalo * shards * 1.15;
  col += uCore * core * (2.6 + vEnergy * 2.2 + vFlash * 5.0 * uFlashScale);
  col += uHalo * ring * 1.5;
  col += uCore * ticks * 1.7;

  float a = core + innerGlow * 0.5 + shards * 0.4 + ring * 0.5 + ticks;
  if (a < 0.003) discard;

  fragColor = vec4(col, 1.0);
}
`,zt=`
precision highp float;

in vec2  vLocal;
in float vRadius;
in float vEnergy;
in float vFlash;
in float vCombo;
in float vSeed;
in vec2  vDirA;
in vec2  vDirB;

out vec4 fragColor;

void main() {
  float r = length(vLocal);
  float falloff = exp(-r * 0.62);
  vec2 dir = r > 1e-4 ? -vLocal / r : vec2(0.0);
  float strength = falloff * (0.5 + vEnergy * 0.8 + vFlash * 1.6);
  fragColor = vec4(dir * strength, falloff * (0.5 + vEnergy), 0.0);
}
`,Bt=class{nodes;mesh;influenceMesh;geometry;material;influenceMaterial;posArr;paramArr;angleArr;metaArr;aPos;aParams;aAngles;aMeta;visible=0;constructor(e){this.nodes=e;let n=O.node.maxNodes;this.geometry=new r,this.geometry.setAttribute(`position`,new M(new Float32Array([-1,-1,0,1,-1,0,1,1,0,-1,1,0]),3)),this.geometry.setIndex([0,1,2,0,2,3]),this.geometry.boundingSphere=new p(new l,1e7),this.posArr=new Float32Array(n*2),this.paramArr=new Float32Array(n*4),this.angleArr=new Float32Array(n*2),this.metaArr=new Float32Array(n*2),this.aPos=new v(this.posArr,2),this.aParams=new v(this.paramArr,4),this.aAngles=new v(this.angleArr,2),this.aMeta=new v(this.metaArr,2);for(let e of[this.aPos,this.aParams,this.aAngles,this.aMeta])e.setUsage(I);this.geometry.setAttribute(`aPos`,this.aPos),this.geometry.setAttribute(`aParams`,this.aParams),this.geometry.setAttribute(`aAngles`,this.aAngles),this.geometry.setAttribute(`aMeta`,this.aMeta),this.geometry.instanceCount=0,this.material=new t({vertexShader:Lt,fragmentShader:Rt,glslVersion:T,uniforms:{uTime:{value:0},uCore:{value:new l(...R.node)},uHalo:{value:new l(...R.nodeHalo)},uFlashScale:{value:1}},...F}),this.influenceMaterial=new t({vertexShader:Lt,fragmentShader:zt,glslVersion:T,uniforms:{uTime:{value:0},uCore:{value:new l(...R.node)},uHalo:{value:new l(...R.nodeHalo)},uFlashScale:{value:1}},...F}),this.mesh=new a(this.geometry,this.material),this.mesh.frustumCulled=!1,this.mesh.renderOrder=D.node,this.influenceMesh=new a(this.geometry,this.influenceMaterial),this.influenceMesh.frustumCulled=!1,this.influenceMesh.renderOrder=D.node}update(e){let t=this.nodes.nodes,n=0;for(let e=0;e<t.length;e++){let r=t[e];r.active&&(this.posArr[n*2]=r.x,this.posArr[n*2+1]=r.y,this.paramArr[n*4]=O.node.radius,this.paramArr[n*4+1]=r.energy,this.paramArr[n*4+2]=r.flash,this.paramArr[n*4+3]=r.punch,this.angleArr[n*2]=r.angleA,this.angleArr[n*2+1]=r.angleB,this.metaArr[n*2]=r.combo,this.metaArr[n*2+1]=r.seed,n++)}this.visible=n,this.geometry.instanceCount=n,n>0&&(this.aPos.needsUpdate=!0,this.aParams.needsUpdate=!0,this.aAngles.needsUpdate=!0,this.aMeta.needsUpdate=!0),this.material.uniforms.uTime.value=e,this.influenceMaterial.uniforms.uTime.value=e,this.material.uniforms.uFlashScale.value=O.a11y.flashIntensity}dispose(){this.geometry.dispose(),this.material.dispose(),this.influenceMaterial.dispose()}},Vt=`
precision highp float;

in vec3 position;
in vec2 aLocal;    // (p - centroid) / radius
in vec4 aParams;   // form, energy, life01, seed
in vec2 aState;    // state (0 alive, 1 imploding, 2 bursting), phase
in float aEdge;    // -1 outside .. 0 boundary .. +1 interior

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

out vec2  vLocal;
out float vForm;
out float vEnergy;
out float vLife;
out float vSeed;
out float vState;
out float vPhase;
out float vEdge;

void main() {
  vLocal  = aLocal;
  vForm   = aParams.x;
  vEnergy = aParams.y;
  vLife   = aParams.z;
  vSeed   = aParams.w;
  vState  = aState.x;
  vPhase  = aState.y;
  vEdge   = aEdge;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xy, 0.0, 1.0);
}
`,Ht=`
precision highp float;

in vec2  vLocal;
in float vForm;
in float vEnergy;
in float vLife;
in float vSeed;
in float vState;
in float vPhase;
in float vEdge;

uniform float uTime;
uniform vec3  uField;
uniform vec3  uFieldDeep;
uniform vec3  uWarn;

out vec4 fragColor;

${E}

void main() {
  float r = length(vLocal);

  // Formation wavefront: sweeps out from the centre exactly once, at birth.
  // The field does not fade in, it PROPAGATES into existence.
  float front = clamp(vForm, 0.0, 1.7);
  float born = 1.0 - smoothstep(front - 0.14, front + 0.12, r);
  if (born < 0.002) discard;

  float inside = smoothstep(-0.04, 0.08, vEdge);
  float edge   = exp(-pow(vEdge / 0.40, 2.0));

  // Standing interference from two wave families with incommensurate periods,
  // so the interior never visibly repeats.
  //
  // Deliberately LOW frequency and LOW weight. The primary statement a field
  // makes is the screen-space refraction applied in the composite — the world
  // behind it genuinely bends. A dense fringe pattern competes with that for
  // the same pixels and wins, and the result reads as noise laid over the
  // scene instead of a change to the space itself. This pattern's job is only
  // to prove the region is structured, not to be the effect.
  float t = uTime * 0.85 + vSeed * 30.0;
  float weave = abs(sin(r * 7.0 - t * 1.9) * sin(atan(vLocal.y, vLocal.x) * 3.0 + t * 0.8 + r * 3.0));
  weave = pow(weave, 2.6);

  // Fringes bunch toward the centre: time is being squeezed here, which is
  // literally what the simulation does (Config.field.timeScale).
  float compress = exp(-r * r * 1.15);

  // Age warning: an expiring field drifts toward the warning hue, gradually,
  // so it can be read peripherally as "spend me".
  float expiring = smoothstep(0.62, 1.0, vLife);

  vec3 base = mix(uFieldDeep, uField, 0.35 + vEnergy * 0.5);
  base = mix(base, uWarn, expiring * 0.55);

  vec3 col = vec3(0.0);
  col += base * weave * inside * (0.16 + vEnergy * 0.26) * (0.35 + compress);
  col += base * compress * inside * 0.13;
  col += base * edge * (0.8 + vEnergy * 0.6);
  col += mix(base, vec3(1.0), 0.4) * edge * edge * 0.34;

  // Imploding: everything rushes to white as the volume collapses.
  if (vState > 0.5 && vState < 1.5) {
    float k = clamp(vPhase, 0.0, 1.0);
    col += mix(base, vec3(1.0), k) * (0.6 + k * 5.5) * (compress * inside + edge);
    col *= 1.0 + k * 2.2;
  }
  // Bursting: the region is gone; this is the residue flashing off.
  if (vState > 1.5) {
    col *= (1.0 - clamp(vPhase, 0.0, 1.0)) * 2.0;
  }

  col *= born;
  // Expiring fields pulse. Motion as well as hue, so it is impossible to miss.
  col *= 1.0 + expiring * 0.5 * sin(uTime * 9.0 + vSeed * 10.0);

  if (dot(col, vec3(0.333)) < 0.0015) discard;
  fragColor = vec4(col, 1.0);
}
`,Ut=`
precision highp float;

in vec2  vLocal;
in float vForm;
in float vEnergy;
in float vLife;
in float vSeed;
in float vState;
in float vPhase;
in float vEdge;

uniform float uTime;

out vec4 fragColor;

void main() {
  float r = length(vLocal);
  float front = clamp(vForm, 0.0, 1.7);
  float born = 1.0 - smoothstep(front - 0.14, front + 0.12, r);
  if (born < 0.002) discard;

  float inside = smoothstep(-0.04, 0.08, vEdge);

  // Displacement points inward: the field is pulling space into itself.
  vec2 dir = r > 1e-4 ? -vLocal / r : vec2(0.0);
  float grad = smoothstep(0.0, 0.9, r);

  float implode = (vState > 0.5 && vState < 1.5) ? clamp(vPhase, 0.0, 1.0) : 0.0;
  float strength = born * inside * (grad * (0.7 + vEnergy) + implode * 2.6);

  fragColor = vec4(dir * strength, born * inside * 0.3 * (0.5 + vEnergy), born * inside);
}
`,Wt=256,Gt=class{fields;mesh;influenceMesh;geometry;material;influenceMaterial;posArr;localArr;paramArr;stateArr;edgeArr;idxArr;aPos;aLocal;aParams;aState;aEdge;index;drawnTriangles=0;constructor(e){this.fields=e;let n=O.field.maxFields,r=Wt*3*n,i=n*3840;this.posArr=new Float32Array(r*3),this.localArr=new Float32Array(r*2),this.paramArr=new Float32Array(r*4),this.stateArr=new Float32Array(r*2),this.edgeArr=new Float32Array(r),this.idxArr=new Uint32Array(i),this.geometry=new k,this.aPos=new M(this.posArr,3),this.aLocal=new M(this.localArr,2),this.aParams=new M(this.paramArr,4),this.aState=new M(this.stateArr,2),this.aEdge=new M(this.edgeArr,1),this.index=new M(this.idxArr,1);for(let e of[this.aPos,this.aLocal,this.aParams,this.aState,this.aEdge,this.index])e.setUsage(I);this.geometry.setAttribute(`position`,this.aPos),this.geometry.setAttribute(`aLocal`,this.aLocal),this.geometry.setAttribute(`aParams`,this.aParams),this.geometry.setAttribute(`aState`,this.aState),this.geometry.setAttribute(`aEdge`,this.aEdge),this.geometry.setIndex(this.index),this.geometry.setDrawRange(0,0),this.geometry.boundingSphere=new p(new l,1e7);let o=()=>({uTime:{value:0},uField:{value:new l(...R.field)},uFieldDeep:{value:new l(...R.fieldDeep)},uWarn:{value:new l(...R.warning)}});this.material=new t({vertexShader:Vt,fragmentShader:Ht,glslVersion:T,uniforms:o(),...F}),this.influenceMaterial=new t({vertexShader:Vt,fragmentShader:Ut,glslVersion:T,uniforms:o(),...F}),this.mesh=new a(this.geometry,this.material),this.mesh.frustumCulled=!1,this.mesh.renderOrder=D.field,this.influenceMesh=new a(this.geometry,this.influenceMaterial),this.influenceMesh.frustumCulled=!1,this.influenceMesh.renderOrder=D.field}writeVert(e,t,n,r,i,a,o,s){this.posArr[e*3]=t,this.posArr[e*3+1]=n,this.posArr[e*3+2]=0,this.localArr[e*2]=r,this.localArr[e*2+1]=i,this.paramArr[e*4]=a.form,this.paramArr[e*4+1]=a.energy,this.paramArr[e*4+2]=s,this.paramArr[e*4+3]=a.seed,this.stateArr[e*2]=a.state,this.stateArr[e*2+1]=a.phase,this.edgeArr[e]=o}update(e){let t=0,n=0,r=0,i=this.fields.fields;for(let e=0;e<i.length;e++){let a=i[e];if(!a.active||a.count<3)continue;let o=a.count,s=Math.max(1,a.radius),c=Math.min(16,s*.3),l=Math.min(24,s*.34),u=1+c/s,d=1-l/s,f=St.ageOf(a),p=t,m=t+o,h=t+o*2;for(let e=0;e<o;e++){let t=a.pts[e*2],n=a.pts[e*2+1],r=t-a.cx,i=n-a.cy;this.writeVert(p+e,a.cx+r*u,a.cy+i*u,r*u/s,i*u/s,a,-1,f),this.writeVert(m+e,t,n,r/s,i/s,a,0,f),this.writeVert(h+e,a.cx+r*d,a.cy+i*d,r*d/s,i*d/s,a,1,f)}t+=o*3;for(let e=0;e<o;e++){let t=(e+1)%o;this.idxArr[n++]=p+e,this.idxArr[n++]=p+t,this.idxArr[n++]=m+e,this.idxArr[n++]=p+t,this.idxArr[n++]=m+t,this.idxArr[n++]=m+e,this.idxArr[n++]=m+e,this.idxArr[n++]=m+t,this.idxArr[n++]=h+e,this.idxArr[n++]=m+t,this.idxArr[n++]=h+t,this.idxArr[n++]=h+e,r+=4}for(let e=0;e<a.indexCount;e++){let t=a.indices[e];t>=o||(this.idxArr[n++]=h+t)}r+=a.indexCount/3|0}this.drawnTriangles=r,this.geometry.setDrawRange(0,n),t>0&&(this.aPos.needsUpdate=!0,this.aLocal.needsUpdate=!0,this.aParams.needsUpdate=!0,this.aState.needsUpdate=!0,this.aEdge.needsUpdate=!0,this.index.needsUpdate=!0),this.material.uniforms.uTime.value=e,this.influenceMaterial.uniforms.uTime.value=e}static isLive(e){return e.active&&e.state===0}dispose(){this.geometry.dispose(),this.material.dispose(),this.influenceMaterial.dispose()}},Kt=`
precision highp float;

in vec3 position;   // unit quad, -1..1

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform vec2 uPos;
uniform float uExtent;

out vec2 vLocal;

void main() {
  vLocal = position.xy * uExtent;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(uPos + vLocal, 0.0, 1.0);
}
`,qt=`
precision highp float;

in vec2 vLocal;      // px, relative to the spring-lagged core

uniform vec2  uRawOffset;  // (rawPointer - corePos), px
uniform vec2  uVel;        // unit direction * speed01
uniform float uSpeed;      // 0..1
uniform float uDrawing;    // 0..1, smoothed
uniform float uEnergy;     // 0..1
uniform float uTime;
uniform float uDenied;     // 0..1 pulse when an action had no effect
uniform vec3  uColor;
uniform vec3  uAccent;
uniform float uCoreRadius;
uniform float uRingRadius;

out vec4 fragColor;

${E}

void main() {
  vec2 d = vLocal;
  float rawLen = length(d);

  float sp = length(uVel);
  vec2 dir = sp > 1e-4 ? uVel / sp : vec2(1.0, 0.0);

  // Anisotropic scaling along the velocity axis: motion stretches the ring
  // into an ellipse. That is the entire directional readout, expressed as
  // geometry rather than as an added arrow.
  float along  = dot(d, dir);
  float across = d.x * dir.y - d.y * dir.x;
  vec2 e = vec2(along / (1.0 + uSpeed * 1.35), across * (1.0 + uSpeed * 0.30));
  float r = length(e);

  vec3 col = vec3(0.0);

  // --- core --------------------------------------------------------------
  float coreR = uCoreRadius * 0.44 + uEnergy * 1.6;
  col += uColor * (1.0 - smoothstep(coreR, coreR + 1.5, rawLen)) * 3.2;
  col += uAccent * exp(-rawLen / (uCoreRadius * 1.57 + uEnergy * 9.0)) * (0.5 + uEnergy * 0.9);

  // --- ring --------------------------------------------------------------
  float ringR = uRingRadius * 0.94 + uDrawing * 5.0 + uEnergy * 3.0;
  float ringW = 1.15 + uDrawing * 0.5;
  float ring = exp(-pow((r - ringR) / ringW, 2.0));

  // While drawing, the ring breaks into arcs. Unbroken = idle, broken = live.
  // Readable at any size and it does not rely on colour at all.
  float arcs = 1.0;
  if (uDrawing > 0.01) {
    float seg = fract((atan(across, along) / TAU) * 3.0 + uTime * 0.42);
    float gap = smoothstep(0.03, 0.10, seg) * smoothstep(0.03, 0.10, 1.0 - seg);
    arcs = mix(1.0, gap, uDrawing);
  }
  col += uAccent * ring * arcs * (0.85 + uDrawing * 1.5 + uEnergy * 0.8);

  // --- lead tick ---------------------------------------------------------
  // Appears only above a speed threshold, so a slow careful stroke stays clean.
  float lead = smoothstep(0.18, 0.7, uSpeed);
  if (lead > 0.001) {
    float lx = along - (ringR + 7.0);
    col += uColor * exp(-pow(lx / 7.0, 2.0)) * exp(-pow(across / 1.1, 2.0)) * lead * 2.4;
  }

  // --- true-pointer crosshair --------------------------------------------
  // The lagged core is the character; this hairline is the truth. Feel never
  // costs precision.
  vec2 rd = d - uRawOffset;
  float cross = exp(-pow(rd.x / 0.7, 2.0)) * step(abs(rd.y), 4.5)
              + exp(-pow(rd.y / 0.7, 2.0)) * step(abs(rd.x), 4.5);
  col += uColor * cross * 0.6;

  // --- denied pulse ------------------------------------------------------
  // Pressing SPACE with nothing to detonate must never feel like a dead input.
  if (uDenied > 0.001) {
    float pulse = exp(-pow((rawLen - (12.0 + (1.0 - uDenied) * 34.0)) / 4.5, 2.0));
    col += vec3(0.9, 0.35, 0.4) * pulse * uDenied * 1.6;
  }

  if (dot(col, vec3(0.333)) < 0.002) discard;
  fragColor = vec4(col, 1.0);
}
`,Jt=64,Yt=class{mesh;material;geometry;constructor(){this.geometry=new k,this.geometry.setAttribute(`position`,new M(new Float32Array([-1,-1,0,1,-1,0,1,1,0,-1,1,0]),3)),this.geometry.setIndex([0,1,2,0,2,3]),this.geometry.boundingSphere=new p(new l,1e7),this.material=new t({vertexShader:Kt,fragmentShader:qt,glslVersion:T,uniforms:{uPos:{value:new o},uExtent:{value:Jt},uRawOffset:{value:new o},uVel:{value:new o},uSpeed:{value:0},uDrawing:{value:0},uEnergy:{value:0},uTime:{value:0},uDenied:{value:0},uColor:{value:new l(...R.player)},uAccent:{value:new l(...R.stable)},uCoreRadius:{value:O.player.coreRadius},uRingRadius:{value:O.player.ringRadius}},...F}),this.mesh=new a(this.geometry,this.material),this.mesh.frustumCulled=!1,this.mesh.renderOrder=D.player}update(e,t,n,r,i,a,o,s,c,l,u){let d=this.material.uniforms;d.uPos.value.set(e,t),d.uRawOffset.value.set(n-e,r-t),d.uVel.value.set(i*o,a*o),d.uSpeed.value=o,d.uDrawing.value=s,d.uEnergy.value=c,d.uDenied.value=l,d.uTime.value=u}setVisible(e){this.mesh.visible=e}dispose(){this.geometry.dispose(),this.material.dispose()}},Xt=class{traces;clock;bus;enemies=[];rng=new x(2654435761);liveCount=0;kills=0;w=1;h=1;playerX=0;playerY=0;playerVX=0;playerVY=0;constructor(e,t,n){this.traces=e,this.clock=t,this.bus=n;for(let e=0;e<O.enemy.max;e++)this.enemies.push({active:!1,x:0,y:0,vx:0,vy:0,angle:0,state:0,stateT:0,aimX:0,aimY:0,flash:0,seed:0,charges:0})}resize(e,t){this.w=e,this.h=t}spawn(){let e=-1;for(let t=0;t<this.enemies.length;t++)if(!this.enemies[t].active){e=t;break}if(e<0)return null;let t=this.enemies[e],n=this.rng.int(4);return n===0?(t.x=this.rng.range(0,this.w),t.y=-60):n===1?(t.x=this.rng.range(0,this.w),t.y=this.h+60):n===2?(t.x=-60,t.y=this.rng.range(0,this.h)):(t.x=this.w+60,t.y=this.rng.range(0,this.h)),t.active=!0,t.state=0,t.stateT=0,t.vx=0,t.vy=0,t.angle=Math.atan2(this.playerY-t.y,this.playerX-t.x),t.flash=1,t.seed=this.rng.next(),t.charges=0,this.bus.emit(`enemySpawn`,{x:t.x,y:t.y}),t}predict(e,t){let n=O.enemy.needle,r=n.predictTime*(1+Math.min(e.charges,3)*.18),i=this.playerVX*r,a=this.playerVY*r,o=Math.hypot(i,a);o>n.maxLead&&(i=i/o*n.maxLead,a=a/o*n.maxLead);let s=this.playerX+i,c=this.playerY+a;s=b(s,20,this.w-20),c=b(c,20,this.h-20),t[0]=s,t[1]=c}_aim=new Float32Array(2);update(e){let t=O.enemy.needle;this.liveCount=0;for(let n=0;n<this.enemies.length;n++){let r=this.enemies[n];if(r.active){switch(r.stateT+=e,r.flash+=(0-r.flash)*Math.min(1,e*8),r.state){case 0:{let n=Math.atan2(this.h*.5-r.y,this.w*.5-r.x);r.x+=Math.cos(n)*t.driftSpeed*H()*e,r.y+=Math.sin(n)*t.driftSpeed*H()*e,r.angle=n,r.stateT>=t.spawnTime&&this.enter(r,1);break}case 1:{this.predict(r,this._aim),r.aimX=this._aim[0],r.aimY=this._aim[1];let n=Math.atan2(r.aimY-r.y,r.aimX-r.x)-r.angle;for(;n>Math.PI;)n-=Math.PI*2;for(;n<-Math.PI;)n+=Math.PI*2;r.angle+=n*Math.min(1,e*9),r.x+=Math.cos(r.angle)*t.driftSpeed*.28*H()*e,r.y+=Math.sin(r.angle)*t.driftSpeed*.28*H()*e,r.stateT>=V.aimTime&&(this.enter(r,2),r.vx=Math.cos(r.angle)*t.chargeSpeed*H(),r.vy=Math.sin(r.angle)*t.chargeSpeed*H(),r.flash=1,r.charges++,this.bus.emit(`enemyCharge`,{x:r.x,y:r.y,dirX:Math.cos(r.angle),dirY:Math.sin(r.angle)}));break}case 2:r.x+=r.vx*e,r.y+=r.vy*e,r.stateT>=t.chargeTime&&this.enter(r,3);break;case 3:{let n=Math.exp(-3.4*e);r.vx*=n,r.vy*=n,r.x+=r.vx*e,r.y+=r.vy*e,r.stateT>=t.recoverTime&&this.enter(r,1);break}case 4:if(r.x+=r.vx*e,r.y+=r.vy*e,r.vx*=Math.exp(-6*e),r.vy*=Math.exp(-6*e),r.stateT>=t.deathTime){r.active=!1;continue}}if(r.state!==4&&(r.x<-260||r.x>this.w+260||r.y<-260||r.y>this.h+260)){let e=Math.atan2(this.h*.5-r.y,this.w*.5-r.x);r.x=b(r.x,-130,this.w+130),r.y=b(r.y,-130,this.h+130),r.angle=e,this.enter(r,1)}this.liveCount++}}}enter(e,t){e.state=t,e.stateT=0}body(e,t){let n=O.enemy.needle.length,r=Math.cos(e.angle),i=Math.sin(e.angle);t[0]=e.x-r*n,t[1]=e.y-i*n,t[2]=e.x+r*n,t[3]=e.y+i*n}_body=new Float32Array(4);resolveTraceHits(){let e=this.clock.gameTime,t=B.killState;for(let n=0;n<this.enemies.length;n++){let r=this.enemies[n];if(!r.active||r.state===4||r.state===0)continue;this.body(r,this._body);let i=this._body[0],a=this._body[1],o=this._body[2],s=this._body[3],c=!1,l=0,u=0;this.traces.hash.query(i,a,o,s,(n,r)=>{if(c)return;let d=this.traces.traceBySlot(n);if(!d||r+1>=d.count)return;let f=e-d.pBirth[r];if(U.stateForAge(f)>t)return;let p=d.px[r],m=d.py[r],h=d.px[r+1],g=d.py[r+1],_=P(i,a,o,s,p,m,h,g);_<0||(c=!0,l=i+(o-i)*_,u=a+(s-a)*_,d.flash=Math.min(1,d.flash+.7))}),c&&this.kill(r,l,u)}}kill(e,t,n){e.state!==4&&(this.enter(e,4),e.flash=1,e.vx*=.35,e.vy*=.35,this.kills++,this.bus.emit(`enemyKill`,{x:t,y:n,dirX:Math.cos(e.angle),dirY:Math.sin(e.angle),charging:e.state===2}))}contactWithPlayer(e,t){let n=O.enemy.needle.contactRadius+O.player.hitRadius,r=n*n;for(let n=0;n<this.enemies.length;n++){let i=this.enemies[n];if(!i.active||i.state===4||i.state===0||i.state===1)continue;this.body(i,this._body);let a=this._body[0],o=this._body[1],s=this._body[2],c=this._body[3],l=s-a,u=c-o,d=l*l+u*u,f=0;d>1e-6&&(f=S(((e-a)*l+(t-o)*u)/d));let p=a+l*f,m=o+u*f,h=e-p,g=t-m;if(h*h+g*g<r)return i}return null}get threatCount(){let e=0;for(let t=0;t<this.enemies.length;t++){let n=this.enemies[t];n.active&&n.state!==4&&e++}return e}clear(){for(let e=0;e<this.enemies.length;e++)this.enemies[e].active=!1;this.liveCount=0,this.kills=0}purge(e){let t=0;for(let n=0;n<this.enemies.length;n++){let r=this.enemies[n];!r.active||r.state===4||(e(r),this.enter(r,4),t++)}return t}_hostilePoint=new Float32Array(2);nearestHostilePoint(e,t,n){let r=this.clock.gameTime,i=O.enemy.traceHostileState,a=n,o=null,s=0,c=0,l=this.traces.traces;for(let n=0;n<l.length;n++){let u=l[n];if(u.active&&!(U.stateForAge(r-u.pBirth[0])<i))for(let n=0;n<u.count&&!(U.stateForAge(r-u.pBirth[n])<i);n+=2){let r=d(e,t,u.px[n],u.py[n]);r<a&&(a=r,o=u,s=u.px[n],c=u.py[n])}}return o?(o.flash=Math.min(1,o.flash+.85),this._hostilePoint[0]=s,this._hostilePoint[1]=c,!0):!1}get hostilePointX(){return this._hostilePoint[0]}get hostilePointY(){return this._hostilePoint[1]}},Zt=`
precision highp float;

in vec3 position;    // unit quad, -1..1
in vec2 aPos;        // centre, px
in vec4 aParams;     // angle, state(0..4), stateT01, flash
in vec2 aMeta;       // seed, charges

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float uLength;
uniform float uHalfWidth;
uniform float uTime;

out vec2  vLocal;     // px, in the needle's own frame (x = along heading)
out float vState;
out float vPhase;
out float vFlash;
out float vSeed;
out float vStretch;

void main() {
  vState = aParams.y;
  vPhase = aParams.z;
  vFlash = aParams.w;
  vSeed  = aMeta.x;

  float charging = step(1.5, vState) * step(vState, 2.5);
  float recovering = step(2.5, vState) * step(vState, 3.5);
  float dying = step(3.5, vState);

  // Committing to a charge visibly lengthens the body. The silhouette alone
  // tells you it has launched, with no colour needed.
  vStretch = 1.0 + charging * 0.85 - recovering * 0.18;

  // Aim vibration: amplitude ramps with the aim timer so the telegraph has a
  // rising intensity rather than a constant buzz.
  float aiming = step(0.5, vState) * step(vState, 1.5);
  float shake = aiming * vPhase * vPhase * 2.4;
  vec2 jitter = vec2(
    sin(uTime * 47.0 + vSeed * 30.0),
    cos(uTime * 41.0 + vSeed * 17.0)
  ) * shake;

  // Padding must exceed uHaloLimit in both axes, or the halo's window would be
  // clipped by the quad before it finished falling off.
  float halfLen = uLength * vStretch + 46.0;
  float halfWid = uHalfWidth + 44.0;

  vec2 local = vec2(position.x * halfLen, position.y * halfWid);
  vLocal = local;

  float c = cos(aParams.x);
  float s = sin(aParams.x);
  vec2 world = aPos + jitter + vec2(local.x * c - local.y * s, local.x * s + local.y * c);

  // A dying needle collapses toward its own axis.
  world = mix(world, aPos + jitter, dying * vPhase * 0.55);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 0.0, 1.0);
}
`,Qt=`
precision highp float;

in vec2  vLocal;
in float vState;
in float vPhase;
in float vFlash;
in float vSeed;
in float vStretch;

uniform float uLength;
uniform float uHalfWidth;
uniform float uTime;
uniform vec3  uCold;
uniform vec3  uHot;
uniform float uFlashScale;
uniform float uHaloLimit;   // distance at which the halo must be fully gone

out vec4 fragColor;

${E}

/**
 * Signed distance to an isoceles spike pointing along +x.
 * Built from two half-plane cuts and a back cap, so the tip stays genuinely
 * sharp at any size instead of rounding off the way a capsule would.
 */
float spikeSDF(vec2 p, float len, float wid) {
  p.y = abs(p.y);

  vec2 tip      = vec2( len, 0.0);
  vec2 shoulder = vec2(-len, wid);
  vec2 backMid  = vec2(-len, 0.0);

  // EXACT distance: nearest point on either bounding SEGMENT, signed by the
  // half-plane test.
  //
  // Two earlier attempts were wrong in instructive ways. Distance-to-segment
  // alone left the back cap with no zero crossing, so the rim never closed and
  // the needle read as an open chevron. Max-of-half-planes closed it, but a
  // half-plane distance keeps shrinking as you move along the shape's axis, so
  // well past the tip the field still reported "nearly inside" — and the halo
  // stayed bright right out to the quad's front edge, drawing the quad itself
  // as a glowing rectangle. Only the true distance is correct in both places.
  vec2 ab = shoulder - tip;
  vec2 pa = p - tip;
  float d1 = length(pa - ab * clamp(dot(pa, ab) / dot(ab, ab), 0.0, 1.0));

  vec2 bc = backMid - shoulder;
  vec2 pb = p - shoulder;
  float d2 = length(pb - bc * clamp(dot(pb, bc) / dot(bc, bc), 0.0, 1.0));

  float d = min(d1, d2);

  vec2 n = normalize(vec2(wid, 2.0 * len));
  bool inside = dot(pa, n) < 0.0 && p.x > -len;
  return inside ? -d : d;
}

void main() {
  float charging   = step(1.5, vState) * step(vState, 2.5);
  float recovering = step(2.5, vState) * step(vState, 3.5);
  float dying      = step(3.5, vState);
  float spawning   = step(vState, 0.5);
  float aiming     = step(0.5, vState) * step(vState, 1.5);

  float len = uLength * vStretch;
  float d = spikeSDF(vLocal, len, uHalfWidth);

  // --- rim: a hard, thin outline ----------------------------------------
  // Tight falloff on purpose. A soft rim turns the needle into another glowing
  // blob in a screen already full of them; a crisp 2px outline is what makes it
  // read as a manufactured object among all the energy.
  float rimW = 2.1 + charging * 0.8;
  float rim = (1.0 - smoothstep(rimW, rimW + 1.4, abs(d)))
            * (3.6 + aiming * vPhase * 2.6 + charging * 3.4);

  // --- interior: dim fill, so it occludes rather than glows ---------------
  // Present enough to be a solid silhouette, dark enough that the outline is
  // still the brightest part of the shape.
  float inside = 1.0 - smoothstep(-1.0, 0.6, d);
  float interior = inside * (0.55 + charging * 0.5);

  // --- outer field: a tight pressure halo, larger while charging ----------
  // An exponential never actually reaches zero, and a charging needle's halo
  // was still bright enough at the quad boundary to draw the quad itself as a
  // glowing rectangle. The window term forces it to zero *before* the edge, so
  // the geometry can never become visible.
  float haloR = 5.0 + charging * 8.0;
  float window = 1.0 - smoothstep(uHaloLimit * 0.55, uHaloLimit, max(0.0, d));
  float halo = exp(-max(0.0, d) / haloR) * (0.42 + charging * 0.8) * window;

  // Ignition. Grey at rest, warning hue only once it has committed — and
  // ramping through the last third of the aim so the change is a warning
  // rather than a surprise.
  float heat = charging + aiming * smoothstep(0.62, 1.0, vPhase) * 0.85;
  vec3 col = mix(uCold, uHot, clamp(heat, 0.0, 1.0));

  float body = rim + interior + halo;

  vec3 outCol = col * body;
  // The tip carries a hot point while charging: it is the part that hurts.
  float tip = exp(-length(vLocal - vec2(len, 0.0)) * 0.16) * (charging + aiming * vPhase * 0.5);
  outCol += mix(col, vec3(1.0), 0.65) * tip * 3.0;
  outCol += vec3(1.0) * vFlash * rim * 1.6 * uFlashScale;

  // Spawn: fade up from nothing. Death: flare white and blow apart.
  // NOTE: mix(), not a ternary. 'spawning' comes from step() and is a FLOAT;
  // GLSL requires a genuine bool as a ternary condition, and the resulting
  // compile error is fatal but SILENT — the draw call simply produces nothing.
  outCol *= mix(1.0, vPhase, spawning);
  if (dying > 0.5) {
    float k = vPhase;
    outCol = mix(mix(outCol, vec3(1.0), 0.75) * 3.0, vec3(0.0), k);
    outCol *= 1.0 - k * k;
  }
  outCol *= 1.0 - recovering * 0.35;

  if (dot(outCol, vec3(0.333)) < 0.0012) discard;
  fragColor = vec4(outCol, 1.0);
}
`,$t=`
precision highp float;

in vec2  vLocal;
in float vState;
in float vPhase;
in float vFlash;
in float vSeed;
in float vStretch;

uniform float uLength;
uniform float uHalfWidth;

out vec4 fragColor;

void main() {
  float charging = step(1.5, vState) * step(vState, 2.5);
  float r = length(vLocal);
  // Deliberately weak and tight. An earlier version pushed hard enough that the
  // bent background lattice was brighter than the needle itself — the enemy
  // disappeared behind its own distortion field. A needle is matter, not a
  // field generator; it should dent space, and only while committed.
  float falloff = exp(-r / (9.0 + charging * 13.0));
  vec2 dir = r > 1e-4 ? vLocal / r : vec2(0.0);
  float strength = falloff * (0.10 + charging * 0.42 + vFlash * 0.3);
  fragColor = vec4(dir * strength, falloff * 0.16, 0.0);
}
`;function en(e,t){let n=O.enemy.needle;switch(e){case 0:return Math.min(1,t/n.spawnTime);case 1:return Math.min(1,t/n.aimTime);case 2:return Math.min(1,t/n.chargeTime);case 3:return Math.min(1,t/n.recoverTime);case 4:return Math.min(1,t/n.deathTime);default:return 0}}var tn=class{enemies;mesh;influenceMesh;geometry;material;influenceMaterial;posArr;paramArr;metaArr;aPos;aParams;aMeta;visible=0;constructor(e){this.enemies=e;let n=O.enemy.max;this.geometry=new r,this.geometry.setAttribute(`position`,new M(new Float32Array([-1,-1,0,1,-1,0,1,1,0,-1,1,0]),3)),this.geometry.setIndex([0,1,2,0,2,3]),this.geometry.boundingSphere=new p(new l,1e7),this.posArr=new Float32Array(n*2),this.paramArr=new Float32Array(n*4),this.metaArr=new Float32Array(n*2),this.aPos=new v(this.posArr,2),this.aParams=new v(this.paramArr,4),this.aMeta=new v(this.metaArr,2);for(let e of[this.aPos,this.aParams,this.aMeta])e.setUsage(I);this.geometry.setAttribute(`aPos`,this.aPos),this.geometry.setAttribute(`aParams`,this.aParams),this.geometry.setAttribute(`aMeta`,this.aMeta),this.geometry.instanceCount=0;let i=()=>({uLength:{value:O.enemy.needle.length},uHalfWidth:{value:O.enemy.needle.halfWidth},uTime:{value:0},uCold:{value:new l(...R.enemy)},uHot:{value:new l(...R.enemyHot)},uFlashScale:{value:1},uHaloLimit:{value:40}});this.material=new t({vertexShader:Zt,fragmentShader:Qt,glslVersion:T,uniforms:i(),...F}),this.influenceMaterial=new t({vertexShader:Zt,fragmentShader:$t,glslVersion:T,uniforms:i(),...F}),this.mesh=new a(this.geometry,this.material),this.mesh.frustumCulled=!1,this.mesh.renderOrder=D.enemy,this.influenceMesh=new a(this.geometry,this.influenceMaterial),this.influenceMesh.frustumCulled=!1,this.influenceMesh.renderOrder=D.enemy}update(e){let t=this.enemies.enemies,n=0;for(let e=0;e<t.length;e++){let r=t[e];r.active&&(this.posArr[n*2]=r.x,this.posArr[n*2+1]=r.y,this.paramArr[n*4]=r.angle,this.paramArr[n*4+1]=r.state,this.paramArr[n*4+2]=en(r.state,r.stateT),this.paramArr[n*4+3]=r.flash,this.metaArr[n*2]=r.seed,this.metaArr[n*2+1]=r.charges,n++)}this.visible=n,this.geometry.instanceCount=n,n>0&&(this.aPos.needsUpdate=!0,this.aParams.needsUpdate=!0,this.aMeta.needsUpdate=!0),this.material.uniforms.uTime.value=e,this.influenceMaterial.uniforms.uTime.value=e,this.material.uniforms.uFlashScale.value=O.a11y.flashIntensity}dispose(){this.geometry.dispose(),this.material.dispose(),this.influenceMaterial.dispose()}},nn=class{traces;nodes;clock;bus;cutters=[];rng=new x(625341585);liveCount=0;kills=0;w=1;h=1;constructor(e,t,n,r){this.traces=e,this.nodes=t,this.clock=n,this.bus=r;for(let e=0;e<O.enemy.max;e++)this.cutters.push({active:!1,x:0,y:0,angle:0,state:0,stateT:0,retarget:0,targetX:0,targetY:0,hasTarget:!1,flash:0,seed:0,fed:0})}resize(e,t){this.w=e,this.h=t}spawn(){let e=-1;for(let t=0;t<this.cutters.length;t++)if(!this.cutters[t].active){e=t;break}if(e<0)return null;let t=this.cutters[e],n=this.rng.int(4);return n===0?(t.x=this.rng.range(0,this.w),t.y=-60):n===1?(t.x=this.rng.range(0,this.w),t.y=this.h+60):n===2?(t.x=-60,t.y=this.rng.range(0,this.h)):(t.x=this.w+60,t.y=this.rng.range(0,this.h)),t.active=!0,t.state=0,t.stateT=0,t.retarget=0,t.hasTarget=!1,t.flash=1,t.seed=this.rng.next(),t.fed=0,this.bus.emit(`cutterSpawn`,{x:t.x,y:t.y}),t}enter(e,t){e.state=t,e.stateT=0}update(e){let t=O.enemy.cutter;this.liveCount=0;for(let n=0;n<this.cutters.length;n++){let r=this.cutters[n];if(r.active){if(r.stateT+=e,r.flash+=(0-r.flash)*Math.min(1,e*8),r.state===0){let n=Math.atan2(this.h*.5-r.y,this.w*.5-r.x);r.x+=Math.cos(n)*t.loiterSpeed*H()*e,r.y+=Math.sin(n)*t.loiterSpeed*H()*e,r.angle=n,r.stateT>=t.spawnTime&&this.enter(r,1)}else if(r.state===1){if(r.retarget-=e,r.retarget<=0){r.retarget=t.retargetInterval;let e=this.nodes.nearest(r.x,r.y,t.huntRadius);e?(r.targetX=e.x,r.targetY=e.y,r.hasTarget=!0):r.hasTarget=!1}let n,i;r.hasTarget?(n=r.targetX,i=r.targetY):(n=this.w*.5+Math.cos(this.clock.gameTime*.4+r.seed*10)*140,i=this.h*.5+Math.sin(this.clock.gameTime*.31+r.seed*10)*140);let a=n-r.x,o=i-r.y,s=Math.hypot(a,o),c=Math.atan2(o,a)-r.angle;for(;c>Math.PI;)c-=Math.PI*2;for(;c<-Math.PI;)c+=Math.PI*2;r.angle+=c*Math.min(1,e*6);let l=(r.hasTarget?t.speed:t.loiterSpeed)*H();if(s>4&&(r.x+=Math.cos(r.angle)*l*e,r.y+=Math.sin(r.angle)*l*e),r.hasTarget&&s<t.biteRadius){let e=this.nodes.nearest(r.x,r.y,t.biteRadius*1.5);e&&(this.nodes.destroy(e),r.fed++,r.flash=1,this.bus.emit(`cutterFeed`,{x:r.x,y:r.y})),r.hasTarget=!1,this.enter(r,2)}}else if(r.state===2)r.stateT>=t.feedTime&&this.enter(r,1);else if(r.state===3&&r.stateT>=t.deathTime){r.active=!1;continue}r.state!==3&&(r.x<-260||r.x>this.w+260||r.y<-260||r.y>this.h+260)&&(r.x=Math.max(-130,Math.min(this.w+130,r.x)),r.y=Math.max(-130,Math.min(this.h+130,r.y))),this.liveCount++}}}resolveTraceHits(){let e=this.clock.gameTime,t=B.killState,n=O.enemy.cutter.radius,r=n*n;for(let i=0;i<this.cutters.length;i++){let a=this.cutters[i];if(!a.active||a.state===3||a.state===0)continue;let o=!1;this.traces.hash.query(a.x-n,a.y-n,a.x+n,a.y+n,(n,i)=>{if(o)return;let s=this.traces.traceBySlot(n);if(!s||i+1>=s.count)return;let c=e-s.pBirth[i];if(U.stateForAge(c)>t)return;let l=s.px[i],d=s.py[i],f=s.px[i+1],p=s.py[i+1];u(a.x,a.y,l,d,f,p)<r&&(o=!0,s.flash=Math.min(1,s.flash+.7))}),o&&this.kill(a)}}kill(e){e.state!==3&&(this.enter(e,3),e.flash=1,this.kills++,this.bus.emit(`cutterKill`,{x:e.x,y:e.y,fed:e.fed}))}clear(){for(let e=0;e<this.cutters.length;e++)this.cutters[e].active=!1;this.liveCount=0,this.kills=0}purge(e){let t=0;for(let n=0;n<this.cutters.length;n++){let r=this.cutters[n];!r.active||r.state===3||(e(r),this.enter(r,3),t++)}return t}get threatCount(){let e=0;for(let t=0;t<this.cutters.length;t++){let n=this.cutters[t];n.active&&n.state!==3&&e++}return e}},rn=`
precision highp float;

in vec3 position;   // unit quad, -1..1
in vec2 aPos;        // centre, px
in vec4 aParams;     // state(0..3), stateT01, flash, fed
in vec2 aMeta;       // seed, hasTarget(0/1)

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float uRadius;
uniform float uTime;

out vec2  vLocal;
out float vState;
out float vPhase;
out float vFlash;
out float vSeed;
out float vFed;
out float vHunting;

void main() {
  vState = aParams.x;
  vPhase = aParams.y;
  vFlash = aParams.z;
  vFed   = aParams.w;
  vSeed  = aMeta.x;
  vHunting = aMeta.y;

  float dying = step(2.5, vState);

  // Spin accelerates with feed count and while actively pursuing a target.
  float spin = uTime * (2.2 + vFed * 1.1 + vHunting * 1.4) + vSeed * 20.0;

  float halfExt = uRadius + 30.0;
  vec2 local = position.xy * halfExt;
  vLocal = local;

  float c = cos(spin);
  float s = sin(spin);
  vec2 rotated = vec2(local.x * c - local.y * s, local.x * s + local.y * c);
  vec2 world = aPos + rotated;

  world = mix(world, aPos, dying * vPhase * 0.6);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 0.0, 1.0);
}
`,an=`
precision highp float;

in vec2  vLocal;
in float vState;
in float vPhase;
in float vFlash;
in float vSeed;
in float vFed;
in float vHunting;

uniform float uRadius;
uniform vec3  uCold;
uniform vec3  uHot;
uniform float uFlashScale;
uniform float uHaloLimit;

out vec4 fragColor;

${E}

/** Exact SDF of a regular triangle, radius r, point pointing along +y. */
float triSDF(vec2 p, float r) {
  const float k = 1.7320508; // sqrt(3)
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) * 0.5;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}

void main() {
  float spawning = step(vState, 0.5);
  float feeding  = step(0.5, vState) * step(vState, 1.5);
  float dying    = step(2.5, vState);

  float d = triSDF(vLocal, uRadius);

  float rimW = 1.9 + vHunting * 0.5;
  float rim = (1.0 - smoothstep(rimW, rimW + 1.3, abs(d)))
            * (3.2 + feeding * 2.4 + vFed * 0.5);

  float inside = 1.0 - smoothstep(-1.0, 0.6, d);
  float interior = inside * (0.5 + feeding * 0.6);

  float haloR = 5.0 + feeding * 9.0;
  float window = 1.0 - smoothstep(uHaloLimit * 0.55, uHaloLimit, max(0.0, d));
  float halo = exp(-max(0.0, d) / haloR) * (0.4 + feeding * 0.9) * window;

  // Ignites only at the moment of feeding — the rest of the time it is inert
  // matter, same rule as the needle's telegraph.
  float heat = feeding + vFlash * 0.6;
  vec3 col = mix(uCold, uHot, clamp(heat, 0.0, 1.0));

  vec3 outCol = col * (rim + interior + halo);
  outCol += vec3(1.0) * vFlash * rim * 1.6 * uFlashScale;
  outCol *= mix(1.0, vPhase, spawning);

  if (dying > 0.5) {
    float k = vPhase;
    outCol = mix(mix(outCol, vec3(1.0), 0.75) * 3.0, vec3(0.0), k);
    outCol *= 1.0 - k * k;
  }

  if (dot(outCol, vec3(0.333)) < 0.0012) discard;
  fragColor = vec4(outCol, 1.0);
}
`,on=`
precision highp float;

in vec2  vLocal;
in float vState;
in float vPhase;
in float vFlash;
in float vSeed;
in float vFed;
in float vHunting;

uniform float uRadius;

out vec4 fragColor;

void main() {
  float feeding = step(0.5, vState) * step(vState, 1.5);
  float r = length(vLocal);
  float falloff = exp(-r / (8.0 + feeding * 12.0));
  vec2 dir = r > 1e-4 ? vLocal / r : vec2(0.0);
  float strength = falloff * (0.08 + feeding * 0.5 + vFlash * 0.3);
  fragColor = vec4(dir * strength, falloff * 0.12, 0.0);
}
`;function sn(e,t){let n=O.enemy.cutter;switch(e){case 0:return Math.min(1,t/n.spawnTime);case 1:return 0;case 2:return Math.min(1,t/n.feedTime);case 3:return Math.min(1,t/n.deathTime);default:return 0}}var cn=class{cutters;mesh;influenceMesh;geometry;material;influenceMaterial;posArr;paramArr;metaArr;aPos;aParams;aMeta;visible=0;constructor(e){this.cutters=e;let n=O.enemy.max;this.geometry=new r,this.geometry.setAttribute(`position`,new M(new Float32Array([-1,-1,0,1,-1,0,1,1,0,-1,1,0]),3)),this.geometry.setIndex([0,1,2,0,2,3]),this.geometry.boundingSphere=new p(new l,1e7),this.posArr=new Float32Array(n*2),this.paramArr=new Float32Array(n*4),this.metaArr=new Float32Array(n*2),this.aPos=new v(this.posArr,2),this.aParams=new v(this.paramArr,4),this.aMeta=new v(this.metaArr,2);for(let e of[this.aPos,this.aParams,this.aMeta])e.setUsage(I);this.geometry.setAttribute(`aPos`,this.aPos),this.geometry.setAttribute(`aParams`,this.aParams),this.geometry.setAttribute(`aMeta`,this.aMeta),this.geometry.instanceCount=0;let i=()=>({uRadius:{value:O.enemy.cutter.radius},uTime:{value:0},uCold:{value:new l(...R.enemy)},uHot:{value:new l(...R.enemyHot)},uFlashScale:{value:1},uHaloLimit:{value:30}});this.material=new t({vertexShader:rn,fragmentShader:an,glslVersion:T,uniforms:i(),...F}),this.influenceMaterial=new t({vertexShader:rn,fragmentShader:on,glslVersion:T,uniforms:i(),...F}),this.mesh=new a(this.geometry,this.material),this.mesh.frustumCulled=!1,this.mesh.renderOrder=D.enemy,this.influenceMesh=new a(this.geometry,this.influenceMaterial),this.influenceMesh.frustumCulled=!1,this.influenceMesh.renderOrder=D.enemy}update(e){let t=this.cutters.cutters,n=0;for(let e=0;e<t.length;e++){let r=t[e];r.active&&(this.posArr[n*2]=r.x,this.posArr[n*2+1]=r.y,this.paramArr[n*4]=r.state,this.paramArr[n*4+1]=sn(r.state,r.stateT),this.paramArr[n*4+2]=r.flash,this.paramArr[n*4+3]=r.fed,this.metaArr[n*2]=r.seed,this.metaArr[n*2+1]=r.state===1&&r.hasTarget?1:0,n++)}this.visible=n,this.geometry.instanceCount=n,n>0&&(this.aPos.needsUpdate=!0,this.aParams.needsUpdate=!0,this.aMeta.needsUpdate=!0),this.material.uniforms.uTime.value=e,this.influenceMaterial.uniforms.uTime.value=e,this.material.uniforms.uFlashScale.value=O.a11y.flashIntensity}dispose(){this.geometry.dispose(),this.material.dispose(),this.influenceMaterial.dispose()}},ln=class{traces;clock;bus;leeches=[];rng=new x(668265263);liveCount=0;kills=0;w=1;h=1;constructor(e,t,n){this.traces=e,this.clock=t,this.bus=n;for(let e=0;e<O.enemy.max;e++)this.leeches.push({active:!1,x:0,y:0,angle:0,state:0,stateT:0,flash:0,seed:0,retarget:0,loitering:!1,hostSlot:-1,targetSlot:-1,anchor:0,crawlDir:1,drained:0})}resize(e,t){this.w=e,this.h=t}spawn(){let e=-1;for(let t=0;t<this.leeches.length;t++)if(!this.leeches[t].active){e=t;break}if(e<0)return null;let t=this.leeches[e],n=this.rng.int(4);return n===0?(t.x=this.rng.range(0,this.w),t.y=-60):n===1?(t.x=this.rng.range(0,this.w),t.y=this.h+60):n===2?(t.x=-60,t.y=this.rng.range(0,this.h)):(t.x=this.w+60,t.y=this.rng.range(0,this.h)),t.active=!0,t.state=0,t.stateT=0,t.flash=1,t.seed=this.rng.next(),t.retarget=0,t.loitering=!1,t.hostSlot=-1,t.targetSlot=-1,t.crawlDir=this.rng.next()<.5?-1:1,t.drained=0,this.bus.emit(`leechSpawn`,{x:t.x,y:t.y}),t}enter(e,t){e.state=t,e.stateT=0}findTarget(e,t){let n=O.enemy.leech,r=this.clock.gameTime,i=n.detachStateCeiling,a=n.huntRadius*n.huntRadius,o=-1,s=0,c=this.traces.traces;for(let n=0;n<c.length;n++){let l=c[n];if(l.active)for(let n=0;n<l.count;n+=3){if(U.stateForAge(r-l.pBirth[n])>=i)continue;let c=l.px[n]-e,u=l.py[n]-t,d=c*c+u*u;d<a&&(a=d,o=l.slot,s=n)}}return o>=0?{slot:o,index:s}:null}update(e){let t=O.enemy.leech;this.liveCount=0;for(let n=0;n<this.leeches.length;n++){let r=this.leeches[n];if(r.active){if(r.stateT+=e,r.flash+=(0-r.flash)*Math.min(1,e*8),r.state===0){let n=Math.atan2(this.h*.5-r.y,this.w*.5-r.x);r.x+=Math.cos(n)*t.loiterSpeed*H()*e,r.y+=Math.sin(n)*t.loiterSpeed*H()*e,r.angle=n,r.stateT>=t.spawnTime&&this.enter(r,1)}else if(r.state===1){if(r.retarget-=e,r.retarget<=0){r.retarget=t.retargetInterval;let e=this.findTarget(r.x,r.y);if(e){let n=this.traces.traceBySlot(e.slot);if(n){let i=n.px[e.index],a=n.py[e.index];if(Math.hypot(i-r.x,a-r.y)<t.attachRadius){r.targetSlot=e.slot,r.hostSlot=e.slot,r.anchor=e.index,this.enter(r,2),r.flash=1,this.bus.emit(`leechAttach`,{x:i,y:a});continue}r.angle=Math.atan2(a-r.y,i-r.x),r.loitering=!1}}else{let e=this.w*.5+Math.cos(this.clock.gameTime*.35+r.seed*10)*160,t=this.h*.5+Math.sin(this.clock.gameTime*.27+r.seed*10)*160;r.angle=Math.atan2(t-r.y,e-r.x),r.loitering=!0}}let n=(r.loitering?t.loiterSpeed:t.speed)*H();r.x+=Math.cos(r.angle)*n*e,r.y+=Math.sin(r.angle)*n*e}else if(r.state===2)this.updateAttached(r,e);else if(r.state===3&&r.stateT>=t.deathTime){r.active=!1;continue}r.state!==3&&(r.x<-260||r.x>this.w+260||r.y<-260||r.y>this.h+260)&&(r.x=Math.max(-130,Math.min(this.w+130,r.x)),r.y=Math.max(-130,Math.min(this.h+130,r.y))),this.liveCount++}}}updateAttached(e,t){let n=O.enemy.leech,r=this.traces.traceBySlot(e.targetSlot);if(!r||r.count<2){e.hostSlot=-1,e.targetSlot=-1,this.enter(e,1);return}e.anchor+=e.crawlDir*n.crawlSpeed*t,e.anchor>=r.count-1?(e.anchor=r.count-1,e.crawlDir=-1):e.anchor<=0&&(e.anchor=0,e.crawlDir=1);let i=b(Math.round(e.anchor),0,r.count-1);e.x=r.px[i],e.y=r.py[i];let a=Math.max(0,i-1),o=Math.min(r.count-1,i+1);e.angle=Math.atan2(r.py[o]-r.py[a],r.px[o]-r.px[a]);let s=this.clock.gameTime,c=n.drainReach,l=n.drainRate*V.drainMul*t,u=!1,d=Math.max(0,i-c),f=Math.min(r.count-1,i+c);for(let t=d;t<=f;t++){let i=s-r.pBirth[t];i>=U.maxPointAge||U.stateForAge(i)>=n.detachStateCeiling||(u=!0,r.pBirth[t]=r.pBirth[t]-l,s-r.pBirth[t]>=U.maxPointAge&&e.drained++)}u||(e.targetSlot=-1,this.enter(e,1))}resolveTraceHits(){let e=this.clock.gameTime,t=B.killState,n=O.enemy.leech.contactRadius,r=n*n;for(let i=0;i<this.leeches.length;i++){let a=this.leeches[i];if(!a.active||a.state===3||a.state===0)continue;let o=!1;this.traces.hash.query(a.x-n,a.y-n,a.x+n,a.y+n,(n,i)=>{if(o||n===a.hostSlot)return;let s=this.traces.traceBySlot(n);if(!s||i+1>=s.count)return;let c=e-s.pBirth[i];if(U.stateForAge(c)>t)return;let l=s.px[i],d=s.py[i],f=s.px[i+1],p=s.py[i+1];u(a.x,a.y,l,d,f,p)<r&&(o=!0,s.flash=Math.min(1,s.flash+.7))}),o&&this.kill(a)}}kill(e){e.state!==3&&(this.enter(e,3),e.flash=1,this.kills++,this.bus.emit(`leechKill`,{x:e.x,y:e.y,drained:e.drained}))}clear(){for(let e=0;e<this.leeches.length;e++)this.leeches[e].active=!1;this.liveCount=0,this.kills=0}purge(e){let t=0;for(let n=0;n<this.leeches.length;n++){let r=this.leeches[n];!r.active||r.state===3||(e(r),this.enter(r,3),t++)}return t}get threatCount(){let e=0;for(let t=0;t<this.leeches.length;t++){let n=this.leeches[t];n.active&&n.state!==3&&e++}return e}},un=class{traces;clock;bus;mirrors=[];px;py;pd;recordings=[];rx;ry;recordCursor=0;recordCount=0;rng=new x(1831565813);maxPoints;liveCount=0;kills=0;playerX=0;playerY=0;w=1;h=1;constructor(e,t,n){this.traces=e,this.clock=t,this.bus=n;let r=O.enemy.mirror;this.maxPoints=r.maxPoints,this.px=new Float32Array(r.max*r.maxPoints),this.py=new Float32Array(r.max*r.maxPoints),this.pd=new Float32Array(r.max*r.maxPoints);for(let e=0;e<r.max;e++)this.mirrors.push({active:!1,state:0,stateT:0,slot:e,count:0,total:0,head:0,headX:0,headY:0,headIdx:0,flash:0,seed:0});this.rx=new Float32Array(r.memory*r.maxPoints),this.ry=new Float32Array(r.memory*r.maxPoints);for(let e=0;e<r.memory;e++)this.recordings.push({count:0,extent:0})}resize(e,t){this.w=e,this.h=t}record(e){let t=O.enemy.mirror;if(e.count<8||e.length<t.minLength)return;let n=this.recordCursor;this.recordCursor=(this.recordCursor+1)%t.memory,this.recordCount=Math.min(t.memory,this.recordCount+1);let r=Math.max(1,Math.ceil(e.count/this.maxPoints)),i=n*this.maxPoints,a=0,o=0,s=0;for(let t=0;t<e.count&&a<this.maxPoints;t+=r)this.rx[i+a]=e.px[t],this.ry[i+a]=e.py[t],o+=e.px[t],s+=e.py[t],a++;if(a<this.maxPoints&&a>0){let t=e.count-1;this.rx[i+a]=e.px[t],this.ry[i+a]=e.py[t],o+=e.px[t],s+=e.py[t],a++}if(a<4)return;o/=a,s/=a;let c=0;for(let e=0;e<a;e++){let t=this.rx[i+e]-o,n=this.ry[i+e]-s,r=Math.hypot(t,n);r>c&&(c=r),this.rx[i+e]=t,this.ry[i+e]=n}if(c<.001)return;let l=1/c;for(let e=0;e<a;e++)this.rx[i+e]=this.rx[i+e]*l,this.ry[i+e]=this.ry[i+e]*l;let u=this.recordings[n];u.count=a,u.extent=c}get memoryCount(){return this.recordCount}spawn(){if(this.recordCount===0)return null;let e=-1;for(let t=0;t<this.mirrors.length;t++)if(!this.mirrors[t].active){e=t;break}if(e<0)return null;let t=O.enemy.mirror,n=this.rng.int(this.recordCount),r=this.recordings[n];if(r.count<4)return null;let i=this.mirrors[e],a=n*this.maxPoints,o=e*this.maxPoints,s=this.rng.next()<.5?-1:1,c=this.rng.range(0,Math.PI*2),l=Math.cos(c),u=Math.sin(c),d=b(r.extent,t.minScale,t.maxScale)*t.scale,f=Math.min(d+26,this.w*.45),p=Math.min(d+26,this.h*.45),m=b(this.playerX+this.rng.spread(t.offset),f,this.w-f),h=b(this.playerY+this.rng.spread(t.offset),p,this.h-p),g=0;for(let e=0;e<r.count;e++){let t=this.rx[a+e],n=this.ry[a+e]*s,r=m+(t*l-n*u)*d,i=h+(t*u+n*l)*d;this.px[o+e]=r,this.py[o+e]=i,e>0&&(g+=Math.hypot(r-this.px[o+e-1],i-this.py[o+e-1])),this.pd[o+e]=g}return i.active=!0,i.state=0,i.stateT=0,i.count=r.count,i.total=g,i.head=0,i.headIdx=0,i.headX=this.px[o],i.headY=this.py[o],i.flash=1,i.seed=this.rng.next(),this.bus.emit(`mirrorSpawn`,{x:i.headX,y:i.headY}),i}enter(e,t){e.state=t,e.stateT=0}update(e){let t=O.enemy.mirror;this.liveCount=0;for(let n=0;n<this.mirrors.length;n++){let r=this.mirrors[n];if(r.active){if(r.stateT+=e,r.flash+=(0-r.flash)*Math.min(1,e*8),r.state===0)r.stateT>=t.telegraphTime&&(this.enter(r,1),this.bus.emit(`mirrorStrike`,{x:r.headX,y:r.headY}));else if(r.state===1)r.head+=t.drawSpeed*H()*e,r.head>=r.total&&(r.head=r.total,this.enter(r,2)),this.advanceHead(r);else if(r.state===2)r.stateT>=t.lingerTime&&this.kill(r);else if(r.state===3&&r.stateT>=t.deathTime){r.active=!1;continue}this.liveCount++}}}advanceHead(e){let t=e.slot*this.maxPoints;for(;e.headIdx+1<e.count&&this.pd[t+e.headIdx+1]<e.head;)e.headIdx++;let n=e.headIdx,r=Math.min(e.count-1,n+1),i=this.pd[t+n],a=this.pd[t+r],o=a>i?(e.head-i)/(a-i):0;e.headX=this.px[t+n]+(this.px[t+r]-this.px[t+n])*o,e.headY=this.py[t+n]+(this.py[t+r]-this.py[t+n])*o}pointX(e,t){return this.px[e.slot*this.maxPoints+t]}pointY(e,t){return this.py[e.slot*this.maxPoints+t]}pointDist(e,t){return this.pd[e.slot*this.maxPoints+t]}resolveTraceHits(){let e=this.clock.gameTime,t=B.killState,n=O.enemy.mirror.killRadius,r=n*n;for(let i=0;i<this.mirrors.length;i++){let a=this.mirrors[i];if(!a.active||a.state!==1)continue;let o=!1;this.traces.hash.query(a.headX-n,a.headY-n,a.headX+n,a.headY+n,(n,i)=>{if(o)return;let s=this.traces.traceBySlot(n);if(!s||i+1>=s.count)return;let c=e-s.pBirth[i];if(U.stateForAge(c)>t)return;let l=s.px[i],d=s.py[i],f=s.px[i+1],p=s.py[i+1];u(a.headX,a.headY,l,d,f,p)<r&&(o=!0,s.flash=Math.min(1,s.flash+.7))}),o&&this.kill(a)}}contactWithPlayer(e,t){let n=O.enemy.mirror.headRadius+O.player.hitRadius,r=n*n;for(let n=0;n<this.mirrors.length;n++){let i=this.mirrors[n];if(!i.active||i.state!==1)continue;let a=i.headX-e,o=i.headY-t;if(a*a+o*o<=r)return i}return null}get damage(){return O.enemy.mirror.damage*V.damageMul}kill(e){if(e.state===3)return;let t=e.state===1;this.enter(e,3),e.flash=1,t&&this.kills++,this.bus.emit(`mirrorKill`,{x:e.headX,y:e.headY,progress01:e.total>0?e.head/e.total:0,earned:t})}clear(){for(let e=0;e<this.mirrors.length;e++)this.mirrors[e].active=!1;this.liveCount=0,this.kills=0,this.recordCount=0,this.recordCursor=0;for(let e=0;e<this.recordings.length;e++)this.recordings[e].count=0}purge(e){let t=0;for(let n=0;n<this.mirrors.length;n++){let r=this.mirrors[n];!r.active||r.state===3||(e(r),this.enter(r,3),t++)}return t}get threatCount(){let e=0;for(let t=0;t<this.mirrors.length;t++){let n=this.mirrors[t];n.active&&n.state!==3&&e++}return e}};function dn(e,t,n){let r=O.enemy.mirror,i=R.grid,a=R.enemyHot,o=O.a11y.flashIntensity,s=t.mirrors;for(let c=0;c<s.length;c++){let l=s[c];if(!l.active||l.count<2)continue;let u=l.state===0?A(0,r.telegraphTime*.55,l.stateT):1,d=1;l.state===2?d=1-S(l.stateT/r.lingerTime)*.65:l.state===3&&(d=1-S(l.stateT/r.deathTime));let f=u*d;if(f<=.01)continue;let p=+(l.state===0),m=.7+.3*Math.sin(n*5.5+l.seed*12)*p,h=.2*f*m*o*(1+p*.9);for(let n=0;n+1<l.count;n++)e.add(t.pointX(l,n),t.pointY(l,n),t.pointX(l,n+1),t.pointY(l,n+1),.7,i[0],i[1],i[2],h,.55+p*.5,0,2.4);if(l.state===0)continue;for(let n=0;n+1<l.count;n++){let r=t.pointDist(l,n+1);if(r>l.head)break;let i=S((l.head-r)/220),s=(.16+.5*(1-i))*f*o;e.add(t.pointX(l,n),t.pointY(l,n),t.pointX(l,n+1),t.pointY(l,n+1),.95+(1-i)*.5,a[0],a[1],a[2],s,.5+(1-i)*1.4,0,3)}if(l.state!==1)continue;let g=r.headRadius*(1+l.flash*.5),_=2.6+l.flash*2;e.add(l.headX-g,l.headY,l.headX+g,l.headY,1.5,a[0],a[1],a[2],.95*f*o,_,0,3.6),e.add(l.headX,l.headY-g,l.headX,l.headY+g,1.5,a[0],a[1],a[2],.95*f*o,_,0,3.6)}}var fn=class{particles;pieces=[];rng=new x(335591);constructor(e,t=512){this.particles=e;for(let e=0;e<t;e++)this.pieces.push({active:!1,x:0,y:0,half:0,angle:0,vx:0,vy:0,spin:0,life:0,maxLife:1,r:1,g:1,b:1,weight:1})}spawn(e,t,n,r,i,a,o,s,c=1){let l=d(e,t,n,r),u=(e+n)*.5,f=(t+r)*.5;if(l<O.glyph.minFragmentLength){let e=R.glyphCut;this.particles.burst(u,f,4,130,e[0],e[1],e[2],.35,1.6);return}let p=-1;for(let e=0;e<this.pieces.length;e++)if(!this.pieces[e].active){p=e;break}if(p<0)return;let m=this.pieces[p];m.active=!0,m.x=u,m.y=f,m.half=l*.5,m.angle=Math.atan2(r-t,n-e);let h=55+this.rng.next()*130;m.vx=i*o*h+this.rng.spread(26),m.vy=a*o*h+this.rng.spread(26),m.spin=this.rng.spread(4.2),m.maxLife=O.glyph.fragmentLife*(.7+this.rng.next()*.6),m.life=m.maxLife,m.r=s[0],m.g=s[1],m.b=s[2],m.weight=c}update(e){let t=O.glyph.fragmentDrag;for(let n=0;n<this.pieces.length;n++){let r=this.pieces[n];if(!r.active)continue;if(r.life-=e,r.life<=0){r.active=!1;continue}let i=Math.exp(-t*e);r.vx*=i,r.vy*=i,r.x+=r.vx*e,r.y+=r.vy*e,r.angle+=r.spin*e,r.spin*=i}}render(e,t){if(t<=.002)return;let n=R.glyphCut;for(let r=0;r<this.pieces.length;r++){let i=this.pieces[r];if(!i.active)continue;let a=i.life/i.maxLife,o=Math.cos(i.angle)*i.half,s=Math.sin(i.angle)*i.half,c=i.r+(n[0]-i.r)*a,l=i.g+(n[1]-i.g)*a,u=i.b+(n[2]-i.b)*a;e.add(i.x-o,i.y-s,i.x+o,i.y+s,O.glyph.halfWidth*i.weight*(.75+a*.45),c,l,u,a*a*t,.7+a*1.1,r*.271%1)}}get count(){let e=0;for(let t=0;t<this.pieces.length;t++)this.pieces[t].active&&e++;return e}clear(){for(let e=0;e<this.pieces.length;e++)this.pieces[e].active=!1}},Z=[{text:`NULL`,tint:R.unstable,size:46,speed:96},{text:`ERROR`,tint:R.warning,size:44,speed:78},{text:`VOID`,tint:R.fieldDeep,size:52,speed:60}],pn=class e{traces;clock;bus;words=[];debris;sx0;sy0;sx1;sy1;alive;prox;rng=new x(668265261);maxStrokes;liveCount=0;kills=0;cuts=0;playerX=0;playerY=0;pullX=0;pullY=0;w=1;h=1;constructor(e,t,n,r){this.traces=e,this.clock=t,this.bus=n;let i=O.enemy.word;this.maxStrokes=i.maxStrokes;let a=i.max*i.maxStrokes;this.sx0=new Float32Array(a),this.sy0=new Float32Array(a),this.sx1=new Float32Array(a),this.sy1=new Float32Array(a),this.alive=new Uint8Array(a),this.prox=new Float32Array(a),this.debris=new fn(r,256);for(let e=0;e<i.max;e++)this.words.push({active:!1,state:0,stateT:0,kind:0,slot:e,x:0,y:0,scale:1,count:0,intact:0,vx:0,vy:0,life:0,leaving:!1,flash:0,seed:0})}resize(e,t){this.w=e,this.h=t}static kindOf(e){return Z[e.kind]}spawn(e=-1){let t=-1;for(let e=0;e<this.words.length;e++)if(!this.words[e].active){t=e;break}if(t<0)return null;let n=this.words[t];n.kind=e>=0?e:this.rng.int(Z.length);let r=Z[n.kind],i=O.enemy.word,a=r.size,o=.14,s=-(N.measure(r.text,o)*a)/2,c=-a/2,l=t*this.maxStrokes,u=0;for(let e=0;e<r.text.length;e++){let t=r.text[e];for(let e of N.glyph(t))for(let t=0;t+3<e.length&&u<this.maxStrokes;t+=2)this.sx0[l+u]=s+e[t]*a,this.sy0[l+u]=c+e[t+1]*a,this.sx1[l+u]=s+e[t+2]*a,this.sy1[l+u]=c+e[t+3]*a,this.alive[l+u]=1,this.prox[l+u]=0,u++;s+=(N.advance(t)+o)*a}let d=a*2,f=this.rng.int(4);return f===0?(n.x=this.rng.range(0,this.w),n.y=-d):f===1?(n.x=this.rng.range(0,this.w),n.y=this.h+d):f===2?(n.x=-d,n.y=this.rng.range(0,this.h)):(n.x=this.w+d,n.y=this.rng.range(0,this.h)),n.active=!0,n.state=0,n.stateT=0,n.scale=1,n.count=u,n.intact=u,n.vx=0,n.vy=0,n.life=i.lifetime,n.leaving=!1,n.flash=1,n.seed=this.rng.next(),this.bus.emit(`wordSpawn`,{x:n.x,y:n.y,kind:n.kind,text:r.text}),n}enter(e,t){e.state=t,e.stateT=0}static integrity(e){return e.count>0?e.intact/e.count:0}update(t){let n=O.enemy.word;this.liveCount=0,this.pullX=0,this.pullY=0,this.debris.update(t);for(let r=0;r<this.words.length;r++){let i=this.words[r];if(!i.active)continue;if(i.stateT+=t,i.flash+=(0-i.flash)*Math.min(1,t*8),i.state===0)i.scale=S(i.stateT/n.spawnTime),i.stateT>=n.spawnTime&&(i.scale=1,this.enter(i,1));else if(i.state===2){if(i.scale=1-S(i.stateT/n.deathTime),i.stateT>=n.deathTime){i.active=!1;continue}this.liveCount++;continue}let a=Z[i.kind],o=e.integrity(i);if(i.state===1&&(i.life-=t,!i.leaving&&i.life<=n.leaveWarn&&(i.leaving=!0),i.life<=0)){this.depart(i);continue}let s=a.speed*(.45+o*.55)*H()*(i.leaving?2.2:1),c=this.playerX,l=this.playerY;if(i.leaving){let e=i.x,t=this.w-i.x,n=i.y,r=this.h-i.y,a=Math.min(e,t,n,r);a===e?(c=-300,l=i.y):a===t?(c=this.w+300,l=i.y):a===n?(c=i.x,l=-300):(c=i.x,l=this.h+300)}let u=c-i.x,d=l-i.y,f=Math.hypot(u,d)||1;i.vx+=(u/f*s-i.vx)*Math.min(1,t*1.6),i.vy+=(d/f*s-i.vy)*Math.min(1,t*1.6),i.x+=i.vx*t,i.y+=i.vy*t,i.state===1&&(i.kind===0?this.tickNull(i,o,t):i.kind===2&&this.tickVoid(i,o)),this.liveCount++}}tickNull(e,t,n){let r=O.enemy.word,i=r.nullRadius*(.5+t*.5),a=i*i,o=r.nullErase*t*V.drainMul*n,s=this.clock.gameTime,c=this.traces.traces;for(let t=0;t<c.length;t++){let r=c[t];if(r.active){for(let t=0;t<r.count;t+=2)fe(e.x,e.y,r.px[t],r.py[t])>a||(r.pBirth[t]=r.pBirth[t]-o,t+1<r.count&&(r.pBirth[t+1]=r.pBirth[t+1]-o));s-r.pBirth[0]>0&&(r.flash=Math.min(1,r.flash+n*.9))}}}tickVoid(e,t){let n=O.enemy.word,r=e.x-this.playerX,i=e.y-this.playerY,a=Math.hypot(r,i);if(a<1||a>n.voidRadius)return;let o=1-a/n.voidRadius,s=n.voidPull*t*o*o;this.pullX+=r/a*s,this.pullY+=i/a*s}cutWith(t,n,r,i){let a=r-t,o=i-n,s=Math.hypot(a,o);if(s<1e-4)return;a/=s,o/=s;let c=-o,l=a;for(let a=0;a<this.words.length;a++){let o=this.words[a];if(!o.active||o.state!==1)continue;let s=o.scale||1,u=(t-o.x)/s,d=(n-o.y)/s,f=(r-o.x)/s,p=(i-o.y)/s,m=o.slot*this.maxStrokes;for(let t=0;t<o.count;t++){if(!this.alive[m+t])continue;let n=P(u,d,f,p,this.sx0[m+t],this.sy0[m+t],this.sx1[m+t],this.sy1[m+t]);if(n<0)continue;this.alive[m+t]=0,o.intact--,o.flash=Math.min(1,o.flash+.5),this.cuts++;let r=u+(f-u)*n,i=d+(p-d)*n,a=Z[o.kind];this.debris.spawn(o.x+this.sx0[m+t]*s,o.y+this.sy0[m+t]*s,o.x+r*s,o.y+i*s,c,l,-1,a.tint),this.debris.spawn(o.x+r*s,o.y+i*s,o.x+this.sx1[m+t]*s,o.y+this.sy1[m+t]*s,c,l,1,a.tint),this.bus.emit(`wordCut`,{x:o.x+r*s,y:o.y+i*s,nx:c,ny:l,kind:o.kind,remaining01:e.integrity(o)})}o.intact<=0&&this.kill(o)}}contactWithPlayer(e,t){let n=O.enemy.word.errorReach+O.player.hitRadius,r=n*n;for(let n=0;n<this.words.length;n++){let i=this.words[n];if(!i.active||i.state!==1||i.kind!==1)continue;let a=i.scale||1,o=(e-i.x)/a,s=(t-i.y)/a,c=i.slot*this.maxStrokes;for(let e=0;e<i.count;e++)if(this.alive[c+e]&&u(o,s,this.sx0[c+e],this.sy0[c+e],this.sx1[c+e],this.sy1[c+e])*a*a<=r)return i}return null}get damage(){return O.enemy.word.errorDamage*V.damageMul}kill(e){if(e.state===2)return;this.enter(e,2),e.flash=1,this.kills++;let t=Z[e.kind];this.bus.emit(`wordKill`,{x:e.x,y:e.y,kind:e.kind,text:t.text,earned:!0})}depart(e){if(e.state===2)return;this.enter(e,2);let t=Z[e.kind];this.bus.emit(`wordKill`,{x:e.x,y:e.y,kind:e.kind,text:t.text,earned:!1})}updateProximity(e,t){for(let n=0;n<this.words.length;n++){let r=this.words[n];if(!r.active)continue;let i=r.scale||1,a=r.slot*this.maxStrokes;for(let n=0;n<r.count;n++){if(!this.alive[a+n])continue;let o=r.x+(this.sx0[a+n]+this.sx1[a+n])*.5*i,s=r.y+(this.sy0[a+n]+this.sy1[a+n])*.5*i,c=S(1-e(o,s)/120);this.prox[a+n]=this.prox[a+n]+(c-this.prox[a+n])*Math.min(1,t*9)}}}strokeAlive(e,t){return this.alive[e.slot*this.maxStrokes+t]===1}strokeProx(e,t){return this.prox[e.slot*this.maxStrokes+t]}strokeX0(e,t){return e.x+this.sx0[e.slot*this.maxStrokes+t]*e.scale}strokeY0(e,t){return e.y+this.sy0[e.slot*this.maxStrokes+t]*e.scale}strokeX1(e,t){return e.x+this.sx1[e.slot*this.maxStrokes+t]*e.scale}strokeY1(e,t){return e.y+this.sy1[e.slot*this.maxStrokes+t]*e.scale}tintOf(e){return Z[e.kind].tint}clear(){for(let e=0;e<this.words.length;e++)this.words[e].active=!1;this.debris.clear(),this.liveCount=0,this.kills=0,this.cuts=0,this.pullX=0,this.pullY=0}purge(e){let t=0;for(let n=0;n<this.words.length;n++){let r=this.words[n];!r.active||r.state===2||(e(r),this.enter(r,2),t++)}return t}get threatCount(){let e=0;for(let t=0;t<this.words.length;t++){let n=this.words[t];n.active&&n.state!==2&&e++}return e}get debrisCount(){return this.debris.count}};function mn(e,t,n){let r=O.enemy.word,i=R.glyphCut,a=O.glyph.halfWidth,o=O.a11y.flashIntensity,s=t.words;for(let c=0;c<s.length;c++){let l=s[c];if(!l.active||l.count===0)continue;let u=t.tintOf(l),d=pn.integrity(l),f=l.state===2?S(1-l.stateT/r.deathTime):1;if(l.leaving&&l.state===1&&(f*=.35+.65*S(l.life/r.leaveWarn)),f<=.01)continue;let p=1-d,m=p>.02?1-p*.35*(.5+.5*Math.sin(n*27+l.seed*40)):1;l.kind===2&&l.state===1&&hn(e,l.x,l.y,r.voidRadius*(.35+d*.65),u[0],u[1],u[2],.1*d*f*o,n*.35+l.seed*6),l.kind===0&&l.state===1&&hn(e,l.x,l.y,r.nullRadius*(.5+d*.5),u[0],u[1],u[2],.16*d*f*o,-n*.5+l.seed*6);for(let n=0;n<l.count;n++){if(!t.strokeAlive(l,n))continue;let r=t.strokeProx(l,n),s=u[0]+(i[0]-u[0])*r,c=u[1]+(i[1]-u[1])*r,d=u[2]+(i[2]-u[2])*r,p=(.75+r*1.6+l.flash*1.8)*m;e.add(t.strokeX0(l,n),t.strokeY0(l,n),t.strokeX1(l,n),t.strokeY1(l,n),(a+r*.7)*l.scale,s,c,d,f*o,p,n*.137%1,3.4)}}t.debris.render(e,1)}function hn(e,t,n,r,i,a,o,s,c){if(s<=.004)return;let l=Math.PI*2/28;for(let u=0;u<28;u+=2){let d=c+u*l,f=d+l;e.add(t+Math.cos(d)*r,n+Math.sin(d)*r,t+Math.cos(f)*r,n+Math.sin(f)*r,.7,i,a,o,s,.6,0,2.4)}}var Q=[`STRAIGHT LINES`,`CLOSED LOOPS`,`CROSSINGS`,`LONG TRACES`,`FAST HANDS`,`ONE CORNER`],gn=class{score=new Float32Array(6);region;cols;rows;strokes=0;constructor(){this.cols=O.parser.regionCols,this.rows=O.parser.regionRows,this.region=new Float32Array(this.cols*this.rows)}reset(){this.score.fill(0),this.region.fill(0),this.strokes=0}observeStroke(e,t,n,r,i,a,o){let s=O.parser,c=s.emaRate;this.strokes++;let l=S(t/O.parser.curveSaturation);if(this.ema(0,1-l,c),this.ema(3,S(e/s.longTrace),c),this.ema(4,S(n/s.fastSpeed01),c),a>0&&o>0){let e=Math.min(this.cols-1,Math.max(0,r/a*this.cols|0)),t=Math.min(this.rows-1,Math.max(0,i/o*this.rows|0));for(let e=0;e<this.region.length;e++)this.region[e]=this.region[e]*(1-c);this.region[t*this.cols+e]=this.region[t*this.cols+e]+c,this.updateRegionScore()}}observeCrossing(){this.bump(2,O.parser.crossingWeight)}observeLoop(){this.bump(1,O.parser.loopWeight)}tick(e){let t=Math.exp(-e/O.parser.rateHalfLife);this.score[2]=this.score[2]*t,this.score[1]=this.score[1]*t}ema(e,t,n){this.score[e]=this.score[e]+(t-this.score[e])*n}bump(e,t){this.score[e]=S(this.score[e]+t)}updateRegionScore(){let e=0,t=0;for(let n=0;n<this.region.length;n++){let r=this.region[n];e+=r,r>t&&(t=r)}if(e<=1e-5){this.score[5]=0;return}let n=t/e,r=1/this.region.length;this.score[5]=S((n-r)/(1-r))}get(e){return this.score[e]??0}get ready(){return this.strokes>=O.parser.minStrokes}dominant(e=-1){let t=-1,n=O.parser.minHabit;for(let r=0;r<6;r++){if(r===e)continue;let i=this.score[r];i>n&&(n=i,t=r)}return t}favouredCell(e,t,n){let r=-1,i=0;for(let e=0;e<this.region.length;e++)this.region[e]>r&&(r=this.region[e],i=e);let a=i%this.cols,o=i/this.cols|0;n[0]=(a+.5)*(e/this.cols),n[1]=(o+.5)*(t/this.rows)}neglectedCell(e,t,n){let r=1/0,i=0;for(let e=0;e<this.region.length;e++)this.region[e]<r&&(r=this.region[e],i=e);let a=i%this.cols,o=i/this.cols|0;n[0]=(a+.5)*(e/this.cols),n[1]=(o+.5)*(t/this.rows)}readout(e){let t=Math.round(this.get(e)*100);return`${Q[e]??`?`}  ${t}`}},_n=[`PREDICT`,`INVADE`,`HUNT`,`SEVER`,`REPLAY`,`COLLAPSE`],vn=class{traces;clock;bus;profile;state=0;stateT=0;x=0;y=0;scale=0;spin=0;spokes=[];intact=0;read=-1;counter=-1;lastRead=-1;spawnTimer=0;phasesDone=0;kills=0;flash=0;rng=new x(2654435761);_cell=new Float32Array(2);w=1;h=1;playerX=0;playerY=0;commands=null;constructor(e,t,n,r){this.traces=e,this.clock=t,this.bus=n,this.profile=r;for(let e=0;e<O.parser.spokes;e++)this.spokes.push({alive:!1,angle:0,flash:0})}resize(e,t){this.w=e,this.h=t}get active(){return this.state!==0}get threatCount(){return+(this.state!==0&&this.state!==4)}get integrity01(){return this.spokes.length>0?this.intact/this.spokes.length:0}summon(){if(this.active)return;O.parser,this.profile.neglectedCell(this.w,this.h,this._cell),this.x=this._cell[0],this.y=this._cell[1];let e=this.spokes.length;for(let t=0;t<e;t++){let n=this.spokes[t];n.alive=!0,n.angle=t/e*Math.PI*2,n.flash=0}this.intact=e,this.state=1,this.stateT=0,this.scale=0,this.read=-1,this.counter=-1,this.lastRead=-1,this.phasesDone=0,this.flash=1,this.bus.emit(`parserArrive`,{x:this.x,y:this.y})}enter(e){this.state=e,this.stateT=0}takeReading(){let e=this.profile.dominant(this.lastRead);e<0?(this.read=-1,this.counter=0):(this.read=e,this.counter=e,this.lastRead=e),this.spawnTimer=0,this.bus.emit(`parserRead`,{x:this.x,y:this.y,habit:this.read,habitName:this.read>=0?Q[this.read]??`?`:`NO PATTERN`,value01:this.read>=0?this.profile.get(this.read):0,counterName:_n[this.counter]??`?`})}update(e){if(this.state===0)return;let t=O.parser;this.stateT+=e,this.flash+=(0-this.flash)*Math.min(1,e*7),this.spin+=e*t.spin;for(let t=0;t<this.spokes.length;t++){let n=this.spokes[t];n.flash+=(0-n.flash)*Math.min(1,e*8)}if(this.state===1){this.scale=S(this.stateT/t.arriveTime),this.stateT>=t.arriveTime&&(this.scale=1,this.takeReading(),this.enter(2));return}if(this.state===4){this.scale=1-S(this.stateT/t.breakTime),this.stateT>=t.breakTime&&(this.state=0);return}this.profile.neglectedCell(this.w,this.h,this._cell);let n=this._cell[0]-this.x,r=this._cell[1]-this.y,i=Math.hypot(n,r);if(i>4&&(this.x+=n/i*t.driftSpeed*e,this.y+=r/i*t.driftSpeed*e),this.state===2){this.stateT>=t.readTime&&this.enter(3);return}this.spawnTimer-=e,this.spawnTimer<=0&&(this.spawnTimer=t.counterInterval,this.execute()),this.stateT>=t.counterTime&&(this.takeReading(),this.enter(2))}execute(){let e=this.commands;if(e)switch(this.counter){case 0:e.needle(this.playerX,this.playerY);break;case 1:case 2:e.cutter();break;case 3:e.leech();break;case 4:e.mirror();break;case 5:this.profile.favouredCell(this.w,this.h,this._cell),e.needle(this._cell[0],this._cell[1]);break;default:e.needle(this.playerX,this.playerY)}}resolveTraceHits(){if(this.state!==2&&this.state!==3)return;let e=this.clock.gameTime,t=B.killState,n=O.parser,r=n.radius*this.scale;r+n.spokeLength;for(let i=0;i<this.spokes.length;i++){let a=this.spokes[i];if(!a.alive)continue;let o=a.angle+this.spin,s=this.x+Math.cos(o)*r,c=this.y+Math.sin(o)*r,l=this.x+Math.cos(o)*(r+n.spokeLength),d=this.y+Math.sin(o)*(r+n.spokeLength),f=!1;this.traces.hash.query(Math.min(s,l)-4,Math.min(c,d)-4,Math.max(s,l)+4,Math.max(c,d)+4,(r,i)=>{if(f)return;let a=this.traces.traceBySlot(r);if(!a||i+1>=a.count)return;let o=e-a.pBirth[i];if(U.stateForAge(o)>t)return;let p=a.px[i],m=a.py[i],h=a.px[i+1],g=a.py[i+1];(u(s,c,p,m,h,g)<n.cutRadius*n.cutRadius||u(l,d,p,m,h,g)<n.cutRadius*n.cutRadius)&&(f=!0,a.flash=Math.min(1,a.flash+.7))}),f&&this.cut(i)}}cut(e){let t=this.spokes[e];if(!t.alive)return;t.alive=!1,t.flash=1,this.flash=Math.min(1,this.flash+.4),this.intact--;let n=t.angle+this.spin,r=O.parser.radius*this.scale;if(this.bus.emit(`parserCut`,{x:this.x+Math.cos(n)*r,y:this.y+Math.sin(n)*r,remaining01:this.integrity01}),this.intact<=0){this.breakApart();return}let i=Math.floor((1-this.integrity01)*O.parser.phases);i>this.phasesDone&&(this.phasesDone=i,this.takeReading(),this.enter(2))}breakApart(){this.enter(4),this.kills++,this.bus.emit(`parserBreak`,{x:this.x,y:this.y})}destroy(){if(this.state!==0&&this.state!==4){for(let e=0;e<this.spokes.length;e++)this.spokes[e].alive=!1;this.intact=0,this.breakApart()}}clear(){this.state=0,this.stateT=0,this.scale=0,this.intact=0,this.read=-1,this.counter=-1,this.lastRead=-1,this.phasesDone=0,this.kills=0;for(let e=0;e<this.spokes.length;e++)this.spokes[e].alive=!1}get seed(){return this.rng?.37:0}};function yn(e,t,n,r){if(t.state===0)return;let i=O.parser,a=O.a11y.flashIntensity,o=t.state===1?A(0,1,S(t.stateT/i.arriveTime)):t.state===4?S(1-t.stateT/i.breakTime):1;if(o<=.01)return;let s=i.radius*o,c=t.state===2?1+.22*Math.sin(t.stateT*3.1):.86,l=R.enemyHot,u=R.gridHot,d=t.state===2?u:l,f=Math.PI*2/44;for(let n=0;n<44;n++){let r=n*f+t.spin*.4,i=r+f,l=s*c;e.add(t.x+Math.cos(r)*l,t.y+Math.sin(r)*l,t.x+Math.cos(i)*l,t.y+Math.sin(i)*l,1.1+t.flash*1.2,d[0],d[1],d[2],(.5+t.flash*.4)*o*a,.8+t.flash*2,0,3)}for(let n=0;n<t.spokes.length;n++){let r=t.spokes[n],l=r.angle+t.spin,u=Math.cos(l),f=Math.sin(l),p=s*c,m=p+i.spokeLength*o;r.alive?e.add(t.x+u*p,t.y+f*p,t.x+u*m,t.y+f*m,1.4+r.flash*1.4,d[0],d[1],d[2],(.75+r.flash*.25)*o*a,1.1+r.flash*3,0,3.2):e.add(t.x+u*p,t.y+f*p,t.x+u*(p+5*o),t.y+f*(p+5*o),.7,R.grid[0],R.grid[1],R.grid[2],.35*o*a,.4,0,2.2)}let p=Math.atan2(t.playerY-t.y,t.playerX-t.x),m=s*.34;for(let n=0;n<6;n++){let r=p+n/6*Math.PI*2,i=p+(n+1)/6*Math.PI*2;e.add(t.x+Math.cos(r)*m,t.y+Math.sin(r)*m,t.x+Math.cos(i)*m,t.y+Math.sin(i)*m,1,d[0],d[1],d[2],.5*o*a,1.4,0,2.8)}if(e.add(t.x,t.y,t.x+Math.cos(p)*m*1.9,t.y+Math.sin(p)*m*1.9,.8,d[0],d[1],d[2],.3*o*a,.8,0,2.4),t.state===2&&t.read!==-1){let r=A(0,.35,t.stateT)*S(2.4-t.stateT/i.readTime*2.4);xn(e,`READING  ${Q[t.read]??`?`}`,t.x,t.y-s-40,11,u,.7*r*a),bn(e,t.x,t.y-s-22,96,n.get(t.read),u,.8*r*a),xn(e,`COUNTER  ${_n[t.counter]??`?`}`,t.x,t.y+s+i.spokeLength+22,13,l,.85*r*a)}else t.state===2&&xn(e,`NO PATTERN`,t.x,t.y-s-30,12,u,.6*a*A(0,.35,t.stateT));if(t.state!==1&&t.state!==4){let r=t.y+s+i.spokeLength+44;for(let i=0;i<6;i++){let o=t.x-135+i*46,s=i===t.read,c=s?l:R.grid,u=n.get(i);e.add(o,r,o+40,r,.6,c[0],c[1],c[2],.2*a,.3,0,2),u>.01&&e.add(o,r,o+40*u,r,s?2.2:1.4,c[0],c[1],c[2],(s?.9:.45)*a,s?1.6:.6,0,2.6)}}}function bn(e,t,n,r,i,a,o){let s=t-r*.5;e.add(s,n,s+r,n,.7,a[0],a[1],a[2],o*.3,.3,0,2.2),i>.01&&e.add(s,n,s+r*S(i),n,2.4,a[0],a[1],a[2],o,1.5,0,3)}function xn(e,t,n,r,i,a,o){if(o<=.004)return;let s=.4,c=n-N.measure(t,s)*i*.5;for(let n=0;n<t.length;n++){let l=t[n];for(let t of N.glyph(l))for(let n=0;n+3<t.length;n+=2)e.add(c+t[n]*i,r+t[n+1]*i,c+t[n+2]*i,r+t[n+3]*i,Math.max(1,i*.055),a[0],a[1],a[2],o,1,0,3.4);c+=(N.advance(l)+s)*i}}var Sn=`
precision highp float;

in vec3 position;   // unit quad, -1..1
in vec2 aPos;        // centre, px (world position, already on the trace)
in vec4 aParams;     // angle, state(0..3), stateT01, flash
in vec2 aMeta;       // seed, drained

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float uHalfLength;
uniform float uHalfWidth;
uniform float uTime;

out vec2  vLocal;
out float vState;
out float vPhase;
out float vFlash;
out float vSeed;
out float vDrained;

void main() {
  vState = aParams.y;
  vPhase = aParams.z;
  vFlash = aParams.w;
  vSeed  = aMeta.x;
  vDrained = aMeta.y;

  float dying = step(2.5, vState);

  float halfLen = uHalfLength + 20.0;
  float halfWid = uHalfWidth + 18.0;
  vec2 local = vec2(position.x * halfLen, position.y * halfWid);
  vLocal = local;

  float c = cos(aParams.x);
  float s = sin(aParams.x);
  vec2 world = aPos + vec2(local.x * c - local.y * s, local.x * s + local.y * c);
  world = mix(world, aPos, dying * vPhase * 0.6);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 0.0, 1.0);
}
`,Cn=`
precision highp float;

in vec2  vLocal;
in float vState;
in float vPhase;
in float vFlash;
in float vSeed;
in float vDrained;

uniform float uHalfLength;
uniform float uHalfWidth;
uniform float uTime;
uniform vec3  uCold;
uniform vec3  uHot;
uniform float uFlashScale;
uniform float uHaloLimit;

out vec4 fragColor;

${E}

/** Exact capsule distance — same formula used for traces and segments. */
float capsuleSDF(vec2 p, float halfLen, float r) {
  float ax = max(0.0, abs(p.x) - halfLen);
  return sqrt(ax * ax + p.y * p.y) - r;
}

void main() {
  float attached = step(1.5, vState) * step(vState, 2.5);
  float dying    = step(2.5, vState);
  float spawning = step(vState, 0.5);

  float d = capsuleSDF(vLocal, uHalfLength, uHalfWidth);

  float rimW = 1.7 + attached * 0.5;
  float rim = (1.0 - smoothstep(rimW, rimW + 1.3, abs(d)))
            * (2.8 + attached * 2.6);

  float inside = 1.0 - smoothstep(-1.0, 0.6, d);
  float interior = inside * (0.45 + attached * 0.5);

  float haloR = 4.5 + attached * 6.0;
  float window = 1.0 - smoothstep(uHaloLimit * 0.55, uHaloLimit, max(0.0, d));
  float halo = exp(-max(0.0, d) / haloR) * (0.30 + attached * 0.6) * window;

  // A pulse travels along the body toward the tail (the anchor end) while
  // draining — the visible "it is taking something" tell.
  float pulse = 0.0;
  if (attached > 0.5) {
    float phase = fract(vLocal.x / max(1.0, uHalfLength * 2.0) - uTime * 1.6 + vSeed * 4.0);
    pulse = pow(max(0.0, sin(phase * PI)), 10.0) * inside * 1.4;
  }

  float heat = attached * (0.35 + pulse * 0.65) + vFlash * 0.6;
  vec3 col = mix(uCold, uHot, clamp(heat, 0.0, 1.0));

  vec3 outCol = col * (rim + interior + halo);
  outCol += uHot * pulse * 1.5;
  outCol += vec3(1.0) * vFlash * rim * 1.6 * uFlashScale;
  outCol *= mix(1.0, vPhase, spawning);

  if (dying > 0.5) {
    float k = vPhase;
    outCol = mix(mix(outCol, vec3(1.0), 0.75) * 3.0, vec3(0.0), k);
    outCol *= 1.0 - k * k;
  }

  if (dot(outCol, vec3(0.333)) < 0.0012) discard;
  fragColor = vec4(outCol, 1.0);
}
`,wn=`
precision highp float;

in vec2  vLocal;
in float vState;
in float vPhase;
in float vFlash;
in float vSeed;
in float vDrained;

uniform float uHalfLength;
uniform float uHalfWidth;

out vec4 fragColor;

void main() {
  float attached = step(1.5, vState) * step(vState, 2.5);
  float r = length(vLocal);
  float falloff = exp(-r / (7.0 + attached * 8.0));
  vec2 dir = r > 1e-4 ? vLocal / r : vec2(0.0);
  float strength = falloff * (0.06 + attached * 0.3 + vFlash * 0.25);
  fragColor = vec4(dir * strength, falloff * 0.1, 0.0);
}
`;function Tn(e,t){let n=O.enemy.leech;switch(e){case 0:return Math.min(1,t/n.spawnTime);case 3:return Math.min(1,t/n.deathTime);default:return 0}}var En=class{leeches;mesh;influenceMesh;geometry;material;influenceMaterial;posArr;paramArr;metaArr;aPos;aParams;aMeta;visible=0;constructor(e){this.leeches=e;let n=O.enemy.max;this.geometry=new r,this.geometry.setAttribute(`position`,new M(new Float32Array([-1,-1,0,1,-1,0,1,1,0,-1,1,0]),3)),this.geometry.setIndex([0,1,2,0,2,3]),this.geometry.boundingSphere=new p(new l,1e7),this.posArr=new Float32Array(n*2),this.paramArr=new Float32Array(n*4),this.metaArr=new Float32Array(n*2),this.aPos=new v(this.posArr,2),this.aParams=new v(this.paramArr,4),this.aMeta=new v(this.metaArr,2);for(let e of[this.aPos,this.aParams,this.aMeta])e.setUsage(I);this.geometry.setAttribute(`aPos`,this.aPos),this.geometry.setAttribute(`aParams`,this.aParams),this.geometry.setAttribute(`aMeta`,this.aMeta),this.geometry.instanceCount=0;let i=()=>({uHalfLength:{value:O.enemy.leech.halfLength},uHalfWidth:{value:O.enemy.leech.halfWidth},uTime:{value:0},uCold:{value:new l(...R.enemy)},uHot:{value:new l(...R.enemyHot)},uFlashScale:{value:1},uHaloLimit:{value:24}});this.material=new t({vertexShader:Sn,fragmentShader:Cn,glslVersion:T,uniforms:i(),...F}),this.influenceMaterial=new t({vertexShader:Sn,fragmentShader:wn,glslVersion:T,uniforms:i(),...F}),this.mesh=new a(this.geometry,this.material),this.mesh.frustumCulled=!1,this.mesh.renderOrder=D.enemy,this.influenceMesh=new a(this.geometry,this.influenceMaterial),this.influenceMesh.frustumCulled=!1,this.influenceMesh.renderOrder=D.enemy}update(e){let t=this.leeches.leeches,n=0;for(let e=0;e<t.length;e++){let r=t[e];r.active&&(this.posArr[n*2]=r.x,this.posArr[n*2+1]=r.y,this.paramArr[n*4]=r.angle,this.paramArr[n*4+1]=r.state,this.paramArr[n*4+2]=Tn(r.state,r.stateT),this.paramArr[n*4+3]=r.flash,this.metaArr[n*2]=r.seed,this.metaArr[n*2+1]=r.drained,n++)}this.visible=n,this.geometry.instanceCount=n,n>0&&(this.aPos.needsUpdate=!0,this.aParams.needsUpdate=!0,this.aMeta.needsUpdate=!0),this.material.uniforms.uTime.value=e,this.influenceMaterial.uniforms.uTime.value=e,this.material.uniforms.uFlashScale.value=O.a11y.flashIntensity}dispose(){this.geometry.dispose(),this.material.dispose(),this.influenceMaterial.dispose()}},Dn=[{id:`persistence`,name:`PERSISTENCE`,desc:`YOUR TRACES AGE SLOWER`,max:3,tint:R.stable,apply:()=>{B.decayScale*=1.22}},{id:`tempered`,name:`TEMPERED EDGE`,desc:`LINES STAY LETHAL DEEPER INTO DECAY`,max:3,tint:R.charged,apply:()=>{B.killStateBonus+=.28}},{id:`insulation`,name:`INSULATION`,desc:`YOUR OWN OLD TRACES HURT YOU LESS`,max:2,tint:R.hostile,apply:()=>{B.hostileDamageMul*=.55}},{id:`plating`,name:`PLATING`,desc:`PLUS 25 MAX INTEGRITY  AND REPAIR IT`,max:3,tint:R.player,apply:e=>{B.integrityBonus+=25,e.heal(25)}},{id:`afterimage`,name:`AFTERIMAGE`,desc:`LONGER INVULNERABILITY AFTER A HIT`,max:2,tint:R.player,apply:()=>{B.invulnMul*=1.32}},{id:`deepfield`,name:`DEEP FIELD`,desc:`TIME RUNS SLOWER INSIDE YOUR FIELDS`,max:2,tint:R.field,apply:()=>{B.fieldSlowMul*=.72}},{id:`latent`,name:`LATENT FIELD`,desc:`FIELDS STAY ARMED LONGER`,max:2,tint:R.field,apply:()=>{B.fieldLifeMul*=1.4}},{id:`resonance`,name:`RESONANCE`,desc:`LONGER WINDOW TO CHAIN A COMBO`,max:2,tint:R.nodeHalo,apply:()=>{B.comboWindowMul*=1.45}},{id:`drag`,name:`VISCOSITY`,desc:`EVERY ENEMY MOVES SLOWER`,max:2,tint:R.grid,apply:()=>{B.enemySpeedMul*=.87}},{id:`blast`,name:`BLAST CHARGE`,desc:`DETONATION DESTROYS ENEMIES IN RANGE`,max:1,tint:R.node,apply:()=>{B.blastKill=!0}},{id:`repair`,name:`REPAIR`,desc:`RESTORE 40 INTEGRITY NOW`,max:99,tint:R.player,eligible:e=>e.integrity01<.8,apply:e=>{e.heal(40)}}],On=new Map(Dn.map(e=>[e.id,e]));function kn(e){return On.get(e)}function An(e,t,n){let r=[];for(let e of Dn)B.level(e.id)>=e.max||e.eligible&&!e.eligible(n)||r.push(e);let i=[];for(let n=0;n<t&&r.length>0;n++){let t=Math.min(r.length-1,e.next()*r.length|0);i.push(r[t]),r.splice(t,1)}return i}function jn(e,t){let n=B.level(e.id)+1;B.levels.set(e.id,n),n===1&&B.order.push(e.id),e.apply(t)}var Mn=0,Nn=1,Pn=2,Fn=3,In=4;function Ln(e){let t=e.length,n=e.reduce((e,t)=>e+t,0),r=e.slice(),i=Array(t).fill(0),a=[];for(let o=0;o<n;o++){let s=0,c=-1/0;for(let a=0;a<t;a++){if(r[a]<=0)continue;let t=e[a]/n*o-i[a];t>c&&(c=t,s=a)}a.push(s),i[s]=i[s]+1,r[s]=r[s]-1}return a}var Rn=class{enemies;cutters;leeches;mirrors;words;parser;draft;mutators;bus;phase=0;wave=0;spawnQueue=[];spawnCursor=0;spawnTimer=0;gapTimer=0;integrity=O.player.maxIntegrity;invuln=0;runTime=0;deathT=0;bestCombo=0;rng=new x(439041101);viewW=1280;viewH=720;constructor(e,t,n,r,i,a,o,s,c){this.enemies=e,this.cutters=t,this.leeches=n,this.mirrors=r,this.words=i,this.parser=a,this.draft=o,this.mutators=s,this.bus=c,this.draft.onPick=e=>this.takeCard(e),this.draft.onClosed=()=>{this.phase===4&&this.startWave()}}get integrity01(){return S(this.integrity/B.maxIntegrity)}get alive(){return this.phase===1||this.phase===4}begin(){this.phase!==1&&(this.phase=1,De(),this.draft.clear(),this.wave=0,this.spawnQueue=[],this.spawnCursor=0,this.gapTimer=.9,this.spawnTimer=0,this.integrity=B.maxIntegrity,this.invuln=0,this.runTime=0,this.deathT=0,this.bestCombo=0,this.enemies.kills=0,this.cutters.kills=0,this.leeches.kills=0,this.mirrors.kills=0,this.words.kills=0,this.parser.kills=0,this.bus.emit(`runStart`,{seed:Math.random()*1e9|0}))}reset(){this.phase=0,De(),this.draft.clear(),this.wave=0,this.spawnQueue=[],this.spawnCursor=0,this.spawnTimer=0,this.gapTimer=0,this.integrity=B.maxIntegrity,this.invuln=0,this.runTime=0,this.deathT=0,this.bestCombo=0}waveSize(e){return Math.round(O.run.waveBase+e*O.run.waveGrowth)}cutterCount(e){return e<2?0:Math.min(4,1+Math.floor((e-2)/2))}leechCount(e){return e<3?0:Math.min(3,1+Math.floor((e-3)/2))}get upgradeCtx(){return{heal:e=>{this.integrity=Math.min(B.maxIntegrity,this.integrity+e)},integrity01:this.integrity01}}draftIndex=0;rollMutator(){let e=we.filter(e=>!z.has(e.id));return e.length===0?null:e[Math.min(e.length-1,this.rng.next()*e.length|0)]??null}openDraft(){this.phase=4,this.draftIndex++;let e=this.upgradeCtx,t=An(this.rng,O.draft.offers,e),n=O.mutator;if(this.wave>=n.firstWave&&this.draftIndex%n.everyNthDraft===0){let e=this.rollMutator();if(e){let n=Math.min(t.length,1);t.length>=3?t[n]=e:t.push(e)}}t.length>0&&this.bus.emit(`draftOffer`,{wave:this.wave,ids:t.map(e=>e.id)}),this.draft.open(t,this.viewW,this.viewH)}takeCard(e){let t=Ee(e.id);if(t){this.takeMutator(t);return}let n=kn(e.id);n&&this.takeUpgrade(n)}takeUpgrade(e){jn(e,this.upgradeCtx),this.bus.emit(`draftPick`,{x:this.draft.pickedX,y:this.draft.pickedY,id:e.id,name:e.name,level:B.level(e.id),tint:e.tint})}takeMutator(e){z.take(e.id),e.id===`ghost`?B.ghost=!0:e.id===`blackbox`?B.blackBox=!0:e.id===`overflow`&&(B.decayScale*=O.mutator.overflowDecay),this.mutators.onTaken(e.id),this.bus.emit(`mutatorTake`,{x:this.draft.pickedX,y:this.draft.pickedY,id:e.id,name:e.name,tint:e.tint})}mirrorCount(e){return e<4?0:Math.min(3,1+Math.floor((e-4)/3))}wordCount(e){return e<5?0:Math.min(2,1+Math.floor((e-5)/4))}parserDue(e){let t=O.parser;return e>=t.firstWave&&(e-t.firstWave)%t.everyNthWave===0}startWave(){this.phase=1,this.wave++,V.setWave(this.wave);let e=this.waveSize(this.wave),t=this.cutterCount(this.wave),n=this.leechCount(this.wave),r=this.mirrorCount(this.wave),i=this.wordCount(this.wave);this.spawnQueue=Ln([e,t,n,r,i]),this.spawnCursor=0,this.spawnTimer=0,this.parserDue(this.wave)&&this.parser.summon(),this.bus.emit(`waveStart`,{wave:this.wave,count:this.spawnQueue.length})}update(e,t){if(this.phase===2){this.deathT+=t/O.run.deathSequence,this.deathT>=1&&(this.deathT=1,this.phase=3);return}if(this.phase===4){this.runTime+=e,this.invuln>0&&(this.invuln-=t),this.draft.update(t);return}if(this.phase!==1)return;this.runTime+=e,this.invuln>0&&(this.invuln-=t);let n=O.run;if(this.spawnCursor<this.spawnQueue.length){if(this.spawnTimer-=e,this.spawnTimer<=0){let e=this.spawnQueue[this.spawnCursor];e===Mn?this.enemies.spawn():e===Nn?this.cutters.spawn():e===Pn?this.leeches.spawn():e===Fn?this.mirrors.spawn():e===In&&this.words.spawn(),this.spawnCursor++;let t=Math.max(n.spawnIntervalMin,n.spawnInterval-this.wave*.08);this.spawnTimer=t}}else this.enemies.threatCount===0&&this.cutters.threatCount===0&&this.leeches.threatCount===0&&this.mirrors.threatCount===0&&this.words.threatCount===0&&this.parser.threatCount===0&&(this.gapTimer<=0&&(this.gapTimer=n.waveGap,this.wave>0&&this.bus.emit(`waveClear`,{wave:this.wave,count:0})),this.gapTimer-=e,this.gapTimer<=0&&(this.gapTimer=0,this.wave>0?this.openDraft():this.startWave()))}damage(e,t,n,r,i,a){return!this.alive||this.invuln>0?!1:(this.integrity=Math.max(0,this.integrity-e),this.invuln=B.invulnTime,this.bus.emit(`playerHit`,{x:t,y:n,dirX:r,dirY:i,damage:e,integrity01:this.integrity01,selfInflicted:a}),this.integrity<=0&&this.die(),!0)}die(){this.phase=2,this.deathT=0,this.draft.clear(),this.bus.emit(`runEnd`,{wave:this.wave,kills:this.enemies.kills+this.cutters.kills+this.leeches.kills+this.mirrors.kills+this.words.kills+this.parser.kills,seconds:this.runTime,bestCombo:this.bestCombo})}get ended(){return this.phase===2||this.phase===3}get invuln01(){return S(this.invuln/B.invulnTime)}},zn=0,Bn=1,$=2,Vn=class{state=$;cards=[];t=0;width=0;height=0;onPick=null;onClosed=null;get active(){return this.state!==$}get armed(){return this.state===zn&&this.t>O.draft.armDelay}open(e,t,n){this.width=t,this.height=n,this.state=zn,this.t=0,this.cards.length=0;let r=e.length;if(r===0){this.state=$,this.onClosed?.();return}let i=Math.max(46,t*.035),a=Math.min(300,(t-i*(r+1))/r),o=(t-(a*r+i*(r-1)))*.5,s=n*.46-62;for(let t=0;t<r;t++)this.cards.push({u:e[t],x:o+t*(a+i),y:s,w:a,h:124,appear:0,chosen:0,hover:0,seed:t*.37+.11})}update(e){if(this.state!==$){this.t+=e;for(let t=0;t<this.cards.length;t++){let n=this.cards[t],r=this.state===zn?S((this.t-t*.09)*3.2):n.appear;n.appear+=(r-n.appear)*Math.min(1,e*14),n.hover+=(0-n.hover)*Math.min(1,e*6)}if(this.state===Bn){for(let t=0;t<this.cards.length;t++){let n=this.cards[t],r=+(n.chosen>.5);n.appear+=(r-n.appear)*Math.min(1,e*7)}this.t>O.draft.closeTime&&(this.state=$,this.cards.length=0,this.onClosed?.())}}}cutWith(e,t,n,r){if(this.armed)for(let i=0;i<this.cards.length;i++){let a=this.cards[i];if(!(a.appear<.55)&&this.crossesBorder(a,e,t,n,r)){this.pick(i);return}}}hoverAt(e,t){if(this.armed)for(let n=0;n<this.cards.length;n++){let r=this.cards[n];e>=r.x&&e<=r.x+r.w&&t>=r.y&&t<=r.y+r.h&&(r.hover=Math.min(1,r.hover+.3))}}crossesBorder(e,t,n,r,i){let a=e.x,o=e.y,s=e.x+e.w,c=e.y+e.h;return P(t,n,r,i,a,o,s,o)>=0||P(t,n,r,i,s,o,s,c)>=0||P(t,n,r,i,s,c,a,c)>=0||P(t,n,r,i,a,c,a,o)>=0}pick(e){let t=this.cards[e];t.chosen=1,this.state=Bn,this.t=0,this.onPick?.(t.u)}get pickedX(){let e=this.cards.find(e=>e.chosen>.5);return e?e.x+e.w*.5:this.width*.5}get pickedY(){let e=this.cards.find(e=>e.chosen>.5);return e?e.y+e.h*.5:this.height*.5}render(e,t){if(this.state!==$){for(let n=0;n<this.cards.length;n++)this.renderCard(e,this.cards[n],t);if(this.state===zn){let n=`DRAW THROUGH ONE TO INSTALL`,r=N.measure(n,.5)*11,i=R.gridHot,a=A(O.draft.armDelay,O.draft.armDelay+.4,this.t)*(.5+.3*Math.sin(t*2.4));this.text(e,n,this.width*.5-r*.5,this.cards[0].y-44,11,.5,i[0],i[1],i[2],a,.9)}}}renderCard(e,t,n){let r=t.appear;if(r<.02)return;let i=t.u.tint,a=t.chosen,o=.75+t.hover*.9+a*2.2,s=r*(.85+t.hover*.15),c=A(0,1,r),l=t.x+t.w*.5,u=t.y+t.h*.5,d=t.w*.5*c,f=t.h*.5*c,p=Math.min(d,f)*.34,m=1.15+a*1.2,h=i[0],g=i[1],_=i[2],v=[[l-d,u-f,1,1],[l+d,u-f,-1,1],[l+d,u+f,-1,-1],[l-d,u+f,1,-1]];for(let[t,n,r,i]of v)e.add(t,n,t+p*r,n,m,h,g,_,s,o,0,3),e.add(t,n,t,n+p*i,m,h,g,_,s,o,0,3);let y=s*(.16+t.hover*.3);if(e.add(l-d,u-f,l+d,u-f,.6,h,g,_,y,.5,0,2.2),e.add(l+d,u-f,l+d,u+f,.6,h,g,_,y,.5,0,2.2),e.add(l+d,u+f,l-d,u+f,.6,h,g,_,y,.5,0,2.2),e.add(l-d,u+f,l-d,u-f,.6,h,g,_,y,.5,0,2.2),r<.6)return;let b=S((r-.6)/.4)*s,x=N.measure(t.u.name,.22)*15;this.text(e,t.u.name,l-x*.5,u-f+26,15,.22,h,g,_,b,1+a*2+t.hover*.6);let C=8.5,ee=Hn(t.u.desc,t.w-26,C,.42);for(let t=0;t<ee.length;t++){let n=N.measure(ee[t],.42)*C;this.text(e,ee[t],l-n*.5,u-f+54+t*C*1.9,C,.42,R.grid[0]+(h-R.grid[0])*.7,R.grid[1]+(g-R.grid[1])*.7,R.grid[2]+(_-R.grid[2])*.7,b*.9,.62)}if(t.u.max>1&&t.u.max<90){let r=B.level(t.u.id),i=t.u.max*9+(t.u.max-1)*5,a=u+f-16;for(let o=0;o<t.u.max;o++){let s=l-i*.5+o*14,c=o<r,u=o===r?.5+.5*Math.sin(n*4+t.seed*9):1;e.add(s,a,s+9,a,c?2:1,h,g,_,b*(c?1:.28)*u,c?1.2:.4,0,2.6)}}}text(e,t,n,r,i,a,o,s,c,l,u){let d=n;for(let n=0;n<t.length;n++){let f=t[n];for(let t of N.glyph(f))for(let n=0;n+3<t.length;n+=2)e.add(d+t[n]*i,r+t[n+1]*i,d+t[n+2]*i,r+t[n+3]*i,Math.max(1,i*.055),o,s,c,l,u,0,3.4);d+=(N.advance(f)+a)*i}}clear(){this.state=$,this.cards.length=0,this.t=0}};function Hn(e,t,n,r){let i=e.split(` `),a=[],o=``;for(let e of i){let i=o?`${o} ${e}`:e;N.measure(i,r)*n>t&&o?(a.push(o),o=e):o=i}return o&&a.push(o),a}var Un=class{traces;px;py;sp;pending=[];maxPoints;rng=new x(1013904242);wellActive=!1;wellX=0;wellY=0;wellT=0;w=1;h=1;constructor(e){this.traces=e;let t=O.mutator;this.maxPoints=O.trace.maxPoints,this.px=new Float32Array(t.pendingSlots*this.maxPoints),this.py=new Float32Array(t.pendingSlots*this.maxPoints),this.sp=new Float32Array(t.pendingSlots*this.maxPoints);for(let e=0;e<t.pendingSlots;e++)this.pending.push({active:!1,delay:0,count:0,ox:0,oy:0,sx:1,sy:1,normalOffset:0,birthShift:0})}resize(e,t){this.w=e,this.h=t}onTaken(e){e===`well`&&(this.wellActive=!0,this.wellT=0,this.wellX=this.w*this.rng.range(.3,.7),this.wellY=this.h*this.rng.range(.3,.7))}onRelease(e){if(e.count<2)return;let t=O.mutator;z.has(`prism`)&&(this.queue(e,0,0,0,1,1,t.prismOffset,0),this.queue(e,0,0,0,1,1,-t.prismOffset,0)),z.has(`axis`)&&this.queue(e,0,this.w,0,-1,1,0,0),z.has(`overflow`)&&this.queue(e,0,0,0,1,1,0,0),z.has(`echo`)&&this.queue(e,t.echoDelay,0,0,1,1,0,t.echoAgeAtBirth)}queue(e,t,n,r,i,a,o,s){let c=-1;for(let e=0;e<this.pending.length;e++)if(!this.pending[e].active){c=e;break}if(c<0)return;let l=this.pending[c],u=c*this.maxPoints,d=Math.min(e.count,this.maxPoints);for(let t=0;t<d;t++)this.px[u+t]=e.px[t],this.py[u+t]=e.py[t],this.sp[u+t]=e.pSpeed[t];l.active=!0,l.delay=t,l.count=d,l.ox=n,l.oy=r,l.sx=i,l.sy=a,l.normalOffset=o,l.birthShift=s,t<=0&&this.fire(c)}fire(e){let t=this.pending[e],n=e*this.maxPoints;this.traces.injectPoints(this.px,this.py,this.sp,t.count,t.ox,t.oy,t.sx,t.sy,t.normalOffset,t.birthShift,O.mutator.copyStride,n),t.active=!1}update(e){for(let t=0;t<this.pending.length;t++){let n=this.pending[t];n.active&&(n.delay-=e,n.delay<=0&&this.fire(t))}this.wellActive&&(this.wellT=S(this.wellT+e/O.mutator.wellRise))}wellForce(e,t,n){if(n[0]=0,n[1]=0,!this.wellActive)return;let r=O.mutator,i=this.wellX-e,a=this.wellY-t,o=Math.hypot(i,a);if(o<1||o>r.wellRadius)return;let s=o/r.wellRadius,c=4*s*(1-s),l=r.wellPull*c*this.wellT;n[0]=i/o*l,n[1]=a/o*l}clear(){for(let e=0;e<this.pending.length;e++)this.pending[e].active=!1;this.wellActive=!1,this.wellT=0}get pendingCount(){let e=0;for(let t=0;t<this.pending.length;t++)this.pending[t].active&&e++;return e}},Wn=new Float32Array(3),Gn=class{appear=0;shownIntegrity=1;shock=0;time=0;update(e,t,n,r){this.time+=e,this.appear+=(+!!n-this.appear)*Math.min(1,e*6),this.shownIntegrity+=(t-this.shownIntegrity)*Math.min(1,e*7),this.shock=Math.max(this.shock*Math.exp(-e*3.2),r*.85)}render(e,t,n,r,i,a){if(this.appear<.01)return;let o=this.appear,s=Math.max(22,t*.022),c=s+6;this.renderIntegrity(e,s,c,r,o),this.renderWave(e,t*.5,c,i,o),this.renderCombo(e,t-s,c,a,o),this.renderLoadout(e,s,n-s,o)}renderLoadout(e,t,n,r){let i=B.order,a=z.order,o=16.8,s=R.gridHot;for(let s=0;s<a.length;s++){let c=Ee(a[s]);c&&this.drawText(e,c.name,t,n-(i.length+a.length-s)*o-6,8,.36,c.tint[0],c.tint[1],c.tint[2],r*.85,1)}if(i.length!==0)for(let a=0;a<i.length;a++){let c=kn(i[a]);if(!c)continue;let l=B.level(c.id),u=l>1?`${c.name} ${`I`.repeat(Math.min(l,3))}`:c.name,d=a===i.length-1?1:.55;this.drawText(e,u,t,n-(i.length-a)*o,8,.36,s[0],s[1],s[2],r*.5*d,.55)}}renderIntegrity(e,t,n,r,i){xe((1-r)*4,Wn);let a=Wn[0],o=Wn[1],s=Wn[2],c=1-r;this.drawFracturedText(e,`INTEGRITY`,t,n,11,.34,R.grid[0]+(a-R.grid[0])*.55,R.grid[1]+(o-R.grid[1])*.55,R.grid[2]+(s-R.grid[2])*.55,i*.9,.85,c);let l=Math.max(0,Math.round(r*100)),u=22+c*6;this.drawText(e,String(l),t,n+23.1,u,.16,a,o,s,i,1.1+c*1.5);let d=n+23.1+u+9,f=this.shownIntegrity*10;for(let n=0;n<10;n++){let r=S(f-n);if(r<=.02&&this.shock<.02)continue;let c=t+n*16.5,l=r>.02,u=l?.8+r*1.2:.18,p=A(.34,0,this.shownIntegrity),m=l?Math.sin(this.time*17+n*1.7)*p*1.6:0;e.add(c,d+m,c+13*(l?Math.max(.25,r):1),d+m,2.4,l?a:R.grid[0],l?o:R.grid[1],l?s:R.grid[2],i*(l?1:.5),u,0,3.2)}}renderWave(e,t,n,r,i){if(r<=0)return;let a=R.gridHot,o=`WAVE`,s=N.measure(o,.42)*10;this.drawText(e,o,t-s*.5,n,10,.42,a[0],a[1],a[2],i*.8,.7);let c=String(r).padStart(2,`0`),l=N.measure(c,.2)*20;this.drawText(e,c,t-l*.5,n+22,20,.2,R.player[0],R.player[1],R.player[2],i,1)}renderCombo(e,t,n,r,i){if(r<2)return;let a=R.nodeHalo,o=18+Math.min(r,24)*.55,s=`x${r}`,c=N.measure(s,.18)*o,l=1+Math.exp(-(this.time*6%1)*6)*0;this.drawText(e,s,t-c,n,o*l,.18,a[0],a[1],a[2],i,1+Math.min(r,20)*.06)}drawText(e,t,n,r,i,a,o,s,c,l,u){let d=n;for(let n=0;n<t.length;n++){let f=t[n];for(let t of N.glyph(f))for(let n=0;n+3<t.length;n+=2)e.add(d+t[n]*i,r+t[n+1]*i,d+t[n+2]*i,r+t[n+3]*i,Math.max(1.1,i*.055),o,s,c,l,u,0,3.6);d+=(N.advance(f)+a)*i}}drawFracturedText(e,t,n,r,i,a,o,s,c,l,u,d){let f=S(d)*S(d),p=n;for(let n=0;n<t.length;n++){let d=t[n],m=ee(n*2654435761),h=f>.18+m*.72,_=(N.advance(d)+a)*i;if(!h){let t=(m-.5)*f*i*.55+Math.sin(this.time*9+n)*this.shock*1.6;this.drawText(e,d,p,r+t,i,0,o,s,c,l*g(1,.75,f),u)}p+=_*(1+f*.12)}}reset(){this.appear=0,this.shownIntegrity=1,this.shock=0}hit(){this.shock=1}static get maxIntegrity(){return B.maxIntegrity}},Kn=class{t=0;reset(){this.t=0}update(e,t){let n=+!!t;this.t+=(n-this.t)*Math.min(1,e*3.4)}render(e,t,n,r,i,a){if(this.t<.01)return;let o=this.t,s=t*.5,c=e=>A(0,1,S(o*4-e*.55)),l=n*.4,u=[[`WAVE`,String(r.wave).padStart(2,`0`)],[`KILLS`,String(r.kills)],[`TIME`,`${r.seconds.toFixed(1)}`],[`CHAIN`,`X${r.bestCombo}`]],d=132*u.length;for(let t=0;t<u.length;t++){let n=c(t*.12);if(n<=.01)continue;let r=s-d*.5+t*132+66,[i,a]=u[t];this.centred(e,i,r,l,9,R.grid,.7*n,.5),this.centred(e,a,r,l+26,26,R.player,n,1.2)}let f=c(.7);if(f>.01){this.centred(e,`HOW YOU PLAYED`,s,n*.55,11,R.gridHot,.75*f,.7);let t=n*.585,r=0,a=0;for(let e=0;e<6;e++)i.get(e)>r&&(r=i.get(e),a=e);for(let n=0;n<6;n++){let o=c(.7+n*.06);if(o<=.01)continue;let l=t+n*19,u=n===a&&r>O.parser.minHabit,d=u?R.enemyHot:R.grid,f=i.get(n),p=Q[n]??`?`,m=N.measure(p,.36)*8;this.text(e,p,s-95-12-m,l-3,8,.36,d,(u?.95:.5)*o,u?1.1:.5);let h=s-95;e.add(h,l,h+190,l,.6,d[0],d[1],d[2],.18*o,.3,0,2),f>.01&&e.add(h,l,h+190*S(f),l,u?2.6:1.6,d[0],d[1],d[2],(u?.95:.5)*o,u?1.7:.6,0,2.8)}}let p=c(1.25);if(p>.01){let t=z.order,r=B.order,i=n*.585+114+26;if(t.length>0)for(let n=0;n<t.length;n++){let r=Ee(t[n]);r&&(this.centred(e,r.name,s,i,11,r.tint,.9*p,1.1),i+=17)}if(r.length>0){let t=[];for(let e=0;e<r.length;e++){let n=kn(r[e]);if(!n)continue;let i=B.level(n.id);t.push(i>1?`${n.name} ${`I`.repeat(Math.min(i,3))}`:n.name)}this.centred(e,t.join(`   `),s,i+4,7.5,R.grid,.55*p,.45)}t.length===0&&r.length===0&&this.centred(e,`NOTHING INSTALLED`,s,i,9,R.grid,.45*p,.4)}let m=c(1.8);if(m>.01){let t=.55+.45*Math.sin(a*2.6);this.centred(e,`PRESS  R  TO  RETRACE`,s,n*.9,13,R.player,t*m,.9)}}centred(e,t,n,r,i,a,o,s){let c=.34,l=N.measure(t,c)*i;this.text(e,t,n-l*.5,r,i,c,a,o,s)}text(e,t,n,r,i,a,o,s,c){if(s<=.004)return;let l=n;for(let n=0;n<t.length;n++){let u=t[n];for(let t of N.glyph(u))for(let n=0;n+3<t.length;n+=2)e.add(l+t[n]*i,r+t[n+1]*i,l+t[n+2]*i,r+t[n+3]*i,Math.max(1,i*.055),o[0],o[1],o[2],s,c,0,3.4);l+=(N.advance(u)+a)*i}}},qn=class{open=!1;cursor=0;t=0;rows=[{label:`SCREEN SHAKE`,get:()=>O.a11y.screenShake,set:e=>{O.a11y.screenShake=e}},{label:`FLASH INTENSITY`,get:()=>O.a11y.flashIntensity,set:e=>{O.a11y.flashIntensity=e}},{label:`COLOUR SEPARATION`,get:()=>O.a11y.chromaticAberration,set:e=>{O.a11y.chromaticAberration=e}},{label:`PARTICLE DENSITY`,get:()=>O.a11y.particleDensity,set:e=>{O.a11y.particleDensity=e}},{label:`REDUCED MOTION`,get:()=>+!!O.a11y.reducedMotion,set:e=>{O.a11y.reducedMotion=e>.5},binary:!0}];volumeGet=null;volumeSet=null;toggle(){this.open=!this.open}key(e){if(!this.open)return!1;let t=this.rowCount;return e===`ArrowUp`?(this.cursor=(this.cursor+t-1)%t,!0):e===`ArrowDown`?(this.cursor=(this.cursor+1)%t,!0):e===`ArrowLeft`?(this.nudge(-1),!0):e===`ArrowRight`?(this.nudge(1),!0):e===`Escape`&&(this.open=!1,!0)}get rowCount(){return this.rows.length+ +!!this.volumeGet}nudge(e){if(this.cursor<this.rows.length){let t=this.rows[this.cursor];if(t.binary){t.set(t.get()>.5?0:1);return}t.set(S(Math.round((t.get()+e*.1)*10)/10));return}this.volumeGet&&this.volumeSet&&this.volumeSet(S(Math.round((this.volumeGet()+e*.1)*10)/10))}update(e){this.t+=(+!!this.open-this.t)*Math.min(1,e*9)}render(e,t,n){if(this.t<.01)return;let r=A(0,1,this.t),i=t*.5,a=this.rowCount,o=n*.5-a*26*.5;this.centred(e,`ACCESSIBILITY`,i,o-46,13,R.gridHot,.8*r,.8);for(let t=0;t<a;t++){let n=o+t*26,a=t===this.cursor,s=a?R.player:R.grid,c=t>=this.rows.length,l=c?`MASTER VOLUME`:this.rows[t].label,u=c?this.volumeGet?this.volumeGet():0:this.rows[t].get(),d=!c&&this.rows[t].binary===!0,f=N.measure(l,.34)*9;if(this.text(e,l,i-75-18-f,n-4,9,.34,s,(a?1:.55)*r,a?1.1:.5),d)this.text(e,u>.5?`ON`:`OFF`,i-75,n-4,9,.34,u>.5?R.stable:R.grid,(a?1:.6)*r,a?1.2:.5);else{let t=i-75;for(let i=0;i<10;i++){let o=u>(i+.5)/10,c=t+i*15;e.add(c,n,c+12,n,o?2.4:1,s[0],s[1],s[2],(o?a?1:.6:.18)*r,o?a?1.5:.7:.3,0,2.6)}}if(a){let t=i-75-18-f-16;e.add(t,n-8,t+8,n-4,1.4,s[0],s[1],s[2],r,1.4,0,2.8),e.add(t+8,n-4,t,n,1.4,s[0],s[1],s[2],r,1.4,0,2.8)}}this.centred(e,`ARROWS TO ADJUST      O TO CLOSE`,i,o+a*26+26,8,R.grid,.5*r,.4)}centred(e,t,n,r,i,a,o,s){let c=.42,l=N.measure(t,c)*i;this.text(e,t,n-l*.5,r,i,c,a,o,s)}text(e,t,n,r,i,a,o,s,c){if(s<=.004)return;let l=n;for(let n=0;n<t.length;n++){let u=t[n];for(let t of N.glyph(u))for(let n=0;n+3<t.length;n+=2)e.add(l+t[n]*i,r+t[n+1]*i,l+t[n+2]*i,r+t[n+3]*i,Math.max(1,i*.055),o[0],o[1],o[2],s,c,0,3.4);l+=(N.advance(u)+a)*i}}},Jn=`
precision highp float;

in vec3 position;    // unit quad, -1..1
in vec4 aP;          // x, y, size(px), life01 (1 = fresh)
in vec4 aC;          // r, g, b, elongation
in vec2 aM;          // angle(radians), seed

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

out vec2  vLocal;
out vec3  vColor;
out float vLife;
out float vElong;
out float vSeed;

void main() {
  vColor = aC.rgb;
  vLife  = aP.w;
  vElong = aC.w;
  vSeed  = aM.y;

  float c = cos(aM.x);
  float s = sin(aM.x);

  // Stretch along the particle's own axis before rotating into world space.
  vec2 local = position.xy * vec2(1.0 + vElong, 1.0);
  vLocal = local;

  vec2 rotated = vec2(local.x * c - local.y * s, local.x * s + local.y * c);
  vec2 p = aP.xy + rotated * aP.z;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 0.0, 1.0);
}
`,Yn=`
precision highp float;

in vec2  vLocal;
in vec3  vColor;
in float vLife;
in float vElong;
in float vSeed;

out vec4 fragColor;

${E}

/** Distance to a horizontal segment of half-length h, centred on the origin. */
float capsule(vec2 p, float h) {
  p.x -= clamp(p.x, -h, h);
  return length(p);
}

void main() {
  float d = capsule(vLocal, vElong);

  // Two-term falloff: a tight bright filament inside a soft halo. A single
  // gaussian gives the flat cotton-wool look that reads as stock particles.
  float coreW = mix(0.30, 0.16, vLife);
  float core = 1.0 - smoothstep(coreW, coreW + 0.16, d);
  float halo = exp(-d * d * 3.1);

  // Fresh particles are hotter than their own colour; they cool into it.
  vec3 hot = mix(vColor, vec3(1.0), vLife * 0.72);

  float fade = vLife * vLife;
  vec3 col = hot * core * (2.1 + vLife * 2.6) + vColor * halo * 0.85;
  col *= fade;

  float a = core + halo * 0.4;
  if (a * fade < 0.004) discard;

  fragColor = vec4(col, 1.0);
}
`,Xn=class{mesh;geometry;material;x;y;vx;vy;life;maxLife;size;elong;angle;spin;drag;cr;cg;cb;seed;alive;pArr;cArr;mArr;aP;aC;aM;cursor=0;rng=new x(439041101);liveCount=0;constructor(){let e=O.particles.max;this.x=new Float32Array(e),this.y=new Float32Array(e),this.vx=new Float32Array(e),this.vy=new Float32Array(e),this.life=new Float32Array(e),this.maxLife=new Float32Array(e),this.size=new Float32Array(e),this.elong=new Float32Array(e),this.angle=new Float32Array(e),this.spin=new Float32Array(e),this.drag=new Float32Array(e),this.cr=new Float32Array(e),this.cg=new Float32Array(e),this.cb=new Float32Array(e),this.seed=new Float32Array(e),this.alive=new Uint8Array(e),this.pArr=new Float32Array(e*4),this.cArr=new Float32Array(e*4),this.mArr=new Float32Array(e*2),this.geometry=new r,this.geometry.setAttribute(`position`,new M(new Float32Array([-1,-1,0,1,-1,0,1,1,0,-1,1,0]),3)),this.geometry.setIndex([0,1,2,0,2,3]),this.geometry.boundingSphere=new p(new l,1e7),this.aP=new v(this.pArr,4),this.aC=new v(this.cArr,4),this.aM=new v(this.mArr,2);for(let e of[this.aP,this.aC,this.aM])e.setUsage(I);this.geometry.setAttribute(`aP`,this.aP),this.geometry.setAttribute(`aC`,this.aC),this.geometry.setAttribute(`aM`,this.aM),this.geometry.instanceCount=0,this.material=new t({vertexShader:Jn,fragmentShader:Yn,glslVersion:T,uniforms:{},...F}),this.mesh=new a(this.geometry,this.material),this.mesh.frustumCulled=!1,this.mesh.renderOrder=D.particle}alloc(){let e=O.particles.max;for(let t=0;t<e;t++){let n=(this.cursor+t)%e;if(!this.alive[n])return this.cursor=(n+1)%e,n}let t=this.cursor;return this.cursor=(this.cursor+1)%e,t}spawn(e,t,n,r,i,a,o,s,c,l,u,d,f){let p=this.alloc();this.alive[p]=1,this.x[p]=e,this.y[p]=t,this.vx[p]=n,this.vy[p]=r,this.life[p]=i,this.maxLife[p]=i,this.size[p]=a,this.elong[p]=o,this.angle[p]=d,this.spin[p]=f,this.drag[p]=u,this.cr[p]=s,this.cg[p]=c,this.cb[p]=l,this.seed[p]=this.rng.next()}budget(e){return Math.max(1,Math.round(e*O.particles.density*O.a11y.particleDensity))}burst(e,t,n,r,i,a,o,s=.5,c=2.4){let l=this.budget(n);for(let n=0;n<l;n++){let n=this.rng.next()*Math.PI*2,l=r*(.18+this.rng.next()*this.rng.next()*1.5);this.spawn(e,t,Math.cos(n)*l,Math.sin(n)*l,s*(.6+this.rng.next()*.8),c*(.6+this.rng.next()*.9),0,i,a,o,O.particles.drag,n,0)}}shard(e,t,n,r,i,a,o,s,c,l,u=.6){let d=Math.atan2(r,n),f=this.budget(i);for(let n=0;n<f;n++){let n=d+this.rng.spread(o),r=a*(.35+this.rng.next()*1.1);this.spawn(e,t,Math.cos(n)*r,Math.sin(n)*r,u*(.55+this.rng.next()*.9),1.5+this.rng.next()*1.6,1.6+this.rng.next()*3.4,s,c,l,O.particles.drag*.7,n,this.rng.spread(2.2))}}implode(e,t,n,r,i,a,o,s=.24){let c=this.budget(r);for(let r=0;r<c;r++){let r=this.rng.next()*Math.PI*2,c=n*(.35+this.rng.next()*.85),l=e+Math.cos(r)*c,u=t+Math.sin(r)*c,d=c/s,f=d*.42*(this.rng.next()<.5?-1:1);this.spawn(l,u,-Math.cos(r)*d-Math.sin(r)*f,-Math.sin(r)*d+Math.cos(r)*f,s*(.85+this.rng.next()*.4),1.7+this.rng.next()*1.5,.9+this.rng.next()*1.4,i,a,o,.2,r,0)}}ember(e,t,n,r,i,a,o,s=.42){O.a11y.particleDensity<=0||this.spawn(e,t,n,r,s,1.1+this.rng.next()*1,.3+this.rng.next()*.9,i,a,o,3.2,Math.atan2(r,n),0)}update(e,t){let n=O.particles.max,r=O.field.pullAccel,i=B.fieldTimeScale,a=t?t.count:0,o=0;for(let s=0;s<n;s++){if(!this.alive[s])continue;let n=1,c=0,l=0;for(let e=0;e<a;e++){let a=t.cx[e]-this.x[s],o=t.cy[e]-this.y[s],u=a*a+o*o,d=t.r2[e];if(u>=d)continue;n=i;let f=Math.sqrt(u);if(f>.001){let e=r*f/Math.sqrt(d);c+=a/f*e,l+=o/f*e}break}let u=e*n;if(this.life[s]=this.life[s]-u,this.life[s]<=0){this.alive[s]=0;continue}this.vx[s]=this.vx[s]+c*u,this.vy[s]=this.vy[s]+l*u;let d=Math.exp(-this.drag[s]*u);this.vx[s]=this.vx[s]*d,this.vy[s]=this.vy[s]*d,this.x[s]=this.x[s]+this.vx[s]*u,this.y[s]=this.y[s]+this.vy[s]*u,this.angle[s]=this.angle[s]+this.spin[s]*u;let f=this.life[s]/this.maxLife[s];this.pArr[o*4]=this.x[s],this.pArr[o*4+1]=this.y[s],this.pArr[o*4+2]=this.size[s],this.pArr[o*4+3]=f,this.cArr[o*4]=this.cr[s],this.cArr[o*4+1]=this.cg[s],this.cArr[o*4+2]=this.cb[s],this.cArr[o*4+3]=this.elong[s],this.mArr[o*2]=this.angle[s],this.mArr[o*2+1]=this.seed[s],o++}this.liveCount=o,this.geometry.instanceCount=o,o>0&&(this.aP.needsUpdate=!0,this.aC.needsUpdate=!0,this.aM.needsUpdate=!0)}clear(){this.alive.fill(0),this.liveCount=0,this.geometry.instanceCount=0}dispose(){this.geometry.dispose(),this.material.dispose()}},Zn=class{bus;particles;segments=[];debris;intact=!0;cutCount=0;liveSegments=0;alpha=1;tint=R.glyph;weight=1;constructor(e,t){this.bus=e,this.particles=t,this.debris=new fn(t,512)}setText(e,t,n,r,i=.12){this.segments.length=0,this.intact=!0,this.cutCount=0;let a=t-N.measure(e,i)*r/2,o=n-r/2;for(let t=0;t<e.length;t++){let n=e[t],s=N.glyph(n);for(let e of s)for(let t=0;t+3<e.length;t+=2)this.segments.push({x0:a+e[t]*r,y0:o+e[t+1]*r,x1:a+e[t+2]*r,y1:o+e[t+3]*r,alive:!0,proximity:0});a+=(N.advance(n)+i)*r}this.liveSegments=this.segments.length}clearText(){this.segments.length=0,this.liveSegments=0}cutWith(e,t,n,r){if(this.segments.length===0)return;let i=n-e,a=r-t,o=Math.hypot(i,a);if(o<1e-4)return;i/=o,a/=o;let s=-a,c=i;for(let i=this.segments.length-1;i>=0;i--){let a=this.segments[i];if(!a.alive)continue;let o=P(e,t,n,r,a.x0,a.y0,a.x1,a.y1);if(o<0)continue;let l=e+(n-e)*o,u=t+(r-t)*o;a.alive=!1,this.cutCount++,this.intact=!1,this.debris.spawn(a.x0,a.y0,l,u,s,c,-1,this.tint,this.weight),this.debris.spawn(l,u,a.x1,a.y1,s,c,1,this.tint,this.weight);let d=R.glyphCut;this.particles.shard(l,u,s,c,7,240,.9,d[0],d[1],d[2],.5),this.particles.shard(l,u,-s,-c,7,240,.9,d[0],d[1],d[2],.5),this.bus.emit(`glyphCut`,{x:l,y:u,nx:s,ny:c,fragments:2})}this.liveSegments=this.segments.reduce((e,t)=>e+ +!!t.alive,0)}update(e){this.debris.update(e)}updateProximity(e,t){for(let n=0;n<this.segments.length;n++){let r=this.segments[n];if(!r.alive)continue;let i=e((r.x0+r.x1)*.5,(r.y0+r.y1)*.5),a=S(1-i/120);r.proximity+=(a-r.proximity)*Math.min(1,t*9)}}render(e,t){if(this.alpha<=.002)return;let n=this.tint,r=R.glyphCut,i=O.glyph.halfWidth*this.weight;for(let t=0;t<this.segments.length;t++){let a=this.segments[t];if(!a.alive)continue;let o=a.proximity,s=n[0]+(r[0]-n[0])*o,c=n[1]+(r[1]-n[1])*o,l=n[2]+(r[2]-n[2])*o,u=.4+o*1.6;e.add(a.x0,a.y0,a.x1,a.y1,i+o*.7,s,c,l,this.alpha,u,t*.137%1,3.4)}this.debris.render(e,this.alpha)}get debrisCount(){return this.debris.count}clear(){this.debris.clear(),this.segments.length=0,this.liveSegments=0}},Qn=6,$n=320,er=class{lines=[];constructor(){for(let e=0;e<Qn;e++)this.lines.push({active:!1,seg:new Float32Array($n*4),count:0,age:0,life:1,x:0,y:0,r:1,g:1,b:1,drift:-34})}show(e,t,n,r,i=R.node,a=1.5){let o=-1,s=-1,c=-1;for(let e=0;e<this.lines.length;e++){if(!this.lines[e].active){o=e;break}this.lines[e].age>c&&(c=this.lines[e].age,s=e)}if(o<0&&(o=s),o<0)return;let l=this.lines[o],u=.26,d=t-N.measure(e,u)*r/2,f=n-r/2,p=0;for(let t=0;t<e.length;t++){let n=e[t];for(let e of N.glyph(n))for(let t=0;t+3<e.length&&p<$n;t+=2)l.seg[p*4]=d+e[t]*r,l.seg[p*4+1]=f+e[t+1]*r,l.seg[p*4+2]=d+e[t+2]*r,l.seg[p*4+3]=f+e[t+3]*r,p++;d+=(N.advance(n)+u)*r}l.count=p,l.active=!0,l.age=0,l.life=a,l.x=0,l.y=0,l.r=i[0],l.g=i[1],l.b=i[2],l.drift=-34}update(e){for(let t=0;t<this.lines.length;t++){let n=this.lines[t];n.active&&(n.age+=e,n.y+=n.drift*e,n.drift*=Math.exp(-2.4*e),n.age>n.life&&(n.active=!1))}}render(e){for(let t=0;t<this.lines.length;t++){let n=this.lines[t];if(!n.active)continue;let r=n.age/n.life,i=S(n.age/(n.life*.22)),a=1-A(.62,1,r),o=1+Math.exp(-n.age*9)*.16,s=0,c=0;for(let e=0;e<n.count;e++)s+=n.seg[e*4]+n.seg[e*4+2],c+=n.seg[e*4+1]+n.seg[e*4+3];s/=Math.max(1,n.count*2),c/=Math.max(1,n.count*2);for(let t=0;t<n.count;t++){let r=S(i*n.count-t);if(r<=.001)continue;let l=s+(n.seg[t*4]-s)*o,u=c+(n.seg[t*4+1]-c)*o+n.y,d=s+(n.seg[t*4+2]-s)*o,f=c+(n.seg[t*4+3]-c)*o+n.y,p=l+(d-l)*r,m=u+(f-u)*r;e.add(l,u,p,m,2.2,n.r,n.g,n.b,a,1.5+(1-r)*2.5,t*.393%1)}}}get activeCount(){let e=0;for(let t=0;t<this.lines.length;t++)this.lines[t].active&&e++;return e}clear(){for(let e=0;e<this.lines.length;e++)this.lines[e].active=!1}},tr=`traceStart.traceRelease.intersection.fieldForm.fieldDetonate.glyphCut.traceExpire.comboBreak.enemySpawn.enemyCharge.enemyKill.playerHit.waveStart.waveClear.runEnd.cutterSpawn.cutterFeed.cutterKill.leechSpawn.leechAttach.leechKill.mirrorSpawn.mirrorStrike.mirrorKill.wordSpawn.wordCut.wordKill.mutatorTake.parserArrive.parserRead.parserCut.parserBreak.draftOffer.draftPick`.split(`.`),nr=[`TITLE`,`PLAYING`,`DYING`,`RESULT`,`DRAFT`],rr=class{el;on=!1;acc=0;cachedFps=0;cachedP99=0;constructor(e){this.el=e}toggle(){this.on=!this.on,this.el.classList.toggle(`on`,this.on)}get visible(){return this.on}update(e){if(!this.on)return;if(this.acc+=e.clock.realDt,this.acc>.25){this.acc=0;let t=e.clock.avgFrameMs;this.cachedFps=t>0?1e3/t:0,this.cachedP99=e.clock.p99FrameMs}let t=(e,t)=>`${e}/${t}`,n=(e,t,n=10)=>{let r=Math.min(n,Math.round(e/Math.max(1,t)*n));return`#`.repeat(r)+`.`.repeat(n-r)},r=``;for(let t of tr){let n=e.bus.subscriberCount(t),i=e.bus.counts.get(t)??0;r+=`  ${n>0?`ok `:`GAP`} ${t.padEnd(15)} x${i}\n`}let i=[`TRACE//BREAK  phase 1        [F1] hide  [R] reset  [M] mute`,``,`FRAME   ${this.cachedFps.toFixed(1).padStart(6)} fps   ${e.clock.avgFrameMs.toFixed(2)} ms avg   ${this.cachedP99.toFixed(2)} ms p99`,`        sim ${e.simMs.toFixed(2)} ms   scale ${e.clock.timeScale.toFixed(2)}${e.clock.inHitstop?`  HITSTOP`:``}`,`VIEW    ${e.width}x${e.height} @${e.pixelRatio.toFixed(2)}  buffer ${Math.round(e.width*e.pixelRatio)}x${Math.round(e.height*e.pixelRatio)}`,e.shaderErrors.length>0?`SHADER  ${e.shaderErrors.length} COMPILE FAILURE(S) -- see console`:`SHADER  all programs ok`,`GPU     ${e.info.render.calls} calls   ${e.info.render.triangles} tris   ${e.info.memory.geometries} geo  ${e.info.memory.textures} tex`,``,`POOL`,`  traces    ${t(e.traces.liveTraces,O.trace.maxTraces).padEnd(10)} ${n(e.traces.liveTraces,O.trace.maxTraces)}`,`  points    ${String(e.traces.livePoints).padEnd(10)} hash ${e.traces.hash.entries} (${(e.traces.hash.load*100).toFixed(0)}%) grid ${e.traces.hash.gridCols}x${e.traces.hash.gridRows}`+(e.traces.hash.gridCols===0?`  <-- UNSIZED`:``),`  nodes     ${t(e.nodes.liveNodes,O.node.maxNodes).padEnd(10)} ${n(e.nodes.liveNodes,O.node.maxNodes)}`,`  fields    ${t(e.fields.liveFields,O.field.maxFields).padEnd(10)} ${n(e.fields.liveFields,O.field.maxFields)}`,`  enemies   ${t(e.enemies.liveCount,O.enemy.max).padEnd(10)} ${n(e.enemies.liveCount,O.enemy.max)} threat ${e.enemies.threatCount}`,`  cutters   ${t(e.cutters.liveCount,O.enemy.max).padEnd(10)} ${n(e.cutters.liveCount,O.enemy.max)} threat ${e.cutters.threatCount}`,`  leeches   ${t(e.leeches.liveCount,O.enemy.max).padEnd(10)} ${n(e.leeches.liveCount,O.enemy.max)} threat ${e.leeches.threatCount}`,`  mirrors   ${t(e.mirrors.liveCount,O.enemy.mirror.max).padEnd(10)} ${n(e.mirrors.liveCount,O.enemy.mirror.max)} threat ${e.mirrors.threatCount}  memory ${e.mirrors.memoryCount}/${O.enemy.mirror.memory}`+(e.mirrors.memoryCount===0?`  <-- NOTHING TO REPLAY`:``),`  words     ${t(e.words.liveCount,O.enemy.word.max).padEnd(10)} ${n(e.words.liveCount,O.enemy.word.max)} threat ${e.words.threatCount}  strokes cut ${e.words.cuts}  debris ${e.words.debrisCount}`,`  particles ${t(e.particles.liveCount,O.particles.max).padEnd(10)} ${n(e.particles.liveCount,O.particles.max)}`,`  segments  ${t(e.segments.count,4096).padEnd(10)} glyph ${e.glyphs.liveSegments} debris ${e.glyphs.debrisCount}`,``,`RUN     ${(nr[e.director.phase]??`?`).padEnd(8)} wave ${e.director.wave}  integrity ${Math.round(e.director.integrity)}  kills ${e.enemies.kills+e.cutters.kills+e.leeches.kills+e.mirrors.kills+e.words.kills} (needle ${e.enemies.kills}, cutter ${e.cutters.kills}, leech ${e.leeches.kills}, mirror ${e.mirrors.kills}, word ${e.words.kills})  t ${e.director.runTime.toFixed(1)}s`+(e.director.invuln>0?`  INVULN`:``),`BUILD   decay x${B.decayScale.toFixed(2)}  cut<=${B.killState.toFixed(2)}  hp ${B.maxIntegrity}  iframe ${B.invulnTime.toFixed(2)}s  self x${B.hostileDamageMul.toFixed(2)}  field ${B.fieldTimeScale.toFixed(2)}/${B.fieldLife.toFixed(1)}s`+(B.blastKill?`  BLAST`:``),`THREAT  speed x${(V.speedMul*B.enemySpeedMul).toFixed(2)}  dmg x${V.damageMul.toFixed(2)}  aim ${V.aimTime.toFixed(2)}s  drain x${V.drainMul.toFixed(2)}`,`TAKEN   ${B.order.length===0?`-`:B.order.map(e=>`${e}${B.level(e)>1?B.level(e):``}`).join(` `)}`,`PROFILE ${Array.from({length:6},(t,n)=>`${(Q[n]??`?`).split(` `)[0].slice(0,5)} ${e.profile.get(n).toFixed(2)}`).join(`  `)}${e.profile.ready?``:`  <-- TOO FEW STROKES`}`,`PARSER  ${e.parser.active?`state ${e.parser.state}  ring ${e.parser.intact}/${e.parser.spokes.length}  read ${e.parser.read>=0?Q[e.parser.read]??`?`:`none`}  counter ${e.parser.counter>=0?_n[e.parser.counter]??`?`:`-`}`:`absent`}`,`MUTATE  ${z.order.length===0?`-`:z.order.join(` `)}`+(e.mutators.pendingCount>0?`   pending ${e.mutators.pendingCount}`:``)+(e.mutators.wellActive?`   well ${Math.round(e.mutators.wellX)},${Math.round(e.mutators.wellY)}`:``),`PLAY    combo ${e.nodes.combo} (best ${e.nodes.comboBest})   tests ${e.nodes.testsThisFrame}/frame`,`        nodes ${e.stats.nodesMade}  fields ${e.stats.fieldsMade}  blasts ${e.stats.detonations}  cuts ${e.stats.cuts}`,`AUDIO   ${e.audio.ready?e.audio.enabled?`on`:`muted`:`locked`}   voices ${e.audio.activeVoices}`,``,`MATRIX  (subscriber count per gameplay event)`,r.trimEnd()];this.el.textContent=i.join(`
`)}},ir=16,ar=class{clock=new me;bus=new Ce;renderer;input;traces;nodes;fields;particles=new Xn;glyphs;hint;callout=new er;camera=new pe;audio=new de;enemies;cutters;leeches;mirrors;words;draft=new Vn;mutators;profile=new gn;parser;director;hud=new Gn;result=new Kn;settings=new qn;background;traceRenderer;nodeRenderer;fieldRenderer;segments;enemyRenderer;cutterRenderer;leechRenderer;playerRenderer;debug;core;drawingSmooth=0;denied=0;playerEnergy=0;dirX=1;dirY=0;fieldCx=new Float32Array(ir);fieldCy=new Float32Array(ir);fieldR2=new Float32Array(ir);fieldInfluence;running=!1;rafId=0;disposers=[];stats={nodesMade:0,fieldsMade:0,detonations:0,cuts:0};hasDrawnOnce=!1;simMs=0;shaderErrors=[];shaderCheckDone=!1;hostileTick=0;shownSelfDamageHint=!1;lastResult={wave:0,kills:0,seconds:0,bestCombo:0};constructor(e,t){this.renderer=new jt(e),this.input=new ye(this.renderer.canvas),this.traces=new Ae(this.clock,this.bus),this.nodes=new je(this.traces,this.clock,this.bus),this.fields=new St(this.clock,this.bus),this.glyphs=new Zn(this.bus,this.particles),this.hint=new Zn(this.bus,this.particles),this.hint.tint=R.grid,this.hint.weight=.62,this.enemies=new Xt(this.traces,this.clock,this.bus),this.cutters=new nn(this.traces,this.nodes,this.clock,this.bus),this.leeches=new ln(this.traces,this.clock,this.bus),this.mirrors=new un(this.traces,this.clock,this.bus),this.words=new pn(this.traces,this.clock,this.bus,this.particles),this.mutators=new Un(this.traces),this.parser=new vn(this.traces,this.clock,this.bus,this.profile),this.parser.commands={needle:(e,t)=>{let n=this.enemies.spawn();n&&(n.x=e+(Math.random()-.5)*260,n.y=t+(Math.random()-.5)*260)},cutter:()=>{this.cutters.spawn()},leech:()=>{this.leeches.spawn()},mirror:()=>{this.mirrors.spawn()}},this._wellLists=[this.enemies.enemies,this.cutters.cutters,this.leeches.leeches,this.words.words],this.director=new Rn(this.enemies,this.cutters,this.leeches,this.mirrors,this.words,this.parser,this.draft,this.mutators,this.bus),this.background=new Mt(this.renderer.influenceTexture),this.traceRenderer=new It(this.traces),this.nodeRenderer=new Bt(this.nodes),this.fieldRenderer=new Gt(this.fields),this.segments=new he(4096,D.glyph),this.enemyRenderer=new tn(this.enemies),this.cutterRenderer=new cn(this.cutters),this.leechRenderer=new En(this.leeches),this.playerRenderer=new Yt,this.fieldInfluence={count:0,cx:this.fieldCx,cy:this.fieldCy,r2:this.fieldR2},this.core=new se(0,0,{stiffness:O.player.followStiffness,damping:O.player.followDamping});let n=this.renderer.world;n.add(this.background.mesh),n.add(this.fieldRenderer.mesh),n.add(this.segments.mesh),n.add(this.traceRenderer.mesh),n.add(this.enemyRenderer.mesh),n.add(this.cutterRenderer.mesh),n.add(this.leechRenderer.mesh),n.add(this.nodeRenderer.mesh),n.add(this.particles.mesh),n.add(this.playerRenderer.mesh);let r=this.renderer.influence;r.add(this.fieldRenderer.influenceMesh),r.add(this.segments.influenceMesh),r.add(this.traceRenderer.influenceMesh),r.add(this.enemyRenderer.influenceMesh),r.add(this.cutterRenderer.influenceMesh),r.add(this.leechRenderer.influenceMesh),r.add(this.nodeRenderer.influenceMesh),this.debug=new rr(t),this.nodes.onSelfLoop=(e,t,n)=>this.fields.createFromLoop(e,t,n),this.input.onFirstGesture=()=>{this.audio.init(),this.audio.resume()},this.settings.volumeGet=()=>this.audio.volume01,this.settings.volumeSet=e=>{this.audio.setVolume(e)},this.wireEvents(),this.attachWindowEvents(),this.resize(),this.layoutText()}wireEvents(){let e=R;this.bus.on(`traceStart`,t=>{this.particles.burst(t.x,t.y,7,150,e.stable[0],e.stable[1],e.stable[2],.32,1.9),this.audio.traceStart(),this.playerEnergy=Math.min(1,this.playerEnergy+.2)}),this.bus.on(`traceRelease`,t=>{this.audio.traceRelease(t.length,t.avgSpeed01),this.particles.burst(t.x,t.y,4+Math.round(t.avgSpeed01*8),90+t.avgSpeed01*260,e.stable[0],e.stable[1],e.stable[2],.3,1.6),this.hasDrawnOnce=!0;let n=this.traces.released;n&&(this.profile.observeStroke(n.length,n.avgCurvature,n.avgSpeed,n.px[n.count>>1]??0,n.py[n.count>>1]??0,this.renderer.width,this.renderer.height),this.mirrors.record(n),this.mutators.onRelease(n))}),this.bus.on(`intersection`,t=>{this.stats.nodesMade++,this.profile.observeCrossing();let n=.35+t.sharpness*.65;if(this.particles.burst(t.x,t.y,Math.round(9+t.sharpness*14+Math.min(t.combo,8)*1.6),200+t.sharpness*320,e.nodeHalo[0],e.nodeHalo[1],e.nodeHalo[2],.42,2+t.sharpness),this.camera.kick(t.x-this.core.x.value,t.y-this.core.y.value,w.kickSmall*n*(1+Math.min(t.combo,10)*.09)),t.sharpness>.75&&t.combo>=4&&this.clock.requestHitstop(j.minor,.12),this.audio.intersection(t.combo,t.sharpness),this.playerEnergy=Math.min(1,this.playerEnergy+.12*n),z.has(`fractal`)){let n=O.mutator,r=O.node.graceTime+1.4;for(let e=0;e<n.fractalChildren;e++){let i=e/n.fractalChildren*Math.PI*2+t.sharpness*2.4;this.nodes.spawnDerived(t.x+Math.cos(i)*n.fractalRadius,t.y+Math.sin(i)*n.fractalRadius,t.sharpness*.6,t.combo,i,i+Math.PI*.5,r)}this.particles.burst(t.x,t.y,8,260,e.node[0],e.node[1],e.node[2],.35,1.7)}}),this.bus.on(`fieldForm`,t=>{this.stats.fieldsMade++,this.profile.observeLoop(),this.particles.burst(t.x,t.y,30,320,e.field[0],e.field[1],e.field[2],.65,2.6),this.camera.zoomPunch(w.zoomPunch*(.7+t.circularity)),this.camera.kick(0,-1,w.kickSmall*1.4),this.clock.requestHitstop(j.major,.06),this.audio.fieldForm(t.area,t.circularity),this.playerEnergy=Math.min(1,this.playerEnergy+.45),t.circularity>O.field.cleanLoopCircularity&&this.callout.show(`PERFECT CIRCUIT`,t.x,t.y-t.radius-26,20,e.field,1.35)}),this.bus.on(`fieldDetonate`,t=>{this.stats.detonations++,this.particles.burst(t.x,t.y,46,900,e.field[0],e.field[1],e.field[2],.85,3),this.particles.burst(t.x,t.y,26,380,e.node[0],e.node[1],e.node[2],.5,2),this.camera.shake(9+Math.min(10,t.captured)*1.1,.3),this.camera.zoomPunch(-w.zoomPunch*2.4),this.clock.requestHitstop(j.major,.05),this.audio.fieldDetonate(t.area,t.captured),t.captured>=3&&this.callout.show(`NODE CASCADE ${t.captured}`,t.x,t.y-34,22,e.node,1.5)}),this.bus.on(`glyphCut`,e=>{this.stats.cuts++,this.camera.kick(e.nx,e.ny,w.kickSmall*.5),this.audio.glyphCut()}),this.bus.on(`traceExpire`,t=>{this.particles.burst(t.x,t.y,6,60,e.hostile[0],e.hostile[1],e.hostile[2],.7,1.5),this.audio.traceExpire()}),this.bus.on(`comboBreak`,e=>{this.audio.comboBreak(e.combo)}),this.bus.on(`enemySpawn`,t=>{this.particles.burst(t.x,t.y,5,90,e.enemy[0],e.enemy[1],e.enemy[2],.4,1.7),this.audio.enemySpawn()}),this.bus.on(`enemyCharge`,t=>{this.particles.shard(t.x,t.y,-t.dirX,-t.dirY,9,320,.5,e.enemyHot[0],e.enemyHot[1],e.enemyHot[2],.4),this.audio.enemyCharge()}),this.bus.on(`enemyKill`,t=>{this.particles.shard(t.x,t.y,t.dirX,t.dirY,11,420,.35,e.enemy[0],e.enemy[1],e.enemy[2],.55),this.particles.shard(t.x,t.y,-t.dirX,-t.dirY,11,420,.35,e.enemy[0],e.enemy[1],e.enemy[2],.55),this.particles.burst(t.x,t.y,t.charging?18:10,t.charging?460:260,e.enemyHot[0],e.enemyHot[1],e.enemyHot[2],.42,2),this.camera.kick(t.dirX,t.dirY,t.charging?w.kickMedium:w.kickSmall),t.charging&&this.clock.requestHitstop(j.minor,.1),this.audio.enemyKill(t.charging),this.playerEnergy=Math.min(1,this.playerEnergy+.18)}),this.bus.on(`playerHit`,t=>{this.hud.hit(),this.camera.kick(t.dirX,t.dirY,w.kickLarge),this.camera.shake(7,.22),this.clock.requestHitstop(j.major,.07),this.particles.burst(t.x,t.y,26,380,e.warning[0],e.warning[1],e.warning[2],.55,2.4),this.particles.shard(t.x,t.y,t.dirX,t.dirY,8,520,.2,e.warning[0],e.warning[1],e.warning[2],.3),this.audio.playerHit(t.integrity01,t.selfInflicted),this.callout.show(t.selfInflicted?`OLD TRACE`:`NEEDLE`,t.x,t.y-24,10,t.selfInflicted?e.hostile:e.enemyHot,.6),t.selfInflicted&&!this.shownSelfDamageHint&&(this.shownSelfDamageHint=!0,this.callout.show(`YOUR OWN TRACE HURT YOU`,t.x,t.y-48,15,e.hostile,1.6))}),this.bus.on(`waveStart`,e=>{this.audio.waveStart(e.wave),this.camera.zoomPunch(-w.zoomPunch*.8)}),this.bus.on(`waveClear`,t=>{this.audio.waveClear(),t.wave>=2&&this.callout.show(`WAVE ${t.wave} CLEAR`,this.renderer.width*.5,this.renderer.height*.34,17,e.nodeHalo,1.25)}),this.bus.on(`cutterSpawn`,t=>{this.particles.burst(t.x,t.y,5,90,e.enemy[0],e.enemy[1],e.enemy[2],.4,1.7)}),this.bus.on(`cutterFeed`,t=>{this.particles.implode(t.x,t.y,22,20,e.enemyHot[0],e.enemyHot[1],e.enemyHot[2],.18),this.audio.cutterFeed()}),this.bus.on(`cutterKill`,t=>{this.particles.burst(t.x,t.y,10+Math.min(t.fed,4)*3,280,e.enemy[0],e.enemy[1],e.enemy[2],.4,1.8),this.camera.kick(1,0,w.kickSmall*.7),this.audio.cutterKill(t.fed),this.playerEnergy=Math.min(1,this.playerEnergy+.1)}),this.bus.on(`leechSpawn`,t=>{this.particles.burst(t.x,t.y,5,90,e.enemy[0],e.enemy[1],e.enemy[2],.4,1.7)}),this.bus.on(`leechAttach`,t=>{this.particles.burst(t.x,t.y,6,70,e.enemy[0],e.enemy[1],e.enemy[2],.35,1.3),this.audio.leechAttach()}),this.bus.on(`leechKill`,t=>{this.particles.burst(t.x,t.y,8+Math.min(t.drained,4)*2,240,e.enemy[0],e.enemy[1],e.enemy[2],.38,1.6),this.camera.kick(1,0,w.kickSmall*.6),this.audio.leechKill(t.drained),this.playerEnergy=Math.min(1,this.playerEnergy+.08)}),this.bus.on(`mirrorSpawn`,()=>{this.audio.mirrorSpawn()}),this.bus.on(`mirrorStrike`,t=>{this.particles.burst(t.x,t.y,8,200,e.enemyHot[0],e.enemyHot[1],e.enemyHot[2],.34,2),this.audio.mirrorStrike()}),this.bus.on(`mirrorKill`,t=>{t.earned?(this.particles.burst(t.x,t.y,14+Math.round((1-t.progress01)*10),380,e.enemyHot[0],e.enemyHot[1],e.enemyHot[2],.45,2.2),this.camera.kick(0,-1,w.kickSmall*.9),this.playerEnergy=Math.min(1,this.playerEnergy+.14)):this.particles.burst(t.x,t.y,4,90,e.grid[0],e.grid[1],e.grid[2],.3,1),this.audio.mirrorKill(t.earned)}),this.bus.on(`wordSpawn`,t=>{let n=t.kind===0?e.unstable:t.kind===1?e.warning:e.fieldDeep;this.particles.burst(t.x,t.y,16,260,n[0],n[1],n[2],.5,2),this.audio.wordSpawn(t.kind),this.callout.show(t.text,t.x,t.y-52,12,n,1.1)}),this.bus.on(`wordCut`,t=>{let n=e.glyphCut;this.particles.shard(t.x,t.y,t.nx,t.ny,5,220,.8,n[0],n[1],n[2],.4),this.particles.shard(t.x,t.y,-t.nx,-t.ny,5,220,.8,n[0],n[1],n[2],.4),this.audio.wordCut(1-t.remaining01),this.stats.cuts++}),this.bus.on(`wordKill`,t=>{let n=t.kind===0?e.unstable:t.kind===1?e.warning:e.fieldDeep;if(!t.earned){this.particles.burst(t.x,t.y,6,140,e.grid[0],e.grid[1],e.grid[2],.4,1);return}this.particles.burst(t.x,t.y,34,520,n[0],n[1],n[2],.6,2.6),this.particles.implode(t.x,t.y,90,22,n[0],n[1],n[2],.26),this.camera.kick(0,-1,w.kickMedium),this.camera.zoomPunch(-w.zoomPunch*.9),this.clock.requestHitstop(j.major,.06),this.audio.wordKill(t.kind),this.callout.show(`${t.text}  CLEARED`,t.x,t.y-44,15,n,1.3),this.playerEnergy=Math.min(1,this.playerEnergy+.35)}),this.bus.on(`draftOffer`,()=>{this.camera.zoomPunch(-w.zoomPunch*.5),this.audio.draftOffer()}),this.bus.on(`draftPick`,e=>{let t=e.tint;this.particles.burst(e.x,e.y,26,340,t[0],t[1],t[2],.55,2.4),this.particles.implode(e.x,e.y,70,18,t[0],t[1],t[2],.3),this.camera.kick(0,-1,w.kickSmall*1.2),this.clock.requestHitstop(j.minor,.08),this.audio.draftPick(e.level),this.callout.show(e.level>1?`${e.name}  ${`I`.repeat(Math.min(e.level,3))}`:e.name,e.x,e.y-78,17,e.tint,1.5),this.playerEnergy=Math.min(1,this.playerEnergy+.5)}),this.bus.on(`parserArrive`,t=>{this.particles.implode(t.x,t.y,340,60,e.enemyHot[0],e.enemyHot[1],e.enemyHot[2],.55),this.camera.pull(t.x,t.y,w.pull),this.camera.zoomPunch(-w.zoomPunch*2),this.clock.requestHitstop(j.major,.06),this.audio.parserArrive(),this.callout.show(`THE PARSER`,this.renderer.width*.5,this.renderer.height*.26,28,e.enemyHot,2.4)}),this.bus.on(`parserRead`,t=>{this.audio.parserRead(t.habit>=0),this.camera.kick(0,-1,w.kickSmall*.8),t.habit>=0&&this.particles.burst(t.x,t.y,12,200,e.gridHot[0],e.gridHot[1],e.gridHot[2],.4,1.6)}),this.bus.on(`parserCut`,t=>{let n=e.glyphCut;this.particles.burst(t.x,t.y,9,300,n[0],n[1],n[2],.4,2),this.camera.kick(t.x-this.core.x.value,t.y-this.core.y.value,w.kickSmall),this.audio.parserCut(1-t.remaining01),this.playerEnergy=Math.min(1,this.playerEnergy+.1)}),this.bus.on(`parserBreak`,t=>{this.particles.burst(t.x,t.y,80,900,e.enemyHot[0],e.enemyHot[1],e.enemyHot[2],.9,3.2),this.particles.burst(t.x,t.y,40,400,e.node[0],e.node[1],e.node[2],.7,2.4),this.camera.shake(16,.5),this.camera.zoomPunch(-w.zoomPunch*3),this.clock.requestHitstop(j.major,.04),this.audio.parserBreak(),this.callout.show(`PARSER BROKEN`,this.renderer.width*.5,this.renderer.height*.3,24,e.nodeHalo,2.2),this.playerEnergy=1}),this.bus.on(`mutatorTake`,e=>{let t=e.tint;this.particles.burst(e.x,e.y,54,720,t[0],t[1],t[2],.8,3),this.particles.implode(e.x,e.y,220,40,t[0],t[1],t[2],.4),this.camera.zoomPunch(-w.zoomPunch*2.6),this.camera.shake(11,.34),this.clock.requestHitstop(j.major,.05),this.audio.mutatorTake(),this.callout.show(e.name,e.x,e.y-86,26,t,2),this.callout.show(`RULE CHANGED`,this.renderer.width*.5,this.renderer.height*.3,12,R.grid,2),this.playerEnergy=1}),this.bus.on(`runEnd`,t=>{this.lastResult.wave=t.wave,this.lastResult.kills=t.kills,this.lastResult.seconds=t.seconds,this.lastResult.bestCombo=t.bestCombo,this.camera.shake(22,.6),this.camera.zoomPunch(-w.zoomPunch*3),this.clock.requestHitstop(.16,.03),this.audio.runEnd(),this.parser.active&&(this.particles.burst(this.parser.x,this.parser.y,30,520,e.enemyHot[0],e.enemyHot[1],e.enemyHot[2],.6,2.4),this.parser.destroy()),this.words.purge(t=>{this.particles.burst(t.x,t.y,14,300,e.warning[0],e.warning[1],e.warning[2],.5,1.8)}),this.mirrors.purge(t=>{this.particles.burst(t.headX,t.headY,6,200,e.enemyHot[0],e.enemyHot[1],e.enemyHot[2],.4,1.5)}),this.leeches.purge(t=>{this.particles.burst(t.x,t.y,8,220,e.enemy[0],e.enemy[1],e.enemy[2],.45,1.6)}),this.cutters.purge(t=>{this.particles.burst(t.x,t.y,10,260,e.enemy[0],e.enemy[1],e.enemy[2],.5,1.8)}),this.enemies.purge(t=>{this.particles.burst(t.x,t.y,12,300,e.enemy[0],e.enemy[1],e.enemy[2],.6,2)}),this.fields.detonateAll(t=>{this.particles.implode(t.cx,t.cy,t.radius,90,e.field[0],e.field[1],e.field[2],O.field.detonate.implodeTime)}),this.callout.show(`SYSTEM FRACTURE`,this.renderer.width*.5,this.renderer.height*.42,30,e.hostile,2.6),this.callout.show(`WAVE ${t.wave}   ${t.kills} KILLS   x${t.bestCombo}`,this.renderer.width*.5,this.renderer.height*.52,14,e.grid,2.6)})}attachWindowEvents(){let e=()=>this.resize();window.addEventListener(`resize`,e),this.disposers.push(()=>window.removeEventListener(`resize`,e));let t=()=>{document.hidden?this.audio.suspend():(this.clock.resync(),this.audio.resume(),this.resize())};document.addEventListener(`visibilitychange`,t),this.disposers.push(()=>document.removeEventListener(`visibilitychange`,t));let n=e=>{if(this.settings.key(e.code)){e.preventDefault();return}e.code===`KeyO`?this.settings.toggle():e.code===`F1`||e.key===`F1`?(e.preventDefault(),this.debug.toggle()):e.code===`KeyR`?this.reset():e.code===`KeyM`&&(this.audio.enabled=!this.audio.enabled,this.audio.setVolume(+!!this.audio.enabled))};window.addEventListener(`keydown`,n),this.disposers.push(()=>window.removeEventListener(`keydown`,n));let r=e=>{e.preventDefault(),this.running=!1},i=()=>{this.running=!0,this.clock.resync()};this.renderer.canvas.addEventListener(`webglcontextlost`,r),this.renderer.canvas.addEventListener(`webglcontextrestored`,i),this.disposers.push(()=>{this.renderer.canvas.removeEventListener(`webglcontextlost`,r),this.renderer.canvas.removeEventListener(`webglcontextrestored`,i)})}resize(){this.renderer.resize(),this.background.resize(this.renderer.width,this.renderer.height),this.traces.resize(this.renderer.width,this.renderer.height),this.enemies.resize(this.renderer.width,this.renderer.height),this.cutters.resize(this.renderer.width,this.renderer.height),this.leeches.resize(this.renderer.width,this.renderer.height),this.mirrors.resize(this.renderer.width,this.renderer.height),this.words.resize(this.renderer.width,this.renderer.height),this.mutators.resize(this.renderer.width,this.renderer.height),this.parser.resize(this.renderer.width,this.renderer.height),this.director.viewW=this.renderer.width,this.director.viewH=this.renderer.height,this.layoutText()}layoutText(){let e=this.renderer.width,t=this.renderer.height,n=Math.max(34,Math.min(96,e*.062));this.glyphs.setText(`TRACE//BREAK`,e*.5,t*.42,n,.16),this.hint.setText(`DRAG TO TRACE   SPACE TO BREAK`,e*.5,t*.42+n*1.5,13,.42)}setLoopEnabled(e){this.running=e}start(){if(this.running)return;this.running=!0;let e=t=>{this.rafId=requestAnimationFrame(e),this.running&&this.frame(t)};this.rafId=requestAnimationFrame(e)}frame(e){this.clock.tick(e);let t=performance.now();this.update(),this.simMs=performance.now()-t,this.renderFrame(),this.input.endFrame()}update(){let e=this.clock.dt,t=this.clock.realDt;this.nodes.beginFrame(),this.traces.update(this.input,(e,t)=>{this.nodes.onPointAdded(e,t),t>=1&&(this.glyphs.cutWith(e.px[t-1],e.py[t-1],e.px[t],e.py[t]),this.hint.cutWith(e.px[t-1],e.py[t-1],e.px[t],e.py[t]),this.draft.cutWith(e.px[t-1],e.py[t-1],e.px[t],e.py[t]),this.words.cutWith(e.px[t-1],e.py[t-1],e.px[t],e.py[t]))}),this.input.down||this.input.idleDecay(t),this.input.detonatePressed&&this.detonate(),this.hasDrawnOnce&&this.director.phase===0&&this.director.begin(),this.traces.tick(e),this.nodes.tick(e),this.fields.tick(e),this.glyphs.update(e),this.hint.update(e),this.callout.update(t),this.enemies.playerX=this.core.x.value,this.enemies.playerY=this.core.y.value,this.mirrors.playerX=this.core.x.value,this.mirrors.playerY=this.core.y.value,this.words.playerX=this.core.x.value,this.words.playerY=this.core.y.value,this.parser.playerX=this.core.x.value,this.parser.playerY=this.core.y.value,this.enemies.playerVX=this.core.x.velocity,this.enemies.playerVY=this.core.y.velocity,this.director.update(e,t),this.enemies.update(e),this.cutters.update(e),this.leeches.update(e),this.mirrors.update(e),this.words.update(e),this.mutators.update(e),this.parser.update(e),this.profile.tick(e),this.enemies.resolveTraceHits(),this.cutters.resolveTraceHits(),this.leeches.resolveTraceHits(),this.mirrors.resolveTraceHits(),this.parser.resolveTraceHits(),this.resolveDamage(e),this.draft.hoverAt(this.input.x,this.input.y),this.applyGravityWell(e),this.cacheFields(),this.particles.update(e,this.fieldInfluence),this.consumeCapturedNodes();let n=this.input.x,r=this.input.y;this.input.hasPointer&&(this.mutators.wellForce(this.core.x.value,this.core.y.value,this._well),this.core.setTarget(n+this.words.pullX*.06+this._well[0]*.05,r+this.words.pullY*.06+this._well[1]*.05)),this.core.update(t);let i=Math.hypot(this.input.vx,this.input.vy);if(i>1&&(this.dirX=s(this.dirX,this.input.vx/i,16,t),this.dirY=s(this.dirY,this.input.vy/i,16,t)),this.drawingSmooth=s(this.drawingSmooth,+!!this.input.down,16,t),this.denied=s(this.denied,0,5.5,t),this.playerEnergy=s(this.playerEnergy,0,1.5,t),this.input.down&&this.input.speed01>.24){let e=R.stable;this.particles.ember(this.traces.headX,this.traces.headY,-this.input.vx*.12+(Math.random()-.5)*40,-this.input.vy*.12+(Math.random()-.5)*40,e[0],e[1],e[2],.3)}if(this.clock.frameCount%2==0){let e=(e,t)=>this.traces.nearestTraceDistance(e,t,200);this.glyphs.updateProximity(e,t*2),this.hint.updateProximity(e,t*2),this.words.updateProximity(e,t*2)}this.hasDrawnOnce&&(this.hint.alpha=s(this.hint.alpha,0,2.2,t)),this.director.phase!==0&&(this.glyphs.alpha=s(this.glyphs.alpha,0,1.5,t)),this.result.update(t,this.director.phase===3),this.settings.update(t),this.hud.update(t,this.director.integrity01,this.director.alive,this.director.invuln01);let a=this.director.ended?.55:1;this.renderer.fade=s(this.renderer.fade,a,3.2,t),this.nodes.combo>this.director.bestCombo&&(this.director.bestCombo=this.nodes.combo),this.camera.update(t),this.renderer.setCamera(this.camera.x,this.camera.y,this.camera.zoom);let o=this.fields.containsPoint(n,r)?g(1,B.fieldTimeScale,.75):1;this.clock.timeScale=s(this.clock.timeScale,o,7,t)}_well=new Float32Array(2);_wellLists=[];applyGravityWell(e){if(!this.mutators.wellActive)return;let t=e*e;for(let e=0;e<this._wellLists.length;e++){let n=this._wellLists[e];for(let e=0;e<n.length;e++){let r=n[e];r.active&&(this.mutators.wellForce(r.x,r.y,this._well),r.x+=this._well[0]*t,r.y+=this._well[1]*t)}}}resolveDamage(e){if(!this.director.alive)return;let t=this.core.x.value,n=this.core.y.value,r=O.enemy,i=this.enemies.contactWithPlayer(t,n);if(i){let e=t-i.x,a=n-i.y,o=Math.hypot(e,a)||1,s=r.needle.damage*V.damageMul;this.director.damage(s,t,n,e/o,a/o,!1)&&this.enemies.kill(i,i.x,i.y);return}let a=this.mirrors.contactWithPlayer(t,n);if(a){let e=t-a.headX,r=n-a.headY,i=Math.hypot(e,r)||1;this.director.damage(this.mirrors.damage,t,n,e/i,r/i,!1)&&this.mirrors.kill(a);return}let o=this.words.contactWithPlayer(t,n);if(o){let e=t-o.x,r=n-o.y,i=Math.hypot(e,r)||1;this.director.damage(this.words.damage,o.x,o.y,e/i,r/i,!1);return}if(this.hostileTick-=e,this.hostileTick<=0){let e=O.player.hitRadius+r.hostileReachBias;if(this.enemies.nearestHostilePoint(t,n,e+1)){this.hostileTick=.34;let e=this.enemies.hostilePointX,r=this.enemies.hostilePointY,i=t-e,a=n-r,o=Math.hypot(i,a)||1;this.director.damage(B.hostileDamage*.34,e,r,i/o,a/o,!0)}}}detonate(){let e=this.fields.detonateAll(e=>{this.particles.implode(e.cx,e.cy,e.radius,O.field.detonate.particles,R.field[0],R.field[1],R.field[2],O.field.detonate.implodeTime),e.capturedNodes=this.nodes.countInside((t,n)=>this.insideField(e,t,n)),B.blastKill&&this.blastEnemies(e.cx,e.cy,e.radius*1.55)});if(e===0){this.denied=1,this.audio.denied(),this.camera.kick(0,1,2);return}this.camera.zoomPunch(-w.zoomPunch*(1+e*.4))}blastEnemies(e,t,n){let r=n*n,i=(n,i)=>{let a=n-e,o=i-t;return a*a+o*o<=r},a=this.enemies.enemies;for(let e=0;e<a.length;e++){let t=a[e];t.active&&i(t.x,t.y)&&this.enemies.kill(t,t.x,t.y)}let o=this.cutters.cutters;for(let e=0;e<o.length;e++){let t=o[e];t.active&&i(t.x,t.y)&&this.cutters.kill(t)}let s=this.leeches.leeches;for(let e=0;e<s.length;e++){let t=s[e];t.active&&i(t.x,t.y)&&this.leeches.kill(t)}this.parser.active&&i(this.parser.x,this.parser.y)&&this.parser.destroy();let c=this.words.words;for(let e=0;e<c.length;e++){let t=c[e];t.active&&i(t.x,t.y)&&this.words.kill(t)}let l=this.mirrors.mirrors;for(let e=0;e<l.length;e++){let t=l[e];t.active&&i(t.headX,t.headY)&&this.mirrors.kill(t)}}insideField(e,t,n){if(d(t,n,e.cx,e.cy)>e.radius*1.7)return!1;let r=!1;for(let i=0,a=e.count-1;i<e.count;a=i++){let o=e.restPts[i*2],s=e.restPts[i*2+1],c=e.restPts[a*2],l=e.restPts[a*2+1];s>n!=l>n&&t<(c-o)*(n-s)/(l-s)+o&&(r=!r)}return r}consumeCapturedNodes(){for(let e=0;e<this.fields.fields.length;e++){let t=this.fields.fields[e];!t.active||t.state!==2||t.phase>.06||this.nodes.consumeInside((e,n)=>this.insideField(t,e,n),e=>{this.particles.burst(e.x,e.y,10,420,R.node[0],R.node[1],R.node[2],.5,2.1)})}}cacheFields(){let e=0;for(let t=0;t<this.fields.fields.length&&e<ir;t++){let n=this.fields.fields[t];!n.active||n.state!==0||(this.fieldCx[e]=n.cx,this.fieldCy[e]=n.cy,this.fieldR2[e]=n.radius*n.radius,e++)}this.fieldInfluence.count=e}renderFrame(){let e=this.clock.gameTime;if(this.background.update(e,this.core.x.value,this.core.y.value,this.playerEnergy),this.traceRenderer.update(e),this.nodeRenderer.update(e),this.fieldRenderer.update(e),this.enemyRenderer.update(e),this.cutterRenderer.update(e),this.leechRenderer.update(e),this.segments.begin(),this.glyphs.render(this.segments,e),this.hint.render(this.segments,e),this.renderAimLines(),dn(this.segments,this.mirrors,e),mn(this.segments,this.words,e),yn(this.segments,this.parser,this.profile,e),this.renderGravityWell(e),this.hud.render(this.segments,this.renderer.width,this.renderer.height,this.director.integrity01,this.director.wave,this.nodes.combo),this.result.render(this.segments,this.renderer.width,this.renderer.height,this.lastResult,this.profile,this.clock.realTime),this.settings.render(this.segments,this.renderer.width,this.renderer.height),this.draft.render(this.segments,e),this.callout.render(this.segments),this.segments.end(e),this.playerRenderer.update(this.core.x.value,this.core.y.value,this.input.x,this.input.y,this.dirX,this.dirY,this.input.speed01,this.drawingSmooth,this.playerEnergy,this.denied,e),this.playerRenderer.setVisible(this.input.hasPointer),this.renderer.setShockwaves(this.fields.shockX,this.fields.shockY,this.fields.shockR,this.fields.shockAmp),this.audio.updateDrawing(this.input.down,this.input.speed01,this.clock.realDt),this.renderer.render(e),!this.shaderCheckDone&&this.clock.frameCount>8){this.shaderCheckDone=!0,this.shaderErrors=this.renderer.shaderErrors();for(let e of this.shaderErrors)console.error(`[TRACE//BREAK] SHADER COMPILE FAILURE —`,e)}this.debug.update({clock:this.clock,info:this.renderer.info,traces:this.traces,nodes:this.nodes,fields:this.fields,particles:this.particles,glyphs:this.glyphs,segments:this.segments,bus:this.bus,simMs:this.simMs,width:this.renderer.width,height:this.renderer.height,pixelRatio:this.renderer.pixelRatio,stats:this.stats,audio:this.audio,enemies:this.enemies,cutters:this.cutters,leeches:this.leeches,mirrors:this.mirrors,words:this.words,mutators:this.mutators,parser:this.parser,profile:this.profile,director:this.director,shaderErrors:this.shaderErrors})}renderAimLines(){let e=this.enemies.enemies,t=R.enemyHot;for(let n=0;n<e.length;n++){let r=e[n];if(!r.active||r.state!==1)continue;let i=Math.min(1,r.stateT/V.aimTime),a=r.aimX-r.x,o=r.aimY-r.y,s=Math.hypot(a,o);if(s<8)continue;let c=a/s,l=o/s,u=15+12*(1-i*.8),d=(.1+i*.34)*O.a11y.flashIntensity;for(let e=24;e<s;e+=u){let n=Math.min(s,e+15);this.segments.add(r.x+c*e,r.y+l*e,r.x+c*n,r.y+l*n,.75+i*.5,t[0],t[1],t[2],d,.35+i*.7,0,2.6)}}let n=this.cutters.cutters,r=R.enemy;for(let e=0;e<n.length;e++){let t=n[e];!t.active||t.state!==1||!t.hasTarget||this.segments.add(t.x,t.y,t.targetX,t.targetY,.55,r[0],r[1],r[2],.14*O.a11y.flashIntensity,.4,0,2)}}renderGravityWell(e){if(!this.mutators.wellActive)return;let t=R.fieldDeep,n=this.mutators.wellX,r=this.mutators.wellY,i=O.mutator;for(let a=0;a<4;a++){let o=(e*.22+a/4)%1,s=i.wellRadius*(1-o)*this.mutators.wellT;if(s<12)continue;let c=.16*Math.sin(o*Math.PI)*O.a11y.flashIntensity,l=Math.PI*2/30,u=e*.5+a*1.7;for(let e=0;e<30;e+=2){let i=u+e*l,a=i+l;this.segments.add(n+Math.cos(i)*s,r+Math.sin(i)*s,n+Math.cos(a)*s,r+Math.sin(a)*s,.8,t[0],t[1],t[2],c,.7,0,2.6)}}}reset(){this.traces.clear(),this.nodes.clear(),this.fields.clear(),this.particles.clear(),this.glyphs.clear(),this.hint.clear(),this.callout.clear(),this.camera.reset(),this.enemies.clear(),this.cutters.clear(),this.leeches.clear(),this.mirrors.clear(),this.words.clear(),this.mutators.clear(),this.parser.clear(),this.profile.reset(),this.director.reset(),this.draft.clear(),this.hud.reset(),this.result.reset(),this.hostileTick=0,this.shownSelfDamageHint=!1,this.glyphs.alpha=1,this.traceRenderer.invalidate(),this.renderer.clearTrails(),this.hasDrawnOnce=!1,this.hint.alpha=1,this.renderer.fade=1,this.stats.nodesMade=0,this.stats.fieldsMade=0,this.stats.detonations=0,this.stats.cuts=0,this.layoutText()}dispose(){this.running=!1,cancelAnimationFrame(this.rafId);for(let e of this.disposers)e();this.disposers.length=0,this.input.dispose(),this.audio.dispose(),this.background.dispose(),this.traceRenderer.dispose(),this.nodeRenderer.dispose(),this.fieldRenderer.dispose(),this.segments.dispose(),this.enemyRenderer.dispose(),this.cutterRenderer.dispose(),this.leechRenderer.dispose(),this.playerRenderer.dispose(),this.particles.dispose(),this.renderer.dispose()}};export{ar as App};