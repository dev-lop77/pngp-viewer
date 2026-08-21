(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=1e3,t=1001,n=1002,r=1003,i=1004,a=1005,o=1006,s=1007,c=1008,l=1009,u=1010,d=1011,f=1012,p=1013,m=1014,h=1015,g=1016,_=1017,v=1018,y=1020,b=35902,x=35899,S=1021,C=1022,w=1023,T=1026,E=1027,D=1028,O=1029,k=1030,A=1031,ee=1033,j=33776,M=33777,te=33778,ne=33779,N=35840,re=35841,ie=35842,ae=35843,oe=36196,se=37492,ce=37496,le=37488,P=37489,ue=37490,de=37491,fe=37808,pe=37809,me=37810,he=37811,ge=37812,_e=37813,ve=37814,ye=37815,be=37816,xe=37817,Se=37818,Ce=37819,we=37820,Te=37821,Ee=36492,De=36494,Oe=36495,ke=36283,Ae=36284,je=36285,Me=36286,Ne=2300,F=2301,Pe=2302,Fe=2303,Ie=2400,I=2401,Le=2402,L=3200,Re=`srgb`,ze=`srgb-linear`,Be=`linear`,Ve=`srgb`,He=7680,Ue=35044,We=35048,Ge=2e3;function Ke(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function qe(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function Je(e){return document.createElementNS(`http://www.w3.org/1999/xhtml`,e)}function Ye(){let e=Je(`canvas`);return e.style.display=`block`,e}var Xe={};function Ze(...e){let t=`THREE.`+e.shift();console.log(t,...e)}function Qe(e){let t=e[0];if(typeof t==`string`&&t.startsWith(`TSL:`)){let t=e[1];t&&t.isStackTrace?e[0]+=` `+t.getLocation():e[1]=`Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.`}return e}function R(...e){e=Qe(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.warn(n.getError(t)):console.warn(t,...e)}}function z(...e){e=Qe(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.error(n.getError(t)):console.error(t,...e)}}function $e(...e){let t=e.join(` `);t in Xe||(Xe[t]=!0,R(...e))}function et(e,t,n){return new Promise(function(r,i){function a(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:i();break;case e.TIMEOUT_EXPIRED:setTimeout(a,n);break;default:r()}}setTimeout(a,n)})}var tt={0:1,2:6,4:7,3:5,1:0,6:2,7:4,5:3},nt=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n!==void 0&&n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let r=n[e];if(r!==void 0){let e=r.indexOf(t);e!==-1&&r.splice(e,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let t=n.slice(0);for(let n=0,r=t.length;n<r;n++)t[n].call(this,e);e.target=null}}},rt=`00.01.02.03.04.05.06.07.08.09.0a.0b.0c.0d.0e.0f.10.11.12.13.14.15.16.17.18.19.1a.1b.1c.1d.1e.1f.20.21.22.23.24.25.26.27.28.29.2a.2b.2c.2d.2e.2f.30.31.32.33.34.35.36.37.38.39.3a.3b.3c.3d.3e.3f.40.41.42.43.44.45.46.47.48.49.4a.4b.4c.4d.4e.4f.50.51.52.53.54.55.56.57.58.59.5a.5b.5c.5d.5e.5f.60.61.62.63.64.65.66.67.68.69.6a.6b.6c.6d.6e.6f.70.71.72.73.74.75.76.77.78.79.7a.7b.7c.7d.7e.7f.80.81.82.83.84.85.86.87.88.89.8a.8b.8c.8d.8e.8f.90.91.92.93.94.95.96.97.98.99.9a.9b.9c.9d.9e.9f.a0.a1.a2.a3.a4.a5.a6.a7.a8.a9.aa.ab.ac.ad.ae.af.b0.b1.b2.b3.b4.b5.b6.b7.b8.b9.ba.bb.bc.bd.be.bf.c0.c1.c2.c3.c4.c5.c6.c7.c8.c9.ca.cb.cc.cd.ce.cf.d0.d1.d2.d3.d4.d5.d6.d7.d8.d9.da.db.dc.dd.de.df.e0.e1.e2.e3.e4.e5.e6.e7.e8.e9.ea.eb.ec.ed.ee.ef.f0.f1.f2.f3.f4.f5.f6.f7.f8.f9.fa.fb.fc.fd.fe.ff`.split(`.`),it=1234567,at=Math.PI/180,ot=180/Math.PI;function st(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,r=Math.random()*4294967295|0;return(rt[e&255]+rt[e>>8&255]+rt[e>>16&255]+rt[e>>24&255]+`-`+rt[t&255]+rt[t>>8&255]+`-`+rt[t>>16&15|64]+rt[t>>24&255]+`-`+rt[n&63|128]+rt[n>>8&255]+`-`+rt[n>>16&255]+rt[n>>24&255]+rt[r&255]+rt[r>>8&255]+rt[r>>16&255]+rt[r>>24&255]).toLowerCase()}function B(e,t,n){return Math.max(t,Math.min(n,e))}function ct(e,t){return(e%t+t)%t}function lt(e,t,n,r,i){return r+(e-t)*(i-r)/(n-t)}function ut(e,t,n){return e===t?0:(n-e)/(t-e)}function dt(e,t,n){return(1-n)*e+n*t}function ft(e,t,n,r){return dt(e,t,1-Math.exp(-n*r))}function pt(e,t=1){return t-Math.abs(ct(e,t*2)-t)}function mt(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*(3-2*e))}function ht(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*e*(e*(e*6-15)+10))}function gt(e,t){return e+Math.floor(Math.random()*(t-e+1))}function _t(e,t){return e+Math.random()*(t-e)}function vt(e){return e*(.5-Math.random())}function yt(e){e!==void 0&&(it=e);let t=it+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function bt(e){return e*at}function xt(e){return e*ot}function St(e){return(e&e-1)==0&&e!==0}function Ct(e){return 2**Math.ceil(Math.log(e)/Math.LN2)}function wt(e){return 2**Math.floor(Math.log(e)/Math.LN2)}function Tt(e,t,n,r,i){let a=Math.cos,o=Math.sin,s=a(n/2),c=o(n/2),l=a((t+r)/2),u=o((t+r)/2),d=a((t-r)/2),f=o((t-r)/2),p=a((r-t)/2),m=o((r-t)/2);switch(i){case`XYX`:e.set(s*u,c*d,c*f,s*l);break;case`YZY`:e.set(c*f,s*u,c*d,s*l);break;case`ZXZ`:e.set(c*d,c*f,s*u,s*l);break;case`XZX`:e.set(s*u,c*m,c*p,s*l);break;case`YXY`:e.set(c*p,s*u,c*m,s*l);break;case`ZYZ`:e.set(c*m,c*p,s*u,s*l);break;default:R(`MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: `+i)}}function Et(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return e/4294967295;case Uint16Array:return e/65535;case Uint8Array:return e/255;case Int32Array:return Math.max(e/2147483647,-1);case Int16Array:return Math.max(e/32767,-1);case Int8Array:return Math.max(e/127,-1);default:throw Error(`THREE.MathUtils: Invalid component type.`)}}function Dt(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return Math.round(e*4294967295);case Uint16Array:return Math.round(e*65535);case Uint8Array:return Math.round(e*255);case Int32Array:return Math.round(e*2147483647);case Int16Array:return Math.round(e*32767);case Int8Array:return Math.round(e*127);default:throw Error(`THREE.MathUtils: Invalid component type.`)}}var Ot={DEG2RAD:at,RAD2DEG:ot,generateUUID:st,clamp:B,euclideanModulo:ct,mapLinear:lt,inverseLerp:ut,lerp:dt,damp:ft,pingpong:pt,smoothstep:mt,smootherstep:ht,randInt:gt,randFloat:_t,randFloatSpread:vt,seededRandom:yt,degToRad:bt,radToDeg:xt,isPowerOfTwo:St,ceilPowerOfTwo:Ct,floorPowerOfTwo:wt,setQuaternionFromProperEuler:Tt,normalize:Dt,denormalize:Et},V=class e{static{e.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw Error(`THREE.Vector2: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw Error(`THREE.Vector2: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=B(this.x,e.x,t.x),this.y=B(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=B(this.x,e,t),this.y=B(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(B(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(B(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),r=Math.sin(t),i=this.x-e.x,a=this.y-e.y;return this.x=i*n-a*r+e.x,this.y=i*r+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},kt=class{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,i,a,o){let s=n[r+0],c=n[r+1],l=n[r+2],u=n[r+3],d=i[a+0],f=i[a+1],p=i[a+2],m=i[a+3];if(u!==m||s!==d||c!==f||l!==p){let e=s*d+c*f+l*p+u*m;e<0&&(d=-d,f=-f,p=-p,m=-m,e=-e);let t=1-o;if(e<.9995){let n=Math.acos(e),r=Math.sin(n);t=Math.sin(t*n)/r,o=Math.sin(o*n)/r,s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o}else{s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o;let e=1/Math.sqrt(s*s+c*c+l*l+u*u);s*=e,c*=e,l*=e,u*=e}}e[t]=s,e[t+1]=c,e[t+2]=l,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,r,i,a){let o=n[r],s=n[r+1],c=n[r+2],l=n[r+3],u=i[a],d=i[a+1],f=i[a+2],p=i[a+3];return e[t]=o*p+l*u+s*f-c*d,e[t+1]=s*p+l*d+c*u-o*f,e[t+2]=c*p+l*f+o*d-s*u,e[t+3]=l*p-o*u-s*d-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,r=e._y,i=e._z,a=e._order,o=Math.cos,s=Math.sin,c=o(n/2),l=o(r/2),u=o(i/2),d=s(n/2),f=s(r/2),p=s(i/2);switch(a){case`XYZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`YXZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`ZXY`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`ZYX`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`YZX`:this._x=d*l*u+c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u-d*f*p;break;case`XZY`:this._x=d*l*u-c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u+d*f*p;break;default:R(`Quaternion: .setFromEuler() encountered an unknown order: `+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],r=t[4],i=t[8],a=t[1],o=t[5],s=t[9],c=t[2],l=t[6],u=t[10],d=n+o+u;if(d>0){let e=.5/Math.sqrt(d+1);this._w=.25/e,this._x=(l-s)*e,this._y=(i-c)*e,this._z=(a-r)*e}else if(n>o&&n>u){let e=2*Math.sqrt(1+n-o-u);this._w=(l-s)/e,this._x=.25*e,this._y=(r+a)/e,this._z=(i+c)/e}else if(o>u){let e=2*Math.sqrt(1+o-n-u);this._w=(i-c)/e,this._x=(r+a)/e,this._y=.25*e,this._z=(s+l)/e}else{let e=2*Math.sqrt(1+u-n-o);this._w=(a-r)/e,this._x=(i+c)/e,this._y=(s+l)/e,this._z=.25*e}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(B(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x*=e,this._y*=e,this._z*=e,this._w*=e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=t._x,s=t._y,c=t._z,l=t._w;return this._x=n*l+a*o+r*c-i*s,this._y=r*l+a*s+i*o-n*c,this._z=i*l+a*c+n*s-r*o,this._w=a*l-n*o-r*s-i*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,r=-r,i=-i,a=-a,o=-o);let s=1-t;if(o<.9995){let e=Math.acos(o),c=Math.sin(e);s=Math.sin(s*e)/c,t=Math.sin(t*e)/c,this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this._onChangeCallback()}else this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),i=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),i*Math.sin(t),i*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},H=class e{static{e.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw Error(`THREE.Vector3: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw Error(`THREE.Vector3: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(jt.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(jt.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6]*r,this.y=i[1]*t+i[4]*n+i[7]*r,this.z=i[2]*t+i[5]*n+i[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=e.elements,a=1/(i[3]*t+i[7]*n+i[11]*r+i[15]);return this.x=(i[0]*t+i[4]*n+i[8]*r+i[12])*a,this.y=(i[1]*t+i[5]*n+i[9]*r+i[13])*a,this.z=(i[2]*t+i[6]*n+i[10]*r+i[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,r=this.z,i=e.x,a=e.y,o=e.z,s=e.w,c=2*(a*r-o*n),l=2*(o*t-i*r),u=2*(i*n-a*t);return this.x=t+s*c+a*u-o*l,this.y=n+s*l+o*c-i*u,this.z=r+s*u+i*l-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[4]*n+i[8]*r,this.y=i[1]*t+i[5]*n+i[9]*r,this.z=i[2]*t+i[6]*n+i[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=B(this.x,e.x,t.x),this.y=B(this.y,e.y,t.y),this.z=B(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=B(this.x,e,t),this.y=B(this.y,e,t),this.z=B(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(B(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,r=e.y,i=e.z,a=t.x,o=t.y,s=t.z;return this.x=r*s-i*o,this.y=i*a-n*s,this.z=n*o-r*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return At.copy(this).projectOnVector(e),this.sub(At)}reflect(e){return this.sub(At.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(B(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},At=new H,jt=new kt,U=class e{static{e.prototype.isMatrix3=!0}constructor(e,t,n,r,i,a,o,s,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c)}set(e,t,n,r,i,a,o,s,c){let l=this.elements;return l[0]=e,l[1]=r,l[2]=o,l[3]=t,l[4]=i,l[5]=s,l[6]=n,l[7]=a,l[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[3],s=n[6],c=n[1],l=n[4],u=n[7],d=n[2],f=n[5],p=n[8],m=r[0],h=r[3],g=r[6],_=r[1],v=r[4],y=r[7],b=r[2],x=r[5],S=r[8];return i[0]=a*m+o*_+s*b,i[3]=a*h+o*v+s*x,i[6]=a*g+o*y+s*S,i[1]=c*m+l*_+u*b,i[4]=c*h+l*v+u*x,i[7]=c*g+l*y+u*S,i[2]=d*m+f*_+p*b,i[5]=d*h+f*v+p*x,i[8]=d*g+f*y+p*S,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8];return t*a*l-t*o*c-n*i*l+n*o*s+r*i*c-r*a*s}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=l*a-o*c,d=o*s-l*i,f=c*i-a*s,p=t*u+n*d+r*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let m=1/p;return e[0]=u*m,e[1]=(r*c-l*n)*m,e[2]=(o*n-r*a)*m,e[3]=d*m,e[4]=(l*t-r*s)*m,e[5]=(r*i-o*t)*m,e[6]=f*m,e[7]=(n*s-c*t)*m,e[8]=(a*t-n*i)*m,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,i,a,o){let s=Math.cos(i),c=Math.sin(i);return this.set(n*s,n*c,-n*(s*a+c*o)+a+e,-r*c,r*s,-r*(-c*a+s*o)+o+t,0,0,1),this}scale(e,t){return $e(`Matrix3: .scale() is deprecated. Use .makeScale() instead.`),this.premultiply(Mt.makeScale(e,t)),this}rotate(e){return $e(`Matrix3: .rotate() is deprecated. Use .makeRotation() instead.`),this.premultiply(Mt.makeRotation(-e)),this}translate(e,t){return $e(`Matrix3: .translate() is deprecated. Use .makeTranslation() instead.`),this.premultiply(Mt.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<9;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},Mt=new U,Nt=new U().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Pt=new U().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Ft(){let e={enabled:!0,workingColorSpace:ze,spaces:{},convert:function(e,t,n){return this.enabled===!1||t===n||!t||!n?e:(this.spaces[t].transfer===`srgb`&&(e.r=Lt(e.r),e.g=Lt(e.g),e.b=Lt(e.b)),this.spaces[t].primaries!==this.spaces[n].primaries&&(e.applyMatrix3(this.spaces[t].toXYZ),e.applyMatrix3(this.spaces[n].fromXYZ)),this.spaces[n].transfer===`srgb`&&(e.r=Rt(e.r),e.g=Rt(e.g),e.b=Rt(e.b)),e)},workingToColorSpace:function(e,t){return this.convert(e,this.workingColorSpace,t)},colorSpaceToWorking:function(e,t){return this.convert(e,t,this.workingColorSpace)},getPrimaries:function(e){return this.spaces[e].primaries},getTransfer:function(e){return e===``?Be:this.spaces[e].transfer},getToneMappingMode:function(e){return this.spaces[e].outputColorSpaceConfig.toneMappingMode||`standard`},getLuminanceCoefficients:function(e,t=this.workingColorSpace){return e.fromArray(this.spaces[t].luminanceCoefficients)},define:function(e){Object.assign(this.spaces,e)},_getMatrix:function(e,t,n){return e.copy(this.spaces[t].toXYZ).multiply(this.spaces[n].fromXYZ)},_getDrawingBufferColorSpace:function(e){return this.spaces[e].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(e=this.workingColorSpace){return this.spaces[e].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(t,n){return $e(`ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace().`),e.workingToColorSpace(t,n)},toWorkingColorSpace:function(t,n){return $e(`ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking().`),e.colorSpaceToWorking(t,n)}},t=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],r=[.3127,.329];return e.define({[ze]:{primaries:t,whitePoint:r,transfer:Be,toXYZ:Nt,fromXYZ:Pt,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:Re},outputColorSpaceConfig:{drawingBufferColorSpace:Re}},[Re]:{primaries:t,whitePoint:r,transfer:Ve,toXYZ:Nt,fromXYZ:Pt,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:Re}}}),e}var It=Ft();function Lt(e){return e<.04045?e*.0773993808:(e*.9478672986+.0521327014)**2.4}function Rt(e){return e<.0031308?e*12.92:1.055*e**.41666-.055}var zt,Bt=class{static getDataURL(e,t=`image/png`){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>`u`)return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{zt===void 0&&(zt=Je(`canvas`)),zt.width=e.width,zt.height=e.height;let t=zt.getContext(`2d`);e instanceof ImageData?t.putImageData(e,0,0):t.drawImage(e,0,0,e.width,e.height),n=zt}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap){let t=Je(`canvas`);t.width=e.width,t.height=e.height;let n=t.getContext(`2d`);n.drawImage(e,0,0,e.width,e.height);let r=n.getImageData(0,0,e.width,e.height),i=r.data;for(let e=0;e<i.length;e++)i[e]=Lt(i[e]/255)*255;return n.putImageData(r,0,0),t}else if(e.data){let t=e.data.slice(0);for(let e=0;e<t.length;e++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[e]=Math.floor(Lt(t[e]/255)*255):t[e]=Lt(t[e]);return{data:t,width:e.width,height:e.height}}else return R(`ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.`),e}},Vt=0,Ht=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Vt++}),this.uuid=st(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<`u`&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<`u`&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t===null?e.set(0,0,0):e.set(t.width,t.height,t.depth||0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:``},r=this.data;if(r!==null){let e;if(Array.isArray(r)){e=[];for(let t=0,n=r.length;t<n;t++)r[t].isDataTexture?e.push(Ut(r[t].image)):e.push(Ut(r[t]))}else e=Ut(r);n.url=e}return t||(e.images[this.uuid]=n),n}};function Ut(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap?Bt.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(R(`Texture: Unable to serialize Texture.`),{})}var Wt=0,Gt=new H,Kt=class r extends nt{constructor(e=r.DEFAULT_IMAGE,n=r.DEFAULT_MAPPING,i=t,a=t,s=o,u=c,d=w,f=l,p=r.DEFAULT_ANISOTROPY,m=``){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Wt++}),this.uuid=st(),this.name=``,this.source=new Ht(e),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=i,this.wrapT=a,this.magFilter=s,this.minFilter=u,this.anisotropy=p,this.format=d,this.internalFormat=null,this.type=f,this.offset=new V(0,0),this.repeat=new V(1,1),this.center=new V(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new U,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=m,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Gt).x}get height(){return this.source.getSize(Gt).y}get depth(){return this.source.getSize(Gt).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){R(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){R(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:`Texture`,generator:`Texture.toJSON`},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:`dispose`})}transformUv(r){if(this.mapping!==300)return r;if(r.applyMatrix3(this.matrix),r.x<0||r.x>1)switch(this.wrapS){case e:r.x-=Math.floor(r.x);break;case t:r.x=r.x<0?0:1;break;case n:Math.abs(Math.floor(r.x)%2)===1?r.x=Math.ceil(r.x)-r.x:r.x-=Math.floor(r.x);break}if(r.y<0||r.y>1)switch(this.wrapT){case e:r.y-=Math.floor(r.y);break;case t:r.y=r.y<0?0:1;break;case n:Math.abs(Math.floor(r.y)%2)===1?r.y=Math.ceil(r.y)-r.y:r.y-=Math.floor(r.y);break}return this.flipY&&(r.y=1-r.y),r}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Kt.DEFAULT_IMAGE=null,Kt.DEFAULT_MAPPING=300,Kt.DEFAULT_ANISOTROPY=1;var qt=class e{static{e.prototype.isVector4=!0}constructor(e=0,t=0,n=0,r=1){this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw Error(`THREE.Vector4: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw Error(`THREE.Vector4: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w===void 0?1:e.w,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*i,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*i,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*i,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*i,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,i,a=.01,o=.1,s=e.elements,c=s[0],l=s[4],u=s[8],d=s[1],f=s[5],p=s[9],m=s[2],h=s[6],g=s[10];if(Math.abs(l-d)<a&&Math.abs(u-m)<a&&Math.abs(p-h)<a){if(Math.abs(l+d)<o&&Math.abs(u+m)<o&&Math.abs(p+h)<o&&Math.abs(c+f+g-3)<o)return this.set(1,0,0,0),this;t=Math.PI;let e=(c+1)/2,s=(f+1)/2,_=(g+1)/2,v=(l+d)/4,y=(u+m)/4,b=(p+h)/4;return e>s&&e>_?e<a?(n=0,r=.707106781,i=.707106781):(n=Math.sqrt(e),r=v/n,i=y/n):s>_?s<a?(n=.707106781,r=0,i=.707106781):(r=Math.sqrt(s),n=v/r,i=b/r):_<a?(n=.707106781,r=.707106781,i=0):(i=Math.sqrt(_),n=y/i,r=b/i),this.set(n,r,i,t),this}let _=Math.sqrt((h-p)*(h-p)+(u-m)*(u-m)+(d-l)*(d-l));return Math.abs(_)<.001&&(_=1),this.x=(h-p)/_,this.y=(u-m)/_,this.z=(d-l)/_,this.w=Math.acos((c+f+g-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=B(this.x,e.x,t.x),this.y=B(this.y,e.y,t.y),this.z=B(this.z,e.z,t.z),this.w=B(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=B(this.x,e,t),this.y=B(this.y,e,t),this.z=B(this.z,e,t),this.w=B(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(B(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Jt=class extends nt{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:o,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new qt(0,0,e,t),this.scissorTest=!1,this.viewport=new qt(0,0,e,t),this.textures=[];let r=new Kt({width:e,height:t,depth:n.depth}),i=n.count;for(let e=0;e<i;e++)this.textures[e]=r.clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:o,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let e=0;e<this.textures.length;e++)this.textures[e].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,i=this.textures.length;r<i;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let n=Object.assign({},e.textures[t].image);this.textures[t].source=new Ht(n)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:`dispose`})}},Yt=class extends Jt{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},Xt=class extends Kt{constructor(e=null,n=1,i=1,a=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:n,height:i,depth:a},this.magFilter=r,this.minFilter=r,this.wrapR=t,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}},Zt=class extends Kt{constructor(e=null,n=1,i=1,a=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:n,height:i,depth:a},this.magFilter=r,this.minFilter=r,this.wrapR=t,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},Qt=class e{static{e.prototype.isMatrix4=!0}constructor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h)}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){let g=this.elements;return g[0]=e,g[4]=t,g[8]=n,g[12]=r,g[1]=i,g[5]=a,g[9]=o,g[13]=s,g[2]=c,g[6]=l,g[10]=u,g[14]=d,g[3]=f,g[7]=p,g[11]=m,g[15]=h,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new e().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,r=1/$t.setFromMatrixColumn(e,0).length(),i=1/$t.setFromMatrixColumn(e,1).length(),a=1/$t.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*i,t[5]=n[5]*i,t[6]=n[6]*i,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,r=e.y,i=e.z,a=Math.cos(n),o=Math.sin(n),s=Math.cos(r),c=Math.sin(r),l=Math.cos(i),u=Math.sin(i);if(e.order===`XYZ`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=-s*u,t[8]=c,t[1]=n+r*c,t[5]=e-i*c,t[9]=-o*s,t[2]=i-e*c,t[6]=r+n*c,t[10]=a*s}else if(e.order===`YXZ`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e+i*o,t[4]=r*o-n,t[8]=a*c,t[1]=a*u,t[5]=a*l,t[9]=-o,t[2]=n*o-r,t[6]=i+e*o,t[10]=a*s}else if(e.order===`ZXY`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e-i*o,t[4]=-a*u,t[8]=r+n*o,t[1]=n+r*o,t[5]=a*l,t[9]=i-e*o,t[2]=-a*c,t[6]=o,t[10]=a*s}else if(e.order===`ZYX`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=r*c-n,t[8]=e*c+i,t[1]=s*u,t[5]=i*c+e,t[9]=n*c-r,t[2]=-c,t[6]=o*s,t[10]=a*s}else if(e.order===`YZX`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=i-e*u,t[8]=r*u+n,t[1]=u,t[5]=a*l,t[9]=-o*l,t[2]=-c*l,t[6]=n*u+r,t[10]=e-i*u}else if(e.order===`XZY`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=-u,t[8]=c*l,t[1]=e*u+i,t[5]=a*l,t[9]=n*u-r,t[2]=r*u-n,t[6]=o*l,t[10]=i*u+e}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(tn,e,nn)}lookAt(e,t,n){let r=this.elements;return on.subVectors(e,t),on.lengthSq()===0&&(on.z=1),on.normalize(),rn.crossVectors(n,on),rn.lengthSq()===0&&(Math.abs(n.z)===1?on.x+=1e-4:on.z+=1e-4,on.normalize(),rn.crossVectors(n,on)),rn.normalize(),an.crossVectors(on,rn),r[0]=rn.x,r[4]=an.x,r[8]=on.x,r[1]=rn.y,r[5]=an.y,r[9]=on.y,r[2]=rn.z,r[6]=an.z,r[10]=on.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[4],s=n[8],c=n[12],l=n[1],u=n[5],d=n[9],f=n[13],p=n[2],m=n[6],h=n[10],g=n[14],_=n[3],v=n[7],y=n[11],b=n[15],x=r[0],S=r[4],C=r[8],w=r[12],T=r[1],E=r[5],D=r[9],O=r[13],k=r[2],A=r[6],ee=r[10],j=r[14],M=r[3],te=r[7],ne=r[11],N=r[15];return i[0]=a*x+o*T+s*k+c*M,i[4]=a*S+o*E+s*A+c*te,i[8]=a*C+o*D+s*ee+c*ne,i[12]=a*w+o*O+s*j+c*N,i[1]=l*x+u*T+d*k+f*M,i[5]=l*S+u*E+d*A+f*te,i[9]=l*C+u*D+d*ee+f*ne,i[13]=l*w+u*O+d*j+f*N,i[2]=p*x+m*T+h*k+g*M,i[6]=p*S+m*E+h*A+g*te,i[10]=p*C+m*D+h*ee+g*ne,i[14]=p*w+m*O+h*j+g*N,i[3]=_*x+v*T+y*k+b*M,i[7]=_*S+v*E+y*A+b*te,i[11]=_*C+v*D+y*ee+b*ne,i[15]=_*w+v*O+y*j+b*N,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[12],a=e[1],o=e[5],s=e[9],c=e[13],l=e[2],u=e[6],d=e[10],f=e[14],p=e[3],m=e[7],h=e[11],g=e[15],_=s*f-c*d,v=o*f-c*u,y=o*d-s*u,b=a*f-c*l,x=a*d-s*l,S=a*u-o*l;return t*(m*_-h*v+g*y)-n*(p*_-h*b+g*x)+r*(p*v-m*b+g*S)-i*(p*y-m*x+h*S)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[1],a=e[5],o=e[9],s=e[2],c=e[6],l=e[10];return t*(a*l-o*c)-n*(i*l-o*s)+r*(i*c-a*s)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=t*c-i*a,b=n*s-r*o,x=n*c-i*o,S=r*c-i*s,C=l*m-u*p,w=l*h-d*p,T=l*g-f*p,E=u*h-d*m,D=u*g-f*m,O=d*g-f*h,k=_*O-v*D+y*E+b*T-x*w+S*C;if(k===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let A=1/k;return e[0]=(o*O-s*D+c*E)*A,e[1]=(r*D-n*O-i*E)*A,e[2]=(m*S-h*x+g*b)*A,e[3]=(d*x-u*S-f*b)*A,e[4]=(s*T-a*O-c*w)*A,e[5]=(t*O-r*T+i*w)*A,e[6]=(h*y-p*S-g*v)*A,e[7]=(l*S-d*y+f*v)*A,e[8]=(a*D-o*T+c*C)*A,e[9]=(n*T-t*D-i*C)*A,e[10]=(p*x-m*y+g*_)*A,e[11]=(u*y-l*x-f*_)*A,e[12]=(o*w-a*E-s*C)*A,e[13]=(t*E-n*w+r*C)*A,e[14]=(m*v-p*b-h*_)*A,e[15]=(l*b-u*v+d*_)*A,this}scale(e){let t=this.elements,n=e.x,r=e.y,i=e.z;return t[0]*=n,t[4]*=r,t[8]*=i,t[1]*=n,t[5]*=r,t[9]*=i,t[2]*=n,t[6]*=r,t[10]*=i,t[3]*=n,t[7]*=r,t[11]*=i,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),r=Math.sin(t),i=1-n,a=e.x,o=e.y,s=e.z,c=i*a,l=i*o;return this.set(c*a+n,c*o-r*s,c*s+r*o,0,c*o+r*s,l*o+n,l*s-r*a,0,c*s-r*o,l*s+r*a,i*s*s+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,i,a){return this.set(1,n,i,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){let r=this.elements,i=t._x,a=t._y,o=t._z,s=t._w,c=i+i,l=a+a,u=o+o,d=i*c,f=i*l,p=i*u,m=a*l,h=a*u,g=o*u,_=s*c,v=s*l,y=s*u,b=n.x,x=n.y,S=n.z;return r[0]=(1-(m+g))*b,r[1]=(f+y)*b,r[2]=(p-v)*b,r[3]=0,r[4]=(f-y)*x,r[5]=(1-(d+g))*x,r[6]=(h+_)*x,r[7]=0,r[8]=(p+v)*S,r[9]=(h-_)*S,r[10]=(1-(d+m))*S,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let i=this.determinantAffine();if(i===0)return n.set(1,1,1),t.identity(),this;let a=$t.set(r[0],r[1],r[2]).length(),o=$t.set(r[4],r[5],r[6]).length(),s=$t.set(r[8],r[9],r[10]).length();i<0&&(a=-a),en.copy(this);let c=1/a,l=1/o,u=1/s;return en.elements[0]*=c,en.elements[1]*=c,en.elements[2]*=c,en.elements[4]*=l,en.elements[5]*=l,en.elements[6]*=l,en.elements[8]*=u,en.elements[9]*=u,en.elements[10]*=u,t.setFromRotationMatrix(en),n.x=a,n.y=o,n.z=s,this}makePerspective(e,t,n,r,i,a,o=Ge,s=!1){let c=this.elements,l=2*i/(t-e),u=2*i/(n-r),d=(t+e)/(t-e),f=(n+r)/(n-r),p,m;if(s)p=i/(a-i),m=a*i/(a-i);else if(o===2e3)p=-(a+i)/(a-i),m=-2*a*i/(a-i);else if(o===2001)p=-a/(a-i),m=-a*i/(a-i);else throw Error(`THREE.Matrix4.makePerspective(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,r,i,a,o=Ge,s=!1){let c=this.elements,l=2/(t-e),u=2/(n-r),d=-(t+e)/(t-e),f=-(n+r)/(n-r),p,m;if(s)p=1/(a-i),m=a/(a-i);else if(o===2e3)p=-2/(a-i),m=-(a+i)/(a-i);else if(o===2001)p=-1/(a-i),m=-i/(a-i);else throw Error(`THREE.Matrix4.makeOrthographic(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<16;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},$t=new H,en=new Qt,tn=new H(0,0,0),nn=new H(1,1,1),rn=new H,an=new H,on=new H,sn=new Qt,cn=new kt,ln=class e{constructor(t=0,n=0,r=0,i=e.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=r,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let r=e.elements,i=r[0],a=r[4],o=r[8],s=r[1],c=r[5],l=r[9],u=r[2],d=r[6],f=r[10];switch(t){case`XYZ`:this._y=Math.asin(B(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-l,f),this._z=Math.atan2(-a,i)):(this._x=Math.atan2(d,c),this._z=0);break;case`YXZ`:this._x=Math.asin(-B(l,-1,1)),Math.abs(l)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(s,c)):(this._y=Math.atan2(-u,i),this._z=0);break;case`ZXY`:this._x=Math.asin(B(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(s,i));break;case`ZYX`:this._y=Math.asin(-B(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(s,i)):(this._x=0,this._z=Math.atan2(-a,c));break;case`YZX`:this._z=Math.asin(B(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(-l,c),this._y=Math.atan2(-u,i)):(this._x=0,this._y=Math.atan2(o,f));break;case`XZY`:this._z=Math.asin(-B(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,i)):(this._x=Math.atan2(-l,f),this._y=0);break;default:R(`Euler: .setFromRotationMatrix() encountered an unknown order: `+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return sn.makeRotationFromQuaternion(e),this.setFromRotationMatrix(sn,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return cn.setFromEuler(this),this.setFromQuaternion(cn,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};ln.DEFAULT_ORDER=`XYZ`;var un=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!=0}},dn=0,fn=new H,pn=new kt,mn=new Qt,hn=new H,gn=new H,_n=new H,vn=new kt,yn=new H(1,0,0),bn=new H(0,1,0),xn=new H(0,0,1),Sn={type:`added`},Cn={type:`removed`},wn={type:`childadded`,child:null},Tn={type:`childremoved`,child:null},En=class e extends nt{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:dn++}),this.uuid=st(),this.name=``,this.type=`Object3D`,this.parent=null,this.children=[],this.up=e.DEFAULT_UP.clone();let t=new H,n=new ln,r=new kt,i=new H(1,1,1);function a(){r.setFromEuler(n,!1)}function o(){n.setFromQuaternion(r,void 0,!1)}n._onChange(a),r._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:r},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new Qt},normalMatrix:{value:new U}}),this.matrix=new Qt,this.matrixWorld=new Qt,this.matrixAutoUpdate=e.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new un,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return pn.setFromAxisAngle(e,t),this.quaternion.multiply(pn),this}rotateOnWorldAxis(e,t){return pn.setFromAxisAngle(e,t),this.quaternion.premultiply(pn),this}rotateX(e){return this.rotateOnAxis(yn,e)}rotateY(e){return this.rotateOnAxis(bn,e)}rotateZ(e){return this.rotateOnAxis(xn,e)}translateOnAxis(e,t){return fn.copy(e).applyQuaternion(this.quaternion),this.position.add(fn.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(yn,e)}translateY(e){return this.translateOnAxis(bn,e)}translateZ(e){return this.translateOnAxis(xn,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(mn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?hn.copy(e):hn.set(e,t,n);let r=this.parent;this.updateWorldMatrix(!0,!1),gn.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?mn.lookAt(gn,hn,this.up):mn.lookAt(hn,gn,this.up),this.quaternion.setFromRotationMatrix(mn),r&&(mn.extractRotation(r.matrixWorld),pn.setFromRotationMatrix(mn),this.quaternion.premultiply(pn.invert()))}add(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return e===this?(z(`Object3D.add: object can't be added as a child of itself.`,e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Sn),wn.child=e,this.dispatchEvent(wn),wn.child=null):z(`Object3D.add: object not an instance of THREE.Object3D.`,e),this)}remove(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.remove(arguments[e]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Cn),Tn.child=e,this.dispatchEvent(Tn),Tn.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),mn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),mn.multiply(e.parent.matrixWorld)),e.applyMatrix4(mn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Sn),wn.child=e,this.dispatchEvent(wn),wn.child=null,this}getObjectById(e){return this.getObjectByProperty(`id`,e)}getObjectByName(e){return this.getObjectByProperty(`name`,e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){let r=this.children[n].getObjectByProperty(e,t);if(r!==void 0)return r}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let r=this.children;for(let i=0,a=r.length;i<a;i++)r[i].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(gn,e,_n),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(gn,vn,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,r=e.z,i=this.matrix.elements;i[12]+=t-i[0]*t-i[4]*n-i[8]*r,i[13]+=n-i[1]*t-i[5]*n-i[9]*r,i[14]+=r-i[2]*t-i[6]*n-i[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let e=this.children;for(let t=0,r=e.length;t<r;t++)e[t].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e==`string`,n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:`Object`,generator:`Object3D.toJSON`});let r={};r.uuid=this.uuid,r.type=this.type,this.name!==``&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),this.static!==!1&&(r.static=this.static),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type=`InstancedMesh`,r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type=`BatchedMesh`,r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(e=>({...e,boundingBox:e.boundingBox?e.boundingBox.toJSON():void 0,boundingSphere:e.boundingSphere?e.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(e=>({...e})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function i(t,n){return t[n.uuid]===void 0&&(t[n.uuid]=n.toJSON(e)),n.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=i(e.geometries,this.geometry);let t=this.geometry.parameters;if(t!==void 0&&t.shapes!==void 0){let n=t.shapes;if(Array.isArray(n))for(let t=0,r=n.length;t<r;t++){let r=n[t];i(e.shapes,r)}else i(e.shapes,n)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(i(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let t=[];for(let n=0,r=this.material.length;n<r;n++)t.push(i(e.materials,this.material[n]));r.material=t}else r.material=i(e.materials,this.material);if(this.children.length>0){r.children=[];for(let t=0;t<this.children.length;t++)r.children.push(this.children[t].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let t=0;t<this.animations.length;t++){let n=this.animations[t];r.animations.push(i(e.animations,n))}}if(t){let t=a(e.geometries),r=a(e.materials),i=a(e.textures),o=a(e.images),s=a(e.shapes),c=a(e.skeletons),l=a(e.animations),u=a(e.nodes);t.length>0&&(n.geometries=t),r.length>0&&(n.materials=r),i.length>0&&(n.textures=i),o.length>0&&(n.images=o),s.length>0&&(n.shapes=s),c.length>0&&(n.skeletons=c),l.length>0&&(n.animations=l),u.length>0&&(n.nodes=u)}return n.object=r,n;function a(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot===null?null:e.pivot.clone(),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let t=0;t<e.children.length;t++){let n=e.children[t];this.add(n.clone())}return this}};En.DEFAULT_UP=new H(0,1,0),En.DEFAULT_MATRIX_AUTO_UPDATE=!0,En.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Dn=class extends En{constructor(){super(),this.isGroup=!0,this.type=`Group`}},On={type:`move`},kn=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Dn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Dn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new H,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new H),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Dn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new H,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new H,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:`connected`,data:e}),this}disconnect(e){return this.dispatchEvent({type:`disconnected`,data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,i=null,a=null,o=this._targetRay,s=this._grip,c=this._hand;if(e&&t.session.visibilityState!==`visible-blurred`){if(c&&e.hand){a=!0;for(let r of e.hand.values()){let e=t.getJointPose(r,n),i=this._getHandJoint(c,r);e!==null&&(i.matrix.fromArray(e.transform.matrix),i.matrix.decompose(i.position,i.rotation,i.scale),i.matrixWorldNeedsUpdate=!0,i.jointRadius=e.radius),i.visible=e!==null}let r=c.joints[`index-finger-tip`],i=c.joints[`thumb-tip`],o=r.position.distanceTo(i.position);c.inputState.pinching&&o>.025?(c.inputState.pinching=!1,this.dispatchEvent({type:`pinchend`,handedness:e.handedness,target:this})):!c.inputState.pinching&&o<=.015&&(c.inputState.pinching=!0,this.dispatchEvent({type:`pinchstart`,handedness:e.handedness,target:this}))}else s!==null&&e.gripSpace&&(i=t.getPose(e.gripSpace,n),i!==null&&(s.matrix.fromArray(i.transform.matrix),s.matrix.decompose(s.position,s.rotation,s.scale),s.matrixWorldNeedsUpdate=!0,i.linearVelocity?(s.hasLinearVelocity=!0,s.linearVelocity.copy(i.linearVelocity)):s.hasLinearVelocity=!1,i.angularVelocity?(s.hasAngularVelocity=!0,s.angularVelocity.copy(i.angularVelocity)):s.hasAngularVelocity=!1,s.eventsEnabled&&s.dispatchEvent({type:`gripUpdated`,data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&i!==null&&(r=i),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(On)))}return o!==null&&(o.visible=r!==null),s!==null&&(s.visible=i!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new Dn;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},An={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},jn={h:0,s:0,l:0},Mn={h:0,s:0,l:0};function Nn(e,t,n){return n<0&&(n+=1),n>1&&--n,n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}var W=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let t=e;t&&t.isColor?this.copy(t):typeof t==`number`?this.setHex(t):typeof t==`string`&&this.setStyle(t)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Re){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,It.colorSpaceToWorking(this,t),this}setRGB(e,t,n,r=It.workingColorSpace){return this.r=e,this.g=t,this.b=n,It.colorSpaceToWorking(this,r),this}setHSL(e,t,n,r=It.workingColorSpace){if(e=ct(e,1),t=B(t,0,1),n=B(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,i=2*n-r;this.r=Nn(i,r,e+1/3),this.g=Nn(i,r,e),this.b=Nn(i,r,e-1/3)}return It.colorSpaceToWorking(this,r),this}setStyle(e,t=Re){function n(t){t!==void 0&&parseFloat(t)<1&&R(`Color: Alpha component of `+e+` will be ignored.`)}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let i,a=r[1],o=r[2];switch(a){case`rgb`:case`rgba`:if(i=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(255,parseInt(i[1],10))/255,Math.min(255,parseInt(i[2],10))/255,Math.min(255,parseInt(i[3],10))/255,t);if(i=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(100,parseInt(i[1],10))/100,Math.min(100,parseInt(i[2],10))/100,Math.min(100,parseInt(i[3],10))/100,t);break;case`hsl`:case`hsla`:if(i=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setHSL(parseFloat(i[1])/360,parseFloat(i[2])/100,parseFloat(i[3])/100,t);break;default:R(`Color: Unknown color model `+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let n=r[1],i=n.length;if(i===3)return this.setRGB(parseInt(n.charAt(0),16)/15,parseInt(n.charAt(1),16)/15,parseInt(n.charAt(2),16)/15,t);if(i===6)return this.setHex(parseInt(n,16),t);R(`Color: Invalid hex color `+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Re){let n=An[e.toLowerCase()];return n===void 0?R(`Color: Unknown color `+e):this.setHex(n,t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Lt(e.r),this.g=Lt(e.g),this.b=Lt(e.b),this}copyLinearToSRGB(e){return this.r=Rt(e.r),this.g=Rt(e.g),this.b=Rt(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Re){return It.workingToColorSpace(Pn.copy(this),e),Math.round(B(Pn.r*255,0,255))*65536+Math.round(B(Pn.g*255,0,255))*256+Math.round(B(Pn.b*255,0,255))}getHexString(e=Re){return(`000000`+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=It.workingColorSpace){It.workingToColorSpace(Pn.copy(this),t);let n=Pn.r,r=Pn.g,i=Pn.b,a=Math.max(n,r,i),o=Math.min(n,r,i),s,c,l=(o+a)/2;if(o===a)s=0,c=0;else{let e=a-o;switch(c=l<=.5?e/(a+o):e/(2-a-o),a){case n:s=(r-i)/e+(r<i?6:0);break;case r:s=(i-n)/e+2;break;case i:s=(n-r)/e+4;break}s/=6}return e.h=s,e.s=c,e.l=l,e}getRGB(e,t=It.workingColorSpace){return It.workingToColorSpace(Pn.copy(this),t),e.r=Pn.r,e.g=Pn.g,e.b=Pn.b,e}getStyle(e=Re){It.workingToColorSpace(Pn.copy(this),e);let t=Pn.r,n=Pn.g,r=Pn.b;return e===`srgb`?`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`:`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`}offsetHSL(e,t,n){return this.getHSL(jn),this.setHSL(jn.h+e,jn.s+t,jn.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(jn),e.getHSL(Mn);let n=dt(jn.h,Mn.h,t),r=dt(jn.s,Mn.s,t),i=dt(jn.l,Mn.l,t);return this.setHSL(n,r,i),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,r=this.b,i=e.elements;return this.r=i[0]*t+i[3]*n+i[6]*r,this.g=i[1]*t+i[4]*n+i[7]*r,this.b=i[2]*t+i[5]*n+i[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Pn=new W;W.NAMES=An;var Fn=class e{constructor(e,t=1,n=1e3){this.isFog=!0,this.name=``,this.color=new W(e),this.near=t,this.far=n}clone(){return new e(this.color,this.near,this.far)}toJSON(){return{type:`Fog`,name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},In=class extends En{constructor(){super(),this.isScene=!0,this.type=`Scene`,this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new ln,this.environmentIntensity=1,this.environmentRotation=new ln,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}},Ln=new H,Rn=new H,zn=new H,Bn=new H,Vn=new H,Hn=new H,Un=new H,Wn=new H,Gn=new H,Kn=new H,qn=new qt,Jn=new qt,Yn=new qt,Xn=class e{constructor(e=new H,t=new H,n=new H){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),Ln.subVectors(e,t),r.cross(Ln);let i=r.lengthSq();return i>0?r.multiplyScalar(1/Math.sqrt(i)):r.set(0,0,0)}static getBarycoord(e,t,n,r,i){Ln.subVectors(r,t),Rn.subVectors(n,t),zn.subVectors(e,t);let a=Ln.dot(Ln),o=Ln.dot(Rn),s=Ln.dot(zn),c=Rn.dot(Rn),l=Rn.dot(zn),u=a*c-o*o;if(u===0)return i.set(0,0,0),null;let d=1/u,f=(c*s-o*l)*d,p=(a*l-o*s)*d;return i.set(1-f-p,p,f)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,Bn)!==null&&Bn.x>=0&&Bn.y>=0&&Bn.x+Bn.y<=1}static getInterpolation(e,t,n,r,i,a,o,s){return this.getBarycoord(e,t,n,r,Bn)===null?(s.x=0,s.y=0,`z`in s&&(s.z=0),`w`in s&&(s.w=0),null):(s.setScalar(0),s.addScaledVector(i,Bn.x),s.addScaledVector(a,Bn.y),s.addScaledVector(o,Bn.z),s)}static getInterpolatedAttribute(e,t,n,r,i,a){return qn.setScalar(0),Jn.setScalar(0),Yn.setScalar(0),qn.fromBufferAttribute(e,t),Jn.fromBufferAttribute(e,n),Yn.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(qn,i.x),a.addScaledVector(Jn,i.y),a.addScaledVector(Yn,i.z),a}static isFrontFacing(e,t,n,r){return Ln.subVectors(n,t),Rn.subVectors(e,t),Ln.cross(Rn).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Ln.subVectors(this.c,this.b),Rn.subVectors(this.a,this.b),Ln.cross(Rn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return e.getNormal(this.a,this.b,this.c,t)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return e.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,r,i,a){return e.getInterpolation(t,this.a,this.b,this.c,n,r,i,a)}containsPoint(t){return e.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return e.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,r=this.b,i=this.c,a,o;Vn.subVectors(r,n),Hn.subVectors(i,n),Wn.subVectors(e,n);let s=Vn.dot(Wn),c=Hn.dot(Wn);if(s<=0&&c<=0)return t.copy(n);Gn.subVectors(e,r);let l=Vn.dot(Gn),u=Hn.dot(Gn);if(l>=0&&u<=l)return t.copy(r);let d=s*u-l*c;if(d<=0&&s>=0&&l<=0)return a=s/(s-l),t.copy(n).addScaledVector(Vn,a);Kn.subVectors(e,i);let f=Vn.dot(Kn),p=Hn.dot(Kn);if(p>=0&&f<=p)return t.copy(i);let m=f*c-s*p;if(m<=0&&c>=0&&p<=0)return o=c/(c-p),t.copy(n).addScaledVector(Hn,o);let h=l*p-f*u;if(h<=0&&u-l>=0&&f-p>=0)return Un.subVectors(i,r),o=(u-l)/(u-l+(f-p)),t.copy(r).addScaledVector(Un,o);let g=1/(h+m+d);return a=m*g,o=d*g,t.copy(n).addScaledVector(Vn,a).addScaledVector(Hn,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Zn=class{constructor(e=new H(1/0,1/0,1/0),t=new H(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint($n.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint($n.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=$n.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute(`position`);if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let t=0,n=r.count;t<n;t++)e.isMesh===!0?e.getVertexPosition(t,$n):$n.fromBufferAttribute(r,t),$n.applyMatrix4(e.matrixWorld),this.expandByPoint($n);else e.boundingBox===void 0?(n.boundingBox===null&&n.computeBoundingBox(),er.copy(n.boundingBox)):(e.boundingBox===null&&e.computeBoundingBox(),er.copy(e.boundingBox)),er.applyMatrix4(e.matrixWorld),this.union(er)}let r=e.children;for(let e=0,n=r.length;e<n;e++)this.expandByObject(r[e],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,$n),$n.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(sr),cr.subVectors(this.max,sr),tr.subVectors(e.a,sr),nr.subVectors(e.b,sr),rr.subVectors(e.c,sr),ir.subVectors(nr,tr),ar.subVectors(rr,nr),or.subVectors(tr,rr);let t=[0,-ir.z,ir.y,0,-ar.z,ar.y,0,-or.z,or.y,ir.z,0,-ir.x,ar.z,0,-ar.x,or.z,0,-or.x,-ir.y,ir.x,0,-ar.y,ar.x,0,-or.y,or.x,0];return!dr(t,tr,nr,rr,cr)||(t=[1,0,0,0,1,0,0,0,1],!dr(t,tr,nr,rr,cr))?!1:(lr.crossVectors(ir,ar),t=[lr.x,lr.y,lr.z],dr(t,tr,nr,rr,cr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,$n).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize($n).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Qn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Qn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Qn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Qn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Qn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Qn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Qn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Qn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Qn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},Qn=[new H,new H,new H,new H,new H,new H,new H,new H],$n=new H,er=new Zn,tr=new H,nr=new H,rr=new H,ir=new H,ar=new H,or=new H,sr=new H,cr=new H,lr=new H,ur=new H;function dr(e,t,n,r,i){for(let a=0,o=e.length-3;a<=o;a+=3){ur.fromArray(e,a);let o=i.x*Math.abs(ur.x)+i.y*Math.abs(ur.y)+i.z*Math.abs(ur.z),s=t.dot(ur),c=n.dot(ur),l=r.dot(ur);if(Math.max(-Math.max(s,c,l),Math.min(s,c,l))>o)return!1}return!0}var fr=new H,pr=new V,mr=0,hr=class extends nt{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw TypeError(`THREE.BufferAttribute: array should be a Typed Array.`);this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:mr++}),this.name=``,this.array=e,this.itemSize=t,this.count=e===void 0?0:e.length/t,this.normalized=n,this.usage=Ue,this.updateRanges=[],this.gpuType=h,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,i=this.itemSize;r<i;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)pr.fromBufferAttribute(this,t),pr.applyMatrix3(e),this.setXY(t,pr.x,pr.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)fr.fromBufferAttribute(this,t),fr.applyMatrix3(e),this.setXYZ(t,fr.x,fr.y,fr.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)fr.fromBufferAttribute(this,t),fr.applyMatrix4(e),this.setXYZ(t,fr.x,fr.y,fr.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)fr.fromBufferAttribute(this,t),fr.applyNormalMatrix(e),this.setXYZ(t,fr.x,fr.y,fr.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)fr.fromBufferAttribute(this,t),fr.transformDirection(e),this.setXYZ(t,fr.x,fr.y,fr.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Et(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Dt(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Et(t,this.array)),t}setX(e,t){return this.normalized&&(t=Dt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Et(t,this.array)),t}setY(e,t){return this.normalized&&(t=Dt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Et(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Dt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Et(t,this.array)),t}setW(e,t){return this.normalized&&(t=Dt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=Dt(t,this.array),n=Dt(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=Dt(t,this.array),n=Dt(n,this.array),r=Dt(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e*=this.itemSize,this.normalized&&(t=Dt(t,this.array),n=Dt(n,this.array),r=Dt(r,this.array),i=Dt(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=i,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==``&&(e.name=this.name),this.usage!==35044&&(e.usage=this.usage),e}dispose(){this.dispatchEvent({type:`dispose`})}},gr=class extends hr{constructor(e,t,n){super(new Uint16Array(e),t,n)}},_r=class extends hr{constructor(e,t,n){super(new Uint32Array(e),t,n)}},G=class extends hr{constructor(e,t,n){super(new Float32Array(e),t,n)}},vr=new Zn,yr=new H,br=new H,xr=class{constructor(e=new H,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t===void 0?vr.setFromPoints(e).getCenter(n):n.copy(t);let r=0;for(let t=0,i=e.length;t<i;t++)r=Math.max(r,n.distanceToSquared(e[t]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius*=e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;yr.subVectors(e,this.center);let t=yr.lengthSq();if(t>this.radius*this.radius){let e=Math.sqrt(t),n=(e-this.radius)*.5;this.center.addScaledVector(yr,n/e),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(br.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(yr.copy(e.center).add(br)),this.expandByPoint(yr.copy(e.center).sub(br))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},Sr=0,Cr=new Qt,wr=new En,Tr=new H,Er=new Zn,Dr=new Zn,Or=new H,kr=class e extends nt{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Sr++}),this.uuid=st(),this.name=``,this.type=`BufferGeometry`,this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Ke(e)?_r:gr)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let t=new U().getNormalMatrix(e);n.applyNormalMatrix(t),n.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return Cr.makeRotationFromQuaternion(e),this.applyMatrix4(Cr),this}rotateX(e){return Cr.makeRotationX(e),this.applyMatrix4(Cr),this}rotateY(e){return Cr.makeRotationY(e),this.applyMatrix4(Cr),this}rotateZ(e){return Cr.makeRotationZ(e),this.applyMatrix4(Cr),this}translate(e,t,n){return Cr.makeTranslation(e,t,n),this.applyMatrix4(Cr),this}scale(e,t,n){return Cr.makeScale(e,t,n),this.applyMatrix4(Cr),this}lookAt(e){return wr.lookAt(e),wr.updateMatrix(),this.applyMatrix4(wr.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Tr).negate(),this.translate(Tr.x,Tr.y,Tr.z),this}setFromPoints(e){let t=this.getAttribute(`position`);if(t===void 0){let t=[];for(let n=0,r=e.length;n<r;n++){let r=e[n];t.push(r.x,r.y,r.z||0)}this.setAttribute(`position`,new G(t,3))}else{let n=Math.min(e.length,t.count);for(let r=0;r<n;r++){let n=e[r];t.setXYZ(r,n.x,n.y,n.z||0)}e.length>t.count&&R(`BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.`),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Zn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){z(`BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.`,this),this.boundingBox.set(new H(-1/0,-1/0,-1/0),new H(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];Er.setFromBufferAttribute(n),this.morphTargetsRelative?(Or.addVectors(this.boundingBox.min,Er.min),this.boundingBox.expandByPoint(Or),Or.addVectors(this.boundingBox.max,Er.max),this.boundingBox.expandByPoint(Or)):(this.boundingBox.expandByPoint(Er.min),this.boundingBox.expandByPoint(Er.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&z(`BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.`,this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new xr);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){z(`BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.`,this),this.boundingSphere.set(new H,1/0);return}if(e){let n=this.boundingSphere.center;if(Er.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];Dr.setFromBufferAttribute(n),this.morphTargetsRelative?(Or.addVectors(Er.min,Dr.min),Er.expandByPoint(Or),Or.addVectors(Er.max,Dr.max),Er.expandByPoint(Or)):(Er.expandByPoint(Dr.min),Er.expandByPoint(Dr.max))}Er.getCenter(n);let r=0;for(let t=0,i=e.count;t<i;t++)Or.fromBufferAttribute(e,t),r=Math.max(r,n.distanceToSquared(Or));if(t)for(let i=0,a=t.length;i<a;i++){let a=t[i],o=this.morphTargetsRelative;for(let t=0,i=a.count;t<i;t++)Or.fromBufferAttribute(a,t),o&&(Tr.fromBufferAttribute(e,t),Or.add(Tr)),r=Math.max(r,n.distanceToSquared(Or))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&z(`BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.`,this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){z(`BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)`);return}let n=t.position,r=t.normal,i=t.uv,a=this.getAttribute(`tangent`);(a===void 0||a.count!==n.count)&&(a=new hr(new Float32Array(4*n.count),4),this.setAttribute(`tangent`,a));let o=[],s=[];for(let e=0;e<n.count;e++)o[e]=new H,s[e]=new H;let c=new H,l=new H,u=new H,d=new V,f=new V,p=new V,m=new H,h=new H;function g(e,t,r){c.fromBufferAttribute(n,e),l.fromBufferAttribute(n,t),u.fromBufferAttribute(n,r),d.fromBufferAttribute(i,e),f.fromBufferAttribute(i,t),p.fromBufferAttribute(i,r),l.sub(c),u.sub(c),f.sub(d),p.sub(d);let a=1/(f.x*p.y-p.x*f.y);isFinite(a)&&(m.copy(l).multiplyScalar(p.y).addScaledVector(u,-f.y).multiplyScalar(a),h.copy(u).multiplyScalar(f.x).addScaledVector(l,-p.x).multiplyScalar(a),o[e].add(m),o[t].add(m),o[r].add(m),s[e].add(h),s[t].add(h),s[r].add(h))}let _=this.groups;_.length===0&&(_=[{start:0,count:e.count}]);for(let t=0,n=_.length;t<n;++t){let n=_[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)g(e.getX(t+0),e.getX(t+1),e.getX(t+2))}let v=new H,y=new H,b=new H,x=new H;function S(e){b.fromBufferAttribute(r,e),x.copy(b);let t=o[e];v.copy(t),v.sub(b.multiplyScalar(b.dot(t))).normalize(),y.crossVectors(x,t);let n=y.dot(s[e])<0?-1:1;a.setXYZW(e,v.x,v.y,v.z,n)}for(let t=0,n=_.length;t<n;++t){let n=_[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)S(e.getX(t+0)),S(e.getX(t+1)),S(e.getX(t+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute(`position`);if(t!==void 0){let n=this.getAttribute(`normal`);if(n===void 0||n.count!==t.count)n=new hr(new Float32Array(t.count*3),3),this.setAttribute(`normal`,n);else for(let e=0,t=n.count;e<t;e++)n.setXYZ(e,0,0,0);let r=new H,i=new H,a=new H,o=new H,s=new H,c=new H,l=new H,u=new H;if(e)for(let d=0,f=e.count;d<f;d+=3){let f=e.getX(d+0),p=e.getX(d+1),m=e.getX(d+2);r.fromBufferAttribute(t,f),i.fromBufferAttribute(t,p),a.fromBufferAttribute(t,m),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),o.fromBufferAttribute(n,f),s.fromBufferAttribute(n,p),c.fromBufferAttribute(n,m),o.add(l),s.add(l),c.add(l),n.setXYZ(f,o.x,o.y,o.z),n.setXYZ(p,s.x,s.y,s.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let e=0,o=t.count;e<o;e+=3)r.fromBufferAttribute(t,e+0),i.fromBufferAttribute(t,e+1),a.fromBufferAttribute(t,e+2),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),n.setXYZ(e+0,l.x,l.y,l.z),n.setXYZ(e+1,l.x,l.y,l.z),n.setXYZ(e+2,l.x,l.y,l.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Or.fromBufferAttribute(e,t),Or.normalize(),e.setXYZ(t,Or.x,Or.y,Or.z)}toNonIndexed(){function t(e,t){let n=e.array,r=e.itemSize,i=e.normalized,a=new n.constructor(t.length*r),o=0,s=0;for(let i=0,c=t.length;i<c;i++){o=e.isInterleavedBufferAttribute?t[i]*e.data.stride+e.offset:t[i]*r;for(let e=0;e<r;e++)a[s++]=n[o++]}return new hr(a,r,i)}if(this.index===null)return R(`BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.`),this;let n=new e,r=this.index.array,i=this.attributes;for(let e in i){let a=i[e],o=t(a,r);n.setAttribute(e,o)}let a=this.morphAttributes;for(let e in a){let i=[],o=a[e];for(let e=0,n=o.length;e<n;e++){let n=o[e],a=t(n,r);i.push(a)}n.morphAttributes[e]=i}n.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let e=0,t=o.length;e<t;e++){let t=o[e];n.addGroup(t.start,t.count,t.materialIndex)}return n}toJSON(){let e={metadata:{version:4.7,type:`BufferGeometry`,generator:`BufferGeometry.toJSON`}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?`BufferGeometry`:this.type,this.name!==``&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let t=this.parameters;for(let n in t)t[n]!==void 0&&(e[n]=t[n]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let t in n){let r=n[t];e.data.attributes[t]=r.toJSON(e.data)}let r={},i=!1;for(let t in this.morphAttributes){let n=this.morphAttributes[t],a=[];for(let t=0,r=n.length;t<r;t++){let r=n[t];a.push(r.toJSON(e.data))}a.length>0&&(r[t]=a,i=!0)}i&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let r=e.attributes;for(let e in r){let n=r[e];this.setAttribute(e,n.clone(t))}let i=e.morphAttributes;for(let e in i){let n=[],r=i[e];for(let e=0,i=r.length;e<i;e++)n.push(r[e].clone(t));this.morphAttributes[e]=n}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let e=0,t=a.length;e<t;e++){let t=a[e];this.addGroup(t.start,t.count,t.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let s=e.boundingSphere;return s!==null&&(this.boundingSphere=s.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:`dispose`})}},Ar=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e===void 0?0:e.length/t,this.usage=Ue,this.updateRanges=[],this.version=0,this.uuid=st()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let r=0,i=this.stride;r<i;r++)this.array[e+r]=t.array[n+r];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=st()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=st()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}},jr=new H,Mr=class e{constructor(e,t,n,r=!1){this.isInterleavedBufferAttribute=!0,this.name=``,this.data=e,this.itemSize=t,this.offset=n,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)jr.fromBufferAttribute(this,t),jr.applyMatrix4(e),this.setXYZ(t,jr.x,jr.y,jr.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)jr.fromBufferAttribute(this,t),jr.applyNormalMatrix(e),this.setXYZ(t,jr.x,jr.y,jr.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)jr.fromBufferAttribute(this,t),jr.transformDirection(e),this.setXYZ(t,jr.x,jr.y,jr.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=Et(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Dt(n,this.array)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=Dt(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=Dt(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=Dt(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=Dt(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=Et(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=Et(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=Et(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=Et(t,this.array)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=Dt(t,this.array),n=Dt(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=Dt(t,this.array),n=Dt(n,this.array),r=Dt(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=Dt(t,this.array),n=Dt(n,this.array),r=Dt(r,this.array),i=Dt(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this.data.array[e+3]=i,this}clone(t){if(t===void 0){Ze(`InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return new hr(new this.array.constructor(e),this.itemSize,this.normalized)}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new e(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){Ze(`InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},Nr=0,Pr=class extends nt{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Nr++}),this.uuid=st(),this.name=``,this.type=`Material`,this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new W(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=He,this.stencilZFail=He,this.stencilZPass=He,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){R(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){R(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(n):r&&r.isVector2&&n&&n.isVector2||r&&r.isEuler&&n&&n.isEuler||r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:`Material`,generator:`Material.toJSON`}};n.uuid=this.uuid,n.type=this.type,this.name!==``&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==1&&(n.blending=this.blending),this.side!==0&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==204&&(n.blendSrc=this.blendSrc),this.blendDst!==205&&(n.blendDst=this.blendDst),this.blendEquation!==100&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==3&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==519&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==7680&&(n.stencilFail=this.stencilFail),this.stencilZFail!==7680&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==7680&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.allowOverride===!1&&(n.allowOverride=!1),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==`round`&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==`round`&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}if(t){let t=r(e.textures),i=r(e.images);t.length>0&&(n.textures=t),i.length>0&&(n.images=i)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new W().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors==`number`?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let t=e.normalScale;Array.isArray(t)===!1&&(t=[t,t]),this.normalScale=new V().fromArray(t)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new V().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let e=t.length;n=Array(e);for(let r=0;r!==e;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:`dispose`})}set needsUpdate(e){e===!0&&this.version++}},Fr=class extends Pr{constructor(e){super(),this.isSpriteMaterial=!0,this.type=`SpriteMaterial`,this.color=new W(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Ir,Lr=new H,Rr=new H,zr=new H,Br=new V,Vr=new V,Hr=new Qt,Ur=new H,Wr=new H,Gr=new H,Kr=new V,qr=new V,Jr=new V,Yr=class extends En{constructor(e=new Fr){if(super(),this.isSprite=!0,this.type=`Sprite`,Ir===void 0){Ir=new kr;let e=new Ar(new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),5);Ir.setIndex([0,1,2,0,2,3]),Ir.setAttribute(`position`,new Mr(e,3,0,!1)),Ir.setAttribute(`uv`,new Mr(e,2,3,!1))}this.geometry=Ir,this.material=e,this.center=new V(.5,.5),this.count=1}raycast(e,t){e.camera===null&&z(`Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.`),Rr.setFromMatrixScale(this.matrixWorld),Hr.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),zr.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&Rr.multiplyScalar(-zr.z);let n=this.material.rotation,r,i;n!==0&&(i=Math.cos(n),r=Math.sin(n));let a=this.center;Xr(Ur.set(-.5,-.5,0),zr,a,Rr,r,i),Xr(Wr.set(.5,-.5,0),zr,a,Rr,r,i),Xr(Gr.set(.5,.5,0),zr,a,Rr,r,i),Kr.set(0,0),qr.set(1,0),Jr.set(1,1);let o=e.ray.intersectTriangle(Ur,Wr,Gr,!1,Lr);if(o===null&&(Xr(Wr.set(-.5,.5,0),zr,a,Rr,r,i),qr.set(0,1),o=e.ray.intersectTriangle(Ur,Gr,Wr,!1,Lr),o===null))return;let s=e.ray.origin.distanceTo(Lr);s<e.near||s>e.far||t.push({distance:s,point:Lr.clone(),uv:Xn.getInterpolation(Lr,Ur,Wr,Gr,Kr,qr,Jr,new V),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}};function Xr(e,t,n,r,i,a){Br.subVectors(e,n).addScalar(.5).multiply(r),i===void 0?Vr.copy(Br):(Vr.x=a*Br.x-i*Br.y,Vr.y=i*Br.x+a*Br.y),e.copy(t),e.x+=Vr.x,e.y+=Vr.y,e.applyMatrix4(Hr)}var Zr=new H,Qr=new H,$r=new H,ei=new H,ti=new H,ni=new H,ri=new H,ii=class{constructor(e=new H,t=new H(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Zr)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Zr.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Zr.copy(this.origin).addScaledVector(this.direction,t),Zr.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){Qr.copy(e).add(t).multiplyScalar(.5),$r.copy(t).sub(e).normalize(),ei.copy(this.origin).sub(Qr);let i=e.distanceTo(t)*.5,a=-this.direction.dot($r),o=ei.dot(this.direction),s=-ei.dot($r),c=ei.lengthSq(),l=Math.abs(1-a*a),u,d,f,p;if(l>0)if(u=a*s-o,d=a*o-s,p=i*l,u>=0)if(d>=-p)if(d<=p){let e=1/l;u*=e,d*=e,f=u*(u+a*d+2*o)+d*(a*u+d+2*s)+c}else d=i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c;else d=-i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c;else d<=-p?(u=Math.max(0,-(-a*i+o)),d=u>0?-i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c):d<=p?(u=0,d=Math.min(Math.max(-i,-s),i),f=d*(d+2*s)+c):(u=Math.max(0,-(a*i+o)),d=u>0?i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c);else d=a>0?-i:i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(Qr).addScaledVector($r,d),f}intersectSphere(e,t){Zr.subVectors(e.center,this.origin);let n=Zr.dot(this.direction),r=Zr.dot(Zr)-n*n,i=e.radius*e.radius;if(r>i)return null;let a=Math.sqrt(i-r),o=n-a,s=n+a;return s<0?null:o<0?this.at(s,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,i,a,o,s,c=1/this.direction.x,l=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,r=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,r=(e.min.x-d.x)*c),l>=0?(i=(e.min.y-d.y)*l,a=(e.max.y-d.y)*l):(i=(e.max.y-d.y)*l,a=(e.min.y-d.y)*l),n>a||i>r||((i>n||isNaN(n))&&(n=i),(a<r||isNaN(r))&&(r=a),u>=0?(o=(e.min.z-d.z)*u,s=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,s=(e.min.z-d.z)*u),n>s||o>r)||((o>n||n!==n)&&(n=o),(s<r||r!==r)&&(r=s),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,Zr)!==null}intersectTriangle(e,t,n,r,i){ti.subVectors(t,e),ni.subVectors(n,e),ri.crossVectors(ti,ni);let a=this.direction.dot(ri),o;if(a>0){if(r)return null;o=1}else if(a<0)o=-1,a=-a;else return null;ei.subVectors(this.origin,e);let s=o*this.direction.dot(ni.crossVectors(ei,ni));if(s<0)return null;let c=o*this.direction.dot(ti.cross(ei));if(c<0||s+c>a)return null;let l=-o*ei.dot(ri);return l<0?null:this.at(l/a,i)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},ai=class extends Pr{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type=`MeshBasicMaterial`,this.color=new W(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ln,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},oi=new Qt,si=new ii,ci=new xr,li=new H,ui=new H,di=new H,fi=new H,pi=new H,mi=new H,hi=new H,gi=new H,_i=class extends En{constructor(e=new kr,t=new ai){super(),this.isMesh=!0,this.type=`Mesh`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}getVertexPosition(e,t){let n=this.geometry,r=n.attributes.position,i=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(i&&o){mi.set(0,0,0);for(let n=0,r=i.length;n<r;n++){let r=o[n],s=i[n];r!==0&&(pi.fromBufferAttribute(s,e),a?mi.addScaledVector(pi,r):mi.addScaledVector(pi.sub(t),r))}t.add(mi)}return t}raycast(e,t){let n=this.geometry,r=this.material,i=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),ci.copy(n.boundingSphere),ci.applyMatrix4(i),si.copy(e.ray).recast(e.near),!(ci.containsPoint(si.origin)===!1&&(si.intersectSphere(ci,li)===null||si.origin.distanceToSquared(li)>(e.far-e.near)**2))&&(oi.copy(i).invert(),si.copy(e.ray).applyMatrix4(oi),!(n.boundingBox!==null&&si.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,si)))}_computeIntersections(e,t,n){let r,i=this.geometry,a=this.material,o=i.index,s=i.attributes.position,c=i.attributes.uv,l=i.attributes.uv1,u=i.attributes.normal,d=i.groups,f=i.drawRange;if(o!==null)if(Array.isArray(a))for(let i=0,s=d.length;i<s;i++){let s=d[i],p=a[s.materialIndex],m=Math.max(s.start,f.start),h=Math.min(o.count,Math.min(s.start+s.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=o.getX(i),d=o.getX(i+1),f=o.getX(i+2);r=yi(this,p,e,n,c,l,u,a,d,f),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=s.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),s=Math.min(o.count,f.start+f.count);for(let d=i,f=s;d<f;d+=3){let i=o.getX(d),s=o.getX(d+1),f=o.getX(d+2);r=yi(this,a,e,n,c,l,u,i,s,f),r&&(r.faceIndex=Math.floor(d/3),t.push(r))}}else if(s!==void 0)if(Array.isArray(a))for(let i=0,o=d.length;i<o;i++){let o=d[i],p=a[o.materialIndex],m=Math.max(o.start,f.start),h=Math.min(s.count,Math.min(o.start+o.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=i,s=i+1,d=i+2;r=yi(this,p,e,n,c,l,u,a,s,d),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=o.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),o=Math.min(s.count,f.start+f.count);for(let s=i,d=o;s<d;s+=3){let i=s,o=s+1,d=s+2;r=yi(this,a,e,n,c,l,u,i,o,d),r&&(r.faceIndex=Math.floor(s/3),t.push(r))}}}};function vi(e,t,n,r,i,a,o,s){let c;if(c=t.side===1?r.intersectTriangle(o,a,i,!0,s):r.intersectTriangle(i,a,o,t.side===0,s),c===null)return null;gi.copy(s),gi.applyMatrix4(e.matrixWorld);let l=n.ray.origin.distanceTo(gi);return l<n.near||l>n.far?null:{distance:l,point:gi.clone(),object:e}}function yi(e,t,n,r,i,a,o,s,c,l){e.getVertexPosition(s,ui),e.getVertexPosition(c,di),e.getVertexPosition(l,fi);let u=vi(e,t,n,r,ui,di,fi,hi);if(u){let e=new H;Xn.getBarycoord(hi,ui,di,fi,e),i&&(u.uv=Xn.getInterpolatedAttribute(i,s,c,l,e,new V)),a&&(u.uv1=Xn.getInterpolatedAttribute(a,s,c,l,e,new V)),o&&(u.normal=Xn.getInterpolatedAttribute(o,s,c,l,e,new H),u.normal.dot(r.direction)>0&&u.normal.multiplyScalar(-1));let t={a:s,b:c,c:l,normal:new H,materialIndex:0};Xn.getNormal(ui,di,fi,t.normal),u.face=t,u.barycoord=e}return u}var bi=class extends Kt{constructor(e=null,t=1,n=1,i,a,o,s,c,l=r,u=r,d,f){super(null,o,s,c,l,u,i,a,d,f),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},xi=class extends hr{constructor(e,t,n,r=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},Si=new Qt,Ci=new Qt,wi=[],Ti=new Zn,Ei=new Qt,Di=new _i,Oi=new xr,ki=class extends _i{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new xi(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let e=0;e<n;e++)this.setMatrixAt(e,Ei)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Zn),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Si),Ti.copy(e.boundingBox).applyMatrix4(Si),this.boundingBox.union(Ti)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new xr),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Si),Oi.copy(e.boundingSphere).applyMatrix4(Si),this.boundingSphere.union(Oi)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,r=this.morphTexture.source.data.data,i=e*(n.length+1)+1;for(let e=0;e<n.length;e++)n[e]=r[i+e]}raycast(e,t){let n=this.matrixWorld,r=this.count;if(Di.geometry=this.geometry,Di.material=this.material,Di.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Oi.copy(this.boundingSphere),Oi.applyMatrix4(n),e.ray.intersectsSphere(Oi)!==!1))for(let i=0;i<r;i++){this.getMatrixAt(i,Si),Ci.multiplyMatrices(n,Si),Di.matrixWorld=Ci,Di.raycast(e,wi);for(let e=0,n=wi.length;e<n;e++){let n=wi[e];n.instanceId=i,n.object=this,t.push(n)}wi.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new xi(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let n=t.morphTargetInfluences,r=n.length+1;this.morphTexture===null&&(this.morphTexture=new bi(new Float32Array(r*this.count),r,this.count,D,h));let i=this.morphTexture.source.data.data,a=0;for(let e=0;e<n.length;e++)a+=n[e];let o=this.geometry.morphTargetsRelative?1:1-a,s=r*e;return i[s]=o,i.set(n,s+1),this}updateMorphTargets(){}dispose(){this.dispatchEvent({type:`dispose`}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},Ai=new H,ji=new H,Mi=new U,Ni=class{constructor(e=new H(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let r=Ai.subVectors(n,t).cross(ji.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let r=e.delta(Ai),i=this.normal.dot(r);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/i;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||Mi.getNormalMatrix(e),r=this.coplanarPoint(Ai).applyMatrix4(e),i=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(i),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},Pi=new xr,Fi=new V(.5,.5),Ii=new H,Li=class{constructor(e=new Ni,t=new Ni,n=new Ni,r=new Ni,i=new Ni,a=new Ni){this.planes=[e,t,n,r,i,a]}set(e,t,n,r,i,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(i),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=Ge,n=!1){let r=this.planes,i=e.elements,a=i[0],o=i[1],s=i[2],c=i[3],l=i[4],u=i[5],d=i[6],f=i[7],p=i[8],m=i[9],h=i[10],g=i[11],_=i[12],v=i[13],y=i[14],b=i[15];if(r[0].setComponents(c-a,f-l,g-p,b-_).normalize(),r[1].setComponents(c+a,f+l,g+p,b+_).normalize(),r[2].setComponents(c+o,f+u,g+m,b+v).normalize(),r[3].setComponents(c-o,f-u,g-m,b-v).normalize(),n)r[4].setComponents(s,d,h,y).normalize(),r[5].setComponents(c-s,f-d,g-h,b-y).normalize();else if(r[4].setComponents(c-s,f-d,g-h,b-y).normalize(),t===2e3)r[5].setComponents(c+s,f+d,g+h,b+y).normalize();else if(t===2001)r[5].setComponents(s,d,h,y).normalize();else throw Error(`THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: `+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Pi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Pi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Pi)}intersectsSprite(e){return Pi.center.set(0,0,0),Pi.radius=.7071067811865476+Fi.distanceTo(e.center),Pi.applyMatrix4(e.matrixWorld),this.intersectsSphere(Pi)}intersectsSphere(e){let t=this.planes,n=e.center,r=-e.radius;for(let e=0;e<6;e++)if(t[e].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let r=t[n];if(Ii.x=r.normal.x>0?e.max.x:e.min.x,Ii.y=r.normal.y>0?e.max.y:e.min.y,Ii.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Ii)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},Ri=class extends Pr{constructor(e){super(),this.isLineBasicMaterial=!0,this.type=`LineBasicMaterial`,this.color=new W(16777215),this.map=null,this.linewidth=1,this.linecap=`round`,this.linejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},zi=new H,Bi=new H,Vi=new Qt,Hi=new ii,Ui=new xr,Wi=new H,Gi=new H,Ki=class extends En{constructor(e=new kr,t=new Ri){super(),this.isLine=!0,this.type=`Line`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[0];for(let e=1,r=t.count;e<r;e++)zi.fromBufferAttribute(t,e-1),Bi.fromBufferAttribute(t,e),n[e]=n[e-1],n[e]+=zi.distanceTo(Bi);e.setAttribute(`lineDistance`,new G(n,1))}else R(`Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.`);return this}raycast(e,t){let n=this.geometry,r=this.matrixWorld,i=e.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Ui.copy(n.boundingSphere),Ui.applyMatrix4(r),Ui.radius+=i,e.ray.intersectsSphere(Ui)===!1)return;Vi.copy(r).invert(),Hi.copy(e.ray).applyMatrix4(Vi);let o=i/((this.scale.x+this.scale.y+this.scale.z)/3),s=o*o,c=this.isLineSegments?2:1,l=n.index,u=n.attributes.position;if(l!==null){let n=Math.max(0,a.start),r=Math.min(l.count,a.start+a.count);for(let i=n,a=r-1;i<a;i+=c){let n=l.getX(i),r=l.getX(i+1),a=qi(this,e,Hi,s,n,r,i);a&&t.push(a)}if(this.isLineLoop){let i=l.getX(r-1),a=l.getX(n),o=qi(this,e,Hi,s,i,a,r-1);o&&t.push(o)}}else{let n=Math.max(0,a.start),r=Math.min(u.count,a.start+a.count);for(let i=n,a=r-1;i<a;i+=c){let n=qi(this,e,Hi,s,i,i+1,i);n&&t.push(n)}if(this.isLineLoop){let i=qi(this,e,Hi,s,r-1,n,r-1);i&&t.push(i)}}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}};function qi(e,t,n,r,i,a,o){let s=e.geometry.attributes.position;if(zi.fromBufferAttribute(s,i),Bi.fromBufferAttribute(s,a),n.distanceSqToSegment(zi,Bi,Wi,Gi)>r)return;Wi.applyMatrix4(e.matrixWorld);let c=t.ray.origin.distanceTo(Wi);if(!(c<t.near||c>t.far))return{distance:c,point:Gi.clone().applyMatrix4(e.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:e}}var Ji=new H,Yi=new H,Xi=class extends Ki{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type=`LineSegments`}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[];for(let e=0,r=t.count;e<r;e+=2)Ji.fromBufferAttribute(t,e),Yi.fromBufferAttribute(t,e+1),n[e]=e===0?0:n[e-1],n[e+1]=n[e]+Ji.distanceTo(Yi);e.setAttribute(`lineDistance`,new G(n,1))}else R(`LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.`);return this}},Zi=class extends Pr{constructor(e){super(),this.isPointsMaterial=!0,this.type=`PointsMaterial`,this.color=new W(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Qi=new Qt,$i=new ii,ea=new xr,ta=new H,na=class extends En{constructor(e=new kr,t=new Zi){super(),this.isPoints=!0,this.type=`Points`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){let n=this.geometry,r=this.matrixWorld,i=e.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),ea.copy(n.boundingSphere),ea.applyMatrix4(r),ea.radius+=i,e.ray.intersectsSphere(ea)===!1)return;Qi.copy(r).invert(),$i.copy(e.ray).applyMatrix4(Qi);let o=i/((this.scale.x+this.scale.y+this.scale.z)/3),s=o*o,c=n.index,l=n.attributes.position;if(c!==null){let n=Math.max(0,a.start),i=Math.min(c.count,a.start+a.count);for(let a=n,o=i;a<o;a++){let n=c.getX(a);ta.fromBufferAttribute(l,n),ra(ta,n,s,r,e,t,this)}}else{let n=Math.max(0,a.start),i=Math.min(l.count,a.start+a.count);for(let a=n,o=i;a<o;a++)ta.fromBufferAttribute(l,a),ra(ta,a,s,r,e,t,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}};function ra(e,t,n,r,i,a,o){let s=$i.distanceSqToPoint(e);if(s<n){let n=new H;$i.closestPointToPoint(e,n),n.applyMatrix4(r);let c=i.ray.origin.distanceTo(n);if(c<i.near||c>i.far)return;a.push({distance:c,distanceToRay:Math.sqrt(s),point:n,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}var ia=class extends Kt{constructor(e=[],t=301,n,r,i,a,o,s,c,l){super(e,t,n,r,i,a,o,s,c,l),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},aa=class extends Kt{constructor(e,t,n,r,i,a,o,s,c){super(e,t,n,r,i,a,o,s,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},oa=class extends Kt{constructor(e,t,n=m,i,a,o,s=r,c=r,l,u=T,d=1){if(u!==1026&&u!==1027)throw Error(`THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat`);super({width:e,height:t,depth:d},i,a,o,s,c,u,n,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Ht(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},sa=class extends oa{constructor(e,t=m,n=301,i,a,o=r,s=r,c,l=T){let u={width:e,height:e,depth:1},d=[u,u,u,u,u,u];super(e,e,t,n,i,a,o,s,c,l),this.image=d,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},ca=class extends Kt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},la=class e extends kr{constructor(e=1,t=1,n=1,r=1,i=1,a=1){super(),this.type=`BoxGeometry`,this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:i,depthSegments:a};let o=this;r=Math.floor(r),i=Math.floor(i),a=Math.floor(a);let s=[],c=[],l=[],u=[],d=0,f=0;p(`z`,`y`,`x`,-1,-1,n,t,e,a,i,0),p(`z`,`y`,`x`,1,-1,n,t,-e,a,i,1),p(`x`,`z`,`y`,1,1,e,n,t,r,a,2),p(`x`,`z`,`y`,1,-1,e,n,-t,r,a,3),p(`x`,`y`,`z`,1,-1,e,t,n,r,i,4),p(`x`,`y`,`z`,-1,-1,e,t,-n,r,i,5),this.setIndex(s),this.setAttribute(`position`,new G(c,3)),this.setAttribute(`normal`,new G(l,3)),this.setAttribute(`uv`,new G(u,2));function p(e,t,n,r,i,a,p,m,h,g,_){let v=a/h,y=p/g,b=a/2,x=p/2,S=m/2,C=h+1,w=g+1,T=0,E=0,D=new H;for(let a=0;a<w;a++){let o=a*y-x;for(let s=0;s<C;s++)D[e]=(s*v-b)*r,D[t]=o*i,D[n]=S,c.push(D.x,D.y,D.z),D[e]=0,D[t]=0,D[n]=m>0?1:-1,l.push(D.x,D.y,D.z),u.push(s/h),u.push(1-a/g),T+=1}for(let e=0;e<g;e++)for(let t=0;t<h;t++){let n=d+t+C*e,r=d+t+C*(e+1),i=d+(t+1)+C*(e+1),a=d+(t+1)+C*e;s.push(n,r,a),s.push(r,i,a),E+=6}o.addGroup(f,E,_),f+=E,d+=T}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}},ua=class e extends kr{constructor(e=1,t=1,n=4,r=8,i=1){super(),this.type=`CapsuleGeometry`,this.parameters={radius:e,height:t,capSegments:n,radialSegments:r,heightSegments:i},t=Math.max(0,t),n=Math.max(1,Math.floor(n)),r=Math.max(3,Math.floor(r)),i=Math.max(1,Math.floor(i));let a=[],o=[],s=[],c=[],l=t/2,u=Math.PI/2*e,d=t,f=2*u+d,p=n*2+i,m=r+1,h=new H,g=new H;for(let _=0;_<=p;_++){let v=0,y=0,b=0,x=0;if(_<=n){let t=_/n,r=t*Math.PI/2;y=-l-e*Math.cos(r),b=e*Math.sin(r),x=-e*Math.cos(r),v=t*u}else if(_<=n+i){let r=(_-n)/i;y=-l+r*t,b=e,x=0,v=u+r*d}else{let t=(_-n-i)/n,r=t*Math.PI/2;y=l+e*Math.sin(r),b=e*Math.cos(r),x=e*Math.sin(r),v=u+d+t*u}let S=Math.max(0,Math.min(1,v/f)),C=0;_===0?C=.5/r:_===p&&(C=-.5/r);for(let e=0;e<=r;e++){let t=e/r,n=t*Math.PI*2,i=Math.sin(n),a=Math.cos(n);g.x=-b*a,g.y=y,g.z=b*i,o.push(g.x,g.y,g.z),h.set(-b*a,x,b*i),h.normalize(),s.push(h.x,h.y,h.z),c.push(t+C,S)}if(_>0){let e=(_-1)*m;for(let t=0;t<r;t++){let n=e+t,r=e+t+1,i=_*m+t,o=_*m+t+1;a.push(n,r,i),a.push(r,o,i)}}}this.setIndex(a),this.setAttribute(`position`,new G(o,3)),this.setAttribute(`normal`,new G(s,3)),this.setAttribute(`uv`,new G(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.height,t.capSegments,t.radialSegments,t.heightSegments)}},da=class e extends kr{constructor(e=1,t=32,n=0,r=Math.PI*2){super(),this.type=`CircleGeometry`,this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:r},t=Math.max(3,t);let i=[],a=[],o=[],s=[],c=new H,l=new V;a.push(0,0,0),o.push(0,0,1),s.push(.5,.5);for(let i=0,u=3;i<=t;i++,u+=3){let d=n+i/t*r;c.x=e*Math.cos(d),c.y=e*Math.sin(d),a.push(c.x,c.y,c.z),o.push(0,0,1),l.x=(a[u]/e+1)/2,l.y=(a[u+1]/e+1)/2,s.push(l.x,l.y)}for(let e=1;e<=t;e++)i.push(e,e+1,0);this.setIndex(i),this.setAttribute(`position`,new G(a,3)),this.setAttribute(`normal`,new G(o,3)),this.setAttribute(`uv`,new G(s,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.segments,t.thetaStart,t.thetaLength)}},fa=class e extends kr{constructor(e=1,t=1,n=1,r=32,i=1,a=!1,o=0,s=Math.PI*2){super(),this.type=`CylinderGeometry`,this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:r,heightSegments:i,openEnded:a,thetaStart:o,thetaLength:s};let c=this;r=Math.floor(r),i=Math.floor(i);let l=[],u=[],d=[],f=[],p=0,m=[],h=n/2,g=0;_(),a===!1&&(e>0&&v(!0),t>0&&v(!1)),this.setIndex(l),this.setAttribute(`position`,new G(u,3)),this.setAttribute(`normal`,new G(d,3)),this.setAttribute(`uv`,new G(f,2));function _(){let a=new H,_=new H,v=0,y=(t-e)/n;for(let c=0;c<=i;c++){let l=[],g=c/i,v=g*(t-e)+e;for(let e=0;e<=r;e++){let t=e/r,i=t*s+o,c=Math.sin(i),m=Math.cos(i);_.x=v*c,_.y=-g*n+h,_.z=v*m,u.push(_.x,_.y,_.z),a.set(c,y,m).normalize(),d.push(a.x,a.y,a.z),f.push(t,1-g),l.push(p++)}m.push(l)}for(let n=0;n<r;n++)for(let r=0;r<i;r++){let a=m[r][n],o=m[r+1][n],s=m[r+1][n+1],c=m[r][n+1];(e>0||r!==0)&&(l.push(a,o,c),v+=3),(t>0||r!==i-1)&&(l.push(o,s,c),v+=3)}c.addGroup(g,v,0),g+=v}function v(n){let i=p,a=new V,m=new H,_=0,v=n===!0?e:t,y=n===!0?1:-1;for(let e=1;e<=r;e++)u.push(0,h*y,0),d.push(0,y,0),f.push(.5,.5),p++;let b=p;for(let e=0;e<=r;e++){let t=e/r*s+o,n=Math.cos(t),i=Math.sin(t);m.x=v*i,m.y=h*y,m.z=v*n,u.push(m.x,m.y,m.z),d.push(0,y,0),a.x=n*.5+.5,a.y=i*.5*y+.5,f.push(a.x,a.y),p++}for(let e=0;e<r;e++){let t=i+e,r=b+e;n===!0?l.push(r,r+1,t):l.push(r+1,r,t),_+=3}c.addGroup(g,_,n===!0?1:2),g+=_}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},pa=class e extends fa{constructor(e=1,t=1,n=32,r=1,i=!1,a=0,o=Math.PI*2){super(0,e,t,n,r,i,a,o),this.type=`ConeGeometry`,this.parameters={radius:e,height:t,radialSegments:n,heightSegments:r,openEnded:i,thetaStart:a,thetaLength:o}}static fromJSON(t){return new e(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},ma=class e extends kr{constructor(e=[],t=[],n=1,r=0){super(),this.type=`PolyhedronGeometry`,this.parameters={vertices:e,indices:t,radius:n,detail:r};let i=[],a=[];o(r),c(n),l(),this.setAttribute(`position`,new G(i,3)),this.setAttribute(`normal`,new G(i.slice(),3)),this.setAttribute(`uv`,new G(a,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function o(e){let n=new H,r=new H,i=new H;for(let a=0;a<t.length;a+=3)f(t[a+0],n),f(t[a+1],r),f(t[a+2],i),s(n,r,i,e)}function s(e,t,n,r){let i=r+1,a=[];for(let r=0;r<=i;r++){a[r]=[];let o=e.clone().lerp(n,r/i),s=t.clone().lerp(n,r/i),c=i-r;for(let e=0;e<=c;e++)e===0&&r===i?a[r][e]=o:a[r][e]=o.clone().lerp(s,e/c)}for(let e=0;e<i;e++)for(let t=0;t<2*(i-e)-1;t++){let n=Math.floor(t/2);t%2==0?(d(a[e][n+1]),d(a[e+1][n]),d(a[e][n])):(d(a[e][n+1]),d(a[e+1][n+1]),d(a[e+1][n]))}}function c(e){let t=new H;for(let n=0;n<i.length;n+=3)t.x=i[n+0],t.y=i[n+1],t.z=i[n+2],t.normalize().multiplyScalar(e),i[n+0]=t.x,i[n+1]=t.y,i[n+2]=t.z}function l(){let e=new H;for(let t=0;t<i.length;t+=3){e.x=i[t+0],e.y=i[t+1],e.z=i[t+2];let n=h(e)/2/Math.PI+.5,r=g(e)/Math.PI+.5;a.push(n,1-r)}p(),u()}function u(){for(let e=0;e<a.length;e+=6){let t=a[e+0],n=a[e+2],r=a[e+4];Math.max(t,n,r)>.9&&Math.min(t,n,r)<.1&&(t<.2&&(a[e+0]+=1),n<.2&&(a[e+2]+=1),r<.2&&(a[e+4]+=1))}}function d(e){i.push(e.x,e.y,e.z)}function f(t,n){let r=t*3;n.x=e[r+0],n.y=e[r+1],n.z=e[r+2]}function p(){let e=new H,t=new H,n=new H,r=new H,o=new V,s=new V,c=new V;for(let l=0,u=0;l<i.length;l+=9,u+=6){e.set(i[l+0],i[l+1],i[l+2]),t.set(i[l+3],i[l+4],i[l+5]),n.set(i[l+6],i[l+7],i[l+8]),o.set(a[u+0],a[u+1]),s.set(a[u+2],a[u+3]),c.set(a[u+4],a[u+5]),r.copy(e).add(t).add(n).divideScalar(3);let d=h(r);m(o,u+0,e,d),m(s,u+2,t,d),m(c,u+4,n,d)}}function m(e,t,n,r){r<0&&e.x===1&&(a[t]=e.x-1),n.x===0&&n.z===0&&(a[t]=r/2/Math.PI+.5)}function h(e){return Math.atan2(e.z,-e.x)}function g(e){return Math.atan2(-e.y,Math.sqrt(e.x*e.x+e.z*e.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.vertices,t.indices,t.radius,t.detail)}};function ha(e,t,n=2){let r=t&&t.length,i=r?t[0]*n:e.length,a=ga(e,0,i,n,!0),o=[];if(!a||a.next===a.prev)return o;let s,c,l;if(r&&(a=Ca(e,t,a,n)),e.length>80*n){s=e[0],c=e[1];let t=s,r=c;for(let a=n;a<i;a+=n){let n=e[a],i=e[a+1];n<s&&(s=n),i<c&&(c=i),n>t&&(t=n),i>r&&(r=i)}l=Math.max(t-s,r-c),l=l===0?0:32767/l}return va(a,o,n,s,c,l,0),o}function ga(e,t,n,r,i){let a;if(i===qa(e,t,n,r)>0)for(let i=t;i<n;i+=r)a=Wa(i/r|0,e[i],e[i+1],a);else for(let i=n-r;i>=t;i-=r)a=Wa(i/r|0,e[i],e[i+1],a);return a&&Ia(a,a.next)&&(Ga(a),a=a.next),a}function _a(e,t){if(!e)return e;t||=e;let n=e,r;do if(r=!1,!n.steiner&&(Ia(n,n.next)||Fa(n.prev,n,n.next)===0)){if(Ga(n),n=t=n.prev,n===n.next)break;r=!0}else n=n.next;while(r||n!==t);return t}function va(e,t,n,r,i,a,o){if(!e)return;!o&&a&&Oa(e,r,i,a);let s=e;for(;e.prev!==e.next;){let c=e.prev,l=e.next;if(a?ba(e,r,i,a):ya(e)){t.push(c.i,e.i,l.i),Ga(e),e=l.next,s=l.next;continue}if(e=l,e===s){o?o===1?(e=xa(_a(e),t),va(e,t,n,r,i,a,2)):o===2&&Sa(e,t,n,r,i,a):va(_a(e),t,n,r,i,a,1);break}}}function ya(e){let t=e.prev,n=e,r=e.next;if(Fa(t,n,r)>=0)return!1;let i=t.x,a=n.x,o=r.x,s=t.y,c=n.y,l=r.y,u=Math.min(i,a,o),d=Math.min(s,c,l),f=Math.max(i,a,o),p=Math.max(s,c,l),m=r.next;for(;m!==t;){if(m.x>=u&&m.x<=f&&m.y>=d&&m.y<=p&&Na(i,s,a,c,o,l,m.x,m.y)&&Fa(m.prev,m,m.next)>=0)return!1;m=m.next}return!0}function ba(e,t,n,r){let i=e.prev,a=e,o=e.next;if(Fa(i,a,o)>=0)return!1;let s=i.x,c=a.x,l=o.x,u=i.y,d=a.y,f=o.y,p=Math.min(s,c,l),m=Math.min(u,d,f),h=Math.max(s,c,l),g=Math.max(u,d,f),_=Aa(p,m,t,n,r),v=Aa(h,g,t,n,r),y=e.prevZ,b=e.nextZ;for(;y&&y.z>=_&&b&&b.z<=v;){if(y.x>=p&&y.x<=h&&y.y>=m&&y.y<=g&&y!==i&&y!==o&&Na(s,u,c,d,l,f,y.x,y.y)&&Fa(y.prev,y,y.next)>=0||(y=y.prevZ,b.x>=p&&b.x<=h&&b.y>=m&&b.y<=g&&b!==i&&b!==o&&Na(s,u,c,d,l,f,b.x,b.y)&&Fa(b.prev,b,b.next)>=0))return!1;b=b.nextZ}for(;y&&y.z>=_;){if(y.x>=p&&y.x<=h&&y.y>=m&&y.y<=g&&y!==i&&y!==o&&Na(s,u,c,d,l,f,y.x,y.y)&&Fa(y.prev,y,y.next)>=0)return!1;y=y.prevZ}for(;b&&b.z<=v;){if(b.x>=p&&b.x<=h&&b.y>=m&&b.y<=g&&b!==i&&b!==o&&Na(s,u,c,d,l,f,b.x,b.y)&&Fa(b.prev,b,b.next)>=0)return!1;b=b.nextZ}return!0}function xa(e,t){let n=e;do{let r=n.prev,i=n.next.next;!Ia(r,i)&&La(r,n,n.next,i)&&Va(r,i)&&Va(i,r)&&(t.push(r.i,n.i,i.i),Ga(n),Ga(n.next),n=e=i),n=n.next}while(n!==e);return _a(n)}function Sa(e,t,n,r,i,a){let o=e;do{let e=o.next.next;for(;e!==o.prev;){if(o.i!==e.i&&Pa(o,e)){let s=Ua(o,e);o=_a(o,o.next),s=_a(s,s.next),va(o,t,n,r,i,a,0),va(s,t,n,r,i,a,0);return}e=e.next}o=o.next}while(o!==e)}function Ca(e,t,n,r){let i=[];for(let n=0,a=t.length;n<a;n++){let o=ga(e,t[n]*r,n<a-1?t[n+1]*r:e.length,r,!1);o===o.next&&(o.steiner=!0),i.push(ja(o))}i.sort(wa);for(let e=0;e<i.length;e++)n=Ta(i[e],n);return n}function wa(e,t){let n=e.x-t.x;return n===0&&(n=e.y-t.y,n===0&&(n=(e.next.y-e.y)/(e.next.x-e.x)-(t.next.y-t.y)/(t.next.x-t.x))),n}function Ta(e,t){let n=Ea(e,t);if(!n)return t;let r=Ua(n,e);return _a(r,r.next),_a(n,n.next)}function Ea(e,t){let n=t,r=e.x,i=e.y,a=-1/0,o;if(Ia(e,n))return n;do{if(Ia(e,n.next))return n.next;if(i<=n.y&&i>=n.next.y&&n.next.y!==n.y){let e=n.x+(i-n.y)*(n.next.x-n.x)/(n.next.y-n.y);if(e<=r&&e>a&&(a=e,o=n.x<n.next.x?n:n.next,e===r))return o}n=n.next}while(n!==t);if(!o)return null;let s=o,c=o.x,l=o.y,u=1/0;n=o;do{if(r>=n.x&&n.x>=c&&r!==n.x&&Ma(i<l?r:a,i,c,l,i<l?a:r,i,n.x,n.y)){let t=Math.abs(i-n.y)/(r-n.x);Va(n,e)&&(t<u||t===u&&(n.x>o.x||n.x===o.x&&Da(o,n)))&&(o=n,u=t)}n=n.next}while(n!==s);return o}function Da(e,t){return Fa(e.prev,e,t.prev)<0&&Fa(t.next,e,e.next)<0}function Oa(e,t,n,r){let i=e;do i.z===0&&(i.z=Aa(i.x,i.y,t,n,r)),i.prevZ=i.prev,i.nextZ=i.next,i=i.next;while(i!==e);i.prevZ.nextZ=null,i.prevZ=null,ka(i)}function ka(e){let t,n=1;do{let r=e,i;e=null;let a=null;for(t=0;r;){t++;let o=r,s=0;for(let e=0;e<n&&(s++,o=o.nextZ,o);e++);let c=n;for(;s>0||c>0&&o;)s!==0&&(c===0||!o||r.z<=o.z)?(i=r,r=r.nextZ,s--):(i=o,o=o.nextZ,c--),a?a.nextZ=i:e=i,i.prevZ=a,a=i;r=o}a.nextZ=null,n*=2}while(t>1);return e}function Aa(e,t,n,r,i){return e=(e-n)*i|0,t=(t-r)*i|0,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,e|t<<1}function ja(e){let t=e,n=e;do(t.x<n.x||t.x===n.x&&t.y<n.y)&&(n=t),t=t.next;while(t!==e);return n}function Ma(e,t,n,r,i,a,o,s){return(i-o)*(t-s)>=(e-o)*(a-s)&&(e-o)*(r-s)>=(n-o)*(t-s)&&(n-o)*(a-s)>=(i-o)*(r-s)}function Na(e,t,n,r,i,a,o,s){return!(e===o&&t===s)&&Ma(e,t,n,r,i,a,o,s)}function Pa(e,t){return e.next.i!==t.i&&e.prev.i!==t.i&&!Ba(e,t)&&(Va(e,t)&&Va(t,e)&&Ha(e,t)&&(Fa(e.prev,e,t.prev)||Fa(e,t.prev,t))||Ia(e,t)&&Fa(e.prev,e,e.next)>0&&Fa(t.prev,t,t.next)>0)}function Fa(e,t,n){return(t.y-e.y)*(n.x-t.x)-(t.x-e.x)*(n.y-t.y)}function Ia(e,t){return e.x===t.x&&e.y===t.y}function La(e,t,n,r){let i=za(Fa(e,t,n)),a=za(Fa(e,t,r)),o=za(Fa(n,r,e)),s=za(Fa(n,r,t));return!!(i!==a&&o!==s||i===0&&Ra(e,n,t)||a===0&&Ra(e,r,t)||o===0&&Ra(n,e,r)||s===0&&Ra(n,t,r))}function Ra(e,t,n){return t.x<=Math.max(e.x,n.x)&&t.x>=Math.min(e.x,n.x)&&t.y<=Math.max(e.y,n.y)&&t.y>=Math.min(e.y,n.y)}function za(e){return e>0?1:e<0?-1:0}function Ba(e,t){let n=e;do{if(n.i!==e.i&&n.next.i!==e.i&&n.i!==t.i&&n.next.i!==t.i&&La(n,n.next,e,t))return!0;n=n.next}while(n!==e);return!1}function Va(e,t){return Fa(e.prev,e,e.next)<0?Fa(e,t,e.next)>=0&&Fa(e,e.prev,t)>=0:Fa(e,t,e.prev)<0||Fa(e,e.next,t)<0}function Ha(e,t){let n=e,r=!1,i=(e.x+t.x)/2,a=(e.y+t.y)/2;do n.y>a!=n.next.y>a&&n.next.y!==n.y&&i<(n.next.x-n.x)*(a-n.y)/(n.next.y-n.y)+n.x&&(r=!r),n=n.next;while(n!==e);return r}function Ua(e,t){let n=Ka(e.i,e.x,e.y),r=Ka(t.i,t.x,t.y),i=e.next,a=t.prev;return e.next=t,t.prev=e,n.next=i,i.prev=n,r.next=n,n.prev=r,a.next=r,r.prev=a,r}function Wa(e,t,n,r){let i=Ka(e,t,n);return r?(i.next=r.next,i.prev=r,r.next.prev=i,r.next=i):(i.prev=i,i.next=i),i}function Ga(e){e.next.prev=e.prev,e.prev.next=e.next,e.prevZ&&(e.prevZ.nextZ=e.nextZ),e.nextZ&&(e.nextZ.prevZ=e.prevZ)}function Ka(e,t,n){return{i:e,x:t,y:n,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function qa(e,t,n,r){let i=0;for(let a=t,o=n-r;a<n;a+=r)i+=(e[o]-e[a])*(e[a+1]+e[o+1]),o=a;return i}var Ja=class{static triangulate(e,t,n=2){return ha(e,t,n)}},Ya=class e{static area(e){let t=e.length,n=0;for(let r=t-1,i=0;i<t;r=i++)n+=e[r].x*e[i].y-e[i].x*e[r].y;return n*.5}static isClockWise(t){return e.area(t)<0}static triangulateShape(e,t){let n=[],r=[],i=[];Xa(e),Za(n,e);let a=e.length;t.forEach(Xa);for(let e=0;e<t.length;e++)r.push(a),a+=t[e].length,Za(n,t[e]);let o=Ja.triangulate(n,r);for(let e=0;e<o.length;e+=3)i.push(o.slice(e,e+3));return i}};function Xa(e){let t=e.length;t>2&&e[t-1].equals(e[0])&&e.pop()}function Za(e,t){for(let n=0;n<t.length;n++)e.push(t[n].x),e.push(t[n].y)}var Qa=class e extends ma{constructor(e=1,t=0){let n=(1+Math.sqrt(5))/2,r=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1];super(r,[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1],e,t),this.type=`IcosahedronGeometry`,this.parameters={radius:e,detail:t}}static fromJSON(t){return new e(t.radius,t.detail)}},$a=class e extends ma{constructor(e=1,t=0){super([1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2],e,t),this.type=`OctahedronGeometry`,this.parameters={radius:e,detail:t}}static fromJSON(t){return new e(t.radius,t.detail)}},eo=class e extends kr{constructor(e=1,t=1,n=1,r=1){super(),this.type=`PlaneGeometry`,this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};let i=e/2,a=t/2,o=Math.floor(n),s=Math.floor(r),c=o+1,l=s+1,u=e/o,d=t/s,f=[],p=[],m=[],h=[];for(let e=0;e<l;e++){let t=e*d-a;for(let n=0;n<c;n++){let r=n*u-i;p.push(r,-t,0),m.push(0,0,1),h.push(n/o),h.push(1-e/s)}}for(let e=0;e<s;e++)for(let t=0;t<o;t++){let n=t+c*e,r=t+c*(e+1),i=t+1+c*(e+1),a=t+1+c*e;f.push(n,r,a),f.push(r,i,a)}this.setIndex(f),this.setAttribute(`position`,new G(p,3)),this.setAttribute(`normal`,new G(m,3)),this.setAttribute(`uv`,new G(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.widthSegments,t.heightSegments)}},to=class e extends kr{constructor(e=1,t=32,n=16,r=0,i=Math.PI*2,a=0,o=Math.PI){super(),this.type=`SphereGeometry`,this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:r,phiLength:i,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let s=Math.min(a+o,Math.PI),c=0,l=[],u=new H,d=new H,f=[],p=[],m=[],h=[];for(let f=0;f<=n;f++){let g=[],_=f/n,v=a+_*o,y=e*Math.cos(v),b=Math.sqrt(e*e-y*y),x=0;f===0&&a===0?x=.5/t:f===n&&s===Math.PI&&(x=-.5/t);for(let e=0;e<=t;e++){let n=e/t,a=r+n*i;u.x=-b*Math.cos(a),u.y=y,u.z=b*Math.sin(a),p.push(u.x,u.y,u.z),d.copy(u).normalize(),m.push(d.x,d.y,d.z),h.push(n+x,1-_),g.push(c++)}l.push(g)}for(let e=0;e<n;e++)for(let r=0;r<t;r++){let t=l[e][r+1],i=l[e][r],o=l[e+1][r],c=l[e+1][r+1];(e!==0||a>0)&&f.push(t,i,c),(e!==n-1||s<Math.PI)&&f.push(i,o,c)}this.setIndex(f),this.setAttribute(`position`,new G(p,3)),this.setAttribute(`normal`,new G(m,3)),this.setAttribute(`uv`,new G(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}},no=class e extends kr{constructor(e=1,t=.4,n=12,r=48,i=Math.PI*2,a=0,o=Math.PI*2){super(),this.type=`TorusGeometry`,this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:r,arc:i,thetaStart:a,thetaLength:o},n=Math.floor(n),r=Math.floor(r);let s=[],c=[],l=[],u=[],d=new H,f=new H,p=new H;for(let s=0;s<=n;s++){let m=a+s/n*o;for(let a=0;a<=r;a++){let o=a/r*i;f.x=(e+t*Math.cos(m))*Math.cos(o),f.y=(e+t*Math.cos(m))*Math.sin(o),f.z=t*Math.sin(m),c.push(f.x,f.y,f.z),d.x=e*Math.cos(o),d.y=e*Math.sin(o),p.subVectors(f,d).normalize(),l.push(p.x,p.y,p.z),u.push(a/r),u.push(s/n)}}for(let e=1;e<=n;e++)for(let t=1;t<=r;t++){let n=(r+1)*e+t-1,i=(r+1)*(e-1)+t-1,a=(r+1)*(e-1)+t,o=(r+1)*e+t;s.push(n,i,o),s.push(i,a,o)}this.setIndex(s),this.setAttribute(`position`,new G(c,3)),this.setAttribute(`normal`,new G(l,3)),this.setAttribute(`uv`,new G(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc)}},ro=class extends kr{constructor(e=null){if(super(),this.type=`WireframeGeometry`,this.parameters={geometry:e},e!==null){let t=[],n=new Set,r=new H,i=new H;if(e.index!==null){let a=e.attributes.position,o=e.index,s=e.groups;s.length===0&&(s=[{start:0,count:o.count,materialIndex:0}]);for(let e=0,c=s.length;e<c;++e){let c=s[e],l=c.start,u=c.count;for(let e=l,s=l+u;e<s;e+=3)for(let s=0;s<3;s++){let c=o.getX(e+s),l=o.getX(e+(s+1)%3);r.fromBufferAttribute(a,c),i.fromBufferAttribute(a,l),io(r,i,n)===!0&&(t.push(r.x,r.y,r.z),t.push(i.x,i.y,i.z))}}}else{let a=e.attributes.position;for(let e=0,o=a.count/3;e<o;e++)for(let o=0;o<3;o++){let s=3*e+o,c=3*e+(o+1)%3;r.fromBufferAttribute(a,s),i.fromBufferAttribute(a,c),io(r,i,n)===!0&&(t.push(r.x,r.y,r.z),t.push(i.x,i.y,i.z))}}this.setAttribute(`position`,new G(t,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}};function io(e,t,n){let r=`${e.x},${e.y},${e.z}-${t.x},${t.y},${t.z}`,i=`${t.x},${t.y},${t.z}-${e.x},${e.y},${e.z}`;return n.has(r)===!0||n.has(i)===!0?!1:(n.add(r),n.add(i),!0)}function ao(e){let t={};for(let n in e){t[n]={};for(let r in e[n]){let i=e[n][r];if(so(i))i.isRenderTargetTexture?(R(`UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().`),t[n][r]=null):t[n][r]=i.clone();else if(Array.isArray(i))if(so(i[0])){let e=[];for(let t=0,n=i.length;t<n;t++)e[t]=i[t].clone();t[n][r]=e}else t[n][r]=i.slice();else t[n][r]=i}}return t}function oo(e){let t={};for(let n=0;n<e.length;n++){let r=ao(e[n]);for(let e in r)t[e]=r[e]}return t}function so(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function co(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function lo(e){let t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:It.workingColorSpace}var uo={clone:ao,merge:oo},fo=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,po=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,mo=class extends Pr{constructor(e){super(),this.isShaderMaterial=!0,this.type=`ShaderMaterial`,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=fo,this.fragmentShader=po,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=ao(e.uniforms),this.uniformsGroups=co(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let n in this.uniforms){let r=this.uniforms[n].value;r&&r.isTexture?t.uniforms[n]={type:`t`,value:r.toJSON(e).uuid}:r&&r.isColor?t.uniforms[n]={type:`c`,value:r.getHex()}:r&&r.isVector2?t.uniforms[n]={type:`v2`,value:r.toArray()}:r&&r.isVector3?t.uniforms[n]={type:`v3`,value:r.toArray()}:r&&r.isVector4?t.uniforms[n]={type:`v4`,value:r.toArray()}:r&&r.isMatrix3?t.uniforms[n]={type:`m3`,value:r.toArray()}:r&&r.isMatrix4?t.uniforms[n]={type:`m4`,value:r.toArray()}:t.uniforms[n]={value:r}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let e in this.extensions)this.extensions[e]===!0&&(n[e]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let r=e.uniforms[n];switch(this.uniforms[n]={},r.type){case`t`:this.uniforms[n].value=t[r.value]||null;break;case`c`:this.uniforms[n].value=new W().setHex(r.value);break;case`v2`:this.uniforms[n].value=new V().fromArray(r.value);break;case`v3`:this.uniforms[n].value=new H().fromArray(r.value);break;case`v4`:this.uniforms[n].value=new qt().fromArray(r.value);break;case`m3`:this.uniforms[n].value=new U().fromArray(r.value);break;case`m4`:this.uniforms[n].value=new Qt().fromArray(r.value);break;default:this.uniforms[n].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let t in e.extensions)this.extensions[t]=e.extensions[t];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},ho=class extends mo{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type=`RawShaderMaterial`}},go=class extends Pr{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type=`MeshStandardMaterial`,this.defines={STANDARD:``},this.color=new W(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new W(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new V(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ln,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:``},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},_o=class extends Pr{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type=`MeshDepthMaterial`,this.depthPacking=L,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},vo=class extends Pr{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type=`MeshDistanceMaterial`,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}},yo=class extends Ri{constructor(e){super(),this.isLineDashedMaterial=!0,this.type=`LineDashedMaterial`,this.scale=1,this.dashSize=3,this.gapSize=1,this.setValues(e)}copy(e){return super.copy(e),this.scale=e.scale,this.dashSize=e.dashSize,this.gapSize=e.gapSize,this}};function bo(e,t){return!e||e.constructor===t?e:typeof t.BYTES_PER_ELEMENT==`number`?new t(e):Array.prototype.slice.call(e)}var xo=class{constructor(e,t,n,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r===void 0?new t.constructor(n):r,this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,r=t[n],i=t[n-1];validate_interval:{seek:{let a;linear_scan:{forward_scan:if(!(e<r)){for(let a=n+2;;){if(r===void 0){if(e<i)break forward_scan;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(i=r,r=t[++n],e<r)break seek}a=t.length;break linear_scan}if(!(e>=i)){let o=t[1];e<o&&(n=2,i=o);for(let a=n-2;;){if(i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===a)break;if(r=i,i=t[--n-1],e>=i)break seek}a=n,n=0;break linear_scan}break validate_interval}for(;n<a;){let r=n+a>>>1;e<t[r]?a=r:n=r+1}if(r=t[n],i=t[n-1],i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,i,r)}return this.interpolate_(n,i,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,r=this.valueSize,i=e*r;for(let e=0;e!==r;++e)t[e]=n[i+e];return t}interpolate_(){throw Error(`THREE.Interpolant: Call to abstract method.`)}intervalChanged_(){}},So=class extends xo{constructor(e,t,n,r){super(e,t,n,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Ie,endingEnd:Ie}}intervalChanged_(e,t,n){let r=this.parameterPositions,i=e-2,a=e+1,o=r[i],s=r[a];if(o===void 0)switch(this.getSettings_().endingStart){case I:i=e,o=2*t-n;break;case Le:i=r.length-2,o=t+r[i]-r[i+1];break;default:i=e,o=n}if(s===void 0)switch(this.getSettings_().endingEnd){case I:a=e,s=2*n-t;break;case Le:a=1,s=n+r[1]-r[0];break;default:a=e-1,s=t}let c=(n-t)*.5,l=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(s-n),this._offsetPrev=i*l,this._offsetNext=a*l}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(n-t)/(r-t),m=p*p,h=m*p,g=-d*h+2*d*m-d*p,_=(1+d)*h+(-1.5-2*d)*m+(-.5+d)*p+1,v=(-1-f)*h+(1.5+f)*m+.5*p,y=f*h-f*m;for(let e=0;e!==o;++e)i[e]=g*a[l+e]+_*a[c+e]+v*a[s+e]+y*a[u+e];return i}},Co=class extends xo{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=(n-t)/(r-t),u=1-l;for(let e=0;e!==o;++e)i[e]=a[c+e]*u+a[s+e]*l;return i}},wo=class extends xo{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e){return this.copySampleValue_(e-1)}},To=class extends xo{interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this.inTangents,u=this.outTangents;if(!l||!u){let e=(n-t)/(r-t),l=1-e;for(let t=0;t!==o;++t)i[t]=a[c+t]*l+a[s+t]*e;return i}let d=o*2,f=e-1;for(let p=0;p!==o;++p){let o=a[c+p],m=a[s+p],h=f*d+p*2,g=u[h],_=u[h+1],v=e*d+p*2,y=l[v],b=l[v+1],x=(n-t)/(r-t),S,C,w,T,E;for(let e=0;e<8;e++){S=x*x,C=S*x,w=1-x,T=w*w,E=T*w;let e=E*t+3*T*x*g+3*w*S*y+C*r-n;if(Math.abs(e)<1e-10)break;let i=3*T*(g-t)+6*w*x*(y-g)+3*S*(r-y);if(Math.abs(i)<1e-10)break;x-=e/i,x=Math.max(0,Math.min(1,x))}i[p]=E*o+3*T*x*_+3*w*S*b+C*m}return i}},Eo=class{constructor(e,t,n,r){if(e===void 0)throw Error(`THREE.KeyframeTrack: track name is undefined`);if(t===void 0||t.length===0)throw Error(`THREE.KeyframeTrack: no keyframes in track named `+e);this.name=e,this.times=bo(t,this.TimeBufferType),this.values=bo(n,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:bo(e.times,Array),values:bo(e.values,Array)};let t=e.getInterpolation();t!==e.DefaultInterpolation&&(n.interpolation=t)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new wo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Co(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new So(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new To(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case Ne:t=this.InterpolantFactoryMethodDiscrete;break;case F:t=this.InterpolantFactoryMethodLinear;break;case Pe:t=this.InterpolantFactoryMethodSmooth;break;case Fe:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let t=`unsupported interpolation for `+this.ValueTypeName+` keyframe track named `+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw Error(t);return R(`KeyframeTrack:`,t),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Ne;case this.InterpolantFactoryMethodLinear:return F;case this.InterpolantFactoryMethodSmooth:return Pe;case this.InterpolantFactoryMethodBezier:return Fe}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]*=e}return this}trim(e,t){let n=this.times,r=n.length,i=0,a=r-1;for(;i!==r&&n[i]<e;)++i;for(;a!==-1&&n[a]>t;)--a;if(++a,i!==0||a!==r){i>=a&&(a=Math.max(a,1),i=a-1);let e=this.getValueSize();this.times=n.slice(i,a),this.values=this.values.slice(i*e,a*e)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(z(`KeyframeTrack: Invalid value size in track.`,this),e=!1);let n=this.times,r=this.values,i=n.length;i===0&&(z(`KeyframeTrack: Track is empty.`,this),e=!1);let a=null;for(let t=0;t!==i;t++){let r=n[t];if(typeof r==`number`&&isNaN(r)){z(`KeyframeTrack: Time is not a valid number.`,this,t,r),e=!1;break}if(a!==null&&a>r){z(`KeyframeTrack: Out of order keys.`,this,t,r,a),e=!1;break}a=r}if(r!==void 0&&qe(r))for(let t=0,n=r.length;t!==n;++t){let n=r[t];if(isNaN(n)){z(`KeyframeTrack: Value is not a valid number.`,this,t,n),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),r=this.getInterpolation()===Pe,i=e.length-1,a=1;for(let o=1;o<i;++o){let i=!1,s=e[o];if(s!==e[o+1]&&(o!==1||s!==e[0]))if(r)i=!0;else{let e=o*n,r=e-n,a=e+n;for(let o=0;o!==n;++o){let n=t[e+o];if(n!==t[r+o]||n!==t[a+o]){i=!0;break}}}if(i){if(o!==a){e[a]=e[o];let r=o*n,i=a*n;for(let e=0;e!==n;++e)t[i+e]=t[r+e]}++a}}if(i>0){e[a]=e[i];for(let e=i*n,r=a*n,o=0;o!==n;++o)t[r+o]=t[e+o];++a}return a===e.length?(this.times=e,this.values=t):(this.times=e.slice(0,a),this.values=t.slice(0,a*n)),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,r=new n(this.name,e,t);return r.createInterpolant=this.createInterpolant,r}};Eo.prototype.ValueTypeName=``,Eo.prototype.TimeBufferType=Float32Array,Eo.prototype.ValueBufferType=Float32Array,Eo.prototype.DefaultInterpolation=F;var Do=class extends Eo{constructor(e,t,n){super(e,t,n)}};Do.prototype.ValueTypeName=`bool`,Do.prototype.ValueBufferType=Array,Do.prototype.DefaultInterpolation=Ne,Do.prototype.InterpolantFactoryMethodLinear=void 0,Do.prototype.InterpolantFactoryMethodSmooth=void 0;var Oo=class extends Eo{constructor(e,t,n,r){super(e,t,n,r)}};Oo.prototype.ValueTypeName=`color`;var ko=class extends Eo{constructor(e,t,n,r){super(e,t,n,r)}};ko.prototype.ValueTypeName=`number`;var Ao=class extends xo{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=(n-t)/(r-t),c=e*o;for(let e=c+o;c!==e;c+=4)kt.slerpFlat(i,0,a,c-o,a,c,s);return i}},jo=class extends Eo{constructor(e,t,n,r){super(e,t,n,r)}InterpolantFactoryMethodLinear(e){return new Ao(this.times,this.values,this.getValueSize(),e)}};jo.prototype.ValueTypeName=`quaternion`,jo.prototype.InterpolantFactoryMethodSmooth=void 0;var Mo=class extends Eo{constructor(e,t,n){super(e,t,n)}};Mo.prototype.ValueTypeName=`string`,Mo.prototype.ValueBufferType=Array,Mo.prototype.DefaultInterpolation=Ne,Mo.prototype.InterpolantFactoryMethodLinear=void 0,Mo.prototype.InterpolantFactoryMethodSmooth=void 0;var No=class extends Eo{constructor(e,t,n,r){super(e,t,n,r)}};No.prototype.ValueTypeName=`vector`;var Po={enabled:!1,files:{},add:function(e,t){this.enabled!==!1&&(Fo(e)||(this.files[e]=t))},get:function(e){if(this.enabled!==!1&&!Fo(e))return this.files[e]},remove:function(e){delete this.files[e]},clear:function(){this.files={}}};function Fo(e){try{let t=e.slice(e.indexOf(`:`)+1);return new URL(t).protocol===`blob:`}catch{return!1}}var Io=new class{constructor(e,t,n){let r=this,i=!1,a=0,o=0,s,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this._abortController=null,this.itemStart=function(e){o++,i===!1&&r.onStart!==void 0&&r.onStart(e,a,o),i=!0},this.itemEnd=function(e){a++,r.onProgress!==void 0&&r.onProgress(e,a,o),a===o&&(i=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(e){r.onError!==void 0&&r.onError(e)},this.resolveURL=function(e){return e=e.normalize(`NFC`),s?s(e):e},this.setURLModifier=function(e){return s=e,this},this.addHandler=function(e,t){return c.push(e,t),this},this.removeHandler=function(e){let t=c.indexOf(e);return t!==-1&&c.splice(t,2),this},this.getHandler=function(e){for(let t=0,n=c.length;t<n;t+=2){let n=c[t],r=c[t+1];if(n.global&&(n.lastIndex=0),n.test(e))return r}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||=new AbortController,this._abortController}},Lo=class{constructor(e){this.manager=e===void 0?Io:e,this.crossOrigin=`anonymous`,this.withCredentials=!1,this.path=``,this.resourcePath=``,this.requestHeader={},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}load(){}loadAsync(e,t){let n=this;return new Promise(function(r,i){n.load(e,r,t,i)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};Lo.DEFAULT_MATERIAL_NAME=`__DEFAULT`;var Ro=new WeakMap,zo=class extends Lo{constructor(e){super(e)}load(e,t,n,r){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let i=this,a=Po.get(`image:${e}`);if(a!==void 0){if(a.complete===!0)i.manager.itemStart(e),setTimeout(function(){t&&t(a),i.manager.itemEnd(e)},0);else{let e=Ro.get(a);e===void 0&&(e=[],Ro.set(a,e)),e.push({onLoad:t,onError:r})}return a}let o=Je(`img`);function s(){l(),t&&t(this);let n=Ro.get(this)||[];for(let e=0;e<n.length;e++){let t=n[e];t.onLoad&&t.onLoad(this)}Ro.delete(this),i.manager.itemEnd(e)}function c(t){l(),r&&r(t),Po.remove(`image:${e}`);let n=Ro.get(this)||[];for(let e=0;e<n.length;e++){let r=n[e];r.onError&&r.onError(t)}Ro.delete(this),i.manager.itemError(e),i.manager.itemEnd(e)}function l(){o.removeEventListener(`load`,s,!1),o.removeEventListener(`error`,c,!1)}return o.addEventListener(`load`,s,!1),o.addEventListener(`error`,c,!1),e.slice(0,5)!==`data:`&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),Po.add(`image:${e}`,o),i.manager.itemStart(e),o.src=e,o}},Bo=class extends Lo{constructor(e){super(e)}load(e,t,n,r){let i=new Kt,a=new zo(this.manager);return a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(e,function(e){i.image=e,i.needsUpdate=!0,t!==void 0&&t(i)},n,r),i}},Vo=class extends En{constructor(e,t=1){super(),this.isLight=!0,this.type=`Light`,this.color=new W(e),this.intensity=t}dispose(){this.dispatchEvent({type:`dispose`})}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}},Ho=new Qt,Uo=new H,Wo=new H,Go=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new V(512,512),this.mapType=l,this.map=null,this.mapPass=null,this.matrix=new Qt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Li,this._frameExtents=new V(1,1),this._viewportCount=1,this._viewports=[new qt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,n=this.matrix;Uo.setFromMatrixPosition(e.matrixWorld),t.position.copy(Uo),Wo.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Wo),t.updateMatrixWorld(),Ho.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Ho,t.coordinateSystem,t.reversedDepth),t.coordinateSystem===2001||t.reversedDepth?n.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Ho)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},Ko=new H,qo=new kt,Jo=new H,Yo=class extends En{constructor(){super(),this.isCamera=!0,this.type=`Camera`,this.matrixWorldInverse=new Qt,this.projectionMatrix=new Qt,this.projectionMatrixInverse=new Qt,this.coordinateSystem=Ge,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Ko,qo,Jo),Jo.x===1&&Jo.y===1&&Jo.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Ko,qo,Jo.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(Ko,qo,Jo),Jo.x===1&&Jo.y===1&&Jo.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Ko,qo,Jo.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},Xo=new H,Zo=new V,Qo=new V,$o=class extends Yo{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type=`PerspectiveCamera`,this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=ot*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(at*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return ot*2*Math.atan(Math.tan(at*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Xo.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Xo.x,Xo.y).multiplyScalar(-e/Xo.z),Xo.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Xo.x,Xo.y).multiplyScalar(-e/Xo.z)}getViewSize(e,t){return this.getViewBounds(e,Zo,Qo),t.subVectors(Qo,Zo)}setViewOffset(e,t,n,r,i,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(at*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,i=-.5*r,a=this.view;if(this.view!==null&&this.view.enabled){let e=a.fullWidth,o=a.fullHeight;i+=a.offsetX*r/e,t-=a.offsetY*n/o,r*=a.width/e,n*=a.height/o}let o=this.filmOffset;o!==0&&(i+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(i,i+r,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},es=class extends Yo{constructor(e=-1,t=1,n=1,r=-1,i=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type=`OrthographicCamera`,this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=i,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,i,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2,i=n-e,a=n+e,o=r+t,s=r-t;if(this.view!==null&&this.view.enabled){let e=(this.right-this.left)/this.view.fullWidth/this.zoom,t=(this.top-this.bottom)/this.view.fullHeight/this.zoom;i+=e*this.view.offsetX,a=i+e*this.view.width,o-=t*this.view.offsetY,s=o-t*this.view.height}this.projectionMatrix.makeOrthographic(i,a,o,s,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},ts=class extends Go{constructor(){super(new es(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},ns=class extends Vo{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type=`DirectionalLight`,this.position.copy(En.DEFAULT_UP),this.updateMatrix(),this.target=new En,this.shadow=new ts}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}},rs=class extends Vo{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type=`AmbientLight`}},is=class extends kr{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type=`InstancedBufferGeometry`,this.instanceCount=1/0}copy(e){return super.copy(e),this.instanceCount=e.instanceCount,this}toJSON(){let e=super.toJSON();return e.instanceCount=this.instanceCount,e.isInstancedBufferGeometry=!0,e}},as=-90,os=1,ss=class extends En{constructor(e,t,n){super(),this.type=`CubeCamera`,this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new $o(as,os,e,t);r.layers=this.layers,this.add(r);let i=new $o(as,os,e,t);i.layers=this.layers,this.add(i);let a=new $o(as,os,e,t);a.layers=this.layers,this.add(a);let o=new $o(as,os,e,t);o.layers=this.layers,this.add(o);let s=new $o(as,os,e,t);s.layers=this.layers,this.add(s);let c=new $o(as,os,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,r,i,a,o,s]=t;for(let e of t)this.remove(e);if(e===2e3)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),i.up.set(0,0,-1),i.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),s.up.set(0,1,0),s.lookAt(0,0,-1);else if(e===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),i.up.set(0,0,1),i.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),s.up.set(0,-1,0),s.lookAt(0,0,-1);else throw Error(`THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: `+e);for(let e of t)this.add(e),e.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[i,a,o,s,c,l]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;let m=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let h=!1;h=e.isWebGLRenderer===!0?e.state.buffers.depth.getReversed():e.reversedDepthBuffer,e.setRenderTarget(n,0,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,i),e.setRenderTarget(n,1,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(n,4,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.generateMipmaps=m,e.setRenderTarget(n,5,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(u,d,f),e.xr.enabled=p,n.texture.needsPMREMUpdate=!0}},cs=class extends $o{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}},ls=class{constructor(){this._previousTime=0,this._currentTime=0,this._startTime=performance.now(),this._delta=0,this._elapsed=0,this._timescale=1,this._document=null,this._pageVisibilityHandler=null}connect(e){this._document=e,e.hidden!==void 0&&(this._pageVisibilityHandler=us.bind(this),e.addEventListener(`visibilitychange`,this._pageVisibilityHandler,!1))}disconnect(){this._pageVisibilityHandler!==null&&(this._document.removeEventListener(`visibilitychange`,this._pageVisibilityHandler),this._pageVisibilityHandler=null),this._document=null}getDelta(){return this._delta/1e3}getElapsed(){return this._elapsed/1e3}getTimescale(){return this._timescale}setTimescale(e){return this._timescale=e,this}reset(){return this._currentTime=performance.now()-this._startTime,this}dispose(){this.disconnect()}update(e){return this._pageVisibilityHandler!==null&&this._document.hidden===!0?this._delta=0:(this._previousTime=this._currentTime,this._currentTime=(e===void 0?performance.now():e)-this._startTime,this._delta=(this._currentTime-this._previousTime)*this._timescale,this._elapsed+=this._delta),this}};function us(){this._document.hidden===!1&&this.reset()}var ds=`\\[\\]\\.:\\/`,fs=RegExp(`[\\[\\]\\.:\\/]`,`g`),ps=`[^\\[\\]\\.:\\/]`,ms=`[^`+ds.replace(`\\.`,``)+`]`,hs=`((?:WC+[\\/:])*)`.replace(`WC`,ps),gs=`(WCOD+)?`.replace(`WCOD`,ms),_s=`(?:\\.(WC+)(?:\\[(.+)\\])?)?`.replace(`WC`,ps),vs=`\\.(WC+)(?:\\[(.+)\\])?`.replace(`WC`,ps),ys=RegExp(`^`+hs+gs+_s+vs+`$`),bs=[`material`,`materials`,`bones`,`map`],xs=class{constructor(e,t,n){let r=n||Ss.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,r=this._bindings[n];r!==void 0&&r.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let r=this._targetGroup.nCachedObjects_,i=n.length;r!==i;++r)n[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},Ss=class e{constructor(t,n,r){this.path=n,this.parsedPath=r||e.parseTrackName(n),this.node=e.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,n,r){return t&&t.isAnimationObjectGroup?new e.Composite(t,n,r):new e(t,n,r)}static sanitizeNodeName(e){return e.replace(/\s/g,`_`).replace(fs,``)}static parseTrackName(e){let t=ys.exec(e);if(t===null)throw Error(`THREE.PropertyBinding: Cannot parse trackName: `+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=n.nodeName&&n.nodeName.lastIndexOf(`.`);if(r!==void 0&&r!==-1){let e=n.nodeName.substring(r+1);bs.indexOf(e)!==-1&&(n.nodeName=n.nodeName.substring(0,r),n.objectName=e)}if(n.propertyName===null||n.propertyName.length===0)throw Error(`THREE.PropertyBinding: can not parse propertyName from trackName: `+e);return n}static findNode(e,t){if(t===void 0||t===``||t===`.`||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(e){for(let r=0;r<e.length;r++){let i=e[r];if(i.name===t||i.uuid===t)return i;let a=n(i.children);if(a)return a}return null},r=n(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)e[t++]=n[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let t=this.node,n=this.parsedPath,r=n.objectName,i=n.propertyName,a=n.propertyIndex;if(t||(t=e.findNode(this.rootNode,n.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){R(`PropertyBinding: No target node found for track: `+this.path+`.`);return}if(r){let e=n.objectIndex;switch(r){case`materials`:if(!t.material){z(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.materials){z(`PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.`,this);return}t=t.material.materials;break;case`bones`:if(!t.skeleton){z(`PropertyBinding: Can not bind to bones as node does not have a skeleton.`,this);return}t=t.skeleton.bones;for(let n=0;n<t.length;n++)if(t[n].name===e){e=n;break}break;case`map`:if(`map`in t){t=t.map;break}if(!t.material){z(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.map){z(`PropertyBinding: Can not bind to material.map as node.material does not have a map.`,this);return}t=t.material.map;break;default:if(t[r]===void 0){z(`PropertyBinding: Can not bind to objectName of node undefined.`,this);return}t=t[r]}if(e!==void 0){if(t[e]===void 0){z(`PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.`,this,t);return}t=t[e]}}let o=t[i];if(o===void 0){let e=n.nodeName;z(`PropertyBinding: Trying to update property for track: `+e+`.`+i+` but it wasn't found.`,t);return}let s=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?s=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(s=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(a!==void 0){if(i===`morphTargetInfluences`){if(!t.geometry){z(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.`,this);return}if(!t.geometry.morphAttributes){z(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.`,this);return}t.morphTargetDictionary[a]!==void 0&&(a=t.morphTargetDictionary[a])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=a}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][s]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Ss.Composite=xs,Ss.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},Ss.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},Ss.prototype.GetterByBindingType=[Ss.prototype._getValue_direct,Ss.prototype._getValue_array,Ss.prototype._getValue_arrayElement,Ss.prototype._getValue_toArray],Ss.prototype.SetterByBindingTypeAndVersioning=[[Ss.prototype._setValue_direct,Ss.prototype._setValue_direct_setNeedsUpdate,Ss.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Ss.prototype._setValue_array,Ss.prototype._setValue_array_setNeedsUpdate,Ss.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Ss.prototype._setValue_arrayElement,Ss.prototype._setValue_arrayElement_setNeedsUpdate,Ss.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Ss.prototype._setValue_fromArray,Ss.prototype._setValue_fromArray_setNeedsUpdate,Ss.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Cs=class extends Ar{constructor(e,t,n=1){super(e,t),this.isInstancedInterleavedBuffer=!0,this.meshPerAttribute=n}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}clone(e){let t=super.clone(e);return t.meshPerAttribute=this.meshPerAttribute,t}toJSON(e){let t=super.toJSON(e);return t.isInstancedInterleavedBuffer=!0,t.meshPerAttribute=this.meshPerAttribute,t}};(class e{static{e.prototype.isMatrix2=!0}constructor(e,t,n,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,r){let i=this.elements;return i[0]=e,i[2]=t,i[1]=n,i[3]=r,this}});var ws=new H,Ts=new H,Es=new H,Ds=new H,Os=new H,ks=new H,As=new H,js=class{constructor(e=new H,t=new H){this.start=e,this.end=t}set(e,t){return this.start.copy(e),this.end.copy(t),this}copy(e){return this.start.copy(e.start),this.end.copy(e.end),this}getCenter(e){return e.addVectors(this.start,this.end).multiplyScalar(.5)}delta(e){return e.subVectors(this.end,this.start)}distanceSq(){return this.start.distanceToSquared(this.end)}distance(){return this.start.distanceTo(this.end)}at(e,t){return this.delta(t).multiplyScalar(e).add(this.start)}closestPointToPointParameter(e,t){ws.subVectors(e,this.start),Ts.subVectors(this.end,this.start);let n=Ts.dot(Ts);if(n===0)return 0;let r=Ts.dot(ws)/n;return t&&(r=B(r,0,1)),r}closestPointToPoint(e,t,n){let r=this.closestPointToPointParameter(e,t);return this.delta(n).multiplyScalar(r).add(this.start)}distanceSqToLine3(e,t=ks,n=As){let r=1e-8*1e-8,i,a,o=this.start,s=e.start,c=this.end,l=e.end;Es.subVectors(c,o),Ds.subVectors(l,s),Os.subVectors(o,s);let u=Es.dot(Es),d=Ds.dot(Ds),f=Ds.dot(Os);if(u<=r&&d<=r)return t.copy(o),n.copy(s),t.sub(n),t.dot(t);if(u<=r)i=0,a=f/d,a=B(a,0,1);else{let e=Es.dot(Os);if(d<=r)a=0,i=B(-e/u,0,1);else{let t=Es.dot(Ds),n=u*d-t*t;i=n===0?0:B((t*f-e*d)/n,0,1),a=(t*i+f)/d,a<0?(a=0,i=B(-e/u,0,1)):a>1&&(a=1,i=B((t-e)/u,0,1))}}return t.copy(o).addScaledVector(Es,i),n.copy(s).addScaledVector(Ds,a),t.distanceToSquared(n)}applyMatrix4(e){return this.start.applyMatrix4(e),this.end.applyMatrix4(e),this}equals(e){return e.start.equals(this.start)&&e.end.equals(this.end)}clone(){return new this.constructor().copy(this)}},Ms=class extends nt{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){if(e===void 0){R(`Controls: connect() now requires an element.`);return}this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}};function Ns(e,t,n,r){let i=Ps(r);switch(n){case S:return e*t;case D:return e*t/i.components*i.byteLength;case O:return e*t/i.components*i.byteLength;case k:return e*t*2/i.components*i.byteLength;case A:return e*t*2/i.components*i.byteLength;case C:return e*t*3/i.components*i.byteLength;case w:return e*t*4/i.components*i.byteLength;case ee:return e*t*4/i.components*i.byteLength;case j:case M:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case te:case ne:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case re:case ae:return Math.max(e,16)*Math.max(t,8)/4;case N:case ie:return Math.max(e,8)*Math.max(t,8)/2;case oe:case se:case le:case P:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case ce:case ue:case de:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case fe:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case pe:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case me:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case he:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case ge:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case _e:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case ve:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case ye:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case be:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case xe:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case Se:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case Ce:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case we:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case Te:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case Ee:case De:case Oe:return Math.ceil(e/4)*Math.ceil(t/4)*16;case ke:case Ae:return Math.ceil(e/4)*Math.ceil(t/4)*8;case je:case Me:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw Error(`Unable to determine texture byte length for ${n} format.`)}function Ps(e){switch(e){case l:case u:return{byteLength:1,components:1};case f:case d:case g:return{byteLength:2,components:1};case _:case v:return{byteLength:2,components:4};case m:case p:case h:return{byteLength:4,components:1};case b:case x:return{byteLength:4,components:3}}throw Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`register`,{detail:{revision:`185`}})),typeof window<`u`&&(window.__THREE__?R(`WARNING: Multiple instances of Three.js being imported.`):window.__THREE__=`185`);function Fs(){let e=null,t=!1,n=null,r=null;function i(t,a){n(t,a),r=e.requestAnimationFrame(i)}return{start:function(){t!==!0&&n!==null&&e!==null&&(r=e.requestAnimationFrame(i),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(r),t=!1},setAnimationLoop:function(e){n=e},setContext:function(t){e=t}}}function Is(e){let t=new WeakMap;function n(t,n){let r=t.array,i=t.usage,a=r.byteLength,o=e.createBuffer();e.bindBuffer(n,o),e.bufferData(n,r,i),t.onUploadCallback();let s;if(r instanceof Float32Array)s=e.FLOAT;else if(typeof Float16Array<`u`&&r instanceof Float16Array)s=e.HALF_FLOAT;else if(r instanceof Uint16Array)s=t.isFloat16BufferAttribute?e.HALF_FLOAT:e.UNSIGNED_SHORT;else if(r instanceof Int16Array)s=e.SHORT;else if(r instanceof Uint32Array)s=e.UNSIGNED_INT;else if(r instanceof Int32Array)s=e.INT;else if(r instanceof Int8Array)s=e.BYTE;else if(r instanceof Uint8Array)s=e.UNSIGNED_BYTE;else if(r instanceof Uint8ClampedArray)s=e.UNSIGNED_BYTE;else throw Error(`THREE.WebGLAttributes: Unsupported buffer data format: `+r);return{buffer:o,type:s,bytesPerElement:r.BYTES_PER_ELEMENT,version:t.version,size:a}}function r(t,n,r){let i=n.array,a=n.updateRanges;if(e.bindBuffer(r,t),a.length===0)e.bufferSubData(r,0,i);else{a.sort((e,t)=>e.start-t.start);let t=0;for(let e=1;e<a.length;e++){let n=a[t],r=a[e];r.start<=n.start+n.count+1?n.count=Math.max(n.count,r.start+r.count-n.start):(++t,a[t]=r)}a.length=t+1;for(let t=0,n=a.length;t<n;t++){let n=a[t];e.bufferSubData(r,n.start*i.BYTES_PER_ELEMENT,i,n.start,n.count)}n.clearUpdateRanges()}n.onUploadCallback()}function i(e){return e.isInterleavedBufferAttribute&&(e=e.data),t.get(e)}function a(n){n.isInterleavedBufferAttribute&&(n=n.data);let r=t.get(n);r&&(e.deleteBuffer(r.buffer),t.delete(n))}function o(e,i){if(e.isInterleavedBufferAttribute&&(e=e.data),e.isGLBufferAttribute){let n=t.get(e);(!n||n.version<e.version)&&t.set(e,{buffer:e.buffer,type:e.type,bytesPerElement:e.elementSize,version:e.version});return}let a=t.get(e);if(a===void 0)t.set(e,n(e,i));else if(a.version<e.version){if(a.size!==e.array.byteLength)throw Error(`THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.`);r(a.buffer,e,i),a.version=e.version}}return{get:i,remove:a,update:o}}var K={alphahash_fragment:`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,alphahash_pars_fragment:`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,alphamap_fragment:`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,alphamap_pars_fragment:`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,alphatest_fragment:`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,alphatest_pars_fragment:`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,aomap_fragment:`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,aomap_pars_fragment:`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,batching_pars_vertex:`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,batching_vertex:`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,begin_vertex:`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,beginnormal_vertex:`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,bsdfs:`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,iridescence_fragment:`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,bumpmap_pars_fragment:`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,clipping_planes_fragment:`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,clipping_planes_pars_fragment:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,clipping_planes_pars_vertex:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,clipping_planes_vertex:`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,color_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,color_pars_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,color_pars_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,color_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,common:`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,cube_uv_reflection_fragment:`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,defaultnormal_vertex:`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,displacementmap_pars_vertex:`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,displacementmap_vertex:`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,emissivemap_fragment:`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,emissivemap_pars_fragment:`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,colorspace_fragment:`gl_FragColor = linearToOutputTexel( gl_FragColor );`,colorspace_pars_fragment:`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,envmap_fragment:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,envmap_common_pars_fragment:`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,envmap_pars_fragment:`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,envmap_pars_vertex:`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,envmap_physical_pars_fragment:`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,envmap_vertex:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,fog_vertex:`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,fog_pars_vertex:`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,fog_fragment:`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,fog_pars_fragment:`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,gradientmap_pars_fragment:`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,lightmap_pars_fragment:`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,lights_lambert_fragment:`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,lights_lambert_pars_fragment:`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,lights_pars_begin:`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,lights_toon_fragment:`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,lights_toon_pars_fragment:`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lights_phong_fragment:`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,lights_phong_pars_fragment:`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,lights_physical_fragment:`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,lights_physical_pars_fragment:`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
		vec3 iridescenceFresnelDielectric;
		vec3 iridescenceFresnelMetallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
vec3 BRDF_GGX_Multiscatter( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 singleScatter = BRDF_GGX( lightDir, viewDir, normal, material );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 dfgV = texture2D( dfgLUT, vec2( material.roughness, dotNV ) ).rg;
	vec2 dfgL = texture2D( dfgLUT, vec2( material.roughness, dotNL ) ).rg;
	vec3 FssEss_V = material.specularColorBlended * dfgV.x + material.specularF90 * dfgV.y;
	vec3 FssEss_L = material.specularColorBlended * dfgL.x + material.specularF90 * dfgL.y;
	float Ess_V = dfgV.x + dfgV.y;
	float Ess_L = dfgL.x + dfgL.y;
	float Ems_V = 1.0 - Ess_V;
	float Ems_L = 1.0 - Ess_L;
	vec3 Favg = material.specularColorBlended + ( 1.0 - material.specularColorBlended ) * 0.047619;
	vec3 Fms = FssEss_V * FssEss_L * Favg / ( 1.0 - Ems_V * Ems_L * Favg + EPSILON );
	float compensationFactor = Ems_V * Ems_L;
	vec3 multiScatter = Fms * compensationFactor;
	return singleScatter + multiScatter;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX_Multiscatter( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnelDielectric, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceFresnelMetallic, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,lights_fragment_begin:`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( material.iridescenceFresnelDielectric, material.iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,lights_fragment_maps:`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,lights_fragment_end:`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,lightprobes_pars_fragment:`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,logdepthbuf_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,logdepthbuf_pars_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_pars_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,map_fragment:`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,map_pars_fragment:`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,map_particle_fragment:`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,map_particle_pars_fragment:`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,metalnessmap_fragment:`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,metalnessmap_pars_fragment:`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,morphinstance_vertex:`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,morphcolor_vertex:`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,morphnormal_vertex:`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,morphtarget_pars_vertex:`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,morphtarget_vertex:`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,normal_fragment_begin:`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,normal_fragment_maps:`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,normal_pars_fragment:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_pars_vertex:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_vertex:`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,normalmap_pars_fragment:`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,clearcoat_normal_fragment_begin:`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,clearcoat_normal_fragment_maps:`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,clearcoat_pars_fragment:`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,iridescence_pars_fragment:`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,opaque_fragment:`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,packing:`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,premultiplied_alpha_fragment:`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,project_vertex:`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,dithering_fragment:`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,dithering_pars_fragment:`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,roughnessmap_fragment:`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,roughnessmap_pars_fragment:`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,shadowmap_pars_fragment:`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,shadowmap_pars_vertex:`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,shadowmap_vertex:`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,shadowmask_pars_fragment:`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,skinbase_vertex:`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,skinning_pars_vertex:`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,skinning_vertex:`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,skinnormal_vertex:`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,specularmap_fragment:`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,specularmap_pars_fragment:`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tonemapping_fragment:`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,tonemapping_pars_fragment:`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,transmission_fragment:`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,transmission_pars_fragment:`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,uv_pars_fragment:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_pars_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,worldpos_vertex:`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,background_vert:`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,background_frag:`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,backgroundCube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,backgroundCube_frag:`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cube_frag:`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,depth_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,depth_frag:`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,distance_vert:`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,distance_frag:`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,equirect_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,equirect_frag:`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,linedashed_vert:`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,linedashed_frag:`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,meshbasic_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,meshbasic_frag:`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshlambert_vert:`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshlambert_frag:`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshmatcap_vert:`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,meshmatcap_frag:`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshnormal_vert:`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,meshnormal_frag:`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,meshphong_vert:`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshphong_frag:`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshphysical_vert:`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,meshphysical_frag:`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshtoon_vert:`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshtoon_frag:`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,points_vert:`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,points_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,shadow_vert:`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,shadow_frag:`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,sprite_vert:`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sprite_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`},q={common:{diffuse:{value:new W(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new U},alphaMap:{value:null},alphaMapTransform:{value:new U},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new U}},envmap:{envMap:{value:null},envMapRotation:{value:new U},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new U}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new U}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new U},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new U},normalScale:{value:new V(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new U},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new U}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new U}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new U}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new W(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new H},probesMax:{value:new H},probesResolution:{value:new H}},points:{diffuse:{value:new W(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new U},alphaTest:{value:0},uvTransform:{value:new U}},sprite:{diffuse:{value:new W(16777215)},opacity:{value:1},center:{value:new V(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new U},alphaMap:{value:null},alphaMapTransform:{value:new U},alphaTest:{value:0}}},Ls={basic:{uniforms:oo([q.common,q.specularmap,q.envmap,q.aomap,q.lightmap,q.fog]),vertexShader:K.meshbasic_vert,fragmentShader:K.meshbasic_frag},lambert:{uniforms:oo([q.common,q.specularmap,q.envmap,q.aomap,q.lightmap,q.emissivemap,q.bumpmap,q.normalmap,q.displacementmap,q.fog,q.lights,{emissive:{value:new W(0)},envMapIntensity:{value:1}}]),vertexShader:K.meshlambert_vert,fragmentShader:K.meshlambert_frag},phong:{uniforms:oo([q.common,q.specularmap,q.envmap,q.aomap,q.lightmap,q.emissivemap,q.bumpmap,q.normalmap,q.displacementmap,q.fog,q.lights,{emissive:{value:new W(0)},specular:{value:new W(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:K.meshphong_vert,fragmentShader:K.meshphong_frag},standard:{uniforms:oo([q.common,q.envmap,q.aomap,q.lightmap,q.emissivemap,q.bumpmap,q.normalmap,q.displacementmap,q.roughnessmap,q.metalnessmap,q.fog,q.lights,{emissive:{value:new W(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:K.meshphysical_vert,fragmentShader:K.meshphysical_frag},toon:{uniforms:oo([q.common,q.aomap,q.lightmap,q.emissivemap,q.bumpmap,q.normalmap,q.displacementmap,q.gradientmap,q.fog,q.lights,{emissive:{value:new W(0)}}]),vertexShader:K.meshtoon_vert,fragmentShader:K.meshtoon_frag},matcap:{uniforms:oo([q.common,q.bumpmap,q.normalmap,q.displacementmap,q.fog,{matcap:{value:null}}]),vertexShader:K.meshmatcap_vert,fragmentShader:K.meshmatcap_frag},points:{uniforms:oo([q.points,q.fog]),vertexShader:K.points_vert,fragmentShader:K.points_frag},dashed:{uniforms:oo([q.common,q.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:K.linedashed_vert,fragmentShader:K.linedashed_frag},depth:{uniforms:oo([q.common,q.displacementmap]),vertexShader:K.depth_vert,fragmentShader:K.depth_frag},normal:{uniforms:oo([q.common,q.bumpmap,q.normalmap,q.displacementmap,{opacity:{value:1}}]),vertexShader:K.meshnormal_vert,fragmentShader:K.meshnormal_frag},sprite:{uniforms:oo([q.sprite,q.fog]),vertexShader:K.sprite_vert,fragmentShader:K.sprite_frag},background:{uniforms:{uvTransform:{value:new U},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:K.background_vert,fragmentShader:K.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new U}},vertexShader:K.backgroundCube_vert,fragmentShader:K.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:K.cube_vert,fragmentShader:K.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:K.equirect_vert,fragmentShader:K.equirect_frag},distance:{uniforms:oo([q.common,q.displacementmap,{referencePosition:{value:new H},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:K.distance_vert,fragmentShader:K.distance_frag},shadow:{uniforms:oo([q.lights,q.fog,{color:{value:new W(0)},opacity:{value:1}}]),vertexShader:K.shadow_vert,fragmentShader:K.shadow_frag}};Ls.physical={uniforms:oo([Ls.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new U},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new U},clearcoatNormalScale:{value:new V(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new U},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new U},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new U},sheen:{value:0},sheenColor:{value:new W(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new U},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new U},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new U},transmissionSamplerSize:{value:new V},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new U},attenuationDistance:{value:0},attenuationColor:{value:new W(0)},specularColor:{value:new W(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new U},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new U},anisotropyVector:{value:new V},anisotropyMap:{value:null},anisotropyMapTransform:{value:new U}}]),vertexShader:K.meshphysical_vert,fragmentShader:K.meshphysical_frag};var Rs={r:0,b:0,g:0},zs=new Qt,Bs=new U;Bs.set(-1,0,0,0,1,0,0,0,1);function Vs(e,t,n,r,i,a){let o=new W(0),s=i===!0?0:1,c,l,u=null,d=0,f=null;function p(e){let n=e.isScene===!0?e.background:null;if(n&&n.isTexture){let r=e.backgroundBlurriness>0;n=t.get(n,r)}return n}function m(t){let r=!1,i=p(t);i===null?g(o,s):i&&i.isColor&&(g(i,1),r=!0);let c=e.xr.getEnvironmentBlendMode();c===`additive`?n.buffers.color.setClear(0,0,0,1,a):c===`alpha-blend`&&n.buffers.color.setClear(0,0,0,0,a),(e.autoClear||r)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function h(t,n){let i=p(n);i&&(i.isCubeTexture||i.mapping===306)?(l===void 0&&(l=new _i(new la(1,1,1),new mo({name:`BackgroundCubeMaterial`,uniforms:ao(Ls.backgroundCube.uniforms),vertexShader:Ls.backgroundCube.vertexShader,fragmentShader:Ls.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute(`normal`),l.geometry.deleteAttribute(`uv`),l.onBeforeRender=function(e,t,n){this.matrixWorld.copyPosition(n.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(l)),l.material.uniforms.envMap.value=i,l.material.uniforms.backgroundBlurriness.value=n.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(zs.makeRotationFromEuler(n.backgroundRotation)).transpose(),i.isCubeTexture&&i.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(Bs),l.material.toneMapped=It.getTransfer(i.colorSpace)!==Ve,(u!==i||d!==i.version||f!==e.toneMapping)&&(l.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),l.layers.enableAll(),t.unshift(l,l.geometry,l.material,0,0,null)):i&&i.isTexture&&(c===void 0&&(c=new _i(new eo(2,2),new mo({name:`BackgroundMaterial`,uniforms:ao(Ls.background.uniforms),vertexShader:Ls.background.vertexShader,fragmentShader:Ls.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute(`normal`),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=i,c.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,c.material.toneMapped=It.getTransfer(i.colorSpace)!==Ve,i.matrixAutoUpdate===!0&&i.updateMatrix(),c.material.uniforms.uvTransform.value.copy(i.matrix),(u!==i||d!==i.version||f!==e.toneMapping)&&(c.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),c.layers.enableAll(),t.unshift(c,c.geometry,c.material,0,0,null))}function g(t,r){t.getRGB(Rs,lo(e)),n.buffers.color.setClear(Rs.r,Rs.g,Rs.b,r,a)}function _(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(e,t=1){o.set(e),s=t,g(o,s)},getClearAlpha:function(){return s},setClearAlpha:function(e){s=e,g(o,s)},render:m,addToRenderList:h,dispose:_}}function Hs(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),r={},i=f(null),a=i,o=!1;function s(n,r,i,s,c){let u=!1,f=d(n,s,i,r);a!==f&&(a=f,l(a.object)),u=p(n,s,i,c),u&&m(n,s,i,c),c!==null&&t.update(c,e.ELEMENT_ARRAY_BUFFER),(u||o)&&(o=!1,b(n,r,i,s),c!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(c).buffer))}function c(){return e.createVertexArray()}function l(t){return e.bindVertexArray(t)}function u(t){return e.deleteVertexArray(t)}function d(e,t,n,i){let a=i.wireframe===!0,o=r[t.id];o===void 0&&(o={},r[t.id]=o);let s=e.isInstancedMesh===!0?e.id:0,l=o[s];l===void 0&&(l={},o[s]=l);let u=l[n.id];u===void 0&&(u={},l[n.id]=u);let d=u[a];return d===void 0&&(d=f(c()),u[a]=d),d}function f(e){let t=[],r=[],i=[];for(let e=0;e<n;e++)t[e]=0,r[e]=0,i[e]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:t,enabledAttributes:r,attributeDivisors:i,object:e,attributes:{},index:null}}function p(e,t,n,r){let i=a.attributes,o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=i[t],r=o[t];if(r===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(r=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(r=e.instanceColor)),n===void 0||n.attribute!==r||r&&n.data!==r.data)return!0;s++}return a.attributesNum!==s||a.index!==r}function m(e,t,n,r){let i={},o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=o[t];n===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(n=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(n=e.instanceColor));let r={};r.attribute=n,n&&n.data&&(r.data=n.data),i[t]=r,s++}a.attributes=i,a.attributesNum=s,a.index=r}function h(){let e=a.newAttributes;for(let t=0,n=e.length;t<n;t++)e[t]=0}function g(e){_(e,0)}function _(t,n){let r=a.newAttributes,i=a.enabledAttributes,o=a.attributeDivisors;r[t]=1,i[t]===0&&(e.enableVertexAttribArray(t),i[t]=1),o[t]!==n&&(e.vertexAttribDivisor(t,n),o[t]=n)}function v(){let t=a.newAttributes,n=a.enabledAttributes;for(let r=0,i=n.length;r<i;r++)n[r]!==t[r]&&(e.disableVertexAttribArray(r),n[r]=0)}function y(t,n,r,i,a,o,s){s===!0?e.vertexAttribIPointer(t,n,r,a,o):e.vertexAttribPointer(t,n,r,i,a,o)}function b(n,r,i,a){h();let o=a.attributes,s=i.getAttributes(),c=r.defaultAttributeValues;for(let r in s){let i=s[r];if(i.location>=0){let s=o[r];if(s===void 0&&(r===`instanceMatrix`&&n.instanceMatrix&&(s=n.instanceMatrix),r===`instanceColor`&&n.instanceColor&&(s=n.instanceColor)),s!==void 0){let r=s.normalized,o=s.itemSize,c=t.get(s);if(c===void 0)continue;let l=c.buffer,u=c.type,d=c.bytesPerElement,f=u===e.INT||u===e.UNSIGNED_INT||s.gpuType===1013;if(s.isInterleavedBufferAttribute){let t=s.data,c=t.stride,p=s.offset;if(t.isInstancedInterleavedBuffer){for(let e=0;e<i.locationSize;e++)_(i.location+e,t.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=t.meshPerAttribute*t.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,c*d,(p+o/i.locationSize*e)*d,f)}else{if(s.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,s.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=s.meshPerAttribute*s.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,o*d,o/i.locationSize*e*d,f)}}else if(c!==void 0){let t=c[r];if(t!==void 0)switch(t.length){case 2:e.vertexAttrib2fv(i.location,t);break;case 3:e.vertexAttrib3fv(i.location,t);break;case 4:e.vertexAttrib4fv(i.location,t);break;default:e.vertexAttrib1fv(i.location,t)}}}}v()}function x(){T();for(let e in r){let t=r[e];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e]}}function S(e){if(r[e.id]===void 0)return;let t=r[e.id];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e.id]}function C(e){for(let t in r){let n=r[t];for(let t in n){let r=n[t];if(r[e.id]===void 0)continue;let i=r[e.id];for(let e in i)u(i[e].object),delete i[e];delete r[e.id]}}}function w(e){for(let t in r){let n=r[t],i=e.isInstancedMesh===!0?e.id:0,a=n[i];if(a!==void 0){for(let e in a){let t=a[e];for(let e in t)u(t[e].object),delete t[e];delete a[e]}delete n[i],Object.keys(n).length===0&&delete r[t]}}}function T(){E(),o=!0,a!==i&&(a=i,l(a.object))}function E(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:s,reset:T,resetDefaultState:E,dispose:x,releaseStatesOfGeometry:S,releaseStatesOfObject:w,releaseStatesOfProgram:C,initAttributes:h,enableAttribute:g,disableUnusedAttributes:v}}function Us(e,t,n){let r;function i(e){r=e}function a(t,i){e.drawArrays(r,t,i),n.update(i,r,1)}function o(t,i,a){a!==0&&(e.drawArraysInstanced(r,t,i,a),n.update(i,r,a))}function s(e,i,a){if(a===0)return;t.get(`WEBGL_multi_draw`).multiDrawArraysWEBGL(r,e,0,i,0,a);let o=0;for(let e=0;e<a;e++)o+=i[e];n.update(o,r,1)}this.setMode=i,this.render=a,this.renderInstances=o,this.renderMultiDraw=s}function Ws(e,t,n,r){let i;function a(){if(i!==void 0)return i;if(t.has(`EXT_texture_filter_anisotropic`)===!0){let n=t.get(`EXT_texture_filter_anisotropic`);i=e.getParameter(n.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(t){return!(t!==1023&&r.convert(t)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT))}function s(n){let i=n===1016&&(t.has(`EXT_color_buffer_half_float`)||t.has(`EXT_color_buffer_float`));return!(n!==1009&&r.convert(n)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE)&&n!==1015&&!i)}function c(t){if(t===`highp`){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return`highp`;t=`mediump`}return t===`mediump`&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?`mediump`:`lowp`}let l=n.precision===void 0?`highp`:n.precision,u=c(l);u!==l&&(R(`WebGLRenderer:`,l,`not supported, using`,u,`instead.`),l=u);let d=n.logarithmicDepthBuffer===!0,f=n.reversedDepthBuffer===!0&&t.has(`EXT_clip_control`);n.reversedDepthBuffer===!0&&f===!1&&R(`WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.`);let p=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),m=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),h=e.getParameter(e.MAX_TEXTURE_SIZE),g=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),_=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),y=e.getParameter(e.MAX_VARYING_VECTORS),b=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),x=e.getParameter(e.MAX_SAMPLES),S=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:s,precision:l,logarithmicDepthBuffer:d,reversedDepthBuffer:f,maxTextures:p,maxVertexTextures:m,maxTextureSize:h,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:v,maxVaryings:y,maxFragmentUniforms:b,maxSamples:x,samples:S}}function Gs(e){let t=this,n=null,r=0,i=!1,a=!1,o=new Ni,s=new U,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(e,t){let n=e.length!==0||t||r!==0||i;return i=t,r=e.length,n},this.beginShadows=function(){a=!0,u(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(e,t){n=u(e,t,0)},this.setState=function(t,o,s){let d=t.clippingPlanes,f=t.clipIntersection,p=t.clipShadows,m=e.get(t);if(!i||d===null||d.length===0||a&&!p)a?u(null):l();else{let e=a?0:r,t=e*4,i=m.clippingState||null;c.value=i,i=u(d,o,t,s);for(let e=0;e!==t;++e)i[e]=n[e];m.clippingState=i,this.numIntersection=f?this.numPlanes:0,this.numPlanes+=e}};function l(){c.value!==n&&(c.value=n,c.needsUpdate=r>0),t.numPlanes=r,t.numIntersection=0}function u(e,n,r,i){let a=e===null?0:e.length,l=null;if(a!==0){if(l=c.value,i!==!0||l===null){let t=r+a*4,i=n.matrixWorldInverse;s.getNormalMatrix(i),(l===null||l.length<t)&&(l=new Float32Array(t));for(let t=0,n=r;t!==a;++t,n+=4)o.copy(e[t]).applyMatrix4(i,s),o.normal.toArray(l,n),l[n+3]=o.constant}c.value=l,c.needsUpdate=!0}return t.numPlanes=a,t.numIntersection=0,l}}var Ks=4,qs=[.125,.215,.35,.446,.526,.582],Js=20,Ys=256,Xs=new es,Zs=new W,Qs=null,$s=0,ec=0,tc=!1,nc=new H,rc=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=.1,r=100,i={}){let{size:a=256,position:o=nc}=i;Qs=this._renderer.getRenderTarget(),$s=this._renderer.getActiveCubeFace(),ec=this._renderer.getActiveMipmapLevel(),tc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(e,n,r,s,o),t>0&&this._blur(s,0,0,t),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=uc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=lc(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=2**this._lodMax}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Qs,$s,ec),this._renderer.xr.enabled=tc,e.scissorTest=!1,oc(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===301||e.mapping===302?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Qs=this._renderer.getRenderTarget(),$s=this._renderer.getActiveCubeFace(),ec=this._renderer.getActiveMipmapLevel(),tc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:o,minFilter:o,generateMipmaps:!1,type:g,format:w,colorSpace:ze,depthBuffer:!1},r=ac(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=ac(e,t,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=ic(r)),this._blurMaterial=cc(r,e,t),this._ggxMaterial=sc(r,e,t)}return r}_compileMaterial(e){let t=new _i(new kr,e);this._renderer.compile(t,Xs)}_sceneToCubeUV(e,t,n,r,i){let a=new $o(90,1,t,n),o=[1,-1,1,1,1,1],s=[1,1,1,-1,-1,-1],c=this._renderer,l=c.autoClear,u=c.toneMapping;c.getClearColor(Zs),c.toneMapping=0,c.autoClear=!1,c.state.buffers.depth.getReversed()&&(c.setRenderTarget(r),c.clearDepth(),c.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new _i(new la,new ai({name:`PMREM.Background`,side:1,depthWrite:!1,depthTest:!1})));let d=this._backgroundBox,f=d.material,p=!1,m=e.background;m?m.isColor&&(f.color.copy(m),e.background=null,p=!0):(f.color.copy(Zs),p=!0);for(let t=0;t<6;t++){let n=t%3;n===0?(a.up.set(0,o[t],0),a.position.set(i.x,i.y,i.z),a.lookAt(i.x+s[t],i.y,i.z)):n===1?(a.up.set(0,0,o[t]),a.position.set(i.x,i.y,i.z),a.lookAt(i.x,i.y+s[t],i.z)):(a.up.set(0,o[t],0),a.position.set(i.x,i.y,i.z),a.lookAt(i.x,i.y,i.z+s[t]));let l=this._cubeSize;oc(r,n*l,t>2?l:0,l,l),c.setRenderTarget(r),p&&c.render(d,a),c.render(e,a)}c.toneMapping=u,c.autoClear=l,e.background=m}_textureToCubeUV(e,t){let n=this._renderer,r=e.mapping===301||e.mapping===302;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=uc()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=lc());let i=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=i;let o=i.uniforms;o.envMap.value=e;let s=this._cubeSize;oc(t,0,0,3*s,2*s),n.setRenderTarget(t),n.render(a,Xs)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let r=this._lodMeshes.length;for(let t=1;t<r;t++)this._applyGGXFilter(e,t-1,t);t.autoClear=n}_applyGGXFilter(e,t,n){let r=this._renderer,i=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;let s=a.uniforms,c=n/(this._lodMeshes.length-1),l=t/(this._lodMeshes.length-1),u=Math.sqrt(c*c-l*l)*(0+c*1.25),{_lodMax:d}=this,f=this._sizeLods[n],p=3*f*(n>d-Ks?n-d+Ks:0),m=4*(this._cubeSize-f);s.envMap.value=e.texture,s.roughness.value=u,s.mipInt.value=d-t,oc(i,p,m,3*f,2*f),r.setRenderTarget(i),r.render(o,Xs),s.envMap.value=i.texture,s.roughness.value=0,s.mipInt.value=d-n,oc(e,p,m,3*f,2*f),r.setRenderTarget(e),r.render(o,Xs)}_blur(e,t,n,r,i){let a=this._pingPongRenderTarget;this._halfBlur(e,a,t,n,r,`latitudinal`,i),this._halfBlur(a,e,n,n,r,`longitudinal`,i)}_halfBlur(e,t,n,r,i,a,o){let s=this._renderer,c=this._blurMaterial;a!==`latitudinal`&&a!==`longitudinal`&&z(`blur direction must be either latitudinal or longitudinal!`);let l=this._lodMeshes[r];l.material=c;let u=c.uniforms,d=this._sizeLods[n]-1,f=isFinite(i)?Math.PI/(2*d):2*Math.PI/(2*Js-1),p=i/f,m=isFinite(i)?1+Math.floor(3*p):Js;m>Js&&R(`sigmaRadians, ${i}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${Js}`);let h=[],g=0;for(let e=0;e<Js;++e){let t=e/p,n=Math.exp(-t*t/2);h.push(n),e===0?g+=n:e<m&&(g+=2*n)}for(let e=0;e<h.length;e++)h[e]=h[e]/g;u.envMap.value=e.texture,u.samples.value=m,u.weights.value=h,u.latitudinal.value=a===`latitudinal`,o&&(u.poleAxis.value=o);let{_lodMax:_}=this;u.dTheta.value=f,u.mipInt.value=_-n;let v=this._sizeLods[r];oc(t,3*v*(r>_-Ks?r-_+Ks:0),4*(this._cubeSize-v),3*v,2*v),s.setRenderTarget(t),s.render(l,Xs)}};function ic(e){let t=[],n=[],r=[],i=e,a=e-Ks+1+qs.length;for(let o=0;o<a;o++){let a=2**i;t.push(a);let s=1/a;o>e-Ks?s=qs[o-e+Ks-1]:o===0&&(s=0),n.push(s);let c=1/(a-2),l=-c,u=1+c,d=[l,l,u,l,u,u,l,l,u,u,l,u],f=new Float32Array(108),p=new Float32Array(72),m=new Float32Array(36);for(let e=0;e<6;e++){let t=e%3*2/3-1,n=e>2?0:-1,r=[t,n,0,t+2/3,n,0,t+2/3,n+1,0,t,n,0,t+2/3,n+1,0,t,n+1,0];f.set(r,18*e),p.set(d,12*e);let i=[e,e,e,e,e,e];m.set(i,6*e)}let h=new kr;h.setAttribute(`position`,new hr(f,3)),h.setAttribute(`uv`,new hr(p,2)),h.setAttribute(`faceIndex`,new hr(m,1)),r.push(new _i(h,null)),i>Ks&&i--}return{lodMeshes:r,sizeLods:t,sigmas:n}}function ac(e,t,n){let r=new Yt(e,t,n);return r.texture.mapping=306,r.texture.name=`PMREM.cubeUv`,r.scissorTest=!0,r}function oc(e,t,n,r,i){e.viewport.set(t,n,r,i),e.scissor.set(t,n,r,i)}function sc(e,t,n){return new mo({name:`PMREMGGXConvolution`,defines:{GGX_SAMPLES:Ys,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:dc(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function cc(e,t,n){let r=new Float32Array(Js),i=new H(0,1,0);return new mo({name:`SphericalGaussianBlur`,defines:{n:Js,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:r},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:i}},vertexShader:dc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function lc(){return new mo({name:`EquirectangularToCubeUV`,uniforms:{envMap:{value:null}},vertexShader:dc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function uc(){return new mo({name:`CubemapToCubeUV`,uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:dc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function dc(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}var fc=class extends Yt{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new ia(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new la(5,5,5),i=new mo({name:`CubemapFromEquirect`,uniforms:ao(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});i.uniforms.tEquirect.value=t;let a=new _i(r,i),s=t.minFilter;return t.minFilter===1008&&(t.minFilter=o),new ss(1,10,this).update(e,a),t.minFilter=s,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,r=!0){let i=e.getRenderTarget();for(let i=0;i<6;i++)e.setRenderTarget(this,i),e.clear(t,n,r);e.setRenderTarget(i)}};function pc(e){let t=new WeakMap,n=new WeakMap,r=null;function i(e,t=!1){return e==null?null:t?o(e):a(e)}function a(n){if(n&&n.isTexture){let r=n.mapping;if(r===303||r===304)if(t.has(n)){let e=t.get(n).texture;return s(e,n.mapping)}else{let r=n.image;if(r&&r.height>0){let i=new fc(r.height);return i.fromEquirectangularTexture(e,n),t.set(n,i),n.addEventListener(`dispose`,l),s(i.texture,n.mapping)}else return null}}return n}function o(t){if(t&&t.isTexture){let i=t.mapping,a=i===303||i===304,o=i===301||i===302;if(a||o){let i=n.get(t),s=i===void 0?0:i.texture.pmremVersion;if(t.isRenderTargetTexture&&t.pmremVersion!==s)return r===null&&(r=new rc(e)),i=a?r.fromEquirectangular(t,i):r.fromCubemap(t,i),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),i.texture;if(i!==void 0)return i.texture;{let s=t.image;return a&&s&&s.height>0||o&&s&&c(s)?(r===null&&(r=new rc(e)),i=a?r.fromEquirectangular(t):r.fromCubemap(t),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),t.addEventListener(`dispose`,u),i.texture):null}}}return t}function s(e,t){return t===303?e.mapping=301:t===304&&(e.mapping=302),e}function c(e){let t=0;for(let n=0;n<6;n++)e[n]!==void 0&&t++;return t===6}function l(e){let n=e.target;n.removeEventListener(`dispose`,l);let r=t.get(n);r!==void 0&&(t.delete(n),r.dispose())}function u(e){let t=e.target;t.removeEventListener(`dispose`,u);let r=n.get(t);r!==void 0&&(n.delete(t),r.dispose())}function d(){t=new WeakMap,n=new WeakMap,r!==null&&(r.dispose(),r=null)}return{get:i,dispose:d}}function mc(e){let t={};function n(n){if(t[n]!==void 0)return t[n];let r=e.getExtension(n);return t[n]=r,r}return{has:function(e){return n(e)!==null},init:function(){n(`EXT_color_buffer_float`),n(`WEBGL_clip_cull_distance`),n(`OES_texture_float_linear`),n(`EXT_color_buffer_half_float`),n(`WEBGL_multisampled_render_to_texture`),n(`WEBGL_render_shared_exponent`)},get:function(e){let t=n(e);return t===null&&$e(`WebGLRenderer: `+e+` extension not supported.`),t}}}function hc(e,t,n,r){let i={},a=new WeakMap;function o(e){let s=e.target;s.index!==null&&t.remove(s.index);for(let e in s.attributes)t.remove(s.attributes[e]);s.removeEventListener(`dispose`,o),delete i[s.id];let c=a.get(s);c&&(t.remove(c),a.delete(s)),r.releaseStatesOfGeometry(s),s.isInstancedBufferGeometry===!0&&delete s._maxInstanceCount,n.memory.geometries--}function s(e,t){return i[t.id]===!0?t:(t.addEventListener(`dispose`,o),i[t.id]=!0,n.memory.geometries++,t)}function c(n){let r=n.attributes;for(let n in r)t.update(r[n],e.ARRAY_BUFFER)}function l(e){let n=[],r=e.index,i=e.attributes.position,o=0;if(i===void 0)return;if(r!==null){let e=r.array;o=r.version;for(let t=0,r=e.length;t<r;t+=3){let r=e[t+0],i=e[t+1],a=e[t+2];n.push(r,i,i,a,a,r)}}else{let e=i.array;o=i.version;for(let t=0,r=e.length/3-1;t<r;t+=3){let e=t+0,r=t+1,i=t+2;n.push(e,r,r,i,i,e)}}let s=new(i.count>=65535?_r:gr)(n,1);s.version=o;let c=a.get(e);c&&t.remove(c),a.set(e,s)}function u(e){let t=a.get(e);if(t){let n=e.index;n!==null&&t.version<n.version&&l(e)}else l(e);return a.get(e)}return{get:s,update:c,getWireframeAttribute:u}}function gc(e,t,n){let r;function i(e){r=e}let a,o;function s(e){a=e.type,o=e.bytesPerElement}function c(t,i){e.drawElements(r,i,a,t*o),n.update(i,r,1)}function l(t,i,s){s!==0&&(e.drawElementsInstanced(r,i,a,t*o,s),n.update(i,r,s))}function u(e,i,o){if(o===0)return;t.get(`WEBGL_multi_draw`).multiDrawElementsWEBGL(r,i,0,a,e,0,o);let s=0;for(let e=0;e<o;e++)s+=i[e];n.update(s,r,1)}this.setMode=i,this.setIndex=s,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function _c(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function r(t,r,i){switch(n.calls++,r){case e.TRIANGLES:n.triangles+=t/3*i;break;case e.LINES:n.lines+=t/2*i;break;case e.LINE_STRIP:n.lines+=i*(t-1);break;case e.LINE_LOOP:n.lines+=i*t;break;case e.POINTS:n.points+=i*t;break;default:z(`WebGLInfo: Unknown draw mode:`,r);break}}function i(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:i,update:r}}function vc(e,t,n){let r=new WeakMap,i=new qt;function a(a,o,s){let c=a.morphTargetInfluences,l=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=l===void 0?0:l.length,d=r.get(o);if(d===void 0||d.count!==u){d!==void 0&&d.texture.dispose();let e=o.morphAttributes.position!==void 0,n=o.morphAttributes.normal!==void 0,a=o.morphAttributes.color!==void 0,s=o.morphAttributes.position||[],c=o.morphAttributes.normal||[],l=o.morphAttributes.color||[],f=0;e===!0&&(f=1),n===!0&&(f=2),a===!0&&(f=3);let p=o.attributes.position.count*f,m=1;p>t.maxTextureSize&&(m=Math.ceil(p/t.maxTextureSize),p=t.maxTextureSize);let g=new Float32Array(p*m*4*u),_=new Xt(g,p,m,u);_.type=h,_.needsUpdate=!0;let v=f*4;for(let t=0;t<u;t++){let r=s[t],o=c[t],u=l[t],d=p*m*4*t;for(let t=0;t<r.count;t++){let s=t*v;e===!0&&(i.fromBufferAttribute(r,t),g[d+s+0]=i.x,g[d+s+1]=i.y,g[d+s+2]=i.z,g[d+s+3]=0),n===!0&&(i.fromBufferAttribute(o,t),g[d+s+4]=i.x,g[d+s+5]=i.y,g[d+s+6]=i.z,g[d+s+7]=0),a===!0&&(i.fromBufferAttribute(u,t),g[d+s+8]=i.x,g[d+s+9]=i.y,g[d+s+10]=i.z,g[d+s+11]=u.itemSize===4?i.w:1)}}d={count:u,texture:_,size:new V(p,m)},r.set(o,d);function y(){_.dispose(),r.delete(o),o.removeEventListener(`dispose`,y)}o.addEventListener(`dispose`,y)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)s.getUniforms().setValue(e,`morphTexture`,a.morphTexture,n);else{let t=0;for(let e=0;e<c.length;e++)t+=c[e];let n=o.morphTargetsRelative?1:1-t;s.getUniforms().setValue(e,`morphTargetBaseInfluence`,n),s.getUniforms().setValue(e,`morphTargetInfluences`,c)}s.getUniforms().setValue(e,`morphTargetsTexture`,d.texture,n),s.getUniforms().setValue(e,`morphTargetsTextureSize`,d.size)}return{update:a}}function yc(e,t,n,r,i){let a=new WeakMap;function o(r){let o=i.render.frame,s=r.geometry,l=t.get(r,s);if(a.get(l)!==o&&(t.update(l),a.set(l,o)),r.isInstancedMesh&&(r.hasEventListener(`dispose`,c)===!1&&r.addEventListener(`dispose`,c),a.get(r)!==o&&(n.update(r.instanceMatrix,e.ARRAY_BUFFER),r.instanceColor!==null&&n.update(r.instanceColor,e.ARRAY_BUFFER),a.set(r,o))),r.isSkinnedMesh){let e=r.skeleton;a.get(e)!==o&&(e.update(),a.set(e,o))}return l}function s(){a=new WeakMap}function c(e){let t=e.target;t.removeEventListener(`dispose`,c),r.releaseStatesOfObject(t),n.remove(t.instanceMatrix),t.instanceColor!==null&&n.remove(t.instanceColor)}return{update:o,dispose:s}}var bc={1:`LINEAR_TONE_MAPPING`,2:`REINHARD_TONE_MAPPING`,3:`CINEON_TONE_MAPPING`,4:`ACES_FILMIC_TONE_MAPPING`,6:`AGX_TONE_MAPPING`,7:`NEUTRAL_TONE_MAPPING`,5:`CUSTOM_TONE_MAPPING`};function xc(e,t,n,r,i,a){let o=new Yt(t,n,{type:e,depthBuffer:i,stencilBuffer:a,samples:r?4:0,depthTexture:i?new oa(t,n):void 0}),s=new Yt(t,n,{type:g,depthBuffer:!1,stencilBuffer:!1}),c=new kr;c.setAttribute(`position`,new G([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute(`uv`,new G([0,2,0,0,2,0],2));let l=new ho({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),u=new _i(c,l),d=new es(-1,1,1,-1,0,1),f=null,p=null,m=!1,h,_=null,v=[],y=!1;this.setSize=function(e,t){o.setSize(e,t),s.setSize(e,t);for(let n=0;n<v.length;n++){let r=v[n];r.setSize&&r.setSize(e,t)}},this.setEffects=function(e){v=e,y=v.length>0&&v[0].isRenderPass===!0;let t=o.width,n=o.height;for(let e=0;e<v.length;e++){let r=v[e];r.setSize&&r.setSize(t,n)}},this.begin=function(e,t){if(m||e.toneMapping===0&&v.length===0)return!1;if(_=t,t!==null){let e=t.width,n=t.height;(o.width!==e||o.height!==n)&&this.setSize(e,n)}return y===!1&&e.setRenderTarget(o),h=e.toneMapping,e.toneMapping=0,!0},this.hasRenderPass=function(){return y},this.end=function(e,t){e.toneMapping=h,m=!0;let n=o,r=s;for(let i=0;i<v.length;i++){let a=v[i];if(a.enabled!==!1&&(a.render(e,r,n,t),a.needsSwap!==!1)){let e=n;n=r,r=e}}if(f!==e.outputColorSpace||p!==e.toneMapping){f=e.outputColorSpace,p=e.toneMapping,l.defines={},It.getTransfer(f)===`srgb`&&(l.defines.SRGB_TRANSFER=``);let t=bc[p];t&&(l.defines[t]=``),l.needsUpdate=!0}l.uniforms.tDiffuse.value=n.texture,e.setRenderTarget(_),e.render(u,d),_=null,m=!1},this.isCompositing=function(){return m},this.dispose=function(){o.depthTexture&&o.depthTexture.dispose(),o.dispose(),s.dispose(),c.dispose(),l.dispose()}}var Sc=new Kt,Cc=new oa(1,1),wc=new Xt,Tc=new Zt,Ec=new ia,Dc=[],Oc=[],kc=new Float32Array(16),Ac=new Float32Array(9),jc=new Float32Array(4);function Mc(e,t,n){let r=e[0];if(r<=0||r>0)return e;let i=t*n,a=Dc[i];if(a===void 0&&(a=new Float32Array(i),Dc[i]=a),t!==0){r.toArray(a,0);for(let r=1,i=0;r!==t;++r)i+=n,e[r].toArray(a,i)}return a}function Nc(e,t){if(e.length!==t.length)return!1;for(let n=0,r=e.length;n<r;n++)if(e[n]!==t[n])return!1;return!0}function Pc(e,t){for(let n=0,r=t.length;n<r;n++)e[n]=t[n]}function Fc(e,t){let n=Oc[t];n===void 0&&(n=new Int32Array(t),Oc[t]=n);for(let r=0;r!==t;++r)n[r]=e.allocateTextureUnit();return n}function Ic(e,t){let n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function Lc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Nc(n,t))return;e.uniform2fv(this.addr,t),Pc(n,t)}}function Rc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(Nc(n,t))return;e.uniform3fv(this.addr,t),Pc(n,t)}}function zc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Nc(n,t))return;e.uniform4fv(this.addr,t),Pc(n,t)}}function Bc(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Nc(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),Pc(n,t)}else{if(Nc(n,r))return;jc.set(r),e.uniformMatrix2fv(this.addr,!1,jc),Pc(n,r)}}function Vc(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Nc(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),Pc(n,t)}else{if(Nc(n,r))return;Ac.set(r),e.uniformMatrix3fv(this.addr,!1,Ac),Pc(n,r)}}function Hc(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Nc(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),Pc(n,t)}else{if(Nc(n,r))return;kc.set(r),e.uniformMatrix4fv(this.addr,!1,kc),Pc(n,r)}}function Uc(e,t){let n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function Wc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Nc(n,t))return;e.uniform2iv(this.addr,t),Pc(n,t)}}function Gc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(Nc(n,t))return;e.uniform3iv(this.addr,t),Pc(n,t)}}function Kc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Nc(n,t))return;e.uniform4iv(this.addr,t),Pc(n,t)}}function qc(e,t){let n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function Jc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Nc(n,t))return;e.uniform2uiv(this.addr,t),Pc(n,t)}}function Yc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(Nc(n,t))return;e.uniform3uiv(this.addr,t),Pc(n,t)}}function Xc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Nc(n,t))return;e.uniform4uiv(this.addr,t),Pc(n,t)}}function Zc(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;this.type===e.SAMPLER_2D_SHADOW?(Cc.compareFunction=n.isReversedDepthBuffer()?518:515,a=Cc):a=Sc,n.setTexture2D(t||a,i)}function Qc(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture3D(t||Tc,i)}function $c(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTextureCube(t||Ec,i)}function el(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture2DArray(t||wc,i)}function tl(e){switch(e){case 5126:return Ic;case 35664:return Lc;case 35665:return Rc;case 35666:return zc;case 35674:return Bc;case 35675:return Vc;case 35676:return Hc;case 5124:case 35670:return Uc;case 35667:case 35671:return Wc;case 35668:case 35672:return Gc;case 35669:case 35673:return Kc;case 5125:return qc;case 36294:return Jc;case 36295:return Yc;case 36296:return Xc;case 35678:case 36198:case 36298:case 36306:case 35682:return Zc;case 35679:case 36299:case 36307:return Qc;case 35680:case 36300:case 36308:case 36293:return $c;case 36289:case 36303:case 36311:case 36292:return el}}function nl(e,t){e.uniform1fv(this.addr,t)}function rl(e,t){let n=Mc(t,this.size,2);e.uniform2fv(this.addr,n)}function il(e,t){let n=Mc(t,this.size,3);e.uniform3fv(this.addr,n)}function al(e,t){let n=Mc(t,this.size,4);e.uniform4fv(this.addr,n)}function ol(e,t){let n=Mc(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function sl(e,t){let n=Mc(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function cl(e,t){let n=Mc(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function ll(e,t){e.uniform1iv(this.addr,t)}function ul(e,t){e.uniform2iv(this.addr,t)}function dl(e,t){e.uniform3iv(this.addr,t)}function fl(e,t){e.uniform4iv(this.addr,t)}function pl(e,t){e.uniform1uiv(this.addr,t)}function ml(e,t){e.uniform2uiv(this.addr,t)}function hl(e,t){e.uniform3uiv(this.addr,t)}function gl(e,t){e.uniform4uiv(this.addr,t)}function _l(e,t,n){let r=this.cache,i=t.length,a=Fc(n,i);Nc(r,a)||(e.uniform1iv(this.addr,a),Pc(r,a));let o;o=this.type===e.SAMPLER_2D_SHADOW?Cc:Sc;for(let e=0;e!==i;++e)n.setTexture2D(t[e]||o,a[e])}function vl(e,t,n){let r=this.cache,i=t.length,a=Fc(n,i);Nc(r,a)||(e.uniform1iv(this.addr,a),Pc(r,a));for(let e=0;e!==i;++e)n.setTexture3D(t[e]||Tc,a[e])}function yl(e,t,n){let r=this.cache,i=t.length,a=Fc(n,i);Nc(r,a)||(e.uniform1iv(this.addr,a),Pc(r,a));for(let e=0;e!==i;++e)n.setTextureCube(t[e]||Ec,a[e])}function bl(e,t,n){let r=this.cache,i=t.length,a=Fc(n,i);Nc(r,a)||(e.uniform1iv(this.addr,a),Pc(r,a));for(let e=0;e!==i;++e)n.setTexture2DArray(t[e]||wc,a[e])}function xl(e){switch(e){case 5126:return nl;case 35664:return rl;case 35665:return il;case 35666:return al;case 35674:return ol;case 35675:return sl;case 35676:return cl;case 5124:case 35670:return ll;case 35667:case 35671:return ul;case 35668:case 35672:return dl;case 35669:case 35673:return fl;case 5125:return pl;case 36294:return ml;case 36295:return hl;case 36296:return gl;case 35678:case 36198:case 36298:case 36306:case 35682:return _l;case 35679:case 36299:case 36307:return vl;case 35680:case 36300:case 36308:case 36293:return yl;case 36289:case 36303:case 36311:case 36292:return bl}}var Sl=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=tl(t.type)}},Cl=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=xl(t.type)}},wl=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let r=this.seq;for(let i=0,a=r.length;i!==a;++i){let a=r[i];a.setValue(e,t[a.id],n)}}},Tl=/(\w+)(\])?(\[|\.)?/g;function El(e,t){e.seq.push(t),e.map[t.id]=t}function Dl(e,t,n){let r=e.name,i=r.length;for(Tl.lastIndex=0;;){let a=Tl.exec(r),o=Tl.lastIndex,s=a[1],c=a[2]===`]`,l=a[3];if(c&&(s|=0),l===void 0||l===`[`&&o+2===i){El(n,l===void 0?new Sl(s,e,t):new Cl(s,e,t));break}else{let e=n.map[s];e===void 0&&(e=new wl(s),El(n,e)),n=e}}}var Ol=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){let n=e.getActiveUniform(t,r);Dl(n,e.getUniformLocation(t,n.name),this)}let r=[],i=[];for(let t of this.seq)t.type===e.SAMPLER_2D_SHADOW||t.type===e.SAMPLER_CUBE_SHADOW||t.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(t):i.push(t);r.length>0&&(this.seq=r.concat(i))}setValue(e,t,n,r){let i=this.map[t];i!==void 0&&i.setValue(e,n,r)}setOptional(e,t,n){let r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let i=0,a=t.length;i!==a;++i){let a=t[i],o=n[a.id];o.needsUpdate!==!1&&a.setValue(e,o.value,r)}}static seqWithValue(e,t){let n=[];for(let r=0,i=e.length;r!==i;++r){let i=e[r];i.id in t&&n.push(i)}return n}};function kl(e,t,n){let r=e.createShader(t);return e.shaderSource(r,n),e.compileShader(r),r}var Al=37297,jl=0;function Ml(e,t){let n=e.split(`
`),r=[],i=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let e=i;e<a;e++){let i=e+1;r.push(`${i===t?`>`:` `} ${i}: ${n[e]}`)}return r.join(`
`)}var Nl=new U;function Pl(e){It._getMatrix(Nl,It.workingColorSpace,e);let t=`mat3( ${Nl.elements.map(e=>e.toFixed(4))} )`;switch(It.getTransfer(e)){case Be:return[t,`LinearTransferOETF`];case Ve:return[t,`sRGBTransferOETF`];default:return R(`WebGLProgram: Unsupported color space: `,e),[t,`LinearTransferOETF`]}}function Fl(e,t,n){let r=e.getShaderParameter(t,e.COMPILE_STATUS),i=(e.getShaderInfoLog(t)||``).trim();if(r&&i===``)return``;let a=/ERROR: 0:(\d+)/.exec(i);if(a){let r=parseInt(a[1]);return n.toUpperCase()+`

`+i+`

`+Ml(e.getShaderSource(t),r)}else return i}function Il(e,t){let n=Pl(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( value.rgb * ${n[0]}, value.a ) );`,`}`].join(`
`)}var Ll={1:`Linear`,2:`Reinhard`,3:`Cineon`,4:`ACESFilmic`,6:`AgX`,7:`Neutral`,5:`Custom`};function Rl(e,t){let n=Ll[t];return n===void 0?(R(`WebGLProgram: Unsupported toneMapping:`,t),`vec3 `+e+`( vec3 color ) { return LinearToneMapping( color ); }`):`vec3 `+e+`( vec3 color ) { return `+n+`ToneMapping( color ); }`}var zl=new H;function Bl(){return It.getLuminanceCoefficients(zl),[`float luminance( const in vec3 rgb ) {`,`	const vec3 weights = vec3( ${zl.x.toFixed(4)}, ${zl.y.toFixed(4)}, ${zl.z.toFixed(4)} );`,`	return dot( weights, rgb );`,`}`].join(`
`)}function Vl(e){return[e.extensionClipCullDistance?`#extension GL_ANGLE_clip_cull_distance : require`:``,e.extensionMultiDraw?`#extension GL_ANGLE_multi_draw : require`:``].filter(Wl).join(`
`)}function Hl(e){let t=[];for(let n in e){let r=e[n];r!==!1&&t.push(`#define `+n+` `+r)}return t.join(`
`)}function Ul(e,t){let n={},r=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let i=0;i<r;i++){let r=e.getActiveAttrib(t,i),a=r.name,o=1;r.type===e.FLOAT_MAT2&&(o=2),r.type===e.FLOAT_MAT3&&(o=3),r.type===e.FLOAT_MAT4&&(o=4),n[a]={type:r.type,location:e.getAttribLocation(t,a),locationSize:o}}return n}function Wl(e){return e!==``}function Gl(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Kl(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var ql=/^[ \t]*#include +<([\w\d./]+)>/gm;function Jl(e){return e.replace(ql,Xl)}var Yl=new Map;function Xl(e,t){let n=K[t];if(n===void 0){let e=Yl.get(t);if(e!==void 0)n=K[e],R(`WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.`,t,e);else throw Error(`THREE.WebGLProgram: Can not resolve #include <`+t+`>`)}return Jl(n)}var Zl=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Ql(e){return e.replace(Zl,$l)}function $l(e,t,n,r){let i=``;for(let e=parseInt(t);e<parseInt(n);e++)i+=r.replace(/\[\s*i\s*\]/g,`[ `+e+` ]`).replace(/UNROLLED_LOOP_INDEX/g,e);return i}function eu(e){let t=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;return e.precision===`highp`?t+=`
#define HIGH_PRECISION`:e.precision===`mediump`?t+=`
#define MEDIUM_PRECISION`:e.precision===`lowp`&&(t+=`
#define LOW_PRECISION`),t}var tu={1:`SHADOWMAP_TYPE_PCF`,3:`SHADOWMAP_TYPE_VSM`};function nu(e){return tu[e.shadowMapType]||`SHADOWMAP_TYPE_BASIC`}var ru={301:`ENVMAP_TYPE_CUBE`,302:`ENVMAP_TYPE_CUBE`,306:`ENVMAP_TYPE_CUBE_UV`};function iu(e){return e.envMap===!1?`ENVMAP_TYPE_CUBE`:ru[e.envMapMode]||`ENVMAP_TYPE_CUBE`}var au={302:`ENVMAP_MODE_REFRACTION`};function ou(e){return e.envMap===!1?`ENVMAP_MODE_REFLECTION`:au[e.envMapMode]||`ENVMAP_MODE_REFLECTION`}var su={0:`ENVMAP_BLENDING_MULTIPLY`,1:`ENVMAP_BLENDING_MIX`,2:`ENVMAP_BLENDING_ADD`};function cu(e){return e.envMap===!1?`ENVMAP_BLENDING_NONE`:su[e.combine]||`ENVMAP_BLENDING_NONE`}function lu(e){let t=e.envMapCubeUVHeight;if(t===null)return null;let n=Math.log2(t)-2,r=1/t;return{texelWidth:1/(3*Math.max(2**n,112)),texelHeight:r,maxMip:n}}function uu(e,t,n,r){let i=e.getContext(),a=n.defines,o=n.vertexShader,s=n.fragmentShader,c=nu(n),l=iu(n),u=ou(n),d=cu(n),f=lu(n),p=Vl(n),m=Hl(a),h=i.createProgram(),g,_,v=n.glslVersion?`#version `+n.glslVersion+`
`:``;n.isRawShaderMaterial?(g=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m].filter(Wl).join(`
`),g.length>0&&(g+=`
`),_=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m].filter(Wl).join(`
`),_.length>0&&(_+=`
`)):(g=[eu(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m,n.extensionClipCullDistance?`#define USE_CLIP_DISTANCE`:``,n.batching?`#define USE_BATCHING`:``,n.batchingColor?`#define USE_BATCHING_COLOR`:``,n.instancing?`#define USE_INSTANCING`:``,n.instancingColor?`#define USE_INSTANCING_COLOR`:``,n.instancingMorph?`#define USE_INSTANCING_MORPH`:``,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.map?`#define USE_MAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+u:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.displacementMap?`#define USE_DISPLACEMENTMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.mapUv?`#define MAP_UV `+n.mapUv:``,n.alphaMapUv?`#define ALPHAMAP_UV `+n.alphaMapUv:``,n.lightMapUv?`#define LIGHTMAP_UV `+n.lightMapUv:``,n.aoMapUv?`#define AOMAP_UV `+n.aoMapUv:``,n.emissiveMapUv?`#define EMISSIVEMAP_UV `+n.emissiveMapUv:``,n.bumpMapUv?`#define BUMPMAP_UV `+n.bumpMapUv:``,n.normalMapUv?`#define NORMALMAP_UV `+n.normalMapUv:``,n.displacementMapUv?`#define DISPLACEMENTMAP_UV `+n.displacementMapUv:``,n.metalnessMapUv?`#define METALNESSMAP_UV `+n.metalnessMapUv:``,n.roughnessMapUv?`#define ROUGHNESSMAP_UV `+n.roughnessMapUv:``,n.anisotropyMapUv?`#define ANISOTROPYMAP_UV `+n.anisotropyMapUv:``,n.clearcoatMapUv?`#define CLEARCOATMAP_UV `+n.clearcoatMapUv:``,n.clearcoatNormalMapUv?`#define CLEARCOAT_NORMALMAP_UV `+n.clearcoatNormalMapUv:``,n.clearcoatRoughnessMapUv?`#define CLEARCOAT_ROUGHNESSMAP_UV `+n.clearcoatRoughnessMapUv:``,n.iridescenceMapUv?`#define IRIDESCENCEMAP_UV `+n.iridescenceMapUv:``,n.iridescenceThicknessMapUv?`#define IRIDESCENCE_THICKNESSMAP_UV `+n.iridescenceThicknessMapUv:``,n.sheenColorMapUv?`#define SHEEN_COLORMAP_UV `+n.sheenColorMapUv:``,n.sheenRoughnessMapUv?`#define SHEEN_ROUGHNESSMAP_UV `+n.sheenRoughnessMapUv:``,n.specularMapUv?`#define SPECULARMAP_UV `+n.specularMapUv:``,n.specularColorMapUv?`#define SPECULAR_COLORMAP_UV `+n.specularColorMapUv:``,n.specularIntensityMapUv?`#define SPECULAR_INTENSITYMAP_UV `+n.specularIntensityMapUv:``,n.transmissionMapUv?`#define TRANSMISSIONMAP_UV `+n.transmissionMapUv:``,n.thicknessMapUv?`#define THICKNESSMAP_UV `+n.thicknessMapUv:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexNormals?`#define HAS_NORMAL`:``,n.vertexColors?`#define USE_COLOR`:``,n.vertexAlphas?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.flatShading?`#define FLAT_SHADED`:``,n.skinning?`#define USE_SKINNING`:``,n.morphTargets?`#define USE_MORPHTARGETS`:``,n.morphNormals&&n.flatShading===!1?`#define USE_MORPHNORMALS`:``,n.morphColors?`#define USE_MORPHCOLORS`:``,n.morphTargetsCount>0?`#define MORPHTARGETS_TEXTURE_STRIDE `+n.morphTextureStride:``,n.morphTargetsCount>0?`#define MORPHTARGETS_COUNT `+n.morphTargetsCount:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.sizeAttenuation?`#define USE_SIZEATTENUATION`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 modelMatrix;`,`uniform mat4 modelViewMatrix;`,`uniform mat4 projectionMatrix;`,`uniform mat4 viewMatrix;`,`uniform mat3 normalMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,`#ifdef USE_INSTANCING`,`	attribute mat4 instanceMatrix;`,`#endif`,`#ifdef USE_INSTANCING_COLOR`,`	attribute vec3 instanceColor;`,`#endif`,`#ifdef USE_INSTANCING_MORPH`,`	uniform sampler2D morphTexture;`,`#endif`,`attribute vec3 position;`,`attribute vec3 normal;`,`attribute vec2 uv;`,`#ifdef USE_UV1`,`	attribute vec2 uv1;`,`#endif`,`#ifdef USE_UV2`,`	attribute vec2 uv2;`,`#endif`,`#ifdef USE_UV3`,`	attribute vec2 uv3;`,`#endif`,`#ifdef USE_TANGENT`,`	attribute vec4 tangent;`,`#endif`,`#if defined( USE_COLOR_ALPHA )`,`	attribute vec4 color;`,`#elif defined( USE_COLOR )`,`	attribute vec3 color;`,`#endif`,`#ifdef USE_SKINNING`,`	attribute vec4 skinIndex;`,`	attribute vec4 skinWeight;`,`#endif`,`
`].filter(Wl).join(`
`),_=[eu(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.alphaToCoverage?`#define ALPHA_TO_COVERAGE`:``,n.map?`#define USE_MAP`:``,n.matcap?`#define USE_MATCAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+l:``,n.envMap?`#define `+u:``,n.envMap?`#define `+d:``,f?`#define CUBEUV_TEXEL_WIDTH `+f.texelWidth:``,f?`#define CUBEUV_TEXEL_HEIGHT `+f.texelHeight:``,f?`#define CUBEUV_MAX_MIP `+f.maxMip+`.0`:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.packedNormalMap?`#define USE_PACKED_NORMALMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoat?`#define USE_CLEARCOAT`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.dispersion?`#define USE_DISPERSION`:``,n.iridescence?`#define USE_IRIDESCENCE`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaTest?`#define USE_ALPHATEST`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.sheen?`#define USE_SHEEN`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexColors||n.instancingColor?`#define USE_COLOR`:``,n.vertexAlphas||n.batchingColor?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.gradientMap?`#define USE_GRADIENTMAP`:``,n.flatShading?`#define FLAT_SHADED`:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.premultipliedAlpha?`#define PREMULTIPLIED_ALPHA`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.numLightProbeGrids>0?`#define USE_LIGHT_PROBES_GRID`:``,n.decodeVideoTexture?`#define DECODE_VIDEO_TEXTURE`:``,n.decodeVideoTextureEmissive?`#define DECODE_VIDEO_TEXTURE_EMISSIVE`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 viewMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,n.toneMapping===0?``:`#define TONE_MAPPING`,n.toneMapping===0?``:K.tonemapping_pars_fragment,n.toneMapping===0?``:Rl(`toneMapping`,n.toneMapping),n.dithering?`#define DITHERING`:``,n.opaque?`#define OPAQUE`:``,K.colorspace_pars_fragment,Il(`linearToOutputTexel`,n.outputColorSpace),Bl(),n.useDepthPacking?`#define DEPTH_PACKING `+n.depthPacking:``,`
`].filter(Wl).join(`
`)),o=Jl(o),o=Gl(o,n),o=Kl(o,n),s=Jl(s),s=Gl(s,n),s=Kl(s,n),o=Ql(o),s=Ql(s),n.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,g=[p,`#define attribute in`,`#define varying out`,`#define texture2D texture`].join(`
`)+`
`+g,_=[`#define varying in`,n.glslVersion===`300 es`?``:`layout(location = 0) out highp vec4 pc_fragColor;`,n.glslVersion===`300 es`?``:`#define gl_FragColor pc_fragColor`,`#define gl_FragDepthEXT gl_FragDepth`,`#define texture2D texture`,`#define textureCube texture`,`#define texture2DProj textureProj`,`#define texture2DLodEXT textureLod`,`#define texture2DProjLodEXT textureProjLod`,`#define textureCubeLodEXT textureLod`,`#define texture2DGradEXT textureGrad`,`#define texture2DProjGradEXT textureProjGrad`,`#define textureCubeGradEXT textureGrad`].join(`
`)+`
`+_);let y=v+g+o,b=v+_+s,x=kl(i,i.VERTEX_SHADER,y),S=kl(i,i.FRAGMENT_SHADER,b);i.attachShader(h,x),i.attachShader(h,S),n.index0AttributeName===void 0?n.hasPositionAttribute===!0&&i.bindAttribLocation(h,0,`position`):i.bindAttribLocation(h,0,n.index0AttributeName),i.linkProgram(h);function C(t){if(e.debug.checkShaderErrors){let n=i.getProgramInfoLog(h)||``,r=i.getShaderInfoLog(x)||``,a=i.getShaderInfoLog(S)||``,o=n.trim(),s=r.trim(),c=a.trim(),l=!0,u=!0;if(i.getProgramParameter(h,i.LINK_STATUS)===!1)if(l=!1,typeof e.debug.onShaderError==`function`)e.debug.onShaderError(i,h,x,S);else{let e=Fl(i,x,`vertex`),n=Fl(i,S,`fragment`);z(`WebGLProgram: Shader Error `+i.getError()+` - VALIDATE_STATUS `+i.getProgramParameter(h,i.VALIDATE_STATUS)+`

Material Name: `+t.name+`
Material Type: `+t.type+`

Program Info Log: `+o+`
`+e+`
`+n)}else o===``?(s===``||c===``)&&(u=!1):R(`WebGLProgram: Program Info Log:`,o);u&&(t.diagnostics={runnable:l,programLog:o,vertexShader:{log:s,prefix:g},fragmentShader:{log:c,prefix:_}})}i.deleteShader(x),i.deleteShader(S),w=new Ol(i,h),T=Ul(i,h)}let w;this.getUniforms=function(){return w===void 0&&C(this),w};let T;this.getAttributes=function(){return T===void 0&&C(this),T};let E=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return E===!1&&(E=i.getProgramParameter(h,Al)),E},this.destroy=function(){r.releaseStatesOfProgram(this),i.deleteProgram(h),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=jl++,this.cacheKey=t,this.usedTimes=1,this.program=h,this.vertexShader=x,this.fragmentShader=S,this}var du=0,fu=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(n)===!1&&(r.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let e of t)e.usedTimes--,e.usedTimes===0&&this.shaderCache.delete(e.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new pu(e),t.set(e,n)),n}},pu=class{constructor(e){this.id=du++,this.code=e,this.usedTimes=0}};function mu(e){return e===1030||e===37490||e===36285}function hu(e,t,n,r,i,a){let o=new un,s=new fu,c=new Set,l=[],u=new Map,d=r.logarithmicDepthBuffer,f=r.precision,p={MeshDepthMaterial:`depth`,MeshDistanceMaterial:`distance`,MeshNormalMaterial:`normal`,MeshBasicMaterial:`basic`,MeshLambertMaterial:`lambert`,MeshPhongMaterial:`phong`,MeshToonMaterial:`toon`,MeshStandardMaterial:`physical`,MeshPhysicalMaterial:`physical`,MeshMatcapMaterial:`matcap`,LineBasicMaterial:`basic`,LineDashedMaterial:`dashed`,PointsMaterial:`points`,ShadowMaterial:`shadow`,SpriteMaterial:`sprite`};function m(e){return c.add(e),e===0?`uv`:`uv${e}`}function h(i,o,l,u,h,g){let _=u.fog,v=h.geometry,y=i.isMeshStandardMaterial||i.isMeshLambertMaterial||i.isMeshPhongMaterial?u.environment:null,b=i.isMeshStandardMaterial||i.isMeshLambertMaterial&&!i.envMap||i.isMeshPhongMaterial&&!i.envMap,x=t.get(i.envMap||y,b),S=x&&x.mapping===306?x.image.height:null,C=p[i.type];i.precision!==null&&(f=r.getMaxPrecision(i.precision),f!==i.precision&&R(`WebGLProgram.getParameters:`,i.precision,`not supported, using`,f,`instead.`));let w=v.morphAttributes.position||v.morphAttributes.normal||v.morphAttributes.color,T=w===void 0?0:w.length,E=0;v.morphAttributes.position!==void 0&&(E=1),v.morphAttributes.normal!==void 0&&(E=2),v.morphAttributes.color!==void 0&&(E=3);let D,O,k,A;if(C){let e=Ls[C];D=e.vertexShader,O=e.fragmentShader}else{D=i.vertexShader,O=i.fragmentShader;let e=s.getVertexShaderStage(i),t=s.getFragmentShaderStage(i);s.update(i,e,t),k=e.id,A=t.id}let ee=e.getRenderTarget(),j=e.state.buffers.depth.getReversed(),M=h.isInstancedMesh===!0,te=h.isBatchedMesh===!0,ne=!!i.map,N=!!i.matcap,re=!!x,ie=!!i.aoMap,ae=!!i.lightMap,oe=!!i.bumpMap&&i.wireframe===!1,se=!!i.normalMap,ce=!!i.displacementMap,le=!!i.emissiveMap,P=!!i.metalnessMap,ue=!!i.roughnessMap,de=i.anisotropy>0,fe=i.clearcoat>0,pe=i.dispersion>0,me=i.iridescence>0,he=i.sheen>0,ge=i.transmission>0,_e=de&&!!i.anisotropyMap,ve=fe&&!!i.clearcoatMap,ye=fe&&!!i.clearcoatNormalMap,be=fe&&!!i.clearcoatRoughnessMap,xe=me&&!!i.iridescenceMap,Se=me&&!!i.iridescenceThicknessMap,Ce=he&&!!i.sheenColorMap,we=he&&!!i.sheenRoughnessMap,Te=!!i.specularMap,Ee=!!i.specularColorMap,De=!!i.specularIntensityMap,Oe=ge&&!!i.transmissionMap,ke=ge&&!!i.thicknessMap,Ae=!!i.gradientMap,je=!!i.alphaMap,Me=i.alphaTest>0,Ne=!!i.alphaHash,F=!!i.extensions,Pe=0;i.toneMapped&&(ee===null||ee.isXRRenderTarget===!0)&&(Pe=e.toneMapping);let Fe={shaderID:C,shaderType:i.type,shaderName:i.name,vertexShader:D,fragmentShader:O,defines:i.defines,customVertexShaderID:k,customFragmentShaderID:A,isRawShaderMaterial:i.isRawShaderMaterial===!0,glslVersion:i.glslVersion,precision:f,batching:te,batchingColor:te&&h._colorsTexture!==null,instancing:M,instancingColor:M&&h.instanceColor!==null,instancingMorph:M&&h.morphTexture!==null,outputColorSpace:ee===null?e.outputColorSpace:ee.isXRRenderTarget===!0?ee.texture.colorSpace:It.workingColorSpace,alphaToCoverage:!!i.alphaToCoverage,map:ne,matcap:N,envMap:re,envMapMode:re&&x.mapping,envMapCubeUVHeight:S,aoMap:ie,lightMap:ae,bumpMap:oe,normalMap:se,displacementMap:ce,emissiveMap:le,normalMapObjectSpace:se&&i.normalMapType===1,normalMapTangentSpace:se&&i.normalMapType===0,packedNormalMap:se&&i.normalMapType===0&&mu(i.normalMap.format),metalnessMap:P,roughnessMap:ue,anisotropy:de,anisotropyMap:_e,clearcoat:fe,clearcoatMap:ve,clearcoatNormalMap:ye,clearcoatRoughnessMap:be,dispersion:pe,iridescence:me,iridescenceMap:xe,iridescenceThicknessMap:Se,sheen:he,sheenColorMap:Ce,sheenRoughnessMap:we,specularMap:Te,specularColorMap:Ee,specularIntensityMap:De,transmission:ge,transmissionMap:Oe,thicknessMap:ke,gradientMap:Ae,opaque:i.transparent===!1&&i.blending===1&&i.alphaToCoverage===!1,alphaMap:je,alphaTest:Me,alphaHash:Ne,combine:i.combine,mapUv:ne&&m(i.map.channel),aoMapUv:ie&&m(i.aoMap.channel),lightMapUv:ae&&m(i.lightMap.channel),bumpMapUv:oe&&m(i.bumpMap.channel),normalMapUv:se&&m(i.normalMap.channel),displacementMapUv:ce&&m(i.displacementMap.channel),emissiveMapUv:le&&m(i.emissiveMap.channel),metalnessMapUv:P&&m(i.metalnessMap.channel),roughnessMapUv:ue&&m(i.roughnessMap.channel),anisotropyMapUv:_e&&m(i.anisotropyMap.channel),clearcoatMapUv:ve&&m(i.clearcoatMap.channel),clearcoatNormalMapUv:ye&&m(i.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:be&&m(i.clearcoatRoughnessMap.channel),iridescenceMapUv:xe&&m(i.iridescenceMap.channel),iridescenceThicknessMapUv:Se&&m(i.iridescenceThicknessMap.channel),sheenColorMapUv:Ce&&m(i.sheenColorMap.channel),sheenRoughnessMapUv:we&&m(i.sheenRoughnessMap.channel),specularMapUv:Te&&m(i.specularMap.channel),specularColorMapUv:Ee&&m(i.specularColorMap.channel),specularIntensityMapUv:De&&m(i.specularIntensityMap.channel),transmissionMapUv:Oe&&m(i.transmissionMap.channel),thicknessMapUv:ke&&m(i.thicknessMap.channel),alphaMapUv:je&&m(i.alphaMap.channel),vertexTangents:!!v.attributes.tangent&&(se||de),vertexNormals:!!v.attributes.normal,vertexColors:i.vertexColors,vertexAlphas:i.vertexColors===!0&&!!v.attributes.color&&v.attributes.color.itemSize===4,pointsUvs:h.isPoints===!0&&!!v.attributes.uv&&(ne||je),fog:!!_,useFog:i.fog===!0,fogExp2:!!_&&_.isFogExp2,flatShading:i.wireframe===!1&&(i.flatShading===!0||v.attributes.normal===void 0&&se===!1&&(i.isMeshLambertMaterial||i.isMeshPhongMaterial||i.isMeshStandardMaterial||i.isMeshPhysicalMaterial)),sizeAttenuation:i.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:j,skinning:h.isSkinnedMesh===!0,hasPositionAttribute:v.attributes.position!==void 0,morphTargets:v.morphAttributes.position!==void 0,morphNormals:v.morphAttributes.normal!==void 0,morphColors:v.morphAttributes.color!==void 0,morphTargetsCount:T,morphTextureStride:E,numDirLights:o.directional.length,numPointLights:o.point.length,numSpotLights:o.spot.length,numSpotLightMaps:o.spotLightMap.length,numRectAreaLights:o.rectArea.length,numHemiLights:o.hemi.length,numDirLightShadows:o.directionalShadowMap.length,numPointLightShadows:o.pointShadowMap.length,numSpotLightShadows:o.spotShadowMap.length,numSpotLightShadowsWithMaps:o.numSpotLightShadowsWithMaps,numLightProbes:o.numLightProbes,numLightProbeGrids:g.length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:i.dithering,shadowMapEnabled:e.shadowMap.enabled&&l.length>0,shadowMapType:e.shadowMap.type,toneMapping:Pe,decodeVideoTexture:ne&&i.map.isVideoTexture===!0&&It.getTransfer(i.map.colorSpace)===`srgb`,decodeVideoTextureEmissive:le&&i.emissiveMap.isVideoTexture===!0&&It.getTransfer(i.emissiveMap.colorSpace)===`srgb`,premultipliedAlpha:i.premultipliedAlpha,doubleSided:i.side===2,flipSided:i.side===1,useDepthPacking:i.depthPacking>=0,depthPacking:i.depthPacking||0,index0AttributeName:i.index0AttributeName,extensionClipCullDistance:F&&i.extensions.clipCullDistance===!0&&n.has(`WEBGL_clip_cull_distance`),extensionMultiDraw:(F&&i.extensions.multiDraw===!0||te)&&n.has(`WEBGL_multi_draw`),rendererExtensionParallelShaderCompile:n.has(`KHR_parallel_shader_compile`),customProgramCacheKey:i.customProgramCacheKey()};return Fe.vertexUv1s=c.has(1),Fe.vertexUv2s=c.has(2),Fe.vertexUv3s=c.has(3),c.clear(),Fe}function g(t){let n=[];if(t.shaderID?n.push(t.shaderID):(n.push(t.customVertexShaderID),n.push(t.customFragmentShaderID)),t.defines!==void 0)for(let e in t.defines)n.push(e),n.push(t.defines[e]);return t.isRawShaderMaterial===!1&&(_(n,t),v(n,t),n.push(e.outputColorSpace)),n.push(t.customProgramCacheKey),n.join()}function _(e,t){e.push(t.precision),e.push(t.outputColorSpace),e.push(t.envMapMode),e.push(t.envMapCubeUVHeight),e.push(t.mapUv),e.push(t.alphaMapUv),e.push(t.lightMapUv),e.push(t.aoMapUv),e.push(t.bumpMapUv),e.push(t.normalMapUv),e.push(t.displacementMapUv),e.push(t.emissiveMapUv),e.push(t.metalnessMapUv),e.push(t.roughnessMapUv),e.push(t.anisotropyMapUv),e.push(t.clearcoatMapUv),e.push(t.clearcoatNormalMapUv),e.push(t.clearcoatRoughnessMapUv),e.push(t.iridescenceMapUv),e.push(t.iridescenceThicknessMapUv),e.push(t.sheenColorMapUv),e.push(t.sheenRoughnessMapUv),e.push(t.specularMapUv),e.push(t.specularColorMapUv),e.push(t.specularIntensityMapUv),e.push(t.transmissionMapUv),e.push(t.thicknessMapUv),e.push(t.combine),e.push(t.fogExp2),e.push(t.sizeAttenuation),e.push(t.morphTargetsCount),e.push(t.morphAttributeCount),e.push(t.numDirLights),e.push(t.numPointLights),e.push(t.numSpotLights),e.push(t.numSpotLightMaps),e.push(t.numHemiLights),e.push(t.numRectAreaLights),e.push(t.numDirLightShadows),e.push(t.numPointLightShadows),e.push(t.numSpotLightShadows),e.push(t.numSpotLightShadowsWithMaps),e.push(t.numLightProbes),e.push(t.shadowMapType),e.push(t.toneMapping),e.push(t.numClippingPlanes),e.push(t.numClipIntersection),e.push(t.depthPacking)}function v(e,t){o.disableAll(),t.instancing&&o.enable(0),t.instancingColor&&o.enable(1),t.instancingMorph&&o.enable(2),t.matcap&&o.enable(3),t.envMap&&o.enable(4),t.normalMapObjectSpace&&o.enable(5),t.normalMapTangentSpace&&o.enable(6),t.clearcoat&&o.enable(7),t.iridescence&&o.enable(8),t.alphaTest&&o.enable(9),t.vertexColors&&o.enable(10),t.vertexAlphas&&o.enable(11),t.vertexUv1s&&o.enable(12),t.vertexUv2s&&o.enable(13),t.vertexUv3s&&o.enable(14),t.vertexTangents&&o.enable(15),t.anisotropy&&o.enable(16),t.alphaHash&&o.enable(17),t.batching&&o.enable(18),t.dispersion&&o.enable(19),t.batchingColor&&o.enable(20),t.gradientMap&&o.enable(21),t.packedNormalMap&&o.enable(22),t.vertexNormals&&o.enable(23),e.push(o.mask),o.disableAll(),t.fog&&o.enable(0),t.useFog&&o.enable(1),t.flatShading&&o.enable(2),t.logarithmicDepthBuffer&&o.enable(3),t.reversedDepthBuffer&&o.enable(4),t.skinning&&o.enable(5),t.morphTargets&&o.enable(6),t.morphNormals&&o.enable(7),t.morphColors&&o.enable(8),t.premultipliedAlpha&&o.enable(9),t.shadowMapEnabled&&o.enable(10),t.doubleSided&&o.enable(11),t.flipSided&&o.enable(12),t.useDepthPacking&&o.enable(13),t.dithering&&o.enable(14),t.transmission&&o.enable(15),t.sheen&&o.enable(16),t.opaque&&o.enable(17),t.pointsUvs&&o.enable(18),t.decodeVideoTexture&&o.enable(19),t.decodeVideoTextureEmissive&&o.enable(20),t.alphaToCoverage&&o.enable(21),t.numLightProbeGrids>0&&o.enable(22),t.hasPositionAttribute&&o.enable(23),e.push(o.mask)}function y(e){let t=p[e.type],n;if(t){let e=Ls[t];n=uo.clone(e.uniforms)}else n=e.uniforms;return n}function b(t,n){let r=u.get(n);return r===void 0?(r=new uu(e,n,t,i),l.push(r),u.set(n,r)):++r.usedTimes,r}function x(e){if(--e.usedTimes===0){let t=l.indexOf(e);l[t]=l[l.length-1],l.pop(),u.delete(e.cacheKey),e.destroy()}}function S(e){s.remove(e)}function C(){s.dispose()}return{getParameters:h,getProgramCacheKey:g,getUniforms:y,acquireProgram:b,releaseProgram:x,releaseShaderCache:S,programs:l,dispose:C}}function gu(){let e=new WeakMap;function t(t){return e.has(t)}function n(t){let n=e.get(t);return n===void 0&&(n={},e.set(t,n)),n}function r(t){e.delete(t)}function i(t,n,r){e.get(t)[n]=r}function a(){e=new WeakMap}return{has:t,get:n,remove:r,update:i,dispose:a}}function _u(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.material.id===t.material.id?e.materialVariant===t.materialVariant?e.z===t.z?e.id-t.id:e.z-t.z:e.materialVariant-t.materialVariant:e.material.id-t.material.id:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function vu(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.z===t.z?e.id-t.id:t.z-e.z:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function yu(){let e=[],t=0,n=[],r=[],i=[];function a(){t=0,n.length=0,r.length=0,i.length=0}function o(e){let t=0;return e.isInstancedMesh&&(t+=2),e.isSkinnedMesh&&(t+=1),t}function s(n,r,i,a,s,c){let l=e[t];return l===void 0?(l={id:n.id,object:n,geometry:r,material:i,materialVariant:o(n),groupOrder:a,renderOrder:n.renderOrder,z:s,group:c},e[t]=l):(l.id=n.id,l.object=n,l.geometry=r,l.material=i,l.materialVariant=o(n),l.groupOrder=a,l.renderOrder=n.renderOrder,l.z=s,l.group=c),t++,l}function c(e,t,a,o,c,l){let u=s(e,t,a,o,c,l);a.transmission>0?r.push(u):a.transparent===!0?i.push(u):n.push(u)}function l(e,t,a,o,c,l){let u=s(e,t,a,o,c,l);a.transmission>0?r.unshift(u):a.transparent===!0?i.unshift(u):n.unshift(u)}function u(e,t,a){n.length>1&&n.sort(e||_u),r.length>1&&r.sort(t||vu),i.length>1&&i.sort(t||vu),a&&(n.reverse(),r.reverse(),i.reverse())}function d(){for(let n=t,r=e.length;n<r;n++){let t=e[n];if(t.id===null)break;t.id=null,t.object=null,t.geometry=null,t.material=null,t.group=null}}return{opaque:n,transmissive:r,transparent:i,init:a,push:c,unshift:l,finish:d,sort:u}}function bu(){let e=new WeakMap;function t(t,n){let r=e.get(t),i;return r===void 0?(i=new yu,e.set(t,[i])):n>=r.length?(i=new yu,r.push(i)):i=r[n],i}function n(){e=new WeakMap}return{get:t,dispose:n}}function xu(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`DirectionalLight`:n={direction:new H,color:new W};break;case`SpotLight`:n={position:new H,direction:new H,color:new W,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case`PointLight`:n={position:new H,color:new W,distance:0,decay:0};break;case`HemisphereLight`:n={direction:new H,skyColor:new W,groundColor:new W};break;case`RectAreaLight`:n={color:new W,position:new H,halfWidth:new H,halfHeight:new H};break}return e[t.id]=n,n}}}function Su(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`DirectionalLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new V};break;case`SpotLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new V};break;case`PointLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new V,shadowCameraNear:1,shadowCameraFar:1e3};break}return e[t.id]=n,n}}}var Cu=0;function wu(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+ +!!t.map-!!e.map}function Tu(e){let t=new xu,n=Su(),r={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let e=0;e<9;e++)r.probe.push(new H);let i=new H,a=new Qt,o=new Qt;function s(i){let a=0,o=0,s=0;for(let e=0;e<9;e++)r.probe[e].set(0,0,0);let c=0,l=0,u=0,d=0,f=0,p=0,m=0,h=0,g=0,_=0,v=0;i.sort(wu);for(let e=0,y=i.length;e<y;e++){let y=i[e],b=y.color,x=y.intensity,S=y.distance,C=null;if(y.shadow&&y.shadow.map&&(C=y.shadow.map.texture.format===1030?y.shadow.map.texture:y.shadow.map.depthTexture||y.shadow.map.texture),y.isAmbientLight)a+=b.r*x,o+=b.g*x,s+=b.b*x;else if(y.isLightProbe){for(let e=0;e<9;e++)r.probe[e].addScaledVector(y.sh.coefficients[e],x);v++}else if(y.isDirectionalLight){let e=t.get(y);if(e.color.copy(y.color).multiplyScalar(y.intensity),y.castShadow){let e=y.shadow,t=n.get(y);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,r.directionalShadow[c]=t,r.directionalShadowMap[c]=C,r.directionalShadowMatrix[c]=y.shadow.matrix,p++}r.directional[c]=e,c++}else if(y.isSpotLight){let e=t.get(y);e.position.setFromMatrixPosition(y.matrixWorld),e.color.copy(b).multiplyScalar(x),e.distance=S,e.coneCos=Math.cos(y.angle),e.penumbraCos=Math.cos(y.angle*(1-y.penumbra)),e.decay=y.decay,r.spot[u]=e;let i=y.shadow;if(y.map&&(r.spotLightMap[g]=y.map,g++,i.updateMatrices(y),y.castShadow&&_++),r.spotLightMatrix[u]=i.matrix,y.castShadow){let e=n.get(y);e.shadowIntensity=i.intensity,e.shadowBias=i.bias,e.shadowNormalBias=i.normalBias,e.shadowRadius=i.radius,e.shadowMapSize=i.mapSize,r.spotShadow[u]=e,r.spotShadowMap[u]=C,h++}u++}else if(y.isRectAreaLight){let e=t.get(y);e.color.copy(b).multiplyScalar(x),e.halfWidth.set(y.width*.5,0,0),e.halfHeight.set(0,y.height*.5,0),r.rectArea[d]=e,d++}else if(y.isPointLight){let e=t.get(y);if(e.color.copy(y.color).multiplyScalar(y.intensity),e.distance=y.distance,e.decay=y.decay,y.castShadow){let e=y.shadow,t=n.get(y);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,t.shadowCameraNear=e.camera.near,t.shadowCameraFar=e.camera.far,r.pointShadow[l]=t,r.pointShadowMap[l]=C,r.pointShadowMatrix[l]=y.shadow.matrix,m++}r.point[l]=e,l++}else if(y.isHemisphereLight){let e=t.get(y);e.skyColor.copy(y.color).multiplyScalar(x),e.groundColor.copy(y.groundColor).multiplyScalar(x),r.hemi[f]=e,f++}}d>0&&(e.has(`OES_texture_float_linear`)===!0?(r.rectAreaLTC1=q.LTC_FLOAT_1,r.rectAreaLTC2=q.LTC_FLOAT_2):(r.rectAreaLTC1=q.LTC_HALF_1,r.rectAreaLTC2=q.LTC_HALF_2)),r.ambient[0]=a,r.ambient[1]=o,r.ambient[2]=s;let y=r.hash;(y.directionalLength!==c||y.pointLength!==l||y.spotLength!==u||y.rectAreaLength!==d||y.hemiLength!==f||y.numDirectionalShadows!==p||y.numPointShadows!==m||y.numSpotShadows!==h||y.numSpotMaps!==g||y.numLightProbes!==v)&&(r.directional.length=c,r.spot.length=u,r.rectArea.length=d,r.point.length=l,r.hemi.length=f,r.directionalShadow.length=p,r.directionalShadowMap.length=p,r.pointShadow.length=m,r.pointShadowMap.length=m,r.spotShadow.length=h,r.spotShadowMap.length=h,r.directionalShadowMatrix.length=p,r.pointShadowMatrix.length=m,r.spotLightMatrix.length=h+g-_,r.spotLightMap.length=g,r.numSpotLightShadowsWithMaps=_,r.numLightProbes=v,y.directionalLength=c,y.pointLength=l,y.spotLength=u,y.rectAreaLength=d,y.hemiLength=f,y.numDirectionalShadows=p,y.numPointShadows=m,y.numSpotShadows=h,y.numSpotMaps=g,y.numLightProbes=v,r.version=Cu++)}function c(e,t){let n=0,s=0,c=0,l=0,u=0,d=t.matrixWorldInverse;for(let t=0,f=e.length;t<f;t++){let f=e[t];if(f.isDirectionalLight){let e=r.directional[n];e.direction.setFromMatrixPosition(f.matrixWorld),i.setFromMatrixPosition(f.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(d),n++}else if(f.isSpotLight){let e=r.spot[c];e.position.setFromMatrixPosition(f.matrixWorld),e.position.applyMatrix4(d),e.direction.setFromMatrixPosition(f.matrixWorld),i.setFromMatrixPosition(f.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(d),c++}else if(f.isRectAreaLight){let e=r.rectArea[l];e.position.setFromMatrixPosition(f.matrixWorld),e.position.applyMatrix4(d),o.identity(),a.copy(f.matrixWorld),a.premultiply(d),o.extractRotation(a),e.halfWidth.set(f.width*.5,0,0),e.halfHeight.set(0,f.height*.5,0),e.halfWidth.applyMatrix4(o),e.halfHeight.applyMatrix4(o),l++}else if(f.isPointLight){let e=r.point[s];e.position.setFromMatrixPosition(f.matrixWorld),e.position.applyMatrix4(d),s++}else if(f.isHemisphereLight){let e=r.hemi[u];e.direction.setFromMatrixPosition(f.matrixWorld),e.direction.transformDirection(d),u++}}}return{setup:s,setupView:c,state:r}}function Eu(e){let t=new Tu(e),n=[],r=[],i=[];function a(e){d.camera=e,n.length=0,r.length=0,i.length=0}function o(e){n.push(e)}function s(e){r.push(e)}function c(e){i.push(e)}function l(){t.setup(n)}function u(e){t.setupView(n,e)}let d={lightsArray:n,shadowsArray:r,lightProbeGridArray:i,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:d,setupLights:l,setupLightsView:u,pushLight:o,pushShadow:s,pushLightProbeGrid:c}}function Du(e){let t=new WeakMap;function n(n,r=0){let i=t.get(n),a;return i===void 0?(a=new Eu(e),t.set(n,[a])):r>=i.length?(a=new Eu(e),i.push(a)):a=i[r],a}function r(){t=new WeakMap}return{get:n,dispose:r}}var Ou=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,ku=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,Au=[new H(1,0,0),new H(-1,0,0),new H(0,1,0),new H(0,-1,0),new H(0,0,1),new H(0,0,-1)],ju=[new H(0,-1,0),new H(0,-1,0),new H(0,0,1),new H(0,0,-1),new H(0,-1,0),new H(0,-1,0)],Mu=new Qt,Nu=new H,Pu=new H;function Fu(e,t,n){let i=new Li,a=new V,s=new V,c=new qt,l=new _o,u=new vo,d={},f=n.maxTextureSize,p={0:1,1:0,2:2},_=new mo({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new V},radius:{value:4}},vertexShader:Ou,fragmentShader:ku}),v=_.clone();v.defines.HORIZONTAL_PASS=1;let y=new kr;y.setAttribute(`position`,new hr(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let b=new _i(y,_),x=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let S=this.type;this.render=function(t,n,l){if(x.enabled===!1||x.autoUpdate===!1&&x.needsUpdate===!1||t.length===0)return;this.type===2&&(R(`WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead.`),this.type=1);let u=e.getRenderTarget(),d=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),_=e.state;_.setBlending(0),_.buffers.depth.getReversed()===!0?_.buffers.color.setClear(0,0,0,0):_.buffers.color.setClear(1,1,1,1),_.buffers.depth.setTest(!0),_.setScissorTest(!1);let v=S!==this.type;v&&n.traverse(function(e){e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.needsUpdate=!0):e.material.needsUpdate=!0)});for(let u=0,d=t.length;u<d;u++){let d=t[u],p=d.shadow;if(p===void 0){R(`WebGLShadowMap:`,d,`has no shadow.`);continue}if(p.autoUpdate===!1&&p.needsUpdate===!1)continue;a.copy(p.mapSize);let y=p.getFrameExtents();a.multiply(y),s.copy(p.mapSize),(a.x>f||a.y>f)&&(a.x>f&&(s.x=Math.floor(f/y.x),a.x=s.x*y.x,p.mapSize.x=s.x),a.y>f&&(s.y=Math.floor(f/y.y),a.y=s.y*y.y,p.mapSize.y=s.y));let b=e.state.buffers.depth.getReversed();if(p.camera._reversedDepth=b,p.map===null||v===!0){if(p.map!==null&&(p.map.depthTexture!==null&&(p.map.depthTexture.dispose(),p.map.depthTexture=null),p.map.dispose()),this.type===3){if(d.isPointLight){R(`WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.`);continue}p.map=new Yt(a.x,a.y,{format:k,type:g,minFilter:o,magFilter:o,generateMipmaps:!1}),p.map.texture.name=d.name+`.shadowMap`,p.map.depthTexture=new oa(a.x,a.y,h),p.map.depthTexture.name=d.name+`.shadowMapDepth`,p.map.depthTexture.format=T,p.map.depthTexture.compareFunction=null,p.map.depthTexture.minFilter=r,p.map.depthTexture.magFilter=r}else d.isPointLight?(p.map=new fc(a.x),p.map.depthTexture=new sa(a.x,m)):(p.map=new Yt(a.x,a.y),p.map.depthTexture=new oa(a.x,a.y,m)),p.map.depthTexture.name=d.name+`.shadowMap`,p.map.depthTexture.format=T,this.type===1?(p.map.depthTexture.compareFunction=b?518:515,p.map.depthTexture.minFilter=o,p.map.depthTexture.magFilter=o):(p.map.depthTexture.compareFunction=null,p.map.depthTexture.minFilter=r,p.map.depthTexture.magFilter=r);p.camera.updateProjectionMatrix()}let x=p.map.isWebGLCubeRenderTarget?6:1;for(let t=0;t<x;t++){if(p.map.isWebGLCubeRenderTarget)e.setRenderTarget(p.map,t),e.clear();else{t===0&&(e.setRenderTarget(p.map),e.clear());let n=p.getViewport(t);c.set(s.x*n.x,s.y*n.y,s.x*n.z,s.y*n.w),_.viewport(c)}if(d.isPointLight){let e=p.camera,n=p.matrix,r=d.distance||e.far;r!==e.far&&(e.far=r,e.updateProjectionMatrix()),Nu.setFromMatrixPosition(d.matrixWorld),e.position.copy(Nu),Pu.copy(e.position),Pu.add(Au[t]),e.up.copy(ju[t]),e.lookAt(Pu),e.updateMatrixWorld(),n.makeTranslation(-Nu.x,-Nu.y,-Nu.z),Mu.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),p._frustum.setFromProjectionMatrix(Mu,e.coordinateSystem,e.reversedDepth)}else p.updateMatrices(d);i=p.getFrustum(),E(n,l,p.camera,d,this.type)}p.isPointLightShadow!==!0&&this.type===3&&C(p,l),p.needsUpdate=!1}S=this.type,x.needsUpdate=!1,e.setRenderTarget(u,d,p)};function C(n,r){let i=t.update(b);_.defines.VSM_SAMPLES!==n.blurSamples&&(_.defines.VSM_SAMPLES=n.blurSamples,v.defines.VSM_SAMPLES=n.blurSamples,_.needsUpdate=!0,v.needsUpdate=!0),n.mapPass===null&&(n.mapPass=new Yt(a.x,a.y,{format:k,type:g})),_.uniforms.shadow_pass.value=n.map.depthTexture,_.uniforms.resolution.value=n.mapSize,_.uniforms.radius.value=n.radius,e.setRenderTarget(n.mapPass),e.clear(),e.renderBufferDirect(r,null,i,_,b,null),v.uniforms.shadow_pass.value=n.mapPass.texture,v.uniforms.resolution.value=n.mapSize,v.uniforms.radius.value=n.radius,e.setRenderTarget(n.map),e.clear(),e.renderBufferDirect(r,null,i,v,b,null)}function w(t,n,r,i){let a=null,o=r.isPointLight===!0?t.customDistanceMaterial:t.customDepthMaterial;if(o!==void 0)a=o;else if(a=r.isPointLight===!0?u:l,e.localClippingEnabled&&n.clipShadows===!0&&Array.isArray(n.clippingPlanes)&&n.clippingPlanes.length!==0||n.displacementMap&&n.displacementScale!==0||n.alphaMap&&n.alphaTest>0||n.map&&n.alphaTest>0||n.alphaToCoverage===!0){let e=a.uuid,t=n.uuid,r=d[e];r===void 0&&(r={},d[e]=r);let i=r[t];i===void 0&&(i=a.clone(),r[t]=i,n.addEventListener(`dispose`,D)),a=i}if(a.visible=n.visible,a.wireframe=n.wireframe,i===3?a.side=n.shadowSide===null?n.side:n.shadowSide:a.side=n.shadowSide===null?p[n.side]:n.shadowSide,a.alphaMap=n.alphaMap,a.alphaTest=n.alphaToCoverage===!0?.5:n.alphaTest,a.map=n.map,a.clipShadows=n.clipShadows,a.clippingPlanes=n.clippingPlanes,a.clipIntersection=n.clipIntersection,a.displacementMap=n.displacementMap,a.displacementScale=n.displacementScale,a.displacementBias=n.displacementBias,a.wireframeLinewidth=n.wireframeLinewidth,a.linewidth=n.linewidth,r.isPointLight===!0&&a.isMeshDistanceMaterial===!0){let t=e.properties.get(a);t.light=r}return a}function E(n,r,a,o,s){if(n.visible===!1)return;if(n.layers.test(r.layers)&&(n.isMesh||n.isLine||n.isPoints)&&(n.castShadow||n.receiveShadow&&s===3)&&(!n.frustumCulled||i.intersectsObject(n))){n.modelViewMatrix.multiplyMatrices(a.matrixWorldInverse,n.matrixWorld);let i=t.update(n),c=n.material;if(Array.isArray(c)){let t=i.groups;for(let l=0,u=t.length;l<u;l++){let u=t[l],d=c[u.materialIndex];if(d&&d.visible){let t=w(n,d,o,s);n.onBeforeShadow(e,n,r,a,i,t,u),e.renderBufferDirect(a,null,i,t,n,u),n.onAfterShadow(e,n,r,a,i,t,u)}}}else if(c.visible){let t=w(n,c,o,s);n.onBeforeShadow(e,n,r,a,i,t,null),e.renderBufferDirect(a,null,i,t,n,null),n.onAfterShadow(e,n,r,a,i,t,null)}}let c=n.children;for(let e=0,t=c.length;e<t;e++)E(c[e],r,a,o,s)}function D(e){e.target.removeEventListener(`dispose`,D);for(let t in d){let n=d[t],r=e.target.uuid;r in n&&(n[r].dispose(),delete n[r])}}}function Iu(e,t){function n(){let t=!1,n=new qt,r=null,i=new qt(0,0,0,0);return{setMask:function(n){r!==n&&!t&&(e.colorMask(n,n,n,n),r=n)},setLocked:function(e){t=e},setClear:function(t,r,a,o,s){s===!0&&(t*=o,r*=o,a*=o),n.set(t,r,a,o),i.equals(n)===!1&&(e.clearColor(t,r,a,o),i.copy(n))},reset:function(){t=!1,r=null,i.set(-1,0,0,0)}}}function r(){let n=!1,r=!1,i=null,a=null,o=null;return{setReversed:function(e){if(r!==e){let n=t.get(`EXT_clip_control`);e?n.clipControlEXT(n.LOWER_LEFT_EXT,n.ZERO_TO_ONE_EXT):n.clipControlEXT(n.LOWER_LEFT_EXT,n.NEGATIVE_ONE_TO_ONE_EXT),r=e;let i=o;o=null,this.setClear(i)}},getReversed:function(){return r},setTest:function(t){t?P(e.DEPTH_TEST):ue(e.DEPTH_TEST)},setMask:function(t){i!==t&&!n&&(e.depthMask(t),i=t)},setFunc:function(t){if(r&&(t=tt[t]),a!==t){switch(t){case 0:e.depthFunc(e.NEVER);break;case 1:e.depthFunc(e.ALWAYS);break;case 2:e.depthFunc(e.LESS);break;case 3:e.depthFunc(e.LEQUAL);break;case 4:e.depthFunc(e.EQUAL);break;case 5:e.depthFunc(e.GEQUAL);break;case 6:e.depthFunc(e.GREATER);break;case 7:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}a=t}},setLocked:function(e){n=e},setClear:function(t){o!==t&&(o=t,r&&(t=1-t),e.clearDepth(t))},reset:function(){n=!1,i=null,a=null,o=null,r=!1}}}function i(){let t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null;return{setTest:function(n){t||(n?P(e.STENCIL_TEST):ue(e.STENCIL_TEST))},setMask:function(r){n!==r&&!t&&(e.stencilMask(r),n=r)},setFunc:function(t,n,o){(r!==t||i!==n||a!==o)&&(e.stencilFunc(t,n,o),r=t,i=n,a=o)},setOp:function(t,n,r){(o!==t||s!==n||c!==r)&&(e.stencilOp(t,n,r),o=t,s=n,c=r)},setLocked:function(e){t=e},setClear:function(t){l!==t&&(e.clearStencil(t),l=t)},reset:function(){t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null}}}let a=new n,o=new r,s=new i,c=new WeakMap,l=new WeakMap,u={},d={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new W(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,ee=null,j=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),M=!1,te=0,ne=e.getParameter(e.VERSION);ne.indexOf(`WebGL`)===-1?ne.indexOf(`OpenGL ES`)!==-1&&(te=parseFloat(/^OpenGL ES (\d)/.exec(ne)[1]),M=te>=2):(te=parseFloat(/^WebGL (\d)/.exec(ne)[1]),M=te>=1);let N=null,re={},ie=e.getParameter(e.SCISSOR_BOX),ae=e.getParameter(e.VIEWPORT),oe=new qt().fromArray(ie),se=new qt().fromArray(ae);function ce(t,n,r,i){let a=new Uint8Array(4),o=e.createTexture();e.bindTexture(t,o),e.texParameteri(t,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(t,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let o=0;o<r;o++)t===e.TEXTURE_3D||t===e.TEXTURE_2D_ARRAY?e.texImage3D(n,0,e.RGBA,1,1,i,0,e.RGBA,e.UNSIGNED_BYTE,a):e.texImage2D(n+o,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,a);return o}let le={};le[e.TEXTURE_2D]=ce(e.TEXTURE_2D,e.TEXTURE_2D,1),le[e.TEXTURE_CUBE_MAP]=ce(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),le[e.TEXTURE_2D_ARRAY]=ce(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),le[e.TEXTURE_3D]=ce(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),o.setClear(1),s.setClear(0),P(e.DEPTH_TEST),o.setFunc(3),ve(!1),ye(1),P(e.CULL_FACE),ge(0);function P(t){u[t]!==!0&&(e.enable(t),u[t]=!0)}function ue(t){u[t]!==!1&&(e.disable(t),u[t]=!1)}function de(t,n){return f[t]===n?!1:(e.bindFramebuffer(t,n),f[t]=n,t===e.DRAW_FRAMEBUFFER&&(f[e.FRAMEBUFFER]=n),t===e.FRAMEBUFFER&&(f[e.DRAW_FRAMEBUFFER]=n),!0)}function fe(t,n){let r=m,i=!1;if(t){r=p.get(n),r===void 0&&(r=[],p.set(n,r));let a=t.textures;if(r.length!==a.length||r[0]!==e.COLOR_ATTACHMENT0){for(let t=0,n=a.length;t<n;t++)r[t]=e.COLOR_ATTACHMENT0+t;r.length=a.length,i=!0}}else r[0]!==e.BACK&&(r[0]=e.BACK,i=!0);i&&e.drawBuffers(r)}function pe(t){return h===t?!1:(e.useProgram(t),h=t,!0)}let me={100:e.FUNC_ADD,101:e.FUNC_SUBTRACT,102:e.FUNC_REVERSE_SUBTRACT};me[103]=e.MIN,me[104]=e.MAX;let he={200:e.ZERO,201:e.ONE,202:e.SRC_COLOR,204:e.SRC_ALPHA,210:e.SRC_ALPHA_SATURATE,208:e.DST_COLOR,206:e.DST_ALPHA,203:e.ONE_MINUS_SRC_COLOR,205:e.ONE_MINUS_SRC_ALPHA,209:e.ONE_MINUS_DST_COLOR,207:e.ONE_MINUS_DST_ALPHA,211:e.CONSTANT_COLOR,212:e.ONE_MINUS_CONSTANT_COLOR,213:e.CONSTANT_ALPHA,214:e.ONE_MINUS_CONSTANT_ALPHA};function ge(t,n,r,i,a,o,s,c,l,u){if(t===0){g===!0&&(ue(e.BLEND),g=!1);return}if(g===!1&&(P(e.BLEND),g=!0),t!==5){if(t!==_||u!==E){if((v!==100||x!==100)&&(e.blendEquation(e.FUNC_ADD),v=100,x=100),u)switch(t){case 1:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFunc(e.ONE,e.ONE);break;case 3:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case 4:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:z(`WebGLState: Invalid blending: `,t);break}else switch(t){case 1:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case 3:z(`WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true`);break;case 4:z(`WebGLState: MultiplyBlending requires material.premultipliedAlpha = true`);break;default:z(`WebGLState: Invalid blending: `,t);break}y=null,b=null,S=null,C=null,w.set(0,0,0),T=0,_=t,E=u}return}a||=n,o||=r,s||=i,(n!==v||a!==x)&&(e.blendEquationSeparate(me[n],me[a]),v=n,x=a),(r!==y||i!==b||o!==S||s!==C)&&(e.blendFuncSeparate(he[r],he[i],he[o],he[s]),y=r,b=i,S=o,C=s),(c.equals(w)===!1||l!==T)&&(e.blendColor(c.r,c.g,c.b,l),w.copy(c),T=l),_=t,E=!1}function _e(t,n){t.side===2?ue(e.CULL_FACE):P(e.CULL_FACE);let r=t.side===1;n&&(r=!r),ve(r),t.blending===1&&t.transparent===!1?ge(0):ge(t.blending,t.blendEquation,t.blendSrc,t.blendDst,t.blendEquationAlpha,t.blendSrcAlpha,t.blendDstAlpha,t.blendColor,t.blendAlpha,t.premultipliedAlpha),o.setFunc(t.depthFunc),o.setTest(t.depthTest),o.setMask(t.depthWrite),a.setMask(t.colorWrite);let i=t.stencilWrite;s.setTest(i),i&&(s.setMask(t.stencilWriteMask),s.setFunc(t.stencilFunc,t.stencilRef,t.stencilFuncMask),s.setOp(t.stencilFail,t.stencilZFail,t.stencilZPass)),xe(t.polygonOffset,t.polygonOffsetFactor,t.polygonOffsetUnits),t.alphaToCoverage===!0?P(e.SAMPLE_ALPHA_TO_COVERAGE):ue(e.SAMPLE_ALPHA_TO_COVERAGE)}function ve(t){D!==t&&(t?e.frontFace(e.CW):e.frontFace(e.CCW),D=t)}function ye(t){t===0?ue(e.CULL_FACE):(P(e.CULL_FACE),t!==O&&(t===1?e.cullFace(e.BACK):t===2?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))),O=t}function be(t){t!==k&&(M&&e.lineWidth(t),k=t)}function xe(t,n,r){t?(P(e.POLYGON_OFFSET_FILL),(A!==n||ee!==r)&&(A=n,ee=r,o.getReversed()&&(n=-n),e.polygonOffset(n,r))):ue(e.POLYGON_OFFSET_FILL)}function Se(t){t?P(e.SCISSOR_TEST):ue(e.SCISSOR_TEST)}function Ce(t){t===void 0&&(t=e.TEXTURE0+j-1),N!==t&&(e.activeTexture(t),N=t)}function we(t,n,r){r===void 0&&(r=N===null?e.TEXTURE0+j-1:N);let i=re[r];i===void 0&&(i={type:void 0,texture:void 0},re[r]=i),(i.type!==t||i.texture!==n)&&(N!==r&&(e.activeTexture(r),N=r),e.bindTexture(t,n||le[t]),i.type=t,i.texture=n)}function Te(){let t=re[N];t!==void 0&&t.type!==void 0&&(e.bindTexture(t.type,null),t.type=void 0,t.texture=void 0)}function Ee(){try{e.compressedTexImage2D(...arguments)}catch(e){z(`WebGLState:`,e)}}function De(){try{e.compressedTexImage3D(...arguments)}catch(e){z(`WebGLState:`,e)}}function Oe(){try{e.texSubImage2D(...arguments)}catch(e){z(`WebGLState:`,e)}}function ke(){try{e.texSubImage3D(...arguments)}catch(e){z(`WebGLState:`,e)}}function Ae(){try{e.compressedTexSubImage2D(...arguments)}catch(e){z(`WebGLState:`,e)}}function je(){try{e.compressedTexSubImage3D(...arguments)}catch(e){z(`WebGLState:`,e)}}function Me(){try{e.texStorage2D(...arguments)}catch(e){z(`WebGLState:`,e)}}function Ne(){try{e.texStorage3D(...arguments)}catch(e){z(`WebGLState:`,e)}}function F(){try{e.texImage2D(...arguments)}catch(e){z(`WebGLState:`,e)}}function Pe(){try{e.texImage3D(...arguments)}catch(e){z(`WebGLState:`,e)}}function Fe(t){return d[t]===void 0?e.getParameter(t):d[t]}function Ie(t,n){d[t]!==n&&(e.pixelStorei(t,n),d[t]=n)}function I(t){oe.equals(t)===!1&&(e.scissor(t.x,t.y,t.z,t.w),oe.copy(t))}function Le(t){se.equals(t)===!1&&(e.viewport(t.x,t.y,t.z,t.w),se.copy(t))}function L(t,n){let r=l.get(n);r===void 0&&(r=new WeakMap,l.set(n,r));let i=r.get(t);i===void 0&&(i=e.getUniformBlockIndex(n,t.name),r.set(t,i))}function Re(t,n){let r=l.get(n).get(t);c.get(n)!==r&&(e.uniformBlockBinding(n,r,t.__bindingPointIndex),c.set(n,r))}function ze(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),u={},d={},N=null,re={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new W(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,ee=null,oe.set(0,0,e.canvas.width,e.canvas.height),se.set(0,0,e.canvas.width,e.canvas.height),a.reset(),o.reset(),s.reset()}return{buffers:{color:a,depth:o,stencil:s},enable:P,disable:ue,bindFramebuffer:de,drawBuffers:fe,useProgram:pe,setBlending:ge,setMaterial:_e,setFlipSided:ve,setCullFace:ye,setLineWidth:be,setPolygonOffset:xe,setScissorTest:Se,activeTexture:Ce,bindTexture:we,unbindTexture:Te,compressedTexImage2D:Ee,compressedTexImage3D:De,texImage2D:F,texImage3D:Pe,pixelStorei:Ie,getParameter:Fe,updateUBOMapping:L,uniformBlockBinding:Re,texStorage2D:Me,texStorage3D:Ne,texSubImage2D:Oe,texSubImage3D:ke,compressedTexSubImage2D:Ae,compressedTexSubImage3D:je,scissor:I,viewport:Le,reset:ze}}function Lu(l,u,d,f,p,m,h){let g=u.has(`WEBGL_multisampled_render_to_texture`)?u.get(`WEBGL_multisampled_render_to_texture`):null,_=typeof navigator>`u`?!1:/OculusBrowser/g.test(navigator.userAgent),v=new V,y=new WeakMap,b=new Set,x,S=new WeakMap,C=!1;try{C=typeof OffscreenCanvas<`u`&&new OffscreenCanvas(1,1).getContext(`2d`)!==null}catch{}function w(e,t){return C?new OffscreenCanvas(e,t):Je(`canvas`)}function T(e,t,n){let r=1,i=Fe(e);if((i.width>n||i.height>n)&&(r=n/Math.max(i.width,i.height)),r<1)if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof VideoFrame<`u`&&e instanceof VideoFrame){let n=Math.floor(r*i.width),a=Math.floor(r*i.height);x===void 0&&(x=w(n,a));let o=t?w(n,a):x;return o.width=n,o.height=a,o.getContext(`2d`).drawImage(e,0,0,n,a),R(`WebGLRenderer: Texture has been resized from (`+i.width+`x`+i.height+`) to (`+n+`x`+a+`).`),o}else return`data`in e&&R(`WebGLRenderer: Image in DataTexture is too big (`+i.width+`x`+i.height+`).`),e;return e}function D(e){return e.generateMipmaps}function O(e){l.generateMipmap(e)}function k(e){return e.isWebGLCubeRenderTarget?l.TEXTURE_CUBE_MAP:e.isWebGL3DRenderTarget?l.TEXTURE_3D:e.isWebGLArrayRenderTarget||e.isCompressedArrayTexture?l.TEXTURE_2D_ARRAY:l.TEXTURE_2D}function A(e,t,n,r,i,a=!1){if(e!==null){if(l[e]!==void 0)return l[e];R(`WebGLRenderer: Attempt to use non-existing WebGL internal format '`+e+`'`)}let o;r&&(o=u.get(`EXT_texture_norm16`),o||R(`WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension`));let s=t;if(t===l.RED&&(n===l.FLOAT&&(s=l.R32F),n===l.HALF_FLOAT&&(s=l.R16F),n===l.UNSIGNED_BYTE&&(s=l.R8),n===l.UNSIGNED_SHORT&&o&&(s=o.R16_EXT),n===l.SHORT&&o&&(s=o.R16_SNORM_EXT)),t===l.RED_INTEGER&&(n===l.UNSIGNED_BYTE&&(s=l.R8UI),n===l.UNSIGNED_SHORT&&(s=l.R16UI),n===l.UNSIGNED_INT&&(s=l.R32UI),n===l.BYTE&&(s=l.R8I),n===l.SHORT&&(s=l.R16I),n===l.INT&&(s=l.R32I)),t===l.RG&&(n===l.FLOAT&&(s=l.RG32F),n===l.HALF_FLOAT&&(s=l.RG16F),n===l.UNSIGNED_BYTE&&(s=l.RG8),n===l.UNSIGNED_SHORT&&o&&(s=o.RG16_EXT),n===l.SHORT&&o&&(s=o.RG16_SNORM_EXT)),t===l.RG_INTEGER&&(n===l.UNSIGNED_BYTE&&(s=l.RG8UI),n===l.UNSIGNED_SHORT&&(s=l.RG16UI),n===l.UNSIGNED_INT&&(s=l.RG32UI),n===l.BYTE&&(s=l.RG8I),n===l.SHORT&&(s=l.RG16I),n===l.INT&&(s=l.RG32I)),t===l.RGB_INTEGER&&(n===l.UNSIGNED_BYTE&&(s=l.RGB8UI),n===l.UNSIGNED_SHORT&&(s=l.RGB16UI),n===l.UNSIGNED_INT&&(s=l.RGB32UI),n===l.BYTE&&(s=l.RGB8I),n===l.SHORT&&(s=l.RGB16I),n===l.INT&&(s=l.RGB32I)),t===l.RGBA_INTEGER&&(n===l.UNSIGNED_BYTE&&(s=l.RGBA8UI),n===l.UNSIGNED_SHORT&&(s=l.RGBA16UI),n===l.UNSIGNED_INT&&(s=l.RGBA32UI),n===l.BYTE&&(s=l.RGBA8I),n===l.SHORT&&(s=l.RGBA16I),n===l.INT&&(s=l.RGBA32I)),t===l.RGB&&(n===l.UNSIGNED_SHORT&&o&&(s=o.RGB16_EXT),n===l.SHORT&&o&&(s=o.RGB16_SNORM_EXT),n===l.UNSIGNED_INT_5_9_9_9_REV&&(s=l.RGB9_E5),n===l.UNSIGNED_INT_10F_11F_11F_REV&&(s=l.R11F_G11F_B10F)),t===l.RGBA){let e=a?Be:It.getTransfer(i);n===l.FLOAT&&(s=l.RGBA32F),n===l.HALF_FLOAT&&(s=l.RGBA16F),n===l.UNSIGNED_BYTE&&(s=e===`srgb`?l.SRGB8_ALPHA8:l.RGBA8),n===l.UNSIGNED_SHORT&&o&&(s=o.RGBA16_EXT),n===l.SHORT&&o&&(s=o.RGBA16_SNORM_EXT),n===l.UNSIGNED_SHORT_4_4_4_4&&(s=l.RGBA4),n===l.UNSIGNED_SHORT_5_5_5_1&&(s=l.RGB5_A1)}return(s===l.R16F||s===l.R32F||s===l.RG16F||s===l.RG32F||s===l.RGBA16F||s===l.RGBA32F)&&u.get(`EXT_color_buffer_float`),s}function ee(e,t){let n;return e?t===null||t===1014||t===1020?n=l.DEPTH24_STENCIL8:t===1015?n=l.DEPTH32F_STENCIL8:t===1012&&(n=l.DEPTH24_STENCIL8,R(`DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.`)):t===null||t===1014||t===1020?n=l.DEPTH_COMPONENT24:t===1015?n=l.DEPTH_COMPONENT32F:t===1012&&(n=l.DEPTH_COMPONENT16),n}function j(e,t){return D(e)===!0||e.isFramebufferTexture&&e.minFilter!==1003&&e.minFilter!==1006?Math.log2(Math.max(t.width,t.height))+1:e.mipmaps!==void 0&&e.mipmaps.length>0?e.mipmaps.length:e.isCompressedTexture&&Array.isArray(e.image)?t.mipmaps.length:1}function M(e){let t=e.target;t.removeEventListener(`dispose`,M),ne(t),t.isVideoTexture&&y.delete(t),t.isHTMLTexture&&b.delete(t)}function te(e){let t=e.target;t.removeEventListener(`dispose`,te),re(t)}function ne(e){let t=f.get(e);if(t.__webglInit===void 0)return;let n=e.source,r=S.get(n);if(r){let i=r[t.__cacheKey];i.usedTimes--,i.usedTimes===0&&N(e),Object.keys(r).length===0&&S.delete(n)}f.remove(e)}function N(e){let t=f.get(e);l.deleteTexture(t.__webglTexture);let n=e.source,r=S.get(n);delete r[t.__cacheKey],h.memory.textures--}function re(e){let t=f.get(e);if(e.depthTexture&&(e.depthTexture.dispose(),f.remove(e.depthTexture)),e.isWebGLCubeRenderTarget)for(let e=0;e<6;e++){if(Array.isArray(t.__webglFramebuffer[e]))for(let n=0;n<t.__webglFramebuffer[e].length;n++)l.deleteFramebuffer(t.__webglFramebuffer[e][n]);else l.deleteFramebuffer(t.__webglFramebuffer[e]);t.__webglDepthbuffer&&l.deleteRenderbuffer(t.__webglDepthbuffer[e])}else{if(Array.isArray(t.__webglFramebuffer))for(let e=0;e<t.__webglFramebuffer.length;e++)l.deleteFramebuffer(t.__webglFramebuffer[e]);else l.deleteFramebuffer(t.__webglFramebuffer);if(t.__webglDepthbuffer&&l.deleteRenderbuffer(t.__webglDepthbuffer),t.__webglMultisampledFramebuffer&&l.deleteFramebuffer(t.__webglMultisampledFramebuffer),t.__webglColorRenderbuffer)for(let e=0;e<t.__webglColorRenderbuffer.length;e++)t.__webglColorRenderbuffer[e]&&l.deleteRenderbuffer(t.__webglColorRenderbuffer[e]);t.__webglDepthRenderbuffer&&l.deleteRenderbuffer(t.__webglDepthRenderbuffer)}let n=e.textures;for(let e=0,t=n.length;e<t;e++){let t=f.get(n[e]);t.__webglTexture&&(l.deleteTexture(t.__webglTexture),h.memory.textures--),f.remove(n[e])}f.remove(e)}let ie=0;function ae(){ie=0}function oe(){return ie}function se(e){ie=e}function ce(){let e=ie;return e>=p.maxTextures&&R(`WebGLTextures: Trying to use `+e+` texture units while this GPU supports only `+p.maxTextures),ie+=1,e}function le(e){let t=[];return t.push(e.wrapS),t.push(e.wrapT),t.push(e.wrapR||0),t.push(e.magFilter),t.push(e.minFilter),t.push(e.anisotropy),t.push(e.internalFormat),t.push(e.format),t.push(e.type),t.push(e.generateMipmaps),t.push(e.premultiplyAlpha),t.push(e.flipY),t.push(e.unpackAlignment),t.push(e.colorSpace),t.join()}function P(e,t){let n=f.get(e);if(e.isVideoTexture&&F(e),e.isRenderTargetTexture===!1&&e.isExternalTexture!==!0&&e.version>0&&n.__version!==e.version){let r=e.image;if(r===null)R(`WebGLRenderer: Texture marked for update but no image data found.`);else if(r.complete===!1)R(`WebGLRenderer: Texture marked for update but image is incomplete`);else{be(n,e,t);return}}else e.isExternalTexture&&(n.__webglTexture=e.sourceTexture?e.sourceTexture:null);d.bindTexture(l.TEXTURE_2D,n.__webglTexture,l.TEXTURE0+t)}function ue(e,t){let n=f.get(e);if(e.isRenderTargetTexture===!1&&e.version>0&&n.__version!==e.version){be(n,e,t);return}else e.isExternalTexture&&(n.__webglTexture=e.sourceTexture?e.sourceTexture:null);d.bindTexture(l.TEXTURE_2D_ARRAY,n.__webglTexture,l.TEXTURE0+t)}function de(e,t){let n=f.get(e);if(e.isRenderTargetTexture===!1&&e.version>0&&n.__version!==e.version){be(n,e,t);return}d.bindTexture(l.TEXTURE_3D,n.__webglTexture,l.TEXTURE0+t)}function fe(e,t){let n=f.get(e);if(e.isCubeDepthTexture!==!0&&e.version>0&&n.__version!==e.version){xe(n,e,t);return}d.bindTexture(l.TEXTURE_CUBE_MAP,n.__webglTexture,l.TEXTURE0+t)}let pe={[e]:l.REPEAT,[t]:l.CLAMP_TO_EDGE,[n]:l.MIRRORED_REPEAT},me={[r]:l.NEAREST,[i]:l.NEAREST_MIPMAP_NEAREST,[a]:l.NEAREST_MIPMAP_LINEAR,[o]:l.LINEAR,[s]:l.LINEAR_MIPMAP_NEAREST,[c]:l.LINEAR_MIPMAP_LINEAR},he={512:l.NEVER,519:l.ALWAYS,513:l.LESS,515:l.LEQUAL,514:l.EQUAL,518:l.GEQUAL,516:l.GREATER,517:l.NOTEQUAL};function ge(e,t){if(t.type===1015&&u.has(`OES_texture_float_linear`)===!1&&(t.magFilter===1006||t.magFilter===1007||t.magFilter===1005||t.magFilter===1008||t.minFilter===1006||t.minFilter===1007||t.minFilter===1005||t.minFilter===1008)&&R(`WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.`),l.texParameteri(e,l.TEXTURE_WRAP_S,pe[t.wrapS]),l.texParameteri(e,l.TEXTURE_WRAP_T,pe[t.wrapT]),(e===l.TEXTURE_3D||e===l.TEXTURE_2D_ARRAY)&&l.texParameteri(e,l.TEXTURE_WRAP_R,pe[t.wrapR]),l.texParameteri(e,l.TEXTURE_MAG_FILTER,me[t.magFilter]),l.texParameteri(e,l.TEXTURE_MIN_FILTER,me[t.minFilter]),t.compareFunction&&(l.texParameteri(e,l.TEXTURE_COMPARE_MODE,l.COMPARE_REF_TO_TEXTURE),l.texParameteri(e,l.TEXTURE_COMPARE_FUNC,he[t.compareFunction])),u.has(`EXT_texture_filter_anisotropic`)===!0){if(t.magFilter===1003||t.minFilter!==1005&&t.minFilter!==1008||t.type===1015&&u.has(`OES_texture_float_linear`)===!1)return;if(t.anisotropy>1||f.get(t).__currentAnisotropy){let n=u.get(`EXT_texture_filter_anisotropic`);l.texParameterf(e,n.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(t.anisotropy,p.getMaxAnisotropy())),f.get(t).__currentAnisotropy=t.anisotropy}}}function _e(e,t){let n=!1;e.__webglInit===void 0&&(e.__webglInit=!0,t.addEventListener(`dispose`,M));let r=t.source,i=S.get(r);i===void 0&&(i={},S.set(r,i));let a=le(t);if(a!==e.__cacheKey){i[a]===void 0&&(i[a]={texture:l.createTexture(),usedTimes:0},h.memory.textures++,n=!0),i[a].usedTimes++;let r=i[e.__cacheKey];r!==void 0&&(i[e.__cacheKey].usedTimes--,r.usedTimes===0&&N(t)),e.__cacheKey=a,e.__webglTexture=i[a].texture}return n}function ve(e,t,n){return Math.floor(Math.floor(e/n)/t)}function ye(e,t,n,r){let i=e.updateRanges;if(i.length===0)d.texSubImage2D(l.TEXTURE_2D,0,0,0,t.width,t.height,n,r,t.data);else{i.sort((e,t)=>e.start-t.start);let a=0;for(let e=1;e<i.length;e++){let n=i[a],r=i[e],o=n.start+n.count,s=ve(r.start,t.width,4),c=ve(n.start,t.width,4);r.start<=o+1&&s===c&&ve(r.start+r.count-1,t.width,4)===s?n.count=Math.max(n.count,r.start+r.count-n.start):(++a,i[a]=r)}i.length=a+1;let o=d.getParameter(l.UNPACK_ROW_LENGTH),s=d.getParameter(l.UNPACK_SKIP_PIXELS),c=d.getParameter(l.UNPACK_SKIP_ROWS);d.pixelStorei(l.UNPACK_ROW_LENGTH,t.width);for(let e=0,a=i.length;e<a;e++){let a=i[e],o=Math.floor(a.start/4),s=Math.ceil(a.count/4),c=o%t.width,u=Math.floor(o/t.width),f=s;d.pixelStorei(l.UNPACK_SKIP_PIXELS,c),d.pixelStorei(l.UNPACK_SKIP_ROWS,u),d.texSubImage2D(l.TEXTURE_2D,0,c,u,f,1,n,r,t.data)}e.clearUpdateRanges(),d.pixelStorei(l.UNPACK_ROW_LENGTH,o),d.pixelStorei(l.UNPACK_SKIP_PIXELS,s),d.pixelStorei(l.UNPACK_SKIP_ROWS,c)}}function be(e,t,n){let r=l.TEXTURE_2D;(t.isDataArrayTexture||t.isCompressedArrayTexture)&&(r=l.TEXTURE_2D_ARRAY),t.isData3DTexture&&(r=l.TEXTURE_3D);let i=_e(e,t),a=t.source;d.bindTexture(r,e.__webglTexture,l.TEXTURE0+n);let o=f.get(a);if(a.version!==o.__version||i===!0){if(d.activeTexture(l.TEXTURE0+n),!(typeof ImageBitmap<`u`&&t.image instanceof ImageBitmap)){let e=It.getPrimaries(It.workingColorSpace),n=t.colorSpace===``?null:It.getPrimaries(t.colorSpace),r=t.colorSpace===``||e===n?l.NONE:l.BROWSER_DEFAULT_WEBGL;d.pixelStorei(l.UNPACK_FLIP_Y_WEBGL,t.flipY),d.pixelStorei(l.UNPACK_PREMULTIPLY_ALPHA_WEBGL,t.premultiplyAlpha),d.pixelStorei(l.UNPACK_COLORSPACE_CONVERSION_WEBGL,r)}d.pixelStorei(l.UNPACK_ALIGNMENT,t.unpackAlignment);let e=T(t.image,!1,p.maxTextureSize);e=Pe(t,e);let s=m.convert(t.format,t.colorSpace),c=m.convert(t.type),u=A(t.internalFormat,s,c,t.normalized,t.colorSpace,t.isVideoTexture);ge(r,t);let f,h=t.mipmaps,g=t.isVideoTexture!==!0,_=o.__version===void 0||i===!0,v=a.dataReady,y=j(t,e);if(t.isDepthTexture)u=ee(t.format===E,t.type),_&&(g?d.texStorage2D(l.TEXTURE_2D,1,u,e.width,e.height):d.texImage2D(l.TEXTURE_2D,0,u,e.width,e.height,0,s,c,null));else if(t.isDataTexture)if(h.length>0){g&&_&&d.texStorage2D(l.TEXTURE_2D,y,u,h[0].width,h[0].height);for(let e=0,t=h.length;e<t;e++)f=h[e],g?v&&d.texSubImage2D(l.TEXTURE_2D,e,0,0,f.width,f.height,s,c,f.data):d.texImage2D(l.TEXTURE_2D,e,u,f.width,f.height,0,s,c,f.data);t.generateMipmaps=!1}else g?(_&&d.texStorage2D(l.TEXTURE_2D,y,u,e.width,e.height),v&&ye(t,e,s,c)):d.texImage2D(l.TEXTURE_2D,0,u,e.width,e.height,0,s,c,e.data);else if(t.isCompressedTexture)if(t.isCompressedArrayTexture){g&&_&&d.texStorage3D(l.TEXTURE_2D_ARRAY,y,u,h[0].width,h[0].height,e.depth);for(let n=0,r=h.length;n<r;n++)if(f=h[n],t.format!==1023)if(s!==null)if(g){if(v)if(t.layerUpdates.size>0){let e=Ns(f.width,f.height,t.format,t.type);for(let r of t.layerUpdates){let t=f.data.subarray(r*e/f.data.BYTES_PER_ELEMENT,(r+1)*e/f.data.BYTES_PER_ELEMENT);d.compressedTexSubImage3D(l.TEXTURE_2D_ARRAY,n,0,0,r,f.width,f.height,1,s,t)}t.clearLayerUpdates()}else d.compressedTexSubImage3D(l.TEXTURE_2D_ARRAY,n,0,0,0,f.width,f.height,e.depth,s,f.data)}else d.compressedTexImage3D(l.TEXTURE_2D_ARRAY,n,u,f.width,f.height,e.depth,0,f.data,0,0);else R(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`);else g?v&&d.texSubImage3D(l.TEXTURE_2D_ARRAY,n,0,0,0,f.width,f.height,e.depth,s,c,f.data):d.texImage3D(l.TEXTURE_2D_ARRAY,n,u,f.width,f.height,e.depth,0,s,c,f.data)}else{g&&_&&d.texStorage2D(l.TEXTURE_2D,y,u,h[0].width,h[0].height);for(let e=0,n=h.length;e<n;e++)f=h[e],t.format===1023?g?v&&d.texSubImage2D(l.TEXTURE_2D,e,0,0,f.width,f.height,s,c,f.data):d.texImage2D(l.TEXTURE_2D,e,u,f.width,f.height,0,s,c,f.data):s===null?R(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`):g?v&&d.compressedTexSubImage2D(l.TEXTURE_2D,e,0,0,f.width,f.height,s,f.data):d.compressedTexImage2D(l.TEXTURE_2D,e,u,f.width,f.height,0,f.data)}else if(t.isDataArrayTexture)if(g){if(_&&d.texStorage3D(l.TEXTURE_2D_ARRAY,y,u,e.width,e.height,e.depth),v)if(t.layerUpdates.size>0){let n=Ns(e.width,e.height,t.format,t.type);for(let r of t.layerUpdates){let t=e.data.subarray(r*n/e.data.BYTES_PER_ELEMENT,(r+1)*n/e.data.BYTES_PER_ELEMENT);d.texSubImage3D(l.TEXTURE_2D_ARRAY,0,0,0,r,e.width,e.height,1,s,c,t)}t.clearLayerUpdates()}else d.texSubImage3D(l.TEXTURE_2D_ARRAY,0,0,0,0,e.width,e.height,e.depth,s,c,e.data)}else d.texImage3D(l.TEXTURE_2D_ARRAY,0,u,e.width,e.height,e.depth,0,s,c,e.data);else if(t.isData3DTexture)g?(_&&d.texStorage3D(l.TEXTURE_3D,y,u,e.width,e.height,e.depth),v&&d.texSubImage3D(l.TEXTURE_3D,0,0,0,0,e.width,e.height,e.depth,s,c,e.data)):d.texImage3D(l.TEXTURE_3D,0,u,e.width,e.height,e.depth,0,s,c,e.data);else if(t.isFramebufferTexture){if(_)if(g)d.texStorage2D(l.TEXTURE_2D,y,u,e.width,e.height);else{let t=e.width,n=e.height;for(let e=0;e<y;e++)d.texImage2D(l.TEXTURE_2D,e,u,t,n,0,s,c,null),t>>=1,n>>=1}}else if(t.isHTMLTexture){if(`texElementImage2D`in l){let n=l.canvas;if(n.hasAttribute(`layoutsubtree`)||n.setAttribute(`layoutsubtree`,`true`),e.parentNode!==n){n.appendChild(e),b.add(t),n.onpaint=e=>{let t=e.changedElements;for(let e of b)t.includes(e.image)&&(e.needsUpdate=!0)},n.requestPaint();return}if(l.texElementImage2D.length===3)l.texElementImage2D(l.TEXTURE_2D,l.RGBA8,e);else{let t=l.RGBA,n=l.RGBA,r=l.UNSIGNED_BYTE;l.texElementImage2D(l.TEXTURE_2D,0,t,n,r,e)}l.texParameteri(l.TEXTURE_2D,l.TEXTURE_MIN_FILTER,l.LINEAR),l.texParameteri(l.TEXTURE_2D,l.TEXTURE_WRAP_S,l.CLAMP_TO_EDGE),l.texParameteri(l.TEXTURE_2D,l.TEXTURE_WRAP_T,l.CLAMP_TO_EDGE)}}else if(h.length>0){if(g&&_){let e=Fe(h[0]);d.texStorage2D(l.TEXTURE_2D,y,u,e.width,e.height)}for(let e=0,t=h.length;e<t;e++)f=h[e],g?v&&d.texSubImage2D(l.TEXTURE_2D,e,0,0,s,c,f):d.texImage2D(l.TEXTURE_2D,e,u,s,c,f);t.generateMipmaps=!1}else if(g){if(_){let t=Fe(e);d.texStorage2D(l.TEXTURE_2D,y,u,t.width,t.height)}v&&d.texSubImage2D(l.TEXTURE_2D,0,0,0,s,c,e)}else d.texImage2D(l.TEXTURE_2D,0,u,s,c,e);D(t)&&O(r),o.__version=a.version,t.onUpdate&&t.onUpdate(t)}e.__version=t.version}function xe(e,t,n){if(t.image.length!==6)return;let r=_e(e,t),i=t.source;d.bindTexture(l.TEXTURE_CUBE_MAP,e.__webglTexture,l.TEXTURE0+n);let a=f.get(i);if(i.version!==a.__version||r===!0){d.activeTexture(l.TEXTURE0+n);let e=It.getPrimaries(It.workingColorSpace),o=t.colorSpace===``?null:It.getPrimaries(t.colorSpace),s=t.colorSpace===``||e===o?l.NONE:l.BROWSER_DEFAULT_WEBGL;d.pixelStorei(l.UNPACK_FLIP_Y_WEBGL,t.flipY),d.pixelStorei(l.UNPACK_PREMULTIPLY_ALPHA_WEBGL,t.premultiplyAlpha),d.pixelStorei(l.UNPACK_ALIGNMENT,t.unpackAlignment),d.pixelStorei(l.UNPACK_COLORSPACE_CONVERSION_WEBGL,s);let c=t.isCompressedTexture||t.image[0].isCompressedTexture,u=t.image[0]&&t.image[0].isDataTexture,f=[];for(let e=0;e<6;e++)!c&&!u?f[e]=T(t.image[e],!0,p.maxCubemapSize):f[e]=u?t.image[e].image:t.image[e],f[e]=Pe(t,f[e]);let h=f[0],g=m.convert(t.format,t.colorSpace),_=m.convert(t.type),v=A(t.internalFormat,g,_,t.normalized,t.colorSpace),y=t.isVideoTexture!==!0,b=a.__version===void 0||r===!0,x=i.dataReady,S=j(t,h);ge(l.TEXTURE_CUBE_MAP,t);let C;if(c){y&&b&&d.texStorage2D(l.TEXTURE_CUBE_MAP,S,v,h.width,h.height);for(let e=0;e<6;e++){C=f[e].mipmaps;for(let n=0;n<C.length;n++){let r=C[n];t.format===1023?y?x&&d.texSubImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X+e,n,0,0,r.width,r.height,g,_,r.data):d.texImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X+e,n,v,r.width,r.height,0,g,_,r.data):g===null?R(`WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()`):y?x&&d.compressedTexSubImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X+e,n,0,0,r.width,r.height,g,r.data):d.compressedTexImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X+e,n,v,r.width,r.height,0,r.data)}}}else{if(C=t.mipmaps,y&&b){C.length>0&&S++;let e=Fe(f[0]);d.texStorage2D(l.TEXTURE_CUBE_MAP,S,v,e.width,e.height)}for(let e=0;e<6;e++)if(u){y?x&&d.texSubImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X+e,0,0,0,f[e].width,f[e].height,g,_,f[e].data):d.texImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X+e,0,v,f[e].width,f[e].height,0,g,_,f[e].data);for(let t=0;t<C.length;t++){let n=C[t].image[e].image;y?x&&d.texSubImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X+e,t+1,0,0,n.width,n.height,g,_,n.data):d.texImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X+e,t+1,v,n.width,n.height,0,g,_,n.data)}}else{y?x&&d.texSubImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X+e,0,0,0,g,_,f[e]):d.texImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X+e,0,v,g,_,f[e]);for(let t=0;t<C.length;t++){let n=C[t];y?x&&d.texSubImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X+e,t+1,0,0,g,_,n.image[e]):d.texImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X+e,t+1,v,g,_,n.image[e])}}}D(t)&&O(l.TEXTURE_CUBE_MAP),a.__version=i.version,t.onUpdate&&t.onUpdate(t)}e.__version=t.version}function Se(e,t,n,r,i,a){let o=m.convert(n.format,n.colorSpace),s=m.convert(n.type),c=A(n.internalFormat,o,s,n.normalized,n.colorSpace),u=f.get(t),p=f.get(n);if(p.__renderTarget=t,!u.__hasExternalTextures){let e=Math.max(1,t.width>>a),n=Math.max(1,t.height>>a);i===l.TEXTURE_3D||i===l.TEXTURE_2D_ARRAY?d.texImage3D(i,a,c,e,n,t.depth,0,o,s,null):d.texImage2D(i,a,c,e,n,0,o,s,null)}d.bindFramebuffer(l.FRAMEBUFFER,e),Ne(t)?g.framebufferTexture2DMultisampleEXT(l.FRAMEBUFFER,r,i,p.__webglTexture,0,Me(t)):(i===l.TEXTURE_2D||i>=l.TEXTURE_CUBE_MAP_POSITIVE_X&&i<=l.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&l.framebufferTexture2D(l.FRAMEBUFFER,r,i,p.__webglTexture,a),d.bindFramebuffer(l.FRAMEBUFFER,null)}function Ce(e,t,n){if(l.bindRenderbuffer(l.RENDERBUFFER,e),t.depthBuffer){let r=t.depthTexture,i=r&&r.isDepthTexture?r.type:null,a=ee(t.stencilBuffer,i),o=t.stencilBuffer?l.DEPTH_STENCIL_ATTACHMENT:l.DEPTH_ATTACHMENT;Ne(t)?g.renderbufferStorageMultisampleEXT(l.RENDERBUFFER,Me(t),a,t.width,t.height):n?l.renderbufferStorageMultisample(l.RENDERBUFFER,Me(t),a,t.width,t.height):l.renderbufferStorage(l.RENDERBUFFER,a,t.width,t.height),l.framebufferRenderbuffer(l.FRAMEBUFFER,o,l.RENDERBUFFER,e)}else{let e=t.textures;for(let r=0;r<e.length;r++){let i=e[r],a=m.convert(i.format,i.colorSpace),o=m.convert(i.type),s=A(i.internalFormat,a,o,i.normalized,i.colorSpace);Ne(t)?g.renderbufferStorageMultisampleEXT(l.RENDERBUFFER,Me(t),s,t.width,t.height):n?l.renderbufferStorageMultisample(l.RENDERBUFFER,Me(t),s,t.width,t.height):l.renderbufferStorage(l.RENDERBUFFER,s,t.width,t.height)}}l.bindRenderbuffer(l.RENDERBUFFER,null)}function we(e,t,n){let r=t.isWebGLCubeRenderTarget===!0;if(d.bindFramebuffer(l.FRAMEBUFFER,e),!(t.depthTexture&&t.depthTexture.isDepthTexture))throw Error(`THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.`);let i=f.get(t.depthTexture);if(i.__renderTarget=t,(!i.__webglTexture||t.depthTexture.image.width!==t.width||t.depthTexture.image.height!==t.height)&&(t.depthTexture.image.width=t.width,t.depthTexture.image.height=t.height,t.depthTexture.needsUpdate=!0),r){if(i.__webglInit===void 0&&(i.__webglInit=!0,t.depthTexture.addEventListener(`dispose`,M)),i.__webglTexture===void 0){i.__webglTexture=l.createTexture(),d.bindTexture(l.TEXTURE_CUBE_MAP,i.__webglTexture),ge(l.TEXTURE_CUBE_MAP,t.depthTexture);let e=m.convert(t.depthTexture.format),n=m.convert(t.depthTexture.type),r;t.depthTexture.format===1026?r=l.DEPTH_COMPONENT24:t.depthTexture.format===1027&&(r=l.DEPTH24_STENCIL8);for(let i=0;i<6;i++)l.texImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X+i,0,r,t.width,t.height,0,e,n,null)}}else P(t.depthTexture,0);let a=i.__webglTexture,o=Me(t),s=r?l.TEXTURE_CUBE_MAP_POSITIVE_X+n:l.TEXTURE_2D,c=t.depthTexture.format===1027?l.DEPTH_STENCIL_ATTACHMENT:l.DEPTH_ATTACHMENT;if(t.depthTexture.format===1026)Ne(t)?g.framebufferTexture2DMultisampleEXT(l.FRAMEBUFFER,c,s,a,0,o):l.framebufferTexture2D(l.FRAMEBUFFER,c,s,a,0);else if(t.depthTexture.format===1027)Ne(t)?g.framebufferTexture2DMultisampleEXT(l.FRAMEBUFFER,c,s,a,0,o):l.framebufferTexture2D(l.FRAMEBUFFER,c,s,a,0);else throw Error(`THREE.WebGLTextures: Unknown depthTexture format.`)}function Te(e){let t=f.get(e),n=e.isWebGLCubeRenderTarget===!0;if(t.__boundDepthTexture!==e.depthTexture){let n=e.depthTexture;if(t.__depthDisposeCallback&&t.__depthDisposeCallback(),n){let e=()=>{delete t.__boundDepthTexture,delete t.__depthDisposeCallback,n.removeEventListener(`dispose`,e)};n.addEventListener(`dispose`,e),t.__depthDisposeCallback=e}t.__boundDepthTexture=n}if(e.depthTexture&&!t.__autoAllocateDepthBuffer)if(n)for(let n=0;n<6;n++)we(t.__webglFramebuffer[n],e,n);else{let n=e.texture.mipmaps;n&&n.length>0?we(t.__webglFramebuffer[0],e,0):we(t.__webglFramebuffer,e,0)}else if(n){t.__webglDepthbuffer=[];for(let n=0;n<6;n++)if(d.bindFramebuffer(l.FRAMEBUFFER,t.__webglFramebuffer[n]),t.__webglDepthbuffer[n]===void 0)t.__webglDepthbuffer[n]=l.createRenderbuffer(),Ce(t.__webglDepthbuffer[n],e,!1);else{let r=e.stencilBuffer?l.DEPTH_STENCIL_ATTACHMENT:l.DEPTH_ATTACHMENT,i=t.__webglDepthbuffer[n];l.bindRenderbuffer(l.RENDERBUFFER,i),l.framebufferRenderbuffer(l.FRAMEBUFFER,r,l.RENDERBUFFER,i)}}else{let n=e.texture.mipmaps;if(n&&n.length>0?d.bindFramebuffer(l.FRAMEBUFFER,t.__webglFramebuffer[0]):d.bindFramebuffer(l.FRAMEBUFFER,t.__webglFramebuffer),t.__webglDepthbuffer===void 0)t.__webglDepthbuffer=l.createRenderbuffer(),Ce(t.__webglDepthbuffer,e,!1);else{let n=e.stencilBuffer?l.DEPTH_STENCIL_ATTACHMENT:l.DEPTH_ATTACHMENT,r=t.__webglDepthbuffer;l.bindRenderbuffer(l.RENDERBUFFER,r),l.framebufferRenderbuffer(l.FRAMEBUFFER,n,l.RENDERBUFFER,r)}}d.bindFramebuffer(l.FRAMEBUFFER,null)}function Ee(e,t,n){let r=f.get(e);t!==void 0&&Se(r.__webglFramebuffer,e,e.texture,l.COLOR_ATTACHMENT0,l.TEXTURE_2D,0),n!==void 0&&Te(e)}function De(e){let t=e.texture,n=f.get(e),r=f.get(t);e.addEventListener(`dispose`,te);let i=e.textures,a=e.isWebGLCubeRenderTarget===!0,o=i.length>1;if(o||(r.__webglTexture===void 0&&(r.__webglTexture=l.createTexture()),r.__version=t.version,h.memory.textures++),a){n.__webglFramebuffer=[];for(let e=0;e<6;e++)if(t.mipmaps&&t.mipmaps.length>0){n.__webglFramebuffer[e]=[];for(let r=0;r<t.mipmaps.length;r++)n.__webglFramebuffer[e][r]=l.createFramebuffer()}else n.__webglFramebuffer[e]=l.createFramebuffer()}else{if(t.mipmaps&&t.mipmaps.length>0){n.__webglFramebuffer=[];for(let e=0;e<t.mipmaps.length;e++)n.__webglFramebuffer[e]=l.createFramebuffer()}else n.__webglFramebuffer=l.createFramebuffer();if(o)for(let e=0,t=i.length;e<t;e++){let t=f.get(i[e]);t.__webglTexture===void 0&&(t.__webglTexture=l.createTexture(),h.memory.textures++)}if(e.samples>0&&Ne(e)===!1){n.__webglMultisampledFramebuffer=l.createFramebuffer(),n.__webglColorRenderbuffer=[],d.bindFramebuffer(l.FRAMEBUFFER,n.__webglMultisampledFramebuffer);for(let t=0;t<i.length;t++){let r=i[t];n.__webglColorRenderbuffer[t]=l.createRenderbuffer(),l.bindRenderbuffer(l.RENDERBUFFER,n.__webglColorRenderbuffer[t]);let a=m.convert(r.format,r.colorSpace),o=m.convert(r.type),s=A(r.internalFormat,a,o,r.normalized,r.colorSpace,e.isXRRenderTarget===!0),c=Me(e);l.renderbufferStorageMultisample(l.RENDERBUFFER,c,s,e.width,e.height),l.framebufferRenderbuffer(l.FRAMEBUFFER,l.COLOR_ATTACHMENT0+t,l.RENDERBUFFER,n.__webglColorRenderbuffer[t])}l.bindRenderbuffer(l.RENDERBUFFER,null),e.depthBuffer&&(n.__webglDepthRenderbuffer=l.createRenderbuffer(),Ce(n.__webglDepthRenderbuffer,e,!0)),d.bindFramebuffer(l.FRAMEBUFFER,null)}}if(a){d.bindTexture(l.TEXTURE_CUBE_MAP,r.__webglTexture),ge(l.TEXTURE_CUBE_MAP,t);for(let r=0;r<6;r++)if(t.mipmaps&&t.mipmaps.length>0)for(let i=0;i<t.mipmaps.length;i++)Se(n.__webglFramebuffer[r][i],e,t,l.COLOR_ATTACHMENT0,l.TEXTURE_CUBE_MAP_POSITIVE_X+r,i);else Se(n.__webglFramebuffer[r],e,t,l.COLOR_ATTACHMENT0,l.TEXTURE_CUBE_MAP_POSITIVE_X+r,0);D(t)&&O(l.TEXTURE_CUBE_MAP),d.unbindTexture()}else if(o){for(let t=0,r=i.length;t<r;t++){let r=i[t],a=f.get(r),o=l.TEXTURE_2D;(e.isWebGL3DRenderTarget||e.isWebGLArrayRenderTarget)&&(o=e.isWebGL3DRenderTarget?l.TEXTURE_3D:l.TEXTURE_2D_ARRAY),d.bindTexture(o,a.__webglTexture),ge(o,r),Se(n.__webglFramebuffer,e,r,l.COLOR_ATTACHMENT0+t,o,0),D(r)&&O(o)}d.unbindTexture()}else{let i=l.TEXTURE_2D;if((e.isWebGL3DRenderTarget||e.isWebGLArrayRenderTarget)&&(i=e.isWebGL3DRenderTarget?l.TEXTURE_3D:l.TEXTURE_2D_ARRAY),d.bindTexture(i,r.__webglTexture),ge(i,t),t.mipmaps&&t.mipmaps.length>0)for(let r=0;r<t.mipmaps.length;r++)Se(n.__webglFramebuffer[r],e,t,l.COLOR_ATTACHMENT0,i,r);else Se(n.__webglFramebuffer,e,t,l.COLOR_ATTACHMENT0,i,0);D(t)&&O(i),d.unbindTexture()}e.depthBuffer&&Te(e)}function Oe(e){let t=e.textures;for(let n=0,r=t.length;n<r;n++){let r=t[n];if(D(r)){let t=k(e),n=f.get(r).__webglTexture;d.bindTexture(t,n),O(t),d.unbindTexture()}}}let ke=[],Ae=[];function je(e){if(e.samples>0){if(Ne(e)===!1){let t=e.textures,n=e.width,r=e.height,i=l.COLOR_BUFFER_BIT,a=e.stencilBuffer?l.DEPTH_STENCIL_ATTACHMENT:l.DEPTH_ATTACHMENT,o=f.get(e),s=t.length>1;if(s)for(let e=0;e<t.length;e++)d.bindFramebuffer(l.FRAMEBUFFER,o.__webglMultisampledFramebuffer),l.framebufferRenderbuffer(l.FRAMEBUFFER,l.COLOR_ATTACHMENT0+e,l.RENDERBUFFER,null),d.bindFramebuffer(l.FRAMEBUFFER,o.__webglFramebuffer),l.framebufferTexture2D(l.DRAW_FRAMEBUFFER,l.COLOR_ATTACHMENT0+e,l.TEXTURE_2D,null,0);d.bindFramebuffer(l.READ_FRAMEBUFFER,o.__webglMultisampledFramebuffer);let c=e.texture.mipmaps;c&&c.length>0?d.bindFramebuffer(l.DRAW_FRAMEBUFFER,o.__webglFramebuffer[0]):d.bindFramebuffer(l.DRAW_FRAMEBUFFER,o.__webglFramebuffer);for(let c=0;c<t.length;c++){if(e.resolveDepthBuffer&&(e.depthBuffer&&(i|=l.DEPTH_BUFFER_BIT),e.stencilBuffer&&e.resolveStencilBuffer&&(i|=l.STENCIL_BUFFER_BIT)),s){l.framebufferRenderbuffer(l.READ_FRAMEBUFFER,l.COLOR_ATTACHMENT0,l.RENDERBUFFER,o.__webglColorRenderbuffer[c]);let e=f.get(t[c]).__webglTexture;l.framebufferTexture2D(l.DRAW_FRAMEBUFFER,l.COLOR_ATTACHMENT0,l.TEXTURE_2D,e,0)}l.blitFramebuffer(0,0,n,r,0,0,n,r,i,l.NEAREST),_===!0&&(ke.length=0,Ae.length=0,ke.push(l.COLOR_ATTACHMENT0+c),e.depthBuffer&&e.resolveDepthBuffer===!1&&(ke.push(a),Ae.push(a),l.invalidateFramebuffer(l.DRAW_FRAMEBUFFER,Ae)),l.invalidateFramebuffer(l.READ_FRAMEBUFFER,ke))}if(d.bindFramebuffer(l.READ_FRAMEBUFFER,null),d.bindFramebuffer(l.DRAW_FRAMEBUFFER,null),s)for(let e=0;e<t.length;e++){d.bindFramebuffer(l.FRAMEBUFFER,o.__webglMultisampledFramebuffer),l.framebufferRenderbuffer(l.FRAMEBUFFER,l.COLOR_ATTACHMENT0+e,l.RENDERBUFFER,o.__webglColorRenderbuffer[e]);let n=f.get(t[e]).__webglTexture;d.bindFramebuffer(l.FRAMEBUFFER,o.__webglFramebuffer),l.framebufferTexture2D(l.DRAW_FRAMEBUFFER,l.COLOR_ATTACHMENT0+e,l.TEXTURE_2D,n,0)}d.bindFramebuffer(l.DRAW_FRAMEBUFFER,o.__webglMultisampledFramebuffer)}else if(e.depthBuffer&&e.resolveDepthBuffer===!1&&_){let t=e.stencilBuffer?l.DEPTH_STENCIL_ATTACHMENT:l.DEPTH_ATTACHMENT;l.invalidateFramebuffer(l.DRAW_FRAMEBUFFER,[t])}}}function Me(e){return Math.min(p.maxSamples,e.samples)}function Ne(e){let t=f.get(e);return e.samples>0&&u.has(`WEBGL_multisampled_render_to_texture`)===!0&&t.__useRenderToTexture!==!1}function F(e){let t=h.render.frame;y.get(e)!==t&&(y.set(e,t),e.update())}function Pe(e,t){let n=e.colorSpace,r=e.format,i=e.type;return e.isCompressedTexture===!0||e.isVideoTexture===!0||n!==`srgb-linear`&&n!==``&&(It.getTransfer(n)===`srgb`?(r!==1023||i!==1009)&&R(`WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.`):z(`WebGLTextures: Unsupported texture color space:`,n)),t}function Fe(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement?(v.width=e.naturalWidth||e.width,v.height=e.naturalHeight||e.height):typeof VideoFrame<`u`&&e instanceof VideoFrame?(v.width=e.displayWidth,v.height=e.displayHeight):(v.width=e.width,v.height=e.height),v}this.allocateTextureUnit=ce,this.resetTextureUnits=ae,this.getTextureUnits=oe,this.setTextureUnits=se,this.setTexture2D=P,this.setTexture2DArray=ue,this.setTexture3D=de,this.setTextureCube=fe,this.rebindTextures=Ee,this.setupRenderTarget=De,this.updateRenderTargetMipmap=Oe,this.updateMultisampleRenderTarget=je,this.setupDepthRenderbuffer=Te,this.setupFrameBufferTexture=Se,this.useMultisampledRTT=Ne,this.isReversedDepthBuffer=function(){return d.buffers.depth.getReversed()}}function Ru(e,t){function n(n,r=``){let i,a=It.getTransfer(r);if(n===1009)return e.UNSIGNED_BYTE;if(n===1017)return e.UNSIGNED_SHORT_4_4_4_4;if(n===1018)return e.UNSIGNED_SHORT_5_5_5_1;if(n===35902)return e.UNSIGNED_INT_5_9_9_9_REV;if(n===35899)return e.UNSIGNED_INT_10F_11F_11F_REV;if(n===1010)return e.BYTE;if(n===1011)return e.SHORT;if(n===1012)return e.UNSIGNED_SHORT;if(n===1013)return e.INT;if(n===1014)return e.UNSIGNED_INT;if(n===1015)return e.FLOAT;if(n===1016)return e.HALF_FLOAT;if(n===1021)return e.ALPHA;if(n===1022)return e.RGB;if(n===1023)return e.RGBA;if(n===1026)return e.DEPTH_COMPONENT;if(n===1027)return e.DEPTH_STENCIL;if(n===1028)return e.RED;if(n===1029)return e.RED_INTEGER;if(n===1030)return e.RG;if(n===1031)return e.RG_INTEGER;if(n===1033)return e.RGBA_INTEGER;if(n===33776||n===33777||n===33778||n===33779)if(a===`srgb`)if(i=t.get(`WEBGL_compressed_texture_s3tc_srgb`),i!==null){if(n===33776)return i.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(i=t.get(`WEBGL_compressed_texture_s3tc`),i!==null){if(n===33776)return i.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===35840||n===35841||n===35842||n===35843)if(i=t.get(`WEBGL_compressed_texture_pvrtc`),i!==null){if(n===35840)return i.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===35841)return i.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===35842)return i.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===35843)return i.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===36196||n===37492||n===37496||n===37488||n===37489||n===37490||n===37491)if(i=t.get(`WEBGL_compressed_texture_etc`),i!==null){if(n===36196||n===37492)return a===`srgb`?i.COMPRESSED_SRGB8_ETC2:i.COMPRESSED_RGB8_ETC2;if(n===37496)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:i.COMPRESSED_RGBA8_ETC2_EAC;if(n===37488)return i.COMPRESSED_R11_EAC;if(n===37489)return i.COMPRESSED_SIGNED_R11_EAC;if(n===37490)return i.COMPRESSED_RG11_EAC;if(n===37491)return i.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===37808||n===37809||n===37810||n===37811||n===37812||n===37813||n===37814||n===37815||n===37816||n===37817||n===37818||n===37819||n===37820||n===37821)if(i=t.get(`WEBGL_compressed_texture_astc`),i!==null){if(n===37808)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:i.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===37809)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:i.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===37810)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:i.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===37811)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:i.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===37812)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:i.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===37813)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:i.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===37814)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:i.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===37815)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:i.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===37816)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:i.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===37817)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:i.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===37818)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:i.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===37819)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:i.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===37820)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:i.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===37821)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:i.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===36492||n===36494||n===36495)if(i=t.get(`EXT_texture_compression_bptc`),i!==null){if(n===36492)return a===`srgb`?i.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:i.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===36494)return i.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===36495)return i.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===36283||n===36284||n===36285||n===36286)if(i=t.get(`EXT_texture_compression_rgtc`),i!==null){if(n===36283)return i.COMPRESSED_RED_RGTC1_EXT;if(n===36284)return i.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===36285)return i.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===36286)return i.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===1020?e.UNSIGNED_INT_24_8:e[n]===void 0?null:e[n]}return{convert:n}}var zu=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Bu=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,Vu=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new ca(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new mo({vertexShader:zu,fragmentShader:Bu,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new _i(new eo(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Hu=class extends nt{constructor(e,t){super();let n=this,r=null,i=1,a=null,o=`local-floor`,s=1,c=null,u=null,d=null,f=null,p=null,h=null,g=typeof XRWebGLBinding<`u`,_=new Vu,v={},b=t.getContextAttributes(),x=null,S=null,C=[],D=[],O=new V,k=null,A=new $o;A.viewport=new qt;let ee=new $o;ee.viewport=new qt;let j=[A,ee],M=new cs,te=null,ne=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(e){let t=C[e];return t===void 0&&(t=new kn,C[e]=t),t.getTargetRaySpace()},this.getControllerGrip=function(e){let t=C[e];return t===void 0&&(t=new kn,C[e]=t),t.getGripSpace()},this.getHand=function(e){let t=C[e];return t===void 0&&(t=new kn,C[e]=t),t.getHandSpace()};function N(e){let t=D.indexOf(e.inputSource);if(t===-1)return;let n=C[t];n!==void 0&&(n.update(e.inputSource,e.frame,c||a),n.dispatchEvent({type:e.type,data:e.inputSource}))}function re(){r.removeEventListener(`select`,N),r.removeEventListener(`selectstart`,N),r.removeEventListener(`selectend`,N),r.removeEventListener(`squeeze`,N),r.removeEventListener(`squeezestart`,N),r.removeEventListener(`squeezeend`,N),r.removeEventListener(`end`,re),r.removeEventListener(`inputsourceschange`,ie);for(let e=0;e<C.length;e++){let t=D[e];t!==null&&(D[e]=null,C[e].disconnect(t))}te=null,ne=null,_.reset();for(let e in v)delete v[e];e.setRenderTarget(x),p=null,f=null,d=null,r=null,S=null,de.stop(),n.isPresenting=!1,e.setPixelRatio(k),e.setSize(O.width,O.height,!1),n.dispatchEvent({type:`sessionend`})}this.setFramebufferScaleFactor=function(e){i=e,n.isPresenting===!0&&R(`WebXRManager: Cannot change framebuffer scale while presenting.`)},this.setReferenceSpaceType=function(e){o=e,n.isPresenting===!0&&R(`WebXRManager: Cannot change reference space type while presenting.`)},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(e){c=e},this.getBaseLayer=function(){return f===null?p:f},this.getBinding=function(){return d===null&&g&&(d=new XRWebGLBinding(r,t)),d},this.getFrame=function(){return h},this.getSession=function(){return r},this.setSession=async function(u){if(r=u,r!==null){if(x=e.getRenderTarget(),r.addEventListener(`select`,N),r.addEventListener(`selectstart`,N),r.addEventListener(`selectend`,N),r.addEventListener(`squeeze`,N),r.addEventListener(`squeezestart`,N),r.addEventListener(`squeezeend`,N),r.addEventListener(`end`,re),r.addEventListener(`inputsourceschange`,ie),b.xrCompatible!==!0&&await t.makeXRCompatible(),k=e.getPixelRatio(),e.getSize(O),g&&`createProjectionLayer`in XRWebGLBinding.prototype){let n=null,a=null,o=null;b.depth&&(o=b.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,n=b.stencil?E:T,a=b.stencil?y:m);let s={colorFormat:t.RGBA8,depthFormat:o,scaleFactor:i};d=this.getBinding(),f=d.createProjectionLayer(s),r.updateRenderState({layers:[f]}),e.setPixelRatio(1),e.setSize(f.textureWidth,f.textureHeight,!1),S=new Yt(f.textureWidth,f.textureHeight,{format:w,type:l,depthTexture:new oa(f.textureWidth,f.textureHeight,a,void 0,void 0,void 0,void 0,void 0,void 0,n),stencilBuffer:b.stencil,colorSpace:e.outputColorSpace,samples:b.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}else{let n={antialias:b.antialias,alpha:!0,depth:b.depth,stencil:b.stencil,framebufferScaleFactor:i};p=new XRWebGLLayer(r,t,n),r.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),S=new Yt(p.framebufferWidth,p.framebufferHeight,{format:w,type:l,colorSpace:e.outputColorSpace,stencilBuffer:b.stencil,resolveDepthBuffer:p.ignoreDepthValues===!1,resolveStencilBuffer:p.ignoreDepthValues===!1})}S.isXRRenderTarget=!0,this.setFoveation(s),c=null,a=await r.requestReferenceSpace(o),de.setContext(r),de.start(),n.isPresenting=!0,n.dispatchEvent({type:`sessionstart`})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return _.getDepthTexture()};function ie(e){for(let t=0;t<e.removed.length;t++){let n=e.removed[t],r=D.indexOf(n);r>=0&&(D[r]=null,C[r].disconnect(n))}for(let t=0;t<e.added.length;t++){let n=e.added[t],r=D.indexOf(n);if(r===-1){for(let e=0;e<C.length;e++)if(e>=D.length){D.push(n),r=e;break}else if(D[e]===null){D[e]=n,r=e;break}if(r===-1)break}let i=C[r];i&&i.connect(n)}}let ae=new H,oe=new H;function se(e,t,n){ae.setFromMatrixPosition(t.matrixWorld),oe.setFromMatrixPosition(n.matrixWorld);let r=ae.distanceTo(oe),i=t.projectionMatrix.elements,a=n.projectionMatrix.elements,o=i[14]/(i[10]-1),s=i[14]/(i[10]+1),c=(i[9]+1)/i[5],l=(i[9]-1)/i[5],u=(i[8]-1)/i[0],d=(a[8]+1)/a[0],f=o*u,p=o*d,m=r/(-u+d),h=m*-u;if(t.matrixWorld.decompose(e.position,e.quaternion,e.scale),e.translateX(h),e.translateZ(m),e.matrixWorld.compose(e.position,e.quaternion,e.scale),e.matrixWorldInverse.copy(e.matrixWorld).invert(),i[10]===-1)e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse);else{let t=o+m,n=s+m,i=f-h,a=p+(r-h),u=c*s/n*t,d=l*s/n*t;e.projectionMatrix.makePerspective(i,a,u,d,t,n),e.projectionMatrixInverse.copy(e.projectionMatrix).invert()}}function ce(e,t){t===null?e.matrixWorld.copy(e.matrix):e.matrixWorld.multiplyMatrices(t.matrixWorld,e.matrix),e.matrixWorldInverse.copy(e.matrixWorld).invert()}this.updateCamera=function(e){if(r===null)return;let t=e.near,n=e.far;_.texture!==null&&(_.depthNear>0&&(t=_.depthNear),_.depthFar>0&&(n=_.depthFar)),M.near=ee.near=A.near=t,M.far=ee.far=A.far=n,(te!==M.near||ne!==M.far)&&(r.updateRenderState({depthNear:M.near,depthFar:M.far}),te=M.near,ne=M.far),M.layers.mask=e.layers.mask|6,A.layers.mask=M.layers.mask&-5,ee.layers.mask=M.layers.mask&-3;let i=e.parent,a=M.cameras;ce(M,i);for(let e=0;e<a.length;e++)ce(a[e],i);a.length===2?se(M,A,ee):M.projectionMatrix.copy(A.projectionMatrix),le(e,M,i)};function le(e,t,n){n===null?e.matrix.copy(t.matrixWorld):(e.matrix.copy(n.matrixWorld),e.matrix.invert(),e.matrix.multiply(t.matrixWorld)),e.matrix.decompose(e.position,e.quaternion,e.scale),e.updateMatrixWorld(!0),e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse),e.isPerspectiveCamera&&(e.fov=ot*2*Math.atan(1/e.projectionMatrix.elements[5]),e.zoom=1)}this.getCamera=function(){return M},this.getFoveation=function(){if(!(f===null&&p===null))return s},this.setFoveation=function(e){s=e,f!==null&&(f.fixedFoveation=e),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=e)},this.hasDepthSensing=function(){return _.texture!==null},this.getDepthSensingMesh=function(){return _.getMesh(M)},this.getCameraTexture=function(e){return v[e]};let P=null;function ue(t,i){if(u=i.getViewerPose(c||a),h=i,u!==null){let t=u.views;p!==null&&(e.setRenderTargetFramebuffer(S,p.framebuffer),e.setRenderTarget(S));let i=!1;t.length!==M.cameras.length&&(M.cameras.length=0,i=!0);for(let n=0;n<t.length;n++){let r=t[n],a=null;if(p!==null)a=p.getViewport(r);else{let t=d.getViewSubImage(f,r);a=t.viewport,n===0&&(e.setRenderTargetTextures(S,t.colorTexture,t.depthStencilTexture),e.setRenderTarget(S))}let o=j[n];o===void 0&&(o=new $o,o.layers.enable(n),o.viewport=new qt,j[n]=o),o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.projectionMatrix.fromArray(r.projectionMatrix),o.projectionMatrixInverse.copy(o.projectionMatrix).invert(),o.viewport.set(a.x,a.y,a.width,a.height),n===0&&(M.matrix.copy(o.matrix),M.matrix.decompose(M.position,M.quaternion,M.scale)),i===!0&&M.cameras.push(o)}let a=r.enabledFeatures;if(a&&a.includes(`depth-sensing`)&&r.depthUsage==`gpu-optimized`&&g){d=n.getBinding();let e=d.getDepthInformation(t[0]);e&&e.isValid&&e.texture&&_.init(e,r.renderState)}if(a&&a.includes(`camera-access`)&&g){e.state.unbindTexture(),d=n.getBinding();for(let e=0;e<t.length;e++){let n=t[e].camera;if(n){let e=v[n];e||(e=new ca,v[n]=e);let t=d.getCameraImage(n);e.sourceTexture=t}}}}for(let e=0;e<C.length;e++){let t=D[e],n=C[e];t!==null&&n!==void 0&&n.update(t,i,c||a)}P&&P(t,i),i.detectedPlanes&&n.dispatchEvent({type:`planesdetected`,data:i}),h=null}let de=new Fs;de.setAnimationLoop(ue),this.setAnimationLoop=function(e){P=e},this.dispose=function(){}}},Uu=new Qt,Wu=new U;Wu.set(-1,0,0,0,1,0,0,0,1);function Gu(e,t){function n(e,t){e.matrixAutoUpdate===!0&&e.updateMatrix(),t.value.copy(e.matrix)}function r(t,n){n.color.getRGB(t.fogColor.value,lo(e)),n.isFog?(t.fogNear.value=n.near,t.fogFar.value=n.far):n.isFogExp2&&(t.fogDensity.value=n.density)}function i(e,t,n,r,i){t.isNodeMaterial?t.uniformsNeedUpdate=!1:t.isMeshBasicMaterial?a(e,t):t.isMeshLambertMaterial?(a(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshToonMaterial?(a(e,t),d(e,t)):t.isMeshPhongMaterial?(a(e,t),u(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshStandardMaterial?(a(e,t),f(e,t),t.isMeshPhysicalMaterial&&p(e,t,i)):t.isMeshMatcapMaterial?(a(e,t),m(e,t)):t.isMeshDepthMaterial?a(e,t):t.isMeshDistanceMaterial?(a(e,t),h(e,t)):t.isMeshNormalMaterial?a(e,t):t.isLineBasicMaterial?(o(e,t),t.isLineDashedMaterial&&s(e,t)):t.isPointsMaterial?c(e,t,n,r):t.isSpriteMaterial?l(e,t):t.isShadowMaterial?(e.color.value.copy(t.color),e.opacity.value=t.opacity):t.isShaderMaterial&&(t.uniformsNeedUpdate=!1)}function a(e,r){e.opacity.value=r.opacity,r.color&&e.diffuse.value.copy(r.color),r.emissive&&e.emissive.value.copy(r.emissive).multiplyScalar(r.emissiveIntensity),r.map&&(e.map.value=r.map,n(r.map,e.mapTransform)),r.alphaMap&&(e.alphaMap.value=r.alphaMap,n(r.alphaMap,e.alphaMapTransform)),r.bumpMap&&(e.bumpMap.value=r.bumpMap,n(r.bumpMap,e.bumpMapTransform),e.bumpScale.value=r.bumpScale,r.side===1&&(e.bumpScale.value*=-1)),r.normalMap&&(e.normalMap.value=r.normalMap,n(r.normalMap,e.normalMapTransform),e.normalScale.value.copy(r.normalScale),r.side===1&&e.normalScale.value.negate()),r.displacementMap&&(e.displacementMap.value=r.displacementMap,n(r.displacementMap,e.displacementMapTransform),e.displacementScale.value=r.displacementScale,e.displacementBias.value=r.displacementBias),r.emissiveMap&&(e.emissiveMap.value=r.emissiveMap,n(r.emissiveMap,e.emissiveMapTransform)),r.specularMap&&(e.specularMap.value=r.specularMap,n(r.specularMap,e.specularMapTransform)),r.alphaTest>0&&(e.alphaTest.value=r.alphaTest);let i=t.get(r),a=i.envMap,o=i.envMapRotation;a&&(e.envMap.value=a,e.envMapRotation.value.setFromMatrix4(Uu.makeRotationFromEuler(o)).transpose(),a.isCubeTexture&&a.isRenderTargetTexture===!1&&e.envMapRotation.value.premultiply(Wu),e.reflectivity.value=r.reflectivity,e.ior.value=r.ior,e.refractionRatio.value=r.refractionRatio),r.lightMap&&(e.lightMap.value=r.lightMap,e.lightMapIntensity.value=r.lightMapIntensity,n(r.lightMap,e.lightMapTransform)),r.aoMap&&(e.aoMap.value=r.aoMap,e.aoMapIntensity.value=r.aoMapIntensity,n(r.aoMap,e.aoMapTransform))}function o(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform))}function s(e,t){e.dashSize.value=t.dashSize,e.totalSize.value=t.dashSize+t.gapSize,e.scale.value=t.scale}function c(e,t,r,i){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.size.value=t.size*r,e.scale.value=i*.5,t.map&&(e.map.value=t.map,n(t.map,e.uvTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function l(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.rotation.value=t.rotation,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function u(e,t){e.specular.value.copy(t.specular),e.shininess.value=Math.max(t.shininess,1e-4)}function d(e,t){t.gradientMap&&(e.gradientMap.value=t.gradientMap)}function f(e,t){e.metalness.value=t.metalness,t.metalnessMap&&(e.metalnessMap.value=t.metalnessMap,n(t.metalnessMap,e.metalnessMapTransform)),e.roughness.value=t.roughness,t.roughnessMap&&(e.roughnessMap.value=t.roughnessMap,n(t.roughnessMap,e.roughnessMapTransform)),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)}function p(e,t,r){e.ior.value=t.ior,t.sheen>0&&(e.sheenColor.value.copy(t.sheenColor).multiplyScalar(t.sheen),e.sheenRoughness.value=t.sheenRoughness,t.sheenColorMap&&(e.sheenColorMap.value=t.sheenColorMap,n(t.sheenColorMap,e.sheenColorMapTransform)),t.sheenRoughnessMap&&(e.sheenRoughnessMap.value=t.sheenRoughnessMap,n(t.sheenRoughnessMap,e.sheenRoughnessMapTransform))),t.clearcoat>0&&(e.clearcoat.value=t.clearcoat,e.clearcoatRoughness.value=t.clearcoatRoughness,t.clearcoatMap&&(e.clearcoatMap.value=t.clearcoatMap,n(t.clearcoatMap,e.clearcoatMapTransform)),t.clearcoatRoughnessMap&&(e.clearcoatRoughnessMap.value=t.clearcoatRoughnessMap,n(t.clearcoatRoughnessMap,e.clearcoatRoughnessMapTransform)),t.clearcoatNormalMap&&(e.clearcoatNormalMap.value=t.clearcoatNormalMap,n(t.clearcoatNormalMap,e.clearcoatNormalMapTransform),e.clearcoatNormalScale.value.copy(t.clearcoatNormalScale),t.side===1&&e.clearcoatNormalScale.value.negate())),t.dispersion>0&&(e.dispersion.value=t.dispersion),t.iridescence>0&&(e.iridescence.value=t.iridescence,e.iridescenceIOR.value=t.iridescenceIOR,e.iridescenceThicknessMinimum.value=t.iridescenceThicknessRange[0],e.iridescenceThicknessMaximum.value=t.iridescenceThicknessRange[1],t.iridescenceMap&&(e.iridescenceMap.value=t.iridescenceMap,n(t.iridescenceMap,e.iridescenceMapTransform)),t.iridescenceThicknessMap&&(e.iridescenceThicknessMap.value=t.iridescenceThicknessMap,n(t.iridescenceThicknessMap,e.iridescenceThicknessMapTransform))),t.transmission>0&&(e.transmission.value=t.transmission,e.transmissionSamplerMap.value=r.texture,e.transmissionSamplerSize.value.set(r.width,r.height),t.transmissionMap&&(e.transmissionMap.value=t.transmissionMap,n(t.transmissionMap,e.transmissionMapTransform)),e.thickness.value=t.thickness,t.thicknessMap&&(e.thicknessMap.value=t.thicknessMap,n(t.thicknessMap,e.thicknessMapTransform)),e.attenuationDistance.value=t.attenuationDistance,e.attenuationColor.value.copy(t.attenuationColor)),t.anisotropy>0&&(e.anisotropyVector.value.set(t.anisotropy*Math.cos(t.anisotropyRotation),t.anisotropy*Math.sin(t.anisotropyRotation)),t.anisotropyMap&&(e.anisotropyMap.value=t.anisotropyMap,n(t.anisotropyMap,e.anisotropyMapTransform))),e.specularIntensity.value=t.specularIntensity,e.specularColor.value.copy(t.specularColor),t.specularColorMap&&(e.specularColorMap.value=t.specularColorMap,n(t.specularColorMap,e.specularColorMapTransform)),t.specularIntensityMap&&(e.specularIntensityMap.value=t.specularIntensityMap,n(t.specularIntensityMap,e.specularIntensityMapTransform))}function m(e,t){t.matcap&&(e.matcap.value=t.matcap)}function h(e,n){let r=t.get(n).light;e.referencePosition.value.setFromMatrixPosition(r.matrixWorld),e.nearDistance.value=r.shadow.camera.near,e.farDistance.value=r.shadow.camera.far}return{refreshFogUniforms:r,refreshMaterialUniforms:i}}function Ku(e,t,n,r){let i={},a={},o=[],s=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function c(e,t){let n=t.program;r.uniformBlockBinding(e,n)}function l(e,n){let o=i[e.id];o===void 0&&(g(e),o=u(e),i[e.id]=o,e.addEventListener(`dispose`,v));let s=n.program;r.updateUBOMapping(e,s);let c=t.render.frame;a[e.id]!==c&&(f(e),a[e.id]=c)}function u(t){let n=d();t.__bindingPointIndex=n;let r=e.createBuffer(),i=t.__size,a=t.usage;return e.bindBuffer(e.UNIFORM_BUFFER,r),e.bufferData(e.UNIFORM_BUFFER,i,a),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,n,r),r}function d(){for(let e=0;e<s;e++)if(o.indexOf(e)===-1)return o.push(e),e;return z(`WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached.`),0}function f(t){let n=i[t.id],r=t.uniforms,a=t.__cache;e.bindBuffer(e.UNIFORM_BUFFER,n);for(let e=0,t=r.length;e<t;e++){let t=r[e];if(Array.isArray(t))for(let n=0,r=t.length;n<r;n++)p(t[n],e,n,a);else p(t,e,0,a)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function p(t,n,r,i){if(h(t,n,r,i)===!0){let n=t.__offset,r=t.value;if(Array.isArray(r)){let e=0;for(let n=0;n<r.length;n++){let i=r[n],a=_(i);m(i,t.__data,e),typeof i!=`number`&&typeof i!=`boolean`&&!i.isMatrix3&&!ArrayBuffer.isView(i)&&(e+=a.storage/Float32Array.BYTES_PER_ELEMENT)}}else m(r,t.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,n,t.__data)}}function m(e,t,n){typeof e==`number`||typeof e==`boolean`?t[0]=e:e.isMatrix3?(t[0]=e.elements[0],t[1]=e.elements[1],t[2]=e.elements[2],t[3]=0,t[4]=e.elements[3],t[5]=e.elements[4],t[6]=e.elements[5],t[7]=0,t[8]=e.elements[6],t[9]=e.elements[7],t[10]=e.elements[8],t[11]=0):ArrayBuffer.isView(e)?t.set(new e.constructor(e.buffer,e.byteOffset,t.length)):e.toArray(t,n)}function h(e,t,n,r){let i=e.value,a=t+`_`+n;if(r[a]===void 0)return typeof i==`number`||typeof i==`boolean`?r[a]=i:ArrayBuffer.isView(i)?r[a]=i.slice():r[a]=i.clone(),!0;{let e=r[a];if(typeof i==`number`||typeof i==`boolean`){if(e!==i)return r[a]=i,!0}else if(ArrayBuffer.isView(i))return!0;else if(e.equals(i)===!1)return e.copy(i),!0}return!1}function g(e){let t=e.uniforms,n=0;for(let e=0,r=t.length;e<r;e++){let r=Array.isArray(t[e])?t[e]:[t[e]];for(let e=0,t=r.length;e<t;e++){let t=r[e],i=Array.isArray(t.value)?t.value:[t.value];for(let e=0,r=i.length;e<r;e++){let r=i[e],a=_(r),o=n%16,s=o%a.boundary,c=o+s;n+=s,c!==0&&16-c<a.storage&&(n+=16-c),t.__data=new Float32Array(a.storage/Float32Array.BYTES_PER_ELEMENT),t.__offset=n,n+=a.storage}}}let r=n%16;return r>0&&(n+=16-r),e.__size=n,e.__cache={},this}function _(e){let t={boundary:0,storage:0};return typeof e==`number`||typeof e==`boolean`?(t.boundary=4,t.storage=4):e.isVector2?(t.boundary=8,t.storage=8):e.isVector3||e.isColor?(t.boundary=16,t.storage=12):e.isVector4?(t.boundary=16,t.storage=16):e.isMatrix3?(t.boundary=48,t.storage=48):e.isMatrix4?(t.boundary=64,t.storage=64):e.isTexture?R(`WebGLRenderer: Texture samplers can not be part of an uniforms group.`):ArrayBuffer.isView(e)?(t.boundary=16,t.storage=e.byteLength):R(`WebGLRenderer: Unsupported uniform value type.`,e),t}function v(t){let n=t.target;n.removeEventListener(`dispose`,v);let r=o.indexOf(n.__bindingPointIndex);o.splice(r,1),e.deleteBuffer(i[n.id]),delete i[n.id],delete a[n.id]}function y(){for(let t in i)e.deleteBuffer(i[t]);o=[],i={},a={}}return{bind:c,update:l,dispose:y}}var qu=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Ju=null;function Yu(){return Ju===null&&(Ju=new bi(qu,16,16,k,g),Ju.name=`DFG_LUT`,Ju.minFilter=o,Ju.magFilter=o,Ju.wrapS=t,Ju.wrapT=t,Ju.generateMipmaps=!1,Ju.needsUpdate=!0),Ju}var Xu=class{constructor(e={}){let{canvas:t=Ye(),context:n=null,depth:r=!0,stencil:i=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:s=!0,preserveDrawingBuffer:u=!1,powerPreference:d=`default`,failIfMajorPerformanceCaveat:p=!1,reversedDepthBuffer:h=!1,outputBufferType:b=l}=e;this.isWebGLRenderer=!0;let x;if(n!==null){if(typeof WebGLRenderingContext<`u`&&n instanceof WebGLRenderingContext)throw Error(`THREE.WebGLRenderer: WebGL 1 is not supported since r163.`);x=n.getContextAttributes().alpha}else x=a;let S=b,C=new Set([ee,A,O]),w=new Set([l,m,f,y,_,v]),T=new Uint32Array(4),E=new Int32Array(4),D=new H,k=null,j=null,M=[],te=[],ne=null;this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=0,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let N=this,re=!1,ie=null,ae=null,oe=null,se=null;this._outputColorSpace=Re;let ce=0,le=0,P=null,ue=-1,de=null,fe=new qt,pe=new qt,me=null,he=new W(0),ge=0,_e=t.width,ve=t.height,ye=1,be=null,xe=null,Se=new qt(0,0,_e,ve),Ce=new qt(0,0,_e,ve),we=!1,Te=new Li,Ee=!1,De=!1,Oe=new Qt,ke=new H,Ae=new qt,je={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Me=!1;function Ne(){return P===null?ye:1}let F=n;function Pe(e,n){return t.getContext(e,n)}try{let e={alpha:!0,depth:r,stencil:i,antialias:o,premultipliedAlpha:s,preserveDrawingBuffer:u,powerPreference:d,failIfMajorPerformanceCaveat:p};if(`setAttribute`in t&&t.setAttribute(`data-engine`,`three.js r185`),t.addEventListener(`webglcontextlost`,ct,!1),t.addEventListener(`webglcontextrestored`,lt,!1),t.addEventListener(`webglcontextcreationerror`,ut,!1),F===null){let t=`webgl2`;if(F=Pe(t,e),F===null)throw Pe(t)?Error(`THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.`):Error(`THREE.WebGLRenderer: Error creating WebGL context.`)}}catch(e){throw z(`WebGLRenderer: `+e.message),e}let Fe,Ie,I,Le,L,ze,Be,Ve,He,Ue,We,Ke,qe,Je,Xe,Qe,$e,tt,nt,rt,it,at,ot;function st(){Fe=new mc(F),Fe.init(),it=new Ru(F,Fe),Ie=new Ws(F,Fe,e,it),I=new Iu(F,Fe),Ie.reversedDepthBuffer&&h&&I.buffers.depth.setReversed(!0),ae=F.createFramebuffer(),oe=F.createFramebuffer(),se=F.createFramebuffer(),Le=new _c(F),L=new gu,ze=new Lu(F,Fe,I,L,Ie,it,Le),Be=new pc(N),Ve=new Is(F),at=new Hs(F,Ve),He=new hc(F,Ve,Le,at),Ue=new yc(F,He,Ve,at,Le),tt=new vc(F,Ie,ze),Xe=new Gs(L),We=new hu(N,Be,Fe,Ie,at,Xe),Ke=new Gu(N,L),qe=new bu,Je=new Du(Fe),$e=new Vs(N,Be,I,Ue,x,s),Qe=new Fu(N,Ue,Ie),ot=new Ku(F,Le,Ie,I),nt=new Us(F,Fe,Le),rt=new gc(F,Fe,Le),Le.programs=We.programs,N.capabilities=Ie,N.extensions=Fe,N.properties=L,N.renderLists=qe,N.shadowMap=Qe,N.state=I,N.info=Le}st(),S!==1009&&(ne=new xc(S,t.width,t.height,o,r,i));let B=new Hu(N,F);this.xr=B,this.getContext=function(){return F},this.getContextAttributes=function(){return F.getContextAttributes()},this.forceContextLoss=function(){let e=Fe.get(`WEBGL_lose_context`);e&&e.loseContext()},this.forceContextRestore=function(){let e=Fe.get(`WEBGL_lose_context`);e&&e.restoreContext()},this.getPixelRatio=function(){return ye},this.setPixelRatio=function(e){e!==void 0&&(ye=e,this.setSize(_e,ve,!1))},this.getSize=function(e){return e.set(_e,ve)},this.setSize=function(e,n,r=!0){if(B.isPresenting){R(`WebGLRenderer: Can't change size while VR device is presenting.`);return}_e=e,ve=n,t.width=Math.floor(e*ye),t.height=Math.floor(n*ye),r===!0&&(t.style.width=e+`px`,t.style.height=n+`px`),ne!==null&&ne.setSize(t.width,t.height),this.setViewport(0,0,e,n)},this.getDrawingBufferSize=function(e){return e.set(_e*ye,ve*ye).floor()},this.setDrawingBufferSize=function(e,n,r){_e=e,ve=n,ye=r,t.width=Math.floor(e*r),t.height=Math.floor(n*r),this.setViewport(0,0,e,n)},this.setEffects=function(e){if(S===1009){z(`WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.`);return}if(e){for(let t=0;t<e.length;t++)if(e[t].isOutputPass===!0){R(`WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.`);break}}ne.setEffects(e||[])},this.getCurrentViewport=function(e){return e.copy(fe)},this.getViewport=function(e){return e.copy(Se)},this.setViewport=function(e,t,n,r){e.isVector4?Se.set(e.x,e.y,e.z,e.w):Se.set(e,t,n,r),I.viewport(fe.copy(Se).multiplyScalar(ye).round())},this.getScissor=function(e){return e.copy(Ce)},this.setScissor=function(e,t,n,r){e.isVector4?Ce.set(e.x,e.y,e.z,e.w):Ce.set(e,t,n,r),I.scissor(pe.copy(Ce).multiplyScalar(ye).round())},this.getScissorTest=function(){return we},this.setScissorTest=function(e){I.setScissorTest(we=e)},this.setOpaqueSort=function(e){be=e},this.setTransparentSort=function(e){xe=e},this.getClearColor=function(e){return e.copy($e.getClearColor())},this.setClearColor=function(){$e.setClearColor(...arguments)},this.getClearAlpha=function(){return $e.getClearAlpha()},this.setClearAlpha=function(){$e.setClearAlpha(...arguments)},this.clear=function(e=!0,t=!0,n=!0){let r=0;if(e){let e=!1;if(P!==null){let t=P.texture.format;e=C.has(t)}if(e){let e=P.texture.type,t=w.has(e),n=$e.getClearColor(),r=$e.getClearAlpha(),i=n.r,a=n.g,o=n.b;t?(T[0]=i,T[1]=a,T[2]=o,T[3]=r,F.clearBufferuiv(F.COLOR,0,T)):(E[0]=i,E[1]=a,E[2]=o,E[3]=r,F.clearBufferiv(F.COLOR,0,E))}else r|=F.COLOR_BUFFER_BIT}t&&(r|=F.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),n&&(r|=F.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),r!==0&&F.clear(r)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(e){e.setRenderer(this),ie=e},this.dispose=function(){t.removeEventListener(`webglcontextlost`,ct,!1),t.removeEventListener(`webglcontextrestored`,lt,!1),t.removeEventListener(`webglcontextcreationerror`,ut,!1),$e.dispose(),qe.dispose(),Je.dispose(),L.dispose(),Be.dispose(),Ue.dispose(),at.dispose(),ot.dispose(),We.dispose(),B.dispose(),B.removeEventListener(`sessionstart`,_t),B.removeEventListener(`sessionend`,vt),yt.stop()};function ct(e){e.preventDefault(),Ze(`WebGLRenderer: Context Lost.`),re=!0}function lt(){Ze(`WebGLRenderer: Context Restored.`),re=!1;let e=Le.autoReset,t=Qe.enabled,n=Qe.autoUpdate,r=Qe.needsUpdate,i=Qe.type;st(),Le.autoReset=e,Qe.enabled=t,Qe.autoUpdate=n,Qe.needsUpdate=r,Qe.type=i}function ut(e){z(`WebGLRenderer: A WebGL context could not be created. Reason: `,e.statusMessage)}function dt(e){let t=e.target;t.removeEventListener(`dispose`,dt),ft(t)}function ft(e){pt(e),L.remove(e)}function pt(e){let t=L.get(e).programs;t!==void 0&&(t.forEach(function(e){We.releaseProgram(e)}),e.isShaderMaterial&&We.releaseShaderCache(e))}this.renderBufferDirect=function(e,t,n,r,i,a){t===null&&(t=je);let o=i.isMesh&&i.matrixWorld.determinantAffine()<0,s=V(e,t,n,r,i);I.setMaterial(r,o);let c=n.index,l=1;if(r.wireframe===!0){if(c=He.getWireframeAttribute(n),c===void 0)return;l=2}let u=n.drawRange,d=n.attributes.position,f=u.start*l,p=(u.start+u.count)*l;a!==null&&(f=Math.max(f,a.start*l),p=Math.min(p,(a.start+a.count)*l)),c===null?d!=null&&(f=Math.max(f,0),p=Math.min(p,d.count)):(f=Math.max(f,0),p=Math.min(p,c.count));let m=p-f;if(m<0||m===1/0)return;at.setup(i,r,s,n,c);let h,g=nt;if(c!==null&&(h=Ve.get(c),g=rt,g.setIndex(h)),i.isMesh)r.wireframe===!0?(I.setLineWidth(r.wireframeLinewidth*Ne()),g.setMode(F.LINES)):g.setMode(F.TRIANGLES);else if(i.isLine){let e=r.linewidth;e===void 0&&(e=1),I.setLineWidth(e*Ne()),i.isLineSegments?g.setMode(F.LINES):i.isLineLoop?g.setMode(F.LINE_LOOP):g.setMode(F.LINE_STRIP)}else i.isPoints?g.setMode(F.POINTS):i.isSprite&&g.setMode(F.TRIANGLES);if(i.isBatchedMesh)if(Fe.get(`WEBGL_multi_draw`))g.renderMultiDraw(i._multiDrawStarts,i._multiDrawCounts,i._multiDrawCount);else{let e=i._multiDrawStarts,t=i._multiDrawCounts,n=i._multiDrawCount,a=c?Ve.get(c).bytesPerElement:1,o=L.get(r).currentProgram.getUniforms();for(let r=0;r<n;r++)o.setValue(F,`_gl_DrawID`,r),g.render(e[r]/a,t[r])}else if(i.isInstancedMesh)g.renderInstances(f,m,i.count);else if(n.isInstancedBufferGeometry){let e=n._maxInstanceCount===void 0?1/0:n._maxInstanceCount,t=Math.min(n.instanceCount,e);g.renderInstances(f,m,t)}else g.render(f,m)};function mt(e,t,n){e.transparent===!0&&e.side===2&&e.forceSinglePass===!1?(e.side=1,e.needsUpdate=!0,Tt(e,t,n),e.side=0,e.needsUpdate=!0,Tt(e,t,n),e.side=2):Tt(e,t,n)}this.compile=function(e,t,n=null){n===null&&(n=e),j=Je.get(n),j.init(t),te.push(j),n.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(j.pushLight(e),e.castShadow&&j.pushShadow(e))}),e!==n&&e.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(j.pushLight(e),e.castShadow&&j.pushShadow(e))}),j.setupLights();let r=new Set;return e.traverse(function(e){if(!(e.isMesh||e.isPoints||e.isLine||e.isSprite))return;let t=e.material;if(t)if(Array.isArray(t))for(let i=0;i<t.length;i++){let a=t[i];mt(a,n,e),r.add(a)}else mt(t,n,e),r.add(t)}),j=te.pop(),r},this.compileAsync=function(e,t,n=null){let r=this.compile(e,t,n);return new Promise(t=>{function n(){if(r.forEach(function(e){L.get(e).currentProgram.isReady()&&r.delete(e)}),r.size===0){t(e);return}setTimeout(n,10)}Fe.get(`KHR_parallel_shader_compile`)===null?setTimeout(n,10):n()})};let ht=null;function gt(e){ht&&ht(e)}function _t(){yt.stop()}function vt(){yt.start()}let yt=new Fs;yt.setAnimationLoop(gt),typeof self<`u`&&yt.setContext(self),this.setAnimationLoop=function(e){ht=e,B.setAnimationLoop(e),e===null?yt.stop():yt.start()},B.addEventListener(`sessionstart`,_t),B.addEventListener(`sessionend`,vt),this.render=function(e,t){if(t!==void 0&&t.isCamera!==!0){z(`WebGLRenderer.render: camera is not an instance of THREE.Camera.`);return}if(re===!0)return;ie!==null&&ie.renderStart(e,t);let n=B.enabled===!0&&B.isPresenting===!0,r=ne!==null&&(P===null||n)&&ne.begin(N,P);if(e.matrixWorldAutoUpdate===!0&&e.updateMatrixWorld(),t.parent===null&&t.matrixWorldAutoUpdate===!0&&t.updateMatrixWorld(),B.enabled===!0&&B.isPresenting===!0&&(ne===null||ne.isCompositing()===!1)&&(B.cameraAutoUpdate===!0&&B.updateCamera(t),t=B.getCamera()),e.isScene===!0&&e.onBeforeRender(N,e,t,P),j=Je.get(e,te.length),j.init(t),j.state.textureUnits=ze.getTextureUnits(),te.push(j),Oe.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),Te.setFromProjectionMatrix(Oe,Ge,t.reversedDepth),De=this.localClippingEnabled,Ee=Xe.init(this.clippingPlanes,De),k=qe.get(e,M.length),k.init(),M.push(k),B.enabled===!0&&B.isPresenting===!0){let e=N.xr.getDepthSensingMesh();e!==null&&bt(e,t,-1/0,N.sortObjects)}bt(e,t,0,N.sortObjects),k.finish(),N.sortObjects===!0&&k.sort(be,xe,t.reversedDepth),Me=B.enabled===!1||B.isPresenting===!1||B.hasDepthSensing()===!1,Me&&$e.addToRenderList(k,e),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),Ee===!0&&Xe.beginShadows();let i=j.state.shadowsArray;if(Qe.render(i,e,t),Ee===!0&&Xe.endShadows(),(r&&ne.hasRenderPass())===!1){let n=k.opaque,r=k.transmissive;if(j.setupLights(),t.isArrayCamera){let i=t.cameras;if(r.length>0)for(let t=0,a=i.length;t<a;t++){let a=i[t];St(n,r,e,a)}Me&&$e.render(e);for(let t=0,n=i.length;t<n;t++){let n=i[t];xt(k,e,n,n.viewport)}}else r.length>0&&St(n,r,e,t),Me&&$e.render(e),xt(k,e,t)}P!==null&&le===0&&(ze.updateMultisampleRenderTarget(P),ze.updateRenderTargetMipmap(P)),r&&ne.end(N),e.isScene===!0&&e.onAfterRender(N,e,t),at.resetDefaultState(),ue=-1,de=null,te.pop(),te.length>0?(j=te[te.length-1],ze.setTextureUnits(j.state.textureUnits),Ee===!0&&Xe.setGlobalState(N.clippingPlanes,j.state.camera)):j=null,M.pop(),k=M.length>0?M[M.length-1]:null,ie!==null&&ie.renderEnd()};function bt(e,t,n,r){if(e.visible===!1)return;if(e.layers.test(t.layers)){if(e.isGroup)n=e.renderOrder;else if(e.isLOD)e.autoUpdate===!0&&e.update(t);else if(e.isLightProbeGrid)j.pushLightProbeGrid(e);else if(e.isLight)j.pushLight(e),e.castShadow&&j.pushShadow(e);else if(e.isSprite){if(!e.frustumCulled||Te.intersectsSprite(e)){r&&Ae.setFromMatrixPosition(e.matrixWorld).applyMatrix4(Oe);let t=Ue.update(e),i=e.material;i.visible&&k.push(e,t,i,n,Ae.z,null)}}else if((e.isMesh||e.isLine||e.isPoints)&&(!e.frustumCulled||Te.intersectsObject(e))){let t=Ue.update(e),i=e.material;if(r&&(e.boundingSphere===void 0?(t.boundingSphere===null&&t.computeBoundingSphere(),Ae.copy(t.boundingSphere.center)):(e.boundingSphere===null&&e.computeBoundingSphere(),Ae.copy(e.boundingSphere.center)),Ae.applyMatrix4(e.matrixWorld).applyMatrix4(Oe)),Array.isArray(i)){let r=t.groups;for(let a=0,o=r.length;a<o;a++){let o=r[a],s=i[o.materialIndex];s&&s.visible&&k.push(e,t,s,n,Ae.z,o)}}else i.visible&&k.push(e,t,i,n,Ae.z,null)}}let i=e.children;for(let e=0,a=i.length;e<a;e++)bt(i[e],t,n,r)}function xt(e,t,n,r){let{opaque:i,transmissive:a,transparent:o}=e;j.setupLightsView(n),Ee===!0&&Xe.setGlobalState(N.clippingPlanes,n),r&&I.viewport(fe.copy(r)),i.length>0&&Ct(i,t,n),a.length>0&&Ct(a,t,n),o.length>0&&Ct(o,t,n),I.buffers.depth.setTest(!0),I.buffers.depth.setMask(!0),I.buffers.color.setMask(!0),I.setPolygonOffset(!1)}function St(e,t,n,r){if((n.isScene===!0?n.overrideMaterial:null)!==null)return;if(j.state.transmissionRenderTarget[r.id]===void 0){let e=Fe.has(`EXT_color_buffer_half_float`)||Fe.has(`EXT_color_buffer_float`);j.state.transmissionRenderTarget[r.id]=new Yt(1,1,{generateMipmaps:!0,type:e?g:l,minFilter:c,samples:Math.max(4,Ie.samples),stencilBuffer:i,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:It.workingColorSpace})}let a=j.state.transmissionRenderTarget[r.id],o=r.viewport||fe;a.setSize(o.z*N.transmissionResolutionScale,o.w*N.transmissionResolutionScale);let s=N.getRenderTarget(),u=N.getActiveCubeFace(),d=N.getActiveMipmapLevel();N.setRenderTarget(a),N.getClearColor(he),ge=N.getClearAlpha(),ge<1&&N.setClearColor(16777215,.5),N.clear(),Me&&$e.render(n);let f=N.toneMapping;N.toneMapping=0;let p=r.viewport;if(r.viewport!==void 0&&(r.viewport=void 0),j.setupLightsView(r),Ee===!0&&Xe.setGlobalState(N.clippingPlanes,r),Ct(e,n,r),ze.updateMultisampleRenderTarget(a),ze.updateRenderTargetMipmap(a),Fe.has(`WEBGL_multisampled_render_to_texture`)===!1){let e=!1;for(let i=0,a=t.length;i<a;i++){let{object:a,geometry:o,material:s,group:c}=t[i];if(s.side===2&&a.layers.test(r.layers)){let t=s.side;s.side=1,s.needsUpdate=!0,wt(a,n,r,o,s,c),s.side=t,s.needsUpdate=!0,e=!0}}e===!0&&(ze.updateMultisampleRenderTarget(a),ze.updateRenderTargetMipmap(a))}N.setRenderTarget(s,u,d),N.setClearColor(he,ge),p!==void 0&&(r.viewport=p),N.toneMapping=f}function Ct(e,t,n){let r=t.isScene===!0?t.overrideMaterial:null;for(let i=0,a=e.length;i<a;i++){let a=e[i],{object:o,geometry:s,group:c}=a,l=a.material;l.allowOverride===!0&&r!==null&&(l=r),o.layers.test(n.layers)&&wt(o,t,n,s,l,c)}}function wt(e,t,n,r,i,a){e.onBeforeRender(N,t,n,r,i,a),e.modelViewMatrix.multiplyMatrices(n.matrixWorldInverse,e.matrixWorld),e.normalMatrix.getNormalMatrix(e.modelViewMatrix),i.onBeforeRender(N,t,n,r,e,a),i.transparent===!0&&i.side===2&&i.forceSinglePass===!1?(i.side=1,i.needsUpdate=!0,N.renderBufferDirect(n,t,r,i,e,a),i.side=0,i.needsUpdate=!0,N.renderBufferDirect(n,t,r,i,e,a),i.side=2):N.renderBufferDirect(n,t,r,i,e,a),e.onAfterRender(N,t,n,r,i,a)}function Tt(e,t,n){t.isScene!==!0&&(t=je);let r=L.get(e),i=j.state.lights,a=j.state.shadowsArray,o=i.state.version,s=We.getParameters(e,i.state,a,t,n,j.state.lightProbeGridArray),c=We.getProgramCacheKey(s),l=r.programs;r.environment=e.isMeshStandardMaterial||e.isMeshLambertMaterial||e.isMeshPhongMaterial?t.environment:null,r.fog=t.fog;let u=e.isMeshStandardMaterial||e.isMeshLambertMaterial&&!e.envMap||e.isMeshPhongMaterial&&!e.envMap;r.envMap=Be.get(e.envMap||r.environment,u),r.envMapRotation=r.environment!==null&&e.envMap===null?t.environmentRotation:e.envMapRotation,l===void 0&&(e.addEventListener(`dispose`,dt),l=new Map,r.programs=l);let d=l.get(c);if(d!==void 0){if(r.currentProgram===d&&r.lightsStateVersion===o)return Dt(e,s),d}else s.uniforms=We.getUniforms(e),ie!==null&&e.isNodeMaterial&&ie.build(e,n,s),e.onBeforeCompile(s,N),d=We.acquireProgram(s,c),l.set(c,d),r.uniforms=s.uniforms;let f=r.uniforms;return(!e.isShaderMaterial&&!e.isRawShaderMaterial||e.clipping===!0)&&(f.clippingPlanes=Xe.uniform),Dt(e,s),r.needsLights=At(e),r.lightsStateVersion=o,r.needsLights&&(f.ambientLightColor.value=i.state.ambient,f.lightProbe.value=i.state.probe,f.directionalLights.value=i.state.directional,f.directionalLightShadows.value=i.state.directionalShadow,f.spotLights.value=i.state.spot,f.spotLightShadows.value=i.state.spotShadow,f.rectAreaLights.value=i.state.rectArea,f.ltc_1.value=i.state.rectAreaLTC1,f.ltc_2.value=i.state.rectAreaLTC2,f.pointLights.value=i.state.point,f.pointLightShadows.value=i.state.pointShadow,f.hemisphereLights.value=i.state.hemi,f.directionalShadowMatrix.value=i.state.directionalShadowMatrix,f.spotLightMatrix.value=i.state.spotLightMatrix,f.spotLightMap.value=i.state.spotLightMap,f.pointShadowMatrix.value=i.state.pointShadowMatrix),r.lightProbeGrid=j.state.lightProbeGridArray.length>0,r.currentProgram=d,r.uniformsList=null,d}function Et(e){if(e.uniformsList===null){let t=e.currentProgram.getUniforms();e.uniformsList=Ol.seqWithValue(t.seq,e.uniforms)}return e.uniformsList}function Dt(e,t){let n=L.get(e);n.outputColorSpace=t.outputColorSpace,n.batching=t.batching,n.batchingColor=t.batchingColor,n.instancing=t.instancing,n.instancingColor=t.instancingColor,n.instancingMorph=t.instancingMorph,n.skinning=t.skinning,n.morphTargets=t.morphTargets,n.morphNormals=t.morphNormals,n.morphColors=t.morphColors,n.morphTargetsCount=t.morphTargetsCount,n.numClippingPlanes=t.numClippingPlanes,n.numIntersection=t.numClipIntersection,n.vertexAlphas=t.vertexAlphas,n.vertexTangents=t.vertexTangents,n.toneMapping=t.toneMapping}function Ot(e,t){if(e.length===0)return null;if(e.length===1)return e[0].texture===null?null:e[0];D.setFromMatrixPosition(t.matrixWorld);for(let t=0,n=e.length;t<n;t++){let n=e[t];if(n.texture!==null&&n.boundingBox.containsPoint(D))return n}return null}function V(e,t,n,r,i){t.isScene!==!0&&(t=je),ze.resetTextureUnits();let a=t.fog,o=r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial?t.environment:null,s=P===null?N.outputColorSpace:P.isXRRenderTarget===!0?P.texture.colorSpace:It.workingColorSpace,c=r.isMeshStandardMaterial||r.isMeshLambertMaterial&&!r.envMap||r.isMeshPhongMaterial&&!r.envMap,l=Be.get(r.envMap||o,c),u=r.vertexColors===!0&&!!n.attributes.color&&n.attributes.color.itemSize===4,d=!!n.attributes.tangent&&(!!r.normalMap||r.anisotropy>0),f=!!n.morphAttributes.position,p=!!n.morphAttributes.normal,m=!!n.morphAttributes.color,h=0;r.toneMapped&&(P===null||P.isXRRenderTarget===!0)&&(h=N.toneMapping);let g=n.morphAttributes.position||n.morphAttributes.normal||n.morphAttributes.color,_=g===void 0?0:g.length,v=L.get(r),y=j.state.lights;if(Ee===!0&&(De===!0||e!==de)){let t=e===de&&r.id===ue;Xe.setState(r,e,t)}let b=!1;r.version===v.__version?v.needsLights&&v.lightsStateVersion!==y.state.version?b=!0:v.outputColorSpace===s?i.isBatchedMesh&&v.batching===!1||!i.isBatchedMesh&&v.batching===!0||i.isBatchedMesh&&v.batchingColor===!0&&i.colorTexture===null||i.isBatchedMesh&&v.batchingColor===!1&&i.colorTexture!==null||i.isInstancedMesh&&v.instancing===!1||!i.isInstancedMesh&&v.instancing===!0||i.isSkinnedMesh&&v.skinning===!1||!i.isSkinnedMesh&&v.skinning===!0||i.isInstancedMesh&&v.instancingColor===!0&&i.instanceColor===null||i.isInstancedMesh&&v.instancingColor===!1&&i.instanceColor!==null||i.isInstancedMesh&&v.instancingMorph===!0&&i.morphTexture===null||i.isInstancedMesh&&v.instancingMorph===!1&&i.morphTexture!==null?b=!0:v.envMap===l?r.fog===!0&&v.fog!==a||v.numClippingPlanes!==void 0&&(v.numClippingPlanes!==Xe.numPlanes||v.numIntersection!==Xe.numIntersection)?b=!0:v.vertexAlphas===u&&v.vertexTangents===d&&v.morphTargets===f&&v.morphNormals===p&&v.morphColors===m&&v.toneMapping===h&&v.morphTargetsCount===_?!!v.lightProbeGrid!=j.state.lightProbeGridArray.length>0&&(b=!0):b=!0:b=!0:b=!0:(b=!0,v.__version=r.version);let x=v.currentProgram;b===!0&&(x=Tt(r,t,i),ie&&r.isNodeMaterial&&ie.onUpdateProgram(r,x,v));let S=!1,C=!1,w=!1,T=x.getUniforms(),E=v.uniforms;if(I.useProgram(x.program)&&(S=!0,C=!0,w=!0),r.id!==ue&&(ue=r.id,C=!0),v.needsLights){let e=Ot(j.state.lightProbeGridArray,i);v.lightProbeGrid!==e&&(v.lightProbeGrid=e,C=!0)}if(S||de!==e){I.buffers.depth.getReversed()&&e.reversedDepth!==!0&&(e._reversedDepth=!0,e.updateProjectionMatrix()),T.setValue(F,`projectionMatrix`,e.projectionMatrix),T.setValue(F,`viewMatrix`,e.matrixWorldInverse);let t=T.map.cameraPosition;t!==void 0&&t.setValue(F,ke.setFromMatrixPosition(e.matrixWorld)),Ie.logarithmicDepthBuffer&&T.setValue(F,`logDepthBufFC`,2/(Math.log(e.far+1)/Math.LN2)),(r.isMeshPhongMaterial||r.isMeshToonMaterial||r.isMeshLambertMaterial||r.isMeshBasicMaterial||r.isMeshStandardMaterial||r.isShaderMaterial)&&T.setValue(F,`isOrthographic`,e.isOrthographicCamera===!0),de!==e&&(de=e,C=!0,w=!0)}if(v.needsLights&&(y.state.directionalShadowMap.length>0&&T.setValue(F,`directionalShadowMap`,y.state.directionalShadowMap,ze),y.state.spotShadowMap.length>0&&T.setValue(F,`spotShadowMap`,y.state.spotShadowMap,ze),y.state.pointShadowMap.length>0&&T.setValue(F,`pointShadowMap`,y.state.pointShadowMap,ze)),i.isSkinnedMesh){T.setOptional(F,i,`bindMatrix`),T.setOptional(F,i,`bindMatrixInverse`);let e=i.skeleton;e&&(e.boneTexture===null&&e.computeBoneTexture(),T.setValue(F,`boneTexture`,e.boneTexture,ze))}i.isBatchedMesh&&(T.setOptional(F,i,`batchingTexture`),T.setValue(F,`batchingTexture`,i._matricesTexture,ze),T.setOptional(F,i,`batchingIdTexture`),T.setValue(F,`batchingIdTexture`,i._indirectTexture,ze),T.setOptional(F,i,`batchingColorTexture`),i._colorsTexture!==null&&T.setValue(F,`batchingColorTexture`,i._colorsTexture,ze));let D=n.morphAttributes;if((D.position!==void 0||D.normal!==void 0||D.color!==void 0)&&tt.update(i,n,x),(C||v.receiveShadow!==i.receiveShadow)&&(v.receiveShadow=i.receiveShadow,T.setValue(F,`receiveShadow`,i.receiveShadow)),(r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial)&&r.envMap===null&&t.environment!==null&&(E.envMapIntensity.value=t.environmentIntensity),E.dfgLUT!==void 0&&(E.dfgLUT.value=Yu()),C){if(T.setValue(F,`toneMappingExposure`,N.toneMappingExposure),v.needsLights&&kt(E,w),a&&r.fog===!0&&Ke.refreshFogUniforms(E,a),Ke.refreshMaterialUniforms(E,r,ye,ve,j.state.transmissionRenderTarget[e.id]),v.needsLights&&v.lightProbeGrid){let e=v.lightProbeGrid;E.probesSH.value=e.texture,E.probesMin.value.copy(e.boundingBox.min),E.probesMax.value.copy(e.boundingBox.max),E.probesResolution.value.copy(e.resolution)}Ol.upload(F,Et(v),E,ze)}if(r.isShaderMaterial&&r.uniformsNeedUpdate===!0&&(Ol.upload(F,Et(v),E,ze),r.uniformsNeedUpdate=!1),r.isSpriteMaterial&&T.setValue(F,`center`,i.center),T.setValue(F,`modelViewMatrix`,i.modelViewMatrix),T.setValue(F,`normalMatrix`,i.normalMatrix),T.setValue(F,`modelMatrix`,i.matrixWorld),r.uniformsGroups!==void 0){let e=r.uniformsGroups;for(let t=0,n=e.length;t<n;t++){let n=e[t];ot.update(n,x),ot.bind(n,x)}}return x}function kt(e,t){e.ambientLightColor.needsUpdate=t,e.lightProbe.needsUpdate=t,e.directionalLights.needsUpdate=t,e.directionalLightShadows.needsUpdate=t,e.pointLights.needsUpdate=t,e.pointLightShadows.needsUpdate=t,e.spotLights.needsUpdate=t,e.spotLightShadows.needsUpdate=t,e.rectAreaLights.needsUpdate=t,e.hemisphereLights.needsUpdate=t}function At(e){return e.isMeshLambertMaterial||e.isMeshToonMaterial||e.isMeshPhongMaterial||e.isMeshStandardMaterial||e.isShadowMaterial||e.isShaderMaterial&&e.lights===!0}this.getActiveCubeFace=function(){return ce},this.getActiveMipmapLevel=function(){return le},this.getRenderTarget=function(){return P},this.setRenderTargetTextures=function(e,t,n){let r=L.get(e);r.__autoAllocateDepthBuffer=e.resolveDepthBuffer===!1,r.__autoAllocateDepthBuffer===!1&&(r.__useRenderToTexture=!1),L.get(e.texture).__webglTexture=t,L.get(e.depthTexture).__webglTexture=r.__autoAllocateDepthBuffer?void 0:n,r.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(e,t){let n=L.get(e);n.__webglFramebuffer=t,n.__useDefaultFramebuffer=t===void 0},this.setRenderTarget=function(e,t=0,n=0){P=e,ce=t,le=n;let r=null,i=!1,a=!1;if(e){let o=L.get(e);if(o.__useDefaultFramebuffer!==void 0){I.bindFramebuffer(F.FRAMEBUFFER,o.__webglFramebuffer),fe.copy(e.viewport),pe.copy(e.scissor),me=e.scissorTest,I.viewport(fe),I.scissor(pe),I.setScissorTest(me),ue=-1;return}else if(o.__webglFramebuffer===void 0)ze.setupRenderTarget(e);else if(o.__hasExternalTextures)ze.rebindTextures(e,L.get(e.texture).__webglTexture,L.get(e.depthTexture).__webglTexture);else if(e.depthBuffer){let t=e.depthTexture;if(o.__boundDepthTexture!==t){if(t!==null&&L.has(t)&&(e.width!==t.image.width||e.height!==t.image.height))throw Error(`THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.`);ze.setupDepthRenderbuffer(e)}}let s=e.texture;(s.isData3DTexture||s.isDataArrayTexture||s.isCompressedArrayTexture)&&(a=!0);let c=L.get(e).__webglFramebuffer;e.isWebGLCubeRenderTarget?(r=Array.isArray(c[t])?c[t][n]:c[t],i=!0):r=e.samples>0&&ze.useMultisampledRTT(e)===!1?L.get(e).__webglMultisampledFramebuffer:Array.isArray(c)?c[n]:c,fe.copy(e.viewport),pe.copy(e.scissor),me=e.scissorTest}else fe.copy(Se).multiplyScalar(ye).floor(),pe.copy(Ce).multiplyScalar(ye).floor(),me=we;if(n!==0&&(r=ae),I.bindFramebuffer(F.FRAMEBUFFER,r)&&I.drawBuffers(e,r),I.viewport(fe),I.scissor(pe),I.setScissorTest(me),i){let r=L.get(e.texture);F.framebufferTexture2D(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_CUBE_MAP_POSITIVE_X+t,r.__webglTexture,n)}else if(a){let r=t;for(let t=0;t<e.textures.length;t++){let i=L.get(e.textures[t]);F.framebufferTextureLayer(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0+t,i.__webglTexture,n,r)}}else if(e!==null&&n!==0){let t=L.get(e.texture);F.framebufferTexture2D(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_2D,t.__webglTexture,n)}ue=-1},this.readRenderTargetPixels=function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget)){z(`WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);return}let c=L.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o]),c){I.bindFramebuffer(F.FRAMEBUFFER,c);try{let o=e.textures[s],c=o.format,l=o.type;if(e.textures.length>1&&F.readBuffer(F.COLOR_ATTACHMENT0+s),!Ie.textureFormatReadable(c)){z(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.`);return}if(!Ie.textureTypeReadable(l)){z(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.`);return}t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i&&F.readPixels(t,n,r,i,it.convert(c),it.convert(l),a)}finally{let e=P===null?null:L.get(P).__webglFramebuffer;I.bindFramebuffer(F.FRAMEBUFFER,e)}}},this.readRenderTargetPixelsAsync=async function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget))throw Error(`THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);let c=L.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o]),c)if(t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i){I.bindFramebuffer(F.FRAMEBUFFER,c);let o=e.textures[s],l=o.format,u=o.type;if(e.textures.length>1&&F.readBuffer(F.COLOR_ATTACHMENT0+s),!Ie.textureFormatReadable(l))throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.`);if(!Ie.textureTypeReadable(u))throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.`);let d=F.createBuffer();F.bindBuffer(F.PIXEL_PACK_BUFFER,d),F.bufferData(F.PIXEL_PACK_BUFFER,a.byteLength,F.STREAM_READ),F.readPixels(t,n,r,i,it.convert(l),it.convert(u),0);let f=P===null?null:L.get(P).__webglFramebuffer;I.bindFramebuffer(F.FRAMEBUFFER,f);let p=F.fenceSync(F.SYNC_GPU_COMMANDS_COMPLETE,0);return F.flush(),await et(F,p,4),F.bindBuffer(F.PIXEL_PACK_BUFFER,d),F.getBufferSubData(F.PIXEL_PACK_BUFFER,0,a),F.deleteBuffer(d),F.deleteSync(p),a}else throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.`)},this.copyFramebufferToTexture=function(e,t=null,n=0){let r=2**-n,i=Math.floor(e.image.width*r),a=Math.floor(e.image.height*r),o=t===null?0:t.x,s=t===null?0:t.y;ze.setTexture2D(e,0),F.copyTexSubImage2D(F.TEXTURE_2D,n,0,0,o,s,i,a),I.unbindTexture()},this.copyTextureToTexture=function(e,t,n=null,r=null,i=0,a=0){let o,s,c,l,u,d,f,p,m,h=e.isCompressedTexture?e.mipmaps[a]:e.image;if(n!==null)o=n.max.x-n.min.x,s=n.max.y-n.min.y,c=n.isBox3?n.max.z-n.min.z:1,l=n.min.x,u=n.min.y,d=n.isBox3?n.min.z:0;else{let t=2**-i;o=Math.floor(h.width*t),s=Math.floor(h.height*t),c=e.isDataArrayTexture?h.depth:e.isData3DTexture?Math.floor(h.depth*t):1,l=0,u=0,d=0}r===null?(f=0,p=0,m=0):(f=r.x,p=r.y,m=r.z);let g=it.convert(t.format),_=it.convert(t.type),v;t.isData3DTexture?(ze.setTexture3D(t,0),v=F.TEXTURE_3D):t.isDataArrayTexture||t.isCompressedArrayTexture?(ze.setTexture2DArray(t,0),v=F.TEXTURE_2D_ARRAY):(ze.setTexture2D(t,0),v=F.TEXTURE_2D),I.activeTexture(F.TEXTURE0),I.pixelStorei(F.UNPACK_FLIP_Y_WEBGL,t.flipY),I.pixelStorei(F.UNPACK_PREMULTIPLY_ALPHA_WEBGL,t.premultiplyAlpha),I.pixelStorei(F.UNPACK_ALIGNMENT,t.unpackAlignment);let y=I.getParameter(F.UNPACK_ROW_LENGTH),b=I.getParameter(F.UNPACK_IMAGE_HEIGHT),x=I.getParameter(F.UNPACK_SKIP_PIXELS),S=I.getParameter(F.UNPACK_SKIP_ROWS),C=I.getParameter(F.UNPACK_SKIP_IMAGES);I.pixelStorei(F.UNPACK_ROW_LENGTH,h.width),I.pixelStorei(F.UNPACK_IMAGE_HEIGHT,h.height),I.pixelStorei(F.UNPACK_SKIP_PIXELS,l),I.pixelStorei(F.UNPACK_SKIP_ROWS,u),I.pixelStorei(F.UNPACK_SKIP_IMAGES,d);let w=e.isDataArrayTexture||e.isData3DTexture,T=t.isDataArrayTexture||t.isData3DTexture;if(e.isDepthTexture){let n=L.get(e),r=L.get(t),h=L.get(n.__renderTarget),g=L.get(r.__renderTarget);I.bindFramebuffer(F.READ_FRAMEBUFFER,h.__webglFramebuffer),I.bindFramebuffer(F.DRAW_FRAMEBUFFER,g.__webglFramebuffer);for(let n=0;n<c;n++)w&&(F.framebufferTextureLayer(F.READ_FRAMEBUFFER,F.COLOR_ATTACHMENT0,L.get(e).__webglTexture,i,d+n),F.framebufferTextureLayer(F.DRAW_FRAMEBUFFER,F.COLOR_ATTACHMENT0,L.get(t).__webglTexture,a,m+n)),F.blitFramebuffer(l,u,o,s,f,p,o,s,F.DEPTH_BUFFER_BIT,F.NEAREST);I.bindFramebuffer(F.READ_FRAMEBUFFER,null),I.bindFramebuffer(F.DRAW_FRAMEBUFFER,null)}else if(i!==0||e.isRenderTargetTexture||L.has(e)){let n=L.get(e),r=L.get(t);I.bindFramebuffer(F.READ_FRAMEBUFFER,oe),I.bindFramebuffer(F.DRAW_FRAMEBUFFER,se);for(let e=0;e<c;e++)w?F.framebufferTextureLayer(F.READ_FRAMEBUFFER,F.COLOR_ATTACHMENT0,n.__webglTexture,i,d+e):F.framebufferTexture2D(F.READ_FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_2D,n.__webglTexture,i),T?F.framebufferTextureLayer(F.DRAW_FRAMEBUFFER,F.COLOR_ATTACHMENT0,r.__webglTexture,a,m+e):F.framebufferTexture2D(F.DRAW_FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_2D,r.__webglTexture,a),i===0?T?F.copyTexSubImage3D(v,a,f,p,m+e,l,u,o,s):F.copyTexSubImage2D(v,a,f,p,l,u,o,s):F.blitFramebuffer(l,u,o,s,f,p,o,s,F.COLOR_BUFFER_BIT,F.NEAREST);I.bindFramebuffer(F.READ_FRAMEBUFFER,null),I.bindFramebuffer(F.DRAW_FRAMEBUFFER,null)}else T?e.isDataTexture||e.isData3DTexture?F.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h.data):t.isCompressedArrayTexture?F.compressedTexSubImage3D(v,a,f,p,m,o,s,c,g,h.data):F.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h):e.isDataTexture?F.texSubImage2D(F.TEXTURE_2D,a,f,p,o,s,g,_,h.data):e.isCompressedTexture?F.compressedTexSubImage2D(F.TEXTURE_2D,a,f,p,h.width,h.height,g,h.data):F.texSubImage2D(F.TEXTURE_2D,a,f,p,o,s,g,_,h);I.pixelStorei(F.UNPACK_ROW_LENGTH,y),I.pixelStorei(F.UNPACK_IMAGE_HEIGHT,b),I.pixelStorei(F.UNPACK_SKIP_PIXELS,x),I.pixelStorei(F.UNPACK_SKIP_ROWS,S),I.pixelStorei(F.UNPACK_SKIP_IMAGES,C),a===0&&t.generateMipmaps&&F.generateMipmap(v),I.unbindTexture()},this.initRenderTarget=function(e){L.get(e).__webglFramebuffer===void 0&&ze.setupRenderTarget(e)},this.initTexture=function(e){e.isCubeTexture?ze.setTextureCube(e,0):e.isData3DTexture?ze.setTexture3D(e,0):e.isDataArrayTexture||e.isCompressedArrayTexture?ze.setTexture2DArray(e,0):ze.setTexture2D(e,0),I.unbindTexture()},this.resetState=function(){ce=0,le=0,P=null,I.reset(),at.reset()},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}get coordinateSystem(){return Ge}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=It._getDrawingBufferColorSpace(e),t.unpackColorSpace=It._getUnpackColorSpace()}},Zu={value:null},Qu={value:new qt(0,0,0,0)},$u={value:0},ed={value:900},td={value:1700},nd={value:1},rd={value:1.54};function id(){let e=new bi(new Uint8Array([128,128,128,255]),1,1);return e.needsUpdate=!0,e}Zu.value=id();var ad=.06;function od(){return`
    uniform sampler2D uOrtho;
    uniform vec4 uOrthoRect;   // (localXMin, localZMin, sizeX, sizeZ)
    uniform float uOrthoMix;
    uniform float uOrthoNearM;
    uniform float uOrthoFarM;
    uniform float uOrthoScale;

    vec2 orthoUv( vec2 wxz ) {
      return ( wxz - uOrthoRect.xy ) / max( uOrthoRect.zw, vec2( 1e-6 ) );
    }

    // ONE FETCH, both answers: rgb is the photograph's albedo, a is how much of the ground it
    // should carry here. They were two functions and therefore two texture fetches of the same
    // texel, which is pure waste in a shader that runs on every ground fragment.
    //
    // The amount is: inside the atlas, away from its edge, covered, and near the camera.
    //   - COVERAGE IS THE ALPHA. A cell of the atlas with no sheet behind it - across the
    //     regional border, or off the flown area - is left transparent when the atlas is
    //     drawn, so that one multiply is the whole missing-data mask and there is no second
    //     texture to keep in step with the first.
    //   - 1.0 - uv.y, and it is not decoration: the rectangle's z grows SOUTHWARD (§6) while
    //     the image's row 0 is its north edge and three flips loaded images on upload, so
    //     v = 0 is the south edge. Sampling with uv.y would mirror the valley about its own
    //     middle - which on this terrain looks almost right, and is the reason to say so.
    vec4 orthoSample( vec2 wxz ) {
      vec2 uv = orthoUv( wxz );
      float inside = step( 0.0, uv.x ) * step( uv.x, 1.0 )
                   * step( 0.0, uv.y ) * step( uv.y, 1.0 )
                   * step( 1.0, uOrthoRect.z );
      float edge = min( min( uv.x, 1.0 - uv.x ), min( uv.y, 1.0 - uv.y ) );
      inside *= smoothstep( 0.0, ${ad.toPrecision(4)}, edge );
      vec4 texel = texture2D( uOrtho, vec2( uv.x, 1.0 - uv.y ) );
      float d = distance( cameraPosition.xz, wxz );
      float amount = inside * texel.a * uOrthoMix
                   * ( 1.0 - smoothstep( uOrthoNearM, uOrthoFarM, d ) );
      // The texture is tagged SRGBColorSpace, so rgb is already linear here.
      return vec4( texel.rgb * uOrthoScale, amount );
    }
  `}var sd=1,cd=16,ld=new Map,ud=null,dd=null,fd=null,pd=null,md=null,hd=null,gd=null,_d=null,vd=0,yd=0,bd=null,xd={sheets:0,cells:0,empty:0,cached:0,cell:null,lastRefillMs:0,refills:0};function Sd(){for(;ld.size>cd;)ld.delete(ld.keys().next().value);xd.cached=ld.size}function Cd(e,t){let n=ld.get(t);if(n)return ld.delete(t),ld.set(t,n),n;let r=new Promise((n,r)=>{let i=new Image;i.crossOrigin=`anonymous`,i.onload=()=>n(i),i.onerror=()=>r(Error(`orthophoto sheet failed to load: ${t}`)),i.src=`${e}/ortho/${t}`});return r.catch(()=>ld.delete(t)),ld.set(t,r),Sd(),r}function wd(e,t){let n=dd.grid,r=e+fd.x,i=fd.y-t,a=n.sheetM/2;return[Math.round((r-n.originE-a)/n.stepM),Math.round((n.originN-a-i)/n.stepM)]}async function Td(e=`./data`,n){return ud??=fetch(`${e}/ortho.json`).then(e=>e.ok?e.json():null),dd=await ud,dd?.sheets?.length?(fd=n,bd=new Map(dd.sheets.map(e=>[e.cell.join(`,`),e])),vd=Math.round(dd.grid.sheetM/dd.resolutionMPerPx.x),yd=Math.round(dd.grid.stepM/dd.resolutionMPerPx.x),pd||(pd=document.createElement(`canvas`),pd.width=yd*2*sd+vd,pd.height=yd*2*sd+vd,md=pd.getContext(`2d`,{willReadFrequently:!1}),hd=new aa(pd),hd.colorSpace=Re,hd.wrapS=t,hd.wrapT=t,hd.minFilter=c,hd.magFilter=o,hd.generateMipmaps=!0,hd.anisotropy=8,Zu.value=hd),xd.sheets=dd.sheets.length,dd):null}async function Ed(e,t,n=`./data`){if(!dd||!md)return!1;let[r,i]=wd(e,t);if(gd&&gd[0]===r&&gd[1]===i||_d&&_d[0]===r&&_d[1]===i)return!1;_d=[r,i];let a=performance.now(),o=[];for(let e=-1;e<=sd;e++)for(let t=-1;t<=sd;t++){let n=bd.get(`${r+t},${i+e}`);n&&o.push({sh:n,dx:(t+sd)*yd,dy:(e+sd)*yd})}if(!o.length)return gd=[r,i],xd.cell=[r,i],xd.cells=0,xd.empty=3**2,md.clearRect(0,0,pd.width,pd.height),hd.needsUpdate=!0,Dd(r,i),!0;let s=await Promise.all(o.map(e=>Cd(n,e.sh.file.name).catch(()=>null)));if(_d[0]!==r||_d[1]!==i)return!1;md.clearRect(0,0,pd.width,pd.height);let c=0;return s.forEach((e,t)=>{e&&(md.drawImage(e,o[t].dx,o[t].dy,vd,vd),c+=1)}),hd.needsUpdate=!0,gd=[r,i],Dd(r,i),xd.cell=[r,i],xd.cells=c,xd.empty=3**2-c,xd.lastRefillMs=performance.now()-a,xd.refills+=1,!0}function Dd(e,t){let n=dd.grid,r=n.stepM*2*sd+n.sheetM,i=n.originE+(e-sd)*n.stepM-fd.x,a=n.originN-(t-sd)*n.stepM;Qu.value.set(i,fd.y-a,r,r)}var Od=class e extends _i{constructor(){let t=e.SkyShader,n=new mo({name:t.name,uniforms:uo.clone(t.uniforms),vertexShader:t.vertexShader,fragmentShader:t.fragmentShader,side:1,depthWrite:!1});super(new la(1,1,1),n),this.isSky=!0}};Od.SkyShader={name:`SkyShader`,uniforms:{turbidity:{value:2},rayleigh:{value:1},mieCoefficient:{value:.005},mieDirectionalG:{value:.8},sunPosition:{value:new H},up:{value:new H(0,1,0)},cloudScale:{value:2e-4},cloudSpeed:{value:1e-4},cloudCoverage:{value:.4},cloudDensity:{value:.4},cloudElevation:{value:.5},showSunDisc:{value:1},time:{value:0}},vertexShader:`
		uniform vec3 sunPosition;
		uniform float rayleigh;
		uniform float turbidity;
		uniform float mieCoefficient;
		uniform vec3 up;

		varying vec3 vWorldPosition;
		varying vec3 vSunDirection;
		varying float vSunfade;
		varying vec3 vBetaR;
		varying vec3 vBetaM;
		varying float vSunE;

		// constants for atmospheric scattering
		const float e = 2.71828182845904523536028747135266249775724709369995957;
		const float pi = 3.141592653589793238462643383279502884197169;

		// wavelength of used primaries, according to preetham
		const vec3 lambda = vec3( 680E-9, 550E-9, 450E-9 );
		// this pre-calculation replaces older TotalRayleigh(vec3 lambda) function:
		// (8.0 * pow(pi, 3.0) * pow(pow(n, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * pn)) / (3.0 * N * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * pn))
		const vec3 totalRayleigh = vec3( 5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5 );

		// mie stuff
		// K coefficient for the primaries
		const float v = 4.0;
		const vec3 K = vec3( 0.686, 0.678, 0.666 );
		// MieConst = pi * pow( ( 2.0 * pi ) / lambda, vec3( v - 2.0 ) ) * K
		const vec3 MieConst = vec3( 1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14 );

		// earth shadow hack
		// cutoffAngle = pi / 1.95;
		const float cutoffAngle = 1.6110731556870734;
		const float steepness = 1.5;
		const float EE = 1000.0;

		float sunIntensity( float zenithAngleCos ) {
			zenithAngleCos = clamp( zenithAngleCos, -1.0, 1.0 );
			return EE * max( 0.0, 1.0 - pow( e, -( ( cutoffAngle - acos( zenithAngleCos ) ) / steepness ) ) );
		}

		vec3 totalMie( float T ) {
			float c = ( 0.2 * T ) * 10E-18;
			return 0.434 * c * MieConst;
		}

		void main() {

			vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
			vWorldPosition = worldPosition.xyz;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			gl_Position.z = gl_Position.w; // set z to camera.far

			vSunDirection = normalize( sunPosition );

			vSunE = sunIntensity( dot( vSunDirection, up ) );

			vSunfade = 1.0 - clamp( 1.0 - exp( ( sunPosition.y / 450000.0 ) ), 0.0, 1.0 );

			float rayleighCoefficient = rayleigh - ( 1.0 * ( 1.0 - vSunfade ) );

			// extinction (absorption + out scattering)
			// rayleigh coefficients
			vBetaR = totalRayleigh * rayleighCoefficient;

			// mie coefficients
			vBetaM = totalMie( turbidity ) * mieCoefficient;

		}`,fragmentShader:`
		varying vec3 vWorldPosition;
		varying vec3 vSunDirection;
		varying vec3 vBetaR;
		varying vec3 vBetaM;
		varying float vSunE;

		uniform float mieDirectionalG;
		uniform vec3 up;
		uniform float cloudScale;
		uniform float cloudSpeed;
		uniform float cloudCoverage;
		uniform float cloudDensity;
		uniform float cloudElevation;
		uniform float showSunDisc;
		uniform float time;

		// Cloud noise functions
		float hash( vec2 p ) {
			return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453123 );
		}

		float noise( vec2 p ) {
			vec2 i = floor( p );
			vec2 f = fract( p );
			f = f * f * ( 3.0 - 2.0 * f );
			float a = hash( i );
			float b = hash( i + vec2( 1.0, 0.0 ) );
			float c = hash( i + vec2( 0.0, 1.0 ) );
			float d = hash( i + vec2( 1.0, 1.0 ) );
			return mix( mix( a, b, f.x ), mix( c, d, f.x ), f.y );
		}

		float fbm( vec2 p ) {
			float value = 0.0;
			float amplitude = 0.5;
			for ( int i = 0; i < 5; i ++ ) {
				value += amplitude * noise( p );
				p *= 2.0;
				amplitude *= 0.5;
			}
			return value;
		}

		// constants for atmospheric scattering
		const float pi = 3.141592653589793238462643383279502884197169;

		const float n = 1.0003; // refractive index of air
		const float N = 2.545E25; // number of molecules per unit volume for air at 288.15K and 1013mb (sea level -45 celsius)

		// optical length at zenith for molecules
		const float rayleighZenithLength = 8.4E3;
		const float mieZenithLength = 1.25E3;
		// 66 arc seconds -> degrees, and the cosine of that
		const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;

		// 3.0 / ( 16.0 * pi )
		const float THREE_OVER_SIXTEENPI = 0.05968310365946075;
		// 1.0 / ( 4.0 * pi )
		const float ONE_OVER_FOURPI = 0.07957747154594767;

		float rayleighPhase( float cosTheta ) {
			return THREE_OVER_SIXTEENPI * ( 1.0 + pow( cosTheta, 2.0 ) );
		}

		float hgPhase( float cosTheta, float g ) {
			float g2 = pow( g, 2.0 );
			float inverse = 1.0 / pow( 1.0 - 2.0 * g * cosTheta + g2, 1.5 );
			return ONE_OVER_FOURPI * ( ( 1.0 - g2 ) * inverse );
		}

		void main() {

			vec3 direction = normalize( vWorldPosition - cameraPosition );

			// optical length
			// cutoff angle at 90 to avoid singularity in next formula.
			float zenithAngle = acos( max( 0.0, dot( up, direction ) ) );
			float inverse = 1.0 / ( cos( zenithAngle ) + 0.15 * pow( 93.885 - ( ( zenithAngle * 180.0 ) / pi ), -1.253 ) );
			float sR = rayleighZenithLength * inverse;
			float sM = mieZenithLength * inverse;

			// combined extinction factor
			vec3 Fex = exp( -( vBetaR * sR + vBetaM * sM ) );

			// in scattering
			float cosTheta = dot( direction, vSunDirection );

			float rPhase = rayleighPhase( cosTheta * 0.5 + 0.5 );
			vec3 betaRTheta = vBetaR * rPhase;

			float mPhase = hgPhase( cosTheta, mieDirectionalG );
			vec3 betaMTheta = vBetaM * mPhase;

			vec3 Lin = pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * ( 1.0 - Fex ), vec3( 1.5 ) );
			Lin *= mix( vec3( 1.0 ), pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * Fex, vec3( 1.0 / 2.0 ) ), clamp( pow( 1.0 - dot( up, vSunDirection ), 5.0 ), 0.0, 1.0 ) );

			// nightsky
			float theta = acos( direction.y ); // elevation --> y-axis, [-pi/2, pi/2]
			float phi = atan( direction.z, direction.x ); // azimuth --> x-axis [-pi/2, pi/2]
			vec2 uv = vec2( phi, theta ) / vec2( 2.0 * pi, pi ) + vec2( 0.5, 0.0 );
			vec3 L0 = vec3( 0.1 ) * Fex;

			// composition + solar disc
			float sundisc = smoothstep( sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta ) * showSunDisc;
			L0 += ( vSunE * 19000.0 * Fex ) * sundisc;

			vec3 texColor = ( Lin + L0 ) * 0.04 + vec3( 0.0, 0.0003, 0.00075 );

			// Clouds
			if ( direction.y > 0.0 && cloudCoverage > 0.0 ) {

				// Project to cloud plane (higher elevation = clouds appear lower/closer)
				float elevation = mix( 1.0, 0.1, cloudElevation );
				vec2 cloudUV = direction.xz / ( direction.y * elevation );
				cloudUV *= cloudScale;
				cloudUV += time * cloudSpeed;

				// Multi-octave noise for fluffy clouds
				float cloudNoise = fbm( cloudUV * 1000.0 );
				cloudNoise += 0.5 * fbm( cloudUV * 2000.0 + 3.7 );
				cloudNoise = cloudNoise * 0.5 + 0.5;

				// Apply coverage threshold
				float cloudMask = smoothstep( 1.0 - cloudCoverage, 1.0 - cloudCoverage + 0.3, cloudNoise );

				// Fade clouds near horizon (adjusted by elevation)
				float horizonFade = smoothstep( 0.0, 0.1 + 0.2 * cloudElevation, direction.y );
				cloudMask *= horizonFade;

				// Cloud lighting based on sun position
				float sunInfluence = dot( direction, vSunDirection ) * 0.5 + 0.5;
				float daylight = max( 0.0, vSunDirection.y * 2.0 );

				// Base cloud color affected by atmosphere
				vec3 atmosphereColor = Lin * 0.04;
				vec3 cloudColor = mix( vec3( 0.3 ), vec3( 1.0 ), daylight );
				cloudColor = mix( cloudColor, atmosphereColor + vec3( 1.0 ), sunInfluence * 0.5 );
				cloudColor *= vSunE * 0.00002;

				// Blend clouds with sky
				texColor = mix( texColor, cloudColor, cloudMask * cloudDensity );

			}

			gl_FragColor = vec4( texColor, 1.0 );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>

		}`};var kd=class extends En{constructor(e=document.createElement(`div`)){super(),this.isCSS2DObject=!0,this.element=e,this.element.style.position=`absolute`,this.element.style.userSelect=`none`,this.element.setAttribute(`draggable`,!1),this.center=new V(.5,.5),this.addEventListener(`removed`,function(){this.traverse(function(e){e.element&&e.element instanceof e.element.ownerDocument.defaultView.Element&&e.element.parentNode!==null&&e.element.remove()})})}copy(e,t){return super.copy(e,t),this.element=e.element.cloneNode(!0),this.center=e.center,this}},Ad=new H,jd=new Qt,Md=new Qt,Nd=new H,Pd=new H,Fd=class{constructor(e={}){let t=this,n,r,i,a,o={objects:new WeakMap},s=e.element===void 0?document.createElement(`div`):e.element;s.style.overflow=`hidden`,this.domElement=s,this.sortObjects=!0,this.getSize=function(){return{width:n,height:r}},this.render=function(e,t){e.matrixWorldAutoUpdate===!0&&e.updateMatrixWorld(),t.parent===null&&t.matrixWorldAutoUpdate===!0&&t.updateMatrixWorld(),jd.copy(t.matrixWorldInverse),Md.multiplyMatrices(t.projectionMatrix,jd),l(e,e,t),this.sortObjects&&f(e)},this.setSize=function(e,t){n=e,r=t,i=n/2,a=r/2,s.style.width=e+`px`,s.style.height=t+`px`};function c(e){e.isCSS2DObject&&(e.element.style.display=`none`);for(let t=0,n=e.children.length;t<n;t++)c(e.children[t])}function l(e,n,r){if(e.visible===!1){c(e);return}if(e.isCSS2DObject){Ad.setFromMatrixPosition(e.matrixWorld),Ad.applyMatrix4(Md);let c=Ad.z>=-1&&Ad.z<=1&&e.layers.test(r.layers)===!0,l=e.element;l.style.display=c===!0?``:`none`,c===!0&&(e.onBeforeRender(t,n,r),l.style.transform=`translate(`+-100*e.center.x+`%,`+-100*e.center.y+`%)translate(`+(Ad.x*i+i)+`px,`+(-Ad.y*a+a)+`px)`,l.parentNode!==s&&s.appendChild(l),e.onAfterRender(t,n,r));let d={distanceToCameraSquared:u(r,e)};o.objects.set(e,d)}for(let t=0,i=e.children.length;t<i;t++)l(e.children[t],n,r)}function u(e,t){return Nd.setFromMatrixPosition(e.matrixWorld),Pd.setFromMatrixPosition(t.matrixWorld),Nd.distanceToSquared(Pd)}function d(e){let t=[];return e.traverseVisible(function(e){e.isCSS2DObject&&t.push(e)}),t}function f(e){let t=d(e).sort(function(e,t){return e.renderOrder===t.renderOrder?o.objects.get(e).distanceToCameraSquared-o.objects.get(t).distanceToCameraSquared:t.renderOrder-e.renderOrder}),n=t.length;for(let e=0,r=t.length;e<r;e++)t[e].element.style.zIndex=n-e}}};function Id(e){e(`EPSG:4326`,`+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees`),e(`EPSG:4269`,`+title=NAD83 (long/lat) +proj=longlat +a=6378137.0 +b=6356752.31414036 +ellps=GRS80 +datum=NAD83 +units=degrees`),e(`EPSG:3857`,`+title=WGS 84 / Pseudo-Mercator +proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs`);for(var t=1;t<=60;++t)e(`EPSG:`+(32600+t),`+proj=utm +zone=`+t+` +datum=WGS84 +units=m`),e(`EPSG:`+(32700+t),`+proj=utm +zone=`+t+` +south +datum=WGS84 +units=m`);e(`EPSG:5041`,`+title=WGS 84 / UPS North (E,N) +proj=stere +lat_0=90 +lon_0=0 +k=0.994 +x_0=2000000 +y_0=2000000 +datum=WGS84 +units=m`),e(`EPSG:5042`,`+title=WGS 84 / UPS South (E,N) +proj=stere +lat_0=-90 +lon_0=0 +k=0.994 +x_0=2000000 +y_0=2000000 +datum=WGS84 +units=m`),e.WGS84=e[`EPSG:4326`],e[`EPSG:3785`]=e[`EPSG:3857`],e.GOOGLE=e[`EPSG:3857`],e[`EPSG:900913`]=e[`EPSG:3857`],e[`EPSG:102113`]=e[`EPSG:3857`]}var Ld=6378137,Rd=6356752.314,zd=.0066943799901413165,Bd=484813681109536e-20,J=Math.PI/2,Vd=.16666666666666666,Hd=.04722222222222222,Ud=.022156084656084655,Wd=1e-10,Gd=.017453292519943295,Kd=57.29577951308232,qd=Math.PI/4,Jd=Math.PI*2,Yd=3.14159265359,Xd={};Xd.greenwich=0,Xd.lisbon=-9.131906111111,Xd.paris=2.337229166667,Xd.bogota=-74.080916666667,Xd.madrid=-3.687938888889,Xd.rome=12.452333333333,Xd.bern=7.439583333333,Xd.jakarta=106.807719444444,Xd.ferro=-17.666666666667,Xd.brussels=4.367975,Xd.stockholm=18.058277777778,Xd.athens=23.7163375,Xd.oslo=10.722916666667;var Zd={mm:{to_meter:.001},cm:{to_meter:.01},ft:{to_meter:.3048},"us-ft":{to_meter:1200/3937},fath:{to_meter:1.8288},kmi:{to_meter:1852},"us-ch":{to_meter:20.1168402336805},"us-mi":{to_meter:1609.34721869444},km:{to_meter:1e3},"ind-ft":{to_meter:.30479841},"ind-yd":{to_meter:.91439523},mi:{to_meter:1609.344},yd:{to_meter:.9144},ch:{to_meter:20.1168},link:{to_meter:.201168},dm:{to_meter:.1},in:{to_meter:.0254},"ind-ch":{to_meter:20.11669506},"us-in":{to_meter:.025400050800101},"us-yd":{to_meter:.914401828803658}},Qd=/[\s_\-\/\(\)]/g;function $d(e,t){if(e[t])return e[t];for(var n=Object.keys(e),r=t.toLowerCase().replace(Qd,``),i=-1,a,o;++i<n.length;)if(a=n[i],o=a.toLowerCase().replace(Qd,``),o===r)return e[a]}function ef(e){var t={},n=e.split(`+`).map(function(e){return e.trim()}).filter(function(e){return e}).reduce(function(e,t){var n=t.split(`=`);return n.push(!0),e[n[0].toLowerCase()]=n[1],e},{}),r,i,a,o={proj:`projName`,datum:`datumCode`,rf:function(e){t.rf=parseFloat(e)},lat_0:function(e){t.lat0=e*Gd},lat_1:function(e){t.lat1=e*Gd},lat_2:function(e){t.lat2=e*Gd},lat_ts:function(e){t.lat_ts=e*Gd},lon_0:function(e){t.long0=e*Gd},lon_wrap:function(e){t.long_wrap=parseFloat(e)*Gd},lon_1:function(e){t.long1=e*Gd},lon_2:function(e){t.long2=e*Gd},alpha:function(e){t.alpha=parseFloat(e)*Gd},gamma:function(e){t.rectified_grid_angle=parseFloat(e)*Gd},lonc:function(e){t.longc=e*Gd},x_0:function(e){t.x0=parseFloat(e)},y_0:function(e){t.y0=parseFloat(e)},k_0:function(e){t.k0=parseFloat(e)},k:function(e){t.k0=parseFloat(e)},a:function(e){t.a=parseFloat(e)},b:function(e){t.b=parseFloat(e)},r:function(e){t.a=t.b=parseFloat(e)},r_a:function(){t.R_A=!0},zone:function(e){t.zone=parseInt(e,10)},south:function(){t.utmSouth=!0},towgs84:function(e){t.datum_params=e.split(`,`).map(function(e){return parseFloat(e)})},to_meter:function(e){t.to_meter=parseFloat(e)},units:function(e){t.units=e;var n=$d(Zd,e);n&&(t.to_meter=n.to_meter)},from_greenwich:function(e){t.from_greenwich=e*Gd},pm:function(e){t.from_greenwich=($d(Xd,e)||parseFloat(e))*Gd},nadgrids:function(e){e===`@null`?t.datumCode=`none`:t.nadgrids=e},axis:function(e){var n=`ewnsud`;e.length===3&&n.indexOf(e.substr(0,1))!==-1&&n.indexOf(e.substr(1,1))!==-1&&n.indexOf(e.substr(2,1))!==-1&&(t.axis=e)},approx:function(){t.approx=!0},over:function(){t.over=!0}};for(r in n)i=n[r],r in o?(a=o[r],typeof a==`function`?a(i):t[a]=i):t[r]=i;return typeof t.datumCode==`string`&&t.datumCode!==`WGS84`&&(t.datumCode=t.datumCode.toLowerCase()),t.projStr=e,t}var tf=class{static getId(e){let t=e.find(e=>Array.isArray(e)&&e[0]===`ID`);return t&&t.length>=3?{authority:t[1],code:parseInt(t[2],10)}:null}static convertUnit(e,t=`unit`){if(!e||e.length<3)return{type:t,name:`unknown`,conversion_factor:null};let n=e[1],r=parseFloat(e[2])||null,i=e.find(e=>Array.isArray(e)&&e[0]===`ID`);return{type:t,name:n,conversion_factor:r,id:i?{authority:i[1],code:parseInt(i[2],10)}:null}}static convertAxis(e){let t=e[1]||`Unknown`,n,r=t.match(/^\((.)\)$/);if(r){let t=r[1].toUpperCase();if(t===`E`)n=`east`;else if(t===`N`)n=`north`;else if(t===`U`)n=`up`;else if(e[2])n=e[2];else throw Error(`Unknown axis abbreviation: ${t}`)}else n=e[2]||`unknown`;let i=e.find(e=>Array.isArray(e)&&e[0]===`ORDER`),a=i?parseInt(i[1],10):null,o=e.find(e=>Array.isArray(e)&&(e[0]===`LENGTHUNIT`||e[0]===`ANGLEUNIT`||e[0]===`SCALEUNIT`)),s=this.convertUnit(o);return{name:t,direction:n,unit:s,order:a}}static extractAxes(e){return e.filter(e=>Array.isArray(e)&&e[0]===`AXIS`).map(e=>this.convertAxis(e)).sort((e,t)=>(e.order||0)-(t.order||0))}static convert(e,t={}){switch(e[0]){case`PROJCRS`:t.type=`ProjectedCRS`,t.name=e[1],t.base_crs=e.find(e=>Array.isArray(e)&&e[0]===`BASEGEOGCRS`)?this.convert(e.find(e=>Array.isArray(e)&&e[0]===`BASEGEOGCRS`)):null,t.conversion=e.find(e=>Array.isArray(e)&&e[0]===`CONVERSION`)?this.convert(e.find(e=>Array.isArray(e)&&e[0]===`CONVERSION`)):null;let n=e.find(e=>Array.isArray(e)&&e[0]===`CS`);n&&(t.coordinate_system={subtype:n[1],axis:this.extractAxes(e)});let r=e.find(e=>Array.isArray(e)&&e[0]===`LENGTHUNIT`);if(r){let e=this.convertUnit(r);t.coordinate_system.unit=e}t.id=this.getId(e);break;case`BASEGEOGCRS`:case`GEOGCRS`:case`GEODCRS`:t.type=e[0]===`GEODCRS`?`GeodeticCRS`:`GeographicCRS`,t.name=e[1];let i=e.find(e=>Array.isArray(e)&&(e[0]===`DATUM`||e[0]===`ENSEMBLE`));if(i){let n=this.convert(i);i[0]===`ENSEMBLE`?t.datum_ensemble=n:t.datum=n;let r=e.find(e=>Array.isArray(e)&&e[0]===`PRIMEM`);r&&r[1]!==`Greenwich`&&(n.prime_meridian={name:r[1],longitude:parseFloat(r[2])})}let a=e.find(e=>Array.isArray(e)&&e[0]===`CS`);t.coordinate_system={subtype:a?a[1]:`ellipsoidal`,axis:this.extractAxes(e)},t.id=this.getId(e);break;case`DATUM`:t.type=`GeodeticReferenceFrame`,t.name=e[1],t.ellipsoid=e.find(e=>Array.isArray(e)&&e[0]===`ELLIPSOID`)?this.convert(e.find(e=>Array.isArray(e)&&e[0]===`ELLIPSOID`)):null;break;case`ENSEMBLE`:t.type=`DatumEnsemble`,t.name=e[1],t.members=e.filter(e=>Array.isArray(e)&&e[0]===`MEMBER`).map(e=>({type:`DatumEnsembleMember`,name:e[1],id:this.getId(e)}));let o=e.find(e=>Array.isArray(e)&&e[0]===`ENSEMBLEACCURACY`);o&&(t.accuracy=parseFloat(o[1]));let s=e.find(e=>Array.isArray(e)&&e[0]===`ELLIPSOID`);s&&(t.ellipsoid=this.convert(s)),t.id=this.getId(e);break;case`ELLIPSOID`:t.type=`Ellipsoid`,t.name=e[1],t.semi_major_axis=parseFloat(e[2]),t.inverse_flattening=parseFloat(e[3]),e.find(e=>Array.isArray(e)&&e[0]===`LENGTHUNIT`)&&this.convert(e.find(e=>Array.isArray(e)&&e[0]===`LENGTHUNIT`),t);break;case`CONVERSION`:t.type=`Conversion`,t.name=e[1],t.method=e.find(e=>Array.isArray(e)&&e[0]===`METHOD`)?this.convert(e.find(e=>Array.isArray(e)&&e[0]===`METHOD`)):null,t.parameters=e.filter(e=>Array.isArray(e)&&e[0]===`PARAMETER`).map(e=>this.convert(e));break;case`METHOD`:t.type=`Method`,t.name=e[1],t.id=this.getId(e);break;case`PARAMETER`:t.type=`Parameter`,t.name=e[1],t.value=parseFloat(e[2]),t.unit=this.convertUnit(e.find(e=>Array.isArray(e)&&(e[0]===`LENGTHUNIT`||e[0]===`ANGLEUNIT`||e[0]===`SCALEUNIT`))),t.id=this.getId(e);break;case`BOUNDCRS`:t.type=`BoundCRS`;let c=e.find(e=>Array.isArray(e)&&e[0]===`SOURCECRS`);if(c){let e=c.find(e=>Array.isArray(e));t.source_crs=e?this.convert(e):null}let l=e.find(e=>Array.isArray(e)&&e[0]===`TARGETCRS`);if(l){let e=l.find(e=>Array.isArray(e));t.target_crs=e?this.convert(e):null}let u=e.find(e=>Array.isArray(e)&&e[0]===`ABRIDGEDTRANSFORMATION`);u?t.transformation=this.convert(u):t.transformation=null;break;case`ABRIDGEDTRANSFORMATION`:if(t.type=`Transformation`,t.name=e[1],t.method=e.find(e=>Array.isArray(e)&&e[0]===`METHOD`)?this.convert(e.find(e=>Array.isArray(e)&&e[0]===`METHOD`)):null,t.parameters=e.filter(e=>Array.isArray(e)&&(e[0]===`PARAMETER`||e[0]===`PARAMETERFILE`)).map(e=>{if(e[0]===`PARAMETER`)return this.convert(e);if(e[0]===`PARAMETERFILE`)return{name:e[1],value:e[2],id:{authority:`EPSG`,code:8656}}}),t.parameters.length===7){let e=t.parameters[6];e.name===`Scale difference`&&(e.value=Math.round((e.value-1)*0xe8d4a51000)/1e6)}t.id=this.getId(e);break;case`AXIS`:t.coordinate_system||={type:`unspecified`,axis:[]},t.coordinate_system.axis.push(this.convertAxis(e));break;case`LENGTHUNIT`:let d=this.convertUnit(e,`LinearUnit`);t.coordinate_system&&t.coordinate_system.axis&&t.coordinate_system.axis.forEach(e=>{e.unit||=d}),d.conversion_factor&&d.conversion_factor!==1&&(t.semi_major_axis&&={value:t.semi_major_axis,unit:d});break;default:t.keyword=e[0];break}return t}};function nf(e){return tf.convert(e)}function rf(e){let t=e.toUpperCase();return t.includes(`PROJCRS`)||t.includes(`GEOGCRS`)||t.includes(`BOUNDCRS`)||t.includes(`VERTCRS`)||t.includes(`LENGTHUNIT`)||t.includes(`ANGLEUNIT`)||t.includes(`SCALEUNIT`)?`WKT2`:(t.includes(`PROJCS`)||t.includes(`GEOGCS`)||t.includes(`LOCAL_CS`)||t.includes(`VERT_CS`)||t.includes(`UNIT`),`WKT1`)}var af=vf,of=1,sf=2,cf=3,lf=4,uf=5,df=-1,ff=/\s/,pf=/[A-Za-z]/,mf=/[A-Za-z84_]/,hf=/[,\]]/,gf=/[\d\.E\-\+]/;function _f(e){if(typeof e!=`string`)throw Error(`not a string`);this.text=e.trim(),this.level=0,this.place=0,this.root=null,this.stack=[],this.currentObject=null,this.state=of}_f.prototype.readCharicter=function(){var e=this.text[this.place++];if(this.state!==lf)for(;ff.test(e);){if(this.place>=this.text.length)return;e=this.text[this.place++]}switch(this.state){case of:return this.neutral(e);case sf:return this.keyword(e);case lf:return this.quoted(e);case uf:return this.afterquote(e);case cf:return this.number(e);case df:return}},_f.prototype.afterquote=function(e){if(e===`"`){this.word+=`"`,this.state=lf;return}if(hf.test(e)){this.word=this.word.trim(),this.afterItem(e);return}throw Error(`havn't handled "`+e+`" in afterquote yet, index `+this.place)},_f.prototype.afterItem=function(e){if(e===`,`){this.word!==null&&this.currentObject.push(this.word),this.word=null,this.state=of;return}if(e===`]`){this.level--,this.word!==null&&(this.currentObject.push(this.word),this.word=null),this.state=of,this.currentObject=this.stack.pop(),this.currentObject||(this.state=df);return}},_f.prototype.number=function(e){if(gf.test(e)){this.word+=e;return}if(hf.test(e)){this.word=parseFloat(this.word),this.afterItem(e);return}throw Error(`havn't handled "`+e+`" in number yet, index `+this.place)},_f.prototype.quoted=function(e){if(e===`"`){this.state=uf;return}this.word+=e},_f.prototype.keyword=function(e){if(mf.test(e)){this.word+=e;return}if(e===`[`){var t=[];t.push(this.word),this.level++,this.root===null?this.root=t:this.currentObject.push(t),this.stack.push(this.currentObject),this.currentObject=t,this.state=of;return}if(hf.test(e)){this.afterItem(e);return}throw Error(`havn't handled "`+e+`" in keyword yet, index `+this.place)},_f.prototype.neutral=function(e){if(pf.test(e)){this.word=e,this.state=sf;return}if(e===`"`){this.word=``,this.state=lf;return}if(gf.test(e)){this.word=e,this.state=cf;return}if(hf.test(e)){this.afterItem(e);return}throw Error(`havn't handled "`+e+`" in neutral yet, index `+this.place)},_f.prototype.output=function(){for(;this.place<this.text.length;)this.readCharicter();if(this.state===df)return this.root;throw Error(`unable to parse string "`+this.text+`". State is `+this.state)};function vf(e){return new _f(e).output()}function yf(e,t,n){Array.isArray(t)&&(n.unshift(t),t=null);var r=t?{}:e,i=n.reduce(function(e,t){return bf(t,e),e},r);t&&(e[t]=i)}function bf(e,t){if(!Array.isArray(e)){t[e]=!0;return}var n=e.shift();if(n===`PARAMETER`&&(n=e.shift()),e.length===1){if(Array.isArray(e[0])){t[n]={},bf(e[0],t[n]);return}t[n]=e[0];return}if(!e.length){t[n]=!0;return}if(n===`TOWGS84`){t[n]=e;return}if(n===`AXIS`){n in t||(t[n]=[]),t[n].push(e);return}Array.isArray(n)||(t[n]={});var r;switch(n){case`UNIT`:case`PRIMEM`:case`VERT_DATUM`:t[n]={name:e[0].toLowerCase(),convert:e[1]},e.length===3&&bf(e[2],t[n]);return;case`SPHEROID`:case`ELLIPSOID`:t[n]={name:e[0],a:e[1],rf:e[2]},e.length===4&&bf(e[3],t[n]);return;case`EDATUM`:case`ENGINEERINGDATUM`:case`LOCAL_DATUM`:case`DATUM`:case`VERT_CS`:case`VERTCRS`:case`VERTICALCRS`:e[0]=[`name`,e[0]],yf(t,n,e);return;case`COMPD_CS`:case`COMPOUNDCRS`:case`FITTED_CS`:case`PROJECTEDCRS`:case`PROJCRS`:case`GEOGCS`:case`GEOCCS`:case`PROJCS`:case`LOCAL_CS`:case`GEODCRS`:case`GEODETICCRS`:case`GEODETICDATUM`:case`ENGCRS`:case`ENGINEERINGCRS`:e[0]=[`name`,e[0]],yf(t,n,e),t[n].type=n;return;default:for(r=-1;++r<e.length;)if(!Array.isArray(e[r]))return bf(e,t[n]);return yf(t,n,e)}}var xf=.017453292519943295;function Sf(e){return e*xf}function Cf(e){let t=(e.projName||``).toLowerCase().replace(/_/g,` `);e.long0===void 0&&e.longc!==void 0&&(e.long0=e.longc),!e.lat_ts&&e.lat1&&(t===`stereographic south pole`||t===`polar stereographic (variant b)`)?(e.lat0=Sf(e.lat1>0?90:-90),e.lat_ts=e.lat1,delete e.lat1):!e.lat_ts&&e.lat0&&(t===`polar stereographic`||t===`polar stereographic (variant a)`)&&(e.lat_ts=e.lat0,e.lat0=Sf(e.lat0>0?90:-90),delete e.lat1)}function wf(e){let t={units:null,to_meter:void 0};return typeof e==`string`?(t.units=e.toLowerCase(),t.units===`metre`&&(t.units=`meter`),t.units===`meter`&&(t.to_meter=1)):e&&e.name&&(t.units=e.name.toLowerCase(),t.units===`metre`&&(t.units=`meter`),t.to_meter=e.conversion_factor),t}function Tf(e){return typeof e==`object`?e.value*e.unit.conversion_factor:e}function Ef(e,t){e.ellipsoid.radius?(t.a=e.ellipsoid.radius,t.rf=0):(t.a=Tf(e.ellipsoid.semi_major_axis),e.ellipsoid.inverse_flattening===void 0?e.ellipsoid.semi_major_axis!==void 0&&e.ellipsoid.semi_minor_axis!==void 0&&(t.rf=t.a/(t.a-Tf(e.ellipsoid.semi_minor_axis))):t.rf=e.ellipsoid.inverse_flattening)}function Df(e,t={}){return!e||typeof e!=`object`?e:e.type===`BoundCRS`?(Df(e.source_crs,t),e.transformation&&(e.transformation.method&&e.transformation.method.name===`NTv2`?t.nadgrids=e.transformation.parameters[0].value:t.datum_params=e.transformation.parameters.map(e=>e.value)),t):(Object.keys(e).forEach(n=>{let r=e[n];if(r!==null)switch(n){case`name`:if(t.srsCode)break;t.name=r,t.srsCode=r;break;case`type`:r===`GeographicCRS`?t.projName=`longlat`:r===`GeodeticCRS`?e.coordinate_system&&e.coordinate_system.subtype===`Cartesian`?t.projName=`geocent`:t.projName=`longlat`:r===`ProjectedCRS`&&e.conversion&&e.conversion.method&&(t.projName=e.conversion.method.name);break;case`datum`:case`datum_ensemble`:r.ellipsoid&&(t.ellps=r.ellipsoid.name,Ef(r,t)),r.prime_meridian&&(t.from_greenwich=r.prime_meridian.longitude*Math.PI/180);break;case`ellipsoid`:t.ellps=r.name,Ef(r,t);break;case`prime_meridian`:t.long0=(r.longitude||0)*Math.PI/180;break;case`coordinate_system`:if(r.axis){let e={east:`e`,north:`n`,west:`w`,south:`s`,up:`u`,down:`d`,geocentricx:`e`,geocentricy:`n`,geocentricz:`u`},n=r.axis.map(t=>e[t.direction.toLowerCase()]);if(n.every(Boolean)&&(t.axis=n.join(``),t.axis.length===2&&(t.axis+=`u`)),r.unit){let{units:e,to_meter:n}=wf(r.unit);t.units=e,t.to_meter=n}else if(r.axis[0]&&r.axis[0].unit){let{units:e,to_meter:n}=wf(r.axis[0].unit);t.units=e,t.to_meter=n}}break;case`id`:r.authority&&r.code&&(t.title=r.authority+`:`+r.code);break;case`conversion`:r.method&&r.method.name&&(t.projName=r.method.name),r.parameters&&r.parameters.forEach(e=>{let n=e.name.toLowerCase().replace(/\s+/g,`_`),r=e.value;e.unit&&e.unit.conversion_factor?t[n]=r*e.unit.conversion_factor:e.unit===`degree`?t[n]=r*Math.PI/180:t[n]=r});break;case`unit`:r.name&&(t.units=r.name.toLowerCase(),t.units===`metre`&&(t.units=`meter`)),r.conversion_factor&&(t.to_meter=r.conversion_factor);break;case`base_crs`:Df(r,t),t.datumCode=r.id?r.id.authority+`_`+r.id.code:r.name;break;default:break}}),t.latitude_of_false_origin!==void 0&&(t.lat0=t.latitude_of_false_origin),t.longitude_of_false_origin!==void 0&&(t.long0=t.longitude_of_false_origin),t.latitude_of_standard_parallel!==void 0&&(t.lat0=t.latitude_of_standard_parallel,t.lat1=t.latitude_of_standard_parallel),t.latitude_of_1st_standard_parallel!==void 0&&(t.lat1=t.latitude_of_1st_standard_parallel),t.latitude_of_2nd_standard_parallel!==void 0&&(t.lat2=t.latitude_of_2nd_standard_parallel),t.latitude_of_projection_centre!==void 0&&(t.lat0=t.latitude_of_projection_centre),t.longitude_of_projection_centre!==void 0&&(t.longc=t.longitude_of_projection_centre),t.easting_at_false_origin!==void 0&&(t.x0=t.easting_at_false_origin),t.northing_at_false_origin!==void 0&&(t.y0=t.northing_at_false_origin),t.latitude_of_natural_origin!==void 0&&(t.lat0=t.latitude_of_natural_origin),t.longitude_of_natural_origin!==void 0&&(t.long0=t.longitude_of_natural_origin),t.longitude_of_origin!==void 0&&(t.long0=t.longitude_of_origin),t.false_easting!==void 0&&(t.x0=t.false_easting),t.easting_at_projection_centre&&(t.x0=t.easting_at_projection_centre),t.false_northing!==void 0&&(t.y0=t.false_northing),t.northing_at_projection_centre&&(t.y0=t.northing_at_projection_centre),t.standard_parallel_1!==void 0&&(t.lat1=t.standard_parallel_1),t.standard_parallel_2!==void 0&&(t.lat2=t.standard_parallel_2),t.scale_factor_at_natural_origin!==void 0&&(t.k0=t.scale_factor_at_natural_origin),t.scale_factor_at_projection_centre!==void 0&&(t.k0=t.scale_factor_at_projection_centre),t.scale_factor_on_pseudo_standard_parallel!==void 0&&(t.k0=t.scale_factor_on_pseudo_standard_parallel),t.azimuth!==void 0&&(t.alpha=t.azimuth),t.azimuth_at_projection_centre!==void 0&&(t.alpha=t.azimuth_at_projection_centre),t.angle_from_rectified_to_skew_grid&&(t.rectified_grid_angle=t.angle_from_rectified_to_skew_grid),Cf(t),t)}var Of=[`PROJECTEDCRS`,`PROJCRS`,`GEOGCS`,`GEOCCS`,`PROJCS`,`LOCAL_CS`,`GEODCRS`,`GEODETICCRS`,`GEODETICDATUM`,`ENGCRS`,`ENGINEERINGCRS`];function kf(e,t){var n=t[0],r=t[1];!(n in e)&&r in e&&(e[n]=e[r],t.length===3&&(e[n]=t[2](e[n])))}function Af(e){for(var t=Object.keys(e),n=0,r=t.length;n<r;++n){var i=t[n];Of.indexOf(i)!==-1&&jf(e[i]),typeof e[i]==`object`&&Af(e[i])}}function jf(e){if(e.AUTHORITY){var t=Object.keys(e.AUTHORITY)[0];t&&t in e.AUTHORITY&&(e.title=t+`:`+e.AUTHORITY[t])}if(e.type===`GEOGCS`?e.projName=`longlat`:e.type===`LOCAL_CS`?(e.projName=`identity`,e.local=!0):typeof e.PROJECTION==`object`?e.projName=Object.keys(e.PROJECTION)[0]:e.projName=e.PROJECTION,e.AXIS){for(var n=``,r=0,i=e.AXIS.length;r<i;++r){var a=[e.AXIS[r][0].toLowerCase(),e.AXIS[r][1].toLowerCase()];a[0].indexOf(`north`)!==-1||(a[0]===`y`||a[0]===`lat`)&&a[1]===`north`?n+=`n`:a[0].indexOf(`south`)!==-1||(a[0]===`y`||a[0]===`lat`)&&a[1]===`south`?n+=`s`:a[0].indexOf(`east`)!==-1||(a[0]===`x`||a[0]===`lon`)&&a[1]===`east`?n+=`e`:(a[0].indexOf(`west`)!==-1||(a[0]===`x`||a[0]===`lon`)&&a[1]===`west`)&&(n+=`w`)}n.length===2&&(n+=`u`),n.length===3&&(e.axis=n)}e.UNIT&&(e.units=e.UNIT.name.toLowerCase(),e.units===`metre`&&(e.units=`meter`),e.UNIT.convert&&(e.type===`GEOGCS`?e.DATUM&&e.DATUM.SPHEROID&&(e.to_meter=e.UNIT.convert*e.DATUM.SPHEROID.a):e.to_meter=e.UNIT.convert));var o=e.GEOGCS;e.type===`GEOGCS`&&(o=e),o&&(o.PRIMEM&&o.PRIMEM.convert&&(e.from_greenwich=Sf(o.PRIMEM.convert)),o.DATUM?e.datumCode=o.DATUM.name.toLowerCase():e.datumCode=o.name.toLowerCase(),e.datumCode.slice(0,2)===`d_`&&(e.datumCode=e.datumCode.slice(2)),e.datumCode===`new_zealand_1949`&&(e.datumCode=`nzgd49`),(e.datumCode===`wgs_1984`||e.datumCode===`world_geodetic_system_1984`)&&(e.PROJECTION===`Mercator_Auxiliary_Sphere`&&(e.sphere=!0),e.datumCode=`wgs84`),e.datumCode===`belge_1972`&&(e.datumCode=`rnb72`),o.DATUM&&o.DATUM.SPHEROID&&(e.ellps=o.DATUM.SPHEROID.name.replace(`_19`,``).replace(/[Cc]larke\_18/,`clrk`),e.ellps.toLowerCase().slice(0,13)===`international`&&(e.ellps=`intl`),e.a=o.DATUM.SPHEROID.a,e.rf=parseFloat(o.DATUM.SPHEROID.rf)),o.DATUM&&o.DATUM.TOWGS84&&(e.datum_params=o.DATUM.TOWGS84),~e.datumCode.indexOf(`osgb_1936`)&&(e.datumCode=`osgb36`),~e.datumCode.indexOf(`osni_1952`)&&(e.datumCode=`osni52`),(~e.datumCode.indexOf(`tm65`)||~e.datumCode.indexOf(`geodetic_datum_of_1965`))&&(e.datumCode=`ire65`),e.datumCode===`ch1903+`&&(e.datumCode=`ch1903`),~e.datumCode.indexOf(`israel`)&&(e.datumCode=`isr93`)),e.b&&!isFinite(e.b)&&(e.b=e.a),e.rectified_grid_angle&&=Sf(e.rectified_grid_angle);function s(t){return t*(e.to_meter||1)}[[`standard_parallel_1`,`Standard_Parallel_1`],[`standard_parallel_1`,`Latitude of 1st standard parallel`],[`standard_parallel_2`,`Standard_Parallel_2`],[`standard_parallel_2`,`Latitude of 2nd standard parallel`],[`false_easting`,`False_Easting`],[`false_easting`,`False easting`],[`false-easting`,`Easting at false origin`],[`false_northing`,`False_Northing`],[`false_northing`,`False northing`],[`false_northing`,`Northing at false origin`],[`central_meridian`,`Central_Meridian`],[`central_meridian`,`Longitude of natural origin`],[`central_meridian`,`Longitude of false origin`],[`latitude_of_origin`,`Latitude_Of_Origin`],[`latitude_of_origin`,`Central_Parallel`],[`latitude_of_origin`,`Latitude of natural origin`],[`latitude_of_origin`,`Latitude of false origin`],[`scale_factor`,`Scale_Factor`],[`k0`,`scale_factor`],[`latitude_of_center`,`Latitude_Of_Center`],[`latitude_of_center`,`Latitude_of_center`],[`lat0`,`latitude_of_center`,Sf],[`longitude_of_center`,`Longitude_Of_Center`],[`longitude_of_center`,`Longitude_of_center`],[`longc`,`longitude_of_center`,Sf],[`x0`,`false_easting`,s],[`y0`,`false_northing`,s],[`long0`,`central_meridian`,Sf],[`lat0`,`latitude_of_origin`,Sf],[`lat0`,`standard_parallel_1`,Sf],[`lat1`,`standard_parallel_1`,Sf],[`lat2`,`standard_parallel_2`,Sf],[`azimuth`,`Azimuth`],[`alpha`,`azimuth`,Sf],[`srsCode`,`name`]].forEach(function(t){return kf(e,t)}),Cf(e)}function Mf(e){if(typeof e==`object`)return Df(e);let t=rf(e);var n=af(e);if(t===`WKT2`)return Df(nf(n));var r=n[0],i={};return bf(n,i),Af(i),i[r]}function Nf(e){var t=this;if(arguments.length===2){var n=arguments[1];typeof n==`string`?n.charAt(0)===`+`?Nf[e]=ef(arguments[1]):Nf[e]=Mf(arguments[1]):n&&typeof n==`object`&&!(`projName`in n)?Nf[e]=Mf(arguments[1]):(Nf[e]=n,n||delete Nf[e])}else if(arguments.length===1){if(Array.isArray(e))return e.map(function(e){return Array.isArray(e)?Nf.apply(t,e):Nf(e)});if(typeof e==`string`){if(e in Nf)return Nf[e]}else`EPSG`in e?Nf[`EPSG:`+e.EPSG]=e:`ESRI`in e?Nf[`ESRI:`+e.ESRI]=e:`IAU2000`in e?Nf[`IAU2000:`+e.IAU2000]=e:console.log(e);return}}Id(Nf);function Pf(e){return typeof e==`string`}function Ff(e){return e in Nf}function If(e){return e.indexOf(`+`)!==0&&e.indexOf(`[`)!==-1||typeof e==`object`&&!(`srsCode`in e)}var Lf=[`3857`,`900913`,`3785`,`102113`];function Rf(e){if(e.title)return e.title.toLowerCase().indexOf(`epsg:`)===0&&Lf.indexOf(e.title.substr(5))>-1;var t=$d(e,`authority`);if(t){var n=$d(t,`epsg`);return n&&Lf.indexOf(n)>-1}}function zf(e){var t=$d(e,`extension`);if(t)return $d(t,`proj4`)}function Bf(e){return e[0]===`+`}function Vf(e){let t;if(Pf(e))if(Ff(e))t=Nf[e];else if(If(e)){t=Mf(e);var n=zf(t);n&&(t=ef(n))}else Bf(e)&&(t=ef(e));else t=`projName`in e?e:Mf(e);return t&&Rf(t)?Nf[`EPSG:3857`]:t}function Hf(e,t){e||={};var n,r;if(!t)return e;for(r in t)n=t[r],n!==void 0&&(e[r]=n);return e}function Uf(e,t,n){var r=e*t;return n/Math.sqrt(1-r*r)}function Wf(e){return e<0?-1:1}function Y(e,t){return t||Math.abs(e)<=3.14159265359?e:e-Wf(e)*Jd}function Gf(e,t,n){var r=e*n,i=.5*e;return r=((1-r)/(1+r))**i,Math.tan(.5*(J-t))/r}function Kf(e,t){for(var n=.5*e,r,i,a=J-2*Math.atan(t),o=0;o<=15;o++)if(r=e*Math.sin(a),i=J-2*Math.atan(t*((1-r)/(1+r))**n)-a,a+=i,Math.abs(i)<=1e-10)return a;return-9999}function qf(){var e=this.b/this.a;this.es=1-e*e,`x0`in this||(this.x0=0),`y0`in this||(this.y0=0),this.long0=this.long0||0,this.e=Math.sqrt(this.es),this.lat_ts?this.sphere?this.k0=Math.cos(this.lat_ts):this.k0=Uf(this.e,Math.sin(this.lat_ts),Math.cos(this.lat_ts)):this.k0||(this.k?this.k0=this.k:this.k0=1)}function Jf(e){var t=e.x,n=e.y;if(n*57.29577951308232>90&&n*57.29577951308232<-90&&t*57.29577951308232>180&&t*57.29577951308232<-180)return null;var r,i;if(Math.abs(Math.abs(n)-J)<=1e-10)return null;if(this.sphere)r=this.x0+this.a*this.k0*Y(t-this.long0,this.over),i=this.y0+this.a*this.k0*Math.log(Math.tan(qd+.5*n));else{var a=Math.sin(n),o=Gf(this.e,n,a);r=this.x0+this.a*this.k0*Y(t-this.long0,this.over),i=this.y0-this.a*this.k0*Math.log(o)}return e.x=r,e.y=i,e}function Yf(e){var t=e.x-this.x0,n=e.y-this.y0,r,i;if(this.sphere)i=J-2*Math.atan(Math.exp(-n/(this.a*this.k0)));else{var a=Math.exp(-n/(this.a*this.k0));if(i=Kf(this.e,a),i===-9999)return null}return r=Y(this.long0+t/(this.a*this.k0),this.over),e.x=r,e.y=i,e}var Xf={init:qf,forward:Jf,inverse:Yf,names:[`Mercator`,`Popular Visualisation Pseudo Mercator`,`Mercator_1SP`,`Mercator_Auxiliary_Sphere`,`Mercator_Variant_A`,`merc`]};function Zf(){}function Qf(e){return e}var $f=[`longlat`,`identity`],ep=[Xf,{init:Zf,forward:Qf,inverse:Qf,names:$f}],tp={},np=[];function rp(e,t){var n=np.length;return e.names?(np[n]=e,e.names.forEach(function(e){tp[e.toLowerCase()]=n}),this):(console.log(t),!0)}function ip(e){return e.replace(/[-\(\)\s]+/g,` `).trim().replace(/ /g,`_`)}function ap(e){if(!e)return!1;var t=e.toLowerCase();if(tp[t]!==void 0&&np[tp[t]]||(t=ip(t),t in tp&&np[tp[t]]))return np[tp[t]]}function op(){ep.forEach(rp)}var sp={start:op,add:rp,get:ap},cp={MERIT:{a:6378137,rf:298.257,ellipseName:`MERIT 1983`},SGS85:{a:6378136,rf:298.257,ellipseName:`Soviet Geodetic System 85`},GRS80:{a:6378137,rf:298.257222101,ellipseName:`GRS 1980(IUGG, 1980)`},IAU76:{a:6378140,rf:298.257,ellipseName:`IAU 1976`},airy:{a:6377563.396,b:6356256.91,ellipseName:`Airy 1830`},APL4:{a:6378137,rf:298.25,ellipseName:`Appl. Physics. 1965`},NWL9D:{a:6378145,rf:298.25,ellipseName:`Naval Weapons Lab., 1965`},mod_airy:{a:6377340.189,b:6356034.446,ellipseName:`Modified Airy`},andrae:{a:6377104.43,rf:300,ellipseName:`Andrae 1876 (Den., Iclnd.)`},aust_SA:{a:6378160,rf:298.25,ellipseName:`Australian Natl & S. Amer. 1969`},GRS67:{a:6378160,rf:298.247167427,ellipseName:`GRS 67(IUGG 1967)`},bessel:{a:6377397.155,rf:299.1528128,ellipseName:`Bessel 1841`},bess_nam:{a:6377483.865,rf:299.1528128,ellipseName:`Bessel 1841 (Namibia)`},clrk66:{a:6378206.4,b:6356583.8,ellipseName:`Clarke 1866`},clrk80:{a:6378249.145,rf:293.4663,ellipseName:`Clarke 1880 mod.`},clrk80ign:{a:6378249.2,b:6356515,rf:293.4660213,ellipseName:`Clarke 1880 (IGN)`},clrk58:{a:6378293.645208759,rf:294.2606763692654,ellipseName:`Clarke 1858`},CPM:{a:6375738.7,rf:334.29,ellipseName:`Comm. des Poids et Mesures 1799`},delmbr:{a:6376428,rf:311.5,ellipseName:`Delambre 1810 (Belgium)`},engelis:{a:6378136.05,rf:298.2566,ellipseName:`Engelis 1985`},evrst30:{a:6377276.345,rf:300.8017,ellipseName:`Everest 1830`},evrst48:{a:6377304.063,rf:300.8017,ellipseName:`Everest 1948`},evrst56:{a:6377301.243,rf:300.8017,ellipseName:`Everest 1956`},evrst69:{a:6377295.664,rf:300.8017,ellipseName:`Everest 1969`},evrstSS:{a:6377298.556,rf:300.8017,ellipseName:`Everest (Sabah & Sarawak)`},fschr60:{a:6378166,rf:298.3,ellipseName:`Fischer (Mercury Datum) 1960`},fschr60m:{a:6378155,rf:298.3,ellipseName:`Fischer 1960`},fschr68:{a:6378150,rf:298.3,ellipseName:`Fischer 1968`},helmert:{a:6378200,rf:298.3,ellipseName:`Helmert 1906`},hough:{a:6378270,rf:297,ellipseName:`Hough`},intl:{a:6378388,rf:297,ellipseName:`International 1909 (Hayford)`},kaula:{a:6378163,rf:298.24,ellipseName:`Kaula 1961`},lerch:{a:6378139,rf:298.257,ellipseName:`Lerch 1979`},mprts:{a:6397300,rf:191,ellipseName:`Maupertius 1738`},new_intl:{a:6378157.5,b:6356772.2,ellipseName:`New International 1967`},plessis:{a:6376523,b:6355863,ellipseName:`Plessis 1817 (France)`},krass:{a:6378245,rf:298.3,ellipseName:`Krassovsky, 1942`},SEasia:{a:6378155,b:6356773.3205,ellipseName:`Southeast Asia`},walbeck:{a:6376896,b:6355834.8467,ellipseName:`Walbeck`},WGS60:{a:6378165,rf:298.3,ellipseName:`WGS 60`},WGS66:{a:6378145,rf:298.25,ellipseName:`WGS 66`},WGS7:{a:6378135,rf:298.26,ellipseName:`WGS 72`},WGS84:{a:6378137,rf:298.257223563,ellipseName:`WGS 84`},sphere:{a:6370997,b:6370997,ellipseName:`Normal Sphere (r=6370997)`}},lp=cp.WGS84;function up(e,t,n,r){var i=e*e,a=t*t,o=(i-a)/i,s=0;r?(e*=1-o*(Vd+o*(Hd+o*Ud)),i=e*e,o=0):s=Math.sqrt(o);var c=(i-a)/a;return{es:o,e:s,ep2:c}}function dp(e,t,n,r,i){if(!e){var a=$d(cp,r);a||=lp,e=a.a,t=a.b,n=a.rf}return n&&!t&&(t=(1-1/n)*e),(n===0||Math.abs(e-t)<1e-10)&&(i=!0,t=e),{a:e,b:t,rf:n,sphere:i}}var fp={wgs84:{towgs84:`0,0,0`,ellipse:`WGS84`,datumName:`WGS84`},ch1903:{towgs84:`674.374,15.056,405.346`,ellipse:`bessel`,datumName:`swiss`},ggrs87:{towgs84:`-199.87,74.79,246.62`,ellipse:`GRS80`,datumName:`Greek_Geodetic_Reference_System_1987`},nad83:{towgs84:`0,0,0`,ellipse:`GRS80`,datumName:`North_American_Datum_1983`},nad27:{nadgrids:`@conus,@alaska,@ntv2_0.gsb,@ntv1_can.dat`,ellipse:`clrk66`,datumName:`North_American_Datum_1927`},potsdam:{towgs84:`598.1,73.7,418.2,0.202,0.045,-2.455,6.7`,ellipse:`bessel`,datumName:`Potsdam Rauenberg 1950 DHDN`},carthage:{towgs84:`-263.0,6.0,431.0`,ellipse:`clrk80ign`,datumName:`Carthage 1934 Tunisia`},hermannskogel:{towgs84:`577.326,90.129,463.919,5.137,1.474,5.297,2.4232`,ellipse:`bessel`,datumName:`Hermannskogel`},mgi:{towgs84:`577.326,90.129,463.919,5.137,1.474,5.297,2.4232`,ellipse:`bessel`,datumName:`Militar-Geographische Institut`},osni52:{towgs84:`482.530,-130.596,564.557,-1.042,-0.214,-0.631,8.15`,ellipse:`airy`,datumName:`Irish National`},ire65:{towgs84:`482.530,-130.596,564.557,-1.042,-0.214,-0.631,8.15`,ellipse:`mod_airy`,datumName:`Ireland 1965`},rassadiran:{towgs84:`-133.63,-157.5,-158.62`,ellipse:`intl`,datumName:`Rassadiran`},nzgd49:{towgs84:`59.47,-5.04,187.44,0.47,-0.1,1.024,-4.5993`,ellipse:`intl`,datumName:`New Zealand Geodetic Datum 1949`},osgb36:{towgs84:`446.448,-125.157,542.060,0.1502,0.2470,0.8421,-20.4894`,ellipse:`airy`,datumName:`Ordnance Survey of Great Britain 1936`},s_jtsk:{towgs84:`589,76,480`,ellipse:`bessel`,datumName:`S-JTSK (Ferro)`},beduaram:{towgs84:`-106,-87,188`,ellipse:`clrk80`,datumName:`Beduaram`},gunung_segara:{towgs84:`-403,684,41`,ellipse:`bessel`,datumName:`Gunung Segara Jakarta`},rnb72:{towgs84:`106.869,-52.2978,103.724,-0.33657,0.456955,-1.84218,1`,ellipse:`intl`,datumName:`Reseau National Belge 1972`},EPSG_5451:{towgs84:`6.41,-49.05,-11.28,1.5657,0.5242,6.9718,-5.7649`},IGNF_LURESG:{towgs84:`-192.986,13.673,-39.309,-0.4099,-2.9332,2.6881,0.43`},EPSG_4614:{towgs84:`-119.4248,-303.65872,-11.00061,1.164298,0.174458,1.096259,3.657065`},EPSG_4615:{towgs84:`-494.088,-312.129,279.877,-1.423,-1.013,1.59,-0.748`},ESRI_37241:{towgs84:`-76.822,257.457,-12.817,2.136,-0.033,-2.392,-0.031`},ESRI_37249:{towgs84:`-440.296,58.548,296.265,1.128,10.202,4.559,-0.438`},ESRI_37245:{towgs84:`-511.151,-181.269,139.609,1.05,2.703,1.798,3.071`},EPSG_4178:{towgs84:`24.9,-126.4,-93.2,-0.063,-0.247,-0.041,1.01`},EPSG_4622:{towgs84:`-472.29,-5.63,-304.12,0.4362,-0.8374,0.2563,1.8984`},EPSG_4625:{towgs84:`126.93,547.94,130.41,-2.7867,5.1612,-0.8584,13.8227`},EPSG_5252:{towgs84:`0.023,0.036,-0.068,0.00176,0.00912,-0.01136,0.00439`},EPSG_4314:{towgs84:`597.1,71.4,412.1,0.894,0.068,-1.563,7.58`},EPSG_4282:{towgs84:`-178.3,-316.7,-131.5,5.278,6.077,10.979,19.166`},EPSG_4231:{towgs84:`-83.11,-97.38,-117.22,0.005693,-0.044698,0.044285,0.1218`},EPSG_4274:{towgs84:`-230.994,102.591,25.199,0.633,-0.239,0.9,1.95`},EPSG_4134:{towgs84:`-180.624,-225.516,173.919,-0.81,-1.898,8.336,16.71006`},EPSG_4254:{towgs84:`18.38,192.45,96.82,0.056,-0.142,-0.2,-0.0013`},EPSG_4159:{towgs84:`-194.513,-63.978,-25.759,-3.4027,3.756,-3.352,-0.9175`},EPSG_4687:{towgs84:`0.072,-0.507,-0.245,0.0183,-0.0003,0.007,-0.0093`},EPSG_4227:{towgs84:`-83.58,-397.54,458.78,-17.595,-2.847,4.256,3.225`},EPSG_4746:{towgs84:`599.4,72.4,419.2,-0.062,-0.022,-2.723,6.46`},EPSG_4745:{towgs84:`612.4,77,440.2,-0.054,0.057,-2.797,2.55`},EPSG_6311:{towgs84:`8.846,-4.394,-1.122,-0.00237,-0.146528,0.130428,0.783926`},EPSG_4289:{towgs84:`565.7381,50.4018,465.2904,-0.395026,0.330772,-1.876073,4.07244`},EPSG_4230:{towgs84:`-68.863,-134.888,-111.49,-0.53,-0.14,0.57,-3.4`},EPSG_4154:{towgs84:`-123.02,-158.95,-168.47`},EPSG_4156:{towgs84:`570.8,85.7,462.8,4.998,1.587,5.261,3.56`},EPSG_4299:{towgs84:`482.5,-130.6,564.6,-1.042,-0.214,-0.631,8.15`},EPSG_4179:{towgs84:`33.4,-146.6,-76.3,-0.359,-0.053,0.844,-0.84`},EPSG_4313:{towgs84:`-106.8686,52.2978,-103.7239,0.3366,-0.457,1.8422,-1.2747`},EPSG_4194:{towgs84:`163.511,127.533,-159.789`},EPSG_4195:{towgs84:`105,326,-102.5`},EPSG_4196:{towgs84:`-45,417,-3.5`},EPSG_4611:{towgs84:`-162.619,-276.959,-161.764,0.067753,-2.243648,-1.158828,-1.094246`},EPSG_4633:{towgs84:`137.092,131.66,91.475,-1.9436,-11.5993,-4.3321,-7.4824`},EPSG_4641:{towgs84:`-408.809,366.856,-412.987,1.8842,-0.5308,2.1655,-121.0993`},EPSG_4643:{towgs84:`-480.26,-438.32,-643.429,16.3119,20.1721,-4.0349,-111.7002`},EPSG_4300:{towgs84:`482.5,-130.6,564.6,-1.042,-0.214,-0.631,8.15`},EPSG_4188:{towgs84:`482.5,-130.6,564.6,-1.042,-0.214,-0.631,8.15`},EPSG_4660:{towgs84:`982.6087,552.753,-540.873,6.681627,-31.611492,-19.848161,16.805`},EPSG_4662:{towgs84:`97.295,-263.247,310.882,-1.5999,0.8386,3.1409,13.3259`},EPSG_3906:{towgs84:`577.88891,165.22205,391.18289,4.9145,-0.94729,-13.05098,7.78664`},EPSG_4307:{towgs84:`-209.3622,-87.8162,404.6198,0.0046,3.4784,0.5805,-1.4547`},EPSG_6892:{towgs84:`-76.269,-16.683,68.562,-6.275,10.536,-4.286,-13.686`},EPSG_4690:{towgs84:`221.597,152.441,176.523,2.403,1.3893,0.884,11.4648`},EPSG_4691:{towgs84:`218.769,150.75,176.75,3.5231,2.0037,1.288,10.9817`},EPSG_4629:{towgs84:`72.51,345.411,79.241,-1.5862,-0.8826,-0.5495,1.3653`},EPSG_4630:{towgs84:`165.804,216.213,180.26,-0.6251,-0.4515,-0.0721,7.4111`},EPSG_4692:{towgs84:`217.109,86.452,23.711,0.0183,-0.0003,0.007,-0.0093`},EPSG_9333:{towgs84:`0,0,0,-0.008393,0.000749,-0.010276,0`},EPSG_9059:{towgs84:`0,0,0`},EPSG_4312:{towgs84:`601.705,84.263,485.227,4.7354,1.3145,5.393,-2.3887`},EPSG_4123:{towgs84:`-96.062,-82.428,-121.753,4.801,0.345,-1.376,1.496`},EPSG_4309:{towgs84:`-124.45,183.74,44.64,-0.4384,0.5446,-0.9706,-2.1365`},ESRI_104106:{towgs84:`-283.088,-70.693,117.445,-1.157,0.059,-0.652,-4.058`},EPSG_4281:{towgs84:`-219.247,-73.802,269.529`},EPSG_4322:{towgs84:`0,0,4.5`},EPSG_4324:{towgs84:`0,0,1.9`},EPSG_4284:{towgs84:`43.822,-108.842,-119.585,1.455,-0.761,0.737,0.549`},EPSG_4277:{towgs84:`446.448,-125.157,542.06,0.15,0.247,0.842,-20.489`},EPSG_4207:{towgs84:`-282.1,-72.2,120,-1.529,0.145,-0.89,-4.46`},EPSG_4688:{towgs84:`347.175,1077.618,2623.677,33.9058,-70.6776,9.4013,186.0647`},EPSG_4689:{towgs84:`410.793,54.542,80.501,-2.5596,-2.3517,-0.6594,17.3218`},EPSG_4720:{towgs84:`0,0,4.5`},EPSG_4273:{towgs84:`278.3,93,474.5,7.889,0.05,-6.61,6.21`},EPSG_4240:{towgs84:`204.64,834.74,293.8`},EPSG_4817:{towgs84:`278.3,93,474.5,7.889,0.05,-6.61,6.21`},ESRI_104131:{towgs84:`426.62,142.62,460.09,4.98,4.49,-12.42,-17.1`},EPSG_4265:{towgs84:`-104.1,-49.1,-9.9,0.971,-2.917,0.714,-11.68`},EPSG_4263:{towgs84:`-111.92,-87.85,114.5,1.875,0.202,0.219,0.032`},EPSG_4298:{towgs84:`-689.5937,623.84046,-65.93566,-0.02331,1.17094,-0.80054,5.88536`},EPSG_4270:{towgs84:`-253.4392,-148.452,386.5267,0.15605,0.43,-0.1013,-0.0424`},EPSG_4229:{towgs84:`-121.8,98.1,-10.7`},EPSG_4220:{towgs84:`-55.5,-348,-229.2`},EPSG_4214:{towgs84:`12.646,-155.176,-80.863`},EPSG_4232:{towgs84:`-345,3,223`},EPSG_4238:{towgs84:`-1.977,-13.06,-9.993,0.364,0.254,0.689,-1.037`},EPSG_4168:{towgs84:`-170,33,326`},EPSG_4131:{towgs84:`199,931,318.9`},EPSG_4152:{towgs84:`-0.9102,2.0141,0.5602,0.029039,0.010065,0.010101,0`},EPSG_5228:{towgs84:`572.213,85.334,461.94,4.9732,1.529,5.2484,3.5378`},EPSG_8351:{towgs84:`485.021,169.465,483.839,7.786342,4.397554,4.102655,0`},EPSG_4683:{towgs84:`-127.62,-67.24,-47.04,-3.068,4.903,1.578,-1.06`},EPSG_4133:{towgs84:`0,0,0`},EPSG_7373:{towgs84:`0.819,-0.5762,-1.6446,-0.00378,-0.03317,0.00318,0.0693`},EPSG_9075:{towgs84:`-0.9102,2.0141,0.5602,0.029039,0.010065,0.010101,0`},EPSG_9072:{towgs84:`-0.9102,2.0141,0.5602,0.029039,0.010065,0.010101,0`},EPSG_9294:{towgs84:`1.16835,-1.42001,-2.24431,-0.00822,-0.05508,0.01818,0.23388`},EPSG_4212:{towgs84:`-267.434,173.496,181.814,-13.4704,8.7154,7.3926,14.7492`},EPSG_4191:{towgs84:`-44.183,-0.58,-38.489,2.3867,2.7072,-3.5196,-8.2703`},EPSG_4237:{towgs84:`52.684,-71.194,-13.975,-0.312,-0.1063,-0.3729,1.0191`},EPSG_4740:{towgs84:`-1.08,-0.27,-0.9`},EPSG_4124:{towgs84:`419.3836,99.3335,591.3451,0.850389,1.817277,-7.862238,-0.99496`},EPSG_5681:{towgs84:`584.9636,107.7175,413.8067,1.1155,0.2824,-3.1384,7.9922`},EPSG_4141:{towgs84:`23.772,17.49,17.859,-0.3132,-1.85274,1.67299,-5.4262`},EPSG_4204:{towgs84:`-85.645,-273.077,-79.708,2.289,-1.421,2.532,3.194`},EPSG_4319:{towgs84:`226.702,-193.337,-35.371,-2.229,-4.391,9.238,0.9798`},EPSG_4200:{towgs84:`24.82,-131.21,-82.66`},EPSG_4130:{towgs84:`0,0,0`},EPSG_4127:{towgs84:`-82.875,-57.097,-156.768,-2.158,1.524,-0.982,-0.359`},EPSG_4149:{towgs84:`674.374,15.056,405.346`},EPSG_4617:{towgs84:`-0.991,1.9072,0.5129,0.02579,0.00965,0.01166,0`},EPSG_4663:{towgs84:`-210.502,-66.902,-48.476,2.094,-15.067,-5.817,0.485`},EPSG_4664:{towgs84:`-211.939,137.626,58.3,-0.089,0.251,0.079,0.384`},EPSG_4665:{towgs84:`-105.854,165.589,-38.312,-0.003,-0.026,0.024,-0.048`},EPSG_4666:{towgs84:`631.392,-66.551,481.442,1.09,-4.445,-4.487,-4.43`},EPSG_4756:{towgs84:`-192.873,-39.382,-111.202,-0.00205,-0.0005,0.00335,0.0188`},EPSG_4723:{towgs84:`-179.483,-69.379,-27.584,-7.862,8.163,6.042,-13.925`},EPSG_4726:{towgs84:`8.853,-52.644,180.304,-0.393,-2.323,2.96,-24.081`},EPSG_4267:{towgs84:`-8.0,160.0,176.0`},EPSG_5365:{towgs84:`-0.16959,0.35312,0.51846,0.03385,-0.16325,0.03446,0.03693`},EPSG_4218:{towgs84:`304.5,306.5,-318.1`},EPSG_4242:{towgs84:`-33.722,153.789,94.959,-8.581,-4.478,4.54,8.95`},EPSG_4216:{towgs84:`-292.295,248.758,429.447,4.9971,2.99,6.6906,1.0289`},ESRI_104105:{towgs84:`631.392,-66.551,481.442,1.09,-4.445,-4.487,-4.43`},ESRI_104129:{towgs84:`0,0,0`},EPSG_4673:{towgs84:`174.05,-25.49,112.57`},EPSG_4202:{towgs84:`-124,-60,154`},EPSG_4203:{towgs84:`-117.763,-51.51,139.061,0.292,0.443,0.277,-0.191`},EPSG_3819:{towgs84:`595.48,121.69,515.35,4.115,-2.9383,0.853,-3.408`},EPSG_8694:{towgs84:`-93.799,-132.737,-219.073,-1.844,0.648,-6.37,-0.169`},EPSG_4145:{towgs84:`275.57,676.78,229.6`},EPSG_4283:{towgs84:`0.06155,-0.01087,-0.04019,0.039492,0.032722,0.032898,-0.009994`},EPSG_4317:{towgs84:`2.3287,-147.0425,-92.0802,-0.309248,0.324822,0.497299,5.689063`},EPSG_4272:{towgs84:`59.47,-5.04,187.44,0.47,-0.1,1.024,-4.5993`},EPSG_4248:{towgs84:`-307.7,265.3,-363.5`},EPSG_5561:{towgs84:`24,-121,-76`},EPSG_5233:{towgs84:`-0.293,766.95,87.713,0.195704,1.695068,3.473016,-0.039338`},ESRI_104130:{towgs84:`-86,-98,-119`},ESRI_104102:{towgs84:`682,-203,480`},ESRI_37207:{towgs84:`7,-10,-26`},EPSG_4675:{towgs84:`59.935,118.4,-10.871`},ESRI_104109:{towgs84:`-89.121,-348.182,260.871`},ESRI_104112:{towgs84:`-185.583,-230.096,281.361`},ESRI_104113:{towgs84:`25.1,-275.6,222.6`},IGNF_WGS72G:{towgs84:`0,12,6`},IGNF_NTFG:{towgs84:`-168,-60,320`},IGNF_EFATE57G:{towgs84:`-127,-769,472`},IGNF_PGP50G:{towgs84:`324.8,153.6,172.1`},IGNF_REUN47G:{towgs84:`94,-948,-1262`},IGNF_CSG67G:{towgs84:`-186,230,110`},IGNF_GUAD48G:{towgs84:`-467,-16,-300`},IGNF_TAHI51G:{towgs84:`162,117,154`},IGNF_TAHAAG:{towgs84:`65,342,77`},IGNF_NUKU72G:{towgs84:`84,274,65`},IGNF_PETRELS72G:{towgs84:`365,194,166`},IGNF_WALL78G:{towgs84:`253,-133,-127`},IGNF_MAYO50G:{towgs84:`-382,-59,-262`},IGNF_TANNAG:{towgs84:`-139,-967,436`},IGNF_IGN72G:{towgs84:`-13,-348,292`},IGNF_ATIGG:{towgs84:`1118,23,66`},IGNF_FANGA84G:{towgs84:`150.57,158.33,118.32`},IGNF_RUSAT84G:{towgs84:`202.13,174.6,-15.74`},IGNF_KAUE70G:{towgs84:`126.74,300.1,-75.49`},IGNF_MOP90G:{towgs84:`-10.8,-1.8,12.77`},IGNF_MHPF67G:{towgs84:`338.08,212.58,-296.17`},IGNF_TAHI79G:{towgs84:`160.61,116.05,153.69`},IGNF_ANAA92G:{towgs84:`1.5,3.84,4.81`},IGNF_MARQUI72G:{towgs84:`330.91,-13.92,58.56`},IGNF_APAT86G:{towgs84:`143.6,197.82,74.05`},IGNF_TUBU69G:{towgs84:`237.17,171.61,-77.84`},IGNF_STPM50G:{towgs84:`11.363,424.148,373.13`},EPSG_4150:{towgs84:`674.374,15.056,405.346`},EPSG_4754:{towgs84:`-208.4058,-109.8777,-2.5764`},ESRI_104101:{towgs84:`372.87,149.23,585.29`},EPSG_4693:{towgs84:`0,-0.15,0.68`},EPSG_6207:{towgs84:`293.17,726.18,245.36`},EPSG_4153:{towgs84:`-133.63,-157.5,-158.62`},EPSG_4132:{towgs84:`-241.54,-163.64,396.06`},EPSG_4221:{towgs84:`-154.5,150.7,100.4`},EPSG_4266:{towgs84:`-80.7,-132.5,41.1`},EPSG_4193:{towgs84:`-70.9,-151.8,-41.4`},EPSG_5340:{towgs84:`-0.41,0.46,-0.35`},EPSG_4246:{towgs84:`-294.7,-200.1,525.5`},EPSG_4318:{towgs84:`-3.2,-5.7,2.8`},EPSG_4121:{towgs84:`-199.87,74.79,246.62`},EPSG_4223:{towgs84:`-260.1,5.5,432.2`},EPSG_4158:{towgs84:`-0.465,372.095,171.736`},EPSG_4285:{towgs84:`-128.16,-282.42,21.93`},EPSG_4613:{towgs84:`-404.78,685.68,45.47`},EPSG_4607:{towgs84:`195.671,332.517,274.607`},EPSG_4475:{towgs84:`-381.788,-57.501,-256.673`},EPSG_4208:{towgs84:`-157.84,308.54,-146.6`},EPSG_4743:{towgs84:`70.995,-335.916,262.898`},EPSG_4710:{towgs84:`-323.65,551.39,-491.22`},EPSG_7881:{towgs84:`-0.077,0.079,0.086`},EPSG_4682:{towgs84:`283.729,735.942,261.143`},EPSG_4739:{towgs84:`-156,-271,-189`},EPSG_4679:{towgs84:`-80.01,253.26,291.19`},EPSG_4750:{towgs84:`-56.263,16.136,-22.856`},EPSG_4644:{towgs84:`-10.18,-350.43,291.37`},EPSG_4695:{towgs84:`-103.746,-9.614,-255.95`},EPSG_4292:{towgs84:`-355,21,72`},EPSG_4302:{towgs84:`-61.702,284.488,472.052`},EPSG_4143:{towgs84:`-124.76,53,466.79`},EPSG_4606:{towgs84:`-153,153,307`},EPSG_4699:{towgs84:`-770.1,158.4,-498.2`},EPSG_4247:{towgs84:`-273.5,110.6,-357.9`},EPSG_4160:{towgs84:`8.88,184.86,106.69`},EPSG_4161:{towgs84:`-233.43,6.65,173.64`},EPSG_9251:{towgs84:`-9.5,122.9,138.2`},EPSG_9253:{towgs84:`-78.1,101.6,133.3`},EPSG_4297:{towgs84:`-198.383,-240.517,-107.909`},EPSG_4269:{towgs84:`0,0,0`},EPSG_4301:{towgs84:`-147,506,687`},EPSG_4618:{towgs84:`-59,-11,-52`},EPSG_4612:{towgs84:`0,0,0`},EPSG_4678:{towgs84:`44.585,-131.212,-39.544`},EPSG_4250:{towgs84:`-130,29,364`},EPSG_4144:{towgs84:`214,804,268`},EPSG_4147:{towgs84:`-17.51,-108.32,-62.39`},EPSG_4259:{towgs84:`-254.1,-5.36,-100.29`},EPSG_4164:{towgs84:`-76,-138,67`},EPSG_4211:{towgs84:`-378.873,676.002,-46.255`},EPSG_4182:{towgs84:`-422.651,-172.995,84.02`},EPSG_4224:{towgs84:`-143.87,243.37,-33.52`},EPSG_4225:{towgs84:`-205.57,168.77,-4.12`},EPSG_5527:{towgs84:`-67.35,3.88,-38.22`},EPSG_4752:{towgs84:`98,390,-22`},EPSG_4310:{towgs84:`-30,190,89`},EPSG_9248:{towgs84:`-192.26,65.72,132.08`},EPSG_4680:{towgs84:`124.5,-63.5,-281`},EPSG_4701:{towgs84:`-79.9,-158,-168.9`},EPSG_4706:{towgs84:`-146.21,112.63,4.05`},EPSG_4805:{towgs84:`682,-203,480`},EPSG_4201:{towgs84:`-165,-11,206`},EPSG_4210:{towgs84:`-157,-2,-299`},EPSG_4183:{towgs84:`-104,167,-38`},EPSG_4139:{towgs84:`11,72,-101`},EPSG_4668:{towgs84:`-86,-98,-119`},EPSG_4717:{towgs84:`-2,151,181`},EPSG_4732:{towgs84:`102,52,-38`},EPSG_4280:{towgs84:`-377,681,-50`},EPSG_4209:{towgs84:`-138,-105,-289`},EPSG_4261:{towgs84:`31,146,47`},EPSG_4658:{towgs84:`-73,46,-86`},EPSG_4721:{towgs84:`265.025,384.929,-194.046`},EPSG_4222:{towgs84:`-136,-108,-292`},EPSG_4601:{towgs84:`-255,-15,71`},EPSG_4602:{towgs84:`725,685,536`},EPSG_4603:{towgs84:`72,213.7,93`},EPSG_4605:{towgs84:`9,183,236`},EPSG_4621:{towgs84:`137,248,-430`},EPSG_4657:{towgs84:`-28,199,5`},EPSG_4316:{towgs84:`103.25,-100.4,-307.19`},EPSG_4642:{towgs84:`-13,-348,292`},EPSG_4698:{towgs84:`145,-187,103`},EPSG_4192:{towgs84:`-206.1,-174.7,-87.7`},EPSG_4311:{towgs84:`-265,120,-358`},EPSG_4135:{towgs84:`58,-283,-182`},ESRI_104138:{towgs84:`198,-226,-347`},EPSG_4245:{towgs84:`-11,851,5`},EPSG_4142:{towgs84:`-125,53,467`},EPSG_4213:{towgs84:`-106,-87,188`},EPSG_4253:{towgs84:`-133,-77,-51`},EPSG_4129:{towgs84:`-132,-110,-335`},EPSG_4713:{towgs84:`-77,-128,142`},EPSG_4239:{towgs84:`217,823,299`},EPSG_4146:{towgs84:`295,736,257`},EPSG_4155:{towgs84:`-83,37,124`},EPSG_4165:{towgs84:`-173,253,27`},EPSG_4672:{towgs84:`175,-38,113`},EPSG_4236:{towgs84:`-637,-549,-203`},EPSG_4251:{towgs84:`-90,40,88`},EPSG_4271:{towgs84:`-2,374,172`},EPSG_4175:{towgs84:`-88,4,101`},EPSG_4716:{towgs84:`298,-304,-375`},EPSG_4315:{towgs84:`-23,259,-9`},EPSG_4744:{towgs84:`-242.2,-144.9,370.3`},EPSG_4244:{towgs84:`-97,787,86`},EPSG_4293:{towgs84:`616,97,-251`},EPSG_4714:{towgs84:`-127,-769,472`},EPSG_4736:{towgs84:`260,12,-147`},EPSG_6883:{towgs84:`-235,-110,393`},EPSG_6894:{towgs84:`-63,176,185`},EPSG_4205:{towgs84:`-43,-163,45`},EPSG_4256:{towgs84:`41,-220,-134`},EPSG_4262:{towgs84:`639,405,60`},EPSG_4604:{towgs84:`174,359,365`},EPSG_4169:{towgs84:`-115,118,426`},EPSG_4620:{towgs84:`-106,-129,165`},EPSG_4184:{towgs84:`-203,141,53`},EPSG_4616:{towgs84:`-289,-124,60`},EPSG_9403:{towgs84:`-307,-92,127`},EPSG_4684:{towgs84:`-133,-321,50`},EPSG_4708:{towgs84:`-491,-22,435`},EPSG_4707:{towgs84:`114,-116,-333`},EPSG_4709:{towgs84:`145,75,-272`},EPSG_4712:{towgs84:`-205,107,53`},EPSG_4711:{towgs84:`124,-234,-25`},EPSG_4718:{towgs84:`230,-199,-752`},EPSG_4719:{towgs84:`211,147,111`},EPSG_4724:{towgs84:`208,-435,-229`},EPSG_4725:{towgs84:`189,-79,-202`},EPSG_4735:{towgs84:`647,1777,-1124`},EPSG_4722:{towgs84:`-794,119,-298`},EPSG_4728:{towgs84:`-307,-92,127`},EPSG_4734:{towgs84:`-632,438,-609`},EPSG_4727:{towgs84:`912,-58,1227`},EPSG_4729:{towgs84:`185,165,42`},EPSG_4730:{towgs84:`170,42,84`},EPSG_4733:{towgs84:`276,-57,149`},ESRI_37218:{towgs84:`230,-199,-752`},ESRI_37240:{towgs84:`-7,215,225`},ESRI_37221:{towgs84:`252,-209,-751`},ESRI_4305:{towgs84:`-123,-206,219`},ESRI_104139:{towgs84:`-73,-247,227`},EPSG_4748:{towgs84:`51,391,-36`},EPSG_4219:{towgs84:`-384,664,-48`},EPSG_4255:{towgs84:`-333,-222,114`},EPSG_4257:{towgs84:`-587.8,519.75,145.76`},EPSG_4646:{towgs84:`-963,510,-359`},EPSG_6881:{towgs84:`-24,-203,268`},EPSG_6882:{towgs84:`-183,-15,273`},EPSG_4715:{towgs84:`-104,-129,239`},IGNF_RGF93GDD:{towgs84:`0,0,0`},IGNF_RGM04GDD:{towgs84:`0,0,0`},IGNF_RGSPM06GDD:{towgs84:`0,0,0`},IGNF_RGTAAF07GDD:{towgs84:`0,0,0`},IGNF_RGFG95GDD:{towgs84:`0,0,0`},IGNF_RGNCG:{towgs84:`0,0,0`},IGNF_RGPFGDD:{towgs84:`0,0,0`},IGNF_ETRS89G:{towgs84:`0,0,0`},IGNF_RGR92GDD:{towgs84:`0,0,0`},EPSG_4173:{towgs84:`0,0,0`},EPSG_4180:{towgs84:`0,0,0`},EPSG_4619:{towgs84:`0,0,0`},EPSG_4667:{towgs84:`0,0,0`},EPSG_4075:{towgs84:`0,0,0`},EPSG_6706:{towgs84:`0,0,0`},EPSG_7798:{towgs84:`0,0,0`},EPSG_4661:{towgs84:`0,0,0`},EPSG_4669:{towgs84:`0,0,0`},EPSG_8685:{towgs84:`0,0,0`},EPSG_4151:{towgs84:`0,0,0`},EPSG_9702:{towgs84:`0,0,0`},EPSG_4758:{towgs84:`0,0,0`},EPSG_4761:{towgs84:`0,0,0`},EPSG_4765:{towgs84:`0,0,0`},EPSG_8997:{towgs84:`0,0,0`},EPSG_4023:{towgs84:`0,0,0`},EPSG_4670:{towgs84:`0,0,0`},EPSG_4694:{towgs84:`0,0,0`},EPSG_4148:{towgs84:`0,0,0`},EPSG_4163:{towgs84:`0,0,0`},EPSG_4167:{towgs84:`0,0,0`},EPSG_4189:{towgs84:`0,0,0`},EPSG_4190:{towgs84:`0,0,0`},EPSG_4176:{towgs84:`0,0,0`},EPSG_4659:{towgs84:`0,0,0`},EPSG_3824:{towgs84:`0,0,0`},EPSG_3889:{towgs84:`0,0,0`},EPSG_4046:{towgs84:`0,0,0`},EPSG_4081:{towgs84:`0,0,0`},EPSG_4558:{towgs84:`0,0,0`},EPSG_4483:{towgs84:`0,0,0`},EPSG_5013:{towgs84:`0,0,0`},EPSG_5264:{towgs84:`0,0,0`},EPSG_5324:{towgs84:`0,0,0`},EPSG_5354:{towgs84:`0,0,0`},EPSG_5371:{towgs84:`0,0,0`},EPSG_5373:{towgs84:`0,0,0`},EPSG_5381:{towgs84:`0,0,0`},EPSG_5393:{towgs84:`0,0,0`},EPSG_5489:{towgs84:`0,0,0`},EPSG_5593:{towgs84:`0,0,0`},EPSG_6135:{towgs84:`0,0,0`},EPSG_6365:{towgs84:`0,0,0`},EPSG_5246:{towgs84:`0,0,0`},EPSG_7886:{towgs84:`0,0,0`},EPSG_8431:{towgs84:`0,0,0`},EPSG_8427:{towgs84:`0,0,0`},EPSG_8699:{towgs84:`0,0,0`},EPSG_8818:{towgs84:`0,0,0`},EPSG_4757:{towgs84:`0,0,0`},EPSG_9140:{towgs84:`0,0,0`},EPSG_8086:{towgs84:`0,0,0`},EPSG_4686:{towgs84:`0,0,0`},EPSG_4737:{towgs84:`0,0,0`},EPSG_4702:{towgs84:`0,0,0`},EPSG_4747:{towgs84:`0,0,0`},EPSG_4749:{towgs84:`0,0,0`},EPSG_4674:{towgs84:`0,0,0`},EPSG_4755:{towgs84:`0,0,0`},EPSG_4759:{towgs84:`0,0,0`},EPSG_4762:{towgs84:`0,0,0`},EPSG_4763:{towgs84:`0,0,0`},EPSG_4764:{towgs84:`0,0,0`},EPSG_4166:{towgs84:`0,0,0`},EPSG_4170:{towgs84:`0,0,0`},EPSG_5546:{towgs84:`0,0,0`},EPSG_7844:{towgs84:`0,0,0`},EPSG_4818:{towgs84:`589,76,480`},EPSG_10328:{towgs84:`0,0,0`},EPSG_9782:{towgs84:`0,0,0`},EPSG_9777:{towgs84:`0,0,0`},EPSG_10690:{towgs84:`0,0,0`},EPSG_10639:{towgs84:`0,0,0`},EPSG_10739:{towgs84:`0,0,0`},EPSG_7686:{towgs84:`0,0,0`},EPSG_8900:{towgs84:`0,0,0`},EPSG_5886:{towgs84:`0,0,0`},EPSG_7683:{towgs84:`0,0,0`},EPSG_6668:{towgs84:`0,0,0`},EPSG_20046:{towgs84:`0,0,0`},EPSG_10299:{towgs84:`0,0,0`},EPSG_10310:{towgs84:`0,0,0`},EPSG_10475:{towgs84:`0,0,0`},EPSG_4742:{towgs84:`0,0,0`},EPSG_10671:{towgs84:`0,0,0`},EPSG_10762:{towgs84:`0,0,0`},EPSG_10725:{towgs84:`0,0,0`},EPSG_10791:{towgs84:`0,0,0`},EPSG_10800:{towgs84:`0,0,0`},EPSG_10305:{towgs84:`0,0,0`},EPSG_10941:{towgs84:`0,0,0`},EPSG_10968:{towgs84:`0,0,0`},EPSG_10875:{towgs84:`0,0,0`},EPSG_6318:{towgs84:`0,0,0`},EPSG_10910:{towgs84:`0,0,0`}};for(var pp in fp){var mp=fp[pp];mp.datumName&&(fp[mp.datumName]=mp)}function hp(e,t,n,r,i,a,o){var s={};return s.datum_type=5,t&&(s.datum_type=4,s.datum_params=t.map(parseFloat),(s.datum_params[0]!==0||s.datum_params[1]!==0||s.datum_params[2]!==0)&&(s.datum_type=1),s.datum_params.length>3&&(s.datum_params[3]!==0||s.datum_params[4]!==0||s.datum_params[5]!==0||s.datum_params[6]!==0)&&(s.datum_type=2,s.datum_params[3]*=Bd,s.datum_params[4]*=Bd,s.datum_params[5]*=Bd,s.datum_params[6]=s.datum_params[6]/1e6+1)),o&&(s.datum_type=3,s.grids=o),s.a=n,s.b=r,s.es=i,s.ep2=a,s}var gp={};function _p(e,t,n){return t instanceof ArrayBuffer?vp(e,t,n):{ready:yp(e,t)}}function vp(e,t,n){var r=!0;n!==void 0&&n.includeErrorFields===!1&&(r=!1);var i=new DataView(t),a=wp(i),o=Tp(i,a),s={header:o,subgrids:Dp(i,o,a,r)};return gp[e]=s,s}async function yp(e,t){for(var n=[],r=await t.getImageCount(),i=r-1;i>=0;i--){var a=await t.getImage(i),o=await a.readRasters(),s=[a.getWidth(),a.getHeight()],c=a.getBoundingBox().map(Sp),l=typeof a.fileDirectory.getValue==`function`?a.fileDirectory.getValue(`ModelPixelScale`):a.fileDirectory.ModelPixelScale,u=[l[0],l[1]].map(Sp),d=c[0]+(s[0]-1)*u[0],f=c[3]-(s[1]-1)*u[1],p=o[0],m=o[1],h=[];for(let e=s[1]-1;e>=0;e--)for(let t=s[0]-1;t>=0;t--){var g=e*s[0]+t;h.push([-Cp(m[g]),Cp(p[g])])}n.push({del:u,lim:s,ll:[-d,f],cvs:h})}var _={header:{nSubgrids:r},subgrids:n};return gp[e]=_,_}function bp(e){return e===void 0?null:e.split(`,`).map(xp)}function xp(e){if(e.length===0)return null;var t=e[0]===`@`;return t&&(e=e.slice(1)),e===`null`?{name:`null`,mandatory:!t,grid:null,isNull:!0}:{name:e,mandatory:!t,grid:gp[e]||null,isNull:!1}}function Sp(e){return e*Math.PI/180}function Cp(e){return e/3600*Math.PI/180}function wp(e){var t=e.getInt32(8,!1);return t===11?!1:(t=e.getInt32(8,!0),t!==11&&console.warn(`Failed to detect nadgrid endian-ness, defaulting to little-endian`),!0)}function Tp(e,t){return{nFields:e.getInt32(8,t),nSubgridFields:e.getInt32(24,t),nSubgrids:e.getInt32(40,t),shiftType:Ep(e,56,64).trim(),fromSemiMajorAxis:e.getFloat64(120,t),fromSemiMinorAxis:e.getFloat64(136,t),toSemiMajorAxis:e.getFloat64(152,t),toSemiMinorAxis:e.getFloat64(168,t)}}function Ep(e,t,n){return String.fromCharCode.apply(null,new Uint8Array(e.buffer.slice(t,n)))}function Dp(e,t,n,r){for(var i=176,a=[],o=0;o<t.nSubgrids;o++){var s=kp(e,i,n),c=Ap(e,i,s,n,r),l=Math.round(1+(s.upperLongitude-s.lowerLongitude)/s.longitudeInterval),u=Math.round(1+(s.upperLatitude-s.lowerLatitude)/s.latitudeInterval);a.push({ll:[Cp(s.lowerLongitude),Cp(s.lowerLatitude)],del:[Cp(s.longitudeInterval),Cp(s.latitudeInterval)],lim:[l,u],count:s.gridNodeCount,cvs:Op(c)});var d=16;r===!1&&(d=8),i+=176+s.gridNodeCount*d}return a}function Op(e){return e.map(function(e){return[Cp(e.longitudeShift),Cp(e.latitudeShift)]})}function kp(e,t,n){return{name:Ep(e,t+8,t+16).trim(),parent:Ep(e,t+24,t+24+8).trim(),lowerLatitude:e.getFloat64(t+72,n),upperLatitude:e.getFloat64(t+88,n),lowerLongitude:e.getFloat64(t+104,n),upperLongitude:e.getFloat64(t+120,n),latitudeInterval:e.getFloat64(t+136,n),longitudeInterval:e.getFloat64(t+152,n),gridNodeCount:e.getInt32(t+168,n)}}function Ap(e,t,n,r,i){var a=t+176,o=16;i===!1&&(o=8);for(var s=[],c=0;c<n.gridNodeCount;c++){var l={latitudeShift:e.getFloat32(a+c*o,r),longitudeShift:e.getFloat32(a+c*o+4,r)};i!==!1&&(l.latitudeAccuracy=e.getFloat32(a+c*o+8,r),l.longitudeAccuracy=e.getFloat32(a+c*o+12,r)),s.push(l)}return s}function jp(e,t){if(!(this instanceof jp))return new jp(e);this.forward=null,this.inverse=null,this.init=null,this.name,this.axis,this.names=null,this.title,t||=function(e){if(e)throw e};var n=Vf(e);if(typeof n!=`object`){t(`Could not parse to valid json: `+e);return}var r=jp.projections.get(n.projName);if(!r){t(`Could not get projection name from: `+e);return}if(n.datumCode&&n.datumCode!==`none`){var i=$d(fp,n.datumCode);i&&(n.datum_params=n.datum_params||(i.towgs84?i.towgs84.split(`,`):null),n.ellps=i.ellipse,n.datumName=i.datumName?i.datumName:n.datumCode)}n.axis=n.axis||`enu`,n.ellps=n.ellps||`wgs84`,n.lat1=n.lat1||n.lat0;var a=dp(n.a,n.b,n.rf,n.ellps,n.sphere),o=up(a.a,a.b,a.rf,n.R_A),s=bp(n.nadgrids),c=n.datum||hp(n.datumCode,n.datum_params,a.a,a.b,o.es,o.ep2,s);Hf(this,n),Hf(this,r),this.a=a.a,this.b=a.b,this.rf=a.rf,this.sphere=a.sphere,this.es=o.es,this.e=o.e,this.ep2=o.ep2,this.datum=c,`init`in this&&typeof this.init==`function`&&this.init(),this.k0||=1,t(null,this)}jp.projections=sp,jp.projections.start();function Mp(e,t){return e.datum_type===t.datum_type?e.a!==t.a||Math.abs(e.es-t.es)>5e-11?!1:e.datum_type===1?e.datum_params[0]===t.datum_params[0]&&e.datum_params[1]===t.datum_params[1]&&e.datum_params[2]===t.datum_params[2]:e.datum_type!==2||e.datum_params[0]===t.datum_params[0]&&e.datum_params[1]===t.datum_params[1]&&e.datum_params[2]===t.datum_params[2]&&e.datum_params[3]===t.datum_params[3]&&e.datum_params[4]===t.datum_params[4]&&e.datum_params[5]===t.datum_params[5]&&e.datum_params[6]===t.datum_params[6]:!1}function Np(e,t,n){var r=e.x,i=e.y,a=e.z?e.z:0,o,s,c,l;if(i<-J&&i>-1.001*J)i=-J;else if(i>J&&i<1.001*J)i=J;else if(i<-J)return{x:-1/0,y:-1/0,z:e.z};else if(i>J)return{x:1/0,y:1/0,z:e.z};return r>Math.PI&&(r-=2*Math.PI),s=Math.sin(i),l=Math.cos(i),c=s*s,o=n/Math.sqrt(1-t*c),{x:(o+a)*l*Math.cos(r),y:(o+a)*l*Math.sin(r),z:(o*(1-t)+a)*s}}function Pp(e,t,n,r){var i=1e-12,a=i*i,o=30,s,c,l,u,d,f,p,m,h,g,_,v,y,b=e.x,x=e.y,S=e.z?e.z:0,C,w,T;if(s=Math.sqrt(b*b+x*x),c=Math.sqrt(b*b+x*x+S*S),s/n<i){if(C=0,c/n<i)return w=J,T=-r,{x:e.x,y:e.y,z:e.z}}else C=Math.atan2(x,b);l=S/c,u=s/c,d=1/Math.sqrt(1-t*(2-t)*u*u),m=u*(1-t)*d,h=l*d,y=0;do y++,p=n/Math.sqrt(1-t*h*h),T=s*m+S*h-p*(1-t*h*h),f=t*p/(p+T),d=1/Math.sqrt(1-f*(2-f)*u*u),g=u*(1-f)*d,_=l*d,v=_*m-g*h,m=g,h=_;while(v*v>a&&y<o);return w=Math.atan(_/Math.abs(g)),{x:C,y:w,z:T}}function Fp(e,t,n){if(t===1)return{x:e.x+n[0],y:e.y+n[1],z:e.z+n[2]};if(t===2){var r=n[0],i=n[1],a=n[2],o=n[3],s=n[4],c=n[5],l=n[6];return{x:l*(e.x-c*e.y+s*e.z)+r,y:l*(c*e.x+e.y-o*e.z)+i,z:l*(-s*e.x+o*e.y+e.z)+a}}}function Ip(e,t,n){if(t===1)return{x:e.x-n[0],y:e.y-n[1],z:e.z-n[2]};if(t===2){var r=n[0],i=n[1],a=n[2],o=n[3],s=n[4],c=n[5],l=n[6],u=(e.x-r)/l,d=(e.y-i)/l,f=(e.z-a)/l;return{x:u+c*d-s*f,y:-c*u+d+o*f,z:s*u-o*d+f}}}function Lp(e){return e===1||e===2}function Rp(e,t,n){if(Mp(e,t)||e.datum_type===5||t.datum_type===5)return n;var r=e.a,i=e.es;if(e.datum_type===3){if(zp(e,!1,n)!==0)return;r=Ld,i=zd}var a=t.a,o=t.b,s=t.es;if(t.datum_type===3&&(a=Ld,o=Rd,s=zd),i===s&&r===a&&!Lp(e.datum_type)&&!Lp(t.datum_type)||(n=Np(n,i,r),Lp(e.datum_type)&&(n=Fp(n,e.datum_type,e.datum_params)),Lp(t.datum_type)&&(n=Ip(n,t.datum_type,t.datum_params)),n=Pp(n,s,a,o),!(t.datum_type===3&&zp(t,!0,n)!==0)))return n}function zp(e,t,n){if(e.grids===null||e.grids.length===0)return console.log(`Grid shift grids not found`),-1;var r={x:-n.x,y:n.y},i={x:NaN,y:NaN},a=[];outer:for(var o=0;o<e.grids.length;o++){var s=e.grids[o];if(a.push(s.name),s.isNull){i=r;break}if(s.grid===null){if(s.mandatory)return console.log(`Unable to find mandatory grid '`+s.name+`'`),-1;continue}for(var c=s.grid.subgrids,l=0,u=c.length;l<u;l++){var d=c[l],f=(Math.abs(d.del[1])+Math.abs(d.del[0]))/1e4,p=d.ll[0]-f,m=d.ll[1]-f,h=d.ll[0]+(d.lim[0]-1)*d.del[0]+f,g=d.ll[1]+(d.lim[1]-1)*d.del[1]+f;if(!(m>r.y||p>r.x||g<r.y||h<r.x)&&(i=Bp(r,t,d),!isNaN(i.x)))break outer}}return isNaN(i.x)?(console.log(`Failed to find a grid shift table for location '`+-r.x*Kd+` `+r.y*Kd+` tried: '`+a+`'`),-1):(n.x=-i.x,n.y=i.y,0)}function Bp(e,t,n){var r={x:NaN,y:NaN};if(isNaN(e.x))return r;var i={x:e.x,y:e.y};i.x-=n.ll[0],i.y-=n.ll[1],i.x=Y(i.x-Math.PI)+Math.PI;var a=Vp(i,n);if(t){if(isNaN(a.x))return r;a.x=i.x-a.x,a.y=i.y-a.y;var o=9,s=1e-12,c,l;do{if(l=Vp(a,n),isNaN(l.x)){console.log(`Inverse grid shift iteration failed, presumably at grid edge.  Using first approximation.`);break}c={x:i.x-(l.x+a.x),y:i.y-(l.y+a.y)},a.x+=c.x,a.y+=c.y}while(o--&&Math.abs(c.x)>s&&Math.abs(c.y)>s);if(o<0)return console.log(`Inverse grid shift iterator failed to converge.`),r;r.x=Y(a.x+n.ll[0]),r.y=a.y+n.ll[1]}else isNaN(a.x)||(r.x=e.x+a.x,r.y=e.y+a.y);return r}function Vp(e,t){var n={x:e.x/t.del[0],y:e.y/t.del[1]},r={x:Math.floor(n.x),y:Math.floor(n.y)},i={x:n.x-1*r.x,y:n.y-1*r.y},a={x:NaN,y:NaN},o;if(r.x<0||r.x>=t.lim[0]||r.y<0||r.y>=t.lim[1])return a;o=r.y*t.lim[0]+r.x;var s={x:t.cvs[o][0],y:t.cvs[o][1]};o++;var c={x:t.cvs[o][0],y:t.cvs[o][1]};o+=t.lim[0];var l={x:t.cvs[o][0],y:t.cvs[o][1]};o--;var u={x:t.cvs[o][0],y:t.cvs[o][1]},d=i.x*i.y,f=i.x*(1-i.y),p=(1-i.x)*(1-i.y),m=(1-i.x)*i.y;return a.x=p*s.x+f*c.x+m*u.x+d*l.x,a.y=p*s.y+f*c.y+m*u.y+d*l.y,a}var Hp=[`x`,`y`,`z`];function Up(e,t){let n={};for(let r=0,i=e.axis.length;r<i;r++){if(r===2&&t.z===void 0)continue;let i=t[Hp[r]];switch(e.axis[r]){case`e`:n.x=i;break;case`w`:n.x=-i;break;case`n`:n.y=i;break;case`s`:n.y=-i;break;case`u`:n.z=i;break;case`d`:n.z=-i;break;default:return null}}return n}function Wp(e,t){let n={};for(let r=0,i=e.axis.length;r<i;r++)if(!(r===2&&t.z===void 0))switch(e.axis[r]){case`e`:n[Hp[r]]=t.x;break;case`w`:n[Hp[r]]=-t.x;break;case`n`:n[Hp[r]]=t.y;break;case`s`:n[Hp[r]]=-t.y;break;case`u`:n[Hp[r]]=t.z;break;case`d`:n[Hp[r]]=-t.z;break;default:return null}return n}function Gp(e){var t={x:e[0],y:e[1]};return e.length>2&&(t.z=e[2]),e.length>3&&(t.m=e[3]),t}function Kp(e){qp(e.x),qp(e.y)}function qp(e){if(typeof Number.isFinite==`function`){if(Number.isFinite(e))return;throw TypeError(`coordinates must be finite numbers`)}if(typeof e!=`number`||e!==e||!isFinite(e))throw TypeError(`coordinates must be finite numbers`)}function Jp(e,t){return(e.datum.datum_type===1||e.datum.datum_type===2||e.datum.datum_type===3)&&t.datumCode!==`WGS84`||(t.datum.datum_type===1||t.datum.datum_type===2||t.datum.datum_type===3)&&e.datumCode!==`WGS84`}function Yp(e,t,n,r){var i,a=n.z!==void 0;if(Kp(n),e.datum&&t.datum&&Jp(e,t)&&(i=new jp(`WGS84`),n=Yp(e,i,n,r),e=i),r&&e.axis!==`enu`&&(n=Up(e,n)),e.projName===`longlat`)n={x:n.x*Gd,y:n.y*Gd,z:n.z||0};else if(e.to_meter&&(n={x:n.x*e.to_meter,y:n.y*e.to_meter,z:n.z||0}),n=e.inverse(n),!n)return;if(e.from_greenwich&&(n.x+=e.from_greenwich),n=Rp(e.datum,t.datum,n),n)return n=n,t.from_greenwich&&(n={x:n.x-t.from_greenwich,y:n.y,z:n.z||0}),t.projName===`longlat`?(t.long_wrap!==void 0&&(n.x=t.long_wrap+Y(n.x-t.long_wrap)),n={x:n.x*Kd,y:n.y*Kd,z:n.z||0}):(n=t.forward(n),t.to_meter&&(n={x:n.x/t.to_meter,y:n.y/t.to_meter,z:n.z||0})),r&&t.axis!==`enu`?Wp(t,n):(n&&!a&&t.projName!==`geocent`&&delete n.z,n)}function Xp(e,t,n,r){return Yp(e,t,Array.isArray(n)?Gp(n):{x:n.x,y:n.y,z:n.z,m:n.m},r)}var Zp=jp(`WGS84`);function Qp(e,t,n,r){var i,a,o;return Array.isArray(n)?(i=Yp(e,t,Gp(n),r)||{x:NaN,y:NaN},n.length>2?(a=e.name!==void 0&&e.name===`geocent`||t.name!==void 0&&t.name===`geocent`,a?typeof i.z==`number`?[i.x,i.y,i.z].concat(n.slice(3)):[i.x,i.y,n[2]].concat(n.slice(3)):r&&typeof i.z==`number`?[i.x,i.y,i.z].concat(n.slice(3)):[i.x,i.y].concat(n.slice(2))):[i.x,i.y]):(i=Yp(e,t,{x:n.x,y:n.y,z:n.z,m:n.m},r)||{x:NaN,y:NaN},o=Object.keys(n),o.length===2?i:(a=e.name!==void 0&&e.name===`geocent`||t.name!==void 0&&t.name===`geocent`,o.forEach(function(e){e===`x`||e===`y`||e===`z`&&(a||r)||(i[e]=n[e])}),i))}function $p(e){return e instanceof jp?e:typeof e==`object`&&`oProj`in e?e.oProj:jp(e)}function em(e,t,n){var r,i,a=!1,o;return t===void 0?(i=$p(e),r=Zp,a=!0):(t.x!==void 0||Array.isArray(t))&&(n=t,i=$p(e),r=Zp,a=!0),r||=$p(e),i||=$p(t),n?Qp(r,i,n):(o={forward:function(e,t){return Qp(r,i,e,t)},inverse:function(e,t){return Qp(i,r,e,t)}},a&&(o.oProj=i),o)}var tm=6,nm=`AJSAJS`,rm=`AFAFAF`,im=65,am=73,om=79,sm=86,cm=90,lm={forward:um,inverse:dm,toPoint:fm};function um(e,t){return t||=5,vm(hm({lat:e[1],lon:e[0]}),t)}function dm(e){var t=gm(Sm(e.toUpperCase()));return t.lat&&t.lon?[t.lon,t.lat,t.lon,t.lat]:[t.left,t.bottom,t.right,t.top]}function fm(e){var t=gm(Sm(e.toUpperCase()));return t.lat&&t.lon?[t.lon,t.lat]:[(t.left+t.right)/2,(t.top+t.bottom)/2]}function pm(e){return Math.PI/180*e}function mm(e){return e/Math.PI*180}function hm(e){var t=e.lat,n=e.lon,r=6378137,i=.00669438,a=.9996,o,s,c,l,u,d,f,p=pm(t),m=pm(n),h,g=Math.floor((n+180)/6)+1;n===180&&(g=60),t>=56&&t<64&&n>=3&&n<12&&(g=32),t>=72&&t<84&&(n>=0&&n<9?g=31:n>=9&&n<21?g=33:n>=21&&n<33?g=35:n>=33&&n<42&&(g=37)),o=(g-1)*6-180+3,h=pm(o),s=i/(1-i),c=r/Math.sqrt(1-i*Math.sin(p)*Math.sin(p)),l=Math.tan(p)*Math.tan(p),u=s*Math.cos(p)*Math.cos(p),d=Math.cos(p)*(m-h),f=r*((1-i/4-3*i*i/64-5*i*i*i/256)*p-(3*i/8+3*i*i/32+45*i*i*i/1024)*Math.sin(2*p)+(15*i*i/256+45*i*i*i/1024)*Math.sin(4*p)-35*i*i*i/3072*Math.sin(6*p));var _=a*c*(d+(1-l+u)*d*d*d/6+(5-18*l+l*l+72*u-58*s)*d*d*d*d*d/120)+5e5,v=a*(f+c*Math.tan(p)*(d*d/2+(5-l+9*u+4*u*u)*d*d*d*d/24+(61-58*l+l*l+600*u-330*s)*d*d*d*d*d*d/720));return t<0&&(v+=1e7),{northing:Math.round(v),easting:Math.round(_),zoneNumber:g,zoneLetter:_m(t)}}function gm(e){var t=e.northing,n=e.easting,r=e.zoneLetter,i=e.zoneNumber;if(i<0||i>60)return null;var a=.9996,o=6378137,s=.00669438,c,l=(1-Math.sqrt(1-s))/(1+Math.sqrt(1-s)),u,d,f,p,m,h,g,_,v,y=n-5e5,b=t;r<`N`&&(b-=1e7),g=(i-1)*6-180+3,c=s/(1-s),h=b/a,_=h/(o*(1-s/4-3*s*s/64-5*s*s*s/256)),v=_+(3*l/2-27*l*l*l/32)*Math.sin(2*_)+(21*l*l/16-55*l*l*l*l/32)*Math.sin(4*_)+151*l*l*l/96*Math.sin(6*_),u=o/Math.sqrt(1-s*Math.sin(v)*Math.sin(v)),d=Math.tan(v)*Math.tan(v),f=c*Math.cos(v)*Math.cos(v),p=o*(1-s)/(1-s*Math.sin(v)*Math.sin(v))**1.5,m=y/(u*a);var x=v-u*Math.tan(v)/p*(m*m/2-(5+3*d+10*f-4*f*f-9*c)*m*m*m*m/24+(61+90*d+298*f+45*d*d-252*c-3*f*f)*m*m*m*m*m*m/720);x=mm(x);var S=(m-(1+2*d+f)*m*m*m/6+(5-2*f+28*d-3*f*f+8*c+24*d*d)*m*m*m*m*m/120)/Math.cos(v);S=g+mm(S);var C;if(e.accuracy){var w=gm({northing:e.northing+e.accuracy,easting:e.easting+e.accuracy,zoneLetter:e.zoneLetter,zoneNumber:e.zoneNumber});C={top:w.lat,right:w.lon,bottom:x,left:S}}else C={lat:x,lon:S};return C}function _m(e){var t=`Z`;return 84>=e&&e>=72?t=`X`:72>e&&e>=64?t=`W`:64>e&&e>=56?t=`V`:56>e&&e>=48?t=`U`:48>e&&e>=40?t=`T`:40>e&&e>=32?t=`S`:32>e&&e>=24?t=`R`:24>e&&e>=16?t=`Q`:16>e&&e>=8?t=`P`:8>e&&e>=0?t=`N`:0>e&&e>=-8?t=`M`:-8>e&&e>=-16?t=`L`:-16>e&&e>=-24?t=`K`:-24>e&&e>=-32?t=`J`:-32>e&&e>=-40?t=`H`:-40>e&&e>=-48?t=`G`:-48>e&&e>=-56?t=`F`:-56>e&&e>=-64?t=`E`:-64>e&&e>=-72?t=`D`:-72>e&&e>=-80&&(t=`C`),t}function vm(e,t){var n=`00000`+e.easting,r=`00000`+e.northing;return e.zoneNumber+e.zoneLetter+ym(e.easting,e.northing,e.zoneNumber)+n.substr(n.length-5,t)+r.substr(r.length-5,t)}function ym(e,t,n){var r=bm(n);return xm(Math.floor(e/1e5),Math.floor(t/1e5)%20,r)}function bm(e){var t=e%tm;return t===0&&(t=tm),t}function xm(e,t,n){var r=n-1,i=nm.charCodeAt(r),a=rm.charCodeAt(r),o=i+e-1,s=a+t,c=!1;return o>cm&&(o=o-cm+im-1,c=!0),(o===am||i<am&&o>am||(o>am||i<am)&&c)&&o++,(o===om||i<om&&o>om||(o>om||i<om)&&c)&&(o++,o===am&&o++),o>cm&&(o=o-cm+im-1),s>sm?(s=s-sm+im-1,c=!0):c=!1,(s===am||a<am&&s>am||(s>am||a<am)&&c)&&s++,(s===om||a<om&&s>om||(s>om||a<om)&&c)&&(s++,s===am&&s++),s>sm&&(s=s-sm+im-1),String.fromCharCode(o)+String.fromCharCode(s)}function Sm(e){if(e&&e.length===0)throw`MGRSPoint coverting from nothing`;for(var t=e.length,n=null,r=``,i,a=0;!/[A-Z]/.test(i=e.charAt(a));){if(a>=2)throw`MGRSPoint bad conversion from: `+e;r+=i,a++}var o=parseInt(r,10);if(a===0||a+3>t)throw`MGRSPoint bad conversion from: `+e;var s=e.charAt(a++);if(s<=`A`||s===`B`||s===`Y`||s>=`Z`||s===`I`||s===`O`)throw`MGRSPoint zone letter `+s+` not handled: `+e;n=e.substring(a,a+=2);for(var c=bm(o),l=Cm(n.charAt(0),c),u=wm(n.charAt(1),c);u<Tm(s);)u+=2e6;var d=t-a;if(d%2!=0)throw`MGRSPoint has to have an even number 
of digits after the zone letter and two 100km letters - front 
half for easting meters, second half for 
northing meters`+e;var f=d/2,p=0,m=0,h,g,_,v,y;return f>0&&(h=1e5/10**f,g=e.substring(a,a+f),p=parseFloat(g)*h,_=e.substring(a+f),m=parseFloat(_)*h),v=p+l,y=m+u,{easting:v,northing:y,zoneLetter:s,zoneNumber:o,accuracy:h}}function Cm(e,t){for(var n=nm.charCodeAt(t-1),r=1e5,i=!1;n!==e.charCodeAt(0);){if(n++,n===am&&n++,n===om&&n++,n>cm){if(i)throw`Bad character: `+e;n=im,i=!0}r+=1e5}return r}function wm(e,t){if(e>`V`)throw`MGRSPoint given invalid Northing `+e;for(var n=rm.charCodeAt(t-1),r=0,i=!1;n!==e.charCodeAt(0);){if(n++,n===am&&n++,n===om&&n++,n>sm){if(i)throw`Bad character: `+e;n=im,i=!0}r+=1e5}return r}function Tm(e){var t;switch(e){case`C`:t=11e5;break;case`D`:t=2e6;break;case`E`:t=28e5;break;case`F`:t=37e5;break;case`G`:t=46e5;break;case`H`:t=55e5;break;case`J`:t=64e5;break;case`K`:t=73e5;break;case`L`:t=82e5;break;case`M`:t=91e5;break;case`N`:t=0;break;case`P`:t=8e5;break;case`Q`:t=17e5;break;case`R`:t=26e5;break;case`S`:t=35e5;break;case`T`:t=44e5;break;case`U`:t=53e5;break;case`V`:t=62e5;break;case`W`:t=7e6;break;case`X`:t=79e5;break;default:t=-1}if(t>=0)return t;throw`Invalid zone letter: `+e}function Em(e,t,n){if(!(this instanceof Em))return new Em(e,t,n);if(Array.isArray(e))this.x=e[0],this.y=e[1],this.z=e[2]||0;else if(typeof e==`object`)this.x=e.x,this.y=e.y,this.z=e.z||0;else if(typeof e==`string`&&t===void 0){var r=e.split(`,`);this.x=parseFloat(r[0]),this.y=parseFloat(r[1]),this.z=parseFloat(r[2])||0}else this.x=e,this.y=t,this.z=n||0;console.warn(`proj4.Point will be removed in version 3, use proj4.toPoint`)}Em.fromMGRS=function(e){return new Em(fm(e))},Em.prototype.toMGRS=function(e){return um([this.x,this.y],e)};var Dm=1,Om=.25,km=.046875,Am=.01953125,jm=.01068115234375,Mm=.75,Nm=.46875,Pm=.013020833333333334,Fm=.007120768229166667,Im=.3645833333333333,Lm=.005696614583333333,Rm=.3076171875;function zm(e){var t=[];t[0]=Dm-e*(Om+e*(km+e*(Am+e*jm))),t[1]=e*(Mm-e*(km+e*(Am+e*jm)));var n=e*e;return t[2]=n*(Nm-e*(Pm+e*Fm)),n*=e,t[3]=n*(Im-e*Lm),t[4]=n*e*Rm,t}function Bm(e,t,n,r){return n*=t,t*=t,r[0]*e-n*(r[1]+t*(r[2]+t*(r[3]+t*r[4])))}var Vm=20;function Hm(e,t,n){for(var r=1/(1-t),i=e,a=Vm;a;--a){var o=Math.sin(i),s=1-t*o*o;if(s=(Bm(i,o,Math.cos(i),n)-e)*(s*Math.sqrt(s))*r,i-=s,Math.abs(s)<1e-10)return i}return i}function Um(){this.x0=this.x0===void 0?0:this.x0,this.y0=this.y0===void 0?0:this.y0,this.long0=this.long0===void 0?0:this.long0,this.lat0=this.lat0===void 0?0:this.lat0,this.es&&(this.en=zm(this.es),this.ml0=Bm(this.lat0,Math.sin(this.lat0),Math.cos(this.lat0),this.en))}function Wm(e){var t=e.x,n=e.y,r=Y(t-this.long0,this.over),i,a,o,s=Math.sin(n),c=Math.cos(n);if(this.es){var l=c*r,u=l**2,d=this.ep2*c**2,f=d**2,p=(Math.abs(c)>1e-10?Math.tan(n):0)**2,m=p**2;i=1-this.es*s**2,l/=Math.sqrt(i);var h=Bm(n,s,c,this.en);a=this.a*(this.k0*l*(1+u/6*(1-p+d+u/20*(5-18*p+m+14*d-58*p*d+u/42*(61+179*m-m*p-479*p)))))+this.x0,o=this.a*(this.k0*(h-this.ml0+s*r*l/2*(1+u/12*(5-p+9*d+4*f+u/30*(61+m-58*p+270*d-330*p*d+u/56*(1385+543*m-m*p-3111*p))))))+this.y0}else{var g=c*Math.sin(r);if(Math.abs(Math.abs(g)-1)<1e-10)return 93;if(a=.5*this.a*this.k0*Math.log((1+g)/(1-g))+this.x0,o=c*Math.cos(r)/Math.sqrt(1-g**2),g=Math.abs(o),g>=1){if(g-1>1e-10)return 93;o=0}else o=Math.acos(o);n<0&&(o=-o),o=this.a*this.k0*(o-this.lat0)+this.y0}return e.x=a,e.y=o,e}function Gm(e){var t,n,r,i,a=(e.x-this.x0)*(1/this.a),o=(e.y-this.y0)*(1/this.a);if(!this.es){var s=Math.exp(a/this.k0),c=.5*(s-1/s),l=this.lat0+o/this.k0,u=Math.cos(l);t=Math.sqrt((1-u**2)/(1+c**2)),r=Math.asin(t),o<0&&(r=-r),i=c===0&&u===0?0:Y(Math.atan2(c,u)+this.long0,this.over)}else if(t=this.ml0+o/this.k0,n=Hm(t,this.es,this.en),Math.abs(n)<J){var d=Math.sin(n),f=Math.cos(n),p=Math.abs(f)>1e-10?Math.tan(n):0,m=this.ep2*f**2,h=m**2,g=p**2,_=g**2;t=1-this.es*d**2;var v=a*Math.sqrt(t)/this.k0,y=v**2;t*=p,r=n-t*y/(1-this.es)*.5*(1-y/12*(5+3*g-9*m*g+m-4*h-y/30*(61+90*g-252*m*g+45*_+46*m-y/56*(1385+3633*g+4095*_+1574*_*g)))),i=Y(this.long0+v*(1-y/6*(1+2*g+m-y/20*(5+28*g+24*_+8*m*g+6*m-y/42*(61+662*g+1320*_+720*_*g))))/f,this.over)}else r=J*Wf(o),i=0;return e.x=i,e.y=r,e}var Km={init:Um,forward:Wm,inverse:Gm,names:[`Fast_Transverse_Mercator`,`Fast Transverse Mercator`]};function qm(e){var t=Math.exp(e);return t=(t-1/t)/2,t}function Jm(e,t){e=Math.abs(e),t=Math.abs(t);var n=Math.max(e,t),r=Math.min(e,t)/(n||1);return n*Math.sqrt(1+r**2)}function Ym(e){var t=1+e,n=t-1;return n===0?e:e*Math.log(t)/n}function Xm(e){var t=Math.abs(e);return t=Ym(t*(1+t/(Jm(1,t)+1))),e<0?-t:t}function Zm(e,t){for(var n=2*Math.cos(2*t),r=e.length-1,i=e[r],a=0,o;--r>=0;)o=-a+n*i+e[r],a=i,i=o;return t+o*Math.sin(2*t)}function Qm(e,t){for(var n=2*Math.cos(t),r=e.length-1,i=e[r],a=0,o;--r>=0;)o=-a+n*i+e[r],a=i,i=o;return Math.sin(t)*o}function $m(e){var t=Math.exp(e);return t=(t+1/t)/2,t}function eh(e,t,n){for(var r=Math.sin(t),i=Math.cos(t),a=qm(n),o=$m(n),s=2*i*o,c=-2*r*a,l=e.length-1,u=e[l],d=0,f=0,p=0,m,h;--l>=0;)m=f,h=d,f=u,d=p,u=-m+s*f-c*d+e[l],p=-h+c*f+s*d;return s=r*o,c=i*a,[s*u-c*p,s*p+c*u]}function th(){if(!this.approx&&(isNaN(this.es)||this.es<=0))throw Error(`Incorrect elliptical usage. Try using the +approx option in the proj string, or PROJECTION["Fast_Transverse_Mercator"] in the WKT.`);this.approx&&(Km.init.apply(this),this.forward=Km.forward,this.inverse=Km.inverse),this.x0=this.x0===void 0?0:this.x0,this.y0=this.y0===void 0?0:this.y0,this.long0=this.long0===void 0?0:this.long0,this.lat0=this.lat0===void 0?0:this.lat0,this.k0=this.k0===void 0?1:this.k0,this.cgb=[],this.cbg=[],this.utg=[],this.gtu=[];var e=this.es/(1+Math.sqrt(1-this.es)),t=e/(2-e),n=t;this.cgb[0]=t*(2+t*(-2/3+t*(-2+t*(116/45+t*(26/45+-2854/675*t))))),this.cbg[0]=t*(-2+t*(2/3+t*(4/3+t*(-82/45+t*(32/45+4642/4725*t))))),n*=t,this.cgb[1]=n*(7/3+t*(-8/5+t*(-227/45+t*(2704/315+2323/945*t)))),this.cbg[1]=n*(5/3+t*(-16/15+t*(-13/9+t*(904/315+-1522/945*t)))),n*=t,this.cgb[2]=n*(56/15+t*(-136/35+t*(-1262/105+73814/2835*t))),this.cbg[2]=n*(-26/15+t*(34/21+t*(8/5+-12686/2835*t))),n*=t,this.cgb[3]=n*(4279/630+t*(-332/35+-399572/14175*t)),this.cbg[3]=n*(1237/630+t*(-12/5+-24832/14175*t)),n*=t,this.cgb[4]=n*(4174/315+-144838/6237*t),this.cbg[4]=n*(-734/315+109598/31185*t),n*=t,this.cgb[5]=601676/22275*n,this.cbg[5]=444337/155925*n,n=t**2,this.Qn=this.k0/(1+t)*(1+n*(1/4+n*(1/64+n/256))),this.utg[0]=t*(-.5+t*(2/3+t*(-37/96+t*(1/360+t*(81/512+-96199/604800*t))))),this.gtu[0]=t*(.5+t*(-2/3+t*(5/16+t*(41/180+t*(-127/288+7891/37800*t))))),this.utg[1]=n*(-1/48+t*(-1/15+t*(437/1440+t*(-46/105+1118711/3870720*t)))),this.gtu[1]=n*(13/48+t*(-3/5+t*(557/1440+t*(281/630+-1983433/1935360*t)))),n*=t,this.utg[2]=n*(-17/480+t*(37/840+t*(209/4480+-5569/90720*t))),this.gtu[2]=n*(61/240+t*(-103/140+t*(15061/26880+167603/181440*t))),n*=t,this.utg[3]=n*(-4397/161280+t*(11/504+830251/7257600*t)),this.gtu[3]=n*(49561/161280+t*(-179/168+6601661/7257600*t)),n*=t,this.utg[4]=n*(-4583/161280+108847/3991680*t),this.gtu[4]=n*(34729/80640+-3418889/1995840*t),n*=t,this.utg[5]=-20648693/638668800*n,this.gtu[5]=212378941/319334400*n;var r=Zm(this.cbg,this.lat0);this.Zb=-this.Qn*(r+Qm(this.gtu,2*r))}function nh(e){var t=Y(e.x-this.long0,this.over),n=e.y;n=Zm(this.cbg,n);var r=Math.sin(n),i=Math.cos(n),a=Math.sin(t),o=Math.cos(t);n=Math.atan2(r,o*i),t=Math.atan2(a*i,Jm(r,i*o)),t=Xm(Math.tan(t));var s=eh(this.gtu,2*n,2*t);n+=s[0],t+=s[1];var c,l;return Math.abs(t)<=2.623395162778?(c=this.a*(this.Qn*t)+this.x0,l=this.a*(this.Qn*n+this.Zb)+this.y0):(c=1/0,l=1/0),e.x=c,e.y=l,e}function rh(e){var t=(e.x-this.x0)*(1/this.a),n=(e.y-this.y0)*(1/this.a);n=(n-this.Zb)/this.Qn,t/=this.Qn;var r,i;if(Math.abs(t)<=2.623395162778){var a=eh(this.utg,2*n,2*t);n+=a[0],t+=a[1],t=Math.atan(qm(t));var o=Math.sin(n),s=Math.cos(n),c=Math.sin(t),l=Math.cos(t);n=Math.atan2(o*l,Jm(c,l*s)),t=Math.atan2(c,l*s),r=Y(t+this.long0,this.over),i=Zm(this.cgb,n)}else r=1/0,i=1/0;return e.x=r,e.y=i,e}var ih={init:th,forward:nh,inverse:rh,names:[`Extended_Transverse_Mercator`,`Extended Transverse Mercator`,`etmerc`,`Transverse_Mercator`,`Transverse Mercator`,`Gauss Kruger`,`Gauss_Kruger`,`tmerc`]};function ah(e,t){if(e===void 0){if(e=Math.floor((Y(t)+Math.PI)*30/Math.PI)+1,e<0)return 0;if(e>60)return 60}return e}var oh=`etmerc`;function sh(){var e=ah(this.zone,this.long0);if(e===void 0)throw Error(`unknown utm zone`);this.lat0=0,this.long0=(6*Math.abs(e)-183)*Gd,this.x0=5e5,this.y0=this.utmSouth?1e7:0,this.k0=.9996,ih.init.apply(this),this.forward=ih.forward,this.inverse=ih.inverse}var ch={init:sh,names:[`Universal Transverse Mercator System`,`utm`],dependsOn:oh};function lh(e,t){return((1-e)/(1+e))**t}var uh=20;function dh(){var e=Math.sin(this.lat0),t=Math.cos(this.lat0);t*=t,this.rc=Math.sqrt(1-this.es)/(1-this.es*e*e),this.C=Math.sqrt(1+this.es*t*t/(1-this.es)),this.phic0=Math.asin(e/this.C),this.ratexp=.5*this.C*this.e,this.K=Math.tan(.5*this.phic0+qd)/(Math.tan(.5*this.lat0+qd)**+this.C*lh(this.e*e,this.ratexp))}function fh(e){var t=e.x,n=e.y;return e.y=2*Math.atan(this.K*Math.tan(.5*n+qd)**+this.C*lh(this.e*Math.sin(n),this.ratexp))-J,e.x=this.C*t,e}function ph(e){for(var t=1e-14,n=e.x/this.C,r=e.y,i=(Math.tan(.5*r+qd)/this.K)**(1/this.C),a=uh;a>0&&(r=2*Math.atan(i*lh(this.e*Math.sin(e.y),-.5*this.e))-J,!(Math.abs(r-e.y)<t));--a)e.y=r;return a?(e.x=n,e.y=r,e):null}var mh={init:dh,forward:fh,inverse:ph,names:[`gauss`]};function hh(){mh.init.apply(this),this.rc&&(this.sinc0=Math.sin(this.phic0),this.cosc0=Math.cos(this.phic0),this.R2=2*this.rc,this.title||=`Oblique Stereographic Alternative`)}function gh(e){var t,n,r,i;return e.x=Y(e.x-this.long0,this.over),mh.forward.apply(this,[e]),t=Math.sin(e.y),n=Math.cos(e.y),r=Math.cos(e.x),i=this.k0*this.R2/(1+this.sinc0*t+this.cosc0*n*r),e.x=i*n*Math.sin(e.x),e.y=i*(this.cosc0*t-this.sinc0*n*r),e.x=this.a*e.x+this.x0,e.y=this.a*e.y+this.y0,e}function _h(e){var t,n,r,i,a;if(e.x=(e.x-this.x0)/this.a,e.y=(e.y-this.y0)/this.a,e.x/=this.k0,e.y/=this.k0,a=Jm(e.x,e.y)){var o=2*Math.atan2(a,this.R2);t=Math.sin(o),n=Math.cos(o),i=Math.asin(n*this.sinc0+e.y*t*this.cosc0/a),r=Math.atan2(e.x*t,a*this.cosc0*n-e.y*this.sinc0*t)}else i=this.phic0,r=0;return e.x=r,e.y=i,mh.inverse.apply(this,[e]),e.x=Y(e.x+this.long0,this.over),e}var vh={init:hh,forward:gh,inverse:_h,names:[`Stereographic_North_Pole`,`Oblique_Stereographic`,`sterea`,`Oblique Stereographic Alternative`,`Double_Stereographic`]};function yh(e,t,n){return t*=n,Math.tan(.5*(J+e))*((1-t)/(1+t))**(.5*n)}function bh(){this.x0=this.x0||0,this.y0=this.y0||0,this.lat0=this.lat0||0,this.long0=this.long0||0,this.coslat0=Math.cos(this.lat0),this.sinlat0=Math.sin(this.lat0),this.sphere?!isNaN(this.lat_ts)&&Math.abs(this.coslat0)<=1e-10&&(this.k0=.5*(1+Wf(this.lat0)*Math.sin(this.lat_ts))):(Math.abs(this.coslat0)<=1e-10&&(this.lat0>0?this.con=1:this.con=-1),this.cons=Math.sqrt((1+this.e)**+(1+this.e)*(1-this.e)**(1-this.e)),!isNaN(this.lat_ts)&&Math.abs(this.coslat0)<=1e-10&&Math.abs(Math.cos(this.lat_ts))>1e-10&&(this.k0=.5*this.cons*Uf(this.e,Math.sin(this.lat_ts),Math.cos(this.lat_ts))/Gf(this.e,this.con*this.lat_ts,this.con*Math.sin(this.lat_ts))),this.ms1=Uf(this.e,this.sinlat0,this.coslat0),this.X0=2*Math.atan(yh(this.lat0,this.sinlat0,this.e))-J,this.cosX0=Math.cos(this.X0),this.sinX0=Math.sin(this.X0))}function xh(e){var t=e.x,n=e.y,r=Math.sin(n),i=Math.cos(n),a,o,s,c,l,u,d=Y(t-this.long0,this.over);return Math.abs(Math.abs(t-this.long0)-Math.PI)<=1e-10&&Math.abs(n+this.lat0)<=1e-10?(e.x=NaN,e.y=NaN,e):this.sphere?(a=2*this.k0/(1+this.sinlat0*r+this.coslat0*i*Math.cos(d)),e.x=this.a*a*i*Math.sin(d)+this.x0,e.y=this.a*a*(this.coslat0*r-this.sinlat0*i*Math.cos(d))+this.y0,e):(o=2*Math.atan(yh(n,r,this.e))-J,c=Math.cos(o),s=Math.sin(o),Math.abs(this.coslat0)<=1e-10?(l=Gf(this.e,n*this.con,this.con*r),u=2*this.a*this.k0*l/this.cons,e.x=this.x0+u*Math.sin(t-this.long0),e.y=this.y0-this.con*u*Math.cos(t-this.long0),e):(Math.abs(this.sinlat0)<1e-10?(a=2*this.a*this.k0/(1+c*Math.cos(d)),e.y=a*s):(a=2*this.a*this.k0*this.ms1/(this.cosX0*(1+this.sinX0*s+this.cosX0*c*Math.cos(d))),e.y=a*(this.cosX0*s-this.sinX0*c*Math.cos(d))+this.y0),e.x=a*c*Math.sin(d)+this.x0,e))}function Sh(e){e.x-=this.x0,e.y-=this.y0;var t,n,r,i,a,o=Math.sqrt(e.x*e.x+e.y*e.y);if(this.sphere){var s=2*Math.atan(o/(2*this.a*this.k0));return t=this.long0,n=this.lat0,o<=1e-10?(e.x=t,e.y=n,e):(n=Math.asin(Math.cos(s)*this.sinlat0+e.y*Math.sin(s)*this.coslat0/o),t=Math.abs(this.coslat0)<1e-10?this.lat0>0?Y(this.long0+Math.atan2(e.x,-1*e.y),this.over):Y(this.long0+Math.atan2(e.x,e.y),this.over):Y(this.long0+Math.atan2(e.x*Math.sin(s),o*this.coslat0*Math.cos(s)-e.y*this.sinlat0*Math.sin(s)),this.over),e.x=t,e.y=n,e)}else if(Math.abs(this.coslat0)<=1e-10){if(o<=1e-10)return n=this.lat0,t=this.long0,e.x=t,e.y=n,e;e.x*=this.con,e.y*=this.con,r=o*this.cons/(2*this.a*this.k0),n=this.con*Kf(this.e,r),t=this.con*Y(this.con*this.long0+Math.atan2(e.x,-1*e.y),this.over)}else i=2*Math.atan(o*this.cosX0/(2*this.a*this.k0*this.ms1)),t=this.long0,o<=1e-10?a=this.X0:(a=Math.asin(Math.cos(i)*this.sinX0+e.y*Math.sin(i)*this.cosX0/o),t=Y(this.long0+Math.atan2(e.x*Math.sin(i),o*this.cosX0*Math.cos(i)-e.y*this.sinX0*Math.sin(i)),this.over)),n=-1*Kf(this.e,Math.tan(.5*(J+a)));return e.x=t,e.y=n,e}var Ch={init:bh,forward:xh,inverse:Sh,names:[`stere`,`Stereographic_South_Pole`,`Polar_Stereographic_variant_A`,`Polar_Stereographic_variant_B`,`Polar_Stereographic`],ssfn_:yh};function wh(){this.k0||=1;var e=this.lat0;this.lambda0=this.long0;var t=Math.sin(e),n=this.a,r=1/this.rf,i=2*r-r**2,a=this.e=Math.sqrt(i);this.R=this.k0*n*Math.sqrt(1-i)/(1-i*t**2),this.alpha=Math.sqrt(1+i/(1-i)*Math.cos(e)**4),this.b0=Math.asin(t/this.alpha);var o=Math.log(Math.tan(Math.PI/4+this.b0/2)),s=Math.log(Math.tan(Math.PI/4+e/2)),c=Math.log((1+a*t)/(1-a*t));this.K=o-this.alpha*s+this.alpha*a/2*c}function Th(e){var t=Math.log(Math.tan(Math.PI/4-e.y/2)),n=this.e/2*Math.log((1+this.e*Math.sin(e.y))/(1-this.e*Math.sin(e.y))),r=-this.alpha*(t+n)+this.K,i=2*(Math.atan(Math.exp(r))-Math.PI/4),a=this.alpha*(e.x-this.lambda0),o=Math.atan(Math.sin(a)/(Math.sin(this.b0)*Math.tan(i)+Math.cos(this.b0)*Math.cos(a))),s=Math.asin(Math.cos(this.b0)*Math.sin(i)-Math.sin(this.b0)*Math.cos(i)*Math.cos(a));return e.y=this.R/2*Math.log((1+Math.sin(s))/(1-Math.sin(s)))+this.y0,e.x=this.R*o+this.x0,e}function Eh(e){for(var t=e.x-this.x0,n=e.y-this.y0,r=t/this.R,i=2*(Math.atan(Math.exp(n/this.R))-Math.PI/4),a=Math.asin(Math.cos(this.b0)*Math.sin(i)+Math.sin(this.b0)*Math.cos(i)*Math.cos(r)),o=Math.atan(Math.sin(r)/(Math.cos(this.b0)*Math.cos(r)-Math.sin(this.b0)*Math.tan(i))),s=this.lambda0+o/this.alpha,c=0,l=a,u=-1e3,d=0;Math.abs(l-u)>1e-7;){if(++d>20)return;c=1/this.alpha*(Math.log(Math.tan(Math.PI/4+a/2))-this.K)+this.e*Math.log(Math.tan(Math.PI/4+Math.asin(this.e*Math.sin(l))/2)),u=l,l=2*Math.atan(Math.exp(c))-Math.PI/2}return e.x=s,e.y=l,e}var Dh={init:wh,forward:Th,inverse:Eh,names:[`somerc`]},Oh=1e-7;function kh(e){var t=[`Hotine_Oblique_Mercator`,`Hotine_Oblique_Mercator_variant_A`,`Hotine_Oblique_Mercator_Azimuth_Natural_Origin`],n=typeof e.projName==`object`?Object.keys(e.projName)[0]:e.projName;return`no_uoff`in e||`no_off`in e||t.indexOf(n)!==-1||t.indexOf(ip(n))!==-1}function Ah(){var e,t,n,r,i,a,o,s,c,l,u=0,d,f=0,p=0,m=0,h=0,g=0,_=0;this.k0||=1,this.no_off=kh(this),this.no_rot=`no_rot`in this;var v=!1;`alpha`in this&&(v=!0);var y=!1;if(`rectified_grid_angle`in this&&(y=!0),v&&(_=this.alpha),y&&(u=this.rectified_grid_angle,v||=(_=0,!0)),v||y)f=this.longc;else if(p=this.long1,h=this.lat1,m=this.long2,g=this.lat2,Math.abs(h-g)<=Oh||(e=Math.abs(h))<=Oh||Math.abs(e-J)<=Oh||Math.abs(Math.abs(this.lat0)-J)<=Oh||Math.abs(Math.abs(g)-J)<=Oh)throw Error();var b=1-this.es;t=Math.sqrt(b),Math.abs(this.lat0)>1e-10?(s=Math.sin(this.lat0),n=Math.cos(this.lat0),e=1-this.es*s*s,this.B=n*n,this.B=Math.sqrt(1+this.es*this.B*this.B/b),this.A=this.B*this.k0*t/e,r=this.B*t/(n*Math.sqrt(e)),i=r*r-1,i<=0?i=0:(i=Math.sqrt(i),this.lat0<0&&(i=-i)),this.E=i+=r,this.E*=Gf(this.e,this.lat0,s)**+this.B):(this.B=1/t,this.A=this.k0,this.E=r=i=1),v||y?(v?(d=Math.asin(Math.sin(_)/r),y||(u=_)):(d=u,_=Math.asin(r*Math.sin(d))),this.lam0=f-Math.asin(.5*(i-1/i)*Math.tan(d))/this.B):(a=Gf(this.e,h,Math.sin(h))**+this.B,o=Gf(this.e,g,Math.sin(g))**+this.B,i=this.E/a,c=(o-a)/(o+a),l=this.E*this.E,l=(l-o*a)/(l+o*a),e=p-m,e<-Math.PI?m-=Jd:e>Math.PI&&(m+=Jd),this.lam0=Y(.5*(p+m)-Math.atan(l*Math.tan(.5*this.B*(p-m))/c)/this.B,this.over),d=Math.atan(2*Math.sin(this.B*Y(p-this.lam0,this.over))/(i-1/i)),u=_=Math.asin(r*Math.sin(d))),this.singam=Math.sin(d),this.cosgam=Math.cos(d),this.sinrot=Math.sin(u),this.cosrot=Math.cos(u),this.rB=1/this.B,this.ArB=this.A*this.rB,this.BrA=1/this.ArB,this.no_off?this.u_0=0:(this.u_0=Math.abs(this.ArB*Math.atan(Math.sqrt(r*r-1)/Math.cos(_))),this.lat0<0&&(this.u_0=-this.u_0)),i=.5*d,this.v_pole_n=this.ArB*Math.log(Math.tan(qd-i)),this.v_pole_s=this.ArB*Math.log(Math.tan(qd+i))}function jh(e){var t={},n,r,i,a,o,s,c,l;if(e.x-=this.lam0,Math.abs(Math.abs(e.y)-J)>1e-10){if(o=this.E/Gf(this.e,e.y,Math.sin(e.y))**+this.B,s=1/o,n=.5*(o-s),r=.5*(o+s),a=Math.sin(this.B*e.x),i=(n*this.singam-a*this.cosgam)/r,Math.abs(Math.abs(i)-1)<1e-10)throw Error();l=.5*this.ArB*Math.log((1-i)/(1+i)),s=Math.cos(this.B*e.x),c=Math.abs(s)<Oh?this.A*e.x:this.ArB*Math.atan2(n*this.cosgam+a*this.singam,s)}else l=e.y>0?this.v_pole_n:this.v_pole_s,c=this.ArB*e.y;return this.no_rot?(t.x=c,t.y=l):(c-=this.u_0,t.x=l*this.cosrot+c*this.sinrot,t.y=c*this.cosrot-l*this.sinrot),t.x=this.a*t.x+this.x0,t.y=this.a*t.y+this.y0,t}function Mh(e){var t,n,r,i,a,o,s,c={};if(e.x=(e.x-this.x0)*(1/this.a),e.y=(e.y-this.y0)*(1/this.a),this.no_rot?(n=e.y,t=e.x):(n=e.x*this.cosrot-e.y*this.sinrot,t=e.y*this.cosrot+e.x*this.sinrot+this.u_0),r=Math.exp(-this.BrA*n),i=.5*(r-1/r),a=.5*(r+1/r),o=Math.sin(this.BrA*t),s=(o*this.cosgam+i*this.singam)/a,Math.abs(Math.abs(s)-1)<1e-10)c.x=0,c.y=s<0?-J:J;else{if(c.y=this.E/Math.sqrt((1+s)/(1-s)),c.y=Kf(this.e,c.y**(1/this.B)),c.y===1/0)throw Error();c.x=-this.rB*Math.atan2(i*this.cosgam-o*this.singam,Math.cos(this.BrA*t))}return c.x+=this.lam0,c}var Nh={init:Ah,forward:jh,inverse:Mh,names:[`Hotine_Oblique_Mercator`,`Hotine Oblique Mercator`,`Hotine_Oblique_Mercator_variant_A`,`Hotine_Oblique_Mercator_Variant_B`,`Hotine_Oblique_Mercator_Azimuth_Natural_Origin`,`Hotine_Oblique_Mercator_Two_Point_Natural_Origin`,`Hotine_Oblique_Mercator_Azimuth_Center`,`Oblique_Mercator`,`omerc`]};function Ph(){if(this.lat2||=this.lat1,this.k0||=1,this.x0=this.x0||0,this.y0=this.y0||0,this.long0=this.long0||0,!(Math.abs(this.lat1+this.lat2)<1e-10)){var e=this.b/this.a;this.e=Math.sqrt(1-e*e);var t=Math.sin(this.lat1),n=Math.cos(this.lat1),r=Uf(this.e,t,n),i=Gf(this.e,this.lat1,t),a=Math.sin(this.lat2),o=Math.cos(this.lat2),s=Uf(this.e,a,o),c=Gf(this.e,this.lat2,a),l=Gf(this.e,this.lat0,Math.sin(this.lat0));Math.abs(this.lat1-this.lat2)>1e-10?this.ns=Math.log(r/s)/Math.log(i/c):this.ns=t,isNaN(this.ns)&&(this.ns=t),this.f0=r/(this.ns*i**+this.ns),this.rh=Math.abs(Math.abs(this.lat0)-J)<1e-10?0:this.a*this.f0*l**+this.ns,this.title||=`Lambert Conformal Conic`}}function Fh(e){var t=e.x,n=e.y;Math.abs(2*Math.abs(n)-Math.PI)<=1e-10&&(n=Wf(n)*(J-2*Wd));var r=Math.abs(Math.abs(n)-J),i,a;if(r>1e-10)i=Gf(this.e,n,Math.sin(n)),a=this.a*this.f0*i**+this.ns;else{if(r=n*this.ns,r<=0)return null;a=0}var o=this.ns*Y(t-this.long0,this.over);return e.x=this.k0*(a*Math.sin(o))+this.x0,e.y=this.k0*(this.rh-a*Math.cos(o))+this.y0,e}function Ih(e){var t,n,r,i,a,o=(e.x-this.x0)/this.k0,s=this.rh-(e.y-this.y0)/this.k0;this.ns>0?(t=Math.sqrt(o*o+s*s),n=1):(t=-Math.sqrt(o*o+s*s),n=-1);var c=0;if(t!==0&&(c=Math.atan2(n*o,n*s)),t!==0||this.ns>0){if(n=1/this.ns,r=(t/(this.a*this.f0))**+n,i=Kf(this.e,r),i===-9999)return null}else i=-J;return a=Y(c/this.ns+this.long0,this.over),e.x=a,e.y=i,e}var Lh={init:Ph,forward:Fh,inverse:Ih,names:[`Lambert Tangential Conformal Conic Projection`,`Lambert_Conformal_Conic`,`Lambert_Conformal_Conic_1SP`,`Lambert_Conformal_Conic_2SP`,`lcc`,`Lambert Conic Conformal (1SP)`,`Lambert Conic Conformal (2SP)`]};function Rh(){this.a=6377397.155,this.es=.006674372230614,this.e=Math.sqrt(this.es),this.lat0||=.863937979737193,this.long0||=.4334234309119251,this.k0||=.9999,this.s45=.785398163397448,this.s90=2*this.s45,this.fi0=this.lat0,this.e2=this.es,this.e=Math.sqrt(this.e2),this.alfa=Math.sqrt(1+this.e2*Math.cos(this.fi0)**4/(1-this.e2)),this.uq=1.04216856380474,this.u0=Math.asin(Math.sin(this.fi0)/this.alfa),this.g=((1+this.e*Math.sin(this.fi0))/(1-this.e*Math.sin(this.fi0)))**(this.alfa*this.e/2),this.k=Math.tan(this.u0/2+this.s45)/Math.tan(this.fi0/2+this.s45)**+this.alfa*this.g,this.k1=this.k0,this.n0=this.a*Math.sqrt(1-this.e2)/(1-this.e2*Math.sin(this.fi0)**2),this.s0=1.37008346281555,this.n=Math.sin(this.s0),this.ro0=this.k1*this.n0/Math.tan(this.s0),this.ad=this.s90-this.uq}function zh(e){var t,n,r,i,a,o,s,c=e.x,l=e.y,u=Y(c-this.long0,this.over);return t=((1+this.e*Math.sin(l))/(1-this.e*Math.sin(l)))**(this.alfa*this.e/2),n=2*(Math.atan(this.k*Math.tan(l/2+this.s45)**+this.alfa/t)-this.s45),r=-u*this.alfa,i=Math.asin(Math.cos(this.ad)*Math.sin(n)+Math.sin(this.ad)*Math.cos(n)*Math.cos(r)),a=Math.asin(Math.cos(n)*Math.sin(r)/Math.cos(i)),o=this.n*a,s=this.ro0*Math.tan(this.s0/2+this.s45)**+this.n/Math.tan(i/2+this.s45)**+this.n,e.y=s*Math.cos(o)/1,e.x=s*Math.sin(o)/1,this.czech||(e.y*=-1,e.x*=-1),e}function Bh(e){var t,n,r,i,a,o,s,c,l=e.x;e.x=e.y,e.y=l,this.czech||(e.y*=-1,e.x*=-1),o=Math.sqrt(e.x*e.x+e.y*e.y),a=Math.atan2(e.y,e.x),i=a/Math.sin(this.s0),r=2*(Math.atan((this.ro0/o)**(1/this.n)*Math.tan(this.s0/2+this.s45))-this.s45),t=Math.asin(Math.cos(this.ad)*Math.sin(r)-Math.sin(this.ad)*Math.cos(r)*Math.cos(i)),n=Math.asin(Math.cos(r)*Math.sin(i)/Math.cos(t)),e.x=this.long0-n/this.alfa,s=t,c=0;var u=0;do e.y=2*(Math.atan(this.k**(-1/this.alfa)*Math.tan(t/2+this.s45)**(1/this.alfa)*((1+this.e*Math.sin(s))/(1-this.e*Math.sin(s)))**(this.e/2))-this.s45),Math.abs(s-e.y)<1e-10&&(c=1),s=e.y,u+=1;while(c===0&&u<15);return u>=15?null:e}var Vh={init:Rh,forward:zh,inverse:Bh,names:[`Krovak`,`Krovak Modified`,`Krovak (North Orientated)`,`Krovak Modified (North Orientated)`,`krovak`]};function Hh(e,t,n,r,i){return e*i-t*Math.sin(2*i)+n*Math.sin(4*i)-r*Math.sin(6*i)}function Uh(e){return 1-.25*e*(1+e/16*(3+1.25*e))}function Wh(e){return .375*e*(1+.25*e*(1+.46875*e))}function Gh(e){return .05859375*e*e*(1+.75*e)}function Kh(e){return e*e*e*(35/3072)}function qh(e,t,n){var r=t*n;return e/Math.sqrt(1-r*r)}function Jh(e){return Math.abs(e)<J?e:e-Wf(e)*Math.PI}function Yh(e,t,n,r,i){for(var a=e/t,o,s=0;s<15;s++)if(o=(e-(t*a-n*Math.sin(2*a)+r*Math.sin(4*a)-i*Math.sin(6*a)))/(t-2*n*Math.cos(2*a)+4*r*Math.cos(4*a)-6*i*Math.cos(6*a)),a+=o,Math.abs(o)<=1e-10)return a;return NaN}function Xh(){this.sphere||(this.e0=Uh(this.es),this.e1=Wh(this.es),this.e2=Gh(this.es),this.e3=Kh(this.es),this.ml0=this.a*Hh(this.e0,this.e1,this.e2,this.e3,this.lat0))}function Zh(e){var t,n,r=e.x,i=e.y;if(r=Y(r-this.long0,this.over),this.sphere)t=this.a*Math.asin(Math.cos(i)*Math.sin(r)),n=this.a*(Math.atan2(Math.tan(i),Math.cos(r))-this.lat0);else{var a=Math.sin(i),o=Math.cos(i),s=qh(this.a,this.e,a),c=Math.tan(i)*Math.tan(i),l=r*Math.cos(i),u=l*l,d=this.es*o*o/(1-this.es),f=this.a*Hh(this.e0,this.e1,this.e2,this.e3,i);t=s*l*(1-u*c*(1/6-(8-c+8*d)*u/120)),n=f-this.ml0+s*a/o*u*(.5+(5-c+6*d)*u/24)}return e.x=t+this.x0,e.y=n+this.y0,e}function Qh(e){e.x-=this.x0,e.y-=this.y0;var t=e.x/this.a,n=e.y/this.a,r,i;if(this.sphere){var a=n+this.lat0;r=Math.asin(Math.sin(a)*Math.cos(t)),i=Math.atan2(Math.tan(t),Math.cos(a))}else{var o=Yh(this.ml0/this.a+n,this.e0,this.e1,this.e2,this.e3);if(Math.abs(Math.abs(o)-J)<=1e-10)return e.x=this.long0,e.y=J,n<0&&(e.y*=-1),e;var s=qh(this.a,this.e,Math.sin(o)),c=s*s*s/this.a/this.a*(1-this.es),l=Math.tan(o)**2,u=t*this.a/s,d=u*u;r=o-s*Math.tan(o)/c*u*u*(.5-(1+3*l)*u*u/24),i=u*(1-d*(l/3+(1+3*l)*l*d/15))/Math.cos(o)}return e.x=Y(i+this.long0,this.over),e.y=Jh(r),e}var $h={init:Xh,forward:Zh,inverse:Qh,names:[`Cassini`,`Cassini_Soldner`,`cass`]};function eg(e,t){var n;return e>1e-7?(n=e*t,(1-e*e)*(t/(1-n*n)-.5/e*Math.log((1-n)/(1+n)))):2*t}var tg=.3333333333333333,ng=.17222222222222222,rg=.10257936507936508,ig=.06388888888888888,ag=.0664021164021164,og=.016415012942191543;function sg(e){var t,n=[];return n[0]=e*tg,t=e*e,n[0]+=t*ng,n[1]=t*ig,t*=e,n[0]+=t*rg,n[1]+=t*ag,n[2]=t*og,n}function cg(e,t){var n=e+e;return e+t[0]*Math.sin(n)+t[1]*Math.sin(n+n)+t[2]*Math.sin(n+n+n)}function lg(){var e=Math.abs(this.lat0);if(Math.abs(e-J)<1e-10?this.mode=this.lat0<0?1:2:Math.abs(e)<1e-10?this.mode=3:this.mode=4,this.es>0){var t;switch(this.qp=eg(this.e,1),this.mmf=.5/(1-this.es),this.apa=sg(this.es),this.mode){case 2:this.dd=1;break;case 1:this.dd=1;break;case 3:this.rq=Math.sqrt(.5*this.qp),this.dd=1/this.rq,this.xmf=1,this.ymf=.5*this.qp;break;case 4:this.rq=Math.sqrt(.5*this.qp),t=Math.sin(this.lat0),this.sinb1=eg(this.e,t)/this.qp,this.cosb1=Math.sqrt(1-this.sinb1*this.sinb1),this.dd=Math.cos(this.lat0)/(Math.sqrt(1-this.es*t*t)*this.rq*this.cosb1),this.ymf=(this.xmf=this.rq)/this.dd,this.xmf*=this.dd;break}}else this.mode===4&&(this.sinph0=Math.sin(this.lat0),this.cosph0=Math.cos(this.lat0))}function ug(e){var t,n,r,i,a,o,s,c,l,u,d=e.x,f=e.y;if(d=Y(d-this.long0,this.over),this.sphere){if(a=Math.sin(f),u=Math.cos(f),r=Math.cos(d),this.mode===this.OBLIQ||this.mode===this.EQUIT){if(n=this.mode===this.EQUIT?1+u*r:1+this.sinph0*a+this.cosph0*u*r,n<=1e-10)return null;n=Math.sqrt(2/n),t=n*u*Math.sin(d),n*=this.mode===this.EQUIT?a:this.cosph0*a-this.sinph0*u*r}else if(this.mode===this.N_POLE||this.mode===this.S_POLE){if(this.mode===this.N_POLE&&(r=-r),Math.abs(f+this.lat0)<1e-10)return null;n=qd-f*.5,n=2*(this.mode===this.S_POLE?Math.cos(n):Math.sin(n)),t=n*Math.sin(d),n*=r}}else{switch(s=0,c=0,l=0,r=Math.cos(d),i=Math.sin(d),a=Math.sin(f),o=eg(this.e,a),(this.mode===this.OBLIQ||this.mode===this.EQUIT)&&(s=o/this.qp,c=Math.sqrt(1-s*s)),this.mode){case this.OBLIQ:l=1+this.sinb1*s+this.cosb1*c*r;break;case this.EQUIT:l=1+c*r;break;case this.N_POLE:l=J+f,o=this.qp-o;break;case this.S_POLE:l=f-J,o=this.qp+o;break}if(Math.abs(l)<1e-10)return null;switch(this.mode){case this.OBLIQ:case this.EQUIT:l=Math.sqrt(2/l),n=this.mode===this.OBLIQ?this.ymf*l*(this.cosb1*s-this.sinb1*c*r):(l=Math.sqrt(2/(1+c*r)))*s*this.ymf,t=this.xmf*l*c*i;break;case this.N_POLE:case this.S_POLE:o>=0?(t=(l=Math.sqrt(o))*i,n=r*(this.mode===this.S_POLE?l:-l)):t=n=0;break}}return e.x=this.a*t+this.x0,e.y=this.a*n+this.y0,e}function dg(e){e.x-=this.x0,e.y-=this.y0;var t=e.x/this.a,n=e.y/this.a,r,i,a,o,s,c,l;if(this.sphere){var u=0,d,f=0;if(d=Math.sqrt(t*t+n*n),i=d*.5,i>1)return null;switch(i=2*Math.asin(i),(this.mode===this.OBLIQ||this.mode===this.EQUIT)&&(f=Math.sin(i),u=Math.cos(i)),this.mode){case this.EQUIT:i=Math.abs(d)<=1e-10?0:Math.asin(n*f/d),t*=f,n=u*d;break;case this.OBLIQ:i=Math.abs(d)<=1e-10?this.lat0:Math.asin(u*this.sinph0+n*f*this.cosph0/d),t*=f*this.cosph0,n=(u-Math.sin(i)*this.sinph0)*d;break;case this.N_POLE:n=-n,i=J-i;break;case this.S_POLE:i-=J;break}r=n===0&&(this.mode===this.EQUIT||this.mode===this.OBLIQ)?0:Math.atan2(t,n)}else{if(l=0,this.mode===this.OBLIQ||this.mode===this.EQUIT){if(t/=this.dd,n*=this.dd,c=Math.sqrt(t*t+n*n),c<1e-10)return e.x=this.long0,e.y=this.lat0,e;o=2*Math.asin(.5*c/this.rq),a=Math.cos(o),t*=o=Math.sin(o),this.mode===this.OBLIQ?(l=a*this.sinb1+n*o*this.cosb1/c,s=this.qp*l,n=c*this.cosb1*a-n*this.sinb1*o):(l=n*o/c,s=this.qp*l,n=c*a)}else if(this.mode===this.N_POLE||this.mode===this.S_POLE){if(this.mode===this.N_POLE&&(n=-n),s=t*t+n*n,!s)return e.x=this.long0,e.y=this.lat0,e;l=1-s/this.qp,this.mode===this.S_POLE&&(l=-l)}r=Math.atan2(t,n),i=cg(Math.asin(l),this.apa)}return e.x=Y(this.long0+r,this.over),e.y=i,e}var fg={init:lg,forward:ug,inverse:dg,names:[`Lambert Azimuthal Equal Area`,`Lambert_Azimuthal_Equal_Area`,`laea`],S_POLE:1,N_POLE:2,EQUIT:3,OBLIQ:4};function pg(e){return Math.abs(e)>1&&(e=e>1?1:-1),Math.asin(e)}function mg(){Math.abs(this.lat1+this.lat2)<1e-10||(this.temp=this.b/this.a,this.es=1-this.temp**2,this.e3=Math.sqrt(this.es),this.sin_po=Math.sin(this.lat1),this.cos_po=Math.cos(this.lat1),this.t1=this.sin_po,this.con=this.sin_po,this.ms1=Uf(this.e3,this.sin_po,this.cos_po),this.qs1=eg(this.e3,this.sin_po),this.sin_po=Math.sin(this.lat2),this.cos_po=Math.cos(this.lat2),this.t2=this.sin_po,this.ms2=Uf(this.e3,this.sin_po,this.cos_po),this.qs2=eg(this.e3,this.sin_po),this.sin_po=Math.sin(this.lat0),this.cos_po=Math.cos(this.lat0),this.t3=this.sin_po,this.qs0=eg(this.e3,this.sin_po),Math.abs(this.lat1-this.lat2)>1e-10?this.ns0=(this.ms1*this.ms1-this.ms2*this.ms2)/(this.qs2-this.qs1):this.ns0=this.con,this.c=this.ms1*this.ms1+this.ns0*this.qs1,this.rh=this.a*Math.sqrt(this.c-this.ns0*this.qs0)/this.ns0)}function hg(e){var t=e.x,n=e.y;this.sin_phi=Math.sin(n),this.cos_phi=Math.cos(n);var r=eg(this.e3,this.sin_phi),i=this.a*Math.sqrt(this.c-this.ns0*r)/this.ns0,a=this.ns0*Y(t-this.long0,this.over),o=i*Math.sin(a)+this.x0,s=this.rh-i*Math.cos(a)+this.y0;return e.x=o,e.y=s,e}function gg(e){var t,n,r,i,a,o;return e.x-=this.x0,e.y=this.rh-e.y+this.y0,this.ns0>=0?(t=Math.sqrt(e.x*e.x+e.y*e.y),r=1):(t=-Math.sqrt(e.x*e.x+e.y*e.y),r=-1),i=0,t!==0&&(i=Math.atan2(r*e.x,r*e.y)),r=t*this.ns0/this.a,this.sphere?o=Math.asin((this.c-r*r)/(2*this.ns0)):(n=(this.c-r*r)/this.ns0,o=this.phi1z(this.e3,n)),a=Y(i/this.ns0+this.long0,this.over),e.x=a,e.y=o,e}function _g(e,t){var n,r,i,a,o,s=pg(.5*t);if(e<1e-10)return s;for(var c=e*e,l=1;l<=25;l++)if(n=Math.sin(s),r=Math.cos(s),i=e*n,a=1-i*i,o=.5*a*a/r*(t/(1-c)-n/a+.5/e*Math.log((1-i)/(1+i))),s+=o,Math.abs(o)<=1e-7)return s;return null}var vg={init:mg,forward:hg,inverse:gg,names:[`Albers_Conic_Equal_Area`,`Albers_Equal_Area`,`Albers`,`aea`],phi1z:_g};function yg(){this.sin_p14=Math.sin(this.lat0),this.cos_p14=Math.cos(this.lat0),this.infinity_dist=1e3*this.a,this.rc=1}function bg(e){var t,n,r,i,a,o,s,c,l=e.x,u=e.y;return r=Y(l-this.long0,this.over),t=Math.sin(u),n=Math.cos(u),i=Math.cos(r),o=this.sin_p14*t+this.cos_p14*n*i,a=1,o>0||Math.abs(o)<=1e-10?(s=this.x0+this.a*a*n*Math.sin(r)/o,c=this.y0+this.a*a*(this.cos_p14*t-this.sin_p14*n*i)/o):(s=this.x0+this.infinity_dist*n*Math.sin(r),c=this.y0+this.infinity_dist*(this.cos_p14*t-this.sin_p14*n*i)),e.x=s,e.y=c,e}function xg(e){var t,n,r,i,a,o;return e.x=(e.x-this.x0)/this.a,e.y=(e.y-this.y0)/this.a,e.x/=this.k0,e.y/=this.k0,(t=Math.sqrt(e.x*e.x+e.y*e.y))?(i=Math.atan2(t,this.rc),n=Math.sin(i),r=Math.cos(i),o=pg(r*this.sin_p14+e.y*n*this.cos_p14/t),a=Math.atan2(e.x*n,t*this.cos_p14*r-e.y*this.sin_p14*n),a=Y(this.long0+a,this.over)):(o=this.phic0,a=0),e.x=a,e.y=o,e}var Sg={init:yg,forward:bg,inverse:xg,names:[`gnom`]};function Cg(e,t){var n=1-(1-e*e)/(2*e)*Math.log((1-e)/(1+e));if(Math.abs(Math.abs(t)-n)<1e-6)return t<0?-1*J:J;for(var r=Math.asin(.5*t),i,a,o,s,c=0;c<30;c++)if(a=Math.sin(r),o=Math.cos(r),s=e*a,i=(1-s*s)**2/(2*o)*(t/(1-e*e)-a/(1-s*s)+.5/e*Math.log((1-s)/(1+s))),r+=i,Math.abs(i)<=1e-10)return r;return NaN}function wg(){this.sphere||(this.k0=Uf(this.e,Math.sin(this.lat_ts),Math.cos(this.lat_ts)))}function Tg(e){var t=e.x,n=e.y,r,i,a=Y(t-this.long0,this.over);if(this.sphere)r=this.x0+this.a*a*Math.cos(this.lat_ts),i=this.y0+this.a*Math.sin(n)/Math.cos(this.lat_ts);else{var o=eg(this.e,Math.sin(n));r=this.x0+this.a*this.k0*a,i=this.y0+this.a*o*.5/this.k0}return e.x=r,e.y=i,e}function Eg(e){e.x-=this.x0,e.y-=this.y0;var t,n;return this.sphere?(t=Y(this.long0+e.x/this.a/Math.cos(this.lat_ts),this.over),n=Math.asin(e.y/this.a*Math.cos(this.lat_ts))):(n=Cg(this.e,2*e.y*this.k0/this.a),t=Y(this.long0+e.x/(this.a*this.k0),this.over)),e.x=t,e.y=n,e}var Dg={init:wg,forward:Tg,inverse:Eg,names:[`cea`]};function Og(){this.x0=this.x0||0,this.y0=this.y0||0,this.lat0=this.lat0||0,this.long0=this.long0||0,this.lat_ts=this.lat_ts||0,this.title=this.title||`Equidistant Cylindrical (Plate Carre)`,this.rc=Math.cos(this.lat_ts)}function kg(e){var t=e.x,n=e.y,r=Y(t-this.long0,this.over),i=Jh(n-this.lat0);return e.x=this.x0+this.a*r*this.rc,e.y=this.y0+this.a*i,e}function Ag(e){var t=e.x,n=e.y;return e.x=Y(this.long0+(t-this.x0)/(this.a*this.rc),this.over),e.y=Jh(this.lat0+(n-this.y0)/this.a),e}var jg={init:Og,forward:kg,inverse:Ag,names:[`Equirectangular`,`Equidistant_Cylindrical`,`Equidistant_Cylindrical_Spherical`,`eqc`]},Mg=20;function Ng(){this.temp=this.b/this.a,this.es=1-this.temp**2,this.e=Math.sqrt(this.es),this.e0=Uh(this.es),this.e1=Wh(this.es),this.e2=Gh(this.es),this.e3=Kh(this.es),this.ml0=this.a*Hh(this.e0,this.e1,this.e2,this.e3,this.lat0)}function Pg(e){var t=e.x,n=e.y,r,i,a,o=Y(t-this.long0,this.over);if(a=o*Math.sin(n),this.sphere)Math.abs(n)<=1e-10?(r=this.a*o,i=-1*this.a*this.lat0):(r=this.a*Math.sin(a)/Math.tan(n),i=this.a*(Jh(n-this.lat0)+(1-Math.cos(a))/Math.tan(n)));else if(Math.abs(n)<=1e-10)r=this.a*o,i=-1*this.ml0;else{var s=qh(this.a,this.e,Math.sin(n))/Math.tan(n);r=s*Math.sin(a),i=this.a*Hh(this.e0,this.e1,this.e2,this.e3,n)-this.ml0+s*(1-Math.cos(a))}return e.x=r+this.x0,e.y=i+this.y0,e}function Fg(e){var t,n,r=e.x-this.x0,i=e.y-this.y0,a,o,s,c,l;if(this.sphere)if(Math.abs(i+this.a*this.lat0)<=1e-10)t=Y(r/this.a+this.long0,this.over),n=0;else{o=this.lat0+i/this.a,s=r*r/this.a/this.a+o*o,c=o;var u;for(a=Mg;a;--a)if(u=Math.tan(c),l=-1*(o*(c*u+1)-c-.5*(c*c+s)*u)/((c-o)/u-1),c+=l,Math.abs(l)<=1e-10){n=c;break}t=Y(this.long0+Math.asin(r*Math.tan(c)/this.a)/Math.sin(n),this.over)}else if(Math.abs(i+this.ml0)<=1e-10)n=0,t=Y(this.long0+r/this.a,this.over);else{o=(this.ml0+i)/this.a,s=r*r/this.a/this.a+o*o,c=o;var d,f,p,m,h;for(a=Mg;a;--a)if(h=this.e*Math.sin(c),d=Math.sqrt(1-h*h)*Math.tan(c),f=this.a*Hh(this.e0,this.e1,this.e2,this.e3,c),p=this.e0-2*this.e1*Math.cos(2*c)+4*this.e2*Math.cos(4*c)-6*this.e3*Math.cos(6*c),m=f/this.a,l=(o*(d*m+1)-m-.5*d*(m*m+s))/(this.es*Math.sin(2*c)*(m*m+s-2*o*m)/(4*d)+(o-m)*(d*p-2/Math.sin(2*c))-p),c-=l,Math.abs(l)<=1e-10){n=c;break}d=Math.sqrt(1-this.es*Math.sin(n)**2)*Math.tan(n),t=Y(this.long0+Math.asin(r*d/this.a)/Math.sin(n),this.over)}return e.x=t,e.y=n,e}var Ig={init:Ng,forward:Pg,inverse:Fg,names:[`Polyconic`,`American_Polyconic`,`poly`]};function Lg(){this.A=[],this.A[1]=.6399175073,this.A[2]=-.1358797613,this.A[3]=.063294409,this.A[4]=-.02526853,this.A[5]=.0117879,this.A[6]=-.0055161,this.A[7]=.0026906,this.A[8]=-.001333,this.A[9]=67e-5,this.A[10]=-34e-5,this.B_re=[],this.B_im=[],this.B_re[1]=.7557853228,this.B_im[1]=0,this.B_re[2]=.249204646,this.B_im[2]=.003371507,this.B_re[3]=-.001541739,this.B_im[3]=.04105856,this.B_re[4]=-.10162907,this.B_im[4]=.01727609,this.B_re[5]=-.26623489,this.B_im[5]=-.36249218,this.B_re[6]=-.6870983,this.B_im[6]=-1.1651967,this.C_re=[],this.C_im=[],this.C_re[1]=1.3231270439,this.C_im[1]=0,this.C_re[2]=-.577245789,this.C_im[2]=-.007809598,this.C_re[3]=.508307513,this.C_im[3]=-.112208952,this.C_re[4]=-.15094762,this.C_im[4]=.18200602,this.C_re[5]=1.01418179,this.C_im[5]=1.64497696,this.C_re[6]=1.9660549,this.C_im[6]=2.5127645,this.D=[],this.D[1]=1.5627014243,this.D[2]=.5185406398,this.D[3]=-.03333098,this.D[4]=-.1052906,this.D[5]=-.0368594,this.D[6]=.007317,this.D[7]=.0122,this.D[8]=.00394,this.D[9]=-.0013}function Rg(e){var t,n=e.x,r=e.y-this.lat0,i=n-this.long0,a=r/Bd*1e-5,o=i,s=1,c=0;for(t=1;t<=10;t++)s*=a,c+=this.A[t]*s;var l=c,u=o,d=1,f=0,p,m,h=0,g=0;for(t=1;t<=6;t++)p=d*l-f*u,m=f*l+d*u,d=p,f=m,h=h+this.B_re[t]*d-this.B_im[t]*f,g=g+this.B_im[t]*d+this.B_re[t]*f;return e.x=g*this.a+this.x0,e.y=h*this.a+this.y0,e}function zg(e){var t,n=e.x,r=e.y,i=n-this.x0,a=(r-this.y0)/this.a,o=i/this.a,s=1,c=0,l,u,d=0,f=0;for(t=1;t<=6;t++)l=s*a-c*o,u=c*a+s*o,s=l,c=u,d=d+this.C_re[t]*s-this.C_im[t]*c,f=f+this.C_im[t]*s+this.C_re[t]*c;for(var p=0;p<this.iterations;p++){var m=d,h=f,g,_,v=a,y=o;for(t=2;t<=6;t++)g=m*d-h*f,_=h*d+m*f,m=g,h=_,v+=(t-1)*(this.B_re[t]*m-this.B_im[t]*h),y+=(t-1)*(this.B_im[t]*m+this.B_re[t]*h);m=1,h=0;var b=this.B_re[1],x=this.B_im[1];for(t=2;t<=6;t++)g=m*d-h*f,_=h*d+m*f,m=g,h=_,b+=t*(this.B_re[t]*m-this.B_im[t]*h),x+=t*(this.B_im[t]*m+this.B_re[t]*h);var S=b*b+x*x;d=(v*b+y*x)/S,f=(y*b-v*x)/S}var C=d,w=f,T=1,E=0;for(t=1;t<=9;t++)T*=C,E+=this.D[t]*T;var D=this.lat0+E*Bd*1e5;return e.x=this.long0+w,e.y=D,e}var Bg={init:Lg,forward:Rg,inverse:zg,names:[`New_Zealand_Map_Grid`,`nzmg`],iterations:1};function Vg(){}function Hg(e){var t=e.x,n=e.y,r=Y(t-this.long0,this.over),i=this.x0+this.a*r,a=this.y0+this.a*Math.log(Math.tan(Math.PI/4+n/2.5))*1.25;return e.x=i,e.y=a,e}function Ug(e){e.x-=this.x0,e.y-=this.y0;var t=Y(this.long0+e.x/this.a,this.over),n=2.5*(Math.atan(Math.exp(.8*e.y/this.a))-Math.PI/4);return e.x=t,e.y=n,e}var Wg={init:Vg,forward:Hg,inverse:Ug,names:[`Miller_Cylindrical`,`mill`]},Gg=20;function Kg(){this.long0=this.long0||0,this.sphere?(this.n=1,this.m=0,this.es=0,this.C_y=Math.sqrt((this.m+1)/this.n),this.C_x=this.C_y/(this.m+1)):this.en=zm(this.es)}function qg(e){var t,n,r=e.x,i=e.y;if(r=Y(r-this.long0,this.over),this.sphere){if(!this.m)i=this.n===1?i:Math.asin(this.n*Math.sin(i));else for(var a=this.n*Math.sin(i),o=Gg;o;--o){var s=(this.m*i+Math.sin(i)-a)/(this.m+Math.cos(i));if(i-=s,Math.abs(s)<1e-10)break}t=this.a*this.C_x*r*(this.m+Math.cos(i)),n=this.a*this.C_y*i}else{var c=Math.sin(i),l=Math.cos(i);n=this.a*Bm(i,c,l,this.en),t=this.a*r*l/Math.sqrt(1-this.es*c*c)}return e.x=t,e.y=n,e}function Jg(e){var t,n,r,i;return e.x-=this.x0,r=e.x/this.a,e.y-=this.y0,t=e.y/this.a,this.sphere?(t/=this.C_y,r/=this.C_x*(this.m+Math.cos(t)),this.m?t=pg((this.m*t+Math.sin(t))/this.n):this.n!==1&&(t=pg(Math.sin(t)/this.n)),r=Y(r+this.long0,this.over),t=Jh(t)):(t=Hm(e.y/this.a,this.es,this.en),i=Math.abs(t),i<J?(i=Math.sin(t),n=this.long0+e.x*Math.sqrt(1-this.es*i*i)/(this.a*Math.cos(t)),r=Y(n,this.over)):i-1e-10<J&&(r=this.long0)),e.x=r,e.y=t,e}var Yg={init:Kg,forward:qg,inverse:Jg,names:[`Sinusoidal`,`sinu`]};function Xg(){this.sphere=!0,this.b=this.a,this.m=1,this.n=2.5707963267948966,this.es=0,this.C_y=Math.sqrt((this.m+1)/this.n),this.C_x=this.C_y/(this.m+1)}var Zg={init:Xg,forward:qg,inverse:Jg,names:[`Eckert_VI`,`eck6`]};function Qg(){this.x0=this.x0===void 0?0:this.x0,this.y0=this.y0===void 0?0:this.y0,this.long0=this.long0===void 0?0:this.long0}function $g(e){for(var t=e.x,n=e.y,r=Y(t-this.long0,this.over),i=n,a=Math.PI*Math.sin(n);;){var o=-(i+Math.sin(i)-a)/(1+Math.cos(i));if(i+=o,Math.abs(o)<1e-10)break}i/=2,Math.PI/2-Math.abs(n)<1e-10&&(r=0);var s=.900316316158*this.a*r*Math.cos(i)+this.x0,c=1.4142135623731*this.a*Math.sin(i)+this.y0;return e.x=s,e.y=c,e}function e_(e){var t,n;e.x-=this.x0,e.y-=this.y0,n=e.y/(1.4142135623731*this.a),Math.abs(n)>.999999999999&&(n=.999999999999),t=Math.asin(n);var r=Y(this.long0+e.x/(.900316316158*this.a*Math.cos(t)),this.over);r<-Math.PI&&(r=-Math.PI),r>Math.PI&&(r=Math.PI),n=(2*t+Math.sin(2*t))/Math.PI,Math.abs(n)>1&&(n=1);var i=Math.asin(n);return e.x=r,e.y=i,e}var t_={init:Qg,forward:$g,inverse:e_,names:[`Mollweide`,`moll`]};function n_(){Math.abs(this.lat1+this.lat2)<1e-10||(this.lat2=this.lat2||this.lat1,this.temp=this.b/this.a,this.es=1-this.temp**2,this.e=Math.sqrt(this.es),this.e0=Uh(this.es),this.e1=Wh(this.es),this.e2=Gh(this.es),this.e3=Kh(this.es),this.sin_phi=Math.sin(this.lat1),this.cos_phi=Math.cos(this.lat1),this.ms1=Uf(this.e,this.sin_phi,this.cos_phi),this.ml1=Hh(this.e0,this.e1,this.e2,this.e3,this.lat1),Math.abs(this.lat1-this.lat2)<1e-10?this.ns=this.sin_phi:(this.sin_phi=Math.sin(this.lat2),this.cos_phi=Math.cos(this.lat2),this.ms2=Uf(this.e,this.sin_phi,this.cos_phi),this.ml2=Hh(this.e0,this.e1,this.e2,this.e3,this.lat2),this.ns=(this.ms1-this.ms2)/(this.ml2-this.ml1)),this.g=this.ml1+this.ms1/this.ns,this.ml0=Hh(this.e0,this.e1,this.e2,this.e3,this.lat0),this.rh=this.a*(this.g-this.ml0))}function r_(e){var t=e.x,n=e.y,r;if(this.sphere)r=this.a*(this.g-n);else{var i=Hh(this.e0,this.e1,this.e2,this.e3,n);r=this.a*(this.g-i)}var a=this.ns*Y(t-this.long0,this.over),o=this.x0+r*Math.sin(a),s=this.y0+this.rh-r*Math.cos(a);return e.x=o,e.y=s,e}function i_(e){e.x-=this.x0,e.y=this.rh-e.y+this.y0;var t,n,r,i;this.ns>=0?(n=Math.sqrt(e.x*e.x+e.y*e.y),t=1):(n=-Math.sqrt(e.x*e.x+e.y*e.y),t=-1);var a=0;return n!==0&&(a=Math.atan2(t*e.x,t*e.y)),this.sphere?(i=Y(this.long0+a/this.ns,this.over),r=Jh(this.g-n/this.a),e.x=i,e.y=r,e):(r=Yh(this.g-n/this.a,this.e0,this.e1,this.e2,this.e3),i=Y(this.long0+a/this.ns,this.over),e.x=i,e.y=r,e)}var a_={init:n_,forward:r_,inverse:i_,names:[`Equidistant_Conic`,`eqdc`]};function o_(){this.R=this.a}function s_(e){var t=e.x,n=e.y,r=Y(t-this.long0,this.over),i,a;if(Math.abs(n)<=1e-10)return i=this.x0+this.R*r,a=this.y0,e.x=i,e.y=a,e;var o=pg(2*Math.abs(n/Math.PI));if(Math.abs(r)<=1e-10||Math.abs(Math.abs(n)-J)<=1e-10)return i=this.x0,a=n>=0?this.y0+Math.PI*this.R*Math.tan(.5*o):this.y0+Math.PI*this.R*-Math.tan(.5*o),e.x=i,e.y=a,e;var s=.5*Math.abs(Math.PI/r-r/Math.PI),c=s*s,l=Math.sin(o),u=Math.cos(o),d=u/(l+u-1),f=d*d,p=d*(2/l-1),m=p*p,h=Math.PI*this.R*(s*(d-m)+Math.sqrt(c*(d-m)*(d-m)-(m+c)*(f-m)))/(m+c);r<0&&(h=-h),i=this.x0+h;var g=c+d;return h=Math.PI*this.R*(p*g-s*Math.sqrt((m+c)*(c+1)-g*g))/(m+c),a=n>=0?this.y0+h:this.y0-h,e.x=i,e.y=a,e}function c_(e){var t,n,r,i,a,o,s,c,l,u,d,f,p;return e.x-=this.x0,e.y-=this.y0,d=Math.PI*this.R,r=e.x/d,i=e.y/d,a=r*r+i*i,o=-Math.abs(i)*(1+a),s=o-2*i*i+r*r,c=-2*o+1+2*i*i+a*a,p=i*i/c+(2*s*s*s/c/c/c-9*o*s/c/c)/27,l=(o-s*s/3/c)/c,u=2*Math.sqrt(-l/3),d=3*p/l/u,Math.abs(d)>1&&(d=d>=0?1:-1),f=Math.acos(d)/3,n=e.y>=0?(-u*Math.cos(f+Math.PI/3)-s/3/c)*Math.PI:-(-u*Math.cos(f+Math.PI/3)-s/3/c)*Math.PI,t=Math.abs(r)<1e-10?this.long0:Y(this.long0+Math.PI*(a-1+Math.sqrt(1+2*(r*r-i*i)+a*a))/2/r,this.over),e.x=t,e.y=n,e}var l_={init:o_,forward:s_,inverse:c_,names:[`Van_der_Grinten_I`,`VanDerGrinten`,`Van_der_Grinten`,`vandg`]};function u_(e,t,n,r,i,a){let o=r-t,s=Math.atan((1-a)*Math.tan(e)),c=Math.atan((1-a)*Math.tan(n)),l=Math.sin(s),u=Math.cos(s),d=Math.sin(c),f=Math.cos(c),p=o,m,h=100,g,_,v,y,b,x,S,C,w,T,E,D,O,k;do{if(g=Math.sin(p),_=Math.cos(p),v=Math.sqrt(f*g*(f*g)+(u*d-l*f*_)*(u*d-l*f*_)),v===0)return{azi1:0,s12:0};y=l*d+u*f*_,b=Math.atan2(v,y),x=u*f*g/v,S=1-x*x,C=S===0?0:y-2*l*d/S,w=a/16*S*(4+a*(4-3*S)),m=p,p=o+(1-w)*a*x*(b+w*v*(C+w*y*(-1+2*C*C)))}while(Math.abs(p-m)>1e-12&&--h>0);return h===0?{azi1:NaN,s12:NaN}:(T=S*(i*i-i*(1-a)*(i*(1-a)))/(i*(1-a)*(i*(1-a))),E=1+T/16384*(4096+T*(-768+T*(320-175*T))),D=T/1024*(256+T*(-128+T*(74-47*T))),O=D*v*(C+D/4*(y*(-1+2*C*C)-D/6*C*(-3+4*v*v)*(-3+4*C*C))),k=i*(1-a)*E*(b-O),{azi1:Math.atan2(f*g,u*d-l*f*_),s12:k})}function d_(e,t,n,r,i,a){let o=Math.atan((1-a)*Math.tan(e)),s=Math.sin(o),c=Math.cos(o),l=Math.sin(n),u=Math.cos(n),d=Math.atan2(s,c*u),f=c*l,p=1-f*f,m=p*(i*i-i*(1-a)*(i*(1-a)))/(i*(1-a)*(i*(1-a))),h=1+m/16384*(4096+m*(-768+m*(320-175*m))),g=m/1024*(256+m*(-128+m*(74-47*m))),_=r/(i*(1-a)*h),v,y=100,b,x,S,C;do b=Math.cos(2*d+_),x=Math.sin(_),S=Math.cos(_),C=g*x*(b+g/4*(S*(-1+2*b*b)-g/6*b*(-3+4*x*x)*(-3+4*b*b))),v=_,_=r/(i*(1-a)*h)+C;while(Math.abs(_-v)>1e-12&&--y>0);if(y===0)return{lat2:NaN,lon2:NaN};let w=s*x-c*S*u,T=Math.atan2(s*S+c*x*u,(1-a)*Math.sqrt(f*f+w*w)),E=Math.atan2(x*l,c*S-s*x*u),D=a/16*p*(4+a*(4-3*p));return{lat2:T,lon2:t+(E-(1-D)*a*f*(_+D*x*(b+D*S*(-1+2*b*b))))}}function f_(){this.sin_p12=Math.sin(this.lat0),this.cos_p12=Math.cos(this.lat0),this.x0=this.x0||0,this.y0=this.y0||0,this.long0=this.long0||0,this.f=this.es/(1+Math.sqrt(1-this.es))}function p_(e){var t=e.x,n=e.y,r=Math.sin(e.y),i=Math.cos(e.y),a=Y(t-this.long0,this.over),o,s,c,l,u,d,f,p,m,h,g;return this.sphere?Math.abs(this.sin_p12-1)<=1e-10?(e.x=this.x0+this.a*(J-n)*Math.sin(a),e.y=this.y0-this.a*(J-n)*Math.cos(a),e):Math.abs(this.sin_p12+1)<=1e-10?(e.x=this.x0+this.a*(J+n)*Math.sin(a),e.y=this.y0+this.a*(J+n)*Math.cos(a),e):(m=this.sin_p12*r+this.cos_p12*i*Math.cos(a),f=Math.acos(m),p=f?f/Math.sin(f):1,e.x=this.x0+this.a*p*i*Math.sin(a),e.y=this.y0+this.a*p*(this.cos_p12*r-this.sin_p12*i*Math.cos(a)),e):(o=Uh(this.es),s=Wh(this.es),c=Gh(this.es),l=Kh(this.es),Math.abs(this.sin_p12-1)<=1e-10?(u=this.a*Hh(o,s,c,l,J),d=this.a*Hh(o,s,c,l,n),e.x=this.x0+(u-d)*Math.sin(a),e.y=this.y0-(u-d)*Math.cos(a),e):Math.abs(this.sin_p12+1)<=1e-10?(u=this.a*Hh(o,s,c,l,J),d=this.a*Hh(o,s,c,l,n),e.x=this.x0+(u+d)*Math.sin(a),e.y=this.y0+(u+d)*Math.cos(a),e):Math.abs(t)<1e-10&&Math.abs(n-this.lat0)<1e-10?(e.x=this.x0,e.y=this.y0,e):(h=u_(this.lat0,this.long0,n,t,this.a,this.f),g=h.azi1,e.x=this.x0+h.s12*Math.sin(g),e.y=this.y0+h.s12*Math.cos(g),e))}function m_(e){e.x-=this.x0,e.y-=this.y0;var t,n,r,i,a,o,s,c,l,u,d,f,p,m,h,g;return this.sphere?(t=Math.sqrt(e.x*e.x+e.y*e.y),t>2*J*this.a?void 0:(n=t/this.a,r=Math.sin(n),i=Math.cos(n),a=this.long0,Math.abs(t)<=1e-10?o=this.lat0:(o=pg(i*this.sin_p12+e.y*r*this.cos_p12/t),s=Math.abs(this.lat0)-J,a=Math.abs(s)<=1e-10?this.lat0>=0?Y(this.long0+Math.atan2(e.x,-e.y),this.over):Y(this.long0-Math.atan2(-e.x,e.y),this.over):Y(this.long0+Math.atan2(e.x*r,t*this.cos_p12*i-e.y*this.sin_p12*r),this.over)),e.x=a,e.y=o,e)):(c=Uh(this.es),l=Wh(this.es),u=Gh(this.es),d=Kh(this.es),Math.abs(this.sin_p12-1)<=1e-10?(f=this.a*Hh(c,l,u,d,J),t=Math.sqrt(e.x*e.x+e.y*e.y),p=f-t,o=Yh(p/this.a,c,l,u,d),a=Y(this.long0+Math.atan2(e.x,-1*e.y),this.over),e.x=a,e.y=o,e):Math.abs(this.sin_p12+1)<=1e-10?(f=this.a*Hh(c,l,u,d,J),t=Math.sqrt(e.x*e.x+e.y*e.y),p=t-f,o=Yh(p/this.a,c,l,u,d),a=Y(this.long0+Math.atan2(e.x,e.y),this.over),e.x=a,e.y=o,e):(m=Math.atan2(e.x,e.y),h=Math.sqrt(e.x*e.x+e.y*e.y),g=d_(this.lat0,this.long0,m,h,this.a,this.f),e.x=g.lon2,e.y=g.lat2,e))}var h_={init:f_,forward:p_,inverse:m_,names:[`Azimuthal_Equidistant`,`aeqd`]};function g_(){this.sin_p14=Math.sin(this.lat0||0),this.cos_p14=Math.cos(this.lat0||0)}function __(e){var t,n,r,i,a,o,s,c,l=e.x,u=e.y;return r=Y(l-(this.long0||0),this.over),t=Math.sin(u),n=Math.cos(u),i=Math.cos(r),o=this.sin_p14*t+this.cos_p14*n*i,a=1,(o>0||Math.abs(o)<=1e-10)&&(s=this.a*a*n*Math.sin(r),c=(this.y0||0)+this.a*a*(this.cos_p14*t-this.sin_p14*n*i)),e.x=s,e.y=c,e}function v_(e){var t,n,r,i,a,o,s,c,l;return e.x-=this.x0||0,e.y-=this.y0||0,t=Math.sqrt(e.x*e.x+e.y*e.y),n=pg(t/this.a),r=Math.sin(n),i=Math.cos(n),c=this.long0||0,l=this.lat0||0,o=c,Math.abs(t)<=1e-10?(s=l,e.x=o,e.y=s,e):(s=pg(i*this.sin_p14+e.y*r*this.cos_p14/t),a=Math.abs(l)-J,Math.abs(a)<=1e-10?(o=Y(l>=0?c+Math.atan2(e.x,-e.y):c-Math.atan2(-e.x,e.y),this.over),e.x=o,e.y=s,e):(o=Y(c+Math.atan2(e.x*r,t*this.cos_p14*i-e.y*this.sin_p14*r),this.over),e.x=o,e.y=s,e))}var y_={init:g_,forward:__,inverse:v_,names:[`ortho`]},b_={FRONT:1,RIGHT:2,BACK:3,LEFT:4,TOP:5,BOTTOM:6},x_={AREA_0:1,AREA_1:2,AREA_2:3,AREA_3:4};function S_(){this.x0=this.x0||0,this.y0=this.y0||0,this.lat0=this.lat0||0,this.long0=this.long0||0,this.lat_ts=this.lat_ts||0,this.title=this.title||`Quadrilateralized Spherical Cube`,this.lat0>=J-qd/2?this.face=b_.TOP:this.lat0<=-(J-qd/2)?this.face=b_.BOTTOM:Math.abs(this.long0)<=qd?this.face=b_.FRONT:Math.abs(this.long0)<=J+qd?this.face=this.long0>0?b_.RIGHT:b_.LEFT:this.face=b_.BACK,this.es!==0&&(this.one_minus_f=1-(this.a-this.b)/this.a,this.one_minus_f_squared=this.one_minus_f*this.one_minus_f)}function C_(e){var t={x:0,y:0},n,r,i,a,o,s,c={value:0};if(e.x-=this.long0,n=this.es===0?e.y:Math.atan(this.one_minus_f_squared*Math.tan(e.y)),r=e.x,this.face===b_.TOP)a=J-n,r>=qd&&r<=J+qd?(c.value=x_.AREA_0,i=r-J):r>J+qd||r<=-(J+qd)?(c.value=x_.AREA_1,i=r>0?r-Yd:r+Yd):r>-(J+qd)&&r<=-qd?(c.value=x_.AREA_2,i=r+J):(c.value=x_.AREA_3,i=r);else if(this.face===b_.BOTTOM)a=J+n,r>=qd&&r<=J+qd?(c.value=x_.AREA_0,i=-r+J):r<qd&&r>=-qd?(c.value=x_.AREA_1,i=-r):r<-qd&&r>=-(J+qd)?(c.value=x_.AREA_2,i=-r-J):(c.value=x_.AREA_3,i=r>0?-r+Yd:-r-Yd);else{var l,u,d,f,p,m,h;this.face===b_.RIGHT?r=E_(r,+J):this.face===b_.BACK?r=E_(r,+Yd):this.face===b_.LEFT&&(r=E_(r,-J)),f=Math.sin(n),p=Math.cos(n),m=Math.sin(r),h=Math.cos(r),l=p*h,u=p*m,d=f,this.face===b_.FRONT?(a=Math.acos(l),i=T_(a,d,u,c)):this.face===b_.RIGHT?(a=Math.acos(u),i=T_(a,d,-l,c)):this.face===b_.BACK?(a=Math.acos(-l),i=T_(a,d,-u,c)):this.face===b_.LEFT?(a=Math.acos(-u),i=T_(a,d,l,c)):(a=i=0,c.value=x_.AREA_0)}return s=Math.atan(12/Yd*(i+Math.acos(Math.sin(i)*Math.cos(qd))-J)),o=Math.sqrt((1-Math.cos(a))/(Math.cos(s)*Math.cos(s))/(1-Math.cos(Math.atan(1/Math.cos(i))))),c.value===x_.AREA_1?s+=J:c.value===x_.AREA_2?s+=Yd:c.value===x_.AREA_3&&(s+=1.5*Yd),t.x=o*Math.cos(s),t.y=o*Math.sin(s),t.x=t.x*this.a+this.x0,t.y=t.y*this.a+this.y0,e.x=t.x,e.y=t.y,e}function w_(e){var t={lam:0,phi:0},n,r,i,a,o,s,c,l,u,d={value:0};if(e.x=(e.x-this.x0)/this.a,e.y=(e.y-this.y0)/this.a,r=Math.atan(Math.sqrt(e.x*e.x+e.y*e.y)),n=Math.atan2(e.y,e.x),e.x>=0&&e.x>=Math.abs(e.y)?d.value=x_.AREA_0:e.y>=0&&e.y>=Math.abs(e.x)?(d.value=x_.AREA_1,n-=J):e.x<0&&-e.x>=Math.abs(e.y)?(d.value=x_.AREA_2,n=n<0?n+Yd:n-Yd):(d.value=x_.AREA_3,n+=J),u=Yd/12*Math.tan(n),o=Math.sin(u)/(Math.cos(u)-1/Math.sqrt(2)),s=Math.atan(o),i=Math.cos(n),a=Math.tan(r),c=1-i*i*a*a*(1-Math.cos(Math.atan(1/Math.cos(s)))),c<-1?c=-1:c>1&&(c=1),this.face===b_.TOP)l=Math.acos(c),t.phi=J-l,d.value===x_.AREA_0?t.lam=s+J:d.value===x_.AREA_1?t.lam=s<0?s+Yd:s-Yd:d.value===x_.AREA_2?t.lam=s-J:t.lam=s;else if(this.face===b_.BOTTOM)l=Math.acos(c),t.phi=l-J,d.value===x_.AREA_0?t.lam=-s+J:d.value===x_.AREA_1?t.lam=-s:d.value===x_.AREA_2?t.lam=-s-J:t.lam=s<0?-s-Yd:-s+Yd;else{var f=c,p,m;u=f*f,m=u>=1?0:Math.sqrt(1-u)*Math.sin(s),u+=m*m,p=u>=1?0:Math.sqrt(1-u),d.value===x_.AREA_1?(u=p,p=-m,m=u):d.value===x_.AREA_2?(p=-p,m=-m):d.value===x_.AREA_3&&(u=p,p=m,m=-u),this.face===b_.RIGHT?(u=f,f=-p,p=u):this.face===b_.BACK?(f=-f,p=-p):this.face===b_.LEFT&&(u=f,f=p,p=-u),t.phi=Math.acos(-m)-J,t.lam=Math.atan2(p,f),this.face===b_.RIGHT?t.lam=E_(t.lam,-J):this.face===b_.BACK?t.lam=E_(t.lam,-Yd):this.face===b_.LEFT&&(t.lam=E_(t.lam,+J))}if(this.es!==0){var h=+(t.phi<0),g=Math.tan(t.phi),_=this.b/Math.sqrt(g*g+this.one_minus_f_squared);t.phi=Math.atan(Math.sqrt(this.a*this.a-_*_)/(this.one_minus_f*_)),h&&(t.phi=-t.phi)}return t.lam+=this.long0,e.x=t.lam,e.y=t.phi,e}function T_(e,t,n,r){var i;return e<1e-10?(r.value=x_.AREA_0,i=0):(i=Math.atan2(t,n),Math.abs(i)<=qd?r.value=x_.AREA_0:i>qd&&i<=J+qd?(r.value=x_.AREA_1,i-=J):i>J+qd||i<=-(J+qd)?(r.value=x_.AREA_2,i=i>=0?i-Yd:i+Yd):(r.value=x_.AREA_3,i+=J)),i}function E_(e,t){var n=e+t;return n<-3.14159265359?n+=Jd:n>3.14159265359&&(n-=Jd),n}var D_={init:S_,forward:C_,inverse:w_,names:[`Quadrilateralized Spherical Cube`,`Quadrilateralized_Spherical_Cube`,`qsc`]},O_=[[1,22199e-21,-715515e-10,31103e-10],[.9986,-482243e-9,-24897e-9,-13309e-10],[.9954,-83103e-8,-448605e-10,-9.86701e-7],[.99,-.00135364,-59661e-9,36777e-10],[.9822,-.00167442,-449547e-11,-572411e-11],[.973,-.00214868,-903571e-10,1.8736e-8],[.96,-.00305085,-900761e-10,164917e-11],[.9427,-.00382792,-653386e-10,-26154e-10],[.9216,-.00467746,-10457e-8,481243e-11],[.8962,-.00536223,-323831e-10,-543432e-11],[.8679,-.00609363,-113898e-9,332484e-11],[.835,-.00698325,-640253e-10,9.34959e-7],[.7986,-.00755338,-500009e-10,9.35324e-7],[.7597,-.00798324,-35971e-9,-227626e-11],[.7186,-.00851367,-701149e-10,-86303e-10],[.6732,-.00986209,-199569e-9,191974e-10],[.6213,-.010418,883923e-10,624051e-11],[.5722,-.00906601,182e-6,624051e-11],[.5322,-.00677797,275608e-9,624051e-11]],k_=[[-520417e-23,.0124,121431e-23,-845284e-16],[.062,.0124,-1.26793e-9,422642e-15],[.124,.0124,5.07171e-9,-1.60604e-9],[.186,.0123999,-1.90189e-8,6.00152e-9],[.248,.0124002,7.10039e-8,-2.24e-8],[.31,.0123992,-2.64997e-7,8.35986e-8],[.372,.0124029,9.88983e-7,-3.11994e-7],[.434,.0123893,-369093e-11,-4.35621e-7],[.4958,.0123198,-102252e-10,-3.45523e-7],[.5571,.0121916,-154081e-10,-5.82288e-7],[.6176,.0119938,-241424e-10,-5.25327e-7],[.6769,.011713,-320223e-10,-5.16405e-7],[.7346,.0113541,-397684e-10,-6.09052e-7],[.7903,.0109107,-489042e-10,-104739e-11],[.8435,.0103431,-64615e-9,-1.40374e-9],[.8936,.00969686,-64636e-9,-8547e-9],[.9394,.00840947,-192841e-9,-42106e-10],[.9761,.00616527,-256e-6,-42106e-10],[1,.00328947,-319159e-9,-42106e-10]],A_=.8487,j_=1.3523,M_=Kd/5,N_=1/M_,P_=18,F_=function(e,t){return e[0]+t*(e[1]+t*(e[2]+t*e[3]))},I_=function(e,t){return e[1]+t*(2*e[2]+t*3*e[3])};function L_(e,t,n,r){for(var i=t;r;--r){var a=e(i);if(i-=a,Math.abs(a)<n)break}return i}function R_(){this.x0=this.x0||0,this.y0=this.y0||0,this.long0=this.long0||0,this.es=0,this.title=this.title||`Robinson`}function z_(e){var t=Y(e.x-this.long0,this.over),n=Math.abs(e.y),r=Math.floor(n*M_);r<0?r=0:r>=P_&&(r=P_-1),n=Kd*(n-N_*r);var i={x:F_(O_[r],n)*t,y:F_(k_[r],n)};return e.y<0&&(i.y=-i.y),i.x=i.x*this.a*A_+this.x0,i.y=i.y*this.a*j_+this.y0,i}function B_(e){var t={x:(e.x-this.x0)/(this.a*A_),y:Math.abs(e.y-this.y0)/(this.a*j_)};if(t.y>=1)t.x/=O_[P_][0],t.y=e.y<0?-J:J;else{var n=Math.floor(t.y*P_);for(n<0?n=0:n>=P_&&(n=P_-1);;)if(k_[n][0]>t.y)--n;else if(k_[n+1][0]<=t.y)++n;else break;var r=k_[n],i=5*(t.y-r[0])/(k_[n+1][0]-r[0]);i=L_(function(e){return(F_(r,e)-t.y)/I_(r,e)},i,Wd,100),t.x/=F_(O_[n],i),t.y=(5*n+i)*Gd,e.y<0&&(t.y=-t.y)}return t.x=Y(t.x+this.long0,this.over),t}var V_={init:R_,forward:z_,inverse:B_,names:[`Robinson`,`robin`]};function H_(){this.name=`geocent`}function U_(e){return Np(e,this.es,this.a)}function W_(e){return Pp(e,this.es,this.a,this.b)}var G_={init:H_,forward:U_,inverse:W_,names:[`Geocentric`,`geocentric`,`geocent`,`Geocent`]},K_={N_POLE:0,S_POLE:1,EQUIT:2,OBLIQ:3},q_={h:{def:1e5,num:!0},azi:{def:0,num:!0,degrees:!0},tilt:{def:0,num:!0,degrees:!0},long0:{def:0,num:!0},lat0:{def:0,num:!0}};function J_(){if(Object.keys(q_).forEach(function(e){if(this[e]===void 0)this[e]=q_[e].def;else if(q_[e].num&&isNaN(this[e]))throw Error(`Invalid parameter value, must be numeric `+e+` = `+this[e]);else q_[e].num&&(this[e]=parseFloat(this[e]));q_[e].degrees&&(this[e]=this[e]*Gd)}.bind(this)),Math.abs(Math.abs(this.lat0)-J)<1e-10?this.mode=this.lat0<0?K_.S_POLE:K_.N_POLE:Math.abs(this.lat0)<1e-10?this.mode=K_.EQUIT:(this.mode=K_.OBLIQ,this.sinph0=Math.sin(this.lat0),this.cosph0=Math.cos(this.lat0)),this.pn1=this.h/this.a,this.pn1<=0||this.pn1>1e10)throw Error(`Invalid height`);this.p=1+this.pn1,this.rp=1/this.p,this.h1=1/this.pn1,this.pfact=(this.p+1)*this.h1,this.es=0;var e=this.tilt,t=this.azi;this.cg=Math.cos(t),this.sg=Math.sin(t),this.cw=Math.cos(e),this.sw=Math.sin(e)}function Y_(e){e.x-=this.long0;var t=Math.sin(e.y),n=Math.cos(e.y),r=Math.cos(e.x),i,a;switch(this.mode){case K_.OBLIQ:a=this.sinph0*t+this.cosph0*n*r;break;case K_.EQUIT:a=n*r;break;case K_.S_POLE:a=-t;break;case K_.N_POLE:a=t;break}switch(a=this.pn1/(this.p-a),i=a*n*Math.sin(e.x),this.mode){case K_.OBLIQ:a*=this.cosph0*t-this.sinph0*n*r;break;case K_.EQUIT:a*=t;break;case K_.N_POLE:a*=-(n*r);break;case K_.S_POLE:a*=n*r;break}var o=a*this.cg+i*this.sg,s=1/(o*this.sw*this.h1+this.cw);return i=(i*this.cg-a*this.sg)*this.cw*s,a=o*s,e.x=i*this.a,e.y=a*this.a,e}function X_(e){e.x/=this.a,e.y/=this.a;var t={x:e.x,y:e.y},n,r,i=1/(this.pn1-e.y*this.sw);n=this.pn1*e.x*i,r=this.pn1*e.y*this.cw*i,e.x=n*this.cg+r*this.sg,e.y=r*this.cg-n*this.sg;var a=Jm(e.x,e.y);if(Math.abs(a)<1e-10)t.x=0,t.y=e.y;else{var o,s=1-a*a*this.pfact;switch(s=(this.p-Math.sqrt(s))/(this.pn1/a+a/this.pn1),o=Math.sqrt(1-s*s),this.mode){case K_.OBLIQ:t.y=Math.asin(o*this.sinph0+e.y*s*this.cosph0/a),e.y=(o-this.sinph0*Math.sin(t.y))*a,e.x*=s*this.cosph0;break;case K_.EQUIT:t.y=Math.asin(e.y*s/a),e.y=o*a,e.x*=s;break;case K_.N_POLE:t.y=Math.asin(o),e.y=-e.y;break;case K_.S_POLE:t.y=-Math.asin(o);break}t.x=Math.atan2(e.x,e.y)}return e.x=t.x+this.long0,e.y=t.y,e}var Z_={init:J_,forward:Y_,inverse:X_,names:[`Tilted_Perspective`,`tpers`]};function Q_(){if(this.flip_axis=+(this.sweep===`x`),this.h=Number(this.h),this.radius_g_1=this.h/this.a,this.radius_g_1<=0||this.radius_g_1>1e10)throw Error();if(this.radius_g=1+this.radius_g_1,this.C=this.radius_g*this.radius_g-1,this.es!==0){var e=1-this.es,t=1/e;this.radius_p=Math.sqrt(e),this.radius_p2=e,this.radius_p_inv2=t,this.shape=`ellipse`}else this.radius_p=1,this.radius_p2=1,this.radius_p_inv2=1,this.shape=`sphere`;this.title||=`Geostationary Satellite View`}function $_(e){var t=e.x,n=e.y,r,i,a,o;if(t-=this.long0,this.shape===`ellipse`){n=Math.atan(this.radius_p2*Math.tan(n));var s=this.radius_p/Jm(this.radius_p*Math.cos(n),Math.sin(n));if(i=s*Math.cos(t)*Math.cos(n),a=s*Math.sin(t)*Math.cos(n),o=s*Math.sin(n),(this.radius_g-i)*i-a*a-o*o*this.radius_p_inv2<0)return e.x=NaN,e.y=NaN,e;r=this.radius_g-i,this.flip_axis?(e.x=this.radius_g_1*Math.atan(a/Jm(o,r)),e.y=this.radius_g_1*Math.atan(o/r)):(e.x=this.radius_g_1*Math.atan(a/r),e.y=this.radius_g_1*Math.atan(o/Jm(a,r)))}else this.shape===`sphere`&&(r=Math.cos(n),i=Math.cos(t)*r,a=Math.sin(t)*r,o=Math.sin(n),r=this.radius_g-i,this.flip_axis?(e.x=this.radius_g_1*Math.atan(a/Jm(o,r)),e.y=this.radius_g_1*Math.atan(o/r)):(e.x=this.radius_g_1*Math.atan(a/r),e.y=this.radius_g_1*Math.atan(o/Jm(a,r))));return e.x*=this.a,e.y*=this.a,e}function ev(e){var t=-1,n=0,r=0,i,a,o,s;if(e.x/=this.a,e.y/=this.a,this.shape===`ellipse`){this.flip_axis?(r=Math.tan(e.y/this.radius_g_1),n=Math.tan(e.x/this.radius_g_1)*Jm(1,r)):(n=Math.tan(e.x/this.radius_g_1),r=Math.tan(e.y/this.radius_g_1)*Jm(1,n));var c=r/this.radius_p;if(i=n*n+c*c+t*t,a=2*this.radius_g*t,o=a*a-4*i*this.C,o<0)return e.x=NaN,e.y=NaN,e;s=(-a-Math.sqrt(o))/(2*i),t=this.radius_g+s*t,n*=s,r*=s,e.x=Math.atan2(n,t),e.y=Math.atan(r*Math.cos(e.x)/t),e.y=Math.atan(this.radius_p_inv2*Math.tan(e.y))}else if(this.shape===`sphere`){if(this.flip_axis?(r=Math.tan(e.y/this.radius_g_1),n=Math.tan(e.x/this.radius_g_1)*Math.sqrt(1+r*r)):(n=Math.tan(e.x/this.radius_g_1),r=Math.tan(e.y/this.radius_g_1)*Math.sqrt(1+n*n)),i=n*n+r*r+t*t,a=2*this.radius_g*t,o=a*a-4*i*this.C,o<0)return e.x=NaN,e.y=NaN,e;s=(-a-Math.sqrt(o))/(2*i),t=this.radius_g+s*t,n*=s,r*=s,e.x=Math.atan2(n,t),e.y=Math.atan(r*Math.cos(e.x)/t)}return e.x+=this.long0,e}var tv={init:Q_,forward:$_,inverse:ev,names:[`Geostationary Satellite View`,`Geostationary_Satellite`,`geos`]},nv=1.340264,rv=-.081106,iv=893e-6,av=.003796,ov=Math.sqrt(3)/2;function sv(){this.long0=this.long0===void 0?0:this.long0,this.x0=this.x0===void 0?0:this.x0,this.y0=this.y0===void 0?0:this.y0,this.es!==0&&(this.apa=sg(this.es),this.qp=eg(this.e,1),this.rqda=Math.sqrt(.5*this.qp))}function cv(e){var t=Y(e.x-this.long0,this.over),n=e.y,r=Math.sin(n);this.es!==0&&(r=eg(this.e,r)/this.qp);var i=Math.asin(ov*r),a=i*i,o=a*a*a;return e.x=t*Math.cos(i)/(ov*(nv+3*rv*a+o*(7*iv+9*av*a))),e.y=i*(nv+rv*a+o*(iv+av*a)),this.es!==0&&(e.x*=this.rqda,e.y*=this.rqda),e.x=this.a*e.x+this.x0,e.y=this.a*e.y+this.y0,e}function lv(e){e.x=(e.x-this.x0)/this.a,e.y=(e.y-this.y0)/this.a,this.es!==0&&(e.x/=this.rqda,e.y/=this.rqda);var t=1e-9,n=12,r=e.y,i,a,o,s,c,l;for(l=0;l<n&&(i=r*r,a=i*i*i,o=r*(nv+rv*i+a*(iv+av*i))-e.y,s=nv+3*rv*i+a*(7*iv+9*av*i),r-=c=o/s,!(Math.abs(c)<t));++l);return i=r*r,a=i*i*i,e.x=ov*e.x*(nv+3*rv*i+a*(7*iv+9*av*i))/Math.cos(r),e.y=Math.asin(Math.sin(r)/ov),this.es!==0&&(e.y=cg(e.y,this.apa)),e.x=Y(e.x+this.long0,this.over),e}var uv={init:sv,forward:cv,inverse:lv,names:[`eqearth`,`Equal Earth`,`Equal_Earth`]},dv=1e-10;function fv(){var e;if(this.phi1=this.lat1,Math.abs(this.phi1)<dv)throw Error();this.es?(this.en=zm(this.es),this.m1=Bm(this.phi1,this.am1=Math.sin(this.phi1),e=Math.cos(this.phi1),this.en),this.am1=e/(Math.sqrt(1-this.es*this.am1*this.am1)*this.am1),this.inverse=mv,this.forward=pv):(Math.abs(this.phi1)+dv>=J?this.cphi1=0:this.cphi1=1/Math.tan(this.phi1),this.inverse=gv,this.forward=hv)}function pv(e){var t=Y(e.x-(this.long0||0),this.over),n=e.y,r=this.am1+this.m1-Bm(n,i=Math.sin(n),a=Math.cos(n),this.en),i=a*t/(r*Math.sqrt(1-this.es*i*i)),a;return e.x=r*Math.sin(i),e.y=this.am1-r*Math.cos(i),e.x=this.a*e.x+(this.x0||0),e.y=this.a*e.y+(this.y0||0),e}function mv(e){e.x=(e.x-(this.x0||0))/this.a,e.y=(e.y-(this.y0||0))/this.a;var t,n=Jm(e.x,e.y=this.am1-e.y),r,i=Hm(this.am1+this.m1-n,this.es,this.en);if((t=Math.abs(i))<J)t=Math.sin(i),r=n*Math.atan2(e.x,e.y)*Math.sqrt(1-this.es*t*t)/Math.cos(i);else if(Math.abs(t-J)<=dv)r=0;else throw Error();return e.x=Y(r+(this.long0||0),this.over),e.y=Jh(i),e}function hv(e){var t=Y(e.x-(this.long0||0),this.over),n=e.y,r,i=this.cphi1+this.phi1-n;return Math.abs(i)>dv?(e.x=i*Math.sin(r=t*Math.cos(n)/i),e.y=this.cphi1-i*Math.cos(r)):e.x=e.y=0,e.x=this.a*e.x+(this.x0||0),e.y=this.a*e.y+(this.y0||0),e}function gv(e){e.x=(e.x-(this.x0||0))/this.a,e.y=(e.y-(this.y0||0))/this.a;var t,n,r=Jm(e.x,e.y=this.cphi1-e.y);if(n=this.cphi1+this.phi1-r,Math.abs(n)>J)throw Error();return t=Math.abs(Math.abs(n)-J)<=dv?0:r*Math.atan2(e.x,e.y)/Math.cos(n),e.x=Y(t+(this.long0||0),this.over),e.y=Jh(n),e}var _v={init:fv,names:[`bonne`,`Bonne (Werner lat_1=90)`]},vv={OBLIQUE:{forward:wv,inverse:Ev},TRANSVERSE:{forward:Tv,inverse:Dv}},yv={ROTATE:{o_alpha:`oAlpha`,o_lon_c:`oLongC`,o_lat_c:`oLatC`},NEW_POLE:{o_lat_p:`oLatP`,o_lon_p:`oLongP`},NEW_EQUATOR:{o_lon_1:`oLong1`,o_lat_1:`oLat1`,o_lon_2:`oLong2`,o_lat_2:`oLat2`}};function bv(){if(this.x0=this.x0||0,this.y0=this.y0||0,this.long0=this.long0||0,this.title=this.title||`General Oblique Transformation`,this.isIdentity=$f.includes(this.o_proj),!this.o_proj)throw Error(`Missing parameter: o_proj`);if(this.o_proj===`ob_tran`)throw Error(`Invalid value for o_proj: `+this.o_proj);let e=jp(this.projStr.replace(`+proj=ob_tran`,``).replace(`+o_proj=`,`+proj=`).trim());if(!e)throw Error(`Invalid parameter: o_proj. Unknown projection `+this.o_proj);e.long0=0,this.obliqueProjection=e;let t,n=Object.keys(yv),r=e=>{if(this[e]===void 0)return;let t=parseFloat(this[e])*Gd;if(isNaN(t))throw Error(`Invalid value for `+e+`: `+this[e]);return t};for(let e=0;e<n.length;e++){let i=yv[n[e]],a=Object.entries(i);if(a.some(([e])=>this[e]!==void 0)){t=i;for(let e=0;e<a.length;e++){let[t,n]=a[e],i=r(t);if(i===void 0)throw Error(`Missing parameter: `+t+`.`);this[n]=i}break}}if(!t)throw Error(`No valid parameters provided for ob_tran projection.`);let{lamp:i,phip:a}=Cv(this,t);this.lamp=i,Math.abs(a)>1e-10?(this.cphip=Math.cos(a),this.sphip=Math.sin(a),this.projectionType=vv.OBLIQUE):this.projectionType=vv.TRANSVERSE}function xv(e){return this.projectionType.forward(this,e)}function Sv(e){return this.projectionType.inverse(this,e)}function Cv(e,t){let n,r;if(t===yv.ROTATE){let t=e.oLongC,i=e.oLatC,a=e.oAlpha;if(Math.abs(Math.abs(i)-J)<=1e-10)throw Error(`Invalid value for o_lat_c: `+e.o_lat_c+` should be < 90°`);r=t+Math.atan2(-1*Math.cos(a),-1*Math.sin(a)*Math.sin(i)),n=Math.asin(Math.cos(i)*Math.sin(a))}else if(t===yv.NEW_POLE)r=e.oLongP,n=e.oLatP;else{let t=e.oLong1,i=e.oLat1,a=e.oLong2,o=e.oLat2,s=Math.abs(i);if(Math.abs(i)>J-1e-10)throw Error(`Invalid value for o_lat_1: `+e.o_lat_1+` should be < 90°`);if(Math.abs(o)>J-1e-10)throw Error(`Invalid value for o_lat_2: `+e.o_lat_2+` should be < 90°`);if(Math.abs(i-o)<1e-10)throw Error(`Invalid value for o_lat_1 and o_lat_2: o_lat_1 should be different from o_lat_2`);if(s<1e-10)throw Error(`Invalid value for o_lat_1: o_lat_1 should be different from zero`);r=Math.atan2(Math.cos(i)*Math.sin(o)*Math.cos(t)-Math.sin(i)*Math.cos(o)*Math.cos(a),Math.sin(i)*Math.cos(o)*Math.sin(a)-Math.cos(i)*Math.sin(o)*Math.sin(t)),n=Math.atan(-1*Math.cos(r-t)/Math.tan(i))}return{lamp:r,phip:n}}function wv(e,t){let{x:n,y:r}=t;n=Y(n-e.long0,e.over);let i=Math.cos(n),a=Math.sin(r),o=Math.cos(r);t.x=Y(Math.atan2(o*Math.sin(n),e.sphip*o*i+e.cphip*a)+e.lamp),t.y=Math.asin(e.sphip*a-e.cphip*o*i);let s=e.obliqueProjection.forward(t);return e.isIdentity&&(s.x*=Kd,s.y*=Kd),s}function Tv(e,t){let{x:n,y:r}=t;n=Y(n-e.long0,e.over);let i=Math.cos(r),a=Math.cos(n);t.x=Y(Math.atan2(i*Math.sin(n),Math.sin(r))+e.lamp),t.y=Math.asin(-1*i*a);let o=e.obliqueProjection.forward(t);return e.isIdentity&&(o.x*=Kd,o.y*=Kd),o}function Ev(e,t){e.isIdentity&&(t.x*=Gd,t.y*=Gd);let{x:n,y:r}=e.obliqueProjection.inverse(t);if(n<Number.MAX_VALUE){n-=e.lamp;let i=Math.cos(n),a=Math.sin(r),o=Math.cos(r);t.x=Math.atan2(o*Math.sin(n),e.sphip*o*i-e.cphip*a),t.y=Math.asin(e.sphip*a+e.cphip*o*i)}return t.x=Y(t.x+e.long0),t}function Dv(e,t){e.isIdentity&&(t.x*=Gd,t.y*=Gd);let{x:n,y:r}=e.obliqueProjection.inverse(t);if(n<Number.MAX_VALUE){let i=Math.cos(r);n-=e.lamp,t.x=Math.atan2(i*Math.sin(n),-1*Math.sin(r)),t.y=Math.asin(i*Math.cos(n))}return t.x=Y(t.x+e.long0),t}var Ov={init:bv,forward:xv,inverse:Sv,names:[`General Oblique Transformation`,`General_Oblique_Transformation`,`ob_tran`]};function kv(e){e.Proj.projections.add(Km),e.Proj.projections.add(ih),e.Proj.projections.add(ch),e.Proj.projections.add(vh),e.Proj.projections.add(Ch),e.Proj.projections.add(Dh),e.Proj.projections.add(Nh),e.Proj.projections.add(Lh),e.Proj.projections.add(Vh),e.Proj.projections.add($h),e.Proj.projections.add(fg),e.Proj.projections.add(vg),e.Proj.projections.add(Sg),e.Proj.projections.add(Dg),e.Proj.projections.add(jg),e.Proj.projections.add(Ig),e.Proj.projections.add(Bg),e.Proj.projections.add(Wg),e.Proj.projections.add(Yg),e.Proj.projections.add(Zg),e.Proj.projections.add(t_),e.Proj.projections.add(a_),e.Proj.projections.add(l_),e.Proj.projections.add(h_),e.Proj.projections.add(y_),e.Proj.projections.add(D_),e.Proj.projections.add(V_),e.Proj.projections.add(G_),e.Proj.projections.add(Z_),e.Proj.projections.add(tv),e.Proj.projections.add(uv),e.Proj.projections.add(_v),e.Proj.projections.add(Ov)}var Av=Object.assign(em,{defaultDatum:`WGS84`,Proj:jp,WGS84:new jp(`WGS84`),Point:Em,toPoint:Gp,defs:Nf,nadgrid:_p,transform:Xp,mgrs:lm,version:`__VERSION__`});kv(Av),Av.defs(`EPSG:23032`,`+proj=utm +zone=32 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs`);var jv=null;function Mv(e,t){jv={e,n:t}}function Nv(e,t){if(!jv)throw Error(`setLocalOrigin() must be called before worldToLocal()`);return{x:e-jv.e,z:jv.n-t}}function Pv(e,t){if(!jv)throw Error(`setLocalOrigin() must be called before localToWorld()`);return{e:e+jv.e,n:jv.n-t}}function Fv(e,t){let{e:n,n:r}=Pv(e,t),[i,a]=Av(`EPSG:23032`,`WGS84`,[n,r]);return{lon:i,lat:a}}function Iv(e,t){let[n,r]=Av(`WGS84`,`EPSG:23032`,[t,e]);return Nv(n,r)}function Lv(e,t){let{width:n,height:r}=t.dimensions,i=n*r;if(e.length!==i*2)throw Error(`heightfield is ${e.length} bytes, expected ${i*2} for ${n}x${r}`);let a=t.encoding?.layout??`raw`;if(a===`raw`){let t=new Uint16Array(i);for(let n=0;n<i;n++)t[n]=e[n*2]|e[n*2+1]<<8;return t}if(a!==`row-delta-byte-planes`)throw Error(`unknown heightfield layout ${JSON.stringify(a)} - refusing to guess`);let o=new Uint16Array(i);for(let t=0;t<r;t++){let r=t*n,a=0;for(let t=0;t<n;t++){let n=r+t;a=a+(e[n]<<8|e[i+n])&65535,o[n]=a}}return o}function Rv(e,t,n){return t+e/65535*(n-t)}function zv(e,t,n,r){let{width:i,height:a}=t.dimensions,{min:o,max:s}=t.elevationRangeM,{x:c,y:l}=t.resolutionMPerPx,{xmin:u,ymin:d,xmax:f,ymax:p}=t.bboxCrsUnits,m=f-u,h=p-d,g=(n+m/2)/c-.5,_=(r+h/2)/l-.5,v=Math.min(Math.max(Math.floor(g),0),i-1),y=Math.min(v+1,i-1),b=Math.min(Math.max(Math.floor(_),0),a-1),x=Math.min(b+1,a-1),S=Math.min(Math.max(g-v,0),1),C=Math.min(Math.max(_-b,0),1),w=e[b*i+v],T=e[b*i+y],E=e[x*i+v],D=e[x*i+y],O=w+(T-w)*S;return Rv(O+(E+(D-E)*S-O)*C,o,s)}function Bv(e,t,n,r,i,a){let{xmin:o,ymin:s,xmax:c,ymax:l}=t.bboxCrsUnits,u=c-o,d=l-s,f=u/n,p=d/r,m=(i+u/2)/f,h=(a+d/2)/p,g=Math.min(Math.max(Math.floor(m),0),n-1),_=Math.min(Math.max(Math.floor(h),0),r-1),v=Math.min(Math.max(m-g,0),1),y=Math.min(Math.max(h-_,0),1),b=g*f-u/2,x=b+f,S=_*p-d/2,C=S+p,w=(n,r)=>zv(e,t,n,r);if(v+y<=1){let e=w(b,S);return e+v*(w(x,S)-e)+y*(w(b,C)-e)}let T=w(x,C);return T+(1-v)*(w(b,C)-T)+(1-y)*(w(x,S)-T)}var Vv=128,Hv=127;function Uv(e){let t=(e-Vv)/Hv;return Math.sign(t)*t*t*96}var Wv={value:null},Gv={value:new qt(0,0,0,0)},Kv={value:0},qv={value:0};function Jv(){let e=new bi(new Uint8Array([Vv]),1,1,D,l);return e.needsUpdate=!0,e}function Yv(e,n,r,i){let a=n.levels[r];if(!a)throw Error(`height tier: no level ${r} in a manifest with ${n.levels?.length??0}`);let{width:s,height:c}=a.dimensions;if(e.length!==s*c)throw Error(`height tier: ${e.length} bytes for a ${s}x${c} grid`);let u=new bi(e,s,c,D,l);u.magFilter=o,u.minFilter=o,u.wrapS=t,u.wrapT=t,u.needsUpdate=!0;let d=i.bboxCrsUnits,f=n.bboxCrsUnits,p=(d.xmin+d.xmax)/2,m=(d.ymin+d.ymax)/2;return{texture:u,rect:new qt(f.xmin-p,m-f.ymax,f.xmax-f.xmin,f.ymax-f.ymin),dimensions:a.dimensions}}function Xv(e,t,n){if(!e||!e.bytes||e.mix<=0)return 0;let{width:r,height:i}=e.dimensions,a=e.rect,o=(t-a.x)/a.z,s=(n-a.y)/a.w;if(o<0||o>1||s<0||s>1)return 0;let c=o*r-.5,l=s*i-.5,u=Math.min(Math.max(Math.floor(c),0),r-1),d=Math.min(u+1,r-1),f=Math.min(Math.max(Math.floor(l),0),i-1),p=Math.min(f+1,i-1),m=Math.min(Math.max(c-u,0),1),h=Math.min(Math.max(l-f,0),1),g=(t,n)=>Uv(e.bytes[t*r+n]),_=g(f,u)+(g(f,d)-g(f,u))*m;return(_+(g(p,u)+(g(p,d)-g(p,u))*m-_)*h)*e.mix}function Zv(){return`
    uniform sampler2D uHeightTier;
    uniform vec4 uHeightTierRect; // (localXMin, localZMin, sizeX, sizeZ)
    uniform float uHeightTierMix;

    float heightTierM( vec2 wxz ) {
      vec2 uv = ( wxz - uHeightTierRect.xy ) / max( uHeightTierRect.zw, vec2( 1e-6 ) );
      // Outside the rect, and when no tier is loaded (size 0 -> uv explodes), this
      // multiplies out to zero without a branch.
      float inside = step( 0.0, uv.x ) * step( uv.x, 1.0 ) * step( 0.0, uv.y ) * step( uv.y, 1.0 )
                   * step( 1.0, uHeightTierRect.z );
      // The twin of decodeResidual(). 128 is the zero, 127 steps each side.
      float s = ( texture2D( uHeightTier, uv ).r * 255.0 - ${Vv}.0 ) / ${Hv}.0;
      return sign( s ) * s * s * 96.0 * inside * uHeightTierMix;
    }
  `}var Qv={uniforms:{uAtmoSunDir:{value:new H(0,1,0)},uAtmoGlowColor:{value:new W(16767408)},uAtmoGlow:{value:.15},uAtmoHaze:{value:18e-6},uAtmoValleyFog:{value:0},uAtmoFogTop:{value:1400},uAtmoRelight:{value:0},uAtmoSnow:{value:0},uAtmoWet:{value:0},uAtmoFogColor:{value:new W(10471912)}}},$v=`
  uniform vec3 uAtmoSunDir;
  uniform vec3 uAtmoGlowColor;
  uniform float uAtmoGlow;
  uniform float uAtmoHaze;
  uniform float uAtmoValleyFog;
  uniform float uAtmoFogTop;
  vec3 atmoApply(vec3 color, vec3 fogCol, vec3 worldPos, vec3 camPos) {
    vec3 v = worldPos - camPos;
    float dist = length(v);
    vec3 dir = v / max(dist, 1.0);
    float f = 1.0 - exp(-dist * uAtmoHaze);
    if (uAtmoValleyFog > 1e-7) {
      float k = 0.016;
      float dy = abs(dir.y) < 0.01 ? (dir.y < 0.0 ? -0.01 : 0.01) : dir.y;
      float od = uAtmoValleyFog * exp(-(camPos.y - uAtmoFogTop) * k)
               * (1.0 - exp(-dist * dy * k)) / (dy * k);
      f = 1.0 - (1.0 - f) * exp(-clamp(od, 0.0, 6.0));
    }
    float sunAmt = pow(clamp(dot(dir, uAtmoSunDir), 0.0, 1.0), 10.0);
    vec3 haze = fogCol + uAtmoGlowColor * (sunAmt * uAtmoGlow);
    return mix(color, haze, clamp(f, 0.0, 1.0));
  }
`,ey=!1;function ty(){ey||(ey=!0,K.fog_pars_vertex=`
    #ifdef USE_FOG
      varying vec3 vAtmoPos;
    #endif
  `,K.fog_vertex=`
    #ifdef USE_FOG
      #ifdef USE_INSTANCING
        vAtmoPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
      #else
        vAtmoPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
      #endif
    #endif
  `,K.fog_pars_fragment=`
    #ifdef USE_FOG
      uniform vec3 fogColor;
      varying vec3 vAtmoPos;
      ${$v}
    #endif
  `,K.fog_fragment=`
    #ifdef USE_FOG
      gl_FragColor.rgb = atmoApply(gl_FragColor.rgb, fogColor, vAtmoPos, cameraPosition);
    #endif
  `)}function ny(e){e.fog=!1;let t=e.onBeforeCompile;return e.onBeforeCompile=(e,n)=>{t?.(e,n),Object.assign(e.uniforms,Qv.uniforms),e.vertexShader=e.vertexShader.replace(`#include <fog_pars_vertex>`,`varying vec3 vAtmoWorld;`).replace(`#include <fog_vertex>`,`vAtmoWorld = (modelMatrix * vec4(position.y < 0.5 ? instanceStart : instanceEnd, 1.0)).xyz;`),e.fragmentShader=e.fragmentShader.replace(`#include <fog_pars_fragment>`,`varying vec3 vAtmoWorld;\n uniform vec3 uAtmoFogColor;\n ${$v}`).replace(`#include <fog_fragment>`,`gl_FragColor.rgb = atmoApply(gl_FragColor.rgb, uAtmoFogColor, vAtmoWorld, cameraPosition);`)},e}function ry(e){let t=e.onBeforeCompile;return e.onBeforeCompile=(e,n)=>{t?.(e,n),Object.assign(e.uniforms,Qv.uniforms)},e}var iy=[{key:`dawn`,label:`Dawn`,sunElev:6,sunAzim:95,turbidity:7,rayleigh:2.6,mieC:.006,mieG:.86,exposure:.95,fog:14927016,stars:.25,haze:16e-6,valleyFog:.85,fogTop:1100,glow:.5,glowColor:16758392,sunColor:16768964,sunIntensity:1,ambientColor:9412809,ambientIntensity:.35},{key:`day`,label:`Midday`,sunElev:25,sunAzim:155,turbidity:4,rayleigh:1.6,mieC:.004,mieG:.85,exposure:.75,fog:13622508,stars:0,haze:11e-6,valleyFog:0,fogTop:1100,glow:.08,glowColor:16773336,sunColor:16777215,sunIntensity:1.8,ambientColor:16777215,ambientIntensity:.6},{key:`golden`,label:`Golden hour`,sunElev:11,sunAzim:262,turbidity:4.5,rayleigh:3.2,mieC:.006,mieG:.88,exposure:.95,fog:15519654,stars:0,haze:15e-6,valleyFog:.12,fogTop:1100,glow:.7,glowColor:16752727,sunColor:16758903,sunIntensity:1.1,ambientColor:16764588,ambientIntensity:.4},{key:`dusk`,label:`Dusk`,sunElev:1.5,sunAzim:285,turbidity:5,rayleigh:3.8,mieC:.009,mieG:.9,exposure:.75,fog:9472168,stars:.55,haze:14e-6,valleyFog:.2,fogTop:1100,glow:.3,glowColor:14583392,sunColor:10129353,sunIntensity:.45,ambientColor:5925529,ambientIntensity:.3},{key:`night`,label:`Night`,sunElev:-10,sunAzim:0,turbidity:2,rayleigh:.6,mieC:.002,mieG:.8,exposure:.55,fog:922399,stars:1,haze:8e-6,valleyFog:.12,fogTop:1100,glow:.05,glowColor:10335453,sunColor:9413853,sunIntensity:.18,ambientColor:3358827,ambientIntensity:.15,lightElev:38,lightAzim:215}],ay=[`turbidity`,`rayleigh`,`mieC`,`mieG`,`exposure`,`stars`,`haze`,`valleyFog`,`fogTop`,`glow`,`sunIntensity`,`ambientIntensity`],oy=5e4,sy={cover:.12,dark:.06,hazeMul:1,vfAdd:0,exposureMul:1,grey:0,glowMul:1,starsMul:1},cy={value:1},ly={value:1},uy=1.8;function dy(e,t){return new H().setFromSphericalCoords(1,Ot.degToRad(90-e),Ot.degToRad(t))}function fy(e){return{sun:dy(e.sunElev,e.sunAzim),light:dy(e.lightElev??Math.max(e.sunElev,4),e.lightAzim??e.sunAzim),fogColor:new W(e.fog),glowColor:new W(e.glowColor),sunColor:new W(e.sunColor),ambientColor:new W(e.ambientColor),turbidity:e.turbidity,rayleigh:e.rayleigh,mieC:e.mieC,mieG:e.mieG,exposure:e.exposure,stars:e.stars,haze:e.haze,valleyFog:e.valleyFog,fogTop:e.fogTop,glow:e.glow,sunIntensity:e.sunIntensity,ambientIntensity:e.ambientIntensity}}function py(e,t,n,r){r.sun.copy(e.sun).lerp(t.sun,n).normalize(),r.light.copy(e.light).lerp(t.light,n).normalize(),r.fogColor.copy(e.fogColor).lerp(t.fogColor,n),r.glowColor.copy(e.glowColor).lerp(t.glowColor,n),r.sunColor.copy(e.sunColor).lerp(t.sunColor,n),r.ambientColor.copy(e.ambientColor).lerp(t.ambientColor,n);for(let i of ay)r[i]=e[i]+(t[i]-e[i])*n}var my=class{constructor({renderer:e,scene:t,sky:n,sunLight:r,ambientLight:i}){this.renderer=e,this.scene=t,this.sky=n,this.sunLight=r,this.ambientLight=i,this.weather=null,this.stars=hy(),t.add(this.stars),this._effFog=new W,this._grey=new W,this.fraction=.15,this.state=fy(iy[0]),this._a=fy(iy[0]),this._b=fy(iy[1]),this.setTime(this.fraction)}setTime(e){this.fraction=(e%1+1)%1;let t=iy.length,n=this.fraction*t,r=Math.floor(n)%t,i=(r+1)%t,a=n-Math.floor(n);Object.assign(this._a,fy(iy[r])),Object.assign(this._b,fy(iy[i])),py(this._a,this._b,a,this.state),this.label=a<.5?iy[r].label:iy[i].label;let o=iy.findIndex(e=>e.key===`night`);this.night=(r===o?1-a:0)+(i===o?a:0),this.applyState()}applyState(){let e=this.state,t=this.weather?.mod??sy,n=this.sky.material.uniforms;n.sunPosition.value.copy(e.sun),n.turbidity.value=e.turbidity,n.rayleigh.value=e.rayleigh,n.mieCoefficient.value=e.mieC,n.mieDirectionalG.value=e.mieG,n.cloudCoverage.value=t.cover,n.cloudDensity.value=.5,this.renderer.toneMappingExposure=e.exposure*t.exposureMul,this._effFog.copy(e.fogColor).lerp(this._grey.setScalar((e=>e.r*.299+e.g*.587+e.b*.114)(e.fogColor)*.97),t.grey),this.scene.fog.color.copy(this._effFog),this.sunLight.position.copy(e.light).multiplyScalar(oy),this.sunLight.color.copy(e.sunColor),this.sunLight.intensity=e.sunIntensity*(1-t.dark*.85),ly.value=this.sunLight.intensity/uy,this.ambientLight.color.copy(e.ambientColor),this.ambientLight.intensity=e.ambientIntensity*(1-t.dark*.5);let r=Qv.uniforms;r.uAtmoSunDir.value.copy(e.light),r.uAtmoGlowColor.value.copy(e.glowColor),r.uAtmoGlow.value=e.glow*t.glowMul,r.uAtmoHaze.value=e.haze*t.hazeMul*cy.value,r.uAtmoValleyFog.value=e.valleyFog*32e-5+t.vfAdd,r.uAtmoFogTop.value=e.fogTop,r.uAtmoSnow.value=t.snow??0,r.uAtmoWet.value=t.wet??0,r.uAtmoFogColor.value.copy(this._effFog),this.stars.material.opacity=e.stars*t.starsMul,this.stars.visible=this.stars.material.opacity>.01,this.weather?.applyLight(this._effFog)}};function hy(){let e=16e4,t=3200,n=new Float32Array(t*3),r=new Float32Array(t*3),i=0;for(let a=0;a<t;a++){let o;if(a<t*.45){let e=Math.random()*Math.PI*2,t=(Math.random()-.5)*.5*(Math.random()<.7?1:2.5);o=new H(Math.cos(e),t,Math.sin(e)).normalize(),o.applyAxisAngle(new H(1,0,0),1)}else o=new H(Math.random()*2-1,Math.random(),Math.random()*2-1).normalize();o.y<.02&&(o.y=.02+Math.random()*.1),o.normalize(),n[i]=o.x*e,n[i+1]=o.y*e,n[i+2]=o.z*e;let s=.4+Math.random()**3*.6,c=Math.random();r[i]=s*(c>.8?1:.85+c*.15),r[i+1]=s*.92,r[i+2]=s*(c<.2?1:.9),i+=3}let a=new kr;a.setAttribute(`position`,new hr(n,3)),a.setAttribute(`color`,new hr(r,3));let o=new Zi({size:2.2,sizeAttenuation:!1,vertexColors:!0,transparent:!0,opacity:0,depthWrite:!1,fog:!1,blending:2});o.toneMapped=!1;let s=new na(a,o);return s.visible=!1,s.frustumCulled=!1,s}var gy={value:null};function _y(){let e=new bi(new Uint8Array([0]),1,1,D,l);return e.needsUpdate=!0,e}gy.value=_y();var vy=2;function yy({manifest:e,texture:t}){let{width:n,height:r}=e.dimensions,{xmin:i,ymin:a,xmax:o,ymax:s}=e.bboxCrsUnits,c=o-i,l=s-a,u=Math.ceil(n/vy),d=Math.ceil(r/vy),f=document.createElement(`canvas`);f.width=u,f.height=d;let p=f.getContext(`2d`);if(!p)return()=>0;p.drawImage(t.image,0,0,u,d);let m=p.getImageData(0,0,u,d).data,h=new Uint8Array(u*d);for(let e=0;e<h.length;e++)h[e]=m[e*4];return function(e,t){let n=Math.floor((e+c/2)/c*u),r=Math.floor((t+l/2)/l*d);return n<0||n>=u||r<0||r>=d?0:h[r*u+n]/255}}async function by(e=`./data`){let n=await fetch(`${e}/forest.json`).then(e=>e.json()),r=await new Bo().loadAsync(`${e}/${n.file.name}`);return r.colorSpace=``,r.wrapS=t,r.wrapT=t,r.magFilter=o,r.minFilter=c,r.generateMipmaps=!0,r.needsUpdate=!0,gy.value=r,{manifest:n,texture:r}}var xy={value:null};function Sy(){let e=new bi(new Uint8Array([0,0,0,255]),1,1);return e.colorSpace=``,e.needsUpdate=!0,e}xy.value=Sy();async function Cy(e=`./data`){let n=await fetch(`${e}/glacier.json`).then(e=>e.json()),r=await new Bo().loadAsync(`${e}/${n.file.name}`);return r.colorSpace=``,r.wrapS=t,r.wrapT=t,r.magFilter=o,r.minFilter=c,r.generateMipmaps=!0,r.needsUpdate=!0,xy.value=r,{manifest:n,texture:r}}var wy={value:0},Ty=16185855,Ey=3200,Dy=.3;function Oy(e){let t=e.toPrecision(12);return t.includes(`.`)||t.includes(`e`)?t:`${t}.0`}function ky(){let e=new W(Ty);return`vec3( ${Oy(e.r)}, ${Oy(e.g)}, ${Oy(e.b)} )`}function Ay(){return`
    uniform float uSnow;

    float snowHash( vec2 p ) {
      return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453123 );
    }
    float snowNoise( vec2 p ) {
      vec2 i = floor( p );
      vec2 f = fract( p );
      vec2 u = f * f * ( 3.0 - 2.0 * f );
      return mix( mix( snowHash( i ), snowHash( i + vec2( 1.0, 0.0 ) ), u.x ),
                  mix( snowHash( i + vec2( 0.0, 1.0 ) ), snowHash( i + vec2( 1.0, 1.0 ) ), u.x ), u.y );
    }

    // How much lying snow is on the ground at one point, 0..1.
    //   wxz     world position in metres (x = east, y of the vec2 = z = south)
    //   elev    ground elevation there, in metres
    //   aspectZ the ground normal's z; negative faces north (see SNOW_ASPECT_M)
    //   bare    1 where the ground is too steep to hold anything at all
    float snowCover( vec2 wxz, float elev, float aspectZ, float bare ) {
      float wobble = ( snowNoise( wxz / ${Oy(700)} ) - 0.5 ) * 2.0;
      float hEff = elev + wobble * ${Oy(100)} - aspectZ * ${Oy(320)};
      float line = mix( ${Oy(Ey)}, ${Oy(900)}, uSnow );
      float reach = smoothstep( 0.0, ${Oy(Dy)}, uSnow );
      return smoothstep( line - ${Oy(300)}, line + ${Oy(300)}, hEff )
             * reach * ( 1.0 - bare );
    }
  `}function jy(e,t,n){let r=Math.min(1,Math.max(0,(n-e)/(t-e)));return r*r*(3-2*r)}function My({elevM:e,aspectZ:t=0,bare:n=0,level:r,wobbleM:i=0}){if(!(r>0)||!Number.isFinite(e))return 0;let a=e+i-t*320,o=Ey+(900-Ey)*r,s=jy(0,Dy,r);return jy(o-300,o+300,a)*s*(1-n)}var Ny={value:null},Py={value:0},Fy={value:0},Iy=3.4,Ly=.1;function Ry(e){let t=e.toPrecision(12);return t.includes(`.`)||t.includes(`e`)?t:`${t}.0`}function zy(){return`
    uniform sampler2D uBasemap;
    uniform float uBasemapMix;
    uniform float uBasemapScale;

    // Linear albedo from the satellite texture. The texture is tagged
    // SRGBColorSpace, so three has already undone the sRGB transfer the build
    // script applied and this sample is linear 0..1 of FULL_SCALE.
    //   uv      the terrain's own UV, identical to the canopy mask's
    //   detail  a mean-0 wobble, kept so the near field is not a flat wash
    vec3 basemapAlbedo( vec2 uv, float detail ) {
      vec3 photo = texture2D( uBasemap, uv ).rgb * uBasemapScale;
      return photo * ( 1.0 + detail * ${Ry(Ly)} );
    }
  `}function By(){let e=new bi(new Uint8Array([128,128,128,255]),1,1);return e.needsUpdate=!0,e}Ny.value=By();function Vy(e,t){let n=e.levels??[];if(!n.length)throw Error(`basemap.json has no levels`);let r=n[0];for(let e of n){let{width:n,height:i}=e.dimensions;n<=t&&i<=t&&(r=e)}return r}async function Hy(e=`./data`,{maxTextureSize:n=4096}={}){let r=await fetch(`${e}/basemap.json`).then(e=>e.json()),i=Vy(r,n),a=await new Bo().loadAsync(`${e}/${i.file.name}`);return a.colorSpace=Re,a.wrapS=t,a.wrapT=t,a.magFilter=o,a.minFilter=c,a.generateMipmaps=!0,a.anisotropy=4,a.needsUpdate=!0,Ny.value=a,Fy.value=r.encoding.fullScale*Iy,Py.value=1,{manifest:r,texture:a,level:i}}var Uy={value:null},Wy={value:4e3},Gy={value:1500},Ky={value:8e3};function qy(){let e=new bi(new Uint8Array([0]),1,1,D,l);return e.needsUpdate=!0,e}Uy.value=qy();function Jy({worldWidth:e,worldDepth:t}){let n=e=>{let t=e.toPrecision(12);return t.includes(`.`)||t.includes(`e`)?t:`${t}.0`};return`
    uniform sampler2D uOuterRing;
    uniform float uOuterRingFadeM;
    uniform float uOuterRingMaxM;
    uniform float uEdgeFadeM;

    float outerRingFade( vec2 wxz ) {
      // Same mapping as terrainUv() in src/terrain.js: +Z is South (§6), and
      // the field's row 0 is the north edge, which the loader's flipY handles.
      vec2 uv = vec2( ( wxz.x + ${n(e/2)} ) / ${n(e)},
                      ( ${n(t/2)} - wxz.y ) / ${n(t)} );

      // How far beyond the last cell of real local data.
      float beyond = texture2D( uOuterRing, uv ).r * uOuterRingMaxM;
      float ring = smoothstep( 0.0, uOuterRingFadeM, beyond );

      // How close to the bbox, in metres, on whichever side is nearest.
      vec2 toEdge = vec2( ${n(e/2)}, ${n(t/2)} ) - abs( wxz );
      float edge = 1.0 - smoothstep( 0.0, uEdgeFadeM, min( toEdge.x, toEdge.y ) );

      return clamp( max( ring, edge ), 0.0, 1.0 );
    }
  `}function Yy(e,t,n){let r=Math.min(1,Math.max(0,(n-e)/(t-e)));return r*r*(3-2*r)}function Xy({field:e,width:t,height:n,worldWidth:r,worldDepth:i,maxDistanceM:a}){return function(o,s){let c=Math.floor((o+r/2)/r*t),l=Math.floor((s+i/2)/i*n),u=c<0||c>=t||l<0||l>=n?a:e[l*t+c]/255*a,d=Yy(0,Wy.value,u),f=r/2-Math.abs(o),p=i/2-Math.abs(s),m=1-Yy(0,Gy.value,Math.min(f,p));return Math.min(1,Math.max(0,Math.max(d,m)))}}function Zy({manifest:e,texture:t}){let{width:n,height:r}=e.dimensions,{xmin:i,ymin:a,xmax:o,ymax:s}=e.bboxCrsUnits,c=document.createElement(`canvas`);c.width=n,c.height=r;let l=c.getContext(`2d`);if(!l)return()=>0;l.drawImage(t.image,0,0,n,r);let u=l.getImageData(0,0,n,r).data,d=new Uint8Array(n*r);for(let e=0;e<d.length;e++)d[e]=u[e*4];return Xy({field:d,width:n,height:r,worldWidth:o-i,worldDepth:s-a,maxDistanceM:e.encoding.maxDistanceM})}async function Qy(e=`./data`){let n=await fetch(`${e}/outerring.json`).then(e=>e.json()),r=await new Bo().loadAsync(`${e}/${n.file.name}`);return r.colorSpace=``,r.wrapS=t,r.wrapT=t,r.magFilter=o,r.minFilter=o,r.generateMipmaps=!1,r.needsUpdate=!0,Uy.value=r,Ky.value=n.encoding.maxDistanceM,{manifest:n,texture:r}}var $y=1.5,eb=150,tb=1;function nb(e){let t=e.toPrecision(12);return t.includes(`.`)||t.includes(`e`)?t:`${t}.0`}function rb(e){let t=new W(e);return`vec3( ${nb(t.r)}, ${nb(t.g)}, ${nb(t.b)} )`}function ib(e,t,n){if(!e.includes(t))throw Error(`terrain.js: shader marker not found, three.js internals may have changed: ${t}`);return e.replace(t,n)}var ab=[{name:`valley`,top:800,color:10599285},{name:`montane`,top:1600,color:7573861},{name:`subalpine`,top:2200,color:9282668},{name:`meadow`,top:3e3,color:12107401},{name:`rocky`,top:3800,color:11774623},{name:`nival`,top:1/0,color:16185855}],ob=150,sb=11774623,cb=6716766,lb=.9,ub=16777215,db=3150,fb=220,pb=12634315,mb=.12,hb=.78,gb=11708315,_b=.85,vb={value:1},yb=.55,bb={value:1},xb={value:1},Sb=.57,Cb=.31,wb=.25,Tb=.87,Eb=.6;async function Db(e=`./data`){let n=await fetch(`${e}/heightfield.json`).then(e=>e.json()),r=await fetch(`${e}/${n.file.name}`).then(e=>e.arrayBuffer()),i=Lv(new Uint8Array(r),n),{width:a,height:s}=n.dimensions,{xmin:c,ymin:u,xmax:d,ymax:f}=n.bboxCrsUnits,{min:p,max:m}=n.elevationRangeM,{x:h,y:g}=n.resolutionMPerPx,_=d-c,v=f-u;Mv(n.localOrigin.x,n.localOrigin.y);let y=new Uint8Array(i.length*2);for(let e=0;e<i.length;e++){let t=i[e];y[e*2]=t>>8,y[e*2+1]=t&255}let b=new bi(y,a,s,k,l);b.flipY=!0,b.magFilter=o,b.minFilter=o,b.wrapS=t,b.wrapT=t,b.generateMipmaps=!1,b.needsUpdate=!0;let x=new go({color:16777215,displacementMap:b,displacementScale:m-p,displacementBias:p,metalness:0,roughness:1}),S=`
    // Constant across a geometry, one per LOD depth: the size of this tile's own
    // grid cell in metres. Injected into the VERTEX shader only, where HELPERS
    // goes - the fragment side has its own declarations.
    attribute vec2 aCellM;
${Zv()}
    varying float vTerrainElev;
    varying vec3 vTerrainNormal;
    varying vec2 vTerrainXZ;
    vec2 terrainUv( vec2 wxz ) {
      return vec2( ( wxz.x + ${nb(_/2)} ) / ${nb(_)},
                   ( ${nb(v/2)} - wxz.y ) / ${nb(v)} );
    }
    // TAKES WORLD METRES, NOT UV, and that is deliberate rather than tidier: the
    // high-resolution tier is a correction addressed in world space, and the five
    // places that ask for an elevation - the displacement and the four normal taps
    // - must all get the same one, or the shading describes a surface the geometry
    // does not have. Passing wxz makes that impossible to get wrong by omission.
    float terrainElevation( vec2 wxz ) {
      vec2 s = texture2D( displacementMap, terrainUv( wxz ) ).rg;
      return ( ( s.r * 256.0 + s.g ) / 257.0 ) * displacementScale + displacementBias
           + heightTierM( wxz );
    }
  `,C=`
    vec2 wTerrainXZ = ( modelMatrix * vec4( position, 1.0 ) ).xz;
    vec2 tUv = terrainUv( wTerrainXZ );
    // The slope is measured over THIS TILE'S cell, never finer than one texel of
    // the height texture. It used to be one texel always, which meant a tile
    // drawn on a 328 m grid was shaded by a 20 m slope it does not have - and
    // that mismatch, not the geometry, is what a subdivision actually shows:
    // measured 2026-08-10, the surface moves by 1-2 px while 27.6% of the tile's
    // pixels change brightness (tools/dev/probe-lod.mjs and probe-lod-visible.mjs).
    // Costs nothing: the same four taps, at a different spacing.
    vec2 nSpacing = max( vec2( ${nb(h)}, ${nb(g)} ), aCellM );
    // In world metres now. +Z is South, so north is -z - which is why hN steps
    // NEGATIVE in y here where the uv version stepped positive in v.
    float hW = terrainElevation( wTerrainXZ - vec2( nSpacing.x, 0.0 ) );
    float hE = terrainElevation( wTerrainXZ + vec2( nSpacing.x, 0.0 ) );
    float hN = terrainElevation( wTerrainXZ - vec2( 0.0, nSpacing.y ) );
    float hS = terrainElevation( wTerrainXZ + vec2( 0.0, nSpacing.y ) );
    vec3 objectNormal = normalize( vec3(
      ( hW - hE ) / ( 2.0 * nSpacing.x ),
      1.0,
      ( hN - hS ) / ( 2.0 * nSpacing.y )
    ) );
    // Safe to hand the fragment shader as a world-space normal: every tile's
    // modelMatrix is a pure translation (see the geometries[] comment below),
    // so object and world orientation are the same here. Passing it as a
    // varying rather than recomputing per-pixel costs 4 texture taps less, at
    // the price of slope being interpolated across a quad - only visible on
    // distant coarse tiles, which fog washes out anyway.
    vTerrainNormal = objectNormal;
  `,w=ab.slice(1).map((e,t)=>{let n=ab[t].top;return`      albedo = mix( albedo, ${rb(e.color)}, smoothstep( ${nb(n-ob)}, ${nb(n+ob)}, h ) );`}).join(`
`),T=`
    varying float vTerrainElev;
    varying vec3 vTerrainNormal;
    varying vec2 vTerrainXZ;
    uniform sampler2D uForestMask;
    uniform sampler2D uGlacierMask;
    uniform float uGlacierMix;
    uniform float uMoraineMix;
    uniform float uIcePhotoMix;
    uniform float uIceSunMix;
    uniform float uIceSunPower; // src/lighting.js's SUN_POWER: 1 at midday, ~0.1 at night
    // The sun's direction, bound to the SAME holder lighting.js writes every frame for the
    // aerial perspective (ATMO.uniforms.uAtmoSunDir). Declared under its own name rather than
    // borrowed from the fog chunk, which only exists while USE_FOG is defined.
    uniform vec3 uIceSunDir;
    // Carried from terrainAlbedo() to the emissive patch further down the fragment shader:
    // plain globals, because that is what a GLSL translation unit gives us and the two places
    // are in the same one.
    float terrainIceAmount = 0.0;
    vec3 terrainIceColor = vec3( 1.0 );
    vec3 terrainIceNormal = vec3( 0.0, 1.0, 0.0 );
${Ay()}
${zy()}
${od()}
${Jy({worldWidth:_,worldDepth:v})}

    float terrainHash( vec2 p ) {
      return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453123 );
    }
    float terrainNoise( vec2 p ) {
      vec2 i = floor( p );
      vec2 f = fract( p );
      vec2 u = f * f * ( 3.0 - 2.0 * f );
      return mix( mix( terrainHash( i ), terrainHash( i + vec2( 1.0, 0.0 ) ), u.x ),
                  mix( terrainHash( i + vec2( 0.0, 1.0 ) ), terrainHash( i + vec2( 1.0, 1.0 ) ), u.x ), u.y );
    }

    vec3 terrainAlbedo() {
      vec3 n = normalize( vTerrainNormal );
      // Two octaves, at valley scale and at stand scale, so band boundaries
      // wander instead of ringing the mountains as contour lines.
      float wobble = ( terrainNoise( vTerrainXZ / 900.0 ) - 0.5 )
                   + ( terrainNoise( vTerrainXZ / 260.0 ) - 0.5 ) * 0.5;
      // +Z is South (§6), so n.z < 0 faces north: colder, vegetation stops
      // lower. Subtracting shifts south-facing ground the other way, which is
      // also right.
      float h = vTerrainElev + wobble * ${nb(75)} - n.z * ${nb(50)};

      vec3 albedo = ${rb(ab[0].color)};
${w}

      // Real forest, from OSM. Same UV mapping as terrainUv() - the mask is on
      // the heightfield's own grid, which is the whole point of building it that
      // way. Slope is already baked out of the mask, so this cannot fight the
      // rock term below.
      vec2 fUv = vec2( ( vTerrainXZ.x + ${nb(_/2)} ) / ${nb(_)},
                       ( ${nb(v/2)} - vTerrainXZ.y ) / ${nb(v)} );
      // Faded out by the satellite mix: where the photo is carrying the colour
      // it already shows the real forest, at its real extent and in its real
      // colour, so tinting from the OSM polygons on top would be the same claim
      // made twice - and the weaker of the two claims at that.
      float wood = texture2D( uForestMask, fUv ).r;
      albedo = mix( albedo, ${rb(cb)},
                    wood * ${nb(lb)} * ( 1.0 - uBasemapMix ) );

      // The satellite albedo (src/basemap.js), replacing the elevation bands and
      // the forest tint rather than sitting on top of them - the whole point of
      // the photo is that it knows where this particular hillside is wooded,
      // grassy or bare, which a function of altitude can only approximate. What
      // it does NOT know is anything the elevation bands were never doing
      // either: see the two terms below, both of which still apply over it.
      albedo = mix( albedo, basemapAlbedo( fUv, wobble ), uBasemapMix );

      // The optional high-resolution photograph, near the camera only (src/orthotier.js).
      // It goes ON TOP of the satellite for the same reason the satellite goes on top of the
      // elevation bands: where it exists it knows this hillside better than anything under
      // it. Sampled ONCE here and reused by the ice below - rgb is its albedo, a is how much
      // of the ground it should carry. Zero outside the atlas, beyond the fade, over a cell
      // with no coverage, and always until something asks for the download, so a viewer that
      // never turns it on pays one texture fetch and nothing else.
      vec4 photo = orthoSample( vTerrainXZ );

      // THE ICE IS DECIDED BEFORE THE PHOTOGRAPH IS APPLIED, and that ordering is the whole
      // point rather than housekeeping. The obvious arrangement - photograph first, ice over
      // it - leaves a second, uncontrolled path: iceHere is not 1 on steep ground, because
      // the slope fade below deliberately holds back to ICE_ON_CLIFF so an outline edge
      // cannot paint a rock wall white. Whatever the ice does not cover, the photograph
      // fills. On a glacier that gap is exactly the steep, crevassed part, so the ice came
      // out vivid blue with uIcePhotoMix at ZERO - the photograph arriving through a door
      // nobody meant to leave open.
      //
      // So: the photograph is held OUT of the ice here, and let back in below at exactly
      // uIcePhotoMix. One knob, and 0 restores what shipped.
      float iceMask = texture2D( uGlacierMask, fUv ).r;
      float iceSlope = mix( ${nb(wb)}, 1.0,
                            smoothstep( ${nb(Cb)}, ${nb(Sb)}, n.y ) );
      // THE MASK, NOT iceHere, is what closes the door. Weighting the photograph by
      // 1 - iceHere looks like the same thing and is not: iceHere carries the slope fade, so
      // on an icefall it is 0.25 and three quarters of the photograph still arrived - which
      // is exactly the vivid blue this was written to stop, unchanged, at uIcePhotoMix 0.
      // The slope fade's job is how much ICE covers the rock, not whether a photograph may
      // enter. So the outline decides that, and uIcePhotoMix is then the only door.
      // AND IT IS "IS THERE ICE HERE AT ALL", not "how much". Gating on the mask's own value
      // looked right and was not: measured over the ground the camera sees on the Grand Etret,
      // only 42% of the icy cells read 1.0 - the mask is 20.5 m and stores COVERAGE, so most
      // of a ragged glacier is partial (histogram: 627 cells at 1.0, 709 spread from 0.05 to
      // 0.95). Weighting by 1 - iceMask therefore let most of the photograph in anyway, and
      // the vivid blue survived every attempt to close the door.
      //
      // So the door is binary-ish: anywhere the outline claims ice at all, the photograph is
      // held out, and uIcePhotoMix is the only way back in. The moraine band pays for this -
      // it is partial by definition - and that is the trade: a predictable knob over a free
      // dose of real debris.
      float icePresence = smoothstep( 0.02, 0.35, iceMask ) * uGlacierMix;
      float iceHere = clamp( iceMask * uGlacierMix * iceSlope, 0.0, 1.0 );

      albedo = mix( albedo, photo.rgb, photo.a * ( 1.0 - icePresence ) );

      // Steep ground is bare whatever its altitude - nothing roots on a cliff,
      // and snow doesn't sit on one either. It survives the satellite mix above
      // for a second reason: a view from orbit is a plan projection, so a
      // vertical face is a handful of texels no matter how sharp the imagery, and
      // draping those over its true area smears whatever happened to be at its
      // foot up the whole wall. This term is what still says "rock" there.
      // Ascending edges only: GLSL leaves
      // smoothstep undefined when edge0 >= edge1, so this can't be written as
      // a descending smoothstep on n.y.
      float bare = 1.0 - smoothstep( ${nb(Eb)}, ${nb(Tb)}, n.y );
      vec3 ground = mix( albedo, ${rb(sb)}, bare * 0.9 );
      // THE ICE, from the mask. After the rock term and after the satellite mix, because a
      // glacier is not a tint on what is underneath: it is the surface. The photo does
      // show the ice, but it shows it as whatever Sentinel-2 saw on one day - shadowed,
      // dulled by the de-shading pass, and in places rock-coloured where the tongue had
      // retreated since - and OSM's outline is the claim this project actually makes about
      // where the ice is.
      //
      // The slope fade is the one thing that survives underneath: an icefall is steep by
      // definition, so it fades late and never to zero, and what it prevents is an outline
      // edge running up a rock wall and painting the wall white.

      // Firn above, live ice below, on the same wobbled elevation the bands use - h, the
      // noise-shifted height, rather than vTerrainElev - so the firn line wanders with the
      // same field the treeline does and the two never look drawn by different hands.
      // (No backticks in here: this whole block is a JS template literal.)
      vec3 iceColor = mix( ${rb(pb)}, ${rb(ub)},
                           smoothstep( ${nb(db-fb)},
                                       ${nb(3370)}, h ) );
      // The moraine at the margin. A partly covered mask pixel is the edge of the outline, so
      // the band is read off the mask itself - highest in the middle of the ramp and zero at
      // both ends, which puts debris on the rim and leaves the body of the glacier clean.
      float rim = smoothstep( ${nb(mb)}, ${nb(.9/2)}, iceMask )
                * ( 1.0 - smoothstep( ${nb(.9/2)}, ${nb(hb)}, iceMask ) );
      iceColor = mix( iceColor, ${rb(gb)}, rim * ${nb(_b)} * uMoraineMix );

      // AND THE PHOTOGRAPH GOES INTO THE ICE, rather than the ice cancelling it (the user,
      // 2026-08-20: "prova a miscelare il nostro ghiacciaio con la foto"). The comment above
      // is still the reason the ice wins by default - the outline is the claim this project
      // makes - but a flat colour has no crevasses, no debris fans and no melt streaks, and
      // the photograph has all three from one real August. So on ice the two are mixed at
      // uIcePhotoMix instead of one replacing the other.
      //
      // Note this is NOT the same as letting the photo through: it happens after the firn,
      // live-ice and moraine terms, so what mixes in is the photograph over OUR ice, and
      // switching uIcePhotoMix to 0 restores exactly what shipped before.
      iceColor = mix( iceColor, photo.rgb, photo.a * uIcePhotoMix );

      ground = mix( ground, iceColor, iceHere );
      // Handed to the emissive patch below - see ICE_SUN_GAIN. The moraine is deliberately
      // included in iceColor here, so a debris-covered margin does not glare - and so is the
      // photograph now, so a shadowed crevasse does not glare either.
      terrainIceAmount = iceHere;
      terrainIceColor = iceColor;
      terrainIceNormal = n;

      // Weather snow goes on last, over rock and forest floor alike. WHERE it
      // lies is src/snow.js's business, not this file's - altitude, aspect and
      // slope, so a summit whitens first and a north face keeps it longest. The
      // slope term handed over is the rock one above, read the other way up:
      // what is too steep for soil is too steep for snow.
      //
      // The permanent white of the nival band is separate and stays where it is;
      // this is the weather on top of it.
      return mix( ground, ${ky()}, snowCover( vTerrainXZ, vTerrainElev, n.z, bare ) );
    }
  `;x.onBeforeCompile=e=>{e.uniforms.uForestMask=gy,e.uniforms.uGlacierMask=xy,e.uniforms.uGlacierMix=xb,e.uniforms.uMoraineMix=bb,e.uniforms.uIceSunMix=vb,e.uniforms.uIceSunPower=ly,e.uniforms.uIceSunDir=Qv.uniforms.uAtmoSunDir,e.uniforms.uSnow=wy,e.uniforms.uBasemap=Ny,e.uniforms.uBasemapMix=Py,e.uniforms.uBasemapScale=Fy,e.uniforms.uOrtho=Zu,e.uniforms.uOrthoRect=Qu,e.uniforms.uOrthoMix=$u,e.uniforms.uOrthoNearM=ed,e.uniforms.uOrthoFarM=td,e.uniforms.uOrthoScale=rd,e.uniforms.uIcePhotoMix=nd,e.uniforms.uHeightTier=Wv,e.uniforms.uHeightTierRect=Gv,e.uniforms.uHeightTierMix=Kv,e.uniforms.uOuterRing=Uy,e.uniforms.uOuterRingFadeM=Wy,e.uniforms.uOuterRingMaxM=Ky,e.uniforms.uEdgeFadeM=Gy;let t=e.vertexShader;t=ib(t,`#include <displacementmap_pars_vertex>`,`#include <displacementmap_pars_vertex>\n${S}`),t=ib(t,`#include <beginnormal_vertex>`,C),t=ib(t,`#include <displacementmap_vertex>`,`float terrainH = terrainElevation( wTerrainXZ );
      transformed.y += terrainH;
      vTerrainElev = terrainH;
      vTerrainXZ = wTerrainXZ;`),e.vertexShader=t;let n=e.fragmentShader;n=ib(n,`#include <common>`,`#include <common>\n${T}`),n=ib(n,`#include <map_fragment>`,`#include <map_fragment>
  diffuseColor.rgb *= terrainAlbedo();`),n=ib(n,`#include <emissivemap_fragment>`,`#include <emissivemap_fragment>
      float iceSun = max( dot( normalize( terrainIceNormal ), normalize( uIceSunDir ) ), 0.0 );
      totalEmissiveRadiance += terrainIceColor * terrainIceAmount * iceSun
                             * ${nb(yb)} * uIceSunMix
                             // SQUARED, and measured rather than chosen. Linear in the sun's
                             // power the night preset still puts 0.1 of the gain on the ice,
                             // and a night frame is dark enough that this raised the brightest
                             // sixth of it from 42.9 to 74.4 - the glaciers became the brightest
                             // thing in the park at midnight. Squaring takes night to 0.01 and
                             // leaves midday at 1.0 by construction, with dawn at 0.31 and dusk
                             // at 0.06, which is the order those hours belong in.
                             * uIceSunPower * uIceSunPower;`),n=ib(n,`#include <fog_fragment>`,`#include <fog_fragment>
      #ifdef USE_FOG
        gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, outerRingFade( vTerrainXZ ) );
      #endif`),e.fragmentShader=n},ry(x);let E=[],D=[];for(let e=0;e<=9;e++){let t=_/2**e,n=v/2**e;E.push(Ob(32,t,n,eb)),D.push(Ob(32,t,n,tb))}let O=new Dn;O.name=`terrain`;let A=[],ee={tiles:0,deepest:0,skirted:0},j=new Li,M=new Qt,te=new Zn;function ne(e,t,n,r,i,a,o){let s=Gv.value;if(i>=(fe()&&e-n>=s.x&&e+n<=s.x+s.z&&t-r>=s.y&&t+r<=s.y+s.w?7+ae:7))return!1;let c=Math.max(0,Math.abs(a-e)-n),l=Math.max(0,Math.abs(o-t)-r);return Math.hypot(c,l)<Math.max(n,r)*2*$y}function N(e,t,n,r){let i=_/2,a=v/2;if(Math.abs(e)>i||Math.abs(t)>a)return-1;let o=0,s=0,c=0;for(;ne(o,s,i,a,c,n,r);)i/=2,a/=2,o+=e>o?i:-i,s+=t>s?a:-a,c++;return c}function re(e){e.updateMatrixWorld(),M.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),j.setFromProjectionMatrix(M);let t=e.position.x,n=e.position.z,r=0,i=0,a=0,o=(e,o,s,c,l)=>{let u=N(e-s-1,o,t,n)!==l||N(e+s+1,o,t,n)!==l||N(e,o-c-1,t,n)!==l||N(e,o+c+1,t,n)!==l;u&&a++;let d=(u?E:D)[l],f=A[r];f?f.geometry!==d&&(f.geometry=d):(f=new _i(d,x),f.frustumCulled=!1,A.push(f),O.add(f)),f.position.set(e,0,o),f.visible=!0,r++,l>i&&(i=l)},s=(e,r,i,a,c)=>{if(te.min.set(e-i,p-eb,r-a),te.max.set(e+i,m,r+a),j.intersectsBox(te)){if(ne(e,r,i,a,c,t,n)){let t=i/2,n=a/2;s(e-t,r-n,t,n,c+1),s(e+t,r-n,t,n,c+1),s(e-t,r+n,t,n,c+1),s(e+t,r+n,t,n,c+1);return}o(e,r,i,a,c)}};s(0,0,_/2,v/2,0);for(let e=r;e<A.length;e++)A[e].visible=!1;ee.tiles=r,ee.deepest=i,ee.skirted=a}let ie=null,ae=0,oe=_/(32*2**7);Wv.value=Wv.value??Jv(),qv.value=32*2**7;let se=null,ce=new Map,le=-1;async function P(e=`./`){if(se)return se;let t=`${e}data/heighttier.json`.replace(/\/\//g,`/`);return se=await fetch(t).then(e=>e.ok?e.json():null).catch(()=>null),se}async function ue(e=0,t=`./`){let r=await P(t);if(!r?.levels?.length)return null;let i=Math.max(0,Math.min(r.levels.length-1,e));if(le===i&&ie)return r.levels[i];let a=r.levels[i],o=ce.get(i);if(!o){let e=await fetch(`${t}data/${a.file.name}`.replace(/\/\//g,`/`)).then(e=>e.ok?e.arrayBuffer():null);if(!e)return null;o=new Uint8Array(e),ce.set(i,o)}ae=Math.max(0,Math.min(2,Math.floor(Math.log2(oe/a.resolutionMPerPx.x)+1e-6)));let{texture:s,rect:c,dimensions:l}=Yv(o,r,i,n),u=Wv.value;return Wv.value=s,Gv.value.copy(c),u&&u!==s&&u.dispose(),ie={bytes:o,manifest:r,level:a,dimensions:l,rect:c,mix:Kv.value},le=i,de(Kv.value),a}function de(e){let t=Math.min(1,Math.max(0,e));Kv.value=t,ie&&(ie.mix=t),qv.value=32*2**(t>0&&ie?7+ae:7)}let fe=()=>ie!==null&&Kv.value>0;function pe(e,t){return zv(i,n,e,t)+Xv(ie,e,t)}function me(e,t){let r=fe()?32*2**(7+ae):4096;return Bv(i,n,r,r,e,t)+Xv(ie,e,t)}return{object:O,manifest:n,heights:i,heightTexture:b,sampleHeight:pe,sampleRenderedHeight:me,update:re,stats:ee,loadHeightTier:ue,setHeightTierMix:de,heightTierManifest:P,heightTierLevel:()=>le,get heightTier(){return ie}}}function Ob(e,t,n,r){let i=e+1,a=i*i,o=a+4*i,s=new Float32Array(o*3),c=new Float32Array(o*3),l=new Float32Array(o*2),u=new Float32Array(o*2),d=(e,t)=>t*i+e,f=(r,i,a,o,d,f)=>{s[r*3]=i,s[r*3+1]=a,s[r*3+2]=o,c[r*3+1]=1,l[r*2]=d,l[r*2+1]=f,u[r*2]=t/e,u[r*2+1]=n/e};for(let r=0;r<=e;r++)for(let i=0;i<=e;i++){let a=i/e,o=r/e;f(d(i,r),(a-.5)*t,0,(o-.5)*n,a,o)}let p=a,m=a+i,h=a+2*i,g=a+3*i;for(let i=0;i<=e;i++){let a=i/e;f(p+i,(a-.5)*t,-r,-.5*n,a,0),f(m+i,(a-.5)*t,-r,.5*n,a,1),f(h+i,-.5*t,-r,(a-.5)*n,0,a),f(g+i,.5*t,-r,(a-.5)*n,1,a)}let _=[];for(let t=0;t<e;t++)for(let n=0;n<e;n++){let e=d(n,t),r=d(n,t+1),i=d(n+1,t+1),a=d(n+1,t);_.push(e,r,a,r,i,a)}let v=(e,t,n,r)=>_.push(e,t,n,t,r,n);for(let t=0;t<e;t++)v(d(t,0),d(t+1,0),p+t,p+t+1),v(d(t+1,e),d(t,e),m+t+1,m+t),v(d(0,t+1),d(0,t),h+t+1,h+t),v(d(e,t),d(e,t+1),g+t,g+t+1);let y=new kr;return y.setAttribute(`position`,new hr(s,3)),y.setAttribute(`normal`,new hr(c,3)),y.setAttribute(`uv`,new hr(l,2)),y.setAttribute(`aCellM`,new hr(u,2)),y.setIndex(_),y}var kb=new Zn,Ab=new H,jb=class extends is{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type=`LineSegmentsGeometry`,this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute(`position`,new G([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute(`uv`,new G([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,n=this.attributes.instanceEnd;return t!==void 0&&(t.applyMatrix4(e),n.applyMatrix4(e),t.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let n=new Cs(t,6,1);return this.setAttribute(`instanceStart`,new Mr(n,3,0)),this.setAttribute(`instanceEnd`,new Mr(n,3,3)),this.instanceCount=this.attributes.instanceStart.count,this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let n=new Cs(t,6,1);return this.setAttribute(`instanceColorStart`,new Mr(n,3,0)),this.setAttribute(`instanceColorEnd`,new Mr(n,3,3)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new ro(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Zn);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;e!==void 0&&t!==void 0&&(this.boundingBox.setFromBufferAttribute(e),kb.setFromBufferAttribute(t),this.boundingBox.union(kb))}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new xr),this.boundingBox===null&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(e!==void 0&&t!==void 0){let n=this.boundingSphere.center;this.boundingBox.getCenter(n);let r=0;for(let i=0,a=e.count;i<a;i++)Ab.fromBufferAttribute(e,i),r=Math.max(r,n.distanceToSquared(Ab)),Ab.fromBufferAttribute(t,i),r=Math.max(r,n.distanceToSquared(Ab));this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error(`THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.`,this)}}toJSON(){}};q.line={worldUnits:{value:1},linewidth:{value:1},resolution:{value:new V},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}},Ls.line={uniforms:uo.merge([q.common,q.fog,q.line]),vertexShader:`
		#include <common>
		#include <color_pars_vertex>
		#include <fog_pars_vertex>
		#include <logdepthbuf_pars_vertex>
		#include <clipping_planes_pars_vertex>

		uniform float linewidth;
		uniform vec2 resolution;

		attribute vec3 instanceStart;
		attribute vec3 instanceEnd;

		attribute vec3 instanceColorStart;
		attribute vec3 instanceColorEnd;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#ifdef USE_DASH

			uniform float dashScale;
			attribute float instanceDistanceStart;
			attribute float instanceDistanceEnd;
			varying float vLineDistance;

		#endif

		float trimSegmentAlpha( const in vec4 start, const in vec4 end ) {

			// compute the interpolation factor needed to trim the segment so it terminates
			// between the camera plane and the near plane

			// conservative estimate of the near plane
			float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
			float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column

			// we need different nearEstimate formula for reversed and default depth buffer
			// a is positive with a reversed depth buffer so it can be used for controlling the code flow
			float nearEstimate = ( a > 0.0 ) ? ( - b / ( a + 1.0 ) ) : ( - 0.5 * b / a );

			return ( nearEstimate - start.z ) / ( end.z - start.z );

		}

		void main() {

			#ifdef USE_COLOR

				vColor.xyz = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

			#endif

			float aspect = resolution.x / resolution.y;

			// camera space
			vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
			vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

			#ifdef USE_DASH

				float lineDistanceStart = dashScale * instanceDistanceStart;
				float lineDistanceEnd = dashScale * instanceDistanceEnd;

			#endif

			#ifdef WORLD_UNITS

				worldStart = start.xyz;
				worldEnd = end.xyz;

			#else

				vUv = uv;

			#endif

			// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
			// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
			// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
			// perhaps there is a more elegant solution -- WestLangley

			bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

			if ( perspective ) {

				if ( start.z < 0.0 && end.z >= 0.0 ) {

					float alpha = trimSegmentAlpha( start, end );
					end.xyz = mix( start.xyz, end.xyz, alpha );

					#ifdef USE_DASH

						lineDistanceEnd = mix( lineDistanceStart, lineDistanceEnd, alpha );

					#endif

				} else if ( end.z < 0.0 && start.z >= 0.0 ) {

					float alpha = trimSegmentAlpha( end, start );
					start.xyz = mix( end.xyz, start.xyz, alpha );

					#ifdef USE_DASH

						lineDistanceStart = mix( lineDistanceEnd, lineDistanceStart, alpha );

					#endif

				}

			}

			#ifdef USE_DASH

				vLineDistance = ( position.y < 0.5 ) ? lineDistanceStart : lineDistanceEnd;
				vUv = uv;

			#endif

			// clip space
			vec4 clipStart = projectionMatrix * start;
			vec4 clipEnd = projectionMatrix * end;

			// ndc space
			vec3 ndcStart = clipStart.xyz / clipStart.w;
			vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

			// direction
			vec2 dir = ndcEnd.xy - ndcStart.xy;

			// account for clip-space aspect ratio
			dir.x *= aspect;
			dir = normalize( dir );

			#ifdef WORLD_UNITS

				vec3 worldDir = normalize( end.xyz - start.xyz );
				vec3 tmpFwd = normalize( mix( start.xyz, end.xyz, 0.5 ) );
				vec3 worldUp = normalize( cross( worldDir, tmpFwd ) );
				vec3 worldFwd = cross( worldDir, worldUp );
				worldPos = position.y < 0.5 ? start: end;

				// height offset
				float hw = linewidth * 0.5;
				worldPos.xyz += position.x < 0.0 ? hw * worldUp : - hw * worldUp;

				// don't extend the line if we're rendering dashes because we
				// won't be rendering the endcaps
				#ifndef USE_DASH

					// cap extension
					worldPos.xyz += position.y < 0.5 ? - hw * worldDir : hw * worldDir;

					// add width to the box
					worldPos.xyz += worldFwd * hw;

					// endcaps
					if ( position.y > 1.0 || position.y < 0.0 ) {

						worldPos.xyz -= worldFwd * 2.0 * hw;

					}

				#endif

				// project the worldpos
				vec4 clip = projectionMatrix * worldPos;

				// shift the depth of the projected points so the line
				// segments overlap neatly
				vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
				clip.z = clipPose.z * clip.w;

			#else

				vec2 offset = vec2( dir.y, - dir.x );
				// undo aspect ratio adjustment
				dir.x /= aspect;
				offset.x /= aspect;

				// sign flip
				if ( position.x < 0.0 ) offset *= - 1.0;

				// endcaps
				if ( position.y < 0.0 ) {

					offset += - dir;

				} else if ( position.y > 1.0 ) {

					offset += dir;

				}

				// adjust for linewidth
				offset *= linewidth;

				// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
				offset /= resolution.y;

				// select end
				vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

				// back to clip space
				offset *= clip.w;

				clip.xy += offset;

			#endif

			gl_Position = clip;

			vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

			#include <logdepthbuf_vertex>
			#include <clipping_planes_vertex>
			#include <fog_vertex>

		}
		`,fragmentShader:`
		uniform vec3 diffuse;
		uniform float opacity;
		uniform float linewidth;

		#ifdef USE_DASH

			uniform float dashOffset;
			uniform float dashSize;
			uniform float gapSize;

		#endif

		varying float vLineDistance;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#include <common>
		#include <color_pars_fragment>
		#include <fog_pars_fragment>
		#include <logdepthbuf_pars_fragment>
		#include <clipping_planes_pars_fragment>

		vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

			float mua;
			float mub;

			vec3 p13 = p1 - p3;
			vec3 p43 = p4 - p3;

			vec3 p21 = p2 - p1;

			float d1343 = dot( p13, p43 );
			float d4321 = dot( p43, p21 );
			float d1321 = dot( p13, p21 );
			float d4343 = dot( p43, p43 );
			float d2121 = dot( p21, p21 );

			float denom = d2121 * d4343 - d4321 * d4321;

			float numer = d1343 * d4321 - d1321 * d4343;

			mua = numer / denom;
			mua = clamp( mua, 0.0, 1.0 );
			mub = ( d1343 + d4321 * ( mua ) ) / d4343;
			mub = clamp( mub, 0.0, 1.0 );

			return vec2( mua, mub );

		}

		void main() {

			float alpha = opacity;
			vec4 diffuseColor = vec4( diffuse, alpha );

			#include <clipping_planes_fragment>

			#ifdef USE_DASH

				if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

				if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

			#endif

			#ifdef WORLD_UNITS

				// Find the closest points on the view ray and the line segment
				vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
				vec3 lineDir = worldEnd - worldStart;
				vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

				vec3 p1 = worldStart + lineDir * params.x;
				vec3 p2 = rayEnd * params.y;
				vec3 delta = p1 - p2;
				float len = length( delta );
				float norm = len / linewidth;

				#ifndef USE_DASH

					#ifdef USE_ALPHA_TO_COVERAGE

						float dnorm = fwidth( norm );
						alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

					#else

						if ( norm > 0.5 ) {

							discard;

						}

					#endif

				#endif

			#else

				#ifdef USE_ALPHA_TO_COVERAGE

					// artifacts appear on some hardware if a derivative is taken within a conditional
					float a = vUv.x;
					float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
					float len2 = a * a + b * b;
					float dlen = fwidth( len2 );

					if ( abs( vUv.y ) > 1.0 ) {

						alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

					}

				#else

					if ( abs( vUv.y ) > 1.0 ) {

						float a = vUv.x;
						float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
						float len2 = a * a + b * b;

						if ( len2 > 1.0 ) discard;

					}

				#endif

			#endif

			#include <logdepthbuf_fragment>
			#include <color_fragment>

			gl_FragColor = vec4( diffuseColor.rgb, alpha );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>
			#include <fog_fragment>
			#include <premultiplied_alpha_fragment>

		}
		`};var Mb=class extends mo{constructor(e){super({type:`LineMaterial`,uniforms:uo.clone(Ls.line.uniforms),vertexShader:Ls.line.vertexShader,fragmentShader:Ls.line.fragmentShader,clipping:!0}),this.isLineMaterial=!0,this.setValues(e)}get color(){return this.uniforms.diffuse.value}set color(e){this.uniforms.diffuse.value=e}get worldUnits(){return`WORLD_UNITS`in this.defines}set worldUnits(e){e===!0!==this.worldUnits&&(this.needsUpdate=!0),e===!0?this.defines.WORLD_UNITS=``:delete this.defines.WORLD_UNITS}get linewidth(){return this.uniforms.linewidth.value}set linewidth(e){this.uniforms.linewidth&&(this.uniforms.linewidth.value=e)}get dashed(){return`USE_DASH`in this.defines}set dashed(e){e===!0!==this.dashed&&(this.needsUpdate=!0),e===!0?this.defines.USE_DASH=``:delete this.defines.USE_DASH}get dashScale(){return this.uniforms.dashScale.value}set dashScale(e){this.uniforms.dashScale.value=e}get dashSize(){return this.uniforms.dashSize.value}set dashSize(e){this.uniforms.dashSize.value=e}get dashOffset(){return this.uniforms.dashOffset.value}set dashOffset(e){this.uniforms.dashOffset.value=e}get gapSize(){return this.uniforms.gapSize.value}set gapSize(e){this.uniforms.gapSize.value=e}get opacity(){return this.uniforms.opacity.value}set opacity(e){this.uniforms&&(this.uniforms.opacity.value=e)}get resolution(){return this.uniforms.resolution.value}set resolution(e){this.uniforms.resolution.value.copy(e)}get alphaToCoverage(){return`USE_ALPHA_TO_COVERAGE`in this.defines}set alphaToCoverage(e){this.defines&&(e===!0!==this.alphaToCoverage&&(this.needsUpdate=!0),e===!0?this.defines.USE_ALPHA_TO_COVERAGE=``:delete this.defines.USE_ALPHA_TO_COVERAGE)}},Nb=new qt,Pb=new H,Fb=new H,Ib=new qt,Lb=new qt,Rb=new qt,zb=new H,Bb=new Qt,Vb=new js,Hb=new H,Ub=new Zn,Wb=new xr,Gb=new qt,Kb,qb;function Jb(e,t,n){return Gb.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),Gb.multiplyScalar(1/Gb.w),Gb.x=qb/n.width,Gb.y=qb/n.height,Gb.applyMatrix4(e.projectionMatrixInverse),Gb.multiplyScalar(1/Gb.w),Math.abs(Math.max(Gb.x,Gb.y))}function Yb(e,t){let n=e.matrixWorld,r=e.geometry,i=r.attributes.instanceStart,a=r.attributes.instanceEnd,o=Math.min(r.instanceCount,i.count);for(let r=0,s=o;r<s;r++){Vb.start.fromBufferAttribute(i,r),Vb.end.fromBufferAttribute(a,r),Vb.applyMatrix4(n);let o=new H,s=new H;Kb.distanceSqToSegment(Vb.start,Vb.end,s,o),s.distanceTo(o)<qb*.5&&t.push({point:s,pointOnLine:o,distance:Kb.origin.distanceTo(s),object:e,face:null,faceIndex:r,uv:null,uv1:null})}}function Xb(e,t,n){let r=t.projectionMatrix,i=e.material.resolution,a=e.matrixWorld,o=e.geometry,s=o.attributes.instanceStart,c=o.attributes.instanceEnd,l=Math.min(o.instanceCount,s.count),u=-t.near;Kb.at(1,Rb),Rb.w=1,Rb.applyMatrix4(t.matrixWorldInverse),Rb.applyMatrix4(r),Rb.multiplyScalar(1/Rb.w),Rb.x*=i.x/2,Rb.y*=i.y/2,Rb.z=0,zb.copy(Rb),Bb.multiplyMatrices(t.matrixWorldInverse,a);for(let t=0,o=l;t<o;t++){if(Ib.fromBufferAttribute(s,t),Lb.fromBufferAttribute(c,t),Ib.w=1,Lb.w=1,Ib.applyMatrix4(Bb),Lb.applyMatrix4(Bb),Ib.z>u&&Lb.z>u)continue;if(Ib.z>u){let e=Ib.z-Lb.z,t=(Ib.z-u)/e;Ib.lerp(Lb,t)}else if(Lb.z>u){let e=Lb.z-Ib.z,t=(Lb.z-u)/e;Lb.lerp(Ib,t)}Ib.applyMatrix4(r),Lb.applyMatrix4(r),Ib.multiplyScalar(1/Ib.w),Lb.multiplyScalar(1/Lb.w),Ib.x*=i.x/2,Ib.y*=i.y/2,Lb.x*=i.x/2,Lb.y*=i.y/2,Vb.start.copy(Ib),Vb.start.z=0,Vb.end.copy(Lb),Vb.end.z=0;let o=Vb.closestPointToPointParameter(zb,!0);Vb.at(o,Hb);let l=Ot.lerp(Ib.z,Lb.z,o),d=l>=-1&&l<=1,f=zb.distanceTo(Hb)<qb*.5;if(d&&f){Vb.start.fromBufferAttribute(s,t),Vb.end.fromBufferAttribute(c,t),Vb.start.applyMatrix4(a),Vb.end.applyMatrix4(a);let r=new H,i=new H;Kb.distanceSqToSegment(Vb.start,Vb.end,i,r),n.push({point:i,pointOnLine:r,distance:Kb.origin.distanceTo(i),object:e,face:null,faceIndex:t,uv:null,uv1:null})}}}var Zb=class extends _i{constructor(e=new jb,t=new Mb({color:Math.random()*16777215})){super(e,t),this.isLineSegments2=!0,this.type=`LineSegments2`}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,n=e.attributes.instanceEnd,r=new Float32Array(2*t.count);for(let e=0,i=0,a=t.count;e<a;e++,i+=2)Pb.fromBufferAttribute(t,e),Fb.fromBufferAttribute(n,e),r[i]=i===0?0:r[i-1],r[i+1]=r[i]+Pb.distanceTo(Fb);let i=new Cs(r,2,1);return e.setAttribute(`instanceDistanceStart`,new Mr(i,1,0)),e.setAttribute(`instanceDistanceEnd`,new Mr(i,1,1)),this}raycast(e,t){let n=this.material.worldUnits,r=e.camera;if(r===null&&!n&&console.error(`LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.`),n===!1&&(this.material.resolution.x===0||this.material.resolution.y===0))return;let i=e.params.Line2===void 0?0:e.params.Line2.threshold||0;Kb=e.ray;let a=this.matrixWorld,o=this.geometry,s=this.material;qb=s.linewidth+i,o.boundingSphere===null&&o.computeBoundingSphere(),Wb.copy(o.boundingSphere).applyMatrix4(a);let c;if(c=n?qb*.5:Jb(r,Math.max(r.near,Wb.distanceToPoint(Kb.origin)),s.resolution),Wb.radius+=c,Kb.intersectsSphere(Wb)===!1)return;o.boundingBox===null&&o.computeBoundingBox(),Ub.copy(o.boundingBox).applyMatrix4(a);let l;l=n?qb*.5:Jb(r,Math.max(r.near,Ub.distanceToPoint(Kb.origin)),s.resolution),Ub.expandByScalar(l),Kb.intersectsBox(Ub)!==!1&&(n?Yb(this,t):Xb(this,r,t))}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(Nb),this.material.uniforms.resolution.value.set(Nb.z,Nb.w))}},Qb=10,$b=40,ex=40;function tx(e,t,n){if(!e)return!1;let{x:r,y:i,z:a}=t.position,o=n.x-r,s=n.y-i,c=n.z-a,l=Math.min(ex,Math.max(4,Math.round(Math.hypot(o,c)/$b)));for(let t=1;t<l;t++){let n=t/l;if(e(r+o*n,a+c*n)>i+s*n+Qb)return!0}return!1}function nx(e,t){if(e.length<2)return e;let n=[e[0]];for(let r=1;r<e.length;r++){let[i,a,o]=e[r-1],[s,c,l]=e[r],u=Math.hypot(s-i,l-o),d=Math.ceil(u/t);for(let e=1;e<d;e++){let t=e/d;n.push([i+(s-i)*t,a+(c-a)*t,o+(l-o)*t])}n.push(e[r])}return n}var rx=11740702,ix={T:`solid`,E:`dashed`,EE:`dotted`,EEA:`ferrata`},ax=`solid`,ox=.5,sx=8,cx=6,lx=1.2,ux=400,dx=6,fx=1.5,px=.02,mx=15909376,hx=3,gx=ox,_x=2e3,vx=400,yx=6e3,bx=18,xx=1.5,Sx=.006;function Cx(e,t,n,r,i,a,o){e.push(t,n+ox,r,i,a+ox,o)}function wx(e,t){for(let n=1;n<t.length;n++){let[r,i,a]=t[n-1],[o,s,c]=t[n];Cx(e,r,i,a,o,s,c)}}function Tx(e,t){let n=0;for(let r=1;r<t.length;r++){let[i,a,o]=t[r-1],[s,c,l]=t[r],u=s-i,d=l-o,f=Math.hypot(u,d);if(f===0)continue;let p=u/f,m=d/f,h=-m,g=p,_=cx-n;for(;_<f;){let t=_/f,n=i+u*t,r=a+(c-a)*t,s=o+d*t,l=lx;Cx(e,n-(p+h)*l,r,s-(m+g)*l,n+(p+h)*l,r,s+(m+g)*l),Cx(e,n-(p-h)*l,r,s-(m-g)*l,n+(p-h)*l,r,s+(m-g)*l),_+=cx}n=(n+f)%cx}}function Ex(e,t,n){let r=new kr;r.setAttribute(`position`,new G(e,3));let i=new Xi(r,t);return t.isLineDashedMaterial&&i.computeLineDistances(),i.name=n,i}var Dx=`http://www.w3.org/2000/svg`;function Ox(e){let t=document.createElementNS(Dx,`svg`);t.setAttribute(`viewBox`,`0 0 24 22`),t.setAttribute(`aria-hidden`,`true`);let n=document.createElementNS(Dx,`path`);n.setAttribute(`d`,`M12 3 L21.5 19 L2.5 19 Z`),t.append(n);let r=document.createElementNS(Dx,`text`);return r.setAttribute(`x`,`12`),r.setAttribute(`y`,`17.4`),r.textContent=String(e),t.append(r),t}function kx(e){let t=[e.segnavia,e.name].filter(e=>e&&String(e).trim());return e.ferrataScale&&t.push(`ferrata ${e.ferrataScale}`),t.join(` · `)}function Ax(e){let t=1/0,n=-1/0,r=1/0,i=-1/0;for(let a of e)for(let[e,,o]of a)e<t&&(t=e),e>n&&(n=e),o<r&&(r=o),o>i&&(i=o);return{x0:t,x1:n,z0:r,z1:i}}function jx(e,t,n){let r=Math.max(e.x0-t,0,t-e.x1),i=Math.max(e.z0-n,0,n-e.z1);return Math.hypot(r,i)}function Mx(e,t,n){let r=[],i=n;for(let n=1;n<e.length;n++){let[a,o,s]=e[n-1],[c,l,u]=e[n],d=Math.hypot(c-a,u-s);if(d===0)continue;let f=t-i;for(;f<d;){let e=f/d;r.push([a+(c-a)*e,o+(l-o)*e,s+(u-s)*e]),f+=t}i=(i+d)%t}return r}async function Nx(e=`./data`){let[t,n]=await Promise.all([fetch(`${e}/trails.json`).then(e=>e.json()),fetch(`${e}/ferrata.json`).then(e=>e.ok?e.json():null).catch(()=>null)]),r=n?.ferrata?.length?[...t.trails,...n.ferrata]:t.trails,i={solid:[],dashed:[],dotted:[],ferrata:[]},a=[],o=[];for(let e of r){let t=ix[e.difficulty]??ax;for(let n of e.lines){let r=nx(n,sx);if(wx(i[t],r),t===`ferrata`&&Tx(a,n),e.altaVia)for(let e=1;e<r.length;e++){let[t,n,i]=r[e-1],[a,s,c]=r[e];o.push(t,n+gx,i,a,s+gx,c)}}}let s=new Dn;s.name=`trails`;let c=[],l=null,u=null,d=null;if(o.length){u=new Float32Array(o);let e=new jb;e.setPositions(u),d=ny(new Mb({color:mx,linewidth:hx,transparent:!0,opacity:.85,depthWrite:!1,resolution:new V(window.innerWidth,window.innerHeight)})),l=new Zb(e,d),l.name=`trails-alta-via-casing`,l.renderOrder=-1,s.add(l)}let f=[];for(let e of r){let t=kx(e);if(!t)continue;let n=document.createElement(`div`);n.className=`trail-label`,n.textContent=t;let r=new kd(n);r.center.set(.5,1),r.visible=!1;let[i,a,o]=e.lines[0][0];r.position.set(i,a+dx,o),s.add(r),f.push({object:r,lines:e.lines,bounds:Ax(e.lines)})}let p=[];for(let e of r)if(e.altaVia)for(let t of e.lines)for(let[n,r,i]of Mx(t,_x,_x/2)){if(p.some(e=>Math.hypot(e.x-n,e.z-i)<vx))continue;let t=document.createElement(`div`);t.className=`av-badge`,t.title=`Alta Via ${e.altaVia}`,t.append(Ox(e.altaVia));let a=new kd(t);a.center.set(.5,1),a.visible=!1,a.position.set(n,r+bx,i),s.add(a),p.push({object:a,x:n,z:i,groundY:r})}if(i.solid.length&&c.push(Ex(i.solid,ry(new Ri({color:rx})),`trails-solid`)),i.dashed.length){let e=ry(new yo({color:rx,dashSize:30,gapSize:20}));c.push(Ex(i.dashed,e,`trails-dashed`))}if(i.dotted.length){let e=ry(new yo({color:rx,dashSize:4,gapSize:16}));c.push(Ex(i.dotted,e,`trails-dotted`))}if(i.ferrata.length){let e=ry(new Ri({color:rx}));c.push(Ex(i.ferrata,e,`trails-ferrata-line`)),c.push(Ex(a,e,`trails-ferrata-ticks`))}for(let e of c)s.add(e);let m=null;function h(e){m=e;for(let t of c){let n=t.geometry.getAttribute(`position`),r=n.array;for(let t=0;t<r.length;t+=3)r[t+1]=e(r[t],r[t+2])+ox;n.needsUpdate=!0,t.geometry.computeBoundingSphere(),t.material.isLineDashedMaterial&&t.computeLineDistances()}if(l){for(let t=0;t<u.length;t+=3)u[t+1]=e(u[t],u[t+2])+gx;l.geometry.attributes.instanceStart.data.needsUpdate=!0,l.geometry.computeBoundingSphere()}for(let t of p)t.groundY=e(t.x,t.z)}function g(e){let{x:t,y:n,z:r}=e.position;for(let i of f){if(jx(i.bounds,t,r)>ux){i.object.visible=!1;continue}let a=0,o=0,s=0,c=1/0;for(let e of i.lines)for(let[n,i,l]of e){let e=(n-t)*(n-t)+(l-r)*(l-r);e<c&&(c=e,a=n,o=i,s=l)}let l=m?m(a,s):o,u=Math.hypot(a-t,l-n,s-r);if(u>ux){i.object.visible=!1;continue}let d=Math.min(dx,Math.max(fx,u*px));i.object.position.set(a,l+d,s),i.object.visible=!tx(m,e,i.object.position)}for(let i of p){let a=Math.hypot(i.x-t,i.groundY-n,i.z-r);if(a>yx){i.object.visible=!1;continue}let o=Math.min(bx,Math.max(xx,a*Sx));i.object.position.set(i.x,i.groundY+o,i.z),i.object.visible=!tx(m,e,i.object.position)}}function _(e,t){d?.resolution.set(e,t)}return{group:s,manifest:t,ferrataManifest:n,alignToGround:h,updateLabels:g,setResolution:_}}var Px={peak:{color:16777215},hut:{color:12679743},pass:{color:11225020},waterfall:{color:2733814},lake:{color:2001125},trailhead:{color:6732650},village:{color:14734264}},Fx={peak:`Peak`,hut:`Mountain hut`,pass:`Pass`,waterfall:`Waterfall`,lake:`Lake`,trailhead:`Trailhead`,village:`Village`};function Ix(e){return e.category===`hut`&&e.hutKind===`shelter:basic_hut`?`Bivouac hut`:e.category===`village`&&e.placeKind===`hamlet`?`Hamlet`:Fx[e.category]??e.category}var Lx=12,Rx=1.5,zx=.02,Bx=1500,Vx=2;async function Hx(e=`./data`,{onSelect:t}={}){let n=await fetch(`${e}/poi.json`).then(e=>e.json()),r=new Map;for(let e of n.pois){let t=r.get(e.category);t||r.set(e.category,t=[]),t.push(e)}let i=new Dn;i.name=`poi`;let a=[],o=[];for(let[e,n]of r){let r=Px[e]??{color:16777215},s=new Float32Array(n.length*6);n.forEach((e,t)=>Ux(s,t,e.local.x,e.local.z,e.elevationM,Lx));let c=new kr,l=new hr(s,3);c.setAttribute(`position`,l);let u=new Xi(c,ry(new Ri({color:r.color,transparent:!0,opacity:.75})));u.name=`poi-${e}`,i.add(u),a.push(c),n.forEach((e,n)=>{let a=document.createElement(`div`);a.className=`poi-label`,a.style.setProperty(`--poi-color`,`#${r.color.toString(16).padStart(6,`0`)}`),a.textContent=e.name,a.addEventListener(`click`,n=>{n.stopPropagation(),t?.(e)});let s=new kd(a);s.center.set(.5,1),s.position.set(e.local.x,e.elevationM+Lx,e.local.z),i.add(s),o.push({poi:e,object:s,attr:l,index:n,groundY:e.elevationM})})}let s=null,c=null;function l(e){c=e}function u(e){s=e;for(let t of o)t.groundY=e(t.poi.local.x,t.poi.local.z);d(null)}function d(e){for(let t of o){let{poi:n,object:r,attr:i,index:a,groundY:o}=t,l=e?Math.hypot(n.local.x-e.position.x,o-e.position.y,n.local.z-e.position.z):1/0,u=Math.min(Lx,Math.max(Rx,l*zx));Ux(i.array,a,n.local.x,n.local.z,o,u,c?.(n)===!0),r.position.set(n.local.x,o+u,n.local.z),r.visible=e?l<=Bx&&!tx(s,e,r.position):!1}for(let e of a)e.getAttribute(`position`).needsUpdate=!0,e.computeBoundingSphere()}return{group:i,manifest:n,alignToGround:u,updateMarkers:d,searchEntries:n.pois.map(e=>({label:`${e.name} · ${Ix(e)}`,poi:e})),setBuildingProbe:l}}function Ux(e,t,n,r,i,a,o=!1){let s=i-Vx;e[t*6]=n,e[t*6+1]=s,e[t*6+2]=r,e[t*6+3]=n,e[t*6+4]=o?s:i+a,e[t*6+5]=r}function Wx(e){let t=Ix(e),n=`<div class="name">${e.name}</div><div>${t} · ${Math.round(e.elevationM)} m</div>`;return e.dataIncomplete&&(n+=`<div class="warning">⚠ incomplete elevation data in this area</div>`),n}function Gx(e,t=!1){let n=e[0].index!==null,r=new Set(Object.keys(e[0].attributes)),i=new Set(Object.keys(e[0].morphAttributes)),a={},o={},s=e[0].morphTargetsRelative,c=new kr,l=0;for(let u=0;u<e.length;++u){let d=e[u],f=0;if(n!==(d.index!==null))return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them.`),null;for(let e in d.attributes){if(!r.has(e))return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. All geometries must have compatible attributes; make sure "`+e+`" attribute exists among all geometries, or in none of them.`),null;a[e]===void 0&&(a[e]=[]),a[e].push(d.attributes[e]),f++}if(f!==r.size)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. Make sure all geometries have the same number of attributes.`),null;if(s!==d.morphTargetsRelative)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. .morphTargetsRelative must be consistent throughout all geometries.`),null;for(let e in d.morphAttributes){if(!i.has(e))return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`.  .morphAttributes must be consistent throughout all geometries.`),null;o[e]===void 0&&(o[e]=[]),o[e].push(d.morphAttributes[e])}if(t){let e;if(n)e=d.index.count;else if(d.attributes.position!==void 0)e=d.attributes.position.count;else return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. The geometry must have either an index or a position attribute`),null;c.addGroup(l,e,u),l+=e}}if(n){let t=0,n=[];for(let r=0;r<e.length;++r){let i=e[r].index;for(let e=0;e<i.count;++e)n.push(i.getX(e)+t);t+=e[r].attributes.position.count}c.setIndex(n)}for(let e in a){let t=Kx(a[e]);if(!t)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the `+e+` attribute.`),null;c.setAttribute(e,t)}for(let e in o){let t=o[e][0].length;if(t!==0){c.morphAttributes=c.morphAttributes||{},c.morphAttributes[e]=[];for(let n=0;n<t;++n){let t=[];for(let r=0;r<o[e].length;++r)t.push(o[e][r][n]);let r=Kx(t);if(!r)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the `+e+` morphAttribute.`),null;c.morphAttributes[e].push(r)}}}return c}function Kx(e){let t,n,r,i=-1,a=0;for(let o=0;o<e.length;++o){let s=e[o];if(t===void 0&&(t=s.array.constructor),t!==s.array.constructor)return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes.`),null;if(n===void 0&&(n=s.itemSize),n!==s.itemSize)return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes.`),null;if(r===void 0&&(r=s.normalized),r!==s.normalized)return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes.`),null;if(i===-1&&(i=s.gpuType),i!==s.gpuType)return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes.`),null;a+=s.count*n}let o=new t(a),s=new hr(o,n,r),c=0;for(let t=0;t<e.length;++t){let r=e[t];if(r.isInterleavedBufferAttribute){let e=c/n;for(let t=0,i=r.count;t<i;t++)for(let i=0;i<n;i++){let n=r.getComponent(t,i);s.setComponent(t+e,i,n)}}else o.set(r.array,c);c+=r.count*n}return i!==void 0&&(s.gpuType=i),s}var qx={value:0};function Jx(e){qx.value=+!!e}var Yx={stone:12762290,render:15590096,slate:7435900,wood:10584163,board:8612439,wallStone:11182742,shingle:7301991,timber:11705989,flagGreen:2528841,flagWhite:16777215,flagRed:16340044,orange:16153396,dark:5725025};function Xx(e,t){e.deleteAttribute(`uv`);let n=e.index?e.toNonIndexed():e,r=n.attributes.position.count,i=new Float32Array(r*3),a=new W(t);for(let e=0;e<r;e+=1)i[e*3]=a.r,i[e*3+1]=a.g,i[e*3+2]=a.b;return n.setAttribute(`color`,new hr(i,3)),n}function Zx(e,t,n,r,i,a){let o=new la(e,t,n);return o.translate(r,i,a),o}function Qx(e,t,n,r,i=0,a=.24){let o=e/2+i,s=t/2+i,c=r-n,l=s,u=Math.hypot(l,c),d=Math.atan2(c,l),f=[];for(let e of[1,-1]){let t=new la(o*2,a,u+a);t.rotateX(d),e===-1&&t.rotateY(Math.PI);let r=e*l/2,i=n+c/2;t.translate(0,i+Math.cos(d)*a/2,r+e*Math.sin(d)*a/2),f.push(t)}return f}function $x(e,t,n,r){let i=e/2,a=t/2,o=[],s=(...e)=>e.forEach(e=>o.push(...e));return s([-i,n,a],[-i,r,0],[-i,n,-a]),s([i,n,a],[i,n,-a],[i,r,0]),eS(o)}function eS(e){let t=new kr;return t.setAttribute(`position`,new hr(new Float32Array(e),3)),t.computeVertexNormals(),t}function tS(e,t,n,r,i,a=1){let o=new eo(e,t);return a===-1&&o.rotateY(Math.PI),o.translate(n,r,i+.04*a),o}function nS(e,t,n,r,i,a=1){let o=new eo(e,t);return o.rotateY(a*Math.PI/2),o.translate(n+.04*a,r,i),o}var rS={w:9.5,d:7,base:2.7,upper:2.5,rise:3.4};function iS(){let{w:e,d:t,base:n,upper:r,rise:i}=rS,a=n+r,o=a+i,s=[Xx(Zx(e,n,t,0,n/2,0),Yx.wallStone),Xx(Zx(e-.1,r,t-.1,0,n+r/2,0),Yx.board),Xx($x(e-.1,t-.1,a,o),Yx.board),Xx(Zx(e+.16,.26,t+.16,0,a-.13,0),Yx.timber),...Qx(e,t,a,o,.28).map(e=>Xx(e,Yx.shingle)),Xx(Zx(e+.56,.2,.12,0,a+.02,t/2+.28),Yx.timber),Xx(Zx(e+.56,.2,.12,0,a+.02,-(t/2+.28)),Yx.timber),Xx(Zx(.7,1.8,.7,e*.3,o-.5,0),Yx.stone),Xx(Zx(e+.5,.18,1.3,0,n+.1,t/2+.5),Yx.timber),Xx(Zx(e+.5,.85,.14,0,n+.62,t/2+1.1),Yx.timber),Xx(Zx(.16,n,.16,-(e/2-.3),n/2,t/2+1),Yx.timber),Xx(Zx(.16,n,.16,e/2-.3,n/2,t/2+1),Yx.timber),Xx(tS(1.05,2.1,0,1.05,t/2),Yx.dark)];for(let e of[-3.1,3.1])s.push(Xx(tS(.8,1.05,e,1.5,t/2),Yx.dark)),s.push(Xx(tS(.8,1.05,e,1.5,-t/2,-1),Yx.dark));for(let e of[-2.4,2.4])s.push(Xx(tS(.9,1,e,n+1.5,t/2),Yx.dark)),s.push(Xx(tS(.3,1,e-.62,n+1.5,t/2+.01),Yx.timber)),s.push(Xx(tS(.3,1,e+.62,n+1.5,t/2+.01),Yx.timber)),s.push(Xx(tS(.9,1,e,n+1.5,-t/2,-1),Yx.dark));for(let t of[1,-1])s.push(Xx(nS(.7,.8,t*(e-.1)/2,a+.85,0,t),Yx.dark));return s}function aS(){let{w:e,d:t,base:n,upper:r,rise:i}=rS,a=n+r,o=a+i;return[Xx(Zx(e,n,t,0,n/2,0),Yx.wallStone),Xx(Zx(e-.1,r,t-.1,0,n+r/2,0),Yx.board),Xx($x(e-.1,t-.1,a,o),Yx.board),Xx(Zx(e+.16,.26,t+.16,0,a-.13,0),Yx.timber),...Qx(e,t,a,o,.28).map(e=>Xx(e,Yx.shingle))]}var oS={len:3.6,w:2.6,wall:.75,r:1.3,plinth:.22};function sS(){let{len:e,w:t,wall:n,r,plinth:i}=oS,a=i+n,o=new fa(r,r,e,10,1,!0,0,Math.PI);o.rotateZ(Math.PI/2),o.rotateY(Math.PI/2),o.translate(0,a,0);let s=[Xx(Zx(t+.2,i,e+.2,0,i/2,0),Yx.stone),Xx(Zx(t,n,e,0,i+n/2,0),Yx.orange),Xx(o,Yx.orange)];for(let[t,n]of[[e/2,1],[-e/2,-1]]){let e=new da(r,10,0,Math.PI);n===-1&&e.rotateY(Math.PI),e.translate(0,a,t),s.push(Xx(e,Yx.orange))}return s.push(Xx(tS(.7,1.55,0,i+.8,e/2),Yx.dark)),s.push(Xx(tS(.34,.22,.62,i+1.25,e/2),Yx.render)),s}function cS(){let{len:e,w:t,wall:n,r,plinth:i}=oS,a=i+n,o=new fa(r,r,e,6,1,!0,0,Math.PI);o.rotateZ(Math.PI/2),o.rotateY(Math.PI/2),o.translate(0,a,0);let s=[Xx(Zx(t+.2,i,e+.2,0,i/2,0),Yx.stone),Xx(Zx(t,n,e,0,i+n/2,0),Yx.orange),Xx(o,Yx.orange)];for(let[t,n]of[[e/2,1],[-e/2,-1]]){let e=new da(r,6,0,Math.PI);n===-1&&e.rotateY(Math.PI),e.translate(0,a,t),s.push(Xx(e,Yx.orange))}return s}function lS(){let{len:e,w:t,plinth:n}=oS,r=sS(),i=t/2+.45,a=2.75;return r.push(Xx(Zx(.09,a-n,.09,i,n+(a-n)/2,e/2-.3),Yx.timber)),[Yx.flagGreen,Yx.flagWhite,Yx.flagRed].forEach((t,n)=>{r.push(Xx(tS(.36,.72,i+.18+n*.36,a-.42,e/2-.3),t))}),r}var uS={rifugio:iS,bivouac:sS},dS={rifugio:iS,bivouac:lS},fS={rifugio:aS,bivouac:cS},pS={rifugio:{w:10.2,d:10.2},bivouac:{w:3.1,d:4.1}},mS={alpine_hut:`rifugio`,wilderness_hut:`bivouac`,"shelter:basic_hut":`bivouac`},hS={alpine_hut:1,wilderness_hut:1.3,"shelter:basic_hut":1},gS=30;function _S(e,t,n,r,i,a){let o=Math.cos(a),s=Math.sin(a),c=1/0,l=-1/0;for(let[a,u]of[[-r/2,-i/2],[r/2,-i/2],[-r/2,i/2],[r/2,i/2]]){let r=e(t+a*o+u*s,n-a*s+u*o);Number.isFinite(r)&&(c=Math.min(c,r),l=Math.max(l,r))}return Number.isFinite(c)?{y:l,drop:l-c+.5}:{y:e(t,n)??0,drop:.5}}function vS(e,t,n){let r=(e(t+12,n)??0)-(e(t-12,n)??0),i=(e(t,n+12)??0)-(e(t,n-12)??0);return Math.abs(r)<.001&&Math.abs(i)<.001?0:Math.atan2(-r,-i)}function yS({pois:e,sampleHeight:t}){let n=new Dn;n.name=`huts`;let r=e.map(e=>{let n=mS[e.hutKind]??`bivouac`,r=hS[e.hutKind]??1,{x:i,z:a}=e.local,o=vS(t,i,a),s=pS[n],{y:c,drop:l}=_S(t,i,a,s.w*r,s.d*r,o);return{poi:e,kind:n,scale:r,x:i,z:a,y:c,yaw:o,drop:l}}),i=new go({vertexColors:!0,roughness:.85,metalness:0,flatShading:!0});ry(i);function a(e,t,r,a){let o=new ki(Gx(t[r]()),i,Math.max(a,1));return o.name=`huts-${e}`,o.instanceMatrix.setUsage(We),o.count=0,o.frustumCulled=!1,o.castShadow=!1,o.receiveShadow=!1,n.add(o),o}let o={rifugio:0,bivouac:0};for(let e of r)o[e.kind]+=1;let s={};for(let e of[`rifugio`,`bivouac`])s[e]={near:a(e,uS,e,o[e]),nearHi:dS[e]===uS[e]?null:a(`${e}-hi`,dS,e,o[e]),far:a(`${e}-far`,fS,e,o[e])};let c=new ki(Xx(new la(1,1,1).translate(0,-.5,0),Yx.stone),i,r.length);c.name=`huts-foundation`,c.instanceMatrix.setUsage(We),c.count=0,c.frustumCulled=!1,n.add(c);let l=new Qt,u=new kt,d=new H,f=new H,p=new H(0,1,0),m=new Set,h=1/0,g=1/0,_=[`near`,`nearHi`,`far`];function v(e){let t={rifugio:{near:0,nearHi:0,far:0},bivouac:{near:0,nearHi:0,far:0}},n=0;m.clear();let i=qx.value===1;for(let a of r){let r=Math.hypot(a.x-e.position.x,a.z-e.position.z),o=i&&s[a.kind].nearHi!==null,h=r>800?`far`:o?`nearHi`:`near`;if(u.setFromAxisAngle(p,a.yaw),d.set(a.x,a.y,a.z),f.setScalar(a.scale),l.compose(d,u,f),s[a.kind][h].setMatrixAt(t[a.kind][h],l),t[a.kind][h]+=1,h!==`far`){m.add(a.poi.id);let e=pS[a.kind];f.set(e.w*a.scale,a.drop,e.d*a.scale),l.compose(d,u,f),c.setMatrixAt(n,l),n+=1}}for(let e of[`rifugio`,`bivouac`])for(let n of _){let r=s[e][n];r&&(r.count=t[e][n],r.instanceMatrix.needsUpdate=!0)}c.count=n,c.instanceMatrix.needsUpdate=!0}let y=null;function b(e){y=e,!(Math.hypot(e.position.x-h,e.position.z-g)<gS)&&(h=e.position.x,g=e.position.z,v(e))}function x(){y&&v(y)}function S(e){for(let t of r){t.yaw=vS(e,t.x,t.z);let n=pS[t.kind],r=_S(e,t.x,t.z,n.w*t.scale,n.d*t.scale,t.yaw);t.y=r.y,t.drop=r.drop}y&&v(y)}return{group:n,update:b,applyDetail:x,alignToGround:S,hasBuilding:e=>m.has(e.id),placements:r,triangles:Object.fromEntries([[`rifugio`,s.rifugio.near],[`rifugioFar`,s.rifugio.far],[`bivouac`,s.bivouac.near],[`bivouacHi`,s.bivouac.nearHi],[`bivouacFar`,s.bivouac.far],[`foundation`,c]].filter(([,e])=>e).map(([e,t])=>[e,t.geometry.attributes.position.count/3]))}}var bS={iron:6513248,wood:9601129,bronze:15585958,stone:16777215,rock:11182742};function xS(e,t){e.deleteAttribute(`uv`);let n=e.index?e.toNonIndexed():e,r=n.attributes.position.count,i=new Float32Array(r*3),a=new W(t);for(let e=0;e<r;e+=1)i[e*3]=a.r,i[e*3+1]=a.g,i[e*3+2]=a.b;return n.setAttribute(`color`,new hr(i,3)),n}function SS(e,t,n,r,i,a){let o=new la(e,t,n);return o.translate(r,i,a),o}function CS(){let e=.14,t=[xS(SS(1.45,.34,1.45,0,.17,0),bS.stone),xS(SS(e,3.2,e,0,1.9500000000000002,0),bS.iron),xS(SS(1.55,e,e*.9,0,2.654,0),bS.iron)];for(let e of[-1,1]){let n=new la(.5,.07,.07);n.rotateZ(e*Math.PI/4),n.translate(e*.28,2.4539999999999997,0),t.push(xS(n,bS.iron))}return t}function wS(){return[xS(SS(1.15,.62,1.15,0,.31,0),bS.stone),xS(SS(.8,.26,.8,0,.75,0),bS.stone),xS(new fa(.21,.4,1.18,8).translate(0,1.47,0),bS.bronze),xS(new fa(.155,.3,.46,8).translate(0,2.19,0),bS.bronze),xS(new to(.135,8,6).translate(0,2.47,0),bS.bronze),xS(new to(.1,6,5).translate(0,1.62,.26),bS.bronze)]}var TS={cross:CS,madonna:wS},ES={cross:{w:1.7,d:1.7},madonna:{w:1.3,d:1.3}},DS=[{poiId:`n1562997760`,poiName:`Granta Parey`,kind:`cross`},{poiId:`n1707240539`,poiName:`Madonna`,kind:`madonna`},{lat:45.5246603,lon:7.1890672,poiName:`Croce (45.5247N, 7.1891E)`,kind:`cross`}],OS={Madonna:7};function kS({pois:e,sampleHeight:t}){let n=new Dn;n.name=`summit-monuments`;let r=new go({vertexColors:!0,roughness:.8,metalness:0,flatShading:!0});ry(r);let i=new Map(e.map(e=>[e.id,e])),a=[],o=[];for(let e of DS){let t=null;if(e.poiId){if(t=i.get(e.poiId),!t){o.push(`${e.poiName} (${e.poiId})`);continue}}else{let{x:n,z:r}=Iv(e.lat,e.lon);t={id:`${e.lat},${e.lon}`,name:e.poiName,local:{x:n,z:r},elevationM:null}}let s=new _i(Gx(TS[e.kind]()),r);s.name=`monument-${e.kind}-${e.poiId}`,s.castShadow=!1,s.receiveShadow=!1,n.add(s);let c=new _i(xS(new la(1,1,1).translate(0,-.5,0),bS.rock),r);c.name=`monument-base-${e.poiId??e.poiName}`,n.add(c),a.push({...e,poi:t,mesh:s,base:c})}o.length&&console.warn(`Summit monuments with no POI: ${o.join(`, `)}`);function s(e,t,n,r,i,a){let o=Math.cos(a),s=Math.sin(a),c=1/0,l=-1/0;for(let[a,u]of[[-r/2,-i/2],[r/2,-i/2],[-r/2,i/2],[r/2,i/2]]){let r=e(t+a*o+u*s,n-a*s+u*o);Number.isFinite(r)&&(c=Math.min(c,r),l=Math.max(l,r))}if(!Number.isFinite(l))return null;let u=c+(l-c)*.35;return{y:u,drop:u-c+.8}}function c(e,t,n,r){let i={x:t,z:n,h:e(t,n)??-1/0};for(let a=-r;a<=r;a+=2)for(let o=-r;o<=r;o+=2){if(o*o+a*a>r*r)continue;let s=e(t+o,n+a);Number.isFinite(s)&&s>i.h&&(i={x:t+o,z:n+a,h:s})}return i}function l(e){for(let t of a){let{x:n,z:r}=t.poi.local,i=OS[t.poiName];if(i){let a=c(e,n,r,i);t.movedM=Math.hypot(a.x-n,a.z-r),t.raisedM=a.h-(e(n,r)??a.h),n=a.x,r=a.z}let a=e(n,r);Number.isFinite(a)?t.mesh.position.set(n,a,r):Number.isFinite(t.poi.elevationM)?t.mesh.position.set(n,t.poi.elevationM,r):t.mesh.position.set(n,t.mesh.position.y,r);let o=(e(n+30,r)??0)-(e(n-30,r)??0),l=(e(n,r+30)??0)-(e(n,r-30)??0);t.mesh.rotation.y=Math.abs(o)<.001&&Math.abs(l)<.001?0:Math.atan2(-o,-l);let u=ES[t.kind],d=s(e,n,r,u.w,u.d,t.mesh.rotation.y);d&&(t.mesh.position.y=d.y,t.base.position.set(n,d.y,r),t.base.rotation.y=t.mesh.rotation.y,t.base.scale.set(u.w,d.drop,u.d),t.drop=d.drop),t.y=t.mesh.position.y}}l(t);function u(){n.visible=qx.value===1}return u(),{group:n,applyDetail:u,alignToGround:l,monuments:a,missing:o,triangles:Object.fromEntries(a.map(e=>[e.poiName,e.mesh.geometry.attributes.position.count/3]))}}var AS={value:0},jS=new W(867159),MS=new W(5220553),NS=new W(1858424),PS=new W(9425896),FS=new W(14677243),IS=8,LS=3,RS=3,zS=.8,BS=8,VS=4,HS=5,US=6,WS=`
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
`;function GS({deep:e,shallow:t,flowing:n}){return new mo({transparent:!0,side:2,uniforms:{uTime:AS,uColorDeep:{value:e},uColorShallow:{value:t},...Qv.uniforms},vertexShader:`
      #include <common>
      #include <logdepthbuf_pars_vertex>
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      varying vec2 vUv;
      void main() {
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        vNormal = normalize(normalMatrix * normal);
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        #include <logdepthbuf_vertex>
      }
    `,fragmentShader:`
      #include <logdepthbuf_pars_fragment>
      uniform float uTime;
      uniform vec3 uColorDeep;
      uniform vec3 uColorShallow;
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      varying vec2 vUv;
      ${WS}
      ${$v}
      uniform vec3 uAtmoFogColor; // not declared by ATMO_FOG_PARS itself - that's the built-in materials' job via three's own 'fogColor'; custom shaders declare it themselves (same as weather.js's cloud deck)
      void main() {
        ${n?`vec2 p = vec2(vUv.x * 8.0 - uTime * 1.6, vUv.y * 3.0);`:`vec2 p = vWorldPos.xz * 0.02 + vec2(uTime * 0.05, uTime * 0.03);`}
        float ripple = noise(p) * 0.5 + noise(p * 2.3 + 7.0) * 0.5;
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(dot(viewDir, normalize(vNormal)), 0.0), 3.0);
        vec3 color = mix(uColorDeep, uColorShallow, clamp(ripple * 0.5 + fresnel * 0.6, 0.0, 1.0));
        color = atmoApply(color, uAtmoFogColor, vWorldPos, cameraPosition);
        gl_FragColor = vec4(color, 0.72 + fresnel * 0.22);
        #include <logdepthbuf_fragment>
      }
    `})}function KS(){return new mo({transparent:!0,side:2,uniforms:{uTime:AS,uColor:{value:FS},...Qv.uniforms},vertexShader:`
      #include <common>
      #include <logdepthbuf_pars_vertex>
      attribute float aFlow;
      varying vec2 vUv;
      varying float vFlow;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vFlow = aFlow;
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        #include <logdepthbuf_vertex>
      }
    `,fragmentShader:`
      #include <logdepthbuf_pars_fragment>
      uniform float uTime;
      uniform vec3 uColor;
      varying vec2 vUv;
      varying float vFlow;
      varying vec3 vWorldPos;
      ${WS}
      ${$v}
      uniform vec3 uAtmoFogColor;
      void main() {
        float strand = noise(vec2(vUv.x * 14.0, vFlow * 0.06));
        float flow = fract(vFlow / ${US}.0 - uTime * 1.1 + strand * 0.55);
        float streak = smoothstep(0.0, 0.18, flow) * smoothstep(0.45, 0.18, flow);
        // Spray at the foot, and the thinning that makes the edges read as spray
        // rather than as a cut sheet of plastic.
        float foam = smoothstep(0.72, 1.0, vUv.y);
        float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
        float brightness = 0.72 + streak * 0.4 + foam * 0.3 + (1.0 - vUv.y) * 0.1;
        vec3 color = atmoApply(uColor * brightness, uAtmoFogColor, vWorldPos, cameraPosition);
        // Opaque down the strands, thinner between them and at the edges: the
        // old sheet was a flat 0.8 everywhere, which is why it read as one solid
        // object rather than as falling water.
        float alpha = clamp(0.5 + streak * 0.35 + foam * 0.25, 0.0, 1.0) * (0.3 + 0.7 * edge);
        gl_FragColor = vec4(color, alpha);
        #include <logdepthbuf_fragment>
      }
    `})}function qS(e){let t=e.slice(0,-1).map(([e,t])=>new V(e,t));if(t.length<3)return null;try{let e=Ya.triangulateShape(t,[]);return e.length?{pts:t,tris:e}:null}catch{return null}}function JS(e){let t=[],n=[],r=0,i=0;for(let a of e){let e=qS(a.ring);if(!e){i++;continue}for(let n of e.pts)t.push(n.x,a.waterLevelM,n.y);for(let[t,i,a]of e.tris)n.push(r+t,r+i,r+a);r+=e.pts.length}if(i&&console.warn(`water.js: skipped ${i}/${e.length} lake polygon(s) that failed to triangulate.`),!t.length)return null;let a=new kr;a.setAttribute(`position`,new G(t,3)),a.setIndex(n),a.computeVertexNormals();let o=new _i(a,GS({deep:jS,shallow:MS,flowing:!1}));return o.name=`water-lakes`,o}function YS(e,t,n,r,i,a,o){let s=e.length;if(s<2)return;let c=0,l=o.value;for(let o=0;o<s;o++){let[u,d,f]=e[o],p=e[Math.max(0,o-1)],m=e[Math.min(s-1,o+1)],h=m[0]-p[0],g=m[2]-p[2],_=Math.hypot(h,g)||1,v=-g/_,y=h/_,b=t(o/(s-1))/2;r.push(u+v*b,d+n,f+y*b),r.push(u-v*b,d+n,f-y*b);let x=o/(s-1);if(i.push(x,0,x,1),o>0&&(c+=Math.hypot(u-e[o-1][0],f-e[o-1][2])),o<s-1){let e=l+o*2,t=e+1,n=l+(o+1)*2,r=n+1;a.push(e,t,n,t,r,n)}}o.value+=s*2}var XS=10;function ZS(e,{widthM:t,heightOffsetM:n,name:r}){let i=[],a=[],o=[],s={value:0};for(let r of e??[])YS(nx(r.line,XS),()=>t,n,i,a,o,s);if(!i.length)return null;let c=new kr;c.setAttribute(`position`,new G(i,3)),c.setAttribute(`uv`,new G(a,2)),c.setIndex(o),c.computeVertexNormals();let l=new _i(c,GS({deep:NS,shallow:PS,flowing:!0}));return l.name=r,l}function QS(e,t,n,r,i,a,o,s){let c=e.length;if(c<2)return;let l=[0];for(let t=1;t<c;t++){let[n,,r]=e[t-1],[i,,a]=e[t];l.push(l[t-1]+Math.hypot(i-n,a-r))}let u=l[c-1]||1,d=s.value;for(let o=0;o<c;o++){let[s,d,f]=e[o],p=e[Math.max(0,o-1)],m=e[Math.min(c-1,o+1)],h=m[0]-p[0],g=m[2]-p[2],_=Math.hypot(h,g)||1,v=-g/_,y=h/_,b=Math.max(0,(p[1]-m[1])/_),x=Math.min(VS,b*HS),S=l[o]/u,C=(t+(n-t)*S)/2;for(let e=0;e<=BS;e++){let t=e/BS,n=t*2-1,c=1-n*n;r.push(s+v*n*C,d+x*c,f+y*n*C),i.push(t,S),a.push(l[o])}}for(let e=0;e<c-1;e++)for(let t=0;t<BS;t++){let n=d+e*9+t,r=n+1,i=n+9,a=i+1;o.push(n,i,r,r,i,a)}s.value+=c*9}function $S(e){let t=[],n=[],r=[],i=[],a={value:0},o=[],s=eC();for(let c of e){QS(c.centerline,c.widthTopM,c.widthBottomM,t,n,r,i,a);let e=c.centerline[c.centerline.length-1],l=new Yr(new Fr({map:s,transparent:!0,opacity:.55,depthWrite:!1,fog:!1}));l.position.set(e[0],e[1]+8,e[2]);let u=20+Math.min(60,c.dropM)*.6;l.scale.set(u,u,1),l.name=`mist-${c.name}`,o.push({sprite:l,baseScale:u,phase:Math.random()*Math.PI*2})}let c=new Dn;if(c.name=`waterfalls`,t.length){let e=new kr;e.setAttribute(`position`,new G(t,3)),e.setAttribute(`uv`,new G(n,2)),e.setAttribute(`aFlow`,new G(r,1)),e.setIndex(i),e.computeVertexNormals();let a=new _i(e,KS());a.name=`waterfall-ribbons`,c.add(a)}for(let{sprite:e}of o)c.add(e);return{group:c,mistSprites:o}}function eC(){let e=document.createElement(`canvas`);e.width=128,e.height=128;let t=e.getContext(`2d`),n=t.createRadialGradient(128/2,128/2,0,128/2,128/2,128/2);return n.addColorStop(0,`rgba(255,255,255,0.9)`),n.addColorStop(1,`rgba(255,255,255,0)`),t.fillStyle=n,t.fillRect(0,0,128,128),new aa(e)}async function tC(e=`./data`){let t=await fetch(`${e}/water.json`).then(e=>e.json()),n=new Dn;n.name=`water`;let r=JS(t.lakes);r&&n.add(r);let i=ZS(t.rivers,{widthM:IS,heightOffsetM:LS,name:`water-rivers`});i&&n.add(i);let a=ZS(t.streams,{widthM:RS,heightOffsetM:zS,name:`water-streams`});a&&n.add(a);let{group:o,mistSprites:s}=$S(t.waterfalls);n.add(o);function c(e){AS.value=e;for(let{sprite:t,baseScale:n,phase:r}of s){let i=n*(1+.12*Math.sin(e*.7+r));t.scale.set(i,i,1)}}function l(e){for(let t of n.children){let n=t.name===`water-rivers`?LS:t.name===`water-streams`?zS:null;if(n===null)continue;let r=t.geometry?.getAttribute(`position`);if(!r)continue;let i=r.array;for(let t=0;t<i.length;t+=3){let r=e(i[t],i[t+2]);Number.isFinite(r)&&(i[t+1]=r+n)}r.needsUpdate=!0,t.geometry.computeBoundingSphere()}}return{group:n,manifest:t,update:c,alignToGround:l}}var nC=16777215,rC=2,iC=.5,aC=8;async function oC(e=`./data`){let t=await fetch(`${e}/roads.json`).then(e=>e.json()),n=[];for(let e of t.roads){let t=nx(e.line,aC);for(let e=1;e<t.length;e++){let[r,i,a]=t[e-1],[o,s,c]=t[e];n.push(r,i+iC,a,o,s+iC,c)}}let r=new Float32Array(n),i=new jb;i.setPositions(r);let a=ny(new Mb({color:nC,linewidth:rC,resolution:new V(window.innerWidth,window.innerHeight)})),o=new Zb(i,a);o.name=`roads-track`;let s=new Dn;s.name=`roads`,s.add(o);function c(e){for(let t=0;t<r.length;t+=3)r[t+1]=e(r[t],r[t+2])+iC;i.attributes.instanceStart.data.needsUpdate=!0,i.computeBoundingSphere()}function l(e,t){a.resolution.set(e,t)}return{group:s,manifest:t,alignToGround:c,setResolution:l}}var sC=1e3,cC=.45,lC=440,uC=300,dC=1600,fC=2200,pC=.55,mC=.16,hC=.26,gC=1.5,_C=7112545,vC=.3,yC=.85;function bC(e){let t=e.toPrecision(12);return t.includes(`.`)||t.includes(`e`)?t:`${t}.0`}function xC(e,t,n){if(!e.includes(t))throw Error(`vegetation.js: shader marker not found: ${t}`);return e.replace(t,n)}function SC(e){let t=e>>>0;return()=>{t=t+1831565813>>>0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}var CC=null;function wC(){if(CC)return CC;let e=Math.round(sC/6),t=new Float32Array(e*e*2),n=SC(2654435769);for(let r=0;r<e;r++)for(let i=0;i<e;i++){let a=r*e+i;t[a*2]=(i+.5+(n()-.5)*2*cC)*6,t[a*2+1]=(r+.5+(n()-.5)*2*cC)*6}return CC={offsets:t,perSide:e},CC}function TC(e,t,n,r){let{offsets:i,perSide:a}=wC(),o=e=>(e%sC+sC)%sC,s=Math.floor(o(e)/6),c=Math.floor(o(t)/6),l=null,u=1/0;for(let o=-1;o<=1;o++)for(let d=-1;d<=1;d++){let f=((s+d)%a+a)%a,p=((c+o)%a+a)%a*a+f,m=i[p*2],h=i[p*2+1],g=m+Math.floor((n-m)/sC+.5)*sC,_=h+Math.floor((r-h)/sC+.5)*sC,v=(g-e)**2+(_-t)**2;v<u&&(u=v,l={x:g,z:_,index:p})}return{...l,distanceM:Math.sqrt(u)}}var EC=3,DC=7,OC=150,kC=8,AC=Math.ceil(Math.PI*158**2/6**2*1.2);function jC(){let e=[],t=new fa(.028,.052,1,5,1);t.translate(0,.5,0),e.push(t);let n=.12;for(let t=0;t<EC;t++){let r=t/EC,i=n+(1-n)*r,a=(1-n)/EC*1.85,o=new pa((1-r)*.98+.06,a,DC,1,!0);o.translate(0,i+a/2,0),e.push(o)}return e}function MC({manifest:e,heightTexture:t}){let{xmin:n,ymin:r,xmax:i,ymax:a}=e.bboxCrsUnits,{min:o,max:s}=e.elevationRangeM,{y:c}=e.resolutionMPerPx,l=i-n,u=a-r,{offsets:d,perSide:f}=wC(),p=f*f,m=new pa(1,1,7,1,!0);m.translate(0,.5,0);let h=new xi(d,2);function g(e,t,n){let r=new is;return r.index=e.index,r.setAttribute(`position`,e.attributes.position),r.setAttribute(`normal`,e.attributes.normal),r.setAttribute(`uv`,e.attributes.uv),r.setAttribute(`aOffset`,t),r.instanceCount=n,r}let _=new xi(new Float32Array(AC*2),2);_.setUsage(We);let v=g(m,h,p),y=g(Gx(jC()),_,0),b=new go({color:_C,roughness:.95,metalness:0,flatShading:!0}),x=`
    attribute vec2 aOffset;
    uniform sampler2D uHeightMap;
${Zv()}
    uniform sampler2D uForestMask;
    varying float vTreeTint;
    varying float vTreeSnow;
${Ay()}

    // MUST agree with terrain.js's terrainUv()/terrainElevation(). Kept separate
    // rather than shared because the two sample different uniforms; the tree
    // bases in tools/test-vegetation.mjs are compared against the terrain's own
    // sampler, so a disagreement here fails a test instead of going unnoticed.
    vec2 vegUv( vec2 wxz ) {
      return vec2( ( wxz.x + ${bC(l/2)} ) / ${bC(l)},
                   ( ${bC(u/2)} - wxz.y ) / ${bC(u)} );
    }
    // Takes UV for the texture and WORLD METRES for the tier, because the two are
    // addressed differently and passing only one of them is how a tree ends up
    // standing on a surface the terrain no longer draws.
    float vegElevation( vec2 uv, vec2 wxz ) {
      vec2 s = texture2D( uHeightMap, uv ).rg;
      return ( ( s.r * 256.0 + s.g ) / 257.0 ) * ${bC(s-o)} + ${bC(o)}
           + heightTierM( wxz );
    }
    // Hash without sin(): world coordinates reach +/-42 km here, and sin() of a
    // number that large loses enough float precision to produce visible
    // repetition. This one is stable over the whole bbox.
    float vegHash( vec2 p ) {
      vec3 p3 = fract( vec3( p.xyx ) * 0.1031 );
      p3 += dot( p3, p3.yzx + 33.33 );
      return fract( ( p3.x + p3.y ) * p3.z );
    }
  `,S=({wrapped:e})=>`
    ${e?`// Nearest copy of the window to the camera. The shift is an exact multiple
    // of WINDOW_M, so every tree sits on a fixed world lattice.
    vec2 slot = aOffset + floor( ( cameraPosition.xz - aOffset ) / ${bC(sC)} + 0.5 ) * ${bC(sC)};`:`vec2 slot = aOffset; // already the world position, written per refill by the CPU`}
    vec2 vegCell = floor( slot / ${bC(6)} );
    vec2 uv = vegUv( slot );

    float wood = texture2D( uForestMask, uv ).r;
    float draw = vegHash( vegCell );
    // Coverage as a probability: 40% canopy keeps 40% of slots, so margins thin
    // out. A threshold test would give hard edges at the mask's own resolution.
    //
    // STRICTLY GREATER, and the strictness is the whole point. This was
    // step( draw, wood ), which is wood >= draw - so a slot whose draw is
    // EXACTLY 0.0 grew a tree on ground with no canopy at all, anywhere in the
    // park. That is not a freak value: vegHash loses most of its range to float32
    // at world coordinates of tens of kilometres, and over the 16,997 slots inside
    // the draw radius above the Gliairetta it takes only 5,220 distinct values,
    // NINE of them exactly zero (tools/dev/probe-treeline.mjs). Nine conifers on a
    // glacier, which is how the user found it. Reversing the test costs nothing and
    // makes "no wood here" mean it: 0.0 > 0.0 is false.
    float exists = 1.0 - step( wood, draw );

    float dist = length( cameraPosition.xz - slot );
    float near = 1.0 - smoothstep( ${bC(uC)}, ${bC(lC)}, dist );
    ${e?`// The hole the fine mesh fills. uNearHole is 0 unless the high-detail option
    // is on, so with it off this multiplies by one and the standard mesh behaves
    // exactly as it did before the option existed. step(), not smoothstep():
    // whichever mesh owns a tree owns it completely, so no tree is ever drawn twice
    // and none is drawn at half height.
    near *= step( uNearHole, dist );`:`// Beyond the handover this mesh's trees belong to the standard one. The two
    // tests are exact complements of each other, so every tree is drawn once.
    near *= 1.0 - step( ${bC(OC)}, dist );`}

    float elev = vegElevation( uv, slot );
    float stunt = mix( 1.0, ${bC(pC)},
                       smoothstep( ${bC(dC)}, ${bC(fC)}, elev ) );
    float treeH = mix( ${bC(5)}, ${bC(16)}, vegHash( vegCell + 19.7 ) )
                * stunt * exists * near;
    float treeR = treeH * mix( ${bC(mC)}, ${bC(hC)}, vegHash( vegCell + 41.3 ) );
    vTreeTint = mix( 0.78, 1.18, vegHash( vegCell + 7.1 ) );

    // Snow load, from the very same snowCover() the ground under this tree uses
    // (src/snow.js). Sharing it is the whole point: a tree that decided for
    // itself would stand green on white ground somewhere along the snowline,
    // which is the fault this fixes, just moved.
    //
    // Aspect comes from two extra taps of the height texture, one texel north and
    // one south. Two, not four: the exact normal's z divides by the full gradient
    // length, and leaving the east-west slope out of that normalisation costs at
    // most ~5 m of effective elevation on ground gentle enough to grow trees (the
    // mask holds nothing above 45 deg) against a term that spans 320 m.
    float dv = ${bC(c)} / ${bC(u)};
    float gradZ = ( vegElevation( uv + vec2( 0.0, dv ), slot - vec2( 0.0, ${bC(c)} ) )
                  - vegElevation( uv - vec2( 0.0, dv ), slot + vec2( 0.0, ${bC(c)} ) ) )
                / ${bC(2*c)};
    float aspectZ = gradZ * inversesqrt( 1.0 + gradZ * gradZ );
    // No bare term: slope was baked out of the mask at build time, so there are
    // no trees on ground too steep to hold snow to begin with.
    // position.y runs 0 at the base to 1 at the apex (the cone is translated so
    // it does), which is the crown gradient for free.
    vTreeSnow = snowCover( slot, elev, aspectZ, 0.0 )
              * mix( ${bC(vC)}, ${bC(yC)}, position.y );

    // treeH = 0 collapses every vertex onto the base point, so a slot that has
    // no tree draws degenerate triangles and costs no fragments.
    vec3 transformed = vec3(
      position.x * treeR + slot.x,
      position.y * treeH + elev - ${bC(gC)},
      position.z * treeR + slot.y
    );
  `,C={value:0};function w(e){return n=>{n.uniforms.uHeightMap={value:t},n.uniforms.uHeightTier=Wv,n.uniforms.uHeightTierRect=Gv,n.uniforms.uHeightTierMix=Kv,n.uniforms.uForestMask=gy,n.uniforms.uSnow=wy,e&&(n.uniforms.uNearHole=C);let r=n.vertexShader;r=xC(r,`#include <common>`,`#include <common>\n${e?`uniform float uNearHole;
`:``}${x}`),r=xC(r,`#include <begin_vertex>`,S({wrapped:e})),n.vertexShader=r;let i=n.fragmentShader;i=xC(i,`#include <common>`,`#include <common>
varying float vTreeTint;
varying float vTreeSnow;`),i=xC(i,`#include <map_fragment>`,`#include <map_fragment>
  diffuseColor.rgb *= vTreeTint;
  diffuseColor.rgb = mix( diffuseColor.rgb, ${ky()}, vTreeSnow );`),n.fragmentShader=i}}b.onBeforeCompile=w(!0),b.customProgramCacheKey=()=>`pngp-veg-wrapped`,ry(b);let T=b.clone();T.onBeforeCompile=w(!1),T.customProgramCacheKey=()=>`pngp-veg-nearwindow`,ry(T);let E=new Dn;E.name=`vegetation-lod`;let D=new _i(v,b);D.name=`vegetation`;let O=new _i(y,T);O.name=`vegetation-high`;for(let e of[D,O])e.frustumCulled=!1,E.add(e);O.visible=!1;let k=y.index.count/3,A=1/0,ee=1/0,j=0,M=!1;function te(e,t,n){if(!Number.isFinite(e)||!Number.isFinite(t)||!n&&Math.hypot(e-A,t-ee)<kC)return;A=e,ee=t;let r=_.array,i=0;for(let n=0;n<p;n++){let a=d[n*2],o=d[n*2+1],s=a+Math.floor((e-a)/sC+.5)*sC,c=o+Math.floor((t-o)/sC+.5)*sC,l=s-e,u=c-t;if(!(l*l+u*u>24964)){if(i>=AC){M=!0;break}r[i*2]=s,r[i*2+1]=c,i++}}j=i,_.needsUpdate=!0,y.instanceCount=i}return{object:E,applyDetail(){let e=qx.value===1;C.value=e?OC:0,O.visible=e,D.visible=!0,A=1/0,ee=1/0},update(e){qx.value===1&&te(e.position.x,e.position.z,!1)},stats:{instances:p,trianglesPerTree:7,trianglesPerTreeHi:k,windowM:sC,spacingM:6,visibleM:lC,hiNearM:OC,hiCapacity:AC},nearInfo:()=>({count:j,capacity:AC,overflowed:M})}}var NC={value:null};function PC(){let e=new bi(new Uint8Array([0]),1,1,D,l);return e.needsUpdate=!0,e}NC.value=PC();function FC({manifest:e,texture:t}){let{width:n,height:r}=e.dimensions,{xmin:i,ymin:a,xmax:o,ymax:s}=e.bboxCrsUnits,c=o-i,l=s-a,u=document.createElement(`canvas`);u.width=n,u.height=r;let d=u.getContext(`2d`);if(!d)return()=>0;d.drawImage(t.image,0,0,n,r);let f=d.getImageData(0,0,n,r).data,p=new Uint8Array(n*r);for(let e=0;e<p.length;e++)p[e]=f[e*4];return function(e,t){let i=Math.floor((e+c/2)/c*n),a=Math.floor((t+l/2)/l*r);return i<0||i>=n||a<0||a>=r?0:p[a*n+i]/255}}async function IC(e=`./data`){let n=await fetch(`${e}/landcover.json`).then(e=>e.json()),r=await new Bo().loadAsync(`${e}/${n.mask.file.name}`);return r.colorSpace=``,r.wrapS=t,r.wrapT=t,r.magFilter=o,r.minFilter=o,r.generateMipmaps=!1,r.needsUpdate=!0,NC.value=r,{manifest:n,texture:r}}var LC={windowM:54,spacingM:.26,jitter:.45,visibleM:25,fadeStartM:15,seed:1374498683},RC={windowM:130,spacingM:1.1,jitter:.42,visibleM:60,fadeStartM:40,seed:795779357},zC={windowM:130,spacingM:20,jitter:.45,visibleM:60,fadeStartM:45,seed:2050080863},BC=.055,VC=.45,HC=.1,UC=.28,WC=1400,GC=2700,KC=.55,qC=.05,JC=.26,YC=.55,XC=1.6,ZC=.8,QC=1.9,$C=.6,ew=1.05,tw=53.9,nw=.12,rw=0,iw=1,aw=.62,ow=[.55,.78],sw=[.88,1.16,.72],cw=[1.02,1,.97],lw=9676906,uw=1,dw=1,fw=.9,pw=[.83,.56],mw=9,hw=1.7,gw=.075,_w=2.2,vw=.55,yw=1.45,bw=[-.55,.84],xw=23,Sw=.61,Cw=.45,ww={value:0},Tw={value:0},Ew={value:1};function X(e){let t=e.toPrecision(12);return t.includes(`.`)||t.includes(`e`)?t:`${t}.0`}function Dw(e,t,n){if(!e.includes(t))throw Error(`groundcover.js: shader marker not found: ${t}`);return e.replace(t,n)}function Ow(e){let t=e>>>0;return()=>{t=t+1831565813>>>0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}function kw({windowM:e,spacingM:t,jitter:n,seed:r}){let i=Math.round(e/t),a=e/i,o=i*i,s=new Float32Array(o*2),c=Ow(r);for(let e=0;e<i;e++)for(let t=0;t<i;t++){let r=e*i+t;s[r*2]=(t+.5+(c()-.5)*2*n)*a,s[r*2+1]=(e+.5+(c()-.5)*2*n)*a}for(let e=o-1;e>0;e--){let t=Math.floor(c()*(e+1));for(let n of[0,1]){let r=s[e*2+n];s[e*2+n]=s[t*2+n],s[t*2+n]=r}}return{offsets:s,perSide:i,count:o,pitchM:a}}function Aw(){let e=new Float32Array(72),t=new Float32Array(72);for(let n=0;n<8;n++){let r=n*2.39996,i=Math.cos(r),a=Math.sin(r),o=n*9;e[o+0]=-a*BC,e[o+1]=0,e[o+2]=i*BC,e[o+3]=a*BC,e[o+4]=0,e[o+5]=-i*BC,e[o+6]=0,e[o+7]=1,e[o+8]=0;for(let e=0;e<3;e++){let r=(n*3+e)*3;t[r]=e===2?i*VC:0,t[r+1]=e===2?a*VC:0,t[r+2]=n*1.7}}let n=new kr;return n.setAttribute(`position`,new hr(e,3)),n.setAttribute(`aBlade`,new hr(t,3)),n.setAttribute(`normal`,new hr(new Float32Array(e.length),3)),n}function jw(){let e=new $a(1,0),t=e.attributes.position,n=new Float32Array(t.count*3);for(let e=0;e<t.count;e++)n[e*3]=t.getX(e),n[e*3+1]=t.getY(e),n[e*3+2]=t.getZ(e);if(t.count!==24)throw Error(`stoneGeometry: ${t.count/3} triangles, STONE_TRIANGLES says 8`);let r=new kr;return r.setAttribute(`position`,new hr(n,3)),r.setAttribute(`aBlade`,new hr(new Float32Array(t.count*3),3)),r.setAttribute(`normal`,new hr(new Float32Array(n.length),3)),e.dispose(),r}function Mw(){let e=Ow(1527370047),t=t=>1+(e()-.5)*2*t,n=[],r=[];for(let i=0;i<6;i++){let a=(i+(e()-.5)*.55)/6*Math.PI*2,o=.46*t(.3);n.push([Math.cos(a)*o,.5+e()*.5,Math.sin(a)*o]);let s=(i+.5+(e()-.5)*.55)/6*Math.PI*2,c=t(.22);r.push([Math.cos(s)*c,(e()-.5)*.3,Math.sin(s)*c])}let i=Math.max(...n.map(e=>e[1]));for(let e of n)e[1]/=i;let a=[];for(let e=1;e<5;e++)a.push(n[0],n[e],n[e+1]);for(let e=0;e<6;e++){let t=(e+1)%6;a.push(n[e],n[t],r[e]),a.push(r[e],r[t],n[t])}let o=[0,-1,0];for(let e=0;e<6;e++)a.push(r[e],r[(e+1)%6],o);if(a.length!==66)throw Error(`boulderGeometry: ${a.length/3} triangles, BOULDER_TRIANGLES says 22`);let s=new Float32Array(a.length*3);for(let e=0;e<a.length;e++)s[e*3]=a[e][0],s[e*3+1]=a[e][1],s[e*3+2]=a[e][2];let c=new kr;return c.setAttribute(`position`,new hr(s,3)),c.setAttribute(`aBlade`,new hr(new Float32Array(a.length*3),3)),c.setAttribute(`normal`,new hr(new Float32Array(s.length),3)),c}function Nw({kind:e,layer:t,manifest:n,heightTexture:r}){let{xmin:i,ymin:a,xmax:o,ymax:s}=n.bboxCrsUnits,{min:c,max:l}=n.elevationRangeM,u=o-i,d=s-a,f=e===`grass`,p=e===`boulder`,{offsets:m,count:h,pitchM:g}=kw(t),_=f?Aw():p?Mw():jw(),v=new is;v.setAttribute(`position`,_.attributes.position),v.setAttribute(`normal`,_.attributes.normal),v.setAttribute(`aBlade`,_.attributes.aBlade),v.setAttribute(`aOffset`,new xi(m,2)),v.instanceCount=h;let y=new go({color:16777215,roughness:.94,metalness:0,flatShading:!0,side:2}),b=`
    attribute vec2 aOffset;
    attribute vec3 aBlade; // (leanX, leanZ, phase) - see tuftGeometry()
    uniform sampler2D uHeightMap;
    uniform sampler2D uCoverMask;
    uniform sampler2D uGlacierMask; // ice: nothing grows and nothing lies on it
${f?``:`    uniform sampler2D uForestMask; // scree only - see SCREE_FROM_BARE
`}    uniform float uGroundSegments;
${Zv()}
    uniform float uWind;
    uniform float uCoverTime;
    varying vec3 vCoverAlbedo;
    varying float vCoverSnow;
${Ay()}
${zy()}

    // MUST agree with terrain.js's terrainUv() and vegetation.js's vegUv(). Kept
    // separate rather than shared for the same reason vegetation.js keeps its
    // copy: the three sample different uniforms, and a disagreement here fails a
    // test (tools/test-groundcover.mjs compares a tuft's base against the
    // terrain's own sampler) instead of going unnoticed.
    vec2 coverUv( vec2 wxz ) {
      return vec2( ( wxz.x + ${X(u/2)} ) / ${X(u)},
                   ( ${X(d/2)} - wxz.y ) / ${X(d)} );
    }
    float coverElevation( vec2 uv ) {
      vec2 s = texture2D( uHeightMap, uv ).rg;
      return ( ( s.r * 256.0 + s.g ) / 257.0 ) * ${X(l-c)} + ${X(c)};
    }
    // The height of the surface the terrain DRAWS at a world point, plus its two
    // gradients, from four taps of the corner heights of the terrain's finest tile
    // cell. A transcription of heightfield.js's sampleRenderedHeightfield(),
    // including its choice of diagonal - f.x + f.y <= 1 - which is the one that
    // matches three's PlaneGeometry triangulation.
    //
    // grad.x is dh/dx. grad.y is (north - south) / cell, i.e. -dh/dz: +Z is South
    // (docs/ARCHITECTURE.md section 6), so the smaller-z corners are the northern
    // pair, and this is the sign convention snow.js's aspect term expects.
    // The ground at a point: the shipped grid plus the optional tier's correction.
    // One function, so no caller can take the base and forget the tier.
    float coverGround( vec2 wxz ) {
      return coverElevation( coverUv( wxz ) ) + heightTierM( wxz );
    }
    // THE CELL SIZE IS A UNIFORM, NOT A CONSTANT, because the tier raises the
    // terrain's finest LOD by one level inside its rectangle. Baking 4096 in here
    // would leave every tuft and stone reproducing a triangulation the terrain
    // stopped drawing, which puts them above the surface on convex cells - the
    // 2026-08-12 defect, re-earned.
    float drawnElevation( vec2 wxz, out vec2 grad ) {
      vec2 cell = vec2( ${X(u)}, ${X(d)} ) / uGroundSegments;
      vec2 g = ( wxz + vec2( ${X(u/2)}, ${X(d/2)} ) ) / cell;
      vec2 i = floor( g );
      vec2 f = g - i;
      vec2 c0 = i * cell - vec2( ${X(u/2)}, ${X(d/2)} );
      float h00 = coverGround( c0 );
      float h10 = coverGround( c0 + vec2( cell.x, 0.0 ) );
      float h01 = coverGround( c0 + vec2( 0.0, cell.y ) );
      float h11 = coverGround( c0 + cell );
      grad = vec2( ( ( h10 + h11 ) - ( h00 + h01 ) ) / ( 2.0 * cell.x ),
                   ( ( h00 + h10 ) - ( h01 + h11 ) ) / ( 2.0 * cell.y ) );
      float lower = h00 + f.x * ( h10 - h00 ) + f.y * ( h01 - h00 );
      float upper = h11 + ( 1.0 - f.x ) * ( h01 - h11 ) + ( 1.0 - f.y ) * ( h10 - h11 );
      return f.x + f.y <= 1.0 ? lower : upper;
    }

    // Hash without sin(): world coordinates reach +/-42 km here, and sin() of a
    // number that large loses enough float precision to produce visible
    // repetition. Same one vegetation.js uses.
    float coverHash( vec2 p ) {
      vec3 p3 = fract( vec3( p.xyx ) * 0.1031 );
      p3 += dot( p3, p3.yzx + 33.33 );
      return fract( ( p3.x + p3.y ) * p3.z );
    }
  `,x=`
    // Nearest copy of the window to the camera. The shift is an exact multiple of
    // the window, so every instance sits on a fixed world lattice and nothing
    // shimmers or reshuffles as you move.
    vec2 slot = aOffset + floor( ( cameraPosition.xz - aOffset ) / ${X(t.windowM)} + 0.5 ) * ${X(t.windowM)};
    // The cell index, not the position, seeds every per-instance draw: it is
    // stable under the wrap, so a tuft keeps its height and tint forever.
    vec2 coverCell = floor( slot / ${X(g)} );
    vec2 uv = coverUv( slot );

    float cover = texture2D( uCoverMask, uv ).r;
    // NOTHING GROWS AND NOTHING LIES ON A GLACIER. Added 2026-08-19 with the glacier mask,
    // and it closes a hole that had been covered by luck rather than by a rule: what kept
    // stones off the ice until now was snowCover() reading 1.0 on a glaciated summit, which
    // is true on the Gran Paradiso and NOT true on the Gliairetta tongue at 3,100 m under a
    // clear mid-morning sky - a shot taken the day the ice became a mask has scree cones
    // standing on the glacier. The landcover mask does not help either: it is derived from
    // the same imagery that sees a bright bare surface there.
    float onIce = texture2D( uGlacierMask, uv ).r;
    // The DRAWN height, not the texture's own: see drawnElevation() above. The four
    // corner taps also hand back both gradients, so the aspect below is free.
    vec2 coverGrad;
    float h = drawnElevation( slot, coverGrad );
    // THE TWO LAYERS PARTITION THE MASK rather than splitting half of it by a
    // model. Grass takes the vegetated fraction, whole - it used to get only
    // 1 - SHRUB_SHARE of it, and the dwarf shrub that had the rest was removed by
    // the user on 2026-08-13. Scree takes the complement, MINUS the canopy: "not
    // open vegetation" is not "bare", because under a wood the mask reads ~0 and
    // 1 - cover would cobble every forest floor in the park.
${f?`    float mine = cover * ( 1.0 - onIce );`:`    float wood = texture2D( uForestMask, uv ).r;
    // Not steeper than talus stands - see SCREE_SLOPE_FADE. coverGrad is already
    // in hand from drawnElevation(), so this is a length() and a smoothstep().
    float repose = 1.0 - smoothstep( ${X(ow[0])}, ${X(ow[1])},
                                     length( coverGrad ) );
    float mine = ( 1.0 - cover ) * ( 1.0 - wood ) * repose * ( 1.0 - onIce )
               * ${X(iw*aw)};`}

    // Coverage as a probability, exactly as the forest does it: 40% cover keeps
    // 40% of slots, so a margin thins out instead of ending on the mask's own
    // texel grid.
    //
    // And strictly greater for the same reason src/vegetation.js is - this file had
    // the identical defect, and a worse one to look at. step( hash, mine ) is
    // mine >= hash, so a cell whose hash is exactly 0.0 exists where mine is
    // exactly 0.0 - and mine carries the ( 1.0 - onIce ) factor, so that is a
    // blade of grass or a scree cone standing ON THE GLACIER. The ice was cleared of
    // stones once already, on 2026-08-19, by making both this shader and the CPU
    // edelweiss ask the ice mask; this is the leak that survived it.
    float exists = 1.0 - step( mine, coverHash( coverCell ) );

    float dist = length( cameraPosition.xz - slot );
    float near = 1.0 - smoothstep( ${X(t.fadeStartM)}, ${X(t.visibleM)}, dist );

    // The ground normal's z, exactly - not vegetation.js's z-only approximation,
    // because drawnElevation() already had to fetch the corners that give both
    // gradients. Negative faces north (snow.js's SNOW_ASPECT_M).
    float aspectZ = coverGrad.y * inversesqrt( 1.0 + dot( coverGrad, coverGrad ) );
    // Slope was baked out of the mask at build time, so there is nothing growing
    // on ground too steep to hold snow either - hence no bare term.
    float snow = snowCover( slot, h, aspectZ, 0.0 );

${f?`    float stunt = mix( 1.0, ${X(KC)},
                       smoothstep( ${X(WC)}, ${X(GC)}, h ) );
    float alive = exists * near;
    // Buried, not whitened - see GRASS_BURY.
    float height = mix( ${X(HC)}, ${X(UC)}, coverHash( coverCell + 13.1 ) )
                 * stunt * alive * ( 1.0 - snow * ${X(uw)} );
    // A blade's width is absolute rather than a fraction of its height - a tall
    // blade is not a wide one - but it MUST still collapse with the tuft. Writing
    // 1.0 here was a real bug and a quiet one: an empty slot kept its full 0.3 m
    // splay at height zero, so all 48,400 of them drew flat triangles 0.35 m under
    // the sampled surface. Buried, on flat ground. On a summit, where the drawn
    // terrain departs from the bilinear height by metres (tools/test-rendered-height.mjs),
    // they punched through and put 8% of the frame's pixels on a glacier where the
    // mask says nothing grows.
    float radius = alive;
    // A tuft already carries its own azimuth per blade (tuftGeometry's irrational
    // step), so there is nothing left to turn.
    mat2 yawM = mat2( 1.0, 0.0, 0.0, 1.0 );
    vCoverSnow = 0.0;
    vec3 tint = vec3( ${sw.map(X).join(`, `)} );
    float sway = ${X(gw)};`:`    // The two mineral layers run the same code on different constants: cobbles
    // are the scree, blocks are their own layer because they carry a richer
    // geometry and a layer draws one geometry for all of its instances.
    float height = mix( ${X(p?YC:qC)}, ${X(p?XC:JC)},
                        coverHash( coverCell + 13.1 ) )
                 * exists * near * ( 1.0 - snow * ${X(dw)} );
    // Cobbles are flattish - a stone that has come to rest has done so on its broad
    // face - and blocks are roughly as wide as they are tall. Applying the cobbles'
    // multiplier to the boulder range once gave a 2.1 m block a 4 m radius.
    float radius = height * mix( ${X(p?$C:ZC)}, ${X(p?ew:QC)},
                                 coverHash( coverCell + 29.7 ) );
    // Its own yaw - see STONE_YAW_SEED. Without this all 13,924 octahedra line
    // their facet edges up across the hillside, which is exactly how this shape
    // read as a field of identical tents when it was a shrub.
    float yaw = coverHash( coverCell + ${X(tw)} ) * ${X(Math.PI*2)};
    float cy = cos( yaw ), sy = sin( yaw );
    mat2 yawM = mat2( cy, sy, -sy, cy );
    vCoverSnow = snow * ${X(fw)};
    vec3 tint = vec3( ${cw.map(X).join(`, `)} );
    float sway = ${X(0)};`}

    // The ground's own colour, leaned towards leaf. basemapAlbedo() is the very
    // same function terrain.js colours the ground with, so a tuft cannot disagree
    // with what it stands on by more than the tint.
    vec3 photo = mix( ${(()=>{let e=new W(lw);return`vec3( ${X(e.r)}, ${X(e.g)}, ${X(e.b)} )`})()}, basemapAlbedo( uv, 0.0 ), uBasemapMix );
    vCoverAlbedo = photo * tint * mix( 0.82, 1.18, coverHash( coverCell + 7.1 ) );

    // Wind: a travelling wave across the world, so a gust CROSSES the field
    // instead of every tuft nodding in unison. Applied to the tips only -
    // position.y is 0 at the ground - which is what bending is.
${f?`    // Three per-tuft randomisations on top of it (2026-08-13, the user asked for
    // "un moto leggermente piu' randomico"), all seeded from the CELL so a tuft
    // keeps its character forever rather than shimmering frame to frame:
    //
    //   - a phase lag, so tufts on one wavefront no longer reach their extreme in
    //     the same instant. This is the one that removes the choreography.
    //   - a stiffness, so some tufts barely move in the same gust that lays
    //     others over.
    //   - a second, slower wave crossing at an angle. Its period is
    //     incommensurable with the first, so the sum never repeats exactly.
    //
    // Kept small on purpose. The travelling wave is what makes wind read as
    // weather rather than as jitter, and these break its lockstep without
    // replacing it.
    float lag = ( coverHash( coverCell + 3.3 ) - 0.5 ) * ${X(_w)};
    float gust = mix( ${X(vw)}, ${X(yw)}, coverHash( coverCell + 47.9 ) );
    float wave = sin( dot( slot, vec2( ${X(pw[0])}, ${X(pw[1])} ) ) * ${X(2*Math.PI/mw)}
                    - uCoverTime * ${X(hw*2*Math.PI)} + aBlade.z + lag );
    float cross = sin( dot( slot, vec2( ${X(bw[0])}, ${X(bw[1])} ) ) * ${X(2*Math.PI/xw)}
                     - uCoverTime * ${X(Sw*2*Math.PI)} + lag );
    vec2 bend = ( vec2( ${X(pw[0])}, ${X(pw[1])} ) * ( wave * 0.5 + 0.6 )
                + vec2( ${X(bw[0])}, ${X(bw[1])} ) * cross * ${X(Cw)} )
              * gust * uWind * sway * position.y;`:`    // Stone does not move: STONE_SWAY_M is a compile-time 0.0, so the whole term
    // folds away here and the scree program pays for none of it.
    float wave = sin( dot( slot, vec2( ${X(pw[0])}, ${X(pw[1])} ) ) * ${X(2*Math.PI/mw)}
                    - uCoverTime * ${X(hw*2*Math.PI)} + aBlade.z );
    vec2 bend = vec2( ${X(pw[0])}, ${X(pw[1])} ) * ( wave * 0.5 + 0.6 )
              * uWind * sway * position.y;`}

    // position.xz scaled by the radius and, for a stone, turned by the instance's
    // own yaw. The bend is NOT folded in here: the wind blows in a world direction
    // and does not care which way a tuft happens to face.
    vec2 local = yawM * position.xz * radius;

    // NO NORMAL IS COMPUTED HERE, and it used to be. Both layers are flat-shaded
    // again, so three takes the normal from screen-space derivatives and the
    // attribute is never read - which is also why the placement is back to a
    // single injection at begin_vertex rather than being split across
    // beginnormal_vertex to get radius and yaw defined early enough.
    //
    // What was here was an inverse-transpose correction for the non-uniform
    // diag(radius, height, radius) scale, needed by the 16-triangle smooth-shaded
    // cushion. Worth remembering if anything in this file is ever smooth-shaded
    // again: rotating a normal with its vertex under a non-uniform scale tilts it,
    // and for a diagonal scale the correction is just the reciprocals.

    // height = 0 collapses every vertex onto the base point, so a slot that holds
    // nothing draws degenerate triangles and costs no fragments at all.
    // Three separate scales, and keeping them separate is the point: the base
    // width is absolute (a taller blade is not a wider one), the lean is a
    // fraction of the height (a taller blade arcs further), and the sink is a
    // fraction of the height too.
    vec3 transformed = vec3(
      local.x + aBlade.x * height + slot.x + bend.x,
      position.y * height + h - height * ${X(f?nw:rw)},
      local.y + aBlade.y * height + slot.y + bend.y
    );
  `;y.onBeforeCompile=e=>{e.uniforms.uHeightMap={value:r},e.uniforms.uCoverMask=NC,e.uniforms.uGlacierMask=xy,f||(e.uniforms.uForestMask=gy),e.uniforms.uGroundSegments=qv,e.uniforms.uHeightTier=Wv,e.uniforms.uHeightTierRect=Gv,e.uniforms.uHeightTierMix=Kv,e.uniforms.uSnow=wy,e.uniforms.uWind=ww,e.uniforms.uCoverTime=Tw,e.uniforms.uBasemap=Ny,e.uniforms.uBasemapMix=Py,e.uniforms.uBasemapScale=Fy;let t=e.vertexShader;t=Dw(t,`#include <common>`,`#include <common>\n${b}`),t=Dw(t,`#include <begin_vertex>`,x),e.vertexShader=t;let n=e.fragmentShader;n=Dw(n,`#include <common>`,`#include <common>
varying vec3 vCoverAlbedo;
varying float vCoverSnow;`),n=Dw(n,`#include <map_fragment>`,`#include <map_fragment>
  diffuseColor.rgb *= vCoverAlbedo;
  diffuseColor.rgb = mix( diffuseColor.rgb, ${ky()}, vCoverSnow );`),e.fragmentShader=n},ry(y),y.customProgramCacheKey=()=>`pngp-groundcover-${e}`;let S=new _i(v,y);return S.name=`groundcover-${e}`,S.frustumCulled=!1,{kind:e,mesh:S,count:h,geometry:v,pitchM:g}}function Pw({manifest:e,heightTexture:t}){let n=new Dn;n.name=`groundcover`;let r=[Nw({kind:`grass`,layer:LC,manifest:e,heightTexture:t}),Nw({kind:`scree`,layer:RC,manifest:e,heightTexture:t}),Nw({kind:`boulder`,layer:zC,manifest:e,heightTexture:t})];for(let e of r)n.add(e.mesh);function i(){let e=Math.min(1,Math.max(0,Ew.value));for(let t of r)t.geometry.instanceCount=Math.round(t.count*e),t.mesh.visible=t.geometry.instanceCount>0}return i(),{object:n,applyDensity:i,layers:r,stats:{grass:{instances:r[0].count,trianglesPerInstance:8,windowM:LC.windowM,spacingM:r[0].pitchM,visibleM:LC.visibleM},scree:{instances:r[1].count,trianglesPerInstance:8,windowM:RC.windowM,spacingM:r[1].pitchM,visibleM:RC.visibleM},boulder:{instances:r[2].count,trianglesPerInstance:22,windowM:zC.windowM,spacingM:r[2].pitchM,visibleM:zC.visibleM},trianglesAtFullDensity:r[0].count*8+r[1].count*8+r[2].count*22}}}var Fw=2,Iw=.3,Lw=4,Rw=260,zw=6,Bw=44,Vw=-.35,Hw=.45,Uw=.026,Ww=.041,Gw=2.6,Kw=16250090,qw=14205532;function Jw(e,t){let n=(Math.imul(e|0,668265261)^Math.imul(t|0,374761393)^2654435769)>>>0;return()=>{n=n+1831565813>>>0;let e=Math.imul(n^n>>>15,1|n);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}var Yw=9,Xw=.17,Zw=7,Qw=6,$w=5,eT=9278064,tT=13617576;function nT(){let e=[],t=[],n=new W(Kw),r=new W(tT),i=new W(qw),a=new W(eT),o=(n,r,i,a,o,s)=>{e.push(...n,...r,...i),t.push(a.r,a.g,a.b,o.r,o.g,o.b,s.r,s.g,s.b)},s=(e,t,n,r,i,a,s,c)=>{o(e,t,n,i,a,s),o(e,n,r,i,s,c)},c=e=>({y:e*Gw,r:.085*(1-.45*e),lean:.16*e*e}),l=e=>{let{y:t,r:n,lean:r}=c(e),i=[];for(let e=0;e<Qw;e++){let a=e/Qw*Math.PI*2;i.push([Math.cos(a)*n+r,t,Math.sin(a)*n])}return i},u=[l(0),l(.5),l(1)];for(let e=0;e<u.length-1;e++)for(let t=0;t<Qw;t++){let n=(t+1)%Qw;s(u[e][t],u[e][n],u[e+1][n],u[e+1][t],a,a,a,a)}let d=c(1);for(let e=0;e<$w;e++){let t=e*2.39996,n=.18+e/$w*.55,{y:r,lean:i}=c(n),l=Math.cos(t),u=Math.sin(t),d=.55-n*.18,f=[l*.06+i,r,u*.06],p=.055,m=-u*p,h=l*p,g=[l*d*.55+i,r+d*.35,u*d*.55],_=[l*d+i,r+d*.3,u*d];s([f[0]+m,f[1],f[2]+h],[f[0]-m,f[1],f[2]-h],[g[0]-m*.8,g[1],g[2]-h*.8],[g[0]+m*.8,g[1],g[2]+h*.8],a,a,a,a),o([g[0]+m*.8,g[1],g[2]+h*.8],[g[0]-m*.8,g[1],g[2]-h*.8],_,a,a,a)}let f=[0,.35,.72,1],p=[.11,.17,.11,0],m=[.05,.11,.06,-.07];for(let e=0;e<Yw;e++){let t=(e+e%2*.12)/Yw*Math.PI*2,i=Math.cos(t),a=Math.sin(t),c=-a,l=i,u=e=>{let t=Xw+f[e]*(1-Xw);return{cx:i*t+d.lean,cy:d.y+m[e],cz:a*t,w:p[e]}},h=(e,t)=>{let n=u(e);return[n.cx+c*n.w*t,n.cy,n.cz+l*n.w*t]},g=e=>e===0?r:n;for(let e=0;e<2;e++)s(h(e,1),h(e,-1),h(e+1,-1),h(e+1,1),g(e),g(e),g(e+1),g(e+1));let _=u(3);o(h(2,1),h(2,-1),[_.cx,_.cy,_.cz],n,n,n)}let h=new Qa(1,0),g=h.attributes.position;for(let e=0;e<Zw;e++){let t=e===0,n=(e-1)/(Zw-1)*Math.PI*2+.4,r=t?0:.135,a=t?.085:.07,s=Math.cos(n)*r+d.lean,c=Math.sin(n)*r,l=d.y+(t?.115:.095);for(let e=0;e<g.count;e+=3){let t=t=>[g.getX(e+t)*a+s,g.getY(e+t)*a*.85+l,g.getZ(e+t)*a+c];o(t(0),t(1),t(2),i,i,i)}}h.dispose();let _=new kr;return _.setAttribute(`position`,new G(e,3)),_.setAttribute(`color`,new G(t,3)),_.computeVertexNormals(),_}function rT({sampleGroundHeight:e,coverAt:t,iceAt:n=()=>0}){let r=nT(),i=new go({vertexColors:!0,roughness:.95,metalness:0,flatShading:!0,side:2});ry(i);let a=new ki(r,i,Rw);a.name=`edelweiss`,a.count=0,a.frustumCulled=!1,a.instanceMatrix.setUsage(We);let o=new Map,s=new Set,c=new Qt,l=new kt,u=new H,d=new H,f=new H(0,1,0);function p(t,n){let r=e(t,n);if(!Number.isFinite(r))return null;let i=e(t+8,n)-e(t-8,n),a=e(t,n+8)-e(t,n-8),o=i/16,s=a/16,c=Math.hypot(o,s),l=1/Math.sqrt(c*c+1);return{elevM:r,slopeDeg:Math.atan(c)*180/Math.PI,normalZ:-s*l}}function m(r,i){let a=`${r}:${i}`;if(o.has(a))return o.get(a);let s=Jw(r,i),c=s(),l=(r+s())*320,u=(i+s())*320,d=s(),f=Lw+Math.floor(s()*8),m=null;if(c<.17){let r=p(l,u),i=t(l,u),o=n(l,u);if(r!==null&&r.elevM>=1850&&r.elevM<=2980&&o<.15&&i>=.04&&i<=.62&&r.slopeDeg>=zw&&r.slopeDeg<=Bw&&r.normalZ>=Vw){let t=[];for(let n=0;n<f;n++){let n=s()*Math.PI*2,r=Math.sqrt(s())*Iw*(.5+d*.5),i=l+Math.cos(n)*r,a=u+Math.sin(n)*r,o=e(i,a);if(!Number.isFinite(o))continue;let c=Uw+s()*(Ww-Uw);t.push({x:i,y:o,z:a,rosette:c,stem:c*Gw,yaw:s()*Math.PI*2,tiltX:(s()-.5)*.5,tiltZ:(s()-.5)*.5})}t.length&&(m={key:a,x:l,z:u,elevM:r.elevM,normalZ:r.normalZ,flowers:t})}}return o.set(a,m),m}let h={nearestM:null,nearestElevM:null,foundCount:0,justFound:!1,drawn:0,cellsTested:0};function g(e){let t=e.position.x,n=e.position.z,r=Math.floor(t/320),i=Math.floor(n/320),p=0,g=1/0,_=null;h.justFound=!1;for(let e=-2;e<=Fw;e++)for(let o=-2;o<=Fw;o++){let v=m(r+o,i+e);if(!v||My({elevM:v.elevM,aspectZ:v.normalZ,level:wy.value})>Hw)continue;let y=(v.x-t)**2+(v.z-n)**2;y<g&&(g=y,_=v),y<36&&!s.has(v.key)&&(s.add(v.key),h.foundCount=s.size,h.justFound=!0);for(let e of v.flowers){if(p>=Rw)break;d.set(e.x,e.y,e.z),l.setFromAxisAngle(f,e.yaw);let t=new kt().setFromEuler(new ln(e.tiltX,0,e.tiltZ));l.multiply(t),u.set(e.rosette,e.rosette,e.rosette),c.compose(d,l,u),a.setMatrixAt(p,c),p++}}a.count=p,p&&(a.instanceMatrix.needsUpdate=!0),h.drawn=p,h.cellsTested=o.size;let v=_?Math.sqrt(g):null;h.nearestM=v!==null&&v<=90?v:null,h.nearestElevM=h.nearestM===null?null:_.elevM}return{object:a,update:g,diag:h,patchFor:m,findNearestPatch(e,t,n=12){let r=null,i=1/0,a=Math.floor(e/320),o=Math.floor(t/320);for(let s=-n;s<=n;s++)for(let c=-n;c<=n;c++){let n=m(a+c,o+s);if(!n)continue;let l=(n.x-e)**2+(n.z-t)**2;l<i&&(i=l,r=n)}return r?{...r,distanceM:Math.sqrt(i)}:null}}}var iT=Math.PI*2,Z={ibex:9734522,horn:7498335,chamois:10584157,marmot:11837054,fox:13665351,squirrel:11894618,stocking:6511442,bib:16776416},aT=50,oT=1.5,sT=.42,cT=.2,lT=.04,uT=[{name:`ibex`,orientBaseM:1.5,reaction:`flee`,salt:433,cellM:600,presence:.5,herdMin:4,herdMax:9,spreadM:22,wanderM:14,speedMps:.65,fleeMul:2.2,alertM:45,grazeS:9,strideM:.9,turnRate:1.6,visibleM:480,fadeStartM:380,scaleMin:.9,scaleMax:1.15,capacity:64,habitat:{elevMin:2e3,elevMax:3400,slopeMin:18,slopeMax:58,canopyMax:.18}},{name:`chamois`,orientBaseM:1.2,reaction:`flee`,salt:706,cellM:500,presence:.45,herdMin:3,herdMax:7,spreadM:18,wanderM:12,speedMps:.8,fleeMul:2.6,alertM:55,grazeS:7,strideM:.75,turnRate:1.9,visibleM:430,fadeStartM:330,scaleMin:.85,scaleMax:1.05,capacity:56,habitat:{elevMin:1100,elevMax:2700,slopeMin:12,slopeMax:48,canopyMin:.02,canopyMax:.7}},{name:`marmot`,orientBaseM:.6,reaction:`flee`,salt:979,cellM:240,presence:.5,herdMin:2,herdMax:5,spreadM:9,wanderM:7,speedMps:1.1,fleeMul:3.2,alertM:25,grazeS:5,strideM:.32,turnRate:3.2,visibleM:230,fadeStartM:170,scaleMin:.85,scaleMax:1.1,capacity:64,habitat:{elevMin:1500,elevMax:2900,slopeMin:0,slopeMax:26,canopyMax:.28}},{name:`fox`,orientBaseM:1,salt:1252,reaction:`curious`,cellM:900,presence:.35,herdMin:1,herdMax:2,spreadM:30,wanderM:26,speedMps:1.1,grazeS:5,strideM:.7,turnRate:2.4,visibleM:380,fadeStartM:300,scaleMin:.9,scaleMax:1.1,capacity:24,curiousM:130,standoffM:7,boldChance:.55,approachMul:1.7,escapeMul:4.5,fleeMul:2.2,alertM:40,habitat:{elevMin:700,elevMax:2800,slopeMin:0,slopeMax:45,canopyMax:.9}},{name:`squirrel`,orientBaseM:.4,salt:1525,reaction:`hide`,cellM:120,presence:.45,herdMin:1,herdMax:2,spreadM:6,wanderM:5,speedMps:1.6,grazeS:3.5,strideM:.2,turnRate:6,visibleM:130,fadeStartM:95,scaleMin:.85,scaleMax:1.05,capacity:40,alertM:35,fleeMul:2.5,hideR:1.2,bailoutM:6,bailoutHopM:14,habitat:{elevMin:600,elevMax:2200,slopeMin:0,slopeMax:45,canopyMin:.9}}];function dT(e){let t=e.toPrecision(12);return t.includes(`.`)||t.includes(`e`)?t:`${t}.0`}function fT(e,t,n){if(!e.includes(t))throw Error(`wildlife.js: shader marker not found: ${t}`);return e.replace(t,n)}function pT(e){let t=e>>>0;return()=>{t=t+1831565813>>>0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}function mT(e,t,n){let r=Math.imul(e|0,668265261)^Math.imul(t|0,374761393)^Math.imul(n,2654435769);return r=Math.imul(r^r>>>15,625341585),pT(r^r>>>13)}function Q(e,t,{swing:n=0,pivotY:r=0}={}){e.deleteAttribute(`uv`);let i=e.attributes.position.count,a=new Float32Array(i*3),o=new Float32Array(i*2),s=new W(t);for(let e=0;e<i;e++)a[e*3]=s.r,a[e*3+1]=s.g,a[e*3+2]=s.b,o[e*2]=n,o[e*2+1]=r;return e.setAttribute(`color`,new hr(a,3)),e.setAttribute(`aLeg`,new hr(o,2)),e}function hT(e,t,n=7){let r=new ua(e,t,2,n);return r.rotateX(Math.PI/2),r}var gT=(e,t)=>[[+e,+t,1],[-e,-t,1],[-e,+t,-1],[+e,-t,-1]],_T={legR:.055,legLen:.55,spreadX:.17,spreadZ:.3,hipY:.6},vT={legR:.045,legLen:.46,spreadX:.13,spreadZ:.24,hipY:.48},yT={legR:.035,legLen:.16,spreadX:.1,spreadZ:.11,hipY:.18},bT={legR:.035,legLen:.34,spreadX:.09,spreadZ:.16,hipY:.36},xT={legR:.016,legLen:.07,spreadX:.04,spreadZ:.05,hipY:.09};function ST({legR:e,legLen:t,spreadX:n,spreadZ:r,hipY:i},a){return gT(n,r).map(([n,r,o])=>{let s=new fa(e,e*.6,t,5,1);return s.translate(n,i-t/2,r),Q(s,a,{swing:o,pivotY:i})})}function CT(e,t,n,r,i){let a=[],o=t,s=n;for(let t of r){let n=-t.angle*Math.PI/180,r=Math.cos(n),c=Math.sin(n),l=new fa(t.r1,t.r0,t.len,5,1);l.rotateX(n),l.translate(e,o+r*t.len/2,s+c*t.len/2),a.push(Q(l,i)),o+=r*t.len,s+=c*t.len}return a}function wT(){let e=_T,t=hT(.27,.9);t.translate(0,.62,0);let n=new ua(.13,.3,2,6);n.rotateX(-.8),n.translate(0,.82,.34);let r=hT(.1,.2,6);r.translate(0,1.02,.55);let i=[Q(t,Z.ibex),Q(n,Z.ibex),Q(r,Z.ibex),...ST(e,Z.ibex)],a=[{len:.2,angle:25,r0:.042,r1:.036},{len:.2,angle:60,r0:.036,r1:.028},{len:.18,angle:100,r0:.028,r1:.015}];return i.push(...CT(.06,1.12,.48,a,Z.horn)),i.push(...CT(-.06,1.12,.48,a,Z.horn)),i}function TT(){let e=vT,t=hT(.21,.7);t.translate(0,.5,0);let n=new ua(.1,.26,2,6);n.rotateX(-.6),n.translate(0,.66,.26);let r=hT(.085,.18,6);r.translate(0,.85,.42);let i=[Q(t,Z.chamois),Q(n,Z.chamois),Q(r,Z.chamois),...ST(e,Z.chamois)],a=[{len:.15,angle:8,r0:.022,r1:.018},{len:.09,angle:80,r0:.018,r1:.009}];return i.push(...CT(.045,.92,.38,a,Z.horn)),i.push(...CT(-.045,.92,.38,a,Z.horn)),i}function ET(){let e=yT,t=hT(.13,.24,6);t.translate(0,.2,0);let n=hT(.09,.08,6);return n.translate(0,.26,.22),[Q(t,Z.marmot),Q(n,Z.marmot),...ST(e,Z.marmot),...CT(0,.21,-.19,[{len:.2,angle:115,r0:.045,r1:.03}],Z.marmot)]}function DT(){let e=bT,t=hT(.14,.42);t.translate(0,.38,0);let n=new ua(.1,.14,2,6);n.rotateX(-1.05),n.translate(0,.4,.24);let r=hT(.075,.08,6);r.translate(0,.44,.34);let i=new fa(.018,.055,.12,5,1);i.rotateX(Math.PI/2),i.translate(0,.42,.45);let a=hT(.06,.1,6);a.translate(0,.34,.26);let o=[Q(t,Z.fox),Q(n,Z.fox),Q(r,Z.fox),Q(i,Z.fox),Q(a,Z.bib),...ST(e,Z.stocking)];for(let e of[.055,-.055]){let t=new pa(.035,.09,4,1);t.translate(e,.51,.32),o.push(Q(t,Z.stocking))}return o.push(...CT(0,.36,-.22,[{len:.22,angle:95,r0:.075,r1:.07},{len:.18,angle:110,r0:.07,r1:.05}],Z.fox)),o.push(...CT(0,.28,-.6,[{len:.08,angle:110,r0:.05,r1:.03}],Z.bib)),o}function OT(){let e=xT,t=hT(.055,.11,6);t.translate(0,.1,0);let n=hT(.045,.03,6);n.translate(0,.145,.09);let r=[Q(t,Z.squirrel),Q(n,Z.squirrel),...ST(e,Z.squirrel)];for(let e of[.025,-.025]){let t=new pa(.012,.045,4,1);t.translate(e,.185,.075),r.push(Q(t,Z.squirrel))}return r.push(...CT(0,.11,-.07,[{len:.08,angle:100,r0:.03,r1:.035},{len:.08,angle:55,r0:.035,r1:.035},{len:.07,angle:12,r0:.035,r1:.022}],Z.squirrel)),r}var kT={ibex:wT,chamois:TT,marmot:ET,fox:DT,squirrel:OT};function AT(e,t){let{legR:n,legLen:r,spreadX:i,spreadZ:a,hipY:o}=e;return gT(i,a).map(([e,i,a])=>{let s=new fa(n*2.1,n*1.15,r*.46,6,1);return s.scale(.85,1,1),s.translate(e,o-r*.2,i),Q(s,t,{swing:a,pivotY:o})})}function jT(e,t){let{legR:n,legLen:r,spreadX:i,spreadZ:a,hipY:o}=e;return gT(i,a).map(([e,i,a])=>{let s=new fa(n*.62,n*.78,.07,6,1);return s.translate(e,o-r-.02,i),Q(s,t,{swing:a,pivotY:o})})}function MT(e,t,n,r,i,{tilt:a=.5,sweep:o=.7}={}){let s=new pa(r*.42,r,5,1);return s.scale(1,1,.45),s.rotateX(o),s.rotateZ(e>0?-a:a),s.translate(e,t,n),Q(s,i)}function NT(e,t,n,r,i,a){let o=CT(e,t,n,r,i),s=t,c=n;return r.forEach((t,n)=>{let r=-t.angle*Math.PI/180,l=Math.cos(r),u=Math.sin(r),d=a[n]??0;for(let n=0;n<d;n++){let a=(n+.6)/(d+.2),f=t.r0+(t.r1-t.r0)*a,p=new no(f*.94,f*.3,4,8);p.rotateX(Math.PI/2+r),p.translate(e,s+l*t.len*a,c+u*t.len*a),o.push(Q(p,i))}s+=l*t.len,c+=u*t.len}),o}var PT=[{len:.2,angle:25,r0:.042,r1:.036},{len:.2,angle:60,r0:.036,r1:.028},{len:.18,angle:100,r0:.028,r1:.015}];function FT(){let e=_T,t=hT(.27,.9);t.scale(.76,1,1),t.translate(0,.62,0);let n=hT(.15,.34,7);n.scale(.8,1,1),n.translate(0,.5,.3);let r=new ua(.13,.3,2,6);r.rotateX(-.8),r.translate(0,.82,.34);let i=hT(.1,.2,6);i.translate(0,1.02,.55);let a=new fa(.055,.082,.12,6,1);a.rotateX(Math.PI/2),a.translate(0,1,.68);let o=[Q(t,Z.ibex),Q(n,Z.ibex),Q(r,Z.ibex),Q(i,Z.ibex),Q(a,Z.ibex),...ST(e,Z.ibex),...AT(e,Z.ibex),...jT(e,Z.horn),MT(.075,1.06,.44,.13,Z.ibex),MT(-.075,1.06,.44,.13,Z.ibex)];o.push(...CT(0,.96,.6,[{len:.13,angle:172,r0:.035,r1:.02}],Z.horn)),o.push(...CT(0,.66,-.44,[{len:.1,angle:120,r0:.035,r1:.028},{len:.07,angle:165,r0:.028,r1:.015}],Z.horn));let s=[4,4,3];return o.push(...NT(.06,1.12,.48,PT,Z.horn,s)),o.push(...NT(-.06,1.12,.48,PT,Z.horn,s)),o}function IT(){let e=vT,t=hT(.21,.7);t.scale(.78,1,1),t.translate(0,.5,0);let n=hT(.12,.26,7);n.scale(.82,1,1),n.translate(0,.4,.24);let r=new ua(.1,.26,2,6);r.rotateX(-.6),r.translate(0,.66,.26);let i=hT(.085,.18,6);i.translate(0,.85,.42);let a=new fa(.042,.062,.1,6,1);a.rotateX(Math.PI/2),a.translate(0,.83,.54);let o=[Q(t,Z.chamois),Q(n,Z.chamois),Q(r,Z.chamois),Q(i,Z.chamois),Q(a,Z.chamois),...ST(e,Z.chamois),...AT(e,Z.chamois),...jT(e,Z.horn),MT(.062,.89,.34,.15,Z.chamois,{sweep:.45}),MT(-.062,.89,.34,.15,Z.chamois,{sweep:.45})];for(let e of[.055,-.055]){let t=new la(.022,.075,.16);t.translate(e,.865,.47),o.push(Q(t,Z.stocking))}o.push(...CT(0,.56,-.34,[{len:.09,angle:140,r0:.03,r1:.018}],Z.stocking));let s=[{len:.15,angle:8,r0:.022,r1:.018},{len:.09,angle:80,r0:.018,r1:.009}];return o.push(...NT(.045,.92,.38,s,Z.horn,[3,0])),o.push(...NT(-.045,.92,.38,s,Z.horn,[3,0])),o}function LT(){let e=bT,t=hT(.14,.42);t.scale(.86,1,1),t.translate(0,.38,0);let n=new ua(.1,.14,2,6);n.rotateX(-1.05),n.translate(0,.4,.24);let r=hT(.075,.08,6);r.translate(0,.44,.34);let i=new fa(.018,.055,.12,5,1);i.rotateX(Math.PI/2),i.translate(0,.42,.45);let a=hT(.06,.1,6);a.translate(0,.34,.26);let o=hT(.085,.05,7);o.scale(1.15,.9,1),o.translate(0,.43,.3);let s=[Q(t,Z.fox),Q(n,Z.fox),Q(o,Z.fox),Q(r,Z.fox),Q(i,Z.fox),Q(a,Z.bib),...ST(e,Z.stocking),...AT(e,Z.fox),...jT(e,Z.stocking)];for(let e of[.052,-.052]){let t=new pa(.042,.105,5,1);t.scale(1,1,.5),t.rotateX(.22),t.rotateZ(e>0?-.3:.3),t.translate(e,.52,.31),s.push(Q(t,Z.fox));let n=new pa(.022,.04,5,1);n.scale(1,1,.5),n.rotateX(.22),n.rotateZ(e>0?-.3:.3),n.translate(e,.575,.315),s.push(Q(n,Z.stocking))}return s.push(...CT(0,.37,-.22,[{len:.18,angle:92,r0:.078,r1:.078},{len:.15,angle:99,r0:.078,r1:.062},{len:.12,angle:106,r0:.062,r1:.044}],Z.fox)),s.push(...CT(0,.3,-.66,[{len:.08,angle:108,r0:.044,r1:.024}],Z.bib)),s}function RT(){let e=yT,t=hT(.13,.24,6);t.translate(0,.2,0);let n=hT(.09,.08,6);n.translate(0,.26,.22);let r=new fa(.042,.07,.06,6,1);r.rotateX(Math.PI/2),r.translate(0,.242,.265);let i=[Q(t,Z.marmot),Q(n,Z.marmot),Q(r,Z.marmot),...ST(e,Z.marmot),...AT(e,Z.marmot),MT(.07,.31,.19,.055,Z.marmot,{tilt:.9,sweep:.2}),MT(-.07,.31,.19,.055,Z.marmot,{tilt:.9,sweep:.2})];return i.push(...CT(0,.21,-.19,[{len:.12,angle:128,r0:.045,r1:.036},{len:.09,angle:152,r0:.036,r1:.022}],Z.marmot)),i}function zT(){let e=xT,t=hT(.055,.11,6);t.translate(0,.1,0);let n=hT(.045,.03,6);n.translate(0,.145,.09);let r=new fa(.022,.036,.035,5,1);r.rotateX(Math.PI/2),r.translate(0,.138,.125);let i=[Q(t,Z.squirrel),Q(n,Z.squirrel),Q(r,Z.squirrel),...ST(e,Z.squirrel)];for(let e of[.025,-.025]){let t=new pa(.012,.05,4,1);t.translate(e,.187,.075),i.push(Q(t,Z.squirrel))}return i.push(...CT(0,.11,-.07,[{len:.07,angle:100,r0:.032,r1:.042},{len:.07,angle:62,r0:.042,r1:.046},{len:.06,angle:28,r0:.046,r1:.04},{len:.05,angle:5,r0:.04,r1:.022}],Z.squirrel)),i}var BT={ibex:FT,chamois:IT,marmot:RT,fox:LT,squirrel:zT},VT=48;function HT(e,{hi:t=!1}={}){let n=Gx((t?BT:kT)[e.name]());n.setAttribute(`aSwing`,new xi(new Float32Array(e.capacity),1));let r=new go({vertexColors:!0,roughness:.92,metalness:0,flatShading:!0});r.onBeforeCompile=e=>{let t=e.vertexShader;t=fT(t,`#include <common>`,`#include <common>
  attribute vec2 aLeg;
  attribute float aSwing;`),t=fT(t,`#include <begin_vertex>`,`
      float legAngle = aLeg.x * aSwing * ${dT(sT)};
      float legDy = position.y - aLeg.y;
      vec3 transformed = vec3(
        position.x,
        aLeg.y + legDy * cos( legAngle ),
        position.z + legDy * sin( legAngle )
      );
    `),e.vertexShader=t},ry(r);let i=new ki(n,r,e.capacity);return i.name=`wildlife-${e.name}`,i.instanceMatrix.setUsage(We),i.count=0,i.frustumCulled=!1,i.castShadow=!1,i.receiveShadow=!1,i}function UT({sampleGroundHeight:e,canopyAt:t,onAlarm:n=null}){let r=new Dn;r.name=`wildlife`;let i=uT.map(e=>{let t=HT(e),n=HT(e,{hi:!0});n.geometry.computeBoundingBox();let r=n.geometry.boundingBox;return{spec:e,mesh:t,meshHi:n,heightM:r.max.y-r.min.y,herds:new Map}});for(let e of i)r.add(e.mesh),r.add(e.meshHi);let a=new Qt,o=new Qt,s=new H,c=new kt,l=new H,u=new H,d=new H,f=new H;function p(t,n){let r=e(t+12,n)-e(t-12,n),i=e(t,n+12)-e(t,n-12),a=Math.hypot(r,i)/24;return Math.atan(a)*180/Math.PI}function m(n,r,i){let a=n.habitat,o=e(r,i);if(!Number.isFinite(o)||o<a.elevMin||o>a.elevMax)return!1;let s=t(r,i);if(a.canopyMax!=null&&s>a.canopyMax||a.canopyMin!=null&&s<a.canopyMin)return!1;let c=p(r,i);return c>=a.slopeMin&&c<=a.slopeMax}function h(e,t,n){let r=mT(t,n,e.salt);if(r()>e.presence)return null;let i=(t+r())*e.cellM,a=(n+r())*e.cellM;if(!m(e,i,a))return null;let o=e.herdMin+Math.floor(r()*(e.herdMax-e.herdMin+1)),s=[];for(let c=0;c<o;c++){let o=r()*iT,l=Math.sqrt(r())*e.spreadM,u=i+Math.cos(o)*l,d=a+Math.sin(o)*l;s.push({id:`${e.name}:${t}:${n}:${c}`,x:u,z:d,homeX:u,homeZ:d,heading:r()*iT,targetX:u,targetZ:d,walking:!1,timer:r()*e.grazeS,phase:r()*iT,swing:0,gradX:0,gradZ:0,oriented:!1,bold:e.boldChance!=null&&r()<e.boldChance,watching:!1,scale:e.scaleMin+r()*(e.scaleMax-e.scaleMin)})}return{animals:s,rnd:r,siteX:i,siteZ:a}}function g(e,t,n){let r=((t-e+Math.PI)%iT+iT)%iT-Math.PI;return r>n?r=n:r<-n&&(r=-n),e+r}function _(e,n,r,i){let a=Math.atan2(e.x-n,e.z-r),o=Math.hypot(e.x-n,e.z-r),s=null;for(let c of[0,.5,-.5,1,-1]){let l=a+c,u=e.x+Math.sin(l)*i.bailoutHopM,d=e.z+Math.cos(l)*i.bailoutHopM;if(t(u,d)<i.habitat.canopyMin)continue;let f=TC(u,d,n,r),p=Math.hypot(f.x-n,f.z-r)-o;p>i.bailoutHopM*.4&&(!s||p>s.gain)&&(s={...f,gain:p})}return s}function v(e,t,r,i,a){let o=t.x-r,s=t.z-i,c=a>.001?1/a:0;if(t.watching=!1,e.reaction===`flee`&&(!t.alarmed&&a<e.alertM?(t.alarmed=!0,n?.({species:e.name,x:t.x,z:t.z,distanceM:a})):t.alarmed&&a>e.alertM*1.4&&(t.alarmed=!1)),e.reaction===`curious`&&t.bold&&a<e.curiousM)return a<e.standoffM*.85?(t.targetX=r+o*c*e.standoffM*1.3,t.targetZ=i+s*c*e.standoffM*1.3,t.walking=!0,e.escapeMul):a>e.standoffM*1.15?(t.targetX=r+o*c*e.standoffM,t.targetZ=i+s*c*e.standoffM,t.walking=!0,e.approachMul):(t.walking=!1,t.swing=0,t.watching=!0,1);if(e.reaction===`hide`&&a<e.alertM){let n=TC(t.homeX,t.homeZ,r,i);if(Math.hypot(n.x-r,n.z-i)<e.bailoutM){let a=_(n,r,i,e);a&&(t.homeX=a.x,t.homeZ=a.z,n=a)}let a=Math.hypot(n.x-r,n.z-i)||1;return t.targetX=n.x+(n.x-r)/a*e.hideR,t.targetZ=n.z+(n.z-i)/a*e.hideR,t.walking=!0,e.fleeMul}return a<e.alertM?(t.targetX=r+o*c*(e.alertM*1.8),t.targetZ=i+s*c*(e.alertM*1.8),t.walking=!0,e.fleeMul):1}function y(e,t,n,r,i,a){let o=v(e,n,i,a,Math.hypot(n.x-i,n.z-a));if(!n.walking){if(n.timer-=r,n.swing=0,n.watching){n.heading=g(n.heading,Math.atan2(i-n.x,a-n.z),e.turnRate*r);return}if(n.timer<=0){let r=t.rnd()*iT,i=e.wanderM*(.3+.7*t.rnd());n.targetX=n.homeX+Math.cos(r)*i,n.targetZ=n.homeZ+Math.sin(r)*i,n.walking=!0}return}let s=n.targetX-n.x,c=n.targetZ-n.z,l=Math.hypot(s,c);if(l<Math.min(.4,e.hideR?e.hideR*.25:.4)){n.walking=!1,n.swing=0,n.timer=e.grazeS*(.5+t.rnd());return}let u=e.speedMps*o,d=Math.min(l,u*r);n.x+=s/l*d,n.z+=c/l*d,n.heading=g(n.heading,Math.atan2(s,c),e.turnRate*r),n.phase+=d/e.strideM*iT,n.swing=Math.sin(n.phase)}function b(e){for(let t of i){let{spec:n,herds:r}=t,i=n.visibleM+n.cellM,a=Math.ceil(i/n.cellM),o=Math.floor(e.position.x/n.cellM),s=Math.floor(e.position.z/n.cellM),c=new Set;for(let t=s-a;t<=s+a;t++)for(let s=o-a;s<=o+a;s++){let a=(s+.5)*n.cellM-e.position.x,o=(t+.5)*n.cellM-e.position.z;if(Math.hypot(a,o)>i)continue;let l=`${s}:${t}`;c.add(l),r.has(l)||r.set(l,h(n,s,t))}for(let e of r.keys())c.has(e)||r.delete(e)}}let x=oT,S=1/0,C=1/0,w=0,T=0;function E(t,n){let r=n.position.x,p=n.position.z;w=r,T=p,x+=t,(x>=oT||Math.hypot(r-S,p-C)>aT)&&(b(n),x=0,S=r,C=p);let m=(typeof window>`u`?900:window.innerHeight)/(2*Math.tan(n.fov*Math.PI/360));for(let{spec:n,mesh:h,meshHi:g,heightM:_,herds:v}of i){let i=h.geometry.getAttribute(`aSwing`),b=g.geometry.getAttribute(`aSwing`),x=qx.value?_*m/VT:0,S=0,C=0;for(let m of v.values())if(m)for(let _ of m.animals){y(n,m,_,t,r,p);let v=Math.hypot(_.x-r,_.z-p),w=v<=x;if((w?C:S)>=n.capacity)continue;let T=1-WT(n.fadeStartM,n.visibleM,v);if(T<=0)continue;let E=e(_.x,_.z);if(!Number.isFinite(E))continue;let D=n.orientBaseM,O=(e(_.x+D,_.z)-e(_.x-D,_.z))/(2*D),k=(e(_.x,_.z+D)-e(_.x,_.z-D))/(2*D);if(_.oriented){let e=1-Math.exp(-t/cT);_.gradX+=(O-_.gradX)*e,_.gradZ+=(k-_.gradZ)*e}else _.gradX=O,_.gradZ=k,_.oriented=!0;u.set(-_.gradX,1,-_.gradZ).normalize(),d.set(Math.sin(_.heading),0,Math.cos(_.heading)),d.addScaledVector(u,-d.dot(u)),d.lengthSq()<1e-8&&d.set(0,0,1),d.normalize(),f.crossVectors(u,d),o.makeBasis(f,u,d),s.set(_.x,E-lT,_.z),c.setFromRotationMatrix(o),l.setScalar(_.scale*T),a.compose(s,c,l),w?(g.setMatrixAt(C,a),b.setX(C,_.swing),C++):(h.setMatrixAt(S,a),i.setX(S,_.swing),S++)}h.count=S,h.instanceMatrix.needsUpdate=!0,i.needsUpdate=!0,g.count=C,g.instanceMatrix.needsUpdate=!0,b.needsUpdate=!0}}function D(){return i.flatMap(({spec:n,mesh:r,meshHi:i,herds:a})=>{let o=[];for(let s of a.values())if(s)for(let a of s.animals){let s={id:a.id,species:n.name,x:a.x,z:a.z,elevationM:e(a.x,a.z),slopeDeg:p(a.x,a.z),canopy:t(a.x,a.z),camDistM:Math.hypot(a.x-w,a.z-T),walking:a.walking,swing:a.swing,bold:a.bold,watching:a.watching,alarmed:!!a.alarmed,drawn:r.count+i.count,drawnHi:i.count};if(n.reaction===`hide`){let e=TC(a.homeX,a.homeZ,w,T),t=[a.x-e.x,a.z-e.z],n=[w-e.x,T-e.z],r=Math.hypot(...t)||1,i=Math.hypot(...n)||1;s.treeX=e.x,s.treeZ=e.z,s.treeDistM=r,s.treeSpacingM=6,s.shielded=(t[0]*n[0]+t[1]*n[1])/(r*i)<0}o.push(s)}return o})}function O(e,t,n,r=90){let a=i.find(t=>t.spec.name===e);if(!a)return null;let{spec:o}=a,s=Math.floor(t/o.cellM),c=Math.floor(n/o.cellM);for(let i=0;i<=r;i++){let r=[];for(let e=c-i;e<=c+i;e++)for(let t=s-i;t<=s+i;t++){if(i>0&&Math.abs(t-s)!==i&&Math.abs(e-c)!==i)continue;let n=h(o,t,e);n&&r.push(n)}if(r.length){r.sort((e,r)=>Math.hypot(e.siteX-t,e.siteZ-n)-Math.hypot(r.siteX-t,r.siteZ-n));let a=r[0].animals[0];return{species:e,x:a.x,z:a.z,ring:i,distanceM:Math.hypot(a.x-t,a.z-n)}}}return null}return{object:r,update:E,snapshot:D,findNearest:O,species:uT.map(e=>e.name),stats:{capacity:uT.reduce((e,t)=>e+t.capacity,0),trianglesPerAnimal:Object.fromEntries(i.map(({spec:e,mesh:t})=>[e.name,t.geometry.index?t.geometry.index.count/3:t.geometry.attributes.position.count/3]))}}}function WT(e,t,n){let r=Math.min(1,Math.max(0,(n-e)/(t-e)));return r*r*(3-2*r)}var GT=Math.PI*2,KT=9.81,qT={eagle:7299666,eagleNape:12492138,vultureBody:14061926,vultureWing:6842483,chough:4868686,bill:16776960,nutcracker:8284513,white:16777215},JT=.85,YT=60,XT=2,ZT=140,QT=[{name:`eagle`,kind:`soar`,salt:31249,cellM:2600,presence:.6,minPerSite:1,maxPerSite:2,speedMps:14,climbMps:2,sinkMps:.7,radiusMin:45,radiusMax:95,aglMin:60,aglMax:450,glideMaxM:2600,flapAmp:0,visibleM:1900,fadeStartM:1500,scaleMin:.95,scaleMax:1.1,capacity:8,habitat:{elevMin:2e3,exposureMin:.22}},{name:`vulture`,kind:`soar`,salt:31522,cellM:4200,presence:.32,minPerSite:1,maxPerSite:1,speedMps:15,climbMps:2.2,sinkMps:.6,radiusMin:70,radiusMax:140,aglMin:120,aglMax:700,glideMaxM:4200,flapAmp:0,visibleM:2300,fadeStartM:1800,scaleMin:1,scaleMax:1.15,capacity:6,habitat:{elevMin:2200,exposureMin:.2}},{name:`chough`,kind:`flock`,salt:31795,siteCategories:[`pass`,`hut`],siteElevMin:1900,sitePresence:.55,flockMin:8,flockMax:22,orbitRadiusM:45,orbitSpeedMps:3.5,centreAglMin:14,centreAglMax:38,memberRadiusM:13,memberSpeedMps:6,flapAmp:1,flapHz:3.4,curiousM:110,standoffM:15,callEveryS:[2.5,7],callEarshotM:320,visibleM:700,fadeStartM:520,scaleMin:.9,scaleMax:1.1,capacity:110},{name:`nutcracker`,kind:`canopy`,salt:32068,cellM:430,presence:.32,minPerSite:1,maxPerSite:2,speedMps:7.5,undulateM:26,undulateAmpM:3.2,cruiseAglM:21,hopMinM:45,hopMaxM:95,flapAmp:1,alertM:45,visibleM:220,fadeStartM:160,scaleMin:.9,scaleMax:1.05,capacity:28,habitat:{elevMin:900,elevMax:2300,canopyMin:.35}}];function $T(e){let t=e.toPrecision(12);return t.includes(`.`)||t.includes(`e`)?t:`${t}.0`}function eE(e,t,n){if(!e.includes(t))throw Error(`birds.js: shader marker not found: ${t}`);return e.replace(t,n)}function tE(e){let t=e>>>0;return()=>{t=t+1831565813>>>0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}function nE(e,t,n){let r=Math.imul(e|0,668265261)^Math.imul(t|0,374761393)^Math.imul(n,2654435769);return r=Math.imul(r^r>>>15,625341585),tE(r^r>>>13)}function rE(e,t,n){let r=Math.min(1,Math.max(0,(n-e)/(t-e)));return r*r*(3-2*r)}function iE(e,t,n){return e+(t-e)*n}function aE(e,t,{wing:n=0}={}){e.deleteAttribute(`uv`);let r=e.attributes.position.count,i=new Float32Array(r*3),a=new Float32Array(r),o=new W(t);for(let e=0;e<r;e++)i[e*3]=o.r,i[e*3+1]=o.g,i[e*3+2]=o.b,a[e]=n;return e.setAttribute(`color`,new hr(i,3)),e.setAttribute(`aWing`,new hr(a,1)),e}function oE(e,t,n=6){let r=new ua(e,t,2,n);return r.rotateX(Math.PI/2),r}function sE({x0:e,x1:t,zRoot:n,zTip:r,chordRoot:i,chordTip:a,rise:o=0,y:s=0}){let c=new kr,l=new Float32Array([e,s,n+i/2,e,s,n-i/2,t,s+o,r+a/2,t,s+o,r-a/2]);return c.setAttribute(`position`,new hr(l,3)),c.setIndex([0,1,2,1,3,2]),c.computeVertexNormals(),c}function cE(){let e=oE(.085,.36),t=oE(.062,.05);t.translate(0,.015,.25);let n=oE(.055,.06);n.translate(0,.03,.16);let r=new pa(.028,.07,5);r.rotateX(Math.PI/2),r.translate(0,.005,.32);let i=[aE(e,qT.eagle),aE(t,qT.eagle),aE(n,qT.eagleNape),aE(r,qT.eagleNape),aE(sE({x0:-.15,x1:.15,zRoot:-.3,zTip:-.3,chordRoot:.34,chordTip:.34}),qT.eagle)];for(let e of[1,-1])i.push(aE(sE({x0:e*.07,x1:e*1.08,zRoot:.06,zTip:-.1,chordRoot:.34,chordTip:.17,rise:.075}),qT.eagle,{wing:1}));return i}function lE(){let e=oE(.1,.42),t=oE(.06,.05);t.translate(0,.02,.29);let n=new pa(.03,.08,5);n.rotateX(Math.PI/2),n.translate(0,.01,.37);let r=[aE(e,qT.vultureBody),aE(t,qT.vultureBody),aE(n,qT.vultureWing),aE(sE({x0:-.13,x1:.13,zRoot:-.34,zTip:-.34,chordRoot:.16,chordTip:.16}),qT.vultureWing),aE(sE({x0:-.09,x1:.09,zRoot:-.52,zTip:-.52,chordRoot:.42,chordTip:.42}),qT.vultureWing)];for(let e of[1,-1])r.push(aE(sE({x0:e*.08,x1:e*1.4,zRoot:.04,zTip:-.16,chordRoot:.33,chordTip:.13,rise:.03}),qT.vultureWing,{wing:1}));return r}function uE(){let e=oE(.042,.13),t=oE(.033,.02);t.translate(0,.012,.095);let n=new pa(.011,.045,4);n.rotateX(Math.PI/2),n.translate(0,.008,.135);let r=[aE(e,qT.chough),aE(t,qT.chough),aE(n,qT.bill),aE(sE({x0:-.045,x1:.045,zRoot:-.13,zTip:-.13,chordRoot:.14,chordTip:.14}),qT.chough)];for(let e of[1,-1])r.push(aE(sE({x0:e*.035,x1:e*.37,zRoot:.02,zTip:-.05,chordRoot:.13,chordTip:.06,rise:.01}),qT.chough,{wing:1}));return r}function dE(){let e=oE(.04,.11),t=oE(.032,.02);t.translate(0,.01,.085);let n=new pa(.012,.05,4);n.rotateX(Math.PI/2),n.translate(0,.004,.125);let r=[aE(e,qT.nutcracker),aE(t,qT.nutcracker),aE(n,qT.nutcracker),aE(sE({x0:-.04,x1:.04,zRoot:-.1,zTip:-.1,chordRoot:.09,chordTip:.09}),qT.nutcracker),aE(sE({x0:-.04,x1:.04,zRoot:-.15,zTip:-.15,chordRoot:.03,chordTip:.03}),qT.white)];for(let e of[1,-1])r.push(aE(sE({x0:e*.032,x1:e*.26,zRoot:.015,zTip:-.03,chordRoot:.12,chordTip:.07,rise:.008}),qT.nutcracker,{wing:1}));return r}var fE={eagle:cE,vulture:lE,chough:uE,nutcracker:dE};function pE(e){let t=Gx(fE[e.name]());t.setAttribute(`aFlap`,new xi(new Float32Array(e.capacity),1));let n=new go({vertexColors:!0,roughness:.9,metalness:0,side:2,flatShading:!0});n.onBeforeCompile=e=>{let t=e.vertexShader;t=eE(t,`#include <common>`,`#include <common>
  attribute float aWing;
  attribute float aFlap;`),t=eE(t,`#include <begin_vertex>`,`
      float wingAngle = aWing * aFlap * ${$T(JT)} * sign( position.x );
      float wc = cos( wingAngle );
      float ws = sin( wingAngle );
      vec3 transformed = vec3(
        position.x * wc - position.y * ws,
        position.x * ws + position.y * wc,
        position.z
      );
    `),e.vertexShader=t},ry(n);let r=new ki(t,n,e.capacity);return r.name=`birds-${e.name}`,r.instanceMatrix.setUsage(We),r.count=0,r.frustumCulled=!1,r.castShadow=!1,r.receiveShadow=!1,r}function mE({sampleGroundHeight:e,canopyAt:t,pois:n=[],onCall:r=null}){let i=new Dn;i.name=`birds`;let a=QT.map(e=>({spec:e,mesh:pE(e),sites:new Map}));for(let e of a)i.add(e.mesh);let o=new Qt,s=new Qt,c=new H,l=new kt,u=new H,d=new H,f=new H,p=new H,m=new H(0,1,0),h=0,g=1;function _(t,n,r){let i=0,a=0;for(let[r,o]of[[ZT,0],[-140,0],[0,ZT],[0,-140]]){let s=e(t+r,n+o);Number.isFinite(s)&&(i+=s,a++)}return a?rE(0,60,r-i/a):0}function v(t,n,r){let i=nE(n,r,t.salt);if(i()>t.presence)return null;let a=(n+.5)*t.cellM+(i()-.5)*t.cellM*.6,o=(r+.5)*t.cellM+(i()-.5)*t.cellM*.6,s=e(a,o);if(!Number.isFinite(s)||s<t.habitat.elevMin)return null;let c=_(a,o,s);if(c<t.habitat.exposureMin)return null;let l=t.minPerSite+Math.floor(i()*(t.maxPerSite-t.minPerSite+1)),u=[];for(let e=0;e<l;e++){let l=iE(t.radiusMin,t.radiusMax,i());u.push({id:`${t.name}:${n}:${r}:${e}`,numericId:g++,mode:`circle`,cx:a+(i()-.5)*40,cz:o+(i()-.5)*40,radius:l,dir:i()<.5?1:-1,phase:i()*GT,x:a,y:s+iE(t.aglMin,t.aglMax*.5,i()),z:o,vx:0,vy:0,vz:0,bank:0,flap:0,glideX:0,glideZ:1,glideLeft:0,scale:iE(t.scaleMin,t.scaleMax,i()),exposure:c})}return{x:a,z:o,ground:s,exposure:c,birds:u,rnd:i}}function y(t,n,r){let i=tE(Math.imul(r+1,2654435769)^t.salt);if(i()>t.sitePresence)return null;let a=e(n.local.x,n.local.z);if(!Number.isFinite(a))return null;let o=t.flockMin+Math.floor(i()*(t.flockMax-t.flockMin+1)),s=[];for(let e=0;e<o;e++)s.push({radius:iE(3,t.memberRadiusM,i()**.6),phase:i()*GT,rate:iE(.6,1.5,i()),dy:(i()-.5)*9,bobPhase:i()*GT,flapPhase:i()*GT,scale:iE(t.scaleMin,t.scaleMax,i())});return{name:n.name,x:n.local.x,z:n.local.z,ground:a,elevationM:n.elevationM,category:n.category,cx:n.local.x,cy:a+iE(t.centreAglMin,t.centreAglMax,i()),cz:n.local.z,orbitPhase:i()*GT,orbitDir:i()<.5?1:-1,inspecting:!1,callIn:iE(t.callEveryS[0],t.callEveryS[1],i()),members:s,rnd:i}}function b(n,r,i){let a=nE(r,i,n.salt);if(a()>n.presence)return null;let o=(r+.5)*n.cellM+(a()-.5)*n.cellM*.7,s=(i+.5)*n.cellM+(a()-.5)*n.cellM*.7,c=e(o,s);if(!Number.isFinite(c)||c<n.habitat.elevMin||c>n.habitat.elevMax||t(o,s)<n.habitat.canopyMin)return null;let l=n.minPerSite+Math.floor(a()*(n.maxPerSite-n.minPerSite+1)),u=[];for(let e=0;e<l;e++){let t=a()*GT;u.push({id:`${n.name}:${r}:${i}:${e}`,numericId:g++,x:o+Math.cos(t)*12,z:s+Math.sin(t)*12,y:c+n.cruiseAglM,homeX:o,homeZ:s,targetX:o,targetZ:s,travelled:0,heading:t,bank:0,flap:0,alarmed:!1,scale:iE(n.scaleMin,n.scaleMax,a()),rnd:a})}return{x:o,z:s,ground:c,birds:u,rnd:a}}function x(e){let t=e.position.x,n=e.position.z;for(let e of a){let{spec:r,sites:i}=e;if(r.kind===`flock`){for(let e=0;e<k.length;e++){let a=k[e];if(Math.hypot(a.local.x-t,a.local.z-n)>r.visibleM*1.2)continue;let o=`poi:${e}`;i.has(o)||i.set(o,y(r,a,e))}continue}let a=r.visibleM*2.5;for(let[e,o]of i){let s=o?o.x:(Number(e.split(`:`)[0])+.5)*r.cellM,c=o?o.z:(Number(e.split(`:`)[1])+.5)*r.cellM;Math.hypot(s-t,c-n)>a&&i.delete(e)}let o=Math.ceil(r.visibleM/r.cellM)+1,s=Math.floor(t/r.cellM),c=Math.floor(n/r.cellM);for(let e=c-o;e<=c+o;e++)for(let t=s-o;t<=s+o;t++){let n=`${t}:${e}`;i.has(n)||i.set(n,r.kind===`soar`?v(r,t,e):b(r,t,e))}}}function S(t,n,r,i){let a=e(r.x,r.z),o=Number.isFinite(a)?a:n.ground;if(r.mode===`circle`){let e=t.speedMps/r.radius*r.dir;r.phase+=e*i;let a=r.cx+Math.cos(r.phase)*r.radius,s=r.cz+Math.sin(r.phase)*r.radius;if(r.y+=t.climbMps*i,r.bank=Math.atan(t.speedMps*t.speedMps/(r.radius*KT))*-r.dir,r.vx=(a-r.x)/i,r.vz=(s-r.z)/i,r.vy=t.climbMps,r.x=a,r.z=s,r.y-o>t.aglMax){r.mode=`glide`;let e=n.rnd()*GT;r.glideX=Math.sin(e),r.glideZ=Math.cos(e),r.glideLeft=iE(t.glideMaxM*.35,t.glideMaxM,n.rnd())}return}let s=t.speedMps*1.25*i;r.x+=r.glideX*s,r.z+=r.glideZ*s,r.y-=t.sinkMps*i,r.glideLeft-=s,r.vx=r.glideX*t.speedMps*1.25,r.vz=r.glideZ*t.speedMps*1.25,r.vy=-t.sinkMps,r.bank+=(0-r.bank)*(1-Math.exp(-i/1.2)),(r.glideLeft<=0||r.y-o<t.aglMin)&&(r.mode=`circle`,r.cx=r.x-Math.cos(r.phase)*r.radius,r.cz=r.z-Math.sin(r.phase)*r.radius,r.dir=n.rnd()<.5?1:-1,r.y=Math.max(r.y,o+t.aglMin))}function C(t,n,i,a){let o=a.position.x,s=a.position.y,c=a.position.z,l=Math.hypot(n.x-o,n.z-c);n.orbitPhase+=t.orbitSpeedMps/t.orbitRadiusM*n.orbitDir*i;let u=n.x+Math.cos(n.orbitPhase)*t.orbitRadiusM,d=n.z+Math.sin(n.orbitPhase)*t.orbitRadiusM,f=n.cy;if(n.inspecting=l<t.curiousM,n.inspecting){let e=Math.hypot(n.cx-o,n.cz-c)||1,r=Math.max(t.standoffM,8);u=o+(n.cx-o)/e*r,d=c+(n.cz-c)/e*r,f=s+7}let p=1-Math.exp(-i/(n.inspecting?1.6:3.5));n.cx+=(u-n.cx)*p,n.cy+=(f-n.cy)*p,n.cz+=(d-n.cz)*p;let m=e(n.cx,n.cz);Number.isFinite(m)&&(n.cy=Math.max(n.cy,m+4)),r&&(n.callIn-=i,n.callIn<=0&&(n.callIn=iE(t.callEveryS[0],t.callEveryS[1],n.rnd()),Math.hypot(n.cx-o,n.cz-c)<t.callEarshotM&&r({species:t.name,x:n.cx,z:n.cz,distanceM:l})))}function w(t,n,i,a,o){let s=o.position.x,c=o.position.z,l=Math.hypot(i.x-s,i.z-c),u=i.targetX-i.x,d=i.targetZ-i.z,f=Math.hypot(u,d);if(l<t.alertM&&!i.alarmed?(i.alarmed=!0,T(t,i,Math.atan2(i.x-s,i.z-c)+(i.rnd()-.5)*.8),u=i.targetX-i.x,d=i.targetZ-i.z,f=Math.hypot(u,d),r?.({species:t.name,x:i.x,z:i.z,distanceM:l})):i.alarmed&&l>t.alertM*1.5&&(i.alarmed=!1),f<2){T(t,i,i.rnd()*GT);return}let p=t.speedMps*a;i.x+=u/f*p,i.z+=d/f*p,i.travelled+=p,i.heading=Math.atan2(u,d);let m=e(i.x,i.z),h=Number.isFinite(m)?m:n.ground,g=Math.sin(i.travelled/t.undulateM*GT);i.y=h+t.cruiseAglM+g*t.undulateAmpM,i.flap=Math.max(0,Math.cos(i.travelled/t.undulateM*GT)),i.vx=u/f*t.speedMps,i.vz=d/f*t.speedMps,i.vy=g*.6,i.bank=0}function T(e,n,r){for(let i=0;i<5;i++){let a=r+(i===0?0:(n.rnd()-.5)*2.2),o=iE(e.hopMinM,e.hopMaxM,n.rnd()),s=n.x+Math.sin(a)*o,c=n.z+Math.cos(a)*o;if(t(s,c)>=e.habitat.canopyMin*.7){n.targetX=s,n.targetZ=c,n.travelled=0;return}}n.targetX=n.homeX,n.targetZ=n.homeZ,n.travelled=0}function E(e,t,n,r){if(d.set(e,t,n),d.lengthSq()<1e-8&&d.set(0,0,1),d.normalize(),p.crossVectors(m,d),p.lengthSq()<1e-8&&p.set(1,0,0),p.normalize(),f.crossVectors(d,p),r!==0){let e=Math.cos(r),t=Math.sin(r),n=p.x*e+f.x*t,i=p.y*e+f.y*t,a=p.z*e+f.z*t;f.set(f.x*e-p.x*t,f.y*e-p.y*t,f.z*e-p.z*t),p.set(n,i,a)}s.makeBasis(p,f,d),l.setFromRotationMatrix(s)}function D(e,t){let{spec:n,mesh:r,sites:i}=e,a=r.geometry.getAttribute(`aFlap`),s=t.position.x,d=t.position.y,f=t.position.z,p=0;for(let e of i.values())if(e){if(n.kind===`flock`){for(let t of e.members){if(p>=n.capacity)break;let i=t.phase+h*n.memberSpeedMps*t.rate/Math.max(t.radius,1),m=e.cx+Math.cos(i)*t.radius,g=e.cz+Math.sin(i)*t.radius,_=e.cy+t.dy+Math.sin(h*.9+t.bobPhase)*1.6,v=Math.hypot(m-s,_-d,g-f),y=1-rE(n.fadeStartM,n.visibleM,v);if(y<=0)continue;let b=n.memberSpeedMps*t.rate;E(-Math.sin(i)*b,0,Math.cos(i)*b,Math.atan(b*b/(Math.max(t.radius,1)*KT))*-1),c.set(m,_,g),u.setScalar(t.scale*y),o.compose(c,l,u),r.setMatrixAt(p,o),a.setX(p,Math.sin(h*n.flapHz*GT+t.flapPhase)*n.flapAmp),p++}continue}for(let t of e.birds){if(p>=n.capacity)break;let e=Math.hypot(t.x-s,t.y-d,t.z-f),i=1-rE(n.fadeStartM,n.visibleM,e);i<=0||(E(t.vx,t.vy,t.vz,t.bank),c.set(t.x,t.y,t.z),u.setScalar(t.scale*i),o.compose(c,l,u),r.setMatrixAt(p,o),a.setX(p,t.flap*n.flapAmp),p++)}}r.count=p,r.instanceMatrix.needsUpdate=!0,a.needsUpdate=!0}let O=QT.find(e=>e.name===`chough`),k=n.filter(e=>O.siteCategories.includes(e.category)&&(e.elevationM??0)>=O.siteElevMin),A=XT,ee=1/0,j=1/0,M=0,te=0;function ne(e,t){h+=e,M=t.position.x,te=t.position.z,A+=e,(A>=XT||Math.hypot(M-ee,te-j)>YT)&&(x(t),A=0,ee=M,j=te);for(let n of a){let{spec:r,sites:i}=n;for(let n of i.values())if(n){if(r.kind===`flock`){C(r,n,e,t);continue}for(let i of n.birds)r.kind===`soar`?S(r,n,i,e):w(r,n,i,e,t)}D(n,t)}}function N(){let n=[];for(let{spec:r,mesh:i,sites:o}of a)for(let a of o.values())if(a){if(r.kind===`flock`){let t=e(a.cx,a.cz);n.push({species:r.name,site:a.name,category:a.category,siteElevationM:a.elevationM,x:a.cx,y:a.cy,z:a.cz,aglM:a.cy-(Number.isFinite(t)?t:a.ground),members:a.members.length,inspecting:a.inspecting,camDistM:Math.hypot(a.cx-M,a.cz-te),anchorDistM:Math.hypot(a.x-M,a.z-te),drawn:i.count});continue}for(let o of a.birds){let s=e(o.x,o.z);n.push({species:r.name,id:o.id,x:o.x,y:o.y,z:o.z,groundM:s,aglM:o.y-s,mode:o.mode??`cruise`,bankDeg:o.bank*180/Math.PI,speedMps:Math.hypot(o.vx??0,o.vy??0,o.vz??0),groundSpeedMps:Math.hypot(o.vx??0,o.vz??0),radiusM:o.radius??null,siteX:a.x,siteZ:a.z,exposure:a.exposure??null,canopy:t(o.x,o.z),flap:o.flap,camDistM:Math.hypot(o.x-M,o.z-te),drawn:i.count})}}return n}function re(e,t,n){let r=a.find(t=>t.spec.name===e);if(!r)return null;let{spec:i}=r,o=i.kind===`flock`?null:Math.ceil(25e3/i.cellM);if(o!=null){let e=Math.floor(t/i.cellM),a=Math.floor(n/i.cellM);for(let t=a-o;t<=a+o;t++)for(let n=e-o;n<=e+o;n++){let e=`${n}:${t}`;r.sites.has(e)||r.sites.set(e,i.kind===`soar`?v(i,n,t):b(i,n,t))}}else for(let e=0;e<k.length;e++){let t=`poi:${e}`;r.sites.has(t)||r.sites.set(t,y(i,k[e],e))}let s=null;for(let a of r.sites.values()){if(!a)continue;let r=i.kind===`flock`?a.x:a.birds[0]?.x,o=i.kind===`flock`?a.z:a.birds[0]?.z;if(r==null)continue;let c=Math.hypot(r-t,o-n);(!s||c<s.distanceM)&&(s={species:e,x:r,z:o,y:i.kind===`flock`?a.cy:a.birds[0].y,distanceM:c,site:a.name??null})}return s}return{object:i,update:ne,snapshot:N,findNearest:re,species:QT.map(e=>e.name),stats:{flockSites:k.length,capacity:QT.reduce((e,t)=>e+t.capacity,0),trianglesPerBird:Object.fromEntries(a.map(({spec:e,mesh:t})=>[e.name,t.geometry.index?t.geometry.index.count/3:t.geometry.attributes.position.count/3]))}}}var hE=.35,gE=8,_E=6,vE=.25,yE=.08,bE={waterfall:{radiusM:600,gain:.85,low:1,high:.9},river:{radiusM:250,gain:.6,low:.45,high:.75},lake:{radiusM:110,gain:.22,low:.55,high:.3}},xE=640,SE=40,CE={marmot:{f0:3500,f1:2750,durS:.3,gain:.5,bandQ:5,earshotM:240,notesMin:2,notesMax:5,gapS:[.45,.85]},chamois:{f0:2200,f1:1900,durS:.14,gain:.3,bandQ:7,earshotM:180,notesMin:1,notesMax:3,gapS:[.5,.9]},chough:{f0:2600,f1:1850,durS:.2,gain:.32,bandQ:4,earshotM:380,notesMin:2,notesMax:4,gapS:[.22,.5]},nutcracker:{f0:950,f1:780,durS:.34,gain:.38,bandQ:1.6,earshotM:240,notesMin:1,notesMax:3,gapS:[.3,.62],wave:`sawtooth`,rattleHz:30}},wE=.012,TE=.35;function EE(e,t,n,r,i,a){let o=[];for(let s=0;s<e;s++){let c=e>1?s/(e-1):0;o.push([t+(n-t)*c,r,i+(a-i)*c])}return o}var DE=[{name:`chaffinch`,salt:1441,habitat:{elevMin:700,elevMax:2100,canopyMin:.22},cellM:140,presence:.42,earshotM:200,everyS:[26,58],gain:.19,voice:{f0:4100,f1:3750,bandQ:6},phrase:[...EE(9,1,.62,.075,.155,.095),[.68,.11,.14],[.86,.2,.2]]},{name:`coaltit`,salt:1458,habitat:{elevMin:900,elevMax:2200,canopyMin:.35},cellM:160,presence:.35,earshotM:160,everyS:[18,42],gain:.13,voice:{f0:4900,f1:4700,bandQ:8},phrase:[[1,.09,.135],[.8,.09,.3]],repeat:[3,6]},{name:`cuckoo`,salt:1475,habitat:{elevMin:800,elevMax:1900,canopyMin:.08,canopyMax:.75},cellM:500,presence:.25,earshotM:750,everyS:[80,180],gain:.22,voice:{f0:735,f1:722,bandQ:2.2,wave:`sine`},phrase:[[1,.17,.3],[.79,.24,.24]],repeat:[3,8],repeatGapS:[.9,1.4]},{name:`pipit`,salt:1492,habitat:{elevMin:1900,elevMax:2900,canopyMax:.12},cellM:130,presence:.4,earshotM:210,everyS:[26,55],gain:.12,voice:{f0:5200,f1:5050,bandQ:9},phrase:EE(11,1,.88,.05,.105,.075)},{name:`tawnyowl`,salt:1509,nocturnal:!0,habitat:{elevMin:700,elevMax:1900,canopyMin:.25},cellM:500,presence:.35,earshotM:800,everyS:[40,110],gain:.2,voice:{f0:470,f1:452,bandQ:3,wave:`sine`,rattleHz:13,rattleDepth:.2},phrase:[[1,.5,2.6],[1,.08,.24],[.97,.1,.16],[.94,.8,.8]],repeat:[1,2],repeatGapS:[6,11]}],OE=2,kE=.65,AE=.85,jE=2,ME=.09,NE=.4,PE=200,FE=.7,IE=.2,LE=.12,RE={grass:{type:`lowpass`,freq:850,Q:.9,durS:.11,attackS:.006,gain:.8},forest:{type:`lowpass`,freq:620,Q:.8,durS:.14,attackS:.008,gain:.75,grains:2,grainGain:.35},scree:{type:`bandpass`,freq:2100,Q:.7,durS:.09,attackS:.003,gain:1,grains:4,grainGain:.5},snow:{type:`bandpass`,freq:3200,Q:1.4,durS:.16,attackS:.004,gain:.85},wet:{type:`lowpass`,freq:420,Q:1.2,durS:.13,attackS:.01,gain:.9}},zE=.45,BE=.5,VE=.35,HE=3800,UE=3e3,WE=30,GE=12,KE=new H;function qE(e,t,n){return Math.min(n,Math.max(t,e))}function JE(e,t,n){let r=qE((n-e)/(t-e),0,1);return r*r*(3-2*r)}function YE(e){let t=e>>>0;return()=>{t=t+1831565813>>>0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}function XE(e,t,n){let r=Math.imul(e|0,668265261)^Math.imul(t|0,374761393)^Math.imul(n,2654435769);return r=Math.imul(r^r>>>15,625341585),YE(r^r>>>13)}function ZE(e,t){return t[0]+(t[1]-t[0])*e()}function QE(e,t,n){let r=Math.max(1,Math.floor(e.sampleRate*t)),i=e.createBuffer(1,r,e.sampleRate),a=i.getChannelData(0),o=0,s=0,c=0,l=0,u=0,d=0,f=0;for(let e=0;e<r;e++){let t=n()*2-1;o=.99886*o+t*.0555179,s=.99332*s+t*.0750759,c=.969*c+t*.153852,l=.8665*l+t*.3104856,u=.55*u+t*.5329522,d=-.7616*d-t*.016898,a[e]=(o+s+c+l+u+d+f+t*.5362)*.11,f=t*.115926}return i}function $E(e,t,n){if(!e.length)return;n(e[0][0],e[0][1]);let r=0;for(let i=1;i<e.length;i++){let[a,o]=e[i-1],[s,c]=e[i],l=Math.hypot(s-a,c-o);if(l<=1e-6)continue;let u=t-r;for(;u<=l;){let e=u/l;n(a+(s-a)*e,o+(c-o)*e),u+=t}r=(r+l)%t}}function eD(e){let t=new Map,n=0,r=(e,t)=>`${Math.floor(e/xE)},${Math.floor(t/xE)}`,i=(e,i)=>(a,o)=>{let s=r(a,o),c=t.get(s);c||t.set(s,c=[]),c.push({x:a,z:o,kind:e,strength:i}),n++};for(let t of e.lakes??[]){let e=t.ring??[],n=0;for(let t=1;t<e.length;t++)n+=Math.hypot(e[t][0]-e[t-1][0],e[t][1]-e[t-1][1]);$E(e,SE,i(`lake`,qE(n/900,.35,1)))}for(let t of e.rivers??[])$E((t.line??[]).map(([e,,t])=>[e,t]),SE,i(`river`,1));for(let t of e.streams??[])$E((t.line??[]).map(([e,,t])=>[e,t]),SE,i(`river`,.45));for(let t of e.waterfalls??[]){let e=t.centerline?.[t.centerline.length-1];e&&i(`waterfall`,qE(.45+(t.dropM??0)/90,.5,1.35))(e[0],e[2])}function a(e,n){let r=Math.floor(e/xE),i=Math.floor(n/xE),a={};for(let e of Object.keys(bE))a[e]={distanceM:1/0,strength:0};for(let o=-1;o<=1;o++)for(let s=-1;s<=1;s++){let c=t.get(`${r+o},${i+s}`);if(c)for(let t of c){let r=Math.hypot(t.x-e,t.z-n),i=a[t.kind];r<i.distanceM&&(i.distanceM=r,i.strength=t.strength)}}return a}return{query:a,count:n,cells:t.size}}function tD({context:e=null,canopyAt:t=null,sampleGroundHeight:n=null,water:r=null,random:i=Math.random,immediate:a=!1}={}){let o=e,s=null,c=null,l=null,u={canopyAt:t,sampleGroundHeight:n},d=r?eD(r):null,f=!0,p=.5,m=.5,h=0,g=0,_=1/gE,v=0,y=null,b=0,x=0,S=-1/0,C=0,w=DE.map(()=>new Map),T=OE,E=0,D=null,O=0,k=Object.fromEntries(DE.map(e=>[e.name,0])),A=0,ee=null,j=0,M=0,te=0,ne=null,N=null,re={started:!1,enabled:f,strength:0,altitude:0,exposure:0,canopy:0,gust:0,rain:0,snow:0,speedMps:0,water:null,gains:{},night:0,singers:0,songs:0,surface:null,steps:0};function ie(e,t){let n=Number.isFinite(t)?t:0;a?e.setValueAtTime(n,o.currentTime):e.setTargetAtTime(n,o.currentTime,vE)}function ae(e,{type:t,freq:n,Q:r,rate:a}){let s=o.createBufferSource();s.buffer=e,s.loop=!0,s.playbackRate.value=a;let l=o.createBiquadFilter();l.type=t,l.frequency.value=n,l.Q.value=r;let u=o.createGain();return u.gain.value=0,s.connect(l).connect(u).connect(c),s.start(0,i()*_E),{source:s,filter:l,gain:u}}function oe(){s=o.createGain(),s.gain.value=f?hE:0,s.connect(o.destination),c=o.createBiquadFilter(),c.type=`lowpass`,c.frequency.value=18e3,c.Q.value=.7,c.connect(s);let e=QE(o,_E,i);ee=e,l={windLow:ae(e,{type:`bandpass`,freq:130,Q:.8,rate:.83}),windHigh:ae(e,{type:`bandpass`,freq:900,Q:.55,rate:1}),rustle:ae(e,{type:`bandpass`,freq:3e3,Q:.5,rate:1.19}),waterLow:ae(e,{type:`lowpass`,freq:420,Q:.9,rate:.91}),waterHigh:ae(e,{type:`bandpass`,freq:2400,Q:.45,rate:1.07}),rain:ae(e,{type:`bandpass`,freq:1800,Q:.4,rate:1.13})},re.started=!0}function se(e,t){let n=u.sampleGroundHeight;if(!n)return 0;let r=GE,i=n(e+r,t)-n(e-r,t),a=n(e,t+r)-n(e,t-r);return!Number.isFinite(i)||!Number.isFinite(a)?0:Math.atan(Math.hypot(i,a)/(2*r))*180/Math.PI}function ce(e,t,n,r){let i=u.sampleGroundHeight;if(!(r>0))return 0;let a=0;if(i){let n=GE,r=(i(e,t-n)-i(e,t+n))/(2*n);Number.isFinite(r)&&(a=r/Math.hypot(1,r))}return My({elevM:n,aspectZ:a,level:r})}function le(e,t,n,r,i,a){return ce(e,t,n,i)>zE||n>HE?`snow`:a>BE?`wet`:r>VE?`forest`:n>UE||se(e,t)>WE?`scree`:`grass`}function P(e,t,n,r,{freqMul:a=1,durMul:s=1,rate:l=1}={}){let u=e.durS*s,d=o.createBufferSource();d.buffer=ee,d.playbackRate.value=l;let f=o.createBiquadFilter();f.type=e.type,f.frequency.value=e.freq*a,f.Q.value=e.Q;let p=o.createGain(),m=Math.max(t,1e-4);p.gain.setValueAtTime(1e-4,r),p.gain.exponentialRampToValueAtTime(m,r+e.attackS),p.gain.exponentialRampToValueAtTime(1e-4,r+u);let h=o.createStereoPanner();return h.pan.value=n,d.connect(f).connect(p).connect(h).connect(c),d.start(r,i()*Math.max(.1,_E-u-.1),u+.02),d.onended=()=>{d.disconnect(),f.disconnect(),p.disconnect(),h.disconnect()},d}let ue=[];function de(e){for(let t of ue)if(!(t.at<=e)){for(let n of t.srcs)n.stop(e),n.onended?.(),n.onended=null;te--}ue.length=0}function fe(e,t){let n=RE[e];if(!n||!ee)return;M^=1;let r=M?LE:-.12,a=FE*n.gain*(.85+.3*i()),o=[P(n,a,r,t,{freqMul:.9+.2*i(),durMul:.9+.2*i(),rate:.9+.25*i()})];for(let e=0;e<(n.grains??0);e++)o.push(P(n,a*n.grainGain*(.4+.6*i()),r+(i()-.5)*.3,t+.02+i()*.09,{freqMul:1.1+.5*i(),durMul:.35,rate:1+.5*i()}));ue.push({at:t,srcs:o}),te++}function pe(e,t,n,r,a,o,s){let c=_e();if(!s)return de(c),j=c+.06,ne=null,null;ue.length&&(ue=ue.filter(e=>e.at>c));let l=le(e,t,n,r,a,o);for(ne=l,j<c&&(j=c+.06);j<c+IE;)fe(l,j),j+=1/jE*(1+(i()-.5)*2*ME);return l}function me(){if(!o){let e=window.AudioContext??window.webkitAudioContext;if(!e)return!1;o=new e}return l||oe(),!o.startRendering&&o.state===`suspended`&&o.resume(),!0}function he(e){f=!!e,re.enabled=f,f&&me(),s&&s.gain.setTargetAtTime(f?hE:0,o.currentTime,yE)}function ge(e,t,n){let r=JE(1300,3300,n),i=0,a=u.sampleGroundHeight;if(a){let r=0,o=0;for(let[n,i]of[[90,0],[-90,0],[0,90],[0,-90]]){let s=a(e+n,t+i);Number.isFinite(s)&&(r+=s,o++)}o&&(i=JE(0,35,n-r/o))}return{altitude:r,exposure:i}}function _e(){return typeof o.startRendering==`function`?(D??=o.currentTime,D+E):o.currentTime}function ve(e,t,n){let r=XE(t,n,e.salt);if(r()>e.presence)return null;let i=(t+r())*e.cellM,a=(n+r())*e.cellM,o=u.sampleGroundHeight;if(!o)return null;let s=o(i,a),c=e.habitat;if(!Number.isFinite(s)||s<c.elevMin||s>c.elevMax)return null;let l=qE(u.canopyAt?.(i,a)??0,0,1);return c.canopyMin!=null&&l<c.canopyMin||c.canopyMax!=null&&l>c.canopyMax?null:{x:i,z:a,rnd:r,nextIn:r()*e.everyS[1]}}function ye(e,t){if(u.sampleGroundHeight)for(let n=0;n<DE.length;n++){let r=DE[n],i=w[n],a=r.earshotM+r.cellM,o=Math.ceil(a/r.cellM),s=Math.floor(e/r.cellM),c=Math.floor(t/r.cellM),l=new Set;for(let n=c-o;n<=c+o;n++)for(let c=s-o;c<=s+o;c++){let o=(c+.5)*r.cellM-e,s=(n+.5)*r.cellM-t;if(Math.hypot(o,s)>a)continue;let u=`${c}:${n}`;l.add(u),i.has(u)||i.set(u,ve(r,c,n))}for(let e of i.keys())l.has(e)||i.delete(e)}}function be(e,t,n,r){let i=Te(t.x,t.z,n),a=e.gain*r*(1-n/e.earshotM)**1.5;if(a<.001)return!1;let o=t.rnd,s=e.repeat?e.repeat[0]+Math.floor(o()*(e.repeat[1]-e.repeat[0]+1)):1,c=_e()+.01+o()/gE;for(let t=0;t<s;t++){for(let[t,n,r]of e.phrase)Ee(e.voice,a*(.86+.14*o()),i,c,t*(.995+.01*o()),n),c+=r;e.repeatGapS&&(c+=ZE(o,e.repeatGapS))}return O++,k[e.name]++,!0}function xe(e,t,n,r,i){let a=qE(1-kE*r,.1,1),o=JE(.25,.7,A),s=1-AE*i,c=0;for(let r=0;r<DE.length;r++){let i=DE[r],l=(i.nocturnal?o:1-o)*s;for(let o of w[r].values()){if(!o||(c++,o.nextIn-=e,o.nextIn>0)||(o.nextIn=ZE(o.rnd,i.everyS),o.rnd()>l))continue;let r=Math.hypot(o.x-t,o.z-n);r>i.earshotM||be(i,o,r,a)}}return c}function Se(e,t,n,r){let a=t.position.x,s=t.position.y,_=t.position.z;h-=e,h<=0&&(m=.15+.85*i(),h=1.5+3.5*i()),p+=(m-p)*(1-Math.exp(-e/1.2)),g=(g+e*.9)%(Math.PI*2);let y=u.sampleGroundHeight?.(a,_),b=Number.isFinite(y)?y:s,x=qE(u.canopyAt?.(a,_)??0,0,1),S=n?.mod??{},C=qE(S.rain??0,0,1),w=qE(S.snow??0,0,1),{altitude:D,exposure:k}=ge(a,_,b),ee=JE(2,60,Math.max(0,s-b)),j=JE(6,70,v)*(.3+.45*ee),M=1-.55*x,ne=qE((.16+.52*D+.32*k)*M+.55*C+j,0,1.25),N=0,ae=null;if(f){E+=e,T+=e,T>=OE&&(T=0,ye(a,_)),N=xe(e,a,_,qE(ne,0,1),C);let t=r?.mode===`walk`&&(r.travelMps??0)>NE;ae=pe(a,_,b,x,w,S.wet??0,t)}let oe=0,se=0,ce=d?.query(a,_)??null;if(ce)for(let[e,t]of Object.entries(bE)){let{distanceM:n,strength:r}=ce[e];if(!(n<t.radiusM))continue;let i=n/t.radiusM,a=(1-i)**1.8*r*t.gain,o=a*(1-.55*i),s=e===`lake`?.75+.35*Math.sin(g):1;oe+=t.low*a*s,se+=t.high*o*s}let le={windLow:.5*ne*(.55+.55*p),windHigh:.3*ne**1.25*(.35+.85*p),rustle:.5*x*(.2+.9*ne)*(.3+.9*p),waterLow:qE(oe,0,1),waterHigh:qE(se,0,1),rain:.55*C*(1+.5*x)};for(let[e,t]of Object.entries(le))ie(l[e].gain.gain,t);ie(l.windLow.filter.frequency,110+60*p),ie(l.windHigh.filter.frequency,700+900*p),ie(c.frequency,18e3-12500*w),Object.assign(re,{strength:ne,altitude:D,exposure:k,canopy:x,gust:p,rain:C,snow:w,speedMps:v,water:ce,gains:le,night:A,singers:N,songs:O,surface:ae,steps:te,clockSkew:_e()-o.currentTime})}function Ce(e,t,n=null,r=null,i=null){if(!l||!t)return;N=t,A=qE(r?.night??0,0,1);let a=t.position.x,o=t.position.y,s=t.position.z;if(y!=null&&e>1e-4){let t=Math.hypot(a-y,o-b,s-x)/e;t>PE?v=0:v+=(t-v)*(1-Math.exp(-e/.3))}if(y=a,b=o,x=s,_+=e,_<1/gE)return;let c=_;_=0,Se(c,t,n,i)}function we({species:e,x:t,z:n}={}){if(!l||!f||!N)return 0;let r=CE[e];if(!r)return 0;let a=N.position.x,s=N.position.z,c=Math.hypot(t-a,n-s);if(c>r.earshotM||o.currentTime-S<TE)return 0;S=o.currentTime,C++;let u=Te(t,n,c),d=r.gain*(1-c/r.earshotM)**1.5,p=r.notesMin+Math.floor(i()*(r.notesMax-r.notesMin+1)),m=o.currentTime+.01;for(let e=0;e<p;e++)Ee(r,d*(e===0?1:.7+.3*i()),u,m,.97+.06*i()),m+=r.gapS[0]+(r.gapS[1]-r.gapS[0])*i();return p}function Te(e,t,n){if(!N)return 0;let r=0,i=-1;if(N.getWorldDirection){N.getWorldDirection(KE);let e=Math.hypot(KE.x,KE.z)||1;r=KE.x/e,i=KE.z/e}let a=N.position.x,o=N.position.z,s=Math.max(n,.001);return qE((e-a)/s*-i+(t-o)/s*r,-1,1)}function Ee(e,t,n,r,i=1,a=null){let s=a??e.durS,l=e.f0*i,u=e.f1*i,d=o.createOscillator();d.type=e.wave??`triangle`,d.frequency.setValueAtTime(l,r),d.frequency.exponentialRampToValueAtTime(u,r+s);let f=o.createBiquadFilter();f.type=`bandpass`,f.frequency.value=(l+u)/2,f.Q.value=e.bandQ;let p=[],m=f;if(e.rattleHz){let t=e.rattleDepth??.55,n=o.createGain();n.gain.value=1-t;let i=o.createOscillator();i.type=`square`,i.frequency.value=e.rattleHz;let a=o.createGain();a.gain.value=t,i.connect(a).connect(n.gain),i.start(r),i.stop(r+s+.02),f.connect(n),m=n,p.push(n,i,a)}let h=o.createGain(),g=Math.max(t,2e-4);h.gain.setValueAtTime(1e-4,r),h.gain.exponentialRampToValueAtTime(g,r+wE),h.gain.exponentialRampToValueAtTime(g*.8,r+s*.7),h.gain.exponentialRampToValueAtTime(1e-4,r+s);let _=o.createStereoPanner();_.pan.value=n,d.connect(f),m.connect(h).connect(_).connect(c),d.start(r),d.stop(r+s+.02),d.onended=()=>{d.disconnect(),f.disconnect(),h.disconnect(),_.disconnect();for(let e of p)e.disconnect()}}return{start:me,setEnabled:he,get enabled(){return f},toggle(){return he(!f),f},setSamplers(e){u={...u,...e};for(let e of w)e.clear();T=OE},setWater(e){return d=e?eD(e):null,d},update:Ce,call:we,get diag(){return re},get callsPlayed(){return C},get songsPlayed(){return O},get stepsPlayed(){return te},get surface(){return ne},get surfaces(){return Object.keys(RE)},get songsBySpecies(){return{...k}},get songbirds(){return DE.map(e=>e.name)},get context(){return o}}}var nD=1950,rD=9e3,iD={value:1},aD={value:null},oD=null,sD=null,cD=[{name:`rayleighZenithLength`,expect:8400,tol:.2},{name:`mieZenithLength`,expect:1250,tol:.2}],lD=!1;function uD(){if(lD)return oD;let e=Od.SkyShader,t={};for(let{name:n,expect:r,tol:i}of cD){let a=RegExp(`const\\s+float\\s+${n}\\s*=\\s*([^;]+);`),o=e.fragmentShader.match(a);if(!o)throw Error(`src/sky.js: could not find "const float ${n}" in three's Sky shader. The addon has been reformatted or renamed by a three.js upgrade, and the altitude patch would silently do nothing - which looks identical to a weak effect. Re-read node_modules/three/examples/jsm/objects/Sky.js.`);let s=Number.parseFloat(o[1]);if(!Number.isFinite(s)||s<=0)throw Error(`src/sky.js: ${n} parsed as ${o[1]}, which is not a usable length.`);if(Math.abs(s-r)>r*i)throw Error(`src/sky.js: ${n} is ${s} m, but this module assumes ~${r} m (the atmospheric scale height it stands for). Re-derive the exponent before changing this check - see the header.`);t[n]=s,e.fragmentShader=e.fragmentShader.replace(a,`uniform float ${n};`),e.uniforms[n]={value:s}}return lD=!0,oD=t,sD=Object.entries(t),oD}function dD(e){let t=Math.min(rD,Math.max(0,e))-nD;return t*(t>0?iD.value:1)}function fD(e,t){if(!sD)throw Error(`src/sky.js: installSkyAltitude() has not run yet.`);let n=dD(aD.value??t),r=e.material.uniforms;for(let e=0;e<sD.length;e++){let[t,i]=sD[e];r[t].value=i*Math.exp(-n/i)}}var pD=[{key:`clear`,label:`Clear skies`,cover:.12,dark:.06,hazeMul:1,vfAdd:0,exposureMul:1,grey:0,glowMul:1,starsMul:1,snow:0,wet:0,rain:0,wind:.3},{key:`clouds`,label:`Drifting clouds`,cover:.52,dark:.26,hazeMul:1.35,vfAdd:0,exposureMul:.95,grey:.22,glowMul:.6,starsMul:.3,snow:0,wet:0,rain:0,wind:.55},{key:`storm`,label:`Rainstorm`,cover:1,dark:.62,hazeMul:3.2,vfAdd:1e-4,exposureMul:.76,grey:.78,glowMul:0,starsMul:0,snow:0,wet:1,rain:1,wind:1},{key:`snow`,label:`Snowfall`,cover:.95,dark:.3,hazeMul:2.4,vfAdd:7e-5,exposureMul:.9,grey:.6,glowMul:.05,starsMul:0,snow:1,wet:0,rain:0,wind:.7}],mD=pD.map(e=>e.key),hD=[`cover`,`dark`,`hazeMul`,`vfAdd`,`exposureMul`,`grey`,`glowMul`,`starsMul`,`wet`,`rain`,`wind`],gD=6,_D=12,vD=new W(1,1,1),yD=class{constructor(e,{worldWidth:t,worldDepth:n}){this.index=0,this.mod={...pD[0],snow:0,snowFall:0},this.from={...this.mod},this.to=pD[0],this.t=1,this.time={value:0},this._snowAccum=0,this.clouds=bD(this.time,t,n),e.add(this.clouds),this.precip=xD(this.time),e.add(this.precip)}get current(){return pD[this.index].key}get label(){return pD[this.index].label}set(e){return this.index=(e%pD.length+pD.length)%pD.length,this.from={...this.mod},this.to=pD[this.index],this.t=0,pD[this.index].label}cycle(){return this.set(this.index+1)}update(e,t){if(this.time.value+=e,this.t<1){this.t=Math.min(1,this.t+e/4);let t=this.t*this.t*(3-2*this.t);for(let e of hD)this.mod[e]=this.from[e]+(this.to[e]-this.from[e])*t;this.mod.snowFall=this.from.snowFall+(this.to.snow-this.from.snowFall)*t}let n=this.to.snow>this._snowAccum?gD:_D;this._snowAccum+=(this.to.snow-this._snowAccum)*(1-Math.exp(-e/n)),this.mod.snow=this._snowAccum;let r=this.clouds.material.uniforms;r.uCover.value=this.mod.cover,r.uDark.value=this.mod.dark;let i=this.precip.material.uniforms,a=Math.max(this.mod.rain,this.mod.snowFall);i.uIntensity.value=a,i.uSnowMix.value=this.mod.snowFall/Math.max(this.mod.rain+this.mod.snowFall,1e-4),this.precip.visible=a>.02,t&&this.precip.position.copy(t.position)}applyLight(e){let t=this.clouds.material.uniforms;t.uLight.value.copy(e).lerp(vD,.55).multiplyScalar(1-this.mod.dark*.2),t.uShade.value.copy(e).multiplyScalar(.52-this.mod.dark*.22),this.precip.material.uniforms.uColor.value.copy(e).lerp(vD,.45)}};function bD(e,t,n){let r=t/2,i=n/2,a=new eo(t*1.3,n*1.3);a.rotateX(-Math.PI/2);let o=new mo({transparent:!0,depthWrite:!1,side:2,uniforms:{uTime:e,uCover:{value:.12},uDark:{value:.06},uLight:{value:new W(1,1,1)},uShade:{value:new W(.6,.62,.66)},uHalfExtent:{value:new V(r,i)},...Qv.uniforms},vertexShader:`
      varying vec3 vWorld;
      void main() {
        vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      uniform float uTime, uCover, uDark;
      uniform vec3 uLight, uShade, uAtmoFogColor;
      uniform vec2 uHalfExtent;
      varying vec3 vWorld;
      ${$v}

      float chash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float cnoise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(chash(i), chash(i + vec2(1, 0)), f.x),
                   mix(chash(i + vec2(0, 1)), chash(i + vec2(1, 1)), f.x), f.y);
      }
      float fbm(vec2 p) {
        float v = 0.0, a = 0.5, s = 0.0;
        for (int i = 0; i < 6; i++) {
          v += a * cnoise(p);
          s += a;
          p = p * 2.02 + 19.1;
          a *= 0.55;
        }
        return v / s;
      }

      void main() {
        vec2 q = vWorld.xz * 1.05e-4 + vec2(uTime * 0.0021, uTime * 0.0012);
        vec2 warp = vec2(cnoise(q * 2.6 + 4.7), cnoise(q * 2.2 + 9.3)) - 0.5;
        float n = fbm(q + warp * 0.45);
        float th = mix(0.74, 0.07, uCover);
        float body = smoothstep(th, th + 0.18, n);
        float wisp = smoothstep(th - 0.12, th + 0.3, n) * 0.35;
        float a = max(body, wisp);
        if (a < 0.01) discard;
        float depth = smoothstep(th, th + 0.45, n);
        vec3 col = mix(uLight, uShade, depth * (0.5 + uDark * 0.5));
        col = atmoApply(col, uAtmoFogColor, vWorld, cameraPosition);
        vec2 e = abs(vWorld.xz) / (uHalfExtent * 0.94);
        float edge = 1.0 - smoothstep(0.72, 1.0, max(e.x, e.y));
        gl_FragColor = vec4(col, min(a, 0.96) * edge);
      }
    `});o.toneMapped=!1;let s=new _i(a,o);return s.position.y=4600,s.renderOrder=1,s.frustumCulled=!1,s}function xD(e){let t=6e3,n=new Float32Array(t*4);for(let e=0;e<n.length;e++)n[e]=Math.random();let r=new kr;r.setAttribute(`position`,new hr(new Float32Array(t*3),3)),r.setAttribute(`aRand`,new hr(n,4));let i=new mo({transparent:!0,depthWrite:!1,uniforms:{uTime:e,uSnowMix:{value:0},uIntensity:{value:0},uColor:{value:new W(.8,.85,.9)},uTexRain:{value:SD()},uTexSnow:{value:CD()}},vertexShader:`
      attribute vec4 aRand;
      uniform float uTime, uSnowMix, uIntensity;
      varying float vFade;
      void main() {
        vec3 box = vec3(120.0, 80.0, 120.0);
        float fall = mix(14.0, 1.7, uSnowMix);
        vec3 off = vec3(
          uTime * 1.3 + uSnowMix * sin(uTime * 0.8 + aRand.w * 6.283) * 5.0,
          -fall * uTime * (0.8 + 0.4 * aRand.w),
          uTime * 0.6 + uSnowMix * cos(uTime * 0.66 + aRand.w * 6.283) * 5.0
        );
        vec3 local = mod(aRand.xyz * box + off, box) - 0.5 * box;
        vec4 mv = viewMatrix * vec4(cameraPosition + local, 1.0);
        gl_Position = projectionMatrix * mv;
        float d = max(-mv.z, 3.0);
        gl_PointSize = clamp(mix(0.55, 0.12, uSnowMix) * (1.0 + aRand.w * 0.6) * 640.0 / d, 1.0, 42.0);
        vFade = (1.0 - smoothstep(0.7, 1.0, length(local.xz) / 60.0)) * uIntensity * smoothstep(2.0, 7.0, d);
      }
    `,fragmentShader:`
      uniform float uSnowMix;
      uniform vec3 uColor;
      uniform sampler2D uTexRain, uTexSnow;
      varying float vFade;
      void main() {
        vec4 t = mix(texture2D(uTexRain, gl_PointCoord), texture2D(uTexSnow, gl_PointCoord), uSnowMix);
        float a = t.a * vFade * mix(0.34, 0.85, uSnowMix);
        if (a < 0.01) discard;
        gl_FragColor = vec4(uColor, a);
      }
    `});i.toneMapped=!1;let a=new na(r,i);return a.frustumCulled=!1,a.renderOrder=4,a.visible=!1,a}function SD(){let e=document.createElement(`canvas`);e.width=e.height=32;let t=e.getContext(`2d`),n=t.createLinearGradient(0,0,0,32);return n.addColorStop(0,`rgba(255,255,255,0)`),n.addColorStop(.4,`rgba(255,255,255,0.9)`),n.addColorStop(1,`rgba(255,255,255,0)`),t.fillStyle=n,t.fillRect(13,0,6,32),new aa(e)}function CD(){let e=document.createElement(`canvas`);e.width=e.height=32;let t=e.getContext(`2d`),n=t.createRadialGradient(16,16,0,16,16,15);return n.addColorStop(0,`rgba(255,255,255,1)`),n.addColorStop(.55,`rgba(255,255,255,0.7)`),n.addColorStop(1,`rgba(255,255,255,0)`),t.fillStyle=n,t.fillRect(0,0,32,32),new aa(e)}var wD=[`N`,`NE`,`E`,`SE`,`S`,`SW`,`W`,`NW`],TD=new H;function ED(e){return e.getWorldDirection(TD),(Math.atan2(TD.x,-TD.z)*180/Math.PI+360)%360}function DD(e){return wD[Math.round(e/45)%8]}function OD(e){return e.getWorldDirection(TD),Math.asin(Ot.clamp(TD.y,-1,1))*180/Math.PI}function kD(e,t,n=new H){let r=e*Math.PI/180,i=t*Math.PI/180,a=Math.cos(i);return n.set(Math.sin(r)*a,Math.sin(i),-Math.cos(r)*a)}function AD(e,t,n){let r=null,i=1/0;for(let a of n){let n=a.local.x-e,o=a.local.z-t,s=n*n+o*o;s<i&&(i=s,r=a)}return r?{poi:r,distanceM:Math.sqrt(i)}:null}var jD=new ln(0,0,0,`YXZ`),MD=new H,ND={type:`change`},PD={type:`lock`},FD={type:`unlock`},ID=.002,LD=Math.PI/2,RD=class extends Ms{constructor(e,t=null){super(e,t),this.isLocked=!1,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.pointerSpeed=1,this._onMouseMove=zD.bind(this),this._onPointerlockChange=BD.bind(this),this._onPointerlockError=VD.bind(this),this.domElement!==null&&this.connect(this.domElement)}connect(e){super.connect(e),this.domElement.ownerDocument.addEventListener(`mousemove`,this._onMouseMove),this.domElement.ownerDocument.addEventListener(`pointerlockchange`,this._onPointerlockChange),this.domElement.ownerDocument.addEventListener(`pointerlockerror`,this._onPointerlockError)}disconnect(){this.domElement.ownerDocument.removeEventListener(`mousemove`,this._onMouseMove),this.domElement.ownerDocument.removeEventListener(`pointerlockchange`,this._onPointerlockChange),this.domElement.ownerDocument.removeEventListener(`pointerlockerror`,this._onPointerlockError)}dispose(){this.disconnect()}getDirection(e){return e.set(0,0,-1).applyQuaternion(this.object.quaternion)}moveForward(e){if(this.enabled===!1)return;let t=this.object;MD.setFromMatrixColumn(t.matrix,0),MD.crossVectors(t.up,MD),t.position.addScaledVector(MD,e)}moveRight(e){if(this.enabled===!1)return;let t=this.object;MD.setFromMatrixColumn(t.matrix,0),t.position.addScaledVector(MD,e)}lock(e=!1){this.domElement.requestPointerLock({unadjustedMovement:e})}unlock(){this.domElement.ownerDocument.exitPointerLock()}};function zD(e){if(this.enabled===!1||this.isLocked===!1)return;let t=this.object;jD.setFromQuaternion(t.quaternion),jD.y-=e.movementX*ID*this.pointerSpeed,jD.x-=e.movementY*ID*this.pointerSpeed,jD.x=Math.max(LD-this.maxPolarAngle,Math.min(LD-this.minPolarAngle,jD.x)),t.quaternion.setFromEuler(jD),this.dispatchEvent(ND)}function BD(){this.domElement.ownerDocument.pointerLockElement===this.domElement?(this.dispatchEvent(PD),this.isLocked=!0):(this.dispatchEvent(FD),this.isLocked=!1)}function VD(){console.error(`THREE.PointerLockControls: Unable to use Pointer Lock API`)}var HD=1.7,UD=4,WD=60,GD=2.5,KD=Math.PI/3,qD=.002,JD=.045,YD=Math.PI/2-.002,XD=120,ZD=8,QD=.5,$D=class{constructor(e=3){this._windowS=e,this._current=0,this._previous=0,this._age=0}add(e){e>this._current&&(this._current=e)}tick(e){this._age+=e,this._age>=this._windowS&&(this._age=0,this._previous=this._current,this._current=0)}get value(){return Math.max(this._current,this._previous)}},eO=new Set([`KeyW`,`KeyA`,`KeyS`,`KeyD`,`KeyQ`,`KeyE`,`Space`,`KeyC`,`ShiftLeft`,`ShiftRight`]),tO=new H(0,1,0),nO=.5,rO=class{constructor(e,t){this.camera=e,this.domElement=t,this.mode=`walk`,this._enabled=!0,this.getGroundHeight=null,this.getFade=null,this.travelMps=0,this.plc=new RD(e,t),this.plc.pointerSpeed=0,this._keys=new Set,this._dir=new H,this._euler=new ln(0,0,0,`YXZ`),this._pendingYaw=0,this._pendingPitch=0,this.lookDiag={eventPx:new $D,eventsPerFrame:new $D,frameMs:new $D,stepDeg:new $D,spikePx:new $D},this._eventsSinceFrame=0,this._typicalPx=0,this._spikesRejected=0,t.addEventListener(`click`,()=>{document.pointerLockElement!==t&&t.requestPointerLock()}),t.ownerDocument.addEventListener(`mousemove`,e=>{if(!this._enabled||!this.plc.isLocked)return;let t=Math.hypot(e.movementX,e.movementY);if(this.lookDiag.eventPx.add(t),this._eventsSinceFrame+=1,t>Math.max(XD,ZD*this._typicalPx)){this._spikesRejected+=1,this.lookDiag.spikePx.add(t);return}this._typicalPx+=(t-this._typicalPx)*.25,this._pendingYaw-=e.movementX*qD,this._pendingPitch-=e.movementY*qD}),window.addEventListener(`keydown`,e=>{if(!aO(document.activeElement)){if(e.code===`KeyF`){e.preventDefault(),this.mode=this.mode===`walk`?`fly`:`walk`;return}eO.has(e.code)&&(e.preventDefault(),this._keys.add(e.code))}}),window.addEventListener(`keyup`,e=>this._keys.delete(e.code))}get locked(){return this.plc.isLocked}get spikesRejected(){return this._spikesRejected}get enabled(){return this._enabled}set enabled(e){this._enabled=e,this.plc.enabled=e,this._pendingYaw=0,this._pendingPitch=0}_applyLook(e){if(this._pendingYaw===0&&this._pendingPitch===0)return;let t=1-Math.exp(-e/JD),n=this._pendingYaw*t,r=this._pendingPitch*t;this._pendingYaw-=n,this._pendingPitch-=r,this._euler.setFromQuaternion(this.camera.quaternion);let i=this._euler.x;this._euler.y+=n,this._euler.x=Math.max(-YD,Math.min(YD,this._euler.x+r)),this.camera.quaternion.setFromEuler(this._euler),this.lookDiag.stepDeg.add(Math.abs(this._euler.x-i)*180/Math.PI),Math.abs(this._pendingYaw)<1e-5&&(this._pendingYaw=0),Math.abs(this._pendingPitch)<1e-5&&(this._pendingPitch=0)}update(e){this.travelMps=0,this.lookDiag.frameMs.add(e*1e3),this.lookDiag.eventsPerFrame.add(this._eventsSinceFrame),this._eventsSinceFrame=0;for(let t of Object.values(this.lookDiag))t.tick(e);if(this._typicalPx*=Math.exp(-e/QD),!this.enabled)return;this._applyLook(e);let t=this._keys.has(`ShiftLeft`)||this._keys.has(`ShiftRight`)?GD:1,n=(this.mode===`walk`?UD:WD)*t*e,r=!!this._keys.has(`KeyA`)-+!!this._keys.has(`KeyD`);r!==0&&this.camera.rotateOnWorldAxis(tO,r*KD*e);let i=!!this._keys.has(`KeyE`)-+!!this._keys.has(`KeyQ`),a=!!this._keys.has(`KeyW`)-+!!this._keys.has(`KeyS`),o=Math.hypot(i,a)||1;i/=o,a/=o;let s=this.camera.position.x,c=this.camera.position.z;if(this.mode===`fly`)this.plc.getDirection(this._dir),this.camera.position.addScaledVector(this._dir,a*n),this.plc.moveRight(i*n),this._keys.has(`Space`)&&(this.camera.position.y+=n),this._keys.has(`KeyC`)&&(this.camera.position.y-=n);else{this.plc.moveForward(a*n),this.plc.moveRight(i*n);let e=this.getGroundHeight?.(this.camera.position.x,this.camera.position.z);e!=null&&(this.camera.position.y=e+HD)}if(this.getFade&&this.getFade(this.camera.position.x,this.camera.position.z)>nO){let e=this.camera.position.x,t=this.camera.position.z;if(this.getFade(e,c)<=nO?this.camera.position.z=c:this.getFade(s,t)<=nO?this.camera.position.x=s:(this.camera.position.x=s,this.camera.position.z=c),this.mode===`walk`){let e=this.getGroundHeight?.(this.camera.position.x,this.camera.position.z);e!=null&&(this.camera.position.y=e+HD)}}e>1e-4&&(this.travelMps=Math.hypot(this.camera.position.x-s,this.camera.position.z-c)/e)}},iO=new Set([`text`,`search`,`url`,`email`,`tel`,`password`,`number`,`date`,`time`,`datetime-local`,`month`,`week`]);function aO(e){return e?e.isContentEditable||e.tagName===`TEXTAREA`?!0:e.tagName===`INPUT`&&iO.has(e.type):!1}var oO=1,sO=`pngp.viewer.v${oO}`,cO=5,lO=[`walk`,`fly`];function uO(e){let t=Number(e);return Number.isFinite(t)?t:null}function dO(e){return(e%360+360)%360}function fO(e,t,n){return Math.min(n,Math.max(t,e))}function pO(e){if(!e||typeof e!=`object`)return null;let t=uO(e.lat),n=uO(e.lon),r=uO(e.alt),i=uO(e.heading),a=uO(e.pitch);if(t==null||n==null||r==null||i==null||a==null||Math.abs(t)>90||Math.abs(n)>180)return null;let o=uO(e.time),s={lat:t,lon:n,alt:fO(r,-500,2e4),heading:dO(i),pitch:fO(a,-90,90),mode:lO.includes(e.mode)?e.mode:`walk`,time:o==null?null:fO(o,0,1),sky:mD.includes(e.sky)?e.sky:null,ortho:typeof e.ortho==`boolean`?e.ortho:null};typeof e.sound==`boolean`&&(s.sound=e.sound);let c=uO(e.terrain);c!=null&&(s.terrain=fO(Math.round(c),0,9));let l=uO(e.models);l!=null&&(s.models=fO(Math.round(l),0,1));let u=uO(e.cover);return u!=null&&(s.cover=fO(u,0,1)),s}function mO(e){let t=pO(e);if(!t)return``;let n=[`at=${t.lat.toFixed(cO)},${t.lon.toFixed(cO)},${Math.round(t.alt)}`,`look=${Math.round(t.heading)},${Math.round(t.pitch)}`,`mode=${t.mode}`];return t.time!=null&&n.push(`time=${t.time.toFixed(3)}`),t.sky&&n.push(`sky=${t.sky}`),t.ortho!=null&&n.push(`ortho=${+!!t.ortho}`),`#${n.join(`&`)}`}function hO(e){if(!e||typeof e!=`string`)return null;let t=new URLSearchParams(e.replace(/^#/,``)),n=(t.get(`at`)??``).split(`,`),r=(t.get(`look`)??``).split(`,`);return n.length<3?null:pO({lat:n[0],lon:n[1],alt:n[2],heading:r[0]??0,pitch:r[1]??0,mode:t.get(`mode`)??`walk`,time:t.get(`time`),sky:t.get(`sky`),ortho:t.has(`ortho`)?t.get(`ortho`)===`1`:null})}function gO(){try{let e=localStorage.getItem(sO);if(!e)return null;let t=JSON.parse(e);if(t?.v!==oO)return null;let n=pO(t.state);return n||vO(),n}catch{return null}}function _O(e){let t=pO(e);if(!t)return!1;try{return localStorage.setItem(sO,JSON.stringify({v:oO,state:t})),!0}catch{return!1}}function vO(){try{return localStorage.removeItem(sO),!0}catch{return!1}}ty(),uD();function yO(e,t){let n=document.createElement(`div`);n.id=`fatal`,n.style.cssText=`position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:#12161c;color:#e8eaed;font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:32px`;let r=document.createElement(`div`);r.style.cssText=`max-width:46em`;let i=document.createElement(`p`);i.style.cssText=`font-size:1.25em;font-weight:600;margin:0 0 .6em`,i.textContent=e;let a=document.createElement(`p`);a.style.cssText=`margin:0 0 1em;color:#aab2bd`,a.textContent=`Hardware acceleration is usually the cause: it may be switched off, the graphics driver may have failed, or the browser may be running without access to a GPU. Restarting the browser fixes it more often than anything else.`;let o=document.createElement(`pre`);o.style.cssText=`margin:0;padding:.8em 1em;background:#0b0e12;border-radius:6px;color:#8b94a3;font-size:.85em;white-space:pre-wrap;overflow:auto;max-height:12em`,o.textContent=t,r.append(i,a,o),n.append(r),document.body.append(n)}function bO(){let e=document.createElement(`canvas`),t=``;e.addEventListener(`webglcontextcreationerror`,e=>{t=e.statusMessage??``});let n=null;try{n=e.getContext(`webgl2`)}catch(e){t||=String(e?.message??e)}return n?`A plain WebGL 2 context can be created on this browser, so the failure is in what the renderer asked for on top of it (antialias, or a logarithmic depth buffer).`:t||`The browser gave no reason for the failure.`}var xO=new In;xO.fog=new Fn(10471912,2e4,14e4);var $=new $o(60,window.innerWidth/window.innerHeight,.1,2e5);$.position.set(0,3e3,0);var SO;try{SO=new Xu({antialias:!0,logarithmicDepthBuffer:!0})}catch(e){throw yO(`This viewer needs WebGL 2, and this browser could not start it.`,`${String(e?.message??e)}\n\n${bO()}`),e}SO.setSize(window.innerWidth,window.innerHeight),SO.setPixelRatio(window.devicePixelRatio),SO.toneMapping=4,document.body.appendChild(SO.domElement);var CO=new Fd;CO.setSize(window.innerWidth,window.innerHeight),CO.domElement.style.position=`absolute`,CO.domElement.style.top=`0`,CO.domElement.style.pointerEvents=`none`,document.body.appendChild(CO.domElement);var wO=new rO($,SO.domElement),TO=tD(),EO=hO(window.location.hash),DO=gO(),OO=EO??DO;EO&&history.replaceState(null,``,window.location.pathname+window.location.search);var kO=null,AO=new rs(16777215,.5);xO.add(AO);var jO=new ns(16777215,1.5);xO.add(jO);var MO=new Od;MO.scale.setScalar(4e5),xO.add(MO);var NO=new my({renderer:SO,scene:xO,sky:MO,sunLight:jO,ambientLight:AO}),PO=null;document.getElementById(`app-version`).textContent=`v1.0.0`;var FO=document.getElementById(`credits-toggle`),IO=document.getElementById(`credits`);function LO(e){IO.hidden=!e,FO.setAttribute(`aria-expanded`,String(e))}FO.addEventListener(`click`,e=>{e.stopPropagation(),LO(IO.hidden),FO.blur()}),document.addEventListener(`click`,e=>{!IO.hidden&&!e.target.closest(`#credits-box`)&&LO(!1)}),window.addEventListener(`keydown`,e=>{e.code===`Escape`&&LO(!1)});var RO={},zO=[`dem`,`demLiability`,`basemap`,`ortho`,`trails`,`osm`,`modified`];function BO(){document.getElementById(`credits`).innerHTML=zO.filter(e=>RO[e]).map(e=>RO[e]).join(`<br>`)}RO.modified=`Elevation and trail data adapted from the sources above: cropped to the park area, resampled, and merged from multiple datasets.`,RO.ortho=`Orthophoto 2024 © Regione Autonoma Valle d'Aosta (<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>, <a href="data/ortho/CC_BY_Ortofoto_2024.pdf" target="_blank" rel="noopener">licence</a>) - resampled from 20 cm to 2 m and re-encoded, shown only where you ask for it.`;var VO=!1,HO=null,UO=null,WO=Db().then(e=>{let{object:t,manifest:n,sampleRenderedHeight:r,update:i}=e;UO=e,xO.add(t),HO=i,HO($),VO=!0,wO.getGroundHeight=r,TO.setSamplers({sampleGroundHeight:r});let a=n.source.sources.filter(e=>e.attribution);if(a.length){let e=e=>e.attribution.replace(/\s*[-–]\s*CC BY 4\.0\.?$/i,``),t=e=>/^CC BY 4\.0$/i.test(e.license??``),r=[],i=a.filter(t);i.length&&r.push(`${i.map(e).join(` `)} <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>`);for(let n of a.filter(e=>!t(e)))r.push(n.licenseUrl?`${e(n)} (<a href="${n.licenseUrl}" target="_blank" rel="noopener">licence</a>)`:e(n));RO.dem=r.join(`<br>`);let o=n.source.sources.map(e=>e.liabilityNotice).filter(Boolean);o.length&&(RO.demLiability=o.join(` `)),BO()}let{xmin:o,ymin:s,xmax:c,ymax:l}=n.bboxCrsUnits;return kO={x:(c-o)/2,z:(l-s)/2},PO=new yD(xO,{worldWidth:c-o,worldDepth:l-s}),NO.weather=PO,e}),GO=by().catch(e=>(console.warn(`Forest mask unavailable - continuing without trees:`,e.message),null)),KO=Cy().catch(e=>(console.warn(`Glacier mask unavailable - the ice will not be painted:`,e.message),null));Hy(void 0,{maxTextureSize:SO.capabilities.maxTextureSize}).then(({manifest:e,level:t})=>{RO.basemap=`${e.source.attribution} (<a href="${e.source.licenseUrl}" target="_blank" rel="noopener">legal notice</a>)`,BO()}).catch(e=>{console.warn(`Satellite basemap unavailable - drawing the procedural ground:`,e.message)});var qO=IC().catch(e=>(console.warn(`Landcover mask unavailable - continuing without grass or shrubs:`,e.message),null));Qy().catch(e=>(console.warn(`Outer-ring field unavailable - no edge fade, no boundary:`,e.message),null)).then(e=>{e&&(wO.getFade=Zy(e))});var JO=null,YO=null,XO=null,ZO=null,QO=null;Promise.all([WO,GO]).then(async([e,t])=>{let n=t?yy({manifest:t.manifest,texture:t.texture}):()=>0;t&&(YO=MC({manifest:e.manifest,heightTexture:e.heightTexture}),xO.add(YO.object),YO.applyDetail(),JO=UT({sampleGroundHeight:e.sampleRenderedHeight,canopyAt:n,onAlarm:e=>TO.call(e)}),xO.add(JO.object));let r=await qO;if(r){ZO=Pw({manifest:e.manifest,heightTexture:e.heightTexture}),xO.add(ZO.object),Lk();let t=FC({manifest:r.manifest,texture:r.texture}),n=await KO,i=n?yy({manifest:n.manifest,texture:n.texture}):()=>0;QO=rT({sampleGroundHeight:e.sampleRenderedHeight,coverAt:t,iceAt:i}),xO.add(QO.object)}TO.setSamplers({canopyAt:n});let i=await lk.catch(()=>null);XO=mE({sampleGroundHeight:e.sampleRenderedHeight,canopyAt:n,pois:i?.manifest.pois??[],onCall:e=>TO.call(e)}),xO.add(XO.object)});var $O=null,ek=Nx().then(e=>(xO.add(e.group),$O=e,RO.trails=`${e.manifest.source.attribution} <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">${e.manifest.source.license}</a>`,BO(),e)),tk=15,nk=1.2,rk=null;function ik(e){let t=wO.getGroundHeight?.(e.local.x,e.local.z)??e.elevationM,n=new H(e.local.x,t,e.local.z),r=$.position.clone().sub(n);r.y=0,r.lengthSq()<1&&r.set(0,0,1),r.normalize();let i=n.clone().addScaledVector(r,tk);i.y=(wO.getGroundHeight?.(i.x,i.z)??n.y)+HD,rk={startPos:$.position.clone(),endPos:i,lookAt:n.clone(),t:0},wO.enabled=!1}function ak(e){document.getElementById(`poi-info`).innerHTML=Wx(e),document.getElementById(`poi-info`).style.display=`block`,ik(e)}var ok=null,sk=null,ck=null,lk=Hx(void 0,{onSelect:ak}).then(e=>{ok=e,xO.add(e.group),RO.osm=`${e.manifest.source.attribution} <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">${e.manifest.source.license}</a>`,BO();let t=new Map(e.searchEntries.map(e=>[e.label,e.poi])),n=document.getElementById(`poi-search-list`);for(let{label:t}of e.searchEntries){let e=document.createElement(`option`);e.value=t,n.appendChild(e)}let r=document.getElementById(`poi-search-input`);return r.addEventListener(`focus`,()=>{document.pointerLockElement&&document.exitPointerLock()}),r.addEventListener(`input`,()=>{let e=t.get(r.value);e&&(ak(e),r.value=``,r.blur())}),e});function uk(){let e=wO.getGroundHeight,t=ok?.manifest.pois;if(!e||!t?.length)return!1;let n=t.find(e=>e.name===`Le Pont`&&e.category===`trailhead`)??t.find(e=>e.category===`trailhead`)??t.find(e=>e.name===`Gran Paradiso`)??t[0];if(!n)return!1;let r=t.find(e=>e.name===`Gran Paradiso`)??n,i=new V(r.local.x-n.local.x,r.local.z-n.local.z);i.lengthSq()<1&&i.set(0,1),i.normalize();let a=n.local.x-i.x*20,o=n.local.z-i.y*20,s=e(a,o)+HD;return $.position.set(a,s,o),$.lookAt(a+i.x*400,s,o+i.y*400),wO.mode=`walk`,!0}var dk=new H;function fk(){if(!VO)return null;let{lat:e,lon:t}=Fv($.position.x,$.position.z);return{lat:e,lon:t,alt:$.position.y,heading:ED($),pitch:OD($),mode:wO.mode,time:NO.fraction,sky:PO?PO.current:null,ortho:Bk?Bk.checked:null,sound:TO.enabled,terrain:Dk?Number(Dk.value):null,models:Rk?Number(Rk.value):null,cover:Ik?Number(Ik.value):null}}function pk(e){if(!e)return!1;let t=wO.getGroundHeight;if(!t||!kO)return!1;let n;try{n=Iv(e.lat,e.lon)}catch{return!1}if(Math.abs(n.x)>kO.x||Math.abs(n.z)>kO.z)return!1;let r=t(n.x,n.z);if(!Number.isFinite(r))return!1;wO.mode=e.mode;let i=e.mode===`fly`?Math.max(e.alt,r+2):r+HD;if($.position.set(n.x,i,n.z),kD(e.heading,e.pitch,dk),$.lookAt($.position.x+dk.x*100,$.position.y+dk.y*100,$.position.z+dk.z*100),e.time!=null&&(NO.setTime(e.time),wk.value=String(e.time),Tk.textContent=NO.label),e.sky&&PO){let t=mD.indexOf(e.sky);t>=0&&(PO.set(t),Ek.value=String(t))}return!0}var mk=2,hk=0,gk=``,_k=!1;function vk(e,t){if(!e||t==null)return!1;let n=String(t);return[...e.options].some(e=>e.value===n)?(e.value=n,!0):!1}function yk(){if(!_k)return;let e=fk();if(!e)return;let t=`${mO(e)}&s=${+!!e.sound}&t=${e.terrain}&m=${e.models}&c=${e.cover}`;t!==gk&&(gk=t,_O(e))}document.addEventListener(`visibilitychange`,()=>{document.visibilityState===`hidden`&&yk()}),window.addEventListener(`pagehide`,yk),Promise.all([WO,lk,ek]).then(([{sampleRenderedHeight:e},t,n])=>{t.alignToGround(e),n.alignToGround(e),sk=yS({pois:t.manifest.pois.filter(e=>e.category===`hut`),sampleHeight:e}),xO.add(sk.group),sk.update($),Sk({name:`huts`,alignToGround:sk.alignToGround}),ck=kS({pois:t.manifest.pois,sampleHeight:e}),xO.add(ck.group),Sk({name:`summit-monuments`,alignToGround:ck.alignToGround}),t.setBuildingProbe(sk.hasBuilding),zk(),Sk({name:`poi`,alignToGround:t.alignToGround}),Sk({name:`trails`,alignToGround:n.alignToGround}),Nk(),pk(OO)||uk(),OO=null,_k=!0,yk()});var bk=null,xk=[];function Sk(e){if(xk.push(e),UO)try{e.alignToGround(UO.sampleRenderedHeight)}catch(t){console.error(`Could not seat ${e.name} on the drawn surface:`,t.message)}}var Ck=null;oC().then(e=>{let{group:t,manifest:n,alignToGround:r}=e;Ck=e,xO.add(t),Sk({name:`roads`,alignToGround:r}),RO.osm=`${n.source.attribution} <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">${n.source.license}</a>`,BO()}),tC().then(({group:e,manifest:t,update:n,alignToGround:r})=>{xO.add(e),bk=n,Sk({name:`water`,alignToGround:r}),TO.setWater(t),RO.osm=`${t.source.attribution} <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">${t.source.license}</a>`,BO()}),SO.domElement.addEventListener(`click`,()=>{document.getElementById(`poi-info`).style.display=`none`,TO.enabled&&TO.start()}),window.addEventListener(`keydown`,e=>{e.code!==`KeyO`||e.metaKey||e.ctrlKey||e.altKey||aO(document.activeElement)||Hk(!Bk.checked)}),window.addEventListener(`resize`,()=>{$.aspect=window.innerWidth/window.innerHeight,$.updateProjectionMatrix(),SO.setSize(window.innerWidth,window.innerHeight),CO.setSize(window.innerWidth,window.innerHeight),Ck?.setResolution(window.innerWidth,window.innerHeight),$O?.setResolution(window.innerWidth,window.innerHeight)});var wk=document.getElementById(`env-time`),Tk=document.getElementById(`env-time-label`);wk.addEventListener(`input`,()=>{NO.setTime(Number(wk.value)),Tk.textContent=NO.label}),Tk.textContent=NO.label;var Ek=document.getElementById(`env-weather`);Ek.addEventListener(`change`,()=>{PO?.set(Number(Ek.value))});var Dk=document.getElementById(`env-terrain`),Ok=.5,kk=0,Ak=0,jk=null;function Mk(e){if(Ak=e,kk===e)return Promise.resolve();let t=jk,n=new Promise(e=>{jk=e});return t?.(),n}function Nk(){if(!UO)return;let e=UO.sampleRenderedHeight;for(let t of xk)try{t.alignToGround(e)}catch(e){console.error(`Could not re-seat ${t.name} on the drawn surface:`,e.message)}}function Pk(e){if(!UO||kk===Ak)return;let t=e/Ok,n=Ak-kk;kk+=Math.sign(n)*Math.min(t,Math.abs(n)),UO.setHeightTierMix(kk),Nk(),kk===Ak&&(jk?.(),jk=null)}async function Fk(){if(!Dk)return;let e=Number(Dk.value);if(!e){await Mk(0);return}let t=e-1,n=UO?.heightTierLevel?.()??-1;Dk.disabled=!0;try{n>=0&&n!==t&&kk>0&&await Mk(0),await UO?.loadHeightTier(t)?await Mk(1):Dk.value=`0`}catch(e){console.error(`The high-resolution terrain failed to load:`,e.message),Dk.value=`0`}finally{Dk.disabled=!1}}if(Dk){Dk.addEventListener(`change`,()=>{Fk()});let e=async()=>{let e=UO?.manifest?.resolutionMPerPx?.x,t=await(UO?.heightTierManifest?.()??null);for(let n of Dk.options){let r=n.dataset.name,i=Number(n.value)-1;if(i<0){e&&(n.textContent=`${r} · ${e.toFixed(1)} m`);continue}let a=t?.levels?.[i];if(!a){n.disabled=!0,n.textContent=`${r} · unavailable`;continue}let o=a.file.gzipBytes/1048576;n.textContent=`${r} · ${a.resolutionMPerPx.x.toFixed(0)} m · ${o<10?o.toFixed(1):o.toFixed(0)} MB`}};vk(Dk,DO?.terrain),WO.then(()=>{e(),requestAnimationFrame(()=>{Fk()})})}var Ik=document.getElementById(`env-groundcover`);function Lk(){Ew.value=Number(Ik.value),ZO?.applyDensity()}Ik.addEventListener(`change`,Lk),vk(Ik,DO?.cover),Ew.value=Number(Ik.value);var Rk=document.getElementById(`env-models`);function zk(){Jx(Number(Rk.value)),YO?.applyDetail(),sk?.applyDetail(),ck?.applyDetail()}Rk.addEventListener(`change`,zk),vk(Rk,DO?.models),zk();var Bk=document.getElementById(`env-ortho`),Vk=null;async function Hk(e){if(Bk.checked=e,!e){$u.value=0;return}if(Vk??=await Td(void 0,UO?.manifest?.localOrigin).catch(()=>null),!Vk){Bk.checked=!1;return}$u.value=1,await Ed($.position.x,$.position.z)}Bk.addEventListener(`change`,()=>{Hk(Bk.checked),Bk.blur()});var Uk=document.getElementById(`env-audio`);function Wk(e){TO.setEnabled(e),Uk.checked=e}Uk.addEventListener(`change`,()=>{Wk(Uk.checked),Uk.blur()}),window.addEventListener(`keydown`,e=>{e.code===`KeyM`&&(aO(document.activeElement)||Wk(!TO.enabled))}),DO&&typeof DO.sound==`boolean`&&Wk(DO.sound),(EO?.ortho??DO?.ortho??!1)&&WO.then(()=>Hk(!0)).catch(()=>{});var Gk=document.getElementById(`copy-link`);Gk.addEventListener(`click`,async e=>{e.stopPropagation(),Gk.blur();let t=fk();if(!t)return;let n=mO(t);history.replaceState(null,``,n);let r=window.location.href,i=!1;try{await navigator.clipboard.writeText(r),i=!0}catch{i=!1}Gk.textContent=i?`link copied`:`link in the address bar`,setTimeout(()=>{Gk.textContent=`copy link`},2e3)});var Kk=document.getElementById(`reset-view`);Kk.addEventListener(`click`,e=>{e.stopPropagation(),Kk.blur(),uk()&&(history.replaceState(null,``,window.location.pathname+window.location.search),yk())});var qk=new ls,Jk=document.getElementById(`fps`),Yk=0,Xk=0,Zk=document.getElementById(`compass-needle`),Qk=document.getElementById(`nav-heading`),$k=document.getElementById(`nav-position`),eA=document.getElementById(`nav-nearest`),tA=document.getElementById(`nav-flower`),nA=0;function rA(e,t){let n=e>=0?`N`:`S`,r=t>=0?`E`:`W`;return`${Math.abs(e).toFixed(4)}°${n}, ${Math.abs(t).toFixed(4)}°${r}`}SO.setAnimationLoop(()=>{if(qk.update(),bk?.(qk.getElapsed()),PO?.update(qk.getDelta(),$),JO?.update(qk.getDelta(),$),YO?.update($),XO?.update(qk.getDelta(),$),NO.applyState(),fD(MO,$.position.y),wy.value=PO?.mod.snow??0,Tw.value=qk.getElapsed(),ww.value=PO?.mod.wind??0,QO?.update($),sk?.update($),Pk(qk.getDelta()),Yk+=1,Xk+=qk.getDelta(),Xk>=.5&&(Jk.textContent=`${Math.round(Yk/Xk)} fps`,Yk=0,Xk=0),hk+=qk.getDelta(),hk>=mk&&(hk=0,yk()),nA+=qk.getDelta(),nA>=.25){nA=0;let e=ED($);Zk.style.transform=`translate(-50%, -100%) rotate(${e}deg)`;let t=OD($);if(Qk.textContent=`${DD(e)} ${Math.round(e)}° · pitch ${t>=0?`+`:`-`}${Math.abs(t).toFixed(0)}°`,VO){let{lat:e,lon:t}=Fv($.position.x,$.position.z),n=wO.getGroundHeight?.($.position.x,$.position.z),r=n==null?``:` · ground ${Math.round(n)} m`;$k.textContent=`${rA(e,t)} · alt ${Math.round($.position.y)} m${r}`}let n=ok&&AD($.position.x,$.position.z,ok.manifest.pois),r=n&&(n.distanceM<1e3?`${Math.round(n.distanceM)} m`:`${(n.distanceM/1e3).toFixed(1)} km`);if(eA.textContent=n?`Near ${n.poi.name} (${r})`:``,tA){let e=QO?.diag;!e||e.nearestM===null?tA.textContent=e?.foundCount?`Edelweiss found: ${e.foundCount}`:``:e.nearestM<=6?tA.textContent=`Edelweiss, right here (${e.foundCount} found)`:tA.textContent=`Edelweiss ${Math.round(e.nearestM)} m away, ${Math.round(e.nearestElevM)} m`+(e.foundCount?` · ${e.foundCount} found`:``)}ok?.updateMarkers($),$O?.updateLabels($)}if(rk){rk.t=Math.min(1,rk.t+qk.getDelta()/nk);let e=1-(1-rk.t)**3;$.position.lerpVectors(rk.startPos,rk.endPos,e),$.lookAt(rk.lookAt),rk.t>=1&&(rk=null,wO.enabled=!0)}wO.update(qk.getDelta()),TO.update(qk.getDelta(),$,PO,NO,wO),HO?.($),$u.value>0&&Ed($.position.x,$.position.z),SO.render(xO,$),CO.render(xO,$)});