({
   
	searchAccounts: function (component, event, helper) {
        var searchText = component.find("searchString").get("v.value");
        console.log("searchText...= ", searchText);
        //var recId = component.get("v.assetrecordId");
       // console.log("recordId in TraLookup:======", recId);
        if(searchText != '' && searchText != null) {
            if(searchText.length >= 2) {
        		helper.getAccounts(component);
            } else {
                alert('Please provide valid search input(atleast two characters)');
            }
        } else {
           	alert('Please provide search input');
        }
    },
    closeModal : function(component, event, helper) {
        var bodyElement = document.getElementsByTagName('body')[0];
        bodyElement.style = '';

        /*var tableSection = document.getElementById('accountTableSection');
        if(tableSection) {
            tableSection.classList.add('hide');
        }*/

		$A.util.addClass(component, 'hidden');
        //component.find("searchString").set("v.value", "");
	},
    handleRowSelection : function(cmp, event, helper) {
        var selectedRowIds = event.getParam("rowIds");
        cmp.set('v.selectedAccountId', selectedRowIds[0]);
        event.stopPropagation();
    },
    select : function(cmp, event, helper) {
        var selectedAccountId = cmp.get('v.selectedAccountId');
        if(selectedAccountId != null) {
            var selectEvent = cmp.getEvent("accountLookupSelect");
            var accountTableData = cmp.get('v.accounts');
            var selectedAccountName;
            for(var i = 0; i < accountTableData.length; i++) {
                if(accountTableData[i].Id == selectedAccountId) {
                    selectedAccountName = accountTableData[i].Name;
                }
            }
            var eventSource = event.getSource();
            var applyToAll = false;
            if(eventSource.get("v.label") == 'Apply To All') {
                applyToAll = true;
            } 
            selectEvent.setParams({
                "id" : selectedAccountId,
                "name" : selectedAccountName,
                "applyToAll" : applyToAll
            });
            selectEvent.fire();
            var bodyElement = document.getElementsByTagName('body')[0];
            bodyElement.style = '';
            $A.util.addClass(cmp, 'hidden');
            /*var tableSection = document.getElementById('accountTableSection');
            if(tableSection) {
                tableSection.classList.add('hide');
            }
            cmp.find("searchString").set("v.value", "");*/

            
        } else {
            alert('Please select an Account');
        }
    },
    onSearchInputChange: function(component, event, helper) {
        var searchText = component.find("searchString").get("v.value");
        if(searchText != '' && searchText != null) {
            $A.util.removeClass(component.find('clearIcon'), 'hide');
        } else {
            $A.util.addClass(component.find('clearIcon'), 'hide');
        }
    },
    onSearchInputKeyup: function(component, event, helper) {
        console.log(event.which);
        if(event.which == 13){
            var searchText = component.find("searchString").get("v.value");
            if(searchText != '' && searchText != null) {
                if(searchText.length >= 2) {
                    helper.getAccounts(component);
                } else {
                    alert('Please provide valid search input(atleast two characters)');
                }
            } else {
                alert('Please provide search input');
            }
        }
    },
    clearSearchInput: function(component, event, helper) {
        component.find("searchString").set("v.value", "");
        $A.util.addClass(component.find('clearIcon'), 'hide');
        component.set('v.AccountsFound', true);
        component.set('v.noAccountsFound', false);

    }
})