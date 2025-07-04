import { LightningElement, api, wire, track } from 'lwc';
import { dataFilterDefaults, SOQL_OPERATORS } from './helper';
import DataFilterWrongChannelName from '@salesforce/label/c.DataFilterWrongChannelName';
import DataFilterWrongFilters from '@salesforce/label/c.DataFilterWrongFilters';
import DataFilterWrongFiltersDoNotMatchFilterLogic from '@salesforce/label/c.DataFilterWrongFiltersDoNotMatchFilterLogic';
import DataFilterApplyFiltersButton from '@salesforce/label/c.DataFilterApplyFiltersButton';
import DataFilterProcessingExceptionMessage from '@salesforce/label/c.DataFilterProcessingExceptionMessage';
import getObjectAndFieldsInfo from '@salesforce/apex/DataFilterController.getObjectAndFieldsInfo';
import { publishEvent } from 'c/pubsub';
import { showToastError } from 'c/fcUtils';

export default class DataFilter extends LightningElement {

    /*api*/
    @api channelName;
    @api headerTitle;
    @api hideApplyFiltersButton;
    @api filterLogic;
    @api filters;
    @api numberOfColumns;
    @api height;
    @api hideBorder = false;
    @api publishFilterObject = false;

    /*private*/
    objectApiName;
    labels = {
        DataFilterWrongChannelName,
        DataFilterWrongFilters,
        DataFilterWrongFiltersDoNotMatchFilterLogic,
        DataFilterApplyFiltersButton,
        DataFilterProcessingExceptionMessage
    };
    filterDataTypes = ['date', 'text', 'number', 'picklist','buttonlist'];
    rangeSupportedDataTypes = ['date', 'number'];
    validComponentState = false;
    wrongConfigurationMessage;
    @track configurationFields = [];
    labelFromRange = 'From :';
    labelToRange = 'To :';
    fieldLabelsLoaded = false;
    defaultOperator = '=';

    /*getters only*/
    get title() {
        return this.headerTitle;
    }

    get showApplyFiltersButton() {
        return !this.hideApplyFiltersButton;
    }

    get configurationFieldsArray() {
        let data = [];
        console.log('this.configurationFields :',JSON.stringify(this.configurationFields));
        for (let i = 0; i < this.configurationFields.length; i += this.numberOfColumns) {
            data.push({key : i, data : this.configurationFields.slice(i, i + this.numberOfColumns)});
        }
        console.log('data :',JSON.stringify(data));
        return data;
    }

    get dataFilterHeightStyle(){
        return this.height ? `height:${this.height}px`: '';
    }

    get cardClass() {
        return this.hideBorder ? 'no-border-card' : '';
    }

    get paddingClass() {
        return this.hideBorder ? '' : 'slds-p-right_medium slds-p-left_medium';
    }

    connectedCallback() {
        if (!this.isValidConfiguration()) {
            return;
        }
        this.validComponentState = true;
        try {
            this.prepareConfigurationLogic();
            this.populateFieldLabels();
        } catch (error) {
            this.validComponentState = false;
            this.wrongConfigurationMessage = this.labels.DataFilterProcessingExceptionMessage;
        }
        
    }

    isValidConfiguration() {
        if (!this.channelName) {
            this.wrongConfigurationMessage = this.labels.DataFilterWrongChannelName;
            return false;
        } else if (!this.isValidFilters()) {
            this.wrongConfigurationMessage = this.labels.DataFilterWrongFilters;
            return false;
        } else if (this.filterLogic && !this.isFilterLogicMatchFilters()) {
            this.wrongConfigurationMessage = this.labels.DataFilterWrongFiltersDoNotMatchFilterLogic;
            return false;
        }
        this.wrongConfigurationMessage = '';
        return true;
    }

    prepareConfigurationLogic() {
        if (!this.numberOfColumns) {
            this.numberOfColumns = 1;
        }
        let fieldsConfiguration = JSON.parse(this.filters);
        let fieldConfig;
        Object.getOwnPropertyNames(fieldsConfiguration).forEach((fieldConfigName, index) => {
            fieldConfig = fieldsConfiguration[fieldConfigName];

            // Do not proceed with wrong data type.
            if (!this.filterDataTypes.includes(fieldConfig.type.toLowerCase())) {
                return;
            }

            if (fieldConfigName.includes('.')) {
                fieldConfig.objectApiName = fieldConfigName.split('.')[0];
                fieldConfig.fieldApiName = fieldConfigName.split('.')[1];
                this.objectApiName = fieldConfig.objectApiName;
            } else {
                fieldConfig.fieldApiName = fieldConfigName;
            }

            fieldConfig.fieldValue;
            fieldConfig.containerClass = 'slds-grid_vertical-align-end slds-size_1-of-' + this.numberOfColumns;

            // Reset isRange to false if provided data type is not supported for range.
            if (fieldConfig.isRange && !this.rangeSupportedDataTypes.includes(fieldConfig.type.toLowerCase())) {
                fieldConfig.isRange = false;
            }
            if (fieldConfig.type == 'picklist') {
                fieldConfig.isCombobox = true;
            }
            if(fieldConfig.type == 'buttonlist'){
                fieldConfig.isButtonList = true;
            }
            if (fieldConfig.type == 'date' && fieldConfig.min) {
                fieldConfig.min = this.handleCustomDateTokens(fieldConfig.min, true);
            }
            if (fieldConfig.type == 'date' && fieldConfig.max) {
                fieldConfig.max = this.handleCustomDateTokens(fieldConfig.max, false);
            }
            if (!fieldConfig.op) {
                fieldConfig.op = this.defaultOperator;
            }
            // Mark place for filter condition. Later will replace by result condition.
            if (this.filterLogic) {
                this.filterLogic = this.filterLogic.replace(index+1, index + 1 + fieldConfig.fieldApiName);
            }
            this.configurationFields.push(fieldConfig);
        });
    }

    populateFieldLabels() {
        if (this.objectApiName) {
            // Process those fields that have not label provided.
            let fieldApiNames = this.configurationFields.filter(function(fieldConfig) {
                return !fieldConfig.label;
            })
            .map(function(fieldConfig) {
                return fieldConfig.fieldApiName;
            });

            getObjectAndFieldsInfo({objectApiName: this.objectApiName, fieldApiNames: fieldApiNames})
            .then(data =>{
                if (data) {
                    this.configurationFields.forEach((fieldConfig) => {
                        if (!fieldConfig.label) {
                            fieldConfig.label = data[fieldConfig.fieldApiName];
                        }
                        fieldConfig.objectLabel = data.objectLabel;
                        fieldConfig.uiLabel = this.buildUILabelForField(fieldConfig);
                    });
                    this.fieldLabelsLoaded = true;
                }
            })
            .catch((err) => {
                showToastError(this, err);
            });
        } else {
            // Means that no object name provided in any field configuration.
            this.configurationFields.forEach((fieldConfig) => {
                fieldConfig.uiLabel = this.buildUILabelForField(fieldConfig);
            });
            this.fieldLabelsLoaded = true;
        }
    }

    isValidFilters() {
        if (this.filters) {
            try {
                let validationArr = JSON.parse(this.filters);
            } catch (ex) {
                return false;
            }
            return true;
        }
        return false;
    }

    isFilterLogicMatchFilters() {
        // Get only names per field configuration. Because we only need to count them.
        let filters = Object.getOwnPropertyNames(JSON.parse(this.filters));
        // Get only numbers from filterLogic var into array.
        var filterLogicConditions = this.filterLogic.match(/\d+/g);
        return filters.length == filterLogicConditions.length;
    }

    handleCustomDateTokens(date, fromFirstDay) {
        if (!date.startsWith('$')) {
            // No custom token is provided
            return date;
        }
        let dateConfig = date.substring(
            date.indexOf("{") + 1, 
            date.lastIndexOf("}")
        );
        dateConfig = dateConfig.replaceAll(' ', '');

        let resultDate;
        let operator;
        let instanceToAdd;
        let numberToAdd;

        if (dateConfig.includes('+')) {
            operator = '+';
        } else if (dateConfig.includes('-')) {
            operator = '-';
        }

        // If operator is empty then it will return the token itself.
        let token = dateConfig.split(operator)[0];
        
        switch (token) {
            case 'today':
                resultDate = this.getTodayDate();
                break;
            case 'yesterday':
                resultDate = this.getYesterdayDate();
                break;
            case 'tomorrow':
                resultDate =  this.getTomorrowDate();
                break;
            case 'previous_month':
                resultDate = this.getPreviousMonth(fromFirstDay);
                break;
            case 'next_month':
                resultDate = this.getNextMonth(fromFirstDay);
                break;
            case 'previous_year':
                resultDate = this.getPreviousYear(fromFirstDay);
                break;
            case 'next_year':
                resultDate = this.getNextYear(fromFirstDay);
                break;
            default:
                // if incorrect token is provided
                return null;
        }

        if (operator) {
            let addDateConfig = this.buildAddDateConfig(dateConfig, operator);
            instanceToAdd = addDateConfig[0];
            numberToAdd = addDateConfig[1];
            switch (instanceToAdd.toLowerCase()) {
                case 'day':
                    resultDate = this.addDaysTo(resultDate, operator + numberToAdd);
                    break;
                case 'month':
                    resultDate = this.addMonthsTo(resultDate, operator + numberToAdd);
                    break;
                case 'year':
                    resultDate =  this.addYearsTo(resultDate, operator + numberToAdd);
                    break;
            }
        }
        return resultDate.toISOString().slice(0, 10);
    }

    buildAddDateConfig(dateConfig, operator) {
        let addCongfig = dateConfig.split(operator)[1];
        let instanceToAdd = addCongfig.split(':')[1];
        let numberToAdd = addCongfig.split(':')[0]; 
        return [instanceToAdd, numberToAdd];
    }

    buildUILabelForField(fieldConfig) {
        let uiLabel = fieldConfig.objectLabel ? fieldConfig.objectLabel + ' : ' + fieldConfig.label : fieldConfig.label;
        if (fieldConfig.isRange) {
            uiLabel += ' : Range';
        } else {
            uiLabel += ' : ' + SOQL_OPERATORS.get(fieldConfig.op);
        }
        return uiLabel;
    }

    handleOnChangeField(event) {
        let fieldConfig = this.configurationFields.find(fc => {
            return fc.fieldApiName === event.target.dataset.id
        });
        if (fieldConfig.isRange) {
            let dateType = event.target.label;
            if (dateType == this.labelFromRange) {
                fieldConfig.fromRangeValue = event.target.value;
            } else if (dateType == this.labelToRange) {
                fieldConfig.toRangeValue = event.target.value;
            }
        } else {
            fieldConfig.fieldValue =  event.target.value;
            fieldConfig.fieldValueRecord = event.detail;
        }
        
        if(this.hideApplyFiltersButton) {
            this.buildQuery();
        }
    }

    buildQuery() {
        // Verify fields to not execute building fields logic if incorrect values are presented.
        if (!this.areInputFiledsValid()) {
            return;
        }
        let finalQuery;
        if (this.filterLogic) {
            finalQuery = this.buildQueryWithFilterLogic();
        } else {
            finalQuery = this.buildQueryWithoutFilterLogic();
        }

        window.clearTimeout(this.delayTimeout);
        this.delayTimeout = setTimeout(() => {
            if (!this.areInputFiledsValid()) {
                return;
            }
            console.log(finalQuery);
            publishEvent(this.channelName, {whereClause: finalQuery});
        }, 1500);
    }

    areInputFiledsValid() {
        let isValid = true;
        let fields = this.template.querySelectorAll('lightning-input');
        fields.forEach(field => {
            if(!field.checkValidity()) {
                field.reportValidity();
                isValid = false;
            }
        });
        return isValid;
    }

    buildQueryWithoutFilterLogic() {
        if (this.publishFilterObject) {
            //this condition returns the final SOQL query as an Object
            let result = {
                finalQuery: []
            };

            for (let i = 0; i < this.configurationFields.length; i++) {
                const fieldConfig = this.configurationFields[i];

                const isValueMissing = (!fieldConfig.fieldValue && !fieldConfig.isRange) || 
                    (fieldConfig.isRange && !fieldConfig.fromRangeValue && !fieldConfig.toRangeValue);

                if (isValueMissing) {
                    continue;
                }

                const condition = this.buildCondition(fieldConfig, result.finalQuery.length > 0, false);
                if (condition) {
                    result.finalQuery.push(condition);
                }
            }
            
            return result;
        } else {
            let finalQuery = '';
            let queryInitialLength = finalQuery.length;
            for (let i = 0; i < this.configurationFields.length; i++) {
                if ((!this.configurationFields[i].fieldValue && !this.configurationFields[i].isRange) || 
                    (this.configurationFields[i].isRange && !this.configurationFields[i].fromRangeValue && !this.configurationFields[i].toRangeValue)) {
                    continue;
                }
                if (finalQuery.length == queryInitialLength) {
                    finalQuery += this.buildCondition(this.configurationFields[i], false, false);
                } else {
                    finalQuery += this.buildCondition(this.configurationFields[i], true, false);
                }
            }
            return finalQuery;
        }
    }

    buildQueryWithFilterLogic() {
        let finalQuery = this.filterLogic;
        let condition;
        for (let i = 0; i < this.configurationFields.length; i++) {
            if (!this.configurationFields[i].fieldValue) {
                this.configurationFields[i].fieldValue = null;
            }
            condition = this.buildCondition(this.configurationFields[i], false, true);
            finalQuery = finalQuery.replace(i + 1 + this.configurationFields[i].fieldApiName, condition);
        }
        return finalQuery;
    }

    buildCondition(fieldConfig, addAnd, buildRangeEmptyValues) {

        if (this.publishFilterObject) {
            if (fieldConfig.isRange) {
                const conditions = [];

                if (fieldConfig.fromRangeValue) {
                    conditions.push({
                        field: fieldConfig.fieldApiName,
                        operator: '>=',
                        value: this.convertValue(fieldConfig.fromRangeValue)
                    });
                }

                if (fieldConfig.toRangeValue) {
                    conditions.push({
                        field: fieldConfig.fieldApiName,
                        operator: '<=',
                        value: this.convertValue(fieldConfig.toRangeValue)
                    });
                }
                return { conditions };
            } else {
                return {
                    field: fieldConfig.fieldApiName,
                    operator: fieldConfig.op || '=',
                    value: this.convertValue(fieldConfig.fieldValue)
                };
            }
        } else {
            let condition = '';
            if (addAnd) {
                condition = ' AND '
            }
            if (fieldConfig.type === 'text' || fieldConfig.type === 'picklist' || (fieldConfig.type === 'buttonlist' && fieldConfig.fieldValueRecord?.type == 'text')) {
                condition += this.buildTextBasedCondition(fieldConfig);
            } else if (fieldConfig.isRange) {
                condition += this.buildRangeCondition(fieldConfig, buildRangeEmptyValues);
            } else {
                condition += fieldConfig.fieldApiName + ' ' + (fieldConfig.fieldValueRecord?.op || fieldConfig.op) + ' ' + fieldConfig.fieldValue;
            }
            return condition;
        }
    }

    convertValue(val) {
        if (val === 'true') {
            return true;
        }
        if (val === 'false') {
            return false;
        }
        if (!isNaN(val)) {
            return Number(val);
        }
        return val;
    }

    buildTextBasedCondition(fieldConfig) {
        if (fieldConfig.op.toLowerCase() == 'like') {
            return fieldConfig.fieldApiName + ' ' + ( fieldConfig.fieldValueRecord?.op || fieldConfig.op ) + ' \'%' + fieldConfig.fieldValue + '%\'';
        }
        return fieldConfig.fieldApiName + ' ' + (fieldConfig.fieldValueRecord?.op || fieldConfig.op ) + ' \'' + fieldConfig.fieldValue + '\'';
    }

    buildRangeCondition(fieldConfig, buildIfEmpty) {
        let fromValue = fieldConfig.fromRangeValue ? fieldConfig.fromRangeValue : null;
        let toValue = fieldConfig.toRangeValue ? fieldConfig.toRangeValue : null;
        if (fieldConfig.isDateTime) {
            fromValue = fromValue ? fromValue + 'T00:00:00Z' : fromValue;
            toValue = toValue ? toValue + 'T23:59:59Z' : toValue;
        }
        let condition;
        if (fromValue || buildIfEmpty) {
            condition = fieldConfig.fieldApiName + ' >= ' + fromValue;
        }
        if (toValue || buildIfEmpty) {
            condition = condition ? condition + ' AND ' + fieldConfig.fieldApiName + ' <= ' + toValue : fieldConfig.fieldApiName + ' <= ' + toValue;
        }
        if (condition) {
            condition = '( ' + condition + ' )'; 
        }
        return  condition;
    }

    getTodayDate() {
        return new Date();
    }

    getTomorrowDate() {
        let today = new Date();
        today.setDate(today.getDate() + 1);
        return today;
    }

    getYesterdayDate() {
        let today = new Date();
        today.setDate(today.getDate() - 1);
        return today;
    }

    getPreviousMonth(fromFirstDay) {
        let today = new Date();
        if (fromFirstDay) {
            // will result in the first day of the previous month
            today.setDate(1);
            today.setMonth(today.getMonth()-1);
        } else {
            // will result in the last day of the previous month
            today.setDate(0);
        }
        return today;
    }

    getNextMonth(fromFirstDay) {
        let today = new Date();
        if (fromFirstDay) {
            // will result in the first day of the next month
            today.setMonth(today.getMonth()+1);
            today.setDate(1);
        } else {
            // will result in the last day of the next month
            today.setMonth(today.getMonth()+2);
            today.setDate(0);
        }
        return today;
    }

    getPreviousYear(fromFirstDay) {
        let date = new Date();
        let currentYear = date.getFullYear();
        if (fromFirstDay) {
            // will result in the first day of the previous year
            date.setDate(1);
            date.setMonth(0);
            date.setFullYear(currentYear - 1);
        } else {
            // will result in the last day of the previous year
            date.setDate(31);
            date.setMonth(11);
            date.setFullYear(currentYear - 1);
        }
        return date;
    }

    getNextYear(fromFirstDay) {
        let date = new Date();
        let currentYear = date.getFullYear();
        if (fromFirstDay) {
            // will result in the first day of the previous year
            date.setDate(1);
            date.setMonth(0);
            date.setFullYear(currentYear + 1);
        } else {
            // will result in the last day of the previous year
            date.setDate(31);
            date.setMonth(11);
            date.setFullYear(currentYear + 1);
        }
        return date;
    }

    addDaysTo(date, numberOfDays) {
        date = date.setDate(date.getDate() + Number(numberOfDays))
        return new Date(date);
    }

    addMonthsTo(date, numberOfMonths) {
        date = date.setMonth(date.getMonth() + Number(numberOfMonths));
        return new Date(date);
    }

    addYearsTo(date, numberOfYears) {
        date = date.setFullYear(date.getFullYear() + Number(numberOfYears));
        return new Date(date);
    }
}