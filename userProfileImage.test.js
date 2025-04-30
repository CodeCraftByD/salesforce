import { createElement } from '@lwc/engine-dom';
//import { createElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import UserProfileImage from 'c/userProfileImage';

// Mock the wire adapter
jest.mock('lightning/uiRecordApi', () => {
    return {
        getRecord: jest.fn()
    };
}, { virtual: true });

// Mock the Apex method - IMPORTANT: Must use mockResolvedValue/mockRejectedValue in the test
jest.mock('@salesforce/apex/UserProfilePhotoController.uploadProfilePhoto', () => {
    return {
        default: jest.fn()
    };
}, { virtual: true });

// Mock User ID
jest.mock('@salesforce/user/Id', () => {
    return { default: 'mock-user-id' };
}, { virtual: true });

// Mock schema fields
jest.mock('@salesforce/schema/User.SmallPhotoUrl', () => {
    return { default: 'SmallPhotoUrl' };
}, { virtual: true });

jest.mock('@salesforce/schema/User.Name', () => {
    return { default: 'Name' };
}, { virtual: true });

// Mock refreshApex
jest.mock('@salesforce/apex', () => {
    return { 
        refreshApex: jest.fn() 
    };
}, { virtual: true });

// Sample test data
const mockUserData = {
    data: {
        fields: {
            SmallPhotoUrl: { value: 'https://example.com/photo.jpg' },
            Name: { value: 'John Doe' }
        }
    }
};

const mockUserWithoutPhoto = {
    data: {
        fields: {
            SmallPhotoUrl: { value: null },
            Name: { value: 'John Doe' }
        }
    }
};

const mockUserError = {
    error: { message: 'Error loading user' }
};

describe('c-user-profile-image', () => {
    // Element under test
    let element;
    // Reference to the mocked Apex method
    let mockUploadProfilePhoto;
    // Reference to refreshApex
    let mockRefreshApex;

    // Create element before each test
    beforeEach(() => {
        // Import the mocks directly here, within the scope of beforeEach
        mockUploadProfilePhoto = require('@salesforce/apex/UserProfilePhotoController.uploadProfilePhoto').default;
        mockRefreshApex = require('@salesforce/apex').refreshApex;
        
        // Reset mocks
        mockUploadProfilePhoto.mockReset();
        mockRefreshApex.mockReset();
        
        // Create element
        element = createElement('c-user-profile-image', {
            is: UserProfileImage
        });
        
        // Set recordId for testing
        element.recordId = 'mock-user-id';
        
        // Set up spy for ShowToastEvent
        jest.spyOn(element, 'dispatchEvent');
        
        document.body.appendChild(element);
    });

    // Remove element after each test
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        
        // Restore spies
        jest.restoreAllMocks();
    });

    // Test 1: Component loads with user data and displays photo
    it('displays user photo when available', () => {
        // Act
        return Promise.resolve().then(() => {
            // Manually set properties to simulate wired data
            element.userPhotoUrl = 'https://example.com/photo.jpg';
            element.userName = 'John Doe';
            
            // Return a promise to wait for any asynchronous DOM updates
            return Promise.resolve();
        }).then(() => {
            // Assert
            // Since we can't directly query the DOM due to shadow DOM issues in jest,
            // we'll test component properties instead
            expect(element.userPhotoUrl).toBe('https://example.com/photo.jpg');
            expect(element.userInitials).toBe('JD');
            expect(element.backgroundImageStyle).toBe("background-image: url('https://example.com/photo.jpg')");
        });
    });

    // Test 2: Component displays initials when no photo is available
    it('displays user initials when no photo is available', () => {
        // Act
        return Promise.resolve().then(() => {
            // Manually set properties to simulate wired data
            element.userPhotoUrl = null;
            element.userName = 'John Doe';
            
            // Return a promise to wait for any asynchronous DOM updates
            return Promise.resolve();
        }).then(() => {
            // Assert
            expect(element.userPhotoUrl).toBeNull();
            expect(element.userInitials).toBe('JD');
            expect(element.backgroundImageStyle).toBe('');
        });
    });

    // Test 3: Error handling when loading user data
    it('handles errors when receiving wire data', () => {
        // Act
        return Promise.resolve().then(() => {
            // Manually invoke the wired method with error data
            element.wiredUser(mockUserError);
            
            // Return a promise to wait for any asynchronous DOM updates
            return Promise.resolve();
        }).then(() => {
            // Assert
            expect(element.dispatchEvent).toHaveBeenCalledTimes(1);
            
            // Check that ShowToastEvent was dispatched with error details
            const toastEvent = element.dispatchEvent.mock.calls[0][0];
            expect(toastEvent.detail.title).toBe('Error');
            expect(toastEvent.detail.variant).toBe('error');
        });
    });

    // Test 4: Modal opens when edit button is clicked
    it('opens modal when edit button is clicked', () => {
        // Act
        element.handleEditClick();
        
        // Assert
        expect(element.showEditModal).toBe(true);
    });

    // Test 5: Modal closes when cancel button is clicked
    it('closes modal when handleCloseModal is called', () => {
        // Arrange
        element.showEditModal = true;
        
        // Act
        element.handleCloseModal();
        
        // Assert
        expect(element.showEditModal).toBe(false);
    });

    // Test 6: Successful image upload
    it('handles successful image upload', () => {
        // Arrange
        element.showEditModal = true;
        mockUploadProfilePhoto.mockResolvedValue('Success');
        
        const mockFile = {
            name: 'profile.jpg',
            documentId: 'mock-document-id'
        };
        
        // Act
        element.handleImageUpload({
            detail: {
                files: [mockFile]
            }
        });
        
        // Assert - Initial state during upload
        expect(element.isLoading).toBe(true);
        
        // Continue with promise resolution
        return Promise.resolve().then(() => {
            // Assert after promise resolves
            expect(mockUploadProfilePhoto).toHaveBeenCalledWith({ 
                contentDocumentId: 'mock-document-id',
                fileName: 'profile.jpg'
            });
            
            expect(mockRefreshApex).toHaveBeenCalled();
            
            // Check for success toast
            const toastEvent = element.dispatchEvent.mock.calls[0][0];
            expect(toastEvent instanceof ShowToastEvent).toBeTruthy();
            expect(toastEvent.detail.title).toBe('Success');
            expect(toastEvent.detail.variant).toBe('success');
            
            // Assert modal is closed and loading is finished
            expect(element.showEditModal).toBe(false);
            expect(element.isLoading).toBe(false);
        });
    });

    // Test 7: Failed image upload
    it('handles failed image upload', () => {
        // Arrange
        element.showEditModal = true;
        mockUploadProfilePhoto.mockRejectedValue(new Error('Upload failed'));
        
        const mockFile = {
            name: 'profile.jpg',
            documentId: 'mock-document-id'
        };
        
        // Act
        element.handleImageUpload({
            detail: {
                files: [mockFile]
            }
        });
        
        // Assert initial state
        expect(element.isLoading).toBe(true);
        
        // Continue with promise rejection
        return Promise.resolve().then(() => {
            // Assert after promise rejects
            expect(mockUploadProfilePhoto).toHaveBeenCalled();
            
            // Check for error toast
            const toastEvent = element.dispatchEvent.mock.calls[0][0];
            expect(toastEvent instanceof ShowToastEvent).toBeTruthy();
            expect(toastEvent.detail.title).toBe('Error');
            expect(toastEvent.detail.variant).toBe('error');
            
            // Assert modal is closed and loading is finished
            expect(element.showEditModal).toBe(false);
            expect(element.isLoading).toBe(false);
        });
    });

    // Test 8: No file selected for upload
    it('shows error toast when no file is selected for upload', () => {
        // Arrange
        element.showEditModal = true;
        
        // Act
        element.handleImageUpload({
            detail: {
                files: []
            }
        });
        
        // Assert
        expect(mockUploadProfilePhoto).not.toHaveBeenCalled();
        
        // Check for error toast
        const toastEvent = element.dispatchEvent.mock.calls[0][0];
        expect(toastEvent instanceof ShowToastEvent).toBeTruthy();
        expect(toastEvent.detail.title).toBe('Error');
        expect(toastEvent.detail.message).toBe('No file selected');
        expect(toastEvent.detail.variant).toBe('error');
        
        expect(element.isLoading).toBe(false);
    });

    // Test 9: Check accepted file formats
    it('has the correct accepted file formats', () => {
        expect(element.acceptedFormats).toEqual(['.jpg', '.jpeg', '.png']);
    });

    // Test 10: Check user initials generation
    it('correctly generates user initials', () => {
        // Test with first and last name
        element.userName = 'John Doe';
        expect(element.userInitials).toBe('JD');
        
        // Test with a middle name
        element.userName = 'John A Doe';
        expect(element.userInitials).toBe('JAD');
        
        // Test with empty name
        element.userName = '';
        expect(element.userInitials).toBe('');
        
        // Test with null name
        element.userName = null;
        expect(element.userInitials).toBe('');
    });

    // Test 11: Check background image style generation
    it('correctly generates background image style', () => {
        // Test with valid URL
        element.userPhotoUrl = 'https://example.com/photo.jpg';
        expect(element.backgroundImageStyle).toBe("background-image: url('https://example.com/photo.jpg')");
        
        // Test with null URL
        element.userPhotoUrl = null;
        expect(element.backgroundImageStyle).toBe('');
        
        // Test with empty URL
        element.userPhotoUrl = '';
        expect(element.backgroundImageStyle).toBe('');
    });

    // Test 12: Shows toast message correctly
    it('dispatches ShowToastEvent with correct parameters', () => {
        // Act
        element.showToast('Test Title', 'Test Message', 'success');
        
        // Assert
        expect(element.dispatchEvent).toHaveBeenCalledTimes(1);
        
        const toastEvent = element.dispatchEvent.mock.calls[0][0];
        expect(toastEvent instanceof ShowToastEvent).toBeTruthy();
        expect(toastEvent.detail.title).toBe('Test Title');
        expect(toastEvent.detail.message).toBe('Test Message');
        expect(toastEvent.detail.variant).toBe('success');
    });
});