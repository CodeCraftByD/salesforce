import { LightningElement,track, api, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import STATUS_FIELD from "@salesforce/schema/Mentoring_Match__c.Status__c";
import { getRecord, updateRecord } from "lightning/uiRecordApi";
import PROFILE_IMAGE from "@salesforce/resourceUrl/profileImage";

import lessThan1YearLabel from "@salesforce/label/c.Person_less_than_1_year_at_Salesforce";
import yearsAtSalesforceLabel from "@salesforce/label/c.Person_years_at_salesforce";
import yearAtSalesforceLabel from "@salesforce/label/c.Person_year_at_salesforce";
import yearsOfExperienceLabel from "@salesforce/label/c.Person_years_of_experience";
import yearOfExperienceLabel from "@salesforce/label/c.Person_year_of_experience";
import matchCancelledLabel from "@salesforce/label/c.Person_match_cancelled";
import cancelLabel from "@salesforce/label/c.Cancel";
import bookmarkRemovedMessage from "@salesforce/label/c.Bookmarked_Removed_Message";
import bookmarkAddedMessage from "@salesforce/label/c.Bookmarked_Added_Message";
import createBookmarkMentoringMatch from "@salesforce/apex/MainMentoringController.createBookmarkMentoringMatch";

export default class PersonCard extends LightningElement {
  @track bookmark = 'Bookmarked';
  @track mentoringMatch;
  @api user;
  @api match;
  @api hideScore = false;
  @api showApprovalButtons = false;
  @api showMenuButtons = false;
  @api showPendingButtons = false;
  @api mode;
  @api showDesktopRequestButtons = false;

  isLoading = false;

  labels = {
    cancelLabel,
    bookmarkRemovedMessage,
    bookmarkAddedMessage
  };

  connectedCallback() {
    if (this.match) {
      if (this.match.Mentor__r.Email) {
        this.user = this.match.Mentor__r;   
        this.user = { ...this.user, isBookmarked: this.match?.Status__c == 'Bookmarked' };     
      } else {
        this.user = this.match.Mentee__r;
      }
    }
    this.hideScore = true;
  }

  bookmarkClickedHandler() {
    this.bookmarkMentee();
  }

  async bookmarkMentee() {
    this.isLoading = true;
    try {
      const isBookmarkedtemp = this.user.isBookmarked === true ? false : true;
      this.dispatchEvent(
        new CustomEvent("bookmarkmentor", {
          detail: {
            bookmark : isBookmarkedtemp,
            user: this.user,
          },
        })
      );
      // Stop spinner
      this.isLoading = false;
      //this.user.isBookmarked = this.user.isBookmarked === true ? false : true;
      // Apex call to update existing match status
      await createBookmarkMentoringMatch({
        mentorId: this.user.Id,
        status: this.user.isBookmarked === true ? "Unbookmarked" : "Bookmarked",
        responseMessage: 'Mentor bookmarked',
      });

      this.dispatchEvent(
        new ShowToastEvent({
          title: "Success",
          message: isBookmarkedtemp ? this.labels.bookmarkAddedMessage : this.labels.bookmarkRemovedMessage,
          variant: "success",
        })
      );
      this.user = { ...this.user, isBookmarked: isBookmarkedtemp };
      
    } catch (error) {
     // this.showNotification("Oops", error.body.message, "error");
      this.isLoading = false;
    }
  }

  cardClickedHandler(event) {
    if(event.which == 1 || event.which == 13 || event.which == 32){
      this.dispatchEvent(
        new CustomEvent("selected", {
          detail: {
            match: this.match,
            score: this.score,
            user: this.user,
          },
        })
      );
    }    
  }

  matchUpdatedHandler() {
    this.dispatchEvent(new CustomEvent("updated"));
  }

  async cancelClickedHandler(event) {
    if(event.which == 1 || event.which == 13 || event.which == 32){
    const fields = {};
    fields[STATUS_FIELD.fieldApiName] = "Cancelled";
    fields.Id = this.match.Id;
    const recordInput = { fields };
    try {
      await updateRecord(recordInput);
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Success",
          message: matchCancelledLabel,
          variant: "success",
        })
      );
      this.dispatchEvent(new CustomEvent("cancel"));
    } catch (error) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error updating record",
          message: error.body.message,
          variant: "error",
        })
      );
    }
  }
  }

  calculateYears(hireDate) {
    const yearDifMs = Date.now() - hireDate;
    const yearDate = new Date(yearDifMs);
    return Math.abs(yearDate.getUTCFullYear() - 1970);
  }

  // GETTERS
  get backgroundImage() {
    if (this.user.MediumPhotoUrl) {
      return `background-image: url(${this.user.MediumPhotoUrl})`;
    }
    return "background-image: url(" + PROFILE_IMAGE + ")";
  }

  get bannerBackground() {
    return "background-color: rgb(247, 249, 251)";
  }

  get badgeColor() {
    if (this.user.score < 70) {
      return `background-color: #FF9F43`;
    } else if (this.user.score < 80) {
      return `background-color: #A3CB38`;
    }
    return `background-color: #3FB500`;
  }

  get containerClasses() {
    return this.showApprovalButtons || this.showMenuButtons || this.showPendingButtons ? "card-container partial-border" : "card-container full-border slds-m-bottom_small";
  }

  get isMobile() {
    return screen.width <= 768;
  }

  get requestMessage() {
    return this.match ? this.match.Request_Message__c : undefined;
  }

  get score() {
    if (this.user) {
      return this.user.score;
    }
    return this.match ? this.match.Score__c : undefined;
  }
  get userCostCenterBusinessUnit() {
    let outputArray = [];
    if (this.user.hasOwnProperty("Business_Unit__c")) {
      let businessUnit = this.user.Business_Unit__c.split("-")[1];
      outputArray.push(businessUnit);
    }
    if (this.user.hasOwnProperty("Cost_Center__c")) {
      let costCenter = this.user.Cost_Center__c.split("-")[1];
      outputArray.push(costCenter);
    }

    return outputArray.join(" - ");
  }

  get userProductIndustryCostCenterMarketSegment() {
    let outputArray = [];
    if (this.user.hasOwnProperty("WD_Product__c")) {
      let product = this.user.WD_Product__c;
      outputArray.push(product);
    }
    if (this.user.hasOwnProperty("WD_Industry__c")) {
      let industry = this.user.WD_Industry__c;
      outputArray.push(industry);
    }
    if (this.user.hasOwnProperty("Cost_Center__c")) {
        let costCenter = this.user.Cost_Center__c;
      outputArray.push(costCenter);
    }
    if (this.user.hasOwnProperty("WD_Market_Segment__c")) {
        let marketSegment = this.user.WD_Market_Segment__c;
        outputArray.push(marketSegment);
    }

    return outputArray.join(" - ");
  }

  get bookmarkButton() {
    return this.mentoringMatch && this.mentoringMatch.Status__c === 'Bookmarked' ? true : false;
  }

  get ariausername(){
    return 'Go to '+this.user.Name+' profile';
  } 

}