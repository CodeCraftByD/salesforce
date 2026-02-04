({
    constants : {
        EVENT_FLOW_NAME: 'Training_Event_Screen',
        STATUS_FINISHED: 'FINISHED',
        TRAINING_EVENT_OBJECT_API_NAME: 'Training_Event__c',
        TRAINING_EVENT_RECORDTYPE_DEVELOPER_NAME: 'Training',
        CREATED_EVENT_ID: 'Created_Event_Id',
        EVENT_STATUS_PENDING: 'Pending',
        EVENT_STATUS_APPROVED: 'Approved',
        NOT_VALID_USER_TO_EDIT: 'You are not authorized to edit this Event',
        NOT_VALID_USER_TO_CREATE: 'You are not authorized to create a new Event',
        ERROR_TEXT: 'Error!',
        ERROR_TOAST_TYPE: 'error',
        UNEXPECTED_ERROR_MESSAGE: 'An unexpected error occurred'
    },
    
    getCurrentRecord: function(component, event, helper, recordId) {
        let action = component.get("c.getRecord");
        action.setParams({
            recordId: recordId
        });
        action.setCallback(this, function(response) {
            if (response.getState() === "SUCCESS") {
                let returnValue = response.getReturnValue();
                if(returnValue && returnValue.RecordType && returnValue.RecordType.DeveloperName == helper.constants.TRAINING_EVENT_RECORDTYPE_DEVELOPER_NAME) {
                    helper.validateEvent(component, event, helper, recordId, returnValue);
                } else {
                    helper.loadNativeEditForm(component, event, helper, recordId);
                }
            }
        });
        $A.enqueueAction(action);
    },
    
    getTrainingRecordType: function(component, event, helper, recordId, recordTypeId) {
        let action = component.get("c.getRecordTypeId");
        action.setParams({
            sObjectName: helper.constants.TRAINING_EVENT_OBJECT_API_NAME,
            recordTypeDeveloperName: helper.constants.TRAINING_EVENT_RECORDTYPE_DEVELOPER_NAME
        });
        action.setCallback(this, function(response) {
            if (response.getState() === "SUCCESS") {
                let returnValue = response.getReturnValue();
                if(recordTypeId) {
                    if(returnValue && returnValue == recordTypeId) {
                        helper.validateBeforeNewTrainingEvent(component, event, helper, recordId);
                    } else {
                        helper.loadNativeCreateForm(component, event, helper, recordTypeId);
                    }
                } else {
                    helper.getDefaultRecordType(component, event, helper, recordId, returnValue);
                }
            }
        });
        $A.enqueueAction(action);
    },

    getDefaultRecordType: function(component, event, helper, recordId, recordTypeId) {
        let action = component.get("c.getAvailableRecordTypeNamesForSObject");
        action.setParams({
            objectAPIName: helper.constants.TRAINING_EVENT_OBJECT_API_NAME
        });
        action.setCallback(this, function(response) {
            if (response.getState() === "SUCCESS") {
                let returnValue = response.getReturnValue();
                if(returnValue && returnValue.length > 0 && returnValue[0] == recordTypeId) {
                    helper.validateBeforeNewTrainingEvent(component, event, helper, recordId);
                } else {
                    helper.loadNativeCreateForm(component, event, helper, recordTypeId);
                }
            }
        });
        $A.enqueueAction(action);
    },

    validateBeforeNewTrainingEvent: function(component, event, helper, recordId, eventObject) {
        let action = component.get("c.validateEventCreatable");
        action.setCallback(this, function(response) {
            if (response.getState() === "SUCCESS") {
                let returnValue = response.getReturnValue();
                if(returnValue == true) {
                    helper.loadTrainingFlow(component, event, helper, recordId);
                } else {
                    helper.showToast(helper.constants.ERROR_TEXT, helper.constants.NOT_VALID_USER_TO_CREATE,
                        helper.constants.ERROR_TOAST_TYPE);
                    helper.closeTab(component, event, helper);
                }
            }
        });
        $A.enqueueAction(action);
    },

    validateEvent: function(component, event, helper, recordId, eventObject) {
        let eventStatusSet = [helper.constants.EVENT_STATUS_PENDING, helper.constants.EVENT_STATUS_APPROVED];
        if(eventStatusSet.includes(eventObject.Status__c)) {
            let action = component.get("c.validateEventEditable");
            action.setParams({
                recordId: recordId,
                status: eventObject.Status__c
            });
            action.setCallback(this, function(response) {
                if (response.getState() === "SUCCESS") {
                    let returnValue = response.getReturnValue();
                    if(returnValue == true) {
                        helper.loadTrainingFlow(component, event, helper, recordId);
                    } else {
                        helper.showToast(helper.constants.ERROR_TEXT, helper.constants.NOT_VALID_USER_TO_EDIT,
                            helper.constants.ERROR_TOAST_TYPE);
                        helper.closeTab(component, event, helper);
                    }
                }
            });
            $A.enqueueAction(action);
        } else {
            helper.loadTrainingFlow(component, event, helper, recordId);
        }
    },
    
    loadTrainingFlow: function(component, event, helper, recordId) {
        let flow = component.find("flowData");
        let inputVariables = [
            {name : "recordId", type : "String", value: recordId}
        ];
        flow.startFlow(helper.constants.EVENT_FLOW_NAME, inputVariables);
    },
    
    loadNativeCreateForm: function(component, event, helper, recordTypeId) {
        let navService = component.find("navService");
        let pageRef = {
            type: "standard__objectPage",
            attributes: {
                objectApiName: helper.constants.TRAINING_EVENT_OBJECT_API_NAME,
                actionName: "new"
            },
            state: {
                nooverride : "1"
            }
        };
		navService.navigate(pageRef);
    },
    
    loadNativeEditForm: function(component, event, helper, recordId) {
        let navService = component.find("navService");
        let pageRef = {
            type: "standard__recordPage",
            attributes: {
                recordId: recordId,
                objectApiName: helper.constants.TRAINING_EVENT_OBJECT_API_NAME,
                actionName: "edit"
            },
            state: {
                nooverride : "1"
            }
        };
        navService.navigate(pageRef);
    },

    closeTab: function(component, event, helper) {
        let workspaceAPI = component.find("workspace");
        workspaceAPI.getEnclosingTabId().then(function(tabId) {
            workspaceAPI.closeTab({tabId: tabId});
        }).catch(function(error) {
            helper.showToast(helper.constants.ERROR_TEXT, (error.message || helper.constants.UNEXPECTED_ERROR_MESSAGE), 
                helper.constants.ERROR_TOAST_TYPE);
        });
    },

    showToast: function(title, message, type) {
        let toastEvent = $A.get("e.force:showToast");
        toastEvent.setParams({
            "title": title,
            "message": message,
            "type": type
        });
        toastEvent.fire();
    }
});
