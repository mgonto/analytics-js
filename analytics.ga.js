(function(){

  var Attributes = {
    METHOD : "data-gaq-method",

    CATEGORY: "data-gaq-category",
    ACTION: "data-gaq-action",
    LABEL: "data-gaq-label",
    VALUE: "data-gaq-value",
    NON_INTERACTION: "data-gaq-noninteraction",
    
    NETWORK: "data-gaq-network",
    TARGET: "data-gaq-target",
    PAGE_PATH: "data-gaq-page-path"
  };

  Analytics.GoogleAnalytics = function() {};
  Analytics.GoogleAnalytics.prototype = $.extend({}, Analytics.Provider.prototype, {

    name: "Google Analytics",

    shortName: "GA",

    methodAttribute: Attributes.METHOD,

    getAnalyticsObject: function() {
      return (typeof _gaq !== "undefined") ? _gaq : null;
    },

    /**
     * Parses the attributes of the element
     * of object seeking for the arguments required
     * by the _trackEvent method and builds a function
     * that performs a _trackEvent push to the _gaq
     * object with the attributes parsed from the given
     * element.
     * 
     * @param element a jQuery DOM element.
     * 
     * @return a function that pushes a _trackEvent
     * method to the _gaq object.
     * 
     * @see Analytics::Provider#parseCondition
     * @see Analytics::Provider#eventShouldBePushed
     */
    parseEventMethod: function(element) {
      var category = element.attr(Attributes.CATEGORY);
      var action = element.attr(Attributes.ACTION);
      var label = element.attr(Attributes.LABEL);
      var value = element.attr(Attributes.VALUE);
      
      if (!category) {
        this.warn("parseEventMethod::Attribute " + Attribute.CATEGORY + " is required");
        return null;
      }
      if (!action) {
        this.warn("parseEventMethod::Attribute " + Attribute.ACTION + " is required");
        return null;
      }

      return this.pushHandler($.proxy(function(event) {
        var target = $(event.currentTarget);
        var extractedLabel = (typeof label !== "undefined") ? this.extractValue(label, target) : undefined;
        var extractedValue = (typeof value !== "undefined") ? this.extractValue(value, target) : undefined;
        return ["_trackEvent", category, action, extractedLabel, extractedValue];
      }, this));
    },

    /**
     * Parses the attributes of the element
     * of object seeking for the arguments required
     * by the _trackEvent method and builds a function
     * that performs a _trackEvent push to the _gaq
     * object with the attributes parsed from the given
     * element.
     * 
     * @param element a jQuery DOM element.
     * 
     * @return a function that pushes a _trackEvent
     * method to the _gaq object.
     */
    parseSocialMethod: function(element) {
      var network = element.attr(Attributes.NETWORK);
      var action = element.attr(Attributes.ACTION);
      var target = element.attr(Attributes.TARGET);
      var pagePath = element.attr(Attributes.PAGE_PATH);

      if (!network) {
        this.warn("parseEventMethod::Attribute " + Attribute.NETWORK + " is required");
        return null;
      }
      if (!action) {
        this.warn("parseEventMethod::Attribute " + Attribute.ACTION + " is required");
        return null;
      }

      return this.pushHandler(["_trackSocial", network, action, target, pagePath]);
    }

  });
  Analytics.GoogleAnalytics.Attributes = Attributes;

})();