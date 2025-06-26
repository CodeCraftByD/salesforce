/*************************************************************************************************
 * Copyright by Autodesk, Inc.
 * The information contained herein is confidential, proprietary to
 * Autodesk, Inc., and considered a trade secret as defined in section
 * 499C of the penal code of the State of California. Use of
 * this information by anyone other than authorized employees of 
 * Autodesk, Inc. is granted only under a written non-disclosure
 * agreement, expressly prescribing the scope and manner of such use.
 * 
 * $Id$ : AssetTransactionController
 * $Created Date$ : 06/25/2018
 * $Author$ : Chaithanya Godla
 * $Description$ : This is the Controller class for Lightning Component used for Asset Transactions
 * $Test Class$ : AssetTransactionControllerTest
 * $Author$      : Chaithanya Godla
 * $Date$        : 10/12/2018 
 * $Description$ : EAPESH-1853 - Asset Reseller Change functionality
 **************************************************************************************************/
public without sharing class AssetTransactionController {

    @AuraEnabled
    public static GetAssetsResponse getAssets(String contractId) {
        return AssetTransactionHelper.getAssets(contractId);
    }

    @AuraEnabled
    public static CheckEligibilityResponse checkMergeEligibility(String survivorAssetId, List<String> victimAssetIds) {
        try {
            Map<String, ContractLineItem> assetIdCliMap = new Map<String, ContractLineItem>();
            Map<String, String> assetNumberSerialNumberMap = new Map<String, String>();
            for(ContractLineItem cli : [Select Asset__c, Asset__r.Asset_Number__c, Asset__r.SerialNumber__c, Actual_End_Date__c, ServiceContract.Agreement_Number__c from ContractLineItem where Asset__c in :victimAssetIds or Asset__c = :survivorAssetId]) {
                if(assetIdCliMap.get(cli.Asset__c) == null || assetIdCliMap.get(cli.Asset__c).Actual_End_Date__c < cli.Actual_End_Date__c) {
                    assetIdCliMap.put(cli.Asset__c, cli);
                    assetNumberSerialNumberMap.put(cli.Asset__r.Asset_Number__c, cli.Asset__r.SerialNumber__c);
                }
            }
            EMS_AssetMergeServiceWrapper.ResponseHandler mergeResponse = EMS_AssetMergeService.performAssetMergeValidation(AssetTransactionHelper.getAssetMergeRequest(survivorAssetId, victimAssetIds, assetIdCliMap));
            if (mergeResponse.transactionStatus == Label.EMS_Validation_Success){
                return new CheckEligibilityResponse(true, null);
            } else {
                return new CheckEligibilityResponse(false, AssetTransactionHelper.getErrorsFromMergeResponse(mergeResponse, assetNumberSerialNumberMap));
            }
        } catch(Exception e) {
            Exception__c exp = ExceptionHandler.logException(new Exception__c(Class__c = 'AssetTransactionController', Message__c = e.getMessage() + ' - Stack Trace = ' +e.getStackTraceString(), Method__c = 'checkMergeEligibility'));
            return new CheckEligibilityResponse(false, new List<String> { System.label.Transaction_System_Error });
        }
    }

    @AuraEnabled
    public static PerformTransactionResponse performMerge(String survivorAssetId, List<String> victimAssetIds, String notes, DateTime transactionPageLoadTime) {
        try {
            Map<String, ContractLineItem> assetIdCliMap = new Map<String, ContractLineItem>();
            Map<String, String> assetNumberSerialNumberMap = new Map<String, String>();
            for(ContractLineItem cli : [Select Asset__c, Asset__r.Asset_Number__c, Asset__r.SerialNumber__c, Actual_End_Date__c, ServiceContract.Agreement_Number__c from ContractLineItem where Asset__c in :victimAssetIds or Asset__c = :survivorAssetId]) {
                if(assetIdCliMap.get(cli.Asset__c) == null || assetIdCliMap.get(cli.Asset__c).Actual_End_Date__c < cli.Actual_End_Date__c) {
                    assetIdCliMap.put(cli.Asset__c, cli);
                    assetNumberSerialNumberMap.put(cli.Asset__r.Asset_Number__c, cli.Asset__r.SerialNumber__c);
                }
            }
            if(AssetTransactionHelper.isAssetModified(assetIdCliMap, transactionPageLoadTime)) {
                return new PerformTransactionResponse('Failed', null, new List<String> { Label.ADSK_AssetContractResetPageMsg });
            }
            EMS_AssetMergeServiceWrapper.RequestHandler req = AssetTransactionHelper.getAssetMergeRequest(survivorAssetId, victimAssetIds, assetIdCliMap);
            req.myLongDescription = notes;
            EMS_AssetMergeServiceWrapper.ResponseHandler mergeResponse = EMS_AssetMergeService.performAssetMergeValidation(req);
            if (mergeResponse.transactionStatus == Label.EMS_Validation_Success){
                Map<String,String> transactionInfoMap = EMS_AssetMergeService.insertTransactionAndTli(req);
                String transactionId  = transactionInfoMap.get('TransactionId');
                EMS_AssetMergeService.performAssetMerge(transactionInfoMap.get('Request'),transactionId ,transactionInfoMap.get('AssetInfo'));
                Transaction__c tx = [Select Status__c from Transaction__c where Id = :transactionId];
                return new PerformTransactionResponse(tx.Status__c, tx.Id != null ? [Select Id, Name from Transaction__c where Id = :tx.Id] : null, AssetTransactionHelper.getErrorsFromMergeResponse(mergeResponse, assetNumberSerialNumberMap));
            } else {
                return new PerformTransactionResponse(mergeResponse.transactionStatus, null, AssetTransactionHelper.getErrorsFromMergeResponse(mergeResponse, assetNumberSerialNumberMap));
            }
        } catch(Exception e) {
            Exception__c exp = ExceptionHandler.logException(new Exception__c(Class__c = 'AssetTransactionController', Message__c = e.getMessage() + ' - Stack Trace = ' +e.getStackTraceString(), Method__c = 'performMerge'));
            return new PerformTransactionResponse('Failed', null, new List<String> { System.label.EMS_Transaction_System_Error });
        }
    }

    @AuraEnabled
    public static CheckEligibilityResponse checkSplitEligibility(String assetId, List<Decimal> seats) {
        try {
            ContractLineItem cli;
            Map<String, String> assetNumberSerialNumberMap = new Map<String, String>();
            for(ContractLineItem c : [Select Asset__c, Actual_End_Date__c, ServiceContract.Agreement_Number__c, Asset__r.Asset_Number__c, Asset__r.SerialNumber__c, Asset__r.Quantity__c from ContractLineItem where Asset__c = :assetId]) {
                if(cli == null || cli.Actual_End_Date__c < c.Actual_End_Date__c) {
                     cli = c;
                     assetNumberSerialNumberMap.put(c.Asset__r.Asset_Number__c, c.Asset__r.SerialNumber__c);
                }
            }
            EMS_AssetSplitServiceHelper.ResponseHandler splitResponse = EMS_AssetSplitService.performValidation(AssetTransactionHelper.getAssetSplitRequest(seats, cli));
            if (splitResponse.transactionStatus == Label.EMS_Validation_Success) {
                return new CheckEligibilityResponse(true, null);
            } else {
                return new CheckEligibilityResponse(false, AssetTransactionHelper.getErrorsFromSplitResponse(splitResponse, assetNumberSerialNumberMap));
            }
        } catch(Exception e) {
            Exception__c exp = ExceptionHandler.logException(new Exception__c(Class__c = 'AssetTransactionController', Message__c = e.getMessage() + ' - Stack Trace = ' +e.getStackTraceString(), Method__c = 'checkSplitEligibility'));
            return new CheckEligibilityResponse(false, new List<String> { System.label.Transaction_System_Error });
        }
    }

    @AuraEnabled
    public static CheckEligibilityResponse checkIfAssetsAreModified(List<String> assetIds, DateTime transactionPageLoadTime) {
        Map<String, ContractLineItem> assetIdCliMap = new Map<String, ContractLineItem>();
        for(ContractLineItem cli : [Select Asset__c, Asset__r.Asset_Number__c, Asset__r.SerialNumber__c, Actual_End_Date__c, ServiceContract.Agreement_Number__c from ContractLineItem where Asset__c in :assetIds]) {
            if(assetIdCliMap.get(cli.Asset__c) == null || assetIdCliMap.get(cli.Asset__c).Actual_End_Date__c < cli.Actual_End_Date__c) {
                assetIdCliMap.put(cli.Asset__c, cli);
            }
        }
        if(AssetTransactionHelper.isAssetModified(assetIdCliMap, transactionPageLoadTime)) {
            return new CheckEligibilityResponse(false, new List<String> { Label.ADSK_AssetContractResetPageMsg });
        } else {
            return new CheckEligibilityResponse(true, null);
        }
    }

    @AuraEnabled
    public static PerformTransactionResponse performSplit(String assetId, List<Decimal> seats, String notes, DateTime transactionPageLoadTime) {
        try {
            ContractLineItem cli;
            Map<String, String> assetNumberSerialNumberMap = new Map<String, String>();
            for(ContractLineItem c : [Select Asset__c, Actual_End_Date__c, ServiceContract.Agreement_Number__c, Asset__r.Asset_Number__c, Asset__r.SerialNumber__c from ContractLineItem where Asset__c = :assetId]) {
                if(cli == null || cli.Actual_End_Date__c < c.Actual_End_Date__c) {
                     cli = c;
                     assetNumberSerialNumberMap.put(c.Asset__r.Asset_Number__c, c.Asset__r.SerialNumber__c);
                }
            }
            EMS_AssetSplitServiceHelper.RequestHandler requestBody = AssetTransactionHelper.getAssetSplitRequest(seats, cli);
            ServiceContract contractObj;
            String targetAssetNum  = requestBody.assetNumber.trim();
            Map<String,Asset__c> assetMap = EMS_AssetTransactionUtility.getAssetInfo(new List<String> { targetAssetNum });
            String contractId = '';  
            if(String.isNotBlank(requestBody.contractNumber)){
                contractObj =  [SELECT Id,Agreement_Number__c,Agreement_Type__c,Agreement_Sub_Type__c,Billing_Behavior__c,Status,Source__c,
                                      CreatedBy.Username,Account.Account_EC_Status__c,ServiceContract.ContactId
                                      FROM ServiceContract
                                      WHERE Agreement_Number__c = :requestBody.contractNumber];
                contractId = contractObj.Id;
            } else {
                contractObj = null;
            }
            EMS_AssetSplitServiceHelper.ResponseHandler splitResponse = EMS_AssetSplitService.performValidation(requestBody);
            if (splitResponse.transactionStatus == Label.EMS_Validation_Success) {
                String transactionId = EMS_AssetSplitServiceHelper.insertTransaction(requestBody,targetAssetNum,contractObj,assetMap,notes); // PRJSO-2819
                EMS_AssetSplitService.performSyncSplit(targetAssetNum,requestBody.assetSplitQty,contractId, transactionId); // perform Subscription Asset Split synchronously
                Transaction__c tx = [Select Status__c from Transaction__c where Id = :transactionId];
                return new PerformTransactionResponse(tx.Status__c, tx.Id != null ? [Select Id, Name from Transaction__c where Id = :tx.Id] : null, AssetTransactionHelper.getErrorsFromSplitResponse(splitResponse, assetNumberSerialNumberMap));
            } else {
                return new PerformTransactionResponse(splitResponse.transactionStatus, null, AssetTransactionHelper.getErrorsFromSplitResponse(splitResponse, assetNumberSerialNumberMap));
            }
        } catch(Exception e) {
            Exception__c exp = ExceptionHandler.logException(new Exception__c(Class__c = 'AssetTransactionController', Message__c = e.getMessage() + ' - Stack Trace = ' +e.getStackTraceString(), Method__c = 'performSplit'));
            return new PerformTransactionResponse('Failed', null, new List<String> { System.label.EMS_Transaction_System_Error });
        }
    }

    @AuraEnabled
    public static CheckEligibilityResponse checkMoveEligibility(String contractId, List<String> assetIds) {
        try {
            ServiceContract targetContract;
            if(String.isNotBlank(contractId)) {
                targetContract = [Select Id, Agreement_Number__c from ServiceContract where Id = :contractId];
            }
            Map<String, ContractLineItem> assetIdCliMap = new Map<String, ContractLineItem>();
            Map<String, String> assetNumberSerialNumberMap = new Map<String, String>();
            for(ContractLineItem cli : [Select Asset__c, Asset__r.Asset_Number__c, Asset__r.SerialNumber__c, Actual_End_Date__c, ServiceContract.Agreement_Number__c from ContractLineItem where Asset__c in :assetIds]) {
                if(assetIdCliMap.get(cli.Asset__c) == null || assetIdCliMap.get(cli.Asset__c).Actual_End_Date__c < cli.Actual_End_Date__c) {
                    assetIdCliMap.put(cli.Asset__c, cli);
                    assetNumberSerialNumberMap.put(cli.Asset__r.Asset_Number__c, cli.Asset__r.SerialNumber__c);
                }
            }
            EMS_SubscriptionAssetMoveServiceWrppr.ResponseHandler response = EMS_SubscriptionAssetMoveService.validateSubscriptionAssetMove(AssetTransactionHelper.getAssetMoveRequest(assetIds, targetContract, assetIdCliMap), true);
            if (response.validationStatus == Label.EMS_Validation_Success) {
                return new CheckEligibilityResponse(true, null);
            } else {
                return new CheckEligibilityResponse(false, AssetTransactionHelper.getErrorsFromMoveResponse(response, assetNumberSerialNumberMap));
            }
        } catch(Exception e) {
            Exception__c exp = ExceptionHandler.logException(new Exception__c(Class__c = 'AssetTransactionController', Message__c = e.getMessage() + ' - Stack Trace = ' +e.getStackTraceString(), Method__c = 'checkMoveEligibility'));
            return new CheckEligibilityResponse(false, new List<String> { System.label.Transaction_System_Error });
        } 
    }

    @AuraEnabled
    public static PerformTransactionResponse performMove(String contractId, List<String> assetIds, String notes, DateTime transactionPageLoadTime) {
        try {
            ServiceContract targetContract = [Select Id, Agreement_Number__c from ServiceContract where Id = :contractId];
            Map<String, ContractLineItem> assetIdCliMap = new Map<String, ContractLineItem>();
            Map<String, String> assetNumberSerialNumberMap = new Map<String, String>();
            for(ContractLineItem cli : [Select Asset__c, Asset__r.Asset_Number__c, Asset__r.SerialNumber__c, Actual_End_Date__c, ServiceContract.Agreement_Number__c from ContractLineItem where Asset__c in :assetIds]) {
                if(assetIdCliMap.get(cli.Asset__c) == null || assetIdCliMap.get(cli.Asset__c).Actual_End_Date__c < cli.Actual_End_Date__c) {
                    assetIdCliMap.put(cli.Asset__c, cli);
                    assetNumberSerialNumberMap.put(cli.Asset__r.Asset_Number__c, cli.Asset__r.SerialNumber__c);
                }
            }
            EMS_SubscriptionAssetMoveServiceWrppr.RequestHandler req = AssetTransactionHelper.getAssetMoveRequest(assetIds, targetContract, assetIdCliMap);
            req.myLongDescription = notes;
            EMS_SubscriptionAssetMoveServiceWrppr.ResponseHandler response = EMS_SubscriptionAssetMoveService.performSubscriptionAssetMove(AssetTransactionHelper.getAssetMoveRequest(assetIds, targetContract, assetIdCliMap));
            if (response.validationStatus == Label.EMS_Validation_Success) {
                Transaction__c tx;
                if(response.transactionId != null) {
                    tx = [Select Id, Name, Status__c from Transaction__c where Id = :response.transactionId];
                    return new PerformTransactionResponse(tx.Status__c, tx.Id != null ? tx : null, AssetTransactionHelper.getErrorsFromMoveResponse(response, assetNumberSerialNumberMap));
                } else {
                    return new PerformTransactionResponse('Failed', null, AssetTransactionHelper.getErrorsFromMoveResponse(response, assetNumberSerialNumberMap));
                }
            } else {
                return new PerformTransactionResponse(response.validationStatus, null, AssetTransactionHelper.getErrorsFromMoveResponse(response, assetNumberSerialNumberMap));
            }
        } catch(Exception e) {
            Exception__c exp = ExceptionHandler.logException(new Exception__c(Class__c = 'AssetTransactionController', Message__c = e.getMessage() + ' - Stack Trace = ' +e.getStackTraceString(), Method__c = 'performMove'));
            return new PerformTransactionResponse('Failed', null, new List<String> { System.label.EMS_Transaction_System_Error });
        }
    }

    @AuraEnabled
    public static CheckEligibilityResponse checkSCChangeEligibility(Map<String, String> assetcontactMap) {
        try {
            System.debug('assetcontactMap : ' + assetcontactMap);
            Map<String, ContractLineItem> assetIdCliMap = new Map<String, ContractLineItem>();
            Map<String, String> assetNumberSerialNumberMap = new Map<String, String>();
            for(ContractLineItem cli : [Select Asset__c, Asset__r.Asset_Number__c, Asset__r.SerialNumber__c, Actual_End_Date__c, ServiceContract.Agreement_Number__c from ContractLineItem where Asset__c in :assetcontactMap.keySet()]) {
                if(assetIdCliMap.get(cli.Asset__c) == null || assetIdCliMap.get(cli.Asset__c).Actual_End_Date__c < cli.Actual_End_Date__c) {
                    assetIdCliMap.put(cli.Asset__c, cli);
                    assetNumberSerialNumberMap.put(cli.Asset__r.Asset_Number__c, cli.Asset__r.SerialNumber__c);
                }
            }
            Set<String> contactIds = new Set<String>();
            for(String conId : assetcontactMap.values()) {
                if(String.isNotBlank(conId)) {
                    contactIds.add(conId);
                }
            }
            Map<Id, Contact> contactMap = new Map<Id, Contact>([Select Id, Contact_CSN__c from Contact where Id in :contactIds]);
            EMS_SCChangeServiceWrapper.ResponseHandler changeSCResponse = EMS_SoftwareCoordinatorChangeService.validateSCChange(AssetTransactionHelper.getAssetSCChangeRequest(assetcontactMap, assetIdCliMap, contactMap), true);
            System.debug('EMS_SCChangeServiceWrapper.ResponseHandler : ' + changeSCResponse);
            if (changeSCResponse.validationStatus == Label.EMS_Validation_Success) {
                return new CheckEligibilityResponse(true, null);
            } else {
                return new CheckEligibilityResponse(false, AssetTransactionHelper.getErrorsFromSCChangeResponse(changeSCResponse, assetNumberSerialNumberMap));
            }
        } catch(Exception e) {
            Exception__c exp = ExceptionHandler.logException(new Exception__c(Class__c = 'AssetTransactionController', Message__c = e.getMessage() + ' - Stack Trace = ' +e.getStackTraceString(), Method__c = 'checkSCChangeEligibility'));
            return new CheckEligibilityResponse(false, new List<String> { System.label.Transaction_System_Error });
        }
        return new CheckEligibilityResponse(true, null);
    }

    @AuraEnabled
    public static PerformTransactionResponse performSCChange(Map<String, String> assetcontactMap, String notes, DateTime transactionPageLoadTime) {
        try {
            System.debug('assetcontactMap : ' + assetcontactMap);
            System.debug('notes : ' + notes);
            System.debug('transactionPageLoadTime : ' + transactionPageLoadTime);
            Map<String, ContractLineItem> assetIdCliMap = new Map<String, ContractLineItem>();
            Map<String, String> assetNumberSerialNumberMap = new Map<String, String>();
            for(ContractLineItem cli : [Select Asset__c, Asset__r.Asset_Number__c, Asset__r.SerialNumber__c, Actual_End_Date__c, ServiceContract.Agreement_Number__c from ContractLineItem where Asset__c in :assetcontactMap.keySet()]) {
                if(assetIdCliMap.get(cli.Asset__c) == null || assetIdCliMap.get(cli.Asset__c).Actual_End_Date__c < cli.Actual_End_Date__c) {
                    assetIdCliMap.put(cli.Asset__c, cli);
                    assetNumberSerialNumberMap.put(cli.Asset__r.Asset_Number__c, cli.Asset__r.SerialNumber__c);
                }
            }
            if(AssetTransactionHelper.isAssetModified(assetIdCliMap, transactionPageLoadTime)) {
                return new PerformTransactionResponse('Failed', null, new List<String> { Label.ADSK_AssetContractResetPageMsg });
            }
            Map<Id, Contact> contactMap = new Map<Id, Contact>([Select Id, Contact_CSN__c from Contact where Id in :assetcontactMap.values()]);
            EMS_SCChangeServiceWrapper.RequestHandler req = AssetTransactionHelper.getAssetSCChangeRequest(assetcontactMap, assetIdCliMap, contactMap);
            req.myLongDescription = notes;
            System.debug('req : ' + req);
            EMS_SCChangeServiceWrapper.ResponseHandler changeSCResponse = EMS_SoftwareCoordinatorChangeService.validateSCChange(req);
            System.debug('EMS_SCChangeServiceWrapper.ResponseHandler : ' + changeSCResponse);
            if (changeSCResponse.validationStatus == Label.EMS_Validation_Success) {
                Transaction__c tx = EMS_SoftwareCoordinatorChangeService.performSCChange(req);
                return new PerformTransactionResponse(tx.Status__c, tx.Id != null ? [Select Id, Name from Transaction__c where Id = :tx.Id] : null, AssetTransactionHelper.getErrorsFromSCChangeResponse(changeSCResponse, assetNumberSerialNumberMap));
            } else {
                return new PerformTransactionResponse(changeSCResponse.validationStatus, null, AssetTransactionHelper.getErrorsFromSCChangeResponse(changeSCResponse, assetNumberSerialNumberMap));
            }
        } catch(Exception e) {
            Exception__c exp = ExceptionHandler.logException(new Exception__c(Class__c = 'AssetTransactionController', Message__c = e.getMessage() + ' - Stack Trace = ' +e.getStackTraceString(), Method__c = 'performSCChange'));
            return new PerformTransactionResponse('Failed', null, new List<String> { System.label.EMS_Transaction_System_Error });
        }
    }

    //EAPESH-1853
    @AuraEnabled
    public static CheckEligibilityResponse checkResellerChangeEligibility(Map<String, String> assetAccountMap) {
        try {
            System.debug('assetAccountMap : ' + assetAccountMap);
            Map<String, ContractLineItem> assetIdCliMap = new Map<String, ContractLineItem>();
            Map<String, String> assetNumberSerialNumberMap = new Map<String, String>();
            for(ContractLineItem cli : [Select Asset__c, Asset__r.Asset_Number__c, Asset__r.SerialNumber__c, Actual_End_Date__c, ServiceContract.Agreement_Number__c from ContractLineItem where Asset__c in :assetAccountMap.keySet()]) {
                if(assetIdCliMap.get(cli.Asset__c) == null || assetIdCliMap.get(cli.Asset__c).Actual_End_Date__c < cli.Actual_End_Date__c) {
                    assetIdCliMap.put(cli.Asset__c, cli);
                    assetNumberSerialNumberMap.put(cli.Asset__r.Asset_Number__c, cli.Asset__r.SerialNumber__c);
                }
            }
            Set<String> accountIds = new Set<String>();
            for(String accId : assetAccountMap.values()) {
                if(String.isNotBlank(accId)) {
                    accountIds.add(accId);
                }
            }
            Map<Id, Account> accountMap = new Map<Id, Account>([Select Id, Account_CSN__c from Account where Id in :accountIds]);
            EMS_AssetResellerChangeService.ChangeResellerResponse response = EMS_AssetResellerChangeService.validateResellerChange(AssetTransactionHelper.getAssetResellerChangeRequest(assetAccountMap, assetIdCliMap, accountMap), true);
            if (response.validationStatus == 'Success') {
                return new CheckEligibilityResponse(true, null);
            } else {
                return new CheckEligibilityResponse(false, AssetTransactionHelper.getErrorsFromResellerChangeResponse(response, assetNumberSerialNumberMap));
            }
        } catch(Exception e) {
            Exception__c exp = ExceptionHandler.logException(new Exception__c(Class__c = 'AssetTransactionController', Message__c = e.getMessage() + ' - Stack Trace = ' +e.getStackTraceString(), Method__c = 'checkResellerChangeEligibility'));
            return new CheckEligibilityResponse(false, new List<String> { System.label.Transaction_System_Error });
        }
        return new CheckEligibilityResponse(true, null);
    }

    @AuraEnabled
    public static PerformTransactionResponse performResellerChange(Map<String, String> assetAccountMap, String notes, DateTime transactionPageLoadTime) {
        try {
            System.debug('assetAccountMap : ' + assetAccountMap);
            System.debug('notes : ' + notes);
            System.debug('transactionPageLoadTime : ' + transactionPageLoadTime);
            Map<String, ContractLineItem> assetIdCliMap = new Map<String, ContractLineItem>();
            Map<String, String> assetNumberSerialNumberMap = new Map<String, String>();
            for(ContractLineItem cli : [Select Asset__c, Asset__r.Asset_Number__c, Asset__r.SerialNumber__c, Actual_End_Date__c, ServiceContract.Agreement_Number__c from ContractLineItem where Asset__c in :assetAccountMap.keySet()]) {
                if(assetIdCliMap.get(cli.Asset__c) == null || assetIdCliMap.get(cli.Asset__c).Actual_End_Date__c < cli.Actual_End_Date__c) {
                    assetIdCliMap.put(cli.Asset__c, cli);
                    assetNumberSerialNumberMap.put(cli.Asset__r.Asset_Number__c, cli.Asset__r.SerialNumber__c);
                }
            }
            if(AssetTransactionHelper.isAssetModified(assetIdCliMap, transactionPageLoadTime)) {
                return new PerformTransactionResponse('Failed', null, new List<String> { Label.ADSK_AssetContractResetPageMsg });
            }
            Map<Id, Account> accountMap = new Map<Id, Account>([Select Id, Account_CSN__c from Account where Id in :assetAccountMap.values()]);
            EMS_AssetResellerChangeService.ChangeResellerResponse response = EMS_AssetResellerChangeService.performResellerChange(AssetTransactionHelper.getAssetResellerChangeRequest(assetAccountMap, assetIdCliMap, accountMap));
            if (response.transactionStatus == 'Success') {
                return new PerformTransactionResponse(response.transactionStatus, response.transactionId != null ? [Select Id, Name from Transaction__c where Id = :response.transactionId] : null, null);
            } else {
                return new PerformTransactionResponse(response.transactionStatus, response.transactionId != null ? [Select Id, Name from Transaction__c where Id = :response.transactionId] : null, new List<String> { response.transactionError });
            }
        } catch(Exception e) {
            Exception__c exp = ExceptionHandler.logException(new Exception__c(Class__c = 'AssetTransactionController', Message__c = e.getMessage() + ' - Stack Trace = ' +e.getStackTraceString(), Method__c = 'performResellerChange'));
            return new PerformTransactionResponse('Failed', null, new List<String> { System.label.EMS_Transaction_System_Error });
        }
    }
	// Sold To Account
	  @AuraEnabled
	  public static CheckSoldToEligibilityResponse checkSoldToChangeEligibility(Map<String, String> assetAccountMap) {
          System.debug('assetAccountMap : ' + assetAccountMap);
          try {
              System.debug('assetAccountMap Keyset : ' + assetAccountMap.keySet());
	  Map<String, ContractLineItem> assetIdCliMap = new Map<String, ContractLineItem>();
	  Map<String, String> assetNumberSerialNumberMap = new Map<String, String>();
	  for(ContractLineItem cli : [Select Asset__c, Asset__r.Asset_Number__c, Asset__r.SerialNumber__c, Actual_End_Date__c, ServiceContract.Agreement_Number__c 
                                  from ContractLineItem where Asset__c in :assetAccountMap.keySet()]) {
                if(assetIdCliMap.get(cli.Asset__c) == null || assetIdCliMap.get(cli.Asset__c).Actual_End_Date__c < cli.Actual_End_Date__c) {
                    assetIdCliMap.put(cli.Asset__c, cli);
                    assetNumberSerialNumberMap.put(cli.Asset__r.Asset_Number__c, cli.Asset__r.SerialNumber__c);
                }
            }
            Set<String> accountIds = new Set<String>();
            for(String accId : assetAccountMap.values()) {
                if(String.isNotBlank(accId)) {
                    accountIds.add(accId);
                }
            }
              system.debug('assetIdCliMap>>>>' + assetIdCliMap);
            Map<Id, Account> accountMap = new Map<Id, Account>([Select Id, Account_CSN__c from Account where Id in :accountIds]);
	 		EMSAssetSoldToChangeService.CheckSoldToEligibilityResponse response = EMSAssetSoldToChangeService.validateSoldToChange(AssetTransactionHelper.getAssetSoldToChangeRequest(assetAccountMap, assetIdCliMap, accountMap), true);
			if (response.validationStatus == 'Success') {
                return new CheckSoldToEligibilityResponse(true, null);
            } else {
                return new CheckSoldToEligibilityResponse(false, AssetTransactionHelper.getErrorsFromSoldToChangeResponse(response, assetNumberSerialNumberMap));
            }
        } catch(Exception e) {
            Exception__c exp = ExceptionHandler.logException(new Exception__c(Class__c = 'AssetTransactionController', Message__c = e.getMessage() + ' - Stack Trace = ' +e.getStackTraceString(), Method__c = 'checkSoldToChangeEligibility'));
            return new CheckSoldToEligibilityResponse(false, new List<String> { System.label.Transaction_System_Error });
        }
        return new CheckSoldToEligibilityResponse(true, null);
	}

	 @AuraEnabled
     public static PerformSoldToTransactionResponse performSoldToChange(Map<String, String> assetAccountMap, String notes, DateTime transactionPageLoadTime) {
        try {
            System.debug('assetAccountMap : ' + assetAccountMap); 
            System.debug('notes : ' + notes);
            System.debug('transactionPageLoadTime : ' + transactionPageLoadTime);
            Map<String, ContractLineItem> assetIdCliMap = new Map<String, ContractLineItem>();
            Map<String, String> assetNumberSerialNumberMap = new Map<String, String>();
            for(ContractLineItem cli : [Select Asset__c, Asset__r.Asset_Number__c, Asset__r.SerialNumber__c, Actual_End_Date__c, ServiceContract.Agreement_Number__c from ContractLineItem where Asset__c in :assetAccountMap.keySet()]) {
                if(assetIdCliMap.get(cli.Asset__c) == null || assetIdCliMap.get(cli.Asset__c).Actual_End_Date__c < cli.Actual_End_Date__c) {
                    assetIdCliMap.put(cli.Asset__c, cli);
                    assetNumberSerialNumberMap.put(cli.Asset__r.Asset_Number__c, cli.Asset__r.SerialNumber__c);
                }
            }
            if(AssetTransactionHelper.isAssetModified(assetIdCliMap, transactionPageLoadTime)) {
                return new PerformSoldToTransactionResponse('Failed', null, new List<String> { Label.ADSK_AssetContractResetPageMsg });
            }
            Map<Id, Account> accountMap = new Map<Id, Account>([Select Id, Account_CSN__c from Account where Id in :assetAccountMap.values()]);
            EMSAssetSoldToChangeService.CheckSoldToEligibilityResponse response = EMSAssetSoldToChangeService.performSoldToChange(AssetTransactionHelper.getAssetSoldToChangeRequest(assetAccountMap, assetIdCliMap, accountMap));
            if (response.transactionStatus == 'Success') {
                return new PerformSoldToTransactionResponse(response.transactionStatus, response.transactionId != null ? [Select Id, Name from Transaction__c where Id = :response.transactionId] : null, null);
            } else {
                return new PerformSoldToTransactionResponse(response.transactionStatus, response.transactionId != null ? [Select Id, Name from Transaction__c where Id = :response.transactionId] : null, new List<String> { response.transactionError });
            }
        } catch(Exception e) {
            Exception__c exp = ExceptionHandler.logException(new Exception__c(Class__c = 'AssetTransactionController', Message__c = e.getMessage() + ' - Stack Trace = ' +e.getStackTraceString(), Method__c = 'performSoldToChange'));
            return new PerformSoldToTransactionResponse('Failed', null, new List<String> { System.label.EMS_Transaction_System_Error });
        }
    }
	
    @AuraEnabled
    public static List<Transaction__c> getTransactions(List<String> transactionIds) {
        return [Select Id, Status__c, ServiceContract__c, Name, ServiceContract__r.Agreement_Number__c from Transaction__c where Id in :transactionIds];
    }

    public class GetAssetsResponse {
        @AuraEnabled
        public List<AssetWrapper> assetList;
        @AuraEnabled
        public ServiceContract sc;
        @AuraEnabled
        public Boolean isTransactionAllowed;
        @AuraEnabled
        public List<String> errorMessages;
        @AuraEnabled
        public DateTime transactionPageLoadTime;
        @AuraEnabled
        public Integer transactionPollingTimeLimit;
        @AuraEnabled
        public Integer transactionPollingInterval;
        @AuraEnabled
        public Integer mergeLineItemLimit;
        @AuraEnabled
        public Integer splitLineItemLimit;
        @AuraEnabled
        public Integer moveLineItemLimit;
        @AuraEnabled
        public Integer scChangeLineItemLimit;
        @AuraEnabled
        public Integer resellerChangeLineItemLimit;
        @AuraEnabled
        public Integer soldToChangeLineItemLimiit;
        @AuraEnabled
        public Boolean isMergeAllowed;
        @AuraEnabled
        public Boolean isSplitAllowed;
        @AuraEnabled
        public Boolean isMoveAllowed;
        @AuraEnabled
        public Boolean isSCChangeAllowed;
        @AuraEnabled
        public Boolean isResellerChangeAllowed;
		@AuraEnabled
        public Boolean isSoldToChangeAllowed;
        @AuraEnabled
        public Boolean hasTransactionsPermission;
        public GetAssetsResponse(List<AssetWrapper> assetList, ServiceContract sc, Boolean isTransactionAllowed, Boolean hasTransactionsPermission, List<String> errorMessages) {
            this.assetList = assetList;
            this.sc = sc;
            this.isTransactionAllowed = isTransactionAllowed;
            this.errorMessages = errorMessages;
            this.transactionPageLoadTime = DateTime.now();
            this.transactionPollingTimeLimit = Sf.Settings.getInteger('AssetTxPollingTimeLimit', 15) * 1000;
            this.transactionPollingInterval = Sf.Settings.getInteger('AssetTxPollingInterval', 5) * 1000;
            this.mergeLineItemLimit = Sf.Settings.getInteger('AssetMergeLineItemLimit', -1);
            this.splitLineItemLimit = Sf.Settings.getInteger('AssetSplitLineItemLimit', -1);
            this.moveLineItemLimit = Sf.Settings.getInteger('AssetMoveLineItemLimit', -1);
            this.scChangeLineItemLimit = Sf.Settings.getInteger('AssetSCChangeLineItemLimit', -1);
            this.resellerChangeLineItemLimit = Sf.Settings.getInteger('AssetResellerChangeLineItemLimit', -1);
            this.soldToChangeLineItemLimiit = Sf.Settings.getInteger('AssetsoldToChangeLineItemLimiit', -1);
            if(sc.Billing_Behavior_Code__c == 'A200') {
                this.isMergeAllowed = false;
                this.isSplitAllowed = false;
                this.isMoveAllowed = false;
                this.isSCChangeAllowed = true;
                this.isResellerChangeAllowed = false;
				this.isSoldToChangeAllowed = false;
            } else {
                this.isMergeAllowed = true;
                this.isSplitAllowed = true;
                this.isMoveAllowed = true;
                this.isSCChangeAllowed = true;
                this.isResellerChangeAllowed = true;
				this.isSoldToChangeAllowed = true;
            }
            this.hasTransactionsPermission = hasTransactionsPermission;
        }
        public GetAssetsResponse(ServiceContract sc, List<String> errorMessages, Boolean isTransactionAllowed, Boolean hasTransactionsPermissions) {
            this.errorMessages = errorMessages;
            this.sc = sc;
            this.hasTransactionsPermission = hasTransactionsPermission;
            this.isTransactionAllowed = isTransactionAllowed;
        }
    }

    public class AssetWrapper {
        @AuraEnabled
        public ContractLineItem cli;
        @AuraEnabled
        public String formattedEndDateWithGracePeriod;
        @AuraEnabled
        public String formattedEndDate;
        public AssetWrapper(ContractLineItem cli) {
            this.cli = cli;
            if(cli.StartDate != null) {
                system.debug('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$'+cli.EndDate);
                this.formattedEndDateWithGracePeriod = cli.EndDate.format();
            }
            if(cli.EndDate != null) {
                this.formattedEndDate = cli.Actual_End_Date__c.format();
            }
        }
    }

    public class CheckEligibilityResponse {
        @AuraEnabled
        public Boolean isValid;
        @AuraEnabled
        public List<String> errorMessages;
        public CheckEligibilityResponse(Boolean isValid, List<String> errorMessages) {
            this.isValid = isValid;
            this.errorMessages = errorMessages;
        }
    }

    
	public class CheckSoldToEligibilityResponse {
		@AuraEnabled
		public Boolean isValid;
		@AuraEnabled
		public List<String> errorMessages;
		public CheckSoldToEligibilityResponse(Boolean isValid, List<String> errorMessages) {
			this.isValid = isValid;
			this.errorMessages = errorMessages;
		}
	}
	public class PerformSoldToTransactionResponse {
		@AuraEnabled
		public string transactionStatus;
		@AuraEnabled
		public Transaction__c tx;
		@AuraEnabled
		public List<String> errorMessages;
		public PerformSoldToTransactionResponse(String transactionStatus, Transaction__c tx, List<String> errorMessages) {
			this.errorMessages = errorMessages;
			this.tx = tx;
			this.transactionStatus = transactionStatus;
		}
	}
	
    public class PerformTransactionResponse {
        @AuraEnabled
        public String transactionStatus;
        @AuraEnabled
        public Transaction__c tx;
        @AuraEnabled
        public List<String> errorMessages;
        public PerformTransactionResponse(String transactionStatus, Transaction__c tx, List<String> errorMessages) {
            this.errorMessages = errorMessages;
            this.tx = tx;
            this.transactionStatus = transactionStatus;
        }
    }
}