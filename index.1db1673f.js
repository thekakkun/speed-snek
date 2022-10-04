function e(e,t){return Math.sqrt((e.x-t.x)**2+(e.y-t.y)**2)}function t(e,t){if("center"in t){const[{x:s,y:i},{x:n,y:a}]=e,{center:{x:h,y:r},radius:o}=t,c=(s-n)**2+(i-a)**2,d=(s-n)*(n-h)+(i-a)*(a-r),m=d**2-c*((n-h)**2+(a-r)**2-o**2);if(m<0)return!1;let l;return l=(-d-Math.sqrt(m))/c,0<=l&&l<=1||(l=(-d+Math.sqrt(m))/c),0<=l&&l<=1&&{x:l*s+(1-l)*n,y:l*i+(1-l)*a}}{const[{x:s,y:i},{x:n,y:a}]=e,[{x:h,y:r},{x:o,y:c}]=t,d=((s-h)*(r-c)-(i-r)*(h-o))/((s-n)*(r-c)-(i-a)*(h-o));if(!(0<=d&&d<=1))return!1;const m=((s-h)*(i-a)-(i-r)*(s-n))/((s-n)*(r-c)-(i-a)*(h-o));return 0<=m&&m<=1&&{x:s+d*(n-s),y:i+d*(a-i)}}}function s(e,t){return Math.random()*(t-e)+e}class i extends class{constructor(e){this.canvas=e,this.path=[],this.timeStamp=[],this.rawSpeed=0,this.lastEvent="",this.moveHandler=this.moveHandler.bind(this)}moveHandler(e){if(e instanceof PointerEvent){const t={x:e.x-this.canvas.element.getBoundingClientRect().x,y:e.y-this.canvas.element.getBoundingClientRect().y};this.path.unshift(t),this.timeStamp.unshift(e.timeStamp)}else this.lastEvent===e.type&&this.path.length&&(this.path.unshift(this.path[0]),this.timeStamp.unshift(e.timeStamp));this.lastEvent=e.type}trim(e){this.path.splice(e),this.timeStamp.splice(e)}setSpeed(t=6){(t=Math.min(t,this.path.length-1))<2&&(this.rawSpeed=0);let s=0,i=0;for(let n=0;n<t;n++)s+=e(this.path[n],this.path[n+1]),i+=this.timeStamp[n]-this.timeStamp[n+1];this.rawSpeed=0===s||0===i?0:s/i}}{constructor(e){super(e),this.segments=4,this.segLength=50,this.snekWidth=10,this.speed=0,this.segmentPath=[{x:this.canvas.width/2,y:this.canvas.height/2}];for(let e=0;e<this.segments;e++){const t={x:this.segmentPath[e].x,y:this.segmentPath[e].y+this.segLength};this.segmentPath.push(t)}}moveHandler(e){super.moveHandler(e),this.calculateSegments(),this.setSpeed()}calculateSegments(){Object.assign(this.segmentPath,this.path,{length:1});let s=this.segmentPath[this.segmentPath.length-1];for(let[i,n]of this.path.entries())if(this.segmentPath.length<=this.segments)for(;this.segLength<e(s,n);){if(s=t([this.path[i-1],n],{center:s,radius:this.segLength}),this.segmentPath.push(s),this.segments<this.segmentPath.length)break}else 2*this.segLength<=e(s,n)&&super.trim(i)}setSpeed(e=6){super.setSpeed(e);this.speed=.05*this.rawSpeed+.95*this.speed}grow(){this.segments+=1}}class n{constructor(e){this.radius=15,this.target=e,this.loc=Object.create({})}place(e,i=30){let n,a;for(;;){if(a=!0,n={x:s(i,this.target.clientWidth-i),y:s(i,this.target.clientHeight-i)},0===e.length){this.loc=n;break}for(let s=0;s<e.length-1;s++)if(t([e[s],e[s+1]],{center:n,radius:this.radius+i})){a=!1;break}if(a){Object.assign(this.loc,n);break}}}}function a(){let e,t;const s=parseInt(getComputedStyle(document.getElementById("game")).borderWidth),i=document.documentElement.clientHeight,n=document.documentElement.clientWidth,a=document.getElementById("ui")?.clientHeight;return(i-a)/n<1?(t=Math.min(600,i-a-2*s),e=1.5*t):(e=Math.min(600,n-2*s),t=1.5*e),[e,t]}class h{constructor(e,t,s){this.element=document.getElementById(e),this.context=this.element.getContext("2d"),void 0===t&&(t=this.element.clientWidth),void 0===s&&(s=this.element.clientHeight),this.width=t,this.height=s,this.setSize()}setSize(){this.element.style.width=`${this.width}px`,this.element.style.height=`${this.height}px`,this.element.width=Math.floor(this.width*devicePixelRatio),this.element.height=Math.floor(this.height*devicePixelRatio),this.context.scale(devicePixelRatio,devicePixelRatio)}clear(){this.context.clearRect(0,0,this.width,this.height)}}class r{setParent(e){this.parent=e}getParent(){return this.parent}}class o extends r{children=[];add(e){this.children.push(e),e.setParent(this)}remove(e){const t=this.children.indexOf(e);this.children.splice(t,1),e.setParent(null)}render(){for(const e of this.children)e.render()}}class c extends r{constructor(e,t){super(),this.data=e,this.canvas=t}}class d extends c{constructor(e,t,s,i){super(e,t),this.color=s,this.width=i}render(){const e=this.data,t=this.canvas.context;0!==e.length&&(t.strokeStyle=this.color,t.lineWidth=this.width,t.lineCap="round",t.lineJoin="round",t.beginPath(),t.moveTo(e[0].x,e[0].y),e.forEach((e=>{t.lineTo(e.x,e.y)})),t.stroke())}}class m extends c{constructor(e,t,s,i){super(e,t),this.color=s,this.width=i}render(){const e=this.canvas.context;e.beginPath(),e.strokeStyle=this.color,e.lineWidth=this.width,e.arc(this.data.center.x,this.data.center.y,this.data.radius,0,2*Math.PI),e.stroke()}}class l extends c{constructor(e,t,s){super(e,t),this.color=s}render(){if(this.data.center){const e=this.canvas.context;e.fillStyle=this.color,e.beginPath(),e.arc(this.data.center.x,this.data.center.y,this.data.radius,0,2*Math.PI),e.fill()}}}class g extends c{constructor(e,t){super(e,t)}render(){const e=parseInt(getComputedStyle(this.canvas.element).borderWidth),t=Math.floor((this.canvas.width-e)/8),s=this.data.speedLimit/this.data.maxSpeed,i=this.data.snek.speed/this.data.maxSpeed,n=this.canvas.context;let a;for(let h=0;h<=t;h++)a=(e+8*h-3)/(this.canvas.width-2*e)<s?"#ff3333":(e+8*h-3)/(this.canvas.width-2*e)<i?"#fdfffc":"#040406",n.strokeStyle=a,n.lineWidth=5,n.lineCap="round",n.lineJoin="round",n.beginPath(),n.moveTo(8*h+2.5,3),n.lineTo(8*h+2.5,this.canvas.height-3),n.stroke()}}class p{constructor(){this.score=0;const e=localStorage.getItem("bestScore");this.bestScore=e?Number(e):0,this.speedLimit=0,this.speedIncrement=.05,this.maxSpeed=5,this.showScore(),this.gameCanvas=new h("gameBoard",...a());document.getElementById("ui").style.width=`${this.gameCanvas.width}px`,this.speedCanvas=new h("speedometer",void 0,document.getElementById("score")?.clientHeight??60),this.inputType="mouse",this.snek=new i(this.gameCanvas),this.pellet=new n(this.gameCanvas.element),this.transitionTo(new v)}transitionTo(e){this.state&&this.state.exit(),console.log(`Context: Transition to ${e.constructor.name}.`),this.state=e,this.state.setContext(this),this.state.enter()}increaseScore(){this.score+=1,this.bestScore=Math.max(this.bestScore,this.score),this.speedLimit=Math.min(this.speedLimit+this.speedIncrement,this.maxSpeed),this.snek.grow()}gameLoop(){this.update(),this.render(),this.reqId=requestAnimationFrame((()=>this.gameLoop()))}showScore(){document.getElementById("currentScore").innerHTML=`Score: ${String(this.score).padStart(2," ")}`;document.getElementById("bestScore").innerHTML=`Best: ${String(this.bestScore).padStart(2," ")}`}update(){this.showScore(),this.state.update()}render(){this.gameCanvas.clear(),this.speedCanvas.clear(),this.state.graphics.render(),dispatchEvent(new Event("render"))}}class u{constructor(e=new o){this.graphics=e,this.messageElement=document.getElementById("message")}setContext(e){this.game=e}update(){}}class v extends u{constructor(){super()}enter(){document.getElementById("info").style.display="flex";document.getElementById("startMessage").style.display="block";document.getElementById("endMessage").style.display="none";const e=document.getElementById("startButton");e.addEventListener("click",(e=>{this.game.transitionTo(new y)}),{once:!0}),e.addEventListener("pointerup",(e=>{"touch"===e.pointerType&&(this.game.inputType=e.pointerType)}),{once:!0})}exit(){document.getElementById("info").style.display="none"}}class y extends u{constructor(){super(),this.checkPlayerReady=this.checkPlayerReady.bind(this)}enter(){const e="mouse"===this.game.inputType?"cursor":"finger";this.messageElement.innerText=`${e} on the circle to start`,this.initSpeedGraphics(),this.initGameGraphics();const t=this.game.gameCanvas.element;t.addEventListener("pointerdown",(e=>{t.releasePointerCapture(e.pointerId)})),t.addEventListener("pointermove",this.checkPlayerReady),this.game.gameLoop()}initSpeedGraphics(){const e=new g(this.game,this.game.speedCanvas);this.graphics.add(e)}initGameGraphics(){const e=this.game.snek,t=new o,s=new d(e.segmentPath,this.game.gameCanvas,"#94e34f",e.snekWidth);t.add(s),this.graphics.add(t),this.readyArea={center:{x:this.game.gameCanvas.width/2,y:this.game.gameCanvas.height/2},radius:30},this.readyAreaGraphics=new m(this.readyArea,this.game.gameCanvas,"#ff3333",5),this.graphics.add(this.readyAreaGraphics)}checkPlayerReady(t){const s=this.game.gameCanvas.element.parentElement;e({x:t.x-s.offsetLeft-s.clientLeft,y:t.y-s.offsetTop-s.clientTop},this.readyArea.center)<this.readyArea.radius&&this.game.transitionTo(new x(this.graphics))}exit(){this.game.gameCanvas.element.removeEventListener("pointermove",this.checkPlayerReady),this.graphics.remove(this.readyAreaGraphics)}}class x extends u{constructor(e){super(e),this.startTime=Date.now(),this.notReady=this.notReady.bind(this)}enter(){const e=this.game.gameCanvas.element;e.addEventListener("pointermove",this.game.snek.moveHandler),addEventListener("render",this.game.snek.moveHandler),e.addEventListener("pointerleave",this.notReady,{once:!0})}update(){const e=(Date.now()-this.startTime)/1e3;this.messageElement.innerText=String(3-Math.floor(e)),3<e&&this.game.transitionTo(new f(this.graphics))}notReady(){this.game.gameCanvas.element.removeEventListener("pointermove",this.game.snek.moveHandler),removeEventListener("render",this.game.snek.moveHandler),this.game.transitionTo(new y)}exit(){this.game.gameCanvas.element.removeEventListener("pointerleave",this.notReady)}}class f extends u{constructor(e){super(e),this.snekLeave=this.snekLeave.bind(this)}enter(){this.game.gameCanvas.element.addEventListener("pointerleave",this.snekLeave),this.messageElement.innerHTML="GO!",setTimeout((()=>{this.messageElement.innerText=""}),1e3);const e=this.game.pellet,t=this.game.snek;e.place(t.segmentPath),this.graphics.add(new l({center:this.game.pellet.loc,radius:this.game.pellet.radius},this.game.gameCanvas,"#49b9e6"))}update(){this.speedCheck(),this.snekPelletCollision(),this.snekSnekCollision()}speedCheck(){this.game.snek.speed<this.game.speedLimit&&(console.log("faster!"),this.game.transitionTo(new S("You were too slow!")))}snekPelletCollision(){this.game.pellet.loc&&2<=this.game.snek.segmentPath.length&&t([this.game.snek.segmentPath[0],this.game.snek.segmentPath[1]],{center:this.game.pellet.loc,radius:this.game.pellet.radius+this.game.snek.snekWidth/2})&&(console.log("nom!"),this.game.increaseScore(),this.game.pellet.place(this.game.snek.segmentPath))}snekLeave(){console.log("whoops!"),this.game.transitionTo(new S("You crashed into a wall!"))}snekSnekCollision(){for(let e=2;e<this.game.snek.segmentPath.length-1;e++)t([this.game.snek.segmentPath[0],this.game.snek.segmentPath[1]],[this.game.snek.segmentPath[e],this.game.snek.segmentPath[e+1]])&&(console.log("ouch!"),this.game.transitionTo(new S("You crashed into yourself!")))}exit(){const e=this.game.gameCanvas.element;e.removeEventListener("pointerleave",this.snekLeave),e.removeEventListener("pointermove",this.game.snek.moveHandler),removeEventListener("render",this.game.snek.moveHandler)}}class S extends u{constructor(e){super(),this.reason=e}enter(){localStorage.setItem("bestScore",String(this.game.bestScore));document.getElementById("reason").innerText=this.reason;document.getElementById("finalScore").innerText=`Score: ${this.game.score}`;document.getElementById("best").innerText=`Best: ${this.game.bestScore}`+(this.game.score===this.game.bestScore?" (NEW BEST!)":"");document.getElementById("info").style.display="flex";document.getElementById("startMessage").style.display="none";document.getElementById("endMessage").style.display="block";document.getElementById("restartButton").addEventListener("click",(()=>location.reload()),{once:!0})}exit(){}}addEventListener("load",(()=>{console.log('🐍 says,\n"see my source code here: https://github.com/thekakkun/speed-snek!"');new p}),{once:!0});
//# sourceMappingURL=index.1db1673f.js.map
