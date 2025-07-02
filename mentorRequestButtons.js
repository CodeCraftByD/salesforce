import { LightningElement, api, track, wire } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { getFieldValue, getRecord } from "lightning/uiRecordApi";
import { getPicklistValues } from "lightning/uiObjectInfoApi";
import Id from "@salesforce/user/Id";
import NAME_FIELD from "@salesforce/schema/User.Name";
import REASON_FIELD from "@salesforce/schema/Mentoring_Match__c.Dismissal_Reason__c";
import AVAILABLE_FIELD from "@salesforce/schema/User.Available__c";
import createMentoringMatch from "@salesforce/apex/MainMentoringController.createMentoringMatch";
import rejectedLabel from '@salesforce/label/c.rejected';
import sendRequestLabel from '@salesforce/label/c.mentor_send_request';
import notInterestedLabel from '@salesforce/label/c.mentor_not_interested';
import acceptMenteeLabel from '@salesforce/label/c.mentor_accept_mentee';
import wontBeSuggestedLabel from '@salesforce/label/c.mentor_won_t_be_suggested_again';
import yourRequestWasSentLabel from '@salesforce/label/c.mentor_your_request_was_sent';
import declineLabel from '@salesforce/label/c.Decline';
import acceptLabel from '@salesforce/label/c.Accept';
import tellUsALittleMoreThisHelpsLabel from '@salesforce/label/c.mentor_Please_tell_us_a_little_more_This_helps_us_improve_our_algorithm';
import whyAreYouNotInterestedLabel from '@salesforce/label/c.mentor_Why_are_you_not_interested_in_this_person_as_a_mentor';
import pleaseTellUsMoreLabel from '@salesforce/label/c.mentor_Please_tell_us_more';
import anyAdditionalInformationLabel from '@salesforce/label/c.mentor_Any_additional_information_is_appreciated';
import writeSomethingAboutYourselfLabel from '@salesforce/label/c.mentor_Write_something_about_yourself';
import youCanAddAPersonalizedMessageLabel from '@salesforce/label/c.mentor_You_can_add_a_personalized_message';
import mentorRequestLabel from '@salesforce/label/c.mentor_request';
import declineMenteeLabel from '@salesforce/label/c.mentor_Decline_Mentee';
import removeSuggestionLabel from '@salesforce/label/c.mentor_remove_suggestion';

import MyModal from 'c/mFcustomLightningModal';

export default class MentorRequestButtons extends NavigationMixin(LightningElement) {
  @api mode = "mentee";
  @api user;
  @api score;
  @api loading = false;

  currentUserId = Id;
  @track bookmark = 'Bookmarked';

  @track currentUser;

  @track showMessageComposer = false;
  @track showAcceptComposer = false;
  @track showRejectComposer = false;
  @track showDismissModal = false;

  @track reasonPlValues;
  @track dismissalReason;
  @track dismissalAdditionalInformation;

  labels = {
    declineLabel,
    acceptLabel,
    tellUsALittleMoreThisHelpsLabel,
    whyAreYouNotInterestedLabel,
    pleaseTellUsMoreLabel,
    anyAdditionalInformationLabel,
    writeSomethingAboutYourselfLabel,
    youCanAddAPersonalizedMessageLabel,
    mentorRequestLabel,
    acceptMenteeLabel,
    declineMenteeLabel,
    sendRequestLabel,
    notInterestedLabel,
    removeSuggestionLabel
  }

  @wire(getPicklistValues, {
    recordTypeId: "012000000000000AAA",
    fieldApiName: REASON_FIELD,
  })
  wiredPicklistValues({ error, data }) {
    if (data) {
      this.reasonPlValues = data.values;
    } else if (error) {
      //eslint-disable-next-line
      console.error("Error: ", error.body.message);
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error: ",
          message: error.body.message,
          variant: "error",
        })
      );
    }
  }

  @wire(getRecord, { recordId: "$currentUserId", fields: [NAME_FIELD] })
  wiredRecord({ error, data }) {
    if (error) {
      //eslint-disable-next-line
      console.error(error);
    } else if (data) {
      this.currentUser = data;
    }
  }

  handleReasonChange(event) {
    this.dismissalReason = event.detail.value;
  }

  handleDismissalInformationChange(event) {
    this.dismissalAdditionalInformation = event.detail.value;
  }

  toggleDismissModal() {
    //this.showDismissModal = !this.showDismissModal;
    console.log('Calling from here?')
    this.callModal('medium','','',false,'','Please tell us a little more. This helps us improve our algorithm.','','Cancel',this.labels.removeSuggestionLabel)
  }

  callModal(size, description, content, hideFooter, inputLabel, heading, buttonLabel, cancelLabel, saveLabel){
    MyModal.open({
      size: size,
      description: description,
      content: content,
      hideFooter: hideFooter,
      inputLabel : inputLabel,
      heading :heading,
      buttonLabel: buttonLabel,
      showDismissModal:true,
      cancelLabel:cancelLabel,
      saveLabel:saveLabel,
      reasonvalues:this.reasonPlValues,
     onprimaryevent: (e) => {
        // stop further propagation of the event
        e.stopPropagation();        
        this.dismissSuggestion();
      },  
      onreasonchange:(e)=>{
        e.stopPropagation();  
        this.handleReasonChange(e);
      },
      oninformationchange:(e)=>{
        e.stopPropagation();  
        this.handleDismissalInformationChange(e);
      } 
  }).then((result) => {
    console.log(result);
  });
  }
  async toggleComposer() {
    MyModal.open({
      size: 'small',
      description: 'Accessible description of modal\'s purpose',
      content: 'Passed into content api',
      hideFooter: false,
      inputLabel : this.labels.writeSomethingAboutYourselfLabel,
      heading : this.labels.mentorRequestLabel,
      buttonLabel: this.labels.sendRequestLabel,
      showMessageComposer:true,
      saveLabel:'Send Request',
    onprimaryevent: (e) => {
        // stop further propagation of the event
        console.log('getting message?'+JSON.stringify(e.detail.message))
        e.stopPropagation();        
        this.sendRequest(e.detail.message);
      }
  }).then((result) => {
    console.log(result);
  });
  }


  toggleAcceptComposer() {
   MyModal.open({
    size: 'small',
    description: 'Accessible description of modal\'s purpose',
    content: 'Passed into content api',
    hideFooter: false,
    inputLabel : this.labels.youCanAddAPersonalizedMessageLabel,
    heading : this.labels.acceptMenteeLabel,
    buttonLabel: this.labels.acceptLabel,
    showMessageComposer:true,
    saveLabel:'Accept',
  onprimaryevent: (e) => {
      // stop further propagation of the event
      e.stopPropagation();        
      this.acceptMentee(e.detail.message);
    }
}).then((result) => {
  console.log(result);
});
  }

  toggleRejectComposer() {
    MyModal.open({
      size: 'small',
      description: 'Accessible description of modal\'s purpose',
      content: 'Passed into content api',
      hideFooter: false,
      inputLabel : this.labels.youCanAddAPersonalizedMessageLabel,
      heading : this.labels.declineMenteeLabel,
      buttonLabel: this.labels.declineLabel,
      showMessageComposer:true,
      saveLabel:'Decline',
    onprimaryevent: (e) => {
        // stop further propagation of the event
        e.stopPropagation();        
        this.rejectMentee(e.detail.message);
      }
  }).then((result) => {
    console.log(result);
  });
  }  

  requestClickedHandler() {
    if (this.mode === "mentor") {
      // If user logged in as mentor accept mentee
      this.toggleAcceptComposer();
    } else {
      // If user logged in as mentee send request to mentor
      if (this.userAvailable) {
        this.toggleComposer();
      }
    }
  }

  bookmarkClickedHandler() {
    this.bookmarkMentee();
  }

  @api async sendRequest(message) {
    console.log('Am i here?')
    this.loading = true;
    try {
      console.log('last step'+message)
;      await createMentoringMatch({
        mentorId: this.userId,
        status: "Requested",
        requestMessage: message,
        score: this.score,
      });
      // Show success notification
      this.showNotification('Success!!', yourRequestWasSentLabel, "success");
      // Stop spinner
      this.loading = false;

      // Send updated Event to parent
      this.dispatchEvent(new CustomEvent("updated"));
    } catch (error) {
      this.showNotification("Oops", error.body.message, "error");
      this.loading = false;
    }
  }

  dismissSuggestion() {
    // If user logged in as mentee dismiss mentor
    console.log('Dismiss?')
    this.upsertMatch(
      "Dismissed",
      `${this.userName} ${wontBeSuggestedLabel}`,
      null,
      this.dismissalReason,
      this.dismissalAdditionalInformation
    );
  }

  ignoreClickedHandler() {
    if (this.mode === "mentor") {
      // If user logged in as mentor reject mentee
      this.toggleRejectComposer();
    } else {
      this.toggleDismissModal();
    }
  }

  async upsertMatch(status, successMessage, callback, removalReason, removalInformation) {
    this.loading = true;
    let input;
    if (this.mode === "mentor") {
      input = {
        menteeId: this.userId,
        status,
        score: this.score,
      };
    } else {
      input = {
        mentorId: this.userId,
        status,
        score: this.score,
        removalReason,
        removalInformation,
      };
    }
    try {
      await createMentoringMatch(input);
      // Show success notification
      this.showNotification('Success', successMessage, "success");

      // Execute Callback if there is one
      if (callback) {
        callback();
      }

      // Stop spinner
      this.loading = false;

      // Send updated Event to parent
      this.dispatchEvent(new CustomEvent("updated"));
    } catch (error) {
      this.showNotification("Oops", error.body.message, "error");
      this.loading = false;
    }
  }

  @api  async acceptMentee(message) {
    this.loading = true;
    try {
      // Apex call to update existing match status
      await createMentoringMatch({
        menteeId: this.userId,
        status: "Accepted",
        responseMessage: message,
      });

      // Stop spinner
      this.loading = false;
      this.dispatchEvent(new CustomEvent("updated"));

    } catch (error) {
      this.showNotification("Oops", error.body.message, "error");
      this.loading = false;
    }
  }

  @api async rejectMentee(message) {
    this.loading = true;
    try {
      // Apex call to update existing match status
      await createMentoringMatch({
        menteeId: this.userId,
        status: "Rejected",
        responseMessage: message,
      });

      // Stop spinner
      this.loading = false;

      // Show notification
      this.showNotification(undefined, `${this.userName} ${rejectedLabel}`);

      // Send updated Event to parent
      this.dispatchEvent(new CustomEvent("updated"));
    } catch (error) {
      this.showNotification("Oops", error.body.message, "error");
      this.loading = false;
    }
  }

  @api async bookmarkMentee(message) {
    this.loading = true;
    try {
      // Apex call to update existing match status
      await createMentoringMatch({
        menteeId: this.userId,
        status: "Bookmarked",
        responseMessage: 'Mentor bookmarked',
      });

      // Stop spinner
      this.loading = false;

      // Show notification
      this.showNotification(undefined, `${this.userName} ${bookmark}`);

      // Send updated Event to parent
      this.dispatchEvent(new CustomEvent("updated"));
    } catch (error) {
      this.showNotification("Oops", error.body.message, "error");
      this.loading = false;
    }
  }

  showNotification(title, message, variant) {
    const evt = new ShowToastEvent({
      title,
      message,
      variant,
    });
    this.dispatchEvent(evt);
  }

  openGoogleCalendar() {
    window.open(this.meetingUrl);
  }

  // GETTERS
  get meetingUrl() {
    const guestEmail = this.user ? this.user.Email : undefined;
   let startDate = new Date();
    startDate.setHours(startDate.getHours() + 1, 0, 0, 0);
    startDate = startDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
    let endDate = new Date();
    endDate.setHours(endDate.getHours() + 2, 0, 0, 0);
    endDate = endDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const menteeName = this.user ? this.user.Name : undefined;
    const mentorName = this.currentUserName;
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=Mentoring+Meeting+%7C+${menteeName}+%26+${mentorName}&details=Use+this+event+to+get+to+know+each+other&dates=${startDate}/${endDate}&add=${guestEmail}`;
    return url;
  }

  get currentUserName() {
    return getFieldValue(this.currentUser, NAME_FIELD);
  }

  get userAvailable() {
    if (!this.user) {
      return false;
    }
    if (this.user.Available__c === undefined) {
      return getFieldValue(this.user, AVAILABLE_FIELD);
    }
    return this.user.Available__c;
  }

  get userId() {
    return this.user.id || this.user.Id;
  }

  get userName() {
    if (typeof this.user.Name === "string") {
      return this.user.Name;
    }
    return getFieldValue(this.user, NAME_FIELD);
  }

  get buttonLabel() {
    return this.mode === "mentee" ? sendRequestLabel : acceptMenteeLabel;
  }

  get showBookmark() {
    return this.mode === "mentee" ? true : false;
  }

  get declineButtonLabel() {
    return this.mode === "mentor" ? declineLabel : notInterestedLabel;
  }

  get isMobile() {
    return screen.width <= 768;
  }

  get requestButtonClasses() {
    return "oversized-button oversized-button-brand slds-text-color_inverse slds-align_absolute-center  requestbutton";
  }
}