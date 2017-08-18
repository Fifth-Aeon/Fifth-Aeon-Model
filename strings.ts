export function properList(arr: Array<string>) {
    if (arr.length === 1) {
        return arr[0];
    } else if (arr.length === 2) {
        return arr.join(' and ');
    } else if (arr.length > 2) {
        return arr.slice(0, -1).join(', ') + ' and ' + arr.slice(-1);
    }
    return '';    
}

export function properCase(str:string) {
    return str.replace(/\b\w/g, l => l.toUpperCase())    
}