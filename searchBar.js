import { LightningElement, track } from "lwc";

import PlaceholderLabel from '@salesforce/label/c.search_placeholder';
import PlaceholderMobileLabel from '@salesforce/label/c.search_placeholder_mobile';

export default class SearchBar extends LightningElement {
  @track searchTerm;
  timer;

  label = {
    PlaceholderLabel,
    PlaceholderMobileLabel,
  };

  searchTermChangeHandler(event) {
    this.searchTerm = event.target.value;
    clearTimeout(this.timer);
    // eslint-disable-next-line
    this.timer = setTimeout(() => {
      this.dispatchEvent(
        new CustomEvent("search", { detail: this.searchTerm })
      );
    }, 500);
  }

  filterClickedHandler() {
    this.dispatchEvent(new CustomEvent("filterclicked"));
  }

  get isMobile() {
    return screen.width <= 768;
  }
}