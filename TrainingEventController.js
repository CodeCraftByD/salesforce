({
    init : function (component, event, helper) {
        let recordId = component.get("v.recordId") ? component.get("v.recordId") : '';
        let recordTypeId = component.get("v.pageReference").state.recordTypeId;
        
        if(recordId) {
            helper.getCurrentRecord(component, event, helper, recordId);
        } else {
         	helper.getTrainingRecordType(component, event, helper, recordId, recordTypeId);
        }
    },

    statusChange: function (component, event, helper) {
        if (event.getParam('status') === helper.constants.STATUS_FINISHED) {
            helper.showToast('Success!', 'Record saved successfully', 'success');
            helper.closeTab(component, event, helper);
        }
    }
})
