Analytics = {

  Attributes: {
    EVENT: "data-metric-event",
    CONDITION: "data-metric-condition"
  },

  /**
   * If true loggin message will be displayed
   * in the browser's console. 
   */
  debug: false,

  /**
   * If false the events will not be pushed
   * to the analytics sites. 
   */
  enabled: true,
  
  /**
   * Adds a new analytics provider.
   * 
   * @param options An object value that must define
   *    name: String - The provider's name

   *    buildHandler: function(element) -  A function that receives a jQuery DOM element to be parsed
   *    and that returns a function that will be executed as the event handler. If the function returns
   *    false, null or undefined the handler will not be attached.
   */
  addAnalyticsProvider: function(options) {
    if (this.debug) {
      console.info("Analytics::addAnalyticsProvider::Adding provider -> ", options);
    }
    options.bindings = [];
    this._providers[options.shortName] = options;
  },

  /**
   * Removes the analytics provider and its bindings.
   * 
   * @param provider The short name of the provider or the 
   * provider itself to be removed. 
   */
  removeAnalyticsProvider: function(provider) {
    var providerName = (typeof provider === "string") ? provider : provider.shortName;
    if (this.debug) {
      console.info("Analytics::removeAnalyticsProvider::Removing provider -> ", providerName);
    }
    this._unbind(providerName);
    delete this._providers[providerName];
  },

  /**
   * Clears all the analytics providers and
   * removes all binded handlers.
   */
  clearAnalyticsProvider: function() {
    if (this.debug) {
      console.info("Analytics::clearAnalyticsProvider::Clearing all providers");
    }
    this._providers = {};
    this._unbind();
  },

  /**
   * Intializes the module and binds all the analytics
   * handlers.
   */
  init: function(options) {
    options = options || {};
    this.debug = (typeof options.debug !== "undefined") ? options.debug : true;
    this.enabled = (typeof options.enabled !== "undefined") ? options.enabled : true;
    this.parse();
  },

  /**
   * Parses data metric and data provider's specific attributes 
   * and registers event handlers to push data against the registered
   * analytics providers.
   * 
   * This method SHOULD be called everytime a new DOM node is added
   * to the document. The new DOM node SHOULD be the root element parameter.
   * If not old event handler will be re-registered.
   * 
   * @param rootElement [Optional] The root DOM element or a selector
   * that points to the root DOM element from which data metric attributes
   * will be parsed.
   */
  parse: function(rootElement) {
    var elements;
    if (rootElement) {
      elements = $(rootElement).find("[" + Analytics.Attributes.EVENT + "]");
    } else {
      elements = $("[" + Analytics.Attributes.EVENT + "]");
    }

    $.each(elements, $.proxy(function(i, element){
      element = $(element);
      var metricEvent = element.attr(Analytics.Attributes.EVENT);
      var splitted = metricEvent.split(" ");
      var options = {
        element: element,
        eventType: metricEvent,
        condition: element.attr(Analytics.Attributes.CONDITION)
      }
      if (splitted.length > 1) {
        options.eventType = splitted.pop();
        options.selector = splitted.pop();
      }
      this._bind(options);
    }, this));
    if (Analytics.debug) {
      var providersNames = [];
      for (var p in this._providers) {
        providersNames.push(p);
      }
      console.log("Analytics::init::Analytics has been initialized with providers " + providersNames);
    }
  },

  /**
   * Pushes data using the given provider.
   * 
   * @param providerShortName The short name of the provider
   * to be used.
   * @param data The data to be pushed 
   */
  push: function(providerShortName, data) {
    var provider = this._providers[providerShortName];
    if (!provider) {
      if (Analytics.debug) {
        console.error("Analytics::push::Provider "
         + providerShortName + " is not registered");
      }
      return;
    }

    provider.push(data);
  },

  // private

  _providers: {},

  /**
   * Unbinds analytics bindings for all provider if no
   * providerName is given or just for the given providerName
   * 
   * @param providerName [Optional] if a provider name is giving
   * the analytics bindings are unbounb just the given provider.
   */
  _unbind: function(providerName) {
    var providers = this._providers;
    if (providerName) {
      var provider = this._providers[providerName];
      if (!provider) {
        return;
      }
       providers = [provider];
    }
    $.each(providers, function(i, provider){
      $.each(provider.bindings, function(j, binding){
        if (binding.selector) {
          binding.element.undelegate(binding.selector, binding.eventType, binding.handler);
        } else {
          binding.element.unbind(binding.eventType, binding.handler);
        }
      });
    });
  },

  /**
   * Binds the analytics handler to the given
   * element for the given event. If a selector
   * is given instead of binding the event handler
   * to the element, jQuery delegate is used.
   * 
   * @param options An object with the following keys 
   * 
   *  element - A jQuery DOM element to which
   * the analytics handlers will be bound.
   * 
   *  eventType - The event name for which the
   * analytics handlers will be bound.
   * 
   *  selector - [Optional] A selector to filter the elements 
   * that trigger the event. This is the selector that will
   * be used in the jQuery delegate function.
   * 
   * condition - [Optional] A condition string.
   *  
   */
  _bind: function(options) {
    if (this.debug) {
      console.info("Analytics::_bind::Binding analytics handler for element -> ", 
        options.element, " eventType -> " + options.eventType + " selector -> " + options.selector);
    } 
    $.each(this._providers, function(key, value){
      var handler = value.buildHandler(options.element, options.condition);
      if (!handler) {
        return;
      }
      if (options.selector) {
        options.element.delegate(options.selector, options.eventType, handler);
      } else {
        options.element.bind(options.eventType, handler);
      }

      // saves bindig for later removal
      value.bindings.push({
        element: options.element,
        eventType: options.eventType,
        handler: handler,
        selector: options.selector
      });
    });
  }  
};

/**
 * Base analytics provider abstract class
 */
Analytics.Provider = function() {};
Analytics.Provider.prototype = {

    _analyticsObject: {
      push: function() {
        console.warn("Analytics object not defined!");
      }
    },

    /**
     * Parses the attributes of the element
     * and creates a function that performs a 
     * push to the 'analyticsObject' object depending on 
     * the 'methodAttribute'.
     * 
     * This method dispatch the parsing logic to
     * a method called 'parseXXXXMethod' where
     * 'XXXX' is the actual value of the HTML attribute
     * pointed by the 'methodAttribute' variable.
     * 
     * For example if the 'methodAttribute' equals to 
     * 'data-kmq-method' and in the element object
     * the value of this attribute is 'record'. This
     * method will call 'this.parseRecordMethod(element)' 
     * 
     * @param element a jQuery DOM element.
     * 
     * @param condition [Optional] A condition string.
     * 
     * @return a function that pushes a method call 
     * to the 'analyticsObject' object or null
     * if the element is not valid.
     * 
     * @see Analytics::Provider#parseCondition
     */
    buildHandler: function(element, condition) {
      if (!element.attr(this.methodAttribute)) {
        return null;
      }

      var parsedCondition = (condition) ? this.parseCondition(condition) : undefined;
      var method = element.attr(this.methodAttribute);
      var parser = this["parse" + method[0].toLocaleUpperCase() + method.slice(1) + "Method"];
      if (!parser) {
        this.warn("buildHandler::A handler cannot be built for element ->", element)
        return null;
      }
      var handler = parser.call(this, element);

      // Wraps the handler in order to check
      // if the condition is satisfied
      return $.proxy(function(event){
        if (!parsedCondition || this.eventShouldBePushed(parsedCondition, $(event.currentTarget))) {
          handler(event);
        } else {
          this.info("event -> ", event, 
            " will not be pushed for element -> ", element, 
            " due to condition -> ", parsedCondition);
        }
      }, this);
    },

    log: function(level, args) {
      var message = args[0];
      var consoleArgs = [];
      for (var i = 1, length = args.length; i < length; ++i) {
        consoleArgs.push(args[i]);
      }
      if (Analytics.debug) {
        // This is done this way to make it compatible with ie8
        var logArguments = ["Analytics::" + this.shortName + "::" + args[0]].concat(consoleArgs);
        Function.prototype.apply.call(console[level], console, logArguments);
      }
    },

    info: function() {
      this.log("info", arguments);
    },

    error: function() {
      this.log("error", arguments);
    },

    warn: function() {
      this.log("warn", arguments);
    },    

    /**
     * Creates a new event handler function
     * that when is called performs a push
     * call to the 'analyticsObject' object with the given 
     * data.
     * 
     * @param data An array of data that will be 
     * pushed to the 'analyticsObject' object. It also supports
     * a function that receives an DOM event and 
     * returns the array of data to be pushed.
     * 
     * @return A handler function that pushes data
     * to the 'analyticsObject' object  
     */
    pushHandler: function(data) {
      return $.proxy(function(event) {
        var theData = (typeof data === "function") ? data(event) : data;
        this.push(theData);
      }, this);
    },

    /**
     * Performs the push against the 'analyticsObject'
     * 
     * @param data The data to be pushed.
     */
    push: function(data) {
      this.info("pushing -> ", data);
      if (Analytics.enabled) {
        var analyticsObject = this.getAnalyticsObject();
        analyticsObject = analyticsObject || this._analyticsObject;
        analyticsObject.push(data);
      } else {
        this.warn("Push is not enabled!");
      }
    },

    /**
     * Obtains the provider's analytics object. This
     * method MUST be overwritten by implementors.
     * 
     * @return The analytics object or somethings
     * that evaluates to false if the object is not available.
     */
    getAnalyticsObject: function() {
      // Abstract Method
      // Override me!!!
      return null;
    },

    /**
     * Parses a DOM extractor object from
     * the given value string.
     * 
     * A DOM extractor string is compoused 
     * by a 'selector' and a 'extractor'.
     * The 'selector' is a valid CSS selector. If it
     * starts with the character '!' the selector must
     * be applied to the hole element (global). 
     * If not the selector must be applied to the element
     * that triggered the event. 
     * The 'extractor' can be:
     *  
     *  - text: This tell the user that the text
     *  element from the DOM element pointed by the
     *  given 'selector' must be used as the extracted
     *  value.
     * 
     *  - attr(ATTR_NAME): This tell the user that 
     *  the value of the attribute 'ATTR_NAME' from 
     *  the DOM element pointed by the given 'selector' 
     *  must be used as the extracted value. 
     * 
     *  For example: 
     *    
     *    parseDOMExtractor(".myClass div attr(data-value)")
     *    
     *    will return 
     * 
     *    {
     *      extractor: "attr",
     *      attribute: "data-value",
     *      selector: ".myClass div"
     *    }
     * 
     * @param value THe DOM extractor string to be parsed.
     * 
     * @return null if the extractor is not valid. Otherwise,
     * an object with the keys 'selector' and 'extractor'. If
     * the 'extractor' requires an argument (like attr), an
     * 'attribute' key is defined. If the selector must be applied
     * globally it adds the 'global' key with the value 'true'
     * is added.
     * 
     */
    parseDOMExtractor: function(value) {
      var words = value.split(" ");
      var extractor = words[words.length - 1];

      // Matches string of the form
      // something(data)
      // something
      // Capture 1 has the extractor.
      // Capture 3 has the attribute if defined.
      var match = extractor.match(/([a-z]*)(\((.*)\))?/);
      
      extractor = match[1];
      var result = {
        selector: value.substring(0, value.search(extractor) - 1).trim(),
        extractor: extractor
      };

      if (result.selector.search("!") === 0) {
        result.global = true;
        result.selector = result.selector.slice(1).trim();
      }

      switch (extractor) {
        case "attr":
          result.attribute = match[3];
          break;
        case "text":
          break;
        default:
          this.warn("parseDOMExtractor::Unsuported extractor " + extractor + " in " + value);
          result = null;
      }
      return result;
    },

    /**
     * Extracts a value string from the given data
     * using the given element if necesary.
     * 
     * Data can be a literal string. It must
     * be surrounded by ' characters. In which
     * case the string surrounded by '' will
     * be returned.
     * 
     * If data is not a literal string it will
     * be used as a DOM extractor string and it will
     * be parsed using  Analytics::Provider#_parseDOMExtractor()
     * 
     * For example:
     *  extractValue("'hello world'") => "hello world"
     * 
     *  var element = $(
     *    "<div>"
     *      + "<div class=\"myClass\">"
     *      +   "<div data-value=\"value\"></div>
     *      + "</div>"
     *    "</div>"
     *  );
     *  extractValue(".myClass div attr(data-value)", element) => "value"
     *  
     * 
     * @param data The data string used to extract a value. It
     * can be a literal string or a DOM extractor string.
     * 
     * @param element [Optional] If data is a DOM extractor string
     * the value will be extracted from the jQuery DOM element.
     * 
     * @return The extracted string value.
     * 
     * @see Analytics::Provider#parseDOMExtractor
     */
    extractValue: function(data, element) {
      var value;
      var match = data.match(/'(.*)'/);
      if (match) {
        value = match[1];
      } else {
        var DOMExtractor = this.parseDOMExtractor(data);
        if (DOMExtractor.selector) {
          if (DOMExtractor.global) {
            element = $(DOMExtractor.selector);
          } else {
            element = element.find(DOMExtractor.selector);
          }
        }

        // This must be done this way
        // DO NOT attempt to do one call with all the arguments
        // because there are some method (like text()) that when
        // you pass them an argument the behave like a setter.
        if (DOMExtractor.attribute) {
          value = element[DOMExtractor.extractor].call(element, DOMExtractor.attribute);
        } else {
          value = element[DOMExtractor.extractor].call(element);
        }
      }
      return value;
    },

    /**
     * Parses string of the form
     * [!] [selector] method(operand operator operand)
     * 
     * Example:
     *  attr(class eq active)
     *  attr(class contains active)
     *  div.myClass attr(class contains active)
     *  ! div.myClass attr(class contains active)
     * 
     * @param condition The string to be parsed.
     * @return An object of the form
     *  {
     *    method: string,
     *    operands: array,
     *    operator: string,
     *    global: boolean [Optional],
     *    selector: string [Optional]
     *  }
     */
    parseCondition: function(condition) {
      var conditionRegexp = /(!)?\s*(.*\s)?\s*([^(]*)\(([^\s]*)\s+([^\s]*)\s+([^)]*)\)/;
      var match = condition.match(conditionRegexp);
      var result = null;
      if (match) {
        result = {
          method: match[3],
          operands: [match[4], match[6]],
          operator: match[5],
          global: typeof match[1] !== "undefined",
          selector: match[2]
        }
      }
      return result;
    },

    /**
     * Checks if the condition applies to the given element.
     * 
     * @param condition An object that is the result of the
     * Analytics::Provider#parseCondition method. 
     * @return true if the condition applies. false otherwhise.
     */
    eventShouldBePushed: function(condition, element) {
      if (!condition) {
        return false;
      }
      var method = element[condition.method];
      if (!method) {
        this.error("eventShouldBePushed::Method " + condition.method
         + "is not supported on element -> ", element);
        return false;
      }
      var result = false;
      if (condition.selector) {
        if (condition.global) {
          element = $(condition.selector);
        } else {
          element = element.find(condition.selector);
        }
      }
      var value = method.call(element, condition.operands[0]);
      if (value) {
        switch (condition.operator) {
          case "equals":
            result = value === condition.operands[1];
            break;
          case "!equals":
            result = value !== condition.operands[1];
            break;
          case "contains":
            result = value.search(condition.operands[1]) > -1;
            break;
          case "!contains":
            result = value.search(condition.operands[1]) < 0;
            break;
          default:
            this.error("eventShouldBePushed::Unsuported operator " + condition.operator);
            break;
        }
      } else {
        this.error("eventShouldBePushed::Null value. Condition -> ", condition, " element -> ", element);
      }
      return result;
    }

};