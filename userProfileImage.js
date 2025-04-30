import { LightningElement, api, wire, track } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

import USER_ID from '@salesforce/user/Id';
import SMALL_PHOTO_URL_FIELD from '@salesforce/schema/User.SmallPhotoUrl';
import NAME_FIELD from '@salesforce/schema/User.Name';

import uploadProfilePhoto from '@salesforce/apex/UserProfilePhotoController.uploadProfilePhoto';

export default class UserProfileImage extends LightningElement {
    userId = USER_ID;
    @api recordId;
    @track userPhotoUrl;
    userName;
    showEditModal = false;
    isLoading = false;
    userRecord;
    
    @wire(getRecord, { 
        recordId: "$recordId", 
        fields: [SMALL_PHOTO_URL_FIELD, NAME_FIELD] 
    })
    wiredUser(result) {
        this.userRecord = result;
        const { data, error } = result;
        if (data) {
            this.userPhotoUrl = data.fields.SmallPhotoUrl.value;
            this.userName = data.fields.Name.value;
        } else if (error) {
            console.error('Error loading user details', error);
            this.showToast('Error', 'Failed to load user details', 'error');
        }
    }

    get userInitials() {
        return this.userName ? this.userName.split(' ').map(name => name.charAt(0)).join('') : '';
    }

    get backgroundImageStyle() {
        return this.userPhotoUrl ? `background-image: url('${this.userPhotoUrl}')` : '';
    }

    get acceptedFormats() {
        return ['.jpg', '.jpeg', '.png'];
    }

    handleEditClick() {
        this.showEditModal = true;
    }

    handleCloseModal() {
        this.showEditModal = false;
    }

    handleImageUpload(event) {
        // Get the file from the event
        const fileData = event.detail.files[0];
        console.log('File received:', fileData);
        
        if (!fileData) {
            this.showToast('Error', 'No file selected', 'error');
            return;
        }
        
        this.isLoading = true;
        
        // Instead of trying to process the file client-side, send it directly to the server
        // Extract needed properties
        const fileName = fileData.name;
        const contentDocumentId = fileData.documentId;
        
        // Call the Apex method with the contentDocumentId instead of base64
        uploadProfilePhoto({ 
            contentDocumentId: contentDocumentId,
            fileName: fileName
        })
        .then(result => {
            if (result === 'Success') {
                this.showToast('Success', 'Profile photo updated successfully', 'success');
                
                // Refresh the component to show the new image
                refreshApex(this.userRecord);
                
                // Force refresh photo URLs since they may have cached versions
                const timestamp = new Date().getTime();
                this.userPhotoUrl = `${this.userPhotoUrl.split('?')[0]}?t=${timestamp}`;
            } else {
                throw new Error(result);
            }
        })
        .catch(error => {
            console.error('Error updating profile photo:', error);
            this.showToast('Error', error.message || 'Failed to update profile photo', 'error');
        })
        .finally(() => {
            this.isLoading = false;
            this.showEditModal = false;
        });
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant
            })
        );
    }
}