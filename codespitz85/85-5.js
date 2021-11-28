const dataLoader1 = async function*(...aIters){
    let prev;
    for (const iter of aIters){
        iter.update(prev);
        prev = (await iter.load().next()).value; //iterator의 결과값을 다음 prev 계속 업데이트함
        yield prev;
    }

}
const render1 = async function* (...aIters){
    for await(const json of dataLoader(PrevPass,...aIters)){
        console.log(json);
    }
}
const dataLoader2 = async function*(pass,...aIters){
    const dataPass = new pass;
    for(const item of aIters){
        const v = await item.load(dataPass.data).next();
        yield dataPass.data = v.value;
    }
}
const DataPass = class{
    get data(){throw "override";}
    set data(v){throw "override";}
}
const PrevPass = class extends DataPass{
    #data;
    get data(){return this.#data;}
    set data(v){this.#data = v;}
}
const IncPass = class extends DataPass{
    #data = [];
    get data(){return this.#data;}
    set data(v){this.#data.push(v);}
}
const AsyncItem = class{
    static #dataPass; static #items;
    static iterable(dataPass, ...items){
        AsyncItem.#dataPass = dataPass;
        AsyncItem.#items = items;
        return AsyncItem;
    }
    static async *[Symbol.asyncIterator](){ //async iterable로 구현
        const dataPass = new AsyncItem.#dataPass; //new DataPass
        for(const item of AsyncItem.#items){
            const v = await item.load(dataPass.data).next();
            yield dataPass.data = v.value;
        }
    }
    static toPromises(items,data){
        return [...items].map(item=>item.load(data).next())
    }
    async *load(v){throw "override";} //update를 묶어버림

}
const render2 = async function(...aIters){
    for await(const json of AsyncItem.iterable(PrevPass, ...aIters)){ //iterable 및 dataPass, items, async iterator를 static으로 처리. aIters는 AsyncItem의 인스턴스(static 아님!!)
        console.log(json);
    }
}
const Renderer = class{
    #dataPass;
    constructor(dataPass) {
        this.dataPass = dataPass;
    }
    set dataPass(v){this.#dataPass = v;}
    async render(...items){
        const iter = AsyncItem.iterable(this.#dataPass, ...items);
        for await(const v of iter) console.log("**", v);
    }
}
const renderer = new Renderer(PrevPass);
renderer.render(...items)
const Url = class extends AsyncItem{
    #url; #opt; #dataF;
    constructor(u,opt, dataF=JSON.stringify) {
        super();
        this.#url = u;
        this.#opt = opt;
        this.#dataF  = dataF; //data Format
    }
    async *load(v){
        if(v) this.#opt.body = this.#dataF(v); //
        return await(await fetch(this.#url, this.#opt)).json();
    }
}

const Parallel = class extends AsyncItem{
    #items;
    constructor(...items) {
        super();
        this.#items = items;
    }
    async *load(data){
        // const arr = [...this.#items].map(item=>item.load(data).next()); //promise의 배열 -> 이건 AsyncItem이 해야할 일
        const arr = AsyncItem.toPromises(this.#items,data);
        return (await Promise.all(arr)).map(v=>v.value); //Promise를 병렬로 한번에 처리하기 map은 프로젝션임
    }
}
const Race = class extends AsyncItem{
    #items;
    constructor(...items) {
        super();
        this.#items = items;
    }
    async *load(data){
        // const arr = [...this.#items].map(item=>item.load(data).next()); //promise의 배열 -> 이건 AsyncItem이 해야할 일
        
        return (await Promise.race(AsyncItem.toPromises(this.#items,data))).value; //Promise를 병렬로 한번에 처리하기 map은 프로젝션임
    }
}