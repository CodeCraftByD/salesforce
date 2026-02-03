(


    {

        formFactor: function (component, event, helper) {

            var device = $A.get("$Browser.formFactor");


            if (device === 'PHONE') {
                var mobile = component.get("c.doInit");
                if(mobile){
                   $A.enqueueAction(mobile);
                }
            }

            else if (device === 'DESKTOP'){
                 var desktop = component.get("c.myAction");
                 if(desktop){
                     $A.enqueueAction(desktop);
                 }
            }
            
        },

        
        myAction: function (component, event, helper) {

            var recordId = component.get('v.recordId');
            var host = window.location.host;
            var userAgent = navigator.userAgent.toLowerCase();
            var vfDomain;

            // Resolve VF domain
            if (host.includes('.sandbox')) {
                vfDomain = host.replace(
                    '.sandbox.lightning.force.com',
                    '-c.sandbox.vf.force.com'
                );
            } else {
                vfDomain = host.replace(
                    '.lightning.force.com',
                    '-c.vf.force.com'
                );
            }

            var vfPageURL =
                'https://' + vfDomain + '/apex/NGSalesPDF?id=' + recordId;

            //  Android handling
            if (userAgent.indexOf('android') > -1) {

                component.set('v.showIframe', false);
                window.open(vfPageURL, '_blank');
                $A.get("e.force:closeQuickAction").fire();

            } else {
                // Desktop + iOS
                component.set('v.showIframe', true);
                component.set('v.vfPageURL', vfPageURL);
            }
        },

        handleSavePDFClick: function (component, event, helper) {

            var action = component.get("c.savePDFToAttachment");

            action.setParams({
                recordId: component.get('v.recordId')
            });

            action.setCallback(this, function (response) {

                var state = response.getState();

                if (state === "SUCCESS") {

                    var contentDocumentId = response.getReturnValue();

                    if (contentDocumentId) {

                        //UNIVERSAL (Desktop + Android + iOS)
                        window.open(
                            '/lightning/r/ContentDocument/' +
                            contentDocumentId +
                            '/view',
                            '_blank'
                        );

                        helper.showToast(
                            component,
                            event,
                            helper,
                            'success',
                            'Success',
                            'Lead PDF generated successfully'
                        );

                    } else {
                        helper.showToast(
                            component,
                            event,
                            helper,
                            'error',
                            'Failed',
                            'PDF generation failed'
                        );
                    }

                    $A.get("e.force:closeQuickAction").fire();

                } else {
                    helper.showToast(
                        component,
                        event,
                        helper,
                        'error',
                        'Failed',
                        'Error while generating PDF'
                    );
                }
            });

            $A.enqueueAction(action);
        },

        handleCancel: function (component, event, helper) {
            $A.get("e.force:closeQuickAction").fire();
        },



        doInit: function (component, event, helper) {


            console.log('PrintLeadPDF initialized');
            console.log('Record ID: ' + component.get("v.recordId"));

            var recordId = component.get("v.recordId");

            if (!recordId) {
                helper.showError('No record ID found');
                helper.closeQuickAction();
                return;
            }

            // Get PDF Format
            var action = component.get("c.getQuotePDFFormat");
            action.setParams({
                recordId: recordId
            });

            action.setCallback(this, function (response) {
                var state = response.getState();
                console.log('getQuotePDFFormat state: ' + state);

                if (state === "SUCCESS") {
                    var pdfFormat = response.getReturnValue();
                    console.log('PDF Format: ' + pdfFormat);
                    helper.generatePDF(component, recordId, pdfFormat);
                } else {
                    var errors = response.getError();
                    var message = 'error';
                    if (errors && errors[0] && errors[0].message) {
                        message = errors[0].message;
                    }
                    console.error('Error: ' + message);
                    helper.showError('Error: ' + message);
                    helper.closeQuickAction();
                }
            });

            $A.enqueueAction(action);
        }
    })
