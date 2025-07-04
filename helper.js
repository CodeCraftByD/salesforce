const dataFilterDefaults = {
    defaultHeaderTitle: 'DataFilter'
};

const SOQL_OPERATORS = new Map([
    ["=", "Equals"],
    ["!=", "Not equals"],
    ["<", "Less than"],
    [">", "Greater than"],
    [">=", "Greater or equal"],
    [">=", "Greater or equal"],
    ["LIKE", "Contains"]
]);

export { dataFilterDefaults, SOQL_OPERATORS };