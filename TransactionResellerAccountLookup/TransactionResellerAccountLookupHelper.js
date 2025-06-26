({
	getAccounts : function(cmp) {
		var action = cmp.get('c.getAccounts');
        //console.log('Action:', action);
        console.log('hi');
        console.log(cmp.get("v.ntmEligible")+'checkl');
        console.log(cmp.get("v.assetrecordId")+'checklasset');
        $A.util.removeClass(cmp.find('spinner'), 'hide');
        action.setCallback(this, function(actionResult) { 
            var accountTableData = actionResult.getReturnValue();
            console.log('accountTableData:', accountTableData);
            var accountTableColumns = [
                {label: 'Name', fieldName: 'Name', sortable:true},
                {label: 'CSN', fieldName: 'Account_CSN__c', sortable:true},
                {label: 'Type', fieldName: 'Type', sortable:true},
                {label: 'Address Line 1', fieldName: 'Address1__c', sortable:true},
                {label: 'City', fieldName: 'City__c', sortable:true},
                {label: 'State', fieldName: 'State_Province__c', sortable:true},
                {label: 'Country', fieldName: 'Country_Picklist__c', sortable:true}
            ];
            var accountTableCmp = cmp.find('accountTable');
            cmp.set('v.accounts', accountTableData);
            if (accountTableData.length === 0 && cmp.get("v.ntmEligible") == "true") {
                console.log('Inside if loop');
                var noAccountsLabel = $A.get("$Label.c.Partner_Account_Message");
                cmp.set('v.noAccountsFoundMessage', noAccountsLabel);
                cmp.set('v.noAccountsFound', true);
                cmp.set('v.AccountsFound', false);
            }
            console.log('Account Data:', accountTableData);
            
            accountTableCmp.setColumnsAndData(accountTableColumns, accountTableData);
            console.log(document.getElementById('accountTableSection').classList+'thisbefore---');
            document.getElementById('accountTableSection').classList.remove('hide');
            console.log(document.getElementById('accountTableSection').classList+'this---');
            $A.util.addClass(cmp.find('spinner'), 'hide');
        });
        action.setParams({ 
            "searchString" : cmp.find("searchString").get("v.value"),
            "accountType" : 'reseller',
            "assetId" : cmp.get("v.assetrecordId")

        });
        $A.enqueueAction(action); 
	}
})