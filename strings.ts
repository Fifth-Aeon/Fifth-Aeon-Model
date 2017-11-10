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

export function properCase(str: string) {
    return str.replace(/\b\w/g, l => l.toUpperCase())
}

function symbol(number: number) {
    return number > 0 ? '+' : '';
}

export function formatBuff(damage: number, life: number) {
    return `${symbol(damage)}${damage}/${symbol(life)}${life}`
}
