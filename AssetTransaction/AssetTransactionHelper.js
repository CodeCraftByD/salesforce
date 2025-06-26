({
    fetchAssetData: function(cmp) {
        var action = cmp.get('c.getAssets');
        action.setCallback(this, function(actionResult) {
            var state = actionResult.getState();
            if (state === "SUCCESS") {
                var response = actionResult.getReturnValue();
                console.log(response);
                cmp.set('v.txServiceContract', response.sc);
                cmp.set('v.transactionPageLoadTime', response.transactionPageLoadTime);
                cmp.set("v.isTransactionAllowed", response.isTransactionAllowed);
                cmp.set('v.transactionPollingTimeLimit', response.transactionPollingTimeLimit);
                cmp.set('v.transactionPollingInterval', response.transactionPollingInterval);
                cmp.set("v.mergeLineItemLimit", response.mergeLineItemLimit);
                cmp.set("v.splitLineItemLimit", response.splitLineItemLimit);
                cmp.set("v.moveLineItemLimit", response.moveLineItemLimit);
                cmp.set("v.scChangeLineItemLimit", response.scChangeLineItemLimit);
                cmp.set("v.resellerChangeLineItemLimit", response.resellerChangeLineItemLimit);
                cmp.set("v.soldToChangeLineItemLimiit", response.soldToChangeLineItemLimiit);
                cmp.set("v.isMergeAllowed", response.isMergeAllowed);
                cmp.set("v.isSplitAllowed", response.isSplitAllowed);
                cmp.set("v.isMoveAllowed", response.isMoveAllowed);
                cmp.set("v.isSCChangeAllowed", response.isSCChangeAllowed);
                cmp.set("v.isResellerChangeAllowed", response.isResellerChangeAllowed);
                cmp.set("v.isSoldToChangeAllowed", response.isSoldToChangeAllowed);
                cmp.set("v.hasTransactionsPermission", response.hasTransactionsPermission);
                if(response.isTransactionAllowed) {
                    var assets = response.assetList;
                    var assetMap = {};
                    var assetTableData = [];
                    for(var i = 0; i < assets.length; i++) {
                        assetMap[assets[i].cli.Asset__c] = this.mapAssetData(assets[i]);
                        assetTableData.push(assetMap[assets[i].cli.Asset__c]);
                    }
                    cmp.set('v.assetMap', assetMap);
                    var assetTableColumns = [
                        {label: 'Serial Number / Subscription Id', fieldName: 'serialNumberSubscriptionId', sortable:true},
                        {label: 'CLI Status', fieldName: 'cliStatus', sortable:true},
                        {label: 'Product', fieldName: 'product', sortable:true},
                        {label: 'Seats', fieldName: 'assetSeats', sortable:true},
                        {label: 'CLI End Date', fieldName: 'cliEndDate', formattedFieldName: 'cliFormattedEndDate', sortable:true},
                        {label: 'w/ Grace Period', fieldName: 'cliEndDateWithGracePeriod', formattedFieldName: 'cliFormattedEndDateWithGracePeriod',  sortable:true},
                        {label: 'Asset Status', fieldName: 'assetStatus', sortable:true},
                        {label: 'Software Coordinator', fieldName: 'softwareCoordinator', sortable:true},
                        {label: 'Reseller Account', fieldName: 'resellerAccount', sortable:true},
                        {label: 'SoldTo Account', fieldName: 'SoldToAccount', sortable:true},
                        {label: 'Program Type', fieldName: 'programType', sortable:true},
                        {label: 'Pack Size', fieldName: 'packSize', sortable:true}];
                    var relatedTableCmp = cmp.find('assetTable');
                    relatedTableCmp.setColumnsAndData(assetTableColumns, assetTableData);
                } else {
                    var temp = response.errorMessages;
                    let messageSet = new Set();
                    var errorMessages = [];
                    for(var i = 0; i < temp.length; i++) {
                        if(!messageSet.has(temp[i])) {
                            messageSet.add(temp[i]);
                            errorMessages.push(temp[i]);
                        }
                    }
                    this.setErrors(cmp, errorMessages);
                }
            } else if (state === "INCOMPLETE") {
                this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
            } else if (state === "ERROR") {
                var errors = actionResult.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        this.setErrors(cmp, [errors[0].message]);
                    }
                } else {
                    this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
                }
            }
            if(typeof sforce !== 'undefined' && ((cmp.get("v.isInConsole") == true) || (typeof sforce.one !== 'undefined'))) {
                document.getElementById('container').classList.add('containerMargin');
            }
            this.setTxAssets(cmp, 'Initialize', cmp.get('v.action'));
            this.hideSpinner(cmp);
        });
        action.setParams({ 
            "contractId" : cmp.get('v.recordId')
        });
        this.showSpinner(cmp, 'Loading...');
        $A.enqueueAction(action); 
    },
    mapAssetData : function(assetWrapper) {
        var temp = {};
        if(assetWrapper.cli != null) {
            temp.Id = assetWrapper.cli.Asset__c;
            temp.serialNumberSubscriptionId = assetWrapper.cli.Serial_Number_Subscription_Id__c;
            temp.cliStatus = assetWrapper.cli.Status;
            temp.product = assetWrapper.cli.Asset__r.Product_Line_Name__c;
            temp.contractNumber = assetWrapper.cli.ServiceContract.Agreement_Number__c;
            temp.accountCSN = assetWrapper.cli.Asset__r.End_Customer_Account__r.Account_CSN__c;
            temp.assetSeats = assetWrapper.cli.Asset__r.Quantity__c;
            temp.cliEndDate = assetWrapper.cli.Actual_End_Date__c;
            temp.cliEndDateWithGracePeriod = assetWrapper.cli.EndDate;
            temp.cliFormattedEndDate = assetWrapper.formattedEndDate;
            temp.cliFormattedEndDateWithGracePeriod = assetWrapper.formattedEndDateWithGracePeriod;
            temp.assetStatus = assetWrapper.cli.Asset__r.Status__c;
            if(assetWrapper.cli.ServiceContract.Contact != null) {
                temp.contractManager = assetWrapper.cli.ServiceContract.Contact.Name;
            }
            if(assetWrapper.cli.Asset__r.Contact__r != null) {
                temp.softwareCoordinator = assetWrapper.cli.Asset__r.Contact__r.Name;
            }
            if(assetWrapper.cli.Asset__r.Reseller_Account__r != null) {
                temp.resellerAccount = assetWrapper.cli.Asset__r.Reseller_Account__r.Name;
            }
            if(assetWrapper.cli.Asset__r.Account__r != null){
                temp.SoldToAccount = assetWrapper.cli.Asset__r.Account__r.Name;
            }
            temp.programType = assetWrapper.cli.Asset__r.Program_Type__c;
            temp.packSize = assetWrapper.cli.Asset__r.Pack_Size__c;
            temp.ntmEligible = assetWrapper.cli.NTM_Eligible__c;
        }
        return temp;
    },
    getCopy : function(assetWrapper) {
        var temp = {};
        if(assetWrapper!= null) {
            temp.Id = assetWrapper.Id;
            temp.serialNumberSubscriptionId = assetWrapper.serialNumberSubscriptionId;
            temp.cliStatus = assetWrapper.cliStatus;
            temp.product = assetWrapper.product;
            temp.contractNumber = assetWrapper.contractNumber;
            temp.accountCSN = assetWrapper.accountCSN;
            temp.assetSeats = assetWrapper.assetSeats;
            temp.cliEndDate = assetWrapper.cliEndDate;
            temp.cliEndDateWithGracePeriod = assetWrapper.cliEndDateWithGracePeriod;
            temp.cliFormattedEndDate = assetWrapper.cliFormattedEndDate;
            temp.cliFormattedEndDateWithGracePeriod = assetWrapper.cliFormattedEndDateWithGracePeriod;
            temp.assetStatus = assetWrapper.assetStatus;
            temp.contractManager = assetWrapper.contractManager;
            temp.softwareCoordinator = assetWrapper.softwareCoordinator;
            temp.resellerAccount = assetWrapper.resellerAccount;
            temp.SoldToAccount = assetWrapper.SoldToAccount;
            temp.programType = assetWrapper.programType;
            temp.packSize = assetWrapper.packSize;
            temp.ntmEligible = assetWrapper.ntmEligible;
        }
        return temp;
    },
    reset : function(cmp) {
        cmp.set('v.rowIdsSelected', []);
        this.fetchAssetData(cmp);
        this.updateAssetTable(cmp);
        this.cancel(cmp);
        this.destroyLookupModals(cmp);
    },
    cancel : function(cmp) {
        cmp.set('v.disableMergeButton', false);
        cmp.set('v.disableSplitButton', false);
        cmp.set('v.disableMoveButton', false);
        cmp.set('v.disableSCChangeButton', false);
        cmp.set('v.disableResellerChangeButton', false);
        cmp.set('v.disableSoldToChangeButton', false);
        $A.util.removeClass(cmp.find('mergeButton'), 'activeButton');
        $A.util.removeClass(cmp.find('splitButton'), 'activeButton');
        $A.util.removeClass(cmp.find('moveButton'), 'activeButton');
        $A.util.removeClass(cmp.find('changeSCButton'), 'activeButton');
        $A.util.removeClass(cmp.find('changeResellerButton'), 'activeButton');
        $A.util.removeClass(cmp.find('changeSoldToButton'), 'activeButton');
        cmp.set('v.action', null);
        this.setTxAssets(cmp, 'Reset', cmp.get('v.action'));
        this.setErrors(cmp, []);
        this.hideSubmitSection(cmp);
        cmp.set('v.isSubmitValid', false);
        cmp.set('v.showSCLookup', false);
        cmp.set('v.showContractNumberLookup', false);
        cmp.set('v.showResellerAccountLookup', false);
        cmp.set('v.showSoldToAccountLookup', false);
        cmp.set('v.allRequiredFieldsPopulated', false);
    },
    setIsButtonRelevantFlags : function(cmp) {
        var txAssets = cmp.get('v.txAssets');
        if(txAssets.length < 1) {
            cmp.set('v.isSCChangeButtonRelevant', false);
            cmp.set('v.isSplitButtonRelevant', false);
            cmp.set('v.isMoveButtonRelevant', false);
            cmp.set('v.isResellerChangeButtonRelevant', false);
            cmp.set('v.isSoldToChangeButtonRelevant', false);
            if(cmp.get('v.action') == 'Split' || cmp.get('v.action') == 'Move' || cmp.get('v.action') == 'Change SC' || cmp.get('v.action') == 'Change Reseller' || cmp.get('v.action') == 'Change SoldTo') {
                cmp.set('v.action', null);
                this.cancel(cmp);
            }
        } else {
            cmp.set('v.isSCChangeButtonRelevant', true);
            cmp.set('v.isSplitButtonRelevant', true);
            cmp.set('v.isMoveButtonRelevant', true);
            cmp.set('v.isResellerChangeButtonRelevant', true);
            cmp.set('v.isSoldToChangeButtonRelevant', true);
        }
        if(txAssets.length < 2) {
            cmp.set('v.isMergeButtonRelevant', false);
            if(cmp.get('v.action') == 'Merge') {
                cmp.set('v.action', null);
                this.cancel(cmp);
            }
        } else {
            cmp.set('v.isMergeButtonRelevant', true);
        }
    },
    //updates bottom table
    updateAssetTable : function(cmp) {
        var selectedRowIds = cmp.get('v.rowIdsSelected');
        var assetTableCmp = cmp.find('assetTable');
        assetTableCmp.setRowIdsSelected(selectedRowIds);
    },
    //updates top table
    updateTxAssetTable : function(cmp) {
        this.setTxAssets(cmp, 'Update', cmp.get('v.action'));
        var txAssets = cmp.get('v.txAssets');
        if(txAssets.length > 0) {
            this.checkEligibility(cmp, 'Active');
        } else {
            this.cancel(cmp);
        }
    },
    setTxAssets : function(cmp, context, action) {
        var txAssetMap;
        var selectedRowIds = cmp.get('v.rowIdsSelected');
        var assetMap = cmp.get('v.assetMap');
        if(context == 'Reset' || context == 'Initialize') {
            if(action == 'Split') {
                txAssetMap = {};
                for(var i = 0; i < selectedRowIds.length; i++) {
                    var temp1 = this.getCopy(assetMap[selectedRowIds[i]]);
                    temp1.disableSeatCountInput = true;
                    txAssetMap[selectedRowIds[i]]= [temp1];
                    if(temp1.assetSeats > 1) {
                        var temp2 = this.getCopy(assetMap[selectedRowIds[i]]);
                        temp2.disableSeatCountInput = false;
                        temp2.Id = temp1.Id + '_1';
                        temp2.serialNumberSubscriptionId = null;
                        temp2.assetSeats = 1;
                        temp1.assetSeats -= 1;
                        txAssetMap[selectedRowIds[i]].push(temp2);
                    }
                }
                cmp.set("v.allRequiredFieldsPopulated", true);
            } else {
                txAssetMap = {};
                for(var i = 0; i < selectedRowIds.length; i++) {
                    txAssetMap[selectedRowIds[i]] = this.getCopy(assetMap[selectedRowIds[i]]);
                }
            }
        } else if(context == 'Update') {
            if(action == 'Split') {
                txAssetMap = cmp.get('v.txAssetMap') || {};
                for(var i = 0; i < selectedRowIds.length; i++) {
                    if(!txAssetMap[selectedRowIds[i]]) {
                        var temp1 = this.getCopy(assetMap[selectedRowIds[i]]);
                        temp1.disableSeatCountInput = true;
                        txAssetMap[selectedRowIds[i]]= [temp1];
                        if(temp1.assetSeats > 1) {
                            var temp2 = this.getCopy(assetMap[selectedRowIds[i]]);
                            temp2.disableSeatCountInput = false;
                            temp2.Id = temp1.Id + '_1';
                            temp2.serialNumberSubscriptionId = null;
                            temp2.assetSeats = 1;
                            temp1.assetSeats -= 1;
                            txAssetMap[selectedRowIds[i]].push(temp2);
                        }
                    }
                }
                var allRequiredFieldsPopulated = true;
                for(var i = 0; i < selectedRowIds.length; i++) {
                    if(txAssetMap[selectedRowIds[i]].length < 2) {
                        allRequiredFieldsPopulated = false;
                    }
                }
                cmp.set("v.allRequiredFieldsPopulated", allRequiredFieldsPopulated);
            } else {
                txAssetMap = cmp.get('v.txAssetMap') || {};
                for(var i = 0; i < selectedRowIds.length; i++) {
                    if(!txAssetMap[selectedRowIds[i]]) {
                        txAssetMap[selectedRowIds[i]] = this.getCopy(assetMap[selectedRowIds[i]]);
                    }
                }
            }
        }
        cmp.set('v.txAssetMap', txAssetMap);
        cmp.set('v.txAssets', this.getTxAssetsFromTxMap(txAssetMap, selectedRowIds, action)); 
        this.setIsButtonRelevantFlags(cmp);  
    },
    getTxAssetsFromTxMap : function(txAssetMap, selectedRowIds, action) {
        var txAssets = [];
        if(action == 'Split') {
            for(var i = 0; i < selectedRowIds.length; i++) {
                if(txAssetMap[selectedRowIds[i]] != null) {
                    var splitAssets = txAssetMap[selectedRowIds[i]];
                    for(var j = 0; j < splitAssets.length; j++) {
                        txAssets.push(splitAssets[j]);
                    }
                }
            }
        } else {
            for(var i = 0; i < selectedRowIds.length; i++) {
                if(txAssetMap[selectedRowIds[i]]) {
                    txAssets.push(txAssetMap[selectedRowIds[i]]);
                }
            }
        }
        return txAssets;
    },
    adjustAssetSeats : function(cmp) {
        this.setErrors(cmp, []);
        cmp.set("v.isSubmitValid", true);
        var errors = [];
        var txAssetMap = cmp.get('v.txAssetMap');
        var assetMap = cmp.get('v.assetMap');
        var selectedRowIds = cmp.get('v.rowIdsSelected');
        for(var j = 0; j < selectedRowIds.length; j++) {
            var temp = txAssetMap[selectedRowIds[j]];
            var asset = assetMap[selectedRowIds[j]];
            var mainAssetSeats = asset.assetSeats;
            var hasErrors = false;
            for(var i = 1; i < temp.length; i++) {
                if(temp[i].assetSeats < 1) {
                    errors.push(temp[0].serialNumberSubscriptionId + ' - ' + $A.get("$Label.c.Asset_Split_Zero_Quantity_Message"));
                    hasErrors = true;
                    break;
                } else {
                    mainAssetSeats -= temp[i].assetSeats;
                    if(mainAssetSeats < 1) {
                        errors.push(temp[0].serialNumberSubscriptionId + ' - ' + $A.get("$Label.c.Asset_Split_Invalid_Total_Quantity_Message"));
                        hasErrors = true;
                        break;
                    }
                }
            }
            if(!hasErrors) {
                temp[0].assetSeats = mainAssetSeats;
            }
        }
        if(errors.length > 0) {
            this.setErrors(cmp, errors);
            cmp.set("v.isSubmitValid", false);
        }
        cmp.set('v.txAssets', this.getTxAssetsFromTxMap(txAssetMap, cmp.get('v.rowIdsSelected'), 'Split'));
    },
    showSubmitSection : function(cmp) {
        document.getElementById('submitSection').classList.remove('hide');
    },
    hideSubmitSection : function(cmp) {
        document.getElementById('submitSection').classList.add('hide');
    },
    showNotes : function(cmp) {
        $A.util.removeClass(cmp.find('notes'), 'hide');
    },
    hideNotes : function(cmp) {
        $A.util.addClass(cmp.find('notes'), 'hide');
    },
    handleSCLookupChange : function(cmp) {
        this.checkSCChangeEligibility(cmp);
    },
    handleContractLookupChange : function(cmp) {
        this.checkMoveEligibility(cmp);
    },
    handleResellerAccountLookupChange : function(cmp) {
        this.checkResellerChangeEligibility(cmp);
    },
    handleSoldToAccountLookupChange : function(cmp) {
        this.checkSoldToChangeEligibility(cmp);
    },
    selectAction: function(cmp) {
        var action = cmp.get('v.action');
        if(action == 'Merge') {
            $A.util.addClass(cmp.find('mergeButton'), 'activeButton');
            cmp.set('v.disableMoveButton', true);
            cmp.set('v.disableSplitButton', true);
            cmp.set('v.disableSCChangeButton', true);
            cmp.set('v.disableResellerChangeButton', true);
            cmp.set('v.disableSoldToChangeButton', true);
            cmp.set('v.allRequiredFieldsPopulated', true);
        } else if(action == 'Split') {
            this.setTxAssets(cmp, 'Initialize', 'Split');
            $A.util.addClass(cmp.find('splitButton'), 'activeButton');
            cmp.set('v.disableMergeButton', true);
            cmp.set('v.disableMoveButton', true);
            cmp.set('v.disableResellerChangeButton', true);
            cmp.set('v.disableSoldToChangeButton', true);
            cmp.set('v.disableSCChangeButton', true);
        } else if(action == 'Move') {
            $A.util.addClass(cmp.find('moveButton'), 'activeButton');
            cmp.set('v.disableMergeButton', true);
            cmp.set('v.disableSplitButton', true);
            cmp.set('v.disableSCChangeButton', true);
            cmp.set('v.disableResellerChangeButton', true);
            cmp.set('v.disableSoldToChangeButton', true);
            cmp.set('v.showContractNumberLookup', true);
        } else if(action == 'Change SC') {
            $A.util.addClass(cmp.find('changeSCButton'), 'activeButton');
            cmp.set('v.disableMergeButton', true);
            cmp.set('v.disableSplitButton', true);
            cmp.set('v.disableMoveButton', true);
            cmp.set('v.disableResellerChangeButton', true);
            cmp.set('v.disableSoldToChangeButton', true);
            cmp.set('v.showSCLookup', true);
        } else if(action == 'Change Reseller') {
            $A.util.addClass(cmp.find('changeResellerButton'), 'activeButton');
            cmp.set('v.disableMergeButton', true);
            cmp.set('v.disableSplitButton', true);
            cmp.set('v.disableMoveButton', true);
            cmp.set('v.disableSCChangeButton', true);
            cmp.set('v.showResellerAccountLookup', true);
            cmp.set('v.disableSoldToChangeButton', true);
        } else if(action == 'Change SoldTo'){
            $A.util.addClass(cmp.find('changeSoldToButton'), 'activeButton');
            cmp.set('v.disableMergeButton', true);
            cmp.set('v.disableSplitButton', true);
            cmp.set('v.disableMoveButton', true);
            cmp.set('v.disableSCChangeButton', true);
            cmp.set('v.disableResellerChangeButton', true);
            cmp.set('v.showSoldToAccountLookup', true);
        }
        if(action != null && action != '') {
            this.showSubmitSection(cmp);
            this.checkEligibility(cmp);
        }
    },
    checkEligibility : function(cmp) {
        var action = cmp.get('v.action');
        if(action == 'Merge') {
            this.checkMergeEligibility(cmp);
        } else if(action == 'Split') {
            this.checkSplitEligibility(cmp);
        } else if(action == 'Move') {
            this.checkMoveEligibility(cmp);
        } else if(action == 'Change SC') {
            this.checkSCChangeEligibility(cmp);
        } else if(action == 'Change Reseller') {
            this.checkResellerChangeEligibility(cmp);
        } else if(action == 'Change SoldTo') {
            this.checkSoldToChangeEligibility(cmp);
        }
    },
    submit : function(cmp) {
        var action = cmp.get('v.action');
        if(action == 'Merge') {
            this.submitMerge(cmp);
        } else if(action == 'Split') {
            this.submitSplit(cmp);
        } else if(action == 'Move') {
            this.submitMove(cmp);
        } else if(action == 'Change SC') {
            this.submitSCChange(cmp);
        } else if(action == 'Change Reseller') {
            this.submitResellerChange(cmp);
        } else if(action == 'Change SoldTo') {
            this.submitSoldToChange(cmp);
        }
    },
    checkMergeEligibility : function(cmp) {
        this.setErrors(cmp, []);
        cmp.set('v.isSubmitValid', false);
        var txAssets = cmp.get('v.txAssets');
        var mergeLineItemLimit = cmp.get('v.mergeLineItemLimit');
        if(mergeLineItemLimit > -1 && txAssets.length > mergeLineItemLimit) {
            this.setErrors(cmp, [$A.get("$Label.c.Transaction_Line_Item_Limit_Warning").replace("<limit>", mergeLineItemLimit)]);
        } else {
            var action = cmp.get('c.checkMergeEligibility');
            action.setCallback(this, function(actionResult) { 
                var state = actionResult.getState();
                if (state === "SUCCESS") {
                    var response = actionResult.getReturnValue();
                    console.log(response);
                    var isValid = response.isValid;
                    var errorMessages = response.errorMessages;
                    if(!isValid) {
                        this.setErrors(cmp, errorMessages);
                    } else {
                        cmp.set('v.isSubmitValid', true);
                    }
                } else if (state === "INCOMPLETE") {
                    this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
                } else if (state === "ERROR") {
                    var errors = response.getError();
                    if (errors) {
                        if (errors[0] && errors[0].message) {
                            this.setErrors(cmp, [errors[0].message]);
                        }
                    } else {
                        this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
                    }
                }
                this.hideSpinner(cmp);
            });
            var assetIds = [];
            var temp = cmp.get("v.txAssets");
            for(var i = 1; i < temp.length; i++) {
                assetIds.push(temp[i].Id);
            }
            console.log(temp[0].Id);
            console.log(assetIds);
            action.setParams({ 
                "survivorAssetId" : temp[0].Id,
                "victimAssetIds" : assetIds
            });
            this.showSpinner(cmp, 'Validating...');
            $A.enqueueAction(action); 
        }
    },
    submitMerge: function(cmp) {
        this.setErrors(cmp, []);
        var action = cmp.get('c.performMerge');
        action.setCallback(this, function(actionResult) { 
            var state = actionResult.getState();
            if (state === "SUCCESS") {
                var response = actionResult.getReturnValue();
                console.log(response);
                var errorMessages = response.errorMessages;
                if(response.transactionStatus == 'Success' && response.tx != null) {
                    var temp = cmp.get("v.txAssets");
                    var selectedRowIds = cmp.get('v.rowIdsSelected');
                    for(var i = 0; i < temp.length; i++) {
                        var index = selectedRowIds.indexOf(temp[i].Id);
                        if (index > -1) {
                            selectedRowIds.splice(index, 1);
                        }
                    }
                    cmp.set("v.txAssets", []);
                    this.showMessage(cmp, $A.get("$Label.c.Asset_Merge_Successful_Message"), ['okButton1', 'contractLinkMessage'], 'transactionSuccessfulContent', [response.tx]);
                    cmp.set("v.notes", "");
                    this.hideSpinner(cmp);
                } else {
                    if(errorMessages.length == 0) {
                        errorMessages = [$A.get("$Label.c.EMS_Transaction_System_Error")];
                    }
                    this.setErrors(cmp, errorMessages, response.tx != null ? [response.tx] : null);
                    this.hideSpinner(cmp);
                }
            } else if (state === "INCOMPLETE") {
                this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
                this.hideSpinner(cmp);
            } else if (state === "ERROR") {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        this.setErrors(cmp, [errors[0].message]);
                        this.hideSpinner(cmp);
                    }
                } else {
                    this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
                    this.hideSpinner(cmp);
                }
            }
        });
        var temp = cmp.get("v.txAssets");
        var victimAssetIds = [];
        for(var i = 1; i < temp.length; i++) {
            victimAssetIds.push(temp[i].Id);
        }
        console.log(temp[0].Id);
        console.log(victimAssetIds);
        action.setParams({ 
            "victimAssetIds" : victimAssetIds,
            "survivorAssetId" : temp[0].Id,
            "notes" : cmp.get("v.notes"),
            "transactionPageLoadTime" : cmp.get('v.transactionPageLoadTime')
        });
        this.showSpinner(cmp, 'Merging...');
        $A.enqueueAction(action); 
    },
    checkSplitEligibility : function(cmp) {
        this.setErrors(cmp, []);
        cmp.set('v.isSubmitValid', false);
        var assetIds = [];
        var errors = [];
        var temp = cmp.get("v.txAssets");
        var txAssetMap = cmp.get('v.txAssetMap');
        var lineItemCount = 0;
        for(var i = 0; i < temp.length; i++) {
            if(temp[i].serialNumberSubscriptionId != null) {
                if(!((txAssetMap[temp[i].Id] !== 'undefined' && txAssetMap[temp[i].Id].length > 1 && temp[i].assetSeats >= 1) || temp[i].assetSeats >= 2)) {
                    errors.push(temp[i].serialNumberSubscriptionId + ' - ' + $A.get("$Label.c.Asset_Split_Minimum_Quantity_Message"));
                } else if(temp[i].Id != null) {
                    assetIds.push(temp[i].Id);
                }
                lineItemCount++;
            }
        }
        var splitLineItemLimit = cmp.get('v.splitLineItemLimit');
        if(splitLineItemLimit > -1 && lineItemCount > splitLineItemLimit) {
            errors.push($A.get("$Label.c.Transaction_Line_Item_Limit_Warning").replace("<limit>", splitLineItemLimit));
        }
        if(errors.length > 0) {
            this.setErrors(cmp, errors);
        } else {
            var processingAssetIds = [];
            var rowIdsSelected = cmp.get("v.rowIdsSelected");
            for(var i = 0; i < rowIdsSelected.length; i++) {
                processingAssetIds.push(rowIdsSelected[i]);
            }
            cmp.set("v.processingAssetIds", processingAssetIds);
            cmp.set("v.processingErrorMessages", []);
            this.setErrors(cmp, []);
            this.checkSplitEligibilityThroughApi(cmp);
        }
    },
    checkSplitEligibilityThroughApi: function(cmp) {
        var action = cmp.get('c.checkSplitEligibility');
        action.setCallback(this, function(actionResult) { 
            var state = actionResult.getState();
            if (state === "SUCCESS") {
                var response = actionResult.getReturnValue();
                console.log(response);
                var isValid = response.isValid;
                var errorMessages = response.errorMessages;
                var processingAssetIds = cmp.get("v.processingAssetIds");
                if(!isValid) {
                    var processingErrorMessages = cmp.get("v.processingErrorMessages");
                    processingErrorMessages = processingErrorMessages.concat(errorMessages);
                    cmp.set("v.processingErrorMessages", processingErrorMessages);
                }
                processingAssetIds.shift();
                if(processingAssetIds.length == 0) {
                    var processingErrorMessages = cmp.get("v.processingErrorMessages");
                    if(processingErrorMessages.length == 0) {
                        cmp.set('v.isSubmitValid', true);
                    } else {
                        this.setErrors(cmp, processingErrorMessages);
                    }
                    this.hideSpinner(cmp);
                } else {
                    this.checkSplitEligibilityThroughApi(cmp);
                }
            } else if (state === "INCOMPLETE") {
                this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
                this.hideSpinner(cmp);
            } else if (state === "ERROR") {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        this.setErrors(cmp, [errors[0].message]);
                        this.hideSpinner(cmp);
                    }
                } else {
                    this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
                    this.hideSpinner(cmp);
                }
            }
        });
        var processingAssetIds = cmp.get("v.processingAssetIds");
        var txAssetMap = cmp.get('v.txAssetMap');
        var assetMap = cmp.get('v.assetMap');
        var seats = [];
        if(typeof txAssetMap !== 'undefined') {
            var temp = txAssetMap[processingAssetIds[0]];
            for(var i = 0; i < temp.length; i++) {
                seats.push(parseInt(temp[i].assetSeats));
            }
        } else {
            var temp = assetMap[processingAssetIds[0]];
            seats.push(parseInt(temp.assetSeats - 1));
            seats.push(1);
        }
        console.log(processingAssetIds[0]);
        console.log(seats);
        action.setParams({ 
            "assetId" : processingAssetIds[0],
            "seats" : seats
        });
        cmp.set("v.spinnerMessage", 'Validating...');
        this.showSpinner(cmp, 'Validating...');
        $A.enqueueAction(action); 
    },
    submitSplit: function(cmp) {
        var processingAssetIds = [];
        var rowIdsSelected = cmp.get("v.rowIdsSelected");
        for(var i = 0; i < rowIdsSelected.length; i++) {
            processingAssetIds.push(rowIdsSelected[i]);
        }
        cmp.set("v.processingAssetIds", processingAssetIds);
        cmp.set("v.processingErrorMessages", []);
        this.setErrors(cmp, []);
        cmp.set('v.successfulTransactions', []);
        cmp.set('v.failedTransactions', []);
        this.checkIfAssetsAreModified(cmp, 'Split');
    },
    submitSplitTransaction: function(cmp) {
        console.log('submitSplitTransaction????');
        var action = cmp.get('c.performSplit');
        action.setCallback(this, function(actionResult) { 
            var state = actionResult.getState();
            if (state === "SUCCESS") {
                var response = actionResult.getReturnValue();
                console.log(response);
                var errorMessages = response.errorMessages;
                var processingAssetIds = cmp.get("v.processingAssetIds");
                if(response.transactionStatus == 'Success' && response.tx != null) {
                    var rowIdsSelected = cmp.get("v.rowIdsSelected");
                    if(rowIdsSelected.indexOf(processingAssetIds[0]) > -1) {
                        rowIdsSelected.splice(rowIdsSelected.indexOf(processingAssetIds[0]),1);
                    }
                    this.setTxAssets(cmp, 'Update', cmp.get('v.action'));
                    cmp.get('v.successfulTransactions').push(response.tx);
                } else {
                    if(errorMessages.length == 0) {
                        errorMessages = [$A.get("$Label.c.EMS_Transaction_System_Error")];
                    }
                    var processingErrorMessages = cmp.get("v.processingErrorMessages");
                    processingErrorMessages = processingErrorMessages.concat(errorMessages);
                    cmp.set("v.processingErrorMessages", processingErrorMessages);
                    if(response.tx != null) {
                        cmp.get('v.failedTransactions').push(response.tx);
                    }
                } 
                processingAssetIds.shift();
                if(processingAssetIds.length == 0) {
                    var processingErrorMessages = cmp.get("v.processingErrorMessages");
                    if(processingErrorMessages.length == 0) {
                        this.showMessage(cmp, $A.get("$Label.c.Asset_Split_Successful_Message"), ['okButton1', 'contractLinkMessage'], 'transactionSuccessfulContent', cmp.get('v.successfulTransactions'));
                        cmp.set("v.notes", "");
                        this.hideSpinner(cmp);
                    } else {
                        let messageSet = new Set();
                        var errorMessages = [];
                        for(var i = 0; i < processingErrorMessages.length; i++) {
                            if(!messageSet.has(processingErrorMessages[i])) {
                                messageSet.add(processingErrorMessages[i]);
                                errorMessages.push(processingErrorMessages[i]);
                            }
                        }
                        this.setErrors(cmp, errorMessages, cmp.get('v.failedTransactions'));
                        this.fetchAssetData(cmp);
                        this.updateAssetTable(cmp);
                    }
                } else {
					console.log('Else Block');
                    this.submitSplitTransaction(cmp);
                }
            } else if (state === "INCOMPLETE") {
                this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
                this.hideSpinner(cmp);
            } else if (state === "ERROR") {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        this.setErrors(cmp, [errors[0].message]);
                        this.hideSpinner(cmp);
                    }
                } else {
                    this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
                    this.hideSpinner(cmp);
                }
            }
        });
        var processingAssetIds = cmp.get("v.processingAssetIds");
        var txAssetMap = cmp.get('v.txAssetMap');
        var assetMap = cmp.get('v.assetMap');
        var temp = txAssetMap[processingAssetIds[0]];
        var seats = [];
        for(var i = 0; i < temp.length; i++) {
            seats.push(parseInt(temp[i].assetSeats));
        }
        console.log(processingAssetIds[0]);
        console.log(seats);
        action.setParams({ 
            "assetId" : processingAssetIds[0],
            "seats" : seats,
            "notes" : cmp.get("v.notes"),
            "transactionPageLoadTime" : cmp.get('v.transactionPageLoadTime')
        });
        this.showSpinner(cmp, 'Splitting Asset - ' + assetMap[processingAssetIds[0]].serialNumberSubscriptionId);
        $A.enqueueAction(action); 
    },
    checkMoveEligibility : function(cmp) {
        cmp.set('v.isSubmitValid', false);
        var txAssets = cmp.get('v.txAssets');
        var allRequiredFieldsPopulated = true;
        for(var i = 0; i < txAssets.length; i++) {
            if(document.getElementById(txAssets[i].Id + '_newContractNumber') == null || document.getElementById(txAssets[i].Id + '_newContractNumber').value == '') {
                allRequiredFieldsPopulated = false;
            }
        }
        cmp.set('v.allRequiredFieldsPopulated', allRequiredFieldsPopulated);
        var moveLineItemLimit = cmp.get('v.moveLineItemLimit');
        if(moveLineItemLimit > -1 && txAssets.length > moveLineItemLimit) {
            this.setErrors(cmp, [$A.get("$Label.c.Transaction_Line_Item_Limit_Warning").replace("<limit>", moveLineItemLimit)]);
        } else {
            var processingAssetIds = [];
            var rowIdsSelected = cmp.get("v.rowIdsSelected");
            for(var i = 0; i < rowIdsSelected.length; i++) {
                processingAssetIds.push(rowIdsSelected[i]);
            }
            cmp.set("v.processingAssetIds", processingAssetIds);
            cmp.set("v.processingErrorMessages", []);
            this.setErrors(cmp, []);
            this.checkMoveEligibilityThroughApi(cmp);
        }
    },
    checkMoveEligibilityThroughApi: function(cmp) {
        var action = cmp.get('c.checkMoveEligibility');
        action.setCallback(this, function(actionResult) {
            var state = actionResult.getState();
            if (state === "SUCCESS") {
                var response = actionResult.getReturnValue();
                console.log(response);
                var errorMessages = response.errorMessages;
                var isValid = response.isValid;
                var processingAssetIds = cmp.get("v.processingAssetIds");
                var assetIds = [];
                var contractId = '';
                var index;
                var txAssetMap = cmp.get("v.txAssetMap");
                for(var i = 0; i < processingAssetIds.length; i++) {
                    if(contractId == '') {
                        contractId = txAssetMap[processingAssetIds[i]].newContractId;
                    }
                    if(contractId == txAssetMap[processingAssetIds[i]].newContractId) {
                        assetIds.push(processingAssetIds[i]);
                    }
                }
                if(!isValid) {
                    var processingErrorMessages = cmp.get("v.processingErrorMessages");
                    processingErrorMessages = processingErrorMessages.concat(errorMessages);
                    cmp.set("v.processingErrorMessages", processingErrorMessages);
                }
                for(var i = 0; i < assetIds.length; i++) {
                    var index = processingAssetIds.indexOf(assetIds[i]);
                    if (index > -1) {
                        processingAssetIds.splice(index,1);
                    }
                }
                if(processingAssetIds.length == 0) {
                    var processingErrorMessages = cmp.get("v.processingErrorMessages");
                    if(processingErrorMessages.length == 0) {
                        cmp.set('v.isSubmitValid', true);
                    } else {
                        let messageSet = new Set();
                        var errorMessages = [];
                        for(var i = 0; i < processingErrorMessages.length; i++) {
                            if(!messageSet.has(processingErrorMessages[i])) {
                                messageSet.add(processingErrorMessages[i]);
                                errorMessages.push(processingErrorMessages[i]);
                            }
                        }
                        this.setErrors(cmp, errorMessages);
                    }
                    this.hideSpinner(cmp);
                } else {
                    this.checkMoveEligibilityThroughApi(cmp);
                }
            } else if (state === "INCOMPLETE") {
                this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
                this.hideSpinner(cmp);
            } else if (state === "ERROR") {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        this.setErrors(cmp, [errors[0].message]);
                        this.hideSpinner(cmp);
                    }
                } else {
                    this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
                    this.hideSpinner(cmp);
                }
            } 
        });
        var processingAssetIds = cmp.get("v.processingAssetIds");
        var assetIds = [];
        var assetSerialNumbers = [];
        var contractId = '';
        var txAssetMap = cmp.get("v.txAssetMap");
        for(var i = 0; i < processingAssetIds.length; i++) {
            if(contractId == '') {
                contractId = txAssetMap[processingAssetIds[i]].newContractId;
            }
            if(contractId == txAssetMap[processingAssetIds[i]].newContractId) {
                assetIds.push(processingAssetIds[i]);
                assetSerialNumbers.push(txAssetMap[processingAssetIds[i]].serialNumberSubscriptionId);
            }
        }
        console.log(contractId);
        console.log(assetIds);
        action.setParams({ 
            "contractId" : contractId,
            "assetIds" : assetIds
        });
        this.showSpinner(cmp, 'Validating...');
        $A.enqueueAction(action); 
    },
    submitMove: function(cmp) {
        var processingAssetIds = [];
        var rowIdsSelected = cmp.get("v.rowIdsSelected");
        for(var i = 0; i < rowIdsSelected.length; i++) {
            processingAssetIds.push(rowIdsSelected[i]);
        }
        cmp.set("v.processingAssetIds", processingAssetIds);
        cmp.set("v.processingErrorMessages", []);
        cmp.set('v.pollingAssetIdTransactionIdMap', {});
        cmp.set('v.pollingAssetIds', []);
        this.setErrors(cmp, []);
        this.checkIfAssetsAreModified(cmp, 'Move');
    },
    submitMoveTransaction: function(cmp) {
        var action = cmp.get('c.performMove');
        action.setCallback(this, function(actionResult) {
            var state = actionResult.getState();
            if (state === "SUCCESS") {
                var response = actionResult.getReturnValue();
                console.log(response);
                var errorMessages = response.errorMessages;
                var processingAssetIds = cmp.get("v.processingAssetIds");
                var processingErrorMessages = cmp.get("v.processingErrorMessages");
                if(response.transactionStatus == 'Pending') {
                    cmp.set('v.isTransactionAsync', true);
                }
                if(response.tx != null && response.tx.Id != null) {
                    var pollingAssetIdTransactionIdMap = cmp.get('v.pollingAssetIdTransactionIdMap') || {};
                    var pollingAssetIds = cmp.get('v.pollingAssetIds') || [];
                    for(var i = 0; i < assetIds.length; i++) {
                        pollingAssetIdTransactionIdMap[assetIds[i]] = response.tx.Id;
                        pollingAssetIds.push(assetIds[i]);
                    }
                    cmp.set('v.pollingAssetIdTransactionIdMap', pollingAssetIdTransactionIdMap);
                    cmp.set('v.pollingAssetIds', pollingAssetIds);
                } else {
                    if(errorMessages.length == 0) {
                        errorMessages = [$A.get("$Label.c.EMS_Transaction_System_Error")];
                    }
                    processingErrorMessages = processingErrorMessages.concat(errorMessages);
                    cmp.set("v.processingErrorMessages", processingErrorMessages);
                }
                for(var i = 0; i < assetIds.length; i++) {
                    var index = processingAssetIds.indexOf(assetIds[i]);
                    if (index > -1) {
                        processingAssetIds.splice(index,1);
                    }
                }
                if(processingAssetIds.length == 0) {
                    var pollingAssetIds = cmp.get('v.pollingAssetIds');
                    if(pollingAssetIds.length > 0) {
                        cmp.set('v.transactionPollingTime', 0);
                        //will wait for polling interval to query transactions if atleast one transaction is async
                        if(cmp.get('v.isTransactionAsync')) {
                            this.checkTransactionStatusAfterWaiting(cmp);
                        } else {
                            this.checkTransactionStatusAfterWaiting(cmp, 0);
                        }
                    } else {
                        if(processingErrorMessages.length > 0) {
                            let messageSet = new Set();
                            var errorMessages = [];
                            for(var i = 0; i < processingErrorMessages.length; i++) {
                                if(!messageSet.has(processingErrorMessages[i])) {
                                    messageSet.add(processingErrorMessages[i]);
                                    errorMessages.push(processingErrorMessages[i]);
                                }
                            }
                            this.setErrors(cmp, errorMessages);
                        }
                        this.hideSpinner(cmp);
                    }
                } else {
                    this.submitMoveTransaction(cmp);
                }
            } else if (state === "INCOMPLETE") {
                this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
                this.hideSpinner(cmp);
            } else if (state === "ERROR") {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        this.setErrors(cmp, [errors[0].message]);
                        this.hideSpinner(cmp);
                    }
                } else {
                    this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
                    this.hideSpinner(cmp);
                }
            } 
        });
        var processingAssetIds = cmp.get("v.processingAssetIds");
        var assetIds = [];
        var assetSerialNumbers = [];
        var contractId = '';
        var txAssetMap = cmp.get("v.txAssetMap");
        for(var i = 0; i < processingAssetIds.length; i++) {
            if(contractId == '') {
                contractId = txAssetMap[processingAssetIds[i]].newContractId;
            }
            if(contractId == txAssetMap[processingAssetIds[i]].newContractId) {
                assetIds.push(processingAssetIds[i]);
                assetSerialNumbers.push(txAssetMap[processingAssetIds[i]].serialNumberSubscriptionId);
            }
        }
        console.log(contractId);
        console.log(assetIds);
        action.setParams({ 
            "contractId" : contractId,
            "assetIds" : assetIds,
            "notes" : cmp.get("v.notes"),
            "transactionPageLoadTime" : cmp.get('v.transactionPageLoadTime')
        });
        this.showSpinner(cmp, 'Transferring Assets - ' + assetSerialNumbers);
        $A.enqueueAction(action); 
    },
    checkSCChangeEligibility : function(cmp) {
        this.setErrors(cmp, []);
        cmp.set('v.isSubmitValid', false);
        var txAssets = cmp.get('v.txAssets');
        var allRequiredFieldsPopulated = true;
        for(var i = 0; i < txAssets.length; i++) {
            if(document.getElementById(txAssets[i].Id + '_newSCName') == null || document.getElementById(txAssets[i].Id + '_newSCName').value == '') {
                allRequiredFieldsPopulated = false;
            }
        }
        cmp.set('v.allRequiredFieldsPopulated', allRequiredFieldsPopulated);
        var scChangeLineItemLimit = cmp.get('v.scChangeLineItemLimit');
        if(scChangeLineItemLimit > -1 && txAssets.length > scChangeLineItemLimit) {
            this.setErrors(cmp, [$A.get("$Label.c.Transaction_Line_Item_Limit_Warning").replace("<limit>", scChangeLineItemLimit)]);
        } else {
            var action = cmp.get('c.checkSCChangeEligibility');
            action.setCallback(this, function(actionResult) { 
                var state = actionResult.getState();
                if (state === "SUCCESS") {
                    var response = actionResult.getReturnValue();
                    console.log(response);
                    var isValid = response.isValid;
                    var errorMessages = response.errorMessages;
                    if(!isValid) {
                        this.setErrors(cmp, errorMessages);
                    } else {
                        cmp.set('v.isSubmitValid', true);
                    }
                } else if (state === "INCOMPLETE") {
                    this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
                } else if (state === "ERROR") {
                    var errors = response.getError();
                    if (errors) {
                        if (errors[0] && errors[0].message) {
                            this.setErrors(cmp, [errors[0].message]);
                        }
                    } else {
                        this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
                    }
                }
                this.hideSpinner(cmp);
            });
            var assetcontactMap = {};
            var temp = cmp.get("v.txAssets");
            for(var i = 0; i < temp.length; i++) {
                if(typeof temp[i].newSCId !== 'undefined') {
                    assetcontactMap[temp[i].Id] = temp[i].newSCId;
                } else {
                    assetcontactMap[temp[i].Id] = null;
                }
            }
            console.log(assetcontactMap);
            action.setParams({ 
                "assetcontactMap" : assetcontactMap
            });
            this.showSpinner(cmp, 'Validating...');
            $A.enqueueAction(action);
        } 
    },
    submitSCChange: function(cmp) {
        this.setErrors(cmp, []);
        var action = cmp.get('c.performSCChange');
        action.setCallback(this, function(actionResult) { 
            var state = actionResult.getState();
            if (state === "SUCCESS") {
                var response = actionResult.getReturnValue();
                console.log(response);
                var errorMessages = response.errorMessages;
                if(response.transactionStatus == 'Success' && response.tx != null) {
                    var temp = cmp.get("v.txAssets");
                    var selectedRowIds = cmp.get('v.rowIdsSelected');
                    for(var i = 0; i < temp.length; i++) {
                        var index = selectedRowIds.indexOf(temp[i].Id);
                        if (index > -1) {
                            selectedRowIds.splice(index, 1);
                        }
                    }
                    cmp.set("v.txAssets", []);
                    this.showMessage(cmp, $A.get("$Label.c.Asset_SC_Change_Successful_Message"), ['okButton1', 'contractLinkMessage'], 'transactionSuccessfulContent', [response.tx]);
                    cmp.set("v.notes", "");
                    this.hideSpinner(cmp);
                } else {
                    if(errorMessages.length == 0) {
                        errorMessages = [$A.get("$Label.c.EMS_Transaction_System_Error")];
                    }
                    this.setErrors(cmp, errorMessages, response.tx != null ? [response.tx] : null);
                    this.hideSpinner(cmp);
                } 
            } else if (state === "INCOMPLETE") {
                this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
                this.hideSpinner(cmp);
            } else if (state === "ERROR") {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        this.setErrors(cmp, [errors[0].message]);
                        this.hideSpinner(cmp);
                    }
                } else {
                    this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
                    this.hideSpinner(cmp);
                }
            }
        });
        var assetcontactMap = {};
        var temp = cmp.get("v.txAssets");
        for(var i = 0; i < temp.length; i++) {
            assetcontactMap[temp[i].Id] = temp[i].newSCId;
        }
        console.log(assetcontactMap);
        action.setParams({ 
            "assetcontactMap" : assetcontactMap,
            "notes" : cmp.get("v.notes"),
            "transactionPageLoadTime" : cmp.get('v.transactionPageLoadTime')
        });
        this.showSpinner(cmp, 'Processing...');
        $A.enqueueAction(action); 
    },
    checkResellerChangeEligibility : function(cmp) {
        this.setErrors(cmp, []);
        cmp.set('v.isSubmitValid', false);
        var txAssets = cmp.get('v.txAssets');
        var allRequiredFieldsPopulated = true;
        for(var i = 0; i < txAssets.length; i++) {
            if(document.getElementById(txAssets[i].Id + '_newResellerName') == null || document.getElementById(txAssets[i].Id + '_newResellerName').value == '') {
                allRequiredFieldsPopulated = false;
            }
        }
        cmp.set('v.allRequiredFieldsPopulated', allRequiredFieldsPopulated);
        var resellerChangeLineItemLimit = cmp.get('v.resellerChangeLineItemLimit');
        if(resellerChangeLineItemLimit > -1 && txAssets.length > resellerChangeLineItemLimit) {
            this.setErrors(cmp, [$A.get("$Label.c.Transaction_Line_Item_Limit_Warning").replace("<limit>", resellerChangeLineItemLimit)]);
        } else {
            var action = cmp.get('c.checkResellerChangeEligibility');
            action.setCallback(this, function(actionResult) { 
                var state = actionResult.getState();
                if (state === "SUCCESS") {
                    var response = actionResult.getReturnValue();
                    console.log(response);
                    var isValid = response.isValid;
                    var errorMessages = response.errorMessages;
                    if(!isValid) {
                        this.setErrors(cmp, errorMessages);
                    } else {
                        cmp.set('v.isSubmitValid', true);
                    }
                } else if (state === "INCOMPLETE") {
                    this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
                } else if (state === "ERROR") {
                    var errors = response.getError();
                    if (errors) {
                        if (errors[0] && errors[0].message) {
                            this.setErrors(cmp, [errors[0].message]);
                        }
                    } else {
                        this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
                    }
                }
                this.hideSpinner(cmp);
            });
            var assetAccountMap = {};
            var temp = cmp.get("v.txAssets");
            for(var i = 0; i < temp.length; i++) {
                if(typeof temp[i].newResellerId !== 'undefined') {
                    assetAccountMap[temp[i].Id] = temp[i].newResellerId;
                } else {
                    assetAccountMap[temp[i].Id] = null;
                }
            }
            console.log(assetAccountMap);
            action.setParams({ 
                "assetAccountMap" : assetAccountMap
            });
            this.showSpinner(cmp, 'Validating...');
            $A.enqueueAction(action);
        } 
    },
    submitResellerChange: function(cmp) {
        this.setErrors(cmp, []);
        var action = cmp.get('c.performResellerChange');
        action.setCallback(this, function(actionResult) { 
            var state = actionResult.getState();
            if (state === "SUCCESS") {
                var response = actionResult.getReturnValue();
                console.log(response);
                var errorMessages = response.errorMessages;
                if(response.transactionStatus == 'Success' && response.tx != null) {
                    var temp = cmp.get("v.txAssets");
                    var selectedRowIds = cmp.get('v.rowIdsSelected');
                    for(var i = 0; i < temp.length; i++) {
                        var index = selectedRowIds.indexOf(temp[i].Id);
                        if (index > -1) {
                            selectedRowIds.splice(index, 1);
                        }
                    }
                    cmp.set("v.txAssets", []);
                    this.showMessage(cmp, $A.get("$Label.c.Asset_Reseller_Change_Successful_Message"), ['okButton1', 'contractLinkMessage'], 'transactionSuccessfulContent', [response.tx]);
                    cmp.set("v.notes", "");
                    this.hideSpinner(cmp);
                } else {
                    if(errorMessages.length == 0) {
                        errorMessages = [$A.get("$Label.c.EMS_Transaction_System_Error")];
                    }
                    this.setErrors(cmp, errorMessages, response.tx != null ? [response.tx] : null);
                    this.hideSpinner(cmp);
                } 
            } else if (state === "INCOMPLETE") {
                this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
                this.hideSpinner(cmp);
            } else if (state === "ERROR") {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        this.setErrors(cmp, [errors[0].message]);
                        this.hideSpinner(cmp);
                    }
                } else {
                    this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
                    this.hideSpinner(cmp);
                }
            }
        });
        var assetAccountMap = {};
        var temp = cmp.get("v.txAssets");
        for(var i = 0; i < temp.length; i++) {
            assetAccountMap[temp[i].Id] = temp[i].newResellerId;
        }
        console.log(assetAccountMap);
        action.setParams({ 
            "assetAccountMap" : assetAccountMap,
            "notes" : cmp.get("v.notes"),
            "transactionPageLoadTime" : cmp.get('v.transactionPageLoadTime')
        });
        this.showSpinner(cmp, 'Processing...');
        $A.enqueueAction(action); 
    },
    checkSoldToChangeEligibility : function(cmp) {
        console.log('Inside checkSoldToChangeEligibility');
        this.setErrors(cmp, []);
        cmp.set('v.isSubmitValid', false);
        var txAssets = cmp.get('v.txAssets');
        var allRequiredFieldsPopulated = true;
        for(var i = 0; i < txAssets.length; i++) {
            if(document.getElementById(txAssets[i].Id + '_newSoldToName') == null || document.getElementById(txAssets[i].Id + '_newSoldToName').value == '') {
                allRequiredFieldsPopulated = false;
            }
        }
        cmp.set('v.allRequiredFieldsPopulated', allRequiredFieldsPopulated);
        var soldToChangeLineItemLimiit = cmp.get('v.soldToChangeLineItemLimiit');
        if(soldToChangeLineItemLimiit > -1 && txAssets.length > soldToChangeLineItemLimiit) {
            this.setErrors(cmp, [$A.get("$Label.c.Transaction_Line_Item_Limit_Warning").replace("<limit>", soldToChangeLineItemLimiit)]);
        } else {
            
            var action = cmp.get('c.checkSoldToChangeEligibility');
            action.setCallback(this, function(actionResult) { 
                var state = actionResult.getState();
                if (state === "SUCCESS") {
                    var response = actionResult.getReturnValue();
                    console.log(response);
                    var isValid = response.isValid;
                    console.log(isValid);
                    var errorMessages = response.errorMessages;
                    if(!isValid) {
                        this.setErrors(cmp, errorMessages);
                    } else {
                        cmp.set('v.isSubmitValid', true);
                    }
                } else if (state === "INCOMPLETE") {
                    this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
                } else if (state === "ERROR") {
                    var errors = response.getError();
                    if (errors) {
                        if (errors[0] && errors[0].message) {
                            this.setErrors(cmp, [errors[0].message]);
                        }
                    } else {
                        this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
                    }
                }
                this.hideSpinner(cmp);
            });
            var assetAccountMap = {};
            var temp = cmp.get("v.txAssets");
            console.log(temp);
            for(var i = 0; i < temp.length; i++) {
                if(typeof temp[i].newSoldToId !== 'undefined') {
                    assetAccountMap[temp[i].Id] = temp[i].newSoldToId;
                } else {
                    assetAccountMap[temp[i].Id] = null;
                }
            }
            console.log('assetAccountMap');
            console.log(assetAccountMap);
            action.setParams({ 
                "assetAccountMap" : assetAccountMap
            });
            this.showSpinner(cmp, 'Validating...');
            $A.enqueueAction(action);
        } 
    },
    submitSoldToChange: function(cmp) {
        this.setErrors(cmp, []);
        //var action = cmp.get('c.performResellerChange');
        var action = cmp.get('c.performSoldToChange');
        action.setCallback(this, function(actionResult) { 
            var state = actionResult.getState();
            console.log('state>>>>' +state);
            if (state === "SUCCESS") {
                var response = actionResult.getReturnValue();
                console.log(response);
                var errorMessages = response.errorMessages;
                if(response.transactionStatus == 'Success' && response.tx != null) {
                    var temp = cmp.get("v.txAssets");
                    var selectedRowIds = cmp.get('v.rowIdsSelected');
                    for(var i = 0; i < temp.length; i++) {
                        var index = selectedRowIds.indexOf(temp[i].Id);
                        if (index > -1) {
                            selectedRowIds.splice(index, 1);
                        }
                    }
                    cmp.set("v.txAssets", []);
                    this.showMessage(cmp, $A.get("$Label.c.Asset_SoldTo_Change_Successful_Message"), ['okButton1', 'contractLinkMessage'], 'transactionSuccessfulContent', [response.tx]);
                    cmp.set("v.notes", "");
                    this.hideSpinner(cmp);
                } else {
                    if(errorMessages.length == 0) {
                        errorMessages = [$A.get("$Label.c.EMS_Transaction_System_Error")];
                    }
                    this.setErrors(cmp, errorMessages, response.tx != null ? [response.tx] : null);
                    this.hideSpinner(cmp);
                } 
            } else if (state === "INCOMPLETE") {
                this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
                this.hideSpinner(cmp);
            } else if (state === "ERROR") {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        this.setErrors(cmp, [errors[0].message]);
                        this.hideSpinner(cmp);
                    }
                } else {
                    this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
                    this.hideSpinner(cmp);
                }
            }
        });
        var assetAccountMap = {};
        var temp = cmp.get("v.txAssets");
        console.log('temp>>>>>');
        console.log(temp);
        for(var i = 0; i < temp.length; i++) {
            assetAccountMap[temp[i].Id] = temp[i].newSoldToId;
        }
        console.log(assetAccountMap);
        action.setParams({ 
            "assetAccountMap" : assetAccountMap,
            "notes" : cmp.get("v.notes"),
            "transactionPageLoadTime" : cmp.get('v.transactionPageLoadTime')
        });
        this.showSpinner(cmp, 'Processing...');
        $A.enqueueAction(action); 
    },
    checkIfAssetsAreModified : function(cmp, transaction) {
        this.setErrors(cmp, []);
        var action = cmp.get('c.checkIfAssetsAreModified');
        action.setCallback(this, function(actionResult) { 
            var state = actionResult.getState();
            if (state === "SUCCESS") {
                var response = actionResult.getReturnValue();
                console.log(response);
                var isValid = response.isValid;
                var errorMessages = response.errorMessages;
                if(!isValid) {
                    this.setErrors(cmp, errorMessages);
                    this.hideSpinner(cmp);
                } else {
                    if(transaction == 'Split') {
						console.log('checkIfAssetsAreModified????');
                        this.submitSplitTransaction(cmp);
                    } else if(transaction == 'Move') {
                        this.submitMoveTransaction(cmp);
                    }
                }
            } else if (state === "INCOMPLETE") {
                this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
            } else if (state === "ERROR") {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        this.setErrors(cmp, [errors[0].message]);
                    }
                } else {
                    this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
                }
            }
        });
        console.log(cmp.get("v.processingAssetIds"));
        action.setParams({ 
            "assetIds" : cmp.get("v.processingAssetIds"),
            "transactionPageLoadTime" : cmp.get('v.transactionPageLoadTime')
        });
        this.showSpinner(cmp, 'Processing...');
        $A.enqueueAction(action); 
    },
    checkTransactionStatusAfterWaiting: function(cmp, timeout) {
        this.showSpinner(cmp, 'Waiting for the transaction to complete');
        var helperReference = this;
        var pollingInterval = cmp.get('v.transactionPollingInterval');
        if(typeof timeout == 'undefined') {
            timeout = pollingInterval;
        }
        setTimeout(
            $A.getCallback(function() {
                var transactionPollingTime = cmp.get('v.transactionPollingTime');
                transactionPollingTime += pollingInterval;
                cmp.set('v.transactionPollingTime', transactionPollingTime);
                helperReference.checkTransactionStatus(cmp);
            }), timeout
        );    
    },
    checkTransactionStatus: function(cmp) {
        var action = cmp.get('c.getTransactions');
        action.setCallback(this, function(actionResult) {    
            var state = actionResult.getState();
            if (state === "SUCCESS") { 
                var transactions = actionResult.getReturnValue();
                console.log(transactions);
                var isComplete = true;
                var hasError = false;
                var successfulTransactionAssetIds = [];
                var failedTransactions = [];
                var successfulTransactions = [];
                var pollingAssetIdTransactionIdMap = cmp.get('v.pollingAssetIdTransactionIdMap');
                var pollingAssetIds = cmp.get('v.pollingAssetIds');
                for(var i = 0; i < transactions.length; i++) {
                    if(transactions[i].Status__c == 'Pending') {
                        isComplete = false;
                    } else if(transactions[i].Status__c == 'Failed'
                             || transactions[i].Status__c == 'Partial Success') {
                        failedTransactions.push(transactions[i]);
                    } else if(transactions[i].Status__c == 'Success') {
                        successfulTransactions.push(transactions[i]);
                        for(var j = 0; j < pollingAssetIds.length; j++) {
                            if(pollingAssetIdTransactionIdMap[pollingAssetIds[j]] == transactions[i].Id) {
                                successfulTransactionAssetIds.push(pollingAssetIds[j]);
                            }
                        }    
                    }
                }
                if(successfulTransactionAssetIds.length > 0) {
                    var selectedRowIds = cmp.get('v.rowIdsSelected');
                    var index;
                    for(var i = 0; i < successfulTransactionAssetIds.length; i++) {
                        index = selectedRowIds.indexOf(successfulTransactionAssetIds[i]);
                        if (index > -1) {
                            selectedRowIds.splice(index, 1);
                        }
                        this.setTxAssets(cmp, 'Update', cmp.get('v.action'));
                    }
                }
                var processingErrorMessages = cmp.get("v.processingErrorMessages");
                var processingErrors = [];
                if(processingErrorMessages.length > 0) {
                    let messageSet = new Set();
                    for(var i = 0; i < processingErrorMessages.length; i++) {
                        if(!messageSet.has(processingErrorMessages[i])) {
                            messageSet.add(processingErrorMessages[i]);
                            processingErrors.push(processingErrorMessages[i]);
                        }
                    }
                }
                if(isComplete) {
                    if(failedTransactions.length > 0 || processingErrors.length > 0) {
                        var errorMessages = [];
                        if(processingErrors.length > 0) {
                            for(var i = 0; i < processingErrors.length; i++) {
                                errorMessages.push(processingErrors[i]);
                            }
                        }
                        if(failedTransactions.length > 0) {
                            var serialNumbers = '';
                            var txAssetMap = cmp.get('v.txAssetMap');
                            for(var i = 0; i < failedTransactions.length; i++) {
                                for(var j = 0; j < pollingAssetIds.length; j++) {
                                    if(pollingAssetIdTransactionIdMap[pollingAssetIds[j]] == transactions[i].Id) {
                                        serialNumbers += txAssetMap[pollingAssetIds[j]].serialNumberSubscriptionId + ', ';
                                    }
                                }
                            }
                            serialNumbers = serialNumbers.substring(0, serialNumbers.length - 2);
                            errorMessages.push(serialNumbers + ' - ' + $A.get("$Label.c.EMS_Transaction_System_Error"));
                        }
                        this.setErrors(cmp, errorMessages, failedTransactions);
                        this.hideSpinner(cmp);
                    } else {
                        this.showMessage(cmp, $A.get("$Label.c.Asset_Move_Successful_Message"), ['okButton1', 'contractLinkMessage'], 'transactionSuccessfulContent', successfulTransactions);
                        cmp.set("v.notes", "");
                        this.hideSpinner(cmp);
                    }
                } else {
                    if(cmp.get('v.transactionPollingTime') >= cmp.get('v.transactionPollingTimeLimit')) {
                        this.showMessage(cmp, $A.get("$Label.c.Transaction_Taking_Longer_Message"), ['yesButton', 'noButton'], 'transactionTakingLongContent', transactions);
                        this.hideSpinner(cmp);
                    } else {
                        this.checkTransactionStatusAfterWaiting(cmp);
                    }
                }
            } else if (state === "INCOMPLETE") {
                this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
                this.hideSpinner(cmp);
            } else if (state === "ERROR") {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        this.setErrors(cmp, [errors[0].message]);
                    }
                } else {
                    this.setErrors(cmp, [$A.get("$Label.c.Transaction_System_Error")]);
                }
                this.hideSpinner(cmp);
            }
        });
        var pollingAssetIdTransactionIdMap = cmp.get('v.pollingAssetIdTransactionIdMap');
        var pollingAssetIds = cmp.get('v.pollingAssetIds');
        var transactionIds = [];
        for(var i = 0; i < pollingAssetIds.length; i++) {
            transactionIds.push(pollingAssetIdTransactionIdMap[pollingAssetIds[i]]);
        }
        console.log(transactionIds);
        action.setParams({ 
            "transactionIds" : transactionIds
        });
        this.showSpinner(cmp, $A.get("$Label.c.Transaction_Message_While_Polling"));
        $A.enqueueAction(action);   
    },
    redirect : function(cmp, url, newTab) {
        if(cmp.get("v.isInConsole") == true) {
            console.log('inside getEnclosingPrimaryTabId');
            sforce.console.getEnclosingPrimaryTabId(function(result) {
                if(newTab == true) {
                    sforce.console.openSubtab(result.id , url, true);
                } else {
                    console.log('url: ', url);
                    console.log('result.id: ', result.id);
                    sforce.console.openPrimaryTab(null, url , true);
                }
            });  
        } else if(typeof sforce !== 'undefined' && typeof sforce.one !== 'undefined') {
            console.log('inside sales app');
            sforce.one.navigateToURL (url);
        } else {
            var urlEvent = $A.get("e.force:navigateToURL");
            if(urlEvent != null) {
                urlEvent.setParams({
                    "url": url
                });
                urlEvent.fire();
            } else {
                if(newTab == true) {
                    window.open(url, '_blank');
                } else {
                    window.open(url, '_top');
                }
            }
        }
    },
    showMessage : function(cmp, message, modalElementsToBeShown, modalContentClass, transactions) {
        cmp.set('v.modalMessage', message);
        cmp.set('v.modalContentClass', modalContentClass);
        if(typeof transactions == 'undefined') {
            transactions = []; 
        }
        cmp.set('v.transactions', transactions);
        var modalElements = document.getElementsByClassName('modalElement');
        var index;
        for(var i = 0; i < modalElements.length; i++) {
            index = modalElementsToBeShown.indexOf(modalElements[i].id);
            if (index > -1) {
                document.getElementById(modalElements[i].id).classList.remove('hide');
            } else {
                document.getElementById(modalElements[i].id).classList.add('hide');
            }
        }
        document.getElementById('messageModalId').classList.remove('hide');
    },
    showSpinner : function(cmp, msg) {
        cmp.set("v.spinnerMessage", msg);
        $A.util.removeClass(cmp.find('spinner'), 'hide');
    },
    hideSpinner : function(cmp) {
        cmp.set("v.spinnerMessage", '');
        $A.util.addClass(cmp.find('spinner'), 'hide');
    },
    setErrors : function(cmp, errors, transactions) {
        if(typeof transactions == 'undefined') {
            transactions = []; 
        } else if(transactions != null && transactions.length > 0) {
            errors.push($A.get("$Label.c.Transaction_Links_Message"));
        }
        cmp.set('v.errorMessages', errors);
        cmp.set('v.transactions', transactions);
    },
    destroyLookupModals : function(cmp) {
        if(cmp.find('contractLookup') != null) {
            cmp.find('contractLookup').destroy();
        }
        if(cmp.find('contactLookup') != null) {
            cmp.find('contactLookup').destroy();
        }
        if(cmp.find('resellerAccountLookup') != null) {
            cmp.find('resellerAccountLookup').destroy();
        }
        if(cmp.find('soldToAccountLookup') !=null) {
            cmp.find('soldToAccountLookup').destroy();
        }
    }
})