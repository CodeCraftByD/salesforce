import { LightningElement, track, api, wire } from "lwc";
import { refreshApex } from "@salesforce/apex";
import getCurrentUserDetails from "@salesforce/apex/MainMentoringController.getCurrentUserDetails";
import retrieveMentors from "@salesforce/apex/MainMentoringController.retrieveMentors";
import { NavigationMixin } from "lightning/navigation";
import FUNCTIONAL_COMPETENCIES_FIELD from "@salesforce/schema/User.Functional_Competencies__c";
import GREAT_COMPETENCIES_FIELD from "@salesforce/schema/User.Great_Competencies__c";
import BUSINESS_UNIT_FIELD from "@salesforce/schema/User.Business_Unit__c";
import COST_CENTER_FIELD from "@salesforce/schema/User.Cost_Center__c";
import MENTEE_TYPE_FIELD from "@salesforce/schema/User.Mentee_Type_Preference__c";
import MENTOR_LOCATION_FIELD from "@salesforce/schema/User.Mentor_Location_Preference__c";
import EGC_FIELD from "@salesforce/schema/User.Equality_Group_Member__c";
import EXPERIENCES_FIELD from "@salesforce/schema/User.Experiences__c";
import LANGUAGES_FIELD from "@salesforce/schema/User.Mentoring_Language__c";
import CERTIFICATIONS_FIELD from "@salesforce/schema/User.Certifications__c";
import AdvancedFiltersLabel from "@salesforce/label/c.search_advanced_filters";
import areYouAFTELabel from "@salesforce/label/c.search_are_you_a_FTE";
import searchMentorsLabel from "@salesforce/label/c.search_mentors";
import couldntFindMentorsCriteriaLabel from "@salesforce/label/c.search_Oops_We_couldn_t_find_any_mentors_for_your_specified_criteria";
import mentormenteerelationshipCriteriaLabel from "@salesforce/label/c.search_is_already_in_a_mentor_mentee_relationship_with_you";//change
import capacityCriteriaLabel from "@salesforce/label/c.search_doesn_t_have_capacity_to_have_new_mentees";//change
import mentorSuggestionsForYouLabel from "@salesforce/label/c.search_mentor_suggestions_for_you";
import noAvailableMentorsForYouLabel from "@salesforce/label/c.search_There_are_no_available_mentors_for_your_specified_criteria";
import weShortlistedGreatMentorsForYouLabel from "@salesforce/label/c.search_we_shortlisted_great_mentors_for_you";
import filterCardTitle from "@salesforce/label/c.search_Filter_card_title";
import searchBasedOnYourBackgroundLabel from "@salesforce/label/c.search_Based_on_your_background";
import filterMentorsInsufficientModal from 'c/filterMentorsInsufficientModal';
export default class SearchMentors extends NavigationMixin(LightningElement) {
  @api showFilteringOptions = false;
  @api filtersAlwaysOn = false;
  @api showSearchBar = false;

  @track mentorsRaw;
  @track filteredMentors;
  @track filterErrorMessage = '';
  @track showFilters = false;
  @track filterCategories;
  @track loading = false;
  @api showUnsupportedBanner = false;
  @api searchTerm = '';
  @track currentUser;

  @track certifications = [];
  @track typeOfMentoring = [];
  @track functionalCompetencies = [];
  @track languages = [];
  @track experiences = [];
  @track egcs = [];
  @track greatCompetencies = [];
  @track locations = [];
  wiredMentors;
  isSearchTermChange = false;
  @api mentorData;
  

  labels = {
    AdvancedFiltersLabel,
    areYouAFTELabel,
    searchMentorsLabel,
    couldntFindMentorsCriteriaLabel,
    mentormenteerelationshipCriteriaLabel,//change
    capacityCriteriaLabel,//change
    mentorSuggestionsForYouLabel,
    noAvailableMentorsForYouLabel,
    weShortlistedGreatMentorsForYouLabel,
    searchBasedOnYourBackgroundLabel,
    filterCardTitle,
  };
  
  @wire(getCurrentUserDetails)
  wiredUserDetails({ error, data }) {
    if (error) {
      console.log('error in wiredUserDetails### ' +error);
      this.error = error;
    } else if (data) {
      console.log('data in wiredUserDetails### ' +JSON.stringify(data));
      if (data.Completed_Mentor_Onboarding_Flow__c == true || data.Completed_Mentee_Onboarding_Flow__c == true) {
        this.showSearchPanel = true;
      }
    }
  }
  
 connectedCallback() {
    this.handleRetrieveFromCache();
    if (this.filtersAlwaysOn) {
      this.showFilters = true;
    }
    this.loading = true;
    this.handleRetrieveMentors();
  }

  bookmarkdmentorHandler(event) {
    const mentors = this.filteredMentors.map((ele) => {
      if (ele.Id === event.detail.user.Id) {
        ele.isBookmarked = event.detail.bookmark;
      }
    });
  }

  handleRetrieveFromCache() {

    if (localStorage.getItem('activeFilters')) {
      try {
        this.filterCategories = JSON.parse(localStorage.getItem('activeFilters'));

        const certificationsList = [];
        const typeOfMentoringList = [];
        const functionalCompetenciesList = [];
        const languagesList = [];
        const experiencesList = [];
        const egcsList = [];
        const greatCompetenciesList = [];
        const locationsList = [];

        this.filterCategories.forEach((filter) => {
          if (filter.filterField === CERTIFICATIONS_FIELD.fieldApiName) {
            certificationsList.push(filter.id);
          }
          if (filter.filterField === MENTEE_TYPE_FIELD.fieldApiName) {
            typeOfMentoringList.push(filter.id);
          }
          if (filter.filterField === FUNCTIONAL_COMPETENCIES_FIELD.fieldApiName) {
            functionalCompetenciesList.push(filter.id);
          }
          if (filter.filterField === LANGUAGES_FIELD.fieldApiName) {
            languagesList.push(filter.id);
          }
          if (filter.filterField === EXPERIENCES_FIELD.fieldApiName) {
            experiencesList.push(filter.id);
          }
          if (filter.filterField === EGC_FIELD.fieldApiName) {
            egcsList.push(filter.id);
          }
          if (filter.filterField === GREAT_COMPETENCIES_FIELD.fieldApiName) {
            greatCompetenciesList.push(filter.id);
          }
          if (filter.fieldApiName === MENTOR_LOCATION_FIELD.fieldApiName) {
            locationsList.push(filter.id);
          }
        });
        this.certifications = certificationsList;
        this.typeOfMentoring = typeOfMentoringList;
        this.functionalCompetencies = functionalCompetenciesList;
        this.languages = languagesList;
        this.experiences = experiencesList;
        this.egcs = egcsList;
        this.greatCompetencies = greatCompetenciesList;
        this.locations = locationsList;
      }
      catch (e) {
        console.log('Failed to Parse');
      }
    }
  }

  loadData() {
    //Called when a request is sent in order to refresh the apex to filter out that person
    refreshApex(this.wiredMentors);
  }

  hasBookmarkedMatch(matches) {
    for (let i in matches) {
      if (matches[i].Status__c == 'Bookmarked') {
        return true;
      }
    }
    return false;
  }

  handleRetrieveMentors() {
    if (this.filterCategories) {
      localStorage.setItem("activeFilters", JSON.stringify([...this.filterCategories]));
    }

    retrieveMentors({
      certifications: this.certifications,
      typeOfMentoring: this.typeOfMentoring,
      functionalCompetencies: this.functionalCompetencies,
      languages: this.languages,
      experiences: this.experiences,
      egcs: this.egcs,
      greatCompetencies: this.greatCompetencies,
      locations: this.locations,
      searchTerm: this.searchTerm
    })
      .then(response => {
        console.log("mentor data: ", response);
        if (response.filteredMentors && !response.mentors.length > 0) { //change
          this.processFilteredMentors(response.filteredMentors, this.searchTerm);//change
          this.filteredMentors = [];//change
        } else {//change
          const scoredUsers = response.mentors.map((user) => {
            return {
              ...user,
              topMentor: false,
              topCareerMentor: false,
              topValueMentor: false,
              salesLeader: false,
              isBookmarked: user.Mentoring_Matches__r && user.Mentoring_Matches__r.length > 0 && this.hasBookmarkedMatch(user.Mentoring_Matches__r)
            };
          });
          console.log("scoredUsers: ", scoredUsers);
          this.mentorsRaw = scoredUsers;
          this.processMentors(scoredUsers);
        }//change

      })
      .catch(error => {
        this.error = error;
        console.log("Error: ", error);
        this.loading = false;
        this.showUnsupportedBanner = true;
      });
  }

  processFilteredMentors(filteredMent, searchTerm) {//change start
    const normalizedSearchTerm = searchTerm.toLowerCase().trim();
    console.log("normalizedSearchTerm: ", normalizedSearchTerm);
    console.log("filteredMent: ", filteredMent);

    const exactNameMatches = filteredMent.filter(mentor =>
      mentor.Name && mentor.Name.toLowerCase() === normalizedSearchTerm
    );

    console.log("exactNameMatches: ", exactNameMatches);
    console.log("exactNameMatches.length: ", exactNameMatches.length);

    let errorMessage = '';

    if (exactNameMatches.length > 0) {
      console.log("exactNameMatches 1: ", exactNameMatches);
      const mentor = exactNameMatches[0];

      switch (mentor.filterReason) {
        case 'NO_CAPACITY':
          errorMessage = mentor.Name + ' ' + this.labels.capacityCriteriaLabel;
          break;
        case 'EXISTING_RELATIONSHIP':
          errorMessage = mentor.Name + ' ' + this.labels.mentormenteerelationshipCriteriaLabel;;
          break;
        // case 'MENTEE_ONLY':
        //   errorMessage = `${mentor.Name} has only registered as a 'mentee', so they are not appearing in search results.`;
        //   break;
        default:
          errorMessage = this.labels.couldntFindMentorsCriteriaLabel;
         
      }
      
    }else{
      console.log("exactNameMatches 2: ", exactNameMatches);
        errorMessage = this.labels.couldntFindMentorsCriteriaLabel;
      }

//console.log("errorMessage: ", errorMessage);
      if (errorMessage) {
        this.filterErrorMessage = errorMessage;
      }
  }//change end


  async processMentors(mentorResponse) {
    console.log("processMentors", mentorResponse.length);
    const parsedMentors = mentorResponse;

    for (let i = 0; i < parsedMentors.length; i++) {
      if (parsedMentors[i][CERTIFICATIONS_FIELD.fieldApiName]?.split(";")?.includes("Sales Leader Excellence Coach")) {
        parsedMentors[i].salesLeader = true;
      }
    }
    this.mentorData = parsedMentors;
    this.filterResults();
    this.loading = false;
  }

  @api async filterResults() {
    let initialsMentorsLenght = this.filteredMentors?.length;

    this.filteredMentors = this.mentorData;
    // Filter results based on search term
    console.log(' this.filteredMentors>>>>>>>>>>>>>>>>>' + JSON.stringify(this.filteredMentors));
    if (this.searchTerm) {
      const lowerCaseSearchTerm = this.searchTerm.toLowerCase();

      this.filteredMentors = this.filteredMentors.filter((mentor) => {
        const nameMatch = mentor.Name ? mentor.Name.toLowerCase().includes(lowerCaseSearchTerm) : false;
        const titleMatch = mentor.Title ? mentor.Title.toLowerCase().includes(lowerCaseSearchTerm) : false;
        const cityMatch = mentor.City ? mentor.City.toLowerCase().includes(lowerCaseSearchTerm) : false;
        const skillMatch = mentor.Skills__c ? mentor.Skills__c.toLowerCase().includes(lowerCaseSearchTerm) : false;
        const businessUnitMatch = mentor[BUSINESS_UNIT_FIELD.fieldApiName] ? mentor[BUSINESS_UNIT_FIELD.fieldApiName].toLowerCase().includes(lowerCaseSearchTerm) : false;
        const costCenterMatch = mentor[COST_CENTER_FIELD.fieldApiName] ? mentor[COST_CENTER_FIELD.fieldApiName].toLowerCase().includes(lowerCaseSearchTerm) : false;
        return nameMatch || titleMatch || cityMatch || businessUnitMatch || costCenterMatch || skillMatch;
      });
    } else {
      this.filteredMentors = this.mentorData;
    }
    if (this.filteredMentors.length < 2 && initialsMentorsLenght > this.filteredMentors.length && !this.isSearchTermChange) {
      const result = await filterMentorsInsufficientModal.open({
        size: 'medium',
        description: 'Insufficient Mentors returned'
      });
      if (result == 'reset') {
        this.resetFilters();
      }
    }
  }

  @api searchHandler(event) {
    this.searchTerm = event.detail;
    this.isSearchTermChange = true;
    this.handleRetrieveMentors();
  }


  filterChangedHandler(event) {
    console.log(' $$ C ' + event.detail);

    if (event.detail.remove) {
      console.log(' $ In remove');
      const theActiveFilters = JSON.parse(JSON.stringify([...this.filterCategories]));
      for (let i = 0; i < theActiveFilters.length; i += 1) {
        if (theActiveFilters[i].id === event.detail.remove.id) {
          theActiveFilters.splice(i, 1);
        }
      }
      this.filterCategories = theActiveFilters;
    } else {
      console.log(' $ In Add');
      if (this.filterCategories) {
        const theActiveFilters = JSON.parse(JSON.stringify([...this.filterCategories]));
        for (const elem of event.detail) {

          let exists = false;
          for (let i = 0; i < theActiveFilters.length; i += 1) {
            console.log(' $ In Add' + elem.id);
            console.log(' $ In Add' + theActiveFilters[i].id);
            try {
              if (theActiveFilters[i].id === elem.id) {
                exists = true;
                //theActiveFilters.splice(elem);
              }
            } catch (e) {
              console.log('Failed to Parse' + e);
            }

          }
          if (!exists) {
            theActiveFilters.push(elem);
          }

        }
        this.filterCategories = theActiveFilters;
      } else {
        this.filterCategories = event.detail;
      }
    }
    console.log(' $$ this.filterCategories ' + this.filterCategories);

    const certificationsList = [];
    const typeOfMentoringList = [];
    const functionalCompetenciesList = [];
    const languagesList = [];
    const experiencesList = [];
    const egcsList = [];
    const greatCompetenciesList = [];
    const locationsList = [];

    this.filterCategories.forEach((filter) => {
      if (filter.filterField === CERTIFICATIONS_FIELD.fieldApiName) {
        certificationsList.push(filter.id);
      }
      if (filter.filterField === MENTEE_TYPE_FIELD.fieldApiName) {
        typeOfMentoringList.push(filter.id);
      }
      if (filter.filterField === FUNCTIONAL_COMPETENCIES_FIELD.fieldApiName) {
        functionalCompetenciesList.push(filter.id);
      }
      if (filter.filterField === LANGUAGES_FIELD.fieldApiName) {
        languagesList.push(filter.id);
      }
      if (filter.filterField === EXPERIENCES_FIELD.fieldApiName) {
        experiencesList.push(filter.id);
      }
      if (filter.filterField === EGC_FIELD.fieldApiName) {
        egcsList.push(filter.id);
      }
      if (filter.filterField === GREAT_COMPETENCIES_FIELD.fieldApiName) {
        greatCompetenciesList.push(filter.id);
      }
      if (filter.fieldApiName === MENTOR_LOCATION_FIELD.fieldApiName) {
        locationsList.push(filter.id);
      }
    });
    this.certifications = certificationsList;
    this.typeOfMentoring = typeOfMentoringList;
    this.functionalCompetencies = functionalCompetenciesList;
    this.languages = languagesList;
    this.experiences = experiencesList;
    this.egcs = egcsList;
    this.greatCompetencies = greatCompetenciesList;
    this.locations = locationsList;
  }

  resetFilters() {
    this.filterCategories = '';
    localStorage.clear();
    localStorage.setItem("activeFilters", '');

    this.certifications = [];
    this.typeOfMentoring = [];
    this.functionalCompetencies = [];
    this.languages = [];
    this.experiences = [];
    this.egcs = [];
    this.greatCompetencies = [];
    this.locations = [];

    this.filterChangedHandler({ detail: [] });
    this.filterResults();
    this.template.querySelector("c-filter-panel").resetFilters();
    this.handleRetrieveMentors();
  }

  calculateYears(hireDate) {
    const yearDifMs = Date.now() - hireDate;
    const yearDate = new Date(yearDifMs);
    return Math.abs(yearDate.getUTCFullYear() - 1970);
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  toggleUserView() {
    this.showUser = !this.showUser;
  }

  userSelectedHandler(event) {


    this[NavigationMixin.Navigate]({
      type: "standard__recordPage",
      attributes: {
        recordId: event.detail.user.Id,
        actionName: "view",
      },
    });
  }
  handleOpenRecordClick(event) {

  }

  // GETTERS
  get noMentorsFound() {
    if (!this.filteredMentors) {
      return true;
    }
    if (!this.filteredMentors.length > 0) {
      return true;
    }
    return false;
  }

  get isMobile() {
    return screen.width <= 768;
  }

  get availableMentors() {
    const theSortedMentors = JSON.parse(JSON.stringify([...this.filteredMentors]));

    for (let i = 0; i < theSortedMentors.length; i++) {
      if (theSortedMentors[i][CERTIFICATIONS_FIELD.fieldApiName]?.split(";")?.includes("Sales Leader Excellence Coach")) {
        theSortedMentors[i].salesLeader = true;
      }
    }
    let mentorsToreturn = [];
    if (theSortedMentors.length > 50) mentorsToreturn = theSortedMentors.slice(0, 49);
    else mentorsToreturn = theSortedMentors;
    return mentorsToreturn;
  }

  get noAvailableMentors() {
    return this.availableMentors ? this.availableMentors.length === 0 : true;
  }

  get getContainerClass() {
    if (this.isMobile) {
      return "slds-is-relative container";
    }
    return "slds-is-relative container searchbar-edit";
  }
}