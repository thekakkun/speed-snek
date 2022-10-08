function e(e,t){return Math.sqrt((e.x-t.x)**2+(e.y-t.y)**2)}function t(e,t){if("center"in t){const[{x:i,y:n},{x:a,y:h}]=e,{center:{x:r,y:o},radius:d}=t,c=(i-a)**2+(n-h)**2,m=(i-a)*(a-r)+(n-h)*(h-o),l=m**2-c*((a-r)**2+(h-o)**2-d**2);if(l<0)return null;let g;return g=(-m-Math.sqrt(l))/c,s(g)||(g=(-m+Math.sqrt(l))/c,s(g))?{x:g*i+(1-g)*a,y:g*n+(1-g)*h}:null}{const[{x:i,y:n},{x:a,y:h}]=e,[{x:r,y:o},{x:d,y:c}]=t,m=(i-a)*(o-c)-(n-h)*(r-d);if(Math.abs(m)<Number.EPSILON)return null;const l=((i-r)*(o-c)-(n-o)*(r-d))/m;if(!s(l,!0))return null;return s(((i-r)*(n-h)-(n-o)*(i-a))/m,!0)?{x:i+l*(a-i),y:n+l*(h-n)}:null}}function s(e,t=!1,s){const[i,n]=s??[0,1];if(Math.abs(e-i)<1*Number.EPSILON||Math.abs(e-n)<1*Number.EPSILON)return!t;return i<e&&e<n}function i(e,t){return Math.random()*(t-e)+e}class n extends class{constructor(e){this.canvas=e,this.path=[],this.timeStamp=[],this.rawSpeed=0,this.lastEvent="",this.moveHandler=this.moveHandler.bind(this)}moveHandler(e){if(e instanceof PointerEvent){const t={x:e.offsetX,y:e.offsetY};this.path.unshift(t)}else this.lastEvent===e.type&&this.path.length&&this.path.unshift(this.path[0]);this.timeStamp.unshift(e.timeStamp),this.lastEvent=e.type,this.setSpeed()}trim(e){this.path.splice(e),this.timeStamp.splice(e)}setSpeed(t=1){t=Math.min(t,this.path.length-1);let s=0,i=0;for(let n=0;n<t;n++)s+=e(this.path[n],this.path[n+1]),i+=this.timeStamp[n]-this.timeStamp[n+1];this.rawSpeed=0===s||0===i?0:s/i}}{constructor(e){super(e),this.segments=4,this.segLength=50,this.snekWidth=10,this.speed=0,this.segmentPath=[{x:this.canvas.width/2,y:this.canvas.height/2}];for(let e=0;e<this.segments;e++){const t={x:this.segmentPath[e].x,y:this.segmentPath[e].y+this.segLength};this.segmentPath.push(t),this.path.push(t),this.timeStamp.push(0)}}moveHandler(e){super.moveHandler(e),this.calculateSegments(),this.setSpeed()}calculateSegments(){Object.assign(this.segmentPath,this.path,{length:1});let s=this.segmentPath[this.segmentPath.length-1];for(let[i,n]of this.path.entries())if(this.segmentPath.length<=this.segments)for(;this.segLength<e(s,n);){if(s=t([this.path[i-1],n],{center:s,radius:this.segLength}),this.segmentPath.push(s),this.segments<this.segmentPath.length)break}else 2*this.segLength<=e(s,n)&&super.trim(i)}setSpeed(e=1){e=Math.min(e,this.path.length-1),super.setSpeed(e);const t=(this.timeStamp[0]-this.timeStamp[e])/1e3/e,s=1-Math.exp(-t/.5);this.speed=s*this.rawSpeed+(1-s)*this.speed}grow(){this.segments+=1}}class a{constructor(e){this.radius=15,this.canvas=e,this.loc=Object.create({})}place(e,s=30){let n,a;for(;;){if(a=!0,n={x:i(s,this.canvas.width-s),y:i(s,this.canvas.height-s)},void 0===e){this.loc=n;break}for(let i=0;i<e.length-1;i++)if(t([e[i],e[i+1]],{center:n,radius:this.radius+s})){a=!1;break}if(a){Object.assign(this.loc,n);break}}}}function h(){let e,t;const s=parseInt(getComputedStyle(document.getElementById("game")).borderWidth),i=document.documentElement.clientHeight,n=document.documentElement.clientWidth,a=document.getElementById("ui")?.clientHeight;return(i-a)/n<1?(t=Math.min(600,i-a-2*s),e=1.5*t):(e=Math.min(600,n-2*s),t=1.5*e),[e,t]}class r{constructor(e,t,s){this.element=document.getElementById(e),this.context=this.element.getContext("2d"),void 0===t&&(t=this.element.clientWidth),void 0===s&&(s=this.element.clientHeight),this.width=t,this.height=s,this.setSize()}setSize(){this.element.style.width=`${this.width}px`,this.element.style.height=`${this.height}px`,this.element.width=Math.floor(this.width*devicePixelRatio),this.element.height=Math.floor(this.height*devicePixelRatio),this.context.scale(devicePixelRatio,devicePixelRatio)}clear(){this.context.clearRect(0,0,this.width,this.height)}}class o{setParent(e){this.parent=e}getParent(){return this.parent}}class d extends o{children=[];add(e){this.children.push(e),e.setParent(this)}remove(e){const t=this.children.indexOf(e);this.children.splice(t,1),e.setParent(null)}render(){for(const e of this.children)e.render()}}class c extends o{constructor(e,t){super(),this.data=e,this.canvas=t}}class m extends c{constructor(e,t,s,i){super(e,t),this.color=s,this.width=i}render(){const e=this.data,t=this.canvas.context;0!==e.length&&(t.strokeStyle=this.color,t.lineWidth=this.width,t.lineCap="round",t.lineJoin="round",t.beginPath(),t.moveTo(e[0].x,e[0].y),e.forEach((e=>{t.lineTo(e.x,e.y)})),t.stroke())}}class l extends c{constructor(e,t,s,i){super(e,t),this.color=s,this.width=i}render(){const e=this.canvas.context;e.beginPath(),e.strokeStyle=this.color,e.lineWidth=this.width,e.arc(this.data.center.x,this.data.center.y,this.data.radius,0,2*Math.PI),e.stroke()}}class g extends c{constructor(e,t,s){super(e,t),this.color=s}render(){if(this.data.center){const e=this.canvas.context;e.fillStyle=this.color,e.beginPath(),e.arc(this.data.center.x,this.data.center.y,this.data.radius,0,2*Math.PI),e.fill()}}}class p extends c{constructor(e,t){super(e,t),this.barWidth=6,this.margin=3,this.border=parseInt(getComputedStyle(t.element).borderWidth),this.barCount=Math.floor((t.width-this.border)/(this.barWidth+this.margin))}render(){const e=this.data.speedLimit/this.data.maxSpeed,t=this.data.snek.speed/this.data.maxSpeed,s=this.canvas.context;let i;for(let n=0;n<=this.barCount;n++){const a=(this.border+(this.barWidth+this.margin)*n-this.margin)/(this.canvas.width-2*this.border);i=a<e?"#ff3333":a<t?"#fdfffc":"#040406",s.strokeStyle=i,s.lineWidth=this.barWidth,s.lineCap="round",s.lineJoin="round",s.beginPath(),s.moveTo((this.barWidth+this.margin)*n+this.barWidth/2,this.barWidth/2),s.lineTo((this.barWidth+this.margin)*n+this.barWidth/2,this.canvas.height-this.barWidth/2),s.stroke()}}}class u{constructor(){this.score=0;const e=localStorage.getItem("bestScore");this.bestScore=e?Number(e):0,this.speedLimit=0,this.speedIncrement=.05,this.maxSpeed=5,this.showScore(),this.gameCanvas=new r("gameBoard",...h());document.getElementById("ui").style.width=`${this.gameCanvas.width}px`,this.speedCanvas=new r("speedometer",void 0,document.getElementById("score")?.clientHeight??60),this.inputType="mouse",this.snek=new n(this.gameCanvas),this.pellet=new a(this.gameCanvas),this.transitionTo(new y)}transitionTo(e){this.state&&this.state.exit(),this.state=e,this.state.setContext(this),this.state.enter()}increaseScore(){this.score+=1,this.bestScore=Math.max(this.bestScore,this.score),this.speedLimit=Math.min(this.speedLimit+this.speedIncrement,this.maxSpeed),this.snek.grow()}gameLoop(){this.update(),this.render(),this.reqId=requestAnimationFrame((()=>this.gameLoop()))}showScore(){document.getElementById("currentScore").innerHTML=`Score: ${String(this.score).padStart(2," ")}`;document.getElementById("bestScore").innerHTML=`Best: ${String(this.bestScore).padStart(2," ")}`}update(){this.state.update()}render(){this.gameCanvas.clear(),this.speedCanvas.clear(),this.showScore(),this.state.graphics.render(),dispatchEvent(new Event("render"))}}class v{constructor(e=new d){this.graphics=e,this.messageElement=document.getElementById("message")}setContext(e){this.game=e}update(){}}class y extends v{constructor(){super()}enter(){document.getElementById("info").style.display="flex";document.getElementById("startMessage").style.display="block";document.getElementById("endMessage").style.display="none";const e=document.getElementById("startButton");e.addEventListener("click",(()=>{this.game.transitionTo(new x)}),{once:!0}),e.addEventListener("pointerup",(e=>{"touch"===e.pointerType&&(this.game.inputType=e.pointerType)}),{once:!0})}exit(){document.getElementById("info").style.display="none"}}class x extends v{constructor(){super(),this.checkPlayerReady=this.checkPlayerReady.bind(this)}enter(){const e="mouse"===this.game.inputType?"cursor":"finger";this.messageElement.innerText=`${e} on the circle to start`,this.initSpeedGraphics(),this.initGameGraphics();const t=this.game.gameCanvas.element;t.addEventListener("pointerdown",(e=>{t.releasePointerCapture(e.pointerId)})),t.addEventListener("pointermove",this.checkPlayerReady),this.game.gameLoop()}initSpeedGraphics(){const e=new p(this.game,this.game.speedCanvas);this.graphics.add(e)}initGameGraphics(){const e=this.game.snek,t=new d,s=new m(e.segmentPath,this.game.gameCanvas,"#94e34f",e.snekWidth);t.add(s),this.graphics.add(t),this.readyArea={center:{x:this.game.gameCanvas.width/2,y:this.game.gameCanvas.height/2},radius:30},this.readyAreaGraphics=new l(this.readyArea,this.game.gameCanvas,"#ff3333",5),this.graphics.add(this.readyAreaGraphics)}checkPlayerReady(t){const s=this.game.gameCanvas.element.parentElement;e({x:t.x-s.offsetLeft-s.clientLeft,y:t.y-s.offsetTop-s.clientTop},this.readyArea.center)<this.readyArea.radius&&this.game.transitionTo(new f(this.graphics))}exit(){this.game.gameCanvas.element.removeEventListener("pointermove",this.checkPlayerReady),this.graphics.remove(this.readyAreaGraphics)}}class f extends v{constructor(e){super(e),this.startTime=Date.now(),this.notReady=this.notReady.bind(this)}enter(){const e=this.game.gameCanvas.element;e.addEventListener("pointermove",this.game.snek.moveHandler),addEventListener("render",this.game.snek.moveHandler),e.addEventListener("pointerleave",this.notReady,{once:!0})}update(){const e=(Date.now()-this.startTime)/1e3;this.messageElement.innerText=String(3-Math.floor(e)),3<e&&this.game.transitionTo(new S(this.graphics))}notReady(){removeEventListener("render",this.game.snek.moveHandler),this.game.transitionTo(new x)}exit(){this.game.gameCanvas.element.removeEventListener("pointerleave",this.notReady)}}class S extends v{constructor(e){super(e),this.snekLeave=this.snekLeave.bind(this)}enter(){this.game.gameCanvas.element.addEventListener("pointerleave",this.snekLeave),this.messageElement.innerHTML="GO!",setTimeout((()=>{this.messageElement.innerText=""}),1e3);const e=this.game.pellet,t=this.game.snek;e.place(t.segmentPath),this.graphics.add(new g({center:this.game.pellet.loc,radius:this.game.pellet.radius},this.game.gameCanvas,"#49b9e6"))}update(){this.speedCheck(),this.snekPelletCollision(),this.snekSnekCollision()}speedCheck(){this.game.snek.speed<this.game.speedLimit&&(console.log("faster!"),this.game.transitionTo(new k("You were too slow!")))}snekPelletCollision(){this.game.pellet.loc&&2<=this.game.snek.path.length&&t([this.game.snek.path[0],this.game.snek.path[1]],{center:this.game.pellet.loc,radius:this.game.pellet.radius+this.game.snek.snekWidth/2})&&(console.log("nom!"),this.game.increaseScore(),this.game.pellet.place(this.game.snek.segmentPath))}snekLeave(){console.log("whoops!"),this.game.transitionTo(new k("You crashed into a wall!"))}snekSnekCollision(){for(let e=2;e<this.game.snek.segmentPath.length-1;e++)t([this.game.snek.segmentPath[0],this.game.snek.segmentPath[1]],[this.game.snek.segmentPath[e],this.game.snek.segmentPath[e+1]])&&(console.log("ouch!"),this.game.transitionTo(new k("You crashed into yourself!")))}exit(){const e=this.game.gameCanvas.element;e.removeEventListener("pointerleave",this.snekLeave),e.removeEventListener("pointermove",this.game.snek.moveHandler),removeEventListener("render",this.game.snek.moveHandler)}}class k extends v{constructor(e){super(),this.reason=e}enter(){localStorage.setItem("bestScore",String(this.game.bestScore));document.getElementById("reason").innerText=this.reason;document.getElementById("finalScore").innerText=`Score: ${this.game.score}`;document.getElementById("best").innerText=`Best: ${this.game.bestScore}`+(this.game.score===this.game.bestScore?" (NEW BEST!)":"");document.getElementById("info").style.display="flex";document.getElementById("startMessage").style.display="none";document.getElementById("endMessage").style.display="block";document.getElementById("restartButton").addEventListener("click",(()=>{dispatchEvent(new Event("newGame"))}))}exit(){}}let E;addEventListener("load",(()=>{dispatchEvent(new Event("newGame"))}));addEventListener("newGame",(()=>{console.log("==================\n\n🐍 says,\n  💽 See my source code here!\n      https://github.com/thekakkun/speed-snek\n  💸 Like what you see? Donate!\n      https://ko-fi.com/kakkun\n\n=================="),E=new u}));
//# sourceMappingURL=index.474fb9ce.js.map