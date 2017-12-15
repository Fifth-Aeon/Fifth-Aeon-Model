import { properList } from './strings';
import { toPairs } from 'lodash';

export const ResourceType = {
    'Synthesis': 'Synthesis',
    'Growth': 'Growth',
    'Decay': 'Decay',
    'Renewal': 'Renewal'
}
export const ResourceTypeNames = ['Synthesis', 'Growth', 'Decay', 'Renewal']
export interface ResourceTypeGroup {
    [type: string]: number
    Synthesis: number
    Growth: number
    Decay: number
    Renewal: number
}

const colors = [new Set(['Synthesis']), new Set(['Growth']), new Set(['Decay']), new Set(['Renewal']),
new Set(['Synthesis', 'Growth']), new Set(['Synthesis', 'Decay']), new Set(['Synthesis', 'Renewal']),
new Set(['Growth', 'Decay']), new Set(['Growth', 'Renewal']), new Set(['Decay', 'Renewal']),
new Set(['Synthesis', 'Growth', 'Decay']), new Set(['Synthesis', 'Growth', 'Renewal']),
new Set(['Synthesis', 'Decay', 'Renewal']), new Set(['Growth', 'Decay', 'Renewal']), new Set(['Synthesis', 'Growth', 'Decay', 'Renewal'])];

export class Resource {
    private types: ResourceTypeGroup;
    private numeric: number;
    private maxNumeric: number;

    constructor(numeric: number, maxNumeric: number = 0, types?: ResourceTypeGroup, ) {
        this.numeric = numeric;
        this.maxNumeric = maxNumeric;
        this.types = types || {
            Synthesis: 0,
            Growth: 0,
            Decay: 0,
            Renewal: 0
        };
    }

    public difference(res: Resource) {
        return [
            { name: 'Energy', diff: this.getNumeric() - res.getNumeric() },
            { name: 'Synthesis', diff: this.types.Synthesis - res.types.Synthesis },
            { name: 'Growth', diff: this.types.Growth - res.types.Growth },
            { name: 'Decay', diff: this.types.Decay - res.types.Decay },
            { name: 'Renewal', diff: this.types.Renewal - res.types.Renewal }
        ].filter(type => type.diff > 0);
    }

    public asSentance() {
        const base = this.numeric + ' energy';
        const reqs: Array<[string, number]> = toPairs(this.types).filter(pair => pair[1] > 0);
        if (reqs.length === 0)
            return `costs ${this.numeric} energy.`;
        else
            return `costs ${this.numeric} energy. It also requires ${
                properList(reqs.map(pair => `${pair[1]} ${pair[0].toLowerCase()}`))}`;
    }

    public asListDesc() {
        const base = this.numeric + ' energy';
        const reqs: Array<[string, number]> = toPairs(this.types).filter(pair => pair[1] > 0);
        let items = [this.numeric + ' energy'].concat(reqs.map(pair => `${pair[1]} ${pair[0].toLowerCase()}`));
        return properList(items);
    }

    public getColor() {
        for (let i = 0; i < colors.length; i++) {
            if (this.isInColors(colors[i]))
                return i;
        }
    }

    public isInColors(colorsToCheck: Set<string>) {
        let resColors = this.getColors();
        for (const value of Array.from(resColors.values())) {
            if (!colorsToCheck.has(value))
                return false;
        }
        return true;
    }

    public getColors(): Set<string> {
        let set = new Set();
        for (let prop in this.types) {
            if (this.types[prop] > 0)
                set.add(prop);
        }
        return set;
    }

    public getNumeric() {
        return this.numeric;
    }

    public getMaxNumeric() {
        return this.maxNumeric;
    }


    public getTyped() {
        return Object.keys(this.types).map(key => key[0].repeat(this.types[key])).join('').split('');
    }

    public asCost(): string {
        let types = Object.keys(this.types).map(key => key[0].repeat(this.types[key])).join('')
        return `${this.numeric.toString()} ${types}`;
    }

    public asPool(): string {
        let types = Object.keys(this.types).map(key => key[0].repeat(this.types[key])).join('')
        return `(${this.numeric.toString()} / ${this.maxNumeric.toString()}) ${types}`;
    }

    public getOfType(string: string) {
        return this.types[string];
    }

    public subtract(other: Resource) {
        this.maxNumeric -= other.maxNumeric;
        this.numeric -= other.numeric;
    }

    public add(other: Resource) {
        this.numeric += other.numeric;
        this.maxNumeric += other.maxNumeric;
        Object.keys(other.types).forEach((reqType) => {
            this.types[reqType] = this.types[reqType] + other.types[reqType];
        });
    }

    public renew() {
        this.numeric = this.maxNumeric;
    }

    public meetsReq(req: Resource): boolean {
        let ok = true;
        Object.keys(req.types).forEach((key) => {
            let necReq = req.types[key]
            if ((this.types[key] || 0) < necReq)
                ok = false
        })
        return ok && this.numeric >= req.numeric;
    }
}
