define([], function() {
    /* This is a module for assertions
     *
     * Example: throwing an AssertionException
     *  try {
     *      throw new Assert.AssertException();
     *  }
     *  catch (e) {
     *    if (e instanceof Assert.AssertException) {
     *      console.log('asserted');
     *    }
     *  }
     *
     * Example: asserting on values
     *  Assert.assert(false, 'this will thrown an AssertionException');
     *
     */
     
    function AssertException(message) { this.message = message; }
    AssertException.prototype.toString = function () {
        return 'AssertException: ' + this.message;
    };

    function assert(exp, message) {
        if (!exp) {
            throw new AssertException(message);
        }
    }

    return {
        assert: assert,
        AssertException: AssertException
    };
});