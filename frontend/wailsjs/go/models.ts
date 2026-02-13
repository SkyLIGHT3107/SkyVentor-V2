export namespace main {
	
	export class ConvertResult {
	    amount: number;
	    from: string;
	    to: string;
	    result: number;
	    rate: number;
	    lastUpdate: string;
	    success: boolean;
	    errorMessage?: string;
	
	    static createFrom(source: any = {}) {
	        return new ConvertResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.amount = source["amount"];
	        this.from = source["from"];
	        this.to = source["to"];
	        this.result = source["result"];
	        this.rate = source["rate"];
	        this.lastUpdate = source["lastUpdate"];
	        this.success = source["success"];
	        this.errorMessage = source["errorMessage"];
	    }
	}
	export class Currency {
	    code: string;
	    name: string;
	    type: string;
	    symbol?: string;
	    flag?: string;
	    icon?: string;
	
	    static createFrom(source: any = {}) {
	        return new Currency(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.code = source["code"];
	        this.name = source["name"];
	        this.type = source["type"];
	        this.symbol = source["symbol"];
	        this.flag = source["flag"];
	        this.icon = source["icon"];
	    }
	}
	export class RateRow {
	    multiplier: number;
	    fromAmount: number;
	    toAmount: number;
	
	    static createFrom(source: any = {}) {
	        return new RateRow(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.multiplier = source["multiplier"];
	        this.fromAmount = source["fromAmount"];
	        this.toAmount = source["toAmount"];
	    }
	}
	export class Settings {
	    theme: string;
	    language: string;
	
	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.theme = source["theme"];
	        this.language = source["language"];
	    }
	}

}

