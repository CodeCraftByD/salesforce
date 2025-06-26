({
    init: function (cmp, event, helper) {
        console.log('Inside init');
        helper.fetchAssetData(cmp);
    },
    handleRowSelection : function(cmp, event, helper) {
        var selectedRowIds = event.getParam("allRowIdsSelected");
        cmp.set('v.rowIdsSelected', selectedRowIds);
        helper.updateTxAssetTable(cmp);
    },
    handleContactSelect: function(cmp, event, helper) {
        var lookupAssetId = cmp.get('v.lookupAssetId');
        if(event.getParam("applyToAll") != true) {
            document.getElementById(lookupAssetId + '_newSCName').value = event.getParam("name");
            var txAsset = cmp.get('v.txAssetMap')[lookupAssetId];
            txAsset.newSCId = event.getParam("id");
            txAsset.newSCName = event.getParam("name");
        } else {
            var nameElements = document.getElementsByClassName("newSCName");
            for(var i = 0; i < nameElements.length; i++) {
                nameElements[i].value = event.getParam("name");
            }
            var txAssets = cmp.get('v.txAssets');
            for(var i = 0; i < txAssets.length; i++) {
                txAssets[i].newSCId = event.getParam("id");
                txAssets[i].newSCName = event.getParam("name");
            }
        }
        helper.handleSCLookupChange(cmp);
    },
    handleContractSelect: function(cmp, event, helper) {
        var lookupAssetId = cmp.get('v.lookupAssetId');
        if(event.getParam("applyToAll") != true) {
            document.getElementById(lookupAssetId + '_newContractNumber').value = event.getParam("contractNumber");
            var txAsset = cmp.get('v.txAssetMap')[lookupAssetId];
            txAsset.newContractId = event.getParam("id");
            txAsset.newContractNumber = event.getParam("contractNumber");
        } else {
            var nameElements = document.getElementsByClassName("newContractNumber");
            for(var i = 0; i < nameElements.length; i++) {
                nameElements[i].value = event.getParam("contractNumber");
            }
            var txAssets = cmp.get('v.txAssets');
            for(var i = 0; i < txAssets.length; i++) {
                txAssets[i].newContractId = event.getParam("id");
                txAssets[i].newContractNumber = event.getParam("contractNumber");
            }
        }
        helper.handleContractLookupChange(cmp);
    },
    handleResellerAccountSelect: function(cmp, event, helper) {
        var ntmTrue =0;
        var ntmFalse =0;
        var lookupAssetId = cmp.get('v.lookupAssetId');
        if(event.getParam("applyToAll") != true) {
            document.getElementById(lookupAssetId + '_newResellerName').value = event.getParam("name");
            var txAsset = cmp.get('v.txAssetMap')[lookupAssetId];
            txAsset.newResellerId = event.getParam("id");
            txAsset.newResellerName = event.getParam("name");
        } else {
            var nameElements = document.getElementsByClassName("newResellerName");
            for(var i = 0; i < nameElements.length; i++) {
                nameElements[i].value = event.getParam("name");
            }
            var txAssets = cmp.get('v.txAssets');
            for(var i = 0; i < txAssets.length; i++) {
                console.log(JSON.stringify(txAssets[i]) + 'check txnassets');
                if(txAssets[i].ntmEligible){
                    ntmTrue = ntmTrue + 1;
                }
                
                else{
                    ntmFalse = ntmFalse +1;
                }

                txAssets[i].newResellerId = event.getParam("id");
                txAssets[i].newResellerName = event.getParam("name");
            }
            if(ntmTrue>0 && ntmFalse>0){
                alert('Please select differently ');
            }
        }
        helper.handleResellerAccountLookupChange(cmp);
    },
    handleSoldToAccountSelect: function(cmp, event, helper) {
    	var lookupAssetId = cmp.get('v.lookupAssetId');
    if(event.getParam("applyToAll") != true) {
    	document.getElementById(lookupAssetId + '_newSoldToName').value = event.getParam("name");
            var txAsset = cmp.get('v.txAssetMap')[lookupAssetId];
            console.log(txAsset);
            console.log(event.getParam("id"));
            console.log(event.getParam("name"));
            txAsset.newSoldToId = event.getParam("id");
            txAsset.newSoldToName = event.getParam("name");
        } else {
            var nameElements = document.getElementsByClassName("newSoldToName");
            for(var i = 0; i < nameElements.length; i++) {
                nameElements[i].value = event.getParam("name");
            }
            var txAssets = cmp.get('v.txAssets');
            for(var i = 0; i < txAssets.length; i++) {
                txAssets[i].newSoldToId = event.getParam("id");
                txAssets[i].newSoldToName = event.getParam("name");
            }
        }
        helper.handleSoldToAccountLookupChange(cmp);
    },
    handleRowRemoval : function(cmp, event, helper) {
        var eventSource = event.currentTarget;
        var rowId = eventSource.getAttribute('data-rowid');
        var selectedRowIds = cmp.get('v.rowIdsSelected');
        var txAssetMap = cmp.get('v.txAssetMap');
        if(cmp.get('v.action') == 'Split' && rowId.indexOf('_') > -1) {
            var temp = txAssetMap[rowId.substring(0, rowId.indexOf('_'))];
            for(var i = 1; i < temp.length; i++) {
                if(temp[i].Id == rowId) {
                    temp[0].assetSeats += parseInt(temp[i].assetSeats);
                    temp.splice(i, 1);
                    break;
                }
            }
            cmp.set('v.txAssets', helper.getTxAssetsFromTxMap(txAssetMap, selectedRowIds, 'Split'));
        } else {
            var index = selectedRowIds.indexOf(rowId);
            if (index > -1) {
                selectedRowIds.splice(index, 1);
            }
            var txAssetMap = cmp.get('v.txAssetMap');
            delete txAssetMap[rowId];
            helper.updateTxAssetTable(cmp);
            helper.updateAssetTable(cmp);
        }  
        if(cmp.get('v.action') == 'Split') {
            var allRequiredFieldsPopulated = true;
            for(var i = 0; i < selectedRowIds.length; i++) {
                if(txAssetMap[selectedRowIds[i]].length < 2) {
                    allRequiredFieldsPopulated = false;
                }
            }
            cmp.set("v.allRequiredFieldsPopulated", allRequiredFieldsPopulated);
        }
    },
    handleAssetCountChange : function(cmp, event, helper) {
        helper.adjustAssetSeats(cmp);
    },
    selectAction : function(cmp, event, helper) {
        var txAssets = cmp.get('v.txAssets');
        if(txAssets.length > 0) {
            var buttonCmp = event.getSource();
            if(cmp.get('v.action') == null) {
                cmp.set('v.action', buttonCmp.get('v.name'));
                helper.selectAction(cmp);
            }
        }
    },
    submit : function(cmp, event, helper) {
        helper.submit(cmp);
    },
    reset : function(cmp, event, helper) {
        helper.reset(cmp);
    },
    cancel : function(cmp, event, helper) {
        helper.cancel(cmp);
    },
    showNotes : function(cmp, event, helper) {
        helper.showNotes(cmp);
    },
    split : function(cmp, event, helper) {
        var eventSource = event.currentTarget;
        var assetId = eventSource.getAttribute('data-id');
        var assetMap = cmp.get('v.assetMap');
        var txAssetMap = cmp.get('v.txAssetMap');
        if(txAssetMap[assetId][0].assetSeats > 1) {
            var temp = helper.getCopy(assetMap[assetId]);
            temp.Id = assetId + '_' + (txAssetMap[assetId].length);
            temp.serialNumberSubscriptionId = null;
            temp.assetSeats = 1;
            txAssetMap[assetId][0].assetSeats -= 1;
            txAssetMap[assetId].push(temp);
        }
        cmp.set('v.txAssets', helper.getTxAssetsFromTxMap(txAssetMap, cmp.get('v.rowIdsSelected'), 'Split'));
        var selectedRowIds = cmp.get('v.rowIdsSelected');
        var allRequiredFieldsPopulated = true;
        for(var i = 0; i < selectedRowIds.length; i++) {
            if(txAssetMap[selectedRowIds[i]].length < 2) {
                allRequiredFieldsPopulated = false;
            }
        }
        cmp.set("v.allRequiredFieldsPopulated", allRequiredFieldsPopulated);
    },
    lookupContract : function(component, event, helper) {
        component.set('v.lookupAssetId', event.currentTarget.getAttribute('data-id'));
        if(component.find('contractLookup') != null) {
            $A.util.removeClass(component.find('contractLookup'), 'hidden');
            var bodyElement = document.getElementsByTagName('body')[0];
            bodyElement.style = 'overflow: hidden;';
        } else {
            helper.showSpinner(component, 'Loading...');
            $A.createComponent(
                "c:TransactionContractLookup",
                {
                    "aura:id" : "contractLookup",
                    "contractId": component.get("v.txServiceContract.Id")
                },
                function(newComp, status, errorMessage) {
                    if (status === "SUCCESS") {
                        if (component.isValid()) {
                            var body = component.get("v.body");
                            body.push(newComp);
                            $A.util.addClass(component.find('spinner'), 'hide');
                            component.set("v.body", body);
                            var bodyElement = document.getElementsByTagName('body')[0];
                            bodyElement.style = 'overflow: hidden;';
                        }
                    }
                    else if (status === "INCOMPLETE") {
                        console.log("No response from server or client is offline.")
                    }
                    else if (status === "ERROR") {
                        console.log("Error: " + errorMessage);
                    }
                }
            ); 
        }     
    },
    lookupContact : function(component, event, helper) {
        component.set('v.lookupAssetId', event.currentTarget.getAttribute('data-id'));
        if(component.find('contactLookup') != null) {
            $A.util.removeClass(component.find('contactLookup'), 'hidden');
            var bodyElement = document.getElementsByTagName('body')[0];
            bodyElement.style = 'overflow: hidden;';
        } else {
            helper.showSpinner(component, 'Loading...');
            $A.createComponent(
                "c:TransactionContactLookup",
                {
                    "aura:id" : "contactLookup",
                    "accountId": component.get("v.txServiceContract.AccountId")
                },
                function(newComp, status, errorMessage) {
                    if (status === "SUCCESS") {
                        if (component.isValid()) {
                            var body = component.get("v.body");
                            body.push(newComp);
                            $A.util.addClass(component.find('spinner'), 'hide');
                            component.set("v.body", body);
                            var bodyElement = document.getElementsByTagName('body')[0];
                            bodyElement.style = 'overflow: hidden;';
                        }
                    }
                    else if (status === "INCOMPLETE") {
                        console.log("No response from server or client is offline.")
                    }
                    else if (status === "ERROR") {
                        console.log("Error: " + errorMessage);
                    }
                }
            ); 
        }     
    },
    lookupResellerAccount : function(component, event, helper) {
        component.set('v.lookupAssetId', event.currentTarget.getAttribute('data-id'));
        var assetId = event.currentTarget.getAttribute('data-id');
        var cliNTMEligible = event.currentTarget.getAttribute('data-flag');
        console.log(cliNTMEligible+'cliNTMEligible>>>');
        console.log(component.find('resellerAccountLookup')+'component.find');
        console.log('lookupComponent>>>'+lookupComponent);
        var lookupComponent = component.find("resellerAccountLookup");
        if(lookupComponent){
            lookupComponent.destroy();
        }
                        
        //cliNTMEligible = cliNTMEligible=== "true" ;
        //var cliEligible = (cliNTMEligible === "true") ?"true":"false";
        //console.log(cliEligible+'cliEligible>>');
        if(component.find('resellerAccountLookup') != null) {
            console.log('inside if');
            $A.util.removeClass(component.find('resellerAccountLookup'), 'hidden');
            var bodyElement = document.getElementsByTagName('body')[0];
            bodyElement.style = 'overflow: hidden;';
        } else {
            helper.showSpinner(component, 'Loading...');
            $A.createComponent(
                "c:TransactionResellerAccountLookup",
                {
                    "aura:id" : "resellerAccountLookup",
                    "assetrecordId" : assetId,
                    "ntmEligible" : cliNTMEligible
                },
                function(newComp, status, errorMessage) {
                    if (status === "SUCCESS") {
                        if (component.isValid()) {
                            var body = component.get("v.body");
                            body.push(newComp);
                            $A.util.addClass(component.find('spinner'), 'hide');
                            component.set("v.body", body);
                            var bodyElement = document.getElementsByTagName('body')[0];
                            bodyElement.style = 'overflow: hidden;';
                        }
                        console.log('lookupComponent>>>down'+lookupComponent);
                    }
                    else if (status === "INCOMPLETE") {
                        console.log("No response from server or client is offline.")
                    }
                    else if (status === "ERROR") {
                        console.log("Error: " + errorMessage);
                    }
                }
            ); 
        }     
    },
	lookupSoldToAccount : function(component, event, helper) {
        console.log('Inside lookupSoldToAccount');
        component.set('v.lookupAssetId', event.currentTarget.getAttribute('data-id'));
        if(component.find('soldToAccountLookup') != null) {
            $A.util.removeClass(component.find('soldToAccountLookup'), 'hidden');
            var bodyElement = document.getElementsByTagName('body')[0];
            bodyElement.style = 'overflow: hidden;';
        } else {
            helper.showSpinner(component, 'Loading...');
            $A.createComponent(
                "c:TransactionSoldToAccountLookup",
                {
                    "aura:id" : "soldToAccountLookup"
                },
                function(newComp, status, errorMessage) {
                    if (status === "SUCCESS") {
                        if (component.isValid()) {
                            var body = component.get("v.body");
                            body.push(newComp);
                            $A.util.addClass(component.find('spinner'), 'hide');
                            component.set("v.body", body);
                            var bodyElement = document.getElementsByTagName('body')[0];
                            bodyElement.style = 'overflow: hidden;';
                        }
                    }
                    else if (status === "INCOMPLETE") {
                        console.log("No response from server or client is offline.")
                    }
                    else if (status === "ERROR") {
                        console.log("Error: " + errorMessage);
                    }
                }
            ); 
        }     
    },
    continuePolling : function(component, event, helper) {
        component.set('v.transactionPollingTime', 0);
        document.getElementById('messageModalId').classList.add('hide');
        helper.checkTransactionStatusAfterWaiting(component);
    },
    hideModalAndReset: function(component, event, helper) {
        document.getElementById('messageModalId').classList.add('hide');
        helper.reset(component);
    },
    closeModal : function(cmp, event, helper) {
        document.getElementById('messageModalId').classList.add('hide');
    },
    redirect : function(cmp, event, helper) {
        var url = '/' + event.currentTarget.getAttribute('data-id');
        helper.redirect(cmp, url, false);
    },
    openInNewTab : function(cmp, event, helper) {
        var url = '/' + event.currentTarget.getAttribute('data-id');
        helper.redirect(cmp, url, true);
    },
    redirectToContract : function(cmp, event, helper) {
        var url = '/' + cmp.get('v.recordId');
        helper.redirect(cmp, url, false);
    },
    goBack : function(cmp, event, helper) {
        var url = '/' + cmp.get('v.recordId');
        helper.redirect(cmp, url, false);
        /*if(typeof history !== 'undefined' && !(typeof sforce !== 'undefined' && typeof sforce.console !== 'undefined' && sforce.console.isInConsole())) {
            history.back();
        } else {
            var url = '/' + cmp.get('v.recordId');
            helper.redirect(cmp, url, false);
        }*/
    }
})