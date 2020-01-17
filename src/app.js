// income/expense calculator
// es5

/************************************************
*   BUDGET CONTROLLER
*/
var budgetController = (function() {

    var Expense = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    // calculates percentage of expense item relative to total income
    Expense.prototype.calcPerc = function(totalIncome) {
        if(totalIncome > 0)
            this.percentage = Math.round((this.value / totalIncome) * 100);
        else 
            this.percentage = -1;
    };

    Expense.prototype.getPerc = function() {
        return this.percentage;
    }

    var Income = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };

    // calculates total income and total expenses
    var calculateTotal = function(type) {
        var sum = 0;

        data.allItems[type].forEach(function(current) {
            sum += current.value;
        });

        data.totals[type] = sum;
    };

    var data = {
        allItems: {
            exp: [],
            inc: []
        },

        totals: {
            exp: 0,
            inc: 0
        },

        budget: 0,
        percentage: -1
    };

    return {
        addItem: function(type, des, val) {
            var newItem, ID;

            // 1. create new ID --> ID = last ID + 1
            if(data.allItems[type].length > 0)
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
            else 
                ID = 0;

            // 2. create new item based on type (inc/exp)
            if(type === 'exp') {
                newItem = new Expense(ID, des, val);
            }

            else if(type === 'inc') {
                newItem = new Income(ID, des, val);
            }

            // 3. push into our data structure
            data.allItems[type].push(newItem);

            // 4. return the new item
            return newItem;
        },

        deleteItem: function(type, id) {
            var ids, index;

            // get index of id in array
            ids = data.allItems[type].map(function(current) {
                return current.id;
            });

            index = ids.indexOf(id);

            if(index !== -1) {
                data.allItems[type].splice(index, 1);
            }
        },

        calculateBudget: function() {
            // 1. calculate total income and total expenses
            calculateTotal('inc');
            calculateTotal('exp');

            // 2. calculate budget = income - expenses
            data.budget = data.totals.inc - data.totals.exp;

            // calculate percentage of income spent
            if(data.totals.inc > 0) 
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            else
                data.percentage = -1;
        },

        calculatePercentages: function() {
            data.allItems.exp.forEach(function(current) {
                current.calcPerc(data.totals.inc);
            });
        },

        getPercentages: function() {
            var allPerc = data.allItems.exp.map(function(current) {
                return current.getPerc();
            });

            return allPerc;
        },

        getBudget: function() {
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            }
        },
    };
    
})();


/************************************************
*   UI CONTROLLER
*/
var UIController = (function() {

    var DOMstrings = {
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputBtn: '.add__btn',
        incomeContainer: '.income__list',
        expenseContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expenseLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        expPercLabel: '.item__percentage',
        dateLabel: '.budget__title--month'
    };
    
    /* formats number with the ff. rules:
        > +/- before number
        > 2 decimal places
        > separate thousands place with comma
    */
    // FIXME: formatting of numbers in the millions
    var formatNumber = function(num, type) {
        var numSplit, sign;

        num = Math.abs(num);        // |num|
        num = num.toFixed(2);       // 2 decimal places
        numSplit = num.split('.');

        int = numSplit[0];          // value before decimal point

        if(int.length > 3) {    
            int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3);
        }
        
        dec = numSplit[1];          // value after decimal point
        
        return (type === 'exp' ? sign = '-' : sign = '+') + ' ' + int + '.' + dec;
    };

    // forEach method for node lists
    var nodeListForEach = function(list, callback) {
        for(var i = 0; i < list.length; i++) {
            callback(list[i], i);
        }
    };

    return {
        getInput: function() {
            return {
                type: document.querySelector(DOMstrings.inputType).value,  // either inc or exp
                description: document.querySelector(DOMstrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
            };
        },

        addListItem: function(obj, type) {
            var html, newHtml, element;

            // 1. create html string w/ placeholder text
            if(type === 'inc') {
                element = DOMstrings.incomeContainer;

                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div> <div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }

            else if(type === 'exp') {
                element = DOMstrings.expenseContainer;

                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }
                
            // 2. replace the placeholder text w/ some actual data
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));

            // 3. insert the html into the DOM
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
            
        },

        deleteListItem: function(selectorID) {
            var elem;
            
            // find parent then remove child
            elem = document.getElementById(selectorID);
            elem.parentNode.removeChild(elem);
        },

        clearFields: function() {
            var fields, fieldsArr;
            
            // 1. returns a list (w/c doesnt have array methods)
            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);
            
            // 2. convert list to array
            fieldsArr = Array.prototype.slice.call(fields);

            // 3. set values of each array to empty string
            fieldsArr.forEach(function(current, index, array) {
                current.value = "";
            });

            // 4. set focus back on description input box
            fieldsArr[0].focus();
        },

        displayBudget: function(obj) {
            var type; 

            obj.budget > 0 ? type = 'inc' : type = 'exp';

            document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);
            document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
            document.querySelector(DOMstrings.expenseLabel).textContent = formatNumber(obj.totalExp, 'exp');
            
            if(obj.percentage > 0)
                document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage;
            else
                document.querySelector(DOMstrings.percentageLabel).textContent = '---';
        },

        displayPercentages: function(percentages) {
            var fields = document.querySelectorAll(DOMstrings.expPercLabel);

            nodeListForEach(fields, function(current, index) {
                if(percentages[index] > 0)
                    current.textContent = percentages[index] + '%';
                else
                    current.textContent = '---';
            });

        },

        displayMonth: function() {
            var now, year, month, months;
            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

            now = new Date();
            month = now.getMonth();
            year = now.getFullYear();
            document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ' ' + year;
            
        },

        changedType: function() {
            var fields;

            fields = document.querySelectorAll(
                DOMstrings.inputType + ',' +
                DOMstrings.inputDescription + ',' +
                DOMstrings.inputValue);
                
            nodeListForEach(fields, function(current) {
                current.classList.toggle('red-focus');
            });

            document.querySelector(DOMstrings.inputBtn).classList.toggle('red');
        },

        getDOMstrings: function() {
            return DOMstrings;
        }
    };

})();


/************************************************
*   GLOBAL APP CONTROLLER
*/
var controller = (function(budgetCtrl, UICtrl) {

    var setupEventListeners = function() {
        var DOM = UICtrl.getDOMstrings();

        // for clicking check button to add item
        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

        // for pressing enter key to add item
        document.addEventListener('keypress', function(event) {
            // .which is for older browsers who dont have keycode property
            if(event.keyCode === 13 || event.which === 13) {
                ctrlAddItem();
            }        
        });
        
        // put event handler on .container
        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

        // for colour change in input boxes
        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);

    };

    var updateBudget = function() {
        // 1. calculate budget
        budgetCtrl.calculateBudget();

        // 2. return budget
        var budget = budgetCtrl.getBudget();

        // 3. display budget on the UI
        UICtrl.displayBudget(budget);
    };

    var updatePercentages = function() {
        // 1. calculate percentages
        budgetCtrl.calculatePercentages();

        // 2. get percentages
        var percentages = budgetCtrl.getPercentages();

        // 3. update UI with new percentages
        UICtrl.displayPercentages(percentages);
    };

    var ctrlAddItem = function() {
        var input, newItem; 

        // 1. get input data
        input = UICtrl.getInput();

        if(input.description !== "" && !isNaN(input.value) && input.value > 0) {
            // 2. add item to budget controller
            newItem = budgetCtrl.addItem(input.type, input.description, input.value);

            // 3. add new item to UI
            UICtrl.addListItem(newItem, input.type);

            // 4. clear fields
            UICtrl.clearFields();
            
            // 5. calculate and update budget
            updateBudget();

            // 6. calculate and update percentages
            updatePercentages();
        }
    };

    var ctrlDeleteItem = function(event) {
        var itemID, splitID, type, id;

        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;

        if(itemID) {
            splitID = itemID.split('-');
            type = splitID[0];
            id = parseInt(splitID[1]);

            // 1. delete item from data structure
            budgetCtrl.deleteItem(type, id);

            // 2. delete item from UI
            UICtrl.deleteListItem(itemID);

            // 3. update and show new budget
            updateBudget();

            // 4. calculate and update percentages
            updatePercentages();
        }
    };

    return {
        init: function() {
            UICtrl.displayMonth();
            UICtrl.displayBudget({
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: 0
            })
            
            setupEventListeners();
        }
    };

})(budgetController, UIController);

controller.init();
