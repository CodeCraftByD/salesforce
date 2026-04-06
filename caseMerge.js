import { LightningElement, track, api} from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getCasesForMerge from '@salesforce/apex/CaseMergeService.getCasesForMerge';
import mergeCases from '@salesforce/apex/CaseMergeService.mergeCases';
export default class CaseMerge extends NavigationMixin(LightningElement) {
    @track loading = true;
    @track error;

    @track fields = [];
    @track caseColumns = []; 
    @track rows = [];      
    @track showConfirm = false;

    recordIds = [];
    _initialized = false;

    selectedByField = {};

    renderedCallback() {
        if (this._initialized) return;
        this._initialized = true;

        const url = new URL(window.location.href);
        const param = url.searchParams.get('c__recordIds');
        if (param) this.recordIds = param.split(',').map(s => s.trim()).filter(Boolean);

        if (!this.recordIds || this.recordIds.length < 2) {
            this.loading = false;
            this.error = 'Select at least 2 cases from the list view to merge.';
            return;
        }
        this.init();
    }

    get hasData() {
        return this.caseColumns && this.caseColumns.length > 0 && this.rows && this.rows.length > 0;
    }

    get principalId() {
        const p = (this.caseColumns || []).find(c => c.isPrincipal);
        return p ? p.id : null;
    }

    get mergeDisabled() {
        return !this.principalId;
    }

    async init() {
        this.loading = true;
        this.error = null;

        try {
            const resp = await getCasesForMerge({ caseIds: this.recordIds });
            this.fields = resp.fields || [];
            const cases = resp.cases || [];

            const principalId = cases?.[0]?.id;

            this.caseColumns = cases.map((c, idx) => ({
                id: c.id,
                caseNumber: c.caseNumber,
                isPrincipal: c.id === principalId
            }));

            this.selectedByField = {};
            (this.fields || []).forEach(f => {
                this.selectedByField[f.apiName] = principalId;
            });

            this.rebuildRows(resp);
        } catch (e) {
            this.error = this.normalizeError(e);
        } finally {
            this.loading = false;
        }
    }

    rebuildRows(resp) {
        const cases = resp.cases || [];

        this.rows = (this.fields || []).map(f => {
            const options = cases.map(c => {
                const value = (c.fieldValues && c.fieldValues[f.apiName]) ? c.fieldValues[f.apiName] : '';
                return {
                    caseId: c.id,
                    value,
                    selected: this.selectedByField[f.apiName] === c.id
                };
            });

            return {
                apiName: f.apiName,
                label: f.label,
                options
            };
        });
    }

    handlePrincipalChange(event) {
        const newPrincipalId = event.target.value;

        this.caseColumns = (this.caseColumns || []).map(c => ({
            ...c,
            isPrincipal: c.id === newPrincipalId
        }));

        (this.fields || []).forEach(f => {
            this.selectedByField[f.apiName] = newPrincipalId;
        });

        this.rows = (this.rows || []).map(r => ({
            ...r,
            options: r.options.map(o => ({ ...o, selected: o.caseId === this.selectedByField[r.apiName] }))
        }));
    }

    handleSelectAll(event) {
        const caseId = event.currentTarget.dataset.id;

        (this.fields || []).forEach(f => {
            this.selectedByField[f.apiName] = caseId;
        });

        this.rows = (this.rows || []).map(r => ({
            ...r,
            options: r.options.map(o => ({ ...o, selected: o.caseId === caseId }))
        }));
    }

    handleFieldPick(event) {
        const fieldApi = event.target.dataset.field;
        const caseId = event.target.value;

        this.selectedByField[fieldApi] = caseId;

        this.rows = (this.rows || []).map(r => {
            if (r.apiName !== fieldApi) return r;
            return {
                ...r,
                options: r.options.map(o => ({ ...o, selected: o.caseId === caseId }))
            };
        });
    }

    openCase(event) {
        const recordId = event.currentTarget.dataset.id;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId, objectApiName: 'Case', actionName: 'view' }
        });
    }

    handleCancel() {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: { objectApiName: 'Case', actionName: 'list' },
            state: { filterName: 'Recent' }
        });
    }

    confirmMerge() {
        this.showConfirm = true;
    }
    closeConfirm() {
        this.showConfirm = false;
    }

    async doMerge() {
        this.showConfirm = false;
        this.loading = true;
        this.error = null;

        try {
            const principalId = this.principalId;
            const dupIds = (this.caseColumns || []).filter(c => c.id !== principalId).map(c => c.id);

            console.log('principalId :', principalId);
            console.log('dupIds :', dupIds);

            const selectedFieldValues = {};
            (this.rows || []).forEach(r => {
                const chosenCaseId = this.selectedByField[r.apiName];
                const chosenOpt = (r.options || []).find(o => o.caseId === chosenCaseId);
                selectedFieldValues[r.apiName] = chosenOpt ? chosenOpt.value : '';
            });

            console.log('selectedFieldValues :', selectedFieldValues);

            const result = await mergeCases({
                masterCaseId: principalId,
                duplicateCaseIds: dupIds,
                selectedFieldValues
            });

            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: { recordId: result.masterCaseId, objectApiName: 'Case', actionName: 'view' }
            });

            this.dispatchEvent(new ShowToastEvent({
                title: 'Success',
                message: result.message || 'Merge completed.',
                variant: 'success'
            }));

        } catch (e) {
            console.log('error :', e);
            this.error = this.normalizeError(e);
            this.dispatchEvent(new ShowToastEvent({
                title: 'Merge Failed',
                message: this.error,
                variant: 'error'
            }));
        } finally {
            this.loading = false;
        }
    }

    normalizeError(e) {
        if (e?.body?.message) return e.body.message;
        if (Array.isArray(e?.body)) return e.body.map(x => x.message).join(', ');
        if (e?.message) return e.message;
        return 'Unknown error occurred.';
    }

}