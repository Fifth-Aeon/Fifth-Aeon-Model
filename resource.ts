export const ResourceType = {
    "Synthesis": "Synthesis",
    "Growth": "Growth",
    "Necrosis": "Necrosis",
    "Renewal": "Renewal"
}

export class Resource {
    private types: Map<string, number>;
    private numeric: number;
    private maxNumeric: number;

    constructor(numeric: number, maxNumeric: number = 0, types?: Map<string, number>, ) {
        this.numeric = numeric;
        this.maxNumeric = maxNumeric;
        this.types = types || new Map<string, number>();
    }

    public asCost(): string {
        let types = Array.from(this.types.keys()).map(key => key[0].repeat(this.types[key])).join('')
        return `${this.numeric.toString()} ${types}`;
    }

    public asPool(): string {
        let types = Array.from(this.types.keys()).map(key => key[0].repeat(this.types[key])).join('')
        return `(${this.numeric.toString()} / ${this.maxNumeric.toString()}) ${types}`;
    }

    public subtract(other: Resource) {
        this.maxNumeric -= other.maxNumeric;
        this.numeric -= other.numeric;
    }

    public add(other: Resource) {
        this.maxNumeric += other.maxNumeric;
        this.numeric += other.numeric;
    }

    public meetsReq(req: Resource): boolean {
        let ok = true;
        req.types.forEach((necReq, req) => {
            if (this.types.get(req) || 0 < necReq)
                ok = false
        })
        return ok && this.numeric > req.maxNumeric;
    }

    public addRes(res: Resource) {
        res.types.forEach((amount, resType) => {
            this.types.set(resType, (this.types.get(resType) || 0) + amount)
        })
        this.numeric += res.numeric;
        this.maxNumeric += res.maxNumeric;
    }
}