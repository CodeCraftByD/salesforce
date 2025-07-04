import { LightningElement, api} from 'lwc';
import { generateId } from 'c/utils';

export default class ButtonList extends LightningElement {
    @api options;
    @api variant;
    @api label;
    @api
    get value(){
        return this._selected;
    }
    set value(v){
        this._selected = v;
    }

    _selected;
    _uniqueId = generateId(5);
    
    get optionList() {
        return this.options ? this.options.map( (record, index) =>({...record, _generatedKeyXYZ: `optionButton-${index}`, variant:this.getVariantForOption(record)})) : [];
    }

    get showButtonList() {
        return this.options?.length > 0;
    }

    get isStacked() {
        return this.variant == 'stacked';
    }

    getVariantForOption(r) {
        console.log('this._selected :',this._selected);
        console.log('r.value :',r.value);
        console.log('is true :',(r.value === this._selected));
        if (String(r.value) === this._selected) {
            return 'brand';
        } else {
            return 'neutral';
        }
    }

    handleButtonClick(e) {
        let value = e.currentTarget.dataset.id;
        if (value == this._selected) {
            return;
        }
        this._selected = value;
        this.dispatchEvent(new CustomEvent('buttonselectedchange', {detail: this.options.find(r=>r.value == value)}));
    }
}