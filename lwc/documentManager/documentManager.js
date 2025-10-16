/**
 * Created by dekhanna on 12/7/2020.
 * * Change history
 * #1.1 - EFSALES-2646 06/25/2021 J Landry - Hyperlink Document Name
 * #1.2 - EFSALES-2740 07/09/2021 JaLandry recat until final approval, dealerAgreementHasFinalApproval
 */

import { LightningElement, track, api,wire } from 'lwc';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { subscribe, unsubscribe, onError, setDebugFlag, isEmpEnabled } from 'lightning/empApi'; //1.2++
import deleteFiles from '@salesforce/apex/DocumentManagerController.deleteFiles';
import rejectFiles from '@salesforce/apex/DocumentManagerController.rejectFiles';
import approveFiles from '@salesforce/apex/DocumentManagerController.approveFiles';
import { sortFilesByDate } from 'c/documentManagerShared';
import relatedFiles from '@salesforce/apex/DocumentManagerController.relatedFiles';
import recategorizeFiles from '@salesforce/apex/DocumentManagerController.recategorizeFiles';
import dealerAgreementHasFinalApproval from '@salesforce/apex/DocumentManagerController.dealerAgreementHasFinalApproval';//1.2++
import dealerIsActiveWActivatedDate from '@salesforce/apex/DocumentManagerController.dealerIsActiveWActivatedDate'; //1.2++
import findDealerAgreements from '@salesforce/apex/ApprovalSummaryController.getDealerAgreements';//1.2++
import {ShowToastEvent} from 'lightning/platformShowToastEvent';

// import navigation service for file preview
import { NavigationMixin } from 'lightning/navigation';

import CONTENT_VERSION_CATEGORY_FIELD from '@salesforce/schema/ContentVersion.Category__c';
import CONTENT_VERSION_REJECT_REASON_FIELD from '@salesforce/schema/ContentVersion.Reject_Reason__c';
import CONTENT_VERSION_REJECT_COMMENT_FIELD from '@salesforce/schema/ContentVersion.Reject_Comment__c';

import { constants } from 'c/shared';
import { stringUtils } from 'c/stringUtils';

import hasApprovePermission from '@salesforce/customPermission/Document_Manager_Can_Approve';
import hasRejectPermission from '@salesforce/customPermission/Document_Manager_Can_Reject';
import hasDeletePermission from '@salesforce/customPermission/Document_Manager_Can_Delete';
import hasRecategorizePermission from '@salesforce/customPermission/Document_Manager_Can_Recategorize';

// Add the actions column
var actions = [
    {label: 'Preview', name: 'PREVIEW'},
    {label: 'Delete', name: 'DELETE'},
    {label: 'Approve', name: 'APPROVE'},
    {label: 'Reject', name: 'REJECT'},
    {label: 'Recategorize', name: 'RECATEGORIZE'}
];
const columns = [
    {label: 'Document Name', fieldName: 'linkName', type: 'url', 
    typeAttributes: {label: { fieldName: 'Title' }, target: '_blank'}},//1.1++
    //{label: 'Document Name', fieldName: 'Title'}, #1.1--
    {label: 'Category', fieldName: 'Category__c'},
    {label: 'Status', fieldName: 'Status__c'},
    {label: 'Date Uploaded', fieldName: 'CreatedDate',sortable: "true",
    type: 'date',typeAttributes: {
                                    day: 'numeric',
                                   month: 'numeric',
                                   year: 'numeric',
                                   hour: '2-digit',
                                   minute: '2-digit',
                                   hour12: true
                                   }},
    {label: 'Uploaded By', fieldName: 'OwnerId'},
	{ type:'action', typeAttributes: { rowActions: { fieldName: "rowActions" } } }
];

const approveDialogMessageTemplate = 'Are you sure you want to approve document with name, "{0}"?';
const rejectDialogMessageTemplate = 'Are you sure you want to reject document with name, "{0}"?';
const recategorizeDialogMessageTemplate = 'Select a new category for document with name, "{0}"?';
const deleteDialogMessageTemplate = 'Are you sure you want to delete document with name, "{0}"?';

export default class DocumentManager extends NavigationMixin(LightningElement) {

    @api recordId;
    @track columns = columns;
    @track fileValue;

    // mp: what are these properties for?? these appear to not be in use
//    @api fileList=[];
//	efreshTable;
//    file;
//    filesUploaded = [];
//    fileContents;
//    selectedRecords;
//	fileReader;
//    content;
//    MAX_FILE_SIZE = 1500000;


	// data table sort variables
    @track sortBy;
    @track sortDirection;

	// stores action data related to the current grid row performing action
	currentRowActionData;
	currentRowCategory;

	// variables for approve document modal
	approveDialogMessage;
    @track isApproveDialogVisible = false;
    @track approveOriginalMessage; // no used but needed for configuring dialog component

	// variables for reject document modal
	rejectReason;
	rejectComment;
	rejectDialogMessage;
	rejectButtonDisabled = true;
    @track isRejectDialogVisible = false;
    @track rejectOriginalMessage; // no used but needed for configuring dialog component
    @track rejectPicklistOptions;
    
	@wire (getPicklistValues, {recordTypeId: constants.masterRecordTypeId, fieldApiName: CONTENT_VERSION_REJECT_REASON_FIELD})
    getRejectReasonPicklistValuesResult({ error, data }) {
        // reset values to handle eg data provisioned then error provisioned
        this.rejectPicklistOptions = undefined;
        if (data) {
            this.rejectPicklistOptions = data.values;
        } else if (error) {
            console.log(error);
        }
    }

	// variables for recategorize document modal
	recategorizeConfirmButtonDisabled = true;
	recategorizeDialogMessage;
	@track categoryPicklistOptions;
    @track isRecategorizeDialogVisible = false;
    @track recategorizeOriginalMessage; // no used but needed for configuring dialog component
    deleteDialogMessage;
    @track isDeleteDialogVisible = false;
    @track deleteOriginalMessage; // no used but needed for configuring dialog component
    //1.2++
    activeDealerAgreementId;
    dealerAgreementHasVPApproval;
    dealerActiveWActivatedDADate;
    channelName = '/event/Dealer_Agreement_Event__e';
    subscription={};

	// populate content version picklist values
	@wire (getPicklistValues, {recordTypeId: constants.masterRecordTypeId, fieldApiName: CONTENT_VERSION_CATEGORY_FIELD})
    getCategoryPicklistValuesResult({ error, data }) {
        // reset values to handle eg data provisioned then error provisioned
        this.categoryPicklistOptions = undefined;
        if (data) {
            this.categoryPicklistOptions = data.values;
        } else if (error) {
            console.log(error);
        }
    }

    //get value of dealer agreement VP approval status
    @wire (dealerAgreementHasFinalApproval, {idParent: '$recordId'}) 
    wiredDealerAgreementHasVPApproval({ error, data }) {
        
        this.dealerAgreementHasVPApproval =undefined;
            if (error) {
                console.log('error='+error);
            } else {
                console.log('wiredDealerAgreementHasVPApproval has data');
                this.dealerAgreementHasVPApproval = data;
            }
        
    }


	/*
		Handles the approve document confirm modal dialog onclick events.
	*/
    handleApprovalClick(event){

		// for some reason, sometimes a click event is fired but there's no target
        if(!event.target) return;
		// was the click event fired from our approve document confirm modal?
		if(event.target.name === 'approvalDocumentConfirmModal'){
            // when user clicks outside of the dialog area, the event is dispatched with detail value as 1
            if(event.detail !== 1){
                // you can do some custom logic here based on your scenario
                if(event.detail.status === 'confirm') {
                    let ids = [];
                    ids.push(this.currentRowActionData.ContentDocumentId);
					let _self = this;
                    approveFiles({contentDocumentIds: ids}).then(function() {
                        _self.getRelatedFiles();
                    });
                }else if(event.detail.status === 'cancel'){
                    // do something else
                }
            }
            // hides the component
            this.isApproveDialogVisible = false;
        }
    }


	/*
		Handles the approve document confirm modal dialog onclick events.
	*/
    handleRecategorizeClick(event){
		// for some reason, sometimes a click event is fired but there's no target
        if(!event.target) return;
		// was the click event fired from our recategorize document confirm modal?
		if(event.target.name === 'recategorizeDocumentConfirmModal'){
            // when user clicks outside of the dialog area, the event is dispatched with detail value as 1
            if(event.detail !== 1){
                // you can do some custom logic here based on your scenario
                if(event.detail.status === 'confirm') {
                    let ids = [];
                    ids.push(this.currentRowActionData.ContentDocumentId);
					let _self = this;
                    recategorizeFiles({contentDocumentIds: ids, category: this.currentRowCategory}).then(function() {
                        _self.getRelatedFiles();
                    });
                }else if(event.detail.status === 'cancel'){
                    // do something else
                }
            }
            // hides the component
            this.isRecategorizeDialogVisible = false;
        }
    }

    /*
       Handles the delete document confirm modal dialog onclick events.
    */
    handleDeleteClick(event){

        		// for some reason, sometimes a click event is fired but there's no target
                if(!event.target) return;
        		// was the click even fired from our approve document confirm modal?
        		if(event.target.name === 'deleteDocumentConfirmModal'){
                    // when user clicks outside of the dialog area, the event is dispatched with detail value as 1
                    console.log('inside handleDeleteClick');
                    console.log('event.detail: '+event.detail);
                    console.log('event.detail.status: '+event.detail.status);
                    console.log('this.currentRowActionData.ContentDocumentId: '+this.currentRowActionData.ContentDocumentId);
                    console.log('this.currentRowActionData: '+JSON.stringify(this.currentRowActionData));
                    if(event.detail !== 1){
                        // you can do some custom logic here based on your scenario
                        if(event.detail.status === 'confirm') {
                            let ids = [];
                            ids.push(this.currentRowActionData.ContentDocumentId);
        					let _self = this;
                          deleteFiles({contentDocumentIds: ids,linkedEntityId:this.recordId}).then(function() {
                                _self.getRelatedFiles();
                            });
                        }else if(event.detail.status === 'cancel'){
                            // do something else
                        }
                    }
                    // hides the component
                    this.isDeleteDialogVisible = false;
            }
    }

	connectedCallback()	{
	  this.getRelatedFiles();
      this.initActiveDealerAgreementId();
      // Register error listener for platform event    
      this.registerErrorListener();
      this.handleSubscribe();
	}

    initActiveDealerAgreementId() {
        //get active dealer agreement id for documents in users session
        if (String(this.recordId).startsWith(constants.dealerAgreementIdFirst3Prefix,0)){
            console.log("current record is Dealer Agreement");
            this.activeDealerAgreementId=String(this.recordId);
        } else if (String(this.recordId).startsWith(constants.accountIdFirst3Prefix,0)){
            //fetch from server
            findDealerAgreements({dealerId: this.recordId})
            .then(result => {
                this.activeDealerAgreementId = result;
            })
            .catch(error => {
                console.log("Error getting Dealer's Active Dealer Agreement");
            });
            
        } else {
            console.log("callback from lead(not possible?) or another future supported object");
        }
    }

	async getRelatedFiles() {
        if(typeof this.dealerAgreementHasVPApproval==='undefined'){
            console.log('da is undefined');
            this.dealerAgreementHasVPApproval = await dealerAgreementHasFinalApproval({idParent: this.recordId}); //#1.2++
        }
        console.log('this.dealerAgreementHasVPApproval='+this.dealerAgreementHasVPApproval);
        if(typeof this.dealerActiveWActivatedDADate==='undefined'){
            console.log('dealerActiveWActivatedDADate is undefined');
            this.dealerActiveWActivatedDADate = await dealerIsActiveWActivatedDate({idParent: this.recordId}); //#1.2++
        }
        
    

	    relatedFiles({idParent: this.recordId})
	    .then(data => {
			// let's setup the dynamic actions
			let dataWithActions = [];
			// loop over each row in the array if there's data
			if(data) {
				data.forEach((row) => {
				        // initialize the rowActions property/array
				        row.rowActions = [];
                        row.linkName = '/'+ row.ContentDocumentId;
                        row.OwnerId = row.Owner.Name;
						// every row gets preview
				        row.rowActions.push({ label: 'Preview', name: 'PREVIEW' });
				        // if there's no category, the only other action should be recategorize (if have permissions)
				        if(!row.Category__c) {
				            if(hasRecategorizePermission) row.rowActions.push({ label: 'Recategorize', name: 'RECATEGORIZE' });
                        }
                        else {
							// use combination of status and permissions to determine actions
							switch(row.Status__c) {
							  case constants.contentDocumentPendingStatus:
							    if(hasApprovePermission) row.rowActions.push({ label: 'Approve', name: 'APPROVE' });
							    if(hasRejectPermission) row.rowActions.push({ label: 'Reject', name: 'REJECT' });
							    if(hasRecategorizePermission) row.rowActions.push({ label: 'Recategorize', name: 'RECATEGORIZE' });
							    if(hasDeletePermission) row.rowActions.push({ label: 'Delete', name: 'DELETE' });
							    break;
							  case constants.contentDocumentApprovedStatus:
							    if(hasRejectPermission) row.rowActions.push({ label: 'Reject', name: 'REJECT' });
                                if(this.dealerAgreementHasVPApproval==false && this.dealerActiveWActivatedDADate==false) row.rowActions.push({ label: 'Recategorize', name: 'RECATEGORIZE' });
							    break;
							  default:
							    // sent, reject, received, failed get no additional actions
							}
                        }
					    // push the current row into the dataWithActions
					    dataWithActions.push(row);
				    }
				);
			}
	        // set the file data
	        this.fileValue = dataWithActions;
	    })
	    .catch(error => {
	      console.log('document manager howdy!!'+JSON.stringify(error));
	        let errorMsg=error.body.message;
	        console.log('error.mesage '+errorMsg);
	        this.dispatchEvent(

	            new ShowToastEvent({
	                title: 'Error!!',
	                message: errorMsg,
	                variant: 'error',
	            }),
	        );
	    });
	}

	handleRowActions(event) {
        let actionName = event.detail.action.name;

        window.console.log('actionName ====> ' + actionName);

        let row = event.detail.row;

        window.console.log('row ====> ' + row);
        // eslint-disable-next-line default-case
        switch (actionName) {
            case 'PREVIEW':
                this.previewCurrentRecord(row);
                break;
            case 'DELETE':
                this.deleteCurrentRecord(row);
                break;
            case 'APPROVE':
                this.approveCurrentRecord(row);
                break;
            case 'REJECT':
                this.rejectCurrentRecord(row);
                break;
            case 'RECATEGORIZE':
                this.recategorizeCurrentRecord(row);
                break;
        }
    }

    previewCurrentRecord(currentRow) {
            console.log('Inside Preview'+currentRow);
            this.filePreview(currentRow.ContentDocumentId);
    }

    deleteCurrentRecord(currentRow){
            // set the action data
            this.currentRowActionData = currentRow;
            let name = currentRow.Title;
            this.deleteDialogMessage = stringUtils.format(deleteDialogMessageTemplate, name);
            // show the approve dialog
            this.isDeleteDialogVisible = true;
    }

    approveCurrentRecord(currentRow){
		// set the action data
		this.currentRowActionData = currentRow;
		// build the message
		this.approveDialogMessage = stringUtils.format(approveDialogMessageTemplate, currentRow.Title);
		// show the approve dialog
		this.isApproveDialogVisible = true;
    }

    rejectCurrentRecord(currentRow)
    {
		// set the action data
		this.currentRowActionData = currentRow;
		// build the message
		this.rejectDialogMessage = stringUtils.format(rejectDialogMessageTemplate, currentRow.Title);
		// show the approve dialog
		this.isRejectDialogVisible = true;
    }

    recategorizeCurrentRecord(currentRow)
    {

		// set the action data
		this.currentRowActionData = currentRow;
		// build the message
		this.recategorizeDialogMessage = stringUtils.format(recategorizeDialogMessageTemplate, currentRow.Title);
		// set current value
		this.currentRowCategory = currentRow.Category__c;
		// show the approve dialog
		this.isRecategorizeDialogVisible = true;
    }

	/*
		Handles setting the newly uploaded file value.
		What is file value????
	*/
	handleFileValueChange(event) {
		// mp: just need to refresh data table here...
		// this.fileValue = event.detail;
		this.getRelatedFiles();
		console.log('inside parent handleFileValueChange');
     }

	/*
		Handles sorting the data table.
	*/
	handleSortdata(event)
	{
		this.sortBy=event.detail.fieldName;
		this.sortDirection=event.detail.sortDirection;
		console.log('this.fileValue sortData '+this.fileValue);
		this.fileValue=sortFilesByDate(this.fileValue,this.sortDirection);
	}



	/*
		Handles setting local attribute when category combo changes.
	*/
    handleCategoryOnChange(event) {
        if(this.currentRowActionData.Category__c === event.detail.value) {
            this.recategorizeConfirmButtonDisabled = true;
        }
        else {
            this.recategorizeConfirmButtonDisabled = false;
        }
        this.currentRowCategory = event.detail.value;
    }


    handleRejectClick(event) {
            console.log('handleRejectClick');

    		// for some reason, sometimes a click event is fired but there's no target
            if(!event.target) return;
    		// was the click event fired from our recategorize document confirm modal?
    		if(event.target.name === 'rejectDocumentConfirmModal'){

                // when user clicks outside of the dialog area, the event is dispatched with detail value as 1
                if(event.detail !== 1){
                    // you can do some custom logic here based on your scenario
                    if(event.detail.status === 'confirm') {
    					// deepika to implement server call here...
                            let _self = this;
                            console.log('rejectReason '+this.rejectReason);
                            console.log('rejectComment '+this.rejectComment);
                            rejectFiles({contentDocumentId: this.currentRowActionData.ContentDocumentId,rejectReason:this.rejectReason,rejectComment:this.rejectComment,parentId:this.recordId}).then(function() {
                             _self.getRelatedFiles();
                            console.log('rejectFiles is called');
                            });
                             
                    }else if(event.detail.status === 'cancel'){
    		            // hides the component
    		            this.isRejectDialogVisible = false;
                    }
                    this.isRejectDialogVisible = false;
                }
            }
        }




    handleRecategorizeOnChange(event) {
        const field = event.target.name;
        if (field === 'rejectReason') {
            this.rejectReason = event.target.value;
        } else if (field === 'rejectComment') {
            this.rejectComment = event.target.value;
        }

        console.log('this.rejectReason: ' + this.rejectReason);
        console.log('this.rejectComment: ' + this.rejectComment);

        // is rejectReason or rejectComment blank?
		if(!this.rejectReason || !this.rejectComment) {
		    // enable the reject button
			this.rejectButtonDisabled = true;

        }
        else {
            // disable the reject button
            this.rejectButtonDisabled = false;
        }
    }

	/*
		Handles the file preview.
	*/
    filePreview(contentDocumentId) {
        // navigation service to the show preview
        this[NavigationMixin.Navigate]({
            type: 'standard__namedPage',
            attributes: {
                pageName: 'filePreview'
            },
            state : {
                // set the content id
                selectedRecordId:contentDocumentId
            }
          })
    }

    /*1.2 Subscribe to Dealer Agreement Event channel to monitor VP Approval during an active end user session*/
    handleSubscribe() {
        // Callback invoked whenever a new event message is received
        const messageCallback = (response) => {
            console.log('New message received: ', JSON.stringify(response));

            //does event payload belong to this session's Dealer Agreement
            if(this.activeDealerAgreementId==response.data.payload.Dealer_Agreement_Record_ID__c){
                //if found and VP Approval true, update rowActions
                if(response.data.payload.Has_VP_Approval__c){
                    console.log("rebuild rowActions");
                    this.dealerAgreementHasVPApproval=true;
                    this.getRelatedFiles();
                }
            }
            
        };

        // Invoke subscribe method of empApi. Pass reference to messageCallback
        subscribe(this.channelName, -1, messageCallback).then(response => {
            // Response contains the subscription information on subscribe call
            console.log('Subscription request sent to: ', JSON.stringify(response.channel));
            this.subscription = response;
        });
    }

    registerErrorListener() {
        // Invoke onError empApi method
        onError(error => {
            console.log('Received error from server: ', JSON.stringify(error));
            // Error contains the server-side error
        });
    }

}