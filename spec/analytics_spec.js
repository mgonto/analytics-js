describe("Analytics", function(){

  var mockProvider = {
    name: "Mock Provider",
    handler: function(event) {},
    buildHandler: function(element) {
      return mockProvider.handler;
    }
  }
    
  it("should bind all analytics provider on init", function(){
    spyOn(mockProvider, "buildHandler").andCallThrough();
    spyOn(mockProvider, "handler").andCallThrough();
    loadFixtures("base_analytics_fixture.html");
    Analytics.clearAnalyticsProvider();
    Analytics.addAnalyticsProvider(mockProvider);
    Analytics.init();

    var dataValue, element;

    element = $("input");
    element.click();
    expect($(mockProvider.handler.mostRecentCall.args[0].target)).toHaveAttr("data-value", "button");

    element = $("li[data-value=item2]")
    element.click();
    expect($(mockProvider.handler.mostRecentCall.args[0].target)).toHaveAttr("data-value", "item2");
  });

  it("should remove the registered provider", function() {
    spyOn(mockProvider, "handler").andCallThrough();
    loadFixtures("base_analytics_fixture.html");
    Analytics.clearAnalyticsProvider();
    Analytics.addAnalyticsProvider(mockProvider);
    Analytics.init();

    Analytics.removeAnalyticsProvider(mockProvider);
    $("input").click();
    expect(mockProvider.handler).not.toHaveBeenCalled();
  });

  it("should bind dinamically added element after calling parse with a selector", function(){
    spyOn(mockProvider, "buildHandler").andCallThrough();
    spyOn(mockProvider, "handler").andCallThrough();
    loadFixtures("base_analytics_fixture.html");
    Analytics.clearAnalyticsProvider();
    Analytics.addAnalyticsProvider(mockProvider);
    Analytics.init();

    $(".container").append('<a class="dinamic" href="#" data-metric-method="test" data-metric-event="click"></a>');
    Analytics.parse(".container");

    $(".dinamic").click();
    expect(mockProvider.handler).toHaveBeenCalled();
  });

  it("should bind dinamically added element after calling parse with DOM element", function(){
    spyOn(mockProvider, "buildHandler").andCallThrough();
    spyOn(mockProvider, "handler").andCallThrough();
    loadFixtures("base_analytics_fixture.html");
    Analytics.clearAnalyticsProvider();
    Analytics.addAnalyticsProvider(mockProvider);
    Analytics.init();

    var container = $(".container");
    container.append('<a class="dinamic" href="#" data-metric-method="test" data-metric-event="click"></a>');
    Analytics.parse(container);

    $(".dinamic").click();
    expect(mockProvider.handler).toHaveBeenCalled();
  });


});

describe("Analytics::Provider", function() {

  var _aq = {
    push: function(data){}
  };
  var FakeProvider = function(){};
  FakeProvider.prototype = $.extend({}, Analytics.Provider.prototype, {
    name: "Fake Provider",

    shortName: "FP",

    getAnalyticsObject: function() {
      return _aq;
    },

    methodAttribute: "data-metric-method",

    parseTestMethod: function() {
      return this.pushHandler(["test", "param"]);
    }

  });

  var provider = new FakeProvider();

  it("should be able to parse a DOM 'text' extractor", function() {
    var result = provider.parseDOMExtractor(".testClass div text");
    expect(result.extractor).toBe("text");
    expect(result.selector).toBe(".testClass div");
  });

  it("should be able to parse a DOM 'attr' extractor", function() {
    var result = provider.parseDOMExtractor(".testClass div attr(data-value)");
    expect(result.extractor).toBe("attr");
    expect(result.attribute).toBe("data-value");
    expect(result.selector).toBe(".testClass div");
  });

  it("should be able to parse a global DOM extractor", function() {
    var result = provider.parseDOMExtractor("! .testClass div attr(data-value)");
    expect(result.extractor).toBe("attr");
    expect(result.attribute).toBe("data-value");
    expect(result.selector).toBe(".testClass div");
    expect(result.global).toBeTruthy();
  });

  it("should return null if the extractor is not valid", function() {
    var result = provider.parseDOMExtractor(".testClass div invalid");
    expect(result).toBeNull();
  });

  it("should be able to extract a literal string", function() {
    var result = provider.extractValue("'foo bar'");
    expect(result).toBe("foo bar");
  });

  it("should be able to extract an attribute value from an DOM element", function() {
    var element = $('<div><span data-value="foo bar"></span></div>');
    var result = provider.extractValue("span attr(data-value)", element);
    expect(result).toBe("foo bar");
  });

  it("should be able to extract a text value from an DOM element", function() {
    var element = $('<div><span>foo bar</span></div>');
    var result = provider.extractValue("span text", element);
    expect(result).toBe("foo bar");
  });

  it("should be able to extract a text value from a global DOM element", function() {
    loadFixtures("base_analytics_fixture.html");
    var element = $('<div></div>');
    var result = provider.extractValue("! .testClass text", element);
    expect(result).toBe("foo bar");
  });

  it("should parse condition strings with 'attr' method using 'equals' operator", function() {
    var condition = provider.parseCondition("attr(class equals active)");
    expect(condition.method).toBe("attr");
    expect(condition.operands[0]).toBe("class");
    expect(condition.operands[1]).toBe("active");
    expect(condition.operator).toBe("equals");
  });

  it("should parse condition strings with 'attr' method using 'contains' operator", function() {
    var condition = provider.parseCondition("attr(class contains active)");
    expect(condition.method).toBe("attr");
    expect(condition.operands[0]).toBe("class");
    expect(condition.operands[1]).toBe("active");
    expect(condition.operator).toBe("contains");
  });

  it("should return 'true' with truthy condition strings on eventShouldBePushed " +
     "using 'attr' method and 'contains' operator" , function() {
    var element = $('<span class="active cool">text</span>');
    var condition = provider.eventShouldBePushed(provider.parseCondition("attr(class contains active)"), element);
    expect(condition).toBeTruthy();
  });

  it("should return 'true' with truthy condition strings on eventShouldBePushed " +
     "using 'attr' method and 'equals' operator" , function() {
    var element = $('<span class="active">text</span>');
    var condition = provider.eventShouldBePushed(provider.parseCondition("attr(class equals active)"), element);
    expect(condition).toBeTruthy();
  });

  it("should return 'false' with falsy condition strings on eventShouldBePushed " +
     "using 'attr' method and 'equals' operator" , function() {
    var element = $('<span class="active">text</span>');
    var condition = provider.eventShouldBePushed(provider.parseCondition("attr(class equals deactive)"), element);
    expect(condition).toBeFalsy();
  });

  it("should return 'false' on eventShouldBePushed using an invalid method" , function() {
    var element = $('<span class="active">text</span>');
    var condition = provider.eventShouldBePushed(provider.parseCondition("foo(class equals deactive)"), element);
    expect(condition).toBeFalsy();
  });

  it("should return 'false' on eventShouldBePushed using an invalid operator" , function() {
    var element = $('<span class="active">text</span>');
    var condition = provider.eventShouldBePushed(provider.parseCondition("attr(class foo deactive)"), element);
    expect(condition).toBeFalsy();
  });

  it("should not push an event when the condition is not satisfied", function() {
    loadFixtures("base_analytics_fixture.html");
    spyOn(_aq, "push").andCallThrough();
    
    Analytics.clearAnalyticsProvider();
    Analytics.addAnalyticsProvider(provider);
    Analytics.init();

    var element = $("#withCondition");
    element.click();
    expect(_aq.push).not.toHaveBeenCalled();
  });

  it("should push an event when the condition is satisfied", function() {
    loadFixtures("base_analytics_fixture.html");
    spyOn(_aq, "push").andCallThrough();

    Analytics.clearAnalyticsProvider();
    Analytics.addAnalyticsProvider(provider);
    Analytics.init();

    var element = $("#withCondition");
    element.find(".insideClass").addClass("active");
    element.click();
    expect(_aq.push).toHaveBeenCalledWith(["test", "param"]);
  });

  it("should push through the Analytics object", function() {
    spyOn(_aq, "push").andCallThrough();

    Analytics.clearAnalyticsProvider();
    Analytics.addAnalyticsProvider(provider);
    Analytics.init();

    Analytics.push("FP", ["test", "param"]);
    expect(_aq.push).toHaveBeenCalledWith(["test", "param"]);
  });    

});