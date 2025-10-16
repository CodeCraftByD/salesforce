/**
* Created by dekhanna on 12/8/2020.
*  #1 - EFSALES-9075 - JaLandry - Business License Expiration Date non NY, non SC no email; busLicForNYSCuploaded
*  #1.1 - count and array is being carried across dealerships because 
*/
 import { LightningElement,track,api,wire } from 'lwc';
 import { notifyRecordUpdateAvailable } from 'lightning/uiRecordApi';
 import {ShowToastEvent} from 'lightning/platformShowToastEvent';
 import relatedFiles from '@salesforce/apex/DocumentManagerController.relatedFiles';
 //import {refreshApex} from '@salesforce/apex';
 import { sortFilesByDate } from 'c/documentManagerShared';
 import { constants } from 'c/shared';
 import updateCategoryForFileUploaded from '@salesforce/apex/DocumentManagerController.updateCategoryForFileUploaded';
 import retrieveParentRecord from '@salesforce/apex/DocumentManagerController.retrieveParentRecord';
 import getDealerState from '@salesforce/apex/DocumentManagerController.getDealerState';
 import OneEmailNotification from '@salesforce/apex/DocumentManagerController.OneEmailNotification';
 //let Attach_Ids = []; 1.1--
 
 
 export default class FileUploader extends LightningElement {
     Attach_Ids = [];//1.1+
   //Boolean tracked variable to indicate if modal is open or not default value is false as modal is closed when page is loaded
     @track isModalOpen = false;
     @track category;
     @track error=false;
     @track errorCategory=false;
     @track errorMessage='';
     @track errorCategoryMessage='';
     errorDate=false;
     errorDateMessage='';
     @api getIdFromParent;
     @track fileName = '';
     @track UploadFile = 'Upload File';
     @track showLoadingSpinner = false;
     @track isTrue = false;
     @track wiredFilesList = [];
     @api fileValue;
     @track ConfirmModalOpen = false;
     @track isFileUploaded = false;
     //refreshTable;
 
      selectedRecords;
         filesUploaded = [];
         file;
         fileContents;
         fileReader;
         content;
         MAX_FILE_SIZE = 15000000000;
   showFileUploader=false;
   //bus date exp
   showExpDate=false;
   currentDate = new Date();
   currntPlsYrDate = new Date(this.currentDate.setFullYear(this.currentDate.getFullYear() + 1));
   locDateString = this.currntPlsYrDate.toISOString();
   noDateString = '';
   busLicExpDate = new Date(this.locDateString);
   currentDateMin1 = new Date( new Date().setDate(new Date().getDate()-1));
   tenYearDate = new Date(new Date().setFullYear(new Date().getFullYear() + 10));
   billingState = '';
   stateIsNYorSC = false;
   busLicForNYSCuploaded = false;
   busLicWOutNtifctn = false;

    handleYesClick(){
        this.isFileUploaded = false;
        this.openModal();
    }
 
     openModal() {
         // to open modal set isModalOpen tarck value as true
         console.log('modal 1!');
         this.isModalOpen = true;
         this.showFileUploader=false;
         this.ConfirmModalOpen = false;
     }
     closeModal() {
        console.log('inside closeModal');
         // to close modal set isModalOpen tarck value as false
         this.isModalOpen = false;
         this.showFileUploader=false;
         this.ConfirmModalOpen = false;
         //if(Attach_Ids.length >= 1){ //EFSALES-9075
        if((this.Attach_Ids.length > 1) ||
        (this.Attach_Ids.length == 1 && this.busLicWOutNtifctn==false))
        {
            
            this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Dealer Setup has been notified',
                variant: 'success',
                mode:'sticky'
            }),
        );
        }
     }

     closeConfirmModal() {
        console.log('inside closeConfirmModal');
        // to close modal set isModalOpen tarck value as false
        this.isModalOpen = false;
        this.ConfirmModalOpen = false;
        //if(Attach_Ids.length >= 1){ //EFSALES-9075
        if((this.Attach_Ids.length > 1) ||
           (this.Attach_Ids.length == 1 && this.busLicWOutNtifctn==false))
        {
            OneEmailNotification({Attachment_Ids: this.Attach_Ids, idParent:this.getIdFromParent})

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Dealer Setup has been notified',
                    variant: 'success',
                    mode:'sticky'
                }),
            );
        }
        
        
    }
 
     resetUpload()
     {
         this.isModalOpen = false;
          console.log('inside resetUpload called');
           this.getRelatedFiles();
           this.isTrue=false;
           this.UploadFile ='Upload File';
           this.fileName='';
           this.category='';
           this.fileContents = '';
           this.content = '';
           this.filesUploaded='';
           this.file='';
           console.log('this.uploadFile '+this.uploadFile);
           console.log('this.isTrue '+this.isTrue);
           this.error=false;
           this.errorCategory=false;
           this.ConfirmModalOpen = false;
           this.showExpDate = false;
 
           //if(Attach_Ids.length >= 1){ //EFSALES-9075
           if((this.Attach_Ids.length > 1) ||
              (this.Attach_Ids.length == 1 && this.busLicWOutNtifctn==false))
           {  
              OneEmailNotification({Attachment_Ids: this.Attach_Ids, idParent:this.getIdFromParent})
           }
     }
 
     resetValues()
     {
         this.isModalOpen = false;
          console.log('inside resetValues called');
           this.getRelatedFiles();
           this.isTrue=false;
           this.UploadFile ='Upload File';
           this.fileName='';
           this.category='';
           this.fileContents = '';
           this.content = '';
           this.filesUploaded='';
           this.file='';
           console.log('this.uploadFile '+this.uploadFile);
           console.log('this.isTrue '+this.isTrue);
           this.error=false;
           this.errorCategory=false;
           this.ConfirmModalOpen = false;
           this.showExpDate = false;
 
         /*if(Attach_Ids.length >= 1){
             OneEmailNotification({Attachment_Ids: Attach_Ids, idParent:this.getIdFromParent})
         }*/
     }
 
     updateCategory(event) {
                      console.log('event.target.value' +event.target.value);
                     // if(event.target.value!='None'||event.target.value!=undefined || event.target.value!='')
                      if(event.target.value)
                      {
                          this.category=event.target.value;
                          this.errorCategory=false;
                          this.error=false;
                          this.showFileUploader=true;
                          if(this.category=='Business License' && !this.getIdFromParent.startsWith(constants.leadIdFirst3Prefix,0))
                          {
                            this.showExpDate=true;
                            this.errorDate=true;
                            this.errorDateMessage='Please select valid Date';
                            this.showFileUploader=false;
                            this.initDlrState();
                          }
                          else
                          {
                            this.showExpDate=false;
                          }
                            
                      }
                      else
                      {
                          this.errorCategory=true;
                          this.errorCategoryMessage='Please select valid Category';
                          this.showFileUploader=false;
                          this.showExpDate=false;
                      }
                  }

     dateHandleChange(event){
        
        console.log('event.target.value =' +event.target.value);
            if(event.target.value)
            {
                console.log('currentDate =' + this.currentDate );
                console.log('this.currentDateMin1 =' + this.currentDateMin1 );
                console.log('tenYearDate =' + this.tenYearDate );
                
                this.busLicExpDate=new Date(event.target.value);
                console.log('busLicExpDate =' + this.busLicExpDate );
                if(this.busLicExpDate < this.currentDateMin1)
                {
                    this.errorDate=true;
                    this.errorDateMessage='Selected Business License Expiration Date must not be in the past';
                    this.showFileUploader=false;
                    this.showExpDate=true;
                }
                else if(this.busLicExpDate > this.tenYearDate)
                {
                    this.errorDate=true;
                    this.errorDateMessage='Selected Business License Expiration Date must not be greater than 10 years from today';
                    this.showFileUploader=false;
                    this.showExpDate=true;
                }
                else
                {
                    this.errorDate=false;
                    this.errorDateMessage='';
                    this.showFileUploader=true;
                    this.showExpDate=true;
                }

            }
            else
            {
                this.errorDate=true;
                this.errorDateMessage='Please select valid Date';
                this.showFileUploader=false;
                this.showExpDate=true;
            }
     }
 
     getRelatedFiles() {
           console.log('Child getrealtedFiles method is called');
                 relatedFiles({idParent: this.getIdFromParent})
                 .then(data => {
                     this.fileValue = data;
                        if(this.fileValue)
                        {
                            this.fileValue = sortFilesByDate(this.fileValue, 'asc');
                         }
                     console.log('inside .thendata');
                     // Creates the event with the data.
                         const selectedEvent = new CustomEvent("filevaluechange", {
                           detail: this.fileValue
                         });
 
                         // Dispatches the event.
                         this.dispatchEvent(selectedEvent);
                 })
                 .catch(error => {
                     console.log('howdy!!'+JSON.stringify(error));
                     this.dispatchEvent(
                         new ShowToastEvent({
                             title: 'Errorrrrrr!!',
                             message: error.message,
                             variant: 'error',
                         }),
                     );
                 });
             }
         get acceptedFormats() {
                        return ['.pdf', '.png', '.svg', '.gif','.jpg','.jpeg','.xml','.svg','.xls','.xlsx','.xlsm','.docx','.doc','.txt','.rtf','.mp3','.wav','.mp4','.mov','.avi','.js','.css','.zip','.ppt','.pptx','.ics','.woff','.ttf'];
                    }
 
         handleUploadFinished(event) {
            // Get the list of uploaded files
            const uploadedFiles = event.detail.files;
            let uploadedFileNames = '';
            let ids = [];
            for(let i=0;i<uploadedFiles.length;i++)
            {
                ids.push(uploadedFiles[i].documentId);
                this.Attach_Ids.push(uploadedFiles[i].documentId);
            }
            this.isFileUploaded = true;
            console.log('category value inside uploadFinished'+this.category);
            console.log('docmentId of the fileUploaded '+uploadedFiles[0].documentId);
            console.log('Attach_Ids===='+this.Attach_Ids);
            
            //no need of recordId
             this.showFileUploader=false;
            updateCategoryForFileUploaded({documentIds:ids,idParent:this.getIdFromParent,category:this.category,busLicExpDate:this.busLicExpDate})
             .then(result => {

                      if(this.category=='Business License')
                      {
                        if(this.stateIsNYorSC)
                        {
                            this.busLicForNYSCuploaded = true;
                        }
                        else
                        {
                            this.busLicWOutNtifctn = true;
                        }
                      }
 
                      //this.resetUpload();
                      this.resetValues();
                      
                      // Showing Success message after file insert
                      this.dispatchEvent(
                          new ShowToastEvent({
                              title: 'Success',
                              message: 'File Uploaded Successfully.',
                              variant: 'success',
                          }),
                      );
                      this.ConfirmModalOpen = true;
                      if(this.getIdFromParent.startsWith(constants.dealerAgreementIdFirst3Prefix,0))
                      {
                        notifyRecordUpdateAvailable([{recordId: this.getIdFromParent}]);
                      }
 
                  })
                  .catch(error => {
                      // Showing errors if any while inserting the files
                      window.console.log(error);
                      this.dispatchEvent(
                          new ShowToastEvent({
                              title: 'Error while uploading File',
                              message: error.message,
                              variant: 'error',
                          }),
                      );
                  });
              }
     /*
       If we are uploading documents under the DealerAgreement,those documents should be linked to the parent
       dealer record instead of DealerAgreement record
     */
     connectedCallback()	{
       if (!this.getIdFromParent.startsWith(constants.accountIdFirst3Prefix,0) && !this.getIdFromParent.startsWith(constants.leadIdFirst3Prefix,0)) {
        retrieveParentRecord({idParent:this.getIdFromParent})
        .then(result=>{
             this.getIdFromParent=result;
             console.log('result '+JSON.stringify(result));
        })
        }

     }

    initDlrState() {

        if(this.billingState=="")
        {
            getDealerState({dealerId:this.getIdFromParent})
            .then(result=>{
                this.billingState = result;
                console.log('getDealerState result '+JSON.stringify(result));
                console.log('this.billingState = ' + this.billingState);
                if(this.billingState=="New York" || this.billingState=="South Carolina"){
                    this.stateIsNYorSC=true;
                }
                console.log('this.stateIsNYorSC = ' + this.stateIsNYorSC);
            })
        }
        
     }
 
 }