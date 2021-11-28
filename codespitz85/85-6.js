const WorkerPromise= f=>{
    let resolve, reject;
    const worker = Object.assign(new Worker(URL.createObjectURL(new Blob([`onmessage=e=>postMessage((${f})(e.data));`],mine.js)))
    , {onmessage:e=>resolve(e.data), onerror:e=>reject(e.data)});
    return data=>new Promise((res,rej)=>{
        resolve=res;
        reject=rej;
        worker.postMessage(data);
    })
}

const greyscale = WorkerPromise(imgData=>{
    for(let i=0; i<imgData.length; i+=4){
        const v = .34* imgData[i]+ .5*imgData[i+1] + .16 * imgData[i+2];
        imgData[i] = imgData[i+1] = imgData[i+2] = v;
    }
    return imgData;
})
new ArrayBuffer(12);
//View로 읽고 쓴다.
const intView = new Int32Array(new ArrayBuffer(12)); //4바이트 int단위로 view하여 3칸짜리 배열의 view가 됨
const utiny = new Uint8ClampedArray(new ArrayBuffer(12)); //1바이트 단위의 INT로 뷰한 12칸 짜리 배열VIEW
//하나의 원본 배열에 다양한 형식을 사용할 수 있음(덮어쓰기 가능)
//웹어셈블리의 원리 => 배열 덕분에 강타입언어를 실행 가능
//shared ArrayBuffer는 백그라운드 쓰레드(워커)에 넘겨줄 때에도 복제를 하지않고 참조를 넘겨주어 성능이 최적화된다.
//일반적인 값들은 공유가 되지 않고 복제를 해야 워커에 넘겨줄 수 있다. Arraybuffer 만 예외. (나머지는 연결리스트이고 유일하게 Array이므로)
//rgba는 4비이트임 (32비트컬러채)
img.onload = ({target})=>{ //onload 이벤트
    const {width, height} =target;
    const ctx = Object.assign(canvas, {width, height}).getContext("2d");
    ctx.drawImage(target,0,0);
    const sObj = new SharedArrayBuffer(width*height*4); //rgba한 칸당 4바이트
    const u8c = new Uint8ClampedArray(sObj); //greyscale로 view하기 때문에 1바이트씩. 타입 안정성을 보장
    const imgData = ctx.getImageData(0,0,width,height).data;//
    u8c.set(imgData); //View는 set메소드가 있음
    greyscale(imgData).then(_=>{ //보낼 때는 View가 아니라 Arraybuffer를 보냄, 동시성 문제의 발생
        const r = new Uint8ClampedArray(u8c.byteLength);
        r.set(u8c); //빈 array를 만들고 view를 복사
        ctx.putImageData(new ImageData(r, width, height), 0, 0);
    })
} // arraybuffer는 항상 원본이 이동한다.
const greyscale1 = WorkerPromise(sObj=>{
    const v = new Uint8ClampedArray(sObj);
    for(let i=0; i<v.byteLength; i+=4){
        const v = .34* v[i]+ .5*v[i+1] + .16 * v[i+2];
        v[i] = v[i+1] = v[i+2] = v;
    }
    return sObj;
})
const copy = obj=>{
    const v = new Uint8ClampedArray(obj);
}
const WorkerPromise1= f=>{
    let resolve, reject, start, end;
    const worker = Object.assign(new Worker(URL.createObjectURL(new Blob([`onmessage=e=>postMessage((${f})(e.data));`],mine.js)))
        , {onmessage:e=>resolve(e.data), onerror:e=>reject(e.data)});
    return data=>new Promise((res,rej)=>{
        resolve=res;
        reject=rej;
        worker.postMessage(data);
    });
}
