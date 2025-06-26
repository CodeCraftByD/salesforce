/*************************************************************************************************
 * Copyright by Autodesk, Inc.
 * The information contained herein is confidential, proprietary to
 * Autodesk, Inc., and considered a trade secret as defined in section
 * 499C of the penal code of the State of California. Use of
 * this information by anyone other than authorized employees of
 * Autodesk, Inc. is granted only under a written non-disclosure
 * agreement, expressly prescribing the scope and manner of such use.
 *
 * $Id$ : TransactionAccountLookupController
 * $Created Date$ : 06/25/2018
 * $Author$ : Chaithanya Godla
 * $Description$ : This is the Controller class for Lightning Component used for Transaction Account Lookup
 * $Test Class$ : TransactionAccountLookupControllerTest
 **************************************************************************************************/
public without sharing class TransactionAccountLookupController {

    public static List<String> govSellerContractType = (Sf.settings.getString('SUBS_ContractType_GovSeller', '')).split(','); //Added for Buy Sales changes
    @AuraEnabled
    public static List<Account> getAccounts(String searchString, String accountType ,String assetId) {
        List<Account> accList = new List<Account>();
        searchString = searchString.trim();
        if (String.isNotBlank(searchString) && accountType == 'reseller') {
            accList= returnSOSLSearchList(searchString);
           if(assetId!=null){
                List<ContractLineItem> cliLst = [SELECT Id,NTM_Eligible__c FROM ContractLineItem WHERE Asset__c =:assetId Limit 1];
                if(cliLst[0].NTM_Eligible__c){
                    accList= checkIfAgentContractAccActive(accList,'');
                }
                else{
                    accList = accList;
                }
            }
        } else if (String.isNotBlank(searchString) && accountType == 'soldTo') {
            accList= returnSOSLSearchList(searchString);
        } else if (String.isNotBlank(searchString) && accountType == 'resellerODM') {
            accList= returnSOSLSearchList(searchString);
            accList = checkIfAgentContractAccActive(accList,'');
     }else if (String.isNotBlank(searchString) && accountType == 'distributorODM') {      
        searchString = searchString.trim();
        List<List<sObject>> results = [FIND :searchString IN ALL FIELDS RETURNING Account(Id, Name, Type, Account_CSN__c, Address1__c, City__c, State_Province__c, Country_Picklist__c, Named_Account_Group__c, Country_Lookup__r.Primary_Partner_Motion__c  WHERE name != '' AND Status__c = 'Active' /*AND Country_Lookup__r.Primary_Partner_Motion__c = 'Resale'*/ )];
        if (results != null && results.size() > 0) {
            accList = (List<Account>) results[0];
        }
       // accList = checkIfDistorGovContractAccActive(accList);
        }
       return accList;
}  

@AuraEnabled
public static TransactionAccountLookupController.ContractLineItemWraper getODMAccounts(String searchString, String accountType,String cliRec) {
    List<Account> validAccountList = new List<Account>();
    List<Account> accList = new List<Account>();
    TransactionAccountLookupController.ContractLineItemWraper cliWrapper;
    Boolean displayError = false;

    ADSK_SubscriptionTransactionController.ContractLineItemWrapper  cliWrap= (ADSK_SubscriptionTransactionController.ContractLineItemWrapper) System.JSON.deserialize(cliRec, ADSK_SubscriptionTransactionController.ContractLineItemWrapper.class);
    accList = returnSOSLSearchList(searchString);  
    Map<Id,Account> accntMap =  new Map<Id,Account>(accList);
    if(cliWrap.primaryPartnerMotion =='Resale' && !accList.isEmpty()){
        if((cliWrap.intendedUsage=='GOV' || cliWrap.intendedUsage=='COM' )){
            for(Account acc : accList){
                if(acc.Country_Lookup__r.Primary_Partner_Motion__c=='Resale'){
                    validAccountList.add(acc);
                }
            }
        }
            if(validAccountList.isEmpty() ){
                return mapErrorMsgAccLst(validAccountList, 'CountryCheck');
             }
            else{
                if(cliWrap.intendedUsage=='COM'){
                    validAccountList =  checkIfAgentContractAccActive(validAccountList,'COM');
                    return mapErrorMsgAccLst(validAccountList, 'COM');
                }
                if(cliWrap.intendedUsage=='GOV'){
                    validAccountList = checkIfAgentContractAccActive(validAccountList,'GOV');
                    return mapErrorMsgAccLst(validAccountList, 'GOV');
                }    
                
            }
       
           
        return new TransactionAccountLookupController.ContractLineItemWraper('',validAccountList);
    
    }
    if(cliWrap.primaryPartnerMotion =='Resale' && accList.isEmpty()){
        return new TransactionAccountLookupController.ContractLineItemWraper('Only partner accounts with active reseller contracts are allowed.',validAccountList);
    }
   
    return new TransactionAccountLookupController.ContractLineItemWraper('',validAccountList);
}

   
private static final Map<String, String> intendedUsageErrMsgMap = new Map<String, String>{
    'COM' => 'Only partner accounts with active reseller contracts are allowed.',
    'GOV' => 'Only partner accounts with active GOV reseller contracts are allowed.',
    'CountryCheck' => 'Only partner accounts within Resale enabled country is allowed.'
};

public class ContractLineItemWraper {
    @AuraEnabled
    public String errorMsg { get; set; }
    @AuraEnabled
    public List<Account> accLst { get; set; }

    public ContractLineItemWraper(String errorMsg, List<Account> accLst) {
        this.errorMsg = errorMsg;
        this.accLst = accLst;
    }
}

public static TransactionAccountLookupController.ContractLineItemWraper mapErrorMsgAccLst(List<Account> validAccountList,String endUserType){
    if(validAccountList!=null && !validAccountList.isEmpty()){
       return  new TransactionAccountLookupController.ContractLineItemWraper('',validAccountList);
    }
    else{
       return new TransactionAccountLookupController.ContractLineItemWraper(intendedUsageErrMsgMap.get(endUserType),validAccountList);
    }

}

public static  List<Account> returnSOSLSearchList(String searchString){
    List<Account> accList= new List<Account>();
    List<List<sObject>> results = [FIND :searchString IN ALL FIELDS RETURNING Account(Id, Name, Type, Account_CSN__c, Address1__c, City__c, State_Province__c, Country_Picklist__c, Named_Account_Group__c,Country_Lookup__r.Primary_Partner_Motion__c WHERE name != '' AND Partner_Flag__c = TRUE AND Status__c = 'Active' AND IsInternal_Origin__c = TRUE AND Type = 'Reseller')];
    if (results != null && results.size() > 0) {
        accList = (List<Account>) results[0];
    }
    return accList;
}

public static List<Account> checkIfAgentContractAccActive(List<Account> accList,String intendedUsage){
    List<Contract_Account__c> agentContractAccntList = new List<Contract_Account__c>();
     Map<Id,Account> accntMap = new Map<Id,Account>(accList);
     //List<Account> accLstReturn = new List<Account>();
     Map<Id,Account> accLstReturnMap = new Map<Id,Account>();
     if(intendedUsage=='COM'){
        agentContractAccntList = [SELECT ID, Account_CSN__c, Contract_Type__c, Account__c, Account__r.Id, Account__r.Name, Account__r.Internal_Use__c, Account__r.Account_CSN__c, Account__r.Partner_Type__c, Account__r.Type FROM Contract_Account__c WHERE Account__c IN :accntMap.keySet() AND Contract__r.Status__c IN ('Active', 'Active - To Be Terminated', 'Active - Termination Confirmed') AND Contract_Type__c IN ('DVAR','IVAR')];
     }
     else if(intendedUsage=='GOV'){
        agentContractAccntList = [SELECT ID, Account_CSN__c, Contract_Type__c, Account__c, Account__r.Id, Account__r.Name, Account__r.Internal_Use__c, Account__r.Account_CSN__c, Account__r.Partner_Type__c, Account__r.Type FROM Contract_Account__c WHERE Account__c IN :accntMap.keySet() AND Contract__r.Status__c IN ('Active', 'Active - To Be Terminated', 'Active - Termination Confirmed') AND Contract_Type__c IN :govSellerContractType];
     }
     else{
        agentContractAccntList = [SELECT Id,Active__c,Account__c FROM Contract_Account__c WHERE Account__c IN :accntMap.keyset() AND Contract_Type__c = 'Agency' and Active__c= true ];
     }
    if(agentContractAccntList!=null && agentContractAccntList.size()>0){
        for(Contract_Account__c agentContractAccnt : agentContractAccntList){
            if(accntMap.containsKey(agentContractAccnt.Account__c)){
                //accLstReturn.add(accntMap.get(agentContractAccnt.Account__c));
                accLstReturnMap.put(agentContractAccnt.Account__c,accntMap.get(agentContractAccnt.Account__c));
            }
        }
        return accLstReturnMap.values();
    }
    else {
        return accLstReturnMap.values();
    }

}
    
     @AuraEnabled
	public static Boolean validateContractByChannelAndUsage(String accountId, String salesChannel, String intendedUsage) {
   
    if (String.isBlank(accountId)) {
        System.debug('validateContractByChannelAndUsage: accountId is blank, returning false.');
        return false;
    }

    List<String> contractTypes = new List<String>();
    if (String.isNotBlank(intendedUsage) && intendedUsage.equalsIgnoreCase('gov')) {
        contractTypes.addAll(new List<String>{ 'DVAR', 'VAD', 'Government Distributor', 'VAD Government', 'Government Hybrid', 'Government Aggregator' });
    }
    else if (String.isNotBlank(salesChannel) && salesChannel.equalsIgnoreCase('resale')) {
        contractTypes.addAll(new List<String>{ 'DVAR', 'VAD' });
    }
    if (contractTypes.isEmpty()) {
        return false;
    }

    List<Contract_Account__c> lstContractAcc = [SELECT Id, Active__c, Account__c, Contract_Type__c FROM Contract_Account__c WHERE Account__c = :accountId
                                                    AND Active__c = true
                                                    AND Contract_Type__c IN :contractTypes
    ];
    return !lstContractAcc.isEmpty();
}
}