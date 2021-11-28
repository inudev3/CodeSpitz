
export const type= (target, type)=>{// ===보다 ==이 빨리 작동함
//primitive value인 경우 string으로 표현하기 때문 typeof target == "number"
    if(typeof type== "string"){
        if(typeof target!= type) throw`invaildtype${target}: ${type}`;
    }else if(!(target instanceof type)) throw`invaildtype${target}: ${type}`;
    return target;
};
//===은 형일치를 검사하고 형변환도 검사한다. 따라서 형변환만 검사하는 ==보다 느리다.
type(12, "number"); //primitive value인 경우 string을 보내주면 
type("abc", "string");
type([1,2,3], Array);
type(new Set, Set);

const test =(arr, _ = type(arr, Array))=>{ //2번재 인자의 기본값이 type()함수 인자는 스코프를 가지고 뒤의 인자가 앞의 인자를 인식함.
    console.log(arr);
}
export const ViewModel = class{
    static #private1 = Symbol()
    static get(data){
        return new ViewModel(this.#private1, data);
    }
    styles={}; attributes={}; properties={}; events={}
    constructor(checker, data) {
        if(checker!=ViewModel.#private1) throw  'use Viewmodel.get()'; //checker에 private1이 들어올 수 있는 경우는 static.get밖에 없음 따라서 static.get으로만 생성 가
        Object.entries(data).forEach(([k,v])=>{
            switch (k){
                case "styles": this.styles = v; break;
                case "attributes": this.attributes = v; break;
                case "properties": this.properties= v; break;
                case "events": this.events = v; break;
                default: this[k] = v; //custom key
            }
        });
        Object.seal(this); //더 이상 필드로 키를 추가하지 못하게. 값은 바꿀 수 있음
    }
}//view를 그리는 제어에 흐름은 binder 에 제어 역전됨.
export const BinderItem = class{
    el; viewmodel;
    constructor(el, viewmodel, _0=type(el, HTMLElement), _1=type(viewmodel, "string")) { //viewmodel은 hook되어있는 data
        this.el = el;
        this.viewmodel = viewmodel;
        Object.freeze(this);
    }
}
//BinderItem의 배열이 Scanenr
export const Binder = class{
    #items = new Set; // 객체지향에서 객체의 컨테이너는 언제나 Set이다. Identifier Context에서 중복된 값을 사용하지 않기 때문.
    add(v, _=type(v,BinderItem)){this.#items.add(v);}
    render(viewmodel, _ =type(viewmodel, ViewModel)){
        this.#items.forEach(item=>{
            const vm = type(viewmodel[item.viewmodel], ViewModel), el= item.el; //
            Object.entries(vm.styles).forEach(([k,v])=>el.style[k] = v);
            Object.entries(vm.attributes).forEach(([k,v])=>el.setAttribute(k,v));
            Object.entries(vm.properties).forEach(([k,v])=>el[k]=v);
            Object.entries(vm.events).forEach(([k,v])=>el["on"+k]=(e)=>v.call(el,e,viewmodel));
        });
    }
}
export const Scanner = class{
    scan(el, _=type(el,HTMLElement)) {
        const binder = new Binder;
        this.checkItem(binder,el);
        const stack = [el.firstElementChild];
        let target;
        while (target = stack.pop()) {
            this.checkItem(binder, target);
            if (target.firstElementChild) stack.push(target.firstElementChild);
            if (target.nextElementSibling) stack.push(target.nextElementSibling);

        }
        return binder;
    }
    checkItem(binder,el){
        const vm =el.getAttribute("data-viewmodel");
        if(vm) binder.add(new BinderItem(el, vm)); //
    }
}
const getRandom = () => parseInt(Math.random() * 150) + 100;
const viewmodel = ViewModel.get({
    isStop:false,
    changeContents () {
        // viewmodel을 갱신하면, binder가 viewmodel을 view에 rendering 한다.
        // 즉, '인메모리 객체'만 수정하면 된다
        this.wrapper.styles.background = `rgb(${getRandom()},${getRandom()},${getRandom()})`
        this.contents.properties.innerHTML = Math.random().toString(16).replace('.', '')
    },
    wrapper:ViewModel.get({
        styles:{width:"50%", background:"#ffa", cursor:"pointer"},
        events:{
            click(e,vm){
                vm.isStop = true;
            }
        }
    }),
    title:ViewModel.get({
        properties:{innerHTML:"Title"}
    }),
    contents:ViewModel.get({
        properties:{
            innerHTML:"Contents"
        }
    }),

})//mvvm에서 viewmodel은 순수한 인메모리 객체이다. //리액트-네이티브의 원리
const scanner = new Scanner;
const binder = scanner.scan(document.querySelector("#target"));
binder.render(viewmodel); //제어역전
const f =_=>{
    viewmodel.changeContents();
    binder.render(viewmodel);
    if(!viewmodel.isStop) requestAnimationFrame(f);
}
requestAnimationFrame(f);