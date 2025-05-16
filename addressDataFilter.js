import { LightningElement, track, api} from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getFilteredEnrollments from '@salesforce/apex/CRIISProgramEnrollmentController.getFilteredEnrollments';
import generatePDF from '@salesforce/apex/CRIISProgramEnrollmentController.generatePDF';
import getEntitiesWithoutAddress from '@salesforce/apex/CRIISProgramEnrollmentController.getEntitiesWithoutAddress';

export default class AddressDataFilter extends LightningElement {
    @track programTypeFilter = 'both'; // Default to 'both'
    @track showStatus12 = false;
    @track showStatus34 = false;
    @track showType = false;
    @track shownonResponsive = false;

    @track enrollmentData = [];
    @track isLoading = false;
    @track selectedIds = [];

    @track recordsPerPage = 10;
    @track data = [];
    @track columns = [
        { label: 'Name', fieldName: 'Name', type: 'text' },
        { label: 'Program Type', fieldName: 'CRIIS_Program_Type__c', type: 'text' },
        { label: 'Account Status', fieldName: 'CRIIS_Primary_Account_Status__c', type: 'text' },
        { label: 'Entity', fieldName: 'EntityName', type: 'text' },
        { label: 'Flag', fieldName: 'CRIIS_Flag__c', type: 'Checkbox' }
    ];

    // Pagination properties
    @track currentPage = 1;
    @track totalPages = 0;
    @track totalRecords = 0;
    @track recordsToDisplay = [];

    @track missingCurrentPage = 1;
    @track missingRecordsPerPage =5;
    @track missingTotalPages = 0;
    @track missingTotalRecords = 0;
    @track missingRecordsToDisplay = [];
    @track missingAddressColumns = [
        { label: 'Entity Id', fieldName: 'Account_Id__c', type: 'text' },
        { label: 'Entity Name', fieldName: 'Name', type: 'text' }
       
    ];
    @track showMisAddress = false; // toggled by checkbox
    @track missingAddressData = [];    // stores form input rows
    @track entityId = '';
    @track entityName = '';
    @track entityContact = '';

    programTypeOptions = [
        { label: 'All BM', value: 'bm' },
        { label: 'All DS', value: 'ds' },
        { label: 'Both', value: 'both' }
    ];

    pageOptions = [
        { label: '5', value: 5 },
        { label: '10', value: 10 },
        { label: '25', value: 25 },
        { label: '50', value: 50 }
    ];


    

    get disablePrevious() {
        return this.currentPage <= 1;
    }

    get disableNext() {
        return this.currentPage >= this.totalPages;
    }

    get paginationInfo() {
        return `Page ${this.currentPage} of ${this.totalPages} (${this.totalRecords} records)`;
    }

    get disableMissingPrevious() {
        return this.missingCurrentPage <= 1;
    }
    get disableMissingNext() {
        return this.missingCurrentPage >= this.missingTotalPages;
    }
    get missingPaginationInfo() {
        return `Page ${this.missingCurrentPage} of ${this.missingTotalPages} (${this.missingTotalRecords} records)`;
    }

    get isEmptyData() {
        return !this.data || this.data.length === 0;
    }

    get isEmptyData2() {
        return !this.missingAddressData || this.missingAddressData.length === 0;
    }

    handleProgramTypeChange(event) {
        this.programTypeFilter = event.target.value;
    }

    handleStatus12Change(event) {
        this.showStatus12 = event.target.checked;
    }

    handleTypeChange(event) {
        this.showType = event.target.checked;
    }

    handleNonResponsiveChange(event) {
        this.shownonResponsive = event.target.checked;
    }
    handleStatus34Change(event) {
        this.showStatus34 = event.target.checked;
    }

    handleMissingAddressChange(event) {
        this.showMisAddress = event.target.checked;
        console.log('this.showmissingAddress :', this.showMisAddress);
    }

    updateRecordsToDisplay() {
        const start = (this.currentPage - 1) * this.recordsPerPage;
        const end = this.recordsPerPage * this.currentPage;
        this.recordsToDisplay = this.data.slice(start, end);
    }

    // Handle pagination controls
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage -= 1;
            this.updateRecordsToDisplay();
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage += 1;
            this.updateRecordsToDisplay();
        }
    }

    updateMissingRecordsToDisplay() {
        const start = (this.missingCurrentPage - 1) * this.missingRecordsPerPage;
        const end = this.missingRecordsPerPage * this.missingCurrentPage;
        this.missingRecordsToDisplay = this.missingAddressData.slice(start, end);
    }
    handleMissingNextPage() {
        if (this.missingCurrentPage < this.missingTotalPages) {
            this.missingCurrentPage += 1;
            this.updateMissingRecordsToDisplay();
        }
    }
    handleMissingPreviousPage() {
        if (this.missingCurrentPage > 1) {
            this.missingCurrentPage -= 1;
            this.updateMissingRecordsToDisplay();
        }
    }

    handleResetFilters() {
        this.programTypeFilter = 'both';
        this.showStatus12 = false;
        this.showStatus34 = false;
        this.showType = false;
        this.template.querySelectorAll('lightning-input[type="checkbox"]').forEach(element => {
            element.checked = false;
        });
        this.template.querySelector('lightning-radio-group').value = 'both';
        this.enrollmentData = [];
    }

    handleGenerateData() {
        this.isLoading = true;

        getFilteredEnrollments({
            programType: this.programTypeFilter,
            includeStatus12: this.showStatus12,
            includeStatus34: this.showStatus34,
            includeNonResponsive: this.shownonResponsive
        })
            .then(result => {
                // this.enrollmentData = result;
                this.data = result.map(record => {
                    return {
                        ...record,
                        EntityName: record.CRIIS_Entity_Lookup__c ? record.CRIIS_Entity_Lookup__r.Name : ''
                    }
                });
                this.totalRecords = this.data.length;
                this.totalPages = Math.ceil(this.totalRecords / this.recordsPerPage);
                this.updateRecordsToDisplay();
                this.isLoading = false;
            })
            .catch(error => {
                console.error('Error loading enrollments:', error);
                this.showToast('Error', 'Error retrieving data: ' + error.body.message, 'error');
                this.isLoading = false;
            });

        console.log('this.showmissingAddress :', this.showMisAddress);
        if (this.showMisAddress) {
            this.handleMissingAddressTable();
        }
    }

    handleMissingAddressTable() {
        getEntitiesWithoutAddress({
            programType: this.programTypeFilter,
            includeStatus12: this.showStatus12,
            includeStatus34: this.showStatus34
        })
            .then(result => {
                console.log('result :', result);
                this.missingAddressData = result;
                this.missingTotalRecords = this.missingAddressData.length;
                this.missingTotalPages = Math.ceil(this.missingTotalRecords / this.missingRecordsPerPage);
                this.updateMissingRecordsToDisplay();
                this.isLoading = false;
            })
            .catch(error => {
                console.error('Error loading account:', error);
                this.error = error;
                this.missingAddressData = [];
                this.isLoading = false;
            });
    }

    handleGeneratePDF() {
        if (this.isEmptyData) {
            this.showToast('Warning', 'No data available to generate PDF', 'warning');
            return;
        }

        this.isLoading = true;

        console.log('selectedIds -', this.selectedIds);

        generatePDF({
            programType: this.programTypeFilter,
            includeStatus12: this.showStatus12,
            includeStatus34: this.showStatus34,
            includeShowType: this.showType,
            includeShownonResponsive: this.shownonResponsive,
            selectedIds: this.selectedIds.length > 0 ? this.selectedIds : null
        })
            .then(result => {
                console.log('result -', result);
                // Create a link to download the PDF
                let downloadLink = document.createElement('a');
                downloadLink.href = 'data:application/pdf;base64,' + result;
                downloadLink.download = 'CRIIS_Program_Enrollment_Report.pdf';
                downloadLink.click();
                this.isLoading = false;
                this.showToast('Success', 'PDF generated successfully', 'success');
            })
            .catch(error => {
                console.error('Error generating PDF:', error);
                this.showToast('Error', 'Error generating PDF: ' + error.body.message, 'error');
                this.isLoading = false;
            });
    }



    handleRowSelection(event) {
        this.selectedIds = event.detail.selectedRows.map(row => row.Id);
    }

    handleCheckboxChange(event) {
        const recordId = event.target.dataset.id;
        const checked = event.target.checked;

        // Update the selected rows array
        if (checked) {
            if (!this.selectedRows.includes(recordId)) {
                this.selectedRows.push(recordId);
            }
        } else {
            this.selectedRows = this.selectedRows.filter(id => id !== recordId);
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant
            })
        );
    }

    handleRecordsPerPageChange(event) {
        this.recordsPerPage = parseInt(event.detail.value, 10);
        this.totalPages = Math.ceil(this.totalRecords / this.recordsPerPage);

        // Reset to first page when changing records per page
        this.currentPage = 1;
        this.updateRecordsToDisplay();
    }
}