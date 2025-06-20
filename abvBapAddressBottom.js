import { LightningElement , track, api, wire} from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import insertBapVoting from '@salesforce/apex/AbvGetBapRequestData.insertBapVoting';
import deleteVoteRecord from '@salesforce/apex/AbvGetBapRequestData.deleteVoteRecord';
import getPicklistvalues from '@salesforce/apex/AbvGetBapRequestData.getPicklistvalues';
import checkVotes from '@salesforce/apex/AbvGetBapRequestData.checkVotes';
import getBapCycleData from '@salesforce/apex/AbvGetBapRequestData.getBapCycleData';

import fetchStatusPicklistValues from '@salesforce/apex/GetRXCreditRequestData.fetchStatusPicklistValues';
import staticImages from "@salesforce/resourceUrl/BAP_ResourceFile";
import USER_ID from '@salesforce/user/Id';
import ABV_MyPal_DenialReason from "@salesforce/label/c.ABV_MyPal_DenialReason";
import ABV_MyPal_Thankyou from "@salesforce/label/c.ABV_MyPal_Thankyou";
import ABV_MyPal_TryAgain from "@salesforce/label/c.ABV_MyPal_TryAgain";
import ABV_MyPal_NoVoteCount from "@salesforce/label/c.ABV_MyPal_NoVoteCount";
import ABV_MyPal_Vote from "@salesforce/label/c.ABV_MyPal_Vote";
import { publish, MessageContext , createMessageContext} from 'lightning/messageService';
import abvRxMessageChannel from '@salesforce/messageChannel/abvRxMessageChannel__c';
import getBapVotingDetail from '@salesforce/apex/AbvGetBapRequestData.getBapVotingDetail';
import getAllBapAddressDetailFilteredRecord from '@salesforce/apex/AbvGetBapRequestData.getAllBapAddressDetailFilteredRecord';
import getTodaysDate from '@salesforce/apex/AbvGetBapRequestData.getTodaysDate';
import getCurrentUserType from '@salesforce/apex/AbvGetBapRequestData.getUserType';




export default class AbvRxCreditBottom extends LightningElement {

    bapAddressData;
    bapAddressDataList;
    bapAddressDataSearch;
    denialReason;
    allArchivedData;
    allRequestData;
    currentLogginedUserType;
    approve_Alert = false;
    reject_Alert = false;
    bapRecID;
    cyData;
    @track bapResetRecordID;
    s1value;
    s2value;
    // Added: Track for Rep requested 
    @track isRepRequestedChecked = false;
   
    ic_options = staticImages + "/BAP_ResourceFile/BAP_Images/settingsIcon.png";
    ic_sort = staticImages + "/BAP_ResourceFile/BAP_Images/ic_sort.svg";
    ic_approved = staticImages + "/BAP_ResourceFile/BAP_Images/ic_approved.svg";
    ic_conflict = staticImages + "/BAP_ResourceFile/BAP_Images/ic_conflict.svg";
    ic_waiting = staticImages + "/BAP_ResourceFile/BAP_Images/ic_waiting.svg";
    ic_in = staticImages + "/BAP_ResourceFile/BAP_Images/ic_in.svg";
    ic_out = staticImages + "/BAP_ResourceFile/BAP_Images/ic_out.svg";
    ic_forced = staticImages + "/BAP_ResourceFile/BAP_Images/ic_forced.svg";
    ic_submitted = staticImages + "/BAP_ResourceFile/BAP_Images/ic_submitted.svg";
    ic_canceled = staticImages + "/BAP_ResourceFile/BAP_Images/ic_canceled.svg";
    ic_reject = staticImages + "/BAP_ResourceFile/BAP_Images/ic_reject.svg";
    ic_edit = staticImages + "/BAP_ResourceFile/BAP_Images/ic_edit.svg";
    ic_noaction = "https://cdn.iconscout.com/icon/premium/png-512-thumb/no-action-3077592-2622344.png?f=webp&w=30";
    showFilter = false;
    showDetailsmodal = false;
    showConfirmationmodal = false;
    showModifyDecisionmodal = false;
    showResetModifyDecisionmodal = false;
    approve_Alert = false;
    reject_Alert = false;
    type;
    requestor;
    professional;
    zip;
    status;
    originalRequestData;
    userZipCodes;
    loggedInUserId = USER_ID;
    @track showSpinner = false;

    /**----------------------------------------------------------------------------------------------------------------- */
    //Setting up message channel to stablish communication between components
    //@wire(MessageContext)
    messageContext = createMessageContext();

    /**----------------------------------------------------------------------------------------------------------------- */
    paginationData
    @track selectedtab = 'all';
    @track denyReasonPicklist = [];
    @api statusPickListOptions = [];
   // @track statusfilteredBapAddressDetails = [];
    
    denialReason;
    @track resetVal;
    isUserVoteSubmitted = false;
    showResetModal = false;
    archivedcount=0;

    @track tabs = [
       {label:"All Address ", value:"all", bubbletext : '0'}
    ];

    get presentQuarter(){
        return 'Q' + Math.floor((new Date().getMonth() / 3) + 1);
    }

    allArchivedData;
    allRequestData;
    approve_Alert = false;
    reject_Alert = false;
    baprecodID;
    isUserSubmittedApprove = false;
    userSubmittedVote ;
    userSubmittedVote;
    bapAddressDataFilter;

    

    @track dataToTransfer = {
        archived : undefined,
        request : undefined,
    }
    
    showSpinner = false;
    showModifyDecisionmodal = false;
    isCurrentDecisionApproved = false;
    userZipCodes;
    loggedInUserId = USER_ID;
    @api loggedInUserName;
    homeOfficeUser;
    ccData;
    @api creditCycleData;

    @api userType;

    @api get isUserHomeOffice(){
        return this.homeOfficeUser;
    }

    get tabselects(){
        return {
            all: this.selectedtab === 'all',
            
        }
    }

    get isDataPresent(){
        return this.paginationData && this.paginationData.length > 0 ? true : false;
    }

    get noDenialReasonMessage(){
        return ABV_MyPal_DenialReason;
    }

    get firstPaginationButton(){
        return !this.enableFirstTrue;
    }

    get secondPaginationButton(){
        return !this.enablePreviousTrue;
    }

    get thirdPaginationButton(){
        return !this.enableNextTrue;
    }

    get fourthPaginationButton(){
        return !this.enableLastTrue;
    }

    connectedCallback(){
      this.fetchBapCycleData();
        this.fetchDenyReasonPicklistValues(); 
        this.getCurrentUserType();
        this.getAllBapAddressDetail(); 
        this.fetchStatusFilterPicklistValue();       
    }

    fetchBapCycleData(){
         getBapCycleData().then(data => {
            this.cyData = data;
            this.s1value=this.cyData.S1_abv__c;
            this.s2value=this.cyData.S2_abv__c;
        }).catch(error => {
            this.cyData = undefined;
            console.error(error);
        });
    }
      getCurrentUserType() {
       
        getCurrentUserType().then((data) => {
            this.currentLogginedUserType = data;
        }).catch((error) => {
            console.error("Error while getting user type , method : getUserTerritoryType ", error);
        });
    }

    getUserType() {
        getUserType().then((data) => {
            this.loggedInUserType = data;
           
        }).catch((error) => {
            console.error("Error while getting user type , method : getUserTerritoryType ", error);
        });
    }
  
    getAllBapAddressDetail(){
       
        getAllBapAddressDetailFilteredRecord().then(async result => {
            this.tabs[0].bubbletext = String(result ? result.length : 0);
            this.bapAddressData = result ? JSON.parse(JSON.stringify(result)) : undefined;
          //  console.log('line 203',JSON.stringify(this.bapAddressData));
             this.bapAddressDataSearch = this.bapAddressData ? JSON.parse(JSON.stringify(this.bapAddressData)) : undefined;
             
          if(this.searchParam != ''){
            this.executeSearchAndFilter({detail : { value : this.searchParam}});
           }

           if(this.statusParam != ''){
            this.executeStatusFilter({detail : { value : this.statusParam}});
           }
               for (let i = 0; i < this.bapAddressData.length; i++) {
                    
                for(let j = 0; j < this.bapAddressData[i].bapList.length; j++){
                  let approvedVotes=0,rejectedVotes=0;
                  let statusIcon='',statusClass='',votevalue='',userSubmittedVote=false; 
                  if(this.bapAddressData[i].bapList[j].iREP_Status_abv__c === 'In Conflict'){
                        statusIcon = this.ic_conflict;
                        statusClass = "statusMessage inConflictStatus";
                    }else if(this.bapAddressData[i].bapList[j].iREP_Status_abv__c === 'Approved'){
                        statusIcon = this.ic_approved;
                        statusClass = "statusMessage approvedStatus";
                    }else if(this.bapAddressData[i].bapList[j].iREP_Status_abv__c === 'Awaiting Decision'){
                        statusIcon = this.ic_waiting;
                        statusClass = "statusMessage awaitingStatus";
                    }else if(this.bapAddressData[i].bapList[j].iREP_Status_abv__c === 'Denied'){
                        statusIcon = this.ic_reject;
                        statusClass = "statusMessage rejectedStatus";
                    }else if(this.bapAddressData[i].bapList[j].iREP_Status_abv__c === 'No Action'){
                        statusIcon = this.ic_noaction;
                        statusClass = "statusMessage rejectedStatus";
                    } 

                    
                    
                  if(this.bapAddressData[i].bapList[j].BAP_Address_Votings__r && this.bapAddressData[i].bapList[j].BAP_Address_Votings__r.length > 0){
                       this.bapAddressData[i].bapList[j].BAP_Address_Votings__r.forEach(votes => {                                
                                if(votes.Vote_abv__c === 'Approve' ){
                                approvedVotes++;
                                }
                               if(votes.Vote_abv__c === 'Deny' ){
                                    rejectedVotes++;
                                }
                                
                                let obj1 = {
                                        statusIcon : statusIcon,
                                        statusClass : statusClass,
                                        isUserVoteSubmitted : true,
                                        userSubmittedVote : (votes.Vote_abv__c=== 'Approve') ? 'Approved' : 'Denied',
                                        approvedVotes: approvedVotes,
                                        rejectedVotes: rejectedVotes,
                                        isUserSubmittedApprove : (votes.Vote_abv__c=== 'Approve') ? true : false,
                                        
                                };
                          
                          
                           votevalue=  (userSubmittedVote==false) ? votes.Vote_abv__c: votevalue; 
                           
                           if(votes.Vote_Submitter_abv__c === USER_ID){
                            userSubmittedVote=true;   
                           }
                          
                        });
                       
                       
                    }
                   
                    if (this.bapAddressData[i].bapList[j].Matching_Status_abv__c === 'Matched') {
                        this.bapAddressData[i].bapList[j].Matching_Status_abv__c = true;
                        this.bapAddressDataSearch[i].bapList[j].Matching_Status_abv__c = true;
                       
                     } else {
                      this.bapAddressData[i].bapList[j].Matching_Status_abv__c = false;
                      this.bapAddressDataSearch[i].bapList[j].Matching_Status_abv__c = false;
                      
                    }
                   var addressStatus = this.bapAddressData[i].bapList[j].iREP_Status_abv__c;
                   var currentLogginedUserTypes = this.currentLogginedUserType;
                    let obj1 = {
                        statusIcon : statusIcon,
                        statusClass : statusClass,
                        isUserVoteSubmitted : userSubmittedVote,
                        userSubmittedVote : (votevalue=== 'Approve') ? 'Approved' : 'Denied',
                        approvedVotes: approvedVotes,
                        rejectedVotes: rejectedVotes,
                        isUserSubmittedApprove : (votevalue=== 'Approve') ? true : false,
                        isRDUserValidation :  ((addressStatus == 'Approved' || addressStatus == 'Denied') && currentLogginedUserTypes == 'RD') ? true : false,
                      
                    };
                   
                    this.bapAddressData[i].bapList[j]={ ...this.bapAddressData[i].bapList[j], ...obj1 };
                   
                }
                  this.bapAddressDataFilter = this.bapAddressData ? JSON.parse(JSON.stringify(this.bapAddressData)) : undefined;
            }
           // this.filterApprovedBapAddresses();
           // Added: Apply Rep Requested filter if checkbox is checked
                //this.filterRepRequestedRecords();
        }).catch(error => {
            this.showSpinner = false;
            console.error(error);
        });
      
    }
    // Added: Filtering logic for rep Requested

    executeRepFilter(event){
        console.log('executeRepFilter :',event.detail);
        this.isRepRequestedChecked = event.detail;
        this.filterRepRequestedRecords();
    }       


    filterRepRequestedRecords() {
          if (this.isRepRequestedChecked) {
              const repRequestedData = this.bapAddressData.filter(wrapper =>
               wrapper.bapList.some(bap => bap.BAP_HCP_HAS_RR_ADDRESS_ABV__c === 'REP REQUESTED')
            );
            
         console.log('Rep requested records:', repRequestedData);
             this.bapAddressDataFilter = repRequestedData;

      } else {
           this.bapAddressDataFilter = this.bapAddressData ? JSON.parse(JSON.stringify(this.bapAddressData)) : undefined;
        }
    }

   /* filterApprovedBapAddresses(){
        console.log('line 303');
         this.statusfilteredBapAddressDetails = this.bapAddressData
    .map(wrapper => {
        const approvedBaps = wrapper.bapList.filter(bap => bap.iREP_Status_abv__c === 'Approved');
        return approvedBaps.length > 0
            ? { ...wrapper, bapList: approvedBaps }
            : null;
    })
    .filter(wrapper => wrapper !== null);

         console.log('line 307',this.statusfilteredBapAddressDetails.length);
        console.log('line 307',JSON.stringify(this.statusfilteredBapAddressDetails)); 
    }*/

    showModificationmodal(event){
        this.baprecodID = event.currentTarget.dataset.id;
        
        this.showModifyDecisionmodal = true;
        const currentDecision = event.currentTarget.dataset.currentDecision;
        const dataIndex = event.currentTarget.dataset.index ? Number(event.currentTarget.dataset.index) : Number(0);
        if(currentDecision === 'Approved'){
            this.isCurrentDecisionApproved = true;
            this.createVotingRcrData.selectedStatus = 'Deny';
            //this.fetchDenyReasonPicklistValues();
            this.currentVote= 'Deny';
        }else{
            this.isCurrentDecisionApproved = false;
            this.createVotingRcrData.selectedStatus = 'Approve';
            this.currentVote =  'Approve';
        }
        
    }

  
    fetchStatusFilterPicklistValue(){
        fetchStatusPicklistValues().then(result => {
            this.statusPickListValues = result ? result.filter(e => e.label !== 'Canceled' && e.label !== 'Forced'&& e.label !== 'Submitted') : [];
            this.statusPickListOptions =this.statusPickListValues;
            this.showSpinner = false;
        }).catch(error => {
            this.showSpinner = false;
            console.error('Error fetching status picklist : ' , error);
        });
    }

    mapFields(requestData){
        
        return new Promise ((resolve , reject) => {
            try {
                let obj;
                let mappedData = requestData.map(function(e) {
              
            
                for(let j = 0; j <e.bapList.length; j++){
                 
                    let type, typeIcon, statusIcon, statusClass, finalVoteIcon, finalVoteClass;
                    
                    

                    let approvedVotes = 0, rejectedVotes = 0, isUserVoteSubmitted = false , userSubmittedVote, userSubmittedVoteAPI;
                    let isUserSubmittedApprove = false;
                    if(e.bapList[j].BAP_Address_Votings__r && e.bapList[j].BAP_Address_Votings__r.length > 0){
                        e.bapList[j].BAP_Address_Votings__r.forEach(votes => {
                                isUserVoteSubmitted = true;
                                userSubmittedVote = votes.Vote_abv__c;
                                if(userSubmittedVote === 'Approve') isUserSubmittedApprove = true;

                                if(votes.Vote_abv__c === 'Approve') userSubmittedVote = 'Approved';
                                if(votes.Vote_abv__c === 'Deny') userSubmittedVote = 'Denied';

                                userSubmittedVoteAPI = votes.Vote_abv__c;
                         

                            if(votes.Vote_abv__c === 'Approve' ){
                                approvedVotes++;
                            }

                            if(votes.Vote_abv__c === 'Deny' ){
                                rejectedVotes++;
                            }
                         let obj1 = {    
                         statusIcon : statusIcon,
                         statusClass : statusClass,
                         approvedVotes : approvedVotes,
                         rejectedVotes : rejectedVotes,
                         isUserVoteSubmitted : isUserVoteSubmitted,
                         userSubmittedVote : userSubmittedVote,
                         isUserSubmittedApprove : isUserSubmittedApprove,
                         userSubmittedVoteAPI : userSubmittedVoteAPI
                     };
                        });
                    }
                    const mergedObj = { ...e, ...e.bapList };
                   
                 return {
                        ...mergedObj,...obj
                     } 
                   
                }
            
                }.bind(this));
                resolve(mappedData);
            } catch (error) {
                reject(error);
            }
        });
    }

    updateSelectedTab(event){         
        if(this.selectedtab !== event.detail.selected){
            this.selectedtab = event.detail.selected;
            const payload = { selectedQuarterAndYear : undefined };
            publish(this.messageContext, abvRxMessageChannel, payload);
        }
    }
// Filter logic start 
    handlerFilterView(event){
        this.showFilter = this.showFilter ? false : true;
    }
    
  handleFilters(event){
        let name = event.detail.name;
        let value = event.detail.value;
        
       if(name === 'professional'){
            this.professional = value;
        }
        else if(name === 'zip'){
            this.zip = value;
        }
        else if(name === 'status'){
            this.status = value;
        }
    }

    filterDataByUserRequest(data){
        return new Promise((resolve , reject) => {
            try {
                if(data && data.length > 0){
                    data = data.filter(e => e.selfRequestor === true);
                    resolve(data);
                }else{
                    resolve(data);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    refreshData(event){
        
       
            this.getAllBapAddressDetail();
        
    }
    renderedCallback() {
        
    }
    
    denyReasonSelector(event){
        this.denialReason = event.target.value;
    }

    //Voting logic started from here 
    /**confirmation screen of Approved and deny */
    createVotingRcrData = {};
    isSubmitterInZipList = false;
    showVoteSubmissionSpinner = false;
    currentVote;
    //Confirmation popoup
    userVoteConfirmationHandler(event){
        this.baprecodID = event.currentTarget.dataset.id;
        const buttonClicked = event.currentTarget.dataset.buttonName;
      
        this.approve_Alert = false;
        this.reject_Alert = false;
        if(buttonClicked == 'Approve'){
            this.approve_Alert = true;
            this.showModifyDecisionmodal = true;
            this.currentVote= 'Approve';
        }else if(buttonClicked == 'Deny'){
            this.reject_Alert = true;
            this.isCurrentDecisionApproved = true;
            this.showModifyDecisionmodal = true;
           this.currentVote =  'Deny';
        }
        this.showConfirmationmodal = true;
    }
    
    
    closeConfirmationModal(event){
        this.approve_Alert = false;
        this.reject_Alert = false;
        this.showConfirmationmodal = false;
    }

    
    confirmVoteChange(){
            const allValid = [...this.template.querySelectorAll('.denyReasonPicklist')].reduce((validSoFar, inputCmp) => {
            inputCmp.reportValidity();
            return validSoFar && inputCmp.checkValidity();
        }, true);

        if(allValid){
            this.handleVoteSubmission();
        }
      
    }
    async handleVoteSubmission(){
         
        this.showVoteSubmissionSpinner = true;
        const validations = await this.checkValidations();
        if(!validations){
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: ABV_MyPal_Vote,
                    variant: 'error'
                })
            );
            this.showVoteSubmissionSpinner = false;
            this.closeConfirmationModal();
            this.closeModificationModal();        
        }else{

            this.showVoteSubmissionSpinner = true;
           
            this.createVotingRcrData.parentID = this.baprecodID;
            this.isSubmitterInZipList=true;
            this.insertVotingRcr();
        }
    }

   checkValidations(){
        return new Promise(async resolve => {
            //using javascript's new Date() will return date in browser set local time zone instead of server side (or salesforce set timezone)
            //That's why getting today's date from apex instead of relying on javascript
            const todaysDate = await getTodaysDate(); 
            if (new Date(this.creditCycleData.Approve_Deny_End_Date__c) < new Date(todaysDate) && this.userType =='REP'){
                resolve(false);
            }else if ((new Date(this.creditCycleData.DM_Approve_Deny_Start_Date_abv__c) > new Date(todaysDate) ||
                new Date(this.creditCycleData.DM_Approve_Deny_End_Date_abv__c) < new Date(todaysDate)) 
                && this.userType =='DM'){
                resolve(false);
            }else if ((new Date(this.creditCycleData.RM_Conflicts_Resolution_Start_Date_abv__c) > new Date(todaysDate) ||
                new Date(this.creditCycleData.RM_Conflicts_Resolution_End_Date_abv__c) < new Date(todaysDate)) 
                && this.userType =='RD'){
                resolve(false);
            }else{
                resolve(true);
            }
        });
    }
    
    insertVotingRcr(){

        this.creditCycleData = {...this.creditCycleData , ...{'sobjectType': 'BAP_Cycle_abv__c'}};
       insertBapVoting({ vote : this.currentVote,
        bapAddressId : this.baprecodID,
        reasion :this.denialReason})
            .then((data) => {
                if (data  != undefined  ){//&& this.isSubmitterInZipList == true) {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: ABV_MyPal_Thankyou,
                            variant: 'success'
                        })
                    );
                    this.getAllBapAddressDetail();
                } else if(data == false ){
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error',
                            message: ABV_MyPal_NoVoteCount,
                            variant: 'error',
                            mode : 'sticky'
                        })
                    );
                } else if (data == false) {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error',
                            message: ABV_MyPal_Vote,
                            variant: 'error'
                        })
                    );
                } else {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error',
                            message: ABV_MyPal_TryAgain,
                            variant: 'error'
                        })
                    );
                }



                this.showVoteSubmissionSpinner = false;
                this.isSubmitterInZipList = false;
                this.createVotingRcrData.selectedStatus = {};
                this.closeConfirmationModal();
                this.closeModificationModal();
                this.dispatchEvent(new CustomEvent('refresh' , {
                    detail : {
                        tabName : 'all'
                    }
                }));
                
            })
            .catch((error) => {
                console.error("Error while inserting voting record, method : insertBapVoting", error);
                this.showVoteSubmissionSpinner = false;
            });
    }

    closeModificationModal(event){
        this.showModifyDecisionmodal = false;
        this.isCurrentDecisionApproved = false;
        this.denialReason = undefined;
        this.createVotingRcrData = {};
    }

    denyReasonSelector(event){
        this.denialReason = event.target.value;
        this.createVotingRcrData.denialReason = event.target.value;
    }

   
    fetchDenyReasonPicklistValues(){
       
        this.showVoteSubmissionSpinner = true;
        getPicklistvalues().then(data => {
            if (data) {
                for (let index = 0; index < data.length; index++) {
                    this.denyReasonPicklist.push({
                        label: data[index],
                        value: data[index]
                    });
                }
                this.showVoteSubmissionSpinner = false;
            }else{
                this.showVoteSubmissionSpinner = false;
            }
        }).catch((error) => {
            this.showVoteSubmissionSpinner = false;
            console.error(error);
        });
    }


    requestDetailModalSpinner = false;
    requestDetailModalData = { fromZIPRepData : [] , toZIPRepData : []};
    votingDetailsData;
    async showRequestDetailModal(event){
        event.stopPropagation();
        
        try {
            const dataIndex = event.currentTarget.dataset.index ? Number(event.currentTarget.dataset.index) : 0;
            const addressIndex = event.currentTarget.dataset.id ? Number(event.currentTarget.dataset.id) : 0;
            for (let i = 0; i < this.bapAddressData.length; i++) {
                //this.bapAddressDataList = this.bapAddressData[i].bapList;
               
            }

            this.bapAddressDataList=this.bapAddressData[dataIndex].bapList;            
            
            const relevantData = this.bapAddressDataList[addressIndex];            
            this.showDetailsmodal = true;
            this.requestDetailModalSpinner = true;            
            this.votingDetailsData = await getBapVotingDetail({ bapAddressId : relevantData.Id});
            
            this.votingDetailsData = this.votingDetailsData.map(tmpObject => {
        
                if(tmpObject.Vote_abv__c == 'Pending Action'){
                    tmpObject.voteClass = 'pendingActionButton_popUp';
                }else if(tmpObject.Vote_abv__c == 'Deny'){
                    tmpObject.voteClass = 'rejectedButton_popUp';
                    tmpObject.vote='Denied';
                }else if(tmpObject.Vote_abv__c === 'Approve'){
                    tmpObject.voteClass = 'approvedButton_popUp';
                    tmpObject.vote='Approved';
                    
                }
            return tmpObject;
            });
                    
            
            this.requestDetailModalSpinner = false;

        } catch (error) {
            this.requestDetailModalSpinner = false;
            console.error(error);
        }
        
    }


    mapVoteDetails(userData , votingData){
        return new Promise ((resolve, reject) => {
            try {
                
                let userAndVoteMap = {};
                for(let i = 0 ; i < votingData.length ; i++){
                    userAndVoteMap[votingData[i].Vote_Submitter_abv__c] = votingData[i].Vote_abv__c;
                }
                let fromData = userData.fromZIPRepData ? userData.fromZIPRepData.map(function(e){
                    
                    var obj = {
                        vote : e.User_Name_abv__c in userAndVoteMap ? userAndVoteMap[e.User_Name_abv__c] : 'Pending Action'
                    }
                    
                    if(obj.vote === 'Pending Action'){
                        obj.voteClass = 'pendingActionButton_popUp';
                    }else if(obj.vote === 'Deny'){
                        obj.voteClass = 'rejectedButton_popUp';
                        obj.vote = 'Denied';
                    }else if(obj.vote === 'Approve'){
                        obj.voteClass = 'approvedButton_popUp';
                        obj.vote = 'Approved';
                    }

                    return{
                        ...e,...obj
                    }
                }) : [];
                
                let toData = userData.toZIPRepData ? userData.toZIPRepData.map(function(e){

                    var obj = {
                        vote : e.User_Name_abv__c in userAndVoteMap ? userAndVoteMap[e.User_Name_abv__c] : 'Pending Action'
                    }

                    if(obj.vote === 'Pending Action'){
                        obj.voteClass = 'pendingActionButton_popUp';
                    }else if(obj.vote === 'Deny'){
                        obj.voteClass = 'rejectedButton_popUp';
                        obj.vote = 'Denied';
                    }else if(obj.vote === 'Approve'){
                        obj.voteClass = 'approvedButton_popUp';
                        obj.vote = 'Approved';
                    }

                    return{
                        ...e,...obj
                    }
                }) : [];

                let toReturn = { fromZIPRepData : fromData , toZIPRepData : toData};
                resolve(toReturn);

            } catch (error) {
                reject(error);
            }

        });
    }
   closeRequestDetailsModal(event){
        this.showDetailsmodal = false;
        this.requestDetailModalData = { fromZIPRepData : [] , toZIPRepData : []};
        this.votingDetailsData = undefined;
    }
   handleFilters(event){
        let name = event.detail.name;
        let value = event.detail.value;
        if(name === 'type'){
            this.type = value;
        }
        else if(name === 'requestor'){
            this.requestor = value;
        }
        else if(name === 'professional'){
            this.professional = value;
        }
        else if(name === 'zip'){
            this.zip = value;
        }
        else if(name === 'status'){
            this.status = value;
        }
    }

    @track chipArray = [];
    @api resetFilters(){
        this.bapAddressData = JSON.parse(JSON.stringify(this.bapAddressDataFilter));
        this.chipArray = [];
        this.searchParam = '';
        this.professional = ''; 
        this.zip = '';
        this.status= '';
        this.tabs[0].bubbletext = String(this.bapAddressData ? this.bapAddressData.length : 0);
            
    }

    applyFilters(){
        
        return new Promise(async (resolve , reject) => {
            try {
                /* To make search & filter work as a single unit */
                let dataToApplyFilter = JSON.parse(JSON.stringify(this.bapAddressData));
                if(this.searchParam === ''){
                    this.chipArray = [];
                }
                 
                if(this.professional || this.zip || this.status){

                    let filteredData = [];
                    filteredData=dataToApplyFilter;
                    let tempChips = new Set();

                    if(this.professional && this.professional != ''){
                       
                        filteredData = filteredData.filter(e => (String(e.accWrapper.accountName).toLowerCase().includes(this.professional.toLowerCase())));
                        tempChips.add('Professional : ' + this.professional);
                    }
                    
                    if(this.zip && this.zip !=''){
                        let tempData=[];
                            
                        filteredData.forEach(mainItem => {
                            const bapdata=mainItem.bapList.filter(bapItem => (String(bapItem.BAP_Zip_abv__c).includes(this.zip)));
                            if(bapdata.length>0){
                                tempData.push({accWrapper:mainItem.accWrapper,bapList:bapdata});
                            }
                            
                        });
                        filteredData=tempData;
                        tempChips.add('Zip : ' + this.zip);
                    }

                    if(this.status && this.status !=''){
                        let tempData=[];
                            
                        filteredData.forEach(mainItem => {
                            const bapdata=mainItem.bapList.filter(bapItem => (String(bapItem.iREP_Status_abv__c).includes(this.status)));
                        
                            if(bapdata.length>0){
                                tempData.push({accWrapper:mainItem.accWrapper,bapList:bapdata});
                            }
                            
                        });
                        filteredData=tempData;
                        
                        tempChips.add('Status : ' + this.status);
                    }

                    const allFilterChips = Array.from(tempChips);

                    this.chipArray = [...this.chipArray , ...allFilterChips];
                    
                    this.bapAddressData = filteredData;
                   
                    this.showFilter = false;
                    this.tabs[0].bubbletext = String(filteredData ? filteredData.length : 0);
            
                    resolve(true);
                }
                else{                   
                    this.bapAddressData = this.bapAddressDataFilter;
                    this.showFilter = false;
                    this.tabs[0].bubbletext = String(this.bapAddressData ? this.bapAddressData.length : 0);
            
                    resolve(true);
                }
            } catch (error) {
                this.showSpinner = false;
                reject(error);
            }
        });
            
    }


    async deleteFilters(event){
        
        if(event.detail.includes('Type')){
            this.type = '';
        }
        if(event.detail.includes('Requestor')){
            this.requestor = '';
        }
        if(event.detail.includes('Professional')){
            this.professional = '';
        }
        if(event.detail.includes('Zip')){
            this.zip = '';
        }
        if(event.detail.includes('Status')){
            this.status = undefined;
        }
        if(event.detail.includes('Search Query')){
            this.searchParam = '';
        }


        this.showSpinner = true;
        await this.executeSearchAndFilter({detail : { value : this.searchParam}});
        this.showSpinner = false;
    }

    


    // added as part Of Enhancement for status based Filter logic.
    statusParam = '';
    executeStatusFilter(event){
       // return new Promise(async (resolve, reject) => {
            try{
                this.statusParam = event.detail.value;
               // let dataForSearch = this.bapAddressData ? JSON.parse(JSON.stringify(this.bapAddressData)) : [];
               let dataForSearch = this.bapAddressDataFilter ? JSON.parse(JSON.stringify(this.bapAddressDataFilter)) : [];
                console.log('line 917',dataForSearch);
                if(this.statusParam && this.statusParam != 'All'){
                    console.log('Line 921->',this.statusParam);
                   
                     const statusfilteredRecords = dataForSearch.map(wrapper => {
                        const approvedBaps = wrapper.bapList.filter(bap => bap.iREP_Status_abv__c === this.statusParam);
                        return approvedBaps.length > 0 ? { ...wrapper, bapList: approvedBaps } : null;})
                        .filter(wrapper => wrapper !== null);

                    this.bapAddressData = statusfilteredRecords;
                    console.log('line 926', this.bapAddressData);
                    this.showSpinner = true;
                    this.showSpinner = false;
                    this.tabs[0].bubbletext = String(statusfilteredRecords ? statusfilteredRecords.length : 0);
                   // resolve(true);
                }else{
                    this.bapAddressData = JSON.parse(JSON.stringify(this.bapAddressDataFilter));
                    this.showSpinner = true;
                    this.showSpinner = false;
                    this.tabs[0].bubbletext = String(this.bapAddressData ? this.bapAddressData.length : 0);
                   // resolve(true);
                }
            }
            catch (error) {
                this.showSpinner = false;
               // reject(error);
            }
      //  });
    }

    searchParam = '';
    executeSearchAndFilter(event){
        
        return new Promise(async (resolve, reject) => {
            try {
              
                this.searchParam = event.detail.value;
                console.log('line 960');
                
                let dataForSearch = this.bapAddressData ? JSON.parse(JSON.stringify(this.bapAddressData)) : [];

                if(this.searchParam && this.searchParam.length> 2){
                    this.chipArray = [];
                    this.chipArray.push('Search Query : ' + this.searchParam);
                    
                    const filteredRecords = dataForSearch.filter(e =>
                       (e.accWrapper.accountName && String(e.accWrapper.accountName).toLowerCase().includes(this.searchParam.toLowerCase())) || 
                        (e.accWrapper.speciality && String(e.accWrapper.speciality).toLowerCase().includes(this.searchParam.toLowerCase()))  || 
                        (e.accWrapper.customerNumber && String(e.accWrapper.customerNumber).toLowerCase().includes(this.searchParam.toLowerCase())) || 
                        (e.accWrapper.npiNumber && String(e.accWrapper.npiNumber).toLowerCase().includes(this.searchParam.toLowerCase()))
                        );
                    this.bapAddressData = filteredRecords;
                    
                    /* To make search & filter work as a single unit */
                    this.showSpinner = true;
                    this.showSpinner = false;
                    this.tabs[0].bubbletext = String(filteredRecords ? filteredRecords.length : 0);
        
                    resolve(true);
                }else{
                    this.bapAddressData = JSON.parse(JSON.stringify(this.bapAddressDataFilter));
                    //To prevent applying filter in 2 key strokes\
                    this.chipArray = [];
                    this.showSpinner = true;
                    this.showSpinner = false;
                    this.tabs[0].bubbletext = String(this.bapAddressData ? this.bapAddressData.length : 0);
        
                    resolve(true);
                }
            } catch (error) {
                this.showSpinner = false;
                reject(error);
            }
        });
    }

     resetVoteHandler(event){
        this.showResetModal = true;
        this.bapResetRecordID = event.currentTarget.dataset.id;
        this.checkResetValidation();
    }

    async resetFuncHandler(){
      const validations = await this.checkValidations();
        if(!validations){
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'You cannot Reset the Vote as it is Outside the BAP Cycle',
                    variant: 'error'
                })
            );
        }else{
        if(!this.resetVal){
             this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error',
                            message: 'You don\'t have any vote for this bap-address, kindly cast your vote.',
                            variant: 'error'
                        })
                    );
            this.getAllBapAddressDetail();
            this.showResetModal = false;
        }else{
        deleteVoteRecord({
            bapRecId : this.bapResetRecordID
        }).then((result)=>{
             this.getAllBapAddressDetail();
            this.showVoteSubmissionSpinner = false;
            this.showResetModal = false;
        }).catch((err)=>{
        });
        }
    }
    }

    checkResetValidation(){
        checkVotes({
            bapRecId : this.bapResetRecordID
        }).then((result)=>{
            this.resetVal = result;
        }).catch((error)=>{
        })
    }

    closeResetModificationModal(){
        this.showResetModal = false;
    }

}