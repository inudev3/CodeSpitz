const Item = class{ //SetTimeOut구현.
    time; //몇초 후에 실행 될지
    block; // 그 때 실행될 코드(함수)
    constructor(block, time) {
        this.block=block;
        this.time = time+performance.now(); //브라우저가 시작한지 얼마나 지났는지를 보여준다. 나노초까지 보여줌
        //사용자에게 입력받은 시간을 더해서 어떤 시간에 실행될지를 결정
        //콜백 큐에 들어감
    }
}
const queue = new Set(); //콜백 큐 역할
const timeout = (block, time)=>queue.add(new Item(block, time));
const f = time=>{ //check queue 역할
    queue.forEach(item=>{
        if(item.time>time) return;//직접 push 형으로 실시해 준다.
        queue.delete(item);
        item.block();
    })
    requestAnimationFrame(f);
};
requestAnimationFrame(f);
const nbFor = (max,load,block)=> {
    let i =0; //i는 함수 밖의 클로져로 함수가 실행되는 동안 계속 유지
    const f=time=> {//requestAnimationFrame을 호출하기 위해 함수를 만듬, time은 RAF의 time이지만 알아서 실행해주기 때문에 사용하지 않음.
        let curr = load;
        while(curr-- && i<max){
            block();
            i++;
        }
        if(i<max-1) timeout(f, 0); // queue에 time이 0인 block을 넣고 바로 실행됨
    };
timeout(f, 0)
}
const infinity = (function*(){ 제//suspend문법
    let i =0;
    while(true) yield i++;
})(); //이터레이터를 반환에
console.log(infinity.next()); //무한루프에 빠져야 하지만 suspend덕분에 멈춘다. yield는 항상 suspend되어 있기 때문에 직접 next를 다시 호출해야 resume됨

const gene = function*(max,load,block){ //observable 은
    let i =0, curr=load;
    while(i<max){
        if(curr--){
            block();
            i++;
        }else{
            curr=load;
            console.log(i);
            yield;
        }
    }
};
const nbForGene = (max, load, block)=>{
    const iterator = gene(max,load,block); //yield는 이터레이터를 반환함
    const f = _ =>iterator.next().done || timeout(f,0); //이터레이터가 끝났으면(done) timeout호출
    timeout(f,0);
}
const gene2 = function* (max,load,block){
    let i=0;
    while(i<max){
        yield new Promise(resolve=>{
            let curr = load;
            while(curr--&& i<max){
                block();
                i++;
            }
            console.log(i);
            timeout(resolve, 0);
        })
    }
}
const nbForGene2 = (max,load,block)=>{
    const iterator2 = gene2(max,load,block);
    const next = ({value, done})=> done || value.then(v=>next(iterator2.next())); //yield가 Promise를 감싸므로 value가 promise객체이므로 then으로 resolve하면서 다시 재귀로 이터레이터 promise를 호출
    next(iterator2.next()); //제어의 역전 - Promise가 제어함 , 코패턴
}

//3회차
const wrap = block=> new SwitchIterable(block);
const SwitchIterable = class{
    #block;
    constructor(block) {this.#block=block;}
    [Symbol.iterator](){return new SwitchIterable(this.#block);} //Iterator메소드는 Iterator객체를 반환
    }
const SwitchIterator = class{
    static done = {done:true};
    #block;
    #context = new Context;
    constructor(block) {this.#block=block;}
    next(){
        const value = this.#block(this.#context);
        return value === Context.stop? SwitchIterator.done : {value, done:false};
    }
}
const Context= class{
    static stop = Symbol();
    prev =0;
    next=0;
    stop(){return Context.stop;}
}
const gene2= a=>{ //switch를 통해 구현한 generator
    let b;
    return wrap(_context=>{
        while(1){
            switch(_context.prev= _context.next){
                case 0:
                    _context.next = 2;
                    return a;
                case 2:
                    b=a;
                    _context.next = 5;
                    return b;
                case 5:
                case "end":
                return _context.stop();
            }
        }
    })
}

const gene4 =a=>{
    let b;
    return new SeqIterable(
        cont=>{ //continuation
        cont.resume(a);
    }, cont=>{
            b=a;
            cont.resume(b);
        })
}
const SeqIterable = class{
    #blocks;
    constructor(...blocks) {this.#blocks=blocks;}
    [Symbol.iterator](){return new SeqIterator(this.#blocks.slice());} //Iterator가 next로 한번 돌아서 배열이 삭제되지 않도록 복사본 전
}
const SeqIterator = class {
    static done = {done: true};
    #blocks;
    #cont = new Continuation; //하나의 continuation, yield동안 실행되는 동
    constructor(blocks) {
        this.#blocks = blocks;
    }

    next() {
        if (!this.#blocks.length) return SeqIterator.done;
        const cont = this.#cont;
        cont.stop(); //suspend
        this.#blocks.shift()(cont); //block을 하나 앞에서부터 제거하고 그 함수를 cont를 넣어서 실행함
        return cont.isStop() ? SeqIterator.done : {value: cont.value(), done: false}
    } //resume이 일어나면 stop하지 않고 안일어나면 stop
};
const Continuation = class{
    #value;
    static #stop = Symbol(); //es6이후에는 상수값을 만들 때 symbol로 만들면
    resume(value){this.#value = value;}
    stop(){this.#value = Continuation.#stop;}
    isStop(){return this.#value === Continuation.#stop}
    value(){return this.#value;}

}
//위에서, continuation은 서로를 모르고 Iterable과 Iterator가 배열로 다음 continuation과의 관계를 관리하고 있음
//따라서 스스로의 상태의 관리책임이 있도록 continuation이 스스로의 다음 연결상태를 알게 하는 것이 바람직
//상태 자기 책임 원칙 => 데코레이터 페턴이라고 함. 연결리스트가 자기의 다음번 노드를 알고 있는 것
//위와 같은 while(1)의 무한루프를 도는 경우에도 상태가 소진되지 않고 계속되기 위해서는 continuation이 스스로를 알아야함
//외부에서 제어하면 스스로를 알 수 없어 다시 올라가는 기능을 구현할 수 없다.
// 1.특별히 지정하지 ㅇ낳으면 순서대로 내려옴
//
// 2. 첫번째 함수는 값을 반환하지 않음 => 제어문(if,while). continuation.isPass(위로 올라가는 기능)
//
//3. 두번째 함수는 첫번째 함수를 알아야 함=> 돌아가기 위해
//
//4.  외부 제어를 피하고 내부에서 결정함.서
const gene5 = a=>{
    let b;
    return new Sequence(
        new Continuation1(0, cont=>{
            if(!1)cont.stop();
            cont.resume();//값을 반환하지 않고 패스하면서 미리 설정된 next로 이동
        })
    ).next(new Continuation(1, cont=>{
        a++;
        b=a;
        cont.resume(b,0);//값을 반환하면서 특정 continuation으로 이동함
    }))
}
const Continuation1 = class{
    #key; #block; #seq; #value; #next; //key는 맵을 위한 key, next는 노드 연결을 위한 LinkedList
    static #pass = Symbol(); //pass 구현
    static #stop = Symbol();
    constructor(key,block) {this.#key=key;this.#block=block;
    }
    setSequence(seq){
        this.#seq = seq;
    }
    setNext(cont){
        this.#next = cont;
    }
    getNext(){
        return this.#next;
    }
    suspend(){
        this.#value = Continuation1.#stop;
        this.#block(this); //continuation에 resume이 없으면 stop이됨.
        //block에는 resume이 있거나 없거나.
    }
    resume(v=Continuation1.#pass, next){
        this.#value = v;
        if(next!==undefined) this.#next = this.#seq.getCont(next); //Map에서 검색
    }
    isStop(){return this.#value===Continuation1.#stop;}
    isPass(){return this.#value===Continuation1.#pass;} //resume에서 v값을 넘기지 않았을
}
const Sequence = class{
    #table = new Map;
    #cont;
    #end;
    constructor(cont) {this.#cont=this.#end=cont;
        cont.setSequence(this);
    }
    next(cont){
        this.#end.setNext(cont);
        this.#end = cont;
        cont.setSequence(this);
        return this; //chaining으로 next를 연결하려고
    }
    getCont(key){
        if(!this.#table.has(key)) throw `no key:${key}`;
        return this.#table.get(key);
    }
    setCont(key,cont){
        if(this.#table.has(key)) throw `exist key:${key}`;
        return this.#table.set(key,cont);
    }

    [Symbol.iterator](){return new Iterator(this.#cont);}
}
const Iterator = class {
    #target;
    static done ={done:true};
    constructor(cont) {
        this.#target = cont;
    }

    next() {
        const target= this.#target;
        if(target===undefined) return Iterator.done;
        target.suspend();
        if(target.isStop()) return Iterator.done;
        if(target.isPass()){
            this.#target= target.getNext();
            return this.next();
        }else{
            const result = {value:target.value(), done:false};
            this.#target= target.getNext();
            return result;
        }
    }

}
const Context1 = class extends Map{
    #table = new Map; #start; #end;
    next(cont){
        if(this.#start ===undefined)this.#start = this.#end = cont;
        else this.#end = this.#end.next = cont;
        cont.context = this;
        return this;
    }
    getCont(key){return this.#table.get(key);}
    setCont(key, cont){return this.#table.set(key,cont);}
    [Symbol.iterator](){return new Iterator(this.#start);}
}

const Start = function*(url){yield "load start";};
const End= function*(url){yield "load end";};
const url = async function*(url){
    yield await(await fetch(url, {method:"GET"})).json();
}
const urls = async function*(...urls){
    const r = [];
    for(const u of urls.map(url)) r.push((await u.next()).value);
    yield r;
}
const dataLoader = async function* (...aIters){
    for(const iter of aIters) yield* iter;
}
const render = async function* (...aIters){
    for await(const json of dataLoader(...aIters)){
        console.log(json);
    }
}
render(Start(), urls('1.json', "2.json"), url("3.json"), End());
const AIter = class{
    update(v){} //빈 메소드는 오버라이드 해도 되고 안해도되는 것
    async *load(){throw "override";} //꼭 오버라이드를 해야함
}
const Url = class extends AIter{
    #url; #opt;
    constructor(u,opt) {
        super();
        this.#url = u;
        this.#opt  = opt;
    }
    update(json){if(json) this.#opt.body = JSON.stringify(json);} //request의 body 변경
    async *load(){
        console.log("body", this.#opt.body);
        yield await(await fetch(this.#url, this.#opt)).json(); //update된 option에 따라 다른 이터러블
    }
}
const url1 = (u,opt={method:"POST"})=>new Url(u,opt);
const Urls = class extends AIter{
    #urls; #body;
    constructor(...urls) { //Url인스턴스들을 받음
        super();
        this.#urls= urls;
    }
    update(json){this.#body;}
    async *load(){
        const r = [];
        for(const url of this.#urls){
            url.update(this.#body);
            r.push((await url.load().next()).value);
        }
        yield r;
    }
}
const urls1 = (...urls)=>new Urls(...urls.map(url1));  //문자열을 받고 Url객체로 바꿔쥼
const Start1 = class extends AIter{
   *load(){yield "load start";} //async안써도 이름으로 구분함
}
const End1 = class extends AIter{
    *load(){yield "load end";} //async안써도 이름으로 구분함
}
