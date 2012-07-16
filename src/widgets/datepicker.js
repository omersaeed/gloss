define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/moment',
    './widget',
    './formwidget',
    './basemenu',
    './textbox',
    'text!./datepicker/datepicker.html',
    'tmpl!./datepicker/monthview.mtpl',
    'css!./datepicker/datepicker.css'
], function($, _, moment, Widget, FormWidget, BaseMenu, TextBox, widgetMarkup,
    monthViewTemplate) {
    var invalidDate = moment('asdfasdf', 'YYYY-MM-DD').format('YYYY-MM-DD');

    var DatePicker = FormWidget.extend({
        defaults: {
            date: moment(),
            format: 'YYYY-MM-DD',
            populateEmptyNode: true
        },
        nodeTemplate: widgetMarkup,
        create: function() {
            var self = this;

            self.$node.addClass('datepicker');

            self.options._selected = null;

            self.menu = BaseMenu(self.$node.find('.datepicker-menu'))
                .on('click', 'h4 .left, h4 .right', function() {
                    var date = self.options.date,
                        forward = $(this).hasClass('right');
                    self.set('date', date.add('months', forward? 1 : -1));
                }).on('click', '.monthview td', function() {
                    var selectedDate = self.monthView.tdElToDate(this);
                    if (selectedDate) {
                        self.setValue(selectedDate);
                    }
                });

            self.input = TextBox(self.$node.children('input[type=text]'))
                .on('blur', self._verifyInputValue)
                .on('focus click', self.menu.show)
                .on('keydown', function(evt) {
                    if (Widget.identifyKeyEvent(evt) in {enter:'', tab:''}) {
                        self._verifyInputValue();
                        self.menu.hide();
                    }
                });

            self.monthView = DatePicker.MonthView(
                self.menu.$node.find('.monthview').empty(),
                {date: self.options.date});

            self.onPageClick(self.menu.hide, {once: false});

            self.update();
        },
        _verifyInputValue: function(evt) {
            var inputDate = moment(this.input.getValue(), this.options.format);
            if (inputDate) {
                this.setValue(inputDate.format('YYYY-MM-DD') !== invalidDate?
                        inputDate : this.getValue());
            }
        },
        getValue: function() {
            return this.options._selected &&
                this.options._selected.format(this.options.format);
        },
        setValue: function(date) {
            date = moment(date || null);
            this.set('_selected', date);
            this.input.setValue(date && date.format(this.options.format));
        },
        updateWidget: function(updated) {
            var date = this.options.date, selected = this.options._selected;
            if (updated.date) {
                this.menu.$node.find('h4 .title').text(date.format('MMMM YYYY'));
                this.monthView.set('date', date);
            }
            if (updated._selected) {
                this.monthView.set('_selected', selected);
                if (selected) {
                    this.set('date', moment(selected));
                }
            }
        }
    });

    DatePicker.MonthView = Widget.extend({
        defaults: {
            date: moment()
        },
        nodeTemplate: monthViewTemplate,
        create: function() {
            this.$node.addClass('monthview');
            this.update();
        },
        tdElToDate: function(td) {
            var _date = +$(td).text(), date;
            if (!isNaN(_date)) {
                date = moment(this.options.date).date(_date);
                if (date.month() === this.options.date.month()) {
                    return date;
                }
            }
        },
        updateWidget: function(updated) {
            var date = this.options.date, selected = this.options._selected;

            this._selectedDate = DatePicker.sameMonth(date, selected)?
                selected.date() : null;

            if (updated.date && date) {
                this._num = DatePicker.numDaysInMonth(date);
                this._first = moment(
                    date.year() + '-' + (date.month()+1) + '-1',
                    'YYYY-MM-DD');
                this._numRows = Math.ceil((this._first.day() + this._num) / 7);
                this.render();
            }
            if (updated._selected) {
                this.render();
            }
        }
    });

    // got this little gem here: http://stackoverflow.com/a/1811003/5377
    // the 'date' params is an instance of moment
    DatePicker.numDaysInMonth = function(date) {
        return (/8|3|5|10/).test(date.month())?  // 30 days has sept, apr, june, & nov
            30 : 
            date.month() !== 1?
                31 :                            // all the rest have 31...
                (date.isLeapYear()? 29 : 28);   // except feb
    };

    DatePicker.sameMonth = function(date1, date2) {
        if (date1 && date2) {
            return date1.year()===date2.year() && date1.month()===date2.month();
        }
    };

    return DatePicker;
});
