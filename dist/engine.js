// Reference shape: WSOP Online top-10%-paid MTT, 251–300 entrants.
// Adapted to user endpoints and pool; this is not an official WSOP payout table.
export function payouts(pool,first,min,paid){
 if(![pool,first,min].every(Number.isFinite)||!Number.isInteger(paid)||paid<1||pool<=0||min<0||first<min)throw Error('賞金の入力を確認してください。');
 if(paid===1){if(Math.abs(pool-first)>.001)throw Error('入賞1人の場合は総額と優勝賞金を一致させてください。');return [pool];}
 const low=first+(paid-1)*min,high=(paid-1)*first+min;
 if(pool<low-.001||pool>high+.001)throw Error('総額・優勝賞金・最低賞金が整合しません。最低賞金または総額を調整してください。');
 if(paid===2){if(Math.abs(pool-first-min)>.001)throw Error('入賞2人の場合は総額を優勝賞金＋最低賞金に合わせてください。');return [first,min];}
 if(Math.abs(pool-low)<.001)return [first,...Array(paid-1).fill(min)];
 if(Math.abs(pool-high)<.001)return [...Array(paid-1).fill(first),min];
 const band=r=>r<=9?r:r<=15?10:16+5*Math.floor((r-16)/5);
 let bands=Array.from({length:paid},(_,i)=>band(i+1)),last=bands.at(-1),bottom=bands.filter(x=>x===last).length;
 // Retain a final equal-pay band only when compatible with the supplied pool.
 if(pool>first+(paid-1-bottom)*first+bottom*min){bottom=1;bands[paid-1]=Infinity;last=Infinity;}
 let middle=paid-1-bottom;
 let second=Math.max(min,Math.min(first,Math.max(.6*first,(pool-first-bottom*min)/middle)));
 second=Math.min(second,pool-first-(paid-2)*min);
 const ref=[26,15,9.6,7.6,6.6,4.5,3.5,2.6,2.1];
 const weight=r=>r<=9?ref[r-1]:r<=15?1.5:1.0*Math.pow(.8,(r-16)/5);
 const tail=last===Infinity?0:weight(last),top=weight(2);
 const weights=bands.map((r,i)=>i===0?1:r===last?0:Math.max(0,(weight(r)-tail)/(top-tail)));
 function curve(alpha){return weights.map((w,i)=>i===0?first:w===0?min:min+(second-min)*Math.pow(w,alpha));}
 let lo=0,hi=2048;
 for(let k=0;k<100;k++){let a=(lo+hi)/2,total=curve(a).reduce((a,b)=>a+b,0);if(total>pool)lo=a;else hi=a;}
 let p=curve((lo+hi)/2);
 // Cent rounding preserves the pool, endpoints, and descending order.
 const unit=[pool,first,min].every(Number.isInteger)?1:100;
 p=p.map(x=>Math.round(x*unit));let diff=Math.round(pool*unit)-p.reduce((a,b)=>a+b,0);
 const adjust=[...Array.from({length:paid-3},(_,i)=>i+2),1];
 for(let pass=0;diff&&pass<paid*2;pass++)for(let i of adjust){if(!diff)break;let step=Math.sign(diff);if(p[i]+step<=p[i-1]&&p[i]+step>=p[i+1]){p[i]+=step;diff-=step;}}
 if(diff)throw Error('賞金の丸めに失敗しました。金額は小数第2位までにしてください。');
 return p.map(x=>x/unit);
}
export function stacks(n,total,hero,spread=0.8){if(n===1){if(Math.abs(hero-total)>0.1)throw Error('残り1人では自分のスタックと総チップを一致させてください。');return [hero];}if(hero>=total)throw Error('自分のスタックは総チップより小さくしてください。');let w=Array.from({length:n-1},(_,i)=>Math.exp(spread*(2*(i+.5)/(n-1)-1)*1.8)),s=w.reduce((a,b)=>a+b);return [hero,...w.map(x=>x/s*(total-hero))];}
// Exponential races produce the Plackett–Luce / ICM finish order.
export function equity(s,p,iterations=16384){let alive=s.filter(x=>x>0).length;if(!s[0])return {value:p[alive]||0,se:0};if(s.length<=8){let result=0;function visit(left,prob,rank){let sum=left.reduce((a,i)=>a+s[i],0);for(let i of left){let q=prob*s[i]/sum;if(i===0)result+=q*(p[rank]||0);else if(rank+1<p.length)visit(left.filter(j=>j!==i),q,rank+1);}}visit(s.map((_,i)=>i).filter(i=>s[i]>0),1,0);return {value:result,se:0};}let seed=123456789,sum=0,sq=0;function random(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return ((seed>>>0)+.5)/4294967296;}for(let t=0;t<iterations;t++){let h=-Math.log(random())/s[0],rank=0;for(let i=1;i<s.length;i++){let v=-Math.log(random());if(s[i]>0&&v/s[i]<h)rank++;}let v=p[rank]||0;sum+=v;sq+=v*v;}let value=sum/iterations;return {value,se:Math.sqrt(Math.max(0,sq/iterations-value*value)/iterations)};}
export function duel(s,p,index=1){let e=Math.min(s[0],s[index]),win=[...s],lose=[...s];win[0]+=e;win[index]-=e;lose[0]-=e;lose[index]+=e;let base=equity(s,p),up=equity(win,p),down=equity(lose,p),gain=up.value-base.value,loss=base.value-down.value;let bf=gain>0?loss/gain:Infinity,q=loss/(loss+gain);return {bf,q,rp:q-.5,base,win:up.value,lose:down.value,e};}
export const positions={9:['UTG','UTG+1','UTG+2','LJ','HJ','CO','BTN','SB'],6:['LJ','HJ','CO','BTN','SB']};
export function range({table=9,pos='BTN',bb=25,ante=1,rp=0,spread=.8,ratio=1}){let baselines={UTG:.14,'UTG+1':.16,'UTG+2':.18,LJ:.21,HJ:.25,CO:.32,BTN:.47,SB:.52};let target=Math.max(.04,Math.min(.7,baselines[pos]+ante*.025-Math.max(0,rp)*.65+(Math.min(bb,60)-30)*.0006+Math.log2(Math.max(.1,ratio))*.012-spread*.008));let ranks='AKQJT98765432',hands=[];for(let r=0;r<13;r++)for(let c=0;c<13;c++){let high=14-Math.min(r,c),low=14-Math.max(r,c),pair=r===c,suited=r<c;let score=pair?high*4+26:high*2.1+low*.85+(suited?5:0)-Math.max(0,high-low-1)*1.4+(high===14?3:0);hands.push({r,c,label:pair?ranks[r]+ranks[c]:ranks[Math.min(r,c)]+ranks[Math.max(r,c)]+(suited?'s':'o'),score,combos:pair?6:suited?4:12});}let sorted=[...hands].sort((a,b)=>b.score-a.score),count=0;for(let h of sorted){h.action=count<1326*target?(bb<=12?'push':'open'):'fold';if(h.action!=='fold')count+=h.combos;}return {hands,count,pct:count/1326,size:bb<=12?'ALL-IN':pos==='SB'?'2.5 BB':bb<25?'2.0 BB':'2.2 BB'};}
