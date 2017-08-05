export const ResourceType = {
    "Synthesis": "Synthesis",
    "Growth": "Growth",
    "Decay": "Decay",
    "Renewal": "Renewal"
}
export const ResourceTypeNames = [
    "Synthesis",
    "Growth",
    "Decay",
    "Renewal"
]
export interface ResourceTypeGroup {
    [type: string]: number
    Synthesis: number
    Growth: number
    Decay: number
    Renewal: number
}
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

    public getNumeric() {
        return this.numeric;
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