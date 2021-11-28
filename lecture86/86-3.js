import {BinderItem, Scanner, type, ViewModel} from "./86-2";

const Processor = class{
    cat; //category
    constructor(cat) {
        this.cat = cat;
        Object.freeze(this);
    }
    process(vm, el, k, v, _0=type(vm, ViewModel), _1=type(el, HTMLElement), _2=type(k,"string")){
        this._process(vm,el,k,v); //자식한테 위임한다. 의존성을 상속받는다. 이를 Template메소드라고 함. 자바에서는 protected메소드
    }
    _process(vm,el,k,v){throw "override";} //이렇게 자식에게 의존하는 메소드를 hook이라고 함
}//Processor는 추상 클래스이다.
new (class extends Processor{
    _process(vm, el, k, v) {
        el.style[k] = v;
    }
})("styles") //class 인스턴스를 하나만 만들고 다시 만들지 못하게 익명 상속된 클래스로 만들기
new (class extends Processor{
    _process(vm, el, k, v) {
        el.setAttribute(k,v);
    }
}
)("attributes")
const Binder = class{
    #items = new Set;
    #processors = {}; //카테고리별로 하나씩 가지기 위해 객체로 만듬. 키로 갱신가능. 다만 객체지향에서 값으로 식별하면 안되기 때문에
    // cat을 symbol로 만들어주면 identifier context 임. 여기선 예외. 값을 노출할 때는 신중하게 생각해라.
    add(v,_=type(v,BinderItem)){this.#items.add(v);}
    addProcessor(v,_0=type(v,Processor)){
        this.#processors[v.cat] = v;
    }
    render(viewmodel, _=type(viewmodel, ViewModel)){
        const processors = Object.entries(this.#processors);
        this.#items.forEach(item=>{
            const vm = type(viewmodel[item.viewmodel], ViewModel), el=item.el;
            processors.forEach(([pk,processor])=>{ //알고리즘의 일반
                Object.entries(vm[pk]).forEach(([k,v])=>{
                    processor.process(vm, el, k, v); // 외부에서 공급된 타입을 이용하여 알고리즘을 일반
                })
            })
        })
    }
}
const scanner = new Scanner();
const binder = scanner.scan(document.querySelector('#target'));
binder.addProcessor(new class extends Processor {
    _process (vm, el, k, v) { el.style[k] = v }
}('styles'))
binder.addProcessor(new class extends Processor {
    _process (vm, el, k, v) { el.setAttribute(k, v) }
}('attributes'))
binder.addProcessor(new class extends Processor {
    _process (vm, el, k, v) { el[k] = v }
}('properties'))
binder.addProcessor(new class extends Processor {
    _process (vm, el, k, v) { el[`on${k}`] = e => v.call(el, e, vm) }
}('events')) ///binder가 processor를 단방향으로 의존하는 상태, dependency injection
const ViewModeListener = class{
    viewmodelUpdated(updated){throw "override";}
}
const ViewModel = class{
    static get(data){return new ViewModel(data);}
}