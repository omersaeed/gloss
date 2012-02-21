define([
    'vendor/jquery',
    'vendor/gloss/widgets/draggable'
], function($, Draggable) {
    return $.extend({}, Draggable, {
        __mixin__: function(base, prototype, mixin) {
            Draggable.__mixin__.call(this, base, prototype, mixin);
            if (prototype.defaults.draggable.clone == null) {
                prototype.defaults.draggable.clone = true;
            }
        },
        _draggableCloneEl: function($el) {
            var $tbody = $(null),
                $origTable = $el.closest('table'),
                $table = $($origTable[0].cloneNode(false));
            if ($el.closest('tbody')) {
                $tbody = $($el.closest('tbody')[0].cloneNode(false))
                            .appendTo($table);
            }
            $el.clone(false, false).appendTo($tbody);
            return $table.width($origTable.width())
                .addClass('cloned')
                .insertAfter($origTable);
        }
    });
});

