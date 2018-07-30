/*Temporary or app specific typing updates
We'll use it to type array.from so we don't get type errors 
Array.from not supported in IE11 so we also conditionally add a polyfill
*/
interface ArrayConstructor {
    from(arrayLike: any, mapFn?, thisArg?): Array<any>;
}


declare namespace __esri {
    interface View extends Accessor, corePromise, DOMContainer {
        root?: string;
    }
}