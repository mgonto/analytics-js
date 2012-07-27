(function(){

  var Attributes = {
    METHOD : "data-kmq-method",

    NAME: "data-kmq-name",
    PROPERTIES: "data-kmq-properties",
  };

  Analytics.KissMetrics = function() {};
  Analytics.KissMetrics.prototype = $.extend({}, Analytics.Provider.prototype, {

    name: "KissMetrics",

    shortName: "KM",

    methodAttribute: Attributes.METHOD,

    getAnalyticsObject: function() {
      return (typeof _kmq !== "undefined") ? _kmq : null;
    },

    /**
     * Parses the attribute properties.
     * 
     * Properties is a an string of properites
     * separated by ','.
     * 
     * A property is defined as
     *  - key => value
     * the value can be a literal string (it must be surrounded by '')
     * or it can be a DOM extractor string.
     * 
     * Example
     *  
     *  var element = $('<div><span data-value="hello"></span></div>');
     *  parsePropertiesAttribute("prop1=> 'foo bar', prop2=> span attr(data-value)", element);
     *  
     *  returns
     * 
     *  {
     *    prop1: "foo bar",
     *    prop2: "hello"  
     *  }
     *  
     *  @param properties A string of properties to be parsed.
     *  
     *  @param element The element from with property values may be
     *  extracted.
     * 
     *  @return The parsed object. 
     */
    parsePropertiesAttribute: function(properties, element) {
      var splitted = properties.split(",");
      var result = {};
      $.each(splitted, $.proxy(function(i, property) {
        var propertySplitted = property.split("=>");
        var key = propertySplitted[0].trim();
        var value = this.extractValue(propertySplitted[1].trim(), element);
        result[key] = value;
      }, this));
      return result;
    },

    /**
     * Parses the attributes of the element
     * of object seeking for the arguments required
     * by the 'record' method and builds a function
     * that performs a 'record' push to the _kmq
     * object with the attributes parsed from the given
     * element.
     * 
     * @param element a jQuery DOM element.
     * 
     * @return a function that pushes a 'record'
     * method to the _kmq object.
     */
    parseRecordMethod: function(element) {
      var name = element.attr(Attributes.NAME);
      var properties = element.attr(Attributes.PROPERTIES);
      if (!name) {
        this.warn("parseEventMethod::Attribute " + Attributes.NAME + " is required");
        return null;
      }

      return this.pushHandler($.proxy(function(event){
        var target = $(event.currentTarget);
        var parsedProperties;
        if (properties) {
          parsedProperties = this.parsePropertiesAttribute(properties, target);
        }
        return ["record", name, parsedProperties];
      }, this));
    },

    /**
     * Parses the attributes of the element
     * of object seeking for the arguments required
     * by the 'set' method and builds a function
     * that performs a 'set' push to the _kmq
     * object with the attributes parsed from the given
     * element.
     * 
     * @param element a jQuery DOM element.
     * 
     * @return a function that pushes a 'set'
     * method to the _kmq object.
     */
    parseSetMethod: function(element) {
      var properties = element.attr(Attributes.PROPERTIES);
      return this.pushHandler($.proxy(function(event){
        var target = $(event.target);
        var parsedProperties;
        if (properties) {
          parsedProperties = this.parsePropertiesAttribute(properties, target);
        }
        return ["set", parsedProperties];
      }, this));
    }

  });
  Analytics.KissMetrics.Attributes = Attributes;

})();