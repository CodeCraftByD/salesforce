import { LightningElement, api, wire, track } from "lwc";
import { NavigationMixin, CurrentPageReference } from "lightning/navigation";
import { updateRecord, getRecord, getFieldValue } from "lightning/uiRecordApi";
import { getPicklistValuesByRecordType } from "lightning/uiObjectInfoApi";
import USER_OBJECT from "@salesforce/schema/User";
import MENTOR_TYPE_FIELD from "@salesforce/schema/User.Mentor_Type_Preference__c";
import INTERESTS_FIELD from "@salesforce/schema/User.Interests__c";
import LINKEDIN_FIELD from "@salesforce/schema/User.LinkedIn_Profile__c";
import MENTORING_LANGUAGE_FIELD from "@salesforce/schema/User.Mentoring_Language__c";
import GREAT_COMPETENCIES_FIELD from "@salesforce/schema/User.Great_Competencies__c";
import GREAT_COMPETENCIES_IMPROVE_FIELD from "@salesforce/schema/User.Great_Competencies_to_Improve__c";
import EXPERIENCES_FIELD from "@salesforce/schema/User.Experiences__c";
import EXPERIENCES_IMPROVE_FIELD from "@salesforce/schema/User.Experiences_to_Improve__c";
import FUNCTIONAL_COMPETENCIES_FIELD from "@salesforce/schema/User.Functional_Competencies__c";
import FUNCTIONAL_COMPETENCIES_IMPROVE_FIELD from "@salesforce/schema/User.Functional_Competencies_to_Improve__c";
import USER_BIO_FIELD from "@salesforce/schema/User.User_Bio__c";
import COMPLETED_MENTEE_FLOW_FIELD from "@salesforce/schema/User.Completed_Mentee_Onboarding_Flow__c";
import COMPLETED_MENTOR_FLOW_FIELD from "@salesforce/schema/User.Completed_Mentor_Onboarding_Flow__c";
import CAPACITY_FIELD from "@salesforce/schema/User.Capacity__c";
import MODE_FIELD from "@salesforce/schema/User.Mentoring_Mode__c";
import getRolesAndCompetencies from "@salesforce/apex/MainMentoringController.retrieveRolesAndCompetencies";
import Id from "@salesforce/user/Id";
import competenciesMentorFramingLabel from "@salesforce/label/c.create_profile_competencies_mentor_framing";
import competenciesMenteeFramingLabel from "@salesforce/label/c.create_profile_competencies_mentee_framing";
import whichCompetenciesDoYouWishToImproveLabel from "@salesforce/label/c.create_profile_Which_competencies_do_you_wish_to_improve";
import howWouldYouLikeToBeSupportedLabel from "@salesforce/label/c.create_profile_How_would_you_like_to_be_supported";
import mentorFunctionalCompetenciesFramingLabel from "@salesforce/label/c.create_profile_mentor_functional_competencies_framing";
import whichFunctionalCompetenciesSpecificallyDoYouWishToImproveLabel from "@salesforce/label/c.create_profile_Which_functional_competencies_specifically_do_you_wish_to_improve";
import howCanYouSupportOthersLabel from "@salesforce/label/c.create_profile_How_can_you_support_others";
import menteeFunctionalCompetenciesFramingLabel from "@salesforce/label/c.create_profile_mentee_functional_competencies_framing";
import whatCompetenciesAreYouAbleToShareLabel from "@salesforce/label/c.create_profile_What_competencies_are_you_able_to_share";
import whichFunctionalCompetenciesSpecificallyAreYouAbleToShareLabel from "@salesforce/label/c.create_profile_Which_functional_competencies_specifically_are_you_able_to_share";
import whatTypeOfMentoringDoYouPreferLabel from "@salesforce/label/c.create_profile_What_type_of_mentoring_do_you_prefer";
import whatLanguagesDoYouPreferLabel from "@salesforce/label/c.create_profile_What_language_s_do_you_prefer";
import tellUsAboutYourselfLabel from "@salesforce/label/c.create_profile_Tell_Us_About_Yourself";
import thisDisplaysOnYouProfileAndHelpsPeopleLabel from "@salesforce/label/c.create_profile_This_displays_on_your_profile_and_helps_people";
import whatBestDescribesYouLabel from "@salesforce/label/c.create_profile_What_best_describes_you";
import whatIsYourLinkedInProfile from "@salesforce/label/c.create_profile_What_is_your_LinkedIn_Profile";
import whichEqualityGroupsDoYouSupportLabel from "@salesforce/label/c.create_profile_Which_Equality_Groups_do_you_support";
import singleSelectComboboxLabel from "@salesforce/label/c.Single_Select_Combobox";
import close from "@salesforce/label/c.close";
import save from "@salesforce/label/c.save";
import PleaseSelectExperiencesLabel from "@salesforce/label/c.Please_Select_Experiences_Label";
import PleaseselectgreatcompetenciesLabel from "@salesforce/label/c.Please_select_great_competencies_Label";
import PleaseselectfunctionalcompetenciesLabel from "@salesforce/label/c.Please_select_functional_competencies_Label";
import PleaseselectyourpreferenceLabel from "@salesforce/label/c.Please_select_your_preference_Label";
import PleaseselectpreferredlanguageLabel from "@salesforce/label/c.Please_select_preferred_language_Label";
import BioLabel from "@salesforce/label/c.Bio_Label";
import LinkedinProfileLable from "@salesforce/label/c.Linkedin_Profile_Lable";
import MyPersonalityLable from "@salesforce/label/c.My_Personality_Lable";
import HowManyMenteesDoYouCurrentlyHaveTheCapacityToMentorEffectively from "@salesforce/label/c.How_many_mentees_do_you_currently_have_the_capacity_to_mentor_effectively";
import pleaseSelectMenteeCapacityLabel from "@salesforce/label/c.Please_select_Mentee_capacity_Label";
import {refreshApex} from '@salesforce/apex';
import AVAILABLE_FIELD from "@salesforce/schema/User.Available__c";

export default class CreateProfileForm extends NavigationMixin(
  LightningElement
) {
  userId = Id;
  picklistFieldValues;
  roleCompetencyValues;
  @track recordData;
  @track showExperiencesToImproveError = false;
  @track showGreatCompetenciesToImproveError = false;
  @track showFunctionalCompetenciesToImproveError = false;
  @track showHowCanYouSupportOthersError = false;
  @track showWhatGreatCompetenciesAreYouAbleToShareError = false;
  @track showWhatFunctionalCompetenciesAreYouAbleToShareError = false;
  @track showWhatTypeOfMentoringDoYouPreferError = false;
  @track showWhatLanguagesDoYouPreferError = false;
  @track showBestDescribedError = false;
  @track showCapacityError = false;
  @api mode;
  @api showDropdown = false;
 capacity = 0;
  labels = {
    competenciesMentorFramingLabel,
    competenciesMenteeFramingLabel,
    whichCompetenciesDoYouWishToImproveLabel,
    howWouldYouLikeToBeSupportedLabel,
    mentorFunctionalCompetenciesFramingLabel,
    whichFunctionalCompetenciesSpecificallyDoYouWishToImproveLabel,
    howCanYouSupportOthersLabel,
    whatCompetenciesAreYouAbleToShareLabel,
    menteeFunctionalCompetenciesFramingLabel,
    whichFunctionalCompetenciesSpecificallyAreYouAbleToShareLabel,
    whatTypeOfMentoringDoYouPreferLabel,
    whatLanguagesDoYouPreferLabel,
    tellUsAboutYourselfLabel,
    thisDisplaysOnYouProfileAndHelpsPeopleLabel,
    whatBestDescribesYouLabel,
    whatIsYourLinkedInProfile,
    whichEqualityGroupsDoYouSupportLabel,
    singleSelectComboboxLabel,
    close,
    save,
    PleaseSelectExperiencesLabel,
    PleaseselectgreatcompetenciesLabel,
    PleaseselectfunctionalcompetenciesLabel,
    PleaseselectyourpreferenceLabel,
    PleaseselectpreferredlanguageLabel,
    BioLabel,
    LinkedinProfileLable,
    MyPersonalityLable,
    HowManyMenteesDoYouCurrentlyHaveTheCapacityToMentorEffectively,
    pleaseSelectMenteeCapacityLabel

  };

  @wire(CurrentPageReference)
  pageRef;

  @wire(getRecord, {
    recordId: "$userId",
    fields: [
      GREAT_COMPETENCIES_IMPROVE_FIELD,
      GREAT_COMPETENCIES_FIELD,
      EXPERIENCES_IMPROVE_FIELD,
      EXPERIENCES_FIELD,
      FUNCTIONAL_COMPETENCIES_FIELD,
      FUNCTIONAL_COMPETENCIES_IMPROVE_FIELD,
      INTERESTS_FIELD,
      LINKEDIN_FIELD,
      USER_BIO_FIELD,
      MENTOR_TYPE_FIELD,
      MENTORING_LANGUAGE_FIELD,
      CAPACITY_FIELD,
      MODE_FIELD,
    ]
  })
  wiredRecord({ data, error }) {
    if (error) {
      // eslint-disable-next-line
      console.error(error);
    } else if (data) {
      this.recordData = data;
      this.capacity = getFieldValue(data,  CAPACITY_FIELD);
      this.capacity = this.capacity === null?0:this.capacity;
      this.showCapacityError = (this.capacity === null || this.capacity === 0) && this.mode !== 'Mentee'? true:false;
    }
  }



  @wire(getPicklistValuesByRecordType, {
    recordTypeId: "012000000000000AAA", // default record type id
    objectApiName: USER_OBJECT
  })
  wiredPicklistValues({ error, data }) {
    if (error) {
      // eslint-disable-next-line
      console.error("picklistError: ", error);
    } else if (data) {     
      this.picklistFieldValues = data.picklistFieldValues;
    }
  }

  @wire(getRolesAndCompetencies)
  wiredApexMethod({ error, data }) {
    if (error) {
      console.error("Error: ", error);
      this.loading = false;
      this.showUnsupportedBanner = true;
    } else if (data) {
      const tempFilterData=[];
    for(let i=0; i<data.length; i++){
        tempFilterData.push(...data[i].values);
    }
      this.roleCompetencyValues = tempFilterData.map(function (child) {
        const tempPicklistValue = {
          name: child.label,
          label: child.label,
          value: child.value,
          id: child.value,
          key: child.value,
          tree: false,
          searchDisplay: true,
          children:[],
        };          
        return tempPicklistValue;
      });
    }
  }

  skipFlow() {
    this.dispatchEvent(new CustomEvent("close"));
    this[NavigationMixin.Navigate]({
      ...this.pageRef,
      state: {}
    });
  }
  




  get showCombo() {
    return this.picklistFieldValues &&
      this.recordData &&
      this.roleCompetencyValues
      ? true
      : false;
  }

  get fieldSettings() {
    return {
      // Mentee Competencies and Experiences
      greatCompetenciesImproveField: {
        field: GREAT_COMPETENCIES_IMPROVE_FIELD,
        options: this.picklistFieldValues
          ? this.picklistFieldValues[
              GREAT_COMPETENCIES_IMPROVE_FIELD.fieldApiName
            ].values
          : [],
        value: this.recordData
          ? this.recordData.fields[
              GREAT_COMPETENCIES_IMPROVE_FIELD.fieldApiName
            ].value?.split(";")
          : []
      },
      experienceImproveField: {
        field: EXPERIENCES_IMPROVE_FIELD,
        options: this.picklistFieldValues
          ? this.picklistFieldValues[EXPERIENCES_IMPROVE_FIELD.fieldApiName]
              .values
          : [],
        value: this.recordData
          ? this.recordData.fields[
              EXPERIENCES_IMPROVE_FIELD.fieldApiName
            ].value?.split(";")
          : []
      },
      functionalCompetenciesImproveField: {
        field: FUNCTIONAL_COMPETENCIES_IMPROVE_FIELD,
        options: this.picklistFieldValues
          ? this.picklistFieldValues[
              FUNCTIONAL_COMPETENCIES_IMPROVE_FIELD.fieldApiName
            ].values
          : [],
        value: this.recordData
          ? this.recordData.fields[
              FUNCTIONAL_COMPETENCIES_IMPROVE_FIELD.fieldApiName
            ].value?.split(";")
          : []
      },

      // Mentor Competencies and Experiences
      greatCompetenciesField: {
        field: GREAT_COMPETENCIES_FIELD,
        options: this.picklistFieldValues
          ? this.picklistFieldValues[GREAT_COMPETENCIES_FIELD.fieldApiName]
              .values
          : [],
        value: this.recordData
          ? this.recordData.fields[
              GREAT_COMPETENCIES_FIELD.fieldApiName
            ].value?.split(";")
          : []
      },
      experienceField: {
        field: EXPERIENCES_FIELD,
        options: this.picklistFieldValues
          ? this.picklistFieldValues[EXPERIENCES_FIELD.fieldApiName].values
          : [],
        value: this.recordData
          ? this.recordData.fields[EXPERIENCES_FIELD.fieldApiName].value?.split(
              ";"
            )
          : []
      },
      functionalCompetenciesField: {
        field: FUNCTIONAL_COMPETENCIES_FIELD,
        options: this.picklistFieldValues
          ? this.picklistFieldValues[FUNCTIONAL_COMPETENCIES_FIELD.fieldApiName]
              .values
          : [],
        value: this.recordData
          ? this.recordData.fields[
              FUNCTIONAL_COMPETENCIES_FIELD.fieldApiName
            ].value?.split(";")
          : []
      },
      
      // User Bio
      userBioField: {
        field: USER_BIO_FIELD,
        value: this.recordData
          ? this.recordData.fields[USER_BIO_FIELD.fieldApiName].value?.split(
              ";"
            )
          : []
      },
      mentoringTypeField: {
        field: MENTOR_TYPE_FIELD,
        options: this.picklistFieldValues
          ? this.picklistFieldValues[MENTOR_TYPE_FIELD.fieldApiName].values
          : [],
        value: this.recordData
          ? this.recordData.fields[MENTOR_TYPE_FIELD.fieldApiName].value?.split(
              ";"
            )
          : []
      },
      mentoringLanguageField: {
        field: MENTORING_LANGUAGE_FIELD,
        options: this.picklistFieldValues
          ? this.picklistFieldValues[MENTORING_LANGUAGE_FIELD.fieldApiName]
              .values
          : [],
        value: this.recordData
          ? this.recordData.fields[
              MENTORING_LANGUAGE_FIELD.fieldApiName
            ].value?.split(";")
          : []
      },
      interestsField: {
        field: INTERESTS_FIELD,
        options: this.picklistFieldValues
          ? this.picklistFieldValues[INTERESTS_FIELD.fieldApiName].values
          : [],
        value: this.recordData
          ? this.recordData.fields[INTERESTS_FIELD.fieldApiName].value?.split(
              ";"
            )
          : []
      },
      linkedInField: {
        field: LINKEDIN_FIELD,
        value: this.recordData
          ? this.recordData.fields[LINKEDIN_FIELD.fieldApiName].value
          : ""
      }
    };
  }

  get flowSteps() {
    let steps;
    const menteeSteps = [{ step: "mentee-skills", progress: "0" }];
    const mentorSteps = [{ step: "mentor-skills", progress: "0" }];
    const commonSteps = [
      { step: "location", progress: "25" },
      { step: "interests", progress: "75" }
    ];

    switch (this.mode) {
      case "Mentee":
        steps = [...menteeSteps, ...commonSteps];
        break;
      case "Mentor":
        steps = [...mentorSteps, ...commonSteps];
        break;
      default:
        steps = [...menteeSteps, ...mentorSteps, ...commonSteps];
        break;
    }
    return steps;
  }

  @api onNext(event) {
    this.showExperiencesToImproveError = false;
    this.showGreatCompetenciesToImproveError = false;
    this.showFunctionalCompetenciesToImproveError = false;
    this.showHowCanYouSupportOthersError = false;
    this.showWhatGreatCompetenciesAreYouAbleToShareError = false;
    this.showWhatFunctionalCompetenciesAreYouAbleToShareError = false;
    this.showWhatTypeOfMentoringDoYouPreferError = false; 
    this.showWhatLanguagesDoYouPreferError = false;
    this.showBestDescribedError = false;
    this.loading = true;
    const action = event.target.dataset.action;
    let fields = { Id: this.userId };
    if (action === "back") {
      this.loading = false;
      this.setStep(action);
    } else {
      fields = { ...fields, ...this.getFormValues()};
      if (action === "finish") {
        if (this.mode === "Mentee") {
          fields[COMPLETED_MENTEE_FLOW_FIELD.fieldApiName] = true;
          fields[COMPLETED_MENTOR_FLOW_FIELD.fieldApiName] = false;
        } else if(this.mode === "Mentor"){
          fields[COMPLETED_MENTOR_FLOW_FIELD.fieldApiName] = true;
          fields[COMPLETED_MENTEE_FLOW_FIELD.fieldApiName] = false;
          fields[AVAILABLE_FIELD.fieldApiName] = true;
        }else{
          fields[COMPLETED_MENTOR_FLOW_FIELD.fieldApiName] = true;
          fields[COMPLETED_MENTEE_FLOW_FIELD.fieldApiName] = true;
         fields[AVAILABLE_FIELD.fieldApiName] = true;
        }
          fields[MODE_FIELD.fieldApiName] = this.mode;
      }

      if (action === "save" || action === "next" || action === "finish") {
        this.showExperiencesToImproveError =
          fields.Experiences_to_Improve__c === "" ? true : false;
        this.showGreatCompetenciesToImproveError =
          fields.Great_Competencies_to_Improve__c === "" ? true : false;
        this.showHowCanYouSupportOthersError =
          fields.Experiences__c === "" ? true : false;
        this.showWhatGreatCompetenciesAreYouAbleToShareError =
          fields.Great_Competencies__c === "" ? true : false;
        this.showWhatTypeOfMentoringDoYouPreferError =
          fields.Mentor_Type_Preference__c === "" ? true : false;
        this.showWhatLanguagesDoYouPreferError =
          fields.Mentoring_Language__c === "" ? true : false;
        this.showBestDescribedError = 
          fields.Interests__c === "" ? true : false;

        if (
          this.showExperiencesToImproveError ||
          this.showGreatCompetenciesToImproveError ||
          this.showHowCanYouSupportOthersError ||
          this.showWhatGreatCompetenciesAreYouAbleToShareError ||
          this.showWhatTypeOfMentoringDoYouPreferError ||
          this.showWhatLanguagesDoYouPreferError ||
          this.showBestDescribedError
        ) {
          this.loading = false;
        } else {
          this.recordUpdate({ fields }, action);
        }
      }
    }
  }

  async recordUpdate(fields, action) {
    await updateRecord(fields)
      .then(() => {
        if (action === "next") {
          this.loading = false;
          this.setStep(action);
        } else if (action === "save") {
          this.loading = false;
          this.skipFlow();
        } else {
          this.loading = false;
          window.location.href = "../";
        }
      })
      .catch((error) => {
        this.loading = false;
        console.error(error);
      });
  }

  getFormValues() {
    const fields = {};
    const comboboxes = this.template.querySelectorAll(
      "c-m-fmulti-select-combobox "
    );
    const bioInput = this.template.querySelector("lightning-textarea");
    const linkedInUsername = this.template.querySelector("lightning-input");   
    comboboxes.forEach((element) => {
      fields[element.dataset.field] = element.multiSelect
        ? element.values.join(";")
        : element.value;
    });
    if (bioInput) fields[bioInput.dataset.field] = bioInput.value;
    if (linkedInUsername)
      fields[linkedInUsername.dataset.field] = linkedInUsername.value;
      
    return fields;
  }
  

 @api setStep(action) {
    this.showCapacityError = (this.mode === 'Both' && this.stepIndex === 0)?false:this.showCapacityError;
    if(!this.showCapacityError) {  
      const nextStep =
      action === "next"
        ? this.flowSteps[this.stepIndex + 1]
        : this.flowSteps[this.stepIndex - 1];
    this[NavigationMixin.Navigate]({
      ...this.pageRef,
      state: {
        ...this.pageRef.state,
        step: nextStep.step,
        progress: this.progress
      }
   }
    );
    }
 
  }

  // Getters
   get stepIndex() {
    return this.flowSteps.findIndex(
      (element) => element.step === this.pageRef.state.step
    );
  }

  get progressIsSet() {
    if(this.pageRef !== undefined)   
    return this.pageRef.state.progress;
  else
  return '' ; 
  }

 get showNextButton() {
    return this.stepIndex < this.flowSteps.length - 1;
  }

  get showFinishButton() {
    return !this.showNextButton;
  }

 get step() {
    if(this.pageRef !== undefined)   
    return this.pageRef.state.step;
  else 
  return '';
  }

  get progress() {
    return Math.round((100 / this.flowSteps.length) * (this.stepIndex + 1));
  }

  get showLocation() {
    return this.step === "location";
  }

  get showMenteeSkills() {
    return this.step === "mentee-skills";
  }

  get showMentorSkills() {
    return this.step === "mentor-skills";
  }

  get showInterests() {
    return this.step === "interests";
  }

  handleSelected() {
    let fields = { Id: this.userId };
    fields = { ...fields, ...this.getFormValues() };
    this.showExperiencesToImproveError =
          fields.Experiences_to_Improve__c === "" ? true : false;
        this.showGreatCompetenciesToImproveError =
          fields.Great_Competencies_to_Improve__c === "" ? true : false;
        this.showHowCanYouSupportOthersError =
          fields.Experiences__c === "" ? true : false;
        this.showWhatGreatCompetenciesAreYouAbleToShareError =
          fields.Great_Competencies__c === "" ? true : false;
        this.showWhatTypeOfMentoringDoYouPreferError =
          fields.Mentor_Type_Preference__c === "" ? true : false;
        this.showWhatLanguagesDoYouPreferError =
          fields.Mentoring_Language__c === "" ? true : false;
        this.showBestDescribedError = 
          fields.Interests__c === "" ? true : false;
  }
  
  handleKeyDown(event) {
    if(event.code === 'Escape') {
      this.showDropdown = false;
      this.template.querySelectorAll('c-m-fmulti-select-combobox').forEach(element => {
        if(!this.showDropdown){
          this.showDropdown = element.showDropdown;
        }
      });
      if(!this.showDropdown){
        this.MyModal.closeModal();
        this.openModal = false;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
    }
   }

   //Mentee capacity updates

   @api incrementCounter = () => {
    if(this.capacity <10) {
      this.capacity = this.capacity + 1;
      this.updateCapacity(); 
      
    }
    
  };


  @api decrementCounter = () => {
    if (this.capacity > 1) {
      this.capacity = this.capacity - 1;
      this.updateCapacity();
  }else if(this.capacity === 1){this.showCapacityError = true
      this.capacity = 0;//at this point capacity would be 0, so reset it to a min of 1
      this.updateCapacity();
  }else if(this.capacity === 0){
//do nothing
  this.showCapacityError = true
  }
};

 @api updateCapacity = () => {
    const fields = {};
    fields.Id = this.userId;
    fields[CAPACITY_FIELD.fieldApiName] = this.capacity;
    const recordInput = {
      fields,
    };
    updateRecord(recordInput)
      .then(() => {
      refreshApex(this.recordData);
      this.showCapacityError = false;
      if(this.capacity === 0) this.showCapacityError = true;
      })
      .catch((error) => {
        console.log("error: ", error);
      });
  };
}
