(
 
    {
    showToast : function(component, event, helper, type, title, message) {
        var toastEvent = $A.get("e.force:showToast");
        toastEvent.setParams({
            type : type,
            title : title,
            message : message
        });
        toastEvent.fire();
    }
    ,

    generatePDF: function(component, recordId, pdfFormat) {
        console.log('Generating PDF for record: ' + recordId + ' with format: ' + pdfFormat);
        
        var vfPageUrl = this.buildVFPageUrl(recordId, pdfFormat);
        console.log('VF Page URL: ' + vfPageUrl);
        
        var action = component.get("c.generateAndSavePDF");
        action.setParams({
            recordId: recordId,
            vfPageUrl: vfPageUrl,
            fileNameScheme: '{Name}',
            isVersioningEnabled: true
        });
        
        action.setCallback(this, function(response) {
            var state = response.getState();
            console.log('generateAndSavePDF state: ' + state);
            
            if (state === "SUCCESS") {
                var contentDocumentId = response.getReturnValue();
                console.log('Content Document ID: ' + contentDocumentId);
                
                if (contentDocumentId) {
                    this.downloadFile(contentDocumentId);
                    this.navigateToFile(contentDocumentId);
                    this.showSuccess('PDF generated successfully');
                } else {
                    console.error('No ContentDocument ID returned');
                    this.showError('PDF generated but could not retrieve file ID');
                }
            } else {
                var errors = response.getError();
                var message = 'Unknown error';
                if (errors && errors[0] && errors[0].message) {
                    message = errors[0].message;
                }
                console.error('Error generating PDF: ' + message);
                this.showError('Error generating PDF: ' + message);
            }
            
            this.closeQuickAction();
        });
        
        $A.enqueueAction(action);
    },
    
    buildVFPageUrl: function(recordId, pdfFormat) {
        var vfPageName;
        
        vfPageName = 'NGSalesPDF';
         // use ?id= instead of ?recordId= new change
        return '/apex/' + vfPageName + '?id=' + recordId + '#view=FitH';
    },
    
    navigateToFile: function(contentDocumentId) {
        console.log('Navigating to file: ' + contentDocumentId);
        
        var navEvt = $A.get("e.force:navigateToSObject");
        navEvt.setParams({
            "recordId": contentDocumentId
        });
        navEvt.fire();
    },
        
    downloadFile: function(contentDocumentId) {
        console.log('Download file Id: ' + contentDocumentId);
        var action = component.get("c.getDownloadUrl");
        action.setParams({
            contentDocumentId: contentDocumentId
        });
        action.setCallback(this, function(response) {
            var state = response.getState();
             console.log('Download state: ' + state);
            console.log('Download response: ' + response.getReturnValue());
            if (state === "SUCCESS") {
                var url = response.getReturnValue(); // URL to the file
                var link = component.find("downloadLink").getElement();
                link.href = url;
                link.download = 'filename.pdf'; // Suggested file name
                link.click(); // Triggers the download
            }
        });
        $A.enqueueAction(action);
    },
    
    showSuccess: function(message) {
        var toastEvent = $A.get("e.force:showToast");
        toastEvent.setParams({
            "title": "Success",
            "message": message,
            "type": "success",
            "duration": 500
        });
        toastEvent.fire();
    },
    
    showError: function(message) {
        var toastEvent = $A.get("e.force:showToast");
        toastEvent.setParams({
            "title": "Error",
            "message": message,
            "type": "error",
            "mode": "sticky"
        });
        toastEvent.fire();
    },
    
    closeQuickAction: function() {
        $A.get("e.force:closeQuickAction").fire();
    }
}
 )
